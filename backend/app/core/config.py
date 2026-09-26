import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "OrbitShield"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./orbitshield.db"  # Defaults to SQLite for immediate out-of-the-box local runs, switches to Postgres when configured
    )
    
    # Security / JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "orbitshield-super-secret-key-hackathon-2026-orbital")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Space Data APIs
    SPACE_TRACK_USERNAME: Optional[str] = os.getenv("SPACE_TRACK_USERNAME", None)
    SPACE_TRACK_PASSWORD: Optional[str] = os.getenv("SPACE_TRACK_PASSWORD", None)
    CELESTRAK_BASE_URL: str = "https://celestrak.org/NORAD/elements/gp.php"
    
    # AI Engine
    AI_API_KEY: Optional[str] = os.getenv("AI_API_KEY", os.getenv("OPENAI_API_KEY", None))
    AI_API_BASE: str = os.getenv("AI_API_BASE", "https://api.openai.com/v1")
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4o-mini")
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()
