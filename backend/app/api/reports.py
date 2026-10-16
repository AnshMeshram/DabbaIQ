"""Business reporting and streaming CSV export endpoints for DabbaIQ."""

import csv
import io
import logging
from datetime import date
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from app.db.operations import (
    get_report_summary,
    get_sales,
    get_waste,
    get_ingredients,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Reports"])


@router.get("/reports/summary")
async def report_summary(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
):
    """Aggregate financial totals, portion volume, food cost ratios, and meal period breakdowns."""
    try:
        sd = date.fromisoformat(start_date)
        ed = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format. Use YYYY-MM-DD.")

    if sd > ed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "start_date must be before or equal to end_date.")

    summary = await get_report_summary(sd, ed)
    return summary


@router.get("/reports/export")
async def export_report(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    report_type: str = Query("sales", description="Type of report: 'sales', 'waste', or 'inventory'"),
):
    """Generate and stream a formatted CSV export with strict sanitization and proper MIME type."""
    try:
        sd = date.fromisoformat(start_date)
        ed = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format. Use YYYY-MM-DD.")

    output = io.StringIO()
    writer = csv.writer(output)

    rtype = report_type.lower().strip()
    if rtype == "sales":
        writer.writerow(["date", "meal_period", "recipe_name", "portions_sold", "revenue"])
        items = await get_sales(start_date=sd, end_date=ed)
        for s in items:
            writer.writerow([
                s.get("date", ""),
                s.get("meal_period", ""),
                s.get("recipe_name", ""),
                s.get("portions_sold", 0),
                s.get("revenue", ""),
            ])
    elif rtype == "waste":
        writer.writerow([
            "date", "meal_period", "recipe_name",
            "portions_prepared", "portions_sold", "leftover_portions",
            "estimated_waste_cost", "reason"
        ])
        items = await get_waste(start_date=sd, end_date=ed)
        for w in items:
            writer.writerow([
                w.get("date", ""),
                w.get("meal_period", ""),
                w.get("recipe_name", ""),
                w.get("portions_prepared", 0),
                w.get("portions_sold", 0),
                w.get("leftover_portions", 0),
                w.get("estimated_waste_cost", 0.0),
                w.get("reason", ""),
            ])
    elif rtype == "inventory":
        writer.writerow(["name", "category", "quantity", "unit", "cost_per_unit", "reorder_level", "expiry_date"])
        items = await get_ingredients()
        for i in items:
            writer.writerow([
                i.get("name", ""),
                i.get("category", ""),
                i.get("quantity", 0.0),
                i.get("unit", ""),
                i.get("cost_per_unit", 0.0),
                i.get("reorder_level", 0.0),
                i.get("expiry_date", ""),
            ])
    else:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid report_type. Supported types: 'sales', 'waste', 'inventory'.")

    output.seek(0)
    filename = f"dabbaiq_{rtype}_{start_date}_{end_date}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
