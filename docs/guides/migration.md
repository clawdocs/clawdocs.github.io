---
sidebar_position: 14
title: Migration Guide
description: Upgrading from Clawdbot or Moltbot to OpenClaw, version upgrade paths, and configuration migration
keywords: [openclaw, migration, upgrade, migrate version, breaking changes]
---

# Migration Guide

OpenClaw has undergone a rapid triple rebrand and several critical security patches. This guide covers upgrading from any previous version to the latest release.

---

## The Triple Rebrand

| Name | Period | Reason |
|------|--------|--------|
| **Clawdbot** | Nov 2025 – Jan 27, 2026 | Original name |
| **Moltbot** | Jan 27 – Jan 30, 2026 | Anthropic trademark complaint ("Clawd" too close to "Claude") |
| **OpenClaw** | Jan 30, 2026 – present | "Moltbot never quite rolled off the tongue" |

This was the fastest triple rebrand in open-source history — all three names within a single week.

### What Changed in Each Rename

**Clawdbot → Moltbot (Jan 27):**

| Component | Old | New |
|-----------|-----|-----|
| CLI command | `clawdbot` | `moltbot` |
| Config directory | `~/.clawdbot/` | `~/.moltbot/` |
| npm package | `clawdbot` | `moltbot` |
| GitHub repo | Redirected automatically |

**Moltbot → OpenClaw (Jan 30):**

| Component | Old | New |
|-----------|-----|-----|
| CLI command | `moltbot` | `openclaw` (old names kept as aliases) |
| Config directory | `~/.moltbot/` | `~/.openclaw/` |
| Config file | `moltbot.json` | `openclaw.json` |
| Workspace | `~/clawd` | `~/.openclaw/workspace` |
| npm package | `moltbot` | `openclaw` |
| npm scope | — | Extensions moved to `@openclaw/*` |
| Docker image | `clawdbot/clawdbot` | `openclaw/openclaw` |

:::danger Supply Chain Attack Risk
The rapid renames created a dangerous supply-chain attack surface. Attackers hijacked abandoned repository names, published malicious packages with near-identical old names (typosquatting), and distributed a fake VS Code extension. **Only install from the official `openclaw` npm package.**
:::

---

## Upgrade Steps

### From Clawdbot or Moltbot to OpenClaw

```bash
# 1. Uninstall old package
npm uninstall -g clawdbot    # or: npm uninstall -g moltbot

# 2. Install OpenClaw
npm install -g openclaw

# 3. Re-run onboarding for new config format
openclaw onboard
```

**After upgrading:**

1. **Rotate ALL gateway tokens immediately** — old tokens may have been exposed
2. **Configure authentication** — `auth: none` has been permanently removed as of v2026.1.29
3. **Stop old services** if running as a daemon (see [Systemd Migration](#systemd-migration))
4. **Verify your installation**: `openclaw gateway status`

### Systemd Migration {#systemd-migration}

If you were running Clawdbot as a systemd service, the old service must be manually stopped:

```bash
# Stop and disable old service
sudo systemctl stop clawdbot-gateway
sudo systemctl disable clawdbot-gateway
sudo rm /etc/systemd/system/clawdbot-gateway.service
sudo systemctl daemon-reload

# Verify only openclaw is running
openclaw gateway status
```

:::warning Known Issue: Dual Services (#5103)
A common migration problem ([Issue #5103](https://github.com/openclaw/openclaw/issues/5103)): both `clawdbot-gateway.service` and `openclaw-gateway.service` run simultaneously. The old gateway holds port 18789 while the new service enters a restart loop (53+ restarts observed). **Always stop the old service first.**
:::

### npm Stuck on Old Version

If `npm update` doesn't upgrade you past the old version, you're still on the frozen `clawdbot` or `moltbot` package:

```bash
# These packages are frozen — they will NEVER receive updates
npm uninstall -g clawdbot   # or moltbot

# Install the active package
npm install -g openclaw
```

---

## Critical Version Upgrades

### v2026.1.29 — CVE-2026-25253 Patch (January 30)

**You MUST upgrade to at least this version.** It patches a CVSS 8.8 one-click RCE vulnerability.

**Breaking changes:**
- `auth: none` permanently removed — all gateways now require `token`, `password`, or Tailscale Serve authentication
- Channel auth prefers config over environment variables for Discord/Telegram/Matrix (env vars become fallback only)

**What was fixed:**
- CVE-2026-25253: Cross-site WebSocket hijacking that allowed remote code execution via a crafted URL, even on localhost-bound instances
- The Control UI no longer accepts a `gatewayUrl` query parameter

### v2026.1.30 — CLI Improvements (January 31)

- Shell completion: `openclaw completion` (Zsh/Bash/PowerShell/Fish)
- Per-agent model status: `openclaw models status --agent <id>`
- New LLM providers: Kimi K2.5, MiniMax OAuth

### v2026.2.2–2.5 — Feature Updates (February 2-5)

- Major memory architecture overhaul
- Canvas feature for visual presentations
- Skill marketplace
- Workflow recording and replay
- Voice message transcription
- `unbrowse` browser automation with visual element detection
- WhatsApp stability fixes

### v2026.2.6 — VirusTotal Integration (February 6)

- All ClawHub skill uploads now scanned by VirusTotal Code Insight
- New model support: Claude Opus 4.6, GPT-5.3-Codex, xAI Grok
- Agent management RPC methods for web UI

This was a direct response to the [ClawHavoc campaign](/security/known-vulnerabilities#the-clawhavoc-campaign) and [ToxicSkills study](/security/known-vulnerabilities).

---

## Configuration Migration

### Automatic Migration

When you install the `openclaw` package, it automatically:
- Detects existing `~/.clawdbot/` or `~/.moltbot/` directories
- Copies config and data to `~/.openclaw/`
- Creates symlinks from old paths to new paths
- Preserves legacy config resolution

### Config Path Reference

| Era | Config Directory | Config File | Workspace |
|-----|-----------------|-------------|-----------|
| Clawdbot | `~/.clawdbot/` | `clawdbot.json` | `~/clawd` |
| Moltbot | `~/.moltbot/` | `moltbot.json` | `~/clawd` |
| OpenClaw | `~/.openclaw/` | `openclaw.json` | `~/.openclaw/workspace` |

### Environment Variables

| Old (Clawdbot) | New (OpenClaw) | Notes |
|----------------|----------------|-------|
| `CLAWDBOT_GATEWAY_TOKEN` | `OPENCLAW_GATEWAY_TOKEN` | Must rotate after upgrade |
| `CLAWDBOT_PORT` | `OPENCLAW_PORT` | Default: 18789 |
| `CLAWDBOT_HOME` | `OPENCLAW_HOME` | Config directory override |
| `TELEGRAM_BOT_TOKEN` | `TELEGRAM_BOT_TOKEN` | Unchanged |
| `DISCORD_BOT_TOKEN` | `DISCORD_BOT_TOKEN` | Unchanged |
| `SLACK_BOT_TOKEN` | `SLACK_BOT_TOKEN` | Unchanged |

Channel tokens (Telegram, Discord, Slack, etc.) are unchanged — only `CLAWDBOT_*` prefixed variables changed to `OPENCLAW_*`.

### Docker Images

| Era | Image | Status |
|-----|-------|--------|
| Clawdbot | `clawdbot/clawdbot` | **Frozen** — never updated |
| OpenClaw | `openclaw/openclaw` | Official, actively maintained |
| Community | `alpine/openclaw` | Alpine-based minimal image |
| Coolify | `coollabsio/openclaw` | Daily CalVer builds, arm64 |

### npm Packages

| Package | Status |
|---------|--------|
| `clawdbot` | **Frozen** — will never receive updates |
| `moltbot` | **Frozen** — will never receive updates |
| `openclaw` | **Active** — all new releases |
| `@openclaw/*` | Extension scope (channels, plugins) |

---

## Data Preservation

OpenClaw stores all persistent data as plain Markdown files. The upgrade process only touches application code, not data:

**Automatically preserved:**
- `SOUL.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`, `AGENTS.md`
- `MEMORY.md` and `memory/*.md` files
- Installed skills in `~/.openclaw/skills/`
- Channel credentials and API keys

**Potential issues:**
- If the agent "forgets" after restart, confirm the gateway is using the same workspace on every launch
- Remote mode uses the gateway host's workspace, not your local laptop's

---

## Community Migration Tools

### clawd_migrate

[clawd_migrate](https://github.com/calabiyauman/clawd_migrate) is a community-built migration tool:

```bash
npx clawd_migrate --root /path/to/workspace --setup-openclaw
```

- Migrates from Clawdbot or Moltbot to OpenClaw
- Preserves all memory/identity files
- Creates timestamped backups under `backups/`
- `--setup-openclaw` flag runs `npm i -g openclaw && openclaw onboard`
- Works on Windows, macOS, Linux

### OpenClaw Ansible

[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) provides automated, hardened installation with Docker isolation, Tailscale VPN integration, and firewall configuration. Supports both fresh installs and migrations.

---

## CI/CD Pipeline Updates

When migrating CI/CD pipelines:

| Component | Old | New |
|-----------|-----|-----|
| npm install | `npm i -g clawdbot` | `npm i -g openclaw` |
| Docker FROM | `clawdbot/clawdbot` | `openclaw/openclaw` |
| Environment | `CLAWDBOT_GATEWAY_TOKEN` | `OPENCLAW_GATEWAY_TOKEN` |
| Systemd | `clawdbot-gateway.service` | `openclaw-gateway.service` |
| Update channel | — | `openclaw update --channel stable` |

---

## Rollback

To downgrade to a specific version:

```bash
npm install -g openclaw@2026.1.30
```

:::warning
Downgrading exposes you to security vulnerabilities fixed in newer versions. Never downgrade below v2026.1.29 (critical RCE patch).
:::

---

## See Also

- [Installation](/getting-started/installation) — Fresh install guide
- [Known Vulnerabilities](/security/known-vulnerabilities) — CVEs and incident timeline
- [Security Hardening](/security/hardening) — Post-upgrade hardening steps
- [Configuration Reference](/reference/configuration) — Full config file documentation
