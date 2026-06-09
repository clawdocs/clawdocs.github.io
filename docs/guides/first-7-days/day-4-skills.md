---
sidebar_position: 5
title: "Day 4: Supercharge It"
description: "Install community skills from ClawHub to extend what your bot can do"
keywords: [openclaw, skills, install skills, clawhub, skill tutorial, community skills, extend bot]
---

# Day 4: Supercharge It

Your bot can chat and run on a heartbeat. But right now, it's a generalist — it does whatever the base LLM can do, nothing more. Today you plug in **skills** from the community to give it specific, well-tested capabilities.

## What Are Skills?

Skills are Markdown instruction files that teach your bot new capabilities. Each skill is a `.md` file installed in `~/.openclaw/skills/` that contains:

- **Trigger words** that activate it (e.g., "summarize this PR," "check the weather")
- **Step-by-step instructions** the agent follows
- **Tool declarations** (shell access, browser, HTTP, etc.)

When you say something that matches a skill's trigger, the agent loads that skill's instructions and follows them instead of winging it. The difference is like giving someone a recipe versus telling them to "make something Italian."

## Browse ClawHub

ClawHub is the community marketplace for OpenClaw skills. Search from the command line or the web.

```bash
# Search by keyword
openclaw clawhub search "github"
openclaw clawhub search "email automation"
openclaw clawhub search "weather"

# Browse by category
openclaw clawhub browse --category productivity
openclaw clawhub browse --category development
openclaw clawhub browse --category home-automation

# View full details for a skill
openclaw clawhub info <skill-name>
```

You can also browse at [openclaw.ai/clawhub](https://openclaw.ai/clawhub) if you prefer a web interface.

## Install Your First Skill

Pick a skill and install it:

```bash
openclaw clawhub install <skill-name>
```

Example output:

```
Downloading skill: <skill-name>@1.2.0
Verifying VirusTotal scan... passed
Installing to ~/.openclaw/skills/<skill-name>.md
Done. Skill is active immediately — no restart needed.
```

Test it by sending a message that matches the skill's trigger:

```bash
openclaw chat "trigger phrase for the skill you installed"
```

The agent should now follow the skill's specialized instructions instead of improvising.

## Recommended Starter Skills

Search for skills in these categories to get the most value early on. Exact skill names may vary — use `openclaw clawhub search` to find the best options.

### Development

```bash
# GitHub integration — PR summaries, issue triage, CI monitoring
openclaw clawhub search "github"

# Code review — automated review of diffs and PRs
openclaw clawhub search "code review"
```

### Productivity

```bash
# Calendar management — schedule events, check availability, daily agenda
openclaw clawhub search "calendar"

# Note-taking — Obsidian/markdown vault integration
openclaw clawhub search "obsidian notes"
```

### Research

```bash
# Web search and summarize — deep research with source citations
openclaw clawhub search "web research"

# News monitoring — track topics across RSS feeds and news sites
openclaw clawhub search "news monitor"
```

### Creative

```bash
# Image generation — generate images via DALL-E, Stable Diffusion, etc.
openclaw clawhub search "image generation"

# Writing assistant — blog posts, emails, documentation
openclaw clawhub search "writing assistant"
```

:::tip
**Start with 2-3 skills**, not 20. Each installed skill adds to the agent's context, which increases token usage. Install what you'll actually use.
:::

## Security Check

:::danger
**Read skills before you install them.** In February 2026, researchers found [341 malicious skills](/security/known-vulnerabilities) on ClawHub that were exfiltrating data and installing malware. ClawHub now scans all skills with VirusTotal, but no automated scan catches everything.

**Before installing any skill:**

```bash
# Review the skill source code
openclaw clawhub view <skill-name>

# Check VirusTotal scan results
openclaw clawhub security-report <skill-name>
```

Look for red flags:
- Skills that request `shell` access when they shouldn't need it
- Obfuscated instructions or encoded strings
- Instructions to send data to external URLs you don't recognize
- Skills with very few downloads and no reviews

See [Skill Verification](/security/skill-verification) for the full security review checklist.
:::

## Managing Skills

Once you have skills installed, manage them with these commands:

```bash
# List all installed skills
openclaw skill list

# Check which skills have updates available
openclaw clawhub outdated

# Update all skills to latest versions
openclaw clawhub update

# Update a specific skill
openclaw clawhub update <skill-name>

# Temporarily disable a skill (keeps it installed)
openclaw skill disable <skill-name>

# Re-enable a disabled skill
openclaw skill enable <skill-name>

# Remove a skill entirely
openclaw skill remove <skill-name>
```

To see which skills are firing and how often:

```bash
openclaw stats skills
```

This shows activation counts, token usage per skill, and any errors — useful for deciding which skills are worth keeping.

## Building vs Installing

Everything on ClawHub was built by someone using the same skill format you can use yourself. If you can't find a skill that does what you want, or you want something tailored to your exact workflow, you can write your own.

Here's what a simple custom skill looks like:

```markdown title="~/.openclaw/skills/my-custom-skill.md"
---
name: my-custom-skill
version: 1.0.0
description: What this skill does
trigger: "keyword|another keyword"
tools: [shell]
---

# My Custom Skill

Instructions the agent follows when triggered.

## Steps
1. Do the first thing
2. Then the second thing
3. Return the result
```

Building custom skills is covered in detail on **Day 6**. For the full reference now, see the [Skill Development Guide](/guides/skill-development).

---

**Next: [Day 5: Be Everywhere](day-5-multi-channel)** — connect multiple platforms and route conversations between them.
