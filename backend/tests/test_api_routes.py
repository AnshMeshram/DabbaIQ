"""Comprehensive automated endpoint and integration tests for all DabbaIQ backend routes."""

import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.schemas import MealPeriod, Unit

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════════
# 1. Health & Root Endpoints
# ═══════════════════════════════════════════════════════════════════

class TestHealthAndRootEndpoints:
    def test_root_endpoint(self):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["app"] == "DabbaIQ"
        assert "version" in data
        assert data["api_docs"] == "/docs"

    def test_health_check(self):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "db_connected" in data
        assert "tiger_data" in data
        assert "serpapi_configured" in data
        assert "temporal_configured" in data

    def test_integrations_status(self):
        resp = client.get("/api/integrations/status")
        assert resp.status_code == 200
        data = resp.json()
        for key in ["database", "tiger_data", "serpapi", "temporal", "ai"]:
            assert key in data

    def test_ai_status(self):
        resp = client.get("/api/ai/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "available" in data
        assert "model" in data


# ═══════════════════════════════════════════════════════════════════
# 2. Inventory Endpoints
# ═══════════════════════════════════════════════════════════════════

class TestInventoryEndpoints:
    def test_list_inventory(self):
        resp = client.get("/api/inventory")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "count" in data
        assert isinstance(data["items"], list)

    def test_list_inventory_with_filters(self):
        resp = client.get("/api/inventory?category=grains&low_stock=true&q=rice")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data

    def test_get_single_ingredient_not_found(self):
        with patch("app.api.inventory.get_ingredient_by_id", AsyncMock(return_value=None)):
            resp = client.get("/api/inventory/000000000000000000000000")
            assert resp.status_code == 404

    def test_get_single_ingredient_success(self):
        mock_item = {
            "id": "ing-123",
            "name": "toor dal",
            "category": "pulses",
            "quantity": 10.0,
            "unit": "kg",
            "cost_per_unit": 140.0,
        }
        with patch("app.api.inventory.get_ingredient_by_id", AsyncMock(return_value=mock_item)):
            resp = client.get("/api/inventory/ing-123")
            assert resp.status_code == 200
            assert resp.json()["name"] == "toor dal"

    def test_create_ingredient_validation_error(self):
        # Negative quantity must be rejected
        payload = {
            "name": "salt",
            "category": "spices",
            "quantity": -5.0,
            "unit": "kg",
            "cost_per_unit": 20.0,
        }
        resp = client.post("/api/inventory", json=payload)
        assert resp.status_code == 422

    def test_create_ingredient_success(self):
        payload = {
            "name": "test cumin",
            "category": "spices",
            "quantity": 2.5,
            "unit": "kg",
            "cost_per_unit": 250.0,
        }
        mock_res = {**payload, "id": "ing-cumin-1"}
        with patch("app.api.inventory.is_connected", return_value=True), \
             patch("app.api.inventory.create_ingredient", AsyncMock(return_value=mock_res)):
            resp = client.post("/api/inventory", json=payload)
            assert resp.status_code == 201
            assert resp.json()["name"] == "test cumin"

    def test_adjust_stock_success(self):
        mock_res = {"id": "ing-123", "name": "onion", "quantity": 15.0}
        with patch("app.api.inventory.is_connected", return_value=True), \
             patch("app.api.inventory.get_ingredient_by_id", AsyncMock(return_value={"id": "ing-123", "quantity": 10.0})), \
             patch("app.api.inventory.adjust_ingredient_stock", AsyncMock(return_value=mock_res)):
            resp = client.post("/api/inventory/ing-123/adjust", json={"delta": 5.0})
            assert resp.status_code == 200
            assert resp.json()["quantity"] == 15.0

    def test_delete_ingredient_referential_integrity(self):
        # Ingredient is referenced in a recipe, deletion rejected with 409
        with patch("app.api.inventory.is_connected", return_value=True), \
             patch("app.api.inventory.get_ingredient_by_id", AsyncMock(return_value={"id": "ing-dal", "name": "toor dal"})), \
             patch("app.api.inventory.is_ingredient_in_use", AsyncMock(return_value=True)):
            resp = client.delete("/api/inventory/ing-dal")
            assert resp.status_code == 409
            assert "referenced in one or more recipes" in resp.json()["detail"]

    def test_delete_ingredient_force(self):
        with patch("app.api.inventory.is_connected", return_value=True), \
             patch("app.api.inventory.get_ingredient_by_id", AsyncMock(return_value={"id": "ing-dal", "name": "toor dal"})), \
             patch("app.api.inventory.delete_ingredient", AsyncMock(return_value=True)):
            resp = client.delete("/api/inventory/ing-dal?force=true")
            assert resp.status_code == 200
            assert "deleted successfully" in resp.json()["message"]


# ═══════════════════════════════════════════════════════════════════
# 3. Recipe Endpoints
# ═══════════════════════════════════════════════════════════════════

class TestRecipeEndpoints:
    def test_list_recipes(self):
        resp = client.get("/api/recipes")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "count" in data

    def test_get_single_recipe_not_found(self):
        with patch("app.api.recipes.get_recipe_by_id", AsyncMock(return_value=None)):
            resp = client.get("/api/recipes/000000000000000000000000")
            assert resp.status_code == 404

    def test_create_recipe_missing_ingredient(self):
        payload = {
            "name": "Dal Tadka",
            "meal_category": "main",
            "ingredients": [
                {"ingredient_id": "nonexistent-id", "quantity_per_portion": 0.1, "unit": "kg"}
            ],
        }
        with patch("app.api.recipes.is_connected", return_value=True), \
             patch("app.api.recipes.get_ingredient_by_id", AsyncMock(return_value=None)):
            resp = client.post("/api/recipes", json=payload)
            assert resp.status_code == 400
            assert "does not exist in inventory" in resp.json()["detail"]

    def test_create_recipe_incompatible_unit(self):
        payload = {
            "name": "Dal Tadka",
            "meal_category": "main",
            "ingredients": [
                {"ingredient_id": "ing-1", "quantity_per_portion": 0.1, "unit": "L"}
            ],
        }
        # Stock unit is kg, recipe tries to use L (incompatible)
        mock_stock = {"id": "ing-1", "name": "toor dal", "unit": "kg"}
        with patch("app.api.recipes.is_connected", return_value=True), \
             patch("app.api.recipes.get_ingredient_by_id", AsyncMock(return_value=mock_stock)):
            resp = client.post("/api/recipes", json=payload)
            assert resp.status_code == 400
            assert "Incompatible unit" in resp.json()["detail"]

    def test_recipe_requirements_calculation(self):
        mock_reqs = {
            "recipe_id": "rec-1",
            "recipe_name": "Dal Tadka",
            "portions": 25,
            "estimated_total_cost": 350.0,
            "estimated_cost_per_portion": 14.0,
            "ingredients": [
                {
                    "ingredient_id": "ing-dal",
                    "ingredient_name": "toor dal",
                    "required_qty": 2.5,
                    "available_qty": 2.0,
                    "shortage_qty": 0.5,
                    "unit": "kg",
                    "estimated_cost": 350.0,
                }
            ],
        }
        with patch("app.api.recipes.calculate_recipe_requirements", AsyncMock(return_value=mock_reqs)):
            resp = client.post("/api/recipes/rec-1/requirements?portions=25")
            assert resp.status_code == 200
            data = resp.json()
            assert data["portions"] == 25
            assert data["estimated_total_cost"] == 350.0
            assert len(data["ingredients"]) == 1


# ═══════════════════════════════════════════════════════════════════
# 4. Sales Endpoints
# ═══════════════════════════════════════════════════════════════════

class TestSalesEndpoints:
    def test_list_sales(self):
        resp = client.get("/api/sales")
        assert resp.status_code == 200
        assert "items" in resp.json()

    def test_list_sales_invalid_date(self):
        resp = client.get("/api/sales?start_date=invalid-date")
        assert resp.status_code == 400

    def test_get_single_sale_not_found(self):
        with patch("app.api.sales.get_sale_by_id", AsyncMock(return_value=None)):
            resp = client.get("/api/sales/000000000000000000000000")
            assert resp.status_code == 404

    def test_create_sale_recipe_not_found(self):
        payload = {
            "date": "2026-10-16",
            "meal_period": "lunch",
            "recipe_id": "nonexistent-recipe",
            "portions_sold": 10,
            "revenue": 800.0,
        }
        with patch("app.api.sales.is_connected", return_value=True), \
             patch("app.api.sales.get_recipe_by_id", AsyncMock(return_value=None)):
            resp = client.post("/api/sales", json=payload)
            assert resp.status_code == 404

    def test_import_sales_csv_non_csv(self):
        files = {"file": ("test.txt", b"plain text", "text/plain")}
        with patch("app.api.sales.is_connected", return_value=True):
            resp = client.post("/api/sales/import", files=files)
            assert resp.status_code == 400
            assert "File must be a .csv file" in resp.json()["detail"]

    def test_import_sales_csv_missing_columns(self):
        bad_csv = b"foo,bar,baz\n1,2,3"
        files = {"file": ("sales.csv", bad_csv, "text/csv")}
        with patch("app.api.sales.is_connected", return_value=True):
            resp = client.post("/api/sales/import", files=files)
            assert resp.status_code == 400
            assert "must contain 'date', 'meal_period', and 'portions_sold'" in resp.json()["detail"]


# ═══════════════════════════════════════════════════════════════════
# 5. Waste Endpoints
# ═══════════════════════════════════════════════════════════════════

class TestWasteEndpoints:
    def test_list_waste(self):
        resp = client.get("/api/waste")
        assert resp.status_code == 200
        assert "items" in resp.json()

    def test_create_waste_sold_exceeds_prepared(self):
        # 422 raised by schema validator or 400 by route
        payload = {
            "date": "2026-10-16",
            "meal_period": "lunch",
            "recipe_id": "rec-1",
            "portions_prepared": 10,
            "portions_sold": 15,
        }
        resp = client.post("/api/waste", json=payload)
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════════════
# 6. Dashboard Endpoints
# ═══════════════════════════════════════════════════════════════════

class TestDashboardEndpoints:
    def test_dashboard_today(self):
        resp = client.get("/api/dashboard")
        assert resp.status_code == 200
        data = resp.json()
        assert "date" in data
        assert "expected_portions" in data
        assert "recorded_sales" in data
        assert "sales_chart_data" in data

    def test_dashboard_invalid_date(self):
        resp = client.get("/api/dashboard?date=not-a-valid-date")
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════
# 7. Reports Endpoints
# ═══════════════════════════════════════════════════════════════════

class TestReportsEndpoints:
    def test_report_summary_invalid_range(self):
        resp = client.get("/api/reports/summary?start_date=2026-10-20&end_date=2026-10-10")
        assert resp.status_code == 400

    def test_export_report_csv_sales(self):
        resp = client.get("/api/reports/export?start_date=2026-10-01&end_date=2026-10-15&report_type=sales")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers["content-type"]
        assert "attachment; filename=" in resp.headers["content-disposition"]

    def test_export_report_invalid_type(self):
        resp = client.get("/api/reports/export?start_date=2026-10-01&end_date=2026-10-15&report_type=unknown")
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════
# 8. Planner Endpoints
# ═══════════════════════════════════════════════════════════════════

class TestPlannerEndpoints:
    def test_list_plans(self):
        resp = client.get("/api/plans")
        assert resp.status_code == 200
        assert "items" in resp.json()

    def test_get_single_plan_not_found(self):
        with patch("app.api.planner.get_plan_by_id", AsyncMock(return_value=None)):
            resp = client.get("/api/plans/000000000000000000000000")
            assert resp.status_code == 404

    def test_confirm_plan_idempotent(self):
        mock_plan = {
            "id": "plan-1",
            "is_confirmed": True,
            "already_confirmed": True,
        }
        with patch("app.api.planner.is_connected", return_value=True), \
             patch("app.api.planner.confirm_plan", AsyncMock(return_value=mock_plan)):
            resp = client.post("/api/plans/plan-1/confirm")
            assert resp.status_code == 200
            assert resp.json()["already_confirmed"] is True


# ═══════════════════════════════════════════════════════════════════
# 9. Suppliers & Integrations Endpoints
# ═══════════════════════════════════════════════════════════════════

class TestSuppliersAndIntegrationsEndpoints:
    def test_supplier_search_endpoint(self):
        mock_res = {
            "configured": True,
            "query": "toor dal",
            "results": [],
            "cached": True,
        }
        with patch("app.services.serpapi_client.serpapi_client.search_ingredient_prices", AsyncMock(return_value=mock_res)):
            resp = client.post("/api/supplier-search", json={"ingredient_name": "toor dal"})
            assert resp.status_code == 200
            assert resp.json()["configured"] is True

    def test_price_snapshot_unconfigured(self):
        with patch("app.core.config.settings.TIGER_DATA_DATABASE_URL", None):
            resp = client.post("/api/prices/snapshot", json={
                "ingredient_name": "onion",
                "source_name": "Market",
                "product_title": "Red Onion",
                "price_numeric": 40.0,
            })
            assert resp.status_code == 503

    def test_price_history_endpoint(self):
        with patch("app.core.config.settings.TIGER_DATA_DATABASE_URL", None):
            resp = client.get("/api/prices/history/onion")
            assert resp.status_code == 200
            assert resp.json()["configured"] is False

    def test_training_status_endpoint(self):
        resp = client.get("/api/training/status")
        assert resp.status_code == 200
        assert "configured" in resp.json()

    def test_temporal_workflows_plan(self):
        mock_res = {
            "orchestrator": "direct_fallback",
            "temporal_active": False,
            "workflow_id": "test-wf-123",
            "message": "Fallback",
        }
        with patch("app.api.temporal.trigger_planning_workflow", AsyncMock(return_value=mock_res)):
            resp = client.post("/api/workflows/plan", json={"target_date": "2026-10-17", "meal_period": "lunch"})
            assert resp.status_code == 200
            assert resp.json()["workflow_id"] == "test-wf-123"
