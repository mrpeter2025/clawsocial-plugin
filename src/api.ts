import { getState, setState } from "./store.js";

let _serverUrl = "http://localhost:3000";

export function initApi(url: string): void {
  _serverUrl = url;
}

async function ensureToken(): Promise<string | null> {
  const state = getState();
  if (state.token) return state.token;

  if (state.agent_id && state.api_key) {
    const res = await fetch(`${_serverUrl}/agents/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: state.agent_id, api_key: state.api_key }),
    });
    const data = (await res.json().catch(() => ({}))) as { token?: string };
    if (res.ok && data.token) {
      setState({ token: data.token });
      return data.token;
    }
  }
  return null;
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const authToken = token ?? (await ensureToken());

  const res = await fetch(`${_serverUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };

  if (!res.ok) {
    const err = new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
    (err as NodeJS.ErrnoException).code = String(res.status);
    throw err;
  }

  return data;
}

export type RegisterBody = { public_name: string; availability?: string };
export type RegisterResult = { agent_id: string; api_key: string; token: string; public_name: string };
export type SearchBody = { intent: string; topic_tags?: string[]; top_k?: number };
export type SearchResult = { candidates: Array<{ agent_id: string; public_name: string; topic_tags?: string[]; match_score: number; availability?: string }> };
export type ConnectBody = { target_agent_id: string; intro_message: string };
export type ConnectResult = { session_id: string };
export type SendMessageBody = { content: string; intent?: string };
export type SendMessageResult = { msg_id: string; delivered: boolean };
export type BlockResult = { sessions_closed: number };
export type SessionResult = { id: string; agent_a: string; agent_b: string; status: string };
export type SessionsListResult = { sessions: SessionResult[] };

const api = {
  register: (body: RegisterBody) => request<RegisterResult>("POST", "/agents/register", body),
  auth: (body: { agent_id: string; api_key: string }) =>
    request<{ token: string }>("POST", "/agents/auth", body),
  me: () => request("GET", "/agents/me"),
  search: (body: SearchBody) => request<SearchResult>("POST", "/agents/search", body),
  blockAgent: (agentId: string) => request<BlockResult>("POST", `/agents/${agentId}/block`),

  connect: (body: ConnectBody) => request<ConnectResult>("POST", "/sessions/connect", body),
  acceptSession: (id: string) => request("POST", `/sessions/${id}/accept`),
  declineSession: (id: string) => request("POST", `/sessions/${id}/decline`),
  sendMessage: (id: string, body: SendMessageBody) =>
    request<SendMessageResult>("POST", `/sessions/${id}/messages`, body),
  getMessages: (id: string, since?: number) =>
    request("GET", `/sessions/${id}/messages${since ? `?since=${since}` : ""}`),
  listSessions: () => request<SessionsListResult>("GET", "/sessions"),
  getSession: (id: string) => request<SessionResult>("GET", `/sessions/${id}`),
  openInboxToken: () => request<{ url: string; expires_in: number }>("POST", "/auth/web-token"),
  updateProfile: (body: Record<string, unknown>) => request("PATCH", "/agents/me", body),
};

export default api;
