---
sidebar_position: 23
title: Monitoring & Observability
description: Monitor your OpenClaw agent in production — metrics, logs, alerts, dashboards, and OpenTelemetry tracing
---

# Monitoring & Observability

A 24/7 agent needs 24/7 visibility. This guide covers how to monitor OpenClaw in production — from built-in CLI tools to OpenTelemetry tracing to cost dashboards and alerting.

---

## Built-In Monitoring

### Status & Health

```bash
# Quick status — gateway, channels, tasks, memory usage
openclaw status

# Machine-readable for scripting
openclaw status --json

# Full health check — config, dependencies, environment
openclaw doctor

# Export comprehensive diagnostic bundle
openclaw diagnostics > ~/openclaw-debug.txt
```

`openclaw doctor` validates:
- Gateway process state
- Config file syntax
- Node.js version compatibility
- Filesystem permissions
- MCP server connectivity
- Plugin health
- Environment variables

### Statistics

```bash
# Token usage breakdown
openclaw stats tokens

# Token usage over a specific period
openclaw stats tokens --period 7

# Per-channel message statistics
openclaw stats channels

# Heartbeat execution history
openclaw stats heartbeat

# Cost breakdown by model, channel, and task type
openclaw gateway usage-cost
```

### Component Diagnostics

```bash
# MCP servers
openclaw mcp doctor             # Diagnose all connections
openclaw mcp status             # Connection overview
openclaw mcp probe <name>       # Test specific server

# Plugins
openclaw plugins doctor         # Diagnose plugin issues
openclaw plugins inspect <name> --runtime  # Runtime state

# Channels
openclaw channel list           # All channels and status
openclaw channel status <name>  # Specific channel details

# Security
openclaw security audit         # Config and permissions
openclaw security audit --deep  # WebSocket probe, browser exposure, plugins
```

---

## Logging

### Log Levels

Control verbosity with the `OPENCLAW_LOG_LEVEL` environment variable:

| Level | What You See | Use When |
|-------|-------------|----------|
| `debug` | Everything — API calls, messages, tool invocations, memory writes | Debugging specific issues |
| `info` | Standard operations (default) | Normal production |
| `warn` | Warnings and errors only | Quiet production, high-traffic agents |
| `error` | Errors only | Minimal logging |

```bash
# Run with debug logging
OPENCLAW_LOG_LEVEL=debug openclaw gateway

# Set permanently in config
openclaw config set logging.level "info"
```

### Filtering by Component

```bash
# Real-time log stream, all components
openclaw logs --follow

# Filter to specific component
openclaw logs --filter heartbeat --follow
openclaw logs --filter channel --follow
openclaw logs --filter brain --follow
openclaw logs --filter hands --follow
openclaw logs --filter plugin --follow
openclaw logs --filter mcp --follow

# Last N lines (useful for post-mortem)
openclaw logs --lines 200
```

### Log Rotation

Configure rotation to prevent disk exhaustion:

```json5 title="~/.openclaw/openclaw.json"
{
  "logging": {
    "level": "info",
    "path": "~/.openclaw/logs",
    "max_size": "10m",
    "max_files": 5
  }
}
```

With these defaults, logs rotate at 10 MB and keep 5 files — about 50 MB maximum disk usage.

### Audit Logging

Record a tamper-evident trail of all agent actions:

```json5 title="~/.openclaw/openclaw.json"
{
  "logging": {
    "audit": {
      "enabled": true,
      "path": "~/.openclaw/logs/audit.log",
      "log_tool_calls": true,
      "log_memory_writes": true,
      "log_channel_messages": true
    }
  }
}
```

Each audit entry records:
- Timestamp
- User/sender ID
- Action type (tool call, message, memory write)
- Result (success/failure)
- IP address (for webhook/API calls)

Audit logs are retained for 90 days by default (configurable up to 365). Exportable as CSV or JSON for compliance reviews.

---

## Metrics

### What OpenClaw Tracks

| Category | Metrics | Command |
|----------|---------|---------|
| **Tokens** | Usage by model, input/output split, cost per request | `openclaw stats tokens` |
| **Cost** | Total spend, cost by model/channel/task, daily/weekly trends | `openclaw gateway usage-cost` |
| **Channels** | Messages sent/received, errors, connection uptime | `openclaw stats channels` |
| **Heartbeat** | Execution count, tokens per cycle, cost per cycle, timing | `openclaw stats heartbeat` |
| **Memory** | Context tokens loaded, memory file count, disk usage | `openclaw status` |
| **MCP** | Server connectivity, tool count, response times | `openclaw mcp status` |
| **Plugins** | Load status, hook execution, errors | `openclaw plugins list` |

### Token Cost Breakdown

Typical cost distribution for a 24/7 agent:

| Component | Share | Optimization |
|-----------|-------|-------------|
| Heartbeat | ~35% | Increase interval, use cheaper model, set quiet hours |
| Chat | ~25% | Rate limit channels, session resets |
| Skills | ~20% | Simplify skill prompts, reduce tool calls |
| Context | ~15% | Lower `max_context_tokens` |
| Sub-agents | ~5% | Limit multi-agent workflows |

```bash
# Identify your biggest cost driver
openclaw gateway usage-cost
```

---

## OpenTelemetry

### Community Observability Plugin

The [OpenClaw Observability Plugin](https://github.com/henrikrexed/openclaw-observability-plugin) exports traces and metrics to OpenTelemetry-compatible backends.

**Supported backends:**
- Grafana Cloud
- Dynatrace
- Jaeger
- Any OTLP-compatible collector

**What it traces:**
- Complete agent workflow spans (start to finish)
- Individual tool execution spans
- LLM API call spans with token breakdowns
- Memory read/write operations
- Session context propagation across distributed traces

**Span attributes:**
- Session ID, user ID, model name
- Channel source, message priority
- Token count (input/output), cost
- Tool name, execution duration, result status

### Setup

```bash
# Install the plugin
openclaw plugins install openclaw-observability

# Configure OTLP endpoint
```

```json5 title="~/.openclaw/openclaw.json"
{
  "plugins": {
    "entries": {
      "openclaw-observability": {
        "enabled": true,
        "config": {
          "otlp_endpoint": "https://otlp.grafana.net/otlp",
          "otlp_headers": {
            "Authorization": "Basic ${GRAFANA_OTLP_TOKEN}"
          },
          "service_name": "openclaw-agent",
          "trace_all_tool_calls": true,
          "trace_llm_calls": true,
          "include_token_metrics": true
        }
      }
    }
  }
}
```

### Local Development with Jaeger

For local tracing without a cloud backend:

```yaml title="docker-compose.otel.yml"
services:
  openclaw:
    image: openclaw/openclaw:latest
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"   # Jaeger UI
      - "4318:4318"     # OTLP HTTP receiver
```

Access the Jaeger UI at `http://localhost:16686` to visualize traces.

### Knostic Telemetry (Privacy-First)

For environments where data must stay local:

- Local-only processing — nothing leaves your machine
- Cryptographic hash chains for tamper evidence
- Opt-in granularity (choose what to track)
- No external dependencies

---

## Health Checks

### CLI Health Check

```bash
# Quick check — exit code 0 = healthy, non-zero = unhealthy
openclaw doctor
echo $?  # 0 = healthy
```

### Docker

```yaml title="docker-compose.yml"
services:
  openclaw:
    image: openclaw/openclaw:latest
    healthcheck:
      test: ["CMD", "openclaw", "doctor"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' openclaw

# View health check history
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' openclaw
```

### Kubernetes

```yaml title="deployment.yaml"
livenessProbe:
  exec:
    command: ["openclaw", "doctor"]
  initialDelaySeconds: 30
  periodSeconds: 60
  timeoutSeconds: 15

readinessProbe:
  exec:
    command: ["openclaw", "status"]
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 10
```

### External Uptime Monitoring

Point any HTTP uptime monitor at the gateway health endpoint, or use SSH-based checks:

```bash
# SSH-based health check from external monitor
ssh deploy@your-server "openclaw doctor" && echo "UP" || echo "DOWN"
```

---

## Alerting

### Heartbeat-Based Alerts

The simplest alerting — embed monitoring instructions in your heartbeat:

```markdown title="~/.openclaw/HEARTBEAT.md"
## System Health (every heartbeat cycle)

- Check that all channels are connected via `openclaw channel list`
- Check MCP server health via `openclaw mcp status`
- Monitor memory usage — alert if RSS exceeds 500 MB
- Check disk usage — alert if ~/.openclaw exceeds 1 GB
- Review error logs since last heartbeat
- If any issues found, send a summary to Telegram with severity level
```

The agent runs these checks every heartbeat cycle (default: 30 minutes) and sends alerts through whichever channel you configure.

### Outgoing Webhooks

Fire HTTP webhooks on specific events:

```json5 title="~/.openclaw/openclaw.json"
{
  "webhooks": {
    "outgoing": [
      {
        "event": "agent.error",
        "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
      },
      {
        "event": "agent.task.completed",
        "url": "https://your-app.com/task-done"
      },
      {
        "event": "security.alert",
        "url": "https://events.pagerduty.com/v2/enqueue"
      },
      {
        "event": "channel.disconnected",
        "url": "https://hooks.slack.com/services/YOUR/ALERT/URL"
      }
    ]
  }
}
```

### Cron-Based Alerts

Schedule periodic checks that alert on failure:

```bash
# Hourly health check during business hours
openclaw cron add "health-check" \
  --schedule "0 9-17 * * 1-5" \
  --message "Run openclaw doctor. If any checks fail, send an alert to Slack with the failure details."

# Nightly cost check
openclaw cron add "cost-check" \
  --schedule "0 23 * * *" \
  --message "Check today's token spend via openclaw gateway usage-cost. If over $5, alert on Telegram with breakdown."

# Weekly security audit
openclaw cron add "security-audit" \
  --schedule "0 3 * * 0" \
  --message "Run openclaw security audit --deep. Report any new findings to Telegram."
```

### GitHub Actions Nightly Check

```yaml title=".github/workflows/nightly-health.yml"
name: Nightly Health Check
on:
  schedule:
    - cron: '0 3 * * *'

jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - name: Check agent health
        env:
          AGENT_HOST: ${{ secrets.AGENT_HOST }}
          SSH_KEY: ${{ secrets.SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_KEY" > ~/.ssh/key && chmod 600 ~/.ssh/key
          ssh -i ~/.ssh/key -o StrictHostKeyChecking=no \
            deploy@$AGENT_HOST \
            "openclaw doctor && openclaw mcp doctor && openclaw plugins doctor"

      - name: Alert on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: '{"text": "OpenClaw health check FAILED. Check logs."}'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Cost Monitoring

### Built-In Cost Tracking

```bash
# Token usage summary
openclaw stats tokens

# Full cost breakdown
openclaw gateway usage-cost

# Heartbeat-specific costs
openclaw stats heartbeat
```

### Budget Controls

```json5 title="~/.openclaw/openclaw.json"
{
  "budget": {
    "daily_limit_usd": 5.00,
    "monthly_limit_usd": 50.00,
    "alert_threshold": 0.8    // Alert at 80% of limit
  }
}
```

### Cost Dashboards

| Tool | What It Shows |
|------|-------------|
| **Clawalytics** (clawalytics.com) | Real-time spend, per-agent breakdown, daily charts, suspicious activity alerts |
| **ClawWatcher** | Real-time token usage, cost per model, skills/actions tracking |
| **claw-dash** | Sessions, 24h tokens, costs, model info, cron jobs, system health |
| **openclaw-dashboard** | Browser notifications for usage limits, cost analysis by model |
| **OpenClaw Cost Calculator** (calculator.vlvt.sh) | Pre-deployment cost estimation |

### Cost Anomaly Detection

Watch for these patterns:

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Cost doubles overnight | Heartbeat running expensive model | Use cheap model for heartbeat |
| Sudden cost spike | Infinite loop or stuck tool | Check `openclaw logs --follow` |
| Gradual cost increase | Context snowball (growing memory) | Reset sessions, lower `max_context_tokens` |
| High cost per message | Thinking/reasoning mode enabled | Disable extended thinking |
| Cost from unexpected model | Fallback provider triggered | Check primary provider health |

---

## Dashboards

### Control UI (Built-In)

OpenClaw includes a web dashboard at `http://localhost:18789` (requires gateway auth token):

- Connected channels and their status
- Active tasks and Workboard state
- Memory usage and recent writes
- Recent logs
- Heartbeat status and history

**Remote access** via SSH tunnel:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@your-server
# Then open http://localhost:18789 in your browser
```

### Grafana + OpenTelemetry

With the observability plugin exporting to Grafana Cloud:

**Recommended dashboard panels:**
- Agent response latency (p50, p95, p99)
- Token usage over time (by model)
- Error rate by component
- Channel message throughput
- Heartbeat execution timeline
- Cost accumulation curve
- MCP server health matrix

### Custom Monitoring Script

Build a simple health dashboard with `--json` output:

```bash title="monitor.sh"
#!/bin/bash
while true; do
  clear
  echo "=== OpenClaw Monitor ==="
  echo ""

  # Gateway status
  echo "--- Status ---"
  openclaw status 2>/dev/null || echo "GATEWAY DOWN"
  echo ""

  # Channel health
  echo "--- Channels ---"
  openclaw channel list 2>/dev/null
  echo ""

  # Recent errors
  echo "--- Recent Errors ---"
  openclaw logs --lines 10 2>/dev/null | grep -i "error\|warn" || echo "None"
  echo ""

  # Token usage
  echo "--- Token Usage (24h) ---"
  openclaw stats tokens --period 1 2>/dev/null
  echo ""

  sleep 60
done
```

---

## Security Monitoring

### Audit Trail

Enable audit logging to track every agent action:

```json5
{
  "logging": {
    "audit": {
      "enabled": true,
      "log_tool_calls": true,
      "log_memory_writes": true,
      "log_channel_messages": true
    }
  }
}
```

Review periodically:

```bash
# Recent audit entries
tail -50 ~/.openclaw/logs/audit.log

# Search for specific actions
grep "tool_call" ~/.openclaw/logs/audit.log | tail -20
grep "memory_write" ~/.openclaw/logs/audit.log | tail -20
```

### Drift Detection

Monitor for unauthorized changes to critical files:

| File | Risk | Tool |
|------|------|------|
| `SOUL.md` | Personality tampering | ClawSec `soul-guardian` |
| `openclaw.json` | Config manipulation | File hash monitoring |
| `skills/` | Malicious skill injection | `openclaw security scan --all` |
| `memory/` | Memory poisoning | Audit logging |

### Community Security Tools

| Tool | What It Does |
|------|-------------|
| **ClawSec** | Complete security suite — SOUL.md drift detection, audit watchdog, CVE monitoring |
| **Clawprint** | SHA-256 hash chain audit trail, web dashboard, 24/7 daemon mode, secret redaction |
| **ClawBands** | Human-in-the-loop approval before dangerous tool calls, JSON audit logging |
| **SkillGuard** | Skill vulnerability scanner — prompt injection, credential leaks, malicious patterns |
| **Security Monitor** | 32-script suite for proactive threat monitoring with daily automated scans |

### Automated Security Audits

```bash
# Schedule weekly deep audit
openclaw cron add "deep-audit" \
  --schedule "0 3 * * 0" \
  --message "Run openclaw security audit --deep and openclaw security scan --all. Report findings to Telegram."
```

---

## Process Management

### Systemd

```bash
# Install as systemd service
openclaw onboard --install-daemon

# Check service status
systemctl status openclaw

# View service logs
journalctl -u openclaw --follow

# Restart
systemctl restart openclaw
```

### Docker Restart Policy

```yaml title="docker-compose.yml"
services:
  openclaw:
    restart: unless-stopped    # Restart on crash, not on manual stop
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "2.0"
```

### Process Monitoring

```bash
# Check if running
openclaw status

# Check resource usage
ps aux | grep openclaw

# Memory usage benchmarks
# Healthy idle: 150–250 MB
# Warning: >500 MB
# Critical: >1 GB — restart recommended
```

---

## Self-Monitoring Patterns

### Comprehensive Heartbeat Monitor

```markdown title="~/.openclaw/HEARTBEAT.md"
## System Health (every heartbeat)

Check the following and send a Telegram alert if any fail:

1. **Gateway**: Run `openclaw status` — confirm gateway is running
2. **Channels**: Run `openclaw channel list` — all channels should show connected
3. **MCP**: Run `openclaw mcp status` — all servers should respond
4. **Memory**: Check RSS with `ps aux | grep openclaw` — alert if >500 MB
5. **Disk**: Check `df -h ~/.openclaw` — alert if usage >85%
6. **Errors**: Check `openclaw logs --lines 20` for ERROR or WARN entries
7. **Cost**: Check today's spend — alert if >$3 (daily budget: $5)

Format the alert as:
- OK items as a count
- Failed items with details
- Only send if something is wrong
```

### Watchdog Pattern

Use a second agent or cron job to monitor the primary:

```bash title="/etc/cron.d/openclaw-watchdog"
*/5 * * * * deploy openclaw doctor > /dev/null 2>&1 || \
  curl -s -X POST https://hooks.slack.com/services/YOUR/WEBHOOK \
  -d '{"text":"OpenClaw health check failed!"}'
```

---

## Key Files to Monitor

| Path | What to Watch For |
|------|-------------------|
| `~/.openclaw/logs/gateway.log` | Errors, crashes, slow responses |
| `~/.openclaw/logs/audit.log` | Unusual actions, unauthorized access |
| `~/.openclaw/gateway.pid` | Stale PID (process died but PID file remains) |
| `~/.openclaw/openclaw.json` | Unauthorized config changes |
| `~/.openclaw/SOUL.md` | Tampering (personality/behavior changes) |
| `~/.openclaw/memory/` | Unexpected growth, corruption |
| `~/.openclaw/skills/` | New files (unauthorized skill install) |

---

## See Also

- [Troubleshooting](/reference/troubleshooting) — Fix specific errors and issues
- [CI/CD & Testing](/guides/cicd-testing) — Automated health checks and deployment validation
- [Cost Management](/guides/cost-management) — Token optimization and budgeting
- [Security Hardening](/security/hardening) — Production security checklist
- [Heartbeat](/guides/heartbeat) — Heartbeat configuration and scheduling
- [Plugin System](/guides/plugin-system) — Plugin diagnostics and hooks
- [Ecosystem](/reference/ecosystem) — Community monitoring tools
