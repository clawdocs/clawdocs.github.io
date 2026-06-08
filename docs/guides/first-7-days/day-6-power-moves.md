---
sidebar_position: 7
title: "Day 6: Build Your Own"
description: "Create custom skills, set up cron jobs, and explore multi-agent workflows"
---

# Day 6: Build Your Own

You've been using your bot's built-in capabilities and community skills. Today you build something yourself — a custom skill tailored to exactly how you work. Then you learn cron jobs for precise scheduling and get a taste of multi-agent workflows.

**Time:** ~60 minutes

---

## Your First Custom Skill

Skills are Markdown files that teach your bot new capabilities. No code, no APIs, no build step — just a Markdown file with instructions.

### Step 1: Create the file

```bash
mkdir -p ~/.openclaw/skills
```

Create `~/.openclaw/skills/daily-standup.md`:

```markdown title="~/.openclaw/skills/daily-standup.md"
---
name: daily-standup
version: 1.0.0
description: Run a quick daily standup — what I did, what I'll do, blockers
trigger: "standup|stand-up|daily standup|what did i do"
tools: [memory, filesystem]
author: me
---

# Daily Standup

When the user triggers a standup, walk them through three questions:

## Steps

1. Ask: "What did you accomplish since last standup?"
2. Wait for their answer, then ask: "What are you working on next?"
3. Wait for their answer, then ask: "Any blockers or things you need help with?"
4. Summarize all three answers in a clean format:

```
## Standup — [today's date]
**Done:** [their answer]
**Next:** [their answer]
**Blockers:** [their answer or "None"]
```

5. Save the summary to `~/.openclaw/workspace/standups/[date].md`
6. If there are previous standups, briefly note what changed since last time

## Tone
Keep it quick and conversational. Don't over-formalize it.
```

### Step 2: Test it

Run the skill against a sample prompt without installing it:

```bash
openclaw skill test ~/.openclaw/skills/daily-standup.md "run my standup"
```

This loads the skill temporarily and runs the prompt through it. Verify the bot walks you through the three questions.

### Step 3: Install it

```bash
openclaw skill install ~/.openclaw/skills/daily-standup.md
```

```
✓ Installed "daily-standup" (v1.0.0)
  Triggers: standup, stand-up, daily standup, what did i do
```

Now just message your bot "standup" from any channel and it kicks off.

---

## Skill Ideas

Five practical skills you can build in the same format:

### Meeting summarizer

Trigger: `summarize meeting|meeting notes`

Paste in raw meeting notes or a transcript. The skill extracts attendees, key decisions, action items with owners, and open questions. Saves to `~/.openclaw/workspace/meetings/`.

### Code reviewer

Trigger: `review this code|code review`

Accept a diff or code block. Check for bugs, security issues, readability problems, and suggest improvements. Output a structured review with severity levels.

### Expense tracker

Trigger: `log expense|expense|spent`

Parse natural language like "spent $42 on lunch with client." Log to a CSV file. On request, generate a weekly or monthly summary grouped by category.

### Learning journal

Trigger: `learned|til|today i learned`

Capture what the user learned today in a structured entry. Append to `~/.openclaw/workspace/learning/journal.md`. Periodically review past entries and surface patterns.

### Deployment checklist

Trigger: `deploy|pre-deploy|deployment checklist`

Walk through a customizable checklist: tests passing, changelog updated, version bumped, migrations ready, rollback plan documented. Track completion and block on critical items.

:::tip
Start with one skill, use it for a week, then iterate. The best skills emerge from your actual workflow — not from a template.
:::

---

## Cron Jobs

The heartbeat (Day 3) runs tasks on a loose interval. Cron gives you precision: exact times, specific days, recurring schedules.

### Add a cron job

```bash
openclaw cron add "backup" \
  --schedule "0 2 * * *" \
  --prompt "Back up my important files to ~/backups with a timestamped folder name"
```

This runs every day at 2:00 AM. The schedule uses standard [cron syntax](https://crontab.guru/).

More examples:

```bash
# Weekly report every Friday at 5 PM
openclaw cron add "weekly-report" \
  --schedule "0 17 * * 5" \
  --prompt "Compile my weekly standup entries into a summary report and save to ~/reports/"

# Check disk space every 6 hours
openclaw cron add "disk-check" \
  --schedule "0 */6 * * *" \
  --prompt "Check disk usage. If any partition is above 85%, alert me on Telegram."

# Morning news digest on weekdays at 7:30 AM
openclaw cron add "morning-digest" \
  --schedule "30 7 * * 1-5" \
  --prompt "Search for the latest news in AI and open source, summarize the top 5 stories"
```

### Manage cron jobs

```bash
# List all scheduled jobs
openclaw cron list
```

```
NAME             SCHEDULE        NEXT RUN            STATUS
backup           0 2 * * *      Tomorrow 02:00      active
weekly-report    0 17 * * 5     Friday 17:00        active
disk-check       0 */6 * * *    Today 18:00         active
morning-digest   30 7 * * 1-5   Tomorrow 07:30      active
```

```bash
# Pause a job without deleting it
openclaw cron disable "backup"

# Resume it
openclaw cron enable "backup"

# Remove it entirely
openclaw cron remove "backup"

# Run a job immediately (useful for testing)
openclaw cron run "weekly-report"
```

### Cron vs. Heartbeat

| Feature | Heartbeat | Cron |
|---------|-----------|------|
| Timing | Approximate interval | Exact schedule |
| Setup | Simple toggle | Cron expression |
| Best for | Ambient tasks, monitoring | Scheduled reports, backups |
| Runs when | Bot is idle | Exact time, even if busy |

Use both. Heartbeat for "check on things periodically." Cron for "do this at exactly 5 PM every Friday."

---

## Multi-Agent Basics

So far you've been running one agent. OpenClaw supports multiple agents — each with its own personality, memory, and purpose — sharing a single gateway.

Why? Separation of concerns. A coding assistant and a personal scheduler have different needs. Splitting them keeps each one focused.

### Create a second agent

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    // Your main assistant (already exists)
    nova: {
      workspace: "~/.openclaw/workspace",
      channels: ["telegram", "discord"],
      model: "claude-sonnet"
    },
    // A focused coding agent
    coder: {
      workspace: "~/.openclaw/workspace-coder",
      channels: ["discord"],
      allowedChannels: ["code-review"],
      model: "claude-sonnet",
      soul: "You are a senior developer. Review code, suggest improvements, and help debug. No small talk."
    }
  }
}
```

Initialize the second agent's workspace:

```bash
openclaw agent init coder
```

Now `@Nova` in Discord's #general goes to your main agent, and messages in #code-review go to the coder agent. Each has separate memory and conversation history.

### Agent communication

Agents can talk to each other:

```
Hey Nova, ask Coder to review the diff I pasted in #code-review and send me a summary here
```

Nova delegates to Coder, waits for the result, and reports back.

:::info
Multi-agent is a deep topic. For routing rules, agent coordination patterns, and orchestration, see the full [Multi-Agent Workflows](/guides/multi-agent) guide.
:::

---

## Publishing to ClawHub

Built something useful? Share it with the community.

```bash
openclaw clawhub publish ~/.openclaw/skills/daily-standup.md
```

```
✓ Published "daily-standup" (v1.0.0)
  URL: https://clawhub.org/skills/daily-standup
  Install: openclaw skill install daily-standup
```

Before publishing:

- **Test thoroughly** — run `openclaw skill test` with multiple prompts
- **Write a clear description** — other users need to understand what it does
- **Set a version** — follow semver so updates don't break things
- **Add your name** — the `author` field in frontmatter

For the full publishing workflow, metadata options, and best practices, see the [Skill Development](/guides/skill-development) guide.

---

## What You've Done Today

- Built a custom skill from scratch using Markdown
- Learned the skill format: frontmatter + instructions
- Set up precise cron jobs for scheduled tasks
- Got an introduction to multi-agent workflows
- Learned how to share skills on ClawHub

You now know how to extend your bot to do anything you need. Tomorrow is about making sure it's all locked down and running efficiently.

**Next: [Day 7: Lock It Down](day-7-production) — security, costs, and monitoring**
