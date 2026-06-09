---
sidebar_position: 16
title: Automation & Integrations
description: Cron jobs, webhooks, CI/CD integration, GitHub Actions, and connecting OpenClaw to external services
keywords: [openclaw, openclaw automation, cron, automate tasks, scheduled jobs]
---

# Automation & Integrations

OpenClaw can be triggered by schedules, webhooks, and CI/CD pipelines — not just chat messages. This guide covers proactive automation beyond the basic [heartbeat](/guides/heartbeat).

---

## Cron Jobs

OpenClaw has a built-in cron system that persists jobs across restarts. Unlike the heartbeat (which runs the same check every N minutes), cron jobs run specific tasks at specific times.

### Creating a Cron Job

**Via CLI:**

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

**Via config:**

```json title="~/.openclaw/openclaw.json"
{
  "cron": [
    {
      "name": "Morning brief",
      "schedule": {
        "kind": "cron",
        "expr": "0 7 * * *",
        "tz": "America/Los_Angeles"
      },
      "sessionTarget": "isolated",
      "wakeMode": "next-heartbeat",
      "payload": {
        "kind": "agentTurn",
        "message": "Summarize overnight updates."
      },
      "delivery": {
        "mode": "announce",
        "channel": "slack",
        "to": "channel:C1234567890",
        "bestEffort": true
      }
    }
  ]
}
```

Jobs persist under `~/.openclaw/cron/` so restarts don't lose schedules.

### Cron vs Heartbeat

| Feature | Heartbeat | Cron Jobs |
|---------|-----------|-----------|
| **Trigger** | Every N minutes (default: 30) | Specific cron schedule |
| **Task** | Reads `HEARTBEAT.md`, checks for work | Runs a specific message/command |
| **Session** | Continues existing session | Can run isolated |
| **Cost** | Runs even when idle | Only runs at scheduled time |
| **Use case** | Monitoring, reactive checks | Scheduled reports, daily tasks |

**Rule of thumb:** Use heartbeat for monitoring and reactive behavior. Use cron for scheduled, predictable tasks.

### Example Cron Jobs

```bash
# Daily standup summary at 9 AM
openclaw cron add --name "Standup" --cron "0 9 * * 1-5" \
  --message "Summarize what I worked on yesterday from git logs and calendar."

# Weekly report every Friday at 5 PM
openclaw cron add --name "Weekly report" --cron "0 17 * * 5" \
  --message "Generate my weekly status report from this week's git activity."

# Hourly news check during work hours
openclaw cron add --name "News check" --cron "0 9-17 * * 1-5" \
  --message "Check for breaking news in AI and tech. Only alert if significant."

# Nightly backup verification
openclaw cron add --name "Backup check" --cron "0 2 * * *" \
  --message "Verify that nightly backups completed successfully."
```

### Managing Cron Jobs

```bash
openclaw cron list              # List all jobs
openclaw cron remove <name>     # Remove a job
openclaw cron pause <name>      # Pause without removing
openclaw cron resume <name>     # Resume a paused job
```

---

## Webhooks

OpenClaw can receive and send webhooks for event-driven automation.

### Incoming Webhooks

Trigger agent actions from external events:

```json5 title="~/.openclaw/openclaw.json"
{
  "webhooks": {
    "incoming": {
      "enabled": true,
      "secret": "your-webhook-secret",
      "endpoints": [
        {
          "path": "/deploy-alert",
          "message": "A deployment just completed: {{body}}"
        },
        {
          "path": "/error-alert",
          "message": "Production error detected: {{body}}"
        }
      ]
    }
  }
}
```

External services send a POST to `http://localhost:18789/webhook/<path>` with the webhook secret, and the agent processes the message.

### Outgoing Webhooks

Have OpenClaw notify external services when events occur:

```json5 title="~/.openclaw/openclaw.json"
{
  "webhooks": {
    "outgoing": [
      {
        "event": "agent.task.completed",
        "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
      },
      {
        "event": "security.alert",
        "url": "https://your-monitoring.example.com/alerts"
      }
    ]
  }
}
```

---

## CI/CD Integration

### GitHub Actions

OpenClaw can automate code review, PR management, and CI tasks via GitHub Actions:

```yaml title=".github/workflows/openclaw-review.yml"
name: OpenClaw PR Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install OpenClaw
        run: npm install -g openclaw
      - name: Review PR
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          openclaw chat --once "Review this pull request. Check for bugs, security issues, and style. Post your review as a GitHub comment."
```

**Best practice:** Use read-only access. OpenClaw excels at reviewing code without needing push access:

| Pattern | Access | Use Case |
|---------|--------|----------|
| PR review | Read | Code review comments, suggestions |
| Issue triage | Read + Comment | Label, categorize, request info |
| Release notes | Read | Generate changelogs from commits |
| Test analysis | Read | Analyze test failures, suggest fixes |

### Lobster Workflows

[Lobster](/reference/ecosystem#lobster) is OpenClaw's official workflow shell for composable pipelines:

```yaml title="workflows/deploy.yml"
name: Deploy Pipeline
steps:
  - name: lint
    skill: code-lint
    input: "{{ files.changed }}"
  - name: test
    skill: run-tests
    needs: [lint]
  - name: deploy
    skill: deploy-staging
    needs: [test]
    approval: required
```

Lobster provides typed pipelines, approval gates for side-effect actions, and persistent state between runs.

---

## Service Integrations

### Messaging Platforms

Full integration guides are in [Channels & Integrations](/guides/channels). Quick reference:

| Platform | Setup | Automation Use Case |
|----------|-------|---------------------|
| **Slack** | OAuth app | Team notifications, standup bots, incident response |
| **Discord** | Bot token | Community management, moderation, FAQ bot |
| **Telegram** | Bot token | Personal assistant, alerts, remote control |
| **WhatsApp** | QR scan | Personal messaging, family coordination |
| **iMessage** | macOS only | Personal assistant (calendar, reminders) |

### Developer Tools

| Service | Integration | Key Capabilities |
|---------|------------|-----------------|
| **GitHub** | OAuth/token | Issues, PRs, code review, notifications |
| **Gmail** | OAuth | Read, send, search, label emails |
| **Google Calendar** | OAuth | Create events, check availability, reminders |
| **Notion** | API token | Read/write pages, database queries |
| **Linear** | API token | Issue tracking, sprint management |
| **Jira** | API token | Issue management, status updates |

### Smart Home

| Platform | Integration | Capabilities |
|----------|------------|-------------|
| **Home Assistant** | REST API | Control lights, locks, thermostats, automations |
| **Philips Hue** | Bridge API | Smart light control |
| **IFTTT** | Webhooks | Bridge to 700+ services |

See the [Smart Home recipe](/guides/recipes/smart-home) for a complete setup guide.

---

## Automation Patterns

### Morning Briefing

Combine cron + multiple integrations:

```bash
openclaw cron add --name "Morning brief" --cron "0 7 * * 1-5" \
  --message "Good morning. Check my calendar for today, summarize unread emails, check GitHub notifications, and give me a weather forecast. Send the summary to WhatsApp."
```

### Inbox Monitor

Use heartbeat for reactive monitoring:

```markdown title="~/.openclaw/HEARTBEAT.md"
## Email Monitor
- Check Gmail for unread emails from VIP contacts
- If urgent (contains "urgent", "ASAP", "emergency"), send me a Telegram alert
- Otherwise, batch summary at next heartbeat
```

### Deploy Watcher

```markdown title="~/.openclaw/HEARTBEAT.md"
## Deploy Monitor
- Check GitHub Actions for failed deployments in my repos
- If a deploy failed, analyze the logs and send me a Slack message
  with the error summary and suggested fix
```

### Content Pipeline

```bash
# Daily content automation
openclaw cron add --name "Content pipeline" --cron "0 8 * * 1-5" \
  --message "Check my content calendar in Notion. For any post due today, draft it based on the outline and save to Google Docs. Notify me on Slack when ready for review."
```

---

## Security Considerations

Automation increases risk because actions happen without human oversight:

- **Limit scope**: Give cron jobs and heartbeat tasks the minimum permissions needed
- **Set quiet hours**: Disable autonomous operation during sleep — see [Cost Management](/guides/cost-management)
- **Audit regularly**: Review `~/.openclaw/cron/` and `HEARTBEAT.md` for unauthorized entries
- **Webhook secrets**: Always use shared secrets for incoming webhooks
- **CI/CD tokens**: Use repository-scoped tokens with minimal permissions
- **Read-only patterns**: Prefer read-only integrations for automated tasks

---

## See Also

- [Heartbeat Guide](/guides/heartbeat) — The built-in autonomous task loop
- [Channels & Integrations](/guides/channels) — Connecting messaging platforms
- [Multi-Agent Workflows](/guides/multi-agent) — Running specialized agents
- [Cost Management](/guides/cost-management) — Controlling automation costs
- [Recipes](/guides/recipes/email-assistant) — Step-by-step automation examples
