---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Troubleshooting & Debugging
description: Diagnose and fix common OpenClaw problems with real commands, log signatures and config keys for v2026.10.4
keywords: [openclaw, openclaw troubleshooting, fix, debug, openclaw not working, common errors, diagnostics]
---

# Troubleshooting & Debugging

A short, tested companion to the official runbooks. Every command here exists in OpenClaw v2026.10.4, and every error string is quoted from upstream docs or source. For the full symptom index, see the upstream [General troubleshooting](https://docs.openclaw.ai/help/troubleshooting) hub and the deep [Gateway troubleshooting](https://docs.openclaw.ai/gateway/troubleshooting) runbook.

---

## First Steps

Run this ladder in order. Each step is read-only.

```bash
openclaw status            # channels, auth, versions at a glance
openclaw gateway status    # service state, probe, capability
openclaw doctor            # config and service checks (add --fix to repair)
openclaw channels status --probe
openclaw logs --follow     # live gateway log
```

Healthy output: `openclaw gateway status` shows `Runtime: running`, `Connectivity probe: ok` and a `Capability: ...` line; `openclaw doctor` reports no blocking issues; `channels status --probe` shows each account connected (and `works` or `audit ok` where supported).

If you want one bundle to hand to a person or a coding agent, `openclaw triage` writes a sanitized diagnosis and, when the Gateway is reachable, a support archive.

---

## Diagnostic Commands

### Core

| Command | What it does |
|---|---|
| `openclaw status --all` | Full read-only diagnosis, safe to paste |
| `openclaw status --deep` | Also probes channel connections |
| `openclaw status --usage` | Provider usage and quota snapshots |
| `openclaw gateway probe` | Reachability and auth capability, local and remote |
| `openclaw gateway diagnostics export` | Payload-free diagnostics `.zip` for bug reports |
| `openclaw doctor --deep` | Also scans system services for extra gateway installs |
| `openclaw config validate` | Validate `openclaw.json` without starting the gateway |
| `openclaw config file` | Print which config file is active |

### Logs

The Gateway writes JSON-lines logs to `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (or `logging.file`), pruned after 24 hours. Read them through the CLI rather than by path:

```bash
openclaw logs --limit 100          # last 100 lines (default 200)
openclaw logs --follow             # tail
openclaw logs --follow --json      # one JSON event per line, for jq/grep
openclaw channels logs --channel telegram --lines 50
```

There is no `--filter` flag. Use `openclaw channels logs --channel <id>` for channel traffic, or pipe `--json` output through `grep`/`jq`. Details: [Logging](https://docs.openclaw.ai/logging), [`openclaw logs`](https://docs.openclaw.ai/cli/logs).

### Debug Mode

```bash
OPENCLAW_LOG_LEVEL=debug openclaw gateway run      # one foreground run at debug level
openclaw --log-level debug gateway run             # same, as a global flag (wins over the env var)
```

`--log-level` overrides `OPENCLAW_LOG_LEVEL`, which overrides `logging.level` in config.

### Component Diagnostics

```bash
openclaw mcp doctor                 # static MCP server config problems
openclaw mcp status                 # transport status without connecting
openclaw mcp probe <name>           # connect and list a server's tools
openclaw plugins doctor             # plugin load issues
openclaw plugins inspect <id> --runtime --json
openclaw skills check               # which skills are ready or missing requirements
openclaw security audit --deep      # security posture, with live probes
openclaw gateway usage-cost --days 7
```

---

## Gateway Issues

### Port Already in Use

Log signature:

```text
another gateway instance is already listening on ws://127.0.0.1:18789
```

Startup retries the bind for about 10 seconds first. If it still fails, either a gateway is already running for this state directory, or something else owns the port.

```bash
openclaw gateway status            # is it our gateway?
lsof -i :18789                     # what owns the port
openclaw gateway stop              # stop the managed service
openclaw gateway run --port 19001  # or run on another port
```

To run a second gateway on purpose, give it its own profile (state dir, config and port): `openclaw --profile work gateway run --port 19001`. See [Multi-instance isolation](https://docs.openclaw.ai/gateway/config-gateway).

### Stale Lock After a Crash {#stale-pid-file}

There is no `gateway.pid` file. Ownership is a lock under `$OPENCLAW_STATE_DIR/tmp/openclaw-<uid>/` (`state.<hash>.lock` plus `gateway.state.lock`). A lock held by a dead process is recovered automatically on the next start, so do not delete these files by hand. If another live OpenClaw process holds state, startup waits up to five minutes and then reports:

```text
failed to acquire gateway state ownership; waited <ms>ms for Gateway state ownership
```

Find and stop the other process (`openclaw gateway status --deep`, `openclaw doctor --deep`). See [Gateway lock](https://docs.openclaw.ai/gateway/gateway-lock).

### Gateway Refuses to Start

Common log signatures and fixes:

| Signature | Cause | Fix |
|---|---|---|
| `Gateway start blocked: set gateway.mode=local` | Config is in remote mode | `openclaw config set gateway.mode local`, or run against the remote gateway |
| `Gateway start blocked: existing config is missing gateway.mode.` | Old or hand-written config | `openclaw doctor --fix` |
| `refusing to bind gateway to <host>:<port> without auth` | Non-loopback bind with no token/password | Set `gateway.auth`, or go back to `gateway.bind: "loopback"` |
| Invalid config / unknown key | Retired or misspelled key | `openclaw config validate`, then `openclaw doctor --fix` |

Doctor refuses some retired keys instead of migrating them (top-level `heartbeat`, `channels.telegram.requireMention`, and others). A legacy `agents.list` roster is different: normal config reads reject it, but `openclaw doctor --fix` converts it to keyed `agents.entries`. The lists are in [Config migrations](https://docs.openclaw.ai/gateway/doctor/config-migrations).

### Node.js Version Too Old

```text
openclaw requires Node >=24.16.0 <25, or >=26.1.0.
```

Node 22, 23 and 25 are not supported. Install Node 26 (recommended) or 24.16+ with your version manager, for example `nvm install 26 && nvm use 26`, then re-run `openclaw`. See [Node.js](https://docs.openclaw.ai/install/node).

### Permission Denied

Usually the state directory is owned by another user (often after running once with `sudo`, or with Docker bind mounts). Fix ownership rather than loosening permissions:

```bash
sudo chown -R "$(id -u):$(id -g)" ~/.openclaw
openclaw doctor --fix
openclaw security audit --fix      # tightens state/config file modes
```

Docker images run as `node` (uid 1000); `chown -R 1000:1000` the host directories you mount.

### Gateway Won't Stop

```bash
openclaw gateway stop
openclaw gateway status
```

On macOS, if launchd keeps respawning it, `openclaw gateway stop --disable` suppresses KeepAlive until the next `openclaw gateway start`. If the service definition itself is wrong, `openclaw gateway install --force` rewrites it.

---

## Channel Issues

### Channel Disconnects or Shows Logged Out

```bash
openclaw channels status --probe
openclaw channels logs --channel <id> --lines 100
```

There is no `reconnect` command. Re-link with:

```bash
openclaw channels logout --channel whatsapp
openclaw channels login --channel whatsapp     # shows a fresh QR code
```

For token channels (Telegram, Discord, Slack), update the token and restart:

```bash
openclaw config set channels.telegram.botToken "<new-token>"
openclaw gateway restart
```

The key is `channels.telegram.botToken` (or `tokenFile`), not `bot_token`. `openclaw channels add` (interactive) also works.

### Messages Not Arriving or Not Answered

Log signatures from the upstream runbook:

- `pairing request` → the sender is not approved yet. Approve with `openclaw pairing list --channel <id>` and `openclaw pairing approve ...`.
- `drop guild message (mention required` → Discord mention gating dropped it.
- `blocked` / `allowlist` → the sender, room or group is filtered by `dmPolicy`, `groupPolicy` or `allowFrom`.
- `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → the bot lacks platform permissions.

See [Channel troubleshooting](https://docs.openclaw.ai/channels/troubleshooting) and [Pairing](https://docs.openclaw.ai/channels/pairing).

### Bot Responds to Everything in Group

Mention gating lives per group, not as a flat channel flag:

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
        },
      },
    },
    telegram: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

`channels.telegram.requireMention` directly under `channels.telegram` is a retired key that Doctor refuses.

### WhatsApp QR Code Expired

```bash
openclaw channels login --channel whatsapp
```

Scan the new code promptly from WhatsApp, Settings, Linked devices.

---

## Model / Provider Issues {#brain--llm-issues}

### API Key Errors

```text
No API key found for provider "anthropic".
```

```bash
openclaw models status --probe        # live-check each configured provider
openclaw models auth login            # sign in or paste a key
openclaw models auth list
```

Keys in a workspace `.env` cannot override provider keys or `OPENCLAW_*` variables. See [Environment](https://docs.openclaw.ai/help/environment).

### Model Not Found

```text
Unknown model: anthropic/claude-opus-4-6
```

Model refs are `provider/model`. Config lives at `agents.defaults.model`, not `brain.model`:

```bash
openclaw models list
openclaw models set anthropic/claude-sonnet-5-5
openclaw models fallbacks add openai/gpt-6-astra
```

or in config:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-5-5",
        fallbacks: ["openai/gpt-6-astra"],
      },
      thinkingDefault: "low",
    },
  },
}
```

### Rate Limited

Provider 429s fail over to `fallbacks` automatically. One Anthropic case needs a specific fix:

```text
HTTP 429: rate_limit_error: Extra usage is required for long context requests
```

Use a standard context window or an eligible credential; see the upstream [runbook entry](https://docs.openclaw.ai/gateway/troubleshooting/skills-and-model-providers#anthropic-429-extra-usage-required-for-long-context). Check usage with `openclaw status --usage` and `openclaw gateway usage-cost`.

### Context Window Exceeded or Slow Responses

- Run `/compact` in the chat to summarise the session.
- Large workspace files are injected on every turn. Trim `MEMORY.md`/`AGENTS.md`, or lower `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` ([Agent workspace](https://docs.openclaw.ai/concepts/agent-workspace)).
- Thinking costs tokens and time. Set `agents.defaults.thinkingDefault` or use `/think` per session ([Thinking](https://docs.openclaw.ai/tools/thinking)).

### Local OpenAI-Compatible Backend Fails

If direct `/v1/chat/completions` calls work but agent turns fail: set `models.providers.<provider>.models[].compat.requiresStringContent: true` when the error mentions `messages[].content`, and try `compat.supportsTools: false` next. See the upstream [General troubleshooting](https://docs.openclaw.ai/help/troubleshooting).

### GitHub Copilot

Copilot does not take a token in plugin config. Sign in with the device flow:

```bash
openclaw models auth login-github-copilot
```

---

## MCP Server Issues

```bash
openclaw mcp doctor
openclaw mcp status
openclaw mcp probe <name>      # lists the tools the server really exposes
openclaw mcp reload            # pick up config changes on the next turn
```

Common causes: `npx`/`uvx` not on the gateway's `PATH` (services do not inherit your shell profile), a wrong package name, or a missing env var in `mcp.servers.<name>.env`. Run the server's command by hand in a terminal to see its own error. See [`openclaw mcp`](https://docs.openclaw.ai/cli/mcp).

---

## Plugin Issues

```bash
openclaw plugins list
openclaw plugins doctor
openclaw plugins inspect <id> --runtime --json
```

- **Gateway won't start after an install:** `openclaw plugins disable <id>` works without a running gateway; restart, then inspect.
- **`blocked plugin candidate: suspicious ownership`:** the plugin files belong to another Unix user. Fix ownership (`chown`) and run `openclaw doctor --fix`; do not delete the plugin config.
- **`package.json missing openclaw.extensions`:** the plugin uses a package shape OpenClaw no longer accepts; the plugin author must republish.
- **`blocked by install policy`:** check `security.installPolicy`, then `openclaw plugins update --all`.
- Workboard is a bundled plugin: enable it with `openclaw plugins enable workboard`, do not reinstall it.

---

## Memory Issues

### Agent Forgot Something

Memory is plain Markdown in the workspace: `~/.openclaw/workspace/MEMORY.md` plus daily `memory/YYYY-MM-DD.md` files. Check what is there and what the index sees:

```bash
openclaw memory status
openclaw memory search "the thing it forgot"
openclaw memory index --force      # reindex after editing files by hand
```

There is no `memory.max_context_tokens` or `memory.auto_save` key. Memory settings are in the [Memory config reference](https://docs.openclaw.ai/reference/memory-config).

### Dreaming Not Running

Dreaming is configured at `plugins.entries.memory-core.config.dreaming` and runs on its own schedule (3 AM by default). Check that the `memory-core` plugin is enabled (`openclaw plugins list`) and look at the log around that time.

---

## Skill Issues

```bash
openclaw skills list
openclaw skills check                 # missing binaries, env vars, OS requirements
openclaw skills info <name>
openclaw skills verify @owner/<slug>  # ClawHub verdict for a published skill
```

A skill is a folder containing `SKILL.md`. The model chooses skills from their descriptions; there are no trigger phrases to test. If a skill needs a tool (exec, browser, an MCP server), that tool must be allowed by the agent's tool profile; `openclaw status --all` shows the effective profile.

---

## Exec Asks for Approval, or Is Denied

Log signatures: `Approval required.`, `SYSTEM_RUN_DENIED: approval required`, `SYSTEM_RUN_DENIED: allowlist miss`.

The fix is to approve the command (`/approve ...` in chat, or the Control UI), or add it to the allowlist, not to switch protections off. Exec policy is `tools.exec.mode` (`deny`, `allowlist`, `ask`, `auto`, `full`); session permission modes are separate. Doctor migrates older `tools.exec.security`/`ask` pairs. See [Exec approvals](https://docs.openclaw.ai/tools/exec-approvals) and, before widening access, [Exec approvals and tool policy](/security/hardening#exec-approvals).

---

## Heartbeat Issues

Heartbeat is configured at `agents.defaults.heartbeat`. `HEARTBEAT.md` is no longer read: `openclaw doctor --fix` imports an old file into the heartbeat monitor's scratch and turns its `tasks:` into automation jobs.

### Heartbeat Not Running

```bash
openclaw config get agents.defaults.heartbeat
openclaw system heartbeat last
openclaw system heartbeat enable
openclaw automations status
```

Log signatures:

- `heartbeat skipped` reason `quiet-hours` → outside `activeHours`.
- `heartbeat skipped` reason `empty-heartbeat-file` → the monitor scratch has no real content.
- `heartbeat skipped` reason `alerts-disabled` → `showOk`, `showAlerts` and `useIndicator` are all off.
- `requests-in-flight` → the main lane is busy; the wake is deferred.

To trigger one now: `openclaw system event --text "check the inbox" --mode now`. There is no dry-run.

### Agent Replies NO_REPLY {#heartbeat_ok-agent-does-nothing}

`NO_REPLY` is the normal "nothing needs attention" answer, and it is not delivered. Older custom prompts may still return the legacy `HEARTBEAT_OK`. If you expected action, check the scratch with `openclaw automations scratch <jobId>`; recurring tasks belong in [Automations](https://docs.openclaw.ai/automation/cron-jobs), not in the heartbeat.

### Heartbeat Too Expensive

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      heartbeat: {
        every: "1h",
        model: "anthropic/claude-haiku-5-5",
        lightContext: true,
        activeHours: { start: "08:00", end: "22:00" },
      },
    },
  },
}
```

The default cadence is `30m` (`1h` with Anthropic OAuth); `every: "0m"` disables it. See [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat).

---

## Performance Issues

- **High memory:** check `openclaw gateway stability` and the upstream entry [Gateway exits during high memory use](https://docs.openclaw.ai/gateway/troubleshooting/gateway-service-and-process#gateway-exits-during-high-memory-use). Long sessions are the usual cause; `/compact` or start a new session.
- **Token costs:** `openclaw gateway usage-cost --days 7` shows where spend goes. Typical drivers are a frequent heartbeat on an expensive model, large bootstrap files, thinking left on, and noisy group chats without mention gating. See [Cost Management](/guides/cost-management).

---

## Docker Issues

Use the official image, `ghcr.io/openclaw/openclaw` (or `openclaw/openclaw` on Docker Hub); upstream advises against unofficial mirrors.

- **Container won't start:** `docker logs <container>`. A `loopback` bind inside a bridged container is unreachable from the host; set `gateway.bind: "lan"` with auth, or use host networking ([Docker](https://docs.openclaw.ai/install/docker)).
- **EACCES on volumes:** the container runs as uid 1000; `sudo chown -R 1000:1000` the mounted directories.
- **Health checks:** the image already has a `HEALTHCHECK` on `/healthz`. Use `/startupz` for orchestrator readiness and `/readyz` for channel-aware monitoring. Do not use `openclaw doctor` as a health check.

---

## Network Issues

### Gateway Exposed to Internet

```bash
openclaw config get gateway.bind
openclaw config set gateway.bind loopback
openclaw config get gateway.auth.mode
openclaw gateway restart
openclaw security audit --deep
```

`gateway.bind` takes a mode, not a host: `loopback` (default), `lan` (`0.0.0.0`), `tailnet`, `custom` or `auto`. There is no `gateway.host` key. Keep auth on as well:

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    bind: "loopback",
    auth: { mode: "token", token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

For remote access use Tailscale Serve, an SSH tunnel, or a reverse proxy with auth. See [Keep the Gateway on loopback](/security/hardening#bind) and [Remote access](/security/hardening#remote-access).

### Behind a Reverse Proxy

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    bind: "loopback",
    trustedProxies: ["127.0.0.1"],
  },
}
```

Without `trustedProxies`, forwarded requests may be rejected or logged with the proxy's IP. See [Reverse proxies](/security/hardening#configure-trustedproxies-critical-for-reverse-proxies).

### Outbound Connections Blocked

The gateway needs outbound HTTPS (443) to model providers and remote MCP servers, and 11434 for a local Ollama. `openclaw models status --probe` tests provider reachability with your real credentials. For DNS problems, fix the resolver your system uses (on systemd-resolved hosts, `resolvectl status`) rather than overwriting `/etc/resolv.conf`.

---

## Post-Upgrade Issues

Start with the upstream [Updates and rollbacks](https://docs.openclaw.ai/gateway/troubleshooting/updates-and-rollbacks) page, then:

```bash
openclaw update status
openclaw doctor --fix
openclaw plugins update --all
```

### Empty Tool Output After First Call (v2026.6.11) {#empty-tool-output-after-first-call-v2026611}

Fixed. [Issue #98528](https://github.com/openclaw/openclaw/issues/98528) (`exec`, `web_fetch`, `web_search` returning empty after the first call in a turn) was closed on 2026-07-03. Update to v2026.10.4.

### Config Wiped After Upgrade

[Issue #80077](https://github.com/openclaw/openclaw/issues/80077): the v2026.5.7 update could wipe `openclaw.json`. Fixed by PR #80257 in v2026.5.12. Take a backup before any upgrade anyway:

```bash
openclaw backup create --verify
```

### Rollback Procedure

`openclaw update` rehearses in an isolated candidate state and rolls back when post-update Doctor fails. To go back by hand:

```bash
openclaw update --tag 2026.10.3 --yes        # one-off install of a specific version
openclaw backup restore ~/Backups/latest.tar.gz --target ./restored-openclaw
```

`backup restore` writes to a fresh directory; copy back what you need. Sessions now live in SQLite, so downgrading across a schema change can fail. Read the [rollback notes](https://docs.openclaw.ai/gateway/troubleshooting/updates-and-rollbacks) first.

---

## Key Files

| Path | Contents |
|---|---|
| `~/.openclaw/openclaw.json` | Config (JSON5); override with `OPENCLAW_CONFIG_PATH` |
| `~/.openclaw/workspace/` | `SOUL.md`, `AGENTS.md`, `MEMORY.md`, `memory/`, skills |
| `~/.openclaw/credentials/` | Channel and provider credentials |
| `$OPENCLAW_STATE_DIR` (default `~/.openclaw`) | State database: sessions, transcripts, automations, audit ledger |
| `/tmp/openclaw/openclaw-YYYY-MM-DD.log` | Gateway logs (24 h retention) |

Back up with `openclaw backup create`, which covers config, credentials, sessions and workspaces; copying files by hand misses the state database.

### Enable Audit Logging

```json5 title="~/.openclaw/openclaw.json"
{
  logging: {
    audit: { enabled: true, executionIdentity: false, messages: "off" },
  },
}
```

The ledger is metadata-only and stored in the state database. Query it with `openclaw audit --limit 50` (filters: `--kind`, `--status`, `--agent`, `--session`). See [Audit history](https://docs.openclaw.ai/gateway/audit).

---

## Quick Reference

### "It's Not Working" Flowchart

1. `openclaw status`: is the gateway running and are channels connected?
2. `openclaw doctor`: any blocking config or service errors? Try `--fix`.
3. `openclaw logs --follow`: reproduce the problem and read the error.
4. Match the error string against the sections above or the upstream [runbook](https://docs.openclaw.ai/gateway/troubleshooting).
5. Still stuck: `openclaw triage` and ask for help.

### Emergency Reset

Avoid wiping state. Back up, then repair:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --fix
openclaw gateway install --force
openclaw gateway start
```

If you really want a clean install, keep the backup and run `openclaw onboard` against a fresh profile (`openclaw --profile fresh onboard`) rather than deleting `~/.openclaw`.

---

## Getting More Help

```bash
openclaw triage                       # sanitized, agent-ready diagnosis
openclaw gateway diagnostics export   # payload-free .zip to attach
openclaw status --all                 # pasteable text report
```

- **Discord:** [discord.gg/openclaw](https://discord.gg/openclaw)
- **GitHub Issues:** [github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
- **FAQ:** [/reference/faq](/reference/faq)

When reporting an issue, include:
1. `openclaw --version`, `node --version`, OS and architecture
2. `openclaw status --all`
3. `openclaw doctor` output
4. Relevant log lines (`openclaw logs --limit 50`)

Check that pasted output contains no tokens or keys.

---

## See Also

- [FAQ](/reference/faq)
- [CLI Reference](/reference/cli)
- [Configuration](/reference/configuration)
- [Security Hardening](/security/hardening)
- [Cost Management](/guides/cost-management)
- [MCP Servers](/guides/mcp-servers)
- [Plugin System](/guides/plugin-system)
- Upstream: [General troubleshooting](https://docs.openclaw.ai/help/troubleshooting), [Gateway troubleshooting](https://docs.openclaw.ai/gateway/troubleshooting), [Doctor](https://docs.openclaw.ai/gateway/doctor)
