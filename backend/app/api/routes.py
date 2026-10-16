"""Backward-compatibility shim re-exporting the modular api_router.
All route definitions have been refactored into focused modules under app/api/.
"""

from app.api import (
    api_router as router,
    health_router,
    dashboard_router,
    inventory_router,
    recipes_router,
    sales_router,
    planner_router,
    waste_router,
    reports_router,
    suppliers_router,
    integrations_router,
    temporal_router,
)

__all__ = [
    "router",
    "health_router",
    "dashboard_router",
    "inventory_router",
    "recipes_router",
    "sales_router",
    "planner_router",
    "waste_router",
    "reports_router",
    "suppliers_router",
    "integrations_router",
    "temporal_router",
]
