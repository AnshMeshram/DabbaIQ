"""Test suite verifying the full frontend-to-backend OpenAPI contract.
Ensures every frontend API call maps to a registered FastAPI route.
"""

import pytest
from starlette.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

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
    """Verify CORS middleware is active and explicitly configured."""
    cors_middleware = next(
        (m for m in app.user_middleware if "CORSMiddleware" in str(m.cls)),
        None
    )
    assert cors_middleware is not None
    assert "https://dabba-iq.vercel.app" in cors_middleware.kwargs["allow_origins"]
    assert "http://localhost:3000" in cors_middleware.kwargs["allow_origins"]
    assert cors_middleware.kwargs["allow_credentials"] is True
    assert "GET" in cors_middleware.kwargs["allow_methods"]
    assert "POST" in cors_middleware.kwargs["allow_methods"]
    assert "PATCH" in cors_middleware.kwargs["allow_methods"]
    assert "DELETE" in cors_middleware.kwargs["allow_methods"]


def test_cors_preflight_production_vercel_origin_health(client):
    """Verify OPTIONS preflight on /api/health succeeds for production Vercel frontend."""
    res = client.options(
        "/api/health",
        headers={
            "Origin": "https://dabba-iq.vercel.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://dabba-iq.vercel.app"
    assert res.headers.get("access-control-allow-credentials") == "true"
    assert "GET" in res.headers.get("access-control-allow-methods", "")


def test_cors_preflight_production_vercel_origin_ai_status(client):
    """Verify OPTIONS preflight on /api/ai/status succeeds for production Vercel frontend."""
    res = client.options(
        "/api/ai/status",
        headers={
            "Origin": "https://dabba-iq.vercel.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://dabba-iq.vercel.app"


def test_cors_preflight_production_vercel_origin_dashboard(client):
    """Verify OPTIONS preflight on /api/dashboard with query params succeeds for production Vercel frontend."""
    res = client.options(
        "/api/dashboard?date=2026-10-17",
        headers={
            "Origin": "https://dabba-iq.vercel.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://dabba-iq.vercel.app"


def test_cors_preflight_post_methods_and_custom_headers(client):
    """Verify OPTIONS preflight on POST endpoint with multiple headers succeeds."""
    res = client.options(
        "/api/inventory",
        headers={
            "Origin": "https://dabba-iq.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type, Authorization, Accept",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://dabba-iq.vercel.app"
    assert "POST" in res.headers.get("access-control-allow-methods", "")


def test_cors_preflight_patch_and_delete_methods(client):
    """Verify OPTIONS preflight on PATCH and DELETE operations."""
    for method in ["PATCH", "DELETE"]:
        res = client.options(
            "/api/inventory/item-123",
            headers={
                "Origin": "https://dabba-iq.vercel.app",
                "Access-Control-Request-Method": method,
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        assert res.status_code == 200
        assert res.headers.get("access-control-allow-origin") == "https://dabba-iq.vercel.app"


def test_cors_preflight_rejected_for_unauthorized_origin(client):
    """Verify OPTIONS preflight strictly rejects unauthorized origins with 400 Bad Request."""
    res = client.options(
        "/api/health",
        headers={
            "Origin": "https://malicious-attacker-domain.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.status_code == 400
    assert "Disallowed CORS origin" in res.text


def test_cors_preflight_rejected_for_disallowed_method(client):
    """Verify OPTIONS preflight strictly rejects disallowed methods."""
    res = client.options(
        "/api/health",
        headers={
            "Origin": "https://dabba-iq.vercel.app",
            "Access-Control-Request-Method": "TRACE",
        },
    )
    assert res.status_code == 400
    assert "Disallowed CORS method" in res.text
