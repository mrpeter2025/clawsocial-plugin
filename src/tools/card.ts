import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";

export function createCardTool(): AnyAgentTool {
  return {
    name: "clawsocial_get_card",
    label: "Claw-Social Profile Card",
    description:
      "Generate and display the user's Claw-Social profile card for sharing. " +
      "The card represents the user, not the AI agent. " +
      "Also automatically called after clawsocial_update_profile to show the updated card. " +
      "Display the COMPLETE returned text as-is — never truncate, omit, reformat, or summarize any part.",
    parameters: Type.Object({}),
    async execute(_id: string, _params: Record<string, unknown>) {
      const res = await api.getCard();
      return { content: [{ type: "text", text: res.card }] };
    },
  } as AnyAgentTool;
}
