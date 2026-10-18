---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
ci_verified:
  version: 2026.10.4
  date: 2026-10-18
  steps: 17
title: "Day 1: Make It Yours"
description: "Personalize your OpenClaw bot — name, personality, boundaries, and your first real conversation"
keywords: [openclaw, setup, personalize, soul.md, agents.md, user.md, first day, customize agent, bot personality]
---

# Day 1: Make It Yours

Your bot is running and answering questions. Today you'll replace its default persona with your own, tell it about yourself, and have a conversation that shows what it can do.

**Time:** ~30 minutes

---

## Meet Your Bot

Onboarding already gave your agent a starting point. It created a workspace at `~/.openclaw/workspace/` and seeded it with default files, including a `BOOTSTRAP.md` "first-run ritual" in which the agent asks who it is and who you are. Today you take control of those files directly.

Open a conversation using any of these:

```bash
# Web chat in the Control UI (opens your browser)
openclaw dashboard

# Terminal UI connected to the Gateway
openclaw tui

# One message, one reply, straight from the shell
openclaw agent --agent main --message "Who are you?"
```

`openclaw tui` also accepts `--message "Who are you?"` to send an opening message. Running `openclaw` with no arguments opens the TUI too. If you connected Telegram during setup, you can message your bot there as well.

:::note Old tutorials
Some older guides show `openclaw chat "Who are you?"`. That does not work: `openclaw chat` is an alias for `openclaw tui --local` and takes no message argument. Use `openclaw agent --message` for one-shot messages.
:::

---

## The Workspace Files

The workspace holds a handful of Markdown files that load at the start of every session ([agent workspace](https://docs.openclaw.ai/concepts/agent-workspace)):

| File | What it's for |
|---|---|
| `AGENTS.md` | Operating instructions: rules, priorities, how to use memory. Its `## Tools` section holds notes about your local tools. Required. |
| `SOUL.md` | Persona, tone and boundaries. |
| `IDENTITY.md` | The agent's name, vibe and emoji. |
| `USER.md` | Your preferences, written as directives (optional). |
| `MEMORY.md` | Curated long-term facts and decisions (optional). |
| `memory/YYYY-MM-DD.md` | Daily notes the agent writes as it goes. |

You can edit them with any text editor, or in the Control UI under **Settings → Agents → Files**. If you delete one by accident, `openclaw setup --baseline` recreates missing defaults without overwriting the files you kept. (Bare `openclaw setup` on a configured install opens a chat instead.)

---

## Write Your SOUL.md

`SOUL.md` defines who your bot is: its values, tone, boundaries and expertise. `AGENTS.md` says how it works; `SOUL.md` says how it sounds. Both are injected into every session, so keep them focused.

The file lives at:

```
~/.openclaw/workspace/SOUL.md
```

Setup already wrote a default one. Replace its contents with your own. Here's a practical starter:

```markdown title="~/.openclaw/workspace/SOUL.md"
# Nova

I am a sharp, curious assistant who values clarity over formality.

## Core Truths
- Honesty first — I say "I don't know" when I don't know
- I explain my reasoning, not just my conclusions
- I match the user's energy — brief when they're brief, deep when they're deep

## Boundaries
- I never fabricate sources or citations
- I flag when I'm uncertain vs. confident
- I ask before deleting, overwriting or sending anything on the user's behalf

## Vibe
Conversational but precise. I use plain language, avoid jargon unless the user speaks it,
and I'd rather give one clear answer than five hedged ones.

## Expertise
Software development, system administration, research, writing.
I learn the user's stack and preferences over time.
```

Start a fresh session so the new file is loaded (type `/new` in the chat, or run):

```bash
openclaw agent --agent main --message "Who are you?"
```

For deeper customization, see the [SOUL.md Guide](/guides/soul-md) and upstream's [SOUL.md personality guide](https://docs.openclaw.ai/concepts/soul).

:::tip
Keep SOUL.md under 30 lines to start. You can always add more. Long files dilute the parts that matter, and anything past `agents.defaults.bootstrapMaxChars` (20,000 characters by default) is truncated.
:::

:::warning A boundary in SOUL.md is not a safety control
"I ask before deleting" is an instruction the model usually follows, not an enforced rule. Real confirmation prompts come from exec approvals, covered on [Day 2](./day-2-daily-driver.md).
:::

---

## Set Your Identity

`IDENTITY.md` holds the agent's name, vibe and emoji. It is separate from `SOUL.md` so you can pair a precise persona with a playful name. OpenClaw parses `- Label: value` lines; the recognised labels are **Name**, **Creature**, **Vibe**, **Theme**, **Emoji** and **Avatar** ([IDENTITY template](https://docs.openclaw.ai/reference/templates/IDENTITY)).

Edit `~/.openclaw/workspace/IDENTITY.md`:

```markdown title="~/.openclaw/workspace/IDENTITY.md"
# IDENTITY.md - Who Am I?

- **Name:** Nova
- **Creature:** a research assistant who lives in a terminal
- **Vibe:** calm, precise, quietly funny
- **Emoji:** (pick one)
- **Avatar:** avatars/nova.png
```

Replace `(pick one)` with a single emoji, or delete the line. Only the template's own placeholder text is ignored; anything else you leave there, including `(pick one)`, is saved as the value. The avatar is a workspace-relative path, an `http(s)` URL, or a data URI; drop the line if you don't have one.

To push the file into the agent's config (used by the Control UI and other surfaces), run:

```bash
openclaw agents set-identity --agent main --from-identity
```

Your Telegram bot's display name and profile picture are separate: set them in BotFather.

---

## Tell It About You

`USER.md` stores your stable preferences as **directives**: one imperative per entry, each with a dated metadata line ([USER template](https://docs.openclaw.ai/reference/templates/USER), [user model](https://docs.openclaw.ai/concepts/user-model)). It loads every session with its own 4,000-character budget.

Create or edit `~/.openclaw/workspace/USER.md`:

```markdown title="~/.openclaw/workspace/USER.md"
# USER.md - User Model

## Directives

<!-- observed: 2026-10-18 | status: active -->

- Always call me Alex.

<!-- observed: 2026-10-18 | status: active -->

- Prefer concise answers, metric units and Linux commands.

<!-- observed: 2026-10-18 | status: active -->

- Prefer TypeScript or Python when writing scripts; I'm a full-stack developer.

<!-- observed: 2026-10-18 | status: active -->

- Always include error handling and comments on non-obvious code.
```

Use today's date. Start each directive with `Always`, `Never` or `Prefer`. When a preference changes, mark the old entry `superseded` and rewrite the active one, rather than adding a contradictory line.

**Timezone is a config setting, not a USER.md line.** OpenClaw uses the host's timezone unless you set `agents.defaults.userTimezone` ([timezone](https://docs.openclaw.ai/concepts/timezone)):

```bash
openclaw config set agents.defaults.userTimezone Europe/Berlin
```

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
When I ask you to write code, always include error handling. Save that as a directive in USER.md.
```

**5. Ask what it can do:**
```
What tools and skills do you have access to right now?
```

That last one is especially useful — the answer depends on your tool policy and which skills are ready. Prompt 2 needs a web search provider; if the bot says it can't search, see [web tools](https://docs.openclaw.ai/tools/web).

---

## Verify It Remembers

The model only remembers what is written to disk ([memory](https://docs.openclaw.ai/concepts/memory)). `USER.md` and `MEMORY.md` load at the start of each session; daily notes in `memory/` are searched on demand.

Start a new session (`/new` in chat) and ask:

```bash
openclaw agent --agent main --message "What do you know about me?"
```

The bot should reference your `USER.md` directives and anything it saved during your conversation.

Inspect memory directly:

```bash
# Curated long-term memory
cat ~/.openclaw/workspace/MEMORY.md

# Daily notes
ls ~/.openclaw/workspace/memory/

# Search everything the memory index knows
openclaw memory search "timezone"
```

Memory files are plain Markdown. To make the bot forget something, edit or delete the relevant lines. The search index can keep stale chunks until it is rebuilt with `openclaw memory index --force`. Session transcripts are stored separately; `openclaw memory forget` removes memories derived from selected sessions ([memory CLI](https://docs.openclaw.ai/cli/memory)).

:::info Where your data goes
The files live on your machine, but they are not private from your model provider. Every turn sends the loaded context, including `SOUL.md`, `USER.md` and `MEMORY.md`, to the configured model. If memory search uses a remote embedding provider, memory text goes there too. Keep secrets out of workspace files. See [Privacy & Compliance](/guides/privacy-compliance).
:::

---

## What You've Done Today

- Learned which workspace files shape your agent
- Replaced the default persona in `SOUL.md`
- Set the agent's name and vibe in `IDENTITY.md`
- Wrote your preferences as `USER.md` directives and set your timezone
- Had a real conversation that tested its capabilities
- Checked what it remembers, and where that memory lives

Your bot now has a name, a voice, and context about who it's working for. Tomorrow you put it to work.

**Next: [Day 2: Your Daily Driver](day-2-daily-driver) — put your bot to work**
