---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Environment Variables
description: The environment variables a self-hoster actually uses with OpenClaw (paths, Gateway auth, provider keys, channels, logging), where to put them, and which old names no longer work
keywords: [openclaw, openclaw env vars, environment variables, api keys, OPENCLAW_GATEWAY_TOKEN, configuration, env config]
---

# Environment Variables

This page lists the environment variables most self-hosters need, as of v2026.10.4. The full supported list is upstream in [Environment variables](https://docs.openclaw.ai/help/environment). Undocumented `OPENCLAW_*` variables are internal and can disappear without notice, so do not build on them.

Most settings are **not** environment variables. Models, heartbeat, channels policy and tools live in `openclaw.json`; there is no `OPENCLAW_MODEL`, `OPENCLAW_PORT`, `OPENCLAW_HOST` or `OPENCLAW_AUTH_TOKEN`. Any config string can still read a variable with `${VAR_NAME}`; see [Configuration](/reference/configuration#environment-variable-substitution).

## Where OpenClaw reads them from

Highest priority first. A lower source never overrides a value that is already set.

1. The Gateway process environment (your shell, the systemd/launchd unit, the container).
2. `.env` in the current working directory. Provider keys and `OPENCLAW_*` controls in this file are ignored.
3. `~/.openclaw/.env` (or `$OPENCLAW_STATE_DIR/.env`). **This is the recommended place for API keys.**
4. The `env.vars` block in `openclaw.json`.
5. Optionally, your login shell (`env.shellEnv.enabled: true` or `OPENCLAW_LOAD_SHELL_ENV=1`), only for keys still missing.

```bash title="~/.openclaw/.env"
ANTHROPIC_API_KEY=sk-ant-replace-me
TELEGRAM_BOT_TOKEN=123456:replace-me
OPENCLAW_GATEWAY_TOKEN=replace-with-a-long-random-string
```

`.env` values are not expanded: `OPENCLAW_WORKSPACE_DIR=${HOME}/ws` stays literal. Use absolute paths. Node-level variables such as `NODE_EXTRA_CA_CERTS` must be in the real process environment, not only in `~/.openclaw/.env`.

## Paths and instances

| Variable | Purpose |
|----------|---------|
| `OPENCLAW_STATE_DIR` | State directory (default `~/.openclaw`). Expands `~`. |
| `OPENCLAW_CONFIG_PATH` | Config file (default `~/.openclaw/openclaw.json`). Expands `~`. |
| `OPENCLAW_WORKSPACE_DIR` | Default agent workspace (default `~/.openclaw/workspace`). Does **not** expand `~`. |
| `OPENCLAW_HOME` | Replaces the *home directory* used for path defaults, so state lands in `$OPENCLAW_HOME/.openclaw`. Useful for a dedicated service user. |
| `OPENCLAW_PROFILE` | Named profile with isolated state, same as `--profile`. |
| `OPENCLAW_INCLUDE_ROOTS` | Extra directories `$include` may read from (default: config directory only). |

## Gateway and authentication

| Variable | Purpose |
|----------|---------|
| `OPENCLAW_GATEWAY_TOKEN` | Token auth, read by both the Gateway and clients. |
| `OPENCLAW_GATEWAY_PASSWORD` | Password auth, read by both the Gateway and clients. |
| `OPENCLAW_GATEWAY_PORT` | Local Gateway port. Precedence: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`. |
| `OPENCLAW_GATEWAY_URL` | Remote Gateway URL for clients on another machine. |

There is no environment variable for the bind address. Set `gateway.bind` in config or pass `--bind`. Binding beyond loopback (`lan`) exposes the Gateway to your network; read [Security Hardening](/security/hardening) first.

## Model provider keys

Core and bundled provider plugins read about a hundred credential variables; the [upstream list](https://docs.openclaw.ai/help/environment#provider-credentials) is complete. The common ones:

| Variable | Provider |
|----------|----------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude). `ANTHROPIC_OAUTH_TOKEN` for token auth. |
| `OPENAI_API_KEY` | OpenAI. `CODEX_API_KEY` is the Codex harness key and is checked before `OPENAI_API_KEY` there. |
| `GEMINI_API_KEY`, `GOOGLE_API_KEY` | Google Gemini |
| `OPENROUTER_API_KEY` | OpenRouter |
| `XAI_API_KEY` | xAI (Grok) |
| `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `PERPLEXITY_API_KEY` | Those providers |
| `OLLAMA_API_KEY`, `VLLM_API_KEY` | Local/self-hosted servers that need a key |

`OLLAMA_HOST` is read by the Ollama server, not by OpenClaw. To point OpenClaw at Ollama, set `models.providers.ollama.baseUrl`. For per-provider scoping, prefer a SecretRef on the provider's `apiKey` field over one process-wide variable.

## Channel credentials

These fill in the **default account** of each channel. Additional accounts need their credentials in `openclaw.json` (ideally as SecretRefs).

| Variable | Channel |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from BotFather |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` | Slack bot token (`xoxb-`) and Socket Mode app token (`xapp-`) |
| `GOOGLE_CHAT_SERVICE_ACCOUNT`, `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` | Google Chat service account, inline JSON or file path |
| `IRC_NICKSERV_PASSWORD` | IRC NickServ password |

WhatsApp and Signal link by QR code or device pairing and have no token variable.

## Web search and tools

| Variable | Purpose |
|----------|---------|
| `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `PARALLEL_API_KEY` | Web search providers (Parallel is bundled) |
| `FIRECRAWL_API_KEY` | Firecrawl fetch/scrape |
| `ELEVENLABS_API_KEY` (or `XI_API_KEY`) | ElevenLabs text-to-speech |

The macOS app's Talk mode also reads `ELEVENLABS_VOICE_ID`, `SAG_VOICE_ID` and `OPENCLAW_MLX_TTS_BIN`; the Gateway does not.

## Logging, troubleshooting and toggles

| Variable | Purpose |
|----------|---------|
| `OPENCLAW_LOG_LEVEL` | File and console log level (`debug`, `trace`, ...). Overrides `logging.level`. |
| `OPENCLAW_DEBUG=1` | Include diagnostics in CLI error output when you rerun a failing command. |
| `OPENCLAW_SKIP_CHANNELS=1` | Start the Gateway without channel transports. |
| `OPENCLAW_SKIP_CRON=1` | Start without running automations (same as `cron.enabled: false`). |
| `OPENCLAW_LOAD_SHELL_ENV=1` | Import missing keys from your login shell. |
| `OPENCLAW_NO_AUTO_UPDATE=1` | Do not apply updates automatically. |
| `OPENCLAW_OFFLINE=1` | Do not download the pinned `fd`/`ripgrep` helpers. |
| `OPENCLAW_BROWSER_HEADLESS` | Force the managed browser headed (`0`) or headless (`1`). |
| `OPENCLAW_CONFIG_READONLY=1` | Treat config as externally managed and immutable. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Turn off ClawHub install reports. |

`OPENCLAW_BROWSER_CDP_PORT`, `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT` and the other `OPENCLAW_BROWSER_*` flags you may see in older guides configure the **sandbox browser container** only, not the host browser; see [Sandbox config](https://docs.openclaw.ai/gateway/config-agents/sandbox).

## Variables OpenClaw sets for child processes

Commands run by the `exec` tool see `OPENCLAW_SHELL=exec`; local TUI `!` commands see `OPENCLAW_SHELL=tui-local`; children of the CLI see `OPENCLAW_CLI=1`. You can test these in shell profiles. You do not set them yourself.

## Lobster (separate project)

These belong to the [Lobster](/guides/lobster-workflows) workflow engine (repo `openclaw/lobster`), not to OpenClaw core: `LOBSTER_LLM_PROVIDER`, `LOBSTER_LLM_ADAPTER_URL`, `LOBSTER_PI_LLM_ADAPTER_URL`, `LOBSTER_LLM_PRICING_JSON`, and `OPENCLAW_URL` / `OPENCLAW_TOKEN` for its `openclaw.invoke` shim.

## MCP servers

Variables for an MCP server are passed per server in `openclaw.json`, not inherited globally. Which variables a server needs is up to that server.

```json5 title="~/.openclaw/openclaw.json"
{
  mcp: {
    servers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/me/projects"],
        env: { NODE_ENV: "production" },
      },
    },
  },
}
```

For GitHub, the maintained server is [github/github-mcp-server](https://github.com/github/github-mcp-server); the old `@modelcontextprotocol/server-github` npm package is deprecated.

## Legacy variables

The Clawdbot/Moltbot-era prefixes **no longer work**:

| Variable | Replacement | Status |
|----------|------------|--------|
| `CLAWDBOT_*` | `OPENCLAW_*` | Native before the rename (v2026.1.29), then aliases; **removed in v2026.3.22** |
| `MOLTBOT_*` | `OPENCLAW_*` | **Removed in v2026.3.22** |

Since v2026.4.27 the Gateway prints a one-time `OPENCLAW_LEGACY_ENV_VARS` deprecation warning when either prefix is still set, and the old names have no effect. Rename each one by swapping the prefix, for example `CLAWDBOT_GATEWAY_TOKEN` → `OPENCLAW_GATEWAY_TOKEN`. Sources: upstream `CHANGELOG/2026.3.22.md`, `CHANGELOG/2026.4.27.md`, [Environment variables](https://docs.openclaw.ai/help/environment#legacy-environment-variables).

## Workspace .env security {#workspace-env-security}

A `.env` file inside an agent workspace is untrusted input, so OpenClaw drops sensitive keys from it before applying precedence:

- every known provider credential (for example `GEMINI_API_KEY`, `XAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`);
- any key ending in `_API_HOST`, `_BASE_URL`, `_ENDPOINT` or `_HOMESERVER` (endpoint redirects);
- the whole `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` and `OPENAI_API_KEY_*` namespaces.

This stops a cloned repository from hijacking your credentials or redirecting API calls. Keep keys in `~/.openclaw/.env` or the service environment instead. Background: [Workspace .env files](https://docs.openclaw.ai/gateway/security/secrets-and-storage#workspace-env-files).

## Docker Compose

The official image runs as user `node`, so state lives at `/home/node/.openclaw`. The fragment below is trimmed from upstream's `docker-compose.yml`. Run onboarding into the volume first (the [Docker guide](https://docs.openclaw.ai/install/docker) has a setup script), because the Gateway refuses to start until `gateway.mode` is `local`.

```yaml title="docker-compose.yml"
services:
  openclaw-gateway:
    image: ghcr.io/openclaw/openclaw:latest
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      OPENCLAW_LOG_LEVEL: info
    command: ["node", "dist/index.js", "gateway", "--bind", "lan", "--port", "18789"]
    ports:
      - "127.0.0.1:18789:18789"    # publish on the host's loopback only
    volumes:
      - openclaw-state:/home/node/.openclaw
    healthcheck:
      test: ["CMD", "node", "dist/docker-healthcheck.js"]
      interval: 30s
      timeout: 5s
      retries: 5
volumes:
  openclaw-state:
```

Inside the container the Gateway binds `lan` so Docker's port mapping can reach it; the `127.0.0.1:` prefix keeps it off your host's network. The healthcheck uses `/healthz`.

## See also

- [Configuration Reference](/reference/configuration)
- [CLI Reference](/reference/cli)
- [Security Hardening](/security/hardening)
- [Environment variables](https://docs.openclaw.ai/help/environment) (official, complete list)
