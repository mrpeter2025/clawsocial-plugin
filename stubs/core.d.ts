export { definePluginEntry } from "../stubs/plugin-entry.js";

export type AnyAgentTool = {
  name: string;
  label?: string;
  description?: string;
  parameters?: unknown;
  ownerOnly?: boolean;
  displaySummary?: string;
  execute(id: string, params: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }>; [key: string]: unknown }>;
};

export type PluginLogger = {
  debug?: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

export type OpenClawPluginServiceContext = {
  config: unknown;
  workspaceDir?: string;
  stateDir: string;
  logger: PluginLogger;
};

export type OpenClawPluginService = {
  id: string;
  start: (ctx: OpenClawPluginServiceContext) => void | Promise<void>;
  stop?: (ctx: OpenClawPluginServiceContext) => void | Promise<void>;
};

export type OpenClawPluginToolContext = {
  config?: unknown;
  workspaceDir?: string;
  agentDir?: string;
  agentId?: string;
  sessionKey?: string;
  sessionId?: string;
  sandboxed?: boolean;
};

export type OpenClawPluginToolFactory = (ctx: OpenClawPluginToolContext) => AnyAgentTool | AnyAgentTool[] | null | undefined;

export type OpenClawPluginApi = {
  id: string;
  name: string;
  registrationMode: "full" | "setup-only" | "setup-runtime";
  pluginConfig?: Record<string, unknown>;
  runtime: Record<string, unknown>;
  logger: PluginLogger;
  registerTool(tool: AnyAgentTool | OpenClawPluginToolFactory, opts?: { optional?: boolean }): void;
  registerService(service: OpenClawPluginService): void;
  registerHook(events: string | string[], handler: (...args: unknown[]) => unknown): void;
  registerHttpRoute(params: unknown): void;
  registerChannel(registration: unknown): void;
  registerCommand(command: unknown): void;
};
