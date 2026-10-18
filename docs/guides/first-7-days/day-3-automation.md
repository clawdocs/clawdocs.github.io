---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: "Day 3: Set It Free"
description: "Schedule automations for morning briefings and checks, and tune the heartbeat monitor so your bot reaches out on its own"
keywords: [openclaw, automation, automations, cron, heartbeat setup, scheduled tasks, morning briefing, proactive alerts]
---

# Day 3: Set It Free

Until now, your bot only talks when you talk first. Today you give it a schedule: **automations** that run at fixed times (a morning briefing, an hourly check), and the **heartbeat**, a periodic check-in that stays quiet unless something needs your attention.

**Time:** ~45 minutes

## Automations and the Heartbeat {#what-is-the-heartbeat}

OpenClaw has two kinds of scheduled work, and both are run by the Gateway's automations scheduler ([automation overview](https://docs.openclaw.ai/automation)):

| | Automations | Heartbeat |
|---|---|---|
| What it is | A job you create: a schedule plus a prompt (or a command) | One system-owned monitor job per agent |
| When it runs | Exactly when you say: `0 8 * * *`, `every 2h`, a one-shot `--at 20m` | Every `30m` by default (`1h` with Anthropic OAuth/token auth) |
| Where it runs | Its own isolated session by default | The agent's main session by default |
| What it does | Whatever the prompt says, then delivers the result | Checks its scratch notes and replies `NO_REPLY` if nothing needs attention |
| Use it for | Briefings, reports, recurring checks | "Is anything urgent?" sweeps, follow-ups on background work |

Rule of thumb: if the task has a time or interval in its name, it's an automation.

:::info Coming from an older guide?
Older OpenClaw versions read heartbeat tasks from a `HEARTBEAT.md` file in the workspace. That file was retired in 2026.8.1: OpenClaw no longer creates or reads it. If you still have one, run `openclaw doctor --fix`. Doctor imports its instructions into the heartbeat's monitor scratch, turns valid `tasks:` entries into automations, and archives the original ([retired HEARTBEAT.md](https://docs.openclaw.ai/reference/templates/HEARTBEAT)).
:::

## Before You Start: Where Messages Go

Scheduled work needs somewhere to send its results.

- **Heartbeat alerts** go to the owner's direct message, taken from `commands.ownerAllowFrom` (or a concrete channel `allowFrom`). Without an owner, heartbeat polls are skipped with `reason=no-route`. If you approved your own first Telegram DM with `openclaw pairing approve`, the owner is already set. Otherwise set it yourself, using your numeric Telegram user ID:

  ```bash
  openclaw config set commands.ownerAllowFrom '["telegram:123456789"]'
  ```

- **Automations** you create from a chat reply to that chat. Automations you create from the CLI need a route: pass `--channel telegram --to "<chat id>"` (for a DM with your bot, the chat ID is your user ID).

- **Times** use your timezone. Set `agents.defaults.userTimezone` (see [Day 1](./day-1-make-it-yours.md#tell-it-about-you)); automation cron expressions use the Gateway host's timezone unless you pass `--tz`.

## Your First Automation {#your-first-heartbeat}

The easiest way is to ask in chat:

```
Every weekday at 8am, send me the weather for Berlin and the top 5 Hacker News stories about AI.
```

The agent creates the automation with its `automations` tool and replies with the job details. The same job from the CLI:

```bash
openclaw cron add "0 8 * * 1-5" \
  "Send me the weather for Berlin and the top 5 Hacker News stories about AI, one line each." \
  --name "Morning brief" \
  --tz Europe/Berlin \
  --tools web_search,web_fetch,read \
  --channel telegram --to "123456789"
```

- The first argument is a standard 5-field cron expression; the second is the prompt.
- `--tools` caps what the job may use. A briefing that only reads the web has no reason to run shell commands. Without `--tools`, each run inherits the agent's full tool policy.
- `openclaw automations` is the same command as `openclaw cron`; use whichever reads better.

Email and calendar items need a skill that can reach them, such as the bundled `gog` (Google Workspace) skill. You'll set that up on [Day 4](./day-4-skills.md).

:::tip
**Test it now** instead of waiting until morning. Find the job ID, then run it once and wait for the result:

```bash
openclaw cron list
openclaw cron run <jobId> --wait
```
:::

## Practical Automation Ideas {#practical-heartbeat-ideas}

Each idea below is one command. Adjust the schedule, prompt and delivery target, or just describe the job to your bot in chat.

### Morning Briefing

```bash
openclaw cron add "0 8 * * *" \
  "Weather forecast for Berlin and the top 5 Hacker News stories about AI." \
  --name "Morning brief" --tools web_search,web_fetch,read \
  --channel telegram --to "123456789"
```

### GitHub Repo Monitoring

```bash
openclaw cron add "every 2h" \
  "Check github.com/myorg/myrepo for issues and PRs opened in the last 2 hours. Categorize each as bug, feature or question. Say if CI is failing on main. If there is nothing new, reply NO_REPLY." \
  --name "Repo watch" --tools web_fetch \
  --channel telegram --to "123456789"
```

Issue and PR text is written by strangers. Treat it as untrusted input: keep this job's tools to read-only web access, and don't give it a token that can merge or push. A `NO_REPLY` answer is not delivered, so quiet runs don't message you.

### Server Health Check

For checks with a clear pass/fail rule, a **command job** is safer and cheaper than a model run. It executes a fixed shell command on the Gateway host, with no model in the loop, and delivers its output. Output that is exactly `NO_REPLY` is suppressed:

```bash
openclaw cron add "0 * * * *" \
  --name "Disk check" \
  --command 'p=$(df --output=pcent / | tail -1 | tr -dc 0-9); if [ "$p" -gt 85 ]; then echo "Root disk at ${p}%"; else echo NO_REPLY; fi' \
  --announce --channel telegram --to "123456789"
```

`df --output` is GNU coreutils (Linux). On macOS, adapt the command. To check a remote server, run this script on that server instead of giving your bot an SSH key; the [server monitoring recipe](/guides/recipes/advanced-recipes) shows the guardrails if you do want agent-driven SSH.

### Price Monitoring

```bash
openclaw cron add "every 2h" \
  "Check the current BTC and ETH prices. Alert me only if BTC moved more than 5% since the previous check; otherwise reply NO_REPLY." \
  --name "Price watch" --tools web_search,web_fetch \
  --channel telegram --to "123456789"
```

Each run is isolated by default, so "since the previous check" only works if the agent can see earlier results. Add `--session session:price-watch` to give the job a persistent named session that keeps its history across runs, or have the prompt compare against a fixed threshold instead.

### Daily Journal Prompt

```bash
openclaw cron add "0 21 * * *" \
  "Ask me: What was the most interesting thing that happened today? And: What's one thing you want to do differently tomorrow?" \
  --name "Journal prompt" --tools "" \
  --channel telegram --to "123456789"
```

`--tools ""` disables all tools: this job only needs to send a message. Reply in your normal chat and ask the bot to save your answers to `journal/` in the workspace.

### Weekly Summary

```bash
openclaw cron add "0 18 * * 0" \
  "Read this week's daily notes in memory/ and list the top 3 things I worked on, plus one suggestion for next week." \
  --name "Weekly summary" --tools read,memory_search \
  --channel telegram --to "123456789"
```

## The Heartbeat Monitor {#heartbeat-configuration}

The heartbeat is on by default. Every `30m` it runs a short turn in the agent's main session with this built-in prompt: follow the monitor scratch if there is one, keep recurring work in automations, don't dig up old tasks from earlier chats, and reply `NO_REPLY` if nothing needs attention ([heartbeat](https://docs.openclaw.ai/gateway/heartbeat)). On a fresh install it mostly stays silent.

Tune it in `agents.defaults.heartbeat`:

```json5 title="~/.openclaw/openclaw.json"
{
  commands: {
    ownerAllowFrom: ["telegram:123456789"],
  },
  agents: {
    defaults: {
      userTimezone: "Europe/Berlin",
      heartbeat: {
        // How often it runs: a duration string. "0m" turns off the recurring cadence.
        every: "1h",
        // When it may run, in userTimezone. Outside this window, ticks are skipped.
        activeHours: { start: "07:00", end: "22:00" },
        // Skip the workspace bootstrap files on heartbeat runs.
        lightContext: true,
        // Fresh session each run instead of your full chat history.
        isolatedSession: true,
      },
    },
  },
}
```

Run `openclaw config validate` after editing. Unknown keys stop the Gateway from starting. The Gateway applies heartbeat changes on config reload, or run `openclaw gateway restart`.

`activeHours` says when the heartbeat **may** run. That is the opposite of the "quiet hours" setting in some older guides. Scheduled heartbeats also need automations enabled; they stop if `cron.enabled` is `false`.

### Give the heartbeat a checklist

The heartbeat's instructions live in its **monitor scratch**, a small private note stored in the Gateway's database. Find the heartbeat job (it is listed as `Heartbeat (main)`) and set the scratch:

```bash
openclaw cron list --all
openclaw cron scratch <heartbeatJobId> --set "If a background job I started has finished, tell me the result. Remind me of any reminder I asked for that is now due."
```

Keep scratch short and about *checking*, not *scheduling*. Anything with a time in it ("at 8am", "every Monday") belongs in an automation.

## Model Choice and Cost {#cost-warning}

**Don't put tool-using scheduled jobs on your cheapest model.** Automations and heartbeats run unattended, and the jobs above read web pages and issues written by other people. Upstream's security guidance is explicit: smaller, cheaper models are more susceptible to prompt injection and tool misuse, so use a current top-tier model for any agent that can run tools or reads untrusted content ([prompt injection](https://docs.openclaw.ai/gateway/security/prompt-injection)). A small model is fine for a job with `--tools ""` that only formats a message.

Control cost with scope instead:

1. **Run less often.** The heartbeat's `every: "1h"` halves the runs of the 30-minute default, and `activeHours` skips the night.
2. **Send less context.** A heartbeat in the main session carries your bootstrap files and conversation history on every run. `lightContext` and `isolatedSession` (above) shrink each run considerably. For automations, `--light-context` does the same.
3. **Use command jobs** for anything a script can decide. They make no model call.
4. **Narrow tools.** `--tools` keeps each job's tool list, and its tool schemas, small.

See what you are actually spending:

```bash
openclaw gateway usage-cost --days 7
```

In chat, `/usage cost` shows the same for the current session. For model options and prices, see the [Model Selection Guide](/guides/model-selection).

## Managing Automations {#cron-jobs}

Automations take a **job ID**, shown by `openclaw cron list`:

```bash
# List enabled jobs (add --all to include disabled ones and the heartbeat)
openclaw cron list

# Show one job, including its resolved delivery route
openclaw cron show <jobId>

# Pause and resume
openclaw cron disable <jobId>
openclaw cron enable <jobId>

# Delete
openclaw cron rm <jobId>
```

`openclaw cron edit <jobId>` changes the prompt, schedule, tools or delivery of an existing job. See the [automations CLI](https://docs.openclaw.ai/cli/cron) for every option.

## Debugging

If a scheduled job or the heartbeat isn't doing what you expect:

```bash
# Is the scheduler running, and when is the next run?
openclaw cron status

# Run history for one job (status, errors, delivery)
openclaw cron runs <jobId>

# Run a job right now and wait for it
openclaw cron run <jobId> --wait

# What did the last heartbeat do?
openclaw system heartbeat last

# Wake the heartbeat now with a one-off note
openclaw system event --text "Check whether my backup finished" --mode now

# Stream Gateway logs
openclaw logs --follow
```

Common issues:

- **Nothing runs:** Check that `openclaw gateway status` shows the Gateway running, and `openclaw cron status` shows the scheduler enabled. `cron.enabled: false` or `OPENCLAW_SKIP_CRON=1` turns scheduling off.
- **Heartbeat never messages you:** That is normal when nothing needs attention (`NO_REPLY`). If the logs show heartbeat polls skipped with `reason=no-route`, there is no owner to deliver to: set `commands.ownerAllowFrom`.
- **Automation runs but you get nothing:** Check the delivery column in `openclaw cron runs <jobId>`. CLI-created jobs need `--channel` and `--to`.
- **Wrong timing:** Check `--tz` on the job and `agents.defaults.userTimezone`. Heartbeats outside `activeHours` are skipped.
- **High costs:** Lower the frequency, add `lightContext`/`isolatedSession`, and move script-decidable checks to command jobs. Check `openclaw gateway usage-cost`.

For the full technical details, see the [Heartbeat Guide](/guides/heartbeat), [Heartbeat Architecture](/architecture/heartbeat), and upstream's [automation troubleshooting](https://docs.openclaw.ai/automation/cron-jobs/troubleshooting).

---

**Next: [Day 4: Supercharge It](day-4-skills)** — install skills to give your bot new abilities.
