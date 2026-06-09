---
sidebar_position: 4
title: Environment Variables
description: All environment variables that configure OpenClaw behavior — API keys, gateway, channels, browser, voice, Lobster, and deployment
---

# Environment Variables

OpenClaw reads these environment variables at startup. They override corresponding `openclaw.json` settings. Variables are grouped by function.

:::tip
Any config value in `openclaw.json` can also reference environment variables using `${VAR_NAME}` syntax. See [Configuration Reference](/reference/configuration#environment-variable-substitution).
:::

---

## LLM API Keys

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude models |
| `OPENAI_API_KEY` | OpenAI API key for GPT models |
| `CODEX_API_KEY` | OpenAI fallback key (used if `OPENAI_API_KEY` is not set) |
| `XAI_API_KEY` | xAI API key for Grok models |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_API_KEY` | Google API key (alternative to `GEMINI_API_KEY`) |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `MISTRAL_API_KEY` | Mistral AI API key |
| `GROQ_API_KEY` | Groq API key |
| `PERPLEXITY_API_KEY` | Perplexity API key |
| `OPENROUTER_API_KEY` | OpenRouter meta-provider API key |

---

## Gateway

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_PORT` | `18789` | Gateway WebSocket port |
| `OPENCLAW_HOST` | `127.0.0.1` | Gateway bind address |
| `OPENCLAW_AUTH_TOKEN` | — | Gateway authentication token |
| `OPENCLAW_LOG_LEVEL` | `info` | Log verbosity: `debug`, `info`, `warn`, `error` |

:::warning
Never set `OPENCLAW_HOST` to `0.0.0.0` unless the gateway is behind a reverse proxy with authentication. Binding to all interfaces exposes the gateway to the network. See [Security Hardening](/security/hardening).
:::

---

## Paths

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_HOME` | `~/.openclaw` | Base directory for all OpenClaw data |
| `OPENCLAW_CONFIG_PATH` | `~/.openclaw/openclaw.json` | Config file path |
| `OPENCLAW_MEMORY_PATH` | `~/.openclaw/memory` | Memory directory |
| `OPENCLAW_SKILLS_PATH` | `~/.openclaw/skills` | Skills directory |
| `OPENCLAW_WORKSPACE_DIR` | — | Default workspace directory for agents |

---

## Brain

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_PROVIDER` | `anthropic` | LLM provider name |
| `OPENCLAW_MODEL` | `claude-opus-4-6` | Model identifier |
| `OPENCLAW_TEMPERATURE` | `0.7` | Response temperature (0.0-1.0) |
| `OPENCLAW_MAX_TOKENS` | `4096` | Max response tokens |

---

## Heartbeat

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_HEARTBEAT_ENABLED` | `true` | Enable heartbeat loop |
| `OPENCLAW_HEARTBEAT_INTERVAL` | `1800` | Seconds between heartbeats |

---

## Local Models

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_LOCAL_ENDPOINT` | — | Local model API endpoint |
| `OPENCLAW_LOCAL_MODEL` | — | Local model name |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |
| `VLLM_API_KEY` | — | vLLM server API key (for auto-discovery) |

---

## Channel Credentials

These variables set credentials for the **default account** of each channel. In multi-account setups, credentials must be set per-account in `openclaw.json` — env vars do not propagate to non-default accounts.

| Variable | Channel | Description |
|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram | Bot token from BotFather |
| `DISCORD_BOT_TOKEN` | Discord | Bot token from Discord Developer Portal |
| `SLACK_BOT_TOKEN` | Slack | Bot OAuth token (`xoxb-...`) |
| `SLACK_APP_TOKEN` | Slack | App-level token for Socket Mode (`xapp-...`) |
| `GOOGLE_CHAT_SERVICE_ACCOUNT` | Google Chat | Service account JSON (inline) |
| `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` | Google Chat | Path to service account JSON file |
| `IRC_NICKSERV_PASSWORD` | IRC | NickServ password for authentication |

:::info
WhatsApp and Signal use QR code / device linking authentication rather than API tokens, so they have no credential env vars.
:::

---

## Search & Web Providers

| Variable | Description |
|----------|-------------|
| `PARALLEL_API_KEY` | Parallel web search provider (bundled since v2026.6.5) |
| `BRAVE_API_KEY` | Brave Search API key |
| `TAVILY_API_KEY` | Tavily search API key |
| `EXA_API_KEY` | Exa search API key |
| `FIRECRAWL_API_KEY` | Firecrawl web scraping API key |

---

## Browser Automation

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_BROWSER_CDP_PORT` | — | Chrome DevTools Protocol port override |
| `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS` | — | Disable GPU rendering flags |
| `OPENCLAW_BROWSER_DISABLE_EXTENSIONS` | — | Disable browser extensions |
| `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT` | `2` | Max browser renderer processes |

---

## Voice & TTS

| Variable | Description |
|----------|-------------|
| `OPENCLAW_MLX_TTS_BIN` | Path to macOS MLX TTS helper binary |
| `ELEVENLABS_API_KEY` | ElevenLabs voice API key |
| `XI_API_KEY` | ElevenLabs API key (alternative name) |
| `ELEVENLABS_VOICE_ID` | Default ElevenLabs voice ID |
| `SAG_VOICE_ID` | SAG voice provider voice ID |

---

## Lobster (Workflow Engine)

| Variable | Description |
|----------|-------------|
| `LOBSTER_LLM_PROVIDER` | LLM provider override: `openclaw`, `pi`, `http` |
| `LOBSTER_LLM_ADAPTER_URL` | Generic HTTP LLM endpoint |
| `LOBSTER_PI_LLM_ADAPTER_URL` | Pi LLM adapter endpoint |
| `LOBSTER_LLM_PRICING_JSON` | Path to custom token pricing file |
| `OPENCLAW_URL` | Gateway URL for `openclaw.invoke` shim (default: `ws://localhost:18789`) |
| `OPENCLAW_TOKEN` | Gateway auth token for `openclaw.invoke` shim |

See [Lobster Workflows Guide](/guides/lobster-workflows) for full Lobster documentation.

---

## MCP Servers

MCP server environment variables are set per-server in `openclaw.json`, not as global env vars:

```json5 title="~/.openclaw/openclaw.json"
{
  "mcp": {
    "servers": {
      "github": {
        "command": "npx @anthropic/mcp-github",
        "env": {
          "GITHUB_TOKEN": "${GITHUB_TOKEN}"
        }
      }
    }
  }
}
```

Common MCP-related env vars:

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub personal access token (used by MCP GitHub server) |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Alternative GitHub token name |

---

## Testing & CI

| Variable | Description |
|----------|-------------|
| `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` | Timeout for npm installs in E2E tests |
| `OPENCLAW_TESTBOX` | Delegate execution to a remote Testbox instance |

---

## Legacy Variables

These variables are from the Clawdbot/Moltbot era and may still work but are deprecated:

| Variable | Replacement | Notes |
|----------|------------|-------|
| `CLAWDBOT_*` | `OPENCLAW_*` | All `CLAWDBOT_` prefixed vars map to `OPENCLAW_` equivalents |

---

## Workspace .env Security

Workspace `.env` files are **blocked** from overriding security-sensitive variables. This is a fail-closed design — new `OPENCLAW_*` variables in future releases are automatically blocked.

**Blocked categories:**
- All `OPENCLAW_*` variables
- Provider credential keys: `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`
- Channel endpoint settings for Matrix, Mattermost, IRC, Synology Chat

This prevents malicious workspaces from hijacking credentials or redirecting API calls. See [Security Hardening](/security/hardening) for details.

---

## Docker Compose Example

```yaml title="docker-compose.yml"
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENCLAW_HOST=0.0.0.0          # Only safe within Docker network
      - OPENCLAW_LOG_LEVEL=debug
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN}
      - PARALLEL_API_KEY=${PARALLEL_API_KEY}
    ports:
      - "127.0.0.1:18789:18789"        # Bind to localhost on host
    volumes:
      - openclaw-data:/root/.openclaw
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:18789/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

---

## Precedence Order

When the same setting is configured in multiple places, this order applies (highest wins):

1. **CLI flags** (`--port 18790`)
2. **Environment variables** (`OPENCLAW_PORT=18790`)
3. **openclaw.json** (`"gateway": { "port": 18790 }`)
4. **Built-in defaults** (`18789`)

---

## See Also

- [Configuration Reference](/reference/configuration) — Full `openclaw.json` schema
- [CLI Reference](/reference/cli) — Command-line flags
- [Security Hardening](/security/hardening) — Security-focused config
- [Lobster Workflows](/guides/lobster-workflows) — Lobster environment variables
- [Local Models](/guides/local-models) — Local model environment setup
