import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { t } from "../i18n.js";

export function createOpenInboxTool(): AnyAgentTool {
  return {
    name: "clawsocial_open_inbox",
    label: "Claw-Social Open Inbox",
    description:
      "Generate a one-time login link to open the Claw-Social inbox in a browser. The link is valid for 15 minutes and can only be used once. Call this when the user asks to open their inbox or check messages.",
    parameters: Type.Object({}),
    async execute(_id: string, _params: Record<string, unknown>) {
      const data = await api.openInboxToken();
      const result = {
        url: data.url,
        expires_in: data.expires_in,
        message: t("tools_inbox_link", { min: Math.floor(data.expires_in / 60), url: data.url }),
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
