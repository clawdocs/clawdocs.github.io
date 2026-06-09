---
sidebar_position: 3
title: Quick Start
description: Get OpenClaw running and talking to you in under 5 minutes — from install to first conversation
keywords: [openclaw, openclaw getting started, openclaw tutorial, openclaw quick start, openclaw first steps, how to use openclaw, openclaw beginner guide]
---

# Quick Start

Get from zero to a working OpenClaw agent in under 5 minutes.

**What you'll have at the end:** A running OpenClaw gateway with CLI chat, able to execute shell commands, read/write files, and answer questions using your chosen LLM. Optionally connected to a messaging app so you can talk to it from your phone.

**Prerequisites:**
- Node.js 24 (recommended) or Node.js 22.19+ — check with `node --version`
- An API key from [Anthropic](https://console.anthropic.com), [OpenAI](https://platform.openai.com), [OpenRouter](https://openrouter.ai), [Google AI](https://aistudio.google.com), or [DeepSeek](https://platform.deepseek.com) — *or* a local model running via [Ollama](https://ollama.ai)

:::tip No API key?
You can use OpenClaw with **free options**: [OpenRouter's free tier](https://openrouter.ai) (rate-limited), [Google Gemini free tier](https://aistudio.google.com), or a local model via Ollama (requires 8+ GB VRAM). See [Local Models](/guides/local-models) for the zero-cost path.
:::

---

## Step 1: Install

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Or via npm:

```bash
npm i -g openclaw
```

:::info Other methods
Docker, git clone, and platform-specific options are in the [Installation Guide](/getting-started/installation).
:::

## Step 2: Onboard

```bash
openclaw onboard
```

The onboarding wizard walks you through three steps:

1. **Choose your LLM provider** — Select from Anthropic (recommended), OpenAI, Google, DeepSeek, xAI, OpenRouter, or local model
2. **Enter your API key** — Paste your key when prompted (stored locally in `~/.openclaw/credentials/`)
3. **Connect channels (optional)** — Skip this for now; you can add WhatsApp, Telegram, Discord, Slack later

```
🦞 Welcome to OpenClaw!

? Choose your LLM provider:
  ❯ Anthropic (Claude) — recommended
    OpenAI (GPT)
    Google (Gemini)
    DeepSeek
    OpenRouter (200+ models)
    Local model (Ollama/LM Studio)

? Enter your Anthropic API key: sk-ant-api03-****

? Connect a messaging channel now?
  ❯ Skip for now
    WhatsApp
    Telegram
    Discord
    Slack

✓ Configuration saved to ~/.openclaw/openclaw.json
✓ Run 'openclaw gateway' to start your agent
```

## Step 3: Start the Gateway

```bash
openclaw gateway
```

You should see:

```
🦞 OpenClaw Gateway v2026.6.1
   WebSocket control plane: ws://localhost:18789
   Heartbeat interval: 30m
   Model: claude-sonnet-4-6
   Status: RUNNING
```

The gateway is now running. Leave this terminal open — it's the agent's brain.

:::caution Port conflict?
If port 18789 is already in use, you'll see an error. Check what's using it with `lsof -i :18789` and either stop that process or change OpenClaw's port in `~/.openclaw/openclaw.json`:
```json5
{ "gateway": { "port": 18790 } }
```
:::

## Step 4: Chat

Open a **new terminal** and start chatting:

```bash
openclaw chat "What files are in my home directory?"
```

OpenClaw will use the LLM to understand your request, execute shell commands, and return the results.

### Interactive Mode

For back-and-forth conversation:

```bash
openclaw chat
> What files changed in git today?
> Summarize the largest one
> exit
```

Each message builds on the previous. Type `exit` or press Ctrl+C to leave.

## Step 5: Try Some Real Tasks

```bash
# Summarize a file
openclaw chat "Summarize the contents of ~/README.md"

# Write code
openclaw chat "Create a Python script that monitors CPU usage and alerts if it goes above 80%"

# Search the web
openclaw chat "What are the top Hacker News stories right now?"

# Work with git
openclaw chat "Show me what changed in my repo since yesterday"

# System admin
openclaw chat "Check disk usage and tell me if anything is above 80%"
```

### Execution Approval

When OpenClaw needs to run a shell command, it asks for your permission:

```
Agent wants to execute:
  $ df -h

  [approve] [deny] [approve all similar]
```

This is the default `ask` mode — you review each command before it runs. You can change this in config later. See [Basic Usage](/guides/basic-usage#execution-approval) for details.

---

## Step 6: Personalize Your Agent (Optional)

Give your agent a name and personality by editing `SOUL.md`:

```bash
vim ~/.openclaw/SOUL.md
```

```markdown title="~/.openclaw/SOUL.md"
# Agent Identity

You are Jarvis, a helpful and efficient personal assistant.

## Rules
- Be concise — prefer short answers unless asked for detail
- Always confirm before making destructive changes (deleting files, etc.)
- Summarize long content instead of dumping raw output
```

The gateway picks up SOUL.md changes automatically — no restart needed.

See [SOUL.md Guide](/guides/soul-md) for advanced personality configuration.

## Step 7: Connect a Messaging Channel (Optional)

To talk to OpenClaw from your phone:

```bash
# Connect WhatsApp (scan QR code)
openclaw channels add whatsapp

# Connect Telegram (enter BotFather token)
openclaw channels add telegram

# Connect Discord (enter bot token)
openclaw channels add discord
```

Each channel walks you through authentication. Once connected, message your agent from that platform just like texting a friend.

:::tip
Start with one channel. WhatsApp is the most popular choice — you scan a QR code and it's connected in seconds. Note: the QR code expires quickly, so scan it promptly.
:::

## Step 8: Enable the Heartbeat (Optional)

The heartbeat makes OpenClaw truly autonomous — it checks for tasks periodically without prompting:

```markdown title="~/.openclaw/HEARTBEAT.md"
## Every 30 minutes
- Check my Gmail for urgent emails and summarize them
- Monitor the GitHub repo myorg/myrepo for new issues

## Daily at 9am
- Give me a weather briefing for my city
- Summarize my calendar for today
```

Edit `~/.openclaw/HEARTBEAT.md` with your preferences, then restart the gateway:

```bash
openclaw gateway restart
```

:::caution Cost awareness
Each heartbeat tick costs tokens. With a 30-minute interval and Claude Opus, expect ~$5-20/day in API costs. **For beginners, start with a 60-minute interval and a cheap model:**

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "interval": 3600,
    "model": "claude-haiku-4-5-20251001"
  }
}
```

This cuts heartbeat costs by ~95%. See [Heartbeat Guide](/guides/heartbeat) for all cost optimization options and [Performance Tuning](/guides/performance-tuning) for broader strategies.
:::

---

## Verify Your Setup

Run through this checklist to confirm everything is working:

```bash
# 1. Check OpenClaw version
openclaw --version

# 2. Check gateway status
openclaw status

# 3. Send a test message
openclaw chat "Hello! Tell me what you can do."

# 4. Test file access
openclaw chat "List the files in my current directory"

# 5. Test shell execution
openclaw chat "What's my current disk usage?"

# 6. Check connected channels (if any)
openclaw channels list

# 7. Test heartbeat (if configured)
openclaw heartbeat --dry-run
```

If any step fails, check the [Troubleshooting Guide](/reference/troubleshooting) or the [FAQ](/reference/faq).

---

## Common Gotchas

| Problem | Cause | Fix |
|---------|-------|-----|
| `Error: port 18789 already in use` | Previous gateway or another service on the port | `lsof -i :18789` to find it, then kill the process or change the port |
| `Error: invalid API key` | Wrong key format or wrong provider | Double-check you're using the right key for your chosen provider (Anthropic keys start with `sk-ant-`) |
| `Node.js version error` | Node.js older than 22.19 | Install Node.js 24: `curl -fsSL https://deb.nodesource.com/setup_24.x \| sudo bash -` |
| Gateway starts but chat hangs | Firewall blocking outbound HTTPS | Ensure your network allows HTTPS to your LLM provider's API |
| `EACCES permission denied` | npm global install without permissions | Use `sudo npm i -g openclaw` or fix npm permissions |
| Heartbeat running up costs | Default interval is 30 min with your primary model | Set `heartbeat.model` to a cheap model and increase `heartbeat.interval` |
| WhatsApp QR expired | QR code has a short timeout | Run `openclaw channels add whatsapp` again and scan quickly |
| Agent won't run commands | Default `ask` permission mode | Approve the command when prompted, or switch to `auto` mode in config (use with caution) |

---

## What's Next?

You now have a working OpenClaw agent. Here's where to go from here, roughly in order:

### Immediate (do these first)

| Goal | Time | Guide |
|------|------|-------|
| Learn everyday commands | 10 min | [Basic Usage](/guides/basic-usage) |
| Lock down security | 15 min | [Security Hardening](/security/hardening) |
| Understand the architecture | 10 min | [Core Concepts](/getting-started/core-concepts) |

### First Week

| Goal | Time | Guide |
|------|------|-------|
| Structured learning path | 30-60 min/day | [First 7 Days](/guides/first-7-days) |
| Customize your agent's personality | 15 min | [SOUL.md Guide](/guides/soul-md) |
| Connect messaging channels | 10 min each | [Channels Guide](/guides/channels) |
| Set up autonomous tasks | 15 min | [Heartbeat Guide](/guides/heartbeat) |

### Going Deeper

| Goal | Guide |
|------|-------|
| Choose the right LLM for each task | [Model Selection](/guides/model-selection) |
| Run without API costs | [Local Models](/guides/local-models) |
| Browse 10,700+ community skills | [ClawHub](/guides/clawhub) |
| Build your own skills | [Skill Development](/guides/skill-development) |
| Run multi-agent workflows | [Multi-Agent](/guides/multi-agent) |
| Set up a web interface | [WebClaw](/guides/webclaw) |
| Reduce API costs by 97% | [Performance Tuning](/guides/performance-tuning) |
| Build integrations | [API & Webhooks](/guides/api-webhooks) |

:::tip
Join the [OpenClaw Discord](https://discord.gg/openclaw) (~176,000 members) to share setups, ask questions, and find community-built skills. Also check out [r/OpenClaw](https://reddit.com/r/OpenClaw) on Reddit.
:::
