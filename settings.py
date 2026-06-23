"""
Configuration settings module for the Last-Minute Life Saver platform.
This module uses Pydantic to parse and validate settings, with support for
environment variables, fallback defaults, and .env file loading.
"""

import os
from functools import lru_cache
from typing import Literal, Optional
from pydantic import Field

# Attempt to import modern Pydantic Settings support.
# Fallback to standard Pydantic BaseModel if pydantic-settings is not present.
try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    
    class Settings(BaseSettings):
        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            extra="ignore"
        )
        
        # Core Configurations
        GEMINI_API_KEY: str = Field(
            default="MY_GEMINI_API_KEY",
            description="API access secret for Google Gemini AI"
        )
        APP_URL: str = Field(
            default="http://localhost:3000",
            description="The base hosting URL with scheme"
        )
        
        # Database Configurations
        DATABASE_URL: str = Field(
            default="sqlite:///./last_minute_saver.db",
            description="Database connection target URL"
        )
        SQLITE_WAL_MODE: bool = Field(
            default=True,
            description="Toggle SQLite Write-Ahead Logging for high-concurrency writing"
        )
        SQLITE_SYNCHRONOUS_MODE: Literal["NORMAL", "FULL", "EXTRA", "OFF"] = Field(
            default="NORMAL",
            description="Tuning synchronous transactions profile for SQLite write durability"
        )
        
        # Project Environment
        ENVIRONMENT: str = Field(
            default="development",
            description="Target application runtime environment"
        )

except ImportError:
    # Resilient fallback utilizing standard pydantic.BaseModel and manual environment overlay.
    from pydantic import BaseModel

    class Settings(BaseModel):
        GEMINI_API_KEY: str = "MY_GEMINI_API_KEY"
        APP_URL: str = "http://localhost:3000"
        DATABASE_URL: str = "sqlite:///./last_minute_saver.db"
        SQLITE_WAL_MODE: bool = True
        SQLITE_SYNCHRONOUS_MODE: Literal["NORMAL", "FULL", "EXTRA", "OFF"] = "NORMAL"
        ENVIRONMENT: str = "development"

        @classmethod
        def load_from_environment(cls) -> "Settings":
            """Loads values directly from the process environment with built-in fallbacks."""
            
            # Simple line-oriented .env manual parsing if file exists on disk
            env_vals = {}
            if os.path.exists(".env"):
                with open(".env", "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if "=" in line:
                            k, v = line.split("=", 1)
                            env_vals[k.strip()] = v.strip().strip('"').strip("'")

            # Override/supplement with process system environment
            def get_val(key: str, default_val: str) -> str:
                return os.environ.get(key, env_vals.get(key, default_val))

            def get_bool_val(key: str, default_val: bool) -> bool:
                raw = os.environ.get(key, env_vals.get(key, str(default_val))).lower()
                return raw in ("true", "1", "yes", "on")

            return cls(
                GEMINI_API_KEY=get_val("GEMINI_API_KEY", "MY_GEMINI_API_KEY"),
                APP_URL=get_val("APP_URL", "http://localhost:3000"),
                DATABASE_URL=get_val("DATABASE_URL", "sqlite:///./last_minute_saver.db"),
                SQLITE_WAL_MODE=get_bool_val("SQLITE_WAL_MODE", True),
                SQLITE_SYNCHRONOUS_MODE=get_val("SQLITE_SYNCHRONOUS_MODE", "NORMAL"), # type: ignore
                ENVIRONMENT=get_val("ENVIRONMENT", "development")
            )


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached instance of the settings class, securing single-instantiation
    efficiency during FastAPI dependency injections.
    """
    if "BaseSettings" in globals():
        return Settings() # type: ignore
    else:
        return Settings.load_from_environment() # type: ignore
