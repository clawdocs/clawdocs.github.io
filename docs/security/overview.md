---
sidebar_position: 1
title: Security Overview
description: Understanding OpenClaw's threat model, attack surfaces, security posture, and the reality of deploying an autonomous AI agent
---

# Security Overview

OpenClaw is a powerful tool that grants an AI agent significant access to your system. This power comes with real security risks that you must understand and mitigate.

:::danger
**Read this before deploying OpenClaw in any environment with sensitive data.** OpenClaw has had critical vulnerabilities, malicious marketplace skills, and tens of thousands of exposed instances discovered in the wild. Gartner characterized it as "a dangerous preview of agentic AI" with "unacceptable cybersecurity risk."
:::

---

## The Security Reality

OpenClaw's explosive adoption (183k+ GitHub stars, 300k-400k estimated users) massively outpaced its security maturity. In a single week in late January / early February 2026:

- A **one-click RCE vulnerability** was discovered and patched (CVE-2026-25253)
- **40,000-135,000+ exposed instances** were found on the public internet
- **341 malicious skills** were discovered on ClawHub
- A **$16 million crypto scam** exploited the naming chaos
- The **Moltbook database breach** exposed 1.5 million API tokens
- **93.4% of publicly reachable instances** had critical authentication bypasses

As of February 2026, OpenClaw has no bug bounty program and no dedicated security team.

---

## Threat Model

### What OpenClaw Has Access To

By default, the agent can:
- **Execute arbitrary shell commands** as your user
- **Read and write any file** your user can access
- **Automate a web browser** (fill forms, visit URLs, scrape pages)
- **Send messages** on your behalf through connected channels
- **Make HTTP requests** to any endpoint
- **Modify its own configuration** including `SOUL.md` (identity/behavior)

### Attack Surfaces

| Surface | Risk | Mitigation |
|---------|------|------------|
| **Gateway WebSocket** | Remote code execution if exposed | Bind to localhost, set `trustedProxies`, enable auth |
| **Reverse proxy bypass** | 93.4% of exposed instances have auth bypass | Configure `trustedProxies`, overwrite `X-Forwarded-For` |
| **Channel messages** | Prompt injection via incoming messages | Contact allowlists, mention-gating |
| **ClawHub skills** | Malicious code execution, credential theft | VirusTotal scanning, manual review, Clawdex |
| **LLM API** | Data exfiltration via prompts | Use local models for sensitive work |
| **Memory files** | Sensitive data in plaintext | File permissions, full-disk encryption |
| **`SOUL.md`** | Persistent agent hijacking via prompt injection | ClawSec drift detection |
| **Credentials** | Plaintext API key storage | Environment variables, OS keychain, Vault |
| **Browser automation** | Credential theft, session hijacking | Domain allowlists |
| **Tool outputs** | Sensitive data sent to LLM context | Sandbox mode, context limits |

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

## Security Timeline (January-February 2026)

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

---

## Who Has Published Security Research

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

## Minimum Security Checklist

Before using OpenClaw, at minimum:

- [ ] **Update to v2026.1.29+** — patches critical RCE
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

| Tool | Stars | Description |
|------|-------|-------------|
| [**ClawSec**](https://github.com/prompt-security/clawsec) | 265 | Security skill suite — SOUL.md drift detection, advisory monitoring, audit watchdog |
| [**ClawBands**](https://github.com/SeyZ/clawbands) | 34 | Middleware that enforces human approval before dangerous actions |
| [**Clawprint**](https://github.com/cyntrisec/clawprint) | New | Tamper-evident audit trail with SHA-256 hash chain ledger |
| [**SkillGuard**](https://github.com/bossondehiggs/skillguard) | New | Skill file scanner for vulnerabilities and malicious patterns |
| [**Security Monitor**](https://github.com/adibirzu/openclaw-security-monitor) | New | 32-script monitoring suite targeting known threat campaigns |
| [**openclaw-secure**](https://github.com/seomikewaltman/openclaw-secure) | New | Hardware-gated secret management with pluggable backends |
| [**Clawdex**](https://koisecurity.com/clawdex) | New | Pre-installation skill scanning against Koi's malicious skills database |

See the [Ecosystem page](/reference/ecosystem#security-tools) for full details on each tool.

---

## Enterprise Assessment

> *"It is not enterprise software. There is no promise of quality, no vendor support, no SLA... it ships without authentication enforced by default."* — Gartner

> *"One of the most dangerous pieces of software a non-expert user can install"* — due to explosive viral adoption + deep system privileges + unvetted skills marketplace

For enterprise compliance considerations, see [Privacy & Compliance](/guides/privacy-compliance).

---

## Deep Dives

- [Security Hardening](/security/hardening) — Step-by-step production security with Docker, reverse proxy, and network configs
- [Known Vulnerabilities](/security/known-vulnerabilities) — CVEs, incidents, and full timeline
- [Skill Verification](/security/skill-verification) — Reviewing skills before installation
- [Privacy & Compliance](/guides/privacy-compliance) — GDPR, SOC 2, HIPAA, data flows
