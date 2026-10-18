---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Heartbeat Guide
description: How OpenClaw's heartbeat works in v2026.10 — agents.defaults.heartbeat, monitor scratch, automation jobs for recurring checks, cost control, and migrating from HEARTBEAT.md
keywords: [openclaw, openclaw heartbeat, monitor scratch, automations, activeHours, HEARTBEAT.md migration]
---

# Heartbeat Guide

The heartbeat is a periodic agent turn in the main session. It lets the agent notice things that need your attention and stay quiet otherwise. Since OpenClaw 2.0 (v2026.8.1) it is one kind of [automation](/guides/automation): the scheduler that runs your cron jobs also runs the heartbeat.

Two points shape everything on this page:

- **Heartbeat has one cadence per agent.** "Check email every 30 minutes" and "brief me at 8am" are not heartbeat tasks. Each is its own automation job with its own schedule and run history.
- **`HEARTBEAT.md` is retired.** OpenClaw no longer creates or reads it. The heartbeat's checklist now lives in the **monitor scratch**, a small text record in the state database. See [Migrating from HEARTBEAT.md](#migrating-from-heartbeatmd).

The official reference is [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat). This guide summarises it, adds recipes, and flags the gotchas.

---

## How heartbeat works

1. You configure `agents.defaults.heartbeat` (or `agents.entries.<id>.heartbeat`) in `openclaw.json`.
2. The Gateway keeps one system-owned automation job per heartbeat-enabled agent. It shows up in `openclaw cron list --all` as `Heartbeat (<agent-id>)`. Edit the config, not this job.
3. On each tick, the agent gets one turn in its main session. The prompt is the default heartbeat prompt plus the monitor scratch, if any.
4. If nothing needs attention, the agent replies `NO_REPLY` (or calls the `heartbeat_respond` tool with `notify: false`) and nothing is sent. Otherwise the alert goes to the delivery target, which by default is the owner's direct message.

Defaults worth knowing:

| Setting | Default |
|---|---|
| Cadence (`every`) | `30m`; `1h` when Anthropic auth resolves to OAuth/token (including Claude CLI reuse) and you have not set `every` |
| Delivery (`target`) | `owner`: the first concrete entry in `commands.ownerAllowFrom`, then a channel `allowFrom`. Never a group |
| Timeout | `agents.defaults.timeoutSeconds` if set, otherwise the cadence capped at 600 seconds |
| Active hours | None (runs around the clock) |

Heartbeats only run when automations run. With `cron.enabled: false` or `OPENCLAW_SKIP_CRON=1`, the Gateway logs a warning and skips scheduled heartbeats. There is no fallback timer.

---

## Quick setup {#quick-setup}

Set the cadence and tell OpenClaw who the owner is:

```json5 title="~/.openclaw/openclaw.json"
{
  commands: {
    // Your own account on a channel; heartbeat alerts go here by default
    ownerAllowFrom: ["telegram:123456789"],
  },
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        isolatedSession: true, // fresh session each run: far fewer tokens
        lightContext: true,    // skip workspace bootstrap files
        activeHours: { start: "07:00", end: "22:00" },
      },
    },
  },
}
```

Or set the owner from the CLI (the value is a JSON array, even with one entry):

```bash
openclaw config set commands.ownerAllowFrom '["telegram:123456789"]'
openclaw gateway restart
```

Then give the heartbeat a short checklist. Find the monitor's job id, and write the scratch:

```bash
openclaw cron list --all            # find "Heartbeat (main)" and its id
openclaw cron scratch <jobId> --set "- Anything urgent in my inbox or calendar? Alert me.
- If a task is blocked, say what is missing."
```

Trigger a heartbeat now instead of waiting for the next tick:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system heartbeat last
```

There is no `openclaw heartbeat` command and no dry-run mode. `openclaw system heartbeat enable|disable|last` and `openclaw system event` are the manual controls.

:::warning Without an owner there are no heartbeats
If OpenClaw cannot resolve an owner DM, ambient heartbeat polls are skipped with `reason=no-route` before the model runs. A wildcard-only `allowFrom` does not identify an owner. Set `commands.ownerAllowFrom`, or choose an explicit `target` and `to` (see the [configuration reference](#complete-configuration-reference)).
:::

---

## Monitor scratch {#heartbeat-file-formats}

Each heartbeat job owns a private scratch in the shared state database. When it exists, its text is appended to the heartbeat prompt. Keep it to a few lines: it is read on every tick.

```bash
openclaw cron scratch <jobId>                       # print it
openclaw cron scratch <jobId> --set "..."           # replace with exact text
openclaw cron scratch <jobId> --file checklist.md   # replace from a file (- for stdin)
openclaw cron scratch <jobId> --unset               # remove it
```

Writes accept `--expected-revision <n>` to fail rather than overwrite a concurrent edit. Scratch is capped at 256 KiB. The agent can also replace its own scratch during a heartbeat by passing `scratch` to `heartbeat_respond`.

Behaviour to know:

- If scratch exists but is effectively empty (blank lines, comments, headings, empty checklist items), the run is skipped to save a model call (`reason=empty-heartbeat-file`).
- If there is no scratch at all, the heartbeat still runs with the default prompt, which tells the agent not to invent tasks from old chats.
- Scratch is prompt context, not a scheduler. Headings like "hourly" or "daily at 8am" in scratch do nothing. Use [automation jobs](#recipes) for anything with its own schedule.

:::danger No secrets in scratch
Scratch becomes part of the prompt. Do not put API keys, tokens or phone numbers in it.
:::

### Migrating from HEARTBEAT.md {#migrating-from-heartbeatmd}

If you used `~/.openclaw/workspace/HEARTBEAT.md` (or a per-agent workspace copy) before v2026.8.1, stop the Gateway and run Doctor:

```bash
openclaw gateway stop
openclaw doctor --fix
openclaw gateway start
```

Doctor needs exclusive access to the state database. With the Gateway running, `doctor --fix` exits with `GatewayStateOwnerContentionError` and changes nothing.

Doctor only imports into an empty scratch. If the heartbeat already has different scratch, or you cleared it with `--unset`, Doctor warns and leaves `HEARTBEAT.md` where it is; copy what you need with `openclaw cron scratch <jobId> --file ~/.openclaw/workspace/HEARTBEAT.md`.

Doctor creates the monitor rows from `agents.*.heartbeat`, imports each workspace `HEARTBEAT.md` into that agent's monitor scratch, converts a structured `tasks:` block into separate automation jobs, archives the original under the state directory (`backups/heartbeat-migration/`), and deletes the file. After that the runtime reads scratch only.

:::warning Bare `interval` numbers are read as minutes
The legacy `tasks:` format took a duration string for `interval`. Doctor parses it with minutes as the default unit, so a bare number is **minutes**, not seconds. Older guides (including earlier versions of this site) showed `interval: 1800` meaning 30 minutes; Doctor turns that into a job that runs every **1800 minutes (30 hours)**, and `interval: 900` into every 15 hours. Before running `openclaw doctor --fix`, rewrite every interval with an explicit unit (`30m`, `1h`, `15m`), or fix the jobs afterwards with `openclaw cron edit <jobId> --every 30m`. The same default applies to `agents.defaults.heartbeat.every`: `"30"` means 30 minutes.
:::

The same migration applies if your config still has a top-level `heartbeat` key. Current OpenClaw refuses that key. Move its settings under `agents.defaults.heartbeat`, renaming as you go: `interval` (seconds) becomes `every` (a duration string such as `"30m"`), and `quiet_hours` becomes `activeHours` with the window inverted: quiet 22:00–07:00 is active `07:00`–`22:00`.

---

## Quiet replies and visibility {#heartbeat_ok--suppressing-noise}

- The agent replies `NO_REPLY` when nothing needs attention, or calls `heartbeat_respond` with `notify: false`. For an alert it returns only the alert text, or calls `heartbeat_respond` with `notify: true` and `notificationText`.
- `HEARTBEAT_OK` is the legacy acknowledgment. Custom prompts that still return it work: OpenClaw drops the reply when `HEARTBEAT_OK` is at the start or end and the rest is at most 300 characters. That budget is fixed; there is no `ackMaxChars` setting.

Visibility is a channel setting, not a heartbeat setting:

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    defaults: {
      heartbeatVisibility: {
        showOk: false,      // hide OK acknowledgments (default)
        showAlerts: true,   // deliver alerts (default)
        useIndicator: true, // emit UI indicator events (default)
      },
    },
  },
}
```

Override per channel (`channels.<channel>.heartbeatVisibility`) or per account (`channels.<channel>.accounts.<id>.heartbeatVisibility`). If all three flags are false, the heartbeat is skipped entirely (`reason=alerts-disabled`).

---

## Recipes: recurring checks as automations {#recipes}

Each check below is its own automation job. It has its own schedule, can use a cheaper model, and appears in `openclaw cron runs`. `openclaw automations` is an alias of `openclaw cron`, and `create` is an alias of `add`. Positional arguments are the schedule (`"every 30m"`, a cron expression, `"20m"` for one-shot) and the prompt.

| Check | Command |
|---|---|
| Email triage | `openclaw automations add "every 30m" "Check Gmail for unread mail from my VIP list. Summarise anything urgent; otherwise reply NO_REPLY." --name email-triage --session isolated --announce --channel telegram --to "123456789"` |
| GitHub monitor | `openclaw automations add "every 1h" "List new issues and PRs in myorg/myrepo since the last run and flag any failing CI on main." --name github-watch --session isolated --announce --channel discord --to "channel:123456789012345678"` |
| Morning briefing | `openclaw automations add "0 8 * * *" "Brief me on today's calendar, weather and top AI news." --name morning-brief --tz "America/New_York" --session isolated --announce --channel telegram --to "123456789"` |
| System health | `openclaw automations add "every 1h" --name system-health --command "df -h / && docker ps --format '{{.Names}} {{.Status}}'" --announce --channel telegram --to "123456789"` |
| Weekday code health | `openclaw automations add "0 6 * * 1-5" "Run the test suite in ~/projects/main-app and report new failures." --name code-health --session isolated --model anthropic/claude-sonnet-5-5 --announce --channel slack --to "channel:C1234567890"` |

Notes:

- `--session isolated` runs each job in a fresh session. Use `--session main --system-event "..."` when a reminder should land in the main conversation instead.
- `--command` runs a shell command on the Gateway host with no model call; its output is delivered as-is.
- Keep cron expressions inside waking hours (as in `0 8 * * *`) instead of relying on heartbeat `activeHours`, which applies only to the heartbeat and to jobs Doctor migrated from `tasks:`.
- Manage jobs with `openclaw cron list --all`, `openclaw cron disable <jobId>`, `openclaw cron enable <jobId>`, `openclaw cron run <jobId> --wait` and `openclaw cron rm <jobId>`.

:::warning Approvals and sandboxing
Recipes like these give an unattended agent email, shell or home-device access on a schedule. Keep exec approvals on for anything that writes, limit each job's tools with `--tools`, and treat fetched email and web content as untrusted input. See [Security hardening](/security/hardening).
:::

More examples and the full flag list: [Automation Guide](/guides/automation) and [Manage automations](https://docs.openclaw.ai/automation/cron-jobs/managing-jobs).

---

## Cost optimization {#cost-optimization}

Each heartbeat is a full agent turn. At the 30-minute default that is 48 turns a day per agent, before any automation jobs.

| Lever | Setting | Effect |
|---|---|---|
| Isolated session | `isolatedSession: true` | No conversation history in the prompt (upstream: about 100K tokens down to 2–5K per run) |
| Light context | `lightContext: true` | Skips workspace bootstrap files; monitor scratch is still injected |
| Cheaper model | `model: "anthropic/claude-haiku-5-5"` or `"ollama/<model>"` | Lower price per run |
| Longer cadence | `every: "1h"` | Half the runs of `30m` |
| Active hours | `activeHours: { start: "07:00", end: "22:00" }` | No runs overnight |
| Small scratch | — | Smaller prompt every tick |
| Off | `every: "0m"` | Disables the recurring cadence; event-driven wakes still work |

A cost-conscious setup:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      heartbeat: {
        every: "1h",
        model: "anthropic/claude-haiku-5-5",
        isolatedSession: true,
        lightContext: true,
        activeHours: {
          start: "07:00",
          end: "22:00",
          timezone: "America/New_York", // optional; defaults to agents.defaults.userTimezone, then host time
        },
      },
    },
  },
}
```

`activeHours` is an allow-window: `start` is inclusive, `end` is exclusive, and `24:00` is allowed as an end. Outside the window, ticks are skipped until the next tick inside it. Do not set `start` equal to `end`: that is a zero-width window and the heartbeat never runs.

:::caution Heartbeat model bleed
Without `isolatedSession`, a heartbeat that switches the main session to a small model can leave that model in place for your next message. A local model with a 32K window can then overflow on a long session. Use `isolatedSession: true`, or pick a heartbeat model with a large enough context window.
:::

For per-token prices, check your provider's pricing page; this guide does not quote them. See [Cost Management](/guides/cost-management).

---

## Multi-agent heartbeat {#multi-agent-heartbeat}

`agents.defaults.heartbeat` applies to every agent. A `heartbeat` block under `agents.entries.<id>` merges on top of it. If **any** agent has its own `heartbeat` block, **only those agents** run heartbeats.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: {
      systemAgent: { agentId: "main" },
      heartbeat: { every: "30m", isolatedSession: true },
    },
    entries: {
      main: { workspace: "~/.openclaw/workspace" },
      ops: {
        workspace: "~/.openclaw/workspace-ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "123456789",
          timeoutSeconds: 45,
        },
      },
    },
  },
}
```

Here only `ops` runs a heartbeat; `main` does not, because it has no block of its own. Give an agent `heartbeat: { every: "0m" }` to turn its recurring cadence off explicitly. Per-agent recurring checks are automation jobs with `--agent <id>`.

Scheduled heartbeats do not queue behind other work. A plain heartbeat poll is skipped and waits for its next tick while the main queue or any automation work is busy, or that agent has an active run. (After 2026.10.4, only automation work that targets the same agent or session pauses a heartbeat.) Bindings and their precedence route inbound messages; they do not affect heartbeats.

Multi-agent setup in general: [Multi-Agent Guide](/guides/multi-agent).

---

## Dreaming is not part of heartbeat {#dreaming-mode}

Memory consolidation ("Dreaming") is a feature of the `memory-core` plugin with its own schedule (`plugins.entries.memory-core.config.dreaming`). It has been on by default since v2026.8.1 and is independent of the heartbeat. See [Dreaming](https://docs.openclaw.ai/concepts/dreaming) and the [Memory Systems guide](/guides/memory-systems).

---

## Debugging {#debugging}

```bash
# Follow the gateway log
openclaw logs --follow

# Last heartbeat event and its outcome
openclaw system heartbeat last --json

# The heartbeat monitor job and its run history
openclaw cron list --all
openclaw cron runs <jobId> --limit 10
openclaw cron runs <jobId> --status skipped

# Validate the config after editing
openclaw config validate
```

Common skip reasons:

| Reason | Meaning | Fix |
|---|---|---|
| `no-route` | No owner DM or external route to deliver to | Set `commands.ownerAllowFrom`, or `target` + `to` |
| `empty-heartbeat-file` | Monitor scratch exists but is effectively empty | Add a real line, or `--unset` it |
| `alerts-disabled` | `showOk`, `showAlerts` and `useIndicator` are all false | Turn one back on |
| `dm-blocked` | `directPolicy: "block"` suppressed a DM delivery | Use `allow`, or deliver to a non-DM target |
| `background-work` | The heartbeat started background work without sending an update | Check the task; this is not an all-clear |

Checklist when nothing happens:

1. `openclaw config validate` passes, and the config has no top-level `heartbeat` key.
2. `openclaw cron list --all` shows an enabled `Heartbeat (<agent>)` job. If not, stop the Gateway and run `openclaw doctor --fix`.
3. `cron.enabled` is not `false` and `OPENCLAW_SKIP_CRON` is not set.
4. `every` is not `"0m"`, and the current time is inside `activeHours`.
5. An owner route resolves (no `no-route` skips in `openclaw cron runs`).
6. In a multi-agent setup, the agent you expect actually has a heartbeat block.

---

## Complete configuration reference {#complete-configuration-reference}

The heartbeat schema is strict: only these fields are accepted.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",                // duration; default unit minutes; "0m" disables the cadence
        activeHours: { start: "07:00", end: "22:00", timezone: "Europe/Berlin" },
        model: "anthropic/claude-haiku-5-5", // provider/model override for heartbeat runs
        session: "main",             // session key for the run context
        target: "owner",             // owner (default) | last | none | <channel id>
        to: "123456789",             // recipient when target is a channel id
        accountId: "ops-bot",        // account on a multi-account channel
        directPolicy: "allow",       // allow (default) | block
        prompt: "Follow the heartbeat monitor scratch context when provided. If nothing needs attention, reply NO_REPLY.",
        timeoutSeconds: 120,
        lightContext: true,
        isolatedSession: true,
      },
    },
  },
}
```

`prompt` replaces the default prompt entirely; it is not merged. The default also reminds the agent that recurring work belongs in automations, so keep that sentence if you write your own. Per-agent overrides use the same fields under `agents.entries.<id>.heartbeat`. Visibility flags live under `channels.*.heartbeatVisibility` (see [above](#heartbeat_ok--suppressing-noise)).

---

## See also

- [Heartbeat Architecture](/architecture/heartbeat): how the monitor fits into the Gateway
- [Automation Guide](/guides/automation): automation jobs, webhooks and triggers
- [Multi-Agent Guide](/guides/multi-agent): per-agent heartbeats and jobs
- [Cost Management](/guides/cost-management): reducing heartbeat spend
- [Model Selection](/guides/model-selection): choosing a heartbeat model
- Official docs: [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat), [Automation](https://docs.openclaw.ai/automation), [`openclaw system`](https://docs.openclaw.ai/cli/system), [Timezone](https://docs.openclaw.ai/concepts/timezone)
