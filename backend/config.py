# Loads environment variables
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Gemini API Configuration (Proxy mode)
    GEMINI_API_KEY: str
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Azure Infrastructure
    COSMOS_DB_ENDPOINT: str
    COSMOS_DB_KEY: str
    COSMOS_DB_DATABASE: str = "orchestrai_db"
    COSMOS_DB_CONTAINER: str = "workflow_states"
    
    SERVICE_BUS_CONNECTION_STRING: str
    SERVICE_BUS_QUEUE_NAME: str = "agent-tasks"

    class Config:
        env_file = ".env"

settings = Settings()