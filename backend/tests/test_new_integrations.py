"""Comprehensive tests for SerpAPI price search, Tiger Data time-series, and Temporal workflows."""

import pytest
from unittest.mock import patch, AsyncMock
from app.services.serpapi_client import SerpAPIClient, _parse_numeric_price, _detect_currency
from app.db.tiger_data import check_tiger_health, save_price_snapshot
from app.temporal.client import trigger_planning_workflow, get_workflow_result
from app.temporal.activities import compute_baseline_demand


class TestSerpAPIPriceNormalization:
    def test_parse_rupee_symbol(self):
        assert _parse_numeric_price("₹250") == 250.0
        assert _parse_numeric_price("₹ 1,450.75") == 1450.75

    def test_parse_rs_prefix(self):
        assert _parse_numeric_price("Rs. 80 / kg") == 80.0
        assert _parse_numeric_price("rs 999.00") == 999.0

    def test_missing_or_invalid_price(self):
        assert _parse_numeric_price(None) is None
        assert _parse_numeric_price("") is None
        assert _parse_numeric_price("Contact supplier for price") is None

    def test_detect_currency(self):
        assert _detect_currency("₹250") == "INR"
        assert _detect_currency("Rs. 100") == "INR"
        assert _detect_currency("$12.50") == "USD"
        assert _detect_currency("100 EUR") == "EUR"
        assert _detect_currency(None, default_currency="INR") == "INR"


class TestSerpAPIClient:
    @pytest.mark.asyncio
    async def test_unconfigured_serpapi_returns_graceful_error(self):
        client = SerpAPIClient(api_key="")
        result = await client.search_ingredient_prices("toor dal")
        assert result["configured"] is False
        assert "SERPAPI_API_KEY is not configured" in result["error"]
        assert result["results"] == []

    @pytest.mark.asyncio
    async def test_serpapi_401_auth_failure(self):
        client = SerpAPIClient(api_key="invalid_test_key")
        mock_resp = AsyncMock()
        mock_resp.status_code = 401

        with patch("httpx.AsyncClient.get", AsyncMock(return_value=mock_resp)):
            result = await client.search_ingredient_prices("basmati rice")
            assert result["configured"] is True
            assert "authentication failed" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_serpapi_429_quota_exhausted(self):
        client = SerpAPIClient(api_key="valid_key")
        mock_resp = AsyncMock()
        mock_resp.status_code = 429

        with patch("httpx.AsyncClient.get", AsyncMock(return_value=mock_resp)):
            result = await client.search_ingredient_prices("onion")
            assert "quota exhausted" in result["error"].lower() or "rate limit" in result["error"].lower()


class TestTigerDataIntegration:
    @pytest.mark.asyncio
    async def test_unconfigured_tiger_health(self):
        with patch("app.core.config.settings.TIGER_DATA_DATABASE_URL", None):
            health = await check_tiger_health()
            assert health["configured"] is False
            assert health["connected"] is False
            assert "TIGER_DATA_DATABASE_URL is not set" in health["message"]

    @pytest.mark.asyncio
    async def test_save_price_snapshot_unconfigured_returns_false(self):
        with patch("app.db.tiger_data._pool", None):
            ok = await save_price_snapshot(
                ingredient_name="onion",
                source_name="Market",
                product_title="Fresh Red Onion",
                price_numeric=35.0,
            )
            assert ok is False


class TestTemporalIntegration:
    @pytest.mark.asyncio
    async def test_trigger_workflow_unconfigured_or_offline_fallback(self):
        with patch("app.temporal.client.get_temporal_client", AsyncMock(return_value=None)):
            res = await trigger_planning_workflow("2026-10-16", "lunch")
            assert res["temporal_active"] is False
            assert res["orchestrator"] == "direct_fallback"
            assert "Temporal server is not running" in res["message"]

    @pytest.mark.asyncio
    async def test_get_workflow_result_offline(self):
        with patch("app.temporal.client.get_temporal_client", AsyncMock(return_value=None)):
            res = await get_workflow_result("some-workflow-id")
            assert res["temporal_active"] is False
            assert res["status"] == "UNAVAILABLE"

    @pytest.mark.asyncio
    async def test_compute_baseline_demand_activity(self):
        context = {
            "target_date": "2026-10-16",
            "meal_period": "lunch",
            "sales_history": [],
            "recipes": [
                {"id": "r1", "name": "Dal Tadka", "meal_category": "main"},
                {"id": "r2", "name": "Steamed Rice", "meal_category": "rice"},
            ],
        }
        mock_plan = {
            "recipes": [
                {"recipe_id": "r1", "total_portions": 25},
                {"recipe_id": "r2", "total_portions": 30},
            ],
            "forecasts": [{"recipe_id": "r1", "baseline_forecast": 25}],
            "shopping_list": [],
        }
        with patch("app.temporal.activities.generate_prep_plan", AsyncMock(return_value=mock_plan)):
            res = await compute_baseline_demand(context)
            assert res["target_date"] == "2026-10-16"
            assert "baseline_portions" in res
            assert res["baseline_portions"]["r1"] == 25
