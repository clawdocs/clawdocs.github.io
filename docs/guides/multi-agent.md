---
sidebar_position: 15
title: Multi-Agent Workflows
description: Running multiple OpenClaw agents with distinct personalities, routing rules, coordination patterns, and orchestration tools
---

# Multi-Agent Workflows

OpenClaw supports running multiple agents within a single gateway, each with its own identity, workspace, memory, and channel bindings. This guide covers configuration, routing, coordination, and community orchestration tools.

---

## Multi-Agent Architecture

Each agent is a fully isolated "brain" with:
- Its own **workspace** (SOUL.md, AGENTS.md, USER.md, TOOLS.md, MEMORY.md)
- Its own **state directory** (auth profiles, model registry)
- Its own **session store** (chat history, routing state)
- Optionally its own **LLM model** and provider

All agents share a single gateway process and port.

---

## Configuration

### Defining Agents

```json title="~/.openclaw/openclaw.json"
{
  "agents": {
    "defaults": {
      "model": "claude-sonnet-4-5"
    },
    "list": [
      {
        "id": "alex",
        "workspace": "~/.openclaw/workspace-alex",
        "model": "claude-opus-4-6"
      },
      {
        "id": "mia",
        "workspace": "~/.openclaw/workspace-mia",
        "model": "claude-haiku-4-5"
      }
    ]
  }
}
```

`agents.defaults` sets baseline settings for all agents. Individual entries in `agents.list` override specific fields.

### Channel Bindings

Bindings route incoming messages to specific agents based on channel, account, peer, or space:

```json title="~/.openclaw/openclaw.json"
{
  "bindings": [
    {
      "agentId": "alex",
      "match": {
        "channel": "whatsapp",
        "peer": { "kind": "direct", "id": "+15551230001" }
      }
    },
    {
      "agentId": "mia",
      "match": {
        "channel": "telegram"
      }
    },
    {
      "agentId": "alex",
      "match": {
        "channel": "whatsapp",
        "accountId": "personal"
      }
    }
  ]
}
```

**Binding rules:**
- **Most specific wins** — peer matches take priority over channel-wide matches
- **Deterministic** — same input always routes to the same agent
- If multiple accounts exist for a channel, use `accountId` to distinguish
- Unmatched messages go to the default agent

### Separate Instances (Alternative)

For full isolation (different ports, different processes):

```bash
# Instance 1 (work)
OPENCLAW_PORT=18789 OPENCLAW_HOME=~/.openclaw-work openclaw gateway

# Instance 2 (personal)
OPENCLAW_PORT=18790 OPENCLAW_HOME=~/.openclaw-personal openclaw gateway
```

This provides stronger isolation but requires managing two processes.

---

## Common Patterns

### Work + Personal Agents

Route work contacts to a professional agent, personal contacts to a casual one:

```json
{
  "agents": {
    "list": [
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work"
      },
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal"
      }
    ]
  },
  "bindings": [
    { "agentId": "work", "match": { "channel": "slack" } },
    { "agentId": "work", "match": { "channel": "teams" } },
    { "agentId": "personal", "match": { "channel": "whatsapp" } },
    { "agentId": "personal", "match": { "channel": "telegram" } }
  ]
}
```

Give each agent a distinct [SOUL.md](/guides/soul-md) — professional tone for work, casual for personal.

### Model Routing by Agent

Assign different models based on agent role and cost tolerance:

```json
{
  "agents": {
    "list": [
      { "id": "thinker", "model": "claude-opus-4-6" },
      { "id": "responder", "model": "claude-haiku-4-5" },
      { "id": "coder", "model": "gpt-5.3-codex" }
    ]
  }
}
```

### Specialist Agents

Route by topic using separate channels:

| Agent | Channel | SOUL.md Focus |
|-------|---------|---------------|
| `coder` | GitHub, CLI | Code review, debugging, PRs |
| `assistant` | WhatsApp, iMessage | Calendar, reminders, messages |
| `researcher` | Discord, Telegram | Web research, summaries |
| `homelab` | Home Assistant | Smart home automation |

---

## Workboard Orchestration

As of **v2026.6.1**, the [Workboard](/guides/workboard) provides the official orchestration layer for multi-agent coordination:

- **Kanban-style task board** — create cards, assign to agents, track progress
- **Automatic dispatch** — scan for ready cards and start agent workers
- **Agent tools** — agents can claim cards, create sub-tasks, and link dependencies autonomously
- **Lifecycle sync** — cards automatically move between states as linked sessions progress

The Workboard replaces the need for external workflow tools when coordinating work across multiple agents on the same Gateway.

See the full [Workboard Guide](/guides/workboard) for setup, configuration, and recipes.

---

## Orchestration Tools

### Mission Control

[Mission Control](https://github.com/crshdn/mission-control) is a community-built orchestration dashboard for managing multi-agent workflows.

- **Kanban-style task board** — Inbox → Assigned → In Progress → Review → Done
- **Agent management** — Assign tasks to specific agents, track progress
- **Gateway integration** — Communicates via OpenClaw Gateway WebSocket API
- **Flexible deployment** — Can run on a different machine, connected via Tailscale
- **Storage** — SQLite-based

### Antfarm

[Antfarm](https://github.com/snarktank/antfarm) lets you build an agent team with one command:

```bash
npx antfarm create my-team
```

### ClawDeck

[ClawDeck](https://clawdeck.io/) and [ClawController](https://www.clawcontroller.com/) are commercial dashboards providing visual agent management and monitoring.

### DigitalOcean Elastic Scaling

[DigitalOcean App Platform](https://www.digitalocean.com/blog/openclaw-digitalocean-app-platform) offers elastic scaling for multiple OpenClaw agents with safe defaults and no infrastructure management.

---

## Security Considerations

Multi-agent setups multiply the attack surface:

- Each agent with shell access can execute commands as your user
- Compromised agents can potentially access other agents' workspaces unless isolated
- Channel bindings route messages automatically — a compromised channel can reach the wrong agent

**Mitigations:**
- Use separate `OPENCLAW_HOME` directories for sensitive vs non-sensitive agents
- Restrict shell access per agent where possible
- Use [sandbox mode](/security/hardening) for agents handling untrusted input
- Monitor each agent's [SOUL.md](/guides/soul-md#security) for unauthorized modifications

---

## See Also

- [SOUL.md Guide](/guides/soul-md) — Giving each agent a distinct personality
- [Architecture Overview](/architecture/overview) — How the gateway orchestrates agents
- [Channels & Integrations](/guides/channels) — Connecting messaging platforms
- [Automation & Integrations](/guides/automation) — Scheduled tasks and CI/CD
- [Cost Management](/guides/cost-management) — Multi-agent cost implications
