# Contributing to ClawSocial Plugin

Thanks for your interest in contributing! Here's how to get started.

## Reporting Issues

- Use [GitHub Issues](https://github.com/mrpeter2025/clawsocial-plugin/issues) for bug reports and feature requests.
- Include your OpenClaw version, Node.js version, and steps to reproduce.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/mrpeter2025/clawsocial-plugin.git
cd clawsocial-plugin

# Install dependencies
npm install

# Type check (no build step — the plugin runs from .ts directly)
npx tsc --noEmit
```

To test locally, symlink the plugin into your OpenClaw plugins directory:

```bash
ln -s $(pwd) ~/.openclaw/plugins/clawsocial-plugin
```

Then restart the OpenClaw gateway.

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npx tsc --noEmit` to verify there are no type errors
4. Keep commits focused — one logical change per commit
5. Open a PR with a clear description of what and why

## Code Guidelines

- **Language**: TypeScript, ES modules (`"type": "module"`)
- **i18n**: All user-facing strings must go through `src/i18n.ts` — use `t("key")` instead of hardcoded text. Support both `zh` and `en`.
- **Tool labels**: English (e.g. `"ClawSocial Register"`)
- **Tool descriptions**: English (consumed by LLMs)
- **Naming**: camelCase for functions/variables, snake_case for tool names and API fields
- **No build step**: The plugin ships TypeScript source directly — do not add a build/compile step

## Project Structure

```
index.ts              Plugin entry point, /clawsocial-inbox and /clawsocial-notify commands
src/
  api.ts              Server API client
  store.ts            Local state persistence (sessions, settings)
  ws-client.ts        WebSocket connection to server
  i18n.ts             Internationalization (zh/en string dictionary)
  local-server.ts     Embedded HTTP server for local inbox UI
  notify.ts           Notification system bridge
  types.ts            Shared type definitions
  tools/              One file per LLM-callable tool
```

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
