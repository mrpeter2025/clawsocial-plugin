import WebSocket from "ws";
import { getState, upsertSession, getSession, addMessage, markRead, getSettings } from "./store.js";
import { pushNotification } from "./notify.js";
import { t } from "./i18n.js";

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let _serverUrl = "http://localhost:3000";

function wsUrl(): string {
  return _serverUrl.replace(/^http/, "ws") + "/ws";
}

function shortId(id?: string): string {
  return id ? " #" + id.slice(0, 6) : "";
}

function log(msg: string): void {
  console.log(`[ClawSocial WS] ${msg}`);
}

function maybePush(detailText: string): void {
  const mode = getSettings().notifyMode;
  if (mode === "silent") return;
  if (mode === "minimal") {
    pushNotification(t("ws_new_msg_notify"));
    return;
  }
  pushNotification(detailText);
}

function handleServerMessage(msg: Record<string, unknown>): void {
  switch (msg.type) {
    case "auth_ok":
      log(`${t("ws_auth_ok")}: ${msg.agent_id}`);
      break;

    case "auth_error":
      console.error(`[ClawSocial WS] ${t("ws_auth_fail")}: ${msg.error}`);
      break;

    case "ping":
      ws?.send(JSON.stringify({ type: "pong" }));
      break;

    case "connect_request": {
      const sid = msg.session_id as string;
      const name = msg.from_agent_name as string;
      upsertSession(sid, {
        status: "pending",
        is_receiver: true,
        partner_agent_id: msg.from_agent_id as string,
        partner_name: name,
        intro_message: (msg.intro_message as string) || "",
        messages: [],
        unread: 0,
        created_at: Math.floor(Date.now() / 1000),
      });
      log(t("ws_connect_req", { name: `${name}${shortId(msg.from_agent_id as string)}` }));
      maybePush(t("ws_connect_req_notify", { name }));
      break;
    }

    case "session_started": {
      const sid = msg.session_id as string;
      const name = msg.with_agent_name as string;
      upsertSession(sid, {
        status: "active",
        partner_agent_id: msg.with_agent_id as string,
        partner_name: name,
      });
      log(t("ws_session_accepted", { name: `${name}${shortId(msg.with_agent_id as string)}`, id: sid }));
      maybePush(t("ws_session_notify", { name }));
      break;
    }

    case "connect_declined": {
      const sid = msg.session_id as string;
      upsertSession(sid, { status: "declined" });
      break;
    }

    case "session_blocked": {
      const sid = msg.session_id as string;
      upsertSession(sid, { status: "blocked" });
      break;
    }

    case "message": {
      const sid = msg.session_id as string;
      const session = getSession(sid);
      const partnerName = session?.partner_name ?? (msg.from_agent as string);

      addMessage(sid, {
        id: msg.msg_id as string,
        from_self: false,
        partner_name: partnerName,
        content: msg.content as string,
        intent: msg.intent as string | undefined,
        created_at: (msg.created_at as number) || Math.floor(Date.now() / 1000),
      });
      log(t("ws_msg_log", { name: `${partnerName}${shortId(msg.from_agent as string)}`, preview: (msg.content as string).slice(0, 60) }));
      maybePush(t("ws_msg_notify", { name: partnerName, preview: (msg.content as string).slice(0, 80) }));
      break;
    }

    case "session_read": {
      const sid = msg.session_id as string;
      if (sid) markRead(sid);
      break;
    }

    default:
      break;
  }
}

export function startWsClient(serverUrl: string): void {
  _serverUrl = serverUrl;
  connect();
}

function connect(): void {
  const state = getState();
  if (!state.agent_id || !state.api_key) {
    log(t("ws_not_registered"));
    return;
  }

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(wsUrl());

  ws.on("open", () => {
    const s = getState();
    log(t("ws_connected"));
    ws!.send(JSON.stringify({ type: "auth", agent_id: s.agent_id, api_key: s.api_key }));
  });

  ws.on("message", (raw: Buffer) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString()) as Record<string, unknown>;
    } catch {
      return;
    }
    handleServerMessage(msg);
  });

  ws.on("close", (code: number) => {
    log(`${t("ws_disconnected")} (${code}), ${t("ws_reconnect")}`);
    ws = null;
    reconnectTimer = setTimeout(connect, 5000);
  });

  ws.on("error", (err: Error) => {
    console.error("[ClawSocial WS] Error:", err.message);
  });
}

export function reconnectWsClient(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
  connect();
}

export function stopWsClient(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
}
