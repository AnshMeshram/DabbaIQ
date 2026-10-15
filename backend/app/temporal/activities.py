"""Temporal Activities for DabbaIQ Kitchen Planning.
All I/O, MongoDB queries, SerpAPI searches, Tiger Data writes, and AI calls live here.
"""

from typing import Dict, Any, List
from datetime import date, datetime, timedelta, timezone
from temporalio import activity

from app.db.connection import connect_db, get_db
from app.db.operations import get_ingredients, get_recipes, get_sales_for_forecast, save_plan
from app.schemas.schemas import PlanRecipeItem, MealPeriod
from app.services.forecast import generate_prep_plan
from app.services.serpapi_client import serpapi_client
from app.services.ai_provider import ai_provider
from app.db.tiger_data import save_price_snapshot


@activity.defn
async def fetch_kitchen_context(params: Dict[str, Any]) -> Dict[str, Any]:
    """Activity 1: Read requested date, sales history, recipes, and inventory from MongoDB."""
    await connect_db()
    db = get_db()
    if db is None:
        raise ConnectionError("MongoDB is not connected")

    target_date_str = params.get("target_date")
    target_date = date.fromisoformat(target_date_str) if target_date_str else date.today() + timedelta(days=1)

    ingredients = await get_ingredients()
    recipes = await get_recipes()
    sales_history = await get_sales_for_forecast(lookback_days=30)

    return {
        "target_date": target_date.isoformat(),
        "meal_period": params.get("meal_period", "lunch"),
        "ingredient_count": len(ingredients),
        "recipe_count": len(recipes),
        "sales_count": len(sales_history),
        "ingredients": ingredients,
        "recipes": recipes,
        "sales_history": sales_history,
    }


@activity.defn
async def compute_baseline_demand(context: Dict[str, Any]) -> Dict[str, Any]:
    """Activity 2: Calculate baseline demand using deterministic business logic."""
    target_date = date.fromisoformat(context["target_date"])
    recipes = context.get("recipes", [])
    meal_period_str = context.get("meal_period", "lunch").lower()
    recipe_ids = [r["id"] for r in recipes if "id" in r]

    plan = await generate_prep_plan(
        target_date=target_date,
        meal_period=meal_period_str,
        recipe_ids=recipe_ids,
        confirmed_orders={},
    )

    baseline_portions = {
        item["recipe_id"]: item.get("total_portions", 20)
        for item in plan.get("recipes", [])
    }

    return {
        "target_date": context["target_date"],
        "meal_period": meal_period_str,
        "forecasts": plan.get("forecasts", []),
        "baseline_portions": baseline_portions,
        "shopping_list": plan.get("shopping_list", []),
    }


@activity.defn
async def enrich_ingredient_prices(context: Dict[str, Any]) -> Dict[str, Any]:
    """Activity 3 & 4: Search relevant pricing via SerpAPI & record snapshots in Tiger Data."""
    ingredients = context.get("ingredients", [])
    price_observations = []

    # Pick top 2 ingredients to search to respect API quotas
    top_candidates = [ing["name"] for ing in ingredients[:2]]

    for ing_name in top_candidates:
        if serpapi_client.is_configured:
            res = await serpapi_client.search_ingredient_prices(ingredient_name=ing_name)
            results = res.get("results", [])
            if results:
                first = results[0]
                price_observations.append({
                    "ingredient_name": ing_name,
                    "source": first.get("source_name"),
                    "price_numeric": first.get("price_numeric"),
                    "currency": first.get("currency", "INR"),
                })
                # Store snapshot in Tiger Data hypertable if price is available
                if first.get("price_numeric"):
                    await save_price_snapshot(
                        ingredient_name=ing_name,
                        source_name=first.get("source_name", "SerpAPI"),
                        product_title=first.get("title", ing_name),
                        price_numeric=first.get("price_numeric"),
                        currency=first.get("currency", "INR"),
                        original_price_text=first.get("price_text"),
                        source_url=first.get("url"),
                        query_text=f"{ing_name} supplier price",
                    )

    return {
        "price_observations": price_observations,
        "searched_count": len(top_candidates),
    }


@activity.defn
async def generate_grounded_menu(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Activity 5: Request grounded menu suggestions from Gemma using validated data."""
    recipes = payload.get("recipes", [])
    ingredients = payload.get("ingredients", [])
    target_date = date.fromisoformat(payload["target_date"])
    meal_period_str = payload.get("meal_period", "lunch")

    ai_result = await ai_provider.generate_plan_suggestions(
        target_date=target_date,
        meal_period=meal_period_str,
        recipes=recipes,
        ingredients=ingredients,
        demand_forecasts=payload.get("forecasts", []),
    )

    return {
        "ai_suggestions": ai_result.get("suggestions", []),
        "provider": ai_result.get("provider", "fallback"),
        "raw_response": ai_result.get("raw_response", ""),
    }


@activity.defn
async def save_draft_plan(data: Dict[str, Any]) -> Dict[str, Any]:
    """Activity 6: Validate plan and persist draft in MongoDB with idempotency."""
    await connect_db()
    db = get_db()
    if db is None:
        raise ConnectionError("MongoDB is not connected")

    target_date = date.fromisoformat(data["target_date"])
    meal_period = MealPeriod(data.get("meal_period", "lunch").lower())
    recipes = data.get("recipes", [])
    baseline_portions = data.get("baseline_portions", {})

    recipe_items = []
    for r in recipes[:4]:
        portions = baseline_portions.get(r["id"], 25)
        recipe_items.append({
            "recipe_id": r["id"],
            "recipe_name": r["name"],
            "total_portions": portions,
            "prep_notes": r.get("prep_notes", ""),
        })

    plan_data = {
        "target_date": target_date,
        "meal_period": meal_period.value,
        "recipes": recipe_items,
        "notes": f"Generated via Temporal Workflow ({data.get('workflow_id', 'direct')})",
    }

    saved = await save_plan(plan_data)
    return {
        "plan_id": saved.get("id"),
        "target_date": data["target_date"],
        "recipe_count": len(recipe_items),
        "status": "draft_created",
    }
