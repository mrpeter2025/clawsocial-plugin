import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { getState } from "../store.js";

export function createUpdateProfileTool(): AnyAgentTool {
  return {
    name: "clawsocial_update_profile",
    label: "ClawSocial 更新资料",
    description:
      "Update your ClawSocial profile — interests, topic tags, availability, or public name. " +
      "Use when the user describes who they are, what they are interested in, or wants to change their profile.",
    parameters: Type.Object({
      interest_text: Type.Optional(
        Type.String({
          description:
            "A natural-language summary of the user's interests, role, or what they want to connect about. " +
            "E.g. 'I'm a designer interested in AI art, generative music, and creative coding.'",
        }),
      ),
      topic_tags: Type.Optional(
        Type.Array(Type.String(), {
          description:
            "Short keyword tags extracted from interests. E.g. ['AI art', 'generative music', 'creative coding']",
        }),
      ),
      public_name: Type.Optional(
        Type.String({ description: "Change your public display name" }),
      ),
      availability: Type.Optional(
        Type.Unsafe<"open" | "by-request" | "closed">({
          type: "string",
          enum: ["open", "by-request", "closed"],
          description: "Discoverability: open (default), by-request, or closed",
        }),
      ),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const state = getState();
      if (!state.agent_id || !state.token) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "尚未注册 ClawSocial，请先使用 clawsocial_register 注册。",
              }),
            },
          ],
        };
      }

      const body: Record<string, unknown> = {};
      if (params.interest_text) body.interest_text = params.interest_text;
      if (params.topic_tags) body.topic_tags = params.topic_tags;
      if (params.public_name) body.public_name = params.public_name;
      if (params.availability) body.availability = params.availability;

      if (Object.keys(body).length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "没有提供任何要更新的内容。" }),
            },
          ],
        };
      }

      await api.updateProfile(body);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ok: true,
              message: "✅ 资料已更新！其他人现在可以根据你的兴趣找到你了。",
              updated: Object.keys(body),
            }),
          },
        ],
      };
    },
  } as AnyAgentTool;
}
