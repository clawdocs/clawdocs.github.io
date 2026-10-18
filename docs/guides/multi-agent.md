---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Multi-Agent Workflows
description: Running multiple OpenClaw agents with separate workspaces, routing bindings, delegation, Workboard coordination, and per-agent heartbeats and automations
keywords: [openclaw, multi-agent, multiple agents, agent fleet, orchestration, bindings, agents.entries]
---

# Multi-Agent Workflows

One Gateway process can host several isolated agents. Each has its own workspace, state directory and session store, and inbound messages reach the right agent through **bindings**. This page covers the roster format, routing, delegation between agents, Workboard coordination, heartbeats and automations per agent, cost, and isolation. The official reference is [Multi-agent routing](https://docs.openclaw.ai/concepts/multi-agent).

:::tip When multi-agent helps
Anthropic reported that a lead agent with parallel sub-agents (Claude Opus 4 lead, Claude Sonnet 4 sub-agents) beat a single Opus 4 agent by 90.2% on its internal research eval, at the price of far more tokens ([Anthropic, "How we built our multi-agent research system"](https://www.anthropic.com/engineering/multi-agent-research-system)). That result is for breadth-first research tasks. For a personal assistant, two or three agents split by channel or persona is usually enough.
:::

---

## Architecture

Each agent (`agentId`) has its own:

- **Workspace**: `AGENTS.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`, `MEMORY.md`, daily notes. It is the default working directory, not a sandbox.
- **State directory** (`agentDir`, default `~/.openclaw/agents/<agentId>/agent`): auth profiles, model registry.
- **Session store**: chat history and routing state in `<agentDir>/openclaw-agent.sqlite`.
- Optionally its own model, tool policy, sandbox and heartbeat.

All agents share one Gateway process and port.

```
                     ┌─── Agent "alex" ──── workspace + agentDir + sessions
                     │
Gateway (port 18789) ├─── Agent "mia"  ──── workspace + agentDir + sessions
                     │
                     └─── Agent "coder" ─── workspace + agentDir + sessions

  ▲ Inbound messages routed by bindings (channel, accountId, peer, guild/team)
```

:::warning Never share `agentDir`
Two agents pointing at the same `agentDir` collide on auth and session state. Give each agent its own, or leave it unset and use the default path.
:::

---

## Configuration

### Defining Agents {#defining-agents}

The quickest route is the CLI, which creates the workspace and `agentDir` and can add a binding:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --model anthropic/claude-sonnet-5-5
openclaw agents add personal --bind telegram
openclaw agents list --bindings
```

In config, agents are a **keyed map** under `agents.entries`. A roster with more than one agent needs `ownership: "explicit"`, and `agents.defaults.systemAgent.agentId` names the agent that owns unbound traffic and system work:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: {
      model: "anthropic/claude-sonnet-5-5",
      systemAgent: { agentId: "alex" },
    },
    entries: {
      alex: {
        workspace: "~/.openclaw/workspace-alex",
        model: "anthropic/claude-opus-5-5",
      },
      mia: {
        workspace: "~/.openclaw/workspace-mia",
        model: "anthropic/claude-haiku-5-5",
      },
    },
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551230001" } },
    },
    { agentId: "mia", match: { channel: "telegram", accountId: "*" } },
    { agentId: "alex", match: { channel: "whatsapp", accountId: "*" } },
  ],
}
```

`agents.defaults` sets the baseline; each `agents.entries.<id>` overrides fields for that agent. Explicit per-agent lists such as `skills` replace the default rather than merging.

:::note Migrating from `agents.list`
The old `agents.list: [{ id, ... }]` array is retired and fails validation. `openclaw doctor --fix` converts it to `agents.entries`, adds `ownership: "explicit"` and writes explicit bindings for accounts that used to fall through to the first agent. Back up the config first and review the result with `openclaw agents list --bindings`.
:::

### Channel Bindings {#channel-bindings}

A binding maps an inbound message to an agent by `channel`, `accountId`, `peer` (`kind: "direct" | "group" | "channel"`), and optionally `guildId`, `teamId` or Discord `roles`. Rules (see [Agent bindings](https://docs.openclaw.ai/concepts/agent-bindings)):

- **Most specific wins.** Exact peer beats guild/team, which beats account, which beats channel-wide.
- **First match wins within a tier**, so put peer bindings above channel-wide rules.
- **All listed fields must match** (AND).
- **Omitting `accountId` matches only the channel's default account.** Use `accountId: "*"` for every account on the channel.
- With several agents and no matching binding, the message goes to `agents.defaults.systemAgent.agentId` if set; otherwise it is not dispatched.
- Bindings route; they are not access control. DM pairing and allowlists are still set per channel account.

### Per-Agent Identity {#per-agent-identity}

Each workspace holds its own identity files:

| File | Purpose |
|------|---------|
| **SOUL.md** | Personality, values, tone, boundaries |
| **IDENTITY.md** | Name, emoji, avatar |
| **AGENTS.md** | Operating instructions; the only file sub-agents receive |
| **USER.md** | Who the agent serves |
| **MEMORY.md** | Durable facts the agent and Dreaming maintain |

`openclaw agents set-identity` updates name, theme, emoji or avatar. See the [SOUL.md guide](/guides/soul-md).

### Separate Instances (Alternative) {#separate-instances-alternative}

For a hard boundary (separate processes, ports, credentials), run a second Gateway under its own profile instead of a second agent:

```bash
openclaw --profile work onboard
openclaw --profile work gateway install --port 19789
```

A profile uses its own state directory (`~/.openclaw-work`). You can also set `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` and `OPENCLAW_GATEWAY_PORT` directly. See [Multiple gateways](https://docs.openclaw.ai/gateway/multiple-gateways).

---

## Common Patterns

### Work + Personal Agents

Route Slack and Teams to a work agent, WhatsApp and Telegram to a personal one:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: { systemAgent: { agentId: "personal" } },
    entries: {
      work: { workspace: "~/.openclaw/workspace-work" },
      personal: { workspace: "~/.openclaw/workspace-personal" },
    },
  },
  bindings: [
    { agentId: "work", match: { channel: "slack", accountId: "*" } },
    { agentId: "work", match: { channel: "msteams", accountId: "*" } },
    { agentId: "personal", match: { channel: "whatsapp", accountId: "*" } },
    { agentId: "personal", match: { channel: "telegram", accountId: "*" } },
  ],
}
```

Give each agent a distinct `SOUL.md`: professional for work, casual for personal.

### Model Routing by Agent

Set the model per agent with provider-qualified refs. Expensive models go to agents that need reasoning; cheap ones to triage:

| Role | Model | Why |
|------|-------|-----|
| Lead / orchestrator | `anthropic/claude-opus-5-5` | Planning, delegation, synthesis |
| Specialist worker | `anthropic/claude-sonnet-5-5` | Balance of capability and cost |
| Triage, reviewer, heartbeat | `anthropic/claude-haiku-5-5` | Fast and cheap |
| Background checks | `ollama/<model>` | Local, no per-token cost |

### Orchestrator-Worker Pattern {#orchestrator-worker-pattern}

The built-in team preset creates a coordinator (chief of staff) plus researcher, writer and reviewer, each with its own workspace and role contract in `AGENTS.md`:

```bash
openclaw agents team create --non-interactive
openclaw agent --agent coordinator --message "Research the options and draft a recommendation."
```

The equivalent hand-written roster: the lead may delegate to the three specialists, and the specialists may not delegate further.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: {
      model: "anthropic/claude-sonnet-5-5",
      systemAgent: { agentId: "lead" },
    },
    entries: {
      lead: {
        workspace: "~/.openclaw/workspace-lead",
        model: "anthropic/claude-opus-5-5",
        subagents: {
          allowAgents: ["researcher", "writer", "reviewer"],
          delegationMode: "prefer",
        },
      },
      researcher: { workspace: "~/.openclaw/workspace-researcher", subagents: { allowAgents: [] } },
      writer: { workspace: "~/.openclaw/workspace-writer", subagents: { allowAgents: [] } },
      reviewer: {
        workspace: "~/.openclaw/workspace-reviewer",
        model: "anthropic/claude-haiku-5-5",
        subagents: { allowAgents: [] },
      },
    },
  },
}
```

`delegationMode: "prefer"` is prompt guidance, not a scheduler. Have workers write large output to files or git and hand back a short reference, so the lead's context does not fill up. See [`openclaw agents team create`](https://docs.openclaw.ai/cli/agents) and [Parallel specialist lanes](https://docs.openclaw.ai/concepts/parallel-specialist-lanes).

---

## Inter-Agent Communication

| Mechanism | What it does | Reference |
|-----------|--------------|-----------|
| Sub-agents (`sessions_spawn`) | Start a background run, optionally as another configured agent listed in `subagents.allowAgents`; results announce back to the requester | [Sub-agents](https://docs.openclaw.ai/tools/subagents) |
| `sessions_send` | Run a turn in another session on the same Gateway and optionally wait for the reply. Governed by `tools.agentToAgent` (on by default; restrict with `allow`, or set `enabled: false`) | [Session tools](https://docs.openclaw.ai/concepts/session-tool) |
| Swarm | Fan out sub-agents from a Code Mode script with structured results and bounded concurrency | [Swarm](https://docs.openclaw.ai/tools/swarm) |
| Workboard | Shared cards with dependencies, claims and run history | [below](#workboard-orchestration) |
| Shared files | Agents read and write a common directory. Simple, but no locking or notification | — |
| `openclaw agent --agent <id>` | Run one turn for a named agent from a script | [Agent send](https://docs.openclaw.ai/tools/agent-send) |

Sub-agent sessions receive only `AGENTS.md`, not `SOUL.md`, `IDENTITY.md`, `USER.md` or `MEMORY.md`. Put anything a worker must follow in `AGENTS.md`.

### MCP-Based Communication {#mcp-based-communication}

`openclaw mcp serve` exposes OpenClaw **channel conversations** over MCP to an MCP client. It does not export one agent's skills as tools and has no `--agent` flag. For agent-to-agent delegation on one Gateway, use sub-agents or `sessions_send`. See [`openclaw mcp`](https://docs.openclaw.ai/cli/mcp).

---

## Workboard Orchestration {#workboard-orchestration}

[Workboard](/guides/workboard) is a bundled plugin, disabled by default, that tracks work as cards with statuses, dependencies, claims and run history. Enable it with `openclaw plugins enable workboard`. For multi-agent work, three things matter:

- **Agents need the card tools allowed.** With the plugin enabled, agents get only the `workboard_sessions_board_*` tools. Add `tools: { alsoAllow: ["workboard"] }` to an orchestrator's `agents.entries.<id>` so it can create, link, claim and complete cards. Workers that Workboard starts from a card get `workboard_heartbeat`, `workboard_complete` and `workboard_block` for that card automatically.
- **Dependencies.** A child card linked to parents waits in `todo` until every parent is `done`; the next dispatch promotes it to `ready`.
- **Dispatch is triggered, not continuous.** Run `openclaw workboard dispatch`, use the dashboard, or send `/workboard dispatch`. One pass starts at most 3 workers by default (`--max-starts`), one card per owner or agent. The agent-side `workboard_dispatch` tool does not start workers.

```
Lead agent                   Workboard                  Specialist agents
    │                            │                            │
    ├── create card ────────────►│                            │
    │   "Research competitors"   │◄── claim ──────────────────┤ researcher
    ├── create + link card ─────►│                            │
    │   "Write report"           │   (todo until parent done) │
    │                            │◄── complete ───────────────┤ researcher
    │                            │── dispatch: child → ready  │
    │                            │◄── claim ──────────────────┤ writer
    │◄── notify ─────────────────│◄── complete ───────────────┤ writer
```

The [Workboard guide](/guides/workboard) has the card lifecycle, CLI, tool list and recipes, including a scheduled board review as an automation job (not a `HEARTBEAT.md` checklist, which is no longer read).

---

## Orchestration Tools

These are community projects, not part of OpenClaw. Read their code and install scripts before you run them, and run them against a test Gateway first.

### ClawTeam-OpenClaw {#clawteam-openclaw}

[ClawTeam-OpenClaw](https://github.com/win4r/ClawTeam-OpenClaw) (1,464 stars as of 2026-10-18; last push 2026-07-03) is a Python CLI where a leader agent spawns workers into git worktrees, with file-based inboxes (`clawteam inbox send`), a task board and a cost view.

:::warning Install from the repo
The project README warns that `pip install clawteam` installs a different upstream version and `npm install -g clawteam` is an unrelated package. Install from a clone:

```bash
git clone https://github.com/win4r/ClawTeam-OpenClaw.git
cd ClawTeam-OpenClaw
pip install -e .
```
:::

```bash
clawteam team spawn-team my-team -d "Build the auth module" -n leader
clawteam spawn --team my-team --agent-name alice --task "Implement OAuth2 flow"
clawteam board show        # terminal kanban
clawteam board serve --port 8080
clawteam board cost        # token and cost view
```

### Antfarm {#antfarm}

[Antfarm](https://github.com/snarktank/antfarm) (2,496 stars as of 2026-10-18; no push since 2026-02-26) installs YAML-defined agent teams (`feature-dev`, `security-audit`, `bug-fix`) into OpenClaw, with cron polling. It installs from GitHub, not npm: the `antfarm` package on npm is an unrelated project, so do not `npx antfarm`. Follow the install steps in the [Antfarm README](https://github.com/snarktank/antfarm#install) and read its install script before running it. It predates OpenClaw 2.0's keyed `agents.entries` roster, so check what it writes to your config: `openclaw doctor --lint` reports problems without changing anything, and `openclaw doctor --fix` migrates an old `agents.list`.

Other dashboards and hosted options are listed, unreviewed, on [Ecosystem](/reference/ecosystem). `abhi1693/openclaw-mission-control` is archived (its README says it moved to Wardn AI); do not deploy it for new setups.

---

## Production Patterns

### Multi-Agent DevOps Pipeline

A reviewer, tester and deployer, each bound to its own Slack or Discord channel (`peer: { kind: "channel", id: "<channel id>" }`), coordinated through Workboard cards: the reviewer creates a test card and a deploy card linked to it, so the deploy card waits in `todo` until tests are `done`. A reviewer automation (`openclaw automations add "*/15 * * * *" "Check for new PRs…" --agent reviewer`) starts the flow. Keep the deployer behind exec approvals.

### Customer Support Fleet

A cheap triage agent bound to the support channel classifies messages and hands off to specialists with `sessions_send` or sub-agents. Keep untrusted-input agents sandboxed with a narrow tool list:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: { systemAgent: { agentId: "personal" } },
    entries: {
      personal: { workspace: "~/.openclaw/workspace-personal" },
      support: {
        workspace: "~/.openclaw/workspace-support",
        model: "anthropic/claude-haiku-5-5",
        sandbox: { mode: "all", scope: "agent" },
        tools: {
          allow: ["read", "sessions_send"],
          deny: ["exec", "write", "edit", "apply_patch", "browser"],
        },
      },
    },
  },
  bindings: [
    { agentId: "support", match: { channel: "slack", accountId: "*", peer: { kind: "channel", id: "C0123SUPPORT" } } },
    { agentId: "personal", match: { channel: "telegram", accountId: "*" } },
  ],
}
```

See [Multi-agent sandbox and tools](https://docs.openclaw.ai/tools/multi-agent-sandbox-tools).

---

## Memory: Shared vs Isolated {#memory-shared-vs-isolated}

By default each agent has isolated memory: its own `MEMORY.md`, daily notes and search index in its own workspace. Built-in memory does not search another agent's corpus. Plugin-owned stores follow the plugin's config and are **not** split automatically.

| Need | Approach |
|------|----------|
| Agents keep their own context | Default |
| Shared reference material | Put it in a shared directory and add it to each agent's `memory.search.extraPaths` |
| Separate Memory Wiki per agent | `plugins.entries.memory-wiki.config.vault.scope: "agent"` ([Memory Wiki](https://docs.openclaw.ai/plugins/memory-wiki)) |
| External shared memory | Third-party systems; see [Memory Systems](/guides/memory-systems) |

Dreaming (memory consolidation) runs as one sweep with one `frequency`. The Control UI agent selector changes which agent you view, not its schedule.

---

## Heartbeats and Automations per Agent {#heartbeat-cost-multiplication}

Heartbeat config lives at `agents.defaults.heartbeat` and `agents.entries.<id>.heartbeat`. **If any agent has a `heartbeat` block, only those agents run heartbeats.** Each heartbeat is a full agent turn, so three agents every 30 minutes means 144 turns a day.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: {
      systemAgent: { agentId: "lead" },
      heartbeat: {
        every: "1h",
        activeHours: { start: "07:00", end: "23:00", timezone: "Europe/Berlin" },
        model: "anthropic/claude-haiku-5-5",
        isolatedSession: true,
      },
    },
    entries: {
      lead: {
        workspace: "~/.openclaw/workspace-lead",
        heartbeat: { every: "30m" },
      },
      worker: { workspace: "~/.openclaw/workspace-worker" },
    },
  },
}
```

Here only `lead` runs heartbeats, every 30 minutes, between 07:00 and 23:00, on Haiku, in a fresh session each time. `worker` has no heartbeat block, so it runs none. `every: "0m"` disables an agent's heartbeat.

Recurring checks are automation jobs, scheduled per agent with `--agent`:

```bash
openclaw automations add "0 8 * * 1-5" "Summarize overnight alerts" --name morning-ops --agent lead --session isolated
openclaw automations list --all
```

:::note Migrating from HEARTBEAT.md
`HEARTBEAT.md` is retired. `openclaw doctor --fix` imports each workspace's file into that agent's monitor scratch and converts legacy `tasks:` entries into automation jobs. A legacy bare `interval` number is read as **minutes**, so `interval: 1800` becomes a 30-hour job; check `openclaw automations list --all` after migrating. See [Heartbeat](/guides/heartbeat) and [Automation](/guides/automation).
:::

---

## Fleet Monitoring {#fleet-monitoring}

```bash
openclaw status                       # gateway, channels, agents
openclaw agents list --bindings       # roster and routing
openclaw channels status --probe      # channel connectivity and credentials
openclaw sessions --all-agents --active 60
openclaw automations list --all       # all jobs, including disabled ones
```

---

## Cost Optimization {#cost-optimization}

Anthropic measured agents using about 4x the tokens of a chat, and multi-agent systems about 15x ([same source](https://www.anthropic.com/engineering/multi-agent-research-system)). The main levers:

- **Model tiering:** set `model` per agent (table above).
- **Fewer heartbeats:** give heartbeat blocks only to agents that need them, lengthen `every`, set `activeHours`, use a cheap `heartbeat.model` and `isolatedSession: true`.
- **Small worker context:** sub-agents already get only `AGENTS.md`; keep it short.

Track spend per agent:

```bash
openclaw gateway usage-cost --agent lead --days 7
openclaw gateway usage-cost --all-agents --days 30
openclaw status --usage
```

In chat, `/usage cost` shows a local cost summary. See [Usage tracking](https://docs.openclaw.ai/concepts/usage-tracking) and [Cost Management](/guides/cost-management).

---

## Security Considerations {#security-considerations}

More agents means more attack surface:

- Every agent with exec runs commands as your OS user. A workspace is the default working directory, **not** a sandbox: absolute paths reach the rest of the host.
- Cross-agent session access (`tools.agentToAgent`) is on by default. A compromised agent can message others.
- A compromised or misrouted channel can reach the wrong agent through a broad binding.
- `SOUL.md` and `AGENTS.md` are persistent instructions and a target for prompt injection.

### Mitigations {#mitigations}

- Keep exec approvals on and use [sandboxing](https://docs.openclaw.ai/gateway/sandboxing) (`sandbox.mode: "all"`) for agents that handle untrusted input. See [Security Hardening](/security/hardening).
- Restrict tools per agent with `tools.allow` / `tools.deny`.
- Limit agent-to-agent access with `tools.agentToAgent.allow`, or disable it with `enabled: false`.
- Use a separate Gateway profile for agents that must never share a process or credentials.
- Keep workspaces in git so changes to identity files show up in `git diff`. File permissions are a weak guard: an agent with shell access can change them back.

---

## Choosing an Orchestration Approach

| Approach | Best for | Complexity |
|----------|----------|-----------|
| **Channel bindings** | Splitting by channel, account or contact | Low |
| **Team preset / sub-agents** | A lead that delegates bounded work | Low |
| **Workboard** | Tracked tasks with dependencies on one Gateway | Medium |
| **ClawTeam** (community) | Worktree-based coding swarms with a board UI | High |
| **Separate profiles** | Hard isolation between personas | Low, two processes |

Start with bindings and two or three agents. Add the team preset or Workboard when you need delegation or tracking.

---

## Quick Start: Your First Multi-Agent Setup

```bash
openclaw agents add assistant --workspace ~/.openclaw/workspace-assistant --bind telegram
openclaw agents add coder --workspace ~/.openclaw/workspace-coder --model anthropic/claude-sonnet-5-5 --bind discord
```

An equivalent hand-written config:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: {
      model: "anthropic/claude-sonnet-5-5",
      systemAgent: { agentId: "assistant" },
    },
    entries: {
      assistant: { workspace: "~/.openclaw/workspace-assistant" },
      coder: { workspace: "~/.openclaw/workspace-coder" },
    },
  },
  bindings: [
    { agentId: "assistant", match: { channel: "telegram", accountId: "*" } },
    { agentId: "coder", match: { channel: "discord", accountId: "*" } },
  ],
}
```

Edit each workspace's `SOUL.md` and `AGENTS.md`, then restart and verify:

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

---

## See Also

- [Multi-agent routing (official)](https://docs.openclaw.ai/concepts/multi-agent) and [Agent bindings](https://docs.openclaw.ai/concepts/agent-bindings)
- [Workboard Guide](/guides/workboard)
- [SOUL.md Guide](/guides/soul-md)
- [Heartbeat](/guides/heartbeat) and [Automation](/guides/automation)
- [Architecture Overview](/architecture/overview)
- [Channels & Integrations](/guides/channels)
- [Cost Management](/guides/cost-management)
- [Memory Systems Compared](/guides/memory-systems)
- [Monitoring & Observability](/guides/monitoring)
- [Security Hardening](/security/hardening)
