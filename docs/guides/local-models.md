---
sidebar_position: 5
title: Local Models
description: Run OpenClaw with local LLMs via Ollama or vLLM — zero API costs, full privacy
---

# Running with Local Models

OpenClaw can run entirely offline using local LLMs, eliminating API costs and keeping all data on your machine.

## Supported Local Backends

| Backend | Best For | Setup Complexity |
|---------|----------|-----------------|
| **Ollama** | Quick start, consumer hardware | Low |
| **vLLM** | Production, GPU clusters | Medium |
| **llama.cpp** | Minimal dependencies | Medium |

## Setup with Ollama

### Install Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | bash

# Pull a model
ollama pull llama3.1:70b    # Best quality
ollama pull llama3.1:8b     # Faster, less RAM
ollama pull codellama:34b   # Good for coding tasks
```

### Configure OpenClaw

```yaml title="~/.openclaw/config.yml"
brain:
  provider: "local"
  local:
    endpoint: "http://localhost:11434"
    model: "llama3.1:70b"
    type: "ollama"
```

Restart the gateway:

```bash
openclaw gateway restart
```

## Setup with vLLM

vLLM is recommended for users with dedicated GPU hardware:

```bash
pip install vllm

# Start vLLM server
vllm serve meta-llama/Llama-3.1-70B-Instruct \
  --host 0.0.0.0 \
  --port 8000
```

```yaml title="~/.openclaw/config.yml"
brain:
  provider: "local"
  local:
    endpoint: "http://localhost:8000/v1"
    model: "meta-llama/Llama-3.1-70B-Instruct"
    type: "openai-compatible"
```

## Hardware Requirements

| Model Size | RAM | GPU VRAM | Quality |
|-----------|-----|----------|---------|
| 7-8B | 8 GB | 6 GB | Basic tasks, simple chat |
| 13B | 16 GB | 10 GB | Good general use |
| 34B | 32 GB | 24 GB | Strong coding and reasoning |
| 70B | 64 GB | 40 GB+ | Near cloud-quality |

:::tip
For the best experience without a GPU, use **quantized models** (Q4_K_M or Q5_K_M). They reduce RAM requirements by 50-75% with minimal quality loss.
:::

## Hybrid Mode

Use local models for cheap tasks and cloud models for complex ones:

```yaml title="~/.openclaw/config.yml"
brain:
  provider: "anthropic"
  model: "claude-opus-4-6"

  # Use local model for heartbeat and simple tasks
  heartbeat_override:
    provider: "local"
    local:
      endpoint: "http://localhost:11434"
      model: "llama3.1:8b"
      type: "ollama"
```

This gives you the best of both worlds: zero-cost heartbeat with full-power reasoning when needed.

## Performance Tips

1. **Keep the model loaded** — Ollama unloads models after idle time. Set `OLLAMA_KEEP_ALIVE=-1`
2. **Use GPU offloading** — Even partial GPU offload dramatically speeds inference
3. **Match model to task** — 8B for heartbeat, 70B for complex reasoning
4. **Monitor memory** — Local models consume significant RAM

## Limitations

- Local models are generally less capable than Claude Opus or GPT-5
- Complex multi-step reasoning may fail more often
- Browser automation skills may need cloud models
- Speed depends heavily on your hardware

## See Also

- [Brain & Hands Architecture](/architecture/brain-and-hands) — How models are integrated
- [Configuration Reference](/reference/configuration) — All model settings
- [Heartbeat](/architecture/heartbeat) — Cost optimization with hybrid mode
