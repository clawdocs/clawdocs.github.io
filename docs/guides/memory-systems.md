---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Memory Systems Compared
description: How OpenClaw's built-in memory works in 2026.10, and when a bundled plugin or a third-party memory system is worth adding
keywords: [openclaw, memory, memory system, persistent context, knowledge base, dreaming]
---

# Memory Systems Compared

OpenClaw ships with a working memory system: Markdown files in the agent workspace, a SQLite search index, and a nightly consolidation sweep called Dreaming. Most people should start there. This page explains what the built-in system does as of v2026.10.4, which bundled plugins extend it, and when a third-party system is worth the extra moving parts.

The reference is the official [Memory overview](https://docs.openclaw.ai/concepts/memory). This page summarises it and adds a comparison of community projects.

---

## Quick Decision

| Your situation | Start with |
|----------------|------------|
| **Just getting started** | Built-in memory (default, nothing to configure) |
| **Privacy first, nothing leaves the machine** | Built-in memory with a local embedding provider (`local`, `ollama`) or keyword-only search |
| **You want a curated knowledge base, not raw notes** | Bundled [Memory Wiki](https://docs.openclaw.ai/plugins/memory-wiki) plugin |
| **Long sessions where compaction loses detail** | Lossless Claw (third-party plugin) |
| **Team or hosted memory service** | Mem0, Supermemory, or Honcho |
| **Coding agents, persistent dev context** | claude-mem |
| **Verbatim recall of everything said** | MemPalace |

---

## Built-In Memory

OpenClaw remembers by writing plain Markdown files in the agent's **workspace** (default `~/.openclaw/workspace`). There is no hidden state: if it is not on disk, the model does not remember it. In a [multi-agent setup](/guides/multi-agent) each agent has its own workspace and its own memory.

:::note QMD is gone
v2026.8.1 ("OpenClaw 2.0") retired the QMD memory backend. Built-in memory now owns search and recall. If you used QMD, run `openclaw doctor --fix`: it removes the retired QMD settings, carries forward supported extra paths and session indexing, and rebuilds the index from your Markdown files. QMD-only reranking, query expansion, and cross-agent transcript search do not carry over. See the [v2026.8.1 memory notes](https://docs.openclaw.ai/releases/2026.8.1/memory).
:::

### How It Works

```
~/.openclaw/workspace/
├── USER.md                 # Optional. Stable preferences and profile facts, written as directives
├── MEMORY.md               # Long-term memory: durable facts and decisions
├── DREAMS.md               # Optional. Dream Diary and sweep summaries for human review
└── memory/
    ├── 2026-10-17.md       # Daily notes (running context, observations)
    ├── 2026-10-18.md
    └── imports/            # Memory imported from Codex, Claude Code or Hermes
```

| File | Loaded how |
|------|-----------|
| `USER.md` | Injected at session start, with its own small budget (fixed 4,000-character cap) |
| `MEMORY.md` | Injected at session start, within the bootstrap file budget. If it grows past the budget, the file stays intact on disk but the injected copy is truncated |
| `memory/YYYY-MM-DD.md` | Not injected on every turn. Indexed for `memory_search` / `memory_get`. Today's and yesterday's notes load on a bare `/new` or `/reset` |
| `DREAMS.md` | For you to read; not part of the prompt |

To make the agent remember something, ask it: "Remember that I prefer TypeScript." It writes the note to the right file. Before [compaction](https://docs.openclaw.ai/concepts/compaction) summarises a long conversation, OpenClaw also runs a silent "memory flush" turn so the agent can save important context first (on by default; `agents.defaults.compaction.memoryFlush.enabled: false` turns it off).

Use `/context list` or `openclaw doctor` to see how much of `MEMORY.md` is actually reaching the model.

### Configuration

The root `memory` key is strict and has only two children: `citations` and `search`. Everything else about memory either has sensible defaults or lives in the `memory-core` plugin config. This example keeps embeddings on the machine with the managed local GGUF model:

```json5 title="~/.openclaw/openclaw.json"
{
  memory: {
    citations: "auto",     // "auto" | "on" | "off"
    search: {
      provider: "local",   // managed llama.cpp GGUF model, ~0.3 GB, no API key
    },
  },
}
```

Older keys such as `memorySearch` were migrated to `memory.search` by Doctor. All search options are in the [Memory configuration reference](https://docs.openclaw.ai/reference/memory-config).

### Retrieval

The agent gets two memory tools from the active memory plugin (default `memory-core`): **`memory_search`** (semantic plus keyword search across memory files) and **`memory_get`** (read a file or line range). A third, `intent`, manages event-conditioned standing intents.

When an embedding provider is available, `memory_search` runs two paths in parallel and merges them:

| Step | What happens |
|------|-------------|
| Vector search | Semantic similarity over embeddings (weight 0.7) |
| Keyword search | Exact terms, IDs, error strings; BM25 on SQLite (weight 0.3) |
| Weighted merge | The two scores are combined (not Reciprocal Rank Fusion) |
| Recency and importance | Dated daily notes decay with a 30-day half-life; `MEMORY.md` and `USER.md` are evergreen |
| MMR | Reorders results to drop near-duplicate snippets |

:::warning Embeddings are remote by default
OpenClaw uses **OpenAI embeddings by default**, so note content is sent to an embedding API unless you choose otherwise. For local-only operation set `memory.search.provider` to `"local"`, `"ollama"` or `"lmstudio"`, or to `"none"` for keyword-only (FTS) search with no embeddings at all. Other supported providers: Gemini, Voyage, Mistral, Bedrock, DeepInfra, GitHub Copilot, and any OpenAI-compatible endpoint (`openai-compatible`). See [Memory search](https://docs.openclaw.ai/concepts/memory-search).
:::

If you name a provider explicitly and it fails (bad key, network down), `memory_search` reports memory as unavailable rather than silently falling back to keywords. Leaving the provider unset, or using `"local"`, falls back to keyword ranking instead.

### Dreaming (memory-core plugin)

Dreaming is the background consolidation sweep in the bundled `memory-core` plugin. It promotes strong short-term signals from daily notes and interactive sessions into `MEMORY.md`. **It has been enabled by default since v2026.8.1**; you do not need to configure anything.

Each sweep runs three phases, in this order:

| Phase | What happens | Writes `MEMORY.md`? |
|-------|-------------|---------------------|
| **Light** | Sorts and stages recent short-term material, dedupes signals | No |
| **REM** | Builds theme and reflection summaries from recent traces | No |
| **Deep** | Scores candidates and promotes the ones that pass every threshold | Yes |

Deep ranking uses six weighted signals: relevance 0.30, frequency 0.24, query diversity 0.15, recency 0.15, consolidation 0.10, conceptual richness 0.06. Candidates must also pass the `minScore`, `minRecallCount` and `minUniqueQueries` gates. Untrusted and system-derived candidates (tool output, web content, non-owner turns) never reach the promotion path. Phase summaries go to `DREAMS.md` for review.

The sweep runs once a day at 03:00 by default. To change the schedule:

```json5 title="~/.openclaw/openclaw.json"
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            timezone: "America/Los_Angeles",
            frequency: "0 3 * * *",   // cron expression; this is the default
          },
        },
      },
    },
  },
}
```

To opt out, set `dreaming: { enabled: false }`, or send `/dreaming off` in chat (owner only; `/dreaming status` shows the current state). There is one sweep and one `frequency` for the whole Gateway, not one per agent. In a fleet with `agents.ownership: "explicit"`, choose which agent owns the sweep with `openclaw config set agents.defaults.systemAgent.agentId <agent-id>`. Dreaming also depends on the scheduler: with `cron.enabled: false` (or `OPENCLAW_SKIP_CRON=1`) it defers creating or updating its sweep job. Details in [Dreaming](https://docs.openclaw.ai/concepts/dreaming).

### Bundled memory plugins

These ship with OpenClaw and are maintained upstream:

| Plugin | What it adds |
|--------|-------------|
| `memory-core` (default) | Built-in search, recall, Dreaming. See [Builtin memory engine](https://docs.openclaw.ai/concepts/memory-builtin) |
| `memory-wiki` | Compiles durable memory into a wiki vault with claims, evidence, freshness tracking and `wiki_*` tools. Sits beside `memory-core`, does not replace it. [Memory Wiki](https://docs.openclaw.ai/plugins/memory-wiki) |
| `memory-lancedb` | LanceDB-backed memory with auto-recall and auto-capture; supports local Ollama embeddings. [Memory LanceDB](https://docs.openclaw.ai/plugins/memory-lancedb) |
| `active-memory` | A memory sub-agent for interactive chats. [Active memory](https://docs.openclaw.ai/concepts/active-memory) |
| Honcho | Cross-session memory with user modelling (plugin install). [Honcho memory](https://docs.openclaw.ai/concepts/memory-honcho) |

### Inspecting, importing and forgetting

```bash
openclaw memory status            # index and provider status (--deep probes the embedding provider)
openclaw memory search "meeting notes"
openclaw memory index --force     # full reindex
openclaw memory forget --agent main --session <id-or-key> --dry-run   # preview what would be deleted
```

- **Import.** In the Control UI, **Settings → Import Memory** copies Markdown memory from Codex (`~/.codex/memories`), Claude Code (`~/.claude/projects/*/memory`) or Hermes into `memory/imports/` in the chosen agent's workspace. Imported files are searchable but are not merged into `MEMORY.md`.
- **Provenance and forgetting.** `memory forget` removes memories derived from selected sessions or participants and stops them being re-ingested. It deletes immediately unless you pass `--dry-run`, and it does not delete the original transcripts or copies outside the memory stores. An admission policy can keep chosen sources out of memory in the first place. See [Memory provenance and deletion](https://docs.openclaw.ai/concepts/memory-provenance).

### When Built-In Is Enough

- One user, one or a few agents
- You want to read and edit memory as plain files, and keep them in Git
- You are happy with a nightly consolidation sweep
- You can choose a local embedding provider if privacy matters

Memory records context; it does not enforce policy. Use approvals and sandboxing for hard limits on what the agent can do ([Security Hardening](/security/hardening)).

---

## Community Memory Systems

None of these is maintained by the OpenClaw project. Star counts and last-push dates are from the GitHub API **as of 2026-10-18**. Performance figures quoted in project READMEs are vendor claims; test with your own data before relying on them.

### Comparison Matrix

| System | Stars | Last push | Type | How it connects |
|--------|------:|-----------|------|-----------------|
| [**Mem0**](#mem0) | 67,372 | 2026-10 | Managed / self-hosted memory layer | SDK / API |
| [**memU**](#memu) | 14,553 | 2026-10 | Proactive memory framework | Community OpenClaw plugin |
| [**OpenViking**](#openviking) | 40,218 | 2026-10 | Context database (L0/L1/L2 tiers) | Integration guide |
| [**MemPalace**](#mempalace) | 59,622 | 2026-10 | Verbatim conversation storage | SDK |
| [**Supermemory**](#supermemory) | 31,272 | 2026-10 | Fact-extraction memory engine | MCP / API |
| [**Lossless Claw**](#lossless-claw) | 4,908 | 2026-10 | DAG summarization, replaces compaction | OpenClaw plugin |
| [**LanceDB-Pro**](#lancedb-pro) | 4,452 | 2026-10 | LanceDB memory plugin | OpenClaw plugin |
| [**Hindsight**](#hindsight) | 50,997 | 2026-10 | Agent memory framework | SDK |
| [**claude-mem**](#claude-mem) | 101,503 | 2026-10 | Context compression for coding agents | MCP / OpenClaw installer |
| [**MemoV**](#memov) | 194 | 2026-02 (dormant) | Git-like traceable memory | MCP |
| [**PowerContext**](#powermem) | 1,337 | 2026-10 | Context service (formerly PowerMem) | Server / API |
| [**Cognee**](#cognee) | 32,464 | 2026-10 | Knowledge graph memory | MCP / SDK |
| [**Letta**](#letta) | 25,175 | 2026-09 | Stateful agent framework | SDK |
| [**GBrain**](#gbrain) | 30,970 | 2026-10 | Agent "brain": knowledge pages, ingestion, scheduled consolidation | ClawHub bundle plugin / MCP |
| [**agentmemory**](#agentmemory) | 29,640 | 2026-10 | Persistent memory server for coding agents | Native OpenClaw plugin (connector) / MCP |

---

### Mem0

**General-purpose memory layer** storing memories across vector, key-value and graph backends.

- **Repo:** [mem0ai/mem0](https://github.com/mem0ai/mem0)
- **Integration:** Python/TypeScript SDK and API; hosted platform or self-hosted
- **Fit:** teams that want a managed service with analytics and support

```python
from mem0 import Memory
m = Memory()
m.add("User prefers TypeScript over JavaScript", user_id="alex")
results = m.search("What languages does the user prefer?", user_id="alex")
```

:::info
Mem0 is not OpenClaw-specific. You connect it yourself, through a custom plugin, skill or MCP server.
:::

---

### memU

**Proactive memory for always-on agents**, organised in three layers (Resource → Item → Category).

- **Repo:** [NevaMind-AI/memU](https://github.com/NevaMind-AI/memU)
- **OpenClaw plugin:** [duxiaoxiong/memu-engine-for-OpenClaw](https://github.com/duxiaoxiong/memu-engine-for-OpenClaw) is a **community** plugin by a third party, not maintained by NevaMind (55 stars, last push 2026-03-24). Review it before installing.

---

### OpenViking

**Context database from Volcengine**, a general agent context store with tiered loading (L0 abstract, L1 overview, L2 full detail). It is not OpenClaw-specific, but publishes an [OpenClaw integration guide](https://docs.openviking.ai/en/agent-integrations/03-openclaw).

- **Repo:** [volcengine/OpenViking](https://github.com/volcengine/OpenViking)

---

### MemPalace

**Verbatim conversation storage.** It keeps whole conversations instead of compressed facts, so recall is high but storage grows quickly.

- **Repo:** [MemPalace/mempalace](https://github.com/MemPalace/mempalace)

:::caution
MemPalace's published benchmark numbers were disputed after launch. Evaluate it on your own workload.
:::

---

### Supermemory

**Memory engine that extracts and stores facts** rather than document chunks, with handling for updates, contradictions and expiry.

- **Repo:** [supermemoryai/supermemory](https://github.com/supermemoryai/supermemory)
- **Integration:** MCP server or API (works with Claude Desktop, Cursor, VS Code and others)

---

### Lossless Claw

**DAG-based context management plugin for OpenClaw.** It replaces the built-in sliding-window compaction: every message is kept in `lcm.db`, older chunks are summarised into DAG nodes, and the agent gets `lcm_grep`, `lcm_describe` and `lcm_expand` tools to recover detail.

- **Repo:** [Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw). Install with `openclaw plugins install` as described in its README.
- **Fit:** long-running agents where compaction loses information you need later

---

### LanceDB-Pro

**Third-party LanceDB memory plugin for OpenClaw** that stores preferences, decisions and project context and auto-recalls them. Compare it with the bundled `memory-lancedb` plugin before choosing.

- **Repo:** [CortexReach/memory-lancedb-pro](https://github.com/CortexReach/memory-lancedb-pro)

---

### Hindsight

**Agent memory framework** built around separate networks for world facts, agent experiences, entity summaries and evolving beliefs, with Retain / Recall / Reflect operations.

- **Repo:** [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)
- **Integration:** SDK

---

### claude-mem

**Context compression for coding agents.** It captures observations after tool calls and loads only the relevant ones in later sessions.

- **Repo:** [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)
- **Integration:** MCP server; works with Claude Code, Codex, Gemini, and OpenClaw. For OpenClaw the README offers a `curl … | bash` installer. Read the script before you run it.

---

### MemoV

**Git-like traceable memory** for coding agents: snapshots, diffs and rollback for prompts, context and code, kept outside your normal `.git`.

- **Repo:** [memovai/memov](https://github.com/memovai/memov). Dormant: no push since 2026-02-05.
- **Integration:** MCP server

---

### PowerContext (formerly PowerMem) {#powermem}

**Open-source context service from OceanBase** that keeps decisions, constraints, evidence and progress outside any single conversation, so later sessions, agents or people can pick up from the current state. The project was renamed from PowerMem; the old URL redirects.

- **Repo:** [oceanbase/powercontext](https://github.com/oceanbase/powercontext)
- **Integration:** server or embedded library; the repo includes an OpenClaw integration guide
- **Fit:** multi-agent setups that need shared, governed context

---

### Cognee

**Graph-native memory**: a knowledge graph combined with vector and relational storage, with entity, relationship and provenance tracking.

- **Repo:** [topoteretes/cognee](https://github.com/topoteretes/cognee)
- **Integration:** MCP server, SDK, LangGraph adapter

---

### Letta

**Stateful agent framework** (formerly MemGPT) that manages memory as discrete blocks moved between context and long-term storage.

- **Repo:** [letta-ai/letta](https://github.com/letta-ai/letta)
- **Integration:** SDK, plus a desktop development environment

---

### GBrain {#gbrain}

**An opinionated agent "brain"** by Garry Tan: a store of pages about people, companies and ideas that the agent fills from meetings, email and other sources, with scheduled jobs that enrich and consolidate it overnight. The README describes it as the memory behind the author's own OpenClaw and Hermes deployments, and is candid that the always-on server setup is the costly path (an 8 GB+ server plus model tokens).

- **Repo:** [garrytan/gbrain](https://github.com/garrytan/gbrain), MIT, created 2026-04-05; latest release v0.60.299.0 on 2026-10-18 (GitHub API)
- **Integration:** per its README, a ClawHub bundle plugin (the repo ships `openclaw.plugin.json`) or an MCP server registered with OpenClaw; see its [OpenClaw guide](https://github.com/garrytan/gbrain/blob/master/docs/mcp/OPENCLAW.md). clawdocs has not tested it.
- **Fit:** users who want the agent to build a large, curated knowledge base, not just recall past chats

---

### agentmemory {#agentmemory}

**A local memory server for AI coding agents** (Claude Code, Codex, Copilot CLI, Cursor, Hermes, OpenClaw and any MCP client) that captures sessions and recalls them later.

- **Repo:** [rohitg00/agentmemory](https://github.com/rohitg00/agentmemory), Apache-2.0, created 2026-02-25; latest release v0.9.30 on 2026-10-06 (GitHub API)
- **Integration:** per its README, a connector installs a native OpenClaw plugin and skills, takes the memory slot and enables conversation access; replacing another memory plugin needs `--force`. MCP tools are opt-in. See its [OpenClaw setup](https://github.com/rohitg00/agentmemory/tree/main/integrations/openclaw). clawdocs has not tested it.
- **Fit:** people who use several coding agents and want one memory shared between them

---

## Integration Methods

| Method | Setup | Examples |
|--------|-------|---------|
| **Bundled plugin** | Lowest: ships with OpenClaw | `memory-core`, `memory-wiki`, `memory-lancedb`, `active-memory` |
| **Third-party OpenClaw plugin** | Low: `openclaw plugins install`, then configure | Lossless Claw, LanceDB-Pro, memU engine |
| **MCP server** | Medium: run as a sidecar process | claude-mem, MemoV, Cognee, Supermemory |
| **SDK / API** | Higher: build your own integration | Mem0, MemPalace, Hindsight, Letta, OpenViking, PowerContext |

A plugin runs inside the Gateway process with the Gateway's permissions, so treat a third-party memory plugin like any other plugin: read the code, pin the version, and check [Skill and plugin verification](/security/skill-verification). An MCP server runs separately and any MCP client can use it. An SDK gives the most control and the most code to maintain.

---

## Decision Framework

### By Privacy Requirements

| Requirement | Options |
|-------------|---------|
| **Nothing leaves my machine** | Built-in with `local`/`ollama`/`lmstudio` embeddings or `provider: "none"`, Lossless Claw (with a local summarisation model), MemoV, Cognee in local mode |
| **Self-hosted service is fine** | Mem0 (self-hosted), PowerContext, OpenViking |
| **Managed cloud is fine** | Mem0 Platform, Supermemory, Honcho |

Remember that whatever memory is loaded into a prompt is sent to your model provider.

### By Use Case

| Use Case | Pick | Why |
|----------|------|-----|
| **General assistant** | Built-in | No setup, plain files |
| **Curated knowledge base** | Memory Wiki | Claims, evidence, freshness tracking |
| **Coding agent** | claude-mem | Built for dev context |
| **Research agent** | Cognee or Hindsight | Structured knowledge |
| **Shared context across agents** | PowerContext | Context outside any one session |
| **Long conversations** | Lossless Claw | Replaces lossy compaction |
| **Total recall** | MemPalace | Stores everything verbatim |

---

## Getting Started

### Keep It Simple

New to OpenClaw? Use the built-in memory and change nothing. Dreaming is already on. The one setting worth deciding early is the embedding provider: leave the default (OpenAI) if you are already using OpenAI, or pick a local provider if you want memory to stay on the machine (see [Configuration](#configuration)).

Then check that it works:

```bash
openclaw memory status
```

### When to Upgrade

Consider adding something when:
- Built-in recall misses things you know are in your notes (first try `openclaw memory search` and a better embedding provider)
- Compaction is losing detail you need later
- You need memory shared across several agents or people
- You need structured knowledge (entities, relationships)

### Try Before Committing

Most community systems run alongside the built-in memory. Add one as an MCP server, use it for a week, and compare. You rarely need to replace `memory-core`; you can add to it.

---

## See Also

- [Memory overview](https://docs.openclaw.ai/concepts/memory) and [Memory search](https://docs.openclaw.ai/concepts/memory-search) (official docs)
- [Dreaming](https://docs.openclaw.ai/concepts/dreaming) (official docs)
- [Memory System Architecture](/architecture/memory-system): how built-in memory works under the hood
- [Plugin System](/guides/plugin-system): installing memory plugins
- [Privacy & Compliance](/guides/privacy-compliance): data handling implications
- [Cost Management](/guides/cost-management): token cost impact of memory
