"""Suppliers and market pricing endpoints via SerpAPI."""

import logging
from fastapi import APIRouter
from app.schemas.schemas import SupplierSearchRequest, SupplierSearchResponse
from app.services.serpapi_client import serpapi_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Suppliers & Market Pricing"])


@router.post("/supplier-search", response_model=SupplierSearchResponse)
async def search_suppliers(req: SupplierSearchRequest):
    """Search online wholesale and grocery supplier market prices via SerpAPI.
    Uses Google Shopping with Google Search fallback and 30-min in-memory caching.
    """
    result = await serpapi_client.search_ingredient_prices(
        ingredient_name=req.ingredient_name,
        package_quantity=req.package_quantity,
        package_unit=req.package_unit,
        location=req.location,
    )
    return result
