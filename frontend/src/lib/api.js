// Central API service layer — all calls go through the Vite proxy to localhost:8000
const BASE_URL = '/api';

// ─── Workflow ───────────────────────────────────────────────────────────────

export async function startWorkflow(prompt, enabled_mcps = []) {
  const res = await fetch(`${BASE_URL}/workflow/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, enabled_mcps }),
  });
  if (!res.ok) throw new Error(`Failed to start workflow: ${res.statusText}`);
  return res.json(); // { session_id, status }
}

export function streamWorkflow(sessionId) {
  // Returns an EventSource; caller is responsible for closing it
  return new EventSource(`${BASE_URL}/workflow/${sessionId}/stream`);
}

export async function approveWorkflow(sessionId, approved, feedback = '') {
  const res = await fetch(`${BASE_URL}/workflow/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, approved, feedback }),
  });
  if (!res.ok) throw new Error(`Failed to approve workflow: ${res.statusText}`);
  return res.json();
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getHistory() {
  const res = await fetch(`${BASE_URL}/history`);
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.statusText}`);
  const data = await res.json();
  return data.tasks || [];
}

export async function getWorkflowDetail(sessionId) {
  const res = await fetch(`${BASE_URL}/workflow/${sessionId}`);
  if (!res.ok) throw new Error(`Failed to fetch workflow: ${res.statusText}`);
  return res.json(); // full state including chat_history
}

export async function deleteWorkflow(sessionId) {
  const res = await fetch(`${BASE_URL}/workflow/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete workflow: ${res.statusText}`);
  return res.json();
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export async function getRecentLogs() {
  const res = await fetch(`${BASE_URL}/logs/recent`);
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.statusText}`);
  const data = await res.json();
  return data.logs || []; // array of { session_id, agent, content, type }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getProfile() {
  const res = await fetch(`${BASE_URL}/profile`);
  if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
  return res.json(); // { full_name, github_username, github_url, bio, skills }
}

export async function updateProfile(profileData) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) throw new Error(`Failed to update profile: ${res.statusText}`);
  return res.json();
}

// ─── MCP Settings ─────────────────────────────────────────────────────────────

export async function getMcpConfigs() {
  const res = await fetch(`${BASE_URL}/mcp`);
  if (!res.ok) throw new Error(`Failed to fetch MCP configs: ${res.statusText}`);
  const data = await res.json();
  return data.configs || [];
}

export async function saveMcpConfig(configData) {
  const res = await fetch(`${BASE_URL}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configData),
  });
  if (!res.ok) throw new Error(`Failed to save MCP config: ${res.statusText}`);
  return res.json();
}

export async function deleteMcpConfig(mcpId) {
  const res = await fetch(`${BASE_URL}/mcp/${mcpId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete MCP config: ${res.statusText}`);
  return res.json();
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

/** Global Calendar Data Retrieval */
export async function getCalendarEvents() {
    const res = await fetch(`${BASE_URL}/calendar`);
    if (!res.ok) throw new Error('Failed to fetch calendar events');
    const data = await res.json();
    return data.events || [];
}


// ─── Auth ─────────────────────────────────────────────────────────────────────
// These hit /auth/* directly (not /api/*) — update vite.config.js proxy if needed

/** Register a new account. Throws with the server's error message on failure. */
export async function signup(name, email, password) {
    const res = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
        // FastAPI puts the error in detail; surface that directly to the UI
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Signup failed. Please try again.');
    }
    return res.json(); // { message: "Account created successfully." }
}

/** Log in and receive a JWT + user object. Throws on bad credentials. */
export async function login(email, password) {
    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Invalid email or password.');
    }
    return res.json(); // { access_token, token_type, user: { id, name, email, created_at } }
}

/** Verify a stored token is still valid and fetch the current user object. */
export async function getMe(token) {
    const res = await fetch('/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Token invalid or expired.');
    return res.json(); // { id, name, email }
}

