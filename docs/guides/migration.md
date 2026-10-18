---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Migration Guide
description: Upgrading from Clawdbot or Moltbot to OpenClaw, the bridge upgrade for pre-July 2026 installs, Doctor's refused keys, rollback, and imports from other agent systems
keywords: [openclaw, migration, upgrade, migrate version, breaking changes, doctor, clawdbot, moltbot]
---

# Migration Guide

This guide covers four jobs: moving off the old Clawdbot and Moltbot names, upgrading an install from before July 2026 (which needs a bridge release), recovering when an upgrade goes wrong, and importing state from another agent system. Commands were checked against OpenClaw 2026.10.4. The reference is the upstream [Updating](https://docs.openclaw.ai/install/updating) guide.

---

## The Triple Rebrand

| Name | Period | Reason |
|------|--------|--------|
| **Clawdbot** | Nov 2025 – Jan 27, 2026 | Original name |
| **Moltbot** | Jan 27 – Jan 30, 2026 | Anthropic trademark complaint ("Clawd" too close to "Claude") |
| **OpenClaw** | Jan 30, 2026 – present | "Moltbot never quite rolled off the tongue" |

All three names were used within a single week. The story is told in the upstream [lore page](https://docs.openclaw.ai/start/lore).

### What changed

| Component | Clawdbot era | OpenClaw today |
|-----------|--------------|----------------|
| CLI command | `clawdbot` | `openclaw` |
| State directory | `~/.clawdbot/` | `~/.openclaw/` |
| Config file | `clawdbot.json` | `openclaw.json` |
| Workspace | `~/clawd` | `~/.openclaw/workspace` |
| npm package | `clawdbot` (frozen at 2026.1.24-3) | `openclaw` |
| Extensions | — | `@openclaw/*` scope |
| systemd unit | `clawdbot-gateway.service` | `openclaw-gateway.service` (user unit) |
| Docker image | — | `ghcr.io/openclaw/openclaw` (primary), `openclaw/openclaw` (Docker Hub mirror) |

The Moltbot name lasted three days. The `moltbot` npm name was never OpenClaw's (see the warning below), and current Doctor does not migrate `~/.moltbot` or `moltbot.json`. If you have those, move the contents into `~/.openclaw/` by hand (see [Data and state](#data-and-state)).

:::danger Supply Chain Attack Risk
The rapid renames created a dangerous supply-chain attack surface. Attackers hijacked abandoned repository names, published malicious packages with near-identical old names (typosquatting), and distributed a fake VS Code extension. **Only install the official `openclaw` npm package** (maintainers `steipete` and `vincentkoc`, repository `github.com/openclaw/openclaw`).

- The npm package **`moltbot` is not, and never was, an OpenClaw package**. It is published by an unrelated account. Do not install it.
- `clawdbot` is the original, frozen package. It will never be updated.
- Use only the official container images listed above; upstream says to "avoid unofficial mirrors".
:::

---

## Upgrade Steps

### From Clawdbot to OpenClaw

A Clawdbot install is older than July 2026, so it also needs the [bridge upgrade](#bridge-upgrade). Do both in one pass:

1. **Back up.** Stop the old Gateway and copy `~/.clawdbot/` somewhere safe (a plain `cp -a` or a filesystem snapshot; the old CLI has no verified backup command).
2. **Remove the old service.** Stop it first, or it will hold port 18789 (see [Old service still running](#systemd-migration)).
3. **Remove the old CLI:** `npm uninstall -g clawdbot`.
4. **Follow the [bridge upgrade](#bridge-upgrade)** below. The bridge release's `openclaw doctor --fix` renames `~/.clawdbot` to `~/.openclaw` and `clawdbot.json` to `openclaw.json` in place. It moves the directory; it does not copy it or leave a symlink behind. If both `~/.clawdbot` and `~/.openclaw` exist, Doctor names both and leaves them for you to reconcile; it never merges them.
5. **Reinstall the service** with `openclaw gateway install`, then check it with `openclaw gateway status --deep`.

Do not use `openclaw onboard` as a migration step. It sets up a new install; Doctor is what migrates an old one.

After upgrading:

1. **Rotate gateway tokens.** Old tokens may have been exposed.
2. **Rename environment variables.** `CLAWDBOT_*` and `MOLTBOT_*` variables are silently ignored (see [Environment variables](#environment-variables)).
3. **Check auth.** Token or password auth is the default. `gateway.auth.mode: "none"` exists again, but only as an explicit mode for trusted loopback-only setups.
4. **Run `openclaw security audit --deep`**, then work through [Security Hardening](/security/hardening). An upgraded agent keeps whatever shell, channel and device access it had, so review approvals and sandboxing now.

### Old service still running {#systemd-migration}

Gateway services are **user** units, not system units. `openclaw gateway uninstall` (or `openclaw uninstall`) detects a leftover `clawdbot-gateway.service` and removes it. To do it by hand:

```bash
systemctl --user disable --now clawdbot-gateway.service
rm -f ~/.config/systemd/user/clawdbot-gateway.service
systemctl --user daemon-reload

# Verify only the OpenClaw gateway is running
openclaw gateway status --deep
```

`openclaw gateway status --deep` also reports other gateway-like services it finds. Hosts installed with [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) use a system unit; manage those with `sudo systemctl`.

:::warning Known issue: dual services (#5103)
In [issue #5103](https://github.com/openclaw/openclaw/issues/5103) (closed as not planned), `clawdbot-gateway.service` and `openclaw-gateway.service` ran at the same time. The old gateway held port 18789 while the new one restarted in a loop. **Always stop the old service first.**
:::

### npm stuck on an old version

If `npm update -g` never moves past 2026.1.x, you are still on the frozen `clawdbot` package. Uninstall it and follow the bridge upgrade below.

---

## Bridge upgrade for installs before July 2026 {#bridge-upgrade}

OpenClaw 2.0 (v2026.8.1) moved sessions and state into SQLite and retired a long list of config keys. Current Doctor supports migrations only from formats written by releases published on or after **July 1, 2026**. For anything older, it stops and points you to an intermediate release.

**The rule:** if your install is older than July 2026, upgrade to **2026.9.5** first, run its Doctor, then upgrade to `latest` and run Doctor again. Use **2026.9.7** instead when Doctor names it (the retired same-file memory index, Discord `voice.tts` blocks and guild-channel `allow`/`agentId`, Voice Call JSONL logs, old `openclaw.extension.json` stubs).

Before you start: back up the state, use a [supported Node version](https://docs.openclaw.ai/install/node) (24.16+ on 24.x, or 26.1+), and keep the same user account, install prefix, profile and state paths throughout.

Stage 1, the bridge release:

```bash
openclaw gateway stop &&
  npm install -g openclaw@2026.9.5 --allow-scripts=openclaw &&
  openclaw --version &&
  openclaw doctor --fix
```

Confirm the version is `2026.9.5` and that Doctor imported the task, flow, plugin and channel state you need. Doctor imports channel state only for enabled channels, so temporarily enable any you need while the Gateway is stopped, rerun Doctor, then restore their settings. Resolve failed imports before you continue.

Stage 2, the current release:

```bash
npm install -g openclaw@latest --allow-scripts=openclaw &&
  openclaw doctor --fix &&
  openclaw gateway start &&
  openclaw gateway status --deep
```

`--allow-scripts=openclaw` is for npm 12 or 11.16+; omit it on npm 11.15 and earlier. For pnpm use `pnpm add -g --allow-build=openclaw openclaw@2026.9.5`, then `openclaw@latest`. For Bun use `bun add -g --trust openclaw@2026.9.5`, then `openclaw@latest`. Add your usual `--profile` to every `openclaw` command.

If a newer release has already upgraded your SQLite databases, the bridge release cannot open them. Use a pre-update backup for the bridge instead; see upstream [downgrade recovery](https://docs.openclaw.ai/reference/database-schemas/integrity-and-recovery#downgrade-recovery).

Docker users: the official image runs `openclaw doctor --fix --non-interactive` on start, so for the bridge, run the `2026.9.5` image tag once against your mounted state, then switch to `latest`.

### Config keys Doctor refuses {#refused-keys}

For most renamed keys, Doctor rewrites the config. For a set of retired keys it does the opposite: it **preserves your config and stops** with recovery guidance, and current validation fails until the keys are gone. The list includes:

- Top-level `heartbeat` (now `agents.defaults.heartbeat`), `routing.allowFrom` and `routing.groupChat`.
- `agents.defaults.llm`, agent `embeddedPi`, `embeddedHarness`, whole-agent `agentRuntime`, `systemPromptOverride`, `sandbox.perSession`, and agent `model.timeoutMs`.
- `memorySearch.store.path`, `gateway.webchat`, `channels.webchat`, `browser.relayBindHost`, `browser.ssrfPolicy.allowPrivateNetwork`, and non-empty `plugins.installs`.
- Queue modes `queue`, `steer-backlog` and `steer+backlog`. (The legacy `openai-codex-responses` API id is not on this list in 2026.10.4: Doctor still rewrites it to `openai-chatgpt-responses`. Later releases refuse it, so fix it before upgrading past 2026.10.4.)
- Top-level Talk selectors `talk.mode`, `talk.transport`, `talk.brain`, `talk.model` and `talk.voice`.
- `channels.telegram.requireMention` and `groupMentionsOnly` (use `channels.telegram.groups["*"].requireMention`), Telegram flat streaming keys (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`), `channels.whatsapp.exposeErrorText`, `threadBindings.ttlHours`, Slack `channels.<id>.allow`, and Matrix `dm.policy: "trusted"`.

The full, current list is in upstream [Doctor config migrations](https://docs.openclaw.ai/gateway/doctor/config-migrations#retired-state-and-config-formats). If one of these keys appears in your config, the fix is the bridge upgrade above, not deleting lines by hand (except `exposeErrorText`, which has done nothing since April 2026 and can simply be removed).

---

## Rollback and downgrade {#rollback}

Do not roll back with `npm install -g openclaw@<older-version>`. Downgrading the package does not reverse config or database migrations, and older releases cannot open newer SQLite schemas, so the old version may refuse to start or damage state.

The supported route:

1. **Before a significant update, make a verified backup:**

   ```bash
   mkdir -p ~/Backups/openclaw
   openclaw backup create --output ~/Backups/openclaw --verify
   ```

   The archive contains credentials. Store it with owner-only permissions.
2. **Update with `openclaw update`** rather than a raw `npm i -g`. It stages the new version, runs Doctor, verifies the Gateway, keeps the previous package during activation, and rolls back automatically when post-update checks fail. Preview with `openclaw update --dry-run`.
3. **To go back to an older release**, restore a verified pre-update backup together with the OpenClaw release that made it. Do not run an older release against migrated state.
4. **Clean up only after verifying.** `openclaw update cleanup` retires recovery originals; run it only once your sessions and channels work.

Upstream reference: [Rollback and recovery](https://docs.openclaw.ai/install/updating/rollback-and-recovery). Never stay on a release older than v2026.1.29 (see [Security history](#security-history)).

---

## Data and state {#data-and-state}

Since 2.0, OpenClaw keeps sessions, transcripts, auth stores, automations and the audit ledger in **SQLite** under the state directory. The workspace files are still Markdown:

- `SOUL.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`, `AGENTS.md`
- `MEMORY.md` and `memory/*.md`
- Managed skills in `~/.openclaw/skills/`

`HEARTBEAT.md` is retired. `openclaw doctor --fix` imports it into the heartbeat monitor scratch and turns `tasks:` into automation jobs.

If the agent "forgets" after a restart, check that the Gateway uses the same state directory and workspace on every launch (`openclaw status` shows the paths). Remote mode uses the gateway host's workspace, not your laptop's.

### Environment variables {#environment-variables}

`CLAWDBOT_*` and `MOLTBOT_*` variables are **silently ignored**. If any are still set, the Gateway prints one `OPENCLAW_LEGACY_ENV_VARS` warning at startup. Rename each by replacing the prefix with `OPENCLAW_`.

| Old | Current | Notes |
|-----|---------|-------|
| `CLAWDBOT_GATEWAY_TOKEN` | `OPENCLAW_GATEWAY_TOKEN` | Rotate it after upgrading |
| `CLAWDBOT_GATEWAY_PORT` | `OPENCLAW_GATEWAY_PORT` | Default 18789. There is no `OPENCLAW_PORT`. |
| — | `OPENCLAW_STATE_DIR` | Overrides the state directory (default `~/.openclaw`) |
| — | `OPENCLAW_CONFIG_PATH` | Overrides the config file path |
| — | `OPENCLAW_HOME` | Replaces the home directory OpenClaw resolves paths from; it is not a config-directory override |
| `TELEGRAM_BOT_TOKEN`, `DISCORD_BOT_TOKEN`, `SLACK_BOT_TOKEN` | Unchanged | Provider and channel variables keep their names |

Full list: upstream [environment variables](https://docs.openclaw.ai/help/environment).

### Moving to a new machine

Stop the Gateway, run `openclaw backup create --output ~/Backups/openclaw --verify` on the old machine, install OpenClaw on the new one, then `openclaw backup restore <archive.tar.gz> --target ~/openclaw-restored` and move the restored assets into place with the Gateway stopped. Restoring older channel state can desynchronize ratcheting credentials such as WhatsApp. See upstream [Migration guide](https://docs.openclaw.ai/install/migrating).

---

## Importing from other agent systems {#imports}

`openclaw migrate` imports instructions, MCP servers, skills, model config and, if you opt in, API keys from other agent systems. It previews a plan first, redacts secrets in reports, and writes a verified backup before applying.

```bash
openclaw migrate list                  # available providers
openclaw migrate claude --dry-run      # Claude Code / Claude Desktop: CLAUDE.md, MCP servers, skills, commands
openclaw migrate apply claude --yes
openclaw migrate hermes --dry-run      # Hermes config, providers, memory, skills, supported .env keys
```

Credentials are imported only when you accept the prompt or pass `--include-secrets`. On a fresh install, `openclaw onboard --flow import` offers the same imports. Guides: [Migrating from Claude](https://docs.openclaw.ai/install/migrating-claude), [Migrating from Hermes](https://docs.openclaw.ai/install/migrating-hermes).

---

## Security history {#security-history}

### v2026.1.29: CVE-2026-25253 patch (January 30)

**Do not run anything older.** [CVE-2026-25253](https://nvd.nist.gov/vuln/detail/CVE-2026-25253) (CVSS 8.8, High): before 2026.1.29, the Control UI took a `gatewayUrl` from the query string and connected to it without prompting, sending the gateway token. A crafted link could hand an attacker your token and, through it, command execution on the host. The same release removed the old implicit no-auth mode (an explicit loopback-only `none` mode was later reintroduced, see above).

### v2026.1.30: CLI improvements (January 31)

- Shell completion: `openclaw completion` (Zsh, Bash, PowerShell, Fish)
- Per-agent model status: `openclaw models status --agent <id>`
- New providers: Kimi K2.5, MiniMax OAuth

### v2026.2.6: code safety scanner (February 6)

- New model support: Claude Opus 4.6, GPT-5.3-Codex, xAI Grok
- Built-in code safety scanner for skills and plugins; credentials redacted from `config.get` gateway responses

ClawHub added VirusTotal scanning on publish in the same month, in response to the [ClawHavoc campaign](/security/known-vulnerabilities#the-clawhavoc-campaign). See [Skill Verification](/security/skill-verification) for how scanning works today.

---

## Community Migration Tools

### clawd_migrate

[clawd_migrate](https://github.com/calabiyauman/clawd_migrate) is a community migration script (unmaintained since February 2026). It is **not published on npm**, so never run `npx clawd_migrate`: that would fetch whatever package someone later registers under the name. It predates the 2.0 SQLite migration; the bridge upgrade above replaces it.

### OpenClaw Ansible

[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) is the official Ansible installer: hardened install, Docker isolation, Tailscale and firewall configuration. Upstream guide: [Ansible](https://docs.openclaw.ai/install/ansible).

---

## CI/CD Pipeline Updates

| Component | Old | Current |
|-----------|-----|-----|
| npm install | `npm i -g clawdbot` | `npm i -g openclaw` (pin a version in CI) |
| Container image | — | `ghcr.io/openclaw/openclaw:<version>` |
| Environment | `CLAWDBOT_GATEWAY_TOKEN` | `OPENCLAW_GATEWAY_TOKEN` |
| Service unit | `clawdbot-gateway.service` | `openclaw-gateway.service` (user unit) |
| Update channel | — | `openclaw update --channel stable` (also `extended-stable`, `beta`, `dev`) |

---

## See Also

- [Installation](/getting-started/installation) — Fresh install guide
- [Deployment Options](/guides/deployment-options) — Docker, Kubernetes and hosting
- [Known Vulnerabilities](/security/known-vulnerabilities) — CVEs and incident timeline
- [Security Hardening](/security/hardening) — Post-upgrade hardening steps
- [Configuration Reference](/reference/configuration) — Config file documentation
