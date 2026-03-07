// Central API service layer — all calls go through the Vite proxy to localhost:8000
const BASE_URL = '/api';

// ─── Workflow ───────────────────────────────────────────────────────────────

export async function startWorkflow(prompt) {
  const res = await fetch(`${BASE_URL}/workflow/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
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
  return data.tasks || []; // array of workflow summaries
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
