import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CrisisLens"
    PROJECT_VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    
    # Database
    DATABASE_URL: str = "sqlite:///./crisislens.db"
    
    # Upload storage & security restrictions
    UPLOAD_DIR: Path = Path(__file__).resolve().parent.parent.parent / "uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB strict limit
    ALLOWED_EXTENSIONS: set[str] = {"jpg", "jpeg", "png", "webp"}
    ALLOWED_MIME_TYPES: set[str] = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }
    
    # Meta Model API integration (Meta Muse Spark / Llama)
    # Stored strictly in environment variables; NEVER sent to frontend.
    META_API_KEY: str | None = None
    META_API_BASE_URL: str = "https://api.meta.ai/v1"
    META_MODEL_ID: str = "meta-muse-spark-preview"
    
    # Mandatory safety disclaimer required by disaster governance rules
    SAFETY_DISCLAIMER: str = (
        "ADVISORY NOTICE: CrisisLens AI synthesis provides situational assessment support only. "
        "AI outputs must NEVER be used as autonomous or authoritative emergency instructions, "
        "and cannot independently declare roadways, bridges, or evacuation routes safe. "
        "All emergency actions require verification by designated first-responder authorities."
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
# Ensure upload directory exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
