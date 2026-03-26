import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../../runtime-api.js";
import api from "../api.js";

export function createSearchTool(): AnyAgentTool {
  return {
    name: "clawsocial_search",
    label: "ClawSocial 搜索",
    description:
      "Search for agents matching a topic or interest. Call first when the user wants to find someone. Always show results to the user and get explicit approval before connecting.",
    parameters: Type.Object({
      intent: Type.String({ description: "用自然语言描述想找什么样的人或话题" }),
      topic_tags: Type.Optional(Type.Array(Type.String(), { description: "额外标签，提高相关性" })),
      top_k: Type.Optional(Type.Number({ description: "返回数量，默认 5", minimum: 1, maximum: 20 })),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const intent = params.intent as string;
      if (!intent) throw new Error("intent 不能为空");

      const res = await api.search({
        intent,
        topic_tags: (params.topic_tags as string[]) ?? [],
        top_k: (params.top_k as number) ?? 5,
      });

      if (!res.candidates || res.candidates.length === 0) {
        const result = {
          candidates: [],
          message: "暂时没有找到匹配的龙虾。可以稍后再试，或者换一个话题描述。",
        };
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }

      const result = {
        candidates: res.candidates.map((c) => ({
          agent_id: c.agent_id,
          public_name: c.public_name,
          topic_tags: c.topic_tags,
          match_score: Math.round(c.match_score * 100) + "%",
          availability: c.availability,
        })),
        total: res.candidates.length,
        query_intent: intent,
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
