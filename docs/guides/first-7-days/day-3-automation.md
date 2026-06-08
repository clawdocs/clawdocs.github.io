---
sidebar_position: 4
title: "Day 3: Set It Free"
description: "Automate daily tasks with the heartbeat system — morning briefings, monitoring, and proactive alerts"
---

# Day 3: Set It Free

Until now, your bot only talks when you talk first. Today you give it a pulse — a **heartbeat** that wakes it up on a schedule so it can check on things, brief you, and alert you without being asked.

## What Is the Heartbeat?

The heartbeat is OpenClaw's autonomous loop. On a configurable interval (every 30 minutes by default), the agent wakes up, reads a file called `HEARTBEAT.md`, and executes whatever instructions it finds there. Think of it as a cron job that speaks natural language.

The cycle is simple:

1. Timer fires
2. Agent reads `~/.openclaw/workspace/HEARTBEAT.md`
3. Agent executes each instruction
4. Agent sends results to your configured channel (Telegram, Discord, etc.)
5. Agent goes back to sleep

No code required — you write plain Markdown.

## Your First Heartbeat

Create the heartbeat file:

```bash
mkdir -p ~/.openclaw/workspace
nano ~/.openclaw/workspace/HEARTBEAT.md
```

Paste this starter template:

```markdown title="~/.openclaw/workspace/HEARTBEAT.md"
## Every morning at 8am
- Check the weather for my city
- Summarize my unread emails
- List my calendar events for today
```

Restart the gateway to pick up the new file:

```bash
openclaw gateway restart
```

That's it. Tomorrow morning at 8am, you'll get a briefing without lifting a finger.

:::tip
**Test it now** instead of waiting until morning:
```bash
openclaw heartbeat --now
```
This runs one heartbeat cycle immediately so you can see the output.
:::

## Heartbeat Configuration

Control how the heartbeat behaves in your config file:

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    // How often the heartbeat fires (in minutes)
    "interval": 60,

    // Don't wake up while you're sleeping
    "quiet_hours": {
      "start": "22:00",
      "end": "07:00"
    },

    // Use a cheap model for heartbeat — it runs often
    "model": "google/gemini-2.5-flash"
  }
}
```

The `model` override is important. Your main brain might be Claude Sonnet or Opus, but the heartbeat fires repeatedly and doesn't need top-tier reasoning for most checks. See the [Model Selection Guide](/guides/model-selection) for cheap model options.

## Practical Heartbeat Ideas

Copy any of these into your `HEARTBEAT.md` and adapt to your needs.

### Morning Briefing

```markdown
## Morning briefing (daily at 8am)
- Weather forecast for Berlin
- Top 5 Hacker News stories about AI
- My Google Calendar events for today
- Any unread emails from my VIP contacts
```

### GitHub Repo Monitoring

```markdown
## GitHub monitor (every heartbeat)
- Check github.com/myorg/myrepo for new issues and PRs since last check
- Summarize any new issues — categorize as bug, feature, or question
- Alert me immediately if CI is failing on main branch
```

### Server Health Check

```markdown
## Server health (hourly)
- SSH to myserver.com and check disk usage — alert if any partition > 85%
- Check RAM usage — alert if > 90%
- Check uptime — alert if server was recently rebooted
- Verify nginx is running and responding on port 443
```

### Price Monitoring

```markdown
## Price watch (every 2 hours during market hours)
- Check BTC and ETH prices
- Alert me if BTC moves more than 5% in either direction since last check
- Check if the Sony WH-1000XM6 has dropped below $300 on Amazon
```

### Daily Journal Prompt

```markdown
## Journal prompt (daily at 9pm)
- Ask me: "What was the most interesting thing that happened today?"
- Ask me: "What's one thing you want to do differently tomorrow?"
- Save my responses to ~/journal/2026-06-08.md (use today's date)
```

### Weekly Summary

```markdown
## Weekly summary (every Sunday at 6pm)
- Summarize my git commits across all repos this week
- Count how many messages I exchanged with you
- List the top 3 tasks I completed
- Suggest one thing I should focus on next week
```

## Cost Warning

The heartbeat runs every 30 minutes by default. Even with a cheap model, this adds up.

**The math:** 48 heartbeat runs per day x ~500 tokens per run = ~24,000 tokens/day. At Gemini Flash rates ($0.20/M tokens), that's about **$0.15/month** — negligible. But with Claude Sonnet at $9/M tokens, the same pattern costs **$6.50/month** just for heartbeat.

Three ways to keep costs down:

1. **Use a cheap model for heartbeat** (shown in config above)
2. **Increase the interval** — 60 minutes instead of 30 cuts costs in half
3. **Set quiet hours** — no point checking while you sleep

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "interval": 60,
    "model": "ollama/qwen3:14b",  // Free if running locally
    "quiet_hours": {
      "start": "23:00",
      "end": "07:00"
    }
  }
}
```

Use `openclaw stats heartbeat` to see what your heartbeat is actually costing you.

## Cron Jobs

For tasks that need more precise scheduling than "every N minutes," use `openclaw cron`. This gives you full cron syntax:

```bash
# Run a task at exactly 9:15am on weekdays
openclaw cron add "15 9 * * 1-5" "Check my work email and summarize anything urgent"

# List active cron jobs
openclaw cron list

# Remove a cron job
openclaw cron remove <job-id>
```

Cron jobs bypass the heartbeat entirely — they fire at the exact time you specify and run the quoted instruction as a one-shot task.

## Debugging

If your heartbeat isn't working as expected:

```bash
# Dry run — shows what the agent would do without executing anything
openclaw heartbeat --now --dry-run

# Run one heartbeat cycle immediately (actually executes)
openclaw heartbeat --now

# Stream heartbeat logs in real time
openclaw logs --filter heartbeat --follow

# Check heartbeat stats (last run time, token usage, errors)
openclaw stats heartbeat
```

Common issues:

- **Heartbeat not firing:** Check that `openclaw status` shows the gateway running. Restart with `openclaw gateway restart`.
- **No output:** Make sure you have a channel configured. The heartbeat sends results to your default channel.
- **Wrong timing:** Quiet hours might be suppressing runs. Check your config.
- **High costs:** Switch to a cheaper model or increase the interval. Run `openclaw stats heartbeat` to see actual spend.

For the full technical details, see the [Heartbeat Guide](/guides/heartbeat) and [Heartbeat Architecture](/architecture/heartbeat).

---

**Next: [Day 4: Supercharge It](day-4-skills)** — install community skills to give your bot new abilities.
