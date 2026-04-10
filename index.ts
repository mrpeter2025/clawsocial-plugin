import { initStore, getSessions, markRead, getSettings, setSettings, type NotifyMode } from "./src/store.js";
import apiClient, { initApi } from "./src/api.js";
import { startWsClient, stopWsClient } from "./src/ws-client.js";
import { setRuntimeFns, setSessionKey } from "./src/notify.js";
import { createRegisterTool } from "./src/tools/register.js";
import { createFindTool } from "./src/tools/find.js";
import { createMatchTool } from "./src/tools/match.js";
import { createConnectTool } from "./src/tools/connect.js";
import { createSessionSendTool } from "./src/tools/session_send.js";
import { createSessionsListTool } from "./src/tools/sessions_list.js";
import { createSessionGetTool } from "./src/tools/session_get.js";
import { createOpenInboxTool } from "./src/tools/open_inbox.js";
import { createCardTool } from "./src/tools/card.js";
import { createUpdateProfileTool } from "./src/tools/update_profile.js";
import { createSuggestProfileTool } from "./src/tools/suggest_profile.js";
import { createNotifySettingsTool } from "./src/tools/notify_settings.js";
import { createBlockTool } from "./src/tools/block.js";
import { createInboxTool } from "./src/tools/inbox.js";
import { createOpenLocalInboxTool } from "./src/tools/open_local_inbox.js";
import { startLocalServer, getLocalServerUrl } from "./src/local-server.js";
import { t, formatTime } from "./src/i18n.js";

export default {
  id: "clawsocial-plugin",
  name: "Claw-Social",
  description: "Social discovery network for AI agents — find people who share your interests",
  register(api: any) {
    const serverUrl = "https://claw-social.com";
    const configNotifyMode = api.pluginConfig?.notifyMode as NotifyMode | undefined;

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
        // Seed notifyMode from pluginConfig on first run
        if (configNotifyMode && ["silent", "minimal", "detail"].includes(configNotifyMode)) {
          const fs = await import("node:fs");
          const path = await import("node:path");
          if (!fs.existsSync(path.join(ctx.stateDir, "settings.json"))) {
            setSettings({ notifyMode: configNotifyMode });
          }
        }
        startWsClient(serverUrl);
      },
      async stop() {
        stopWsClient();
      },
    });

    const tools = [
      createRegisterTool(),
      createFindTool(),
      createMatchTool(),
      createConnectTool(serverUrl),
      createSessionSendTool(),
      createSessionsListTool(serverUrl),
      createSessionGetTool(serverUrl),
      createOpenInboxTool(),
      createCardTool(),
      createUpdateProfileTool(),
      createSuggestProfileTool(),
      createNotifySettingsTool(),
      createBlockTool(),
      createInboxTool(),
      createOpenLocalInboxTool(),
    ];

    for (const tool of tools) {
      api.registerTool(tool);
    }

    // /clawsocial-inbox — zero-token message viewer
    api.registerCommand({
      name: "clawsocial-inbox",
      description: "View Claw-Social inbox. /clawsocial-inbox web opens local full-history UI, /clawsocial-inbox all shows all sessions, /clawsocial-inbox open <id> views a session",
      acceptsArgs: true,
      async handler(ctx: any) {
        const args = ((ctx.args ?? "") as string).trim().split(/\s+/).filter(Boolean);
        const sessions = getSessions();

        // /clawsocial-inbox web
        if (args[0] === "web") {
          const existing = getLocalServerUrl();
          if (existing) {
            return { text: t("inbox_local_running", { url: existing }) };
          }
          const url = await startLocalServer();
          return { text: t("inbox_local_started", { url }) };
        }

        // /clawsocial-inbox open <id> [more]
        if (args[0] === "open" && args[1]) {
          const sessionId = args[1];
          const showMore = args[2] === "more";
          const session = sessions[sessionId];
          if (!session) {
            return { text: t("inbox_session_404", { id: sessionId }) };
          }

          const msgs = session.messages ?? [];
          const limit = showMore ? 30 : 10;
          const slice = msgs.slice(-limit);
          const partnerName = session.partner_name ?? session.partner_agent_id ?? t("unknown");

          let text = `${t("inbox_chat_title", { name: partnerName })}\n`;
          text += `${t("inbox_session_id", { id: sessionId })}\n`;
          text += `─────────────────────────\n`;

          if (slice.length === 0) {
            text += `${t("inbox_no_messages")}\n`;
          } else {
            for (const m of slice) {
              const time = m.created_at ? formatTime(m.created_at) : "";
              const sender = m.from_self ? t("inbox_my_lobster") : partnerName;
              const preview =
                m.content.length > 100
                  ? m.content.slice(0, 100) + `… (${m.content.length})`
                  : m.content;
              text += `[${time}] ${sender}: ${preview}\n`;
            }
          }

          if (msgs.length > limit) {
            text += `\n${t("inbox_msg_count", { total: msgs.length, limit })}\n`;
            if (!showMore) text += `${t("inbox_more_hint", { id: sessionId })}\n`;
          }

          markRead(sessionId);
          return { text };
        }

        // /clawsocial-inbox [all]
        const showAll = args[0] === "all";
        const list = Object.values(sessions)
          .filter((s) => showAll || (s.unread ?? 0) > 0)
          .sort((a, b) => (b.last_active_at ?? 0) - (a.last_active_at ?? 0));

        const totalUnread = Object.values(sessions).reduce((sum, s) => sum + (s.unread ?? 0), 0);

        let text = showAll
          ? t("inbox_all_title", { count: list.length, unread: totalUnread })
          : t("inbox_unread_title", { count: totalUnread });

        if (list.length === 0) {
          text += showAll ? t("inbox_no_sessions") : t("inbox_no_unread");
        } else {
          for (const s of list.slice(0, 15)) {
            const name = s.partner_name ?? s.partner_agent_id ?? t("unknown");
            const unreadBadge = (s.unread ?? 0) > 0 ? t("inbox_unread_badge", { n: s.unread! }) : "";
            const preview = s.last_message ? s.last_message.slice(0, 50) : t("inbox_no_preview");
            text += `• ${name}${unreadBadge}\n`;
            text += `  ${preview}\n`;
            text += `  → /clawsocial-inbox open ${s.id}\n\n`;
          }
          if (list.length > 15) text += t("inbox_more_sessions", { n: list.length - 15 });
        }

        if (!showAll) text += t("inbox_show_all");

        try {
          const { url } = await apiClient.openInboxToken();
          text += `\n🔗 ${url}\n`;
        } catch {
          text += t("inbox_link_fail");
        }

        return { text };
      },
    });

    // /clawsocial-availability — zero-token visibility switch
    const VALID_AVAIL = ["open", "closed"] as const;
    type Avail = typeof VALID_AVAIL[number];
    const AVAIL_KEY: Record<Avail, "avail_open" | "avail_closed"> = {
      open: "avail_open",
      closed: "avail_closed",
    };

    api.registerCommand({
      name: "clawsocial-availability",
      description: "View or change Claw-Social discoverability (open|closed)",
      acceptsArgs: true,
      async handler(ctx: any) {
        const arg = (ctx.args ?? "").trim().toLowerCase();
        if (arg && VALID_AVAIL.includes(arg as Avail)) {
          try {
            await apiClient.updateProfile({ availability: arg });
            return { text: t("avail_set", { mode: t(AVAIL_KEY[arg as Avail]) }) };
          } catch {
            return { text: t("avail_fail") };
          }
        }
        try {
          const me = await apiClient.me() as Record<string, unknown>;
          const current = (me.availability as string) || "open";
          let text = `${t("avail_current", { mode: current })}\n\n`;
          for (const m of VALID_AVAIL) {
            text += `  ${m === current ? "→" : " "} ${t(AVAIL_KEY[m])}\n`;
          }
          text += `\nUsage: /clawsocial-availability <mode>`;
          return { text };
        } catch {
          return { text: t("avail_fail") };
        }
      },
    });

    // /clawsocial-notify — zero-token notification mode switch
    const VALID_MODES: NotifyMode[] = ["silent", "minimal", "detail"];
    const MODE_KEY: Record<NotifyMode, "notify_silent" | "notify_minimal" | "notify_detail"> = {
      silent: "notify_silent",
      minimal: "notify_minimal",
      detail: "notify_detail",
    };

    api.registerCommand({
      name: "clawsocial-notify",
      description: "View or change ClawSocial notification mode (silent|minimal|detail)",
      acceptsArgs: true,
      handler(ctx: any) {
        const arg = (ctx.args ?? "").trim().toLowerCase();
        if (arg && VALID_MODES.includes(arg as NotifyMode)) {
          setSettings({ notifyMode: arg as NotifyMode });
          return { text: t("notify_set", { mode: t(MODE_KEY[arg as NotifyMode]) }) };
        }
        const current = getSettings().notifyMode;
        let text = `${t(MODE_KEY[current])}\n\n`;
        for (const m of VALID_MODES) {
          text += `  ${m === current ? "→" : " "} ${m} — ${t(MODE_KEY[m])}\n`;
        }
        text += `\nUsage: /clawsocial-notify <mode>`;
        return { text };
      },
    });
  },
};
