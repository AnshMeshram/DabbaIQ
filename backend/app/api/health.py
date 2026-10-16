"""Health and system diagnostics endpoints for DabbaIQ."""

import logging
from fastapi import APIRouter
from app.core.config import settings
from app.db.connection import check_db_health
from app.db.tiger_data import check_tiger_health
from app.services.ai_provider import ai_provider
from app.services.serpapi_client import serpapi_client
from app.services.elevenlabs_provider import elevenlabs_provider
from app.services.backboard_provider import backboard_provider
from app.services.tinker_training import tinker_provider

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health & Diagnostics"])


@router.get("/health")
async def health_check():
    """Live system health check with verified connectivity without leaking secrets."""
    db_health = await check_db_health()
    tiger_health = await check_tiger_health()
    ai_stat = await ai_provider.check_status()

    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "app_env": settings.APP_ENV,
        "db_connected": db_health["connected"],
        "db_message": db_health["message"],
        "database": db_health["database"],
        "latency_ms": db_health["latency_ms"],
        "ai_available": ai_stat["available"],
        "ai_model": ai_stat["model"],
        "tiger_data": {
            "configured": tiger_health["configured"],
            "connected": tiger_health["connected"],
            "latency_ms": tiger_health["latency_ms"],
        },
        "serpapi_configured": serpapi_client.is_configured,
        "temporal_configured": settings.temporal_available,
        "partners": {
            "elevenlabs": elevenlabs_provider.is_configured,
            "backboard": backboard_provider.is_configured,
            "tinker": tinker_provider.is_configured,
        },
    }


@router.get("/integrations/status")
async def integrations_status():
    """Return status of all core and optional integrations."""
    db_health = await check_db_health()
    tiger_health = await check_tiger_health()
    ai_stat = await ai_provider.check_status()

    return {
        "database": {
            "provider": "MongoDB Atlas",
            "connected": db_health["connected"],
            "status": db_health["status"],
            "message": db_health["message"],
            "database_name": db_health["database"],
            "latency_ms": db_health["latency_ms"],
        },
        "tiger_data": {
            "provider": "Tiger Data (TimescaleDB / PostgreSQL)",
            "configured": tiger_health["configured"],
            "connected": tiger_health["connected"],
            "status": tiger_health["status"],
            "message": tiger_health["message"],
            "latency_ms": tiger_health["latency_ms"],
        },
        "serpapi": {
            "provider": "SerpAPI (Google Shopping & Search)",
            "configured": serpapi_client.is_configured,
            "location": settings.SERPAPI_LOCATION or "India",
            "gl": settings.SERPAPI_GL,
            "hl": settings.SERPAPI_HL,
        },
        "temporal": {
            "provider": "Temporal Workflow Orchestration",
            "configured": settings.temporal_available,
            "address": settings.TEMPORAL_ADDRESS,
            "task_queue": settings.TEMPORAL_TASK_QUEUE,
        },
        "ai": {
            "provider": "Gemma (via Ollama)",
            "available": ai_stat["available"],
            "model": ai_stat["model"],
            "model_loaded": ai_stat.get("model_loaded", False),
            "base_url": ai_stat["base_url"],
            "message": ai_stat["message"],
        },
        "elevenlabs": elevenlabs_provider.get_status(),
        "backboard": backboard_provider.get_status(),
        "tinker": tinker_provider.get_status(),
    }


@router.get("/ai/status")
async def ai_status():
    """Return live status of local/remote Gemma inference service."""
    status = await ai_provider.check_status()
    return status
