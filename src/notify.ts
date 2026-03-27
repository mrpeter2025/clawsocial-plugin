// Push notifications into the user's OpenClaw chat via enqueueSystemEvent.
// sessionKey is captured from the before_agent_start hook; enqueueSystemEvent
// is set once during plugin registration.

type EnqueueFn = (text: string, opts: { sessionKey: string }) => void;

let _enqueue: EnqueueFn | null = null;
let _sessionKey: string | null = null;

export function setEnqueueFn(fn: EnqueueFn): void {
  _enqueue = fn;
}

export function setSessionKey(key: string): void {
  _sessionKey = key;
}

export function pushNotification(text: string): void {
  if (!_enqueue || !_sessionKey) return;
  _enqueue(text, { sessionKey: _sessionKey });
}
