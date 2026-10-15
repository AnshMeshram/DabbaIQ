"""Database operations for DabbaIQ collections."""

import logging
from datetime import datetime, date, timedelta, timezone
from typing import Optional, List
from bson import ObjectId
from app.db.connection import get_db, is_connected
from app.schemas.schemas import (
    IngredientCreate, IngredientUpdate,
    RecipeCreate, RecipeUpdate, RecipeIngredient,
    SaleCreate, SaleUpdate,
    WasteCreate,
    PlanRecipeItem, ShoppingItem, ForecastDetail,
    convert_units, units_compatible,
)

logger = logging.getLogger(__name__)


def _oid(id_str: str) -> ObjectId:
    return ObjectId(id_str)


def _serialize(doc: dict) -> dict:
    """Convert MongoDB document to JSON-safe dict."""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


def _date_to_str(d: date) -> str:
    return d.isoformat()


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ─── Ingredients ─────────────────────────────────────────────────────────────

async def create_ingredient(data: IngredientCreate, is_demo: bool = False) -> dict:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")

    doc = data.model_dump()
    doc["is_demo"] = is_demo
    doc["created_at"] = _utc_now()
    doc["updated_at"] = _utc_now()
    if doc.get("expiry_date"):
        doc["expiry_date"] = _date_to_str(doc["expiry_date"])

    result = await db.ingredients.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def get_ingredients(
    category: Optional[str] = None,
    low_stock_only: bool = False,
    expiring_within_days: Optional[int] = None,
) -> List[dict]:
    db = get_db()
    if db is None:
        return []

    query = {}
    if category:
        query["category"] = category

    cursor = db.ingredients.find(query).sort("name", 1)
    results = []
    today = date.today()

    async for doc in cursor:
        doc = _serialize(doc)
        doc["is_low_stock"] = doc["quantity"] <= doc.get("reorder_level", 0)
        expiry = doc.get("expiry_date")
        if expiry and isinstance(expiry, str):
            try:
                exp_date = date.fromisoformat(expiry)
                doc["is_expiring"] = (exp_date - today).days <= 3
            except (ValueError, TypeError):
                doc["is_expiring"] = False
        else:
            doc["is_expiring"] = False

        if low_stock_only and not doc["is_low_stock"]:
            continue
        if expiring_within_days is not None:
            if not expiry:
                continue
            try:
                exp_date = date.fromisoformat(expiry) if isinstance(expiry, str) else expiry
                if (exp_date - today).days > expiring_within_days:
                    continue
            except (ValueError, TypeError):
                continue

        results.append(doc)
    return results


async def get_ingredient_by_id(ingredient_id: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    doc = await db.ingredients.find_one({"_id": _oid(ingredient_id)})
    if doc:
        doc = _serialize(doc)
        doc["is_low_stock"] = doc["quantity"] <= doc.get("reorder_level", 0)
    return doc


async def get_ingredient_by_name(name: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    doc = await db.ingredients.find_one({"name": name.strip().lower()})
    if doc:
        return _serialize(doc)
    return None


async def update_ingredient(ingredient_id: str, data: IngredientUpdate) -> Optional[dict]:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        return await get_ingredient_by_id(ingredient_id)

    if "expiry_date" in update_data and update_data["expiry_date"]:
        update_data["expiry_date"] = _date_to_str(update_data["expiry_date"])

    update_data["updated_at"] = _utc_now()
    await db.ingredients.update_one(
        {"_id": _oid(ingredient_id)},
        {"$set": update_data}
    )
    return await get_ingredient_by_id(ingredient_id)


async def delete_ingredient(ingredient_id: str) -> bool:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")
    result = await db.ingredients.delete_one({"_id": _oid(ingredient_id)})
    return result.deleted_count > 0


# ─── Recipes ─────────────────────────────────────────────────────────────────

async def create_recipe(data: RecipeCreate, is_demo: bool = False) -> dict:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")

    doc = data.model_dump()
    doc["is_demo"] = is_demo
    doc["created_at"] = _utc_now()
    doc["updated_at"] = _utc_now()

    # Calculate cost per portion
    doc["estimated_cost_per_portion"] = await _calc_recipe_cost(doc["ingredients"])

    result = await db.recipes.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def _calc_recipe_cost(ingredients: List[dict]) -> float:
    """Calculate ingredient cost per portion from stored ingredient data."""
    total = 0.0
    for ing in ingredients:
        stored = await get_ingredient_by_id(ing.get("ingredient_id", ""))
        if stored:
            try:
                qty = ing["quantity_per_portion"]
                ing_unit = ing.get("unit", stored.get("unit", ""))
                stored_unit = stored.get("unit", "")
                if ing_unit and stored_unit and ing_unit != stored_unit:
                    if units_compatible(ing_unit, stored_unit):
                        qty = convert_units(qty, ing_unit, stored_unit)
                    else:
                        continue
                total += qty * stored.get("cost_per_unit", 0)
            except (KeyError, ValueError, TypeError):
                continue
    return round(total, 2)


async def get_recipes(
    meal_category: Optional[str] = None,
) -> List[dict]:
    db = get_db()
    if db is None:
        return []

    query = {}
    if meal_category:
        query["meal_category"] = meal_category

    results = []
    cursor = db.recipes.find(query).sort("name", 1)
    async for doc in cursor:
        doc = _serialize(doc)
        # Recalculate cost dynamically
        doc["estimated_cost_per_portion"] = await _calc_recipe_cost(doc.get("ingredients", []))
        results.append(doc)
    return results


async def get_recipe_by_id(recipe_id: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    doc = await db.recipes.find_one({"_id": _oid(recipe_id)})
    if doc:
        doc = _serialize(doc)
        doc["estimated_cost_per_portion"] = await _calc_recipe_cost(doc.get("ingredients", []))
    return doc


async def get_recipe_by_name(name: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    doc = await db.recipes.find_one({"name": name.strip()})
    if doc:
        doc = _serialize(doc)
        doc["estimated_cost_per_portion"] = await _calc_recipe_cost(doc.get("ingredients", []))
    return doc


async def update_recipe(recipe_id: str, data: RecipeUpdate) -> Optional[dict]:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        return await get_recipe_by_id(recipe_id)

    # Recalculate cost if ingredients changed
    if "ingredients" in update_data:
        update_data["estimated_cost_per_portion"] = await _calc_recipe_cost(update_data["ingredients"])

    update_data["updated_at"] = _utc_now()
    await db.recipes.update_one(
        {"_id": _oid(recipe_id)},
        {"$set": update_data}
    )
    return await get_recipe_by_id(recipe_id)


async def delete_recipe(recipe_id: str) -> bool:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")
    result = await db.recipes.delete_one({"_id": _oid(recipe_id)})
    return result.deleted_count > 0


# ─── Sales ───────────────────────────────────────────────────────────────────

async def create_sale(data: SaleCreate, is_demo: bool = False) -> dict:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")

    doc = data.model_dump()
    doc["date"] = _date_to_str(doc["date"])
    doc["is_demo"] = is_demo
    doc["created_at"] = _utc_now()

    # Enrich recipe name
    recipe = await get_recipe_by_id(doc["recipe_id"])
    if recipe:
        doc["recipe_name"] = recipe["name"]

    result = await db.sales.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def get_sales(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    meal_period: Optional[str] = None,
    recipe_id: Optional[str] = None,
) -> List[dict]:
    db = get_db()
    if db is None:
        return []

    query = {}
    if start_date or end_date:
        date_q = {}
        if start_date:
            date_q["$gte"] = _date_to_str(start_date)
        if end_date:
            date_q["$lte"] = _date_to_str(end_date)
        query["date"] = date_q
    if meal_period:
        query["meal_period"] = meal_period
    if recipe_id:
        query["recipe_id"] = recipe_id

    results = []
    cursor = db.sales.find(query).sort("date", -1)
    async for doc in cursor:
        results.append(_serialize(doc))
    return results


async def update_sale(sale_id: str, data: SaleUpdate) -> Optional[dict]:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "date" in update_data:
        update_data["date"] = _date_to_str(update_data["date"])

    if not update_data:
        doc = await db.sales.find_one({"_id": _oid(sale_id)})
        return _serialize(doc) if doc else None

    await db.sales.update_one(
        {"_id": _oid(sale_id)},
        {"$set": update_data}
    )
    doc = await db.sales.find_one({"_id": _oid(sale_id)})
    return _serialize(doc) if doc else None


async def delete_sale(sale_id: str) -> bool:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")
    result = await db.sales.delete_one({"_id": _oid(sale_id)})
    return result.deleted_count > 0


# ─── Waste ───────────────────────────────────────────────────────────────────

async def create_waste(data: WasteCreate, is_demo: bool = False) -> dict:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")

    doc = data.model_dump()
    doc["date"] = _date_to_str(doc["date"])
    doc["is_demo"] = is_demo
    doc["leftover_portions"] = doc["portions_prepared"] - doc["portions_sold"]
    doc["created_at"] = _utc_now()

    # Calculate waste cost
    recipe = await get_recipe_by_id(doc["recipe_id"])
    cost_per_portion = 0
    if recipe:
        cost_per_portion = recipe.get("estimated_cost_per_portion", 0)
        doc["recipe_name"] = recipe["name"]
    doc["estimated_waste_cost"] = round(doc["leftover_portions"] * cost_per_portion, 2)

    result = await db.waste.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def get_waste(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    recipe_id: Optional[str] = None,
) -> List[dict]:
    db = get_db()
    if db is None:
        return []

    query = {}
    if start_date or end_date:
        date_q = {}
        if start_date:
            date_q["$gte"] = _date_to_str(start_date)
        if end_date:
            date_q["$lte"] = _date_to_str(end_date)
        query["date"] = date_q
    if recipe_id:
        query["recipe_id"] = recipe_id

    results = []
    cursor = db.waste.find(query).sort("date", -1)
    async for doc in cursor:
        results.append(_serialize(doc))
    return results


# ─── Plans ───────────────────────────────────────────────────────────────────

async def save_plan(plan_data: dict) -> dict:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")

    plan_data["created_at"] = _utc_now()
    plan_data["is_confirmed"] = False

    if "target_date" in plan_data and isinstance(plan_data["target_date"], date):
        plan_data["target_date"] = _date_to_str(plan_data["target_date"])

    result = await db.plans.insert_one(plan_data)
    plan_data["_id"] = result.inserted_id
    return _serialize(plan_data)


async def confirm_plan(plan_id: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        raise ConnectionError("Database not connected")

    await db.plans.update_one(
        {"_id": _oid(plan_id)},
        {"$set": {"is_confirmed": True, "confirmed_at": _utc_now()}}
    )
    doc = await db.plans.find_one({"_id": _oid(plan_id)})
    return _serialize(doc) if doc else None


async def get_plans(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    confirmed_only: bool = False,
) -> List[dict]:
    db = get_db()
    if db is None:
        return []

    query = {}
    if start_date or end_date:
        date_q = {}
        if start_date:
            date_q["$gte"] = _date_to_str(start_date)
        if end_date:
            date_q["$lte"] = _date_to_str(end_date)
        query["target_date"] = date_q
    if confirmed_only:
        query["is_confirmed"] = True

    results = []
    cursor = db.plans.find(query).sort("target_date", -1)
    async for doc in cursor:
        results.append(_serialize(doc))
    return results


async def get_plan_by_id(plan_id: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    doc = await db.plans.find_one({"_id": _oid(plan_id)})
    return _serialize(doc) if doc else None


# ─── Forecasting ─────────────────────────────────────────────────────────────

async def get_sales_for_forecast(
    meal_period: str,
    recipe_id: str,
    target_date: date,
    weekday_lookback: int = 4,
    trailing_days: int = 7,
) -> dict:
    """Get historical sales data for forecasting.
    Returns {method, observations, baseline, explanation}.
    """
    db = get_db()
    if db is None:
        return {
            "method": "no_data",
            "observations": 0,
            "baseline": 0,
            "explanation": "Database not connected. No historical data available.",
        }

    target_weekday = target_date.weekday()

    # Try matching weekdays first
    weekday_sales = []
    check_date = target_date - timedelta(days=7)
    weeks_checked = 0
    while weeks_checked < weekday_lookback * 2 and len(weekday_sales) < weekday_lookback:
        if check_date.weekday() == target_weekday:
            day_sales = await db.sales.find({
                "date": _date_to_str(check_date),
                "meal_period": meal_period,
                "recipe_id": recipe_id,
            }).to_list(100)
            if day_sales:
                total = sum(s.get("portions_sold", 0) for s in day_sales)
                weekday_sales.append(total)
        check_date -= timedelta(days=1)
        weeks_checked += 1

    if len(weekday_sales) >= 2:
        baseline = round(sum(weekday_sales) / len(weekday_sales))
        return {
            "method": "weekday_average",
            "observations": len(weekday_sales),
            "baseline": baseline,
            "explanation": (
                f"Average of {len(weekday_sales)} previous "
                f"{target_date.strftime('%A')}s for this meal: "
                f"{', '.join(str(s) for s in weekday_sales)} portions. "
                f"Baseline: {baseline} portions."
            ),
        }

    # Fallback: trailing 7 days
    trail_start = target_date - timedelta(days=trailing_days)
    trailing_pipeline = [
        {
            "$match": {
                "date": {
                    "$gte": _date_to_str(trail_start),
                    "$lt": _date_to_str(target_date),
                },
                "meal_period": meal_period,
                "recipe_id": recipe_id,
            }
        },
        {
            "$group": {
                "_id": "$date",
                "total": {"$sum": "$portions_sold"},
            }
        },
    ]
    trailing_results = await db.sales.aggregate(trailing_pipeline).to_list(30)

    if trailing_results:
        totals = [r["total"] for r in trailing_results]
        baseline = round(sum(totals) / len(totals))
        return {
            "method": "trailing_average",
            "observations": len(totals),
            "baseline": baseline,
            "explanation": (
                f"Average of {len(totals)} days in the trailing "
                f"{trailing_days}-day window: {baseline} portions. "
                f"Insufficient matching weekday data (found {len(weekday_sales)})."
            ),
        }

    return {
        "method": "no_data",
        "observations": 0,
        "baseline": 0,
        "explanation": (
            "No historical sales data found for this recipe and meal period. "
            "Please enter a manual expected quantity."
        ),
    }


# ─── Dashboard aggregation ──────────────────────────────────────────────────

async def get_dashboard_data(target_date: date) -> dict:
    """Aggregate dashboard data for a given date."""
    db = get_db()
    connected = is_connected()

    dashboard = {
        "date": target_date,
        "expected_portions": 0,
        "recorded_sales": 0,
        "total_revenue": 0.0,
        "low_stock_items": [],
        "expiring_items": [],
        "leftover_portions": 0,
        "estimated_waste_cost": 0.0,
        "sales_chart_data": [],
        "next_plan": None,
        "db_connected": connected,
    }

    if db is None or not connected:
        return dashboard

    date_str = _date_to_str(target_date)

    # Today's sales
    today_sales = await db.sales.find({"date": date_str}).to_list(200)
    dashboard["recorded_sales"] = sum(s.get("portions_sold", 0) for s in today_sales)
    dashboard["total_revenue"] = round(
        sum(s.get("revenue", 0) or 0 for s in today_sales), 2
    )

    # Today's plan for expected portions
    today_plan = await db.plans.find_one({
        "target_date": date_str,
        "is_confirmed": True,
    })
    if today_plan:
        dashboard["expected_portions"] = sum(
            r.get("total_portions", 0) for r in today_plan.get("recipes", [])
        )
        dashboard["next_plan"] = _serialize(today_plan)

    # Low stock
    low_stock = await get_ingredients(low_stock_only=True)
    dashboard["low_stock_items"] = [
        {"id": i["id"], "name": i["name"], "quantity": i["quantity"],
         "unit": i.get("unit", ""), "reorder_level": i.get("reorder_level", 0)}
        for i in low_stock
    ]

    # Expiring within 3 days
    expiring = await get_ingredients(expiring_within_days=3)
    dashboard["expiring_items"] = [
        {"id": i["id"], "name": i["name"], "expiry_date": i.get("expiry_date", ""),
         "quantity": i["quantity"], "unit": i.get("unit", "")}
        for i in expiring
    ]

    # Waste for today
    today_waste = await db.waste.find({"date": date_str}).to_list(200)
    dashboard["leftover_portions"] = sum(w.get("leftover_portions", 0) for w in today_waste)
    dashboard["estimated_waste_cost"] = round(
        sum(w.get("estimated_waste_cost", 0) for w in today_waste), 2
    )

    # 7-day sales chart
    chart_data = []
    for i in range(6, -1, -1):
        d = target_date - timedelta(days=i)
        d_str = _date_to_str(d)
        day_sales = await db.sales.find({"date": d_str}).to_list(200)
        portions = sum(s.get("portions_sold", 0) for s in day_sales)
        revenue = round(sum(s.get("revenue", 0) or 0 for s in day_sales), 2)
        chart_data.append({
            "date": d_str,
            "day": d.strftime("%a"),
            "portions": portions,
            "revenue": revenue,
        })
    dashboard["sales_chart_data"] = chart_data

    return dashboard


# ─── Reports ─────────────────────────────────────────────────────────────────

async def get_report_summary(start_date: date, end_date: date) -> dict:
    """Generate report summary for date range."""
    sales = await get_sales(start_date=start_date, end_date=end_date)
    waste = await get_waste(start_date=start_date, end_date=end_date)
    low_stock = await get_ingredients(low_stock_only=True)

    total_portions = sum(s.get("portions_sold", 0) for s in sales)
    total_revenue = round(sum(s.get("revenue", 0) or 0 for s in sales), 2)
    total_waste = sum(w.get("leftover_portions", 0) for w in waste)
    waste_cost = round(sum(w.get("estimated_waste_cost", 0) for w in waste), 2)

    # Estimate ingredient cost from recipes used
    recipe_ids = set(s.get("recipe_id") for s in sales if s.get("recipe_id"))
    ingredient_cost = 0.0
    for rid in recipe_ids:
        recipe = await get_recipe_by_id(rid)
        if recipe:
            portions_for_recipe = sum(
                s.get("portions_sold", 0)
                for s in sales if s.get("recipe_id") == rid
            )
            ingredient_cost += portions_for_recipe * recipe.get("estimated_cost_per_portion", 0)
    ingredient_cost = round(ingredient_cost, 2)

    # Daily breakdown
    daily = {}
    for s in sales:
        d = s.get("date", "")
        if d not in daily:
            daily[d] = {"date": d, "portions": 0, "revenue": 0.0}
        daily[d]["portions"] += s.get("portions_sold", 0)
        daily[d]["revenue"] += s.get("revenue", 0) or 0

    # Meal summaries
    meal_data = {}
    for s in sales:
        mp = s.get("meal_period", "unknown")
        if mp not in meal_data:
            meal_data[mp] = {"meal_period": mp, "portions": 0, "revenue": 0.0}
        meal_data[mp]["portions"] += s.get("portions_sold", 0)
        meal_data[mp]["revenue"] += s.get("revenue", 0) or 0

    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_sales_portions": total_portions,
        "total_revenue": total_revenue,
        "estimated_ingredient_cost": ingredient_cost,
        "total_waste_portions": total_waste,
        "estimated_waste_cost": waste_cost,
        "restock_items": [
            {"id": i["id"], "name": i["name"], "quantity": i["quantity"],
             "unit": i.get("unit", ""), "reorder_level": i.get("reorder_level", 0)}
            for i in low_stock
        ],
        "daily_breakdown": sorted(daily.values(), key=lambda x: x["date"]),
        "meal_summaries": list(meal_data.values()),
    }
