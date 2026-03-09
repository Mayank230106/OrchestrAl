# Pydantic models for data validation
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class TaskRequest(BaseModel):
    prompt: str = Field(..., description="The user's high-level objective")
    session_id: Optional[str] = None

class WorkflowState(BaseModel):
    session_id: str
    status: str = Field(default="PENDING", description="PENDING, ACTIVE, PAUSED_FOR_HITL, COMPLETED, FAILED")
    is_approved: bool = Field(default=False, description="Whether the human has approved the payload to run to completion")
    original_prompt: str
    autogen_state: Optional[Dict[str, Any]] = Field(default=None, description="Serialized AutoGen team state")
    chat_history: List[Dict[str, Any]] = []
    created_at: str
    updated_at: str

class ApprovalRequest(BaseModel):
    session_id: str
    approved: bool
    feedback: Optional[str] = None

# Add this to schemas.py
class UserProfile(BaseModel):
    user_id: str = "default_user" # Hardcoded for MVP, link to Entra ID later
    full_name: str
    github_username: str
    github_url: str
    bio: str
    skills: List[str]