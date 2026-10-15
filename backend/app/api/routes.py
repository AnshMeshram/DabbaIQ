"""API routes for DabbaIQ — health, dashboard, sales, inventory, recipes, plans, waste, reports, AI."""

import csv
import io
import json
import logging
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.db.connection import is_connected, check_db_health
from app.db.operations import (
    create_ingredient, get_ingredients, get_ingredient_by_id, update_ingredient, delete_ingredient,
    create_recipe, get_recipes, get_recipe_by_id, update_recipe, delete_recipe,
    create_sale, get_sales, update_sale, delete_sale,
    create_waste, get_waste,
    save_plan, confirm_plan, get_plans, get_plan_by_id,
    get_dashboard_data,
    get_report_summary,
)
from app.schemas.schemas import (
    IngredientCreate, IngredientUpdate, IngredientResponse,
    RecipeCreate, RecipeUpdate,
    SaleCreate, SaleUpdate,
    WasteCreate,
    PlanGenerateRequest,
    HealthResponse, AIStatusResponse,
    MealPeriod,
    SupplierSearchRequest, SupplierSearchResponse,
    PriceSnapshotSaveRequest, WorkflowTriggerRequest,
)
from app.services.ai_provider import ai_provider, AIProviderError
from app.services.forecast import generate_prep_plan
from app.services.elevenlabs_provider import elevenlabs_provider, ElevenLabsError
from app.services.backboard_provider import backboard_provider
from app.services.tinker_training import tinker_provider
from app.services.serpapi_client import serpapi_client
from app.db.tiger_data import (
    save_price_snapshot,
    get_historical_prices,
    get_price_analytics_summary,
    check_tiger_health,
)
from app.temporal.client import (
    trigger_planning_workflow,
    get_workflow_result,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Health & Integrations ───────────────────────────────────────────────────

@router.get("/health")
async def health_check():
    """Live system health check with verified connectivity without leaking secrets."""
    db_health = await check_db_health()
    tiger_health = await check_tiger_health()
    ai_stat = await ai_provider.check_status()

    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "app_env": settings.APP_ENV,
        "db_connected": db_health["connected"],
        "db_message": db_health["message"],
        "database": db_health["database"],
        "latency_ms": db_health["latency_ms"],
        "ai_available": ai_stat["available"],
        "ai_model": ai_stat["model"],
        "tiger_data": {
            "configured": tiger_health["configured"],
            "connected": tiger_health["connected"],
            "latency_ms": tiger_health["latency_ms"],
        },
        "serpapi_configured": serpapi_client.is_configured,
        "temporal_configured": settings.temporal_available,
        "partners": {
            "elevenlabs": elevenlabs_provider.is_configured,
            "backboard": backboard_provider.is_configured,
            "tinker": tinker_provider.is_configured,
        },
    }


@router.get("/integrations/status")
async def integrations_status():
    """Return status of all core and optional integrations."""
    db_health = await check_db_health()
    tiger_health = await check_tiger_health()
    ai_stat = await ai_provider.check_status()

    return {
        "database": {
            "provider": "MongoDB Atlas",
            "connected": db_health["connected"],
            "status": db_health["status"],
            "message": db_health["message"],
            "database_name": db_health["database"],
            "latency_ms": db_health["latency_ms"],
        },
        "tiger_data": {
            "provider": "Tiger Data (TimescaleDB / PostgreSQL)",
            "configured": tiger_health["configured"],
            "connected": tiger_health["connected"],
            "status": tiger_health["status"],
            "message": tiger_health["message"],
            "latency_ms": tiger_health["latency_ms"],
        },
        "serpapi": {
            "provider": "SerpAPI (Google Shopping & Search)",
            "configured": serpapi_client.is_configured,
            "location": settings.SERPAPI_LOCATION or "India",
            "gl": settings.SERPAPI_GL,
            "hl": settings.SERPAPI_HL,
        },
        "temporal": {
            "provider": "Temporal Workflow Orchestration",
            "configured": settings.temporal_available,
            "address": settings.TEMPORAL_ADDRESS,
            "task_queue": settings.TEMPORAL_TASK_QUEUE,
        },
        "ai": {
            "provider": "Gemma (via Ollama)",
            "available": ai_stat["available"],
            "model": ai_stat["model"],
            "model_loaded": ai_stat.get("model_loaded", False),
            "base_url": ai_stat["base_url"],
            "message": ai_stat["message"],
        },
        "elevenlabs": elevenlabs_provider.get_status(),
        "backboard": backboard_provider.get_status(),
        "tinker": tinker_provider.get_status(),
    }


@router.get("/ai/status")
async def ai_status():
    status = await ai_provider.check_status()
    return status


# ─── Dashboard ───────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_dashboard(
    date_param: Optional[str] = Query(None, alias="date")
):
    try:
        target = date.fromisoformat(date_param) if date_param else date.today()
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD.")

    data = await get_dashboard_data(target)
    return data


# ─── Inventory ───────────────────────────────────────────────────────────────

@router.get("/inventory")
async def list_inventory(
    category: Optional[str] = None,
    low_stock: bool = False,
    expiring_days: Optional[int] = None,
):
    items = await get_ingredients(
        category=category,
        low_stock_only=low_stock,
        expiring_within_days=expiring_days,
    )
    return {"items": items, "count": len(items)}


@router.post("/inventory", status_code=201)
async def add_ingredient(data: IngredientCreate):
    if not is_connected():
        raise HTTPException(503, "Database not connected. Cannot save data.")
    try:
        result = await create_ingredient(data)
        return result
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise HTTPException(409, f"Ingredient '{data.name}' already exists.")
        raise HTTPException(500, str(e))


@router.patch("/inventory/{ingredient_id}")
async def patch_ingredient(ingredient_id: str, data: IngredientUpdate):
    if not is_connected():
        raise HTTPException(503, "Database not connected.")
    existing = await get_ingredient_by_id(ingredient_id)
    if not existing:
        raise HTTPException(404, "Ingredient not found")
    result = await update_ingredient(ingredient_id, data)
    return result


@router.delete("/inventory/{ingredient_id}")
async def remove_ingredient(ingredient_id: str):
    if not is_connected():
        raise HTTPException(503, "Database not connected.")
    deleted = await delete_ingredient(ingredient_id)
    if not deleted:
        raise HTTPException(404, "Ingredient not found")
    return {"message": "Ingredient deleted"}


# ─── Recipes ─────────────────────────────────────────────────────────────────

@router.get("/recipes")
async def list_recipes(meal_category: Optional[str] = None):
    items = await get_recipes(meal_category=meal_category)
    return {"items": items, "count": len(items)}


@router.post("/recipes", status_code=201)
async def add_recipe(data: RecipeCreate):
    if not is_connected():
        raise HTTPException(503, "Database not connected.")
    try:
        result = await create_recipe(data)
        return result
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise HTTPException(409, f"Recipe '{data.name}' already exists.")
        raise HTTPException(500, str(e))


@router.get("/recipes/{recipe_id}")
async def get_single_recipe(recipe_id: str):
    recipe = await get_recipe_by_id(recipe_id)
    if not recipe:
        raise HTTPException(404, "Recipe not found")
    return recipe


@router.patch("/recipes/{recipe_id}")
async def patch_recipe(recipe_id: str, data: RecipeUpdate):
    if not is_connected():
        raise HTTPException(503, "Database not connected.")
    existing = await get_recipe_by_id(recipe_id)
    if not existing:
        raise HTTPException(404, "Recipe not found")
    result = await update_recipe(recipe_id, data)
    return result


@router.delete("/recipes/{recipe_id}")
async def remove_recipe(recipe_id: str):
    if not is_connected():
        raise HTTPException(503, "Database not connected.")
    deleted = await delete_recipe(recipe_id)
    if not deleted:
        raise HTTPException(404, "Recipe not found")
    return {"message": "Recipe deleted"}


# ─── Sales ───────────────────────────────────────────────────────────────────

@router.get("/sales")
async def list_sales(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    meal_period: Optional[str] = None,
    recipe_id: Optional[str] = None,
):
    try:
        sd = date.fromisoformat(start_date) if start_date else None
        ed = date.fromisoformat(end_date) if end_date else None
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD.")

    items = await get_sales(
        start_date=sd, end_date=ed,
        meal_period=meal_period, recipe_id=recipe_id,
    )
    return {"items": items, "count": len(items)}


@router.post("/sales", status_code=201)
async def add_sale(data: SaleCreate):
    if not is_connected():
        raise HTTPException(503, "Database not connected.")
    # Verify recipe exists
    recipe = await get_recipe_by_id(data.recipe_id)
    if not recipe:
        raise HTTPException(404, f"Recipe {data.recipe_id} not found.")
    result = await create_sale(data)
    return result


@router.patch("/sales/{sale_id}")
async def patch_sale(sale_id: str, data: SaleUpdate):
    if not is_connected():
        raise HTTPException(503, "Database not connected.")
    result = await update_sale(sale_id, data)
    if not result:
        raise HTTPException(404, "Sale not found")
    return result


@router.delete("/sales/{sale_id}")
async def remove_sale(sale_id: str):
    if not is_connected():
        raise HTTPException(503, "Database not connected.")
    deleted = await delete_sale(sale_id)
    if not deleted:
        raise HTTPException(404, "Sale not found")
    return {"message": "Sale deleted"}


@router.post("/sales/import")
async def import_sales_csv(file: UploadFile = File(...)):
    """Import sales from CSV. Template: date,meal_period,recipe_id,portions_sold,revenue"""
    if not is_connected():
        raise HTTPException(503, "Database not connected.")

    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "File must be a CSV")

    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(400, "File must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(text))
    required_cols = {"date", "meal_period", "recipe_id", "portions_sold"}
    if not required_cols.issubset(set(reader.fieldnames or [])):
        raise HTTPException(
            400,
            f"CSV must have columns: {', '.join(sorted(required_cols))}. "
            f"Found: {', '.join(reader.fieldnames or [])}",
        )

    results = {"imported": 0, "errors": []}
    for i, row in enumerate(reader, start=2):
        try:
            sale_data = SaleCreate(
                date=date.fromisoformat(row["date"].strip()),
                meal_period=MealPeriod(row["meal_period"].strip().lower()),
                recipe_id=row["recipe_id"].strip(),
                portions_sold=int(row["portions_sold"].strip()),
                revenue=float(row.get("revenue", 0) or 0),
            )
            recipe = await get_recipe_by_id(sale_data.recipe_id)
            if not recipe:
                results["errors"].append(
                    {"row": i, "error": f"Recipe {sale_data.recipe_id} not found"}
                )
                continue
            await create_sale(sale_data)
            results["imported"] += 1
        except Exception as e:
            results["errors"].append({"row": i, "error": str(e)})

    if results["errors"] and results["imported"] == 0:
        raise HTTPException(400, detail=results)

    return results


# ─── Plans ───────────────────────────────────────────────────────────────────

@router.post("/plans/generate")
async def generate_plan(data: PlanGenerateRequest):
    if not is_connected():
        raise HTTPException(503, "Database not connected.")

    if not data.recipe_ids:
        # Use all recipes if none specified
        all_recipes = await get_recipes()
        data.recipe_ids = [r["id"] for r in all_recipes]

    if not data.recipe_ids:
        raise HTTPException(400, "No recipes available. Add recipes first.")

    # Generate deterministic plan
    plan = await generate_prep_plan(
        target_date=data.target_date,
        meal_period=data.meal_period,
        recipe_ids=data.recipe_ids,
        confirmed_orders=data.confirmed_orders,
        safety_buffer=data.safety_buffer,
        kitchen_notes=data.kitchen_notes,
    )

    # Try AI enhancement (non-blocking)
    try:
        recipes = [await get_recipe_by_id(rid) for rid in data.recipe_ids]
        recipes = [r for r in recipes if r]
        inventory = await get_ingredients()

        suggestion = await ai_provider.suggest_menu(
            recipes=recipes,
            inventory=inventory,
            forecast=plan["forecasts"],
            kitchen_notes=data.kitchen_notes or "",
        )

        # Validate recommended recipe IDs exist
        valid_ids = {r["id"] for r in recipes}
        validated_recs = [
            rid for rid in suggestion.recommended_recipes
            if rid in valid_ids
        ]
        suggestion.recommended_recipes = validated_recs

        plan["ai_recommendation"] = suggestion.explanation
        plan["ai_menu_suggestion"] = suggestion.menu_description
        if suggestion.notes_interpretation:
            plan["ai_notes_interpretation"] = suggestion.notes_interpretation

    except AIProviderError as e:
        logger.warning("AI enhancement unavailable: %s", e)
        plan["ai_recommendation"] = None
        plan["ai_error"] = str(e)
    except Exception as e:
        logger.error("Unexpected AI error: %s", e)
        plan["ai_recommendation"] = None

    # Save the draft plan
    saved = await save_plan(plan)
    return saved


@router.post("/plans/{plan_id}/confirm")
async def confirm_plan_route(plan_id: str):
    if not is_connected():
        raise HTTPException(503, "Database not connected.")
    result = await confirm_plan(plan_id)
    if not result:
        raise HTTPException(404, "Plan not found")
    return result


@router.get("/plans")
async def list_plans(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    confirmed: bool = False,
):
    try:
        sd = date.fromisoformat(start_date) if start_date else None
        ed = date.fromisoformat(end_date) if end_date else None
    except ValueError:
        raise HTTPException(400, "Invalid date format.")
    items = await get_plans(start_date=sd, end_date=ed, confirmed_only=confirmed)
    return {"items": items, "count": len(items)}


@router.get("/plans/{plan_id}")
async def get_single_plan(plan_id: str):
    plan = await get_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(404, "Plan not found")
    return plan


# ─── Waste ───────────────────────────────────────────────────────────────────

@router.post("/waste", status_code=201)
async def add_waste(data: WasteCreate):
    if not is_connected():
        raise HTTPException(503, "Database not connected.")
    recipe = await get_recipe_by_id(data.recipe_id)
    if not recipe:
        raise HTTPException(404, f"Recipe {data.recipe_id} not found.")
    result = await create_waste(data)
    return result


@router.get("/waste")
async def list_waste(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    recipe_id: Optional[str] = None,
):
    try:
        sd = date.fromisoformat(start_date) if start_date else None
        ed = date.fromisoformat(end_date) if end_date else None
    except ValueError:
        raise HTTPException(400, "Invalid date format.")
    items = await get_waste(start_date=sd, end_date=ed, recipe_id=recipe_id)
    return {"items": items, "count": len(items)}


# ─── Reports ─────────────────────────────────────────────────────────────────

@router.get("/reports/summary")
async def report_summary(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
):
    try:
        sd = date.fromisoformat(start_date)
        ed = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD.")
    if sd > ed:
        raise HTTPException(400, "start_date must be before end_date")

    summary = await get_report_summary(sd, ed)
    return summary


@router.get("/reports/export")
async def export_report(
    start_date: str = Query(...),
    end_date: str = Query(...),
    report_type: str = Query("sales", description="sales|waste|inventory"),
):
    try:
        sd = date.fromisoformat(start_date)
        ed = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(400, "Invalid date format.")

    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "sales":
        writer.writerow(["date", "meal_period", "recipe_name", "portions_sold", "revenue"])
        items = await get_sales(start_date=sd, end_date=ed)
        for s in items:
            writer.writerow([
                s.get("date"), s.get("meal_period"),
                s.get("recipe_name"), s.get("portions_sold"),
                s.get("revenue", ""),
            ])
    elif report_type == "waste":
        writer.writerow(["date", "meal_period", "recipe_name", "portions_prepared",
                         "portions_sold", "leftover", "estimated_cost", "reason"])
        items = await get_waste(start_date=sd, end_date=ed)
        for w in items:
            writer.writerow([
                w.get("date"), w.get("meal_period"), w.get("recipe_name"),
                w.get("portions_prepared"), w.get("portions_sold"),
                w.get("leftover_portions"), w.get("estimated_waste_cost"),
                w.get("reason", ""),
            ])
    elif report_type == "inventory":
        writer.writerow(["name", "category", "quantity", "unit", "cost_per_unit",
                         "reorder_level", "expiry_date"])
        items = await get_ingredients()
        for i in items:
            writer.writerow([
                i.get("name"), i.get("category"), i.get("quantity"),
                i.get("unit"), i.get("cost_per_unit"),
                i.get("reorder_level"), i.get("expiry_date", ""),
            ])
    else:
        raise HTTPException(400, "Invalid report_type. Use: sales, waste, inventory")

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=dabbaiq_{report_type}_{start_date}_{end_date}.csv"
        },
    )


# ─── AI endpoints ────────────────────────────────────────────────────────────

@router.post("/ai/parse-notes")
async def parse_kitchen_notes(body: dict):
    """Parse messy kitchen notes into structured entries for user confirmation."""
    notes = body.get("notes", "")
    if not notes or not notes.strip():
        raise HTTPException(400, "No notes text provided")

    recipes = await get_recipes()

    try:
        result = await ai_provider.parse_kitchen_notes(notes, recipes)
        return {
            "parsed": result.model_dump(),
            "requires_confirmation": True,
            "message": "Review the parsed entries below and confirm before saving.",
        }
    except AIProviderError as e:
        raise HTTPException(
            503,
            f"AI service unavailable: {str(e)}. You can still record sales manually.",
        )


@router.post("/ai/menu-description")
async def generate_menu_desc(body: dict):
    """Generate a customer-facing menu description."""
    recipe_ids = body.get("recipe_ids", [])
    language = body.get("language", "English")

    if not recipe_ids:
        raise HTTPException(400, "No recipe IDs provided")

    recipes = []
    for rid in recipe_ids:
        r = await get_recipe_by_id(rid)
        if r:
            recipes.append(r)

    if not recipes:
        raise HTTPException(404, "No valid recipes found")

    try:
        description = await ai_provider.generate_menu_description(recipes, language)
        return {"description": description, "language": language}
    except AIProviderError as e:
        raise HTTPException(503, f"AI service unavailable: {str(e)}")


# ─── Voice Kitchen Notes (ElevenLabs STT) ────────────────────────────────────

@router.post("/voice/transcribe")
async def transcribe_voice_note(file: UploadFile = File(...)):
    """Transcribe kitchen voice notes using ElevenLabs Speech-to-Text.
    The transcription is automatically parsed into candidate sales/order entries
    for explicit user review and confirmation before saving.
    """
    if not elevenlabs_provider.is_configured:
        raise HTTPException(
            503,
            detail={
                "error": "ElevenLabs integration not configured",
                "message": (
                    "Voice-to-text requires ELEVENLABS_API_KEY in backend/.env. "
                    "You can still enter kitchen notes manually."
                ),
            },
        )

    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(400, "Uploaded audio file is empty.")

    try:
        # Step 1: Transcribe audio
        result = await elevenlabs_provider.transcribe_audio(
            audio_bytes=content,
            filename=file.filename or "recording.mp3",
            content_type=file.content_type or "audio/mpeg",
        )
        transcript = result.get("transcript", "").strip()

        if not transcript:
            return {
                "transcript": "",
                "parsed": {"entries": [], "unparseable_text": "No speech detected in audio."},
                "requires_confirmation": True,
            }

        # Step 2: Grounded parsing with existing recipes
        recipes = await get_recipes()
        parsed_entries = await ai_provider.parse_kitchen_notes(transcript, recipes)

        return {
            "transcript": transcript,
            "language": result.get("language", "en"),
            "parsed": parsed_entries.model_dump(),
            "requires_confirmation": True,
            "message": "Voice note transcribed! Review and confirm parsed fields below before saving.",
        }

    except ElevenLabsError as e:
        raise HTTPException(502, f"Voice transcription error: {str(e)}")
    except Exception as e:
        logger.error("Unexpected error in voice transcription: %s", e)
        raise HTTPException(500, f"Error processing voice note: {str(e)}")


# ─── Fine-Tuning Dataset Utilities (Tinker) ──────────────────────────────────

@router.get("/training/status")
async def training_status():
    """Check Tinker fine-tuning capability status."""
    return tinker_provider.get_status()


@router.get("/training/export-dataset")
async def export_training_dataset():
    """Export instruction-tuning dataset from confirmed plans and historical sales."""
    dataset = await tinker_provider.generate_training_dataset()
    return {
        "dataset_size": len(dataset),
        "examples": dataset[:10],
        "message": f"Generated {len(dataset)} instruction-tuning examples from historical kitchen data.",
    }


# ─── Supplier Search & Market Pricing (SerpAPI) ────────────────────────────

@router.post("/supplier-search", response_model=SupplierSearchResponse)
async def search_suppliers(req: SupplierSearchRequest):
    """Search online wholesale and grocery supplier market prices via SerpAPI.
    Uses Google Shopping with Google Search fallback.
    """
    result = await serpapi_client.search_ingredient_prices(
        ingredient_name=req.ingredient_name,
        package_quantity=req.package_quantity,
        package_unit=req.package_unit,
        location=req.location,
    )
    return result


# ─── Tiger Data (TimescaleDB) Price Snapshots & Time-Series Analytics ──────

@router.post("/prices/snapshot")
async def record_price_snapshot(req: PriceSnapshotSaveRequest):
    """Record an observed supplier price snapshot into Tiger Data hypertable."""
    if not settings.tiger_data_available:
        raise HTTPException(
            503,
            "Tiger Data is not configured. Set TIGER_DATA_DATABASE_URL in backend/.env to record price snapshots."
        )

    ok = await save_price_snapshot(
        ingredient_name=req.ingredient_name,
        source_name=req.source_name,
        product_title=req.product_title,
        price_numeric=req.price_numeric,
        currency=req.currency,
        original_price_text=req.original_price_text,
        source_url=req.source_url,
        query_text=req.query_text,
        ingredient_id=req.ingredient_id,
    )
    if not ok:
        raise HTTPException(500, "Failed to persist price snapshot to Tiger Data.")
    return {
        "status": "saved",
        "ingredient": req.ingredient_name,
        "price": req.price_numeric,
        "currency": req.currency,
        "message": "Price observation recorded in Tiger Data hypertable.",
    }


@router.get("/prices/history/{ingredient_name}")
async def get_price_history(ingredient_name: str, days: int = Query(60, ge=1, le=365)):
    """Get time-series historical price observations for an ingredient from Tiger Data."""
    if not settings.tiger_data_available:
        return {
            "configured": False,
            "history": [],
            "message": "Tiger Data unconfigured. Set TIGER_DATA_DATABASE_URL to enable price charts.",
        }
    history = await get_historical_prices(ingredient_name=ingredient_name, days=days)
    return {
        "configured": True,
        "ingredient_name": ingredient_name,
        "days": days,
        "history": history,
    }


@router.get("/prices/summary")
async def get_price_summary():
    """Get aggregated time-series planning metrics and price trends across all ingredients."""
    return await get_price_analytics_summary()


# ─── Temporal Workflow Orchestration ───────────────────────────────────────

@router.post("/workflows/plan")
async def trigger_workflow_plan(req: WorkflowTriggerRequest):
    """Start an end-to-end distributed kitchen planning workflow via Temporal."""
    return await trigger_planning_workflow(target_date=req.target_date, meal_period=req.meal_period)


@router.get("/workflows/{workflow_id}")
async def get_workflow_status_endpoint(workflow_id: str):
    """Inspect the status and result of a Temporal planning workflow."""
    return await get_workflow_result(workflow_id)

