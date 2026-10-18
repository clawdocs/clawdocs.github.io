---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Frequently Asked Questions
sidebar_label: FAQ
description: Frequently asked questions about OpenClaw — setup, cost, security, troubleshooting, and ecosystem
keywords: [openclaw, openclaw faq, frequently asked questions, openclaw cost, is openclaw free, setup, help]
---

# Frequently Asked Questions

Short answers with links. The official FAQ is at [docs.openclaw.ai/help/faq](https://docs.openclaw.ai/help/faq); this page adds our judgement and points to the deeper pages on this site.

## General

### What is OpenClaw?

OpenClaw is a free, open-source AI agent that you run yourself. A long-running Gateway connects LLMs to your files, shell, browser and messaging apps. It has about 392k GitHub stars as of 2026-10-18 and is stewarded by the [OpenClaw Foundation](https://openclaw.org).

### Is OpenClaw free?

**OpenClaw itself is free** (MIT license). You pay for LLM API usage if you use cloud providers. Reported bills range from a few dollars a month to thousands; see [How much does it cost to run?](#how-much-does-it-cost-to-run). Running [local models](/guides/local-models) removes API costs.

### Why was it renamed twice?

1. **Clawdbot** (Nov 2025): original name
2. **Moltbot** (Jan 27, 2026): renamed after Anthropic asked for a name change ("Clawd" was too close to "Claude")
3. **OpenClaw** (Jan 30, 2026): renamed again because "Moltbot never quite rolled off the tongue"

Upstream tells the story in [Lore](https://docs.openclaw.ai/start/lore).

### Who created OpenClaw?

**Peter Steinberger**, an Austrian developer and founder of PSPDFKit. Per the upstream FAQ, he now works at OpenAI; OpenAI is a donor to the Foundation, not an owner of the project ([What is OpenClaw?](https://docs.openclaw.ai/help/faq/what-is-openclaw)).

### What is the OpenClaw Foundation?

The [OpenClaw Foundation](https://openclaw.org) is an independent 501(c)(3) that develops OpenClaw in the open, employs the core team and signs releases. Its donor lists differ by source. The [README at v2026.10.4](https://github.com/openclaw/openclaw/blob/v2026.10.4/README.md#donors-and-sponsors) names Amazon, Lobster Computer Company, Offline Holdings, OpenAI, Red Hat and the University of Michigan; the Foundation's [donors page](https://www.openclaw.org/donors) (checked 2026-10-18) shows Microsoft, NVIDIA and OpenAI as partners alongside Offline Holdings, Red Hat and the University of Michigan, and does not list Amazon or Lobster Computer Company. Both say donors do not own the project; the README says "none of them own or direct the project". The code stays MIT-licensed.

### What is Moltbook?

Moltbook is a separate social network (created by Matt Schlicht) where AI agents post, comment and vote. It grew to 1.6 million registered agents, most of them bots. It suffered a [major database breach](/security/known-vulnerabilities#moltbook-database-breach-january-31-2026) in January 2026. It is not part of OpenClaw.

### What version is current?

As of 2026-10-18 the latest stable release is **v2026.10.4** (published 2026-10-16). OpenClaw uses calendar versions `YYYY.M.N`, where `N` is a release counter within the month, not a day. There are four update channels: `stable`, `extended-stable`, `beta` and `dev` ([development channels](https://docs.openclaw.ai/install/development-channels)). Check yours with `openclaw --version`.

On 2026-10-18 npm's tags are `latest` 2026.10.4, `extended-stable` 2026.9.33 (a trailing, LTS-like line: end of September plus critical security fixes) and `beta` 2026.10.10-beta.1. Version numbers are not in time order: 2026.10.10-beta.1 was published on 2026-10-15, a few hours before 2026.10.4, because the 10.1 to 10.4 releases come from a maintenance branch while new features ship on the 10.10 beta line. `openclaw update --channel beta` installs 2026.10.10-beta.1 today. This site documents 2026.10.4 and will move when npm `latest` does.

The v2026.6.11 regression where tools returned empty output after the first call in a turn (issue [#98528](https://github.com/openclaw/openclaw/issues/98528)) is closed; update to the current release.

---

## Security

### Is OpenClaw safe to use?

Only if you configure it carefully. It has real access to your machine, and it has had:
- **722 published GitHub security advisories** as of 2026-10-18, 14 of them critical ([Known Vulnerabilities](/security/known-vulnerabilities#advisories-at-a-glance))
- Batches of 45 advisories on [June 30, 2026](/security/known-vulnerabilities#june-2026-advisory-batch-june-30-2026) and 75 on [September 11, 2026](/security/known-vulnerabilities#september-2026-advisory-batch), all fixed in released versions. Run the latest stable release.
- A [one-click RCE](/security/known-vulnerabilities#cve-2026-25253-one-click-remote-code-execution) (CVE-2026-25253, fixed in v2026.1.29)
- [4 chainable TOCTOU vulnerabilities](https://www.cyera.com/blog/claw-chain-cyera-research-unveil-four-chainable-vulnerabilities-in-openclaw) (Cyera Research, CVSS up to 9.6)
- [341 malicious ClawHub skills](/security/known-vulnerabilities#malicious-clawhub-skills-february-2026) found by Koi Security in February 2026
- [Tens of thousands of exposed instances](/security/known-vulnerabilities#exposed-instances-january-february-2026) in early-2026 internet scans (42,665 on Shodan on Feb 9; follow-up scans reported 135,000+)
- A [$16M crypto scam](/security/known-vulnerabilities#16m-crypto-scam-january-27-2026) exploiting the name changes

**Follow [Security Hardening](/security/hardening) before deploying.**

### Can someone hack me through OpenClaw?

Yes, if you:
- Expose the gateway to a network (`gateway.bind: "lan"` listens on `0.0.0.0`) without a strong token and a firewall
- Install unreviewed skills or plugins
- Run an outdated version with published advisories
- Let anyone message the agent (open DM or group policies)

Even loopback-only instances were reachable through the browser before CVE-2026-25253 was fixed. Run `openclaw security audit` to check your setup.

### Does OpenClaw send my data to the cloud?

- **Config, credentials, sessions and workspace files** are stored locally under `~/.openclaw/`.
- **LLM prompts** go to your chosen model provider, and they include whatever the agent loads into context: messages, tool output, and memory such as `MEMORY.md`.
- **Local models**: prompts stay on your machine.
- **The Foundation** receives a daily update check (version, OS, Node version, CPU architecture) by default. Set `update.checkOnStart: false` to turn it off ([telemetry](https://docs.openclaw.ai/gateway/telemetry)).

### What are workspace .env security restrictions?

Workspace `.env` files cannot override `OPENCLAW_*` variables or provider credential keys. This fail-closed design stops a malicious workspace from hijacking credentials. See [Environment Variables](/reference/environment-variables#workspace-env-security).

---

## Cost

### How much does it cost to run?

It depends almost entirely on the model, how often the agent wakes up, and how long sessions grow. Always-on automation with a frontier model is where bills grow fastest. [Cost Management](/guides/cost-management) has worked estimates.

The main cost drivers are **context accumulation** (long sessions), the **heartbeat** (it runs even when idle), and **autonomous multi-step tool use**. `openclaw gateway usage-cost` shows what you have actually spent.

### How do I reduce costs?

1. Use a cheaper or local model for the heartbeat (`agents.defaults.heartbeat.model`)
2. Run the heartbeat less often, for example `agents.defaults.heartbeat.every: "60m"` (`"0m"` turns the recurring heartbeat off)
3. Limit it to waking hours with `agents.defaults.heartbeat.activeHours`
4. Set `agents.defaults.heartbeat.isolatedSession: true` so each run starts without the conversation history, and `lightContext: true` to skip workspace bootstrap files
5. Use [local models](/guides/local-models) for $0 API cost
6. Keep sessions short, or `/compact` them
7. Route sub-agents to cheaper models

See [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat), [Cost Management](/guides/cost-management) and [Performance Tuning](/guides/performance-tuning).

### Can I use it without an API key?

Yes, with [local models](/guides/local-models) via Ollama, LM Studio or vLLM. No API key or internet connection is needed for core operation.

### Which LLM should I use?

| Your priority | Recommendation (model ref) |
|--------------|---------------|
| Best quality | `anthropic/claude-opus-5-5` |
| Best balance | `anthropic/claude-sonnet-5-5` |
| Cheap and fast | `anthropic/claude-haiku-5-5` or `deepseek/deepseek-flash` |
| Free (local) | an Ollama model such as `ollama/qwen3:14b` |

A fresh Anthropic setup picks `anthropic/claude-opus-5-5`. Prices change often; check the provider's pricing page. See the [Model Selection Guide](/guides/model-selection) and the upstream [provider pages](https://docs.openclaw.ai/providers/anthropic).

### Can I use multiple models at once?

Yes. Set a default model, a cheaper heartbeat model, and per-agent overrides under `agents.entries.<id>`:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: {
      model: { primary: "anthropic/claude-sonnet-5-5" },
      heartbeat: { every: "60m", model: "anthropic/claude-haiku-5-5" },
    },
    entries: {
      main: {},
      researcher: { model: "anthropic/claude-opus-5-5" },
      monitor: { model: "ollama/qwen3:14b" },
    },
  },
}
```

With more than one entry, `ownership: "explicit"` is required; route channels to agents with bindings ([per-agent entries and multi-agent routing](https://docs.openclaw.ai/gateway/config-agents/entries-and-multi-agent)). The older `agents.list` array is retired; `openclaw doctor --fix` migrates it. For a single agent, `openclaw models set anthropic/claude-sonnet-5-5` is enough. See [Model Selection](/guides/model-selection#model-routing).

---

## Technical

### Does it work on Windows?

Yes. Upstream recommends the native **Windows Hub** app ([openclaw/openclaw-windows-node](https://github.com/openclaw/openclaw-windows-node)) for Windows 10 20H2+ and Windows 11. The native CLI and Gateway (PowerShell installer) and WSL2 are the alternatives ([Windows](https://docs.openclaw.ai/platforms/windows)).

### Does it work offline?

Yes, with [local models](/guides/local-models). The gateway, memory, skills and file operations work without internet. Cloud LLM calls and chat channels (WhatsApp, Telegram, etc.) need connectivity.

### Does it work on Raspberry Pi or ARM?

**Yes.** Upstream has an official [Raspberry Pi guide](https://docs.openclaw.ai/install/raspberry-pi): a Pi 5 with 4-8 GB is recommended, a Pi 4 with 2 GB works with swap. Run models in the cloud or on another machine. For even lighter alternatives, see [Lightweight Variants](/guides/lightweight-variants).

### Can I run it on a cloud server?

Yes, on any VPS or one of the [hosting providers](/guides/hosting-providers). **Keep the gateway on loopback** (`gateway.bind: "loopback"`, the default) and reach it through an SSH tunnel, Tailscale or a VPN. See [Keep the Gateway on loopback](/security/hardening#bind) and [Deployment Options](/guides/deployment-options).

### Can I run multiple instances?

Yes. Use a separate **profile** for each instance, which gives each one its own config, state and workspace, and run each on its own port:

```bash
# Instance 1 (default profile)
openclaw gateway --port 18789

# Instance 2 (a second profile)
openclaw --profile personal setup
openclaw --profile personal gateway --port 19789
```

See [Multiple gateways](https://docs.openclaw.ai/gateway/multiple-gateways).

### What are the minimum system requirements?

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | macOS, Linux, Windows (native Windows Hub or WSL2) | macOS or Linux |
| Node.js | 24.16+ or 26.1+ | 26 |
| RAM | 2 GB (gateway only) | 4 GB+ |
| Disk | 500 MB | 2 GB+ |

Node 22, 23 and 25 are not supported ([Node.js](https://docs.openclaw.ai/install/node)). For local models, add 8-80 GB VRAM depending on model size. See [Introduction](/getting-started/introduction#system-requirements).

### Why is my gateway using so much memory?

A memory regression in v2026.4.9 raised RSS from about 600 MB to about 946 MB on constrained systems (issue [#63526](https://github.com/openclaw/openclaw/issues/63526), closed). If memory is still high:

1. Update to the current release (`openclaw update`)
2. `/compact` long sessions, or start new ones
3. Restart the gateway (`openclaw gateway restart`)
4. Check `openclaw gateway stability` for a recorded diagnostic

---

## Updates & Migration

### How do I update safely?

Back up, preview, then update:

```bash
openclaw backup create --verify
openclaw update --dry-run
openclaw update
openclaw doctor
```

If the new version fails validation, the old Gateway keeps serving. Automatic rollback after activation works only when no database schema migration ran, so the backup is your real safety net ([Rollback and recovery](https://docs.openclaw.ai/install/updating/rollback-and-recovery)). If you skipped many releases, run `openclaw doctor --fix` to migrate retired config keys and files.

Notable breaking updates from 2026:

| Version | Issue | What happened |
|---------|-------|---------------|
| v2026.5.7 | Config wipe bug ([#80077](https://github.com/openclaw/openclaw/issues/80077)) | The update wiped `openclaw.json` and deleted credentials; fixed in v2026.5.12 |
| v2026.8.1 | "OpenClaw 2.0" | Sessions moved to SQLite, `HEARTBEAT.md` retired, cron renamed Automations, many retired config keys refused |
| v2026.9.3 | Node runtime | Node 22 dropped; Node 24.16+ or 26.1+ required |

### How do I recover from the v2026.5.7 config wipe?

The v2026.5.7 update bug wiped `openclaw.json` and the `credentials/` directory. The built-in `.bak` files captured the already-corrupted state, so they can't help.

**If you have a backup archive:** restore it to a staging directory, check it, then copy the files back:

```bash
openclaw backup verify ./my-openclaw-backup.tar.gz
openclaw backup restore ./my-openclaw-backup.tar.gz --target ./restored-openclaw
```

**If you don't have a backup:**

```bash
# Re-run onboarding to recreate config
openclaw onboard

# Re-link channels
openclaw channels login --channel whatsapp
openclaw channels add --channel telegram
```

Fixed in v2026.5.12 (PR [#80257](https://github.com/openclaw/openclaw/pull/80257)). Update to the current release after restoring.

### How do I back up my config?

Use the built-in backup command. It covers config, credentials, sessions and workspaces (including `SOUL.md` and `MEMORY.md`):

```bash
openclaw backup create --verify
openclaw backup create --only-config
```

`openclaw backup enable` schedules recurring offsite or Git backups. See [`openclaw backup`](https://docs.openclaw.ai/cli/backup).

---

## Channels

### Will WhatsApp ban me for using OpenClaw?

**Possibly.** The WhatsApp channel uses the unofficial Baileys library (a reverse-engineered protocol), not the official Business API, and WhatsApp detects and bans automated accounts. Risk factors:

- Sending many messages quickly
- Automated replies to unknown contacts
- Running from a VPS IP
- Using a new number without history

**Mitigation:** use a number with history, and restrict who can reach the agent with `channels.whatsapp.dmPolicy` (`"pairing"` or `"allowlist"`) and `allowFrom` ([WhatsApp](https://docs.openclaw.ai/channels/whatsapp)). Some users run for months without issues; others are banned within days.

### Can I use OpenClaw with email?

Yes, but email is an automation trigger, not a chat channel. Use the [Gmail Pub/Sub trigger](https://docs.openclaw.ai/automation/cron-jobs/gmail) or the [IMAP trigger plugin](https://docs.openclaw.ai/automation/imap). Upstream recommends a restricted, sandboxed reader agent for untrusted mail. Sending email gives the agent a lot of reach; read [Exec approvals and tool policy](/security/hardening#exec-approvals) first.

### What is Cloudflare Moltworker?

[Moltworker](https://github.com/cloudflare/moltworker) runs OpenClaw in a Cloudflare Sandbox on Workers. Its README calls it an "experimental… proof of concept… not officially supported" that "may break without notice". The README estimates about $34.50/month running 24/7 (the $5 Workers Paid plan plus container compute). Last pushed 2026-05-09.

---

## Ecosystem

### What is ClawHub?

[ClawHub](https://clawhub.ai) is OpenClaw's skill and plugin registry. It was the target of a [malicious skill campaign](/security/known-vulnerabilities#malicious-clawhub-skills-february-2026) in February 2026. Since 2026-10-13 new releases stay unpublished until TruffleHog and ClawScan pass, and `openclaw skills verify @owner/<slug>` fetches a release's audit verdict. A pass is a signal, not a guarantee, so review skills yourself ([Skill Verification](/security/skill-verification)).

### What is Lobster?

[Lobster](https://github.com/openclaw/lobster) is OpenClaw's official workflow shell: a typed, local-first macro engine for composable automation pipelines. About 1.3k stars as of 2026-10-18, MIT licensed. See the [Lobster Workflows Guide](/guides/lobster-workflows).

### What is Clawery?

[clawery.com](https://clawery.com) markets an enterprise AI assistant service ("Your Personal Assistant for Work"). Its site no longer mentions OpenClaw. It is not part of the open-source project.

### What are the lightweight alternatives?

Independent projects, not forks (stars as of 2026-10-18):

| Project | Stars | Description |
|---------|-------|-------------|
| [**Nanobot**](https://github.com/HKUDS/nanobot) | 49k | Small Python agent from HKU |
| [**ZeroClaw**](https://github.com/zeroclaw-labs/zeroclaw) | 33k | Rust agent runtime |
| [**NanoClaw**](https://github.com/nanocoai/nanoclaw) | 31k | Small TypeScript agent that runs in containers |
| [**PicoClaw**](https://github.com/sipeed/picoclaw) | 30k | Go agent for small devices |
| [**MimiClaw**](https://github.com/memovai/mimiclaw) | 5.8k | Runs on an ESP32-S3 microcontroller |

See [Lightweight Variants](/guides/lightweight-variants) and [Ecosystem](/reference/ecosystem).

### Can I contribute?

Yes. See [Contributing to OpenClaw](/contributing/openclaw) and [Contributing to these docs](/contributing/docs).

---

## Troubleshooting Quick Reference

Start with `openclaw status --all`, `openclaw doctor` and `openclaw logs --follow`, or `openclaw triage --non-interactive` for a sanitized diagnosis ([General troubleshooting](https://docs.openclaw.ai/help/troubleshooting)).

| Problem | Quick fix |
|---------|-----------|
| `another gateway instance is already listening` / `EADDRINUSE` | Another process holds the port. `openclaw gateway status`, then `openclaw gateway stop` or pick another `--port` |
| `refusing to bind gateway ... without auth` | A non-loopback bind needs a token. Set `gateway.bind` back to `loopback`, or configure `gateway.auth` ([hardening](/security/hardening#auth)) |
| `Gateway start blocked: set gateway.mode=local` | Run `openclaw config set gateway.mode local`, or `openclaw doctor --fix` if the config was clobbered |
| Gateway reachable from the network | `openclaw config set gateway.bind loopback`, `openclaw gateway restart`, then `openclaw security audit` ([Keep the Gateway on loopback](/security/hardening#bind)) |
| Provider auth errors (401) | Check the saved profile with `openclaw models auth list`; sign in again with `openclaw models auth login` |
| Heartbeat costing too much | Set `agents.defaults.heartbeat.model` to a cheap or local model and lengthen `every` |
| Agent won't run commands | `openclaw approvals get` shows the effective exec policy. Approve the pending request (`openclaw approvals pending`, then `openclaw approvals resolve <id> allow-once`), or allowlist the command ([exec approvals](https://docs.openclaw.ai/tools/exec-approvals)) |
| Sandbox blocking exec | `openclaw sandbox explain` shows what is sandboxed. Adjust the sandbox's [workspace access](https://docs.openclaw.ai/gateway/sandboxing/workspace-access); don't switch the sandbox off |
| Config wiped after update | Restore from backup; see [recovery steps above](#how-do-i-recover-from-the-v202657-config-wipe) |
| High memory usage | Update; `/compact` long sessions; `openclaw gateway restart` |
| WhatsApp disconnected | Re-link with `openclaw channels login --channel whatsapp` |
| Channel messages not arriving | `openclaw channels status --probe`; check the channel's `dmPolicy` and `allowFrom` |
| macOS gateway stops overnight | Power Nap / Maintenance Sleep; see upstream [gateway service troubleshooting](https://docs.openclaw.ai/gateway/troubleshooting/gateway-service-and-process) |

:::warning
Do not "fix" approval prompts by setting `tools.exec.mode: "full"` or by turning the sandbox off. Both give the agent unreviewed shell access on your host. See [Exec approvals and tool policy](/security/hardening#exec-approvals) and [Sandboxing](/security/hardening#sandboxing).
:::

For detailed troubleshooting, see [Troubleshooting](/reference/troubleshooting).

---

## See Also

- [Troubleshooting](/reference/troubleshooting): detailed fix guides
- [Getting Started](/getting-started/introduction): new to OpenClaw?
- [Configuration Reference](/reference/configuration): all config options
- [Environment Variables](/reference/environment-variables): all env vars
- [Security Hardening](/security/hardening): lock down your setup
