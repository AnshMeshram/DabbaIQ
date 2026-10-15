"""AI provider module for DabbaIQ — Gemma via Ollama.

This module handles all AI interactions, keeping them separate from
business logic and route handlers. It validates AI outputs against
Pydantic schemas and never fabricates successful responses on failure.
"""

import json
import logging
import httpx
from typing import Optional
from app.core.config import settings
from app.schemas.schemas import AIMenuSuggestion, AIParseResponse
from app.services.prompts import (
    MENU_SUGGESTION_PROMPT,
    KITCHEN_NOTES_PARSE_PROMPT,
    MENU_DESCRIPTION_PROMPT,
)

logger = logging.getLogger(__name__)


class AIProviderError(Exception):
    """Raised when AI inference fails."""
    pass


class AIProvider:
    """Manages communication with the Ollama inference server."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT

    async def check_status(self) -> dict:
        """Check if the Ollama server and configured model are available."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    models = [m.get("name", "") for m in data.get("models", [])]
                    model_available = any(
                        self.model in m or m.startswith(self.model.split(":")[0])
                        for m in models
                    )
                    return {
                        "available": True,
                        "model": self.model,
                        "model_loaded": model_available,
                        "base_url": self.base_url,
                        "available_models": models,
                        "message": (
                            f"Model {self.model} is ready"
                            if model_available
                            else f"Server online but model {self.model} not found. "
                                 f"Available: {', '.join(models) or 'none'}. "
                                 f"Run: ollama pull {self.model}"
                        ),
                    }
                return {
                    "available": False,
                    "model": self.model,
                    "base_url": self.base_url,
                    "message": f"Ollama returned status {resp.status_code}",
                }
        except httpx.ConnectError:
            return {
                "available": False,
                "model": self.model,
                "base_url": self.base_url,
                "message": (
                    f"Cannot connect to Ollama at {self.base_url}. "
                    "Ensure Ollama is running: ollama serve"
                ),
            }
        except Exception as e:
            return {
                "available": False,
                "model": self.model,
                "base_url": self.base_url,
                "message": f"Error checking Ollama: {str(e)}",
            }

    async def _generate(self, prompt: str) -> str:
        """Send a generation request to Ollama and return the text response."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.3,
                            "num_predict": 2048,
                        },
                    },
                )
                if resp.status_code != 200:
                    raise AIProviderError(
                        f"Ollama returned status {resp.status_code}: {resp.text}"
                    )
                data = resp.json()
                return data.get("response", "")
        except httpx.ConnectError:
            raise AIProviderError(
                f"Cannot connect to Ollama at {self.base_url}. Is it running?"
            )
        except httpx.TimeoutException:
            raise AIProviderError(
                f"Ollama request timed out after {self.timeout}s. "
                "The model may still be loading."
            )
        except AIProviderError:
            raise
        except Exception as e:
            raise AIProviderError(f"AI inference error: {str(e)}")

    def _extract_json(self, text: str) -> dict:
        """Extract JSON from model response, handling markdown code blocks."""
        text = text.strip()

        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try extracting from code block
        if "```" in text:
            blocks = text.split("```")
            for block in blocks:
                clean = block.strip()
                if clean.startswith("json"):
                    clean = clean[4:].strip()
                try:
                    return json.loads(clean)
                except json.JSONDecodeError:
                    continue

        # Try finding first { ... }
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                pass

        raise AIProviderError(
            "Could not parse JSON from AI response. Raw response: "
            + text[:500]
        )

    async def suggest_menu(
        self,
        recipes: list[dict],
        inventory: list[dict],
        forecast: list[dict],
        kitchen_notes: str = "",
    ) -> AIMenuSuggestion:
        """Get menu suggestions grounded in actual data."""
        prompt = MENU_SUGGESTION_PROMPT.format(
            recipes_json=json.dumps(recipes, indent=2, default=str),
            inventory_json=json.dumps(inventory, indent=2, default=str),
            forecast_json=json.dumps(forecast, indent=2, default=str),
            kitchen_notes=kitchen_notes or "None provided",
        )

        raw = await self._generate(prompt)
        logger.info("AI menu suggestion response received (%d chars)", len(raw))

        try:
            parsed = self._extract_json(raw)
            suggestion = AIMenuSuggestion(**parsed)
            return suggestion
        except Exception as e:
            logger.error("Failed to parse AI menu suggestion: %s", e)
            raise AIProviderError(
                f"AI returned an invalid response format: {str(e)}"
            )

    async def parse_kitchen_notes(
        self,
        notes_text: str,
        recipes: list[dict],
    ) -> AIParseResponse:
        """Parse messy kitchen notes into structured entries."""
        prompt = KITCHEN_NOTES_PARSE_PROMPT.format(
            recipes_json=json.dumps(
                [{"id": r.get("id"), "name": r.get("name")} for r in recipes],
                indent=2,
            ),
            notes_text=notes_text,
        )

        raw = await self._generate(prompt)
        logger.info("AI notes parse response received (%d chars)", len(raw))

        try:
            parsed = self._extract_json(raw)
            result = AIParseResponse(**parsed)
            return result
        except Exception as e:
            logger.error("Failed to parse AI notes response: %s", e)
            raise AIProviderError(
                f"AI returned an invalid response format: {str(e)}"
            )

    async def generate_menu_description(
        self,
        recipes: list[dict],
        language: str = "English",
    ) -> str:
        """Generate a customer-facing menu description."""
        prompt = MENU_DESCRIPTION_PROMPT.format(
            recipes_json=json.dumps(recipes, indent=2, default=str),
            language=language,
        )

        raw = await self._generate(prompt)
        return raw.strip()


# Module-level singleton
ai_provider = AIProvider()
