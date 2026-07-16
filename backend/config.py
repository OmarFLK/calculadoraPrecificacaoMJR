import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_EXPIRES_IN = timedelta(minutes=int(os.getenv("JWT_EXPIRES_IN_MINUTES", "1440")))

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@localhost:5432/maua_pricing_ai",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    FRONTEND_URL = os.getenv(
        "FRONTEND_URL",
        os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
    )
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", FRONTEND_URL)
    FRONTEND_ORIGINS = [
        FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]
    MONDAY_API_KEY = os.getenv("MONDAY_API_KEY", "")
    MONDAY_API_URL = os.getenv("MONDAY_API_URL", "https://api.monday.com/v2")
    MONDAY_API_VERSION = os.getenv("MONDAY_API_VERSION", "2026-04")
    MONDAY_REQUEST_TIMEOUT_SECONDS = float(
        os.getenv("MONDAY_REQUEST_TIMEOUT_SECONDS", "10")
    )
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")
    OPENAI_RESPONSES_URL = os.getenv(
        "OPENAI_RESPONSES_URL",
        "https://api.openai.com/v1/responses",
    )
    OPENAI_MAX_OUTPUT_TOKENS = int(os.getenv("OPENAI_MAX_OUTPUT_TOKENS", "320"))
    OPENAI_REASONING_EFFORT = os.getenv("OPENAI_REASONING_EFFORT", "none")
    OPENAI_REQUEST_TIMEOUT_SECONDS = float(
        os.getenv("OPENAI_REQUEST_TIMEOUT_SECONDS", "30")
    )


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
