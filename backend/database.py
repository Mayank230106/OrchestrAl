# backend/database.py
from azure.cosmos.aio import CosmosClient
from azure.cosmos import PartitionKey
from backend.config import settings
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
        state_dict["id"] = state_dict["session_id"]
        await self.container.upsert_item(body=state_dict)

    async def get_state(self, session_id: str) -> dict:
        try:
            return await self.container.read_item(item=session_id, partition_key=session_id)
        except Exception:
            return None

    # NEW: Fetch all workflows for the History page
    async def get_all_workflows(self):
        query = "SELECT c.id, c.session_id, c.status, c.original_prompt, c.created_at, c.updated_at FROM c ORDER BY c.created_at DESC"
        items = self.container.query_items(
            query=query
        )
        return [item async for item in items]
    
    
    # Add these methods inside your CosmosDBService class in database.py
    async def get_user_profile(self, user_id: str = "default_user") -> dict:
        try:
            # Reusing the workflow container for simplicity in MVP, 
            # ideally this should be a separate "users" container
            return await self.container.read_item(item=f"profile_{user_id}", partition_key=f"profile_{user_id}")
        except Exception:
            # Return default template if not found
            return {
                "id": f"profile_{user_id}",
                "session_id": f"profile_{user_id}", # required for partition key
                "full_name": "Priya Sharma",
                "github_username": "priya_codes",
                "github_url": "https://github.com/priya_codes",
                "bio": "Project Manager exploring Multi-Agent AI.",
                "skills": ["Python", "React", "Azure"]
            }

    async def save_user_profile(self, profile_data: dict):
        profile_data["id"] = f"profile_{profile_data['user_id']}"
        profile_data["session_id"] = f"profile_{profile_data['user_id']}" # partition key
        await self.container.upsert_item(body=profile_data)

    async def get_recent_logs(self):
        # Fetches all chat history across recent workflows for the Logs page
        query = "SELECT c.session_id, c.chat_history FROM c WHERE IS_DEFINED(c.chat_history) ORDER BY c.created_at DESC OFFSET 0 LIMIT 10"
        items = self.container.query_items(query=query)
        return [item async for item in items]

db_service = CosmosDBService()