---
sidebar_position: 16
title: Workboard
description: Orchestrate multi-agent work with the Workboard — a Kanban-style task board built into OpenClaw v2026.6.1+
---

# Workboard

The Workboard is a Kanban-style task board built into OpenClaw as a core plugin. It lets you collect agent-sized work cards, assign them to specific agents, dispatch workers, and track progress — all from the dashboard, CLI, or chat.

Introduced in **v2026.6.1**, the Workboard is the first official orchestration layer in OpenClaw. It replaces the need for external project management tools for local agent work.

:::info
The Workboard manages **local operating work** within your OpenClaw Gateway. It is not a replacement for GitHub Issues, Linear, or Jira — it's purpose-built for coordinating agent tasks.
:::

---

## Enable the Workboard

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

Then open the dashboard at `http://127.0.0.1:18789` and navigate to the **Workboard** tab.

You can also enable it in config:

```json5 title="~/.openclaw/openclaw.json"
{
  "plugins": {
    "entries": {
      "workboard": {
        "enabled": true
      }
    }
  }
}
```

---

## Cards

Each Workboard card represents a unit of work for an agent.

### What a Card Contains

| Field | Required | Description |
|-------|----------|-------------|
| **Title** | Yes | Short description of the task |
| **Notes** | No | Context, instructions, or prompt for the agent |
| **Priority** | No | `low`, `normal`, `high`, or `urgent` |
| **Labels** | No | Custom tags for filtering (`bug`, `docs`, `feature`) |
| **Agent ID** | No | Assign to a specific agent |
| **Linked resource** | No | Task ID, run ID, session ID, or source URL |

### Card Lifecycle

Cards flow through five states:

```
todo → running → review → done
                ↘ blocked
```

| State | Meaning |
|-------|---------|
| `todo` | Work queued, not started |
| `running` | Linked session is active |
| `review` | Linked session completed, needs human review |
| `blocked` | Session failed, timed out, or was aborted |
| `done` | Work accepted and complete |

### Automatic Lifecycle Sync

If a card is linked to a session, the Workboard updates the card state automatically:

- Active session → card moves to `running`
- Completed session → card moves to `review`
- Failed or timed-out session → card moves to `blocked`

Once you manually move a card to `review`, `blocked`, or `done`, automatic sync stops until you move it back to `todo` or `running`.

---

## CLI Commands

### Create a Card

```bash
openclaw workboard create "Fix stale worker heartbeat" \
  --priority high \
  --labels bug,workboard \
  --agent docs-agent \
  --board docs \
  --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

### List Cards

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

### Show Card Details

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

### Dispatch Workers

Dispatch scans for ready cards and starts agent workers:

```bash
openclaw workboard dispatch
openclaw workboard dispatch --url http://127.0.0.1:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

### Slash Commands

On command-capable channels (Slack, Discord):

```
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

---

## Dispatch Workflow

When you run `dispatch`, the Workboard:

1. **Promotes dependency-ready children** to `ready` state
2. **Blocks expired claims** or timed-out worker runs
3. **Records dispatch metadata** on ready cards
4. **Selects a batch** of unclaimed ready cards
5. **Claims each card** for the dispatcher or assigned agent
6. **Starts workers** — each worker gets the card's notes as its prompt

Dispatch can be triggered from:
- The dashboard dispatch button
- `openclaw workboard dispatch` in the CLI
- `/workboard dispatch` on chat channels
- Manually starting a card from the Workboard UI

---

## Agent Coordination Tools

The Workboard exposes tools that agents can call during execution. These enable agents to interact with the board autonomously.

| Tool | What It Does |
|------|-------------|
| `workboard_list` | List cards with claim and diagnostic state |
| `workboard_read` | Read one card plus bounded worker context |
| `workboard_create` | Create a card with optional parents, skills, and workspace metadata |
| `workboard_claim` | Claim a card for the calling agent |
| `workboard_link` | Link parent and child cards with state tracking |
| `workboard_heartbeat` | Refresh the claim heartbeat during longer runs |
| `workboard_runs` | Return persisted run-attempt history for a card |

### What This Enables

An agent can:
- Check the board for available work
- Claim a card and begin working
- Create sub-task cards for complex work
- Link cards into dependency chains
- Keep its claim alive during long-running tasks
- Review its own run history

This makes autonomous workflows possible — an orchestrator agent creates cards, specialist agents claim and execute them, and the Workboard tracks everything.

---

## Dashboard Workflow

The full workflow in the Control UI:

1. Open the **Workboard** tab
2. **Create a card** — fill in title, notes, priority, labels, and optionally assign an agent
3. **Drag cards between columns** — or use the status menu to change state
4. **Start work from a card** — creates or reuses a dashboard session with the card's notes as the prompt
5. **Watch the linked session** as the agent works
6. **Lifecycle sync** moves the card to `review` or `blocked` automatically
7. **Manually move to `done`** when you're satisfied with the result

:::tip
You can also capture an existing session as a card: open **Sessions** → choose **Add to Workboard**.
:::

### Templates

Workboard supports templates for common card types. Templates pre-fill title patterns, notes, labels, and priority for repeatable work like:
- Bug fixes
- Documentation updates
- PR reviews
- Release checklists
- Plugin work

---

## Dreaming Tab & Agent Selector

v2026.6.1 also added a **Dreaming-tab agent selector** in the Control UI. This is relevant to multi-agent setups because it lets you manage each agent's memory consolidation independently.

### What Dreaming Is

Dreaming is an opt-in background memory consolidation system. It runs on a schedule and moves strong short-term signals into durable long-term memory, loosely modeled on biological sleep cycles:

| Phase | What Happens |
|-------|-------------|
| **Light** | Ingests recent signals, deduplicates candidates |
| **REM** | Extracts patterns, recurring themes, actionable insights |
| **Deep** | Promotes the strongest signals to long-term memory (MEMORY.md) |

### Enable Dreaming

```json5 title="~/.openclaw/openclaw.json"
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "cadence": "0 3 * * *"  // 3 AM daily
          }
        }
      }
    }
  }
}
```

### Agent Selector

In multi-agent setups, the Dreaming tab now shows an agent dropdown. Select an agent to:
- View its dreaming status and phase progress
- Read its Dream Diary (narrative summaries of what was consolidated)
- Trigger or pause dreaming for that specific agent

This means you can run dreaming on different schedules per agent — your work agent consolidates memories during lunch, your personal agent at 3 AM.

---

## Practical Recipes

### Research → Writing Pipeline

A researcher agent gathers information, a writer agent turns it into content:

```json5 title="~/.openclaw/openclaw.json"
{
  "agents": {
    "list": [
      {
        "id": "researcher",
        "model": "claude-opus-4-8",
        "workspace": "~/.openclaw/workspace-researcher"
      },
      {
        "id": "writer",
        "model": "claude-sonnet-4-6",
        "workspace": "~/.openclaw/workspace-writer"
      }
    ]
  }
}
```

1. Create Workboard cards for each research topic, assigned to `researcher`
2. Run `openclaw workboard dispatch`
3. Researcher completes work → cards move to `review`
4. Review the research, then create new cards assigned to `writer` linking the research sessions
5. Dispatch again — writer turns research into polished output

### Bug Triage

Queue bugs as cards with priority and labels, let agents claim them:

```bash
openclaw workboard create "Fix memory leak in gateway session handler" \
  --priority urgent \
  --labels bug,gateway \
  --agent coder

openclaw workboard create "Update FAQ for v2026.6.1 changes" \
  --priority normal \
  --labels docs \
  --agent docs-writer

openclaw workboard dispatch
```

### Autonomous Sub-Tasks

An orchestrator agent breaks complex work into sub-cards:

1. You create one card: "Audit all API endpoints for auth bypasses"
2. The orchestrator agent claims the card
3. It uses `workboard_create` to make sub-cards for each endpoint
4. It uses `workboard_link` to connect sub-cards to the parent
5. Specialist agents claim and execute sub-cards
6. Parent card moves to `review` when all children are `done`

### Self-Organizing Heartbeat

Combine the heartbeat with the Workboard for self-organizing work:

```markdown title="~/.openclaw/workspace/HEARTBEAT.md"
## Every 2 hours
- Check the Workboard for blocked cards
- If any cards are blocked, diagnose the failure and either retry or create a fix card
- Summarize Workboard status and send me a Telegram update
```

---

## Permissions

| Operation | Required Permission |
|-----------|-------------------|
| `list`, `show`, `export`, `diagnostics` | `operator.read` |
| `create`, `dispatch`, `diagnostics.refresh` | `operator.write` |

---

## Troubleshooting

**"Workboard is unavailable"**

```bash
openclaw plugins inspect workboard --runtime --json
```

Check that the plugin is enabled and the state root is writable.

**Cards not saving**

Verify the gateway is running and the plugin can write to its state directory.

**Dispatch starts nothing**

```bash
openclaw workboard list --status ready
```

At least one `ready` card must exist without an active claim.

**Dispatch says "data-only"**

```bash
openclaw gateway restart
openclaw gateway status --deep
```

---

## See Also

- [Multi-Agent Workflows](/guides/multi-agent) — Agent configuration, routing, and channel bindings
- [Heartbeat System](/guides/heartbeat) — Scheduled autonomous tasks
- [Automation & Integrations](/guides/automation) — CI/CD and external tool integration
- [Security Hardening](/security/hardening) — Securing multi-agent setups
- [Cost Management](/guides/cost-management) — Managing costs across multiple agents
