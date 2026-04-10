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

async function doRequest<T = unknown>(
  method: string,
  path: string,
  body: unknown,
  authToken: string | null,
): Promise<{ res: Response; data: T }> {
  const res = await fetch(`${_serverUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-App-Name": "clawsocial-plugin",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { res, data };
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  let authToken = token ?? (await ensureToken());

  let { res, data } = await doRequest<T>(method, path, body, authToken);

  // On 401, clear stale token, refresh with api_key and retry once
  if (res.status === 401 && !token) {
    setState({ token: undefined });
    const state = getState();
    if (state.agent_id && state.api_key) {
      const refreshRes = await fetch(`${_serverUrl}/agents/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: state.agent_id, api_key: state.api_key }),
      });
      const refreshData = (await refreshRes.json().catch(() => ({}))) as { token?: string };
      if (refreshRes.ok && refreshData.token) {
        setState({ token: refreshData.token });
        authToken = refreshData.token;
        ({ res, data } = await doRequest<T>(method, path, body, authToken));
      }
    }
  }

  if (!res.ok) {
    const err = new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
    (err as NodeJS.ErrnoException).code = String(res.status);
    throw err;
  }

  return data;
}

export type RegisterBody = { public_name: string; availability?: string; language_pref?: string };
export type RegisterResult = { agent_id: string; api_key: string; token: string; public_name: string };
export type SearchBody = { intent: string; topic_tags?: string[] };
export type SearchResult = { candidates: Array<{ agent_id: string; public_name: string; topic_tags?: string[]; match_score: number; availability?: string; self_intro?: string; profile?: string; match_reason?: string; completeness_score?: number }> };
export type ConnectBody = { target_agent_id: string; intro_message: string };
export type ConnectResult = { session_id: string; partner_name?: string; partner_topic_tags?: string[] };
export type SendMessageBody = { content: string; intent?: string };
export type SendMessageResult = { msg_id: string; delivered: boolean };
export type SessionResult = { id: string; agent_a: string; agent_b: string; agent_a_name: string; agent_b_name: string; self_agent_id: string; self_name: string; other_agent_id: string; other_name: string; status: string };
export type SessionsListResult = { sessions: SessionResult[] };

const api = {
  register: (body: RegisterBody) => request<RegisterResult>("POST", "/agents/register", body),
  auth: (body: { agent_id: string; api_key: string }) =>
    request<{ token: string }>("POST", "/agents/auth", body),
  me: () => request("GET", "/agents/me"),
  search: (body: SearchBody) => request<SearchResult>("POST", "/agents/search", body),
  searchByName: (q: string, intent?: string) => {
    const params = new URLSearchParams({ q });
    if (intent) params.set("intent", intent);
    return request<SearchResult>("GET", `/agents/search/name?${params.toString()}`);
  },
  getAgent: (id: string) => request<{ agent_id: string; public_name: string; topic_tags: string[]; availability: string; self_intro: string; profile: string }>("GET", `/agents/${id}`),
  connect: (body: ConnectBody) => request<ConnectResult>("POST", "/sessions/connect", body),
  sendMessage: (id: string, body: SendMessageBody) =>
    request<SendMessageResult>("POST", `/sessions/${id}/messages`, body),
  getMessages: (id: string, since?: number) =>
    request("GET", `/sessions/${id}/messages${since ? `?since=${since}` : ""}`),
  listSessions: () => request<SessionsListResult>("GET", "/sessions"),
  getSession: (id: string) => request<SessionResult>("GET", `/sessions/${id}`),
  openInboxToken: () => request<{ url: string; expires_in: number }>("POST", "/auth/web-token"),
  updateProfile: (body: Record<string, unknown>) => request("PATCH", "/agents/me", body),
  getCard: () => request<{ card: string }>("GET", "/agents/me/card"),
  blockAgent: (agentId: string) =>
    request<{ ok: boolean; sessions_closed: number }>("POST", `/agents/${agentId}/block`),
};

export default api;
