"""Đọc cấu hình từ .env bằng pydantic-settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # AI Provider
    ai_provider_name: str = "openai"
    ai_provider_api_key: str = ""
    ai_provider_model: str = "gpt-4o-mini"

    # Embedding
    embedding_model_name: str = "paraphrase-multilingual-mpnet-base-v2"

    # Business limits
    max_context_length: int = 500
    max_blocks: int = 300
    similarity_threshold: float = 0.75

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    log_level: str = "INFO"


settings = Settings()