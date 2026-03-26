import fs from "node:fs";
import path from "node:path";

let _stateDir: string | null = null;

export function initStore(dir: string): void {
  _stateDir = dir;
  fs.mkdirSync(dir, { recursive: true });
}

function getDataDir(): string {
  if (_stateDir) return _stateDir;
  const fallback = path.join(process.env.HOME ?? "~", ".openclaw", "plugins", "clawsocial");
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

function sessionsFile(): string {
  return path.join(getDataDir(), "sessions.json");
}

function stateFile(): string {
  return path.join(getDataDir(), "state.json");
}

function readJSON<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(file: string, data: unknown): void {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── Session types ───────────────────────────────────────────────────

export type LocalMessage = {
  id: string;
  from_self: boolean;
  partner_name?: string;
  content: string;
  intent?: string;
  created_at: number;
};

export type LocalSession = {
  id: string;
  status: string;
  is_receiver?: boolean;
  partner_agent_id?: string;
  partner_name?: string;
  intro_message?: string;
  messages: LocalMessage[];
  last_message?: string;
  last_active_at?: number;
  unread: number;
  created_at?: number;
  updated_at?: number;
};

type SessionsMap = Record<string, LocalSession>;

// ── Agent state ─────────────────────────────────────────────────────

export type AgentState = {
  agent_id?: string;
  api_key?: string;
  token?: string;
  public_name?: string;
  registered_at?: number;
};

// ── Sessions ────────────────────────────────────────────────────────

export function getSessions(): SessionsMap {
  return readJSON<SessionsMap>(sessionsFile(), {});
}

export function getSession(id: string): LocalSession | null {
  return getSessions()[id] ?? null;
}

export function upsertSession(id: string, data: Partial<LocalSession>): LocalSession {
  const sessions = getSessions();
  sessions[id] = { ...(sessions[id] ?? { id, messages: [], unread: 0 }), ...data, id };
  writeJSON(sessionsFile(), sessions);
  return sessions[id];
}

export function addMessage(sessionId: string, msg: LocalMessage): void {
  const sessions = getSessions();
  if (!sessions[sessionId]) {
    sessions[sessionId] = { id: sessionId, messages: [], status: "active", unread: 0 };
  }
  sessions[sessionId].messages.push(msg);
  sessions[sessionId].last_message = msg.content;
  sessions[sessionId].last_active_at = msg.created_at;
  sessions[sessionId].unread = (sessions[sessionId].unread ?? 0) + 1;
  sessions[sessionId].updated_at = Math.floor(Date.now() / 1000);
  writeJSON(sessionsFile(), sessions);
}

export function markRead(sessionId: string): void {
  const sessions = getSessions();
  if (sessions[sessionId]) {
    sessions[sessionId].unread = 0;
    writeJSON(sessionsFile(), sessions);
  }
}

// ── Agent state ─────────────────────────────────────────────────────

export function getState(): AgentState {
  return readJSON<AgentState>(stateFile(), {});
}

export function setState(data: Partial<AgentState>): void {
  const s = getState();
  writeJSON(stateFile(), { ...s, ...data });
}
