---
sidebar_position: 5
title: Troubleshooting & Debugging
description: Diagnose and fix OpenClaw issues — gateway, channels, LLM, MCP, plugins, memory, skills, performance, and more
keywords: [openclaw, openclaw troubleshooting, fix, debug, openclaw not working, common errors, diagnostics]
---

# Troubleshooting & Debugging

When something goes wrong, start here. This guide covers every component of OpenClaw with real error messages, diagnostic commands, and fix recipes.

---

## First Steps

Before diving into specific issues, run these three commands:

```bash
# 1. Full health check
openclaw doctor

# 2. Gateway and component status
openclaw status

# 3. Recent logs (last 100 lines)
openclaw logs --lines 100
```

If `openclaw doctor` reports all green, the issue is likely in your configuration or the external service you're connecting to. If it reports failures, follow the specific guidance below.

---

## Diagnostic Commands

### Core

| Command | What It Shows |
|---------|-------------|
| `openclaw doctor` | Full health check — gateway, config, dependencies, environment |
| `openclaw status` | Gateway state, connected channels, active tasks, memory usage |
| `openclaw status --json` | Machine-readable status for scripting |
| `openclaw diagnostics > ~/debug.txt` | Export comprehensive diagnostic bundle |
| `openclaw config list` | All configuration values |
| `openclaw config get <key>` | Check a specific setting |

### Logs

```bash
# All logs, real-time
openclaw logs --follow

# Filter by component
openclaw logs --filter heartbeat --follow
openclaw logs --filter channel --follow
openclaw logs --filter brain --follow
openclaw logs --filter hands --follow
openclaw logs --filter plugin --follow
openclaw logs --filter mcp --follow

# Last N lines
openclaw logs --lines 200
```

### Debug Mode

Enable verbose logging to see every operation:

```bash
# Debug mode — very verbose
OPENCLAW_LOG_LEVEL=debug openclaw gateway

# Warning mode — suppress info messages
OPENCLAW_LOG_LEVEL=warn openclaw gateway
```

| Level | What You See |
|-------|-------------|
| `debug` | Everything — every API call, message, tool invocation, memory write |
| `info` | Standard operations (default) |
| `warn` | Warnings and errors only |
| `error` | Errors only |

### Component Diagnostics

```bash
# MCP servers
openclaw mcp doctor               # Diagnose all connections
openclaw mcp status                # Connection status overview
openclaw mcp probe <name>          # Test specific server, list its tools

# Plugins
openclaw plugins doctor            # Diagnose plugin issues
openclaw plugins list              # Installed plugins and status
openclaw plugins inspect <name> --runtime  # Runtime state and health

# Channels
openclaw channel list              # All channels and connection status
openclaw channel status <name>     # Specific channel details

# Security
openclaw security audit            # Config and permissions check
openclaw security audit --deep     # WebSocket probe, browser exposure, plugin validation
openclaw security audit --fix      # Auto-fix safe defaults

# Statistics
openclaw stats tokens              # Token usage breakdown
openclaw stats channels            # Per-channel message statistics
openclaw stats heartbeat           # Heartbeat execution history
openclaw gateway usage-cost        # Cost breakdown by model/channel/task
```

---

## Gateway Issues

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::18789
```

```bash
# Find what's using the port
lsof -i :18789

# Kill the process using it
kill <PID>

# Or use a different port
openclaw config set gateway.port 19000
openclaw gateway restart
```

### Stale PID File

```
Error: Gateway already running (PID 12345)
```

But the process isn't actually running:

```bash
# Verify no process exists
ps aux | grep openclaw

# Remove the stale PID file
rm ~/.openclaw/gateway.pid

# Restart
openclaw gateway restart
```

### Permission Denied

```
Error: EACCES: permission denied, open '~/.openclaw/gateway.pid'
```

```bash
# Fix ownership
sudo chown -R $USER:$USER ~/.openclaw/

# Fix permissions
chmod 700 ~/.openclaw
chmod 600 ~/.openclaw/openclaw.json
```

### Gateway Crashes on Startup

```bash
# See what happened
openclaw logs --lines 50

# Run in foreground with debug logging
OPENCLAW_LOG_LEVEL=debug openclaw gateway

# Common causes:
# - Invalid JSON5 in openclaw.json (syntax error)
# - Missing required config values
# - Node.js version too old
# - Corrupted plugin state
```

### Node.js Version Too Old

```
Error: OpenClaw requires Node.js >= 22.19
```

```bash
node --version

# Update via nvm (Node 24 recommended)
nvm install 24
nvm use 24

# Or via package manager
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Gateway Won't Stop

```bash
# Find the process
ps aux | grep openclaw

# Graceful stop
openclaw stop

# Force kill if graceful fails
kill -9 $(cat ~/.openclaw/gateway.pid)
rm ~/.openclaw/gateway.pid
```

---

## Channel Issues

### Channel Disconnects Repeatedly

```bash
# Check specific channel
openclaw channel status telegram

# View channel logs for errors
openclaw logs --filter channel --follow

# Force reconnect
openclaw channel reconnect telegram
```

**Common causes:**
- Auth token expired — re-authenticate with `openclaw channel reconnect <name>`
- Rate limiting from the platform — check `max_messages_per_hour` config
- Network instability — check internet connection
- Bot was kicked/banned from a group

### Auth Token Expired

```
Error: 401 Unauthorized — Telegram bot token invalid
```

```bash
# Generate a new token from the platform
# Then update config
openclaw config set channels.telegram.bot_token "NEW_TOKEN"
openclaw gateway restart
```

For OAuth channels (Slack, Teams):

```bash
# Re-run OAuth flow
openclaw channel reconnect slack
```

### Messages Not Sending

```bash
# Check the channel is connected
openclaw channel status discord

# Check logs for send failures
openclaw logs --filter channel | grep -i "error\|fail\|reject"

# Common causes:
# - Bot lacks permissions in the channel/server
# - Message too long for platform limits
# - Rate limited by the platform
# - Channel/group ID not in allowed list
```

### Bot Responds to Everything in Group

The bot is replying to every message instead of only when mentioned:

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "discord": {
      "require_mention": true,     // Only respond when @mentioned
      "allowed_channels": ["bot-channel-id"]  // Restrict to specific channels
    }
  }
}
```

### WhatsApp QR Code Expired

```bash
# Restart the WhatsApp connection to get a new QR
openclaw channel reconnect whatsapp
# Scan the new QR code within 60 seconds
```

---

## Brain / LLM Issues

### API Key Errors

```
Error: 401 — Invalid API key
```

```bash
# Check the key is set
echo $ANTHROPIC_API_KEY

# Test the key directly
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4-5-20251001","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}' \
  | head -c 200

# If using OpenRouter
echo $OPENROUTER_API_KEY
curl -s https://openrouter.ai/api/v1/models -H "Authorization: Bearer $OPENROUTER_API_KEY" | head -c 200
```

### Model Not Found

```
Error: model "claude-3-opus" not found
```

Model names change. Common fixes:

| Old Name | Current Name |
|----------|-------------|
| `claude-3-opus` | `claude-opus-4-6` |
| `claude-3-sonnet` | `claude-sonnet-4-6` |
| `claude-3-haiku` | `claude-haiku-4-5-20251001` |

```bash
# Check what model is configured
openclaw config get brain.model

# Update to current model name
openclaw config set brain.model "claude-sonnet-4-6"
```

### Rate Limited

```
Error: 429 — Rate limit exceeded
```

```bash
# Check your usage
openclaw stats tokens

# Solutions:
# 1. Wait and retry (automatic backoff is built in)
# 2. Switch to a different model tier
# 3. Configure a fallback provider
```

```json5 title="Fallback provider"
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "fallback": {
      "provider": "openrouter",
      "model": "deepseek/deepseek-chat-v3-0324"
    }
  }
}
```

### Context Window Exceeded

```
Error: prompt is too long: 210,000 tokens > 200,000 token limit
```

```bash
# Reduce memory context loaded into prompts
openclaw config set memory.max_context_tokens 2000

# Or use a model with a larger context window
openclaw config set brain.model "claude-sonnet-4-6"  # 200k context
```

### Slow Responses

```bash
# Check which model is running
openclaw config get brain.model

# Check network latency
ping api.anthropic.com

# Check if provider is degraded
# Visit: status.anthropic.com or status.openai.com

# Quick fixes:
# - Use a faster model (Haiku instead of Opus)
# - Reduce max_tokens
# - Check if heartbeat is running expensive tasks
openclaw logs --filter brain --follow
```

### Thinking/Reasoning Mode Costs

Extended thinking can 10x token usage:

```json5
{
  "brain": {
    "thinking": {
      "enabled": false    // Disable if costs are too high
    }
  }
}
```

---

## MCP Server Issues

### Server Won't Connect

```bash
# Diagnose all servers
openclaw mcp doctor

# Test specific server
openclaw mcp probe filesystem

# Common causes:
# - npx/uvx not installed or not in PATH
# - Package name wrong
# - Missing dependencies
```

Test the server command directly:

```bash
# Run the command manually to see errors
npx -y @modelcontextprotocol/server-filesystem /tmp
# If this fails, the issue is with the server package, not OpenClaw
```

### Tool Not Found

```
Error: Tool "read_file" not found on server "filesystem"
```

```bash
# List what tools the server actually exposes
openclaw mcp probe filesystem

# Tool names may differ from what you expect
# Check allowed_tools / blocked_tools config for typos
```

### Environment Variable Not Expanding

```
Error: 401 — GitHub authentication failed
```

```bash
# Check the env var is set in your shell
echo $GITHUB_TOKEN

# Check it's referenced correctly in config (must use ${VAR} syntax)
openclaw config get mcp.servers.github.env
```

The `${VAR}` expansion happens at gateway startup. If you set the var after starting, restart the gateway.

### Server Crashes Mid-Session

```bash
# Check server logs
openclaw logs --filter mcp --follow

# stdio servers run as child processes — if they crash, OpenClaw logs the exit code
# Common causes:
# - Out of memory
# - Unhandled exception in server code
# - Network timeout for remote servers
```

---

## Plugin Issues

### Plugin Won't Load

```bash
# Check plugin state
openclaw plugins doctor

# Is it enabled?
openclaw plugins list

# View detailed state
openclaw plugins inspect workboard --runtime --json
```

### Missing Secrets at Startup

```
Error: Plugin @openclaw/copilot requires secret GITHUB_COPILOT_TOKEN
```

```bash
# Check what the plugin expects
openclaw plugins inspect @openclaw/copilot

# Set the env var
export GITHUB_COPILOT_TOKEN="your-token-here"

# Verify it's in config
openclaw config get plugins.entries.@openclaw/copilot.secrets
```

### Hooks Not Firing

```bash
# Is the plugin enabled?
openclaw plugins list

# Check for hook errors
openclaw logs --filter plugin --follow

# Restart gateway to reload hooks
openclaw gateway restart
```

### Corrupt Plugin State

```bash
# Diagnose
openclaw plugins doctor

# Clean reinstall
openclaw plugins uninstall workboard
openclaw plugins install workboard
openclaw gateway restart
```

### Gateway Won't Start After Plugin Install

```bash
# Disable the problem plugin without starting the gateway
openclaw plugins disable <name>

# Start gateway
openclaw gateway restart

# Diagnose
openclaw plugins doctor
```

---

## Memory Issues

### Agent Forgot Something

```bash
# Check what's in memory
ls ~/.openclaw/memory/
cat ~/.openclaw/memory/preferences.md

# Check context token limit (too low = memories get truncated)
openclaw config get memory.max_context_tokens

# Increase if needed
openclaw config set memory.max_context_tokens 4000
```

### Memory Not Saving

```bash
# Check auto_save
openclaw config get memory.auto_save

# Check directory exists and is writable
ls -la ~/.openclaw/memory/

# Check disk space
df -h ~/.openclaw

# Check logs for write errors
openclaw logs --filter memory
```

### Memory Corruption

Memory files are plain Markdown — you can edit them directly:

```bash
# View a memory file
cat ~/.openclaw/memory/contacts.md

# Edit manually
nano ~/.openclaw/memory/contacts.md

# Start fresh (nuclear option)
mv ~/.openclaw/memory ~/.openclaw/memory-backup
mkdir ~/.openclaw/memory
```

### Dreaming Not Running

```bash
# Check dreaming config
openclaw config get plugins.entries.memory-core.config.dreaming

# Verify the memory-core plugin is enabled
openclaw plugins list | grep memory-core

# Check cron schedule (default: 3 AM daily)
# Check logs around that time
openclaw logs --filter plugin | grep -i dream
```

---

## Skill Issues

### Skill Trigger Not Firing

```bash
# Check skill is installed
openclaw skill list

# Test the trigger directly
openclaw skill test ~/.openclaw/skills/my-skill.md "the trigger phrase"

# Check for trigger conflicts (another skill matching first)
openclaw skill list --verbose
```

**Common causes:**
- Trigger phrase doesn't match exactly
- Another skill has a broader trigger that matches first
- Skill file has YAML frontmatter errors

### Skill Validation Errors

```bash
# Validate structure
openclaw clawhub validate ./my-skill.md

# Scan for security issues
openclaw security scan ./my-skill.md
```

**Common frontmatter issues:**
- Missing required fields (name, version, description)
- Invalid YAML syntax (wrong indentation, missing quotes)
- Tool name doesn't exist

### Skill Tool Calls Failing

```bash
# Check what tools the skill requests
head -20 ~/.openclaw/skills/my-skill.md

# Verify those tools are available
# - chat, memory, http are built-in
# - Other tools need MCP servers or plugins connected
openclaw mcp status
```

---

## Heartbeat Issues

### Heartbeat Not Running

```bash
# Check if enabled
openclaw config get heartbeat.enabled

# Check interval
openclaw config get heartbeat.interval

# Check gateway is running
openclaw status

# Trigger manually
openclaw heartbeat --now

# Check logs
openclaw logs --filter heartbeat --follow
```

### HEARTBEAT_OK (Agent Does Nothing)

This is **normal** — it means the heartbeat ran but found nothing to do. If you expect it to take action:

```bash
# Check what tasks are defined
cat ~/.openclaw/HEARTBEAT.md

# Run with debug logging to see reasoning
OPENCLAW_LOG_LEVEL=debug openclaw heartbeat --now
```

### Heartbeat Too Expensive

```bash
# Check heartbeat token usage
openclaw stats heartbeat

# Solutions:
# 1. Increase interval (default 1800s = 30 min)
openclaw config set heartbeat.interval 3600

# 2. Use cheaper model for heartbeat
# Configure heartbeat_override in brain config

# 3. Set quiet hours
openclaw config set heartbeat.quiet_hours.start "23:00"
openclaw config set heartbeat.quiet_hours.end "07:00"

# 4. Simplify HEARTBEAT.md — fewer tasks = fewer tokens
```

### Heartbeat Dry-Run

Preview what the heartbeat would do without executing:

```bash
openclaw heartbeat --now --dry-run
```

---

## Performance Issues

### High Memory Usage

```bash
# Check memory usage
ps aux | grep openclaw

# Healthy idle: 150–250 MB
# Warning: >500 MB
# Critical: >1 GB
```

**Fixes:**
- Restart the gateway: `openclaw gateway restart`
- Reduce `max_context_tokens`
- Disable unused plugins
- Disconnect unused channels
- Set resource limits in Docker: `deploy.resources.limits.memory: 2G`

### High CPU Usage

```bash
# Check CPU
top -p $(cat ~/.openclaw/gateway.pid)

# Usually during active token processing — transient
# If sustained high CPU:
openclaw logs --follow  # Check for infinite loops
openclaw mcp status     # Check for stuck MCP servers
```

### Token Costs Exploding

```bash
# Where are tokens going?
openclaw stats tokens
openclaw gateway usage-cost

# Common cost drivers:
# 1. Heartbeat running too often with expensive model
# 2. Large context loading (high max_context_tokens)
# 3. Thinking/reasoning mode enabled
# 4. Chatty channels with no rate limiting
# 5. Skills that trigger on every message
```

See the [Cost Management](/guides/cost-management) guide for detailed optimization.

---

## Docker Issues

### Container Won't Start

```bash
# Check Docker is running
docker ps

# Check container logs
docker logs openclaw-container

# Pull latest image
docker pull openclaw/openclaw:latest

# Check for conflicting containers
docker ps -a | grep openclaw
```

### Volume Mount Issues

```bash
# Check permissions on host directory
ls -la ~/.openclaw/

# Ensure the container user (1000:1000 in hardened mode) can write
sudo chown -R 1000:1000 ~/.openclaw/
```

### Health Check Failing

```yaml title="docker-compose.yml"
healthcheck:
  test: ["CMD", "openclaw", "doctor"]
  interval: 30s
  timeout: 10s
  retries: 3
```

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' openclaw-container

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' openclaw-container
```

---

## Network Issues

### Gateway Exposed to Internet

```bash
# Check if gateway is bound to 0.0.0.0 (dangerous)
openclaw config get gateway.host

# Fix: bind to localhost only
openclaw config set gateway.host "127.0.0.1"
openclaw gateway restart
```

If you need external access, put it behind a reverse proxy with authentication.

### Behind a Reverse Proxy

```json5 title="~/.openclaw/openclaw.json"
{
  "gateway": {
    "bind": "loopback",
    "trustedProxies": ["127.0.0.1"]
  }
}
```

If `trustedProxies` is not set, the gateway may reject forwarded requests or log wrong IP addresses.

### Firewall Blocking Connections

```bash
# Check if OpenClaw can reach the LLM API
curl -s https://api.anthropic.com/v1/messages -o /dev/null -w "%{http_code}"

# Check if MCP servers can reach external services
openclaw mcp doctor

# Common ports to allow outbound:
# 443 (HTTPS) — LLM APIs, MCP remote servers
# 80 (HTTP) — some MCP servers
# 11434 — Ollama (if using local models)
```

### DNS Resolution Failures

```bash
# Test DNS
nslookup api.anthropic.com

# If DNS fails, check /etc/resolv.conf
# Or set DNS manually
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

---

## Post-Upgrade Issues

### Config Wiped After Upgrade

**Known issue in some v2026.5.x releases.** Always backup before upgrading:

```bash
tar czf ~/openclaw-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/openclaw.json \
  ~/.openclaw/workspace/ \
  ~/.openclaw/memory/ \
  ~/.openclaw/skills/
```

### Skills Broken After Upgrade

```bash
# Re-validate all skills
openclaw security scan --all

# Re-install broken skills
openclaw plugins doctor
openclaw gateway restart
```

### Rollback Procedure

```bash
# 1. Stop the agent
openclaw stop

# 2. Restore from backup
tar xzf ~/openclaw-backup-YYYYMMDD.tar.gz -C /

# 3. Downgrade
npm install -g openclaw@<previous-version>

# 4. Restart
openclaw start

# 5. Verify
openclaw doctor
```

---

## Key Files

| Path | Contents | When to Check |
|------|----------|--------------|
| `~/.openclaw/openclaw.json` | All configuration | Config errors, missing values |
| `~/.openclaw/gateway.pid` | Gateway process ID | Stale PID, "already running" errors |
| `~/.openclaw/logs/gateway.log` | Gateway runtime logs | Crash reasons, startup failures |
| `~/.openclaw/logs/audit.log` | Security audit trail | Who did what, when |
| `~/.openclaw/memory/` | Persistent memory files | Memory not saving, corruption |
| `~/.openclaw/skills/` | Installed skill files | Trigger failures, validation errors |
| `~/.openclaw/HEARTBEAT.md` | Heartbeat task definitions | Heartbeat not running, wrong behavior |
| `~/.openclaw/SOUL.md` | Agent identity/personality | Agent behaving strangely |
| `~/.openclaw/workspace/` | USER.md, IDENTITY.md | Agent context issues |

### Enable Audit Logging

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

---

## Quick Reference

### "It's Not Working" Flowchart

1. **`openclaw doctor`** — passes? If no, follow its guidance
2. **`openclaw status`** — gateway running? If no, start it
3. **`openclaw logs --lines 50`** — any errors? Search this page for the error message
4. **`openclaw channel list`** — channels connected? If no, reconnect
5. **`openclaw mcp doctor`** — MCP servers healthy? If no, check config
6. **`OPENCLAW_LOG_LEVEL=debug openclaw gateway`** — run in debug and reproduce the issue

### Emergency Reset

If everything is broken and you need a clean start:

```bash
# 1. Stop everything
openclaw stop
kill $(cat ~/.openclaw/gateway.pid) 2>/dev/null

# 2. Backup current state
mv ~/.openclaw ~/openclaw-broken-backup

# 3. Reinstall
npm install -g openclaw

# 4. Fresh init
openclaw init

# 5. Restore config selectively from backup
cp ~/openclaw-broken-backup/openclaw.json ~/.openclaw/
cp -r ~/openclaw-broken-backup/memory/ ~/.openclaw/
cp -r ~/openclaw-broken-backup/skills/ ~/.openclaw/

# 6. Restart
openclaw start
openclaw doctor
```

---

## Getting More Help

```bash
# Export full diagnostics for sharing
openclaw diagnostics > ~/openclaw-debug.txt
```

- **Discord:** [discord.gg/openclaw](https://discord.gg/openclaw) — fastest community support
- **GitHub Issues:** [github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues) — bug reports and feature requests
- **FAQ:** [/reference/faq](/reference/faq) — common questions

When reporting an issue, include:
1. Output of `openclaw doctor`
2. Output of `openclaw status --json`
3. Relevant log lines (`openclaw logs --lines 50`)
4. Your Node.js version (`node --version`)
5. Your OpenClaw version (`openclaw --version`)
6. Your OS and architecture

---

## See Also

- [FAQ](/reference/faq) — Frequently asked questions
- [CLI Reference](/reference/cli) — All commands and flags
- [Configuration](/reference/configuration) — All settings
- [CI/CD & Testing](/guides/cicd-testing) — Automated health checks and deployment validation
- [Cost Management](/guides/cost-management) — Token cost optimization
- [Security Hardening](/security/hardening) — Production security checklist
- [MCP Servers](/guides/mcp-servers) — MCP connection troubleshooting
- [Plugin System](/guides/plugin-system) — Plugin diagnostics
