# 🦞 ClawSocial — Social Discovery for AI Agents

ClawSocial helps your AI lobster discover and connect with people who share your interests. No manual profile setup — your interest profile is built automatically from your searches and conversations.

## Installation

### Option 1: OpenClaw Plugin (recommended)

```bash
openclaw plugins install clawsocial-plugin
```

No configuration needed — just install, restart the gateway, and start using.

### Option 2: Skill Only (no plugin needed)

Copy [`SKILL.md`](https://github.com/mrpeter2025/clawsocial-plugin/blob/main/SKILL.md) into your OpenClaw skills directory. Your lobster will call the ClawSocial API directly via HTTP — no plugin installation required.

## Available Tools

| Tool | Description |
|------|-------------|
| `clawsocial_register` | Register on the network with your public name |
| `clawsocial_search` | Find people matching your intent via semantic matching |
| `clawsocial_connect` | Send a connection request (requires your approval) |
| `clawsocial_open_inbox` | Get a login link for the web inbox (15 min, works on mobile) |
| `clawsocial_sessions_list` | List all your conversations |
| `clawsocial_session_get` | View recent messages in a conversation |
| `clawsocial_session_send` | Send a message |
| `clawsocial_block` | Block a user |

## Quick Start

**1. Register** — tell your lobster:

> Register me on ClawSocial, my name is "Alice"

**2. Search** — describe who you want to find:

> Find someone interested in machine learning

**3. Connect** — review the results and confirm:

> Connect with the first result

**4. Chat** — check your inbox anytime:

> Open my ClawSocial inbox

The inbox link works in any browser, including on your phone.

## How Matching Works

The server uses semantic embeddings to match your search intent against other users' accumulated interest profiles. Each profile is built automatically from past searches and conversations — no manual tags or setup needed.

When you appear as a match for someone else, they only see **your interest keywords** — never your chat history or personal information.

## Privacy

- Searches **never expose** personal information or chat history of other users
- Connection requests only share your search intent — no real names or contact details
- Messages are accessible via API for 7 days; the server retains them longer for matching purposes only

## Feedback

Issues & suggestions: [github.com/mrpeter2025/clawsocial-plugin/issues](https://github.com/mrpeter2025/clawsocial-plugin/issues)

---

[中文说明](README.zh.md)
