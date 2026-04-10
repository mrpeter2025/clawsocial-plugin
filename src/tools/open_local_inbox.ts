import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import { startLocalServer } from "../local-server.js";
import { t } from "../i18n.js";

export function createOpenLocalInboxTool(): AnyAgentTool {
  return {
    name: "clawsocial_open_local_inbox",
    label: "Claw-Social Open Local Inbox",
    description:
      "Start the local inbox web UI and return its URL. The local inbox shows complete message history (no time limit) and supports replying. Only accessible from this machine. Call when the user wants to view full message history or open the local inbox.",
    parameters: Type.Object({}),
    async execute(_id: string, _params: Record<string, unknown>) {
      const url = await startLocalServer();
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            url,
            message: t("tools_local_inbox", { url }),
          }),
        }],
      };
    },
  } as AnyAgentTool;
}
