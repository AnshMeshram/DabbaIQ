"""AI Preparation Planner endpoints for DabbaIQ."""

import logging
from datetime import date
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.db.connection import is_connected
from app.db.operations import (
    save_plan,
    confirm_plan,
    get_plans,
    get_plan_by_id,
    update_plan,
    delete_plan,
    get_recipes,
    get_recipe_by_id,
    get_ingredients,
)
from app.schemas.schemas import PlanGenerateRequest, PlanUpdate
from app.services.forecast import generate_prep_plan
from app.services.ai_provider import ai_provider, AIProviderError

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Planner"])


@router.post("/plans/generate")
async def generate_plan(data: PlanGenerateRequest):
    """Generate a preparation plan pairing deterministic baseline demand math with open-weight Gemma advisory."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")

    if not data.recipe_ids:
        all_recipes = await get_recipes()
        data.recipe_ids = [r["id"] for r in all_recipes]

    if not data.recipe_ids:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No recipes registered. Add recipes to the library first.")

    # 1. Deterministic plan calculation (ordinary code, no LLM math)
    plan = await generate_prep_plan(
        target_date=data.target_date,
        meal_period=data.meal_period.value,
        recipe_ids=data.recipe_ids,
        confirmed_orders=data.confirmed_orders,
        safety_buffer=data.safety_buffer,
        kitchen_notes=data.kitchen_notes,
    )

    # 2. Grounded AI enhancement from Gemma (non-blocking)
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

        valid_ids = {r["id"] for r in recipes}
        validated_recs = [rid for rid in suggestion.recommended_recipes if rid in valid_ids]
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
        logger.error("Unexpected error in AI suggestion: %s", e)
        plan["ai_recommendation"] = None

    # 3. Persist editable draft plan
    saved = await save_plan(plan)
    return saved


@router.post("/plans/{plan_id}/confirm")
async def confirm_plan_route(plan_id: str):
    """Confirm a draft preparation plan. Safe and idempotent against duplicate clicks."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    result = await confirm_plan(plan_id)
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Plan '{plan_id}' not found.")
    return result


@router.get("/plans")
async def list_plans(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    confirmed: bool = Query(False, description="Filter confirmed plans only"),
):
    """List preparation plans."""
    try:
        sd = date.fromisoformat(start_date) if start_date else None
        ed = date.fromisoformat(end_date) if end_date else None
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format. Use YYYY-MM-DD.")

    items = await get_plans(start_date=sd, end_date=ed, confirmed_only=confirmed)
    return {"items": items, "count": len(items)}


@router.get("/plans/{plan_id}")
async def get_single_plan(plan_id: str):
    """Retrieve details for a single preparation plan."""
    plan = await get_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Plan '{plan_id}' not found.")
    return plan


@router.patch("/plans/{plan_id}")
async def patch_plan(plan_id: str, data: PlanUpdate):
    """Update fields or recipe portions on a draft preparation plan."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    existing = await get_plan_by_id(plan_id)
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Plan '{plan_id}' not found.")
    if existing.get("is_confirmed"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Confirmed plans cannot be modified. Create a new plan instead.")

    result = await update_plan(plan_id, data)
    return result


@router.delete("/plans/{plan_id}")
async def remove_plan(plan_id: str):
    """Delete or cancel a preparation plan."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    deleted = await delete_plan(plan_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Plan '{plan_id}' not found.")
    return {"message": "Plan deleted successfully."}
