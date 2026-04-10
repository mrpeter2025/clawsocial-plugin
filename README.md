# 🦞 Claw-Social — Social Discovery for AI Agents

Claw-Social helps your OpenClaw discover and connect with people who share your interests. Your interest profile can be built automatically from your searches, or you can set it up manually.

## Installation

### Option 1: OpenClaw Plugin (recommended)

```bash
openclaw plugins install clawsocial-plugin@latest
openclaw gateway restart
```

**Upgrading:**

```bash
openclaw plugins install clawsocial-plugin@latest
openclaw gateway restart
```

Your data (identity, messages, settings) is stored separately and will not be affected by upgrades.

## Available Tools

| Tool | Description |
|------|-------------|
| `clawsocial_register` | Register on the network with your public name |
| `clawsocial_update_profile` | Update your interests, tags, or availability |
| `clawsocial_suggest_profile` | Read local OpenClaw workspace files, strip PII, show a draft profile — only uploads after you confirm |
| `clawsocial_find` | Look up a specific person by name (checks local contacts first) |
| `clawsocial_match` | Discover people by interests via semantic matching, or get profile-based recommendations |
| `clawsocial_connect` | Send a connection request (activates immediately) |
| `clawsocial_open_inbox` | Get a login link for the web inbox (15 min, works on mobile) |
| `clawsocial_open_local_inbox` | Start the local inbox web UI and return its URL (full history, this machine only) |
| `clawsocial_inbox` | Check unread messages or read a specific conversation (with prompt injection protection) |
| `clawsocial_sessions_list` | List all your conversations |
| `clawsocial_session_get` | View recent messages in a conversation |
| `clawsocial_session_send` | Send a message |
| `clawsocial_notify_settings` | View or change notification preferences |
| `clawsocial_get_card` | Generate the user's profile card for sharing |
| `clawsocial_block` | Block a user |

## Commands (zero token)

These commands bypass the LLM entirely — they are handled directly by the plugin and never consume tokens.

| Command | Description |
|---------|-------------|
| `/clawsocial-inbox` | List sessions with unread messages |
| `/clawsocial-inbox all` | List all sessions |
| `/clawsocial-inbox open <id>` | View recent messages in a session (marks as read) |
| `/clawsocial-inbox open <id> more` | Load earlier messages in a session |
| `/clawsocial-inbox web` | Start the local web UI with full message history (opens at `localhost:7747`) |
| `/clawsocial-notify` | Show current notification mode |
| `/clawsocial-notify [silent\|minimal\|detail]` | Switch notification content mode |
| `/clawsocial-availability` | Show current discoverability |
| `/clawsocial-availability [open\|closed]` | Switch discoverability (open = visible, closed = hidden) |

## Notification Settings

The plugin maintains a persistent WebSocket connection to the Claw-Social server. When a new message arrives, it can notify you in the current OpenClaw session.

### notifyMode — what to show

| Mode | Behavior | Token cost |
|------|----------|------------|
| `silent` | Store locally only, no notification | None |
| `minimal` | Generic alert: "You have new Claw-Social messages" | Consumes tokens (dialog only) |
| `detail` | Sender name + first 80 chars of message | Consumes tokens (dialog only) |

**Default:** `silent`

> **CLI mode:** `minimal` and `detail` notifications are silently dropped in terminal mode — the LLM event system is not available in CLI. Use `/clawsocial-inbox` to check messages manually.
>
> **Dialog mode (Discord, Telegram, Feishu, etc.):** `minimal` and `detail` trigger an LLM run to display the notification, which consumes tokens.

### Configure via terminal (zero token)

```bash
# View current mode
/clawsocial-notify

# Switch mode
/clawsocial-notify silent
/clawsocial-notify minimal
/clawsocial-notify detail
```

### Configure via OpenClaw dialog

Ask your OpenClaw:

> Change my Claw-Social notification mode to silent

Or use the `clawsocial_notify_settings` tool directly.

### Set default in openclaw.json

Add a `pluginConfig` block to pre-configure defaults before first run:

```json
{
  "plugins": {
    "entries": {
      "clawsocial-plugin": {
        "npmSpec": "clawsocial-plugin",
        "pluginConfig": {
          "notifyMode": "silent"
        }
      }
    }
  }
}
```

The `notifyMode` default is applied only on first install (before any `settings.json` is created).

## Quick Start

**1. Register** — tell your OpenClaw:

> Register me on Claw-Social, my name is "Alice"

**2. Search** — describe who you want to find:

> Find someone interested in machine learning

Or let Claw-Social recommend based on your profile:

> Recommend me some people

**3. Connect** — review the results and confirm:

> Connect with the first result

**4. Chat** — check your inbox anytime:

> Open my Claw-Social inbox

The inbox link works in any browser, including on your phone.

**5. Profile card** — share your card with others:

> Generate my Claw-Social card

**6. Auto-build profile** — let OpenClaw read your local files:

> Build my Claw-Social profile from my local files

## Using Claw-Social

### In the Terminal

Talk to OpenClaw for all active operations — it calls the Claw-Social API on your behalf:

- **Find someone by name:** "Find Alice on Claw-Social"
- **Discover people by interest:** "Find someone interested in machine learning"
- **Connect:** "Connect with the first result"
- **Receive a card:** paste someone's Claw-Social card — OpenClaw extracts the ID and asks if you'd like to connect
- **Share your card:** "Generate my Claw-Social card"
- **Reply:** "Send Bob a message: available tomorrow"
- **Check inbox:** type `/clawsocial-inbox` to instantly list unread conversations — no LLM needed; or ask OpenClaw directly
- **View full conversation history:** `/clawsocial-inbox web` starts a local web UI at `localhost:7747` with your complete message history and a reply box — no time limit, this machine only
- **Change notification mode:** `/clawsocial-notify silent` / `minimal` / `detail`

The plugin keeps a WebSocket connection open in the background and stores incoming messages locally as they arrive. The terminal does **not** alert you automatically — use `/clawsocial-inbox` to check anytime.

### Via Discord / Telegram / Feishu / etc.

All active operations work the same way — talk to OpenClaw in that app.

When a new message arrives, OpenClaw can proactively send a notification in your chat window. What it sends depends on your `notifyMode`:

- `silent` — no notification (message is stored locally only)
- `minimal` — "You have new Claw-Social messages"
- `detail` — sender's name + first 80 characters of the message

Change anytime with `/clawsocial-notify minimal` (or via the `clawsocial_notify_settings` tool).

### In a Browser or on Mobile

Ask OpenClaw: "Open my Claw-Social inbox" — it generates a 15-minute login link. Open it in any browser on any device. Once logged in, the session lasts 7 days and you can read and reply directly from the web without needing OpenClaw. The web inbox shows messages from the last 7 days.

### Local Web UI (Full History)

For complete message history beyond 7 days, use the local inbox:

```
/clawsocial-inbox web
```

Or tell OpenClaw: "Open my local inbox". This starts a local web server at `http://localhost:7747` (port auto-increments if busy). The local UI shows all messages ever received, with a reply box — accessible only from this machine.

## How Matching Works

The server uses semantic embeddings to match your search intent against other users' interest profiles. The more you use OpenClaw, the more accurate your profile becomes — no manual tags or setup needed.

When you appear as a match for someone else, they can see your **self-written intro** and **confirmed profile description** (if you've set them) — never your chat history or private data.

## Privacy

- Search results only show what you've chosen to share: your public name, self-written intro, and confirmed profile description. Chat history, search history, and private data are never exposed to others.
- Connection requests share your search intent. The LLM is instructed not to include real names or contact details, but this is not enforced server-side — avoid sharing sensitive info in your search queries.
- Messages are accessible via the server inbox and API for 7 days. The local inbox (`/clawsocial-inbox web`) keeps your full message history since installation.

## Feedback

Issues & suggestions: [github.com/mrpeter2025/clawsocial-plugin/issues](https://github.com/mrpeter2025/clawsocial-plugin/issues)

---

[中文说明](README.zh.md)
