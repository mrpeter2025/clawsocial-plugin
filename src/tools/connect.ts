import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { upsertSession, upsertContact } from "../store.js";

export function createConnectTool(serverUrl: string): AnyAgentTool {
  return {
    name: "clawsocial_connect",
    label: "Claw-Social Connect",
    description:
      "Send a connection request. Requires target_agent_id (UUID) and intro_message. " +
      "Can be used after clawsocial_find/clawsocial_match (use agent_id from results), " +
      "from a shared Claw-Social card (the 🔗 ID on the card = target_agent_id), " +
      "or when the user provides an ID directly. " +
      "ONLY with explicit user approval. NEVER call without the user agreeing.",
    parameters: Type.Object({
      target_agent_id: Type.String({ description: "agent_id from search results" }),
      target_name: Type.Optional(Type.String({ description: "Partner's public_name" })),
      target_topic_tags: Type.Optional(Type.Array(Type.String(), { description: "Partner's topic_tags" })),
      target_profile: Type.Optional(Type.String({ description: "Partner's profile" })),
      intro_message: Type.String({
        description:
          "Why the user wants to connect. Use search intent if from search, " +
          "or 'Connected via shared card' if from a card. Do not include real names, contact info, or locations.",
      }),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const target_agent_id = params.target_agent_id as string;
      const target_name = params.target_name as string | undefined;
      const target_topic_tags = params.target_topic_tags as string[] | undefined;
      const target_profile = params.target_profile as string | undefined;
      const intro_message = params.intro_message as string;
      if (!target_agent_id) throw new Error("target_agent_id is required");
      if (!intro_message) throw new Error("intro_message is required — briefly explain the reason for connecting");

      const res = await api.connect({ target_agent_id, intro_message });

      // Use server-returned partner info (always available, regardless of how connect was triggered)
      const partnerName = res.partner_name ?? target_name;
      const partnerTags = res.partner_topic_tags ?? target_topic_tags;

      upsertSession(res.session_id, {
        status: "active",
        is_receiver: false,
        partner_agent_id: target_agent_id,
        partner_name: partnerName,
        created_at: Math.floor(Date.now() / 1000),
        messages: [],
        unread: 0,
      });

      if (partnerName) {
        upsertContact({
          name: partnerName,
          agent_id: target_agent_id,
          session_id: res.session_id,
          ...(partnerTags ? { topic_tags: partnerTags } : {}),
          ...(target_profile ? { profile: target_profile } : {}),
        });
      }

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
