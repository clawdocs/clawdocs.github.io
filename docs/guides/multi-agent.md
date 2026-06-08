---
sidebar_position: 15
title: Multi-Agent Workflows
description: Running multiple OpenClaw agents with distinct personalities, routing rules, coordination patterns, and orchestration tools
---

# Multi-Agent Workflows

OpenClaw supports running multiple agents within a single gateway, each with its own identity, workspace, memory, and channel bindings. This guide covers configuration, routing, inter-agent communication, orchestration tools, production patterns, fleet management, and cost optimization.

:::tip Key insight
Anthropic's research shows that an Opus lead with Sonnet subagents outperforms a single Opus agent by 90.2% on complex tasks. Multi-agent isn't just about scale — it's about **specialization** and **parallel coverage**.
:::

---

## Architecture

Each agent is a fully isolated "brain" with:
- Its own **workspace** (SOUL.md, AGENTS.md, USER.md, TOOLS.md, MEMORY.md)
- Its own **state directory** (auth profiles, model registry)
- Its own **session store** (chat history, routing state)
- Optionally its own **LLM model** and provider

All agents share a single gateway process and port.

```
                     ┌─── Agent "alex" ──── Workspace + Memory + Model
                     │
Gateway (port 18789) ├─── Agent "mia"  ──── Workspace + Memory + Model
                     │
                     └─── Agent "coder" ─── Workspace + Memory + Model
                     
  ▲ Incoming messages routed by bindings (channel, peer, account)
```

### Recent Multi-Agent Improvements

| Version | Feature | Impact |
|---------|---------|--------|
| v2026.4.19 | Per-session nested agent scoping | Long-running agent no longer blocks other sessions |
| v2026.5.22 | Scoped sub-agent bootstrap context | Sub-agents only get AGENTS.md + TOOLS.md by default (saves tokens) |
| v2026.6.1 | Workboard orchestration primitives | Kanban-style agent coordination with dependency tracking |
| v2026.6.1 | Internal namespaces | Scoped agent/global sessions for tool dispatch isolation |

---

## Configuration

### Defining Agents

```json5 title="~/.openclaw/openclaw.json"
{
  "agents": {
    "defaults": {
      "model": "claude-sonnet-4-6"
    },
    "list": [
      {
        "id": "alex",
        "workspace": "~/.openclaw/workspace-alex",
        "model": "claude-opus-4-8"
      },
      {
        "id": "mia",
        "workspace": "~/.openclaw/workspace-mia",
        "model": "claude-haiku-4-5-20251001"
      }
    ]
  }
}
```

`agents.defaults` sets baseline settings for all agents. Individual entries in `agents.list` override specific fields.

### Channel Bindings

Bindings route incoming messages to specific agents based on channel, account, peer, or space:

```json5 title="~/.openclaw/openclaw.json"
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

### Per-Agent Identity

Each agent gets its own workspace with distinct identity files:

| File | Purpose |
|------|---------|
| **SOUL.md** | Internal personality — values, tone, boundaries |
| **IDENTITY.md** | External presentation — name, emoji, avatar |
| **AGENTS.md** | Task instructions — what the agent should do |
| **USER.md** | User context — who the agent serves |
| **TOOLS.md** | Capabilities — which tools are available |
| **MEMORY.md** | Persistent knowledge — what the agent remembers |

**Pattern:** Share a common AGENTS.md for operating rules, give each agent a unique SOUL.md for personality.

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

```json5
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

```json5
{
  "agents": {
    "list": [
      { "id": "thinker", "model": "claude-opus-4-8" },
      { "id": "responder", "model": "claude-haiku-4-5-20251001" },
      { "id": "coder", "model": "claude-sonnet-4-6" }
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

### Orchestrator-Worker Pattern

The pattern Anthropic uses in their own multi-agent research system: one lead agent (expensive, capable) coordinates specialist workers (cheaper, focused):

```json5
{
  "agents": {
    "list": [
      {
        "id": "lead",
        "model": "claude-opus-4-8",
        "workspace": "~/.openclaw/workspace-lead"
      },
      {
        "id": "researcher",
        "model": "claude-sonnet-4-6",
        "workspace": "~/.openclaw/workspace-researcher"
      },
      {
        "id": "writer",
        "model": "claude-sonnet-4-6",
        "workspace": "~/.openclaw/workspace-writer"
      },
      {
        "id": "reviewer",
        "model": "claude-haiku-4-5-20251001",
        "workspace": "~/.openclaw/workspace-reviewer"
      }
    ]
  }
}
```

The lead decomposes tasks, delegates to specialists, and synthesizes results. Workers store output in external systems (files, git) and pass lightweight references back — avoiding context window bloat.

**Scaling rules** (from Anthropic's research):
- Simple queries: 1 agent, 3-10 tool calls
- Moderate tasks: 2-4 subagents in parallel
- Complex work: 10+ subagents with dependency coordination

---

## Inter-Agent Communication

### File-Based Messaging

The simplest pattern: agents communicate through shared files.

```bash
# Agent "lead" writes a task
echo '{"task": "Review PR #42", "priority": "high"}' > ~/.openclaw/shared/inbox-reviewer.json

# Agent "reviewer" checks its inbox via heartbeat
cat ~/.openclaw/shared/inbox-reviewer.json
```

This is how Claude Code's built-in Agent Teams work: a shared task list with file-locking to prevent race conditions, plus a mailbox system where teammates message each other by name.

### Workboard Messaging

The Workboard provides structured inter-agent communication through card-based coordination:

```bash
# Lead creates a task card for the researcher
openclaw workboard create --title "Research competitor pricing" \
  --assign researcher \
  --parent card-001

# Researcher claims and works on it
openclaw workboard claim card-002

# Researcher marks complete — lead gets notified via lifecycle sync
openclaw workboard update card-002 --status done
```

### MCP-Based Communication

Agents can call each other's skills through MCP:

```json5 title="Lead agent's config"
{
  "mcp": {
    "servers": {
      "researcher-agent": {
        "command": "ssh",
        "args": ["user@server", "openclaw", "mcp", "serve", "--agent", "researcher"]
      }
    }
  }
}
```

The lead agent can now invoke the researcher's skills as MCP tools — effectively delegating work through a structured protocol.

### ClawTeam Communication

[ClawTeam-OpenClaw](https://github.com/win4r/ClawTeam-OpenClaw) (1,396 stars) provides purpose-built inter-agent messaging:

- **Point-to-point inboxes** — send messages directly to a specific agent
- **Broadcast** — send to all agents simultaneously
- **File-based transport** (default) — JSON files in `~/.clawteam/`, no server required
- **ZeroMQ transport** (optional) — P2P for high-throughput, low-latency messaging

```bash
# Send a message to a specific agent
clawteam send --to researcher "Analyze the Q2 earnings report"

# Broadcast to all agents
clawteam broadcast "Stand-up: report your status"

# Check inbox
clawteam inbox --agent lead
```

---

## Workboard Orchestration

The [Workboard](/guides/workboard) (v2026.6.1+) is OpenClaw's official orchestration layer for multi-agent coordination.

### Card Lifecycle

```
todo → running → review → done
         ↓
      blocked
```

- **todo** — Ready for work, waiting to be claimed
- **running** — Agent has claimed and is working on it
- **review** — Work complete, pending verification
- **done** — Verified and finished
- **blocked** — Waiting on a dependency

### Agent Coordination Tools

Agents interact with the Workboard autonomously during execution:

| Tool | Purpose |
|------|---------|
| `workboard_list` | List cards with claim state |
| `workboard_read` | Read card details + worker context |
| `workboard_create` | Create cards with parent/child relationships |
| `workboard_claim` | Claim a card for this agent |
| `workboard_link` | Link cards into dependency chains |
| `workboard_heartbeat` | Refresh claim during long runs |
| `workboard_runs` | Return persisted run history |
| `workboard_dispatch` | Promote dependency-ready children, start workers |
| `workboard_reassign` | Move a card to a different agent |
| `workboard_promote` | Promote a card to a higher priority |

### Dispatch Workflow

The dispatch cycle runs automatically:
1. Promote dependency-ready children to `todo`
2. Block expired claims (stale agents)
3. Claim next available card
4. Start worker for the card
5. Track completion and update lifecycle

### Autonomous Sub-Tasks

An orchestrator agent creates cards, specialist agents claim and execute, and the Workboard tracks everything:

```
Lead Agent                   Workboard                  Specialist Agents
    │                            │                            │
    ├── create card ────────────►│                            │
    │   "Research competitors"   │◄── claim ──────────────────┤ researcher
    │                            │                            │
    ├── create card ────────────►│                            │
    │   "Write report"           │   (blocked by research)    │
    │   blocked-by: research     │                            │
    │                            │                            │
    │                            │◄── done ───────────────────┤ researcher
    │                            │── auto-unblock ───────────►│
    │                            │◄── claim ──────────────────┤ writer
    │                            │                            │
    │◄── notify ─────────────────│◄── done ───────────────────┤ writer
```

### Self-Organizing Heartbeat

Add a Workboard check to each agent's heartbeat:

```markdown title="HEARTBEAT.md"
## Workboard Check

Every 2 hours:
1. Check for blocked cards you own — investigate and unblock
2. Check for unclaimed cards matching your skills — claim and start
3. Report status of in-progress cards
```

---

## Orchestration Tools

### Mission Control

[Mission Control](https://github.com/abhi1693/openclaw-mission-control) (4,032 stars) is a centralized operations and governance platform for running OpenClaw across teams and organizations.

- **Hierarchical orchestration** — organizations, board groups, boards, tasks, tags
- **Gateway-aware** — connect and manage remote execution environments from one interface
- **Distributed runtime** — operate remote gateways without changing operator workflow
- **Real deployments** — documented at scale with 5 master instances and 10+ satellite agents on AWS

```bash
# Install
git clone https://github.com/abhi1693/openclaw-mission-control
cd openclaw-mission-control && docker compose up -d
```

Best for: **teams and organizations** running multiple gateways across environments.

### ClawTeam-OpenClaw

[ClawTeam-OpenClaw](https://github.com/win4r/ClawTeam-OpenClaw) (1,396 stars, 27 contributors, 453 tests) provides a complete multi-agent framework:

**Communication:**
- Point-to-point inboxes and broadcast messaging
- File-based transport (default) or ZeroMQ P2P
- Shared kanban task board with dependency chains

**Fleet Monitoring:**
- Terminal kanban: `clawteam board show`
- Auto-refreshing dashboard: `clawteam board live`
- Tiled tmux views: `clawteam board attach`
- Web UI: `clawteam board serve`

**Cost Management:**
- Real-time cost dashboard (token/cost by agent, model, and task)
- Per-agent model assignment with 7-level priority chain
- Cost tiers: strong / balanced / cheap

**Resilience:**
- Circuit breaker patterns (healthy/degraded/open tri-state)
- Retry with exponential backoff
- Zombie detection and idle worker identification
- Shutdown approval workflows

Best for: **production teams** needing fleet monitoring, cost tracking, and inter-agent messaging.

### Antfarm

[Antfarm](https://github.com/snarktank/antfarm) orchestrates multi-agent workflows with zero external infrastructure:

```bash
npx antfarm create my-team
```

- **YAML-defined teams** — plain Markdown and YAML configuration
- **SQLite state tracking** at `~/.openclaw/antfarm/antfarm.db`
- **Cron scheduling** with staggered 15-minute intervals
- **Three bundled workflows:**

| Workflow | Agents | Purpose |
|----------|--------|---------|
| `feature-dev` | 7 | Full feature development pipeline |
| `security-audit` | 7 | Security review and remediation |
| `bug-fix` | 6 | Bug triage, fix, and verification |

Each agent runs in a fresh session with clean context — no context window bloat. Memory persists through git history and progress files.

Best for: **solo developers** wanting deterministic multi-agent workflows with no setup.

### ClawDeck & ClawController

[ClawDeck](https://clawdeck.io/) and [ClawController](https://www.clawcontroller.com/) are commercial dashboards providing visual agent management and monitoring.

### DigitalOcean Elastic Scaling

[DigitalOcean App Platform](https://www.digitalocean.com/blog/openclaw-digitalocean-app-platform) offers elastic scaling for multiple OpenClaw agents with safe defaults and no infrastructure management.

---

## Production Patterns

### Multi-Agent DevOps Pipeline

Three agents coordinate through the Workboard:

```json5
{
  "agents": {
    "list": [
      {
        "id": "reviewer",
        "workspace": "~/.openclaw/workspace-reviewer",
        "model": "claude-opus-4-8"
      },
      {
        "id": "tester",
        "workspace": "~/.openclaw/workspace-tester",
        "model": "claude-sonnet-4-6"
      },
      {
        "id": "deployer",
        "workspace": "~/.openclaw/workspace-deployer",
        "model": "claude-haiku-4-5-20251001"
      }
    ]
  },
  "bindings": [
    { "agentId": "reviewer", "match": { "channel": "discord", "peer": { "kind": "space", "id": "code-review" } } },
    { "agentId": "tester", "match": { "channel": "slack", "peer": { "kind": "space", "id": "ci-cd" } } },
    { "agentId": "deployer", "match": { "channel": "slack", "peer": { "kind": "space", "id": "deployments" } } }
  ]
}
```

**Flow:** New PR detected by reviewer's heartbeat → creates Workboard card → reviewer analyzes code → tester claims test card → deployer claims deploy card (blocked until tests pass).

### Research Pipeline

```
Researcher (Sonnet) → Writer (Sonnet) → Editor (Haiku)
     │                    │                  │
     ├── Web search       ├── Draft report   ├── Grammar check
     ├── Source analysis   ├── Citations      ├── Fact verification
     └── Claim extraction  └── Formatting     └── Final output
```

Each agent runs in parallel where possible, with the Workboard tracking dependencies.

### Customer Support Fleet

```json5
{
  "agents": {
    "list": [
      { "id": "triage", "model": "claude-haiku-4-5-20251001" },
      { "id": "technical", "model": "claude-sonnet-4-6" },
      { "id": "billing", "model": "claude-haiku-4-5-20251001" },
      { "id": "escalation", "model": "claude-opus-4-8" }
    ]
  },
  "bindings": [
    { "agentId": "triage", "match": { "channel": "intercom" } }
  ]
}
```

The triage agent classifies incoming messages and routes to specialists. Only complex escalations hit the expensive Opus model.

### Virtual Company

Multiple specialized teams coordinated through a leader agent:

| Team | Agent | Model | Focus |
|------|-------|-------|-------|
| Dev | `coder` | Sonnet 4.6 | Code, PRs, bugs |
| Marketing | `marketer` | Haiku 4.5 | Content, social media |
| Ops | `ops` | Haiku 4.5 | Monitoring, alerts |
| Lead | `lead` | Opus 4.8 | Strategy, coordination |

The lead agent uses shared memory (via PowerMem or ClawTeam) for cross-agent context.

---

## Memory: Shared vs Isolated

By default, each agent has **completely isolated memory** — separate SQLite search index, separate Markdown memory files in its workspace.

### When to Share Memory

| Scenario | Approach |
|----------|----------|
| Agents need their own context | Default isolated memory |
| Agents need to share facts | Shared filesystem directory |
| Agents need cross-context search | PowerMem (hybrid + graph memory) |
| Team-wide managed memory | Mem0 (managed platform) |
| Token-efficient shared memory | memU (3-layer filesystem) |

### Shared Directory Pattern

The simplest approach — agents read/write to a common directory:

```json5
{
  "agents": {
    "list": [
      {
        "id": "researcher",
        "workspace": "~/.openclaw/workspace-researcher"
      },
      {
        "id": "writer",
        "workspace": "~/.openclaw/workspace-writer"
      }
    ]
  }
}
```

```bash
# Both agents have access to a shared output directory
mkdir -p ~/.openclaw/shared/research-output

# Researcher writes findings
# Writer reads findings to create reports
```

### PowerMem for Multi-Agent

PowerMem explicitly supports multi-agent memory governance:
- Isolation between agents by default
- Cross-agent collaboration when configured
- Graph-based relationships between memories
- Hybrid search (vector + keyword + graph)

### Dreaming Per Agent

v2026.6.1 allows scheduling Dreaming (memory consolidation) independently per agent. Each agent can consolidate on its own schedule without affecting others.

---

## Fleet Monitoring

### Built-In Monitoring

```bash
# Check all agents
openclaw status

# Per-agent health
openclaw channel status --agent alex
openclaw channel status --agent mia

# Gateway-wide metrics
openclaw stats tokens --period 7
```

### ClawTeam Fleet Dashboard

For visual fleet monitoring at scale:

```bash
# Terminal kanban — see all agents and their current cards
clawteam board show

# Auto-refreshing dashboard
clawteam board live

# Tiled tmux view — one pane per agent
clawteam board attach

# Web UI
clawteam board serve --port 8080
```

### Mission Control at Scale

For organizations running multiple gateways:

```
Mission Control Dashboard
├── Gateway: VPS-1 (US East)
│   ├── Agent: coder (active, 3 tasks)
│   ├── Agent: reviewer (idle)
│   └── Agent: ops (heartbeat running)
├── Gateway: VPS-2 (EU West)
│   ├── Agent: support-eu (active, 12 conversations)
│   └── Agent: translator (idle)
└── Gateway: VPS-3 (APAC)
    └── Agent: support-apac (active, 8 conversations)
```

### Health Check Patterns

Add multi-agent health checks to the lead agent's heartbeat:

```markdown title="Lead agent's HEARTBEAT.md"
## Fleet Health Check

1. Check each agent's channel connectivity
2. Verify Workboard has no stale claimed cards (older than 1 hour)
3. Check for zombie agents (high memory, no recent activity)
4. Report fleet status to Telegram
5. Alert on any disconnected channels or failed agents
```

---

## Cost Optimization

Multi-agent setups use approximately **15x more tokens** than standard chat. Cost management is critical.

### The Token Multiplier

| Setup | Relative Cost |
|-------|--------------|
| Single agent, standard chat | 1x |
| Single agent, agentic mode | 4x |
| Multi-agent system | ~15x |

### Model Tiering

The biggest lever: assign the right model to each agent's role.

```json5
{
  "agents": {
    "list": [
      { "id": "lead", "model": "claude-opus-4-8" },
      { "id": "worker-1", "model": "claude-sonnet-4-6" },
      { "id": "worker-2", "model": "claude-sonnet-4-6" },
      { "id": "monitor", "model": "claude-haiku-4-5-20251001" },
      { "id": "heartbeat-bot", "model": "local/qwen3:14b" }
    ]
  }
}
```

| Role | Recommended Model | Why |
|------|------------------|-----|
| Lead / orchestrator | Opus | Complex reasoning, delegation decisions |
| Specialist worker | Sonnet | Good balance of capability and cost |
| Triage / routing | Haiku | Fast, cheap, good enough for classification |
| Monitoring / heartbeat | Local (Ollama) | Free, runs 24/7 |

### Bootstrap Context Scoping

Since v2026.5.22, sub-agents only receive AGENTS.md and TOOLS.md by default — not SOUL.md, USER.md, memory, or other files. This prevents token waste on context that workers don't need.

To include additional files for a specific sub-agent, explicitly attach them in the delegation.

### Heartbeat Cost Multiplication

Each agent with a heartbeat sends its full context every cycle. Three agents with 30-minute heartbeats = 144 heartbeat cycles per day.

**Mitigations:**
- Route all heartbeats to a cheap/local model via `heartbeat_override`
- Stagger heartbeat intervals (agent 1 at :00, agent 2 at :20, agent 3 at :40)
- Disable heartbeat for agents that don't need autonomous monitoring
- Use quiet hours on all agents

```json5
{
  "agents": {
    "list": [
      {
        "id": "lead",
        "heartbeat": { "interval": 3600 }
      },
      {
        "id": "worker",
        "heartbeat": { "enabled": false }
      },
      {
        "id": "monitor",
        "heartbeat": {
          "interval": 1800,
          "quiet_hours": { "start": "23:00", "end": "07:00" }
        }
      }
    ]
  }
}
```

### Cost Tracking

```bash
# Per-agent token usage
openclaw stats tokens --agent lead --period 7
openclaw stats tokens --agent worker-1 --period 7

# ClawTeam cost dashboard (by agent, model, and task)
clawteam costs show
clawteam costs show --by agent
clawteam costs show --by model
```

### Budget Example

| Agent | Model | Heartbeat | Monthly Cost |
|-------|-------|-----------|-------------|
| Lead (Opus) | $15/M tokens | 1/hour | ~$180 |
| 2x Workers (Sonnet) | $9/M tokens | disabled | ~$60 each (on demand) |
| Monitor (Haiku) | $3/M tokens | 1/30min | ~$45 |
| Heartbeat bot (local) | $0 | 1/30min | $0 |
| **Total** | | | **~$345/month** |

vs. single Opus agent doing everything: ~$500+/month with worse performance.

---

## Security Considerations

Multi-agent setups multiply the attack surface:

- Each agent with shell access can execute commands as your user
- Compromised agents can potentially access other agents' workspaces unless isolated
- Channel bindings route messages automatically — a compromised channel can reach the wrong agent
- SOUL.md is the #1 attack vector (persistent personality hijacking)

### Mitigations

- Use separate `OPENCLAW_HOME` directories for sensitive vs non-sensitive agents
- Restrict shell access per agent where possible
- Use [sandbox mode](/security/hardening) for agents handling untrusted input
- Monitor each agent's [SOUL.md](/guides/soul-md#security) for unauthorized modifications
- Make identity files read-only: `chmod 444 SOUL.md AGENTS.md`
- v2026.6.1 internal namespaces provide scoped isolation between agents

### Bootstrap Context Security

Since v2026.5.22, sub-agents don't receive SOUL.md, USER.md, or customer runbooks by default. This prevents sensitive main-agent context from leaking into worker sessions — a significant security improvement for multi-agent setups.

---

## Choosing an Orchestration Approach

| Approach | Best For | Complexity | Cost |
|----------|----------|-----------|------|
| **Channel bindings** | Simple routing (work vs personal) | Low | None |
| **Workboard** | Task coordination within one gateway | Medium | Built-in |
| **Antfarm** | Deterministic YAML-defined workflows | Medium | Free |
| **ClawTeam** | Fleet management with messaging and monitoring | High | Free |
| **Mission Control** | Multi-gateway enterprise orchestration | High | Free |
| **Separate instances** | Maximum isolation | Low | Multiple processes |

**Start simple:** Channel bindings with 2-3 agents cover most use cases. Add Workboard when you need task coordination. Add ClawTeam or Mission Control only when managing 5+ agents or multiple gateways.

---

## Quick Start: Your First Multi-Agent Setup

```json5 title="~/.openclaw/openclaw.json"
{
  "agents": {
    "defaults": {
      "model": "claude-sonnet-4-6"
    },
    "list": [
      {
        "id": "assistant",
        "workspace": "~/.openclaw/workspace-assistant"
      },
      {
        "id": "coder",
        "workspace": "~/.openclaw/workspace-coder",
        "model": "claude-sonnet-4-6"
      }
    ]
  },
  "bindings": [
    { "agentId": "assistant", "match": { "channel": "telegram" } },
    { "agentId": "coder", "match": { "channel": "discord" } }
  ]
}
```

```bash
# Create workspaces
mkdir -p ~/.openclaw/workspace-assistant ~/.openclaw/workspace-coder

# Give each agent a personality
echo "You are a friendly personal assistant." > ~/.openclaw/workspace-assistant/SOUL.md
echo "You are a senior software engineer." > ~/.openclaw/workspace-coder/SOUL.md

# Start the gateway — both agents run on one process
openclaw start
```

---

## See Also

- [Workboard Guide](/guides/workboard) — Detailed Workboard setup and recipes
- [SOUL.md Guide](/guides/soul-md) — Giving each agent a distinct personality
- [Architecture Overview](/architecture/overview) — How the gateway orchestrates agents
- [Channels & Integrations](/guides/channels) — Connecting messaging platforms
- [API & Webhooks](/guides/api-webhooks) — Programmatic agent control
- [Performance Tuning](/guides/performance-tuning) — Model routing and cost reduction
- [Cost Management](/guides/cost-management) — Multi-agent cost implications
- [Memory Systems Compared](/guides/memory-systems) — Choosing memory for multi-agent setups
- [Monitoring & Observability](/guides/monitoring) — Fleet health checks and alerting
- [Security Hardening](/security/hardening) — Sandboxing and isolation
