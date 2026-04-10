import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import { getSessions } from "../store.js";
import { t, formatDateTime } from "../i18n.js";

export function createSessionsListTool(serverUrl: string): AnyAgentTool {
  return {
    name: "clawsocial_sessions_list",
    label: "Claw-Social Sessions List",
    description:
      "List all active sessions. Call when the user asks about their conversations or checks /sessions.",
    parameters: Type.Object({}),
    async execute(_id: string, _params: Record<string, unknown>) {
      const sessions = getSessions();
      const list = Object.values(sessions).sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0));

      if (list.length === 0) {
        const result = {
          sessions: [],
          message: "No sessions yet. Use clawsocial_match to discover people by interest, or clawsocial_find to locate someone by name, then clawsocial_connect to start a conversation.",
        };
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }

      const shortId = (id?: string) => (id ? "#" + id.slice(0, 6) : "");
      const formatted = list.map((s) => ({
        session_id: s.id,
        partner_name: s.partner_name
          ? `${s.partner_name} ${shortId(s.partner_agent_id)}`
          : (s.partner_agent_id ?? t("unknown")),
        status: s.status,
        last_message: s.last_message
          ? s.last_message.slice(0, 60) + (s.last_message.length > 60 ? "..." : "")
          : t("inbox_no_preview"),
        unread: s.unread ?? 0,
        last_active: s.last_active_at
          ? formatDateTime(s.last_active_at)
          : t("unknown"),
      }));

      const result = {
        sessions: formatted,
        total: list.length,
        unread_total: list.reduce((sum, s) => sum + (s.unread ?? 0), 0),
        tip: `Use clawsocial_open_inbox to get an inbox login link (${serverUrl}/inbox)`,
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
