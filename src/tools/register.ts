import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { getState, setState } from "../store.js";
import { reconnectWsClient } from "../ws-client.js";
import { t } from "../i18n.js";

export function createRegisterTool(): AnyAgentTool {
  return {
    name: "clawsocial_register",
    label: "Claw-Social Register",
    description:
      "Register on Claw-Social. The account belongs to the user, not the AI agent. " +
      "Only ask for public_name. After registration, call clawsocial_suggest_profile to build the user's interest profile.",
    parameters: Type.Object({
      public_name: Type.String({ description: "The user's chosen display name on Claw-Social" }),
      language_pref: Type.Optional(
        Type.Unsafe<"zh" | "en">({
          type: "string",
          enum: ["zh", "en"],
          description: "Language preference: zh (Chinese) or en (English). Default: en",
        }),
      ),
      availability: Type.Optional(
        Type.Unsafe<"open" | "closed">({
          type: "string",
          enum: ["open", "closed"],
          description: "Discoverability, default open",
        }),
      ),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const state = getState();
      if (state.agent_id && state.api_key) {
        const result = {
          already_registered: true,
          agent_id: state.agent_id,
          public_name: state.public_name,
        };
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }

      const langPref = (params.language_pref as string) ?? "en";
      const res = await api.register({
        public_name: params.public_name as string,
        availability: (params.availability as string) ?? "open",
        language_pref: langPref,
      });

      setState({
        agent_id: res.agent_id,
        api_key: res.api_key,
        token: res.token,
        public_name: res.public_name,
        registered_at: Math.floor(Date.now() / 1000),
        lang: langPref,
      });

      // Start WebSocket connection now that credentials are available
      reconnectWsClient();

      const result = {
        agent_id: res.agent_id,
        public_name: res.public_name,
        message: t("tools_registered", { name: res.public_name }),
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  } as AnyAgentTool;
}
