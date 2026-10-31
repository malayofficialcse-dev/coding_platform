# src/config/settings.py
import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Server
    port: int = 5011

    # OpenAI / Groq
    openai_api_key: str
    openai_api_base: str = ""
    openai_base_url: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    @property
    def is_groq(self) -> bool:
        return self.openai_api_key.startswith("gsk_") or "groq.com" in (self.openai_base_url or self.openai_api_base)

    @property
    def effective_base_url(self) -> str | None:
        if self.openai_base_url:
            return self.openai_base_url
        if self.openai_api_base:
            return self.openai_api_base
        if self.is_groq:
            return "https://api.groq.com/openai/v1"
        return None

    @property
    def effective_model(self) -> str:
        if self.is_groq and self.openai_model in ("gpt-4o-mini", "gpt-4o"):
            return "qwen/qwen3.8-27b"
        return self.openai_model

    # LangSmith
    langchain_tracing_v2: str = "true"
    langchain_project: str = "code-campus-ai"
    langchain_api_key: str = ""
    langchain_endpoint: str = "https://api.smith.langchain.com"

    # Vector Store
    vector_store: str = "chroma"
    chroma_persist_dir: str = "./chroma_db"
    chroma_collection_name: str = "code_campus_knowledge"

    # MongoDB
    mongo_uri: str = ""
    course_mongo_uri: str = "mongodb://localhost:27018/course_db"
    coding_mongo_uri: str = "mongodb://localhost:27019/coding_problems_db"

    # PostgreSQL
    user_database_url: str = "postgresql://postgres:malay21@127.0.0.1:5432/user_db"
    auth_database_url: str = "postgresql://postgres:malay21@127.0.0.1:5432/auth_db"
    exam_database_url: str = "postgresql://postgres:malay21@127.0.0.1:5432/exam_db"
    enrollment_database_url: str = "postgresql://postgres:malay21@127.0.0.1:5432/enrollment_db"
    coding_database_url: str = "postgresql://postgres:malay21@127.0.0.1:5432/coding_db"

    # Internal Services
    user_service_url: str = "http://localhost:5002"
    enrollment_service_url: str = "http://localhost:5006"
    internal_service_token: str = ""

    # JWT
    jwt_secret: str

    # CORS
    client_origins: str = "http://localhost:5173,http://localhost:3000"

    # Rate Limiting
    ai_rate_limit_per_minute: int = 20

    @property
    def allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.client_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


# Apply LangSmith env vars at import time
def configure_langsmith(settings: Settings):
    os.environ["LANGCHAIN_TRACING_V2"] = settings.langchain_tracing_v2
    os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project
    os.environ["LANGCHAIN_ENDPOINT"] = settings.langchain_endpoint
    if settings.langchain_api_key:
        os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
