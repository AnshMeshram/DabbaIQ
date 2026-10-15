"""Backboard Integration for DabbaIQ (Optional).

Enables persistent assistant threads for kitchen operational notes and multi-turn
conversational planning without replacing Gemma or duplicating MongoDB.
Operates server-side behind the BACKBOARD_API_KEY flag.
"""

import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class BackboardProvider:
    """Manages optional Backboard assistant integration."""

    @property
    def is_configured(self) -> bool:
        return settings.backboard_available

    def get_status(self) -> Dict[str, Any]:
        return {
            "configured": self.is_configured,
            "provider": "Backboard",
            "feature": "Persistent Operational Assistant Threads",
            "message": (
                "Backboard thread persistence is configured."
                if self.is_configured
                else "BACKBOARD_API_KEY not configured. Feature disabled gracefully."
            ),
        }


backboard_provider = BackboardProvider()
