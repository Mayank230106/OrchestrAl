# backend/main.py
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.schemas import TaskRequest, WorkflowState, ApprovalRequest, UserProfile
from backend.database import db_service
from backend.config import settings
from backend.team import build_orchestrai_team
import uuid
import datetime
import json
import asyncio

app = FastAPI(title="OrchestrAl API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await db_service.init_db()


# ── Internal: run the AutoGen team and stream results into Cosmos DB ──────────

async def run_workflow(session_id: str, prompt: str, resume_feedback: str = None):
    """
    Runs the full AutoGen team pipeline and saves every agent message to Cosmos DB.
    This is called as a FastAPI BackgroundTask so it runs without blocking the HTTP response.
    """
    db_state = await db_service.get_state(session_id)
    if not db_state:
        return

    team = build_orchestrai_team(is_approved=db_state.get("is_approved", False))

    # Restore saved AutoGen state when resuming after HITL
    if db_state.get("autogen_state"):
        await team.load_state(db_state["autogen_state"])

    task_input = resume_feedback if resume_feedback else prompt

    def safe_serialize(obj):
        """Turn any AutoGen content object into something JSON-serialisable."""
        if isinstance(obj, str):
            return obj
        if isinstance(obj, dict):
            return {k: safe_serialize(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [safe_serialize(i) for i in obj]
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        if hasattr(obj, "__dict__"):
            return safe_serialize(obj.__dict__)
        return str(obj)

    try:
        async for event in team.run_stream(task=task_input):
            if hasattr(event, "source") and hasattr(event, "content"):
                db_state["chat_history"].append({
                    "agent": event.source,
                    "content": safe_serialize(event.content),
                    "type": type(event).__name__,
                })
                await db_service.save_state(db_state)

        # Determine final status
        # Only check NEW messages in this run for PENDING_APPROVAL so we don't infinitely pause
        # due to historical messages.
        is_approved = db_state.get("is_approved", False)
        
        # We need to find if there was a NEW pending approval request.
        # However, to be safe, we can just check if we are NOT approved, and the LAST reviewer message asks for approval.
        reviewer_msgs = [m["content"] for m in db_state["chat_history"] if m["agent"] == "Reviewer"]
        pending_request = reviewer_msgs and "STATUS: PENDING_APPROVAL" in str(reviewer_msgs[-1])

        if pending_request and not is_approved:
            db_state["status"] = "PAUSED_FOR_HITL"
        else:
            db_state["status"] = "COMPLETED"

    except Exception as e:
        db_state["status"] = "FAILED"
        db_state["chat_history"].append({
            "agent": "System",
            "content": f"Fatal Error: {str(e)}",
            "type": "error",
        })

    # Save final checkpoint
    try:
        db_state["autogen_state"] = await team.save_state()
    except Exception:
        pass  # save_state may not be available on all team types

    await db_service.save_state(db_state)


# ── API Endpoints ─────────────────────────────────────────────────────────────

@app.post("/api/workflow/start")
async def start_workflow(request: TaskRequest, background_tasks: BackgroundTasks):
    session_id = request.session_id or f"ORCH-{str(uuid.uuid4())[:8].upper()}"

    initial_state = WorkflowState(
        session_id=session_id,
        status="ACTIVE",
        is_approved=False,
        original_prompt=request.prompt,
        created_at=datetime.datetime.utcnow().isoformat(),
        updated_at=datetime.datetime.utcnow().isoformat(),
    )
    await db_service.save_state(initial_state.model_dump())

    # Run the AutoGen team in the background — no separate worker process needed
    background_tasks.add_task(run_workflow, session_id, request.prompt)

    return {"session_id": session_id, "status": "Workflow Initialized"}


@app.get("/api/workflow/{session_id}/stream")
async def stream_workflow_status(session_id: str, request: Request, start: int = 0):
    """Server-Sent Events stream — polls Cosmos DB for new agent messages."""
    async def event_generator():
        last_message_count = start

        while True:
            if await request.is_disconnected():
                break

            state = await db_service.get_state(session_id)
            if not state:
                yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
                break

            current_messages = state.get("chat_history", [])
            status = state.get("status")

            if len(current_messages) > last_message_count or status in ["PAUSED_FOR_HITL", "COMPLETED", "FAILED"]:
                new_msgs = current_messages[last_message_count:]
                last_message_count = len(current_messages)
                payload = {"status": status, "new_logs": new_msgs}
                yield f"data: {json.dumps(payload)}\n\n"

            if status in ["PAUSED_FOR_HITL", "COMPLETED", "FAILED"] and len(current_messages) == last_message_count:
                break

            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/history")
async def get_history():
    workflows = await db_service.get_all_workflows()
    return {"tasks": workflows}


@app.get("/api/workflow/{session_id}")
async def get_workflow_detail(session_id: str):
    state = await db_service.get_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return state


@app.post("/api/workflow/approve")
async def approve_workflow(request: ApprovalRequest, background_tasks: BackgroundTasks):
    state = await db_service.get_state(request.session_id)
    if not state or state["status"] != "PAUSED_FOR_HITL":
        raise HTTPException(status_code=400, detail="Workflow not awaiting approval")

    if request.approved:
        state["is_approved"] = True
        state["status"] = "ACTIVE"
        feedback = "Human Approved. Planners/Researchers/Executors: do nothing, pass to Reviewer. Reviewer: YOU MUST NOT output 'STATUS: PENDING_APPROVAL' anymore. Output the final, well-structured, comprehensive markdown summary of the execution for the user. End your message with exactly the single word COMPLETE_WORKFLOW"
    else:
        state["is_approved"] = False
        state["status"] = "ACTIVE"
        feedback = request.feedback

    await db_service.save_state(state)

    # Resume the workflow in the background
    background_tasks.add_task(run_workflow, request.session_id, state.get("original_prompt", ""), feedback)

    return {"status": "Workflow Resumed"}


@app.get("/api/profile")
async def get_profile():
    return await db_service.get_user_profile()


@app.put("/api/profile")
async def update_profile(profile: UserProfile):
    await db_service.save_user_profile(profile.model_dump())
    return {"status": "Profile updated successfully"}


@app.get("/api/logs/recent")
async def get_recent_global_logs():
    recent_runs = await db_service.get_recent_logs()
    global_logs = []
    for run in recent_runs:
        for msg in run.get("chat_history", []):
            global_logs.append({
                "session_id": run.get("session_id"),
                "agent": msg.get("agent"),
                "content": msg.get("content"),
                "type": msg.get("type"),
            })
    return {"logs": global_logs}