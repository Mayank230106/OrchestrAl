<p align="center">
  <img src="assets/logo.png" width="300" alt="OrchestrAI Logo">
</p>

<h1 align="center">OrchestrAI</h1>

<p align="center">
  <strong>Production-ready Asynchronous Multi-Agent Orchestration Framework</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.100+-green?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Azure-Service_Bus-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white" alt="Azure Service Bus">
  <img src="https://img.shields.io/badge/AutoGen-0.4-orange?style=for-the-badge" alt="AutoGen">
</p>

<hr />

## 🌟 Vision
**OrchestrAI** is not just another chatbot interface; it's a **digital workforce**. Designed for high-stakes business automation, it decomposes complex user requests into actionable sequences, executes them across multiple tools (Outlook, Web Search, PDF Analysis), and enforces **Human-in-the-Loop (HITL)** safety at every step.

---

## 🛠️ Tech Stack & Infrastructure

- **🖥️ Mission Control (Frontend)**: A sophisticated React dashboard with live execution telemetry, execution graphs, and interactive HITL approval flows.
- **🚀 Neural Gateway (Backend)**: FastAPI serving as a high-performance bridge between the UI and the agent swarm.
- **🧠 Agent Swarm**: Powered by **Microsoft AutoGen (v0.4.x)**, utilizing a tiered model strategy (GPT-4o for planning, Phi-3.5 for execution) to balance cost and intelligence.
- **💾 State Persistence**: Azure Cosmos DB (Serverless) for durable session memory and workflow resumption.
- **📡 Async Pulse**: Azure Service Bus handles job queuing, ensuring zero timeouts for long-running agent reasoning loops.

---

## 🗺️ System Architecture

```mermaid
sequenceDiagram
    participant U as User (React UI)
    participant B as Backend (FastAPI)
    participant Q as Async Queue (Service Bus)
    participant W as Worker (AutoGen Swarm)
    participant D as State (Cosmos DB)

    U->>B: POST /api/workflow/start (Prompt)
    B->>D: Initialize Session State
    B->>Q: Dispatch 'START' Message
    B-->>U: Return Session ID
    Q->>W: Consume Task
    W->>W: [Loop] Planner -> Researcher -> Executor
    W->>D: Save Intermediate Agent Logs
    W->>W: Reviewer: Detect PENDING_APPROVAL
    W->>D: Set status: PAUSED_FOR_HITL
    D-->>U: SSE Update: "Waiting for you..."
    U->>B: POST /api/workflow/approve (Feedback)
    B->>Q: Dispatch 'RESUME' Message
    Q->>W: Finalize Execution & Summary
    W->>D: Set status: COMPLETED
```

---

## 👥 The Agent Team

| Agent | Role | Model | Specialization |
| :--- | :--- | :--- | :--- |
| **Planner** | The Architect | `GPT-4o` | Decomposes prompts into precise Pydantic task arrays. |
| **Researcher** | The Investigator | `GPT-4o-mini` | RAG, PageIndex reasoning, and live Web Search. |
| **Executor** | The Operator | `Phi-3.5-mini` | Drafting MS Graph payloads and Python tool execution. |
| **Reviewer** | The Auditor | `GPT-4o-mini` | Quality control and HITL trigger logic. |

---

## 🚀 Quick Start

### 1. Environment Setup
Create a `.env` file in the root directory (refer to `.env.example`).
```bash
# Azure Credentials
SERVICE_BUS_CONNECTION_STRING="..."
COSMOS_CONNECTION_STRING="..."
AZURE_OPENAI_API_KEY="..."

# Tools
BREVO_API_KEY="..."
SERPER_API_KEY="..."
```

### 2. Launch the Backend
```bash
# Terminal 1
python -m uvicorn backend.main:app --reload --port 8000
```

### 3. Launch the Frontend
```bash
# Terminal 2
cd frontend
npm install
npm run dev
```

---

## 🔒 Security & Privacy
- **JWT Authentication**: All endpoints are protected with industry-standard tokens.
- **Data Isolation**: Multi-tenant architecture ensures one user's logs never leak to another.
- **Safety First**: No destructive actions (emails, calendar invites) are sent without your explicit click in the dashboard.

<p align="center">
  <i>Built with ❤️ for AI Unlocked Challenge - Track 4</i>
</p>
