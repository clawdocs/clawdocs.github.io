---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
ci_verified:
  version: 2026.10.4
  date: 2026-10-18
  steps: 30
title: "Day 7: Lock It Down"
description: "A validated security baseline, cost checks, monitoring, backups and safe upgrades for a long-running OpenClaw setup"
keywords: [openclaw, production, hardening, monitoring, security, backup, upgrade, cost]
---

# Day 7: Lock It Down

You have a personalized, multi-channel, automated assistant. Today you make sure it stays safe, stays running, and doesn't surprise you with a bill.

**Time:** ~45 minutes

---

## Security in 10 Minutes {#security-in-5-minutes}

The full checklist lives in [Security Hardening](/security/hardening). This section is the short version for a single-user setup on your own machine.

OpenClaw's defaults are already reasonable in some places and deliberately open in others:

- **Already safe by default:** the Gateway listens on loopback only, auth is required, unknown DM senders get a pairing code, and groups are allowlisted.
- **Open by default:** host shell commands run **without asking** (`tools.exec.mode` resolves to `full`), and the sandbox is **off**. If your bot reads email, web pages or anything else you didn't write, a prompt injection can run commands as your user.

Do these five things now:

1. **Update:** `openclaw update`, then `openclaw plugins update --all` ([why](/security/hardening#updating)).
2. **Check binding and auth:** keep `gateway.bind` on `loopback` and use a long random token ([bind](/security/hardening#bind), [auth](/security/hardening#auth)). For remote access use an SSH tunnel or Tailscale Serve, never an open port ([remote access](/security/hardening#remote-access)).
3. **Decide who can talk to the bot:** pairing or allowlists on every channel (you did this on Day 5; see [channel access](/security/hardening#channel-access)).
4. **Turn on exec approvals** so shell commands outside the allowlist need your OK ([exec approvals](/security/hardening#exec-approvals)).
5. **Run the audit** and fix what it flags ([audit](/security/hardening#audit)).

### A baseline config

This block combines the settings above. Merge it into your config rather than replacing the file. It passes `openclaw config validate` on 2026.10.4:

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    // Token read from ~/.openclaw/.env (OPENCLAW_GATEWAY_TOKEN=...), not stored here
    auth: { mode: "token", token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
  session: {
    dmScope: "per-channel-peer", // one session per channel + sender
  },
  tools: {
    exec: { mode: "ask" },       // allowlisted commands run; everything else asks you
    fs: { workspaceOnly: true }, // file tools stay inside the workspace
    elevated: { enabled: false },
  },
  agents: {
    defaults: {
      heartbeat: {
        activeHours: { start: "07:00", end: "23:00" }, // no heartbeat turns overnight
      },
    },
  },
}
```

Generate a token with `openssl rand -hex 32`, or let `openclaw doctor --generate-gateway-token` create and store one. `activeHours` uses `agents.defaults.userTimezone` (set on Day 1) or the host timezone.

Then apply and check:

```bash
openclaw config validate
openclaw gateway restart
openclaw approvals get        # what exec policy is actually in force
openclaw security audit --deep
openclaw security audit --fix # file permissions and open group policies only
openclaw secrets audit --check
```

The effective exec policy is the stricter of `tools.exec` in `openclaw.json` and the host approvals file, so check `openclaw approvals get` rather than assuming. If your bot reads untrusted content regularly, also turn on the [sandbox](/security/hardening#sandboxing).

:::warning
Exec approvals and allowlists are guardrails, not a sandbox. Text rules like "never run `rm -rf`" in `SOUL.md` or `AGENTS.md` are not a security boundary either. Tool policy and the sandbox are.
:::

The bundled `healthcheck` skill can walk you through host-level checks (SSH, firewall, disk encryption, backups). Run it in chat with `/skill healthcheck`. It is written to ask before changing anything.

---

## Cost Check

You pay your model provider per token. Every turn sends the bootstrap files (`AGENTS.md`, `SOUL.md`, `USER.md` and others), the conversation so far and any tool results, so long sessions and frequent automations add up.

### See what you're spending

```bash
# Cost summary from session logs, last 30 days by default
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7 --all-agents
```

In chat, `/usage cost` prints a local cost summary and `/usage tokens` adds a token footer to each reply. Your provider's billing dashboard is the source of truth.

### Cost levers that don't weaken security

- **Heartbeat cadence.** The default is every 30 minutes (1 hour with Anthropic OAuth). If you don't need ambient check-ins, set `agents.defaults.heartbeat.every: "0m"` to switch the recurring heartbeat off; your scheduled automations still run.
- **Lighter context for routine runs.** `lightContext: true` and `isolatedSession: true` on the heartbeat, and `--light-context` on `openclaw cron add`, skip the full bootstrap files and history.
- **Fewer, better-scoped automations.** One morning briefing beats six hourly checks.
- **Short sessions.** Start a new one with `/new` when a conversation has run long. The bot keeps continuity through its memory files.
- **A cheaper model for chat-only agents.** Fine for an agent with no tools. Don't put a small or older model on anything that uses tools on untrusted input: upstream security guidance says weaker tiers are easier to hijack with prompt injection ([prompt injection](https://docs.openclaw.ai/gateway/security/prompt-injection)). See the [Model Selection Guide](/guides/model-selection).

---

## Monitoring

### Quick health check

```bash
openclaw status          # Gateway, channels, sessions, warnings
openclaw status --deep   # adds live channel probes
openclaw gateway status
openclaw doctor          # explains common misconfigurations
```

### Watch logs

```bash
openclaw logs --follow
```

Useful for channel issues, skill runs and automations. Press `Ctrl+C` to stop. `openclaw channels logs --channel telegram` narrows it to one channel.

### A daily self-check

Make it an automation, not a heartbeat note. This runs at 07:30 every day and only reports problems. It needs `exec` to run the two commands, and nothing else:

```bash
openclaw cron add "30 7 * * *" \
  "Run openclaw status --deep and openclaw security audit. If anything is failing, disconnected or flagged, message me a short summary. Otherwise reply NO_REPLY." \
  --name "Daily self-check" --light-context --tools exec
```

With approvals on (you set `ask` above), test it once with `openclaw cron run <jobId> --wait` while the Control UI is open, and choose **Always allow** on each approval card. That mints a standing grant for this job and these exact commands. Any other command the job tries still needs approval, and is denied when no approval client is connected ([standing grants](https://docs.openclaw.ai/tools/exec-approvals#standing-grants-for-automations)). `openclaw cron runs <jobId>` shows its history.

---

## Backups

Your install is more than one folder of text files. Config, credentials, sessions, memory index and auth profiles live in SQLite databases and the credentials directory, so a hand-rolled `tar` of a few folders is not a working backup.

| Path | Contents |
|------|----------|
| `~/.openclaw/openclaw.json` | Configuration |
| `~/.openclaw/.env` | Environment variables the Gateway loads (tokens) |
| `~/.openclaw/workspace/` | `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/`, workspace `skills/` |
| `~/.openclaw/state/openclaw.sqlite` | Shared state: automations, monitor scratch, MCP OAuth tokens |
| `~/.openclaw/agents/<id>/agent/openclaw-agent.sqlite` | Per-agent sessions, transcripts, model auth profiles, memory index |
| `~/.openclaw/credentials/` | Channel credentials (for example WhatsApp) and pairing allowlists |
| `~/.openclaw/skills/` | Shared managed skills (`--global` installs) |

Source: [agent workspace](https://docs.openclaw.ai/concepts/agent-workspace), [secrets and storage](https://docs.openclaw.ai/gateway/security/secrets-and-storage).

Use the built-in backup command, which knows about all of these:

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

Check an older archive any time with `openclaw backup verify <archive>`. `openclaw backup enable` can schedule offsite or Git backups as an automation ([backup](https://docs.openclaw.ai/cli/backup)).

:::info
A backup archive contains credentials, auth profiles and channel state. Store it with owner-only permissions (`chmod 600`) and protect it like a password database. Keep your workspace in a private Git repo too: it's the part you edit by hand.
:::

---

## Upgrades

OpenClaw releases often, and many releases include security fixes. Stay on the latest stable release.

**1. Back up:**

```bash
openclaw backup create --output ~/Backups/openclaw --verify
```

**2. Read the release notes:**

```bash
openclaw update status
gh release view --repo openclaw/openclaw
```

Look for breaking changes and migration notes.

**3. Preview, then update:**

```bash
openclaw update --dry-run
openclaw update
openclaw plugins update --all
openclaw skills update --all
```

Use `openclaw update`, not `npm update -g openclaw`. The updater validates the target, runs the required Doctor migrations, verifies the restarted Gateway and keeps the previous package for rollback. A raw npm replacement does none of that ([updating](https://docs.openclaw.ai/install/updating)).

**4. Check:**

```bash
openclaw doctor
openclaw status --deep
```

The updater already ran the required Doctor migrations; `openclaw doctor` reports anything left. If it suggests repairs, stop the Gateway first (`openclaw gateway stop`), run `openclaw doctor --fix`, then `openclaw gateway start`: with the Gateway running, `doctor --fix` cannot lock the state database and exits with `GatewayStateOwnerContentionError`.

Confirm every channel reconnects and your automations are listed in `openclaw cron list`.

**5. If something breaks:** don't just reinstall an older version. Downgrading the package does **not** reverse config or database migrations. Upstream's supported recovery is to restore a verified pre-update backup together with the OpenClaw release that made it ([rollback and recovery](https://docs.openclaw.ai/install/updating/rollback-and-recovery)):

```bash
openclaw gateway stop
openclaw backup restore ~/Backups/openclaw/<archive>.tar.gz --target ~/openclaw-restore
```

`backup restore` verifies the archive and extracts it into a fresh staging directory; it never overwrites your live install. Follow the rollback guide for putting the restored state back with the matching release. `openclaw gateway start` brings the service back up.

If you're stuck, `openclaw triage --non-interactive` runs checks without offering a repair agent and writes a sanitized diagnosis you can hand to a coding agent or paste into a bug report.

---

## What's Next?

You're past the basics. Here's where to go from here:

- [Security Hardening](/security/hardening): remote access, reverse proxies, firewalls, sandboxing and incident response
- [Skill Development](/guides/skill-development): build more capable skills
- [Cost Management](/guides/cost-management): more cost strategies
- [Recipes](/guides/recipes/code-reviewer): worked examples, each with its own guardrails
- [Use Cases](/guides/use-cases): ideas from the community
- [Contributing](/contributing/openclaw): contribute back to OpenClaw

---

## Congratulations

You've gone from "hello" to a personalized, multi-channel, automated assistant in 7 days, with approvals on, access controlled and a backup you can restore. The rest is up to you.
