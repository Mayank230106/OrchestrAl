# The FastAPI endpoints
from fastapi import FastAPI, HTTPException, BackgroundTasks
from app.schemas import TaskRequest, WorkflowState, ApprovalRequest
from app.services.cosmos_db import db_service
from azure.servicebus.aio import ServiceBusClient
from azure.servicebus import ServiceBusMessage
from app.config import settings
import uuid
import datetime
import json

app = FastAPI(title="OrchestrAI API Gateway")

@app.on_event("startup")
async def startup_event():
    await db_service.init_db()

@app.post("/api/workflow/start")
async def start_workflow(request: TaskRequest):
    session_id = request.session_id or f"ORCH-{str(uuid.uuid4())[:8].upper()}"
    
    # 1. Initialize State in Cosmos DB
    initial_state = WorkflowState(
        session_id=session_id,
        status="ACTIVE",
        original_prompt=request.prompt,
        created_at=datetime.datetime.utcnow().isoformat(),
        updated_at=datetime.datetime.utcnow().isoformat()
    )
    await db_service.save_state(initial_state.model_dump())

    # 2. Push Job to Azure Service Bus
    async with ServiceBusClient.from_connection_string(settings.SERVICE_BUS_CONNECTION_STRING) as client:
        sender = client.get_queue_sender(queue_name=settings.SERVICE_BUS_QUEUE_NAME)
        msg_payload = {"session_id": session_id, "action": "START", "prompt": request.prompt}
        message = ServiceBusMessage(json.dumps(msg_payload))
        await sender.send_messages(message)

    return {"session_id": session_id, "status": "Workflow Initialized in Background"}

@app.get("/api/workflow/{session_id}")
async def get_workflow_status(session_id: str):
    state = await db_service.get_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return state

@app.post("/api/workflow/approve")
async def approve_workflow(request: ApprovalRequest):
    state = await db_service.get_state(request.session_id)
    if not state or state["status"] != "PAUSED_FOR_HITL":
        raise HTTPException(status_code=400, detail="Workflow not awaiting approval")

    # Send Resume command to Service Bus
    async with ServiceBusClient.from_connection_string(settings.SERVICE_BUS_CONNECTION_STRING) as client:
        sender = client.get_queue_sender(queue_name=settings.SERVICE_BUS_QUEUE_NAME)
        msg_payload = {
            "session_id": request.session_id, 
            "action": "RESUME", 
            "feedback": request.feedback if not request.approved else "Human Approved. Execute final."
        }
        message = ServiceBusMessage(json.dumps(msg_payload))
        await sender.send_messages(message)
    
    state["status"] = "ACTIVE"
    await db_service.save_state(state)
    return {"status": "Workflow Resumed"}