---
sidebar_position: 4
title: Environment Variables
description: All environment variables that configure OpenClaw behavior
---

# Environment Variables

OpenClaw reads these environment variables. They override corresponding `config.yml` settings.

## LLM API Keys

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude models |
| `OPENAI_API_KEY` | OpenAI API key for GPT models |
| `XAI_API_KEY` | xAI API key for Grok models |

## Gateway

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_PORT` | `18789` | Gateway WebSocket port |
| `OPENCLAW_HOST` | `127.0.0.1` | Gateway bind address |
| `OPENCLAW_AUTH_TOKEN` | — | Gateway authentication token |
| `OPENCLAW_LOG_LEVEL` | `info` | Log verbosity: debug, info, warn, error |

## Paths

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_HOME` | `~/.openclaw` | Base directory for all OpenClaw data |
| `OPENCLAW_CONFIG` | `~/.openclaw/config.yml` | Config file path |
| `OPENCLAW_MEMORY_PATH` | `~/.openclaw/memory` | Memory directory |
| `OPENCLAW_SKILLS_PATH` | `~/.openclaw/skills` | Skills directory |

## Brain

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_PROVIDER` | `anthropic` | LLM provider |
| `OPENCLAW_MODEL` | `claude-opus-4-6` | Model identifier |
| `OPENCLAW_TEMPERATURE` | `0.7` | Response temperature |
| `OPENCLAW_MAX_TOKENS` | `4096` | Max response tokens |

## Heartbeat

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_HEARTBEAT_ENABLED` | `true` | Enable heartbeat |
| `OPENCLAW_HEARTBEAT_INTERVAL` | `1800` | Seconds between heartbeats |

## Local Models

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_LOCAL_ENDPOINT` | — | Local model API endpoint |
| `OPENCLAW_LOCAL_MODEL` | — | Local model name |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |

## Example: Docker Compose

```yaml title="docker-compose.yml"
services:
  openclaw:
    image: openclaw/openclaw:latest
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENCLAW_HOST=0.0.0.0  # Only within Docker network
      - OPENCLAW_LOG_LEVEL=debug
    ports:
      - "127.0.0.1:18789:18789"  # Bind to localhost on host
    volumes:
      - openclaw-data:/root/.openclaw
```

## See Also

- [Configuration Reference](/reference/configuration) — YAML config file format
- [CLI Reference](/reference/cli) — Command-line flags
