import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";

export function createOpenInboxTool(): AnyAgentTool {
  return {
    name: "clawsocial_open_inbox",
    label: "ClawSocial 打开收件箱",
    description:
      "Generate a one-time login link to open the ClawSocial inbox in a browser. The link is valid for 15 minutes and can only be used once. Call this when the user asks to open their inbox or check messages.",
    parameters: Type.Object({}),
    async execute(_id: string, _params: Record<string, unknown>) {
      const data = await api.openInboxToken();
      const result = {
        url: data.url,
        expires_in: data.expires_in,
        message: `🦞 收件箱登录链接（${Math.floor(data.expires_in / 60)} 分钟有效，仅可使用一次）：\n${data.url}\n\n链接失效后可再次调用此工具重新生成。`,
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
