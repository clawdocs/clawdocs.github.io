---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Configuration Reference
sidebar_label: Configuration
description: How ~/.openclaw/openclaw.json works, the sections a self-hoster actually edits, one validated example each, and where the full reference lives
keywords: [openclaw, openclaw config, openclaw.json, settings, configuration reference, json5, config file]
---

# Configuration Reference

This page explains how OpenClaw's config works and shows the sections most self-hosters touch, each with one example that passes `openclaw config validate` on v2026.10.4. It is not a field-by-field reference. For every key and default, use the official [Configuration reference](https://docs.openclaw.ai/gateway/configuration-reference) or print the live schema with `openclaw config schema`.

## How the config works

- **One JSON5 file.** OpenClaw reads `~/.openclaw/openclaw.json` (override with `OPENCLAW_CONFIG_PATH`). JSON5 allows comments, unquoted keys and trailing commas. The file is optional; with no file, OpenClaw uses safe defaults. Keep it a regular file, not a symlink: OpenClaw writes it atomically, which replaces a symlink target.
- **Strict schema.** Unknown keys, wrong types and invalid enum values make the Gateway **refuse to start**. Only `$schema` is allowed as an extra root key. Pasting a key from an old blog post is the most common way to break an install. See [Strict validation](https://docs.openclaw.ai/gateway/configuration#strict-validation).
- **Two buckets.** Root sections (`gateway`, `channels`, `models`, `tools`, ...) hold infrastructure and cross-agent defaults. `agents.defaults` holds agent-loop behaviour (model, workspace, heartbeat, sandbox). `agents.entries.<id>` overrides either per agent.
- **Hot reload.** The Gateway watches the file. Most changes apply live; a few (auth mode, listener topology, TLS) restart the Gateway automatically in the default `hybrid` reload mode. An invalid edit is skipped and the last good config keeps running. See [Config hot reload](https://docs.openclaw.ai/gateway/configuration/hot-reload).
- **Repairs.** After an upgrade, `openclaw doctor --fix` migrates retired keys (for example `agents.list` to `agents.entries`, top-level `heartbeat` to `agents.defaults.heartbeat`). Some retired keys are refused rather than migrated; see [Config migrations](https://docs.openclaw.ai/gateway/doctor/config-migrations).

## Editing it

Prefer the CLI over hand edits. Every write goes through the same schema check, so a typo fails before it reaches the file.

```bash
openclaw config file                              # print the active config path
openclaw config get agents.defaults.model         # read one value
openclaw config set tools.exec.mode ask           # write one value
openclaw config unset tools.deny                  # remove a value
openclaw config patch --file ./change.json5 --dry-run   # validate a multi-key change
openclaw config patch --file ./change.json5             # apply it in one write
openclaw config validate                          # check the file without starting the Gateway
openclaw config schema                            # print the JSON Schema used for validation
```

`config patch` merges objects recursively, replaces arrays and scalars, and deletes a path when you set it to `null`. `config set` takes JSON5 values (`openclaw config set gateway.port 19001 --strict-json`) and can build SecretRefs for you (see below). The interactive alternatives are `openclaw configure` and the **Config** tab of the Control UI at `http://127.0.0.1:18789/`. Reference: [`openclaw config`](https://docs.openclaw.ai/cli/config).

:::tip Validate snippets before you paste them
Save a snippet to a scratch file and run `OPENCLAW_CONFIG_PATH=./scratch.json5 openclaw config validate`. The output names the exact path that is wrong.
:::

## Splitting the file with `$include`

Large configs can be split. An object can be replaced by `{ $include: "./file.json5" }`, or a list of files that are merged in order; keys next to `$include` override the included values. `${VAR}` substitution works inside included files. Note that startup auto-migration skips configs that use `$include`, so run `openclaw doctor --fix` yourself after upgrades. See [Split config into multiple files](https://docs.openclaw.ai/gateway/configuration/common-tasks#split-config-into-multiple-files-include).

{/* snippet:skip the included files do not exist in the checker sandbox */}
```json5 title="~/.openclaw/openclaw.json"
{
  agents: { $include: "./agents.json5" },
  channels: { $include: ["./channels/telegram.json5", "./channels/discord.json5"] },
}
```

## Environment variable substitution {#environment-variable-substitution}

Any string value can reference an environment variable with `${VAR_NAME}`. Only uppercase names (`[A-Z_][A-Z0-9_]*`) are substituted. A missing or empty variable stays visibly unresolved, logs a warning, and the feature that needs it is unavailable: it does not fall back to anything. Write `$${VAR}` for a literal `${VAR}`.

Variables come from the process environment, then `./.env`, then `~/.openclaw/.env`, then the config's own `env.vars` block; none of these override a variable that is already set. `~/.openclaw/.env` is the usual place for API keys on a self-hosted box. Details: [Environment variables](/reference/environment-variables) and [upstream](https://docs.openclaw.ai/gateway/configuration/environment-variables).

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: { auth: { mode: "token", token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  env: { vars: { OPENROUTER_API_KEY: "sk-or-replace-me" } },
}
```

## SecretRefs

Credential fields that support it can take a SecretRef object instead of a string, so the secret never sits in `openclaw.json`. Sources are `env`, `file`, `exec` (a command such as a vault CLI) and `store` (OpenClaw's Secret Store). The `env` source uses a built-in `default` provider and needs no extra setup; `file` and `exec` need a provider under `secrets.providers`.

```json5 title="~/.openclaw/openclaw.json"
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
        models: [],
      },
    },
  },
}
```

The CLI can write the same ref: `openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN`. Which fields accept refs is listed in [SecretRef credential surface](https://docs.openclaw.ai/reference/secretref-credential-surface); providers and precedence are in [Secrets](https://docs.openclaw.ai/gateway/secrets).

## The sections you will actually edit

Each example below is a complete, valid file on its own. Combine them as you need.

### `gateway`

Port, bind address and auth for the WebSocket + HTTP server. `gateway.mode` must be `local` for this machine to run a Gateway. Bind is a mode, not an IP: `loopback` (default), `lan`, `tailnet`, `custom` (with `customBindHost`) or `auto`. Auth is required by default and onboarding generates a token; `auth.mode` is `token`, `password`, `trusted-proxy` or `none`. Port precedence is `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    mode: "local",
    port: 18789,
    bind: "loopback",
    auth: { mode: "token", token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

Our advice: keep `loopback` and reach the box over SSH or Tailscale Serve rather than `lan`. A non-loopback bind without auth is refused at startup. Reference: [Configuration - gateway](https://docs.openclaw.ai/gateway/config-gateway), [Network exposure](https://docs.openclaw.ai/gateway/security/network-exposure).

### `agents.defaults`: model, workspace, heartbeat

Model refs are always `provider/model`. Onboarding picks the default for the provider you sign in with (a fresh Anthropic setup gets `anthropic/claude-opus-5-5`); with no model configured at all, the built-in fallback is `openai/gpt-6-astra`. The heartbeat runs every `30m` by default, `1h` when Anthropic auth is OAuth/token and `every` is unset; `every: "0m"` disables it.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: {
        primary: "anthropic/claude-opus-5-5",
        fallbacks: ["anthropic/claude-sonnet-5-5"],
      },
      heartbeat: {
        every: "1h",
        model: "anthropic/claude-haiku-5-5",
        activeHours: { start: "08:00", end: "22:00" },
      },
    },
  },
}
```

`HEARTBEAT.md` is retired: the runtime no longer reads it. `openclaw doctor --fix` moves its contents into monitor scratch and turns scheduled tasks into Automations jobs. Reference: [Configuration - agents](https://docs.openclaw.ai/gateway/config-agents), [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat), [Models](https://docs.openclaw.ai/concepts/models).

### `agents.defaults.sandbox`

Sandboxing is **off by default**: tools run on the host as your user. `mode` is `off`, `non-main` (every session except the agent's main session, including group and channel sessions) or `all`. The default backend is Docker with a locally built image.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      sandbox: { mode: "non-main", scope: "session", workspaceAccess: "ro" },
    },
  },
}
```

Reference: [Sandboxing](https://docs.openclaw.ai/gateway/sandboxing), [Configuration - sandbox](https://docs.openclaw.ai/gateway/config-agents/sandbox).

### `agents.entries` and `bindings`: more than one agent

Agents are keyed by id under `agents.entries` (the old `agents.list` array is migrated by doctor). With several agents, set `ownership: "explicit"` and route channels to agents with top-level `bindings`.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: { heartbeat: { agentId: "home" }, systemAgent: { agentId: "home" } },
    entries: {
      home: { workspace: "~/.openclaw/workspace-home" },
      work: { workspace: "~/.openclaw/workspace-work", model: "anthropic/claude-sonnet-5-5" },
    },
  },
  bindings: [
    { agentId: "home", match: { channel: "telegram" } },
    { agentId: "work", match: { channel: "slack" } },
  ],
}
```

`match.peer` is an object (`{ kind: "direct" | "group" | "channel", id }`), not a string. Reference: [Multi-agent routing](https://docs.openclaw.ai/gateway/config-agents/entries-and-multi-agent).

### `models.providers`: custom or local providers

You only need this for providers that are not built in, or to point a built-in one at another URL. `models` is an **array** of `{ id, name, ... }` objects. `models.mode` defaults to `merge` (your entries are added to the built-in catalog).

```json5 title="~/.openclaw/openclaw.json"
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://127.0.0.1:11434",
        api: "ollama",
        models: [{ id: "qwen3:32b", name: "Qwen3 32B" }],
      },
    },
  },
  agents: { defaults: { model: { primary: "ollama/qwen3:32b" } } },
}
```

Reference: [Custom providers](https://docs.openclaw.ai/gateway/config-tools/custom-providers), [Providers](https://docs.openclaw.ai/providers).

### `channels`

One block per channel. Who may DM the bot is per channel: `dmPolicy` is `pairing` (strangers get a one-hour code you approve with `openclaw pairing approve <channel> <code>`), `allowlist`, `open` or `disabled`, with `allowFrom` listing allowed senders.

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "${TELEGRAM_BOT_TOKEN}",
      dmPolicy: "allowlist",
      allowFrom: ["123456789"],
    },
  },
}
```

Easiest path: `openclaw channels add telegram`, which writes this for you. Reference: [Configuration - channels](https://docs.openclaw.ai/gateway/config-channels), [Pairing](https://docs.openclaw.ai/channels/pairing).

### `tools`: exec approvals and tool policy

Host exec defaults to `tools.exec.mode: "full"`: **no approval prompts**. Modes are `deny`, `allowlist`, `ask` (allowlisted commands run, everything else asks you), `auto` (a reviewer model decides, asks you when unsure) and `full`. `tools.profile` (`minimal`, `coding`, `messaging`, `full`) sets the base tool set; unset means no filtering. `tools.deny` removes tools or groups.

```json5 title="~/.openclaw/openclaw.json"
{
  tools: {
    profile: "coding",
    exec: { mode: "ask" },
    deny: ["browser"],
  },
}
```

Older `tools.exec.security` / `tools.exec.ask` fields are legacy; set `mode` instead. Reference: [Exec](https://docs.openclaw.ai/tools/exec), [Exec approvals](https://docs.openclaw.ai/tools/exec-approvals), [Tool policy](https://docs.openclaw.ai/gateway/config-tools/tool-policy).

:::warning
Exec, browser and file tools act on your machine with your user's rights. Before connecting public channels, read [Security Hardening](/security/hardening): set `tools.exec.mode` to `ask` or `allowlist`, and consider turning on the sandbox.
:::

### `browser`

The agent's dedicated Chromium. Headless by default. Navigation limits live in `ssrfPolicy`; there is no `allowed_domains` key.

```json5 title="~/.openclaw/openclaw.json"
{
  browser: {
    enabled: true,
    headless: true,
    ssrfPolicy: { blockedHostnames: ["internal.example.com"] },
  },
}
```

Reference: [Browser](https://docs.openclaw.ai/tools/browser), [Configuration - browser](https://docs.openclaw.ai/gateway/config-browser-ui-desktop).

### `session`

How conversations map to sessions. `dmScope` decides whether DMs share one session (`main`, the default) or are split `per-peer`, `per-channel-peer` or `per-account-channel-peer`. If more than one person can DM the bot, split them.

```json5 title="~/.openclaw/openclaw.json"
{
  session: { dmScope: "per-channel-peer" },
}
```

Reference: [Configuration - sessions](https://docs.openclaw.ai/gateway/config-agents/sessions).

### `skills`, `plugins` and `mcp`

Skills are enabled or given keys under `skills.entries.<name>`. Plugins are configured under `plugins.entries.<id>.config` (for example memory dreaming lives at `plugins.entries.memory-core.config.dreaming`). MCP servers go under `mcp.servers.<name>` with an executable in `command` and arguments in `args`, or a `url` for remote servers.

```json5 title="~/.openclaw/openclaw.json"
{
  skills: { entries: { "image-lab": { enabled: false } } },
  mcp: {
    servers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/me/projects"],
      },
    },
  },
}
```

Reference: [Configuration - MCP, skills, and plugins](https://docs.openclaw.ai/gateway/config-extensions), [`openclaw mcp`](https://docs.openclaw.ai/cli/mcp), [Memory config](https://docs.openclaw.ai/reference/memory-config).

### `logging`

File logs default to `/tmp/openclaw/openclaw-YYYY-MM-DD.log`. Useful keys are `level`, `consoleLevel`, `file`, `maxFileBytes` (default 100 MB) and `redactPatterns`. The metadata-only audit ledger (`logging.audit.enabled`) is on by default.

```json5 title="~/.openclaw/openclaw.json"
{
  logging: { level: "info", maxFileBytes: 52428800, redactPatterns: ["sk-[A-Za-z0-9]+"] },
}
```

Reference: [Logging](https://docs.openclaw.ai/logging), [Configuration - observability](https://docs.openclaw.ai/gateway/config-observability).

## Backups

The Gateway keeps a `.bak` ring of previous configs and a last-known-good copy, but only `openclaw doctor --fix` restores from them; startup does not. Before an upgrade, take a real backup:

```bash
openclaw backup create --verify
openclaw backup create --only-config --output ~/Backups
```

`backup create` covers config, credentials, sessions and workspaces. Reference: [`openclaw backup`](https://docs.openclaw.ai/cli/backup).

## See also

- [Configuration](https://docs.openclaw.ai/gateway/configuration) and [Configuration examples](https://docs.openclaw.ai/gateway/configuration-examples) (official)
- [Environment Variables](/reference/environment-variables)
- [CLI Reference](/reference/cli)
- [Security Hardening](/security/hardening)
- [Local Models](/guides/local-models), [Model Selection](/guides/model-selection), [Multi-Agent](/guides/multi-agent)
