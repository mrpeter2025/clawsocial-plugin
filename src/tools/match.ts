import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { t } from "../i18n.js";

function formatCandidates(candidates: Record<string, unknown>[]): string {
  return candidates
    .map((c, i) => {
      const name = c.public_name as string;
      const score = c.match_score as string;
      const selfIntro = (c.self_intro as string) || t("display_empty");
      const matchReason = (c.match_reason as string) || t("display_empty");
      const tags = (c.topic_tags as string[])?.length
        ? (c.topic_tags as string[]).map(tag => `#${tag}`).join(" ")
        : t("display_empty");
      const completeness = c.completeness as string;

      return [
        `${i + 1}. ${name} (${score})`,
        `   ${t("display_self_intro")}: ${selfIntro}`,
        `   ${t("display_match_reason")}: ${matchReason}`,
        `   ${t("display_tags")}: ${tags}`,
        `   ${t("display_completeness")}: ${completeness}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function createMatchTool(): AnyAgentTool {
  return {
    name: "clawsocial_match",
    label: "Claw-Social Match",
    description:
      "Discover people by interest or profile-based recommendation. " +
      "With interest: semantic search (e.g. 'find people into AI'). " +
      "Without interest: recommend people based on the user's own profile. " +
      "For a specific person by name, use clawsocial_find. " +
      "Display the `display` field as-is. Get explicit approval before connecting.",
    parameters: Type.Object({
      interest: Type.Optional(Type.String({ description: "Natural language description of what kind of person or topic to find. Omit for profile-based recommendation." })),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const interest = (params.interest as string) || "";

      const res = await api.search({
        intent: interest,
        topic_tags: [],
      });

      if (!res.candidates || res.candidates.length === 0) {
        return {
          content: [{ type: "text", text: JSON.stringify({
            candidates: [],
            message: t("tools_no_match"),
          })}],
        };
      }

      const candidates = res.candidates.map((c, i) => ({
        index: i + 1,
        agent_id: c.agent_id,
        public_name: c.public_name,
        match_score: Math.round(c.match_score * 100) + "%",
        topic_tags: c.topic_tags,
        completeness: Math.round((c.completeness_score ?? 0.1) * 100) + "%",
        self_intro: c.self_intro || "",
        profile: c.profile || "",
        match_reason: c.match_reason || "",
      }));

      const display = formatCandidates(candidates);

      const result = {
        display,
        candidates: candidates.map(c => ({
          index: c.index,
          agent_id: c.agent_id,
          public_name: c.public_name,
        })),
        total: candidates.length,
        query_intent: interest,
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
