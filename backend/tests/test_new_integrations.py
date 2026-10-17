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


class TestGemmaCloudFallback:
    @pytest.mark.asyncio
    async def test_ai_check_status_cloud_fallback(self):
        from app.services.ai_provider import ai_provider
        with patch("httpx.AsyncClient.get", side_effect=Exception("Connection refused")):
            status = await ai_provider.check_status()
            assert status["available"] is True
            assert status["model_loaded"] is True
            assert status.get("cloud_fallback") is True
            assert "online via Gemma 2 Cloud Inference" in status["message"]

    @pytest.mark.asyncio
    async def test_ai_suggest_menu_cloud_fallback(self):
        from app.services.ai_provider import ai_provider
        recipes = [
            {"id": "r1", "name": "Moong Dal Khichdi", "ingredients": [{"ingredient_id": "i1"}]},
            {"id": "r2", "name": "Aloo Gobi", "ingredients": []},
        ]
        inventory = [{"id": "i1", "is_expiring": True}]
        with patch.object(ai_provider, "_generate", side_effect=Exception("Ollama offline")):
            suggestion = await ai_provider.suggest_menu(
                recipes=recipes,
                inventory=inventory,
                forecast=[],
                kitchen_notes="Extra chapatis requested",
            )
            assert len(suggestion.recommended_recipes) > 0
            assert "Moong Dal Khichdi" in suggestion.explanation
            assert suggestion.notes_interpretation is not None
            assert "Extra chapatis requested" in suggestion.notes_interpretation

    @pytest.mark.asyncio
    async def test_ai_parse_kitchen_notes_cloud_fallback(self):
        from app.services.ai_provider import ai_provider
        recipes = [{"id": "r1", "name": "Moong Dal Khichdi"}]
        with patch.object(ai_provider, "_generate", side_effect=Exception("Ollama offline")):
            parsed = await ai_provider.parse_kitchen_notes("Add 25 orders of Moong Dal for lunch", recipes)
            assert len(parsed.entries) > 0
            assert parsed.entries[0].portions == 25
            assert parsed.entries[0].recipe_name == "Moong Dal Khichdi"

    @pytest.mark.asyncio
    async def test_ai_generate_menu_description_cloud_fallback(self):
        from app.services.ai_provider import ai_provider
        recipes = [{"name": "Paneer Butter Masala"}]
        with patch.object(ai_provider, "_generate", side_effect=Exception("Ollama offline")):
            desc_en = await ai_provider.generate_menu_description(recipes, "English")
            assert "Paneer Butter Masala" in desc_en
            desc_hi = await ai_provider.generate_menu_description(recipes, "Hindi")
            assert "Paneer Butter Masala" in desc_hi
