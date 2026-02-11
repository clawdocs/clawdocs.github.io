---
sidebar_position: 6
title: FAQ
description: Frequently asked questions about OpenClaw
---

# Frequently Asked Questions

## General

### What is OpenClaw?

OpenClaw is a free, open-source, autonomous AI agent that runs locally on your machine. It connects LLMs to your files, shell, browser, and messaging apps to automate tasks. It has 182,000+ GitHub stars as of February 2026.

### Is OpenClaw free?

**OpenClaw itself is free** (MIT license). However, you pay for LLM API usage if using cloud providers. Users have reported costs ranging from $5/day to $3,600/month depending on usage intensity. Running [local models](/guides/local-models) eliminates API costs entirely.

### Why was it renamed twice?

1. **Clawdbot** (Nov 2025) — Original name
2. **Moltbot** (Jan 27, 2026) — Renamed after Anthropic filed trademark complaints ("Clawd" was too close to "Claude")
3. **OpenClaw** (Jan 30, 2026) — Renamed because "Moltbot never quite rolled off the tongue"

This was the fastest triple rebrand in open-source history — all three names within a single week.

### Who created OpenClaw?

**Peter Steinberger**, an Austrian developer and founder of PSPDFKit. He's described his development philosophy as "shipping code he doesn't read" — having made 6,600 commits in January 2026 alone using AI coding tools.

### What is Moltbook?

Moltbook is a separate social network (created by Matt Schlicht) where AI agents autonomously post, comment, and vote. It grew to 1.6 million registered agents (though most were bots, with only ~17,000 human users). Andrej Karpathy called it *"the most incredible sci-fi takeoff-adjacent thing."* It suffered a major database breach in January 2026.

## Security

### Is OpenClaw safe to use?

OpenClaw is powerful but carries significant risks. It has had:
- A [critical RCE vulnerability](/security/known-vulnerabilities) (CVE-2026-25253)
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

## Cost

### How much does it cost to run?

Real-world reported costs:

| User | Usage | Monthly Cost |
|------|-------|-------------|
| Light user | CLI chat, occasional tasks | $30–150 |
| Moderate user | Heartbeat + 1-2 channels | $150–450 |
| Heavy user (Federico Viticci) | Full automation, 1.8M tokens | $3,600 |
| German magazine c't test | Full-day testing | $100+ in one day |
| Heartbeat overnight | Just asking "Is it daytime yet?" | $18.75 overnight |

Key cost drivers: **context accumulation** (session history grows indefinitely), **heartbeat** (runs even when idle), and **autonomous multi-step tool use**.

### How do I reduce costs?

1. Use Haiku for heartbeat, Opus only for complex tasks
2. Increase heartbeat interval (60 min instead of 30)
3. Set quiet hours to stop heartbeat during sleep
4. Use [local models](/guides/local-models) for $0 API costs
5. Keep sessions short to limit context accumulation

### Can I use it without an API key?

Yes, using [local models](/guides/local-models) via Ollama or vLLM. No API key or internet connection required.

### Which LLM should I use?

| Use Case | Recommendation |
|----------|---------------|
| Best quality | Claude Opus 4.6 |
| Good balance | Claude Sonnet 4.5 or GPT-4o |
| Cheapest cloud | Claude Haiku 4.5 |
| Free (local) | Llama 3.1 70B via Ollama |
| Coding tasks | Claude Opus or GPT-5.3-Codex |

## Technical

### Does it work on Windows?

Yes, via WSL2 or native Node.js. WSL2 is recommended for the best experience.

### Can I run it on a cloud server?

Yes. DigitalOcean, Cloudflare (via Moltworker), and others offer managed hosting. **But never expose the gateway to the public internet** — bind to localhost and use SSH tunneling or a VPN for remote access.

### Can I run multiple instances?

Yes, on different ports:

```bash
# Instance 1 (work)
OPENCLAW_PORT=18789 OPENCLAW_HOME=~/.openclaw-work openclaw gateway

# Instance 2 (personal)
OPENCLAW_PORT=18790 OPENCLAW_HOME=~/.openclaw-personal openclaw gateway
```

### What is Cloudflare Moltworker?

An open-source project by Cloudflare to run OpenClaw on Cloudflare Workers with sandboxed execution, browser rendering, and R2 storage — approximately $5/month without needing dedicated hardware.

## Ecosystem

### What is ClawHub?

ClawHub is OpenClaw's community skill marketplace. It was the target of a [major malicious skill campaign](/security/known-vulnerabilities#malicious-clawhub-skills-february-2026) but now uses VirusTotal scanning for all published skills.

### What is Clawery?

Clawery is a separate enterprise-focused product offering managed OpenClaw with additional security, compliance, audit logging, and container-isolated skills.

### Can I contribute?

Yes! See [Contributing to OpenClaw](/contributing/openclaw) and [Contributing to these docs](/contributing/docs).

## See Also

- [Troubleshooting](/reference/troubleshooting) — Fix common issues
- [Getting Started](/getting-started/introduction) — New to OpenClaw?
