---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Workboard
description: Orchestrate multi-agent work with the Workboard — a Kanban-style task board bundled with OpenClaw as a plugin
keywords: [openclaw, workboard, kanban, task management, agent coordination]
---

# Workboard

The Workboard is a Kanban-style task board bundled with OpenClaw as a plugin (disabled by default). It lets you collect agent-sized work cards, assign them to specific agents, dispatch workers, and track progress from the dashboard, CLI, or chat.

The first Workboard entries appear in v2026.5.28; the orchestration primitives (dependencies, dispatch, claims) landed in v2026.5.31 and v2026.6.1. Official reference: [Workboard plugin](https://docs.openclaw.ai/plugins/workboard) and [Workboard CLI](https://docs.openclaw.ai/cli/workboard).

:::info
The Workboard manages **local operating work** within your OpenClaw Gateway. It is not a replacement for GitHub Issues, Linear, or Jira — it's purpose-built for coordinating agent tasks.
:::

---

## Enable the Workboard

```bash
openclaw plugins enable workboard
openclaw dashboard
```

Enabling applies to a running Gateway without a restart. `openclaw dashboard` opens the Control UI; the **Workboard** tab appears once the plugin has loaded. The `openclaw workboard` CLI is only available while the plugin is enabled.

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

Cards have nine statuses:

```
triage → backlog → todo → ready → running → review → done
                     ↘ scheduled ↗        ↘ blocked
```

| Status | Meaning |
|-------|---------|
| `triage` | Rough idea, not yet specified |
| `backlog` | Accepted, not yet queued |
| `todo` | Queued; children wait here until every parent is `done` (the default for new cards) |
| `scheduled` | Held until a scheduled time |
| `ready` | Eligible for dispatch |
| `running` | Linked session is active |
| `review` | Linked session completed, needs human review |
| `blocked` | Run failed, timed out, or was aborted |
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
openclaw workboard create "Write Workboard docs" \
  --status ready \
  --priority high \
  --labels docs,workboard \
  --agent docs-agent \
  --board docs \
  --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

New cards start in `todo` unless you pass `--status`. Add `--json` to print the created card.

### List Cards

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
openclaw workboard list --include-archived
```

### Show Card Details

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

### Move a Card

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done
```

`move` is the same operator action as dragging a card in the dashboard. Dependency and schedule holds still apply.

### Dispatch Workers

Dispatch scans for ready cards and starts agent workers:

```bash
openclaw workboard dispatch
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --url http://127.0.0.1:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

One dispatch starts at most three workers by default, and only one card per owner or agent per pass. `--max-starts` raises the cap, but the one-per-agent rule still applies. If the local Gateway is stopped, dispatch runs data-only: it promotes dependencies and cleans stale claims but starts no workers.

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
6. **Starts workers**: each worker is a subagent run with bounded card context and the claim token

Dispatch can be triggered from:
- The dashboard dispatch button
- `openclaw workboard dispatch` in the CLI
- `/workboard dispatch` on chat channels
- Manually starting a card from the Workboard UI

Dispatch does not run on its own. To dispatch on a schedule, create an automation (see [Recipes](#self-organizing-heartbeat)).

---

## Agent Coordination Tools

The Workboard exposes tools that agents can call during execution. The card tools are **optional plugin tools**: enabling Workboard gives agents only the three `workboard_sessions_board_*` tools. An agent that should create, claim or complete cards needs them allowed:

```json5 title="~/.openclaw/openclaw.json"
{
  plugins: { entries: { workboard: { enabled: true } } },
  agents: {
    entries: {
      main: {
        tools: { alsoAllow: ["workboard"] },
      },
    },
  },
}
```

Workers that the Workboard starts from a card (**Start** or dispatch) do not need this: each worker run is granted `workboard_heartbeat`, `workboard_complete` and `workboard_block` for its card.

| Tool | What It Does |
|------|-------------|
| `workboard_list` | List cards with claim and diagnostic state |
| `workboard_read` | Read one card plus bounded worker context |
| `workboard_create` | Create a card with optional parents, skills, and workspace metadata |
| `workboard_claim` | Claim a card for the calling agent (moves it to `running`) |
| `workboard_link` | Link a parent to a child; the child waits in `todo` until every parent is `done` |
| `workboard_heartbeat` | Refresh the claim heartbeat during longer runs |
| `workboard_release` | Release the claim after completion, pause or handoff |
| `workboard_complete` / `workboard_block` | Finish with a summary and proof, or block with a reason |
| `workboard_specify` | Turn a rough triage/backlog card into a clarified `todo` card |
| `workboard_decompose` | Fan a parent card into linked children |
| `workboard_runs` | Return persisted run-attempt history for a card |
| `workboard_dispatch` | Nudge dependency promotion and stale-claim cleanup; does **not** launch workers |

The full list, including attachments, notifications and recovery tools, is in the [plugin reference](https://docs.openclaw.ai/plugins/workboard#agent-tools).

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

Workboard supports templates for common card types. Templates pre-fill title, notes, labels, and priority. The built-in template ids are `bugfix`, `docs`, `release`, `pr_review` and `plugin`.

---

## Dreaming Tab & Agent Selector

v2026.6.1 added an agent selector to the Control UI **Dreaming** tab. In a multi-agent setup it lets you pick which agent's dreaming status, phase progress and Dream Diary you are looking at.

The selector changes the view, not the schedule. Dreaming (the `memory-core` plugin's memory consolidation) has one sweep per Gateway with a single `frequency`, owned by `agents.defaults.systemAgent`. It has been **on by default since v2026.8.1** and runs its phases in the order light → REM → deep. `/dreaming on` and `/dreaming off` switch it globally; there is no per-agent schedule or pause.

To change the schedule or turn it off:

```json5 title="~/.openclaw/openclaw.json"
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *", // 3 AM daily (the default)
          },
        },
      },
    },
  },
}
```

See [Dreaming](https://docs.openclaw.ai/concepts/dreaming) and the [Memory Systems guide](/guides/memory-systems).

---

## Practical Recipes

### Research → Writing Pipeline

A researcher agent gathers information, a writer agent turns it into content:

```json5 title="~/.openclaw/openclaw.json"
{
  plugins: { entries: { workboard: { enabled: true } } },
  agents: {
    ownership: "explicit",
    defaults: { systemAgent: { agentId: "researcher" } },
    entries: {
      researcher: {
        model: "anthropic/claude-opus-5-5",
        workspace: "~/.openclaw/workspace-researcher",
      },
      writer: {
        model: "anthropic/claude-sonnet-5-5",
        workspace: "~/.openclaw/workspace-writer",
      },
    },
  },
}
```

1. Create Workboard cards for each research topic with `--agent researcher --status ready`
2. Run `openclaw workboard dispatch`
3. Researcher completes work → cards move to `review`
4. Review the research, then create new cards assigned to `writer` linking the research sessions
5. Dispatch again — writer turns research into polished output

### Bug Triage

Queue bugs as cards with priority and labels, let agents claim them:

```bash
openclaw workboard create "Fix memory leak in gateway session handler" \
  --status ready \
  --priority urgent \
  --labels bug,gateway \
  --agent coder

openclaw workboard create "Update FAQ for v2026.10 changes" \
  --status ready \
  --priority normal \
  --labels docs \
  --agent docs-writer

openclaw workboard dispatch
```

### Autonomous Sub-Tasks

An orchestrator agent (with `tools.alsoAllow: ["workboard"]`) breaks complex work into sub-cards:

1. You create one card: "Audit all API endpoints for auth bypasses"
2. The orchestrator agent claims the card
3. It uses `workboard_decompose` (or `workboard_create` plus `workboard_link`) to make linked child cards for each endpoint
4. Children wait in `todo` until their parents are done; dispatch promotes them to `ready`
5. Dispatch starts workers for the children, one per agent per pass
6. You review the results and move cards to `done`

### Self-Organizing Heartbeat {#self-organizing-heartbeat}

To review the board on a schedule, create an automation job rather than a heartbeat checklist (`HEARTBEAT.md` is retired):

```bash
openclaw automations create "every 2h" \
  "Check the Workboard for blocked cards. For each, diagnose the failure and either unblock it or create a fix card. Send me a short status summary." \
  --name workboard-review --agent main --session isolated \
  --announce --channel telegram --to "123456789"
```

The agent running this job needs the card tools (`tools.alsoAllow: ["workboard"]`). Keep exec approvals on for anything the fix cards might do unattended; see [Security hardening](/security/hardening).

---

## Permissions

| Operation | Required Permission |
|-----------|-------------------|
| `list`, `show` (and the `export`/`diagnostics` Gateway methods) | `operator.read` |
| `create`, `move`, `dispatch` (and `diagnostics.refresh`) | `operator.write` |

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
- [Heartbeat Guide](/guides/heartbeat) — The ambient monitor and automation jobs
- [Automation & Integrations](/guides/automation) — CI/CD and external tool integration
- [Security Hardening](/security/hardening) — Securing multi-agent setups
- [Cost Management](/guides/cost-management) — Managing costs across multiple agents
