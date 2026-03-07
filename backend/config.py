# Loads environment variables
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Gemini API Keys (one per agent to avoid rate limits)
    GEMINI_API_KEY_PLANNER: str
    GEMINI_API_KEY_RESEARCHER: str
    GEMINI_API_KEY_EXECUTOR: str
    GEMINI_API_KEY_REVIEWER: str
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Azure Infrastructure
    COSMOS_DB_ENDPOINT: str
    COSMOS_DB_KEY: str
    COSMOS_DB_DATABASE: str = "orchestrai_db"
    COSMOS_DB_CONTAINER: str = "workflow_states"
    
    SERVICE_BUS_CONNECTION_STRING: str
    SERVICE_BUS_QUEUE_NAME: str = "agent-tasks"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()