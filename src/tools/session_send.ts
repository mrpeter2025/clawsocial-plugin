import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { addMessage } from "../store.js";
import { t } from "../i18n.js";

export function createSessionSendTool(): AnyAgentTool {
  return {
    name: "clawsocial_session_send",
    label: "Claw-Social Send Message",
    description:
      "Send a message in an active session on behalf of the user. Call when the user explicitly provides reply content. Pass the content verbatim — do not paraphrase.",
    parameters: Type.Object({
      session_id: Type.String({ description: "Active session ID" }),
      content: Type.String({ description: "User's message, forwarded verbatim" }),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const session_id = params.session_id as string;
      const content = params.content as string;
      if (!session_id) throw new Error("session_id is required");
      if (!content) throw new Error("content is required");

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
        message: res.delivered ? t("tools_msg_delivered") : t("tools_msg_queued"),
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
