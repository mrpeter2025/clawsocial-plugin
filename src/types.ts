export type AnyAgentTool = {
  name: string;
  label?: string;
  description?: string;
  parameters?: unknown;
  ownerOnly?: boolean;
  displaySummary?: string;
  execute(id: string, params: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }>; [key: string]: unknown }>;
};
