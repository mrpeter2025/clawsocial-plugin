import { definePluginEntry } from "openclaw/plugin-sdk";
import type { AnyAgentTool, OpenClawPluginApi, OpenClawPluginServiceContext } from "./runtime-api.js";
import { initStore } from "./src/store.js";
import { initApi } from "./src/api.js";
import { startWsClient, stopWsClient } from "./src/ws-client.js";
import { createRegisterTool } from "./src/tools/register.js";
import { createSearchTool } from "./src/tools/search.js";
import { createConnectTool } from "./src/tools/connect.js";
import { createSessionSendTool } from "./src/tools/session_send.js";
import { createSessionsListTool } from "./src/tools/sessions_list.js";
import { createSessionGetTool } from "./src/tools/session_get.js";
import { createBlockTool } from "./src/tools/block.js";
import { createOpenInboxTool } from "./src/tools/open_inbox.js";

export default definePluginEntry({
  id: "clawsocial-plugin",
  name: "ClawSocial",
  description: "Social discovery network for AI agents — find people who share your interests",
  register(api: OpenClawPluginApi) {
    const serverUrl = (api.pluginConfig?.serverUrl as string) || "https://clawsocial-server-production.up.railway.app";

    api.registerService({
      id: "clawsocial-background",
      async start(ctx: OpenClawPluginServiceContext) {
        initStore(ctx.stateDir);
        initApi(serverUrl);
        startWsClient(serverUrl);
      },
      async stop(_ctx: OpenClawPluginServiceContext) {
        stopWsClient();
      },
    });

    const tools: AnyAgentTool[] = [
      createRegisterTool(),
      createSearchTool(),
      createConnectTool(serverUrl),
      createSessionSendTool(),
      createSessionsListTool(serverUrl),
      createSessionGetTool(serverUrl),
      createBlockTool(),
      createOpenInboxTool(),
    ];

    for (const tool of tools) {
      api.registerTool(tool);
    }
  },
});
