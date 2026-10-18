---
sidebar_position: 2
title: Configuration Reference
sidebar_label: Configuration
description: Complete reference for ~/.openclaw/openclaw.json — every section and setting explained
keywords: [openclaw, openclaw config, openclaw.json, settings, configuration reference, json5, config file]
---

# Configuration Reference

OpenClaw reads an optional JSON5 config from `~/.openclaw/openclaw.json`. JSON5 supports comments and trailing commas. Override the path with the `OPENCLAW_CONFIG_PATH` environment variable.

:::tip
After editing the config, restart the gateway to apply changes: `openclaw gateway restart`
:::

---

## Full Example

```json5 title="~/.openclaw/openclaw.json"
{
  // LLM Configuration
  "brain": {
    "provider": "anthropic",
    "model": "claude-opus-4-6",
    "api_key": "${ANTHROPIC_API_KEY}",
    "temperature": 0.7,
    "max_tokens": 4096,
    "fallback": {
      "provider": "openrouter",
      "model": "deepseek/deepseek-v3.2"
    },
    "heartbeat_override": {
      "provider": "anthropic",
      "model": "claude-haiku-4-5-20251001"
    }
  },

  // Model Providers
  "models": {
    "mode": "merge",
    "providers": {
      "ollama": {
        "baseUrl": "http://localhost:11434",
        "models": {
          "qwen3:32b": {
            "contextWindow": 32768,
            "maxTokens": 4096
          }
        }
      }
    }
  },

  // Gateway
  "gateway": {
    "host": "127.0.0.1",
    "port": 18789,
    "max_connections": 10,
    "log_level": "info",
    "auth": {
      "mode": "token",
      "token": "${OPENCLAW_AUTH_TOKEN}"
    },
    "trustedProxies": ["127.0.0.1"]
  },

  // Execution Environment
  "hands": {
    "shell": {
      "enabled": true,
      "timeout": 30000,
      "blocked_commands": ["rm -rf /", "sudo rm"]
    },
    "browser": {
      "enabled": true,
      "headless": true,
      "timeout": 60000,
      "allowed_domains": []
    },
    "filesystem": {
      "writable_paths": [],
      "blocked_paths": ["~/.ssh", "~/.gnupg"]
    }
  },

  // Sandbox
  "sandbox": {
    "mode": "non-main",
    "backend": "docker",
    "scope": "agent"
  },

  // Tools
  "tools": {
    "profile": "coding",
    "alsoAllow": ["lobster"],
    "exec": {
      "security": "allowlist",
      "ask": "on-miss"
    }
  },

  // Agents
  "agents": {
    "defaults": {
      "model": "claude-sonnet-4-6",
      "sandbox": { "mode": "non-main" }
    },
    "list": [
      {
        "id": "researcher",
        "model": "claude-opus-4-8",
        "workspace": "~/research"
      },
      {
        "id": "monitor",
        "model": "ollama/qwen3:14b"
      }
    ]
  },

  // Bindings (message routing)
  "bindings": [
    {
      "match": { "channel": "telegram", "peer": "boss" },
      "agentId": "researcher"
    }
  ],

  // Session
  "session": {
    "dmScope": "per-channel-peer"
  },

  // DM Access Control
  "dm": {
    "accessPolicy": "pairing",
    "pairing": {
      "maxPending": 3,
      "expireMinutes": 60
    }
  },

  // Heartbeat
  "heartbeat": {
    "enabled": true,
    "interval": 1800,
    "model": "claude-haiku-4-5-20251001",
    "isolatedSession": true,
    "lightContext": false,
    "ackMaxChars": 300,
    "showOk": false,
    "showAlerts": true,
    "quiet_hours": {
      "start": "22:00",
      "end": "07:00",
      "timezone": "America/Los_Angeles"
    },
    "dreaming": {
      "enabled": false,
      "idle_threshold": 3
    }
  },

  // Memory
  "memory": {
    "enabled": true,
    "path": "~/.openclaw/memory",
    "max_context_tokens": 2000,
    "auto_save": true
  },

  // Skills
  "skills": {
    "path": "~/.openclaw/skills",
    "allow_install": true,
    "allow_clawhub": true,
    "auto_install_deps": false
  },

  // Permissions
  "permissions": {
    "mode": "ask",
    "auto_approve": ["git status", "git diff", "ls", "cat"],
    "always_deny": ["rm -rf /", "sudo rm"]
  },

  // MCP Servers
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx @anthropic/mcp-filesystem",
        "args": ["/home/user"]
      },
      "github": {
        "command": "npx @anthropic/mcp-github",
        "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
      }
    }
  },

  // Channels
  "channels": {
    "telegram": {
      "enabled": true,
      "allowedContacts": ["user123"]
    }
  },

  // Logging
  "logging": {
    "level": "info",
    "path": "~/.openclaw/logs",
    "max_size": "10m",
    "max_files": 5,
    "redactSensitive": "tools",
    "audit": { "enabled": false }
  }
}
```

---

## Section Reference

### `brain`

Primary LLM configuration.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `provider` | string | `"anthropic"` | LLM provider: `anthropic`, `openai`, `openrouter`, `google`, `xai`, `deepseek`, `local` |
| `model` | string | `"claude-opus-4-6"` | Model identifier |
| `api_key` | string | — | API key (supports `${ENV_VAR}` syntax) |
| `temperature` | float | `0.7` | Response randomness (0.0-1.0) |
| `max_tokens` | int | `4096` | Max response tokens |
| `fallback` | object | — | Fallback provider config (same fields as brain) |
| `heartbeat_override` | object | — | Override model for heartbeat only |

### `models`

Advanced model provider configuration. See [Local Models](/guides/local-models) and [Model Selection](/guides/model-selection) for usage examples.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `mode` | string | `"replace"` | `"merge"` adds providers to defaults; `"replace"` overrides entirely |
| `providers` | object | — | Provider-specific config (see below) |

#### `models.providers.<name>`

| Key | Type | Description |
|-----|------|-------------|
| `baseUrl` | string | Provider API endpoint |
| `apiKey` | string | Provider API key |
| `api` | string | API format: `openai-completions`, `ollama`, etc. |
| `models` | object | Per-model overrides (see below) |

#### `models.providers.<name>.models.<model>`

| Key | Type | Description |
|-----|------|-------------|
| `contextWindow` | int | Model context window size |
| `maxTokens` | int | Max output tokens |
| `compat.thinkingFormat` | string | Thinking format compatibility |
| `compat.supportsDeveloperRole` | bool | Model supports developer role |
| `compat.supportsReasoningEffort` | bool | Model supports reasoning effort parameter |
| `compat.maxTokensField` | string | Field name for max tokens |

---

### `gateway`

Gateway server configuration.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `host` | string | `"127.0.0.1"` | Bind address |
| `port` | int | `18789` | WebSocket port |
| `max_connections` | int | `10` | Max concurrent connections |
| `log_level` | string | `"info"` | Log verbosity: `debug`, `info`, `warn`, `error` |
| `pid_file` | string | `"~/.openclaw/gateway.pid"` | PID file path |
| `auth.mode` | string | `"token"` | Auth mode: `token` or `password` |
| `auth.token` | string | — | Auth token (auto-generated on first run) |
| `trustedProxies` | array | `[]` | Trusted reverse proxy IPs for header forwarding |

:::caution
Without `trustedProxies`, attackers can spoof `X-Forwarded-For` headers to bypass authentication. JFrog found 93.4% of exposed instances were vulnerable to this. See [Security Hardening](/security/hardening).
:::

---

### `hands`

Execution environment settings.

#### `hands.shell`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | bool | `true` | Enable shell command execution |
| `timeout` | int | `30000` | Command timeout in milliseconds |
| `blocked_commands` | array | `[]` | Commands that are always rejected |

#### `hands.browser`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | bool | `true` | Enable browser automation |
| `headless` | bool | `true` | Run browser without GUI |
| `timeout` | int | `60000` | Browser operation timeout (ms) |
| `allowed_domains` | array | `[]` | Restrict browsing to these domains (empty = all) |

#### `hands.filesystem`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `writable_paths` | array | `[]` | Restrict writes to these paths (empty = all) |
| `blocked_paths` | array | `["~/.ssh", "~/.gnupg"]` | Always block access to these paths |

---

### `sandbox`

Agent sandboxing configuration. Controls how agents are isolated.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `mode` | string | `"non-main"` | `"off"`, `"non-main"` (sandbox sub-agents only), or `"all"` |
| `backend` | string | `"docker"` | `"docker"`, `"ssh"`, or `"openshell"` |
| `scope` | string | `"agent"` | `"session"` (per-session), `"agent"` (per-agent), or `"shared"` |

:::info
The default `"non-main"` mode sandboxes sub-agents while leaving your primary agent unsandboxed. Use `"all"` for maximum isolation, at the cost of some functionality (e.g., direct file access).
:::

---

### `tools`

Tool execution configuration. Two independent axes control tool permissions.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `profile` | string | `"coding"` | Tool profile preset: `"coding"`, `"research"`, `"admin"` |
| `alsoAllow` | array | `[]` | Additional tools to enable (e.g., `["lobster"]`) |
| `exec.security` | string | `"allowlist"` | `"deny"` (block all), `"allowlist"` (approved list only), `"full"` (allow all) |
| `exec.ask` | string | `"on-miss"` | `"off"` (never ask), `"on-miss"` (ask for unlisted commands), `"always"` |

Both axes must be set together for the desired effect:

| Desired Behavior | `exec.security` | `exec.ask` |
|-----------------|-----------------|------------|
| Block all exec | `"deny"` | any |
| Ask for everything | `"allowlist"` | `"always"` |
| Ask for unknown commands | `"allowlist"` | `"on-miss"` |
| Allow everything silently | `"full"` | `"off"` |

---

### `agents`

Multi-agent configuration. See [Multi-Agent Guide](/guides/multi-agent) for patterns.

#### `agents.defaults`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `model` | string | — | Default model for all agents |
| `sandbox.mode` | string | `"non-main"` | Default sandbox mode for sub-agents |

#### `agents.list[]`

| Key | Type | Description |
|-----|------|-------------|
| `id` | string | Unique agent identifier |
| `model` | string | Model override for this agent |
| `workspace` | string | Agent's working directory |
| `heartbeat.tasks` | array | Heartbeat task names assigned to this agent |

### `bindings`

Message routing rules. Routes incoming messages to specific agents based on channel, peer, or account.

```json5
"bindings": [
  {
    "match": {
      "channel": "telegram",
      "peer": "boss-user-id",
      "accountId": "work-account"
    },
    "agentId": "researcher"
  }
]
```

| Key | Type | Description |
|-----|------|-------------|
| `match.channel` | string | Channel name filter |
| `match.peer` | string | Peer/sender ID filter |
| `match.accountId` | string | Account ID filter (multi-account setups) |
| `agentId` | string | Target agent ID |

---

### `session`

Session isolation settings.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `dmScope` | string | `"main"` | Session isolation level (see table) |

| `dmScope` Value | Behavior |
|----------------|----------|
| `"main"` | All DMs share one session |
| `"per-peer"` | Separate session per sender |
| `"per-channel-peer"` | Separate per channel + sender (recommended) |
| `"per-account-channel-peer"` | Full isolation for multi-account setups |

---

### `dm`

DM (direct message) access control. Controls who can message the agent.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `accessPolicy` | string | `"pairing"` | Access policy (see table) |
| `pairing.maxPending` | int | `3` | Max pending pairing codes |
| `pairing.expireMinutes` | int | `60` | Pairing code expiration |

| `accessPolicy` Value | Behavior |
|---------------------|----------|
| `"pairing"` | Require 1-hour expiring pairing codes (default) |
| `"allowlist"` | Only pre-approved contacts can message |
| `"open"` | Anyone can message (requires explicit `"*"` opt-in) |
| `"disabled"` | Ignore all inbound DMs |

---

### `heartbeat`

Heartbeat configuration. See [Heartbeat Guide](/guides/heartbeat) for recipes and cost optimization.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | bool | `true` | Enable heartbeat loop |
| `interval` | int | `1800` | Seconds between heartbeats (default: 30 min) |
| `model` | string | — | Override model for heartbeat (cost optimization) |
| `isolatedSession` | bool | `false` | Run heartbeat in minimal context (2-5K tokens) |
| `lightContext` | bool | `false` | Skip memory/history loading |
| `ackMaxChars` | int | `300` | Suppress responses shorter than this |
| `showOk` | bool | `false` | Show routine "all clear" messages |
| `showAlerts` | bool | `true` | Show alert/warning messages |
| `useIndicator` | bool | `true` | Show status indicator in clients |
| `quiet_hours.start` | string | — | Quiet hours start (`HH:MM`) |
| `quiet_hours.end` | string | — | Quiet hours end (`HH:MM`) |
| `quiet_hours.timezone` | string | `"UTC"` | Timezone for quiet hours |
| `dreaming.enabled` | bool | `false` | Enable dreaming mode during idle heartbeats |
| `dreaming.idle_threshold` | int | `3` | Consecutive OK cycles before dreaming activates |

---

### `memory`

Persistent memory configuration.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | bool | `true` | Enable persistent memory |
| `path` | string | `"~/.openclaw/memory"` | Memory storage directory |
| `max_context_tokens` | int | `2000` | Max tokens loaded per conversation |
| `auto_save` | bool | `true` | Auto-save after each conversation |

---

### `skills`

Skill installation and management.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `path` | string | `"~/.openclaw/skills"` | Skills storage directory |
| `allow_install` | bool | `true` | Allow installing new skills |
| `allow_clawhub` | bool | `true` | Allow installing from ClawHub marketplace |
| `auto_install_deps` | bool | `false` | Auto-install skill dependencies |

---

### `permissions`

Execution approval configuration. See [Basic Usage](/guides/basic-usage#execution-approval).

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `mode` | string | `"ask"` | `"ask"`, `"auto"`, or `"deny"` |
| `auto_approve` | array | `[]` | Commands that skip the approval prompt |
| `always_deny` | array | `[]` | Commands that are always blocked |

---

### `mcp`

Model Context Protocol server configuration. See [MCP Servers Guide](/guides/mcp-servers).

#### `mcp.servers.<name>`

| Key | Type | Description |
|-----|------|-------------|
| `command` | string | Executable to run |
| `args` | array | Command arguments |
| `env` | object | Environment variables (supports `${VAR}` expansion) |

---

### `channels`

Channel configuration varies by platform. Each channel is configured under `channels.<name>`. Multi-account setups use `channels.<name>.accounts.<accountId>`.

| Key | Type | Description |
|-----|------|-------------|
| `enabled` | bool | Enable/disable the channel |
| `allowedContacts` | array | Restrict to specific contacts/IDs |
| `accounts` | object | Multi-account configuration |

See [Channels Guide](/guides/channels) for per-channel setup instructions.

---

### `logging`

Log configuration.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `level` | string | `"info"` | Log level: `debug`, `info`, `warn`, `error` |
| `path` | string | `"~/.openclaw/logs"` | Log directory |
| `max_size` | string | `"10m"` | Max size per log file |
| `max_files` | int | `5` | Max rotated log files to keep |
| `redactSensitive` | string | — | Redact sensitive data: `"tools"`, `"all"` |
| `audit.enabled` | bool | `false` | Enable audit logging |

---

## Environment Variable Substitution

Any config value can reference environment variables with `${VAR_NAME}`:

```json5
{
  "brain": {
    "api_key": "${ANTHROPIC_API_KEY}"
  },
  "mcp": {
    "servers": {
      "github": {
        "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
      }
    }
  }
}
```

---

## Backup and Recovery

Always back up your config before updating OpenClaw:

```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.backup
cp -r ~/.openclaw/credentials ~/.openclaw/credentials.backup
```

:::warning
The v2026.5.7 auto-update contained a bug that wiped user configuration. The built-in `.bak` backup captured the already-corrupted state. Always maintain external backups. Fixed in v2026.5.8.
:::

---

## See Also

- [Environment Variables](/reference/environment-variables) — All supported env vars
- [CLI Reference](/reference/cli) — `openclaw configure` command
- [Security Hardening](/security/hardening) — Security-focused config
- [Local Models](/guides/local-models) — Provider configuration for local models
- [Model Selection](/guides/model-selection) — Per-task model routing
- [Multi-Agent](/guides/multi-agent) — Agent and binding configuration
- [Heartbeat Guide](/guides/heartbeat) — Heartbeat settings and cost optimization
