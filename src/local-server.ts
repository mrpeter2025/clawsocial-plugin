import http from "node:http";
import { getSessions, addMessage, markRead } from "./store.js";
import api from "./api.js";
import { t, getLang, formatTime, formatDateTime } from "./i18n.js";

let _server: http.Server | null = null;
let _port: number | null = null;

// ── Port finder ──────────────────────────────────────────────────────

function findAvailablePort(start: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = http.createServer();
    probe.listen(start, "127.0.0.1", () => {
      const port = (probe.address() as { port: number }).port;
      probe.close(() => resolve(port));
    });
    probe.on("error", () =>
      findAvailablePort(start + 1).then(resolve).catch(reject),
    );
  });
}

// ── HTML helpers ─────────────────────────────────────────────────────

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escJs(s: string): string {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/</g, "\\x3c")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

function escContent(s: string): string {
  return esc(s).replace(/\n/g, "<br>");
}

function htmlLang(): string {
  return getLang() === "zh" ? "zh-CN" : "en";
}

const SHARED_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f0f13; --surface: #1a1a22; --surface2: #22222e;
    --border: #2e2e3e; --text: #f0f0f5; --text-muted: #7a7a9a;
    --accent: #7c6af7; --accent-light: #9d8ff9;
    --green: #30d158; --red: #ff453a; --unread: #7c6af7;
    --bubble-self: #7c6af7; --bubble-other: #22222e;
  }
  body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif; background: var(--bg); color: var(--text); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
`;

// ── Sessions list page ───────────────────────────────────────────────

function renderSessions(): string {
  const sessions = getSessions();
  const list = Object.values(sessions).sort(
    (a, b) => (b.last_active_at ?? 0) - (a.last_active_at ?? 0),
  );
  const totalUnread = list.reduce((s, x) => s + (x.unread ?? 0), 0);

  const cards = list.length === 0
    ? `<div class="empty">
        <div class="empty-icon">🦞</div>
        <h2>${t("local_no_sessions")}</h2>
        <p>${t("local_no_sessions_p")}</p>
       </div>`
    : list.map((s) => {
        const name = esc(s.partner_name ?? s.partner_agent_id ?? t("local_unknown"));
        const avatarChar = (s.partner_name ?? s.partner_agent_id ?? "?")[0].toUpperCase();
        const preview = esc((s.last_message ?? t("local_no_msg")).slice(0, 60));
        const unreadBadge = (s.unread ?? 0) > 0
          ? `<span class="unread-badge">${s.unread}</span>` : "";
        const statusClass = s.status === "active" ? "status-active" : "status-pending";
        const statusLabel = s.status === "active" ? t("local_active") : s.status === "pending" ? t("local_pending") : s.status;
        const time = s.last_active_at
          ? formatDateTime(s.last_active_at) : "";
        return `
        <a class="session-card${(s.unread ?? 0) > 0 ? " has-unread" : ""}" href="/session/${esc(s.id)}">
          <div class="avatar">${esc(avatarChar)}</div>
          <div class="card-body">
            <div class="card-top">
              <span class="partner-name">${name}</span>
              <span class="card-time">${time}</span>
            </div>
            <div class="last-msg">${preview}</div>
            <div class="card-bottom">
              <span class="status-pill ${statusClass}">${statusLabel}</span>
              ${unreadBadge}
            </div>
          </div>
        </a>`;
      }).join("\n");

  return `<!DOCTYPE html>
<html lang="${htmlLang()}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t("local_title")}</title>
<style>
${SHARED_CSS}
header {
  background: var(--surface); border-bottom: 1px solid var(--border);
  padding: 0 24px; height: 60px;
  display: flex; align-items: center; gap: 12px;
  position: sticky; top: 0; z-index: 10;
}
.logo { font-size: 22px; }
header h1 { font-size: 17px; font-weight: 600; flex: 1; }
.badge { background: var(--accent); color: #fff; border-radius: 20px; padding: 3px 10px; font-size: 12px; font-weight: 700; }
.local-tag { background: rgba(48,209,88,.15); color: var(--green); border-radius: 8px; padding: 3px 10px; font-size: 12px; font-weight: 500; }
.home-link { color: var(--text-muted); text-decoration: none; font-size: 13px; padding: 5px 10px; border-radius: 8px; transition: background 0.15s, color 0.15s; }
.home-link:hover { background: var(--surface2); color: var(--accent-light); }
.container { max-width: 680px; margin: 0 auto; padding: 24px 16px; }
.session-list { display: flex; flex-direction: column; gap: 8px; }
.session-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 16px; padding: 16px 18px; cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  text-decoration: none; color: inherit;
  display: flex; align-items: center; gap: 14px;
}
.session-card:hover { background: var(--surface2); border-color: var(--accent); transform: translateY(-1px); }
.session-card.has-unread { border-left: 3px solid var(--unread); }
.avatar {
  width: 46px; height: 46px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #a78bfa);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.card-body { flex: 1; min-width: 0; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.partner-name { font-size: 15px; font-weight: 600; }
.card-time { font-size: 12px; color: var(--text-muted); }
.last-msg { font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
.status-pill { font-size: 11px; padding: 2px 8px; border-radius: 8px; font-weight: 500; }
.status-active { background: rgba(48,209,88,.15); color: var(--green); }
.status-pending { background: rgba(255,214,10,.12); color: #ffd60a; }
.unread-badge { background: var(--accent); color: #fff; border-radius: 12px; padding: 2px 8px; font-size: 11px; font-weight: 700; }
.empty { text-align: center; padding: 80px 24px; color: var(--text-muted); }
.empty-icon { font-size: 52px; margin-bottom: 16px; }
.empty h2 { font-size: 18px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
.empty p { font-size: 14px; line-height: 1.6; }
</style>
</head>
<body>
<header>
  <span class="logo">🦞</span>
  <h1>Claw-Social</h1>
  ${totalUnread > 0 ? `<span class="badge">${totalUnread}</span>` : ""}
  <span class="local-tag">${t("local_tag")}</span>
  <a class="home-link" href="https://claw-social.com" target="_blank">${t("local_home")}</a>
</header>
<div class="container">
  <div class="session-list">${cards}</div>
</div>
<script>
  setTimeout(() => location.reload(), 10000);
</script>
</body>
</html>`;
}

// ── Session detail page ──────────────────────────────────────────────

function renderSession(sessionId: string): string | null {
  const sessions = getSessions();
  const session = sessions[sessionId];
  if (!session) return null;

  markRead(sessionId);

  const partnerName = esc(session.partner_name ?? session.partner_agent_id ?? t("local_unknown"));
  const avatarChar = esc(
    (session.partner_name ?? session.partner_agent_id ?? "?")[0].toUpperCase(),
  );
  const isActive = session.status === "active";
  const statusClass = isActive ? "status-active" : "status-pending";
  const statusLabel = isActive ? t("local_active") : session.status === "pending" ? t("local_pending") : esc(session.status);
  const totalCount = (session.messages ?? []).length;

  const msgHtml = (session.messages ?? []).length === 0
    ? `<div class="empty-state"><div class="icon">💬</div><p>${t("local_no_messages")}</p></div>`
    : (session.messages ?? []).map((m) => {
        const time = m.created_at
          ? formatTime(m.created_at)
          : "";
        const side = m.from_self ? "msg-self" : "msg-other";
        const avatarEl = m.from_self ? "" : `<div class="msg-avatar">${avatarChar}</div>`;
        return `
        <div class="msg ${side}" data-id="${esc(m.id)}">
          <div class="msg-row">${avatarEl}<div class="bubble">${escContent(m.content)}</div></div>
          <div class="msg-meta">${time}</div>
        </div>`;
      }).join("\n");

  const replyBar = isActive ? `
  <div class="reply-bar">
    <textarea id="replyInput" placeholder="${t("local_placeholder")}" rows="1"></textarea>
    <button class="send-btn" id="sendBtn">↑</button>
  </div>` : "";

  // Pre-compute i18n strings for client-side JS
  const clientLocale = getLang() === "zh" ? "zh-CN" : "en-US";
  const clientSendFail = escJs(t("local_send_fail"));
  const clientUnknownErr = escJs(t("local_unknown_err"));

  return `<!DOCTYPE html>
<html lang="${htmlLang()}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${partnerName} — Claw-Social</title>
<style>
${SHARED_CSS}
body { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
header {
  background: var(--surface); border-bottom: 1px solid var(--border);
  padding: 0 16px; height: 60px;
  display: flex; align-items: center; gap: 12px; flex-shrink: 0;
}
.back-btn { color: var(--accent-light); text-decoration: none; font-size: 13px; display: flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: 8px; transition: background 0.15s; }
.back-btn:hover { background: var(--surface2); }
.home-link { color: var(--text-muted); text-decoration: none; font-size: 13px; padding: 5px 10px; border-radius: 8px; transition: background 0.15s, color 0.15s; }
.home-link:hover { background: var(--surface2); color: var(--accent-light); }
.header-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #a78bfa);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.header-info { flex: 1; min-width: 0; }
.header-name { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.header-sub { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 5px; margin-top: 1px; }
.status-pill { font-size: 11px; padding: 2px 7px; border-radius: 6px; font-weight: 500; }
.status-active { background: rgba(48,209,88,.15); color: var(--green); }
.status-pending { background: rgba(255,214,10,.12); color: #ffd60a; }
.local-tag { background: rgba(48,209,88,.15); color: var(--green); border-radius: 8px; padding: 3px 10px; font-size: 12px; font-weight: 500; }
.msg-count { font-size: 12px; color: var(--text-muted); }
.messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 4px; scroll-behavior: smooth;
}
.messages::-webkit-scrollbar { width: 4px; }
.messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.msg { max-width: 75%; margin-bottom: 2px; }
.msg-self { align-self: flex-end; }
.msg-other { align-self: flex-start; }
.msg-row { display: flex; align-items: flex-end; gap: 8px; }
.msg-self .msg-row { flex-direction: row-reverse; }
.msg-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #a78bfa);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.bubble {
  padding: 10px 14px; border-radius: 18px;
  line-height: 1.55; font-size: 14px; white-space: pre-wrap; word-break: break-word;
}
.msg-self .bubble { background: var(--bubble-self); color: #fff; border-bottom-right-radius: 5px; }
.msg-other .bubble { background: var(--bubble-other); color: var(--text); border-bottom-left-radius: 5px; border: 1px solid var(--border); }
.msg-meta { font-size: 11px; color: var(--text-muted); margin-top: 3px; padding: 0 6px; opacity: 0; transition: opacity 0.15s; }
.msg:hover .msg-meta { opacity: 1; }
.msg-self .msg-meta { text-align: right; }
.empty-state { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; color: var(--text-muted); }
.empty-state .icon { font-size: 40px; }
.reply-bar {
  background: var(--surface); border-top: 1px solid var(--border);
  padding: 12px 16px; display: flex; align-items: flex-end; gap: 10px; flex-shrink: 0;
}
.reply-bar textarea {
  flex: 1; background: var(--surface2); color: var(--text);
  border: 1px solid var(--border); border-radius: 20px;
  padding: 10px 16px; font-size: 14px; resize: none; font-family: inherit;
  line-height: 1.5; max-height: 120px; transition: border-color 0.15s;
}
.reply-bar textarea::placeholder { color: var(--text-muted); }
.reply-bar textarea:focus { outline: none; border-color: var(--accent); }
.send-btn {
  background: var(--accent); color: #fff; border: none; border-radius: 50%;
  width: 40px; height: 40px; cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: opacity 0.15s, transform 0.1s;
}
.send-btn:hover { opacity: 0.85; transform: scale(1.05); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
@media (max-width: 480px) { .msg { max-width: 88%; } }
</style>
</head>
<body>
<header>
  <a class="back-btn" href="/">${t("local_back")}</a>
  <div class="header-avatar">${avatarChar}</div>
  <div class="header-info">
    <div class="header-name">${partnerName}</div>
    <div class="header-sub">
      <span class="status-pill ${statusClass}">${statusLabel}</span>
      <span class="msg-count">${t("local_msg_count", { n: totalCount })}</span>
    </div>
  </div>
  <span class="local-tag">${t("local_tag")}</span>
  <a class="home-link" href="https://claw-social.com" target="_blank">${t("local_home")}</a>
</header>

<div class="messages" id="messages">
  ${msgHtml}
</div>

${replyBar}

<script>
const SESSION_ID = '${escJs(sessionId)}';
const AVATAR_CHAR = '${escJs(avatarChar)}';
const IS_ACTIVE = ${isActive ? "true" : "false"};
const CLIENT_LOCALE = '${clientLocale}';
const SEND_FAIL = '${clientSendFail}';
const UNKNOWN_ERR = '${clientUnknownErr}';
const msgs = document.getElementById('messages');

function scrollBottom() { msgs.scrollTop = msgs.scrollHeight; }
scrollBottom();

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

function appendMessage(m) {
  const empty = msgs.querySelector('.empty-state');
  if (empty) empty.remove();
  const isSelf = m.from_self === true || m.from_self === 'true';
  const t = m.created_at ? new Date(m.created_at * 1000).toLocaleTimeString(CLIENT_LOCALE, {hour:'2-digit',minute:'2-digit'}) : '';
  const div = document.createElement('div');
  div.className = 'msg ' + (isSelf ? 'msg-self' : 'msg-other');
  div.setAttribute('data-id', m.id || '');
  div.innerHTML =
    '<div class="msg-row">' +
    (!isSelf ? '<div class="msg-avatar">' + escHtml(AVATAR_CHAR) + '</div>' : '') +
    '<div class="bubble">' + escHtml(m.content) + '</div></div>' +
    '<div class="msg-meta">' + t + '</div>';
  msgs.appendChild(div);
}

let lastMsgId = msgs.lastElementChild?.getAttribute('data-id') || '';
setInterval(async () => {
  try {
    const res = await fetch('/session/' + SESSION_ID + '/messages?after=' + encodeURIComponent(lastMsgId));
    if (!res.ok) return;
    const newMsgs = await res.json();
    if (newMsgs.length > 0) {
      const wasAtBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 60;
      newMsgs.forEach(m => { appendMessage(m); lastMsgId = m.id || lastMsgId; });
      if (wasAtBottom) scrollBottom();
    }
  } catch {}
}, 5000);

${isActive ? `
const inp = document.getElementById('replyInput');
const btn = document.getElementById('sendBtn');
inp.addEventListener('input', () => {
  inp.style.height = 'auto';
  inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
});
inp.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
});
btn.addEventListener('click', sendReply);

async function sendReply() {
  const content = inp.value.trim();
  if (!content) return;
  btn.disabled = true;
  inp.value = '';
  inp.style.height = 'auto';
  try {
    const res = await fetch('/session/' + SESSION_ID + '/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (data.ok) {
      appendMessage({ from_self: true, content, created_at: Math.floor(Date.now()/1000), id: 'local-' + Date.now() });
      scrollBottom();
    } else {
      alert(SEND_FAIL + '\\uff1a' + (data.error || UNKNOWN_ERR));
      inp.value = content;
    }
  } catch (err) {
    alert(SEND_FAIL + '\\uff1a' + err.message);
    inp.value = content;
  } finally {
    btn.disabled = false;
    inp.focus();
  }
}` : ""}
</script>
</body>
</html>`;
}

// ── Request handler ──────────────────────────────────────────────────

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = url.pathname;

  // GET / — sessions list
  if (req.method === "GET" && pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderSessions());
    return;
  }

  // GET /session/:id — session detail
  const sessionMatch = pathname.match(/^\/session\/([^/]+)$/);
  if (req.method === "GET" && sessionMatch) {
    const html = renderSession(sessionMatch[1]);
    if (!html) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  // GET /session/:id/messages?after=<lastId> — polling new messages
  const msgsMatch = pathname.match(/^\/session\/([^/]+)\/messages$/);
  if (req.method === "GET" && msgsMatch) {
    const session = getSessions()[msgsMatch[1]];
    if (!session) { res.writeHead(404); res.end("[]"); return; }
    const afterId = url.searchParams.get("after") ?? "";
    const msgs = session.messages ?? [];
    const idx = afterId ? msgs.findIndex((m) => m.id === afterId) : -1;
    const newMsgs = idx >= 0 ? msgs.slice(idx + 1) : [];
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(newMsgs));
    return;
  }

  // POST /session/:id/reply — send message
  const replyMatch = pathname.match(/^\/session\/([^/]+)\/reply$/);
  if (req.method === "POST" && replyMatch) {
    const origin = req.headers.origin ?? "";
    if (origin && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Origin not allowed" }));
      return;
    }
    const sessionId = replyMatch[1];
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", async () => {
      try {
        const { content } = JSON.parse(body) as { content: string };
        if (!content?.trim()) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "content required" }));
          return;
        }
        await api.sendMessage(sessionId, { content, intent: "chat" });
        // Also store in local sessions.json
        const session = getSessions()[sessionId];
        addMessage(sessionId, {
          id: `local-${Date.now()}`,
          from_self: true,
          content,
          intent: "chat",
          created_at: Math.floor(Date.now() / 1000),
          partner_name: session?.partner_name,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err: unknown) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
}

// ── Public API ───────────────────────────────────────────────────────

export async function startLocalServer(): Promise<string> {
  if (_server && _port) {
    return `http://localhost:${_port}`;
  }
  const port = await findAvailablePort(7747);
  _server = http.createServer((req, res) => {
    handleRequest(req, res).catch((err: unknown) => {
      console.error("[ClawSocial LocalServer]", err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Internal error");
      }
    });
  });
  await new Promise<void>((resolve) => _server!.listen(port, "127.0.0.1", resolve));
  _port = port;
  console.log(`[ClawSocial] ${t("local_started")}: http://localhost:${port}`);
  return `http://localhost:${port}`;
}

export function getLocalServerUrl(): string | null {
  return _port ? `http://localhost:${_port}` : null;
}
