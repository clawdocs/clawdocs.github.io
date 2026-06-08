---
sidebar_position: 1
title: CLI Reference
description: Complete reference for all OpenClaw CLI commands and flags
---

# CLI Reference

Complete reference for the `openclaw` command-line interface.

## Global Flags

| Flag | Description |
|------|-------------|
| `--version` | Print version |
| `--help` | Show help |
| `--config <path>` | Use custom config file |
| `--verbose` | Enable verbose output |
| `--quiet` | Suppress non-essential output |
| `--json` | Output in JSON format |

## Commands

### `openclaw onboard`

Interactive setup wizard.

```bash
openclaw onboard [--install-daemon] [--skip-channels]
```

| Flag | Description |
|------|-------------|
| `--install-daemon` | Install gateway as a system service |
| `--skip-channels` | Skip messaging channel setup |
| `--provider <name>` | Pre-select LLM provider |

### `openclaw dashboard`

Launch the Control UI in your browser for system monitoring and management.

```bash
openclaw dashboard [--no-open]
```

| Flag | Description |
|------|-------------|
| `--no-open` | Print the tokenized URL without opening a browser |

The Control UI runs on `localhost:18789` and requires your gateway auth token. For remote access, use SSH port forwarding:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@your-server-ip
```

### `openclaw gateway`

Manage the gateway process.

```bash
openclaw gateway [start|stop|restart|status] [flags]
```

| Flag | Description |
|------|-------------|
| `--daemon` | Run as background daemon |
| `--port <number>` | Override gateway port (default: 18789) |
| `--host <addr>` | Override bind address (default: 127.0.0.1) |

### `openclaw chat`

Send messages to the agent.

```bash
openclaw chat [message] [flags]
```

| Flag | Description |
|------|-------------|
| `--format <type>` | Output format: `markdown`, `plain`, `json` |
| `--model <name>` | Override model for this message |
| `--no-memory` | Don't load or save memory |
| `--context <file>` | Load additional context from file |

Without a message argument, starts an interactive chat session.

### `openclaw channel`

Manage messaging channels.

```bash
openclaw channel <add|remove|list|status|reconnect> [channel-name]
```

### `openclaw skill`

Manage installed skills.

```bash
openclaw skill <install|remove|list|test|config> [skill-name|path]
```

| Subcommand | Description |
|------------|-------------|
| `install <path>` | Install a skill from file |
| `remove <name>` | Remove an installed skill |
| `list` | List all installed skills |
| `test <path> <msg>` | Test a skill without installing |
| `config <name>` | View/set skill configuration |

### `openclaw plugins`

Manage installed plugins.

```bash
openclaw plugins <list|inspect|install|uninstall|update|enable|disable|doctor|marketplace> [args]
```

| Subcommand | Description |
|------------|-------------|
| `list` | Show installed plugins |
| `inspect <name>` | View plugin details |
| `install <name>` | Install a plugin |
| `uninstall <name>` | Remove a plugin |
| `update [name]` | Upgrade plugins (all or specific) |
| `enable <name>` | Enable a disabled plugin |
| `disable <name>` | Disable a plugin |
| `doctor` | Diagnose plugin issues |
| `marketplace list` | Browse available plugins |

### `openclaw clawhub`

Interact with the ClawHub marketplace.

```bash
openclaw clawhub <search|install|publish|browse|info|view|login|outdated|update|report|security-report|validate> [args]
```

### `openclaw heartbeat`

Manage the heartbeat system.

```bash
openclaw heartbeat [--now] [--dry-run]
```

| Flag | Description |
|------|-------------|
| `--now` | Trigger an immediate heartbeat |
| `--dry-run` | Show what would happen without executing |

### `openclaw logs`

View gateway logs.

```bash
openclaw logs [--filter <component>] [--follow] [--lines <n>]
```

| Flag | Description |
|------|-------------|
| `--filter` | Filter by component: `heartbeat`, `channel`, `brain`, `hands` |
| `--follow` | Stream logs in real-time |
| `--lines <n>` | Show last N lines (default: 50) |

### `openclaw status`

Show gateway and system status.

```bash
openclaw status [--json]
```

### `openclaw stats`

Show usage statistics.

```bash
openclaw stats [heartbeat|tokens|channels] [--period <days>]
```

### `openclaw security`

Security tools.

```bash
openclaw security <check|scan> [--all]
```

| Subcommand | Description |
|------------|-------------|
| `check` | Audit current security configuration |
| `scan <path>` | Scan a skill file for security issues |
| `scan --all` | Scan all installed skills |

### `openclaw config`

View and modify configuration.

```bash
openclaw config <get|set|list> [key] [value]
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Configuration error |
| `3` | Gateway not running |
| `4` | Authentication failure |
| `5` | Network error |

## See Also

- [Configuration Reference](/reference/configuration) — Config file format
- [Environment Variables](/reference/environment-variables) — Env var overrides
