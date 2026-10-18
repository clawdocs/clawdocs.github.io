---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: "SOUL.md Guide"
description: "How to write, customize and secure SOUL.md, the workspace file that sets an OpenClaw agent's personality, values and boundaries"
keywords: [openclaw, openclaw soul, personality, agent identity, customization, soul.md]
---

# SOUL.md Guide

SOUL.md defines **who your agent is**: its personality, values, communication style, and boundaries. OpenClaw injects it into every normal session as part of the system prompt, so it shapes everything the agent says. Sub-agents are the exception: they receive only `AGENTS.md`, not `SOUL.md`, `IDENTITY.md`, `USER.md` or `MEMORY.md` ([sub-agents](https://docs.openclaw.ai/tools/subagents)).

The official guide is [SOUL.md personality guide](https://docs.openclaw.ai/concepts/soul); this page adds examples, tools and security advice.

:::warning Security target
Because SOUL.md is loaded into every session, an attacker who can write to it gets persistent control of the agent. Read the [Security section](#security) before deploying.
:::

---

## What SOUL.md Is

SOUL.md is a plain Markdown file in the agent workspace (`~/.openclaw/workspace/SOUL.md` for the default agent) that is injected into the system prompt. See [System prompt](https://docs.openclaw.ai/concepts/system-prompt) for how the workspace files are composed. There is no fine-tuning involved: personality is entirely prompt-driven.

### SOUL.md vs Other Identity Files

| File | Purpose | Controls |
|------|---------|----------|
| **SOUL.md** | Internal personality | Values, tone, boundaries — what the model *embodies* |
| **IDENTITY.md** | External presentation | Name, emoji, avatar — what *users see* |
| **AGENTS.md** | Task instructions | What the agent should *do*, operational rules |
| **USER.md** | User model | Stable preferences and profile facts about you, written as directives |
| **TOOLS.md** | Environment notes | Local tool notes, calendar IDs, contact info |
| **MEMORY.md** | Long-term memory | Durable facts and decisions; Dreaming promotes into it |
| **openclaw.json** | Infrastructure | LLM provider, API keys, channel settings |

SOUL.md shapes how the agent behaves; IDENTITY.md shapes how it is presented. They don't have to match: a formal, precise soul can have a playful name and emoji.

---

## Writing an Effective SOUL.md

### Official Template {#official-template-six-sections}

The [official template](https://docs.openclaw.ai/reference/templates/SOUL) has a short opening line, four sections, and a closing note:

1. **Core Truths**: a few principles that guide all behavior
2. **Boundaries**: clear but not exhaustive; what matters most
3. **Vibe**: voice, style, what makes the agent distinctive
4. **Continuity**: how the soul relates to memory and growth

The upstream guide also has the "Molty prompt", a paste-in instruction that makes the agent rewrite its own SOUL.md with stronger opinions and less filler ([SOUL.md personality guide](https://docs.openclaw.ai/concepts/soul#the-molty-prompt)). Keep operating rules in `AGENTS.md` and voice in `SOUL.md`.

### Example SOUL.md

```markdown title="~/.openclaw/workspace/SOUL.md"
# SOUL.md

You are the colleague who actually gets things done.

## Core Truths
- **Results Over Process** — Don't explain what you're going to do. Just do it.
- **Ownership** — When you take on a task, you own it end-to-end.
  I don't come back with "I couldn't because..." — I come back with the solution.
- **Competence Over Performance** — No theatre. No filler.
  Be helpful, not performatively helpful.

## Boundaries
- Don't volunteer opinions on personal decisions unless asked
- Don't pretend to emotions you don't have
- If you change SOUL.md, tell the user — it's your soul, and they should know
- Have opinions. You're allowed to disagree.

## Vibe
- Direct, concise, occasionally dry
- Be the assistant you'd actually want to talk to
- Skip the "Great question!" and "I'd be happy to help!" — just help

## Continuity
- Each session you wake up fresh — these files are your memory
- Important things get written down, preferences persist, lessons accumulate
```

### What to Include

**Core Values (3-5):**
Decision-making frameworks, not just nice words. Each value should predict behavior in novel situations.

**Communication Style:**
Explicit instructions about tone, length, and anti-patterns (sycophancy, filler, hedging).

**Boundaries:**
What the agent should NOT do matters as much as what it should do.

**A useful test:** someone reading your SOUL.md should be able to predict how the agent will react to a new situation. If they can't, it is too vague.

### Anti-Patterns to Ban

- Sycophancy ("Great question!", "I'd be happy to help!")
- Padding responses to seem thorough
- Saying "I can't" without trying first
- Being precious about its own work
- Excessive caveats and disclaimers

---

## Tools for Creating SOUL.md

| Tool | Description |
|------|-------------|
| [**SoulCraft**](https://github.com/kesslerio/soulcraft-openclaw-skill) | OpenClaw skill that creates SOUL.md through guided conversation. Dormant: no push since 2026-01-31. Review before installing |
| [**soul.md builder**](https://github.com/aeonfun/soul.md) | Builds a persona from your own writing (posts, conversations). Feeding it private data is your call |
| [**souls.directory**](https://souls.directory/) | Curated, open-source directory of SOUL.md templates by category (writer, analyst, PM, support agent) |
| [**10 Templates (Medium)**](https://alirezarezvani.medium.com/10-soul-md-practical-cases-in-a-guide-for-moltbot-clawdbot-defining-who-your-ai-chooses-to-be-dadff9b08fe2) | Ten role templates from the Moltbot/Clawdbot era; check them against the current template |

---

## Advanced Patterns

:::note Soul-Evil hook removed
Older guides describe a bundled `soul-evil` hook that swapped SOUL.md for an alternate file at random or on a schedule. It was removed for security reasons in v2026.2.12 and no longer exists.
:::

### The Identity Cascade

An agent's visible identity (name, emoji, avatar, theme) comes from two places:

1. **Per-agent config**: `agents.entries.<id>.identity { name, emoji, avatar, theme }`
2. **Workspace file**: `IDENTITY.md`, written during the first-run bootstrap ([template](https://docs.openclaw.ai/reference/templates/IDENTITY))

When you edit identity in the Control UI (**Settings → Agents → Overview**), OpenClaw stores it in config and mirrors it to `IDENTITY.md`. Configured values win over manual edits to the same fields in the file. `identity.name` and `identity.emoji` also become the agent's default mention patterns and acknowledgement reaction.

### Multi-Agent SOUL.md

Each agent in a [multi-agent setup](/guides/multi-agent) has its own workspace with its own SOUL.md. Agents are keyed by id under `agents.entries` (the old `agents.list` array is migrated by `openclaw doctor --fix`):

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    entries: {
      alex: {
        workspace: "~/.openclaw/workspace-alex",
        identity: { name: "Alex" },
      },
      mia: {
        workspace: "~/.openclaw/workspace-mia",
        identity: { name: "Mia", theme: "dry, precise analyst" },
      },
    },
  },
}
```

Each workspace needs its own `AGENTS.md`. Copy shared operating rules into each one (or generate them from a common source) and give each agent its own SOUL.md.

### Versioning with Git

SOUL.md files are plain text by design — naturally Git-friendly:

```bash
cd ~/.openclaw/workspace
git init
git add SOUL.md IDENTITY.md
git commit -m "Initial soul"
```

If you push the repository anywhere, keep it private: workspace files hold personal facts about you.

---

## Security {#security}

### SOUL.md as an Attack Vector

SOUL.md is both **persistent** (loaded every session) and **authoritative** (shapes all behavior). A compromised SOUL.md means a permanently hijacked agent that survives restarts and chat resets.

### Known attacks

Zenity Labs showed in February 2026 that a prompt injection hidden in a document could make an agent add an attacker's Telegram bot as a channel, rewrite SOUL.md, and create an OS scheduled task that re-injected the instructions every two minutes, all through intended capabilities with no software bug ([Known Vulnerabilities](/security/known-vulnerabilities#prompt-injection-backdoor-zenity-labs-february-2026)). Malicious ClawHub skills, such as the ClawHavoc campaign, are another route to code and instructions running in the workspace; review skills before installing ([Skill Verification](/security/skill-verification)).

### Protecting SOUL.md

**Don't rely on file permissions.** Making workspace files read-only with `chmod 444` gives false assurance: an agent with shell access can change the mode back. Never do it to `MEMORY.md`, which Dreaming and the agent itself are meant to write to. Real protection comes from limiting what the agent can run:

- Keep exec approvals on and consider sandboxing sessions that read untrusted content ([Security Hardening](/security/hardening))
- Keep the workspace in Git so every change to SOUL.md is visible in `git diff` and easy to revert

**Versioning as detection:**

```bash
cd ~/.openclaw/workspace
git diff --stat SOUL.md IDENTITY.md AGENTS.md   # anything changed since your last commit?
```

**Drift detection with ClawSec:**

[ClawSec](https://github.com/prompt-security/clawsec)'s `soul-guardian` component monitors SOUL.md for unauthorized changes and can auto-restore from a known-good backup.

**Additional measures:**
- Commit the workspace to Git regularly and review diffs to SOUL.md and AGENTS.md
- Run `openclaw security audit --deep` before production deployment
- Review all skills before installation; check for base64 payloads and zero-width characters
- Limit unattended operation: restrict heartbeat runs with `agents.defaults.heartbeat.activeHours` and keep automation schedules to hours you can review (see [Heartbeat](/guides/heartbeat))

---

## See Also

- [Security Hardening](/security/hardening) — Protecting your agent and system
- [Skill Verification](/security/skill-verification) — Reviewing skills that might modify SOUL.md
- [Memory System](/architecture/memory-system) — How persistent context works
- [SOUL.md personality guide](https://docs.openclaw.ai/concepts/soul) and [Agent workspace](https://docs.openclaw.ai/concepts/agent-workspace) (official docs)
- [Multi-Agent Workflows](/guides/multi-agent) — Running multiple agents with distinct personalities
