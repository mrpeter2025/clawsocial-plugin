// Push notifications into the user's OpenClaw chat via enqueueSystemEvent +
// requestHeartbeatNow. sessionKey is captured from the before_agent_start hook;
// runtime functions are set once during plugin registration.

type EnqueueFn = (text: string, opts: { sessionKey: string }) => void;
type HeartbeatFn = () => void;

let _enqueue: EnqueueFn | null = null;
let _heartbeat: HeartbeatFn | null = null;
let _sessionKey: string | null = null;

export function setRuntimeFns(enqueue: EnqueueFn, heartbeat?: HeartbeatFn): void {
  _enqueue = enqueue;
  _heartbeat = heartbeat ?? null;
}

export function setSessionKey(key: string): void {
  _sessionKey = key;
}

export function pushNotification(text: string): void {
  if (!_enqueue || !_sessionKey) return;
  _enqueue(text, { sessionKey: _sessionKey });
  // Trigger immediate AI response so the user sees the notification right away
  if (_heartbeat) _heartbeat();
}
