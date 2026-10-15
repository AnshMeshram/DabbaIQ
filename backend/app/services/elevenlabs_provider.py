"""ElevenLabs Speech-to-Text Integration for DabbaIQ.

Provides voice-to-text processing for kitchen operators recording orders
or preparation notes hands-free in a busy kitchen environment.
Operates strictly server-side behind the ELEVENLABS_API_KEY configuration flag.
"""

import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Supported audio MIME types and extensions
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".webm", ".ogg", ".mp4", ".flac"}
MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit


class ElevenLabsError(Exception):
    """Raised when speech-to-text processing fails."""
    pass


class ElevenLabsProvider:
    """Manages audio transcription via ElevenLabs API."""

    def __init__(self):
        self.api_url = "https://api.elevenlabs.io/v1/speech-to-text"

    @property
    def is_configured(self) -> bool:
        return settings.elevenlabs_available

    def get_status(self) -> Dict[str, Any]:
        """Return provider configuration status without exposing the key."""
        return {
            "configured": self.is_configured,
            "provider": "ElevenLabs",
            "feature": "Speech-to-Text (Voice Kitchen Notes)",
            "message": (
                "ElevenLabs STT is configured and active."
                if self.is_configured
                else "ELEVENLABS_API_KEY not configured. Voice input is disabled."
            ),
        }

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: str = "audio/mpeg",
    ) -> Dict[str, Any]:
        """Transcribe kitchen voice notes using ElevenLabs Speech-to-Text API.

        Args:
            audio_bytes: Raw audio file bytes.
            filename: Original file name.
            content_type: MIME type of audio.

        Returns:
            Dict containing transcript and language details.
        """
        if not self.is_configured:
            raise ElevenLabsError(
                "ElevenLabs integration is not configured. "
                "Please add ELEVENLABS_API_KEY in backend/.env to enable voice transcription."
            )

        if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
            raise ElevenLabsError(
                f"Audio file exceeds maximum allowed size of {MAX_AUDIO_SIZE_BYTES // (1024 * 1024)}MB."
            )

        # Check extension
        import os
        ext = os.path.splitext(filename)[1].lower()
        if ext and ext not in ALLOWED_AUDIO_EXTENSIONS:
            raise ElevenLabsError(
                f"Unsupported audio format '{ext}'. Supported formats: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}"
            )

        headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY,
        }

        try:
            files = {
                "file": (filename, audio_bytes, content_type or "audio/mpeg"),
            }
            data = {
                "model_id": "scribe_v1",
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=headers,
                    data=data,
                    files=files,
                )

                if response.status_code == 401:
                    logger.error("ElevenLabs authentication failed (401)")
                    raise ElevenLabsError(
                        "ElevenLabs authentication failed. Verify ELEVENLABS_API_KEY in backend/.env."
                    )
                elif response.status_code == 429:
                    raise ElevenLabsError(
                        "ElevenLabs rate limit or quota exceeded. Please check your account usage."
                    )
                elif response.status_code != 200:
                    raise ElevenLabsError(
                        f"ElevenLabs API error ({response.status_code}): {response.text[:200]}"
                    )

                result = response.json()
                transcript = result.get("text", "").strip()

                if not transcript:
                    transcript = result.get("transcription", "").strip()

                return {
                    "transcript": transcript,
                    "language": result.get("language_code", "en"),
                    "confidence": result.get("confidence", 1.0),
                }

        except httpx.ConnectError:
            raise ElevenLabsError("Could not connect to ElevenLabs API server.")
        except httpx.TimeoutException:
            raise ElevenLabsError("ElevenLabs transcription timed out after 60s.")
        except ElevenLabsError:
            raise
        except Exception as e:
            logger.error("Unexpected ElevenLabs transcription error: %s", e)
            raise ElevenLabsError(f"Transcription failed: {str(e)}")


elevenlabs_provider = ElevenLabsProvider()
