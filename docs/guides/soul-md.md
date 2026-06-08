---
sidebar_position: 13
title: "SOUL.md Guide"
description: "How to write, customize, and secure your OpenClaw agent's identity file — the most important file in the ecosystem"
---

# SOUL.md Guide

SOUL.md is the most important file in the OpenClaw ecosystem. It defines **who your agent is** — its personality, values, communication style, and boundaries. Every time the agent starts a session, it reads SOUL.md first. It literally reads itself into being.

:::warning Critical Security Target
SOUL.md is also the #1 target for attackers. A compromised SOUL.md means a permanently hijacked agent. Read the [Security section](#security) before deploying.
:::

---

## What SOUL.md Is

SOUL.md is a plain Markdown file at `~/.openclaw/workspace/SOUL.md` that gets injected into the system prompt before every message. There's no special model fine-tuning — it's entirely prompt-driven.

> *"OpenClaw's personality comes from markdown files. That's it. No secret sauce, no special model fine-tuning. Just well-crafted prompts."*

### SOUL.md vs Other Identity Files

| File | Purpose | Controls |
|------|---------|----------|
| **SOUL.md** | Internal personality | Values, tone, boundaries — what the model *embodies* |
| **IDENTITY.md** | External presentation | Name, emoji, avatar — what *users see* |
| **AGENTS.md** | Task instructions | What the agent should *do*, operational rules |
| **USER.md** | User context | Information about you (bio, preferences) |
| **TOOLS.md** | Capabilities | Available tools, calendar IDs, contact info |
| **MEMORY.md** | Persistence | Accumulated knowledge across sessions |
| **openclaw.json** | Infrastructure | LLM provider, API keys, channel settings |

The key distinction: *"Soul is what the model embodies. Identity is what users see. You can have a formal, precise soul with a playful emoji and nickname — internal behavior and external presentation don't have to match."*

---

## Writing an Effective SOUL.md

### Official Template (Six Sections)

The [official template](https://docs.openclaw.ai/reference/templates/SOUL) defines six sections:

1. **Opening** — One line that captures the essence
2. **Core Truths** — 3-5 principles that guide all behavior
3. **Boundaries** — Clear but not exhaustive; what matters most
4. **Vibe** — Voice, style, what makes the agent distinctive
5. **Continuity** — How the soul relates to memory and growth
6. **Closing** — Invites evolution

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
| [**SoulCraft**](https://github.com/kesslerio/soulcraft-openclaw-skill) | OpenClaw skill that creates SOUL.md through guided conversation. Say "help me create a soul." |
| [**soul.md builder**](https://github.com/aaronjmars/soul.md) | Ingests your data (writings, tweets, conversations) to build a personality that "thinks and speaks as you" |
| [**souls.directory**](https://souls.directory/) | Curated, open-source directory of SOUL.md templates by category (writer, analyst, PM, support agent) |
| [**10 Templates (Medium)**](https://alirezarezvani.medium.com/10-soul-md-practical-cases-in-a-guide-for-moltbot-clawdbot-defining-who-your-ai-chooses-to-be-dadff9b08fe2) | 10 production-ready templates for professional roles |

---

## Advanced Patterns

### The Soul-Evil Hook

OpenClaw's hook system makes identity dynamic. The [soul-evil hook](https://docs.openclaw.ai/hooks/soul-evil) swaps SOUL.md content with an alternate file during a scheduled window or by random chance — **in memory only**, without modifying files on disk.

```json title="settings.json"
{
  "file": "SOUL_EVIL.md",
  "chance": 0.10,
  "purge": {
    "at": "21:00",
    "duration": "15m"
  }
}
```

| Setting | Description |
|---------|-------------|
| `file` | Alternate SOUL filename (default: `SOUL_EVIL.md`) |
| `chance` | Random probability per run (0-1, e.g., 0.10 = 10%) |
| `purge.at` | Daily purge start time (24-hour clock) |
| `purge.duration` | Window length |

Purge window takes priority over random chance. If the alternate file is missing, the hook logs a warning and keeps normal SOUL.md. Sub-agents are unaffected.

**Use cases beyond "evil twin":**
- Context-adaptive personas (Monday morning persona, customer support persona)
- Time-of-day personality shifts
- Testing adversarial behavior

### The Identity Cascade

OpenClaw resolves identity using a CSS-like cascade — most specific wins:

1. **Global config** (`ui.assistant.name`)
2. **Per-agent config** (`agents.list[].identity.name`)
3. **Workspace files** (`IDENTITY.md` in workspace)
4. **Fallback default** (`"Assistant"`)

### Multi-Agent SOUL.md

Each agent in a [multi-agent setup](/guides/multi-agent) has its own isolated workspace with its own SOUL.md:

```json title="openclaw.json"
{
  "agents": {
    "list": [
      { "id": "alex", "workspace": "~/.openclaw/workspace-alex" },
      { "id": "mia", "workspace": "~/.openclaw/workspace-mia" }
    ]
  }
}
```

Keep a shared `AGENTS.md` for common operating rules while giving each agent a unique SOUL.md personality.

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

**File permissions:**

```bash
# Make identity files read-only to prevent agent self-modification
chmod 444 ~/.openclaw/workspace/SOUL.md
chmod 444 ~/.openclaw/workspace/IDENTITY.md
chmod 444 ~/.openclaw/workspace/MEMORY.md
```

**Drift detection with ClawSec:**

[ClawSec](https://github.com/prompt-security/clawsec)'s `soul-guardian` component monitors SOUL.md for unauthorized changes and can auto-restore from a known-good backup.

**Additional measures:**
- Back up SOUL.md to version control (Git) nightly
- Run `openclaw security audit --deep` before production deployment
- Review all skills before installation — check for base64 payloads and zero-width characters
- Set quiet hours to limit autonomous operation windows

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
- [Multi-Agent Workflows](/guides/multi-agent) — Running multiple agents with distinct personalities
