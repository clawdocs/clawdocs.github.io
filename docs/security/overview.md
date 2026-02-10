---
sidebar_position: 1
title: Security Overview
description: Understanding OpenClaw's threat model, attack surfaces, and security posture
---

# Security Overview

OpenClaw is a powerful tool that grants an AI agent significant access to your system. This power comes with real security risks that you must understand and mitigate.

:::danger
**Read this before deploying OpenClaw in any environment with sensitive data.** OpenClaw has had critical vulnerabilities, malicious marketplace skills, and tens of thousands of exposed instances discovered in the wild.
:::

## Threat Model

### What OpenClaw Has Access To

By default, the agent can:
- **Execute arbitrary shell commands** as your user
- **Read and write any file** your user can access
- **Automate a web browser** (fill forms, visit URLs, scrape pages)
- **Send messages** on your behalf through connected channels
- **Make HTTP requests** to any endpoint

### Attack Surfaces

| Surface | Risk | Mitigation |
|---------|------|------------|
| **Gateway WebSocket** | Remote code execution if exposed | Bind to localhost only |
| **Channel messages** | Prompt injection via incoming messages | Input validation, contact allowlists |
| **ClawHub skills** | Malicious code execution | VirusTotal scanning, manual review |
| **LLM API** | Data exfiltration via prompt | Use local models for sensitive work |
| **Memory files** | Sensitive data in plaintext | File permissions, encryption |
| **Browser automation** | Credential theft, phishing | Domain allowlists |

## Security Timeline (2026)

| Date | Event | Severity |
|------|-------|----------|
| Jan 30 | CVE-2026-25253: One-click RCE via gateway URL | **Critical (8.8)** |
| Feb 2 | 40,214 exposed OpenClaw instances discovered | **High** |
| Feb 4 | 341 malicious ClawHub skills found | **High** |
| Feb 5 | VirusTotal partnership announced | Mitigation |
| Feb 7 | v2026.2.6: Built-in code safety scanner | Mitigation |

## Minimum Security Checklist

Before using OpenClaw, at minimum:

- [ ] **Update to latest version** — `npm update -g openclaw`
- [ ] **Bind gateway to localhost** — Never expose port 18789
- [ ] **Set quiet hours** — Limit autonomous operation
- [ ] **Review installed skills** — `openclaw skill list`
- [ ] **Start read-only** — Add write/execute permissions gradually
- [ ] **Review memory** — Check `~/.openclaw/memory/` periodically

## Deep Dives

- [Security Hardening](/security/hardening) — Step-by-step production security
- [Known Vulnerabilities](/security/known-vulnerabilities) — CVEs and incidents
- [Skill Verification](/security/skill-verification) — Reviewing skills before installation
