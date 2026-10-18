---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: "First 7 Days with OpenClaw"
description: "Go from first install to power user in 7 bite-sized guides — each takes under an hour"
keywords: [openclaw, tutorial, getting started, learn openclaw, beginner guide, first week, onboarding]
---

# First 7 Days with OpenClaw

Seven self-contained guides that take you from a first conversation to a hardened, automated setup. Each takes under an hour; do one a day or several in an afternoon. Every command and config block was checked against OpenClaw **v2026.10.4**.

| Day | What You'll Learn | Time |
|-----|------------------|------|
| [**Day 1: Make It Yours**](./day-1-make-it-yours.md) | Edit the workspace files that shape your agent, and have your first real conversation | 30 min |
| [**Day 2: Your Daily Driver**](./day-2-daily-driver.md) | Put it to work — summaries, research, file management | 30 min |
| [**Day 3: Set It Free**](./day-3-automation.md) | Schedule automations (morning briefings, checks) and tune the heartbeat monitor | 45 min |
| [**Day 4: Supercharge It**](./day-4-skills.md) | Use bundled skills and install community skills from ClawHub | 30 min |
| [**Day 5: Be Everywhere**](./day-5-multi-channel.md) | Connect multiple platforms and control who can talk to the bot | 45 min |
| [**Day 6: Build Your Own**](./day-6-power-moves.md) | Create custom skills, set up automations, go multi-agent | 60 min |
| [**Day 7: Lock It Down**](./day-7-production.md) | Security hardening, backups, updates, cost and monitoring | 45 min |

:::tip
**Already past the basics?** Jump to whatever day matches your level. Each guide stands alone.
:::

## Prerequisites

- OpenClaw installed and onboarded. `openclaw onboard` (or the installer's Quick start) verifies your model access, starts the Gateway and seeds the workspace files used on Day 1. See [Getting started](https://docs.openclaw.ai/start/getting-started).
- The Gateway running. `openclaw gateway status` should show it listening on port 18789, and `openclaw status` shows channel health.
- A way to talk to the bot. The Control UI (`openclaw dashboard`) and the terminal UI (`openclaw tui`) work with no extra setup. For your phone, Telegram is the easiest first channel: it is bundled with OpenClaw and needs only a bot token ([Telegram setup](https://docs.openclaw.ai/channels/telegram/setup)).
- An owner set for proactive messages. Approving your own first Telegram DM with `openclaw pairing approve` sets `commands.ownerAllowFrom` for you; Day 3 explains why it matters.

```bash
openclaw gateway status
openclaw status
openclaw dashboard
```

:::warning Read this before Day 2
Out of the box, OpenClaw runs shell commands **without asking** (`tools.exec.mode` defaults to `full`) and the sandbox is off. That suits a single trusted operator on a personal machine, but you should know it before you ask the bot to move or delete files. Day 2 shows how to turn on approvals; Day 7 covers the full [hardening checklist](/security/hardening).
:::

## What You'll Have After Day 7

- A personalized AI assistant with a distinct identity
- Scheduled briefings and checks that message you
- Multiple chat platforms connected, with access control
- Bundled and community skills installed and checked
- At least one custom skill you built yourself
- A hardened, backed-up, cost-aware setup
