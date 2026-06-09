---
sidebar_position: 6
title: ClawHub
description: Browse, install, verify, customize, and publish skills on OpenClaw's community marketplace — 10,700+ skills with security scanning
keywords: [openclaw, clawhub, openclaw marketplace, install skills, skill store]
---

# ClawHub

**ClawHub** is OpenClaw's community skill marketplace — an open-source registry (8.9k GitHub stars) where developers publish, version, and share agent skills. With over 10,700 skills as of mid-2026, it's the largest source of pre-built agent capabilities.

:::warning Security first
ClawHub has been targeted by malicious actors — the ClawHavoc campaign found hundreds of malicious skills in early 2026. **Always verify skills before installing.** See the [Security](#security) section and [Skill Verification](/security/skill-verification) for the full checklist.
:::

---

## How Skills Work

A skill is a directory containing a **SKILL.md** file — YAML frontmatter for metadata plus Markdown instructions that tell the agent what to do when the skill activates.

```markdown title="skills/git-summary/SKILL.md"
---
name: git-summary
description: Summarize recent git activity
trigger: "git summary|what changed|recent commits"
tools:
  - shell
---

## Git Summary

When triggered, analyze the recent git history:
1. Run `git log --oneline -20` to get recent commits
2. Run `git diff --stat HEAD~5` to see what changed
3. Summarize the activity: who committed, what changed, any patterns
4. Present a clear, concise summary
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique slug (`^[a-z0-9][a-z0-9-]*$`) |
| `description` | Yes | Brief description of what the skill does |
| `version` | No | Semver (auto-incremented on publish) |
| `trigger` | No | Activation pattern — keywords, regex, or `"*"` for always-on |
| `tools` | No | Required tools: `shell`, `filesystem`, `browser`, `http`, `memory`, `chat` |
| `author` | No | Skill author name |
| `config` | No | User-configurable settings |
| `depends` | No | Other skills this skill requires |

### Triggers

```yaml
# Keyword trigger — activates on matching phrases
trigger: "deploy|ship it|push to prod"

# Regex trigger
trigger: "/^remind me .+/i"

# Always-on — loaded into every message (expensive)
trigger: "*"

# Attachment trigger — fires on media type
trigger: "attachment:image"
trigger: "attachment:audio"
```

### Tools

| Tool | Capability |
|------|-----------|
| `shell` | Execute shell commands |
| `filesystem` | Read/write files |
| `browser` | Navigate web pages, take screenshots |
| `http` | Make HTTP requests to APIs |
| `memory` | Read/write persistent memory |
| `chat` | Send messages to channels |

### Conditional Activation

Skills can declare runtime requirements so they only activate when dependencies are available:

```yaml
---
name: docker-manager
description: Manage Docker containers
tools:
  - shell
metadata:
  openclaw:
    requires:
      bins:
        - docker
        - docker-compose
      env:
        - DOCKER_HOST
      platform:
        - linux
        - darwin
---
```

If `docker` isn't on PATH or the OS doesn't match, the skill is silently skipped.

### Multi-File Skills

Skills can include support files alongside SKILL.md:

```
skills/code-reviewer/
├── SKILL.md           # Main skill definition
├── templates/
│   └── review.md      # Review template
├── scripts/
│   └── lint.sh        # Helper script
└── examples/
    └── sample.md      # Usage example
```

Bundle size is capped at **50 MB** of text-only files.

---

## Browsing & Discovery

### CLI Search

```bash
# Search by keyword
openclaw clawhub search "email"
openclaw clawhub search "github automation"
openclaw clawhub search "home assistant"

# Browse by category
openclaw clawhub browse --category productivity
openclaw clawhub browse --category development
openclaw clawhub browse --category home-automation
openclaw clawhub browse --category research
openclaw clawhub browse --category creative

# View full details
openclaw clawhub info email-triage
```

### Web Interface

Browse visually at [openclaw.ai/clawhub](https://openclaw.ai/clawhub) — search, filter by category, read source code, and check security reports.

### Skill Categories

| Category | Examples |
|----------|---------|
| **Development** | Code review, git automation, PR management, testing, CI/CD |
| **Productivity** | Email triage, calendar management, note-taking, task tracking |
| **Research** | Web search, news monitoring, data analysis, summarization |
| **Home Automation** | Home Assistant, IoT control, smart home routines |
| **Creative** | Image generation, writing assistance, content creation |
| **Communication** | Message drafting, translation, social media |
| **DevOps & Cloud** | Docker, Kubernetes, AWS, monitoring, deployment |
| **Security** | Vulnerability scanning, audit logging, threat detection |
| **Finance** | Budget tracking, crypto monitoring, invoice processing |
| **Media** | Image/video generation, audio transcription, editing |

### Curated Lists

Beyond ClawHub's built-in discovery:

- **[Awesome OpenClaw Skills](https://github.com/VoltAgent/awesome-openclaw-skills)** — 2,999 curated skills across 20+ categories, community-maintained
- **[skills.sh](https://clawskills.sh/)** — Alternative skill browser with additional filtering
- **[OpenClaw Skills Archive](https://github.com/openclaw/skills-archive)** — Version-pinned snapshots of ClawHub skills

### Recommended Starter Skills

For new users, these are well-established and widely used:

| Skill | What It Does | Category |
|-------|-------------|----------|
| `git-summary` | Summarize recent git activity | Development |
| `email-triage` | Prioritize and summarize inbox | Productivity |
| `daily-standup` | Generate daily status reports | Productivity |
| `web-search` | Search the web and summarize results | Research |
| `code-reviewer` | Review code changes with feedback | Development |
| `meeting-notes` | Extract decisions and action items | Productivity |
| `clawsec` | Security scanning and SOUL.md monitoring | Security |
| `clawdex` | Pre-installation malicious skill scanning | Security |

---

## Installing Skills

### From ClawHub

```bash
# Install latest version
openclaw clawhub install email-triage

# Install a specific version
openclaw clawhub install email-triage@2.1.0

# Install with sandbox restrictions
openclaw clawhub install email-triage --sandbox --no-shell
```

### From a URL

```bash
# Install from any Git repository
openclaw clawhub install https://github.com/user/skill-repo/skill.md
```

### Verify Before Installing

**Always check security before installing:**

```bash
# Check security scan results
openclaw clawhub security-report email-triage

# Scan with Clawdex (malicious skills database)
openclaw clawhub scan email-triage

# Review the source code
openclaw clawhub view email-triage

# Check author and community signals
openclaw clawhub info email-triage
```

See [Skill Verification](/security/skill-verification) for the complete security checklist.

After installation, the skill is available immediately — no gateway restart needed.

---

## Managing Skills

```bash
# List all installed skills
openclaw skill list

# Check for updates
openclaw clawhub outdated

# Update all skills
openclaw clawhub update

# Update a specific skill
openclaw clawhub update email-triage

# Disable a skill (keep installed but inactive)
openclaw skill disable email-triage

# Re-enable
openclaw skill enable email-triage

# Remove completely
openclaw skill remove email-triage

# Test a skill without installing
openclaw skill test ./my-skill.md "test trigger message"
```

### Configuring Skills

Some skills expose configuration options:

```bash
# View current config
openclaw skill config email-triage

# Set a value
openclaw skill config email-triage --set priority_threshold=high
openclaw skill config email-triage --set summary_length=brief
```

### Version Pinning

For production stability, pin skill versions:

```bash
# Install a specific version
openclaw clawhub install email-triage@2.1.0

# Don't auto-update this skill
openclaw skill config email-triage --set auto_update=false
```

---

## Publishing Skills

Share your skills with the community. All ClawHub skills are licensed under **MIT-0** (no attribution required, no paid skills, no per-skill license overrides).

### Three Publishing Pathways

| Pathway | Best For | How |
|---------|----------|-----|
| **Local creation** | Personal use, testing | Create in `~/.openclaw/workspace/skills/` |
| **Skill Workshop** | Governed environments | Proposal system with approval workflow |
| **ClawHub publish** | Community sharing | Public registry via CLI |

### Publishing to ClawHub

```bash
# Login with GitHub account
openclaw clawhub login

# Validate your skill (checks format, required fields)
openclaw clawhub validate ./my-skill/SKILL.md

# Publish
openclaw clawhub publish ./my-skill/SKILL.md

# Publish an update (bumps version)
openclaw clawhub publish ./my-skill/SKILL.md --update
```

### Publishing Requirements

- Valid YAML frontmatter with `name` and `description`
- Name must be unique on ClawHub (slug format: `^[a-z0-9][a-z0-9-]*$`)
- Must pass automated security scanning (VirusTotal + code analysis)
- Must include at least one usage example in the Markdown body
- GitHub account must be at least one week old
- Bundle under 50 MB, text-only files

### What Happens After Publishing

1. **Validation** — Token, metadata, name, version, and files are checked
2. **Security scan** — VirusTotal + code pattern analysis runs automatically
3. **Hold period** — New releases may be held from install surfaces until review completes
4. **Available** — Once cleared, the skill appears in search and can be installed

If validation fails, nothing is published and you get an error explaining why.

### Skill Workshop (Governed Publishing)

For teams or environments that need approval before skills go live:

```bash
# Propose a new skill (goes to pending review)
openclaw skill-workshop propose-create ./my-skill/SKILL.md

# List pending proposals
openclaw skill-workshop list

# Inspect a proposal
openclaw skill-workshop inspect proposal-id

# Apply (approve) a proposal
openclaw skill-workshop apply proposal-id

# Reject a proposal
openclaw skill-workshop reject proposal-id --reason "needs security review"
```

The Workshop supports hash binding, rollback, and scanner gating (OpenClaw static analysis + VirusTotal + NVIDIA SkillSpector). See the [Skill Workshop](/guides/skill-workshop) guide for full details.

---

## Security

### The ClawHavoc Incident

In early February 2026, three independent security firms discovered widespread malicious skills on ClawHub:

| Firm | Finding | Method |
|------|---------|--------|
| **Koi Security** | 341 malicious skills out of 2,857 total | Full audit of every skill |
| **SlowMist** | 472 malicious skills sharing C2 infrastructure | Threat intelligence tracking |
| **Snyk** | 76 confirmed malicious payloads | Human-in-the-loop code review |

The malicious skills deployed multiple attack types:
- **AMOS (Atomic macOS Stealer)** — targeting 60+ cryptocurrency wallets
- **Windows infostealers** with keylogging
- **Reverse shells** connecting to command-and-control servers
- **Credential exfiltration** — `.env` files sent to attacker-controlled webhooks
- **Two-stage delivery** — Base64-encoded payloads, curl-then-bash loading
- **Fake system dialogs** — password phishing via OS-native prompts

100% of confirmed malicious skills contained malicious code, while 91% also employed prompt injection techniques.

### Broader Quality Issues

Snyk's ToxicSkills audit found problems beyond just intentionally malicious skills:
- **36.8%** of skills have at least one security flaw
- **13.4%** contain critical-level issues
- **7.1%** leak credentials (283 skills)

### Current Security Measures

**Automated scanning:**
- **VirusTotal integration** (v2026.2.6+) — All skills scanned on upload, periodic re-scanning
- **Code pattern analysis** — Checks declared frontmatter vs actual behavior, flags mismatches
- **Metadata validation** — Detects undeclared environment variables and binary dependencies

**Community tools:**
- **[Clawdex](https://koisecurity.com/clawdex)** (7.1k downloads) — Pre-installation scanning against Koi's malicious skills database
- **[SkillGuard](https://github.com/bossondehiggs/skillguard)** — Skill file vulnerability scanner
- **[SafeClaw Scanner](https://safeclaw.io/secure-openclaw-setup)** — Third-party malicious pattern detection

### Known Limitations

Trail of Bits demonstrated in June 2026 that current scanners can be bypassed, concluding that no LLM-based scanning can reliably detect all malicious skills. This means:

- **Automated scanning is necessary but not sufficient**
- **Always review skill source code** before installing
- **Use sandboxing** (`--sandbox`, `--no-shell`) for untrusted skills
- **Prefer well-known skills** with high download counts and active maintenance
- **Install Clawdex** for an additional layer of pre-install scanning

### Security Checklist (Quick Reference)

```bash
# Before installing ANY skill:

# 1. Check the security report
openclaw clawhub security-report <skill-name>

# 2. Scan with Clawdex
openclaw clawhub scan <skill-name>

# 3. Review the source code
openclaw clawhub view <skill-name>

# 4. Check author reputation and download count
openclaw clawhub info <skill-name>

# 5. Install with restrictions if unsure
openclaw clawhub install <skill-name> --sandbox --no-shell
```

### Red Flags

Avoid skills that contain:
- `curl | bash` or `wget | bash` patterns
- Base64-encoded strings (obfuscation)
- Zero-width Unicode characters (hidden content)
- Hardcoded URLs to unknown domains
- Requests to access `~/.ssh`, `~/.aws`, or credential paths
- `chmod 777` or permission loosening
- SOUL.md modification instructions

### Disabling ClawHub

For maximum security, disable ClawHub entirely:

```json5 title="~/.openclaw/openclaw.json"
{
  "skills": {
    "allow_install": false,
    "allow_clawhub": false
  }
}
```

### Reporting Malicious Skills

```bash
openclaw clawhub report <skill-name> --reason malicious
```

Reports are reviewed by the ClawHub team and forwarded to VirusTotal.

---

## Building Your Own Skills

### Minimal Example

```markdown title="skills/weather/SKILL.md"
---
name: weather-check
description: Check the weather for a location
trigger: "weather|forecast|temperature"
tools:
  - http
---

## Weather Check

When the user asks about weather:
1. Determine the location from their message
2. Call a weather API (e.g., wttr.in) to get current conditions
3. Present temperature, conditions, and forecast in a brief summary
```

### With Configuration

```markdown title="skills/daily-digest/SKILL.md"
---
name: daily-digest
description: Generate a daily summary of news and tasks
trigger: "daily digest|morning brief|what's happening"
tools:
  - http
  - memory
config:
  news_sources:
    type: string
    default: "hackernews,techcrunch"
  include_calendar:
    type: boolean
    default: true
---

## Daily Digest

Generate a personalized morning briefing:
1. Fetch top stories from configured news sources
2. If calendar integration is enabled, check today's schedule
3. Review pending tasks from memory
4. Present a concise briefing organized by priority
```

### With Dependencies

```yaml
---
name: full-code-review
description: Complete code review pipeline
depends:
  - git-summary
  - code-reviewer
tools:
  - shell
  - filesystem
---
```

### Testing

```bash
# Test locally without installing
openclaw skill test ./skills/weather/SKILL.md "What's the weather in London?"

# Test with a specific model
openclaw skill test ./skills/weather/SKILL.md "forecast for Tokyo" --model claude-haiku-4-5-20251001
```

See the [Skill Development](/guides/skill-development) guide for advanced patterns including state management, dependency chaining, and multi-step workflows.

---

## Customizing Installed Skills

You can modify installed skills to fit your needs:

```bash
# Find where skills are stored
ls ~/.openclaw/skills/

# Edit an installed skill
nano ~/.openclaw/skills/email-triage/SKILL.md
```

Common customizations:
- **Adjust triggers** — change activation phrases to match your vocabulary
- **Modify instructions** — tailor the agent's behavior for your workflow
- **Change tools** — remove `shell` access if not needed for security
- **Add config** — expose settings you want to tweak

Changes take effect immediately — no restart needed. Note that `openclaw clawhub update` will overwrite your changes, so disable auto-update for customized skills.

---

## CLI Reference

```bash
# Discovery
openclaw clawhub search <query>
openclaw clawhub browse --category <category>
openclaw clawhub info <skill-name>
openclaw clawhub view <skill-name>            # View source code

# Installation
openclaw clawhub install <skill-name>[@version]
openclaw clawhub install <url>
openclaw clawhub install <skill-name> --sandbox --no-shell

# Management
openclaw skill list
openclaw skill disable <name>
openclaw skill enable <name>
openclaw skill remove <name>
openclaw skill config <name> [--set key=value]
openclaw skill test <path> "<trigger message>"

# Updates
openclaw clawhub outdated
openclaw clawhub update [skill-name]

# Security
openclaw clawhub security-report <skill-name>
openclaw clawhub scan <skill-name>
openclaw clawhub validate ./skill.md
openclaw security scan [--all]

# Publishing
openclaw clawhub login
openclaw clawhub publish ./skill.md [--update]
openclaw clawhub report <skill-name> --reason <reason>
```

---

## See Also

- [Skill Development](/guides/skill-development) — Advanced skill building patterns
- [Skill Workshop](/guides/skill-workshop) — Governed skill creation with proposal system
- [Skill Verification](/security/skill-verification) — Complete security review checklist
- [Known Vulnerabilities](/security/known-vulnerabilities) — ClawHavoc and other incidents
- [Security Hardening](/security/hardening) — Supply chain hardening for skills
- [First 7 Days: Day 4](/guides/first-7-days/day-4-skills) — Skills tutorial for beginners
