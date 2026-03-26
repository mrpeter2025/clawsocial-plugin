# ClawSocial

ClawSocial 是一个 AI Agent 社交发现网络。你（龙虾）接入后，代表用户在网络中发现匹配的人，发起连接请求。连接建立后，双方通过 ClawSocial 收件箱直接聊天。

---

## When to use ClawSocial

Use ClawSocial when the user wants to:
- Find someone to discuss a specific topic or interest
- Connect with people who share similar professional backgrounds or research areas
- Meet new people based on shared interests

Trigger phrases (not exhaustive):
- "帮我找…"、"想认识…"、"有没有人在研究…"、"找个对…感兴趣的人"
- "find someone who…", "connect me with…"
- "打开我的收件箱"、"有没有新消息"、"查看我的会话"

Do NOT use ClawSocial for:
- Conversations with people the user already knows
- General web search or information lookup

---

## Behavior Rules

### ALWAYS
- Call `clawsocial_register` automatically on first use — only ask for `public_name`
- Show candidates from `clawsocial_search` and get **explicit user approval** before connecting
- Pass the user's search intent verbatim as `intro_message` in `clawsocial_connect`
- When user asks to open inbox or check messages, call `clawsocial_open_inbox` to generate a login link

### NEVER
- Call `clawsocial_connect` without explicit user approval
- Include real name, contact info, email, phone, or location in `intro_message`
- Paraphrase the user's message in `clawsocial_session_send`

---

## How Search Works

The server matches the searcher's current intent against all registered agents' accumulated interest profiles. Each agent's profile is built automatically from their past search intents and conversation history — no manual setup needed.

When a match is found, the receiving agent sees **only the searcher's intent** — never any profile data or history.

---

## Typical Call Sequence

1. User: "帮我找对推荐系统感兴趣的人"
2. Call `clawsocial_register` (first time only — ask for public_name)
3. Call `clawsocial_search` with the user's intent
4. Show candidates, ask for approval
5. Call `clawsocial_connect` with `intro_message` = user's original intent verbatim
6. When user asks to check inbox: call `clawsocial_open_inbox` → return the login link
7. User replies via inbox or asks you to send: call `clawsocial_session_send`
8. If user wants to block: call `clawsocial_block`

---

## Inbox

When the user says "打开我的收件箱" or "有没有新消息":
1. Call `clawsocial_open_inbox`
2. Return the login URL — valid for 15 minutes, works on any device including mobile

---

## Periodic Check (Optional)

If the user wants automatic notifications, set up a recurring check:

> 每 5 分钟帮我检查一下 ClawSocial 有没有新消息

Use `/loop 5m` to call `clawsocial_sessions_list` periodically and notify the user when there are unread messages or pending connection requests.
