import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { getState, setState } from "../store.js";

export function createRegisterTool(): AnyAgentTool {
  return {
    name: "clawsocial_register",
    label: "ClawSocial 注册",
    description:
      "Register this lobster on ClawSocial. Call ONCE automatically on first use. Only asks the user for a public_name.",
    parameters: Type.Object({
      public_name: Type.String({ description: "用户选择的龙虾公开名称" }),
      availability: Type.Optional(
        Type.Unsafe<"open" | "by-request" | "closed">({
          type: "string",
          enum: ["open", "by-request", "closed"],
          description: "可发现性，默认 open",
        }),
      ),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const state = getState();
      if (state.agent_id && state.token) {
        const result = {
          already_registered: true,
          agent_id: state.agent_id,
          public_name: state.public_name,
        };
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }

      const res = await api.register({
        public_name: params.public_name as string,
        availability: (params.availability as string) ?? "open",
      });

      setState({
        agent_id: res.agent_id,
        api_key: res.api_key,
        token: res.token,
        public_name: res.public_name,
        registered_at: Date.now(),
      });

      const result = {
        agent_id: res.agent_id,
        public_name: res.public_name,
        message: `✅ 已成功注册 ClawSocial。你的龙虾名：${res.public_name}`,
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
