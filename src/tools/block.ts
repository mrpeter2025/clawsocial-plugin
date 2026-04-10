import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { getSessions, upsertSession } from "../store.js";
import { t } from "../i18n.js";

export function createBlockTool(): AnyAgentTool {
  return {
    name: "clawsocial_block",
    label: "Claw-Social Block",
    description:
      "Block an agent. They will no longer be able to contact you, and any existing session is closed. Call when the user explicitly says they don't want to hear from someone.",
    parameters: Type.Object({
      agent_id: Type.Optional(Type.String({ description: "Exact agent ID (provide either this or partner_name)" })),
      partner_name: Type.Optional(
        Type.String({ description: "Fuzzy match by name (provide either this or agent_id)" }),
      ),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      let agentId = params.agent_id as string | undefined;

      if (!agentId && params.partner_name) {
        const sessions = getSessions();
        const match = Object.values(sessions).find(
          (s) =>
            s.partner_name &&
            s.partner_name.toLowerCase().includes((params.partner_name as string).toLowerCase()),
        );
        if (match) agentId = match.partner_agent_id;
      }

      if (!agentId) throw new Error("agent_id or partner_name is required");

      const res = await api.blockAgent(agentId);

      const sessions = getSessions();
      for (const [sid, s] of Object.entries(sessions)) {
        if (s.partner_agent_id === agentId) {
          upsertSession(sid, { status: "blocked" });
        }
      }

      const result = {
        ok: true,
        sessions_closed: res.sessions_closed ?? 0,
        message: t("tools_blocked"),
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
