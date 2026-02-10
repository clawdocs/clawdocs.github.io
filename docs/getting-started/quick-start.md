---
sidebar_position: 3
title: Quick Start
description: Get OpenClaw running and talking to you in under 5 minutes
---

# Quick Start

Get from zero to a working OpenClaw agent in under 5 minutes.

## Step 1: Install

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## Step 2: Onboard

```bash
openclaw onboard
```

When prompted:
1. Choose your LLM provider (Anthropic Claude recommended for best results)
2. Enter your API key
3. Skip messaging channels for now (you can add them later)

## Step 3: Start the Gateway

```bash
openclaw gateway
```

You should see:

```
🦞 OpenClaw Gateway v2026.2.6
   WebSocket control plane: ws://localhost:18789
   Heartbeat interval: 30m
   Model: claude-opus-4-6
   Status: RUNNING
```

## Step 4: Chat

Open a new terminal and start chatting:

```bash
openclaw chat "What files are in my home directory?"
```

OpenClaw will use the LLM to understand your request, execute shell commands, and return the results.

## Step 5: Try Some Real Tasks

```bash
# Summarize a file
openclaw chat "Summarize the contents of ~/README.md"

# Write code
openclaw chat "Create a Python script that monitors CPU usage and alerts if it goes above 80%"

# Search the web
openclaw chat "What are the top Hacker News stories right now?"
```

## Step 6: Connect a Messaging Channel (Optional)

To talk to OpenClaw from your phone:

```bash
# Connect WhatsApp
openclaw channel add whatsapp

# Connect Telegram
openclaw channel add telegram

# Connect Discord
openclaw channel add discord
```

Each channel walks you through authentication. Once connected, message your agent from that platform just like texting a friend.

## Step 7: Enable the Heartbeat (Optional)

The heartbeat makes OpenClaw truly autonomous — it checks for tasks periodically:

```bash title="~/.openclaw/HEARTBEAT.md"
# Heartbeat Tasks

## Every 30 minutes
- Check my Gmail for urgent emails and summarize them
- Monitor the GitHub repo openclaw/openclaw for new issues

## Daily at 9am
- Give me a weather briefing for San Francisco
- Summarize my calendar for today
```

Edit `~/.openclaw/HEARTBEAT.md` with your preferences, then restart the gateway. OpenClaw will proactively act on these instructions.

## What's Next?

You now have a working OpenClaw agent. Here's where to go from here:

| Goal | Guide |
|------|-------|
| Understand how it works | [Architecture Overview](/architecture/overview) |
| Connect more platforms | [Channels & Integrations](/guides/channels) |
| Build custom skills | [Skill Development](/guides/skill-development) |
| Run without API costs | [Local Models](/guides/local-models) |
| Lock down security | [Security Hardening](/security/hardening) |
| Fine-tune behavior | [Configuration Reference](/reference/configuration) |

:::tip
Join the [OpenClaw Discord](https://discord.gg/openclaw) to share setups, ask questions, and find community-built skills.
:::
