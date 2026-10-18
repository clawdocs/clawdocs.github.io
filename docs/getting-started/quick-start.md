---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Quick Start
description: Get OpenClaw running and talking to you in about 5 minutes, from install to first conversation
keywords: [openclaw, openclaw getting started, openclaw tutorial, openclaw quick start, openclaw first steps, how to use openclaw, openclaw beginner guide]
---

# Quick Start

Get from zero to a working OpenClaw agent in about 5 minutes. The official version of this walkthrough is [Getting started](https://docs.openclaw.ai/start/getting-started).

**What you'll have at the end:** a Gateway running as a background service, the Control UI open in your browser, and an agent that can answer questions, read and write files, and run shell commands. Optionally, a chat app on your phone connected to it.

**Prerequisites:**
- Node.js 24.16+ or 26.1+ (26 recommended; 22, 23 and 25 are unsupported). Check with `node --version`. The installer script installs Node for you if needed.
- One of: an existing Claude Code or Codex CLI login, an API key from [Anthropic](https://console.anthropic.com), [OpenAI](https://platform.openai.com), [OpenRouter](https://openrouter.ai), [Google AI](https://aistudio.google.com) or another supported provider, or a local model via [Ollama](https://ollama.com).

:::tip No API key?
Free tiers (OpenRouter, Google Gemini) or a local model via Ollama work. See [Local Models](/guides/local-models) for the zero-cost path.
:::

---

## Step 1: Install

macOS, Linux and WSL2:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Windows: run `iwr -useb https://openclaw.ai/install.ps1 | iex` in PowerShell, or install the [Windows Hub](https://docs.openclaw.ai/platforms/windows) app.

Already manage Node yourself? With npm 12 or 11.16+:

```bash
npm install -g openclaw@latest --allow-scripts=openclaw
```

:::info Other methods
Docker, desktop apps, pnpm, Raspberry Pi and source builds are in the [Installation Guide](/getting-started/installation).
:::

## Step 2: Onboard

The installer script starts onboarding automatically. If you installed with npm, run:

```bash
openclaw onboard --install-daemon
```

What onboarding does:

1. **Finds AI access.** On **Quick start** it looks for a Claude Code or Codex login or a provider API key, checks it with a real completion, and saves it. If nothing usable is found it opens provider setup. **Custom setup** walks through every option; `openclaw onboard --classic` is the older step-by-step wizard.
2. **Creates your workspace** at `~/.openclaw/workspace` and the config at `~/.openclaw/openclaw.json`, with a generated Gateway token.
3. **Installs the Gateway service** (because of `--install-daemon`): LaunchAgent on macOS, systemd user service on Linux and WSL2, Scheduled Task on Windows.

Model credentials are stored in the per-agent database (`~/.openclaw/agents/main/agent/openclaw-agent.sqlite`) or the secret store, not in `openclaw.json`. For a fresh Anthropic setup, the default model is `anthropic/claude-opus-5-5`.

:::note
If you skipped `--install-daemon`, Quick start may leave the Gateway running in the foreground of that terminal. Press Ctrl+C and run `openclaw gateway install` to move it to the background.
:::

## Step 3: Check the Gateway

```bash
openclaw gateway status
```

You should see the service running and the RPC probe succeed on port 18789.

:::caution Port conflict?
If port 18789 is taken, find the process with `lsof -i :18789`, or move OpenClaw to another port:

```json5 title="~/.openclaw/openclaw.json"
{ gateway: { port: 18790 } }
```

Then run `openclaw gateway restart`.
:::

## Step 4: Chat

Open the Control UI:

```bash
openclaw dashboard
```

This opens `http://127.0.0.1:18789/` with your token. Type a message in the chat. If you get a reply, everything works.

From the terminal, you have two more options:

```bash
# Interactive terminal UI connected to the Gateway
openclaw tui

# One-shot turn through the Gateway; the reply is printed
openclaw agent --agent main --message "What files are in my home directory?"
```

`openclaw chat` is a shortcut for `openclaw tui --local`: it runs the agent in-process instead of through the Gateway. To start it with a first message use `openclaw chat --message "..."`. A bare positional argument (`openclaw chat "hi"`) is read as a session target, not a message.

## Step 5: Try some real tasks

Send these from the Control UI, the TUI, or with `openclaw agent --agent main --message "..."`:

- "Summarize the contents of ~/README.md"
- "Create a Python script that alerts me when CPU usage goes above 80%"
- "What are the top Hacker News stories right now?"
- "Show me what changed in my git repo since yesterday"
- "Check disk usage and tell me if any filesystem is above 80%"

### Execution approval

:::danger Commands run without asking by default
By default OpenClaw runs host shell commands **without asking** (`tools.exec.mode` is `full`) and the sandbox is **off** (`agents.defaults.sandbox.mode: "off"`). Before you connect channels, turn approvals on:

```bash
openclaw config set tools.exec.mode ask
```

The Gateway applies tool changes without a restart. `auto` adds an automatic reviewer that can approve or deny low-risk commands. See the official [exec tool](https://docs.openclaw.ai/tools/exec), [permission modes](https://docs.openclaw.ai/tools/permission-modes) and [sandboxing](https://docs.openclaw.ai/gateway/sandboxing) docs, and [Security Hardening](/security/hardening).
:::

In `ask` mode, commands that are not on the allowlist wait for you to approve or deny them in the Control UI (or the app or chat where you are talking to the agent). Check the effective policy with `openclaw approvals get`.

---

## Step 6: Personalize your agent (optional)

The agent's persona lives in `SOUL.md` in the workspace:

```bash
vim ~/.openclaw/workspace/SOUL.md
```

```markdown title="~/.openclaw/workspace/SOUL.md"
# Agent Identity

You are Jarvis, a helpful and efficient personal assistant.

## Rules
- Be concise; prefer short answers unless asked for detail
- Always confirm before making destructive changes (deleting files, etc.)
- Summarize long content instead of dumping raw output
```

Workspace files (`SOUL.md`, `AGENTS.md`, `USER.md`, `IDENTITY.md`) are loaded at the start of each session, so start a new one (`/new` in chat) to see the change. You can also edit them in the Control UI under **Settings → Agents → Files**. See the [SOUL.md Guide](/guides/soul-md).

## Step 7: Connect a messaging channel (optional)

```bash
# Telegram (paste a BotFather token): the quickest to set up
openclaw channels add telegram

# WhatsApp (scan a QR code)
openclaw channels add whatsapp

# Discord (bot token)
openclaw channels add discord
```

Each command opens guided setup for that channel. By default, unknown senders who DM your bot get a pairing code instead of the agent. Approve them with:

```bash
openclaw pairing list
openclaw pairing approve telegram <code>
```

See the [Channels Guide](/guides/channels) and the official [pairing docs](https://docs.openclaw.ai/channels/pairing).

## Step 8: Heartbeat and scheduled tasks (optional)

The **heartbeat** is already on: a periodic turn in the main session, every 30 minutes by default (1 hour when Anthropic is authenticated with OAuth or a Claude CLI token). It lets the agent surface anything that needs attention. Its cost depends on your model. For a beginner, a cheaper model, a longer interval and waking hours only are sensible:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      heartbeat: {
        every: "1h",
        model: "anthropic/claude-haiku-5-5",
        activeHours: { start: "08:00", end: "22:00" },
        isolatedSession: true,
        lightContext: true,
      },
    },
  },
}
```

`every: "0m"` turns the recurring heartbeat off.

**Scheduled tasks** ("every morning at 9") are automations, not heartbeat instructions:

```bash
openclaw cron add --name "Morning brief" --cron "0 9 * * *" --session isolated \
  --message "Give me a weather briefing and summarize my calendar." --announce
```

`openclaw automations` is the same command under its new name. To give the heartbeat a short standing checklist, store it in its monitor scratch: find the job with `openclaw cron list --all` (it is listed as `Heartbeat (main)`), then `openclaw cron scratch <jobId> --set "..."`.

:::note Coming from an older version?
`HEARTBEAT.md` is retired and no longer read. `openclaw doctor --fix` imports an existing file into the heartbeat's monitor scratch and converts its `tasks:` entries into automations.
:::

See the [Heartbeat Guide](/guides/heartbeat), [Automation](/guides/automation) and the official [heartbeat docs](https://docs.openclaw.ai/gateway/heartbeat).

---

## Verify your setup

```bash
# 1. CLI version
openclaw --version

# 2. Config and environment checks
openclaw doctor

# 3. Gateway service and RPC probe
openclaw gateway status

# 4. Channels, models and recent sessions
openclaw status

# 5. A test turn
openclaw agent --agent main --message "Hello! Tell me what you can do."

# 6. Connected channels (if any)
openclaw channels list

# 7. Last heartbeat run
openclaw system heartbeat last
```

If a step fails, `openclaw triage` collects sanitized diagnostics and can hand them to a coding agent. See also the [Troubleshooting Guide](/reference/troubleshooting) and the [FAQ](/reference/faq).

---

## Common gotchas

| Problem | Cause | Fix |
|---|---|---|
| `port 18789 already in use` | Another Gateway or service on the port | `lsof -i :18789`, then stop it or change `gateway.port` |
| Gateway refuses to start after a config edit | Unknown or invalid key (config is validated strictly) | `openclaw config validate`, then `openclaw doctor --fix` |
| Invalid API key | Wrong key or wrong provider | `openclaw models status` shows which provider auth is failing |
| Node.js version error | Node outside 24.16+ / 26.1+ | Install Node 24 or 26, e.g. `curl -fsSL https://deb.nodesource.com/setup_24.x \| sudo bash -` on Debian/Ubuntu |
| Dashboard asks for a token | Browser opened without it | Run `openclaw dashboard` again, or `openclaw dashboard --no-open` to print the tokenized URL |
| `EACCES` on `npm install -g` | npm's global prefix is not writable | Set a user-owned prefix (`npm config set prefix ~/.npm-global`); do not use `sudo npm` |
| Heartbeat running up costs | Default cadence with your primary model | Set `agents.defaults.heartbeat.model` to a cheap model and raise `agents.defaults.heartbeat.every` |
| WhatsApp QR expired | QR has a short timeout | Run `openclaw channels add whatsapp` again and scan promptly |
| Agent won't run commands | Approvals or an allowlist are on (`ask`, `auto`, `allowlist` or `deny`) | Approve when prompted; check the policy with `openclaw approvals get` |

---

## What's next?

### Do these first

| Goal | Guide |
|---|---|
| Learn everyday commands | [Basic Usage](/guides/basic-usage) |
| Lock down security | [Security Hardening](/security/hardening) |
| Understand the moving parts | [Core Concepts](/getting-started/core-concepts) |

### First week

| Goal | Guide |
|---|---|
| Structured learning path | [First 7 Days](/guides/first-7-days) |
| Customize your agent's personality | [SOUL.md Guide](/guides/soul-md) |
| Connect messaging channels | [Channels Guide](/guides/channels) |
| Set up scheduled tasks | [Automation](/guides/automation) |

### Going deeper

| Goal | Guide |
|---|---|
| Choose the right model for each task | [Model Selection](/guides/model-selection) |
| Run without API costs | [Local Models](/guides/local-models) |
| Find community skills | [ClawHub](/guides/clawhub) |
| Build your own skills | [Skill Development](/guides/skill-development) |
| Run multi-agent workflows | [Multi-Agent](/guides/multi-agent) |
| Keep costs down | [Cost Management](/guides/cost-management) |
| Build integrations | [API & Webhooks](/guides/api-webhooks) |

:::tip
Ask questions in the official [OpenClaw Discord](https://discord.gg/clawd), or on [r/OpenClaw](https://reddit.com/r/OpenClaw).
:::
