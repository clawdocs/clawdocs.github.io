---
sidebar_position: 4
title: Heartbeat Guide
description: Practical recipes for OpenClaw's autonomous heartbeat system
---

# Heartbeat Guide

The heartbeat transforms OpenClaw into a proactive agent. This guide covers practical recipes for `HEARTBEAT.md`.

## Quick Setup

```bash
# Create or edit your heartbeat file
vim ~/.openclaw/HEARTBEAT.md
```

Then restart the gateway:

```bash
openclaw gateway restart
```

## Recipe: Email Triage

```markdown title="~/.openclaw/HEARTBEAT.md"
## Email Triage (every heartbeat)
- Check Gmail for new unread emails
- Flag emails from VIPs: boss@company.com, cto@company.com
- For flagged emails: send me a WhatsApp summary immediately
- For other emails: batch into a digest
- Mark promotional emails as read automatically
```

One user reported processing **15,000 emails** with this pattern.

## Recipe: GitHub Monitor

```markdown
## GitHub Monitor (every heartbeat)
- Check github.com/myorg/myrepo for new issues and PRs
- For issues: categorize as bug/feature/question based on content
- For PRs: check if CI passed, summarize the diff
- Alert me on Discord if any CI is failing on main branch
```

## Recipe: System Health

```markdown
## System Health (hourly)
- Check disk usage on all partitions, alert if > 85%
- Check if Docker containers are healthy
- Monitor RAM usage, alert if > 90%
- Check SSL certificate expiry for mysite.com, alert if < 14 days
```

## Recipe: News & Research

```markdown
## Morning Briefing (daily at 8am)
- Top 5 Hacker News stories relevant to AI and TypeScript
- Weather forecast for San Francisco
- My Google Calendar events for today
- Any new releases of packages I depend on (check package.json)
```

## Recipe: Financial Monitoring

```markdown
## Financial (every 2 hours during market hours)
- Check my portfolio watchlist: AAPL, GOOGL, MSFT
- Alert me if any stock moves more than 3% in either direction
- Daily summary at market close
```

## Tips for Effective Heartbeats

1. **Be specific** — "Check Gmail for emails from boss@company.com" not "check my email"
2. **Set priorities** — Use "immediately" vs "batch" vs "daily" to control notification frequency
3. **Specify channels** — "Send to WhatsApp" vs "Post in Slack #alerts"
4. **Use quiet hours** — Avoid 2am notifications

```yaml title="~/.openclaw/config.yml"
heartbeat:
  quiet_hours:
    start: "22:00"
    end: "07:00"
```

5. **Monitor costs** — Each heartbeat consumes tokens. Use `openclaw stats` to track spend.

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
```

## See Also

- [Heartbeat Architecture](/architecture/heartbeat) — How the system works internally
- [Configuration Reference](/reference/configuration) — All heartbeat settings
- [Channels](/guides/channels) — Configure where heartbeat alerts go
