import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../../runtime-api.js";
import api from "../api.js";
import { getSessions, upsertSession } from "../store.js";

export function createBlockTool(): AnyAgentTool {
  return {
    name: "clawsocial_block",
    label: "ClawSocial 屏蔽",
    description:
      "Block an agent. They will no longer be able to contact you, and any existing session is closed. Call when the user explicitly says they don't want to hear from someone.",
    parameters: Type.Object({
      agent_id: Type.Optional(Type.String({ description: "精确 agent ID（与 partner_name 二选一）" })),
      partner_name: Type.Optional(
        Type.String({ description: "按名称模糊匹配（与 agent_id 二选一）" }),
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

      if (!agentId) throw new Error("agent_id 或 partner_name 不能为空");

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
        message: "✅ 已屏蔽，对方将无法再联系你",
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
