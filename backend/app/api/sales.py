"""Sales logging and CSV import/export endpoints for DabbaIQ."""

import csv
import io
import logging
from datetime import date
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, status
from app.db.connection import is_connected
from app.db.operations import (
    create_sale,
    get_sales,
    get_sale_by_id,
    update_sale,
    delete_sale,
    get_recipe_by_id,
    get_recipe_by_name,
)
from app.schemas.schemas import SaleCreate, SaleUpdate, MealPeriod

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Sales"])


@router.get("/sales")
async def list_sales(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    meal_period: Optional[str] = Query(None, description="Meal period (breakfast, lunch, dinner, snacks)"),
    recipe_id: Optional[str] = Query(None, description="Filter by recipe ID"),
):
    """List sales records filtered by date range, meal period, and recipe."""
    try:
        sd = date.fromisoformat(start_date) if start_date else None
        ed = date.fromisoformat(end_date) if end_date else None
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format. Use YYYY-MM-DD.")

    if sd and ed and sd > ed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "start_date must be before or equal to end_date.")

    items = await get_sales(
        start_date=sd, end_date=ed,
        meal_period=meal_period, recipe_id=recipe_id,
    )
    return {"items": items, "count": len(items)}


@router.get("/sales/{sale_id}")
async def get_single_sale(sale_id: str):
    """Retrieve details for a single recorded sale."""
    sale = await get_sale_by_id(sale_id)
    if not sale:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Sale '{sale_id}' not found.")
    return sale


@router.post("/sales", status_code=status.HTTP_201_CREATED)
async def add_sale(data: SaleCreate):
    """Record a meal sale with recipe validation and portion counts."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    # Verify recipe exists
    recipe = await get_recipe_by_id(data.recipe_id)
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Recipe '{data.recipe_id}' not found.")
    result = await create_sale(data)
    return result


@router.patch("/sales/{sale_id}")
async def patch_sale(sale_id: str, data: SaleUpdate):
    """Update fields on an existing sale record."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    existing = await get_sale_by_id(sale_id)
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Sale '{sale_id}' not found.")

    if data.recipe_id is not None:
        recipe = await get_recipe_by_id(data.recipe_id)
        if not recipe:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Recipe '{data.recipe_id}' not found.")

    result = await update_sale(sale_id, data)
    return result


@router.delete("/sales/{sale_id}")
async def remove_sale(sale_id: str):
    """Delete a sale record."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    deleted = await delete_sale(sale_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Sale '{sale_id}' not found.")
    return {"message": "Sale deleted successfully."}


@router.post("/sales/import")
async def import_sales_csv(file: UploadFile = File(...)):
    """Import sales from CSV with row-level validation, name or ID recipe matching, and idempotency."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File must be a .csv file.")

    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File must be UTF-8 encoded.")

    reader = csv.DictReader(io.StringIO(text))
    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]
    if "date" not in fieldnames or "meal_period" not in fieldnames or "portions_sold" not in fieldnames:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"CSV must contain 'date', 'meal_period', and 'portions_sold' columns. Found: {reader.fieldnames}",
        )

    has_recipe_id = "recipe_id" in fieldnames
    has_recipe_name = "recipe_name" in fieldnames or "recipe" in fieldnames

    if not has_recipe_id and not has_recipe_name:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "CSV must contain either 'recipe_id' or 'recipe_name' (or 'recipe') column.",
        )

    results = {"imported": 0, "errors": [], "total_rows": 0}
    seen_keys = set()

    for i, raw_row in enumerate(reader, start=2):
        row = {k.strip().lower(): v.strip() for k, v in raw_row.items() if k and v}
        results["total_rows"] += 1

        try:
            # Parse Date
            sale_date = date.fromisoformat(row["date"])

            # Parse Meal Period
            meal_period = MealPeriod(row["meal_period"].lower())

            # Parse Portions
            portions = int(row["portions_sold"])
            if portions <= 0:
                results["errors"].append({"row": i, "error": "portions_sold must be greater than 0"})
                continue

            # Resolve Recipe by ID or Name
            recipe = None
            if has_recipe_id and row.get("recipe_id"):
                recipe = await get_recipe_by_id(row["recipe_id"])
            if not recipe and has_recipe_name:
                r_name = row.get("recipe_name") or row.get("recipe")
                if r_name:
                    recipe = await get_recipe_by_name(r_name)

            if not recipe:
                ident = row.get("recipe_id") or row.get("recipe_name") or row.get("recipe") or "unknown"
                results["errors"].append({"row": i, "error": f"Recipe '{ident}' could not be resolved to a registered dish."})
                continue

            # Idempotency / duplicate protection in batch
            idempotency_key = f"{sale_date.isoformat()}:{meal_period.value}:{recipe['id']}"
            if idempotency_key in seen_keys:
                results["errors"].append({"row": i, "error": f"Duplicate record in same CSV for recipe on {sale_date} ({meal_period.value})"})
                continue
            seen_keys.add(idempotency_key)

            # Revenue calculation
            revenue_val = None
            if "revenue" in row and row["revenue"]:
                revenue_val = float(row["revenue"])
            else:
                # Default revenue estimation: 2.5x estimated portion cost or standard ₹80/meal
                cost = recipe.get("estimated_cost_per_portion", 0)
                revenue_val = round(portions * max(50.0, cost * 2.2), 2)

            sale_data = SaleCreate(
                date=sale_date,
                meal_period=meal_period,
                recipe_id=recipe["id"],
                recipe_name=recipe["name"],
                portions_sold=portions,
                revenue=revenue_val,
            )

            await create_sale(sale_data)
            results["imported"] += 1

        except Exception as e:
            results["errors"].append({"row": i, "error": str(e)})

    if results["errors"] and results["imported"] == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=results)

    return results
