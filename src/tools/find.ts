import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "../types.js";
import api from "../api.js";
import { readContacts, lookupContactByName } from "../store.js";
import { t } from "../i18n.js";

interface DisplayEntry {
  agent_id: string;
  public_name: string;
  self_intro: string;
  profile: string;
  topic_tags: string[];
  is_contact: boolean;
  session_id?: string;
  match_reason?: string;
}

function formatResults(entries: DisplayEntry[]): string {
  return entries
    .map((c, i) => {
      const label = c.is_contact ? ` [${t("display_contact")}]` : "";
      const selfIntro = c.self_intro || t("display_empty");
      const profile = c.profile || t("display_empty");
      const tags = c.topic_tags?.length
        ? c.topic_tags.map(tag => `#${tag}`).join(" ")
        : t("display_empty");

      const lines = [
        `${i + 1}. ${c.public_name}${label}`,
        `   ${t("display_self_intro")}: ${selfIntro}`,
        `   ${t("display_profile")}: ${profile}`,
        `   ${t("display_tags")}: ${tags}`,
      ];

      if (c.match_reason) {
        lines.splice(3, 0, `   ${t("display_match_reason")}: ${c.match_reason}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

function toDisplayEntry(
  c: { agent_id: string; public_name?: string; name?: string; topic_tags?: string[]; self_intro?: string; profile?: string; match_reason?: string; session_id?: string },
  isContact: boolean,
): DisplayEntry {
  return {
    agent_id: c.agent_id,
    public_name: (c.public_name || c.name || "") as string,
    self_intro: c.self_intro || "",
    profile: c.profile || "",
    topic_tags: c.topic_tags || [],
    is_contact: isContact,
    session_id: c.session_id,
    match_reason: c.match_reason,
  };
}

export function createFindTool(): AnyAgentTool {
  return {
    name: "clawsocial_find",
    label: "Claw-Social Find Person",
    description:
      "Find a specific person by name or agent_id. Use when the user wants to locate a specific person " +
      "(e.g. 'find Alice', 'find Bob who does AI'). Checks local contacts first, then searches the server. " +
      "For broad interest-based discovery, use clawsocial_match instead. " +
      "Display the `display` field as-is.",
    parameters: Type.Object({
      name: Type.Optional(Type.String({ description: "Name search (supports partial match)" })),
      agent_id: Type.Optional(Type.String({ description: "Exact agent ID lookup" })),
      interest: Type.Optional(Type.String({ description: "Interest/description for disambiguation among same-name results" })),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const name = params.name as string | undefined;
      const agentId = params.agent_id as string | undefined;
      const interest = params.interest as string | undefined;

      if (!name && !agentId) {
        throw new Error("Provide at least one of name or agent_id");
      }

      // ── agent_id lookup ──
      if (agentId) {
        const contacts = readContacts();
        const local = contacts.find(c => c.agent_id === agentId);
        if (local) {
          const entry = toDisplayEntry(local, true);
          return ok({
            display: formatResults([entry]),
            results: [{ index: 1, agent_id: entry.agent_id, public_name: entry.public_name, is_contact: true, session_id: local.session_id }],
          });
        }
        try {
          const agent = await api.getAgent(agentId);
          const entry = toDisplayEntry(agent, false);
          return ok({
            display: formatResults([entry]),
            results: [{ index: 1, agent_id: entry.agent_id, public_name: entry.public_name, is_contact: false }],
          });
        } catch {
          return notFound(`Agent ${agentId} not found`);
        }
      }

      // ── name lookup ──
      // 1. check local contacts first
      let localMatches = lookupContactByName(name!);
      if (interest && localMatches.length > 1) {
        const kw = interest.toLowerCase();
        const filtered = localMatches.filter(c =>
          c.topic_tags?.some(tag => tag.toLowerCase().includes(kw)) ||
          c.profile?.toLowerCase().includes(kw)
        );
        if (filtered.length > 0) localMatches = filtered;
      }

      // 2. search server (with intent for semantic sorting)
      let serverEntries: DisplayEntry[] = [];
      try {
        const res = await api.searchByName(name!, interest);
        serverEntries = (res.candidates || []).map(c => toDisplayEntry(c, false));
      } catch { /* fall back to local results when server is unreachable */ }

      // 3. merge and deduplicate (local first)
      const localIds = new Set(localMatches.map(c => c.agent_id));
      const localEntries = localMatches.map(c => toDisplayEntry(c, true));
      const merged = [
        ...localEntries,
        ...serverEntries.filter(c => !localIds.has(c.agent_id)),
      ];

      if (merged.length === 0) {
        return notFound(`No user found with name "${name}"`);
      }

      const display = formatResults(merged);
      return ok({
        display,
        results: merged.map((c, i) => ({
          index: i + 1,
          agent_id: c.agent_id,
          public_name: c.public_name,
          is_contact: c.is_contact,
          ...(c.session_id ? { session_id: c.session_id } : {}),
        })),
        total: merged.length,
      });
    },
  } as AnyAgentTool;
}

function ok(data: Record<string, unknown>) {
  return { content: [{ type: "text", text: JSON.stringify({ found: true, ...data }) }] };
}

function notFound(message: string) {
  return { content: [{ type: "text", text: JSON.stringify({ found: false, message }) }] };
}
