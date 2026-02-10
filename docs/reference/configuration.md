---
sidebar_position: 2
title: Configuration
description: Complete reference for ~/.openclaw/config.yml — every setting explained
---

# Configuration Reference

OpenClaw is configured via `~/.openclaw/config.yml`. This page documents every available setting.

## Full Example

```yaml title="~/.openclaw/config.yml"
# LLM Configuration
brain:
  provider: "anthropic"           # anthropic, openai, xai, local
  model: "claude-opus-4-6"
  api_key: "${ANTHROPIC_API_KEY}"
  temperature: 0.7
  max_tokens: 4096
  fallback:
    provider: "openai"
    model: "gpt-4o"
  heartbeat_override:
    provider: "anthropic"
    model: "claude-haiku-4-5-20251001"

# Gateway Configuration
gateway:
  host: "127.0.0.1"
  port: 18789
  max_connections: 10
  log_level: "info"
  pid_file: "~/.openclaw/gateway.pid"

# Execution Environment
hands:
  shell:
    enabled: true
    timeout: 30000
    blocked_commands: []
  browser:
    enabled: true
    headless: true
    timeout: 60000
    allowed_domains: []
  filesystem:
    writable_paths: []
    blocked_paths:
      - "~/.ssh"
      - "~/.gnupg"
  sandbox:
    enabled: false
    type: "docker"

# Heartbeat
heartbeat:
  enabled: true
  interval: 1800
  quiet_hours:
    start: "23:00"
    end: "07:00"
    timezone: "America/Los_Angeles"

# Memory
memory:
  enabled: true
  path: "~/.openclaw/memory"
  max_context_tokens: 2000
  auto_save: true

# Skills
skills:
  path: "~/.openclaw/skills"
  allow_install: true
  allow_clawhub: true
  auto_install_deps: false

# Channels (configured individually)
channels: {}

# Logging
logging:
  level: "info"
  path: "~/.openclaw/logs"
  max_size: "10m"
  max_files: 5
  audit:
    enabled: false
```

## Section Reference

### `brain`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `provider` | string | `"anthropic"` | LLM provider |
| `model` | string | `"claude-opus-4-6"` | Model identifier |
| `api_key` | string | — | API key (supports `${ENV_VAR}` syntax) |
| `temperature` | float | `0.7` | Response randomness (0.0–1.0) |
| `max_tokens` | int | `4096` | Max response tokens |
| `fallback` | object | — | Fallback provider config |
| `heartbeat_override` | object | — | Override model for heartbeat only |

### `gateway`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `host` | string | `"127.0.0.1"` | Bind address |
| `port` | int | `18789` | WebSocket port |
| `max_connections` | int | `10` | Max concurrent connections |
| `log_level` | string | `"info"` | Log verbosity |

### `hands`

See sub-sections: `shell`, `browser`, `filesystem`, `sandbox`.

### `heartbeat`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | bool | `true` | Enable heartbeat |
| `interval` | int | `1800` | Seconds between heartbeats |
| `quiet_hours.start` | string | — | Quiet hours start (HH:MM) |
| `quiet_hours.end` | string | — | Quiet hours end (HH:MM) |
| `quiet_hours.timezone` | string | `"UTC"` | Timezone for quiet hours |

### `memory`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | bool | `true` | Enable persistent memory |
| `path` | string | `"~/.openclaw/memory"` | Memory directory |
| `max_context_tokens` | int | `2000` | Max tokens loaded per conversation |
| `auto_save` | bool | `true` | Save after each conversation |

## Environment Variable Substitution

Any config value can reference environment variables:

```yaml
brain:
  api_key: "${ANTHROPIC_API_KEY}"
```

## See Also

- [Environment Variables](/reference/environment-variables) — All supported env vars
- [CLI Reference](/reference/cli) — `openclaw config` commands
- [Security Hardening](/security/hardening) — Security-focused config
