# backend/database.py
from azure.cosmos.aio import CosmosClient
from azure.cosmos import PartitionKey
from azure.cosmos.exceptions import CosmosHttpResponseError
from backend.config import settings
import datetime
import numpy as np

class CosmosDBService:
    def __init__(self):
        self.client = CosmosClient(settings.COSMOS_DB_ENDPOINT, credential=settings.COSMOS_DB_KEY)
        self.db_name = settings.COSMOS_DB_DATABASE
        self.container_name = settings.COSMOS_DB_CONTAINER
        self.db = None
        self.container = None
        self.vector_container = None
        self.mcp_container = None
        self.calendar_container = None  # Added for Calendar Events
        self.users_container = None    # Stores registered user accounts

    async def init_db(self):
        print(f"DEBUG: Initializing Cosmos DB connection to {settings.COSMOS_DB_ENDPOINT}")
        self.db = await self.client.create_database_if_not_exists(id=self.db_name)
        
        # 1. Main workflow states container (Your original setup)
        self.container = await self.db.create_container_if_not_exists(
            id=self.container_name,
            partition_key=PartitionKey(path="/session_id")
        )
        print(f"DEBUG: Container '{self.container_name}' ready.")

        # 2. Document Chunks Container with Vector Indexing
        vector_embedding_policy = {
            "vectorEmbeddings": [
                {
                    "path": "/embedding",
                    "dataType": "float32",
                    "distanceFunction": "cosine",
                    "dimensions": 384
                }
            ]
        }
        indexing_policy = {
            "includedPaths": [{"path": "/*"}],
            "excludedPaths": [{"path": "/\"_etag\"/?"}],
            "vectorIndexes": [{"path": "/embedding", "type": "quantizedFlat"}]
        }
        
        try:
            self.vector_container = await self.db.create_container_if_not_exists(
                id="document_chunks",
                partition_key=PartitionKey(path="/session_id"),
                indexing_policy=indexing_policy,
                vector_embedding_policy=vector_embedding_policy
            )
            self.use_native_vector_search = True
            print("DEBUG: Container 'document_chunks' with vector search ready.")
        except CosmosHttpResponseError as e:
            if "capability has not been enabled" in str(e):
                print("WARNING: Vector capability disabled on Cosmos. Falling back to python computation.")
                self.vector_container = await self.db.create_container_if_not_exists(
                    id="document_chunks",
                    partition_key=PartitionKey(path="/session_id")
                )
                self.use_native_vector_search = False
            else:
                raise e

        # 3. MCP Configs Container
        self.mcp_container = await self.db.create_container_if_not_exists(
            id="mcp_configs",
            partition_key=PartitionKey(path="/id")
        )
        print("DEBUG: Container 'mcp_configs' ready.")

        # 4. Global Calendar Events Container (Added from friend's code)
        self.calendar_container = await self.db.create_container_if_not_exists(
            id="calendar_events",
            partition_key=PartitionKey(path="/type")
        )
        print("DEBUG: Container 'calendar_events' ready.")

        # 5. Users Container — one document per registered account
        self.users_container = await self.db.create_container_if_not_exists(
            id="users",
            partition_key=PartitionKey(path="/email")
        )
        print("DEBUG: Container 'users' ready.")

    # --- CORE WORKFLOW STATE METHODS ---
    async def save_state(self, state_dict: dict):
        state_dict["updated_at"] = datetime.datetime.utcnow().isoformat()
        state_dict["id"] = state_dict["session_id"]
        await self.container.upsert_item(body=state_dict)

    async def get_state(self, session_id: str) -> dict:
        try:
            # 1. Try fast read
            return await self.container.read_item(item=session_id, partition_key=session_id)
        except Exception:
            # 2. Fallback: Cross-partition query by id or session_id
            try:
                query = "SELECT * FROM c WHERE c.id = @sid OR c.session_id = @sid"
                parameters = [{"name": "@sid", "value": session_id}]
                async for item in self.container.query_items(query=query, parameters=parameters):
                    return item
            except Exception as e:
                print(f"Fallback retrieval failed for {session_id}: {str(e)}")
            return None

    async def delete_state(self, session_id: str):
        try:
            state = await self.get_state(session_id)
            if state:
                pk_val = state.get("session_id") or state.get("id")
                await self.container.delete_item(item=state["id"], partition_key=pk_val)
        except Exception as e:
            print(f"Error deleting state {session_id}: {str(e)}")

    # --- USER PROFILE & HISTORY METHODS ---
    async def get_all_workflows(self, email: str = None):
        """
        Return workflow summaries. When an email is supplied, only that user's
        sessions come back. Without an email all sessions are returned (admin mode).
        """
        if email:
            query = (
                "SELECT c.id, c.session_id, c.status, c.original_prompt, "
                "c.created_at, c.updated_at FROM c "
                "WHERE c.owner_email = @email "
                "ORDER BY c.created_at DESC"
            )
            items = self.container.query_items(
                query=query,
                parameters=[{"name": "@email", "value": email}]
            )
        else:
            query = (
                "SELECT c.id, c.session_id, c.status, c.original_prompt, "
                "c.created_at, c.updated_at FROM c ORDER BY c.created_at DESC"
            )
            items = self.container.query_items(query=query)
        return [item async for item in items]

    async def get_recent_logs(self, email: str = None):
        if email:
            query = (
                "SELECT c.session_id, c.chat_history FROM c "
                "WHERE IS_DEFINED(c.chat_history) AND c.owner_email = @email "
                "ORDER BY c.created_at DESC OFFSET 0 LIMIT 10"
            )
            items = self.container.query_items(query=query, parameters=[{"name": "@email", "value": email}])
        else:
            query = "SELECT c.session_id, c.chat_history FROM c WHERE IS_DEFINED(c.chat_history) ORDER BY c.created_at DESC OFFSET 0 LIMIT 10"
            items = self.container.query_items(query=query)
        return [item async for item in items]

    async def get_user_profile(self, email: str) -> dict:
        """
        Return a user's profile data. We look up their document from the `users`
        container by email, then pull out just the profile-related fields.
        If they've never saved a profile, sensible empty defaults come back.
        """
        try:
            user = await self.get_user_by_email(email)
            if not user:
                return {"full_name": "", "role": "", "bio": "", "skills": [], "socials": {}, "email": email}
            return {
                "email":     user.get("email", email),
                "full_name": user.get("full_name", user.get("name", "")),
                "role":      user.get("role", ""),
                "bio":       user.get("bio", ""),
                "skills":    user.get("skills", []),
                "socials":   user.get("socials", {"github": "", "linkedin": "", "twitter": "", "website": ""}),
            }
        except Exception as e:
            print(f"Error fetching profile for {email}: {e}")
            return {"full_name": "", "role": "", "bio": "", "skills": [], "socials": {}, "email": email}

    async def save_user_profile(self, email: str, profile_data: dict):
        """
        Merge incoming profile fields into the existing user document.
        Email and password_hash are never touched here.
        """
        user = await self.get_user_by_email(email)
        if not user:
            raise ValueError(f"No user found with email: {email}")
        # Merge only the safe, editable profile fields
        user["full_name"] = profile_data.get("full_name", user.get("full_name", ""))
        user["role"]      = profile_data.get("role", user.get("role", ""))
        user["bio"]       = profile_data.get("bio", user.get("bio", ""))
        user["skills"]    = profile_data.get("skills", user.get("skills", []))
        user["socials"]   = profile_data.get("socials", user.get("socials", {}))
        await self.users_container.upsert_item(body=user)

    async def get_recent_sessions(self, limit: int = None) -> list:
        query = "SELECT * FROM c"
        results = []
        try:
            async for item in self.container.query_items(query=query):
                prompt = item.get("original_prompt")
                if not prompt and item.get("chat_history") and isinstance(item["chat_history"], list) and len(item["chat_history"]) > 0:
                    prompt = item["chat_history"][0].get("content")
                if not prompt:
                    prompt = "New Session"
                results.append({
                    "session_id": item.get("session_id") or item.get("id"),
                    "status": item.get("status", "ACTIVE"),
                    "updated_at": item.get("updated_at", ""),
                    "initial_prompt": prompt
                })
            results.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
            if limit:
                return results[:limit]
            return results
        except Exception as e:
            print(f"Error fetching history: {str(e)}")
            return []

    # --- MCP CONFIGURATION METHODS ---
    async def save_mcp_config(self, config: dict):
        await self.mcp_container.upsert_item(body=config)

    async def get_mcp_configs(self) -> list:
        query = "SELECT * FROM c WHERE c.is_active = true"
        configs = []
        async for item in self.mcp_container.query_items(query=query):
            configs.append(item)
        return configs
    
    async def get_mcp_config(self, mcp_id: str) -> dict:
        try:
            return await self.mcp_container.read_item(item=mcp_id, partition_key=mcp_id)
        except Exception:
            return None

    async def delete_mcp_config(self, mcp_id: str):
        try:
            await self.mcp_container.delete_item(item=mcp_id, partition_key=mcp_id)
        except Exception:
            pass

    # --- USER AUTH METHODS ---
    async def save_user(self, user_dict: dict):
        """Upsert a user document. `id` and the partition key (`email`) must be present."""
        await self.users_container.upsert_item(body=user_dict)

    async def get_user_by_email(self, email: str) -> dict:
        """Look up a user by their email address. Returns None if not found."""
        try:
            # Try the fast single-item read first (uses the partition key directly)
            return await self.users_container.read_item(item=email, partition_key=email)
        except Exception:
            # Fall back to a query in case the id differs from email
            try:
                query = "SELECT * FROM c WHERE c.email = @email"
                parameters = [{"name": "@email", "value": email}]
                async for item in self.users_container.query_items(
                    query=query, parameters=parameters
                ):
                    return item
            except Exception as e:
                print(f"Error looking up user by email '{email}': {e}")
        return None

    # --- CALENDAR METHODS (Added from friend's code) ---
    async def save_calendar_event(self, event: dict):
        if "created_at" not in event:
            event["created_at"] = datetime.datetime.utcnow().isoformat()
        if "type" not in event:
            event["type"] = "MEETING" # Default partition key
        await self.calendar_container.upsert_item(body=event)

    async def get_calendar_events(self, email: str = None) -> list:
        if email:
            query = "SELECT * FROM c WHERE c.owner_email = @email ORDER BY c.start_time ASC"
            items = self.calendar_container.query_items(query=query, parameters=[{"name": "@email", "value": email}])
        else:
            query = "SELECT * FROM c ORDER BY c.start_time ASC"
            items = self.calendar_container.query_items(query=query)
            
        events = []
        try:
            async for item in items:
                events.append(item)
            return events
        except Exception as e:
            print(f"Error fetching calendar: {str(e)}")
            return []

    # --- VECTOR EMBEDDING / RAG METHODS ---
    async def save_chunk(self, session_id: str, chunk_id: str, text: str, embedding: list, metadata: dict = None):
        if metadata is None: metadata = {}
        item = {
            "id": f"{session_id}_{chunk_id}",
            "session_id": session_id,
            "text": text,
            "embedding": embedding,
            "metadata": metadata
        }
        await self.vector_container.upsert_item(body=item)

    async def search_chunks(self, session_id: str, query_embedding: list, top_k: int = 5) -> list:
        if getattr(self, "use_native_vector_search", True):
            query = """
                SELECT TOP @top_k c.text, c.metadata, VectorDistance(c.embedding, @query_embedding) AS similarity_score
                FROM c
                WHERE c.session_id = @session_id
                ORDER BY VectorDistance(c.embedding, @query_embedding)
            """
            parameters = [
                {"name": "@session_id", "value": session_id},
                {"name": "@query_embedding", "value": query_embedding},
                {"name": "@top_k", "value": top_k}
            ]
            results = []
            try:
                async for item in self.vector_container.query_items(query=query, parameters=parameters):
                    results.append(item)
                return results
            except Exception as e:
                print(f"Error executing vector query: {str(e)}")
                return []
        else:
            query = "SELECT c.text, c.metadata, c.embedding FROM c WHERE c.session_id = @session_id"
            results = []
            try:
                async for item in self.vector_container.query_items(
                    query=query, 
                    parameters=[{"name": "@session_id", "value": session_id}]
                ):
                    e1 = np.array(item['embedding'])
                    e2 = np.array(query_embedding)
                    norm1, norm2 = np.linalg.norm(e1), np.linalg.norm(e2)
                    sim = float(np.dot(e1, e2) / (norm1 * norm2)) if norm1 and norm2 else 0.0
                    item['similarity_score'] = sim
                    results.append(item)
                
                results.sort(key=lambda x: x['similarity_score'], reverse=True)
                return results[:top_k]
            except Exception as e:
                print(f"Fallback computation failed: {str(e)}")
                return []

db_service = CosmosDBService()