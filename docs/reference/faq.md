---
sidebar_position: 6
title: Frequently Asked Questions
sidebar_label: FAQ
description: Frequently asked questions about OpenClaw — setup, cost, security, troubleshooting, and ecosystem
keywords: [openclaw, openclaw faq, frequently asked questions, openclaw cost, is openclaw free, setup, help]
---

# Frequently Asked Questions

## General

### What is OpenClaw?

OpenClaw is a free, open-source, autonomous AI agent that runs locally on your machine. It connects LLMs to your files, shell, browser, and messaging apps to automate tasks. It has 377,000+ GitHub stars as of June 2026 and is governed by the OpenClaw Foundation (established February 14, 2026).

### Is OpenClaw free?

**OpenClaw itself is free** (MIT license). However, you pay for LLM API usage if using cloud providers. Users have reported costs ranging from $5/day to $3,600/month depending on usage intensity. Running [local models](/guides/local-models) eliminates API costs entirely.

### Why was it renamed twice?

1. **Clawdbot** (Nov 2025) — Original name
2. **Moltbot** (Jan 27, 2026) — Renamed after Anthropic filed trademark complaints ("Clawd" was too close to "Claude")
3. **OpenClaw** (Jan 30, 2026) — Renamed because "Moltbot never quite rolled off the tongue"

This was the fastest triple rebrand in open-source history — all three names within a single week.

### Who created OpenClaw?

**Peter Steinberger**, an Austrian developer and founder of PSPDFKit. He's described his development philosophy as "shipping code he doesn't read" — having made 6,600 commits in January 2026 alone using AI coding tools.

### What is the OpenClaw Foundation?

Established February 14, 2026, the OpenClaw Foundation ensures no single company controls the project. The core framework remains MIT-licensed. Steinberger announced it to address community concerns about corporate influence.

### What is Moltbook?

Moltbook is a separate social network (created by Matt Schlicht) where AI agents autonomously post, comment, and vote. It grew to 1.6 million registered agents (though most were bots, with only ~17,000 human users). Andrej Karpathy called it *"the most incredible sci-fi takeoff-adjacent thing."* It suffered a major database breach in January 2026.

### What version is current?

As of June 2026, the latest stable release is **v2026.6.1** (published June 3, 2026). OpenClaw uses date-based versioning: `vYYYY.M.D`.

---

## Security

### Is OpenClaw safe to use?

OpenClaw is powerful but carries significant risks. It has had:
- **138+ CVEs** disclosed as of April 2026
- A [critical RCE vulnerability](/security/known-vulnerabilities) (CVE-2026-25253)
- [4 chainable TOCTOU vulnerabilities](https://www.cyera.com/blog/claw-chain-cyera-research-unveil-four-chainable-vulnerabilities-in-openclaw) (Cyera Research, CVSS up to 9.6)
- [341 malicious marketplace skills](/security/known-vulnerabilities#malicious-clawhub-skills-february-2026)
- [135,000+ exposed instances](/security/known-vulnerabilities#exposed-instances-january-february-2026) found on the public internet
- A [$16M crypto scam](/security/known-vulnerabilities#16m-crypto-scam-january-27-2026) exploiting the project's name transitions

**Follow the [Security Hardening](/security/hardening) guide before deploying.** Gartner has recommended enterprises block it entirely.

### Can someone hack me through OpenClaw?

Yes, if you:
- Expose the gateway to the internet (bind to `0.0.0.0`)
- Install unverified skills from ClawHub
- Run an outdated version with known CVEs
- Don't restrict channel access

Even localhost instances were vulnerable to CVE-2026-25253 via browser pivot attacks.

### Does OpenClaw send my data to the cloud?

- **Memory, files, and config**: Stay local on your machine
- **LLM prompts**: Sent to your chosen cloud provider for processing
- **Local models**: Nothing leaves your machine at all

### What are workspace .env security restrictions?

Workspace `.env` files cannot override `OPENCLAW_*` variables or provider credential keys. This fail-closed design prevents malicious workspaces from hijacking credentials. See [Environment Variables](/reference/environment-variables#workspace-env-security).

---

## Cost

### How much does it cost to run?

Real-world reported costs:

| User | Usage | Monthly Cost |
|------|-------|-------------|
| Light user | CLI chat, occasional tasks | $30-150 |
| Moderate user | Heartbeat + 1-2 channels | $150-450 |
| Heavy user (Federico Viticci) | Full automation, 1.8M tokens | $3,600 |
| German magazine c't test | Full-day testing | $100+ in one day |
| Heartbeat overnight | Just asking "Is it daytime yet?" | $18.75 overnight |

Key cost drivers: **context accumulation** (session history grows indefinitely), **heartbeat** (runs even when idle), and **autonomous multi-step tool use**.

### How do I reduce costs?

1. Use Haiku or a local model for heartbeat (saves 80-100% of heartbeat cost)
2. Increase heartbeat interval to 60 min (saves 50%)
3. Set quiet hours to stop heartbeat during sleep (saves 33%)
4. Enable `isolatedSession` for heartbeat (reduces context from 100K to 2-5K tokens)
5. Use [local models](/guides/local-models) for $0 API costs
6. Keep sessions short to limit context accumulation
7. Route sub-agents to cheaper models

One documented case: **$1,200/month reduced to $36/month** using model routing. See [Cost Management](/guides/cost-management) and [Performance Tuning](/guides/performance-tuning).

### Can I use it without an API key?

Yes, using [local models](/guides/local-models) via Ollama, LM Studio, or vLLM. No API key or internet connection required for core operation.

### Which LLM should I use?

| Your priority | Recommendation |
|--------------|---------------|
| Best quality | Claude Opus 4.8 |
| Best balance | Claude Sonnet 4.6 |
| Cheapest cloud | DeepSeek V3.2 (~$0.27/M tokens input) |
| Near-free cloud | Gemini 2.5 Flash (~$0.15/M tokens input) |
| Free (local) | Qwen3 32B via Ollama (requires 24 GB VRAM) |
| Free (hosted) | OpenRouter free tier (rate-limited) |

See the [Model Selection Guide](/guides/model-selection) for detailed recommendations by use case, budget, and hardware.

### Can I use multiple models at once?

Yes. OpenClaw supports per-task model routing:

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": { "model": "claude-sonnet-4-6" },
  "heartbeat": { "model": "claude-haiku-4-5-20251001" },
  "agents": {
    "list": [
      { "id": "researcher", "model": "claude-opus-4-8" },
      { "id": "monitor", "model": "ollama/qwen3:14b" }
    ]
  }
}
```

See [Model Selection](/guides/model-selection#model-routing) for routing strategies.

---

## Technical

### Does it work on Windows?

Yes, via **WSL2** (recommended) or native Node.js. Native Windows support is experimental — WSL2 provides the best experience.

### Does it work offline?

Yes, with [local models](/guides/local-models) via Ollama, LM Studio, or vLLM. The gateway, memory, skills, and file operations all work without internet. Only cloud LLM calls and web-based channels (WhatsApp, Telegram, etc.) require connectivity.

### Does it work on Raspberry Pi or ARM?

**Not officially supported.** OpenClaw requires Node.js 24 and the gateway uses significant RAM. ARM single-board computers lack the resources for reliable operation. For lightweight alternatives, see [NanoClaw or Nanobot](/reference/ecosystem).

### Can I run it on a cloud server?

Yes. DigitalOcean, Cloudflare (via Moltworker), and others offer managed hosting. **But never expose the gateway to the public internet** — bind to localhost and use SSH tunneling or a VPN for remote access. See [Deployment Options](/guides/deployment-options).

### Can I run multiple instances?

Yes, on different ports with separate data directories:

```bash
# Instance 1 (work)
OPENCLAW_PORT=18789 OPENCLAW_HOME=~/.openclaw-work openclaw gateway

# Instance 2 (personal)
OPENCLAW_PORT=18790 OPENCLAW_HOME=~/.openclaw-personal openclaw gateway
```

### What are the minimum system requirements?

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | macOS, Linux, Windows (WSL2) | macOS or Linux |
| Node.js | 22.19+ LTS | 24 |
| RAM | 2 GB (gateway only) | 4 GB+ |
| Disk | 500 MB | 2 GB+ |

For local models, add 8-80 GB VRAM depending on model size. See [Introduction](/getting-started/introduction#system-requirements).

### Why is my gateway using so much memory?

A memory regression in v2026.4.9 increased RSS from ~600 MB to ~946 MB on constrained systems. Mitigations:

1. Update to the latest version (regression partially fixed in later releases)
2. Restart the gateway periodically (`openclaw gateway restart`)
3. Use shorter sessions or enable `/compact` regularly
4. Reduce `max_context_tokens` in memory config

See GitHub issue [#63526](https://github.com/openclaw/openclaw/issues/63526).

---

## Updates & Migration

### How do I update safely?

**Always back up before updating:**

```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.backup
cp -r ~/.openclaw/credentials ~/.openclaw/credentials.backup
npm update -g openclaw
```

Notable breaking updates to watch for:

| Version | Issue | What Happened |
|---------|-------|---------------|
| v2026.4.1 | Silently enabled sandboxing | Broke exec in single-operator setups; no migration guide provided |
| v2026.5.7 | Config wipe bug | Auto-update stripped config keys and deleted credentials |
| v2026.4.26-4.29 | Tool allowlist bug | Lobster workflows calling `llm-task` failed |

### How do I recover from the v2026.5.7 config wipe?

The v2026.5.7 auto-update bug wiped `openclaw.json` and the `credentials/` directory. The built-in `.bak` files captured the already-corrupted state, so they can't help.

**If you have an external backup:**
```bash
cp ~/.openclaw/openclaw.json.backup ~/.openclaw/openclaw.json
cp -r ~/.openclaw/credentials.backup ~/.openclaw/credentials
openclaw gateway restart
```

**If you don't have a backup:**
```bash
# Re-run onboarding to recreate config
openclaw onboard

# Re-add channels manually
openclaw channels add whatsapp
openclaw channels add telegram
```

Fixed in v2026.5.8 (PR #80257). Always update to latest after restoring.

### How do I back up my config?

```bash
# Full backup
tar czf openclaw-backup-$(date +%Y%m%d).tar.gz ~/.openclaw/

# Config and credentials only
cp ~/.openclaw/openclaw.json ~/backups/
cp -r ~/.openclaw/credentials ~/backups/
cp -r ~/.openclaw/memory ~/backups/
cp ~/.openclaw/SOUL.md ~/backups/
cp ~/.openclaw/HEARTBEAT.md ~/backups/
```

Consider adding this to a cron job or [Lobster workflow](/guides/lobster-workflows).

---

## Channels

### Will WhatsApp ban me for using OpenClaw?

**Possibly.** WhatsApp uses the unofficial Baileys library (reverse-engineered protocol), not the official Business API. WhatsApp actively detects and bans automated accounts. Risk factors:

- Sending too many messages too quickly
- Automated responses to unknown contacts
- Running from a VPS IP (flagged as suspicious)
- Using a new phone number without history

**Mitigation:** Use your existing WhatsApp number, set rate limits, and restrict to known contacts via `allowedContacts`. Some users have run for months without issues; others get banned within days.

### Can I use OpenClaw with email?

Yes. Gmail integration supports OAuth authentication, label management, auto-reply, and digest generation. Configure via `openclaw channels add gmail` and follow the OAuth flow. See [Channels Guide](/guides/channels).

### What is Cloudflare Moltworker?

An open-source project by Cloudflare to run OpenClaw on Cloudflare Workers with sandboxed execution, browser rendering, and R2 storage — approximately $5/month without needing dedicated hardware. See [Ecosystem](/reference/ecosystem#moltworker).

---

## Ecosystem

### What is ClawHub?

ClawHub is OpenClaw's community skill marketplace with 10,700+ skills. It was the target of a [major malicious skill campaign](/security/known-vulnerabilities#malicious-clawhub-skills-february-2026) but now uses VirusTotal scanning and the new operator install policy for all published skills.

### What is Lobster?

Lobster is OpenClaw's official workflow shell — a typed, local-first macro engine for building composable automation pipelines. 1,222 GitHub stars, MIT licensed. See [Lobster Workflows Guide](/guides/lobster-workflows).

### What is Clawery?

Clawery is a separate enterprise-focused product offering managed OpenClaw with additional security, compliance, audit logging, and container-isolated skills. Not part of the open-source project.

### What are the lightweight alternatives?

| Project | Stars | Description |
|---------|-------|-------------|
| **Nanobot** | 15,900 | ~4,000 lines of Python, 99% smaller than OpenClaw |
| **NanoClaw** | 6,900 | Security-focused fork with container isolation |
| **MimiClaw** | — | Runs on a $5 ESP32-S3 microcontroller |

See [Lightweight Variants](/guides/lightweight-variants) and [Ecosystem](/reference/ecosystem).

### Can I contribute?

Yes! See [Contributing to OpenClaw](/contributing/openclaw) and [Contributing to these docs](/contributing/docs).

---

## Troubleshooting Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Gateway won't start | Check port conflict: `lsof -i :18789` |
| "Invalid API key" | Verify key format matches provider (Anthropic: `sk-ant-...`) |
| Heartbeat costing too much | Set `heartbeat.model` to Haiku/local, increase `interval` |
| Agent won't run commands | Check `permissions.mode` and `tools.exec.security` |
| Config wiped after update | Restore from backup; see [recovery steps above](#how-do-i-recover-from-the-v202657-config-wipe) |
| High memory usage | Update to latest; restart gateway periodically |
| WhatsApp disconnected | Re-scan QR: `openclaw channels add whatsapp` |
| Channel messages not arriving | Check `dm.accessPolicy` and `allowedContacts` |
| Sandbox blocking exec | Set `sandbox.mode: "off"` or `tools.exec.security: "full"` |
| macOS gateway stops overnight | Maintenance Sleep issue — disable Power Nap in System Settings |

For detailed troubleshooting, see [Troubleshooting](/reference/troubleshooting).

---

## See Also

- [Troubleshooting](/reference/troubleshooting) — Detailed fix guides
- [Getting Started](/getting-started/introduction) — New to OpenClaw?
- [Configuration Reference](/reference/configuration) — All config options
- [Environment Variables](/reference/environment-variables) — All env vars
- [Security Hardening](/security/hardening) — Lock down your setup
