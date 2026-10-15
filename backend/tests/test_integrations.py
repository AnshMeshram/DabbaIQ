"""Tests for DabbaIQ environment configuration, database diagnostics, and partner integrations."""

import pytest
import os
from unittest.mock import patch, AsyncMock, PropertyMock
from app.core.config import Settings
from app.db.connection import check_db_health
from app.services.elevenlabs_provider import elevenlabs_provider, ElevenLabsError, MAX_AUDIO_SIZE_BYTES
from app.services.backboard_provider import backboard_provider
from app.services.tinker_training import tinker_provider


class TestEnvironmentConfig:
    def test_default_config_values(self):
        s = Settings()
        assert s.APP_NAME == "DabbaIQ"
        assert s.AI_PROVIDER == "ollama"
        assert s.OLLAMA_MODEL == "gemma3:4b"
        assert "http://localhost:3000" in s.cors_origins_list

    def test_database_name_fallback(self):
        s = Settings(MONGODB_DATABASE="custom_dabba")
        assert s.database_name == "custom_dabba"

    def test_frontend_origin_in_cors(self):
        s = Settings(FRONTEND_ORIGIN="https://mykitchen.com")
        assert "https://mykitchen.com" in s.cors_origins_list

    def test_unconfigured_partners_are_falsy(self):
        s = Settings(
            ELEVENLABS_API_KEY="",
            BACKBOARD_API_KEY="",
            TINKER_API_KEY="",
        )
        assert s.elevenlabs_available is False
        assert s.backboard_available is False
        assert s.tinker_available is False


class TestDatabaseDiagnostics:
    @pytest.mark.asyncio
    async def test_unconfigured_db_health(self):
        with patch("app.core.config.settings.MONGODB_URI", None):
            health = await check_db_health()
            assert health["connected"] is False
            assert health["status"] == "unconfigured"
            assert "MONGODB_URI not configured" in health["message"]

    @pytest.mark.asyncio
    async def test_healthy_db_ping(self):
        mock_client = AsyncMock()
        mock_client.admin.command.return_value = {"ok": 1}
        mock_db = AsyncMock()

        with patch("app.db.connection._client", mock_client), \
             patch("app.db.connection._db", mock_db), \
             patch("app.core.config.settings.MONGODB_URI", "mongodb+srv://test:test@cluster.net"):
            health = await check_db_health()
            assert health["connected"] is True
            assert health["status"] == "healthy"
            assert health["latency_ms"] is not None


class TestPartnerIntegrations:
    def test_elevenlabs_unconfigured_status(self):
        with patch("app.core.config.settings.ELEVENLABS_API_KEY", None):
            status = elevenlabs_provider.get_status()
            assert status["configured"] is False
            assert "ELEVENLABS_API_KEY not configured" in status["message"]

    @pytest.mark.asyncio
    async def test_elevenlabs_audio_size_limit(self):
        large_audio = b"0" * (MAX_AUDIO_SIZE_BYTES + 100)
        with patch("app.core.config.settings.ELEVENLABS_API_KEY", "test-key-123"):
            with pytest.raises(ElevenLabsError, match="exceeds maximum allowed size"):
                await elevenlabs_provider.transcribe_audio(large_audio, "recording.mp3")

    def test_backboard_status(self):
        with patch("app.core.config.settings.BACKBOARD_API_KEY", None):
            status = backboard_provider.get_status()
            assert status["configured"] is False
            assert "BACKBOARD_API_KEY not configured" in status["message"]

    def test_tinker_status(self):
        with patch("app.core.config.settings.TINKER_API_KEY", None):
            status = tinker_provider.get_status()
            assert status["configured"] is False
            assert "TINKER_API_KEY not configured" in status["message"]
