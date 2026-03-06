# OrchestrAI

## Target: AI Unlocked Challenge - Track 4 (Agent Teamwork)
**Core Objective**: Build a production-ready, highly secure, asynchronous multi-agent orchestration framework on the Microsoft/Azure stack while strictly staying under a $100 budget using a "Tiered Model" strategy.

## 1. High-Level Concept
OrchestrAI acts as an autonomous digital workforce rather than a standard chatbot. Users (like Project Managers) assign high-level tasks (e.g., "Set up a kickoff meeting based on this PDF"). The system decomposes the task, researches the context, drafts the required actions (like Outlook invites or Emails), and pauses for a Human-in-the-Loop (HITL) approval before executing any live API calls.

## 2. Tech Stack & Infrastructure
Based on our `.env` configuration and architectural decisions, here is the current stack:

*   **Frontend**: React (Standard CSS, no Tailwind). Designed as a split-pane "Mission Control" dashboard showing a live execution graph, terminal telemetry, and HITL approval cards.
*   **Backend API Gateway**: Python & FastAPI.
*   **Agent Orchestration**: Microsoft AutoGen (v0.4.x).
*   **State Management**: Azure Cosmos DB (Serverless) to persist workflow states and chat history so workflows can pause and resume.
*   **Async Messaging**: Azure Service Bus queues jobs so the FastAPI backend never blocks/times out during long agent reasoning loops.
*   **Agent Execution**: Azure Container Apps (Scale-to-zero) for hosting the workers.

## 3. The Multi-Agent Team (AutoGen v0.4)
We use a Tiered Model Strategy via Azure AI Foundry to minimize costs:

*   **Planner Agent (GPT-4o)**: The brain. Only runs once to break down vague user prompts into precise Pydantic task arrays.
*   **Researcher Agent (GPT-4o-mini)**: The context gatherer. Uses hybrid RAG (local vector + PageIndex reasoning) and web search tools (DuckDuckGo, PRAW) to find facts.
*   **Executor Agent (Phi-3.5-mini Serverless)**: The hands. A Small Language Model (SLM) that cheaply and quickly drafts Microsoft Graph API payloads (Calendar, Email) and runs Python tools.
*   **Reviewer Agent (GPT-4o-mini)**: Quality control. Validates the Executor's draft against the Planner's original goal. If it passes, it halts the system to trigger the React frontend's HITL approval.

## 4. Current Code Structure
```text
OrchestrAI/
├── backend/
│   ├── requirements.txt         # FastAPI, AutoGen 0.4, Azure SDKs, Pydantic
│   ├── config.py                # Pydantic BaseSettings loading the .env
│   ├── schemas.py               # Pydantic models (TaskRequest, WorkflowState, ApprovalRequest)
│   ├── database.py              # CosmosDB async CRUD operations (save_state, get_state)
│   ├── tools.py                 # Async function tools (web_search, book_outlook_meeting)
│   ├── team.py                  # AutoGen RoundRobinGroupChat setup and termination logic
│   ├── main.py                  # FastAPI endpoints (/api/workflow/start, /approve)
│   └── worker.py                # Background process listening to Service Bus to run agents
├── frontend/                    # React Frontend
├── .gitignore                   # Ignored files
└── README.md                    # Project Documentation
```

## 5. System Data Flow
1.  **POST `/api/workflow/start`**: React sends a prompt. FastAPI saves `PENDING` state to Cosmos DB and pushes a message to Service Bus.
2.  **Worker Processing**: `worker.py` picks up the message, initializes the AutoGen team, and starts the agent loop.
3.  **Agent Loop**: Planner -> Researcher -> Executor -> Reviewer.
4.  **HITL Pause**: Reviewer outputs `STATUS: PENDING_APPROVAL`. Worker saves the AutoGen state to Cosmos DB and stops.
5.  **POST `/api/workflow/approve`**: React sends an approval true/false. FastAPI sends a `RESUME` message to Service Bus. Worker reloads the state from Cosmos DB and fires the final API tools.
