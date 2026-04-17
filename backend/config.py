from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://admin:administ@localhost:5432/os_digital"
    SECRET_KEY: str = "uma_chave_super_secreta_os_digital"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALLOW_ORIGINS: str = "*"
    GROQ_API_KEY: str = ""
    EVOLUTION_API_URL: str = "http://localhost:8080"
    EVOLUTION_API_KEY: str = "osdigital_evo_key_2026"
    EVOLUTION_INSTANCE_NAME: str = "suporte-os"

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOW_ORIGINS.split(",") if origin.strip()]

settings = Settings()
