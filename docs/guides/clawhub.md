---
sidebar_position: 6
title: ClawHub
description: Browse, install, and publish skills on OpenClaw's community marketplace
---

# ClawHub

**ClawHub** is OpenClaw's community skill marketplace — a registry where developers publish, version, and share agent skills.

## Browsing Skills

```bash
# Search for skills
openclaw clawhub search "email"
openclaw clawhub search "github automation"

# Browse categories
openclaw clawhub browse --category productivity
openclaw clawhub browse --category development
openclaw clawhub browse --category home-automation

# View skill details
openclaw clawhub info email-triage
```

You can also browse at [openclaw.ai/clawhub](https://openclaw.ai/clawhub).

## Installing Skills

```bash
# Install a skill
openclaw clawhub install email-triage

# Install a specific version
openclaw clawhub install email-triage@2.1.0

# Install from a direct URL
openclaw clawhub install https://github.com/user/skill-repo/skill.md
```

After installation, the skill is available immediately — no gateway restart needed.

## Managing Installed Skills

```bash
# List installed skills
openclaw skill list

# Check for updates
openclaw clawhub outdated

# Update all skills
openclaw clawhub update

# Update a specific skill
openclaw clawhub update email-triage

# Remove a skill
openclaw skill remove email-triage
```

## Publishing Skills

Share your skills with the community:

```bash
# Login
openclaw clawhub login

# Validate before publishing
openclaw clawhub validate ./my-skill.md

# Publish
openclaw clawhub publish ./my-skill.md

# Publish an update
openclaw clawhub publish ./my-skill.md --update
```

### Publishing Requirements

- Skill must have valid YAML frontmatter (`name`, `version`, `description`)
- Name must be unique on ClawHub
- Must pass VirusTotal security scan
- Must include at least one usage example

## Security

:::danger
**ClawHub has been targeted by malicious actors.** In February 2026, researchers found [341 malicious skills](/security/known-vulnerabilities) on ClawHub that were stealing data and installing malware.

**Always verify skills before installing:**
```bash
# Check security scan results
openclaw clawhub security-report email-triage

# Review the skill source before installing
openclaw clawhub view email-triage
```

See [Skill Verification](/security/skill-verification) for a complete security review checklist.
:::

### VirusTotal Integration

As of v2026.2.6, all ClawHub skills are scanned by **Google VirusTotal** before publication:

- Automated malware detection
- Code pattern analysis via VirusTotal Code Insight
- Skills flagged by VirusTotal are blocked from publication
- Existing skills are periodically re-scanned

## See Also

- [Skill Development](/guides/skill-development) — How to build skills
- [Skill Verification](/security/skill-verification) — Security review checklist
- [Known Vulnerabilities](/security/known-vulnerabilities) — ClawHub security incidents
