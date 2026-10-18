---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Performance Tuning
description: Make OpenClaw faster and lighter. Latency, context size, MCP tools, group-chat gating, local model throughput and host resources, with config that validates
keywords: [openclaw, performance, optimization, latency, speed up, local model tuning, resources]
---

# Performance Tuning

This page covers speed and resource use: how fast the agent answers, how much context it carries, and how much CPU, RAM and disk the Gateway and local models use. Many of these changes also save money. For estimating and cutting spend (model routing for cost, heartbeat cost, caching, budgets), see [Cost Management](/guides/cost-management), which this page does not repeat.

The config schema is strict: an unknown key stops the Gateway from starting. Every `openclaw.json` block below passes `openclaw config validate` on 2026.10.4.

---

## Where latency comes from

| Source | Lever |
|---|---|
| Model speed | A faster model or tier for interactive work; `/fast` where supported |
| Thinking | Lower effort for routine turns |
| Prompt size | Smaller sessions, fewer bootstrap files, fewer tools and skills |
| Tool round-trips | Fewer, local MCP servers; narrower tool lists |
| Cold starts | Keep local models loaded |
| Output length | A `maxTokens` cap on the model |

---

## Model speed

Smaller models answer faster. Use them where quality allows:

| Need | Example ref |
|---|---|
| Interactive chat, quick replies | `anthropic/claude-haiku-5-5`, `anthropic/claude-sonnet-5-5`, `google/gemini-3.8-flash` |
| Hard reasoning, long agent runs | `anthropic/claude-opus-5-5`, `anthropic/claude-fable-5-1` (slower, longer turns) |
| Specialised fast inference | Providers such as [Groq](https://docs.openclaw.ai/providers/groq) and [Cerebras](https://docs.openclaw.ai/providers/cerebras) |

### Fast mode

`/fast on` toggles a provider's faster tier for the session. For Claude Opus 5.5, Opus 5 and Opus 4.8 on direct `api.anthropic.com` API-key traffic, it uses Anthropic's native fast mode: up to 2.5x output throughput, billed at a premium ($8 / $40 per million tokens for Opus 5.5, as of 2026-10-18). Accounts need fast-mode access. It does not apply to Claude CLI, OAuth, Bedrock or Vertex routes, and Sonnet 5.5 has no fast mode ([Anthropic provider](https://docs.openclaw.ai/providers/anthropic)).

### Thinking effort

Thinking adds time before the first visible token. Set a lower default and raise it for hard turns with `/think high`:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      thinkingDefault: "low",
    },
  },
}
```

Opus 5.5 cannot turn thinking off; `off` maps to `low`. See [Thinking levels](https://docs.openclaw.ai/tools/thinking).

### Output cap

For a custom provider, cap output with `maxTokens` on the provider or on its `models[]` entries. A lower cap shortens worst-case replies, but a cap that is too low truncates tool calls and long answers:

```json5 title="~/.openclaw/openclaw.json"
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://127.0.0.1:11434",
        api: "ollama",
        apiKey: "ollama-local",
        models: [
          { id: "qwen3:14b", name: "qwen3:14b", maxTokens: 4096, params: { num_ctx: 32768 } },
        ],
      },
    },
  },
}
```

---

## Prompt size

Every request carries the system prompt, workspace bootstrap files, tool and skill descriptions, and the session history. Less of that means faster and cheaper turns.

| Habit or setting | Effect |
|---|---|
| `/new` when you change topic, `/compact` on long sessions | Shorter history per request |
| `session.reset.mode: "daily"` or `"idle"` | Automatic fresh sessions. The default is no automatic reset ([Sessions](https://docs.openclaw.ai/concepts/session)). |
| `agents.defaults.bootstrapMaxChars` | Caps how much of each workspace bootstrap file is injected |
| `contextPruning.mode: "cache-ttl"` | Prunes old tool results after the cache window expires |
| Restrict skills per agent with `agents.entries.<id>.skills` | The skill list is injected into every prompt |
| Heartbeats with `isolatedSession` and `lightContext` | Heartbeat turns skip history and bootstrap files |

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "1h" },
      heartbeat: { isolatedSession: true, lightContext: true },
    },
  },
}
```

`/status` shows the current context use, and `/context` shows what the prompt is made of. Upstream explains the full breakdown in [Token use](https://docs.openclaw.ai/reference/token-use).

---

## Tools and MCP servers

- Local stdio MCP servers avoid network round-trips; prefer them for local tools.
- Expose only the tools an agent needs. `toolFilter.include` (or `exclude`) on an MCP server narrows what the model sees:

```json5 title="~/.openclaw/openclaw.json"
{
  mcp: {
    servers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"],
        toolFilter: { include: ["read_file", "list_directory"] },
      },
    },
  },
}
```

`openclaw mcp status` and `openclaw mcp probe` show which servers are up and how they respond ([MCP CLI](https://docs.openclaw.ai/cli/mcp)).

:::warning
MCP servers, shell and browser tools act on your machine. Narrowing the tool list helps speed, but it is not a security boundary on its own. Keep approvals and, for untrusted input, sandboxing on ([Hardening](/security/hardening)).
:::

---

## Group chats

In busy groups, process only messages that address the agent. Mention gating is set per guild or channel, for example on Discord:

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          requireMention: true,
        },
      },
    },
  },
}
```

On Telegram the equivalent is `channels.telegram.groups["*"].requireMention`. There is no built-in messages-per-hour cap. See each channel's page under [Channels](https://docs.openclaw.ai/channels).

### A cheaper agent for a busy channel

Route a channel to its own agent with a smaller model, using `agents.entries` and `bindings`:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    entries: {
      main: {},
      status: {
        model: "anthropic/claude-haiku-5-5",
        workspace: "~/.openclaw/workspace-status",
      },
    },
  },
  bindings: [
    {
      agentId: "status",
      match: { channel: "discord", peer: { kind: "channel", id: "222222222222222222" } },
    },
  ],
}
```

See [Multi-agent routing](https://docs.openclaw.ai/concepts/multi-agent).

---

## Memory

Built-in memory search runs locally. Two settings matter for performance:

- **Embeddings.** Remote embedding providers add latency and cost per indexing run. A local embedding model avoids both ([Memory search](https://docs.openclaw.ai/concepts/memory-search)).
- **Dreaming** (background consolidation in the `memory-core` plugin) is on by default and runs on a cron-style `frequency` (default `0 3 * * *`). Move it to a quiet hour or give it a cheaper `model`:

```json5 title="~/.openclaw/openclaw.json"
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 4 * * *",
            model: "anthropic/claude-haiku-5-5",
          },
        },
      },
    },
  },
}
```

See [Dreaming](https://docs.openclaw.ai/concepts/dreaming).

---

## Local model tuning

Local models have no per-token cost, so throughput and memory are what you tune. Setup is in [Local Models](/guides/local-models).

### Ollama

```bash
# Keep models loaded between requests (avoids cold-start latency)
export OLLAMA_KEEP_ALIVE=-1

# Serve several requests at once (uses more VRAM)
export OLLAMA_NUM_PARALLEL=4
```

These are Ollama server settings, set where `ollama serve` runs. Per model, OpenClaw can forward `keep_alive` and `num_ctx` through `params` on the model entry. A `num_ctx` larger than you need wastes VRAM and slows prompt processing; one too small truncates the prompt.

### Quantization and VRAM

Relative to FP16 weights:

| Quantization | VRAM vs FP16 | Quality impact |
|---|---|---|
| Q8_0 | About 50% | Negligible |
| Q6_K | About 40% | Minimal |
| Q5_K_M | About 35% | Small |
| Q4_K_M | About 25-30% | Noticeable on hard tasks; fine for most chat |

Approximate VRAM for Q4 weights, plus room for the context cache:

| Model size | VRAM (Q4) | Example GPU |
|---|---|---|
| 7-8B | 5-6 GB | 8 GB card |
| 14B | 9-10 GB | 12 GB card |
| 32B | 19-20 GB | 24 GB card |
| 70B | 40-43 GB | 48 GB card or 2x 24 GB |

```bash
ollama pull qwen3:14b-q4_K_M
```

If the model does not fit in VRAM, layers spill to system RAM and generation slows sharply. Check with `ollama ps`.

### vLLM

For multi-user or multi-GPU throughput:

```bash
vllm serve Qwen/Qwen3-32B \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.9 \
  --tensor-parallel-size 2
```

Point OpenClaw at it as a provider with `api: "openai-completions"` ([vLLM provider](https://docs.openclaw.ai/providers/vllm)). For rented GPUs, see [Cloud GPU Models](/guides/cloud-gpu-models).

---

## Host resources

### RAM and CPU

```bash
openclaw status --all     # read-only diagnosis, including the Gateway process
openclaw health --json    # health snapshot for scripts
```

On Linux with the user service from `openclaw gateway install`, `systemctl --user status openclaw-gateway` shows memory and CPU. Sustained high CPU usually means a loop in a tool or skill, a stuck MCP server or heavy browser automation; `openclaw logs --follow` shows which. To limit a container, set `deploy.resources.limits.memory` in Docker Compose.

To reduce baseline memory, disable channels and plugins you don't use (`openclaw plugins list`, `openclaw plugins disable <id>`).

### Disk

| Path | What grows |
|---|---|
| `/tmp/openclaw/openclaw-YYYY-MM-DD.log` | Gateway logs. Rotated at `logging.maxFileBytes` (default 100 MB) with 5 archives; dated files are pruned after 24 hours ([Logging](https://docs.openclaw.ai/logging)). |
| `~/.openclaw/state/` | SQLite state: sessions, transcripts, audit ledger |
| `~/.openclaw/workspace/` | Workspace files and memory |

```bash
du -sh ~/.openclaw/ ~/.openclaw/state ~/.openclaw/workspace /tmp/openclaw
```

```json5 title="~/.openclaw/openclaw.json"
{
  logging: {
    level: "info",
    maxFileBytes: 52428800,
  },
}
```

See [Monitoring](/guides/monitoring) for logs, health checks and metrics.

---

## Tuning checklist

1. Measure first: `/usage full` for a day, `/status` for context size, `openclaw logs --follow` for slow tools.
2. Pick the fastest model that meets the quality bar for interactive work; reserve Opus/Fable for hard tasks.
3. Lower `thinkingDefault`; raise per message.
4. Keep sessions small: `/new`, `/compact`, `contextPruning`, lean heartbeats.
5. Narrow MCP tools with `toolFilter`, and require mentions in groups.
6. For local models: keep them loaded, size `num_ctx` to need, and make sure the weights fit in VRAM.
7. Re-measure.

## See also

- [Cost Management](/guides/cost-management): spend, heartbeat cost and budgets
- [Model Selection](/guides/model-selection): which model for which task
- [Local Models](/guides/local-models)
- [Cloud GPU Models](/guides/cloud-gpu-models)
- [Monitoring](/guides/monitoring)
