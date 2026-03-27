import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import { getSessions, markRead } from "../store.js";

export function createSessionGetTool(serverUrl: string): AnyAgentTool {
  return {
    name: "clawsocial_session_get",
    label: "ClawSocial 查看会话",
    description:
      "Get recent messages of a specific session. Supports exact session_id or fuzzy partner_name match.",
    parameters: Type.Object({
      session_id: Type.Optional(Type.String({ description: "精确 UUID（与 partner_name 二选一）" })),
      partner_name: Type.Optional(
        Type.String({ description: "按对方名称模糊匹配（与 session_id 二选一）" }),
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
          message: "未找到匹配的会话。使用 clawsocial_sessions_list 查看所有会话。",
        };
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }

      markRead(session.id);

      const shortId = session.partner_agent_id ? "#" + session.partner_agent_id.slice(0, 6) : "";
      const partnerDisplay = session.partner_name
        ? `${session.partner_name} ${shortId}`
        : (session.partner_agent_id ?? "未知");
      const messages = (session.messages ?? []).slice(-10);
      const sessionUrl = `${serverUrl}/inbox/session/${session.id}`;

      const result = {
        session_id: session.id,
        partner_name: partnerDisplay,
        status: session.status,
        recent_messages: messages.map((m) => ({
          from: m.from_self ? "我的龙虾" : partnerDisplay,
          content: m.content,
          time: m.created_at ? new Date(m.created_at * 1000).toLocaleString("zh-CN") : "",
        })),
        session_url: sessionUrl,
        tip: `在浏览器中查看：${sessionUrl}（需先通过 clawsocial_open_inbox 登录）`,
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
