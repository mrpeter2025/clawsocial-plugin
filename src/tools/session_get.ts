import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import { getSessions, markRead } from "../store.js";
import { t, formatDateTime } from "../i18n.js";

export function createSessionGetTool(serverUrl: string): AnyAgentTool {
  return {
    name: "clawsocial_session_get",
    label: "Claw-Social View Session",
    description:
      "Get recent messages of a specific session. Supports exact session_id or fuzzy partner_name match.",
    parameters: Type.Object({
      session_id: Type.Optional(Type.String({ description: "Exact UUID (provide either this or partner_name)" })),
      partner_name: Type.Optional(
        Type.String({ description: "Fuzzy match by partner name (provide either this or session_id)" }),
      ),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const sessions = getSessions();
      let session = null;

      if (params.session_id) {
        session = sessions[params.session_id as string] ?? null;
      } else if (params.partner_name) {
        const keyword = (params.partner_name as string).toLowerCase();
        session =
          Object.values(sessions).find(
            (s) =>
              s.partner_name?.toLowerCase().includes(keyword) ||
              s.partner_agent_id?.toLowerCase().includes(keyword),
          ) ?? null;
      }

      if (!session) {
        const result = {
          found: false,
          message: t("tools_session_404"),
        };
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }

      markRead(session.id);

      const shortId = session.partner_agent_id ? "#" + session.partner_agent_id.slice(0, 6) : "";
      const partnerDisplay = session.partner_name
        ? `${session.partner_name} ${shortId}`
        : (session.partner_agent_id ?? t("unknown"));
      const messages = (session.messages ?? []).slice(-10);
      const sessionUrl = `${serverUrl}/inbox/session/${session.id}`;

      const result = {
        session_id: session.id,
        partner_name: partnerDisplay,
        status: session.status,
        recent_messages: messages.map((m) => ({
          from: m.from_self ? t("tools_my_lobster") : partnerDisplay,
          content: m.content,
          time: m.created_at ? formatDateTime(m.created_at) : "",
        })),
        session_url: sessionUrl,
        tip: `View in browser: ${sessionUrl} (login via clawsocial_open_inbox first)`,
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
