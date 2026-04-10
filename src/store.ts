import fs from "node:fs";
import os from "node:os";
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

// NOTE: All file I/O is synchronous, which is safe in single-threaded Node.js
// (no concurrent read-modify-write races). If migrating to async I/O in the
// future, add a mutex/lock around read-modify-write sequences.
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

// ── Settings ────────────────────────────────────────────────────────

export type NotifyMode = "silent" | "minimal" | "detail";
export type Settings = { notifyMode: NotifyMode };

const DEFAULT_SETTINGS: Settings = { notifyMode: "silent" };

function settingsFile(): string {
  return path.join(getDataDir(), "settings.json");
}

export function getSettings(): Settings {
  const s = readJSON<Partial<Settings>>(settingsFile(), {});
  if (Object.keys(s).length === 0) {
    const agentId = getState().agent_id;
    if (agentId) {
      const backup = backupRead<Partial<Settings>>(agentId, "settings.json", {});
      if (Object.keys(backup).length > 0) {
        writeJSON(settingsFile(), backup);
        return { ...DEFAULT_SETTINGS, ...backup };
      }
    }
  }
  return { ...DEFAULT_SETTINGS, ...s };
}

export function setSettings(data: Partial<Settings>): void {
  const s = getSettings();
  const merged = { ...s, ...data };
  writeJSON(settingsFile(), merged);
  const agentId = readJSON<AgentState>(stateFile(), {}).agent_id;
  if (agentId) backupWrite(agentId, "settings.json", merged);
}

// ── Agent state ─────────────────────────────────────────────────────

export type AgentState = {
  agent_id?: string;
  api_key?: string;
  token?: string;
  public_name?: string;
  registered_at?: number;
  lang?: string;
};

// ── Sessions ────────────────────────────────────────────────────────

export function getSessions(): SessionsMap {
  const sessions = readJSON<SessionsMap>(sessionsFile(), {});
  if (Object.keys(sessions).length === 0) {
    const agentId = getState().agent_id;
    if (agentId) {
      const backup = backupRead<SessionsMap>(agentId, "sessions.json", {});
      if (Object.keys(backup).length > 0) {
        writeJSON(sessionsFile(), backup);
        return backup;
      }
    }
  }
  return sessions;
}

export function getSession(id: string): LocalSession | null {
  return getSessions()[id] ?? null;
}

function writeSessions(sessions: SessionsMap): void {
  writeJSON(sessionsFile(), sessions);
  const agentId = readJSON<AgentState>(stateFile(), {}).agent_id;
  if (agentId) backupWrite(agentId, "sessions.json", sessions);
}

export function upsertSession(id: string, data: Partial<LocalSession>): LocalSession {
  const sessions = getSessions();
  sessions[id] = { ...(sessions[id] ?? { id, messages: [], unread: 0 }), ...data, id };
  writeSessions(sessions);
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
  if (!msg.from_self) {
    sessions[sessionId].unread = (sessions[sessionId].unread ?? 0) + 1;
  }
  sessions[sessionId].updated_at = Math.floor(Date.now() / 1000);
  writeSessions(sessions);
}

export function markRead(sessionId: string): void {
  const sessions = getSessions();
  if (sessions[sessionId]) {
    sessions[sessionId].unread = 0;
    writeSessions(sessions);
  }
}

// ── Backup (survives plugin/OpenClaw reinstall) ─────────────────────
// Backup layout:
//   ~/.clawsocial/
//     last_active              ← agent_id of most recently used account
//     <agent_id>/
//       credentials.json
//       sessions.json
//       settings.json
//       contacts.json

const BACKUP_ROOT = path.join(os.homedir(), ".clawsocial");

function backupDir(agentId: string): string {
  return path.join(BACKUP_ROOT, agentId);
}

function backupWrite(agentId: string, name: string, data: unknown): void {
  try {
    const dir = backupDir(agentId);
    fs.mkdirSync(dir, { recursive: true });
    writeJSON(path.join(dir, name), data);
    // Update last_active marker
    fs.writeFileSync(path.join(BACKUP_ROOT, "last_active"), agentId);
  } catch {
    // best-effort backup, don't fail if write fails
  }
}

function backupRead<T>(agentId: string, name: string, fallback: T): T {
  try {
    return readJSON<T>(path.join(backupDir(agentId), name), fallback);
  } catch {
    return fallback;
  }
}

function getLastActiveAgentId(): string | null {
  try {
    return fs.readFileSync(path.join(BACKUP_ROOT, "last_active"), "utf8").trim() || null;
  } catch {
    return null;
  }
}

// ── Agent state ─────────────────────────────────────────────────────

export function getState(): AgentState {
  const state = readJSON<AgentState>(stateFile(), {});
  if (!state.agent_id || !state.api_key) {
    // Try restoring from backup using last_active agent
    const lastId = getLastActiveAgentId();
    if (lastId) {
      const backup = backupRead<AgentState>(lastId, "credentials.json", {});
      if (backup.agent_id && backup.api_key) {
        writeJSON(stateFile(), backup);
        return backup;
      }
    }
  }
  return state;
}

export function setState(data: Partial<AgentState>): void {
  const s = getState();
  const merged = { ...s, ...data };
  writeJSON(stateFile(), merged);
  if (merged.agent_id && merged.api_key) {
    backupWrite(merged.agent_id, "credentials.json", {
      agent_id: merged.agent_id,
      api_key: merged.api_key,
      public_name: merged.public_name,
      lang: merged.lang,
    });
  }
}

// ── Contacts ─────────────────────────────────────────────────────────

export type Contact = {
  name: string;
  agent_id: string;
  session_id?: string;
  topic_tags?: string[];
  profile?: string;
  added_at: number;
};

function contactsFile(): string {
  return path.join(process.env.HOME ?? "~", ".openclaw", "clawsocial_contacts.json");
}

export function readContacts(): Contact[] {
  try {
    const data = JSON.parse(fs.readFileSync(contactsFile(), "utf8"));
    if (Array.isArray(data?.contacts) && data.contacts.length > 0) return data.contacts;
  } catch {
    // fall through to backup
  }
  const agentId = getState().agent_id;
  if (agentId) {
    const backup = backupRead<{ contacts?: Contact[] }>(agentId, "contacts.json", {});
    if (Array.isArray(backup?.contacts) && backup.contacts.length > 0) {
      fs.mkdirSync(path.dirname(contactsFile()), { recursive: true });
      fs.writeFileSync(contactsFile(), JSON.stringify({ contacts: backup.contacts }, null, 2));
      return backup.contacts;
    }
  }
  return [];
}

export function upsertContact(contact: Omit<Contact, "added_at"> & { added_at?: number }): void {
  const contacts = readContacts();
  const idx = contacts.findIndex(c => c.agent_id === contact.agent_id);
  const entry: Contact = { ...contact, added_at: contact.added_at ?? Math.floor(Date.now() / 1000) };
  if (idx >= 0) {
    contacts[idx] = { ...contacts[idx], ...entry };
  } else {
    contacts.push(entry);
  }
  const data = { contacts };
  fs.writeFileSync(contactsFile(), JSON.stringify(data, null, 2));
  const agentId = readJSON<AgentState>(stateFile(), {}).agent_id;
  if (agentId) backupWrite(agentId, "contacts.json", data);
}

export function lookupContactByName(name: string): Contact[] {
  const lower = name.toLowerCase();
  return readContacts().filter(c => c.name.toLowerCase().includes(lower));
}
