---
sidebar_position: 3
title: Model Selection Guide
description: Which LLM to use with OpenClaw — by use case, budget, and deployment type
---

# Model Selection Guide

OpenClaw is model-agnostic — it works with any LLM provider or local model. This page is the single reference for choosing the right model for your setup.

:::tip
**Model pricing changes frequently.** Check [OpenRouter pricing](https://openrouter.ai/models) or your provider's dashboard for current rates. Prices below are approximate as of June 2026.
:::

## Quick Pick

| Your priority | Model | Provider | Approx. cost |
|--------------|-------|----------|-------------|
| **Best quality** | Claude Opus 4.8 | Anthropic / OpenRouter | ~$15/M tokens |
| **Best balance** | Claude Sonnet 4.6 | Anthropic / OpenRouter | ~$9/M tokens |
| **Cheapest cloud** | DeepSeek V3.2 | OpenRouter | ~$0.40/M tokens |
| **Near-free cloud** | Gemini 2.5 Flash | Google / OpenRouter | ~$0.20/M tokens |
| **Free (local)** | Qwen3 32B | Ollama | $0 (your hardware) |
| **Free (hosted)** | OpenRouter Free tier | OpenRouter | $0 |

## By Use Case

### Heartbeat (runs every 30 min — cost adds up)

Use the cheapest model that can follow instructions reliably:

| Model | Why | Cost |
|-------|-----|------|
| **Local model** (Qwen3 14B, Llama 3.3 8B) | Zero cost, runs on your hardware | $0 |
| **Gemini 2.5 Flash** | Very cheap, good instruction following | ~$0.20/M |
| **Claude Haiku 4.5** | More capable but pricier | ~$3/M |

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "model": "claude-haiku-4-5-20251001"  // Or local: "ollama/qwen3:14b"
  }
}
```

### Complex Reasoning & Planning

| Model | Why | Cost |
|-------|-----|------|
| **Claude Opus 4.8** | Best reasoning, most capable | ~$15/M |
| **Claude Sonnet 4.6** | 80% of Opus quality at 60% of the cost | ~$9/M |

### Coding Tasks

| Model | Why | Cost |
|-------|-----|------|
| **Claude Opus 4.8** | Best code generation and debugging | ~$15/M |
| **Claude Sonnet 4.6** | Great for most coding, much cheaper | ~$9/M |
| **DeepSeek V3.2** | Surprisingly good at code, very cheap | ~$0.40/M |
| **Qwen3 32B** (local) | Best local coding model | $0 |

### General Chat & Daily Tasks

| Model | Why | Cost |
|-------|-----|------|
| **DeepSeek V3.2** | Best quality-per-dollar for general use | ~$0.40/M |
| **Gemini 2.5 Flash** | Fast, cheap, good for summaries | ~$0.20/M |
| **Claude Sonnet 4.6** | Premium quality when needed | ~$9/M |

### Long Context (large files, codebases)

| Model | Why | Cost |
|-------|-----|------|
| **Gemini 2.5 Flash** | 1M token context window | ~$0.20/M |
| **Claude Sonnet 4.6** | 200K context, excellent recall | ~$9/M |

## By Budget

### $0/month (Local Models Only)

Run models on your own hardware via [Ollama](https://ollama.ai) or vLLM. No API key needed.

| Your VRAM | Recommended Model | Quality |
|-----------|------------------|---------|
| 8 GB | Qwen3 8B, Llama 3.3 8B | Basic tasks |
| 12-16 GB | Qwen3 14B | Good for most tasks |
| 24 GB (RTX 4090) | Qwen3 32B (Q4) | Excellent daily driver |
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

Use cheap cloud models via [OpenRouter](https://openrouter.ai):

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

## Provider Comparison

| Provider | Models | Pricing | Setup |
|----------|--------|---------|-------|
| **Anthropic** | Claude Opus, Sonnet, Haiku | Per-token | API key from [console.anthropic.com](https://console.anthropic.com) |
| **OpenRouter** | 200+ models (Claude, GPT, DeepSeek, Gemini, open-source) | Per-token, some free | API key from [openrouter.ai](https://openrouter.ai) |
| **Google** | Gemini 2.5 Flash, Pro | Per-token, generous free tier | API key from [aistudio.google.com](https://aistudio.google.com) |
| **OpenAI** | GPT-4o, GPT-5 series | Per-token | API key from [platform.openai.com](https://platform.openai.com) |
| **Local (Ollama)** | Qwen3, Llama, DeepSeek, Mistral | Free | `curl -fsSL https://ollama.ai/install.sh \| sh` |

:::info
**OpenRouter is the most flexible** — one API key gives you access to all major providers plus open-source models, with usage-based billing and free tier options.
:::

## Cost Optimization Tips

1. **Use a cheap heartbeat model** — heartbeat fires every 30 min. Even Haiku at $3/M tokens costs ~$5-15/month on heartbeat alone. Use Gemini Flash or a local model instead
2. **Increase heartbeat interval** — 60 min instead of 30 cuts heartbeat costs in half
3. **Set quiet hours** — no heartbeat while you sleep
4. **Keep sessions short** — context accumulates and each message gets more expensive
5. **Route by task** — use Opus for complex work, cheap models for simple checks

See [Cost Management](/guides/cost-management) for real-world case studies and advanced strategies.

## See Also

- [Local Models](/guides/local-models) — Full Ollama/vLLM setup guide
- [Cloud GPU Models](/guides/cloud-gpu-models) — Self-hosted models on RunPod, Lambda, etc.
- [Cost Management](/guides/cost-management) — Monitoring and reducing API costs
- [Configuration Reference](/reference/configuration) — All brain/model config options
