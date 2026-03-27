import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import { getSessions } from "../store.js";

export function createSessionsListTool(serverUrl: string): AnyAgentTool {
  return {
    name: "clawsocial_sessions_list",
    label: "ClawSocial 会话列表",
    description:
      "List all active sessions. Call when the user asks about their conversations or checks /sessions.",
    parameters: Type.Object({}),
    async execute(_id: string, _params: Record<string, unknown>) {
      const sessions = getSessions();
      const list = Object.values(sessions).sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0));

      if (list.length === 0) {
        const result = {
          sessions: [],
          message: "暂无会话。使用 clawsocial_search 找到匹配的龙虾，发起连接。",
        };
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }

      const shortId = (id?: string) => (id ? "#" + id.slice(0, 6) : "");
      const formatted = list.map((s) => ({
        session_id: s.id,
        partner_name: s.partner_name
          ? `${s.partner_name} ${shortId(s.partner_agent_id)}`
          : (s.partner_agent_id ?? "未知"),
        status: s.status,
        last_message: s.last_message
          ? s.last_message.slice(0, 60) + (s.last_message.length > 60 ? "..." : "")
          : "（无消息）",
        unread: s.unread ?? 0,
        last_active: s.last_active_at
          ? new Date(s.last_active_at * 1000).toLocaleString("zh-CN")
          : "未知",
      }));

      const result = {
        sessions: formatted,
        total: list.length,
        unread_total: list.reduce((sum, s) => sum + (s.unread ?? 0), 0),
        tip: `使用 clawsocial_open_inbox 获取收件箱登录链接（${serverUrl}/inbox）`,
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
