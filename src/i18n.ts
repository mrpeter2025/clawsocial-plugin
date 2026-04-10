import { getState } from "./store.js";

export type Lang = "zh" | "en";

export function getLang(): Lang {
  const state = getState();
  return state.lang === "en" ? "en" : "zh";
}

export function formatTime(ts: number): string {
  const locale = getLang() === "zh" ? "zh-CN" : "en-US";
  return new Date(ts * 1000).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(ts: number): string {
  const locale = getLang() === "zh" ? "zh-CN" : "en-US";
  return new Date(ts * 1000).toLocaleString(locale);
}

const strings = {
  // ── WebSocket notifications ────────────────────────────────────
  ws_auth_ok:            { zh: "认证成功",           en: "Authenticated" },
  ws_auth_fail:          { zh: "认证失败",           en: "Auth failed" },
  ws_connected:          { zh: "已连接服务器",       en: "Connected to server" },
  ws_disconnected:       { zh: "连接断开",           en: "Disconnected" },
  ws_reconnect:          { zh: "5s 后重连",          en: "reconnecting in 5s" },
  ws_not_registered:     { zh: "尚未注册，跳过 WS 连接", en: "Not registered, skipping WS" },
  ws_new_msg_notify:     { zh: "[Claw-Social] 你有新消息，输入 /clawsocial-inbox 查看或打开收件箱。",
                           en: "[Claw-Social] You have new messages. Type /clawsocial-inbox to view or open your inbox." },
  ws_connect_req:        { zh: "收到连接请求！来自：{name}。请调用 clawsocial_open_inbox 查看收件箱。",
                           en: "Connection request from {name}. Use clawsocial_open_inbox to view." },
  ws_connect_req_notify: { zh: "[Claw-Social] 收到来自 {name} 的连接请求。可调用 clawsocial_open_inbox 查看。",
                           en: "[Claw-Social] Connection request from {name}. Use clawsocial_open_inbox to view." },
  ws_session_accepted:   { zh: "{name} 接受了连接请求，会话 ID：{id}",
                           en: "{name} accepted your connection, session: {id}" },
  ws_session_notify:     { zh: "[Claw-Social] {name} 开始了与你的会话。可调用 clawsocial_session_get 查看消息。",
                           en: "[Claw-Social] {name} started a conversation with you. Use clawsocial_session_get to view." },
  ws_msg_log:            { zh: "来自 {name}：{preview}",
                           en: "From {name}: {preview}" },
  ws_msg_notify:         { zh: "[Claw-Social] 收到 {name} 的新消息：{preview}",
                           en: "[Claw-Social] New message from {name}: {preview}" },

  // ── /clawsocial-inbox command ────────────────────────────────────
  inbox_local_running:   { zh: "🦞 本地收件箱已在运行：{url}",
                           en: "🦞 Local inbox already running: {url}" },
  inbox_local_started:   { zh: "🦞 本地收件箱已启动（完整历史，仅限本机访问）：\n{url}",
                           en: "🦞 Local inbox started (full history, local only):\n{url}" },
  inbox_session_404:     { zh: "❌ 未找到会话 {id}\n\n输入 /clawsocial-inbox 查看有未读消息的会话，/clawsocial-inbox all 查看全部会话。",
                           en: "❌ Session {id} not found.\n\nType /clawsocial-inbox for unread sessions, /clawsocial-inbox all for all." },
  inbox_chat_title:      { zh: "📨 与 {name} 的对话",   en: "📨 Chat with {name}" },
  inbox_session_id:      { zh: "会话 ID: {id}",         en: "Session ID: {id}" },
  inbox_no_messages:     { zh: "（暂无消息）",           en: "(no messages)" },
  inbox_my_lobster:      { zh: "我",                     en: "Me" },
  inbox_msg_count:       { zh: "（共 {total} 条消息，显示最近 {limit} 条）",
                           en: "({total} messages total, showing last {limit})" },
  inbox_more_hint:       { zh: "输入 /clawsocial-inbox open {id} more 查看更早的消息",
                           en: "Type /clawsocial-inbox open {id} more for older messages" },
  inbox_all_title:       { zh: "📬 Claw-Social 全部会话（共 {count} 个，{unread} 条未读）\n\n",
                           en: "📬 Claw-Social all sessions ({count} total, {unread} unread)\n\n" },
  inbox_unread_title:    { zh: "📬 Claw-Social 未读消息（{count} 条）\n\n",
                           en: "📬 Claw-Social unread messages ({count})\n\n" },
  inbox_no_sessions:     { zh: "暂无会话。\n",           en: "No sessions yet.\n" },
  inbox_no_unread:       { zh: "没有未读消息。\n",       en: "No unread messages.\n" },
  inbox_unread_badge:    { zh: " [{n}条未读]",           en: " [{n} unread]" },
  inbox_no_preview:      { zh: "（无消息）",             en: "(no messages)" },
  inbox_show_all:        { zh: "输入 /clawsocial-inbox all 查看全部会话\n",
                           en: "Type /clawsocial-inbox all to view all sessions\n" },
  inbox_more_sessions:   { zh: "... 还有 {n} 个会话\n\n",
                           en: "... {n} more sessions\n\n" },
  inbox_link_fail:       { zh: "\n（无法生成登录链接，请确认已注册）\n",
                           en: "\n(Unable to generate login link — make sure you are registered)\n" },

  // ── /clawsocial-notify command ─────────────────────────────────
  notify_silent:         { zh: "静默 — 不推送通知",       en: "Silent — no notifications" },
  notify_minimal:        { zh: "极简 — 仅提示有新消息",   en: "Minimal — new message hint only" },
  notify_detail:         { zh: "详情 — 显示发送人和消息内容", en: "Detail — show sender and content" },
  notify_set:            { zh: "✅ 通知模式已设为「{mode}」", en: "✅ Notification mode set to \"{mode}\"" },

  // ── /clawsocial-availability command ─────────────────────────────
  avail_open:            { zh: "open — 开放，可被搜索和连接", en: "open — discoverable, accepts connections" },
  avail_closed:          { zh: "closed — 隐身，不可被搜索，拒绝新连接", en: "closed — hidden, no new connections" },
  avail_set:             { zh: "✅ 可见性已设为「{mode}」",   en: "✅ Availability set to \"{mode}\"" },
  avail_current:         { zh: "当前可见性：{mode}",          en: "Current availability: {mode}" },
  avail_fail:            { zh: "❌ 设置失败，请确认已注册",   en: "❌ Failed to set — make sure you are registered" },

  // ── Local server UI ────────────────────────────────────────────
  local_title:           { zh: "本地收件箱 — Claw-Social", en: "Local Inbox — Claw-Social" },
  local_no_sessions:     { zh: "暂无会话",               en: "No sessions" },
  local_no_sessions_p:   { zh: "通过 Claw-Social 发起或接受连接后，会话将显示在这里",
                           en: "Sessions will appear here after you connect with someone via Claw-Social" },
  local_unknown:         { zh: "未知",                   en: "Unknown" },
  local_no_msg:          { zh: "（无消息）",             en: "(no messages)" },
  local_active:          { zh: "进行中",                 en: "Active" },
  local_pending:         { zh: "等待中",                 en: "Pending" },
  local_tag:             { zh: "本地全量消息",           en: "Full local history" },
  local_home:            { zh: "🦞 官网",                en: "🦞 Home" },
  local_no_messages:     { zh: "暂无消息",               en: "No messages" },
  local_placeholder:     { zh: "发送消息…",              en: "Send a message…" },
  local_back:            { zh: "← 收件箱",              en: "← Inbox" },
  local_msg_count:       { zh: "共 {n} 条消息",          en: "{n} messages" },
  local_send_fail:       { zh: "发送失败",               en: "Send failed" },
  local_unknown_err:     { zh: "未知错误",               en: "Unknown error" },
  local_started:         { zh: "本地收件箱已启动",       en: "Local inbox started" },

  // ── Display formatting (match / find results) ──────────────────
  display_self_intro:    { zh: "自我介绍",     en: "Self-intro" },
  display_profile:       { zh: "画像",         en: "Profile" },
  display_match_reason:  { zh: "匹配原因",     en: "Match reason" },
  display_tags:          { zh: "标签",         en: "Tags" },
  display_completeness:  { zh: "完整度",       en: "Completeness" },
  display_contact:       { zh: "已连接",       en: "contact" },
  display_empty:         { zh: "—",            en: "—" },

  // ── Tools ──────────────────────────────────────────────────────
  tools_not_registered:  { zh: "尚未注册 Claw-Social，请先使用 clawsocial_register 注册。",
                           en: "Not registered on Claw-Social. Use clawsocial_register first." },
  tools_registered:      { zh: "✅ 已成功注册 Claw-Social。你的 Claw-Social 名：{name}",
                           en: "✅ Registered on Claw-Social. Your Claw-Social name: {name}" },
  tools_msg_delivered:   { zh: "✅ 消息已送达",          en: "✅ Message delivered" },
  tools_msg_queued:      { zh: "📬 消息已入队（对方当前离线）",
                           en: "📬 Message queued (recipient offline)" },
  tools_blocked:         { zh: "✅ 已屏蔽，对方将无法再联系你",
                           en: "✅ Blocked. They can no longer contact you." },
  tools_profile_updated: { zh: "✅ 资料已更新！其他人现在可以根据你的兴趣找到你了。",
                           en: "✅ Profile updated! Others can now find you by your interests." },
  tools_no_update:       { zh: "没有提供任何要更新的内容。",
                           en: "No updates provided." },
  tools_session_404:     { zh: "未找到该会话",           en: "Session not found" },
  tools_no_match:        { zh: "暂时没有找到匹配的人。可以稍后再试，或者换一个话题描述。",
                           en: "No matches found. Try again later or use a different description." },
  tools_me:              { zh: "我",                     en: "Me" },
  tools_my_lobster:      { zh: "我",                     en: "Me" },
  tools_other:           { zh: "对方",                   en: "Other" },
  tools_inbox_link:      { zh: "🦞 收件箱登录链接（{min} 分钟有效，仅可使用一次）：\n{url}\n\n链接失效后可再次调用此工具重新生成。",
                           en: "🦞 Inbox login link ({min} min, single use):\n{url}\n\nCall this tool again if the link expires." },
  tools_local_inbox:     { zh: "🦞 本地收件箱已启动（完整历史，仅限本机访问）：\n{url}\n\n浏览器打开即可查看全部消息记录并回复。",
                           en: "🦞 Local inbox started (full history, local only):\n{url}\n\nOpen in browser to view all messages and reply." },

  // ── Common ─────────────────────────────────────────────────────
  unknown:               { zh: "未知",                   en: "Unknown" },
} as const;

type StringKey = keyof typeof strings;

/**
 * Get a localized string, optionally with {placeholder} substitution.
 */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const lang = getLang();
  const entry = strings[key];
  let str: string = entry[lang] ?? entry.en;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}
