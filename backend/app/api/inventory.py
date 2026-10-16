"""Inventory and pantry management endpoints for DabbaIQ."""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.db.connection import is_connected
from app.db.operations import (
    create_ingredient,
    get_ingredients,
    get_ingredient_by_id,
    update_ingredient,
    delete_ingredient,
    adjust_ingredient_stock,
    is_ingredient_in_use,
)
from app.schemas.schemas import IngredientCreate, IngredientUpdate, StockAdjustRequest

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Inventory"])


@router.get("/inventory")
async def list_inventory(
    category: Optional[str] = Query(None, description="Filter by category (e.g. grains, vegetables, pulses)"),
    low_stock: bool = Query(False, description="Filter only items at or below reorder level"),
    expiring_days: Optional[int] = Query(None, ge=1, le=30, description="Items expiring within N days"),
    q: Optional[str] = Query(None, description="Optional search substring in ingredient name"),
):
    """List ingredient inventory records with optional filtering and search."""
    items = await get_ingredients(
        category=category,
        low_stock_only=low_stock,
        expiring_within_days=expiring_days,
    )
    if q and q.strip():
        search_term = q.strip().lower()
        items = [i for i in items if search_term in i.get("name", "").lower()]
    return {"items": items, "count": len(items)}


@router.get("/inventory/{ingredient_id}")
async def get_single_ingredient(ingredient_id: str):
    """Retrieve details for a single raw ingredient by ID."""
    item = await get_ingredient_by_id(ingredient_id)
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Ingredient '{ingredient_id}' not found.")
    return item


@router.post("/inventory", status_code=status.HTTP_201_CREATED)
async def add_ingredient(data: IngredientCreate):
    """Create a new ingredient with strict name stripping, positive quantities, and unit validation."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected. Cannot save data.")
    try:
        result = await create_ingredient(data)
        return result
    except Exception as e:
        if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status.HTTP_409_CONFLICT, f"Ingredient '{data.name}' already exists.")
        logger.error("Failed to create ingredient: %s", e)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))


@router.patch("/inventory/{ingredient_id}")
async def patch_ingredient(ingredient_id: str, data: IngredientUpdate):
    """Update fields on an existing ingredient."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    existing = await get_ingredient_by_id(ingredient_id)
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Ingredient '{ingredient_id}' not found.")
    result = await update_ingredient(ingredient_id, data)
    return result


@router.post("/inventory/{ingredient_id}/adjust")
async def adjust_stock(ingredient_id: str, req: StockAdjustRequest):
    """Perform atomic server-side stock adjustment (+1, +5, -1, etc.) preventing negative quantities."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    existing = await get_ingredient_by_id(ingredient_id)
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Ingredient '{ingredient_id}' not found.")

    updated = await adjust_ingredient_stock(ingredient_id, req.delta)
    return updated


@router.delete("/inventory/{ingredient_id}")
async def remove_ingredient(
    ingredient_id: str,
    force: bool = Query(False, description="Force delete even if ingredient is referenced by recipes")
):
    """Safely delete an ingredient, enforcing referential integrity against registered recipes."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    existing = await get_ingredient_by_id(ingredient_id)
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Ingredient '{ingredient_id}' not found.")

    # Referential integrity check
    if not force:
        in_use = await is_ingredient_in_use(ingredient_id)
        if in_use:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Ingredient '{existing.get('name')}' is currently referenced in one or more recipes. "
                "Remove it from recipes or pass ?force=true to delete anyway."
            )

    deleted = await delete_ingredient(ingredient_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ingredient not found.")
    return {"message": f"Ingredient '{existing.get('name')}' deleted successfully."}
