---
sidebar_position: 18
title: Memory Systems Compared
description: Choose the right memory system for your OpenClaw setup — built-in, community plugins, or managed services
keywords: [openclaw, memory, memory system, persistent context, knowledge base]
---

# Memory Systems Compared

OpenClaw's built-in memory works well out of the box, but 10+ community alternatives offer different tradeoffs — from managed cloud services to graph databases to DAG-based summarization. This guide helps you pick.

---

## Quick Decision

| Your situation | Best choice |
|----------------|------------|
| **Just getting started** | Built-in memory (default) |
| **Privacy is critical, no cloud** | Built-in memory + Dreaming |
| **24/7 autonomous agent, cost-sensitive** | memU |
| **Team/enterprise, managed infra** | Mem0 |
| **Production scale, hierarchical context** | OpenViking |
| **Coding agent, persistent dev context** | claude-mem or MemoV |
| **Long sessions, can't lose context** | Lossless Claw |
| **Maximum conversation recall** | MemPalace |
| **True learning across sessions** | Hindsight |
| **Semantic graph reasoning** | Cognee |

---

## Built-In Memory

OpenClaw stores memory as **local Markdown files** in `~/.openclaw/memory/`. It's human-readable, editable, and never leaves your machine (though content is included in LLM prompts when using cloud providers).

### How It Works

```
~/.openclaw/memory/
├── preferences.md     # Your habits and preferences
├── contacts.md        # People the agent has learned about
├── projects.md        # Active project context
├── learnings.md       # Discoveries and solutions
├── tools.md           # Tools and workflows
└── custom/            # Your own categories
```

**Lifecycle:** Observe → Extract → Store → Retrieve → Decay

During each conversation, the agent identifies facts worth remembering, writes them to the appropriate file, and loads relevant memories into future conversations (up to 2,000 tokens by default).

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "memory": {
    "enabled": true,
    "path": "~/.openclaw/memory",
    "max_context_tokens": 2000,
    "auto_save": true,
    "categories": [
      "preferences",
      "contacts",
      "projects",
      "learnings"
    ]
  }
}
```

### Retrieval

Built-in memory uses **hybrid search** combining two paths:

| Method | Weight | How It Works |
|--------|--------|-------------|
| Vector search | 70% | Semantic similarity via embeddings |
| BM25 keyword search | 30% | Exact and full-text matches (FTS5) |

Results are merged using Reciprocal Rank Fusion (RRF). All processing happens locally via SQLite + `sqlite-vec` + FTS5 — no external API calls.

### Dreaming (memory-core plugin)

Dreaming is an opt-in background consolidation system that moves short-term signals into durable long-term memory. Disabled by default.

**Three phases:**

| Phase | What Happens |
|-------|-------------|
| **Light** | Ingests recent daily memory files, deduplicates entries |
| **REM** | Identifies recurring themes and patterns within a 7-day window |
| **Deep** | Scores candidates on 6 signals (relevance, frequency, recency, diversity, credibility, utility) and promotes the strongest to MEMORY.md |

```json5 title="~/.openclaw/openclaw.json"
{
  "plugins": {
    "entries": {
      "memory-core": {
        "enabled": true,
        "config": {
          "dreaming": {
            "enabled": true,
            "cadence": "0 3 * * *"   // 3 AM daily
          }
        }
      }
    }
  }
}
```

Phase summaries are written to `DREAMS.md` for human review. See the [Workboard Guide](/guides/workboard#dreaming-tab--agent-selector) for managing Dreaming across multiple agents.

### When Built-In Is Enough

- Single user, single agent
- Privacy is the priority — nothing leaves your machine
- You want to read and edit memories manually
- Your conversations are under a few hundred per month
- You don't need cross-session learning or temporal reasoning

---

## Community Memory Systems

### Comparison Matrix

| System | Stars | Type | Architecture | Token Savings | Integration |
|--------|-------|------|-------------|---------------|-------------|
| [**Mem0**](#mem0) | 55k+ | Managed | Vector + KV + Graph | 90% | SDK / API |
| [**memU**](#memu) | 8.8k | Proactive | 3-layer filesystem | ~90% | OpenClaw plugin |
| [**OpenViking**](#openviking) | 15k+ | Context DB | 3-tier hierarchical (L0/L1/L2) | 95% | Filesystem |
| [**MemPalace**](#mempalace) | 22k+ | Verbatim | Full conversation storage | None (stores everything) | SDK |
| [**Supermemory**](#supermemory) | 5k+ | Engine | Fact extraction | High | MCP / API |
| [**Lossless Claw**](#lossless-claw) | Small | Plugin | DAG + LLM summarization | Moderate | OpenClaw plugin |
| [**Hindsight**](#hindsight) | Growing | Framework | 4 semantic networks | Moderate | SDK |
| [**claude-mem**](#claude-mem) | Moderate | Compression | Temporal DB | ~90% | MCP |
| [**MemoV**](#memov) | Moderate | Traceable | Git-like versioning | Low | MCP |
| [**PowerMem**](#powermem) | Moderate | System | Hybrid + graph | High | MCP / API |
| [**Cognee**](#cognee) | Moderate | Graph | Knowledge graph | High | MCP / SDK |
| [**Letta**](#letta) | 10k+ | Framework | OS-inspired blocks | Moderate | SDK |

---

### Mem0

**Universal managed memory layer** — hybrid database storing memories across vector, key-value, and graph backends.

- **Repo:** [mem0ai/mem0](https://github.com/mem0ai/mem0) (55k+ stars)
- **Integration:** Python/TypeScript SDK, API, LangChain/CrewAI adapters
- **Performance:** 26% higher accuracy than OpenAI's memory, 91% lower latency than full-context
- **Pricing:** Managed platform (hosted) or self-hostable

**Best for:** Teams wanting managed infrastructure with analytics and support. Uses an A.U.D.N. cycle (Add, Update, Delete, No-op) for each memory entry.

```python
from mem0 import Memory
m = Memory()
m.add("User prefers TypeScript over JavaScript", user_id="alex")
results = m.search("What languages does the user prefer?", user_id="alex")
```

:::info
Mem0 is a general-purpose memory layer, not OpenClaw-specific. Integration requires connecting via SDK or API in a custom plugin or skill.
:::

---

### memU

**Proactive memory for 24/7 agents** — reduces token costs by ~10x through smart context selection.

- **Repo:** [NevaMind-AI/memU](https://github.com/NevaMind-AI/memU) (8.8k stars)
- **Integration:** Dedicated OpenClaw plugin (`memu-engine-for-OpenClaw`)
- **Performance:** 92% accuracy on Locomo benchmark, ~1/10 token usage
- **Backend:** PostgreSQL with pgvector

**Best for:** Always-on autonomous agents where cost matters. Three-layer filesystem-like memory (Resource → Item → Category) with proactive context loading — no user commands needed.

---

### OpenViking

**ByteDance's context database** — hierarchical context loading designed for production-scale agent deployments.

- **Repo:** [volcengine/OpenViking](https://github.com/volcengine/OpenViking) (15k+ stars)
- **Integration:** Filesystem paradigm, designed for OpenClaw
- **Performance:** 95% cheaper than traditional vector DB approaches
- **Users:** Tencent, ByteDance, Alibaba, Xiaomi

**Best for:** Production at scale. Three-tier context loading:

| Tier | Detail Level | Token Budget |
|------|-------------|-------------|
| **L0** (Abstract) | One-sentence summary | Under 100 tokens |
| **L1** (Overview) | Essential information | Under 2,000 tokens |
| **L2** (Detail) | Complete content | On-demand |

The agent loads L0 first, drills into L1/L2 only when needed — dramatically reducing token consumption.

---

### MemPalace

**Verbatim conversation storage** with high recall — inspired by the ancient "Method of Loci" memory technique.

- **Stars:** 22k+ (gained 22k in 48 hours, April 2026)
- **Integration:** SDK, ChromaDB backend
- **Performance:** 96.6% recall on LongMemEval benchmark
- **Tradeoff:** Higher memory footprint — stores entire conversations, not compressed facts

**Best for:** When you need near-perfect recall of everything that was said. No compression or summarization means nothing is lost, but storage grows fast.

:::caution
MemPalace's benchmark claims generated controversy. The reconciled metrics are still strong, but evaluate against your own use case rather than relying solely on benchmarks.
:::

---

### Supermemory

**Fast semantic memory engine** — extracts and stores facts (not document chunks like RAG).

- **Repo:** [supermemoryai/supermemory](https://github.com/supermemoryai/supermemory) (5k+ stars)
- **Integration:** MCP server, works with Claude Desktop, Cursor, VS Code
- **Performance:** 10x faster than Zep, 25x faster than Mem0 (millisecond retrieval)
- **Funding:** $2.6M seed round

**Best for:** Low-latency memory in development workflows. Handles knowledge updates and contradictions, and implements forgetting for expired information.

---

### Lossless Claw

**DAG-based lossless context management** — prevents information loss across context window compaction.

- **Repo:** [martian-engineering/lossless-claw](https://github.com/martian-engineering/lossless-claw)
- **Integration:** OpenClaw plugin (installs directly)
- **Backend:** SQLite with DAG summarization via configured LLM

**Best for:** Long-running agents where context compaction would lose important information. Persists every message, summarizes older chunks into hierarchical DAG nodes, and provides retrieval tools (`lcm_grep`, `lcm_describe`, `lcm_expand_query`).

---

### Hindsight

**Human-like agentic memory** — four semantic networks that support true learning and belief updating.

- **Repo:** [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)
- **Integration:** SDK
- **Performance:** 91.4% accuracy on LongMemEval (highest recorded)

**Best for:** Long-running agents that need to evolve their understanding over time. Four memory networks:

| Network | What It Stores |
|---------|---------------|
| World facts | Objective information |
| Agent experiences | Past actions and outcomes |
| Entity summaries | Knowledge about people, projects, tools |
| Evolving beliefs | Inferences that update with new evidence |

Three operations: **Retain** (ingest), **Recall** (retrieve), **Reflect** (update beliefs).

---

### claude-mem

**Persistent context compression for coding agents** — captures and compresses context across sessions.

- **Repo:** [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)
- **Integration:** MCP server, works with Claude Code, OpenClaw, Codex, Gemini
- **Performance:** ~10x token efficiency vs manual context

**Best for:** Coding workflows. Auto-captures after every tool call, compresses observations into typed schemas, and uses three-tier retrieval to load only what's relevant.

---

### MemoV

**Git-like traceable memory** — version control for AI reasoning and interactions.

- **Repo:** [memovai/memov](https://github.com/memovai/memov)
- **Integration:** MCP server, web UI at `localhost:38888`
- **Storage:** Bare git repo under `.mem/memov.git`

**Best for:** Coding agents where you want a full interaction history with diffs, snapshots, and rollback — like `git log` for your AI conversations.

---

### PowerMem

**Multi-agent memory system** — combines Ebbinghaus forgetting curve theory with hybrid storage.

- **Repo:** [oceanbase/powermem](https://github.com/oceanbase/powermem)
- **Integration:** CLI, HTTP API, MCP server, web dashboard
- **Architecture:** Working memory → short-term → long-term, with self-evolving skill distillation

**Best for:** Multi-agent setups needing memory governance, isolation between agents, and cross-agent collaboration.

---

### Cognee

**Graph-native semantic memory** — unified knowledge graph with vector and relational storage.

- **Repo:** [topoteretes/cognee](https://github.com/topoteretes/cognee)
- **Integration:** MCP server, LangGraph adapter
- **Backend:** SQLite + LanceDB + Kuzu (zero infrastructure by default)

**Best for:** Agents that need structured knowledge representation — entities, relationships, and provenance tracking.

---

### Letta

**OS-inspired stateful agent framework** — manages memory as discrete functional blocks.

- **Repo:** [letta-ai/letta](https://github.com/letta-ai/letta) (10k+ stars)
- **Integration:** SDK, Agent Development Environment (GUI)
- **Models:** Works with OpenAI, Anthropic, open-source

**Best for:** Building stateful agents from scratch with a consistent memory abstraction. Moves information between immediate context and long-term storage automatically.

---

## Integration Methods

Community memory systems connect to OpenClaw in three ways:

| Method | Setup Complexity | Examples |
|--------|-----------------|---------|
| **OpenClaw plugin** | Low — install and configure | memU, Lossless Claw, LanceDB-Pro |
| **MCP server** | Medium — run as sidecar process | claude-mem, MemoV, Cognee, PowerMem, Supermemory |
| **SDK / API** | Higher — build custom integration | Mem0, MemPalace, Hindsight, Letta, OpenViking |

**Plugin** is the easiest path — the memory system lives inside the gateway process. **MCP** is the most flexible — the memory system runs independently and any MCP client can use it. **SDK** gives the most control but requires custom code.

---

## Decision Framework

### By Privacy Requirements

| Requirement | Options |
|-------------|---------|
| **Nothing leaves my machine** | Built-in, Lossless Claw, MemoV, Cognee (local mode) |
| **Local processing, cloud storage OK** | memU (self-hosted), PowerMem, LanceDB-Pro |
| **Managed cloud is fine** | Mem0 Platform, Supermemory, Zep |

### By Scale

| Scale | Options |
|-------|---------|
| **Single user, single agent** | Built-in memory |
| **Single user, multiple agents** | Built-in + Dreaming, memU, PowerMem |
| **Team / enterprise** | Mem0, OpenViking, Zep |
| **Production at scale** | OpenViking, Mem0, Letta |

### By Use Case

| Use Case | Best Pick | Why |
|----------|-----------|-----|
| **General assistant** | Built-in | Simple, private, no setup |
| **Coding agent** | claude-mem or MemoV | Optimized for dev context |
| **Research agent** | Cognee or Hindsight | Structured knowledge, learning |
| **24/7 autonomous** | memU | Proactive loading, low cost |
| **Multi-agent coordination** | PowerMem | Isolation + collaboration |
| **Long conversations** | Lossless Claw | Prevents context loss |
| **Total recall** | MemPalace | Stores everything verbatim |

---

## Getting Started

### Keep It Simple

If you're new to OpenClaw, use the built-in memory. It works well for most users. Enable Dreaming when you want smarter long-term consolidation:

```json5 title="~/.openclaw/openclaw.json"
{
  "memory": {
    "enabled": true,
    "max_context_tokens": 2000
  },
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "cadence": "0 3 * * *"
          }
        }
      }
    }
  }
}
```

### When to Upgrade

Consider a community memory system when:
- Built-in memory doesn't recall what you need
- You're running 24/7 and token costs are too high
- You need memory shared across multiple agents
- You need structured knowledge (entities, relationships)
- Context compaction is losing important information

### Try Before Committing

Most community systems can run alongside the built-in memory. Install one as an MCP server, test it for a week, and compare. You don't have to replace the built-in system — you can augment it.

---

## See Also

- [Memory System Architecture](/architecture/memory-system) — How built-in memory works under the hood
- [Plugin System](/guides/plugin-system) — Installing memory plugins
- [Workboard](/guides/workboard#dreaming-tab--agent-selector) — Managing Dreaming across agents
- [Privacy & Compliance](/guides/privacy-compliance) — Data handling implications
- [Cost Management](/guides/cost-management) — Token cost impact of memory systems
