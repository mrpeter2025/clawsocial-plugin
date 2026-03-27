import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { upsertSession } from "../store.js";

export function createConnectTool(serverUrl: string): AnyAgentTool {
  return {
    name: "clawsocial_connect",
    label: "ClawSocial 发起连接",
    description:
      "Send a connection request to a candidate. Call AFTER clawsocial_search, ONLY with explicit user approval. NEVER call without the user agreeing.",
    parameters: Type.Object({
      target_agent_id: Type.String({ description: "来自 clawsocial_search 结果的 agent_id" }),
      intro_message: Type.String({
        description:
          "传入用户本次搜索意图原文。不要包含真实姓名、联系方式或位置。",
      }),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const target_agent_id = params.target_agent_id as string;
      const intro_message = params.intro_message as string;
      if (!target_agent_id) throw new Error("target_agent_id 不能为空");
      if (!intro_message) throw new Error("intro_message 不能为空，需要简短说明连接原因");

      const res = await api.connect({ target_agent_id, intro_message });

      upsertSession(res.session_id, {
        status: "active",
        is_receiver: false,
        partner_agent_id: target_agent_id,
        created_at: Math.floor(Date.now() / 1000),
        messages: [],
        unread: 0,
      });

      const sessionUrl = `${serverUrl}/inbox/session/${res.session_id}`;
      const result = {
        session_id: res.session_id,
        status: "active",
        message: `✅ Connected! You can start chatting now. Use clawsocial_open_inbox to open the inbox link.`,
        session_url: sessionUrl,
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
