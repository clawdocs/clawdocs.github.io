---
sidebar_position: 5
title: Troubleshooting
description: Common OpenClaw issues and how to fix them
---

# Troubleshooting

Solutions for the most commonly reported OpenClaw issues.

## Gateway Won't Start

### Port already in use

```bash
# Find what's using the port
lsof -i :18789

# Kill the process or use a different port
openclaw gateway --port 19000
```

### Permission denied

```bash
# Check if another instance is running
openclaw status

# Remove stale PID file
rm ~/.openclaw/gateway.pid

# Try again
openclaw gateway
```

### Node.js version too old

```
Error: OpenClaw requires Node.js >= 22
```

```bash
# Check version
node --version

# Update Node.js
nvm install 22
nvm use 22
```

## Connection Issues

### "Gateway not running" when using `openclaw chat`

```bash
# Check if gateway is actually running
openclaw status

# Start it if not
openclaw gateway --daemon

# Check logs for crash reasons
openclaw logs --lines 100
```

### Channel disconnects repeatedly

```bash
# Check channel status
openclaw channel status whatsapp

# Reconnect
openclaw channel reconnect whatsapp

# Check if auth has expired
openclaw logs --filter channel
```

## LLM / Brain Issues

### API key errors

```bash
# Verify your key is set
echo $ANTHROPIC_API_KEY

# Test the key directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4-5-20251001","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
```

### High token costs

- Switch heartbeat to a cheaper model (Haiku)
- Increase heartbeat interval
- Set quiet hours
- Review `openclaw stats tokens` for cost breakdown
- Consider [local models](/guides/local-models)

### Slow responses

- Check your internet connection
- Try a smaller/faster model
- Reduce `max_tokens` in config
- Check if the model endpoint is overloaded

## Memory Issues

### Agent forgot something

```bash
# Check what's in memory
ls ~/.openclaw/memory/
cat ~/.openclaw/memory/preferences.md

# Verify max_context_tokens isn't too low
openclaw config get memory.max_context_tokens
```

### Memory not saving

```bash
# Check auto_save is enabled
openclaw config get memory.auto_save

# Check directory permissions
ls -la ~/.openclaw/memory/

# Check disk space
df -h ~/.openclaw
```

## Docker / Sandbox Issues

### Docker sandbox not starting

```bash
# Check Docker is running
docker ps

# Pull the sandbox image
docker pull openclaw/sandbox:latest

# Check for conflicting containers
docker ps -a | grep openclaw
```

### Cron jobs malfunction

This is a known issue. Workaround:

```bash
# Use the heartbeat system instead of cron
# Edit HEARTBEAT.md for scheduled tasks
vim ~/.openclaw/HEARTBEAT.md
```

## Build / Install Issues

### `pnpm install` fails (developer mode)

```bash
# Clear caches
rm -rf node_modules
pnpm store prune

# Reinstall
pnpm install
```

### macOS menubar app crashes

```bash
# Reset the menubar app
openclaw install-menubar --reset

# Check system logs
log show --predicate 'process == "openclaw-menubar"' --last 5m
```

## Getting More Help

```bash
# Verbose logging
OPENCLAW_LOG_LEVEL=debug openclaw gateway

# Export diagnostic info
openclaw diagnostics > ~/openclaw-debug.txt

# Join the community
# Discord: https://discord.gg/openclaw
# GitHub Issues: https://github.com/openclaw/openclaw/issues
```

## See Also

- [FAQ](/reference/faq) — Frequently asked questions
- [Configuration](/reference/configuration) — All settings
- [Security Hardening](/security/hardening) — If your issue is security-related
