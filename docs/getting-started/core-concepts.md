---
sidebar_position: 4
title: Core Concepts
description: The fundamental building blocks of OpenClaw — Gateway, Brain, Hands, Memory, and Heartbeat
keywords: [openclaw, openclaw architecture, how openclaw works, openclaw gateway, openclaw brain hands, openclaw core concepts, openclaw heartbeat, openclaw memory system]
---

# Core Concepts

Before diving deeper, understand these five core components that make OpenClaw work.

## The Gateway

The **Gateway** is the central nervous system — a single long-running process that orchestrates everything.

```
openclaw gateway
```

It provides:
- A **WebSocket control plane** on port 18789 (default)
- Bridges between the Brain (LLM) and Hands (execution)
- Channel management for all connected messaging platforms
- The heartbeat loop for autonomous operation

The Gateway is designed to run as a **daemon** (background service) that starts on boot.

## The Brain (Reasoning Engine)

The Brain is the LLM that powers OpenClaw's intelligence:

- Makes API calls to your chosen provider (Anthropic, OpenAI, xAI, or local)
- Handles multi-step reasoning and task decomposition
- Decides *what* to do based on context and instructions
- Model-agnostic — swap providers without changing your setup

## The Hands (Execution Environment)

The Hands are what let OpenClaw *do things*:

- **Shell access** — Run commands, install packages, manage processes
- **File system** — Read, write, modify files anywhere on your machine
- **Browser automation** — Fill forms, scrape pages, interact with web apps
- **API calls** — Hit any HTTP endpoint, manage webhooks

:::warning
The Hands have the same permissions as the user running OpenClaw. This is powerful but dangerous. See [Security Hardening](/security/hardening) for how to limit access.
:::

## The Memory System

OpenClaw remembers things across conversations using **local Markdown files**:

```
~/.openclaw/
├── memory/
│   ├── preferences.md    # Your preferences and habits
│   ├── contacts.md       # People it's learned about
│   ├── projects.md       # Active projects and context
│   └── learnings.md      # Things it's figured out
├── HEARTBEAT.md          # Autonomous task definitions
└── openclaw.json         # Main configuration
```

Memory is:
- **Persistent** — Survives restarts and updates
- **Local** — Never sent to any cloud service
- **Human-readable** — It's just Markdown, you can edit it directly
- **Growing** — The agent builds context over time

## The Heartbeat

The Heartbeat is what makes OpenClaw *autonomous* rather than just *reactive*.

Every N minutes (default: 30), the Gateway sends the agent a heartbeat prompt. The agent:

1. Reads `HEARTBEAT.md` for defined tasks
2. Checks for pending work (unread messages, monitored events)
3. Either responds `HEARTBEAT_OK` (nothing to do) or takes action

This enables proactive behaviors like:
- Monitoring your inbox and flagging urgent messages
- Watching GitHub repos for new issues
- Running scheduled tasks (daily summaries, reports)
- Alerting you about system events

## How They Fit Together

```mermaid
graph TD
    subgraph Gateway["⚡ Gateway"]
        Brain["🧠 Brain<br/>(LLM)"]
        Hands["🤖 Hands<br/>(Shell, Files, Browser)"]
        HB["⏱️ Heartbeat<br/>(30m loop)"]
        Brain <--> Hands
        Brain --- Memory["💾 Memory<br/>(~/.openclaw/memory/*.md)"]
        HB --- Memory
    end

    Channels["🔗 Channels<br/>WhatsApp · Telegram · Discord<br/>Slack · Signal · WebChat"] --> Gateway
```

## SOUL.md (Identity & Personality)

The **SOUL.md** file defines *who* the agent is — its name, personality, tone, rules, and behavioral boundaries:

```markdown title="~/.openclaw/SOUL.md"
# Agent Identity

You are Jarvis, a helpful personal assistant.

## Rules
- Always respond politely
- Never make purchases without explicit approval
- Summarize long emails instead of forwarding them in full
```

SOUL.md is loaded into every conversation as system context. It's the primary way to customize the agent's behavior — and also the [#1 attack surface](/security/hardening#soulmd-protection) for prompt injection. Protect it with appropriate file permissions.

## Skills

Skills are OpenClaw's extension system — Markdown files with YAML frontmatter that define reusable agent capabilities:

```yaml title="skills/weather.md"
---
name: weather-briefing
trigger: "weather|forecast|temperature"
tools: [web-search, chat]
---

# Weather Briefing

When asked about weather, search for current conditions
and provide a concise briefing with temperature, conditions,
and any weather alerts.
```

Over **10,700 skills** are available on [ClawHub](/guides/clawhub), the community marketplace. Skills can also be written from scratch — see [Skill Development](/guides/skill-development).

:::warning
ClawHub has been targeted by malicious actors. Always [verify skills](/guides/clawhub#security) before installing.
:::

## MCP (Model Context Protocol)

**MCP** is the open protocol that connects OpenClaw to external tools and services. With 32,600+ MCP servers and 229,800+ tools available, it's how the agent accesses databases, APIs, cloud services, and more without custom code.

```json title="~/.openclaw/openclaw.json (excerpt)"
{
  "mcp": {
    "servers": {
      "filesystem": { "command": "npx @anthropic/mcp-filesystem" },
      "github": { "command": "npx @anthropic/mcp-github" }
    }
  }
}
```

See [MCP Servers](/guides/mcp-servers) for setup and the full ecosystem.

## Multi-Agent

OpenClaw can spawn **sub-agents** for parallel work — an orchestrator delegates tasks to specialized workers, each with their own context and tools. This enables complex workflows like research pipelines, DevOps fleets, and virtual companies.

Multi-agent comes with a 15x token cost multiplier, so it's best for tasks that genuinely benefit from parallelism. See [Multi-Agent Workflows](/guides/multi-agent) for patterns and cost management.

## Next Steps

- [Architecture Overview](/architecture/overview) — Deep dive into each component
- [Basic Usage](/guides/basic-usage) — Common patterns and workflows
- [Configuration](/reference/configuration) — Tune every setting
- [First 7 Days](/guides/first-7-days) — Hands-on structured learning path
