---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Plugin System
description: Install, configure, secure and build OpenClaw plugins — sources, plugins.* config, hooks, the plugin SDK, and publishing to ClawHub
keywords: [openclaw, plugins, gateway plugin, openclaw.plugin.json, plugin sdk, extend openclaw]
---

# Plugin System

Plugins add code to the Gateway: messaging channels, model and speech providers, agent tools, hooks, memory backends, Control UI pages. Where a [skill](/guides/skill-development) is Markdown that tells the agent how to use existing tools, a plugin is a TypeScript module that runs **inside the Gateway process with the Gateway's privileges**.

The official references are [Plugins](https://docs.openclaw.ai/tools/plugin), [`openclaw plugins`](https://docs.openclaw.ai/cli/plugins) and [Building plugins](https://docs.openclaw.ai/plugins/building-plugins).

:::caution Security advisories
The [June 30, 2026 advisory batch](/security/known-vulnerabilities#june-2026-advisory-batch-june-30-2026) included two plugin-install flaws: [GHSA-7vrr-rp4x-4g76](https://github.com/openclaw/openclaw/security/advisories/GHSA-7vrr-rp4x-4g76) (High, CVSS 8.8: install commands could allow non-owner persistence) and [GHSA-wgq8-x5wm-g4rw](https://github.com/openclaw/openclaw/security/advisories/GHSA-wgq8-x5wm-g4rw) (Medium, CVSS 4.9: install wrappers could skip install policy). Both were fixed in v2026.6.9. Run the latest stable release and `openclaw plugins update --all`.
:::

---

## Plugins vs Skills

| | Skills | Plugins |
|---|---|---|
| **Format** | Folder with `SKILL.md` | Package with `openclaw.plugin.json` and a JS/TS entry, or a compatible Codex/Claude/Cursor bundle |
| **What it changes** | What the agent knows how to do | What the Gateway can do |
| **How it is used** | The model reads it when the task matches | Loaded by the Gateway, registers tools, hooks, channels, providers |
| **Runs code** | No (the agent may run commands it describes) | Yes, in process |
| **Location** | `<workspace>/skills/`, `~/.openclaw/skills/` | Managed install roots, `plugins.load.paths` |
| **Sources** | ClawHub, skills.sh, git, local | Bundled, ClawHub, npm, git, local path or archive, marketplace |

**Rule of thumb:** if it changes what the agent *knows*, it is a skill. If it changes what the Gateway *can do*, it is a plugin. Plugins can also ship skills, listed in `openclaw.plugin.json`.

---

## CLI Commands

| Command | What it does |
|---|---|
| `openclaw plugins list [--enabled] [--verbose] [--json]` | Installed plugins and their status |
| `openclaw plugins search <query>` | Search ClawHub for plugins |
| `openclaw plugins inspect <id> [--runtime] [--json]` | Manifest, config and (with `--runtime`) live registrations |
| `openclaw plugins install <source>` | Install from ClawHub, npm, git, a path, an archive or a marketplace |
| `openclaw plugins enable <ids...>` / `disable <ids...>` | Turn plugins on or off, keeping config |
| `openclaw plugins reload <ids...> [--wait]` | Reload a plugin in the running Gateway |
| `openclaw plugins update <ids...>` / `--all` | Update named plugins, or all of them |
| `openclaw plugins uninstall <ids...> [--dry-run]` | Remove plugins |
| `openclaw plugins registry [--refresh]` | Inspect or rebuild the plugin index |
| `openclaw plugins doctor` | Diagnose plugin problems |
| `openclaw plugins marketplace entries` | Browse the hosted marketplace feed |
| `openclaw plugins marketplace list <source>` | List a specific marketplace source |
| `openclaw plugins init` / `build` / `validate` / `pack` | Author a plugin (see [Building a Plugin](#building-a-plugin)) |

`install`, `enable`, `disable` and `reload` go through the running Gateway when there is one, so most changes apply without a restart.

### Install sources

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>            # ClawHub only
openclaw plugins install npm:<package>                # npm only
openclaw plugins install npm:<package>@1.2.3 --pin    # exact npm version
openclaw plugins install ./my-plugin                  # local directory or archive
openclaw plugins install --link ./my-plugin --force   # link a dev checkout
```

Git sources use `git:github.com/<owner>/<repo>` with an optional `@<ref>`. Claude-compatible marketplaces use `<plugin>@<marketplace>` or `--marketplace <source>`.

In v2026.10.4, a **bare** name (`openclaw plugins install some-plugin`) installs from **npm**, unless it matches a bundled or official plugin id. Upstream `main` has switched bare names to ClawHub with no npm fallback ([PR #173669](https://github.com/openclaw/openclaw/pull/173669)). That change merged after 2026.10.10-beta.1 and beta.2 were cut, so it is in no release yet and may or may not ship in 2026.10.10. Use an explicit `clawhub:` or `npm:` prefix so the command means the same thing on both sides.

ClawHub packages and OpenClaw's bundled and official catalogue are trusted sources. Arbitrary npm packages, git, local paths and marketplaces warn and ask first; non-interactive installs need `--force` after you have reviewed the source. `--force` does not bypass `security.installPolicy`.

---

## Official Plugins

### Bundled

Bundled plugins ship with OpenClaw. Many, mostly model and speech providers, are on by default; others need enabling or relevant config. `openclaw plugins list --verbose` shows which. Two you are likely to touch:

| Plugin | Purpose | Default |
|---|---|---|
| `workboard` | Kanban-style task board for agent coordination | off |
| `memory-core` | Built-in memory tools and Dreaming; the plugin in `plugins.slots.memory` | selected via the memory slot |

```bash
openclaw plugins enable workboard
openclaw plugins list --enabled --verbose
```

See the [Workboard guide](/guides/workboard) and [Monitoring](/guides/monitoring).

### External official plugins

OpenClaw-owned `@openclaw/*` packages are on npm and ClawHub:

| Package | Plugin id | Purpose |
|---|---|---|
| `@openclaw/copilot` | `copilot` | GitHub Copilot SDK agent harness |
| `@openclaw/tokenjuice` | `tokenjuice` | Compacts noisy exec/bash tool output before it reaches the model |
| `@openclaw/diagnostics-otel` | `diagnostics-otel` | OpenTelemetry exporter for metrics, traces and logs |
| `@openclaw/diagnostics-prometheus` | `diagnostics-prometheus` | Prometheus exporter for runtime metrics |

```bash
openclaw plugins install @openclaw/copilot
```

Configure a plugin under its **plugin id** (`copilot`), not its npm name. The current list is in the [plugin inventory](https://docs.openclaw.ai/plugins/plugin-inventory).

### Community plugins

These are third-party. Read the source before installing; they run with full Gateway privileges.

| Plugin | Purpose |
|---|---|
| [`@xquik/tweetclaw`](https://github.com/Xquik-dev/tweetclaw) | X/Twitter search, posting, DMs and monitors |
| [OpenClaw Observability](https://github.com/henrikrexed/openclaw-observability-plugin) (`@henrikrexed/openclaw-otel-observability`) | OpenTelemetry tracing for Dynatrace or Grafana Cloud |
| [Knostic OpenClaw Telemetry](https://github.com/knostic/openclaw-telemetry) | Local-only telemetry with hash-chained logs |

For most observability needs, start with the official `@openclaw/diagnostics-otel` plugin.

---

## Configuration

Plugin config lives under `plugins` in `openclaw.json`. The schema is strict: unknown keys stop the config from loading.

```json5 title="~/.openclaw/openclaw.json"
{
  plugins: {
    enabled: true,
    allow: ["copilot", "memory-core", "workboard"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/dev/my-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      workboard: { enabled: true },
      "memory-core": {
        config: {
          dreaming: { enabled: true, frequency: "0 3 * * *", timezone: "Europe/Berlin" },
        },
      },
      "my-plugin": {
        enabled: true,
        hooks: { allowConversationAccess: true, timeoutMs: 10000 },
        config: {},
      },
    },
  },
}
```

| Key | What it does |
|---|---|
| `enabled` | `false` disables all plugins |
| `allow` | Exclusive allowlist of plugin ids. Tools from plugins outside it stay unavailable even if `tools.allow` has `"*"`. |
| `deny` | Plugin ids that never load. Wins over `allow` and per-plugin `enabled`. |
| `load.paths` | Extra local plugin files or directories |
| `slots.memory`, `slots.contextEngine` | Pick one plugin for an exclusive role |
| `entries.<id>.enabled` | Turn one plugin on or off, keeping its config |
| `entries.<id>.config` | The plugin's own settings, checked against the `configSchema` in its manifest |
| `entries.<id>.hooks` | `allowPromptInjection`, `allowConversationAccess`, `timeoutMs`, `timeouts` |
| `entries.<id>.subagent`, `entries.<id>.llm` | Whether the plugin may override models or agents for subagent runs and completion calls; leave unset unless the plugin needs it |

### Secrets

Plugins do not declare secrets in their manifest, and there is no `secrets` key in plugin config. Use SecretRefs, `{ source, provider, id }`, in whichever config field the plugin documents as accepting one, or `${ENV_VAR}` substitution. See [Secrets](https://docs.openclaw.ai/gateway/secrets).

---

## Security

Native plugins are not sandboxed. They run in the Gateway process and can do anything the Gateway's OS user can do. The controls are about **what gets loaded**:

- **Pin `plugins.allow`.** When `allow` is unset and the Gateway discovers non-bundled plugins, they may load automatically; startup logs `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` with a suggested snippet. Inspect each id (`openclaw plugins inspect <id>`) before adding it.
- **Workspace plugins are off by default.** Plugins found in an agent workspace must be enabled or allowlisted explicitly.
- **Capability consent.** Plugins from local or unverified sources must be approved with `--accept-capabilities` on `install`, `enable` or `reload` when they request capabilities.
- **ClawHub security audit.** ClawHub plugin installs show the release's audit; blocked releases are refused.
- **Conversation hooks are opt-in.** Non-bundled plugins only see raw conversation content in hooks such as `llm_input`, `llm_output` or `agent_end` when `entries.<id>.hooks.allowConversationAccess` is `true`.
- **Install policy.** `security.installPolicy` runs your own command before every plugin (and skill) install or update and can block it. See [ClawHub — Locking down installs](/guides/clawhub#locking-down-installs).

:::warning
A plugin that registers tools for shell, email, messaging, browser or payments gives every agent that can call those tools that power. Combine plugin allowlists with tool policy, sandboxing and approvals; see [Security hardening](/security/hardening).
:::

---

## Hooks

Plugins register hooks in code, not in config. The typed API is `api.on(name, handler, options)`:

| Area | Hooks |
|---|---|
| Model and prompt | `before_model_resolve`, `before_prompt_build`, `before_agent_run`, `before_agent_reply`, `before_agent_finalize`, `agent_end`, `llm_input`, `llm_output` |
| Tools | `before_tool_call` (rewrite, block or require approval), `after_tool_call`, `resolve_exec_env`, `tool_result_persist` |
| Messages | `message_received`, `message_sending`, `message_sent`, `reply_payload_sending`, `before_dispatch`, `inbound_claim` |
| Sessions | `session_start`, `session_end`, `before_compaction`, `after_compaction`, `before_reset` |
| Gateway and installs | `gateway_start`, `gateway_stop`, `cron_changed`, `before_install`, `skill_changed`, `skill_proposal_evaluate`, `skill_proposal_changed` |

`api.registerHook(...)` is a separate, coarser system for internal events such as `command:new`. Full list and contracts: [Hook reference](https://docs.openclaw.ai/plugins/hooks/reference).

Example: ask for approval before a plugin-owned deploy tool runs.

```typescript title="index.ts"
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  description: "Require approval before production deploys.",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") return;
      const env = typeof event.params.environment === "string" ? event.params.environment : "unknown";
      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${env}.`,
          severity: env === "production" ? "critical" : "warning",
          allowedDecisions: ["allow-once", "deny"],
          timeoutMs: 120_000,
        },
      };
    });
  },
});
```

---

## Building a Plugin

Requirements: Node 24.16+ or 26.1+, TypeScript ESM. The plugin API is marked experimental, so pin the OpenClaw version you test against.

### Scaffold

```bash
openclaw plugins init my-plugin --type tool --directory ./my-plugin
```

`--type` is `tool`, `provider` or `feature`. A tool plugin needs three files.

```json title="package.json"
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": { "typebox": "1.3.34" },
  "peerDependencies": { "openclaw": ">=2026.10.4" },
  "openclaw": {
    "extensions": ["./dist/index.js"],
    "compat": { "pluginApi": ">=2026.10.4" },
    "build": { "openclawVersion": "2026.10.4" }
  }
}
```

```json title="openclaw.plugin.json"
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "categories": ["other"],
  "contracts": { "tools": ["my_tool"] },
  "activation": { "onStartup": true },
  "configSchema": { "type": "object", "additionalProperties": false }
}
```

```typescript title="index.ts"
import { Type } from "typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Adds a custom tool to OpenClaw",
  register(api) {
    api.registerTool({
      name: "my_tool",
      description: "Echo one input value",
      parameters: Type.Object({ input: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: `Got: ${params.input}` }] };
      },
    });
  },
});
```

Points that trip people up:

- Every plugin needs `openclaw.plugin.json` with a `configSchema`, even an empty one.
- Every tool the plugin registers must be listed in `contracts.tools`.
- The SDK is imported from the `openclaw` package itself (`openclaw/plugin-sdk/plugin-entry`, `openclaw/plugin-sdk/core` for channels). There is no separate `@openclaw/plugin-sdk` package on npm.
- Deprecated synchronous SQLite-backed SDK members stay compatible through **2026-12-31**; upstream plans to remove them in the first January 2027 stable release. Move to the async replacements before then ([plugin compatibility](https://docs.openclaw.ai/plugins/compatibility), as documented in the 2026.10.10-beta.1 docs; the 2026.10.4 docs do not give the date yet).
- Runtime imports go in `dependencies`; `devDependencies` are not installed for the plugin at runtime.
- Published plugins point `openclaw.extensions` at built JavaScript, not `.ts` source.

### Test

```bash
openclaw plugins validate --root ./my-plugin
openclaw plugins build --root ./my-plugin --check

# Install exactly what users will get
cd my-plugin && npm pack --pack-destination /tmp && cd ..
openclaw plugins install npm-pack:/tmp/myorg-openclaw-my-plugin-1.0.0.tgz --force
openclaw plugins inspect my-plugin --runtime --json
```

During development, `openclaw plugins install --link ./my-plugin --force` and `openclaw plugins reload my-plugin` avoid repacking. Set `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` to see phase timings for slow installs or loads.

### Publish

Publishing uses the standalone `clawhub` CLI. Plugins are **packages**, not skills:

```bash
npm i -g clawhub
clawhub login
clawhub package validate ./my-plugin
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

`openclaw.compat.pluginApi` and `openclaw.build.openclawVersion` are required for publishing. Users then install with `openclaw plugins install clawhub:@myorg/openclaw-my-plugin`. See [ClawHub CLI — package publish](https://docs.openclaw.ai/clawhub/cli).

---

## Troubleshooting

**Plugin does not load:**

```bash
openclaw plugins inspect <id> --runtime --json
openclaw plugins doctor
openclaw doctor --lint    # read-only; plain `openclaw doctor` may migrate config and state
```

**Plugin is listed but its tools are missing:** check `plugins.allow` (an exclusive list), `plugins.deny`, and that each tool is in `contracts.tools`.

**Stale plugin ids after an upgrade or uninstall:** `openclaw doctor --fix` removes them and repairs legacy paths.

**Change not picked up:** `openclaw plugins reload <id> --wait`. `plugins list` and plain `inspect` read config on disk; `inspect --runtime` shows what the running Gateway loaded.

**Config rejected:** the `plugins` block is strict. Keys such as `allowlist`, `sandbox_level` or `secrets` do not exist and make validation fail. Run `openclaw config validate`.

---

## See Also

- [Skill Development](/guides/skill-development): Markdown skills, no code
- [MCP Servers](/guides/mcp-servers): connect external tool servers without writing a plugin
- [ClawHub](/guides/clawhub): the registry for skills and plugins
- [Security hardening](/security/hardening)
- Upstream: [Plugins](https://docs.openclaw.ai/tools/plugin), [Building plugins](https://docs.openclaw.ai/plugins/building-plugins), [Plugin manifest](https://docs.openclaw.ai/plugins/manifest), [Hooks](https://docs.openclaw.ai/plugins/hooks)
