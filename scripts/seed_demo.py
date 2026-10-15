"""Seed demo data for DabbaIQ.

Inserts clearly marked demonstration records into MongoDB.
Repeatable without creating duplicates — checks for existing demo data first.

Usage:
    python scripts/seed_demo.py
"""

import asyncio
import sys
import os
from datetime import date, timedelta, datetime, timezone
from pathlib import Path

# Configure UTF-8 encoding on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend to path and explicitly load backend/.env
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)

from app.core.config import settings
from app.db.connection import connect_db, disconnect_db, get_db
from app.schemas.schemas import (
    IngredientCreate, RecipeCreate, RecipeIngredient,
    SaleCreate, WasteCreate,
    Unit, MealPeriod, MealCategory,
)
from app.db.operations import (
    create_ingredient, create_recipe, create_sale, create_waste,
    get_ingredient_by_name, get_recipe_by_name,
)


DEMO_INGREDIENTS = [
    {"name": "basmati rice", "category": "grains", "quantity": 25, "unit": "kg",
     "reorder_level": 5, "cost_per_unit": 80, "expiry_date": None},
    {"name": "toor dal", "category": "pulses", "quantity": 10, "unit": "kg",
     "reorder_level": 3, "cost_per_unit": 140, "expiry_date": None},
    {"name": "whole wheat flour", "category": "grains", "quantity": 15, "unit": "kg",
     "reorder_level": 4, "cost_per_unit": 45, "expiry_date": None},
    {"name": "onion", "category": "vegetables", "quantity": 8, "unit": "kg",
     "reorder_level": 3, "cost_per_unit": 35, "expiry_date": None},
    {"name": "tomato", "category": "vegetables", "quantity": 5, "unit": "kg",
     "reorder_level": 2, "cost_per_unit": 40, "expiry_date": str(date.today() + timedelta(days=2))},
    {"name": "potato", "category": "vegetables", "quantity": 10, "unit": "kg",
     "reorder_level": 3, "cost_per_unit": 30, "expiry_date": None},
    {"name": "green chili", "category": "spices", "quantity": 500, "unit": "g",
     "reorder_level": 100, "cost_per_unit": 0.2, "expiry_date": str(date.today() + timedelta(days=3))},
    {"name": "cooking oil", "category": "oils", "quantity": 5, "unit": "L",
     "reorder_level": 2, "cost_per_unit": 180, "expiry_date": None},
    {"name": "turmeric powder", "category": "spices", "quantity": 500, "unit": "g",
     "reorder_level": 100, "cost_per_unit": 0.4, "expiry_date": None},
    {"name": "cumin seeds", "category": "spices", "quantity": 300, "unit": "g",
     "reorder_level": 50, "cost_per_unit": 0.8, "expiry_date": None},
    {"name": "coriander powder", "category": "spices", "quantity": 400, "unit": "g",
     "reorder_level": 100, "cost_per_unit": 0.5, "expiry_date": None},
    {"name": "salt", "category": "spices", "quantity": 2, "unit": "kg",
     "reorder_level": 0.5, "cost_per_unit": 20, "expiry_date": None},
    {"name": "mixed vegetables", "category": "vegetables", "quantity": 4, "unit": "kg",
     "reorder_level": 2, "cost_per_unit": 60, "expiry_date": str(date.today() + timedelta(days=4))},
    {"name": "ghee", "category": "dairy", "quantity": 2, "unit": "kg",
     "reorder_level": 0.5, "cost_per_unit": 550, "expiry_date": None},
    {"name": "yogurt", "category": "dairy", "quantity": 3, "unit": "kg",
     "reorder_level": 1, "cost_per_unit": 80, "expiry_date": str(date.today() + timedelta(days=3))},
]


async def seed():
    print("[*] DabbaIQ Demo Seed", flush=True)
    print("=" * 50, flush=True)

    clean_mode = any(arg in sys.argv for arg in ["--clean", "--reset", "--force"])

    if not settings.db_available:
        print("[!] MONGODB_URI not configured in backend/.env. Cannot seed persistent data.", flush=True)
        return False

    print(f"[*] Connecting to MongoDB database: '{settings.database_name}'...", flush=True)
    connected = await connect_db()
    if not connected:
        print("[X] Failed to connect to MongoDB.", flush=True)
        return False

    db = get_db()

    # Clean existing demo data if requested
    if clean_mode:
        print("[*] Cleaning existing demo data (--clean specified)...", flush=True)
        await db.ingredients.delete_many({"is_demo": True})
        await db.recipes.delete_many({"is_demo": True})
        await db.sales.delete_many({"is_demo": True})
        await db.waste.delete_many({"is_demo": True})
        await db.plans.delete_many({"is_demo": True})
        print("  [+] Cleaned all previous demo collections.", flush=True)
    else:
        existing = await db.ingredients.find_one({"is_demo": True})
        if existing:
            print("[!] Demo data already exists. Skipping seed to avoid duplicates.", flush=True)
            print("   To re-seed fresh, run: python scripts/seed_demo.py --clean", flush=True)
            await disconnect_db()
            return True

    print("\n[*] Seeding ingredients...")
    ingredient_ids = {}
    for raw_data in DEMO_INGREDIENTS:
        ing_data = dict(raw_data)
        expiry = ing_data.pop("expiry_date", None)
        data = IngredientCreate(
            name=ing_data["name"],
            category=ing_data["category"],
            quantity=ing_data["quantity"],
            unit=Unit(ing_data["unit"]),
            reorder_level=ing_data["reorder_level"],
            cost_per_unit=ing_data["cost_per_unit"],
            expiry_date=date.fromisoformat(expiry) if expiry else None,
        )
        result = await create_ingredient(data, is_demo=True)
        ingredient_ids[ing_data["name"]] = result["id"]
        print(f"  [+] {ing_data['name']}")

    print("\n[*] Seeding recipes...")
    recipe_ids = {}

    # Dal recipe
    dal = RecipeCreate(
        name="Dal Tadka",
        meal_category=MealCategory.MAIN,
        ingredients=[
            RecipeIngredient(ingredient_id=ingredient_ids["toor dal"],
                           ingredient_name="toor dal", quantity_per_portion=0.08, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["onion"],
                           ingredient_name="onion", quantity_per_portion=0.03, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["tomato"],
                           ingredient_name="tomato", quantity_per_portion=0.03, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["cooking oil"],
                           ingredient_name="cooking oil", quantity_per_portion=0.01, unit=Unit.L),
            RecipeIngredient(ingredient_id=ingredient_ids["turmeric powder"],
                           ingredient_name="turmeric powder", quantity_per_portion=2, unit=Unit.G),
            RecipeIngredient(ingredient_id=ingredient_ids["cumin seeds"],
                           ingredient_name="cumin seeds", quantity_per_portion=1, unit=Unit.G),
        ],
        prep_notes="Pressure cook dal 3 whistles. Prepare tadka with cumin, onion, tomato.",
        dietary_labels=["vegetarian", "vegan", "gluten-free"],
    )
    result = await create_recipe(dal, is_demo=True)
    recipe_ids["Dal Tadka"] = result["id"]
    print("  [+] Dal Tadka")

    # Steamed rice
    rice = RecipeCreate(
        name="Steamed Rice",
        meal_category=MealCategory.RICE,
        ingredients=[
            RecipeIngredient(ingredient_id=ingredient_ids["basmati rice"],
                           ingredient_name="basmati rice", quantity_per_portion=0.1, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["ghee"],
                           ingredient_name="ghee", quantity_per_portion=0.005, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["salt"],
                           ingredient_name="salt", quantity_per_portion=2, unit=Unit.G),
        ],
        prep_notes="Wash rice 2-3 times. Cook with 1:2 rice-water ratio.",
        dietary_labels=["vegetarian", "gluten-free"],
    )
    result = await create_recipe(rice, is_demo=True)
    recipe_ids["Steamed Rice"] = result["id"]
    print("  [+] Steamed Rice")

    # Chapati
    chapati = RecipeCreate(
        name="Chapati",
        meal_category=MealCategory.BREAD,
        ingredients=[
            RecipeIngredient(ingredient_id=ingredient_ids["whole wheat flour"],
                           ingredient_name="whole wheat flour", quantity_per_portion=0.06, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["ghee"],
                           ingredient_name="ghee", quantity_per_portion=0.003, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["salt"],
                           ingredient_name="salt", quantity_per_portion=1, unit=Unit.G),
        ],
        prep_notes="Knead soft dough. Rest 15 min. Roll thin, cook on tawa. 3 chapati per portion.",
        dietary_labels=["vegetarian"],
    )
    result = await create_recipe(chapati, is_demo=True)
    recipe_ids["Chapati"] = result["id"]
    print("  [+] Chapati")

    # Aloo Sabzi
    sabzi = RecipeCreate(
        name="Aloo Gobi Sabzi",
        meal_category=MealCategory.SIDE,
        ingredients=[
            RecipeIngredient(ingredient_id=ingredient_ids["potato"],
                           ingredient_name="potato", quantity_per_portion=0.1, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["onion"],
                           ingredient_name="onion", quantity_per_portion=0.03, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["tomato"],
                           ingredient_name="tomato", quantity_per_portion=0.02, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["cooking oil"],
                           ingredient_name="cooking oil", quantity_per_portion=0.01, unit=Unit.L),
            RecipeIngredient(ingredient_id=ingredient_ids["turmeric powder"],
                           ingredient_name="turmeric powder", quantity_per_portion=2, unit=Unit.G),
            RecipeIngredient(ingredient_id=ingredient_ids["coriander powder"],
                           ingredient_name="coriander powder", quantity_per_portion=3, unit=Unit.G),
        ],
        prep_notes="Semi-dry preparation. Cut potatoes in cubes.",
        dietary_labels=["vegetarian", "vegan"],
    )
    result = await create_recipe(sabzi, is_demo=True)
    recipe_ids["Aloo Gobi Sabzi"] = result["id"]
    print("  [+] Aloo Gobi Sabzi")

    # Mixed Veg
    mixed = RecipeCreate(
        name="Mixed Vegetable Curry",
        meal_category=MealCategory.MAIN,
        ingredients=[
            RecipeIngredient(ingredient_id=ingredient_ids["mixed vegetables"],
                           ingredient_name="mixed vegetables", quantity_per_portion=0.12, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["onion"],
                           ingredient_name="onion", quantity_per_portion=0.03, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["tomato"],
                           ingredient_name="tomato", quantity_per_portion=0.03, unit=Unit.KG),
            RecipeIngredient(ingredient_id=ingredient_ids["cooking oil"],
                           ingredient_name="cooking oil", quantity_per_portion=0.01, unit=Unit.L),
            RecipeIngredient(ingredient_id=ingredient_ids["turmeric powder"],
                           ingredient_name="turmeric powder", quantity_per_portion=2, unit=Unit.G),
            RecipeIngredient(ingredient_id=ingredient_ids["yogurt"],
                           ingredient_name="yogurt", quantity_per_portion=0.02, unit=Unit.KG),
        ],
        prep_notes="Light gravy style. Use seasonal vegetables.",
        dietary_labels=["vegetarian"],
    )
    result = await create_recipe(mixed, is_demo=True)
    recipe_ids["Mixed Vegetable Curry"] = result["id"]
    print("  [+] Mixed Vegetable Curry")

    # Seed 14 days of sales
    print("\n[*] Seeding 14 days of sales data...")
    today = date.today()

    import random
    random.seed(42)  # Reproducible demo data

    meals = {
        MealPeriod.LUNCH: {
            "recipes": ["Dal Tadka", "Steamed Rice", "Chapati", "Aloo Gobi Sabzi"],
            "base_portions": [25, 25, 30, 20],
            "revenue_per": [30, 20, 15, 25],
        },
        MealPeriod.DINNER: {
            "recipes": ["Dal Tadka", "Steamed Rice", "Chapati", "Mixed Vegetable Curry"],
            "base_portions": [18, 18, 22, 15],
            "revenue_per": [30, 20, 15, 30],
        },
    }

    sales_count = 0
    for day_offset in range(14, 0, -1):
        d = today - timedelta(days=day_offset)
        weekday = d.weekday()
        weekend_mult = 1.2 if weekday >= 5 else 1.0

        for meal_period, meal_info in meals.items():
            for recipe_name, base, rev_per in zip(
                meal_info["recipes"], meal_info["base_portions"], meal_info["revenue_per"]
            ):
                variation = random.randint(-3, 4)
                portions = max(5, int((base + variation) * weekend_mult))
                revenue = portions * rev_per

                sale = SaleCreate(
                    date=d,
                    meal_period=meal_period,
                    recipe_id=recipe_ids[recipe_name],
                    recipe_name=recipe_name,
                    portions_sold=portions,
                    revenue=revenue,
                )
                await create_sale(sale, is_demo=True)
                sales_count += 1

    print(f"  [+] {sales_count} sale records created")

    # Seed waste records
    print("\n[*] Seeding waste records...")
    waste_count = 0
    for day_offset in [1, 3, 5, 7, 10, 12]:
        d = today - timedelta(days=day_offset)
        recipe_name = random.choice(list(recipe_ids.keys()))
        prepared = random.randint(20, 35)
        sold = random.randint(int(prepared * 0.7), prepared)

        waste = WasteCreate(
            date=d,
            meal_period=MealPeriod.LUNCH,
            recipe_id=recipe_ids[recipe_name],
            recipe_name=recipe_name,
            portions_prepared=prepared,
            portions_sold=sold,
            reason=random.choice([
                "Overestimated demand",
                "Late cancellations",
                "Weather reduced footfall",
                None,
            ]),
        )
        await create_waste(waste, is_demo=True)
        waste_count += 1

    print(f"  [+] {waste_count} waste records created")

    # Seed today's active plan for dashboard metrics
    print("\n[*] Seeding today's active preparation plan...")
    demo_plan = {
        "target_date": today.isoformat(),
        "meal_period": "lunch",
        "is_confirmed": True,
        "is_demo": True,
        "notes": "Demo confirmed preparation plan for lunch service",
        "recipes": [
            {"recipe_id": recipe_ids["Dal Tadka"], "recipe_name": "Dal Tadka", "total_portions": 25},
            {"recipe_id": recipe_ids["Steamed Rice"], "recipe_name": "Steamed Rice", "total_portions": 25},
            {"recipe_id": recipe_ids["Chapati"], "recipe_name": "Chapati", "total_portions": 50},
        ],
        "created_at": datetime.now(timezone.utc),
        "confirmed_at": datetime.now(timezone.utc),
    }
    await db.plans.insert_one(demo_plan)
    print("  [+] 1 active preparation plan created")

    print("\n" + "=" * 50)
    print("[SUCCESS] Demo data seeded successfully to MongoDB Atlas!")
    print("   All records are marked with is_demo=true")
    print("   Run seed again -- it will safely skip if data exists.")

    await disconnect_db()
    return True


if __name__ == "__main__":
    asyncio.run(seed())
