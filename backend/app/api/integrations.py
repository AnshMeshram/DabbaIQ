"""Integrations router for Tiger Data, Gemma AI, ElevenLabs STT, and Tinker."""

import logging
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, status
from app.core.config import settings
from app.db.operations import get_recipes
from app.schemas.schemas import PriceSnapshotSaveRequest
from app.db.tiger_data import (
    save_price_snapshot,
    get_historical_prices,
    get_price_analytics_summary,
)
from app.services.ai_provider import ai_provider, AIProviderError
from app.services.elevenlabs_provider import elevenlabs_provider, ElevenLabsError
from app.services.tinker_training import tinker_provider

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Integrations & Advanced Services"])


# ─── Tiger Data (TimescaleDB) Price Snapshots & Time-Series Analytics ──────

@router.post("/prices/snapshot")
async def record_price_snapshot(req: PriceSnapshotSaveRequest):
    """Record an observed supplier price snapshot into Tiger Data Timescale hypertable."""
    if not settings.tiger_data_available:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Tiger Data is not configured. Set TIGER_DATA_DATABASE_URL in backend/.env to record price snapshots."
        )

    ok = await save_price_snapshot(
        ingredient_name=req.ingredient_name,
        source_name=req.source_name,
        product_title=req.product_title,
        price_numeric=req.price_numeric,
        currency=req.currency,
        original_price_text=req.original_price_text,
        source_url=req.source_url,
        query_text=req.query_text,
        ingredient_id=req.ingredient_id,
    )
    if not ok:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to persist price snapshot to Tiger Data.")

    return {
        "status": "saved",
        "ingredient": req.ingredient_name,
        "price": req.price_numeric,
        "currency": req.currency,
        "message": "Price observation recorded in Tiger Data hypertable.",
    }


@router.get("/prices/history/{ingredient_name}")
async def get_price_history(
    ingredient_name: str,
    days: int = Query(60, ge=1, le=365, description="Lookback window in days")
):
    """Get time-series historical price observations for an ingredient from Tiger Data."""
    if not settings.tiger_data_available:
        return {
            "configured": False,
            "ingredient_name": ingredient_name,
            "days": days,
            "history": [],
            "message": "Tiger Data unconfigured. Set TIGER_DATA_DATABASE_URL to enable price charts.",
        }

    history = await get_historical_prices(ingredient_name=ingredient_name, days=days)
    return {
        "configured": True,
        "ingredient_name": ingredient_name,
        "days": days,
        "history": history,
    }


@router.get("/prices/summary")
async def get_price_summary():
    """Get aggregated time-series planning metrics and price trends across all ingredients."""
    return await get_price_analytics_summary()


# ─── AI Endpoints (Gemma via Ollama) ─────────────────────────────────────────

@router.post("/ai/parse-notes")
async def parse_kitchen_notes(body: dict):
    """Parse messy kitchen notes into structured candidate entries for operator confirmation."""
    notes = body.get("notes", "")
    if not notes or not notes.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No notes text provided.")

    recipes = await get_recipes()

    try:
        result = await ai_provider.parse_kitchen_notes(notes, recipes)
        return {
            "parsed": result.model_dump(),
            "requires_confirmation": True,
            "message": "Review the parsed entries below and confirm before saving.",
        }
    except AIProviderError as e:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            f"AI service unavailable: {str(e)}. You can still record sales manually.",
        )


@router.post("/ai/menu-description")
async def generate_menu_desc(body: dict):
    """Generate a customer-facing menu description for daily specials."""
    recipe_ids = body.get("recipe_ids", [])
    language = body.get("language", "English")

    if not recipe_ids:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No recipe IDs provided.")

    from app.db.operations import get_recipe_by_id
    recipes = []
    for rid in recipe_ids:
        r = await get_recipe_by_id(rid)
        if r:
            recipes.append(r)

    if not recipes:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No valid recipes found.")

    try:
        description = await ai_provider.generate_menu_description(recipes, language)
        return {"description": description, "language": language}
    except AIProviderError as e:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, f"AI service unavailable: {str(e)}")


# ─── Voice Kitchen Notes (ElevenLabs STT) ────────────────────────────────────

@router.post("/voice/transcribe")
async def transcribe_voice_note(file: UploadFile = File(...)):
    """Transcribe kitchen voice notes using ElevenLabs Speech-to-Text.
    The transcription is automatically parsed into candidate sales/order entries
    for explicit user review and confirmation before saving.
    """
    if not elevenlabs_provider.is_configured:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "ElevenLabs integration not configured",
                "message": (
                    "Voice-to-text requires ELEVENLABS_API_KEY in backend/.env. "
                    "You can still enter kitchen notes manually."
                ),
            },
        )

    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded audio file is empty.")

    try:
        result = await elevenlabs_provider.transcribe_audio(
            audio_bytes=content,
            filename=file.filename or "recording.mp3",
            content_type=file.content_type or "audio/mpeg",
        )
        transcript = result.get("transcript", "").strip()

        if not transcript:
            return {
                "transcript": "",
                "parsed": {"entries": [], "unparseable_text": "No speech detected in audio."},
                "requires_confirmation": True,
            }

        recipes = await get_recipes()
        parsed_entries = await ai_provider.parse_kitchen_notes(transcript, recipes)

        return {
            "transcript": transcript,
            "language": result.get("language", "en"),
            "parsed": parsed_entries.model_dump(),
            "requires_confirmation": True,
            "message": "Voice note transcribed! Review and confirm parsed fields below before saving.",
        }

    except ElevenLabsError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Voice transcription error: {str(e)}")
    except Exception as e:
        logger.error("Unexpected error in voice transcription: %s", e)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error processing voice note: {str(e)}")


# ─── Fine-Tuning Dataset Utilities (Tinker) ──────────────────────────────────

@router.get("/training/status")
async def training_status():
    """Check Tinker fine-tuning capability status."""
    return tinker_provider.get_status()


@router.get("/training/export-dataset")
async def export_training_dataset():
    """Export instruction-tuning dataset from confirmed plans and historical sales."""
    dataset = await tinker_provider.generate_training_dataset()
    return {
        "dataset_size": len(dataset),
        "examples": dataset[:10],
        "message": f"Generated {len(dataset)} instruction-tuning examples from historical kitchen data.",
    }
