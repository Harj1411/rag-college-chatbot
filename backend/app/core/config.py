import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusMind RAG Chatbot"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # API Keys
    GEMINI_API_KEY: str = Field(default="", env="GEMINI_API_KEY")

    # Database
    MONGO_URI: str = Field(default="mongodb://localhost:27017", env="MONGO_URI")
    DB_NAME: str = Field(default="campusmind", env="DB_NAME")

    # JWT Authentication
    JWT_SECRET: str = Field(default="campusmind_super_secure_jwt_secret_key_change_me_in_prod_2026", env="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440, env="ACCESS_TOKEN_EXPIRE_MINUTES")  # 24 hours

    # RAG Settings
    CHROMA_PERSIST_DIR: str = Field(default="./chroma_db", env="CHROMA_PERSIST_DIR")
    UPLOAD_DIR: str = Field(default="./uploads", env="UPLOAD_DIR")
    MIN_SIMILARITY_SCORE: float = Field(default=0.15, env="MIN_SIMILARITY_SCORE")
    TOP_K_CHUNKS: int = Field(default=4, env="TOP_K_CHUNKS")
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 100

    # CORS
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
        env="ALLOWED_ORIGINS"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Ensure folders exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
