---
sidebar_position: 8
title: "Day 7: Lock It Down"
description: "Security hardening, cost optimization, and monitoring for a production-ready setup"
keywords: [openclaw, production, deploy, hardening, monitoring, security, cost optimization]
---

# Day 7: Lock It Down

You have a personalized, multi-channel, automated AI assistant. Today you make sure it stays running, stays safe, and doesn't surprise you with a bill.

**Time:** ~45 minutes

---

## Security in 5 Minutes

The full [Security Overview](/security/overview) covers threat models and incident history. Here's the condensed version — do all five steps right now.

1. **Update to latest:** `npm update -g openclaw`
2. **Verify localhost binding** — never expose the gateway to the network
3. **Verify auth is enabled** — token mode at minimum
4. **Set channel allowlists** — only accept messages from known senders
5. **Run `openclaw security audit --deep`** — fix whatever it flags

Here's every security-relevant setting in one config block:

```json5 title="~/.openclaw/openclaw.json"
{
  "gateway": {
    "host": "127.0.0.1",       // NEVER use 0.0.0.0
    "port": 18789,
    "auth": {
      "mode": "token"          // Requires auth for all gateway connections
    }
  },
  "channels": {
    "telegram": {
      "allowed_chat_ids": [123456789]   // Your Telegram user ID only
    },
    "discord": {
      "allowed_server_ids": ["987654321"]
    }
  },
  "security": {
    "confirm_dangerous_actions": true,   // Prompt before shell commands, file deletes
    "browser_domain_allowlist": [        // Restrict browser automation targets
      "github.com",
      "docs.google.com"
    ],
    "quiet_hours": {
      "enabled": true,
      "start": "23:00",
      "end": "07:00",
      "timezone": "UTC"                  // Matches your USER.md timezone
    }
  }
}
```

Run the audit to confirm everything is set correctly:

```bash
openclaw security audit --deep
openclaw security audit --fix    # Auto-fix what it can
```

:::tip
Set `quiet_hours` to match when you're asleep. During quiet hours, the bot holds non-urgent actions until you're back.
:::

---

## Cost Check

AI APIs charge per token. A chatty bot with a powerful model can rack up real costs. Here's how to see what you're spending.

### Check token usage

```bash
# Token usage summary for the current billing period
openclaw stats tokens

# Cost breakdown by model, channel, and task type
openclaw gateway usage-cost
```

### Check your provider dashboard

If you're using OpenRouter, visit [openrouter.ai/activity](https://openrouter.ai/activity) for a detailed breakdown by model and time period. Other providers have similar dashboards — check your API account settings.

### Quick cost-reduction tips

- **Use a cheap heartbeat model.** Your heartbeat runs every few minutes. It doesn't need GPT-4 or Claude Opus — a small, fast model handles "check if anything needs attention" just fine. See [Model Selection Guide](/guides/model-selection) for recommended pairings.
- **Increase heartbeat intervals.** Every 5 minutes is aggressive. Every 15 or 30 minutes is fine for most setups.
- **Set quiet hours.** No heartbeat, no token burn while you sleep.
- **Keep sessions short.** Long conversations accumulate context. If a conversation has been going for 50+ messages, start a new one — the bot has your memory files for continuity.

---

## Monitoring

A production setup means knowing when something goes wrong before it becomes a problem.

### Quick health check

```bash
openclaw status
```

This shows gateway status, connected channels, active tasks, memory usage, and any warnings.

### Watch real-time logs

```bash
openclaw logs --follow
```

Useful for debugging channel issues, watching skill execution, or monitoring what the heartbeat is doing. Press `Ctrl+C` to stop.

### Watch memory growth

Long-running OpenClaw processes can grow in memory over time, especially with browser automation or large context windows.

```bash
# Check RSS (resident set size) — the actual RAM usage
ps aux | grep openclaw
```

If RSS climbs past 500-600 MB consistently, restart the process. A healthy idle instance sits around 150-250 MB.

### Self-monitoring heartbeat

Set up a heartbeat task that watches OpenClaw itself. In your heartbeat config or via chat:

```
Check your own health — CPU usage, memory, disk space, and whether
all channels are connected. If anything looks wrong, send me a
Telegram message with the details.
```

This gives you a bot that monitors itself and alerts you when it needs attention.

---

## Backups

OpenClaw stores everything in `~/.openclaw/`. Back it up before upgrades, experiments, or just on a regular schedule.

```bash
# Back up everything that matters
tar czf ~/openclaw-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/openclaw.json \
  ~/.openclaw/workspace/ \
  ~/.openclaw/memory/ \
  ~/.openclaw/skills/
```

What each directory contains:

| Path | Contents |
|------|----------|
| `~/.openclaw/openclaw.json` | All configuration — models, channels, security, heartbeat |
| `~/.openclaw/workspace/` | SOUL.md, IDENTITY.md, USER.md, and any workspace files |
| `~/.openclaw/memory/` | Persistent memory — what the bot remembers about you and past sessions |
| `~/.openclaw/skills/` | Installed skills from ClawHub and any custom skills you've built |

:::info
Credentials (API keys, tokens) are in `openclaw.json`. Treat your backup file with the same care you'd give a password database.
:::

---

## Upgrades

OpenClaw moves fast. Upgrades usually go smoothly, but the community has been burned before. Follow this procedure.

**1. Back up first** (use the command above)

**2. Check release notes:**

```bash
gh release view --repo openclaw/openclaw
```

Read the notes. Look for breaking changes, migration steps, or known issues.

**3. Update:**

```bash
npm update -g openclaw
```

**4. Run doctor:**

```bash
openclaw doctor
```

Doctor checks that your config, dependencies, and environment are compatible with the new version.

**5. Verify:**

```bash
openclaw status
```

Confirm all channels reconnect and the heartbeat is running.

**6. If something breaks:** restore from backup.

```bash
# Stop OpenClaw first
openclaw stop

# Restore config and data
tar xzf ~/openclaw-backup-YYYYMMDD.tar.gz -C /

# Downgrade if needed
npm install -g openclaw@<previous-version>

# Restart
openclaw start
```

:::warning
Some past upgrades (v2026.5.x) have wiped configs. Always back up before upgrading. This is not theoretical — it has happened to real users.
:::

---

## What's Next?

You're past the basics. Here's where to go from here:

- [Skill Development](/guides/skill-development) — build advanced skills with custom tools and APIs
- [Security Hardening](/security/hardening) — full production security with Docker, reverse proxy, and network isolation
- [Cost Management](/guides/cost-management) — advanced cost optimization strategies
- [Cloud GPU Models](/guides/cloud-gpu-models) — self-host models for zero API cost
- [Use Cases](/guides/use-cases) — inspiration from the community
- [Contributing](/contributing/openclaw) — contribute back to OpenClaw

---

## Congratulations

You've gone from "hello" to a production-ready, multi-channel, automated AI assistant in 7 days. Your bot has a personality, handles daily tasks, runs on a schedule, speaks across platforms, and is locked down for safe long-term operation. The rest is up to you and your imagination.
