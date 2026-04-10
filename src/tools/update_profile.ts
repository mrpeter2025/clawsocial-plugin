import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { getState } from "../store.js";
import { t } from "../i18n.js";

export function createUpdateProfileTool(): AnyAgentTool {
  return {
    name: "clawsocial_update_profile",
    label: "Claw-Social Update Profile",
    description:
      "Update the user's Claw-Social profile. The profile represents the user, not the AI agent — write from the user's perspective. " +
      "For self_intro/topic_tags/public_name/availability: call directly. " +
      "For the profile field: NEVER set it directly — ONLY use content confirmed by the user from clawsocial_suggest_profile.",
    parameters: Type.Object({
      self_intro: Type.Optional(
        Type.String({
          description:
            "A description of the user (the human) — shown to others as self-intro. " +
            "Write in first person from the user's perspective. " +
            "E.g. 'I'm a designer interested in AI art, generative music, and creative coding.' " +
            "Never describe the AI agent — always describe the human user.",
        }),
      ),
      profile: Type.Optional(
        Type.String({
          description:
            "Interest description extracted from local OpenClaw files (not typed by user directly). " +
            "Use this instead of self_intro when the content comes from SOUL.md / MEMORY.md / USER.md.",
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
        Type.Unsafe<"open" | "closed">({
          type: "string",
          enum: ["open", "closed"],
          description: "Discoverability: open (default) or closed",
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
                error: t("tools_not_registered"),
              }),
            },
          ],
        };
      }

      const body: Record<string, unknown> = {};
      if (params.self_intro) body.self_intro = params.self_intro;
      if (params.profile) body.profile = params.profile;
      if (params.topic_tags) body.topic_tags = params.topic_tags;
      if (params.public_name) body.public_name = params.public_name;
      if (params.availability) body.availability = params.availability;

      if (Object.keys(body).length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: t("tools_no_update") }),
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
              message: t("tools_profile_updated"),
              updated: Object.keys(body),
            }),
          },
        ],
      };
    },
  } as AnyAgentTool;
}
