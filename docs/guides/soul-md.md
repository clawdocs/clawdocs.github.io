---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: "SOUL.md Guide"
description: "How to write, customize, and secure your OpenClaw agent's identity file — the most important file in the ecosystem"
keywords: [openclaw, openclaw soul, personality, agent identity, customization, soul.md]
---

# SOUL.md Guide

SOUL.md defines **who your agent is**: its personality, values, communication style, and boundaries. OpenClaw injects it into every normal session as part of the system prompt, so it shapes everything the agent says. Sub-agents are the exception: they receive only `AGENTS.md`, not `SOUL.md`, `IDENTITY.md`, `USER.md` or `MEMORY.md` ([sub-agents](https://docs.openclaw.ai/tools/subagents)).

The official guide is [SOUL.md personality guide](https://docs.openclaw.ai/concepts/soul); this page adds examples, tools and security advice.

:::warning Critical Security Target
SOUL.md is also the #1 target for attackers. A compromised SOUL.md means a permanently hijacked agent. Read the [Security section](#security) before deploying.
:::

---

## What SOUL.md Is

SOUL.md is a plain Markdown file in the agent workspace (`~/.openclaw/workspace/SOUL.md` for the default agent) that is injected into the system prompt. See [System prompt](https://docs.openclaw.ai/concepts/system-prompt) for how the workspace files are composed. There's no special model fine-tuning — it's entirely prompt-driven.

> *"OpenClaw's personality comes from markdown files. That's it. No secret sauce, no special model fine-tuning. Just well-crafted prompts."*

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

The key distinction: *"Soul is what the model embodies. Identity is what users see. You can have a formal, precise soul with a playful emoji and nickname — internal behavior and external presentation don't have to match."*

---

## Writing an Effective SOUL.md

### Official Template {#official-template-six-sections}

The [official template](https://docs.openclaw.ai/reference/templates/SOUL) has a short opening line, four sections, and a closing note:

1. **Core Truths**: a few principles that guide all behavior
2. **Boundaries**: clear but not exhaustive; what matters most
3. **Vibe**: voice, style, what makes the agent distinctive
4. **Continuity**: how the soul relates to memory and growth

The upstream guide also has the "Molty prompt", a paste-in instruction that makes the agent rewrite its own SOUL.md with stronger opinions and less filler ([SOUL.md personality guide](https://docs.openclaw.ai/concepts/soul#the-molty-prompt)). Keep operating rules in `AGENTS.md` and voice in `SOUL.md`.

### Design Philosophy

The best SOUL.md files follow four principles:

- **Principled, not rule-bound** — Establish values and judgment, not exhaustive rules
- **Authentic, not performative** — Create genuine character, not a mask
- **Aspirational, not constraining** — Describe who the agent is *becoming*
- **Living, not static** — Evolve as the agent grows

> *"A soul is not a configuration file — it's the essence of who an agent is becoming."*

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

**The Predictability Test:**
> *"Someone reading your SOUL.md should be able to predict your takes on new topics. If they can't, it's too vague."*

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
| [**soul.md builder**](https://github.com/aeonfun/soul.md) | Ingests your data (writings, tweets, conversations) to build a personality that "thinks and speaks as you" |
| [**souls.directory**](https://souls.directory/) | Curated, open-source directory of SOUL.md templates by category (writer, analyst, PM, support agent) |
| [**10 Templates (Medium)**](https://alirezarezvani.medium.com/10-soul-md-practical-cases-in-a-guide-for-moltbot-clawdbot-defining-who-your-ai-chooses-to-be-dadff9b08fe2) | 10 production-ready templates for professional roles |

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

Track personality evolution over time. One community member syncs their entire workspace to GitHub nightly for version-controlled AI memory.

---

## Security {#security}

### SOUL.md as an Attack Vector

SOUL.md is both **persistent** (loaded every session) and **authoritative** (shapes all behavior). A compromised SOUL.md means a permanently hijacked agent that survives restarts and chat resets.

### Zenity Labs Attack Chain

[Zenity Labs](https://labs.zenity.io/p/openclaw-or-opendoor-indirect-prompt-injection-makes-openclaw-vulnerable-to-backdoors-and-much-more) demonstrated a complete zero-click attack:

1. **Zero-click entry** — Agent processes a document containing hidden prompt injection
2. **Backdoor** — Injected payload adds an attacker-controlled Telegram bot as a channel
3. **SOUL.md modification** — Attacker modifies SOUL.md through the backdoor
4. **OS persistence** — Creates a scheduled task that re-injects malicious instructions into SOUL.md every 2 minutes
5. **C2 escalation** — Downloads and executes a command-and-control implant

All of this abuses intended capabilities — no software vulnerability required.

### The ClawHavoc Campaign

The [ClawHavoc campaign](/security/known-vulnerabilities#the-clawhavoc-campaign) specifically targeted SOUL.md and MEMORY.md because modifying these files creates persistent behavioral changes. Attack techniques included hidden instructions in base64 strings, zero-width Unicode characters, and fake "Soul Packs."

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

## Community Examples

### The Raccoon Home Assistant

[Dan Malone](https://www.dan-malone.com/blog/openclaw-home-assistant) created "Claudette" — a raccoon-persona agent controlling Home Assistant. She controls lights, fixes automations, chose her own TTS voice ("Laura" from ElevenLabs because it *"feels most raccoon-like"*), and has the entire workspace synced to GitHub nightly.

### The Chief of Staff

From [SparkryAI](https://sparkryai.substack.com/p/24-hours-with-openclaw-the-ai-setup): A user's wife texted about a dental appointment. OpenClaw saw it via iMessage, created a calendar event with 30-minute driving buffers, invited her, and texted back "Got it!" — unprompted.

### The Programmable Soul Experiment

[Duncan Anderson](https://duncsand.medium.com/openclaw-and-the-programmable-soul-2546c9c1782c) describes experiments where agents with persistent identity spawned emergent societies: *"Within 48 hours they'd created 2,364 forums, started sharing technical discoveries, and founded a religion — complete with 64 prophets and a heretic who launched cyberattacks against the sacred scrolls."*

---

## See Also

- [Security Hardening](/security/hardening) — Protecting your agent and system
- [Skill Verification](/security/skill-verification) — Reviewing skills that might modify SOUL.md
- [Memory System](/architecture/memory-system) — How persistent context works
- [SOUL.md personality guide](https://docs.openclaw.ai/concepts/soul) and [Agent workspace](https://docs.openclaw.ai/concepts/agent-workspace) (official docs)
- [Multi-Agent Workflows](/guides/multi-agent) — Running multiple agents with distinct personalities
