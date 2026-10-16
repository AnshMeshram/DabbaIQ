"""Test suite verifying the full frontend-to-backend OpenAPI contract.
Ensures every frontend API call maps to a registered FastAPI route.
"""

import pytest
from app.main import app

# List of endpoints invoked by the Next.js frontend (extracted from frontend/lib/api.ts)
FRONTEND_ENDPOINTS = [
    # Health & System Status
    ("GET", "/api/health"),
    ("GET", "/api/ai/status"),
    ("GET", "/api/integrations/status"),
    # Dashboard
    ("GET", "/api/dashboard"),
    # Inventory
    ("GET", "/api/inventory"),
    ("POST", "/api/inventory"),
    ("PATCH", "/api/inventory/{ingredient_id}"),
    ("DELETE", "/api/inventory/{ingredient_id}"),
    # Recipes
    ("GET", "/api/recipes"),
    ("GET", "/api/recipes/{recipe_id}"),
    ("POST", "/api/recipes"),
    ("PATCH", "/api/recipes/{recipe_id}"),
    ("DELETE", "/api/recipes/{recipe_id}"),
    # Sales
    ("GET", "/api/sales"),
    ("POST", "/api/sales"),
    ("PATCH", "/api/sales/{sale_id}"),
    ("DELETE", "/api/sales/{sale_id}"),
    ("POST", "/api/sales/import"),
    # Plans
    ("POST", "/api/plans/generate"),
    ("POST", "/api/plans/{plan_id}/confirm"),
    ("GET", "/api/plans"),
    # Waste
    ("GET", "/api/waste"),
    ("POST", "/api/waste"),
    # Reports
    ("GET", "/api/reports/summary"),
    ("GET", "/api/reports/export"),
    # AI Notes & Menu
    ("POST", "/api/ai/parse-notes"),
    ("POST", "/api/ai/menu-description"),
    # Voice STT
    ("POST", "/api/voice/transcribe"),
    # Fine-Tuning
    ("GET", "/api/training/status"),
    # SerpAPI Market Pricing
    ("POST", "/api/supplier-search"),
    # Tiger Data
    ("POST", "/api/prices/snapshot"),
    ("GET", "/api/prices/history/{ingredient_name}"),
    ("GET", "/api/prices/summary"),
    # Temporal Workflows
    ("POST", "/api/workflows/plan"),
    ("GET", "/api/workflows/{workflow_id}"),
]


def test_openapi_schema_generated():
    """Verify that FastAPI successfully builds a valid OpenAPI JSON schema."""
    schema = app.openapi()
    assert schema is not None
    assert "paths" in schema
    assert schema["info"]["title"] == "DabbaIQ"


def test_every_frontend_endpoint_is_registered_in_fastapi():
    """Verify that every single route invoked by the Next.js frontend exists in the FastAPI routes."""
    openapi_paths = app.openapi()["paths"]

    registered_routes = set()
    for path, methods in openapi_paths.items():
        for method in methods.keys():
            registered_routes.add((method.upper(), path))

    missing_endpoints = []
    for method, path in FRONTEND_ENDPOINTS:
        if (method, path) not in registered_routes:
            missing_endpoints.append(f"{method} {path}")

    assert not missing_endpoints, (
        f"The following frontend API calls do not map to registered FastAPI routes: {missing_endpoints}"
    )


def test_cors_middleware_configuration():
    """Verify CORS middleware is active and allows methods and headers."""
    cors_middleware = next(
        (m for m in app.user_middleware if "CORSMiddleware" in str(m.cls)),
        None
    )
    assert cors_middleware is not None
    assert "http://localhost:3000" in cors_middleware.kwargs["allow_origins"]
