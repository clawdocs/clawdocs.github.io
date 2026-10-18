---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Memory System
description: How OpenClaw stores and retrieves persistent context — workspace memory files, hybrid search, dreaming, memory plugins, and what leaves your machine
keywords: [openclaw, memory, persistent memory, markdown memory, hybrid search, dreaming, memory-core]
---

# Memory System

OpenClaw remembers things by writing plain Markdown files in the agent's **workspace** (default `~/.openclaw/workspace`). There is no hidden state: if it is not in a file, the agent does not remember it. A search index over those files lives in the agent's SQLite database, and a background "dreaming" sweep consolidates daily notes into long-term memory.

Official references: [Memory overview](https://docs.openclaw.ai/concepts/memory), [Memory search](https://docs.openclaw.ai/concepts/memory-search), [Dreaming](https://docs.openclaw.ai/concepts/dreaming), [Memory configuration reference](https://docs.openclaw.ai/reference/memory-config).

---

## Where memory lives

```
~/.openclaw/workspace/
├── MEMORY.md              # Curated long-term memory (durable facts, decisions)
├── USER.md                # Optional user model: preferences, style, written as directives
├── memory/
│   ├── 2026-10-17.md      # Daily notes (one file per day, or YYYY-MM-DD-<slug>.md)
│   └── 2026-10-18.md
├── DREAMS.md              # Optional Dream Diary and sweep summaries, for human review
├── AGENTS.md              # Operating instructions (not memory, but loaded every session)
├── SOUL.md                # Persona and tone
└── IDENTITY.md            # Name, vibe, emoji
```

| File | Role | Loaded how |
|------|------|------------|
| `MEMORY.md` | Compact, curated long-term memory | Injected at session start (main private session only), subject to the bootstrap size limit |
| `USER.md` | Stable preferences and profile facts | Injected at session start, separate 4,000-character budget |
| `memory/YYYY-MM-DD.md` | Detailed working notes | Not injected every turn. Indexed for `memory_search` / `memory_get`; today's and yesterday's notes load on `/new` or `/reset` |
| `DREAMS.md` | Dreaming output | For you to read; not a memory source |

There are no topical files such as `preferences.md` or `contacts.md`, and no `~/.openclaw/memory/` folder. `HEARTBEAT.md` and `TOOLS.md` are retired; `openclaw doctor --fix` migrates them.

To have the agent remember something, ask it ("Remember that I prefer pnpm"). It writes the note to the right file.

---

## Retrieval: hybrid search

The builtin engine (the default backend) runs two searches in parallel and merges them:

| Path | Weight | Method |
|------|--------|--------|
| **Vector search** | 0.7 | Semantic similarity over embeddings |
| **Keyword search** | 0.3 | SQLite FTS5 (BM25), plus separate filename search |

The merged score is then multiplied by recency decay and an importance factor, and results are reordered for diversity (MMR). Dated daily notes decay with a 30-day half-life; `MEMORY.md` and `USER.md` do not decay. The index is per agent, in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` (PostgreSQL is optional).

:::warning Embeddings are not local by default
OpenClaw uses **OpenAI embeddings by default**, so memory chunks are sent to the embedding API when they are indexed and searched. For local embeddings, install the llama.cpp provider and select `provider: "local"`, or point it at Ollama or LM Studio.
:::

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5 title="~/.openclaw/openclaw.json"
{
  memory: {
    search: {
      provider: "local", // or "openai", "gemini", "voyage", "mistral", "ollama", "lmstudio", ...
    },
  },
}
```

How much memory reaches the prompt is controlled by the bootstrap limits (`agents.defaults.bootstrapMaxChars`, default 20000 per file) and by what the agent retrieves. There is no `memory.max_context_tokens` key. If `MEMORY.md` outgrows the limit, the injected copy is truncated; move detail into `memory/*.md`. `/context list` and `openclaw doctor` show raw and injected sizes.

---

## Dreaming {#dreaming-mode}

Dreaming is the background consolidation sweep in the bundled `memory-core` plugin. It is **enabled by default** and runs as one managed automation job, by default at `0 3 * * *` (03:00 daily). It is not tied to heartbeats or quiet hours.

Each sweep runs three phases in order:

| Phase | Purpose | Writes `MEMORY.md`? |
|-------|---------|---------------------|
| **Light** | Sort and stage recent short-term material, dedupe signals | No |
| **REM** | Build theme and reflection summaries from recent traces | No |
| **Deep** | Score candidates and promote the strong ones | Yes |

### Deep ranking signals

| Signal | Weight |
|--------|--------|
| Relevance | 0.30 |
| Frequency | 0.24 |
| Query diversity | 0.15 |
| Recency | 0.15 |
| Consolidation | 0.10 |
| Conceptual richness | 0.06 |

Candidates must also pass `minScore`, `minRecallCount` and `minUniqueQueries` gates. A summary goes to `DREAMS.md` in the workspace.

### Configuration

Dreaming settings live under the plugin's `config` block:

```json5 title="~/.openclaw/openclaw.json"
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            timezone: "Europe/Berlin",
            model: "anthropic/claude-haiku-5-5",
          },
        },
      },
    },
  },
}
```

Set `enabled: false` to turn it off. In chat, `/dreaming status` and `/dreaming on` do the same job.

### Inspection

```bash
# Index and embedding-provider status
openclaw memory status
openclaw memory status --deep

# Search memory
openclaw memory search "deployment"

# Preview REM reflections and deep promotions without writing
openclaw memory rem-harness
```

---

## Memory backends and plugins

| Option | What it is |
|--------|------------|
| **Builtin engine** | Default. Per-agent SQLite (or PostgreSQL) index with keyword, vector and hybrid search ([docs](https://docs.openclaw.ai/concepts/memory-builtin)) |
| **memory-core** | Bundled plugin that owns memory tools and dreaming |
| **Active memory** | Optional deeper recall lane for questions about the past ([docs](https://docs.openclaw.ai/concepts/active-memory)) |
| **Honcho** | External plugin that persists conversations to the Honcho service and builds user models ([docs](https://docs.openclaw.ai/concepts/memory-honcho)) |
| **memory-lancedb**, **memory-wiki** | Other official memory plugins (LanceDB vector store; Memory Wiki) |

`plugins.slots.memory` picks which plugin fills the memory slot. QMD was retired in v2026.8.1, and doctor migrates its settings to the builtin engine. Third-party memory systems are covered, unverified, in [Memory Systems Compared](/guides/memory-systems).

---

## Managing memory by hand

Memory is plain Markdown, so you can read and edit it:

```bash
cat ~/.openclaw/workspace/MEMORY.md
ls ~/.openclaw/workspace/memory/
"$EDITOR" ~/.openclaw/workspace/USER.md

# Rebuild the search index after large manual edits
openclaw memory index --force

# Preview deleting memories derived from one session, then do it
openclaw memory forget --session <id-or-key> --dry-run
openclaw memory forget --session <id-or-key>
```

`openclaw memory reset` clears the derived index and embedding cache without deleting your files or sessions. To start memory from scratch, archive `MEMORY.md`, `USER.md` and `memory/` rather than running `rm -rf` on the workspace, which also holds `SOUL.md`, `AGENTS.md` and your skills.

---

## Privacy

- Memory files stay on your disk, but anything injected or retrieved into a prompt is sent to your model provider.
- With the default OpenAI embeddings, indexed chunks are also sent to the embedding API.
- To keep everything on the machine, use a [local model](/guides/local-models) and a local embedding provider.
- `MEMORY.md` is loaded only in the main private session, not in group or shared contexts.

:::tip
Review `MEMORY.md`, `USER.md` and `memory/` now and then, and delete anything you don't want in future prompts.
:::

---

## See also

- [Architecture Overview](/architecture/overview): where memory fits
- [Memory Systems Compared](/guides/memory-systems): third-party options
- [Performance Tuning](/guides/performance-tuning): context size
- [Security Hardening](/security/hardening): protecting the workspace
- [Local Models](/guides/local-models): keeping data on-device
- [Configuration Reference](/reference/configuration): how the config file works
