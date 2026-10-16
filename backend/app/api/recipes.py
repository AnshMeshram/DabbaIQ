"""Recipe library and dynamic portion costing endpoints for DabbaIQ."""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.db.connection import is_connected
from app.db.operations import (
    create_recipe,
    get_recipes,
    get_recipe_by_id,
    update_recipe,
    delete_recipe,
    get_ingredient_by_id,
    is_recipe_in_use,
    calculate_recipe_requirements,
)
from app.schemas.schemas import (
    RecipeCreate,
    RecipeUpdate,
    RecipeRequirementsResponse,
    units_compatible,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Recipes"])


@router.get("/recipes")
async def list_recipes(meal_category: Optional[str] = Query(None, description="Filter by meal category")):
    """List registered recipes with real-time per-portion ingredient costs."""
    items = await get_recipes(meal_category=meal_category)
    return {"items": items, "count": len(items)}


@router.get("/recipes/{recipe_id}")
async def get_single_recipe(recipe_id: str):
    """Retrieve details and bill-of-materials for a single recipe."""
    recipe = await get_recipe_by_id(recipe_id)
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Recipe '{recipe_id}' not found.")
    return recipe


@router.post("/recipes", status_code=status.HTTP_201_CREATED)
async def add_recipe(data: RecipeCreate):
    """Register a new recipe, verifying ingredient existence and unit compatibility."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")

    # Referential validation: ensure each ingredient exists and units are compatible
    for ing in data.ingredients:
        stored = await get_ingredient_by_id(ing.ingredient_id)
        if not stored:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Referenced ingredient ID '{ing.ingredient_id}' does not exist in inventory."
            )
        stored_unit = stored.get("unit", "")
        if stored_unit and ing.unit and not units_compatible(ing.unit.value, stored_unit):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Incompatible unit '{ing.unit.value}' for ingredient '{stored.get('name')}' (stock unit is '{stored_unit}')."
            )

    try:
        result = await create_recipe(data)
        return result
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise HTTPException(status.HTTP_409_CONFLICT, f"Recipe '{data.name}' already exists.")
        logger.error("Failed to create recipe: %s", e)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))


@router.patch("/recipes/{recipe_id}")
async def patch_recipe(recipe_id: str, data: RecipeUpdate):
    """Update fields or bill-of-materials on an existing recipe."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    existing = await get_recipe_by_id(recipe_id)
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Recipe '{recipe_id}' not found.")

    # If ingredients are modified, validate references
    if data.ingredients is not None:
        for ing in data.ingredients:
            stored = await get_ingredient_by_id(ing.ingredient_id)
            if not stored:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"Referenced ingredient ID '{ing.ingredient_id}' does not exist in inventory."
                )
            stored_unit = stored.get("unit", "")
            if stored_unit and ing.unit and not units_compatible(ing.unit.value, stored_unit):
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"Incompatible unit '{ing.unit.value}' for ingredient '{stored.get('name')}' (stock unit is '{stored_unit}')."
                )

    result = await update_recipe(recipe_id, data)
    return result


@router.delete("/recipes/{recipe_id}")
async def remove_recipe(
    recipe_id: str,
    force: bool = Query(False, description="Force delete even if recipe is in historical sales/plans")
):
    """Safely delete a recipe, protecting historical sales and plans from orphaned references."""
    if not is_connected():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not connected.")
    existing = await get_recipe_by_id(recipe_id)
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Recipe '{recipe_id}' not found.")

    if not force:
        in_use = await is_recipe_in_use(recipe_id)
        if in_use:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Recipe '{existing.get('name')}' is referenced in historical sales records or preparation plans. "
                "Pass ?force=true to delete anyway."
            )

    deleted = await delete_recipe(recipe_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recipe not found.")
    return {"message": f"Recipe '{existing.get('name')}' deleted successfully."}


@router.post("/recipes/{recipe_id}/requirements", response_model=RecipeRequirementsResponse)
async def get_recipe_requirements(recipe_id: str, portions: int = Query(..., gt=0, description="Target portion count")):
    """Calculate exact ingredient requirements, inventory shortages, and total cost for given portions."""
    res = await calculate_recipe_requirements(recipe_id, portions)
    if not res:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Recipe '{recipe_id}' not found.")
    return res
