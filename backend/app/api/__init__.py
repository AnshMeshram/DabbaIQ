"""DabbaIQ API package.
Combines all modular routers into a unified api_router.
"""

from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.dashboard import router as dashboard_router
from app.api.inventory import router as inventory_router
from app.api.recipes import router as recipes_router
from app.api.sales import router as sales_router
from app.api.planner import router as planner_router
from app.api.waste import router as waste_router
from app.api.reports import router as reports_router
from app.api.suppliers import router as suppliers_router
from app.api.integrations import router as integrations_router
from app.api.temporal import router as temporal_router

api_router = APIRouter()

# Include all modular routers exactly once
api_router.include_router(health_router)
api_router.include_router(dashboard_router)
api_router.include_router(inventory_router)
api_router.include_router(recipes_router)
api_router.include_router(sales_router)
api_router.include_router(planner_router)
api_router.include_router(waste_router)
api_router.include_router(reports_router)
api_router.include_router(suppliers_router)
api_router.include_router(integrations_router)
api_router.include_router(temporal_router)

# Alias for backward compatibility
router = api_router

__all__ = [
    "api_router",
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
