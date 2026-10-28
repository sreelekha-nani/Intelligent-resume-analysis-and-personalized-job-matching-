import os
from pydantic_settings import BaseSettings  # type: ignore[import-untyped, missing-import] # noqa: F401

class Settings(BaseSettings):
    SECRET_KEY: str = "super-secret-key-ai-job-system-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = "sqlite:///./job_system.db"
    
    GOOGLE_CLIENT_ID: str = "380519068552-ke32brqfk0btgiausg0291fnq76kggma.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: str = "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"
    
    ADZUNA_APP_ID: str = ""
    ADZUNA_APP_KEY: str = ""
    
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "services2830@gmail.com"
    SMTP_PASSWORD: str = "wftm llhc tohs szfv"
    FROM_EMAIL: str = "services2830@gmail.com"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
