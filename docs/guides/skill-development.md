---
sidebar_position: 3
title: Skill Development
description: Build custom OpenClaw skills with Markdown and YAML — from simple prompts to complex automations
---

# Skill Development

Skills are OpenClaw's extension system. They're Markdown files with YAML frontmatter that teach the agent new capabilities.

## Skill File Format

```markdown title="skills/my-skill.md"
---
name: my-skill
version: 1.0.0
description: A brief description of what this skill does
trigger: "keyword1|keyword2|phrase"
tools: [shell, filesystem, browser]
author: your-name
---

# Skill Name

Instructions for the agent when this skill is activated.

## When to Use
Describe the conditions under which this skill should activate.

## Steps
1. First, do this
2. Then do that
3. Finally, return the result

## Examples
- "keyword1 something specific" → expected behavior
- "keyword2 another thing" → expected behavior
```

## Creating Your First Skill

```markdown title="~/.openclaw/skills/git-summary.md"
---
name: git-summary
version: 1.0.0
description: Summarize recent git activity in a repository
trigger: "git summary|repo summary|what happened in git"
tools: [shell]
---

# Git Summary

When triggered, analyze the recent git history of the current
or specified repository and provide a human-readable summary.

## Steps
1. Run `git log --oneline --since="1 week ago"` in the target repo
2. Group commits by author
3. Identify the most-changed files with `git diff --stat HEAD~20`
4. Summarize the overall trajectory (new features, bug fixes, refactors)
5. Present in a clear, concise format
```

## Skill Triggers

Triggers determine when a skill activates:

| Trigger Type | Example | Matches |
|-------------|---------|---------|
| Keywords | `"weather\|forecast"` | "What's the weather?" |
| Phrases | `"deploy to production"` | "Deploy to production please" |
| Regex | `"/^deploy .+ to (staging\|prod)/"` | "deploy api to staging" |
| Always | `"*"` | Every message (use sparingly) |

## Skill Tools

Declare which tools the skill needs:

```yaml
tools:
  - shell          # Execute terminal commands
  - filesystem     # Read/write files
  - browser        # Web automation
  - http           # Make API requests
  - memory         # Read/write agent memory
  - chat           # Send messages to channels
```

## Testing Skills

```bash
# Test a skill without installing
openclaw skill test ./my-skill.md "trigger phrase here"

# Install locally
openclaw skill install ./my-skill.md

# List installed skills
openclaw skill list

# Remove a skill
openclaw skill remove my-skill
```

## Publishing to ClawHub

Share your skills with the community:

```bash
# Login to ClawHub
openclaw clawhub login

# Publish
openclaw clawhub publish ./my-skill.md

# Update
openclaw clawhub publish ./my-skill.md --update
```

:::danger
**All published skills are scanned by VirusTotal** before appearing on ClawHub. However, review skills carefully before installing — see [Skill Verification](/security/skill-verification).
:::

## Advanced Patterns

### Skills with Configuration

```yaml
---
name: daily-digest
config:
  email: ""          # User must configure
  time: "09:00"
  timezone: "UTC"
---
```

Users configure via:
```bash
openclaw skill config daily-digest --set email=me@example.com
```

### Skills that Chain Other Skills

```yaml
---
name: morning-routine
depends: [weather-briefing, calendar-summary, news-digest]
---
```

### Skills with State

Skills can persist state between invocations:

```markdown
## State Management
Store results in memory at `memory/skills/my-skill-state.md`
so they're available on the next invocation.
```

## See Also

- [Skill Workshop](/guides/skill-workshop) — Governed skill creation with proposal queues, security scanning, and versioning (v2026.6.1+)
- [ClawHub Guide](/guides/clawhub) — Browse and install community skills
- [Skill Verification](/security/skill-verification) — Security review process
- [Recipes](/guides/recipes/email-assistant) — Example skill implementations
