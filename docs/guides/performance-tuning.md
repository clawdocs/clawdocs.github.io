---
sidebar_position: 12
title: Performance Tuning
description: Optimize your OpenClaw agent for speed, cost, and efficiency — model routing, token reduction, caching, and resource management
keywords: [openclaw, performance, optimization, reduce tokens, speed up, cost reduction]
---

# Performance Tuning

A 24/7 agent on a VPS can easily cost $300+/month if left untuned. This guide covers every optimization lever — from a single config change that cuts costs 50% to advanced model routing that achieves a 97% reduction.

:::tip Quick wins
If you only do three things: **switch heartbeat to a cheap model**, **set quiet hours**, and **increase heartbeat interval**. These alone can cut costs 70%+ with zero impact on agent quality.
:::

---

## Optimization Impact Summary

| Technique | Cost Impact | Effort | Section |
|-----------|-----------|--------|---------|
| Cheap heartbeat model | **-50% to -100%** | Low | [Heartbeat](#heartbeat-optimization) |
| Quiet hours | **-42%** | Low | [Heartbeat](#heartbeat-optimization) |
| Increase heartbeat interval | **-50% to -75%** | Low | [Heartbeat](#heartbeat-optimization) |
| Prompt caching (Anthropic) | **-30% to -50%** | Zero | [Caching](#caching) |
| Context reduction | **Up to -80%** | Medium | [Memory](#memory-optimization) |
| Model routing by task | **-40% to -60%** | Medium | [Model Routing](#model-routing) |
| Disable thinking mode | **-50%** | Low | [Thinking Mode](#thinking-mode) |
| Session resets | **-20% to -50%** | Low | [Token Optimization](#token-optimization) |
| Local models | **-100%** | High | [Local Models](#local-model-tuning) |

---

## Token Optimization

### Context Management

Every message you send includes context — memory, system prompts, conversation history. Context is the biggest hidden cost driver.

```bash
# Check current context token setting
openclaw config get memory.max_context_tokens

# Reduce context loaded per request
openclaw config set memory.max_context_tokens 2000
```

**Real-world impact:** One user reduced per-session cost from $0.40 to $0.05 by lowering context from 50K to 8K tokens.

### Session Resets

Conversations accumulate tokens over time. Long sessions send increasingly large payloads with every message.

```bash
# Start a fresh session (clears conversation history, keeps memory)
/new

# Reset everything including temporary context
/reset

# Compact old messages into a summary
/compact
```

OpenClaw automatically creates a fresh session daily at 4:00 AM local time. For chatty agents, consider more frequent resets.

### Response Size

Cap response length to prevent verbose outputs:

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "max_tokens": 4096
  }
}
```

Smaller `max_tokens` means faster responses and lower cost per message.

---

## Model Routing

The most impactful optimization: use the right model for each task. There's a 60x cost difference between the cheapest and most expensive models.

### Model Cost Tiers

| Tier | Model | Cost (per M tokens) | Best For |
|------|-------|-------------------|----------|
| Free | Qwen3 14B (local) | $0 | Heartbeat, simple checks |
| Ultra-cheap | Gemini 2.5 Flash-Lite | ~$0.05 | Monitoring, status checks |
| Cheap | Gemini 2.5 Flash | ~$0.20 | Heartbeat, simple tasks |
| Budget | DeepSeek V3.2 | ~$0.40 | General conversation |
| Mid | Claude Haiku 4.5 | ~$3 | Quick tasks, chat |
| Standard | Claude Sonnet 4.6 | ~$9 | General use, coding |
| Premium | Claude Opus 4.8 | ~$15 | Complex reasoning |

### Heartbeat Override

Route the heartbeat to a cheap model while keeping the main brain on a capable one:

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",

    "heartbeat_override": {
      "provider": "local",
      "local": {
        "endpoint": "http://localhost:11434",
        "model": "qwen3:14b"
      }
    }
  }
}
```

The heartbeat runs every 30 minutes and is the single largest cost driver (~35% of total spend). Routing it to a free local model eliminates that cost entirely.

### Fallback Chains

Configure automatic fallback when the primary provider is rate-limited or down:

```json5
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "fallback": {
      "provider": "openrouter",
      "model": "deepseek/deepseek-chat-v3-0324"
    }
  }
}
```

### OpenRouter Auto-Routing

Let OpenRouter pick the most cost-effective model per prompt:

```json5
{
  "brain": {
    "provider": "openrouter",
    "model": "openrouter/auto"
  }
}
```

This routes each request to the cheapest provider that can handle it — useful for mixed workloads.

---

## Heartbeat Optimization

The heartbeat is the #1 cost driver for always-on agents. Default settings (30-minute interval, main model) can easily spend $500+/month.

### Interval Tuning

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "interval": 3600
  }
}
```

| Interval | Cycles/Day | Cost Impact |
|----------|-----------|------------|
| 30 min (default) | 48 | Baseline |
| 1 hour | 24 | **-50%** |
| 2 hours | 12 | **-75%** |
| 4 hours | 6 | **-87%** |

### Quiet Hours

Stop the heartbeat while you're asleep:

```json5
{
  "heartbeat": {
    "interval": 3600,
    "quiet_hours": {
      "start": "23:00",
      "end": "07:00"
    }
  }
}
```

8 hours of quiet = **-33%** heartbeat cost on top of interval savings.

### Heartbeat Model Cost

| Model | Cost per Cycle (~120K tokens) | Monthly (24/day) |
|-------|------------------------------|-----------------|
| Opus 4.8 | ~$0.75 | ~$540 |
| Sonnet 4.6 | ~$0.45 | ~$324 |
| Haiku 4.5 | ~$0.15 | ~$108 |
| Gemini 2.5 Flash | ~$0.05 | ~$36 |
| Flash-Lite | ~$0.01 | ~$7 |
| Local (Ollama) | $0 | **$0** |

### Simplify HEARTBEAT.md

Every instruction in HEARTBEAT.md costs tokens. A shorter heartbeat task list = fewer tokens per cycle:

```markdown title="Before (expensive)"
## System Health
- Check CPU, memory, disk, network, SSL certs, DNS, NTP
- Scan all 50 channels for disconnects
- Review last 1000 log lines for patterns
- Analyze token spending trends
- Generate a 500-word health report
```

```markdown title="After (efficient)"
## System Health
- Check channel connectivity and MCP health
- Alert on Telegram only if something is wrong
```

### Monitor Heartbeat Cost

```bash
# See heartbeat execution history and cost
openclaw stats heartbeat

# Watch heartbeat in real-time
openclaw logs --filter heartbeat --follow
```

---

## Caching

### Prompt Caching (Anthropic)

Anthropic automatically caches system prompts and repeated context. Cache hits cost **10% of normal input token price**.

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "cache_retention": "short"
  }
}
```

| Setting | Duration | Savings |
|---------|----------|---------|
| `"short"` (default) | 5 minutes | 30-50% for frequent messages |
| `"long"` | Extended | Higher savings for sustained conversations |

**How it works:** Your system prompt (SOUL.md + skills + memory context) is 5K-10K tokens. With caching, that's charged once every 5 minutes instead of every message. For a chatty channel, this saves 30-50%.

### Memory Retrieval Cache

Built-in memory uses hybrid search (70% vector + 30% BM25 keyword) with local SQLite — no external API calls for retrieval. This is already optimized; no configuration needed.

---

## Memory Optimization

### Context Token Budget

The `max_context_tokens` setting controls how much memory is loaded into each prompt:

```json5
{
  "memory": {
    "max_context_tokens": 2000
  }
}
```

| Setting | Recall Quality | Cost Impact |
|---------|---------------|------------|
| 1000 | Minimal — only most relevant | Lowest cost |
| 2000 (default) | Good balance | Standard |
| 4000 | Better recall | +50% context cost |
| 8000+ | Near-complete recall | Expensive |

Start at 2000. Only increase if the agent frequently "forgets" important context.

### Dreaming (Memory Consolidation)

Enable Dreaming to automatically consolidate short-term memory into durable long-term memory, reducing redundancy:

```json5
{
  "plugins": {
    "entries": {
      "memory-core": {
        "enabled": true,
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

Dreaming runs three phases (Light → REM → Deep) that deduplicate, identify patterns, and promote the strongest memories. This keeps memory lean and relevant.

### Alternative Memory Systems

For heavy agents, community memory systems can dramatically reduce token usage:

| System | Token Savings | Best For |
|--------|-------------|----------|
| **memU** | ~90% | 24/7 autonomous agents |
| **OpenViking** | ~95% | Production at scale (3-tier hierarchical loading) |
| **Mem0** | ~91% | Managed/team environments |

See [Memory Systems Compared](/guides/memory-systems) for a full comparison.

---

## Thinking Mode

Extended thinking (reasoning mode) can increase token usage by **10-50x** per message. It's powerful for complex problems but devastating for costs if left on globally.

```json5 title="Disable globally"
{
  "brain": {
    "thinking": {
      "enabled": false
    }
  }
}
```

```json5 title="Enable with budget cap"
{
  "brain": {
    "thinking": {
      "enabled": true,
      "budget_tokens": 10000
    }
  }
}
```

**Rule of thumb:** Disable thinking mode for heartbeat, simple chat, and routine tasks. Enable it only for complex reasoning, multi-step planning, or code generation.

---

## Latency Reduction

### Faster Models

| Priority | Model | Latency |
|----------|-------|---------|
| Fastest | Groq (LPU hardware) | ~18x faster than GPU |
| Very fast | Cerebras (2,957 tok/s) | Near-instant for short responses |
| Fast | Gemini 2.5 Flash | Low latency, high throughput |
| Standard | Claude Sonnet 4.6 | Balanced |
| Slow | Claude Opus 4.8 | Highest quality, highest latency |

### Reduce Response Size

Smaller `max_tokens` = faster time-to-first-token for many providers:

```json5
{
  "brain": {
    "max_tokens": 2048
  }
}
```

### MCP Server Latency

- **stdio servers** have zero network overhead — prefer these for local tools
- **Remote MCP servers** add network round-trips — run on the same machine when possible
- Use `allowed_tools` to reduce the number of tools the agent considers (fewer options = faster decision)

```json5
{
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user"],
        "allowed_tools": ["read_file", "list_directory"]
      }
    }
  }
}
```

---

## Channel Optimization

### Rate Limiting

Prevent runaway costs from chatty channels:

```json5
{
  "channels": {
    "discord": {
      "max_messages_per_hour": 30,
      "cooldown_seconds": 5,
      "require_mention": true
    }
  }
}
```

### Mention-Gating

In group channels, `require_mention: true` prevents the agent from processing every message — only responding when directly addressed. This alone can reduce token usage 80%+ in active groups.

### Channel-Specific Models

For channels that don't need the best model (e.g., a status-check bot):

```json5
{
  "agents": {
    "status-bot": {
      "channels": ["slack-status"],
      "brain": {
        "model": "claude-haiku-4-5-20251001"
      }
    }
  }
}
```

---

## Local Model Tuning

Running models locally eliminates API costs entirely. Here's how to maximize performance.

### Ollama Optimization

```bash
# Keep model loaded in memory (prevents cold-start latency)
export OLLAMA_KEEP_ALIVE=-1

# Set concurrent requests
export OLLAMA_NUM_PARALLEL=4
```

### Quantization

Smaller quantizations use less RAM with minimal quality loss:

| Quantization | RAM Savings | Quality Impact |
|-------------|------------|---------------|
| Q8_0 | Baseline | None |
| Q6_K | ~25% less | Negligible |
| Q5_K_M | ~40% less | Minimal |
| Q4_K_M | ~50% less | Slight |

```bash
# Pull a quantized model
ollama pull qwen3:14b-q4_K_M
```

### GPU Offloading

GPU inference is 5-20x faster than CPU. Ensure your model fits in GPU VRAM:

| Model Size | VRAM Needed (Q4) | Recommended GPU |
|-----------|-----------------|-----------------|
| 7-8B | ~4-5 GB | Any 6GB+ GPU |
| 14B | ~8-10 GB | RTX 3060 12GB |
| 32B | ~18-20 GB | RTX 3090 24GB |
| 70B | ~35-40 GB | A100 40GB |

### vLLM for Production

For highest throughput with local models:

```bash
vllm serve qwen3-32b \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.9 \
  --tensor-parallel-size 2  # Split across 2 GPUs
```

See [Local Models](/guides/local-models) and [Cloud GPU Models](/guides/cloud-gpu-models) for detailed hardware guides.

---

## Resource Management

### Memory (RAM)

```bash
# Check current usage
ps aux | grep openclaw
```

| RSS | Status | Action |
|-----|--------|--------|
| 150-250 MB | Healthy idle | Normal |
| 250-500 MB | Busy/active | Normal under load |
| 500+ MB | Warning | Restart soon |
| 1+ GB | Critical | Restart now |

**Reduce RAM usage:**
- Disconnect unused channels
- Disable unused plugins
- Lower `max_context_tokens`
- Set Docker memory limit: `deploy.resources.limits.memory: 2G`

### Disk

```bash
# Check disk usage
du -sh ~/.openclaw/
du -sh ~/.openclaw/logs/
du -sh ~/.openclaw/memory/
```

**Manage disk:**
- Log rotation: `max_size: "10m"`, `max_files: 5` (~50 MB cap)
- Prune old memory files periodically
- Monitor with heartbeat alerts

### CPU

CPU usage is normally low except during active token processing. Sustained high CPU indicates:
- Infinite loop in a skill or tool
- Stuck MCP server
- Excessive browser automation

```bash
# Check CPU
top -p $(cat ~/.openclaw/gateway.pid)

# Check what's running
openclaw logs --follow
```

---

## Skill Optimization

### Efficient Skill Design

- **Declare only needed tools** — `tools: [shell]` instead of `tools: [shell, browser, filesystem, http]`
- **Clear instructions** — vague skills cause retries and extra tool calls
- **Short prompts** — every token in the skill is loaded per invocation

### Avoid Always-On Skills

Skills with trigger `"*"` (always active) are loaded into every message. Use specific triggers:

```yaml title="Efficient — only fires on keyword"
trigger: "deploy"
```

```yaml title="Expensive — loaded every message"
trigger: "*"
```

---

## Provider-Specific Tips

### Anthropic

- **Prompt caching** is automatic — high-frequency conversations save 30-50%
- **Batch API** for non-urgent tasks (50% cheaper, results within 24 hours)
- Use Haiku for simple tasks, Sonnet for general work, Opus only for complex reasoning

### OpenRouter

- **Auto-routing** (`openrouter/auto`) picks cheapest capable model per prompt
- Built-in cost tracking across all providers
- Single API key for 100+ models

### Google Gemini

- **2.5 Flash**: fastest and cheapest cloud model for most tasks
- **1M token context window**: useful for large codebases without chunking
- Free tier available for low-volume usage

### DeepSeek

- **V3.2**: excellent quality at ~$0.40/M tokens — great default for cost-conscious setups
- Works well as primary model or fallback

---

## Real-World Optimization Example

**Before:** $1,200/month

- Opus 4.5 for everything (heartbeat, chat, skills)
- 30-minute heartbeat, 24/7
- 50K context tokens
- No session resets
- Extended thinking enabled

**After:** $36/month (97% reduction)

1. Local Qwen3 14B for heartbeat ($0)
2. DeepSeek V3.2 for chat ($0.40/M tokens)
3. Sonnet 4.6 for complex tasks only
4. Context reduced to 8K tokens
5. 1-hour heartbeat with quiet hours
6. Thinking mode disabled by default
7. Session auto-resets enabled

---

## Tuning Checklist

### Quick Wins (do first)

- [ ] Switch heartbeat to cheap/local model
- [ ] Set quiet hours for heartbeat
- [ ] Increase heartbeat interval to 1+ hours
- [ ] Set `max_context_tokens` to 2000-4000
- [ ] Enable mention-gating in group channels
- [ ] Set `max_messages_per_hour` rate limits

### Medium Effort

- [ ] Enable Dreaming for memory consolidation
- [ ] Configure fallback provider chain
- [ ] Simplify HEARTBEAT.md instructions
- [ ] Audit skills for unnecessary `"*"` triggers
- [ ] Filter MCP server tools with `allowed_tools`
- [ ] Disable extended thinking for routine tasks

### Advanced

- [ ] Set up local models for heartbeat/simple tasks
- [ ] Configure per-channel model routing
- [ ] Deploy on GPU hardware for local inference
- [ ] Use vLLM for high-throughput local serving
- [ ] Implement budget alerts via heartbeat monitoring

### Monitor Results

```bash
# Before and after comparison
openclaw stats tokens --period 7
openclaw gateway usage-cost
openclaw stats heartbeat
```

---

## See Also

- [Cost Management](/guides/cost-management) — Detailed cost breakdown and budgeting
- [Model Selection](/guides/model-selection) — Choosing the right model for your use case
- [Local Models](/guides/local-models) — Running models on your own hardware
- [Cloud GPU Models](/guides/cloud-gpu-models) — Renting GPUs for local inference
- [Heartbeat](/guides/heartbeat) — Heartbeat configuration and scheduling
- [Memory Systems Compared](/guides/memory-systems) — Alternative memory systems for efficiency
- [Monitoring & Observability](/guides/monitoring) — Tracking costs and performance
- [MCP Servers](/guides/mcp-servers) — Optimizing MCP connections
