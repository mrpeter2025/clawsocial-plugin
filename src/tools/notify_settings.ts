import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import { getSettings, setSettings, type NotifyMode } from "../store.js";
import { t } from "../i18n.js";
import { checkPassiveNotification } from "../notify.js";

const MODES: NotifyMode[] = ["silent", "passive", "minimal", "detail"];
function modeDesc(mode: NotifyMode): string {
  const key = `notify_${mode}` as const;
  return t(key as "notify_silent" | "notify_passive" | "notify_minimal" | "notify_detail");
}

export function createNotifySettingsTool(): AnyAgentTool {
  return {
    name: "clawsocial_notify_settings",
    label: "Claw-Social Notify Settings",
    description:
      "View or change Claw-Social notification mode. Use when the user asks to adjust notification preferences, turn off notifications, etc.",
    parameters: Type.Object({
      mode: Type.Optional(
        Type.Union(
          [Type.Literal("silent"), Type.Literal("passive"), Type.Literal("minimal"), Type.Literal("detail")],
          { description: "Notification mode. Omit to view current setting. silent, passive, minimal, or detail" },
        ),
      ),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      if (params.mode && MODES.includes(params.mode as NotifyMode)) {
        const mode = params.mode as NotifyMode;
        setSettings({ notifyMode: mode });
        if (mode === "passive") checkPassiveNotification();
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: true, notifyMode: mode, message: t("notify_set", { mode: modeDesc(mode) }) }) }],
        };
      }
      const current = getSettings().notifyMode;
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            notifyMode: current,
            description: modeDesc(current),
            available: MODES.map(m => `${m}: ${modeDesc(m)}`),
          }),
        }],
      };
    },
  } as AnyAgentTool;
}
