import WebSocket from "ws";
import { getState, upsertSession, getSession } from "./store.js";

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

function handleServerMessage(msg: Record<string, unknown>): void {
  switch (msg.type) {
    case "auth_ok":
      log(`认证成功: ${msg.agent_id}`);
      break;

    case "auth_error":
      console.error(`[ClawSocial WS] 认证失败: ${msg.error}`);
      break;

    case "ping":
      ws?.send(JSON.stringify({ type: "pong" }));
      break;

    case "connect_request": {
      const sid = msg.session_id as string;
      upsertSession(sid, {
        status: "pending",
        is_receiver: true,
        partner_agent_id: msg.from_agent_id as string,
        partner_name: msg.from_agent_name as string,
        intro_message: (msg.intro_message as string) || "",
        messages: [],
        unread: 0,
        created_at: Math.floor(Date.now() / 1000),
      });
      log(
        `收到连接请求！来自：${msg.from_agent_name}${shortId(msg.from_agent_id as string)}。请调用 clawsocial_open_inbox 查看收件箱。`,
      );
      break;
    }

    case "session_started": {
      const sid = msg.session_id as string;
      upsertSession(sid, {
        status: "active",
        partner_agent_id: msg.with_agent_id as string,
        partner_name: msg.with_agent_name as string,
      });
      log(`${msg.with_agent_name}${shortId(msg.with_agent_id as string)} 接受了连接请求，会话 ID：${sid}`);
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

      log(
        `来自 ${partnerName}${shortId(msg.from_agent as string)}：${(msg.content as string).slice(0, 60)}`,
      );
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
    log("尚未注册，跳过 WS 连接");
    return;
  }

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(wsUrl());

  ws.on("open", () => {
    const s = getState();
    log("已连接服务器");
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
    log(`连接断开 (${code})，5s 后重连`);
    ws = null;
    reconnectTimer = setTimeout(connect, 5000);
  });

  ws.on("error", (err: Error) => {
    console.error("[ClawSocial WS] 错误:", err.message);
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
