---
sidebar_position: 17
title: Plugin System
description: Install, configure, and build OpenClaw plugins — gateway-level extensions for channels, orchestration, and monitoring
---

# Plugin System

Plugins extend OpenClaw at the gateway level. Where [skills](/guides/skill-development) teach agents new capabilities via Markdown, plugins add infrastructure — new channels, storage backends, orchestration layers, and monitoring hooks.

The plugin architecture matured significantly in **v2026.5.28–v2026.6.1** with externalized official plugins, a SQLite-backed install index, the SecretRef credential contract, and standardized lifecycle hooks.

---

## Plugins vs Skills

| | Skills | Plugins |
|---|---|---|
| **Format** | Markdown with YAML frontmatter | npm packages (TypeScript) |
| **Purpose** | Teach agents new capabilities | Extend gateway infrastructure |
| **Activation** | Keyword/phrase triggers per message | Loaded at gateway startup |
| **Lifetime** | Per-message | Per-session |
| **Location** | `~/.openclaw/skills/` | `node_modules/` + plugin index |
| **Development** | Write Markdown | TypeScript + plugin SDK |
| **Registry** | ClawHub skills | npm + ClawHub plugins |

**Rule of thumb:** if it changes what the agent *knows*, it's a skill. If it changes what the gateway *can do*, it's a plugin.

---

## CLI Commands

```bash
openclaw plugins <subcommand>
```

| Command | What It Does |
|---------|-------------|
| `openclaw plugins list` | Show installed plugins and their status |
| `openclaw plugins list --json` | JSON output for scripting |
| `openclaw plugins inspect <name>` | View plugin details, config, and manifest |
| `openclaw plugins inspect <name> --runtime` | Include runtime status and health |
| `openclaw plugins install <name>` | Install a plugin from npm or ClawHub |
| `openclaw plugins uninstall <name>` | Remove a plugin |
| `openclaw plugins update` | Upgrade all plugins |
| `openclaw plugins update <name>` | Upgrade a specific plugin |
| `openclaw plugins enable <name>` | Enable a disabled plugin |
| `openclaw plugins disable <name>` | Disable without uninstalling |
| `openclaw plugins doctor` | Diagnose plugin issues |
| `openclaw plugins marketplace list` | Browse available plugins |

### Quick Examples

```bash
# Install the GitHub Copilot plugin
openclaw plugins install @openclaw/copilot

# Check what's installed
openclaw plugins list

# Something broken? Run doctor
openclaw plugins doctor
```

---

## Official Plugins

### Core Plugins (bundled)

These ship with OpenClaw and are enabled/disabled via config:

| Plugin | Purpose | Since |
|--------|---------|-------|
| **workboard** | Kanban-style task board for agent coordination | v2026.6.1 |
| **memory-core** | Enhanced memory system with Dreaming mode | v2026.5 |

```bash
openclaw plugins enable workboard
openclaw plugins enable memory-core
openclaw gateway restart
```

See the [Workboard Guide](/guides/workboard) for full details on the workboard plugin.

### External Official Plugins (install on demand)

These were extracted from core into separate packages in v2026.5.28–6.1:

| Plugin | Purpose | Install |
|--------|---------|---------|
| **@openclaw/copilot** | GitHub Copilot agent runtime | `openclaw plugins install @openclaw/copilot` |
| **@openclaw/tokenjuice** | Token analysis and optimization | `openclaw plugins install @openclaw/tokenjuice` |

Both are published on npm and ClawHub.

### Notable Community Plugins

| Plugin | Purpose |
|--------|---------|
| **@xquik/tweetclaw** | X/Twitter automation — search, post, DMs, monitors |
| **OpenClaw Observability** | OpenTelemetry tracing with Dynatrace/Grafana Cloud support |
| **Knostic Telemetry** | Local-only opt-in telemetry with cryptographic hash chains |

```bash
# Install a community plugin
openclaw plugins install @xquik/tweetclaw
```

---

## Configuration

Plugin configuration lives in `~/.openclaw/openclaw.json` under `plugins`:

```json5 title="~/.openclaw/openclaw.json"
{
  "plugins": {
    "allowlist": [],                // Empty = all allowed; restrict for security
    "sandbox_level": "medium",      // "low", "medium", "high"

    "entries": {
      "workboard": {
        "enabled": true,
        "config": {}
      },
      "memory-core": {
        "enabled": true,
        "config": {
          "dreaming": {
            "enabled": true,
            "cadence": "0 3 * * *"
          }
        }
      },
      "@openclaw/copilot": {
        "enabled": true,
        "secrets": {
          "GITHUB_COPILOT_TOKEN": "${GITHUB_COPILOT_TOKEN}"
        }
      }
    }
  }
}
```

### Per-Plugin Config

Each plugin entry supports:

| Field | Description |
|-------|-------------|
| `enabled` | `true`/`false` — toggle without uninstalling |
| `config` | Plugin-specific settings (see plugin docs) |
| `secrets` | Credential references using `${ENV_VAR}` expansion |
| `hooks` | Hook configuration (channel, provider, agent) |

---

## SecretRef Contract

Introduced in v2026.6.1, the **SecretRef** contract standardizes how plugins declare and receive credentials.

### How It Works

1. **Plugin declares** what secrets it needs in its manifest:
   ```typescript
   secrets: [
     {
       name: 'GITHUB_COPILOT_TOKEN',
       description: 'GitHub Copilot OAuth token',
       required: true,
       type: 'oauth'
     }
   ]
   ```

2. **You provide** the secrets via config with environment variable expansion:
   ```json5
   {
     "@openclaw/copilot": {
       "secrets": {
         "GITHUB_COPILOT_TOKEN": "${GITHUB_COPILOT_TOKEN}"
       }
     }
   }
   ```

3. **Gateway validates** that required secrets are present at startup

### Security Properties

- Secrets are **scoped** — only the declaring plugin can access its own secrets
- **Disabled plugins** cannot access their secrets
- Secrets cannot be **injected across** plugins
- Use environment variables, not plaintext values in config

---

## SQLite Plugin Index

As of v2026.6.1, OpenClaw uses a **SQLite-backed registry** instead of filesystem scanning for plugin state.

### Benefits

- **Faster startup** — single DB query vs directory scan
- **Better crash recovery** — atomic transactions for install/uninstall
- **Reduced I/O** — no repeated filesystem scanning during hot paths
- **Consistent state** — install records survive process restarts cleanly

### Diagnostics

```bash
# Check the plugin index health
openclaw plugins doctor

# Full JSON dump of installed plugins
openclaw plugins list --json
```

---

## Plugin Hooks

Plugins can hook into three layers of the gateway:

### Channel Hooks

React to messages before and after agent processing:

```json5
{
  "my-plugin": {
    "hooks": {
      "channel": [
        { "event": "onMessage", "handler": "handleMessage" },
        { "event": "onReply", "handler": "handleReply" }
      ]
    }
  }
}
```

| Event | When It Fires |
|-------|--------------|
| `onMessage` | Before agent processes an incoming message |
| `onReply` | After agent generates a response |

### Provider Hooks

Intercept LLM API calls:

| Event | When It Fires |
|-------|--------------|
| `beforeRequest` | Before sending a request to the LLM provider |
| `afterResponse` | After receiving the provider response |

Useful for logging, token counting, cost tracking, or request modification.

### Agent Hooks

Observe agent execution:

| Event | When It Fires |
|-------|--------------|
| `onTurn` | Before agent processes a conversation turn |
| `beforeTool` | Before a tool is executed |
| `afterTool` | After a tool completes |

---

## Building a Custom Plugin

Plugins are TypeScript npm packages that use the OpenClaw plugin SDK.

### Package Structure

```
my-plugin/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts
└── dist/
    └── index.js
```

### Minimal Plugin

```typescript title="src/index.ts"
import type { PluginManifest, PluginContext } from '@openclaw/plugin-sdk';

export const manifest: PluginManifest = {
  name: '@yourscope/my-plugin',
  version: '1.0.0',
  description: 'A custom plugin that logs every tool call',
  secrets: [
    {
      name: 'WEBHOOK_URL',
      description: 'Webhook to notify on tool execution',
      required: false,
      type: 'api_key'
    }
  ]
};

export async function initialize(context: PluginContext) {
  const webhookUrl = context.secrets.get('WEBHOOK_URL');

  context.registerHook('agent', 'afterTool', async (result) => {
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: result.toolName,
          duration: result.durationMs,
          timestamp: new Date().toISOString()
        })
      });
    }
  });
}
```

### package.json

```json title="package.json"
{
  "name": "@yourscope/my-plugin",
  "version": "1.0.0",
  "description": "A custom OpenClaw plugin",
  "main": "dist/index.js",
  "type": "module",
  "exports": {
    ".": "./dist/index.js"
  },
  "peerDependencies": {
    "openclaw": ">=2026.6.0"
  }
}
```

### Build and Install

```bash
# Build
npm run build

# Install locally for testing
openclaw plugins install ./my-plugin

# Or publish and install from npm
npm publish --access public
openclaw plugins install @yourscope/my-plugin
```

### Publish to ClawHub

```bash
openclaw clawhub publish ./my-plugin --type plugin
```

---

## Plugin Lifecycle

Understanding the startup and shutdown sequence:

### Startup

```
Gateway starts
  → Load plugin manifests from install index (SQLite)
  → Validate SecretRef contracts (required secrets present?)
  → Instantiate plugins with config
  → Execute startup hooks
  → Register channels, providers, tools
  → Ready to accept requests
```

### Shutdown

```
Gateway stops
  → Send disconnect to plugin channels
  → Save plugin state to SQLite index
  → Close WebSocket connections
  → Run cleanup hooks
```

### Enable/Disable

Toggling a plugin does not require reinstalling:

```bash
openclaw plugins disable workboard    # Stops hooks, keeps data
openclaw plugins enable workboard     # Restarts hooks
openclaw gateway restart              # Apply changes
```

Disabled plugins retain their config and data but cannot access secrets or fire hooks.

---

## Security

### Plugin Allowlist

Restrict which plugins can be installed:

```json5 title="~/.openclaw/openclaw.json"
{
  "plugins": {
    "allowlist": [
      "@openclaw/*",           // All official plugins
      "@xquik/tweetclaw"      // Specific trusted community plugin
    ]
  }
}
```

An empty allowlist (the default) permits all plugins.

### Sandbox Levels

| Level | Isolation | Use Case |
|-------|-----------|----------|
| `low` | Minimal isolation | Trusted development environments |
| `medium` | Standard isolation (default) | Most setups |
| `high` | Strict isolation, limited filesystem | Production with untrusted plugins |

### Best Practices

- **Review before installing** — plugins run at the gateway level with broad access
- **Use SecretRef** — never hardcode credentials in plugin config
- **Set an allowlist** in production — don't leave it empty
- **Monitor with `doctor`** — run `openclaw plugins doctor` periodically
- **Keep plugins updated** — `openclaw plugins update` catches security patches
- **Disable unused plugins** — fewer active plugins = smaller attack surface

---

## Troubleshooting

**Plugin not loading:**
```bash
openclaw plugins inspect <name> --runtime --json
```
Check that the plugin is enabled, secrets are configured, and the state root is writable.

**Missing secrets at startup:**
```bash
# Check what secrets a plugin expects
openclaw plugins inspect <name>

# Verify your environment
echo $GITHUB_COPILOT_TOKEN
```

**Plugin hooks not firing:**
```bash
openclaw plugins list           # Is it enabled?
openclaw logs --follow          # Watch for hook errors
openclaw gateway restart        # Hooks reload on restart
```

**Install failed / corrupt state:**
```bash
openclaw plugins doctor         # Diagnose and repair
openclaw plugins uninstall <name> && openclaw plugins install <name>  # Clean reinstall
```

**Gateway won't start after plugin install:**
```bash
openclaw plugins disable <name>   # Disable the problem plugin
openclaw gateway restart          # Start without it
openclaw plugins doctor           # Diagnose
```

---

## See Also

- [Workboard](/guides/workboard) — The workboard plugin in depth
- [Skill Workshop](/guides/skill-workshop) — Governed skill creation (complementary to plugins)
- [Skill Development](/guides/skill-development) — Building skills (Markdown, not plugins)
- [Configuration Reference](/reference/configuration) — All plugin config options
- [Security Hardening](/security/hardening) — Securing your gateway
- [Ecosystem](/reference/ecosystem) — Community tools and plugins
