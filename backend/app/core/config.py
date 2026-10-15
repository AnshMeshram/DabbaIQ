"""Core configuration for DabbaIQ backend."""

import os
from pathlib import Path
from typing import Optional, List
from pydantic import Field
from pydantic_settings import BaseSettings

# Locate backend/.env or root .env
_current_dir = Path(__file__).resolve().parent
_backend_dir = _current_dir.parent.parent
_env_path = _backend_dir / ".env"
if not _env_path.exists():
    _env_path = _backend_dir.parent / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "DabbaIQ"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = False

    # MongoDB Atlas
    MONGODB_URI: Optional[str] = None
    MONGODB_DATABASE: str = Field(default="dabbaiq", alias="MONGODB_DATABASE")
    MONGODB_DB_NAME: Optional[str] = None  # Backward compatibility alias

    # Open-Weight AI
    AI_PROVIDER: str = "ollama"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma3:4b"
    OLLAMA_TIMEOUT: int = 120

    # SerpAPI Supplier Price Search
    SERPAPI_API_KEY: Optional[str] = None
    SERPAPI_BASE_URL: str = "https://serpapi.com/search.json"
    SERPAPI_LOCATION: Optional[str] = None
    SERPAPI_GL: str = "in"
    SERPAPI_HL: str = "en"

    # Tiger Data (TimescaleDB / PostgreSQL)
    TIGER_DATA_DATABASE_URL: Optional[str] = None

    # Temporal Workflow Orchestration
    TEMPORAL_ADDRESS: Optional[str] = "localhost:7233"
    TEMPORAL_NAMESPACE: str = "default"
    TEMPORAL_TASK_QUEUE: str = "dabbaiq-planning-tasks"

    # Optional Partner Integrations
    ELEVENLABS_API_KEY: Optional[str] = None
    BACKBOARD_API_KEY: Optional[str] = None
    TINKER_API_KEY: Optional[str] = None

    # CORS & Network
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Business defaults
    DEFAULT_SAFETY_BUFFER: float = 0.15  # 15% extra portions
    FORECAST_WEEKDAY_LOOKBACK: int = 4
    FORECAST_TRAILING_DAYS: int = 7

    @property
    def database_name(self) -> str:
        """Returns MONGODB_DATABASE, falling back to MONGODB_DB_NAME or default 'dabbaiq'."""
        return self.MONGODB_DATABASE or self.MONGODB_DB_NAME or "dabbaiq"

    @property
    def cors_origins_list(self) -> List[str]:
        """Combine CORS_ORIGINS and FRONTEND_ORIGIN into a deduplicated list."""
        origins = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        if self.FRONTEND_ORIGIN and self.FRONTEND_ORIGIN.strip():
            fo = self.FRONTEND_ORIGIN.strip()
            if fo not in origins:
                origins.append(fo)
        return origins

    @property
    def db_available(self) -> bool:
        """Check if MONGODB_URI is configured."""
        return self.MONGODB_URI is not None and len(self.MONGODB_URI.strip()) > 0

    @property
    def serpapi_available(self) -> bool:
        """Check if SerpAPI is configured."""
        return self.SERPAPI_API_KEY is not None and len(self.SERPAPI_API_KEY.strip()) > 0

    @property
    def tiger_data_available(self) -> bool:
        """Check if Tiger Data PostgreSQL / TimescaleDB is configured."""
        return self.TIGER_DATA_DATABASE_URL is not None and len(self.TIGER_DATA_DATABASE_URL.strip()) > 0

    @property
    def temporal_available(self) -> bool:
        """Check if Temporal host address is configured."""
        return self.TEMPORAL_ADDRESS is not None and len(self.TEMPORAL_ADDRESS.strip()) > 0

    @property
    def elevenlabs_available(self) -> bool:
        """Check if ElevenLabs Speech-to-Text is configured."""
        return self.ELEVENLABS_API_KEY is not None and len(self.ELEVENLABS_API_KEY.strip()) > 0

    @property
    def backboard_available(self) -> bool:
        """Check if Backboard is configured."""
        return self.BACKBOARD_API_KEY is not None and len(self.BACKBOARD_API_KEY.strip()) > 0

    @property
    def tinker_available(self) -> bool:
        """Check if Tinker fine-tuning is configured."""
        return self.TINKER_API_KEY is not None and len(self.TINKER_API_KEY.strip()) > 0

    model_config = {
        "env_file": str(_env_path) if _env_path.exists() else ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "populate_by_name": True,
    }


settings = Settings()
