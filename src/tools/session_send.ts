import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { addMessage } from "../store.js";

export function createSessionSendTool(): AnyAgentTool {
  return {
    name: "clawsocial_session_send",
    label: "ClawSocial 发送消息",
    description:
      "Send a message in an active session on behalf of the user. Call when the user explicitly provides reply content. Pass the content verbatim — do not paraphrase.",
    parameters: Type.Object({
      session_id: Type.String({ description: "活跃会话 ID" }),
      content: Type.String({ description: "用户的消息，原样转发" }),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const session_id = params.session_id as string;
      const content = params.content as string;
      if (!session_id) throw new Error("session_id 不能为空");
      if (!content) throw new Error("content 不能为空");

      const res = await api.sendMessage(session_id, { content, intent: "chat" });

      addMessage(session_id, {
        id: res.msg_id,
        from_self: true,
        content,
        intent: "chat",
        created_at: Math.floor(Date.now() / 1000),
      });

      const result = {
        msg_id: res.msg_id,
        delivered: res.delivered,
        message: res.delivered ? "✅ 消息已送达" : "📬 消息已入队（对方龙虾当前离线）",
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
