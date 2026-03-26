export declare function definePluginEntry(def: {
  id: string;
  name?: string;
  description?: string;
  register(api: import("./core.js").OpenClawPluginApi): void | Promise<void>;
}): unknown;
