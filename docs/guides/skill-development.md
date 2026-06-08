---
sidebar_position: 3
title: Skill Development
description: Build custom OpenClaw skills — from simple prompts to multi-file automations with config, state, dependencies, and conditional activation
---

# Skill Development

Skills are OpenClaw's extension system. They're Markdown files with YAML frontmatter that teach the agent new capabilities — no code required.

This guide covers everything from your first skill to advanced patterns like state management, conditional activation, and multi-file bundles. For installing existing skills, see [ClawHub](/guides/clawhub).

---

## Your First Skill

Create a file in the skills directory:

```markdown title="~/.openclaw/skills/git-summary.md"
---
name: git-summary
version: 1.0.0
description: Summarize recent git activity in a repository
trigger: "git summary|repo summary|what happened in git"
tools:
  - shell
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

Test it:

```bash
openclaw skill test ~/.openclaw/skills/git-summary.md "what happened in git this week?"
```

The agent processes the message as if from a real channel — you'll see the reasoning chain, tool calls, and generated response, but side effects aren't executed in test mode.

Install it:

```bash
openclaw skill install ~/.openclaw/skills/git-summary.md
```

It's live immediately — no gateway restart needed.

---

## SKILL.md Format

Every skill is a Markdown file with YAML frontmatter. Only `name` and `description` are required.

### Frontmatter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Unique slug (`^[a-z0-9][a-z0-9-]*$`) |
| `description` | Yes | string | What the skill does (shown in search results) |
| `version` | No | string | Semver — auto-incremented on ClawHub publish |
| `trigger` | No | string | When to activate (keywords, regex, `"*"`) |
| `tools` | No | string[] | Required tools: `shell`, `filesystem`, `browser`, `http`, `memory`, `chat` |
| `author` | No | string | Your name or handle |
| `config` | No | object | User-configurable settings with types and defaults |
| `depends` | No | string[] | Other skills this skill requires |
| `metadata` | No | object | Runtime requirements, platform constraints |

### Markdown Body

The body after the frontmatter is the skill's **instructions** — loaded into the agent's context when the skill activates. Write it like you're briefing a capable colleague:

- **What to do** — Clear steps in priority order
- **When to use vs. skip** — Edge cases and boundaries
- **How to present results** — Output format expectations
- **Examples** — Input/output pairs help the agent understand intent

The agent interprets the Markdown as natural language instructions, not executable code. Be specific about desired behavior.

---

## Triggers

Triggers determine when a skill activates. Without a trigger, the skill must be invoked explicitly.

### Keyword Triggers

Pipe-separated keywords — the skill activates if any keyword appears in the user's message:

```yaml
trigger: "weather|forecast|temperature|rain"
```

Matches: "What's the weather in London?", "Will it rain tomorrow?", "forecast for next week"

### Regex Triggers

Wrap in forward slashes for pattern matching:

```yaml
trigger: "/^deploy .+ to (staging|prod)$/i"
```

Matches: "deploy api to staging", "Deploy frontend to prod"

### Attachment Triggers

Fire on specific media types:

```yaml
trigger: "attachment:image"
trigger: "attachment:audio"
trigger: "attachment:file"
```

Useful for skills that process images (OCR, analysis), transcribe audio, or parse uploaded documents.

### Always-On Triggers

```yaml
trigger: "*"
```

Loaded into **every message** — the skill's instructions become part of the agent's permanent context. This increases token costs on every interaction. Use only for skills that genuinely need to be always available (like a personality modifier or safety guardrail).

### Compound Triggers

Combine approaches by using both keywords and patterns:

```yaml
trigger: "deploy|ship it|/^push .+ to (staging|production)$/"
```

### Trigger Design Tips

- **Be specific** — `"deploy to production"` is better than `"deploy"` (avoids false activations)
- **Include variations** — `"git summary|repo summary|what changed in git|recent commits"`
- **Test edge cases** — Run `openclaw skill test` with messages that should and shouldn't trigger
- **Avoid `"*"` unless necessary** — Each always-on skill adds to every message's token cost

---

## Tools

Declare which tools the skill needs. The agent can only use declared tools when the skill is active.

| Tool | Capability | Example Use |
|------|-----------|-------------|
| `shell` | Execute terminal commands | Run git, docker, curl, scripts |
| `filesystem` | Read and write files | Parse logs, write reports, edit configs |
| `browser` | Navigate web pages, screenshots | Scrape data, fill forms, monitor sites |
| `http` | Make HTTP requests | Call APIs, send webhooks, fetch data |
| `memory` | Read/write agent memory files | Track state, store preferences |
| `chat` | Send messages to channels | Notify users, post to Slack/Telegram |

### Principle of Least Privilege

Declare only the tools actually needed:

| Skill Type | Recommended Tools |
|-----------|-------------------|
| Information lookup | `http` only |
| File analysis | `filesystem` (read-only in instructions) |
| Code formatting | `filesystem` |
| API integration | `http`, `chat` |
| DevOps automation | `shell`, `filesystem`, `chat` |
| Full automation | All tools (justify each) |

:::warning
Skills with `shell` access can execute arbitrary commands with the permissions of the OpenClaw process. For untrusted skills, install with `--sandbox --no-shell`.
:::

---

## Configuration

Skills can expose user-configurable settings via the `config` field.

### Basic Config

```yaml
---
name: email-digest
description: Daily email summary
trigger: "email digest|inbox summary"
tools:
  - http
  - memory
config:
  vip_contacts: []
  summary_length: "brief"
  include_promotions: false
---
```

### Typed Config

Specify types and defaults for validation:

```yaml
config:
  news_sources:
    type: string
    default: "hackernews,techcrunch"
  max_articles:
    type: number
    default: 10
  include_calendar:
    type: boolean
    default: true
  priority_contacts:
    type: array
    default: []
```

### User Configuration

Users set values via CLI:

```bash
# View current config
openclaw skill config email-digest

# Set a value
openclaw skill config email-digest --set summary_length=detailed
openclaw skill config email-digest --set vip_contacts='["boss@company.com","cto@company.com"]'
openclaw skill config email-digest --set include_promotions=true
```

### Referencing Config in Instructions

Reference config values in your skill's Markdown body:

```markdown
## Behavior
- Summarize emails based on the configured summary_length preference
- Always prioritize emails from contacts listed in vip_contacts
- If include_promotions is false, skip promotional emails entirely
```

The agent reads the config values at runtime and applies them to its behavior.

---

## Conditional Activation

Skills can declare runtime requirements so they only activate when dependencies are available. If requirements aren't met, the skill is silently skipped.

### Binary Dependencies

```yaml
metadata:
  openclaw:
    requires:
      bins:
        - docker
        - docker-compose
```

The skill only activates if `docker` and `docker-compose` are on PATH.

### Environment Variables

```yaml
metadata:
  openclaw:
    requires:
      env:
        - GITHUB_TOKEN
        - SLACK_WEBHOOK_URL
```

### Platform Constraints

```yaml
metadata:
  openclaw:
    requires:
      platform:
        - linux
        - darwin
```

### Combined Requirements

```yaml
metadata:
  openclaw:
    requires:
      bins:
        - kubectl
        - helm
      env:
        - KUBECONFIG
      platform:
        - linux
        - darwin
```

This skill only activates on Linux or macOS when kubectl, helm, and KUBECONFIG are all available.

---

## State Management

Skills can persist state between invocations using the `memory` tool.

### File-Based State

Store state as Markdown files in the agent's memory directory:

```markdown title="SKILL.md body"
## State Management

After each invocation:
1. Read current state from `~/.openclaw/memory/skills/expense-tracker-state.md`
2. Update with new data
3. Write the updated state back

State file format:
- Running total at the top
- Individual entries as a Markdown list with dates
- Monthly subtotals
```

### Pattern: Accumulating State

```markdown title="skills/standup-tracker.md body"
## State

Maintain a running log at `~/.openclaw/memory/skills/standup-log.md`:

- Each entry: date, what was done, blockers, plans
- Keep the last 30 days of entries
- On "weekly summary" trigger, aggregate the week's entries
- On "monthly report" trigger, generate statistics
```

### Pattern: Cached Lookups

```markdown
## Caching

Before making API calls, check if cached data exists at
`~/.openclaw/memory/skills/api-cache.md` and is less than 1 hour old.
If fresh data exists, use it instead of calling the API again.
```

---

## Dependencies

Skills can depend on other skills:

```yaml
---
name: morning-routine
description: Full morning briefing
trigger: "morning routine|good morning|start my day"
depends:
  - weather-check
  - email-digest
  - calendar-summary
  - news-brief
tools:
  - http
  - memory
  - chat
---

# Morning Routine

Run each dependent skill in order:
1. Get the weather briefing
2. Summarize unread emails
3. List today's calendar events
4. Get top news headlines
5. Present everything as a single concise briefing
```

When `morning-routine` activates, OpenClaw ensures all dependent skills are installed and their instructions are available. If a dependency is missing, the skill warns the user.

---

## Multi-File Skills

For complex skills, use a directory structure with SKILL.md as the entry point:

```
skills/code-reviewer/
├── SKILL.md              # Main skill definition
├── templates/
│   ├── review.md         # Review report template
│   └── security-check.md # Security-focused review template
├── scripts/
│   └── lint.sh           # Helper script (referenced in instructions)
└── examples/
    └── sample-review.md  # Example output
```

### Referencing Support Files

In your SKILL.md body, reference support files relative to the skill directory:

```markdown
## Review Format

Use the template in `templates/review.md` to structure your output.
For security-sensitive PRs, also apply `templates/security-check.md`.
```

### Bundle Constraints

- Maximum **50 MB** total (text-only files)
- Skill Workshop has tighter limits: max 64 files, 256 KB each, 2 MB total
- No executable binaries
- No absolute paths or path traversal (`../`)

---

## Testing & Debugging

### Test Mode

Test a skill without installing or executing side effects:

```bash
# Test with a trigger message
openclaw skill test ./my-skill.md "deploy api to staging"

# Test with a specific model (useful for cost testing)
openclaw skill test ./my-skill.md "summarize my inbox" --model claude-haiku-4-5-20251001

# Test an installed skill
openclaw skill test ~/.openclaw/skills/daily-standup.md "run my standup"
```

Test mode shows the full reasoning chain: which trigger matched, what tools were called, and the generated response.

### Validation

Check format and metadata before publishing:

```bash
openclaw clawhub validate ./my-skill/SKILL.md
```

Validation checks:
- Valid YAML frontmatter with required fields
- Name follows slug format (`^[a-z0-9][a-z0-9-]*$`)
- Tool references are valid
- No syntax errors in the Markdown body
- Bundle size within limits

### Debugging Installed Skills

```bash
# List installed skills with status
openclaw skill list

# Check if a skill is triggering correctly
openclaw gateway --log-level debug

# View skill activation logs
openclaw logs --filter skill
```

### Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Skill never triggers | Trigger doesn't match user phrasing | Add more keyword variations |
| Skill triggers too often | Trigger is too broad (e.g., `"check"`) | Use more specific phrases |
| Wrong tools used | Tools not declared in frontmatter | Add required tools to `tools` array |
| High token costs | Always-on trigger (`"*"`) | Switch to keyword trigger |
| State not persisting | Not using `memory` tool | Add `memory` to tools, write state files |
| Config not applied | Config key typo | Check `openclaw skill config <name>` |

---

## Security Best Practices for Skill Authors

### Do

- Declare only the tools your skill actually needs
- Use specific triggers to avoid unintended activation
- Document what the skill does and why it needs each tool
- Include usage examples so users know what to expect
- Test with `--sandbox` to verify the skill works with restrictions

### Don't

- Access credential paths (`~/.ssh`, `~/.aws`, `~/.gnupg`) without clear justification
- Use `curl | bash` or `wget | bash` patterns
- Embed Base64-encoded content
- Hardcode URLs to unknown external domains
- Modify SOUL.md or other agent configuration
- Request broader permissions than needed
- Use `chmod 777` or loosen file permissions

### Supply Chain Awareness

If your skill fetches external resources (APIs, scripts, packages):
- Document all external dependencies
- Pin versions where possible
- Prefer well-known, trusted sources
- Consider what happens if an external resource is compromised

---

## Performance-Aware Design

### Token Cost

Every skill's instructions consume tokens when activated. Minimize instruction size:

- **Be concise** — say what to do, not how LLMs work
- **Use structured steps** — numbered lists are more token-efficient than prose
- **Avoid redundancy** — don't repeat the description in the body
- **Skip boilerplate** — no "you are a helpful assistant" preambles

### Trigger Efficiency

| Trigger Type | Cost Impact |
|-------------|-------------|
| Keyword | Zero cost until triggered |
| Regex | Zero cost until triggered |
| Attachment | Zero cost until triggered |
| Always-on (`"*"`) | Adds to every message's context |

A skill with 500 tokens of instructions and a `"*"` trigger costs ~500 extra tokens on every single message. Over a day with 100 messages, that's 50,000 tokens just for one always-on skill.

### Model-Aware Instructions

For skills that don't need top-tier reasoning, suggest a model in the instructions:

```markdown
## Notes
This skill performs simple lookups. If the user has model routing
configured, this is suitable for a fast/cheap model tier.
```

---

## Real-World Examples

### DevOps: Container Manager

```markdown title="skills/container-manager/SKILL.md"
---
name: container-manager
version: 1.0.0
description: Manage Docker containers — status, logs, restart, deploy
trigger: "docker|container|pods|service status"
tools:
  - shell
  - chat
config:
  alert_channel: "telegram"
  auto_restart: false
metadata:
  openclaw:
    requires:
      bins:
        - docker
---

# Container Manager

## On Status Request
1. Run `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`
2. Check for unhealthy containers: `docker ps --filter health=unhealthy`
3. Report status, highlighting any issues

## On Log Request
1. Identify the container from the user's message
2. Run `docker logs --tail 50 <container>`
3. Summarize errors or warnings

## On Restart Request
1. Confirm the container name with the user
2. Run `docker restart <container>`
3. Wait 10 seconds, then check status
4. Report whether the restart succeeded

## Alerts
If auto_restart is enabled and an unhealthy container is detected
during a heartbeat check, restart it and notify the alert_channel.
```

### Productivity: Meeting Notes

```markdown title="skills/meeting-notes.md"
---
name: meeting-notes
version: 1.0.0
description: Extract decisions, action items, and key points from meeting transcripts
trigger: "meeting notes|meeting summary|action items from meeting"
tools:
  - filesystem
  - memory
  - chat
config:
  output_format: "markdown"
  notify_channel: ""
---

# Meeting Notes

When given a meeting transcript (pasted text or file path):

1. Extract key discussion points in chronological order
2. List all **decisions** made (who decided what)
3. List all **action items** with assignees and deadlines
4. Note any **open questions** that weren't resolved
5. Write a 2-3 sentence executive summary at the top

## Output
Save to `~/.openclaw/memory/meetings/YYYY-MM-DD-topic.md`

If notify_channel is configured, send a brief summary with
action items to that channel.
```

### Monitoring: Uptime Checker

```markdown title="skills/uptime-checker.md"
---
name: uptime-checker
version: 1.0.0
description: Monitor URLs and alert on downtime
trigger: "check uptime|site status|is .+ down"
tools:
  - http
  - memory
  - chat
config:
  urls: []
  timeout_seconds: 10
  alert_channel: "telegram"
---

# Uptime Checker

## Manual Check
When asked about a specific URL:
1. Send an HTTP GET request
2. Report status code, response time, and any errors
3. Compare against previous checks from state file

## Heartbeat Check
On heartbeat, check all URLs in the config:
1. Read previous results from `~/.openclaw/memory/skills/uptime-state.md`
2. Check each URL with configured timeout
3. If any URL is down that was previously up, alert the configured channel
4. If any URL recovers, send a recovery notification
5. Update state file with current results

## State Format
Track per-URL: last status code, response time, last check time,
consecutive failures count.
```

---

## Publishing

### To ClawHub

```bash
# Login with GitHub account
openclaw clawhub login

# Validate first
openclaw clawhub validate ./my-skill/SKILL.md

# Publish
openclaw clawhub publish ./my-skill/SKILL.md

# Publish an update (bumps version automatically)
openclaw clawhub publish ./my-skill/SKILL.md --update
```

### Publishing Checklist

- [ ] `name` and `description` are set and descriptive
- [ ] `trigger` covers the common phrases users would say
- [ ] `tools` lists only what's actually needed
- [ ] At least one usage example in the Markdown body
- [ ] Tested with `openclaw skill test` using realistic messages
- [ ] Tested with `--sandbox` if the skill doesn't need shell access
- [ ] No hardcoded credentials, paths, or personal data
- [ ] `openclaw clawhub validate` passes

### Versioning

ClawHub uses semver. Version is auto-incremented on publish, but you can set it explicitly:

```yaml
version: 2.0.0  # Breaking change (new trigger format)
version: 1.1.0  # New feature (added config option)
version: 1.0.1  # Bug fix (better error handling in instructions)
```

### Via Skill Workshop (Governed)

For teams or environments that need approval before skills go live:

```bash
# Propose a new skill
openclaw skills workshop propose-create \
  --name "deploy-pipeline" \
  --description "Automated deployment pipeline" \
  --proposal ./PROPOSAL.md

# List pending proposals
openclaw skills workshop list

# Apply (approve) a proposal
openclaw skills workshop apply <proposal-id>
```

See [Skill Workshop](/guides/skill-workshop) for the full governed workflow.

---

## CLI Reference

```bash
# Development
openclaw skill test <path> "<trigger message>"
openclaw skill test <path> "<message>" --model <model-id>
openclaw clawhub validate <path>

# Installation
openclaw skill install <path>
openclaw clawhub install <name>[@version]
openclaw clawhub install <name> --sandbox --no-shell

# Management
openclaw skill list
openclaw skill enable <name>
openclaw skill disable <name>
openclaw skill remove <name>
openclaw skill config <name>
openclaw skill config <name> --set <key>=<value>

# Publishing
openclaw clawhub login
openclaw clawhub publish <path> [--update]

# Debugging
openclaw logs --filter skill
openclaw gateway --log-level debug
```

---

## See Also

- [ClawHub](/guides/clawhub) — Browse, install, and verify community skills
- [Skill Workshop](/guides/skill-workshop) — Governed skill creation with proposal queues and security scanning
- [Skill Verification](/security/skill-verification) — Security review checklist for installed skills
- [Performance Tuning](/guides/performance-tuning) — Reduce token costs from always-on skills
- [First 7 Days: Day 6](/guides/first-7-days/day-6-power-moves) — Hands-on skill building tutorial
- [Advanced Recipes](/guides/recipes/advanced-recipes) — Full production skill examples
