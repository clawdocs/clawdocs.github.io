---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: "Day 6: Build Your Own"
description: "Create a custom skill, schedule exact-time automations, and add a second agent"
keywords: [openclaw, advanced, power user, custom skills, multi-agent, cron jobs, skill development]
---

# Day 6: Build Your Own

You've used bundled and community skills. Today you write one yourself, schedule jobs at exact times, and add a second agent with its own workspace.

**Time:** ~60 minutes

---

## Your First Custom Skill

A skill is a folder with a `SKILL.md` file: YAML frontmatter plus Markdown instructions. No code and no build step ([Creating skills](https://docs.openclaw.ai/tools/creating-skills)).

### Step 1: Create the folder

```bash
mkdir -p ~/.openclaw/workspace/skills/daily-standup
```

### Step 2: Write SKILL.md

Create `~/.openclaw/workspace/skills/daily-standup/SKILL.md`:

````markdown title="~/.openclaw/workspace/skills/daily-standup/SKILL.md"
---
name: daily-standup
description: Run a quick daily standup (done, next, blockers) and save it to standups/.
---

# Daily Standup

Walk the user through three questions, one at a time.

## Steps

1. Ask: "What did you get done since the last standup?"
2. Wait for the answer, then ask: "What are you working on next?"
3. Wait for the answer, then ask: "Any blockers?"
4. Summarise all three answers in this format:

```
## Standup: YYYY-MM-DD
**Done:** ...
**Next:** ...
**Blockers:** ... (or "None")
```

5. Save the summary to `standups/YYYY-MM-DD.md` in the workspace.
6. If earlier standups exist in `standups/`, note briefly what changed since the last one.

## Tone
Quick and conversational. Don't over-formalise it.
````

Only `name` and `description` are required. Keep `name` the same as the folder name, in lowercase letters, digits and hyphens. The `description` is what the agent reads to decide when the skill applies, so make it say what the skill does and when. There are no `trigger`, `tools`, `version` or `author` fields. The optional keys are listed in the [SKILL.md reference](https://docs.openclaw.ai/tools/creating-skills#skillmd-reference).

The outer fence above uses four backticks because the skill contains its own code block. Copy only what is inside it.

### Step 3: Check that it loaded

```bash
openclaw skills list
openclaw skills info daily-standup
```

OpenClaw watches skill folders, so there's nothing to install. If you're in an existing conversation, send `/new` so the session picks up the new skill list.

### Step 4: Try it

From the TUI, the Control UI or any channel:

```text
/skill daily-standup
```

Skills can also register as their own command. Command names are sanitised to `a-z0-9_`, so this one shows up as `/daily_standup` where your channel lists commands. You can also just say "let's do my standup" and the agent should pick the skill from its description. To test from the command line:

```bash
openclaw agent --agent main --message "Run my daily standup"
```

---

## Skill Ideas

Five skills you can build the same way. Write the description so the agent knows when to use each one.

### Meeting summarizer

Paste raw notes or a transcript. The skill extracts attendees, decisions, action items with owners, and open questions, and saves them to `meetings/` in the workspace.

### Code reviewer

Accept a diff or code block. Check for bugs, security issues and readability, and output a structured review with severity levels. For pull requests, the bundled `github` skill already handles fetching diffs through `gh`.

### Expense tracker

Parse "spent $42 on lunch with a client" and append it to `expenses.csv`. On request, summarise by week or month and by category.

### Learning journal

Capture what you learned today as a structured entry in `learning/journal.md`, and surface patterns from earlier entries when asked.

### Deployment checklist

Walk through tests passing, changelog updated, version bumped, migrations ready and a rollback plan. The skill should only **ask and record**. Keep the actual deploy a human step: a skill's "stop and ask" is an instruction to the model, not an enforced gate.

:::tip
Start with one skill, use it for a week, then iterate. The best skills come from your actual workflow, not a template.
:::

---

## Automations (cron jobs) {#cron-jobs}

The heartbeat (Day 3) is a periodic check-in. **Automations** run a specific prompt on an exact schedule. The command is `openclaw cron`; `openclaw automations` is the same command ([Cron CLI](https://docs.openclaw.ai/cli/cron)).

### Add a job

Put the schedule first, then the prompt, then a name:

```bash
openclaw cron add "0 17 * * 5" \
  "Compile this week's files in standups/ into a short summary and save it to reports/" \
  --name "Weekly standup report" \
  --tools read,write
```

This runs every Friday at 17:00 in the Gateway host's timezone (add `--tz Europe/Berlin` to pin one). The schedule is standard [cron syntax](https://crontab.guru/). The positional schedule also takes an interval (`"every 6h"`) or a one-shot time (`"20m"`, or an ISO timestamp).

`--tools` limits the job to the tools it needs. Without it, the job gets the agent's full tool policy, which by default includes running shell commands without approval. Give scheduled jobs the smallest tool list that works ([job payloads](https://docs.openclaw.ai/automation/cron-jobs/payloads)).

More examples:

```bash
# Weekday news digest at 07:30
openclaw cron add "30 7 * * 1-5" \
  "Search for the latest news in AI and open source and summarise the top 5 stories with links" \
  --name "Morning digest" \
  --tools web_search,web_fetch
```

For a check a script can decide, such as disk usage, use a command job instead of giving a model `exec` ([Day 3](./day-3-automation.md#server-health-check)).

Results go to `--channel last` by default, which follows your recent conversation and fails closed if there is none. Add `--channel telegram --to <chatId>` to pin a destination, or `--no-deliver` to keep a job's output internal.

:::warning Jobs run unattended
A scheduled job that can run shell commands does it with nobody watching. Keep `exec` out of `--tools` unless the job needs it, and turn on exec approvals (`tools.exec.mode: "ask"`). With approvals on, an automation's exec request goes to the Control UI or a companion app (never to chat); if none is connected, it is denied. **Always allow** on that card mints a standing grant for that exact job and command ([standing grants](https://docs.openclaw.ai/tools/exec-approvals#standing-grants-for-automations)). See [Security Hardening: exec approvals](/security/hardening#exec-approvals). For backing up OpenClaw itself, use `openclaw backup create` rather than a prompt.
:::

### Manage jobs

Every job has an id. `enable`, `disable`, `run` and `rm` take the id, not the name:

```bash
# List jobs and their ids (add --all to include disabled ones)
openclaw cron list

# Run a job now to test it
openclaw cron run <jobId>

# See past runs and their results
openclaw cron runs <jobId>

# Pause and resume
openclaw cron disable <jobId>
openclaw cron enable <jobId>

# Delete
openclaw cron rm <jobId>
```

You can also ask in chat: "every Friday at 5pm, summarise my standups". The agent creates the automation with its automations tool.

### Automations vs. heartbeat

| | Heartbeat | Automation |
|---|---|---|
| Timing | Every `agents.defaults.heartbeat.every` (default `30m`), within `activeHours` | Exact cron expression, interval or one-shot time |
| What it does | Follows the monitor scratch checklist; replies `NO_REPLY` if nothing needs attention | Runs the prompt you gave it |
| Runs in | The main session by default; waits while the agent is busy | An isolated session when created from the CLI |
| Best for | "Anything I should know about?" | "Do this at 17:00 every Friday" |

The heartbeat is itself an automation now (it appears in `openclaw cron list --all` as `Heartbeat (main)`), but you configure it through `agents.defaults.heartbeat`, not as a job ([Heartbeat](https://docs.openclaw.ai/gateway/heartbeat)).

---

## Multi-Agent Basics

So far you've run one agent. One Gateway can host several, each with its own workspace (persona, memory, skills), sessions and model.

Why? A coding assistant and a personal scheduler need different instructions and different tool access. Splitting them keeps each one focused, and lets you lock down the one that reads untrusted input.

### Create a second agent

```bash
openclaw agents add coder \
  --workspace ~/.openclaw/workspace-coder \
  --model anthropic/claude-sonnet-5-5 \
  --non-interactive
openclaw agents list
```

This creates the workspace and its starter files. Give the coder its persona in `~/.openclaw/workspace-coder/SOUL.md`, for example "You are a senior developer. Review code, suggest improvements and help debug. No small talk."

### Route a channel to it

Agents don't pick channels themselves. **Bindings** decide which agent gets which messages. The most specific match wins ([Channel routing](https://docs.openclaw.ai/concepts/agent-bindings)). This config sends one Discord channel to `coder` and keeps everything else on `main`:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    // Required once there is more than one agent
    ownership: "explicit",
    defaults: {
      heartbeat: { agentId: "main" },
      systemAgent: { agentId: "main" },
    },
    entries: {
      // Your existing assistant, pinned to the workspace it already uses
      main: { workspace: "~/.openclaw/workspace" },
      coder: {
        workspace: "~/.openclaw/workspace-coder",
        model: { primary: "anthropic/claude-sonnet-5-5" },
      },
    },
  },
  bindings: [
    // One Discord channel goes to the coder (use your server and channel IDs)
    {
      agentId: "coder",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        peer: { kind: "channel", id: "222222222222222222" },
      },
    },
    // Everything else stays with main
    { agentId: "main", match: { channel: "discord", accountId: "*" } },
    { agentId: "main", match: { channel: "telegram", accountId: "*" } },
  ],
  talk: { agentId: "main" },
  tools: {
    // Which agents may message each other (omit allow to permit every pair)
    agentToAgent: { allow: ["main", "coder"] },
  },
}
```

`agents add` writes the `coder` entry for you. Compare your config with the block above and add the `bindings` by hand. Copy Discord IDs with Developer Mode on (right-click, **Copy ID**). Then check and restart:

```bash
openclaw config validate
openclaw agents bindings
openclaw gateway restart
```

With more than one agent, a message that matches no binding goes to `agents.defaults.systemAgent.agentId`; without that setting it has no owner and is not dispatched. Keep the catch-all `main` bindings anyway, so routing for each channel is explicit ([Multi-agent routing](https://docs.openclaw.ai/concepts/multi-agent)).

### Agent communication

Agents can message each other through session tools, and this is on by default:

```text
Ask the coder agent to review the diff I pasted in #code-review and send me a summary here.
```

`tools.agentToAgent.allow` limits which agents can talk. `tools.agentToAgent.enabled: false` turns it off. Restrict it when one agent handles untrusted content, so that agent can't pass instructions on to an agent with more power.

:::info
For routing tiers, per-agent tool policy and sandboxing, and coordination patterns, see the [Multi-Agent Workflows](/guides/multi-agent) guide.
:::

---

## Publishing to ClawHub

Built something useful? Publish it with the standalone ClawHub CLI:

```bash
npm i -g clawhub
clawhub login
clawhub skill publish ~/.openclaw/workspace/skills/daily-standup
```

The skill then lives at `https://clawhub.ai/<your-handle>/skills/daily-standup`, and others install it with `openclaw skills install @<your-handle>/daily-standup`.

Before publishing:

- **Test it** with a few different prompts, using `/skill daily-standup` and `openclaw agent --message`.
- **Write a clear description.** It is what other people's agents read to decide when to use your skill.
- **Remove anything personal**: paths, names, tokens.
- **Don't ask for more than the task needs.** Reviewers and scanners flag skills that download things or touch credentials.

`--version <version>` sets the version explicitly. See [Creating skills: publishing to ClawHub](https://docs.openclaw.ai/tools/creating-skills#publishing-to-clawhub) and the [Skill Development](/guides/skill-development) guide.

---

## What You've Done Today

- Built a custom skill as `skills/<name>/SKILL.md` and ran it with `/skill daily-standup`
- Scheduled exact-time automations with `openclaw cron add` and limited their tools
- Added a second agent and routed a channel to it with bindings
- Learned how to publish a skill to ClawHub

Tomorrow is about locking it all down and running it efficiently.

**Next: [Day 7: Lock It Down](day-7-production)**: security, costs and monitoring.
