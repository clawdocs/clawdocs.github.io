---
sidebar_position: 3
title: Model Selection Guide
description: Which LLM to use with OpenClaw — by use case, budget, and deployment type, with provider comparison and routing strategies
keywords: [openclaw, openclaw model, which model, claude vs gpt, model comparison, cheapest model]
---

# Model Selection Guide

OpenClaw is model-agnostic — it works with 30+ bundled provider plugins covering both cloud and local models. This page helps you choose the right model for your setup and configure routing across multiple providers.

:::tip
**Model pricing changes frequently.** Check [OpenRouter pricing](https://openrouter.ai/models) or your provider's dashboard for current rates. Prices below are approximate as of June 2026.
:::

---

## Quick Pick

| Your priority | Model | Provider | Approx. cost |
|--------------|-------|----------|-------------|
| **Best quality** | Claude Opus 4.8 | Anthropic / OpenRouter | ~$15/$75 per M tokens |
| **Best balance** | Claude Sonnet 4.6 | Anthropic / OpenRouter | ~$3/$15 per M tokens |
| **Cheapest cloud** | DeepSeek V3.2 | DeepSeek / OpenRouter | ~$0.27/$1.10 per M tokens |
| **Near-free cloud** | Gemini 2.5 Flash | Google / OpenRouter | ~$0.15/$0.60 per M tokens |
| **Free (local)** | Qwen3 32B | Ollama / LM Studio | $0 (your hardware) |
| **Free (hosted)** | OpenRouter Free tier | OpenRouter | $0 (rate-limited) |

---

## By Use Case

### Heartbeat (runs every 30 min — cost adds up)

Use the cheapest model that can follow instructions reliably:

| Model | Why | Monthly Cost (48 cycles/day) |
|-------|-----|-----|
| **Local model** (Qwen3 14B) | Zero cost | $0 |
| **Gemini 2.5 Flash** | Very cheap, good instruction following | $15-60 |
| **DeepSeek V3.2** | Budget cloud, decent quality | $15-60 |
| **Claude Haiku 4.5** | More capable but pricier | $30-90 |

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "model": "claude-haiku-4-5-20251001"
  }
}
```

### Complex Reasoning & Planning

| Model | Why | Cost |
|-------|-----|------|
| **Claude Opus 4.8** | Best reasoning, most capable | ~$15/$75 per M tokens |
| **Claude Opus 4.6** | Previous gen, still excellent | ~$15/$75 per M tokens |
| **Claude Sonnet 4.6** | 80% of Opus quality at lower cost | ~$3/$15 per M tokens |

### Coding Tasks

| Model | Why | Cost |
|-------|-----|------|
| **Claude Opus 4.8** | Best code generation and debugging | ~$15/$75 per M tokens |
| **Claude Sonnet 4.6** | Great for most coding, much cheaper | ~$3/$15 per M tokens |
| **DeepSeek V3.2** | Surprisingly good at code, very cheap | ~$0.27/$1.10 per M tokens |
| **Qwen3 32B** (local) | Best local coding model | $0 |
| **Qwen 2.5 Coder** (local) | Optimized for coding | $0 |

### General Chat & Daily Tasks

| Model | Why | Cost |
|-------|-----|------|
| **DeepSeek V3.2** | Best quality-per-dollar for general use | ~$0.27/$1.10 per M tokens |
| **Gemini 2.5 Flash** | Fast, cheap, good for summaries | ~$0.15/$0.60 per M tokens |
| **Claude Sonnet 4.6** | Premium quality when needed | ~$3/$15 per M tokens |

### Long Context (large files, codebases)

| Model | Context Window | Cost |
|-------|---------------|------|
| **Gemini 2.5 Flash** | 1M tokens | ~$0.15/$0.60 per M tokens |
| **Gemini 2.5 Pro** | 1M tokens | ~$1.25/$10 per M tokens |
| **Claude Sonnet 4.6** | 200K tokens | ~$3/$15 per M tokens |

### Tool Use (Agent Workloads)

Not all models handle OpenClaw's tool-call protocol reliably. Requirements:

- Function calling / tool use support in the model's training
- Streaming tool call delta emission
- Reliable JSON argument formatting

| Model | Tool Use Reliability | Notes |
|-------|---------------------|-------|
| **Claude Opus/Sonnet** | Excellent | Purpose-built for tool use |
| **GPT-5.3-Codex / GPT-4o** | Excellent | Strong function calling |
| **Gemini 2.5 Flash/Pro** | Good | Improving rapidly |
| **DeepSeek V3.2** | Good | Good for the price |
| **Qwen3 32B** (local) | Good | Best local option |
| **Llama 3.3 70B** (local) | Good | Needs big GPU |
| **Models under 14B** (local) | Unreliable | Often fails multi-step tool chains |

:::caution
Local models smaller than ~14B parameters often struggle with complex multi-step tool calling. For reliable agent behavior, use 30B+ local models or cloud providers.
:::

---

## By Budget

### $0/month (Local Models Only)

Run models on your own hardware via [Ollama](https://ollama.ai), [LM Studio](https://lmstudio.ai), or vLLM. No API key needed.

| Your VRAM | Recommended Model | Quality |
|-----------|------------------|---------|
| 8 GB | Qwen3 8B, Llama 3.3 8B | Basic tasks |
| 12-16 GB | Qwen3 14B | Good for most tasks |
| 24 GB (RTX 4090) | Qwen3 32B (Q4_K_M) | Excellent daily driver |
| 40-80 GB (A100) | Llama 3.3 70B | Near-cloud quality |

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "local",
    "model": "qwen3:32b",
    "endpoint": "http://localhost:11434"
  }
}
```

See [Local Models Guide](/guides/local-models) for full setup instructions.

### $5-30/month (Budget Cloud)

Use cheap cloud models via [OpenRouter](https://openrouter.ai) or direct:

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "openrouter",
    "model": "deepseek/deepseek-v3.2"
  },
  "heartbeat": {
    "model": "google/gemini-2.5-flash"
  }
}
```

### $30-150/month (Premium Cloud)

Use Anthropic models directly for best quality, with a cheap fallback for heartbeat:

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6"
  },
  "heartbeat": {
    "model": "claude-haiku-4-5-20251001"
  }
}
```

### Hybrid (Best of Both)

Route expensive tasks to cloud, cheap tasks to local:

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "fallback": {
      "provider": "local",
      "model": "qwen3:32b"
    }
  },
  "heartbeat": {
    "provider": "local",
    "model": "qwen3:14b"
  }
}
```

See [Cost Management](/guides/cost-management) for advanced routing strategies.

---

## Model Routing

OpenClaw routes different tasks to different models based on your configuration.

### Per-Task Routing

| Config Key | Controls | Typical Choice |
|-----------|----------|---------------|
| `brain.model` | Default model for chat and reasoning | Sonnet 4.6 |
| `heartbeat.model` | Heartbeat cycles | Haiku 4.5 or local |
| `agents.list[].model` | Per-agent model | Varies by agent role |
| `brain.fallback` | Fallback when primary is down | Different provider |

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "fallback": {
      "provider": "openrouter",
      "model": "deepseek/deepseek-v3.2"
    }
  },
  "heartbeat": {
    "model": "claude-haiku-4-5-20251001"
  },
  "agents": {
    "list": [
      { "id": "researcher", "model": "claude-opus-4-6" },
      { "id": "monitor", "model": "ollama/qwen3:14b" },
      { "id": "worker", "model": "claude-haiku-4-5-20251001" }
    ]
  }
}
```

### Three Hybrid Strategies

| Strategy | How It Works | Best For |
|----------|-------------|----------|
| **Primary with fallbacks** | Cloud primary, local kicks in when cloud is down or rate-limited | Reliability |
| **Local-first** | Local primary, cloud safety net for complex tasks | Cost savings |
| **Merge mode** | Both cloud and local models available, route per-task | Maximum flexibility |

#### Merge Mode

Use `models.mode: "merge"` to add local providers without losing cloud defaults:

```json5
{
  "models": {
    "mode": "merge",
    "providers": {
      "ollama": {
        "models": {
          "qwen3:32b": { "contextWindow": 32768 }
        }
      }
    }
  }
}
```

Without merge mode, custom providers replace the defaults entirely.

---

## Provider Comparison

### Cloud Providers

| Provider | Key Models | Input/Output Cost | Context | Setup |
|----------|-----------|-------------------|---------|-------|
| **Anthropic** | Opus 4.8, Sonnet 4.6, Haiku 4.5 | $0.25-$15 / $1.25-$75 per M | 200K | [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI** | GPT-5.3-Codex, GPT-4o | $2.50-$15 / $10-$60 per M | 128K | [platform.openai.com](https://platform.openai.com) |
| **Google** | Gemini 2.5 Flash, 2.5 Pro | $0.15-$1.25 / $0.60-$10 per M | 1M | [aistudio.google.com](https://aistudio.google.com) |
| **DeepSeek** | V3.2, R1 | $0.27-$0.55 / $1.10-$2.19 per M | 128K | [platform.deepseek.com](https://platform.deepseek.com) |
| **xAI** | Grok | $5 / $15 per M | 128K | [console.x.ai](https://console.x.ai) |
| **OpenRouter** | 200+ models | Varies (pass-through) | Varies | [openrouter.ai](https://openrouter.ai) |

### Local Providers

| Provider | Setup | GUI | Multi-GPU | Best For |
|----------|-------|-----|-----------|----------|
| **LM Studio** | Download app | Yes | No | Beginners, quick setup |
| **Ollama** | One command | No | Limited | CLI users, auto-discovery |
| **vLLM** | pip install | No | Yes (tensor parallel) | Production, high throughput |
| **SGLang** | pip install | No | Yes | High throughput, RadixAttention |

---

## OpenRouter

[OpenRouter](https://openrouter.ai) is a meta-provider — one API key gives you access to 200+ models across all major providers with usage-based billing.

### Why Use OpenRouter

- **Single API key** for Claude, GPT, Gemini, DeepSeek, open-source models
- **Cost arbitrage** — find the cheapest provider for any model
- **Rate limit pooling** — automatic fallback across providers
- **Free tier** — rate-limited access to select models at $0
- **Usage tracking** — detailed per-model spending dashboard

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "openrouter",
    "model": "anthropic/claude-sonnet-4-6",
    "api_key": "${OPENROUTER_API_KEY}"
  }
}
```

### Advanced Routing Metadata

OpenRouter supports 13 routing fields that OpenClaw passes through (via PR #17148):

```json5
{
  "models": {
    "providers": {
      "openrouter": {
        "providerRouting": {
          "sort": "price",
          "allow_fallbacks": true,
          "require_parameters": true,
          "data_collection": "deny",
          "quantizations": ["fp16", "bf16"],
          "max_price": { "prompt": 0.001, "completion": 0.005 },
          "preferred_max_latency": 10000,
          "preferred_min_throughput": 50
        }
      }
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `sort` | Sort providers by `price`, `latency`, or `throughput` |
| `only` | Restrict to specific providers |
| `ignore` | Exclude specific providers |
| `order` | Explicit provider priority order |
| `allow_fallbacks` | Allow fallback to other providers |
| `require_parameters` | Only use providers that support all parameters |
| `data_collection` | `deny` to opt out of training data |
| `quantizations` | Preferred quantization levels |
| `max_price` | Maximum price per token (prompt/completion) |
| `preferred_max_latency` | Target latency in milliseconds |
| `preferred_min_throughput` | Target tokens per second |

---

## Cost Optimization Tips

### The 97% Reduction Strategy

Combine five changes to cut costs from ~$1,200/month to ~$36/month:

| Change | Savings | How |
|--------|---------|-----|
| Switch heartbeat from Opus to Haiku | ~90% of heartbeat cost | `heartbeat.model: "claude-haiku-4-5-20251001"` |
| Increase heartbeat interval to 60 min | 50% of remaining heartbeat | `heartbeat.interval: 3600` |
| Enable quiet hours (8h/night) | 33% of remaining heartbeat | `heartbeat.quiet_hours` |
| Use local model for heartbeat | 100% of heartbeat cost | `heartbeat.model: "ollama/qwen3:14b"` |
| Route sub-agents to Haiku | ~80% of sub-agent cost | `agents.defaults.model` |

### General Tips

1. **Heartbeat is the biggest cost driver** — it fires every 30 min, 24/7. Use the cheapest model that works
2. **Increase heartbeat interval** — 60 min instead of 30 cuts heartbeat costs in half
3. **Set quiet hours** — no heartbeat while you sleep (saves ~33%)
4. **Keep sessions short** — context accumulates; each message gets more expensive
5. **Route by task** — use Opus only for complex work, cheap models for everything else
6. **Use OpenRouter** — compare prices, leverage free tiers, pool rate limits
7. **Use `max_context_tokens`** — limit memory loaded per message (default 2,000 tokens)
8. **Monitor spending** — check provider dashboards regularly

See [Cost Management](/guides/cost-management) for real-world case studies and the [Performance Tuning guide](/guides/performance-tuning) for advanced optimization.

---

## Known Issues

| Issue | Status | Workaround |
|-------|--------|------------|
| Ollama `/v1` streaming breaks tool calls | Fixed (v2026.3.2+) | Use native `/api/chat` endpoint (default) |
| Fallback permanently overwrites primary config (#47705) | Open | Update to latest, report if persists |
| Stale merge data in provider config (#30395) | Open | Restart gateway after config changes |
| Missing `api` field gives vague error (#6054) | Won't fix | Always include `"api": "openai-completions"` |
| Timeout ignored for slow models | Intermittent | Set `timeoutSeconds: 300` as safety net |

---

## See Also

- [Local Models](/guides/local-models) — Full Ollama/LM Studio/vLLM setup guide
- [Cloud GPU Models](/guides/cloud-gpu-models) — Self-hosted models on RunPod, Lambda, etc.
- [Cost Management](/guides/cost-management) — Monitoring and reducing API costs
- [Performance Tuning](/guides/performance-tuning) — Token optimization and cost reduction
- [Privacy & Compliance](/guides/privacy-compliance) — Data residency and air-gapped operation
- [Brain & Hands Architecture](/architecture/brain-and-hands) — Provider integration internals
- [Configuration Reference](/reference/configuration) — All brain/model config options
