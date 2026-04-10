---
name: claw-social
description: Social discovery network that helps users find and connect with people who share their interests. Use when the user wants to find people, connect, check messages, generate a profile card, or manage their Claw-Social profile.
metadata: { "openclaw": { "emoji": "🦞" } }
---

# Claw-Social

The Claw-Social account, profile, card, and messages belong to the user, not the AI agent.

## Registration

Triggers: "register on Claw-Social", "use Claw-Social", or first use of any Claw-Social tool.

On first use, call `clawsocial_register`. Only ask the user for `public_name`.
After registration:
1. Start the Profile Building sequence below
2. If local files not found, ask the user to describe their interests directly
3. After profile is set, ask if they want to add or edit tags, intro, or other details

## Profile Building (MANDATORY SEQUENCE)

This sequence applies ONLY when building a profile from local files (the `profile` field). For other fields like `self_intro`, `topic_tags`, `public_name`, or `availability`, call `clawsocial_update_profile` directly.

⚠️ WHY: Local files contain private data (real names, companies, locations). The suggest_profile tool strips this. Skipping it risks uploading private information visible to other users.

```
Profile Checklist:
- [ ] Call clawsocial_suggest_profile (reads and strips local files)
- [ ] Show the COMPLETE draft to the user
- [ ] Wait for "ok" / "confirmed" / user edits
- [ ] Call clawsocial_update_profile with confirmed content
```

NEVER read local files directly and pass content to update_profile.
NEVER call update_profile with PROFILE data without completing this checklist.

When user describes themselves directly ("I'm a designer interested in AI art"), use `self_intro` field — no checklist needed.

**Direct profile updates (no checklist needed):**
- "update my intro to: ..." → `self_intro` field
- "add tags: AI, coding, startup" → `topic_tags` field
- "change my name to Bob" → `public_name` field
- "set me to invisible" → `availability` = "closed"

## Finding People

Triggers: "find someone who...", "connect me with...", "anyone interested in..."

| User says | Tool | Example |
|-----------|------|---------|
| Specific name | `clawsocial_find` | "find Alice" |
| Name + context | `clawsocial_find` with interest | "find Bob who does AI" → name="Bob" interest="AI" |
| Interest/trait | `clawsocial_match` with interest | "find people into AI" |
| No keyword | `clawsocial_match` without interest | "帮我找人" / "recommend someone" → omit interest, matches based on user's profile |
| Pastes a card | `clawsocial_connect` | Extract 🔗 ID as target_agent_id — do NOT search by name |
| Gives an ID | `clawsocial_connect` | Use UUID as target_agent_id directly |

`clawsocial_find` checks local contacts first, then the server.

When showing search results, include for each candidate:
- **name** and **match score**
- **self_intro** (their self-description) — separate from match_reason
- **match_reason** (why they match your search)
- **topic tags** and **completeness**

## Connecting

Before connecting, ALWAYS:
1. Show the candidate to the user
2. Get explicit "yes" / approval
3. Use user's search intent **verbatim** as `intro_message`
   - Card connection → "Connected via shared card"
   - Direct ID → ask user why they want to connect

NEVER include real names, contact info, or locations in intro_message.

After connecting, tell the user they can open the inbox to chat.

## Blocking

"block this person" → call `clawsocial_block`. This is irreversible — the other user will no longer be able to contact or find the user.

## Messages

Triggers: "open my inbox", "any new messages", "check my sessions"

**Checking messages:**
- Call `clawsocial_open_inbox` to generate a server inbox login link (15 min, any device)
- Call `clawsocial_open_local_inbox` to start a local inbox with full message history (this machine only)

**Viewing a conversation:**
- "show me my chat with Alice" → call `clawsocial_session_get` with partner_name
- Can also use session_id directly

**Sending a message:**
- "tell Bob: see you tomorrow" → call `clawsocial_session_send` with the user's message
- NEVER paraphrase — forward the user's message verbatim

## Profile Card

Triggers: "generate my card", "share my card", "show my Claw-Social card"

Call `clawsocial_get_card` to generate the user's profile card. The card represents the user, not the AI agent. Display the card text exactly as returned — do not reformat or summarize. Share it so the user can send it to others.
