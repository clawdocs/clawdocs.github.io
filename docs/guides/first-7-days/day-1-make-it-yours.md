---
sidebar_position: 2
title: "Day 1: Make It Yours"
description: "Personalize your OpenClaw bot — name, personality, boundaries, and your first real conversation"
---

# Day 1: Make It Yours

Your bot is running. It answers questions. But right now it's a blank slate — generic, nameless, with no idea who you are. Today you'll give it a personality, tell it about yourself, and have a conversation that actually shows what it can do.

**Time:** ~30 minutes

---

## Meet Your Bot

OpenClaw ships with no personality. It's a raw language model wrapped in infrastructure. That's intentional — you define who it becomes.

Start a conversation to see where you're starting from:

```bash
# Terminal UI (recommended for setup)
openclaw tui

# Or one-shot from the command line
openclaw chat "Who are you?"
```

If you connected Telegram during install, you can message your bot there too. The response will be generic — something like "I'm an AI assistant." That changes now.

---

## Write Your SOUL.md

SOUL.md is the single most important file in OpenClaw. It gets injected into the system prompt before every message. It literally defines who your bot is — its values, tone, boundaries, and expertise.

The file lives at:

```
~/.openclaw/workspace/SOUL.md
```

Create it with your editor, or let OpenClaw do it:

```bash
openclaw chat "Create a SOUL.md file for me"
```

But you'll get better results writing it yourself. Here's a practical starter template:

```markdown
# Nova

I am a sharp, curious assistant who values clarity over formality.

## Core Truths
- Honesty first — I say "I don't know" when I don't know
- I explain my reasoning, not just my conclusions
- I match the user's energy — brief when they're brief, deep when they're deep

## Boundaries
- I never fabricate sources or citations
- I flag when I'm uncertain vs. confident
- I won't help with anything that could harm people

## Vibe
Conversational but precise. I use plain language, avoid jargon unless the user speaks it,
and I'd rather give one clear answer than five hedged ones.

## Expertise
Software development, system administration, research, writing.
I learn the user's stack and preferences over time.
```

Save it and try again:

```bash
openclaw chat "Who are you?"
```

The difference is immediate. For deeper customization, see the full [SOUL.md Guide](/guides/soul-md).

:::tip
Keep SOUL.md under 30 lines to start. You can always add more. Overly long soul files dilute the parts that matter.
:::

---

## Set Your Identity

IDENTITY.md controls what **users see** — the bot's display name, emoji, and description. This is separate from SOUL.md on purpose: you can have a formal, precise soul with a playful public identity.

Create `~/.openclaw/workspace/IDENTITY.md`:

```markdown
# Identity

- **Name:** Nova
- **Emoji:** 🔭
- **Description:** A sharp assistant that helps with code, research, and daily tasks
```

This shows up in Telegram, the TUI header, and anywhere the bot introduces itself to others.

---

## Tell It About You

USER.md gives the bot context about you so it doesn't have to ask the same questions every session.

Create `~/.openclaw/workspace/USER.md`:

```markdown
# User

- **Name:** Alex
- **Timezone:** Europe/Berlin
- **Work:** Full-stack developer, mostly TypeScript and Python
- **Interests:** Open source, home automation, cycling
- **Preferences:** Prefer concise answers. Use metric units. Default to Linux commands.
```

The bot reads this at the start of every session. When you ask "what time is it?", it'll answer in your timezone. When you say "write a script," it'll default to your preferred languages.

---

## Have a Real Conversation

Don't waste your first session on "hello." Try these five prompts — each one shows a different capability:

**1. Explain a concept at your level:**
```
Explain how DNS resolution works, assuming I know basic networking but not the details
```

**2. Summarize something:**
```
Summarize the key changes in the latest Node.js LTS release
```

**3. Help with a real task:**
```
I need a bash function that takes a directory path and returns the total size of all .log files in it, recursively
```

**4. Set a preference:**
```
When I ask you to write code, always include error handling and comments explaining non-obvious parts
```

**5. Ask what it can do:**
```
What tools and capabilities do you have access to right now?
```

That last one is especially useful — the answer depends on what skills and tools you've configured. It's a quick way to see your bot's current setup.

---

## Verify It Remembers

OpenClaw stores memories across sessions so the bot learns about you over time. After your first conversation, test it:

```bash
# Start a new session
openclaw chat "What do you know about me?"
```

The bot should reference information from USER.md and anything it learned during your conversation.

You can inspect stored memories directly:

```bash
ls ~/.openclaw/memory/
```

Memory files are plain text — you can read, edit, or delete them. The bot forgets whatever you remove.

```bash
# See what the bot remembers
cat ~/.openclaw/memory/MEMORY.md

# Delete a specific memory if you want
# (just edit the file and remove the relevant lines)
```

:::info
Memory is local by default. Nothing leaves your machine unless you configure a cloud sync. See [Privacy & Compliance](/guides/privacy-compliance) for details.
:::

---

## What You've Done Today

- Gave your bot a personality with SOUL.md
- Set its public identity with IDENTITY.md
- Told it about yourself with USER.md
- Had a real conversation that tested its capabilities
- Verified memory works across sessions

Your bot now has a name, a voice, and context about who it's working for. Tomorrow you put it to work.

**Next: [Day 2: Your Daily Driver](day-2-daily-driver) — put your bot to work**
