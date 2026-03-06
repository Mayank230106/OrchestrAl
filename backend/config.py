# Loads environment variables
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Azure OpenAI Tiered Endpoints
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_API_VERSION: str = "2024-08-01-preview"
    
    # Model Deployments
    DEPLOYMENT_PLANNER: str = "gpt-4o"
    DEPLOYMENT_WORKHORSE: str = "gpt-4o-mini"
    
    # Azure AI Foundry Serverless (Phi-3.5)
    PHI3_ENDPOINT: str
    PHI3_API_KEY: str
    
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