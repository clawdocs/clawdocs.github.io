---
sidebar_position: 4
title: Memory System
description: How OpenClaw stores persistent context as local Markdown files
---

# Memory System

OpenClaw's memory is one of its most distinctive features — persistent context stored as **local Markdown files** that survive restarts, updates, and even migrations.

## How It Works

Every conversation contributes to a growing knowledge base stored at `~/.openclaw/memory/`:

```
~/.openclaw/memory/
├── preferences.md     # User preferences and habits
├── contacts.md        # People the agent has learned about
├── projects.md        # Active projects and their context
├── learnings.md       # Discoveries and solutions
├── tools.md           # Tools and workflows used
└── custom/            # User-defined memory categories
    ├── work.md
    └── recipes.md
```

## Memory Lifecycle

1. **Observation** — During conversation, the Brain identifies facts worth remembering
2. **Extraction** — Key information is pulled into structured notes
3. **Storage** — Written to the appropriate Markdown file
4. **Retrieval** — On each new conversation, relevant memory is loaded as context
5. **Decay** — Old, unused memories are gradually deprioritized (not deleted)

## Example Memory Entry

```markdown title="~/.openclaw/memory/preferences.md"
## Communication Style
- Prefers concise responses, no filler
- Uses dark mode everywhere
- Timezone: America/Los_Angeles

## Development
- Primary language: TypeScript
- Editor: VS Code with Vim bindings
- Package manager: pnpm (never npm)
- Always use strict TypeScript config

## Updated: 2026-02-08
```

## Manual Memory Management

Since memory is just Markdown, you can edit it directly:

```bash
# View what the agent remembers
cat ~/.openclaw/memory/preferences.md

# Edit memories
vim ~/.openclaw/memory/preferences.md

# Add a new memory category
echo "# Cooking Notes" > ~/.openclaw/memory/custom/cooking.md

# Reset all memory (start fresh)
rm -rf ~/.openclaw/memory/*
```

You can also instruct the agent:

```
"Remember that I prefer dark mode for all tools"
"Forget everything about my previous project"
"What do you remember about me?"
```

## Memory Configuration

```yaml title="~/.openclaw/config.yml"
memory:
  enabled: true
  path: "~/.openclaw/memory"
  max_context_tokens: 2000   # Max tokens loaded per conversation
  auto_save: true             # Save after every conversation
  categories:
    - preferences
    - contacts
    - projects
    - learnings
```

## Privacy Notes

- Memory files are **never sent to any external service** — they're loaded locally and included in the LLM prompt
- If using a cloud LLM provider, memory content *is* sent as part of the prompt (this is unavoidable)
- For maximum privacy, use [local models](/guides/local-models) so nothing leaves your machine

:::tip
Periodically review `~/.openclaw/memory/` to see what the agent has learned. Remove anything you don't want included in future prompts.
:::

## See Also

- [Configuration Reference](/reference/configuration) — Memory settings
- [Security Hardening](/security/hardening) — Protecting memory files
- [Local Models](/guides/local-models) — Keep everything on-device
