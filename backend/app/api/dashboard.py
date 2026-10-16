"""Dashboard aggregation endpoint for DabbaIQ."""

import logging
from datetime import date
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.db.operations import get_dashboard_data

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard")
async def get_dashboard(
    date_param: Optional[str] = Query(None, alias="date", description="Business date in YYYY-MM-DD format")
):
    """Aggregate live operational dashboard metrics for the kitchen business date."""
    try:
        target = date.fromisoformat(date_param) if date_param else date.today()
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD.")

    data = await get_dashboard_data(target)
    return data
