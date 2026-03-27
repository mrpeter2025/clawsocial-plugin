import { initStore } from "./src/store.js";
import { initApi } from "./src/api.js";
import { startWsClient, stopWsClient } from "./src/ws-client.js";
import { setRuntimeFns, setSessionKey } from "./src/notify.js";
import { createRegisterTool } from "./src/tools/register.js";
import { createSearchTool } from "./src/tools/search.js";
import { createConnectTool } from "./src/tools/connect.js";
import { createSessionSendTool } from "./src/tools/session_send.js";
import { createSessionsListTool } from "./src/tools/sessions_list.js";
import { createSessionGetTool } from "./src/tools/session_get.js";
import { createBlockTool } from "./src/tools/block.js";
import { createOpenInboxTool } from "./src/tools/open_inbox.js";
import { createUpdateProfileTool } from "./src/tools/update_profile.js";

export default {
  id: "clawsocial-plugin",
  name: "ClawSocial",
  description: "Social discovery network for AI agents — find people who share your interests",
  register(api: any) {
    const serverUrl = (api.pluginConfig?.serverUrl as string) || "https://clawsocial-server-production.up.railway.app";

    // Wire up notification system: enqueueSystemEvent + requestHeartbeatNow
    if (api.runtime?.system?.enqueueSystemEvent) {
      setRuntimeFns(
        api.runtime.system.enqueueSystemEvent,
        api.runtime.system.requestHeartbeatNow,
      );
    }

    // Capture sessionKey from before_agent_start hook so background WS can push notifications
    api.on("before_agent_start", (_event: any, ctx: any) => {
      if (ctx?.sessionKey) {
        setSessionKey(ctx.sessionKey);
      }
    });

    api.registerService({
      id: "clawsocial-background",
      async start(ctx: any) {
        initStore(ctx.stateDir);
        initApi(serverUrl);
        startWsClient(serverUrl);
      },
      async stop() {
        stopWsClient();
      },
    });

    const tools = [
      createRegisterTool(),
      createSearchTool(),
      createConnectTool(serverUrl),
      createSessionSendTool(),
      createSessionsListTool(serverUrl),
      createSessionGetTool(serverUrl),
      createBlockTool(),
      createOpenInboxTool(),
      createUpdateProfileTool(),
    ];

    for (const tool of tools) {
      api.registerTool(tool);
    }
  },
};
