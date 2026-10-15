"""Deterministic forecasting and plan generation for DabbaIQ.

This module handles demand forecasting and prep plan calculations
using ordinary code — no LLM involvement for numerical computations.
"""

import logging
from datetime import date
from typing import List, Optional
from app.core.config import settings
from app.db.operations import (
    get_sales_for_forecast,
    get_recipe_by_id,
    get_ingredient_by_id,
    get_ingredients,
)
from app.schemas.schemas import (
    PlanRecipeItem, ShoppingItem, ForecastDetail,
    convert_units, units_compatible,
)

logger = logging.getLogger(__name__)


async def generate_prep_plan(
    target_date: date,
    meal_period: str,
    recipe_ids: List[str],
    confirmed_orders: dict[str, int],
    safety_buffer: Optional[float] = None,
    kitchen_notes: Optional[str] = None,
) -> dict:
    """Generate a deterministic preparation plan.

    Returns plan data including forecasts, recipe quantities,
    shopping list, and estimated costs.
    """
    buffer = safety_buffer if safety_buffer is not None else settings.DEFAULT_SAFETY_BUFFER

    recipes_data = []
    forecasts = []
    plan_recipes = []

    # Gather recipes and forecasts
    for recipe_id in recipe_ids:
        recipe = await get_recipe_by_id(recipe_id)
        if not recipe:
            logger.warning(f"Recipe {recipe_id} not found, skipping")
            continue

        recipes_data.append(recipe)

        # Get forecast for this recipe
        forecast = await get_sales_for_forecast(
            meal_period=meal_period,
            recipe_id=recipe_id,
            target_date=target_date,
            weekday_lookback=settings.FORECAST_WEEKDAY_LOOKBACK,
            trailing_days=settings.FORECAST_TRAILING_DAYS,
        )

        baseline = forecast["baseline"]
        confirmed = confirmed_orders.get(recipe_id, 0)

        # Use the higher of forecast or confirmed orders as base
        effective_base = max(baseline, confirmed)
        buffer_portions = round(effective_base * buffer) if effective_base > 0 else 0
        total = effective_base + buffer_portions

        forecasts.append(ForecastDetail(
            recipe_id=recipe_id,
            recipe_name=recipe["name"],
            method=forecast["method"],
            observations_used=forecast["observations"],
            baseline_forecast=baseline,
            explanation=forecast["explanation"],
        ))

        plan_recipes.append(PlanRecipeItem(
            recipe_id=recipe_id,
            recipe_name=recipe["name"],
            forecast_portions=baseline,
            confirmed_orders=confirmed,
            buffer_portions=buffer_portions,
            total_portions=total,
        ))

    # Calculate ingredient requirements and shopping list
    shopping_list = await _calc_shopping_list(plan_recipes, recipes_data)

    # Estimated total cost
    total_cost = round(sum(item.estimated_cost for item in shopping_list), 2)

    return {
        "target_date": target_date,
        "meal_period": meal_period,
        "recipes": [r.model_dump() for r in plan_recipes],
        "shopping_list": [s.model_dump() for s in shopping_list],
        "forecasts": [f.model_dump() for f in forecasts],
        "estimated_total_cost": total_cost,
        "ai_recommendation": None,
        "ai_menu_suggestion": None,
    }


async def _calc_shopping_list(
    plan_recipes: List[PlanRecipeItem],
    recipes_data: List[dict],
) -> List[ShoppingItem]:
    """Calculate required ingredients, compare with stock, produce shopping list."""

    # Aggregate ingredient needs across all recipes
    needs: dict[str, dict] = {}  # ingredient_id -> {qty, unit, name}

    for plan_item in plan_recipes:
        recipe = next(
            (r for r in recipes_data if r["id"] == plan_item.recipe_id),
            None
        )
        if not recipe:
            continue

        for ing in recipe.get("ingredients", []):
            ing_id = ing.get("ingredient_id", "")
            qty_needed = ing.get("quantity_per_portion", 0) * plan_item.total_portions
            ing_unit = ing.get("unit", "")

            if ing_id in needs:
                # Convert to existing unit if needed
                existing_unit = needs[ing_id]["unit"]
                if ing_unit != existing_unit and units_compatible(ing_unit, existing_unit):
                    qty_needed = convert_units(qty_needed, ing_unit, existing_unit)
                needs[ing_id]["qty"] += qty_needed
            else:
                needs[ing_id] = {
                    "qty": qty_needed,
                    "unit": ing_unit,
                    "name": ing.get("ingredient_name", ""),
                }

    # Compare with current inventory
    shopping_items = []
    for ing_id, need in needs.items():
        stored = await get_ingredient_by_id(ing_id)
        available = 0.0
        cost_per_unit = 0.0
        ing_name = need["name"]

        if stored:
            ing_name = stored.get("name", ing_name)
            cost_per_unit = stored.get("cost_per_unit", 0)
            stored_unit = stored.get("unit", need["unit"])

            if stored_unit == need["unit"]:
                available = stored.get("quantity", 0)
            elif units_compatible(stored_unit, need["unit"]):
                available = convert_units(
                    stored.get("quantity", 0),
                    stored_unit,
                    need["unit"]
                )
            else:
                logger.warning(
                    f"Unit mismatch for {ing_name}: "
                    f"recipe uses {need['unit']}, stock has {stored_unit}"
                )

        shortage = max(0, need["qty"] - available)
        estimated_cost = round(need["qty"] * cost_per_unit, 2)

        shopping_items.append(ShoppingItem(
            ingredient_id=ing_id,
            ingredient_name=ing_name,
            required_qty=round(need["qty"], 3),
            available_qty=round(available, 3),
            shortage_qty=round(shortage, 3),
            unit=need["unit"],
            estimated_cost=estimated_cost,
        ))

    return shopping_items
