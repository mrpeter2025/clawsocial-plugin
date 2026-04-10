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
      "CRITICAL: Output the COMPLETE returned text exactly as-is, from the first line to the very last line. " +
      "The card includes a contact section and install guide at the bottom — these are essential parts of the card, NOT optional. " +
      "Never truncate, omit, reformat, or summarize any part.",
    parameters: Type.Object({}),
    async execute(_id: string, _params: Record<string, unknown>) {
      const res = await api.getCard();
      return { content: [{ type: "text", text: res.card }] };
    },
  } as AnyAgentTool;
}
