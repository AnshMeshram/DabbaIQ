"""Food waste and spoilage tracking endpoints for DabbaIQ."""

import logging
from datetime import date
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.db.connection import is_connected
from app.db.operations import (
    create_waste,
    get_waste,
    get_waste_by_id,
    update_waste,
    delete_waste,
    get_recipe_by_id,
)
from app.schemas.schemas import WasteCreate, WasteUpdate

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Waste Tracker"])


@router.get("/waste")
async def list_waste(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    recipe_id: Optional[str] = Query(None, description="Filter by recipe ID"),
):
    """List recorded food waste and leftover records."""
    try:
        sd = date.fromisoformat(start_date) if start_date else None
        ed = date.fromisoformat(end_date) if end_date else None
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format. Use YYYY-MM-DD.")

    items = await get_waste(start_date=sd, end_date=ed, recipe_id=recipe_id)
    return {"items": items, "count": len(items)}


@router.get("/waste/{waste_id}")
async def get_single_waste(waste_id: str):
    """Retrieve details for a single waste entry."""
    entry = await get_waste_by_id(waste_id)
    if not entry:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Waste record '{waste_id}' not found.")
    return entry


@router.post("/waste", status_code=status.HTTP_201_CREATED)
async def add_waste(data: WasteCreate):
    """Log food waste / leftover portions with internal consistency validation (sold <= prepared)."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")

    if data.portions_sold > data.portions_prepared:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Portions sold ({data.portions_sold}) cannot exceed portions prepared ({data.portions_prepared})."
        )

    recipe = await get_recipe_by_id(data.recipe_id)
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Recipe '{data.recipe_id}' not found.")

    result = await create_waste(data)
    return result


@router.patch("/waste/{waste_id}")
async def patch_waste(waste_id: str, data: WasteUpdate):
    """Update fields on an existing waste record."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    existing = await get_waste_by_id(waste_id)
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Waste record '{waste_id}' not found.")

    if data.recipe_id:
        recipe = await get_recipe_by_id(data.recipe_id)
        if not recipe:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Recipe '{data.recipe_id}' not found.")

    result = await update_waste(waste_id, data)
    return result


@router.delete("/waste/{waste_id}")
async def remove_waste(waste_id: str):
    """Delete a waste record."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    deleted = await delete_waste(waste_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Waste record '{waste_id}' not found.")
    return {"message": "Waste record deleted successfully."}
