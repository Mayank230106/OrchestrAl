# Handles reading/writing to Azure Cosmos DB
from azure.cosmos.aio import CosmosClient
from azure.cosmos import PartitionKey
from app.config import settings
import datetime

class CosmosDBService:
    def __init__(self):
        self.client = CosmosClient(settings.COSMOS_DB_ENDPOINT, credential=settings.COSMOS_DB_KEY)
        self.db_name = settings.COSMOS_DB_DATABASE
        self.container_name = settings.COSMOS_DB_CONTAINER
        self.db = None
        self.container = None

    async def init_db(self):
        self.db = await self.client.create_database_if_not_exists(id=self.db_name)
        self.container = await self.db.create_container_if_not_exists(
            id=self.container_name,
            partition_key=PartitionKey(path="/session_id")
        )

    async def save_state(self, state_dict: dict):
        state_dict["updated_at"] = datetime.datetime.utcnow().isoformat()
        state_dict["id"] = state_dict["session_id"] # Cosmos requires 'id' field
        await self.container.upsert_item(body=state_dict)

    async def get_state(self, session_id: str) -> dict:
        try:
            return await self.container.read_item(item=session_id, partition_key=session_id)
        except Exception:
            return None

db_service = CosmosDBService()