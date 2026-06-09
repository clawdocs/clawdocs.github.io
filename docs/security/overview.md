---
sidebar_position: 1
title: Security Overview
description: Secure your OpenClaw setup in 5 steps, understand the threat model, and learn from past incidents
keywords: [openclaw, openclaw security, threat model, attack surface, is openclaw safe, security overview, ai agent security]
---

# Security Overview

OpenClaw is a powerful tool that grants an AI agent significant access to your system. This page helps you secure it — starting with 5 steps you should take right now.

---

## Secure Your Setup in 5 Steps

Do these before anything else. Each takes under a minute.

### 1. Update to the latest version

```bash
openclaw --version        # Check current
npm update -g openclaw    # Update
```

### 2. Verify gateway binds to localhost

```json5 title="~/.openclaw/openclaw.json"
{
  "gateway": {
    "host": "127.0.0.1",  // NEVER use 0.0.0.0
    "port": 18789
  }
}
```

### 3. Verify authentication is enabled

```json5 title="~/.openclaw/openclaw.json"
{
  "gateway": {
    "auth": {
      "mode": "token"
    }
  }
}
```

### 4. Set channel allowlists

Don't accept messages from unknown senders:

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "telegram": {
      "allowed_chat_ids": [123456789]
    }
  }
}
```

### 5. Run the security audit

```bash
openclaw security audit --deep
openclaw security audit --fix    # Auto-fix what it can
```

:::tip
That's it — you're covered for most threats. For production deployments, follow the full [Security Hardening](/security/hardening) guide.
:::

---

## What OpenClaw Has Access To

By default, the agent can:
- **Execute arbitrary shell commands** as your user
- **Read and write any file** your user can access
- **Automate a web browser** (fill forms, visit URLs, scrape pages)
- **Send messages** on your behalf through connected channels
- **Make HTTP requests** to any endpoint
- **Modify its own configuration** including `SOUL.md` (identity/behavior)

---

## Threat Model

### Attack Surfaces

| Surface | Risk | Mitigation |
|---------|------|------------|
| **Gateway WebSocket** | Remote code execution if exposed | Bind to localhost, enable auth |
| **Reverse proxy bypass** | Auth bypass via header spoofing | Configure `trustedProxies`, overwrite `X-Forwarded-For` |
| **Channel messages** | Prompt injection via incoming messages | Contact allowlists, mention-gating |
| **ClawHub skills** | Malicious code execution, credential theft | VirusTotal scanning, manual review |
| **LLM API** | Data exfiltration via prompts | Use local models for sensitive work |
| **Memory files** | Sensitive data in plaintext | File permissions, full-disk encryption |
| **`SOUL.md`** | Persistent agent hijacking via prompt injection | ClawSec drift detection |
| **Credentials** | Plaintext API key storage | Environment variables, OS keychain |
| **Browser automation** | Credential theft, session hijacking | Domain allowlists |

### The Prompt Injection Problem

OpenClaw processes untrusted content (chat messages, skill outputs, external data) **in the same reasoning context as user instructions**. There are no hard isolation boundaries between trusted and untrusted content.

Zenity Labs demonstrated a complete zero-click attack chain:
1. Indirect prompt injection via a **Google Document**
2. Agent creates a **Telegram backdoor** to an attacker-controlled bot
3. Attacker modifies **`SOUL.md`** for persistence across sessions
4. Creates a **scheduled task** that re-injects malicious instructions every 2 minutes
5. Deploys a traditional **C2 implant** for full system compromise

All of this abuses intended capabilities — no software vulnerability required.

---

## Full Security Checklist

For those who want to go deeper than the 5 quick steps:

- [ ] **Update to the latest stable release** (currently v2026.6.1) — patches critical RCE and many subsequent security improvements
- [ ] **Bind gateway to localhost** — never expose port 18789
- [ ] **Enable authentication** — token or password mode
- [ ] **Set `trustedProxies`** — if behind any reverse proxy
- [ ] **Run `openclaw security audit --deep`** — verify configuration
- [ ] **Set channel allowlists** — don't accept messages from unknown senders
- [ ] **Review installed skills** — `openclaw skill list` and `openclaw security scan --all`
- [ ] **Protect credentials** — use environment variables, not plaintext files
- [ ] **Set quiet hours** — limit autonomous operation
- [ ] **Review memory** — check `~/.openclaw/memory/` periodically
- [ ] **Monitor SOUL.md** — watch for unauthorized modifications

---

## Community Security Tools

| Tool | Description |
|------|-------------|
| [**ClawSec**](https://github.com/prompt-security/clawsec) | Security skill suite — SOUL.md drift detection, advisory monitoring, audit watchdog |
| [**ClawBands**](https://github.com/SeyZ/clawbands) | Middleware that enforces human approval before dangerous actions |
| [**Clawprint**](https://github.com/cyntrisec/clawprint) | Tamper-evident audit trail with SHA-256 hash chain ledger |
| [**SkillGuard**](https://github.com/bossondehiggs/skillguard) | Skill file scanner for vulnerabilities and malicious patterns |
| [**Security Monitor**](https://github.com/adibirzu/openclaw-security-monitor) | 32-script monitoring suite targeting known threat campaigns |
| [**openclaw-secure**](https://github.com/seomikewaltman/openclaw-secure) | Hardware-gated secret management with pluggable backends |
| [**Clawdex**](https://koisecurity.com/clawdex) | Pre-installation skill scanning against Koi's malicious skills database |

See the [Ecosystem page](/reference/ecosystem#security-tools) for full details on each tool.

---

## Enterprise Assessment

> *"It is not enterprise software. There is no promise of quality, no vendor support, no SLA... it ships without authentication enforced by default."* — Gartner

For enterprise compliance considerations, see [Privacy & Compliance](/guides/privacy-compliance).

---

## Security Incident History

OpenClaw's explosive adoption (377k+ GitHub stars as of June 2026) massively outpaced its security maturity. Security has improved significantly since then — run `openclaw security audit --deep` regularly to stay current.

In a single week in late January / early February 2026:

- A **one-click RCE vulnerability** was discovered and patched (CVE-2026-25253)
- **40,000-135,000+ exposed instances** were found on the public internet
- **341 malicious skills** were discovered on ClawHub
- A **$16 million crypto scam** exploited the naming chaos
- The **Moltbook database breach** exposed 1.5 million API tokens
- **93.4% of publicly reachable instances** had critical authentication bypasses

### Timeline

| Date | Event | Severity |
|------|-------|----------|
| Jan 27 | Anthropic sends trademark notice; Steinberger begins rebrand | — |
| Jan 27 | Crypto scammers hijack X accounts during rebrand, launch $CLAWD pump-and-dump | **$16M stolen** |
| Jan 30 | CVE-2026-25253: One-click RCE via gateway URL discovered and patched (v2026.1.29) | **Critical (8.8)** |
| Jan 31 | Moltbook database breach — 1.5M API tokens, 35K emails exposed | **Critical** |
| Feb 2 | SecurityScorecard: 40,214 exposed instances found via favicon fingerprinting | **Critical** |
| Feb 2 | The Register: "security dumpster fire" | — |
| Feb 4 | Koi Security: 341 malicious ClawHub skills found (ClawHavoc campaign) | **High** |
| Feb 5 | Snyk ToxicSkills: 36% of all skills contain security flaws | **High** |
| Feb 5 | Cisco: 9 vulnerabilities in top community skill | **High** |
| Feb 5 | Zenity Labs: Prompt injection backdoor research published | **High** |
| Feb 7 | VirusTotal partnership and code safety scanner (v2026.2.6) | Mitigation |
| Feb 8 | Korean tech firms (Kakao, Naver, Karrot) ban OpenClaw internally | — |
| Feb 9 | Follow-up scans: 135,000+ exposed instances, 42,665 on Shodan | **Critical** |
| Feb 9 | JFrog: 93.4% of exposed instances have auth bypass | **Critical** |

### Who Has Published Security Research

| Organization | Finding / Action |
|-------------|-----------------|
| **Gartner** | "Unacceptable cybersecurity risk" — recommended blocking OpenClaw downloads |
| **JFrog** | Gateway localhost bypass — 93.4% auth bypass rate |
| **Zenity Labs** | Prompt injection backdoor via Google Docs, SOUL.md persistence |
| **SecurityScorecard** | 40,214-135,000+ exposed instances via favicon fingerprinting |
| **Snyk** | ToxicSkills study — 36% of skills have flaws, 283 leak credentials |
| **Koi Security** | 341 malicious skills, ClawHavoc campaign, AMOS malware |
| **Cisco** | 9 vulnerabilities (2 critical) in top community skill |
| **OX Security** | Plaintext credential storage, credential backup on removal |
| **CrowdStrike** | Security briefing + Falcon "Search & Removal Content Pack" |
| **Bitdefender** | Technical advisory — 900+ malicious skills (~20% of total) |
| **Trend Micro** | Risk analysis of agentic assistants |
| **Kaspersky** | "OpenClaw found unsafe for use" |
| **Noma Security** | 53% of enterprise customers gave OpenClaw privileged access in one weekend |
| **Token Security** | 22% of enterprise customers had unauthorized OpenClaw deployments |
| **Wiz** | Moltbook database breach discovery |
| **Belgian CCB** | Official advisory urging immediate patching |
| **University of Toronto** | Vulnerability notification for community |
| **Penligent** | "The security boundary that doesn't exist" — persistence and tool hijack |
| **Cyera** | "The OpenClaw Security Saga" — how adoption outpaced security |

---

## Deep Dives

- [Security Hardening](/security/hardening) — Step-by-step production security with Docker, reverse proxy, and network configs
- [Known Vulnerabilities](/security/known-vulnerabilities) — CVEs, incidents, and full timeline
- [Skill Verification](/security/skill-verification) — Reviewing skills before installation
- [Privacy & Compliance](/guides/privacy-compliance) — GDPR, SOC 2, HIPAA, data flows
