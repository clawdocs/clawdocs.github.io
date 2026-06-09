---
sidebar_position: 4
title: Heartbeat Guide
description: Practical recipes and configuration for OpenClaw's autonomous heartbeat system — structured tasks, cost optimization, and advanced patterns
keywords: [openclaw, openclaw heartbeat, autonomous tasks, background tasks, scheduled tasks, cron]
---

# Heartbeat Guide

The heartbeat transforms OpenClaw from a reactive chatbot into a proactive agent that works while you're away. This guide covers setup, recipes, cost control, and advanced patterns.

---

## How Heartbeat Works

The heartbeat fires on a timer (default: every 30 minutes, 60 minutes for OAuth-authenticated channels) and executes the tasks defined in your `HEARTBEAT.md` file.

### Lifecycle

1. **Timer fires** — the gateway triggers a heartbeat cycle
2. **Tasks load** — OpenClaw reads `~/.openclaw/HEARTBEAT.md`
3. **Execution** — each task runs in the main session (not a background process)
4. **Response** — results are sent to your configured channels or suppressed via `HEARTBEAT_OK`
5. **Wait** — timer resets for the next cycle

:::info
The heartbeat runs in your **main session**, sharing context with your primary conversation. This means heartbeat tasks can reference memories, recent conversations, and session state.
:::

---

## Quick Setup

```bash
# Create your heartbeat file
vim ~/.openclaw/HEARTBEAT.md

# Restart the gateway to pick up changes
openclaw gateway restart

# Test immediately (doesn't wait for timer)
openclaw heartbeat --now

# Dry run (shows what would happen)
openclaw heartbeat --dry-run
```

---

## Heartbeat File Formats

### Simple Format (Markdown)

The original format — write tasks as Markdown headings and bullet points:

```markdown title="~/.openclaw/HEARTBEAT.md"
## Email Triage (every heartbeat)
- Check Gmail for new unread emails
- Flag emails from VIPs: boss@company.com, cto@company.com
- Send me a WhatsApp summary of flagged emails
- Mark promotional emails as read

## System Health (hourly)
- Check disk usage, alert if any partition > 85%
- Check Docker container health
- Monitor RAM usage, alert if > 90%
```

### Structured Format (since v2026.3.10)

The structured format gives you fine-grained control over each task's name, interval, and prompt:

```markdown title="~/.openclaw/HEARTBEAT.md"
---
tasks:
  - name: email-triage
    interval: 1800
    prompt: |
      Check Gmail for unread emails. Flag anything from boss@company.com
      or cto@company.com. Send a WhatsApp summary of flagged emails.
      Mark promotional emails as read.

  - name: system-health
    interval: 3600
    prompt: |
      Check disk usage on all partitions, alert if any exceeds 85%.
      Verify Docker containers are healthy. Monitor RAM, alert if > 90%.

  - name: github-watch
    interval: 900
    prompt: |
      Check github.com/myorg/myrepo for new issues and PRs since last check.
      Categorize issues as bug/feature/question. Alert on failing CI.
---
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique task identifier (used in logs and stats) |
| `interval` | number | Seconds between runs (overrides global interval) |
| `prompt` | string | The instruction to execute each cycle |

With structured tasks, each task runs on its own timer. A 15-minute GitHub check and a 1-hour system health check coexist without conflict.

---

## HEARTBEAT_OK — Suppressing Noise

Most heartbeat cycles find nothing noteworthy. By default, the agent reports back every cycle, which creates noise. The `HEARTBEAT_OK` mechanism solves this.

When a heartbeat task finds nothing to report, the agent responds with `HEARTBEAT_OK` instead of a full message. This response is:

- Suppressed from channel output (you won't see it on WhatsApp/Slack/Discord)
- Logged for debugging (visible in `openclaw logs`)
- Controlled by `ackMaxChars` — responses shorter than this threshold are treated as "OK"

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "ackMaxChars": 300
  }
}
```

The default `ackMaxChars` is **300 characters**. If the agent's response is under 300 characters and contains no alert keywords, it's suppressed. Raise the threshold to suppress more, lower it to see more.

### Visibility Controls

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "showOk": false,
    "showAlerts": true,
    "useIndicator": true
  }
}
```

| Setting | Default | Effect |
|---------|---------|--------|
| `showOk` | `false` | Show routine "all clear" messages |
| `showAlerts` | `true` | Show alert/warning messages |
| `useIndicator` | `true` | Show a status dot in connected clients |

---

## Recipes

### Email Triage

```markdown title="~/.openclaw/HEARTBEAT.md"
## Email Triage (every heartbeat)
- Check Gmail for new unread emails
- Flag emails from VIPs: boss@company.com, cto@company.com
- For flagged emails: send me a WhatsApp summary immediately
- For other emails: batch into a digest
- Mark promotional emails as read automatically
```

One user reported processing **15,000 emails** with this pattern.

### GitHub Monitor

```markdown
## GitHub Monitor (every heartbeat)
- Check github.com/myorg/myrepo for new issues and PRs
- For issues: categorize as bug/feature/question based on content
- For PRs: check if CI passed, summarize the diff
- Alert me on Discord if any CI is failing on main branch
```

### System Health

```markdown
## System Health (hourly)
- Check disk usage on all partitions, alert if > 85%
- Check if Docker containers are healthy
- Monitor RAM usage, alert if > 90%
- Check SSL certificate expiry for mysite.com, alert if < 14 days
```

### News & Research

```markdown
## Morning Briefing (daily at 8am)
- Top 5 Hacker News stories relevant to AI and TypeScript
- Weather forecast for San Francisco
- My Google Calendar events for today
- Any new releases of packages I depend on (check package.json)
```

### Financial Monitoring

```markdown
## Financial (every 2 hours during market hours)
- Check my portfolio watchlist: AAPL, GOOGL, MSFT
- Alert me if any stock moves more than 3% in either direction
- Daily summary at market close
```

### Deployment Monitor

```markdown
## Deploy Watch (every 15 minutes)
- Check https://staging.myapp.com/health for HTTP 200
- Check https://api.myapp.com/health for HTTP 200
- If any endpoint is down, immediately alert on Slack #incidents
- Check response times — alert if p95 > 500ms
- Monitor error rate in the last 15 minutes from /metrics endpoint
```

### Slack Digest

```markdown
## Slack Digest (every 2 hours)
- Scan #engineering, #incidents, #deployments for new messages
- Summarize any threads with > 5 replies
- Flag any @here or @channel mentions
- Compile into a single digest and send to my DM
```

### Social Media Monitor

```markdown
## Brand Monitor (every 4 hours)
- Search Twitter/X for mentions of "mycompany" or "myproduct"
- Search Hacker News for mentions of my company
- Check Reddit r/myproduct for new posts
- Summarize sentiment (positive/negative/neutral)
- Alert immediately on any negative viral thread (> 50 engagement)
```

### Smart Home

```markdown
## Home Automation (hourly)
- Check Hue lights — turn off any that have been on > 8 hours
- Check thermostat — set to 68F if no motion detected for 2 hours
- Evening routine at sunset: turn on porch lights, dim living room to 40%
- Check security camera feed for motion alerts since last check
```

### Code Quality

```markdown
## Code Health (daily at 6am)
- Run the test suite for ~/projects/main-app
- Check for outdated npm dependencies (npm outdated)
- Look for new TODO/FIXME/HACK comments added yesterday
- Run linter and report any new warnings
- Summarize in a Slack message to #dev-daily
```

---

## Cost Optimization

Heartbeat is the biggest cost driver in OpenClaw — it runs 24/7, every 30 minutes by default. That's 48 cycles per day, each consuming tokens.

### The Cost Levers

| Lever | Effect | Savings |
|-------|--------|---------|
| **Cheaper model** | Route heartbeat to Haiku or local | 80-100% |
| **Longer interval** | 60 min instead of 30 min | 50% |
| **Quiet hours** | No heartbeat 10pm-7am | 33% |
| **`isolatedSession`** | Reduce context from 100K to 2-5K tokens | 95% per cycle |
| **`lightContext`** | Skip memory/history loading | 50-80% per cycle |

### isolatedSession

By default, heartbeat runs in the main session with full context (up to 100K tokens). Enable `isolatedSession` to run heartbeat in a minimal context window of 2-5K tokens:

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "isolatedSession": true
  }
}
```

This is the single most impactful cost reduction. The tradeoff: heartbeat tasks can't reference your conversation history or recently discussed topics.

### lightContext

Skip loading memory and history into the heartbeat context:

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "lightContext": true
  }
}
```

:::caution
`lightContext` has been reported as broken across several v2026.x releases. Test with `openclaw heartbeat --dry-run` after enabling to verify it works with your version.
:::

### Model Tiering

Route heartbeat to the cheapest model that can handle your tasks:

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "model": "claude-haiku-4-5-20251001"
  }
}
```

Or use a local model for zero cost:

```json5
{
  "heartbeat": {
    "model": "ollama/qwen3:14b"
  }
}
```

### Quiet Hours

Disable heartbeat while you sleep:

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "quiet_hours": {
      "start": "22:00",
      "end": "07:00"
    }
  }
}
```

### Cost Comparison

| Configuration | Monthly Cost (approximate) |
|--------------|--------------------------|
| Default (Opus, 30min, 24/7) | ~$450-1,200 |
| Sonnet, 30min, 24/7 | ~$90-240 |
| Haiku, 30min, 24/7 | ~$15-45 |
| Haiku, 60min, quiet hours | ~$5-15 |
| Local model, 30min, 24/7 | $0 (electricity only) |
| Haiku + isolatedSession + quiet hours | ~$2-8 |

---

## Multi-Agent Heartbeat

When running multiple agents, you can assign heartbeat tasks to specific agents:

```json5 title="~/.openclaw/openclaw.json"
{
  "agents": {
    "list": [
      {
        "id": "monitor",
        "model": "ollama/qwen3:14b",
        "heartbeat": {
          "tasks": ["system-health", "deploy-watch"]
        }
      },
      {
        "id": "researcher",
        "model": "claude-haiku-4-5-20251001",
        "heartbeat": {
          "tasks": ["news-briefing", "brand-monitor"]
        }
      }
    ]
  }
}
```

This pairs well with structured tasks — each agent handles tasks that match its model's capabilities. A local model handles simple health checks; a cloud model handles tasks requiring web search.

### Routing Priority

Heartbeat tasks route using the same 8-tier priority system as regular messages:

1. Tasks assigned to a specific agent go to that agent
2. Unassigned tasks go to the primary agent
3. If the primary agent is busy, tasks queue (they don't skip)

---

## Advanced Patterns

### Conditional Heartbeat

Make tasks trigger only when conditions are met:

```markdown title="~/.openclaw/HEARTBEAT.md"
## Deploy Gate (every 15 minutes)
- Only run during business hours (9am-6pm weekdays)
- Check if there are approved PRs waiting to deploy
- If staging tests pass and it's not a deploy freeze, auto-merge to main
- Skip on Fridays after 3pm (deploy freeze)
```

### Chained Tasks

One task's output feeds the next:

```markdown
## Security Scan (daily at 2am)
- Run npm audit on ~/projects/main-app
- If any critical vulnerabilities found:
  - Check if a fix is available
  - If yes: create a branch, update the package, run tests
  - If tests pass: open a PR with the fix
  - If tests fail: create an issue with the audit details
  - Alert on Slack #security regardless
```

### Dreaming Mode

Combine heartbeat with Dreaming for creative/reflective tasks. In Dreaming mode, the agent runs self-directed exploration during idle heartbeats:

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "dreaming": {
      "enabled": true,
      "idle_threshold": 3,
      "tasks": [
        "Review recent code changes for potential improvements",
        "Update documentation if any public APIs changed",
        "Look for patterns across recent conversations that could become skills"
      ]
    }
  }
}
```

`idle_threshold` sets how many consecutive `HEARTBEAT_OK` cycles (no real work) before dreaming tasks activate. This keeps dreaming from consuming resources during busy periods.

---

## Debugging

```bash
# See what the heartbeat is doing
openclaw logs --filter heartbeat --follow

# Run one heartbeat manually
openclaw heartbeat --now

# Dry run (shows what would happen without executing)
openclaw heartbeat --dry-run

# Check heartbeat stats
openclaw stats heartbeat

# Show last 10 heartbeat results
openclaw logs --filter heartbeat --last 10

# Filter heartbeat logs by task name
openclaw logs --filter "heartbeat:email-triage" --follow

# Check heartbeat timing
openclaw stats heartbeat --timing
```

### Common Log Messages

| Log Message | Meaning |
|-------------|---------|
| `HEARTBEAT_OK` | Cycle completed, nothing to report |
| `heartbeat: skipped (quiet hours)` | Quiet hours active |
| `heartbeat: skipped (busy)` | Agent is busy with a user request |
| `heartbeat: task "X" failed` | A specific task errored — check task logs |
| `heartbeat: isolatedSession active` | Running with reduced context |

### Debugging Checklist

1. **Heartbeat not running?** Check `openclaw gateway status` — gateway must be running
2. **Tasks not executing?** Run `openclaw heartbeat --dry-run` to verify HEARTBEAT.md parses correctly
3. **No output?** Check if `HEARTBEAT_OK` is suppressing messages — set `showOk: true` temporarily
4. **Wrong interval?** Structured tasks use per-task `interval`; simple format uses the global `heartbeat.interval`
5. **High costs?** Enable `isolatedSession`, switch to Haiku/local model, add quiet hours

---

## Complete Configuration Reference

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    // Timing
    "interval": 1800,                    // seconds between cycles (default: 1800 = 30min)
    "quiet_hours": {
      "start": "22:00",                  // stop heartbeat
      "end": "07:00"                     // resume heartbeat
    },

    // Model & cost
    "model": "claude-haiku-4-5-20251001", // model override for heartbeat
    "isolatedSession": true,              // minimal context (2-5K tokens)
    "lightContext": true,                 // skip memory/history loading

    // Output
    "ackMaxChars": 300,                   // HEARTBEAT_OK threshold
    "showOk": false,                      // show routine messages
    "showAlerts": true,                   // show alert messages
    "useIndicator": true,                 // status dot in clients

    // Dreaming
    "dreaming": {
      "enabled": false,
      "idle_threshold": 3                 // OK cycles before dreaming starts
    }
  }
}
```

---

## See Also

- [Heartbeat Architecture](/architecture/heartbeat) — How the system works internally
- [Configuration Reference](/reference/configuration) — All heartbeat settings
- [Channels](/guides/channels) — Configure where heartbeat alerts go
- [Cost Management](/guides/cost-management) — Strategies for reducing heartbeat spend
- [Model Selection](/guides/model-selection) — Choosing the right model for heartbeat
- [Multi-Agent Guide](/guides/multi-agent) — Running agents with dedicated heartbeat tasks
- [Automation Guide](/guides/automation) — Broader automation patterns beyond heartbeat
