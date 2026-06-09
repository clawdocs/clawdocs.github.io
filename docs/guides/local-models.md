---
sidebar_position: 5
title: Local Models
description: Run OpenClaw with local LLMs via Ollama, LM Studio, vLLM, or any OpenAI-compatible server — zero API costs, full privacy
keywords: [openclaw, openclaw local models, ollama, lm studio, vllm, run locally, free ai]
---

# Running with Local Models

OpenClaw can run entirely offline using local LLMs, eliminating API costs and keeping all data on your machine. It supports seven categories of local model providers, all connecting through the same Gateway.

---

## Supported Local Backends

| Backend | Default URL | Best For | Setup |
|---------|------------|----------|-------|
| **LM Studio** (recommended) | `http://localhost:1234/v1` | Quick start, GUI-based model management | Low |
| **Ollama** | `http://127.0.0.1:11434` | CLI-first, auto-discovery, consumer hardware | Low |
| **vLLM** | `http://127.0.0.1:8000/v1` | Production, GPU clusters, tensor parallelism | Medium |
| **SGLang** | `http://127.0.0.1:30000/v1` | High-throughput serving, RadixAttention | Medium |
| **MLX** | Varies | Apple Silicon optimized | Medium |
| **LiteLLM** | Varies | Unified proxy across 100+ providers | Medium |
| **Custom** | Any URL | Any OpenAI-compatible server | Medium |

All local providers are bundled as plugins and require a dummy API key for auto-discovery (e.g., `VLLM_API_KEY='vllm-local'`).

:::info
**LM Studio** is the recommended local stack — it provides a GUI for model management, uses the Responses API, and has the best out-of-the-box experience with OpenClaw.
:::

---

## Setup with LM Studio

### Install and Configure

1. Download [LM Studio](https://lmstudio.ai/) and install
2. Download a model (Qwen3 32B recommended for best balance)
3. Start the local server (it runs on port 1234 by default)

```json5 title="~/.openclaw/openclaw.json"
{
  "models": {
    "providers": {
      "lmstudio": {
        "baseUrl": "http://localhost:1234/v1",
        "apiKey": "lm-studio-local",
        "api": "openai-completions",
        "models": {
          "qwen3-32b": {
            "contextWindow": 32768,
            "maxTokens": 4096
          }
        }
      }
    }
  }
}
```

---

## Setup with Ollama

### Install Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | bash

# Pull recommended models
ollama pull qwen3:32b       # Best balance of quality and speed
ollama pull qwen3:14b       # Good for most tasks, less RAM
ollama pull llama3.3:70b    # Best quality (needs 40GB+ VRAM)
```

### Configure OpenClaw

OpenClaw supports three Ollama operating modes:

| Mode | Description | When To Use |
|------|------------|-------------|
| **Cloud + Local** | Both cloud and Ollama models available | Default — best flexibility |
| **Cloud only** | Ollama disabled | When you don't need local |
| **Local only** | Cloud providers disabled | Air-gapped / privacy-first |

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "local",
    "local": {
      "endpoint": "http://localhost:11434",
      "model": "qwen3:32b",
      "type": "ollama"
    }
  }
}
```

Restart the gateway:

```bash
openclaw gateway restart
```

### Auto-Discovery

OpenClaw auto-discovers installed Ollama models via `/api/tags` and detects capabilities via `/api/show`:

- **Vision models**: Detected automatically (e.g., `llava`, `moondream`)
- **Reasoning models**: Identified by name heuristics (`r1`, `reasoning`, `think`)
- **Context window**: Read from model metadata

### The /v1 Warning

:::danger
**Do NOT use Ollama's `/v1` OpenAI-compatible endpoint.** OpenClaw uses Ollama's native `/api/chat` endpoint instead because Ollama's `/v1` streaming implementation does not properly emit `tool_calls` delta chunks. This causes tool calls to silently fail — the model returns empty content with `finish_reason: 'stop'` instead of tool call payloads.

This bug affected Mistral Small 3.2 24B, Qwen 2.5 7B, Llama 3.1 8B, and others across versions v2026.1.29 through v2026.2.15, and was fixed by switching to the native Ollama endpoint after v2026.3.2. The underlying Ollama `/v1` streaming limitation persists as of mid-2026.
:::

### Context Window Tuning

Ollama has two separate context window settings:

| Setting | Where | Purpose |
|---------|-------|---------|
| `contextWindow` | OpenClaw config | Controls how OpenClaw budgets context tokens |
| `params.num_ctx` | Ollama runtime | Controls how much context Ollama actually allocates |

Set both to match your needs:

```json5 title="~/.openclaw/openclaw.json"
{
  "models": {
    "providers": {
      "ollama": {
        "models": {
          "qwen3:32b": {
            "contextWindow": 32768,
            "params": {
              "num_ctx": 32768
            }
          }
        }
      }
    }
  }
}
```

### Runtime Parameters

Fine-tune Ollama inference behavior:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `temperature` | 0.7 | Randomness (0 = deterministic) |
| `top_p` | 0.9 | Nucleus sampling threshold |
| `top_k` | 40 | Top-K sampling |
| `min_p` | 0.0 | Minimum probability threshold |
| `num_predict` | -1 | Max tokens to generate (-1 = unlimited) |
| `num_batch` | 512 | Batch size for prompt processing |
| `num_thread` | auto | CPU threads for inference |
| `use_mmap` | true | Memory-map model files |
| `keep_alive` | 5m | How long to keep model loaded after last request |

```json5
{
  "models": {
    "providers": {
      "ollama": {
        "models": {
          "qwen3:32b": {
            "params": {
              "temperature": 0.7,
              "num_ctx": 32768,
              "keep_alive": "-1"
            }
          }
        }
      }
    }
  }
}
```

:::tip
Set `keep_alive` to `"-1"` to prevent Ollama from unloading the model between requests. This avoids cold-start delays on each heartbeat cycle.
:::

### Multiple Ollama Hosts

Run different models on different machines with custom provider IDs:

```json5 title="~/.openclaw/openclaw.json"
{
  "models": {
    "providers": {
      "ollama-fast": {
        "type": "ollama",
        "host": "http://gpu-server-1:11434",
        "models": {
          "gemma4:12b": { "contextWindow": 32768 }
        }
      },
      "ollama-large": {
        "type": "ollama",
        "host": "http://gpu-server-2:11434",
        "models": {
          "qwen3.5:27b": { "contextWindow": 65536 }
        }
      }
    }
  }
}
```

Each host has independent auth, timeout, and model configuration. You can set up fallback chains across hosts:

```json5
{
  "brain": {
    "model": "ollama-fast/gemma4:12b",
    "fallbacks": ["ollama-large/qwen3.5:27b"]
  }
}
```

---

## Setup with vLLM

vLLM is recommended for production with dedicated GPU hardware — it supports tensor parallelism, continuous batching, and PagedAttention for efficient memory use.

```bash
pip install vllm

# Single GPU
vllm serve meta-llama/Llama-3.1-70B-Instruct \
  --host 0.0.0.0 \
  --port 8000

# Multi-GPU (tensor parallelism)
vllm serve meta-llama/Llama-3.1-70B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --tensor-parallel-size 2
```

```json5 title="~/.openclaw/openclaw.json"
{
  "models": {
    "providers": {
      "vllm": {
        "baseUrl": "http://localhost:8000/v1",
        "apiKey": "vllm-local",
        "api": "openai-completions",
        "models": {
          "meta-llama/Llama-3.1-70B-Instruct": {
            "contextWindow": 131072,
            "maxTokens": 4096
          }
        }
      }
    }
  }
}
```

### vLLM vs Ollama

| Feature | Ollama | vLLM |
|---------|--------|------|
| Setup | One command | pip install + config |
| GUI | No | No |
| Multi-GPU | Limited | Full tensor parallelism |
| Batching | Sequential | Continuous batching |
| Memory | Standard | PagedAttention (efficient) |
| Quantization | GGUF (Q4/Q5/Q8) | AWQ, GPTQ, FP8 |
| Best for | Development, consumer hardware | Production, multi-user |

---

## Setup with SGLang

[SGLang](https://github.com/sgl-project/sglang) offers high-throughput serving with RadixAttention:

```bash
pip install sglang

python -m sglang.launch_server \
  --model meta-llama/Llama-3.1-70B-Instruct \
  --port 30000
```

```json5 title="~/.openclaw/openclaw.json"
{
  "models": {
    "providers": {
      "sglang": {
        "baseUrl": "http://localhost:30000/v1",
        "apiKey": "sglang-local",
        "api": "openai-completions"
      }
    }
  }
}
```

---

## Custom OpenAI-Compatible Providers

Any server that implements the OpenAI Chat Completions API works:

```json5 title="~/.openclaw/openclaw.json"
{
  "models": {
    "providers": {
      "my-local": {
        "baseUrl": "http://localhost:5000/v1",
        "apiKey": "dummy",
        "api": "openai-completions",
        "timeoutSeconds": 120,
        "models": {
          "my-model": {
            "contextWindow": 32768,
            "maxTokens": 8192
          }
        }
      }
    }
  }
}
```

:::caution
The `api` field is **mandatory**. Omitting it produces a vague error: `No API provider registered for api: undefined` — with no indication of which field is missing.
:::

### Compatibility Flags

Some local backends need compatibility adjustments:

| Flag | Purpose | When Needed |
|------|---------|-------------|
| `requiresStringContent: true` | Send message content as plain string, not content-part arrays | Servers that reject structured content |
| `strictMessageKeys: true` | Strip messages to `role` and `content` only | Servers that reject extra fields |
| `tool_choice: "required"` | Force tool use mode | Backends whose parser only works in forced mode |

```json5
{
  "models": {
    "providers": {
      "my-local": {
        "baseUrl": "http://localhost:5000/v1",
        "apiKey": "dummy",
        "api": "openai-completions",
        "requiresStringContent": true,
        "strictMessageKeys": true
      }
    }
  }
}
```

---

## The `models.providers` Config Structure

All local (and custom cloud) providers use the same JSON structure:

```json5 title="~/.openclaw/openclaw.json"
{
  "models": {
    "mode": "merge",
    "providers": {
      "provider-id": {
        "baseUrl": "http://...",
        "apiKey": "...",
        "api": "openai-completions",
        "timeoutSeconds": 120,
        "models": {
          "model-name": {
            "contextWindow": 200000,
            "maxTokens": 8192,
            "reasoning": false,
            "inputTypes": ["text"],
            "cost": { "input": 0, "output": 0 }
          }
        }
      }
    }
  }
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `baseUrl` | Provider-specific | API endpoint URL |
| `apiKey` | — | API key (use dummy value for local) |
| `api` | — | **Required.** `openai-completions` or `anthropic-messages` |
| `timeoutSeconds` | 60 | Request timeout |
| `models.*.contextWindow` | 200000 | Context window budget for OpenClaw |
| `models.*.maxTokens` | 8192 | Max output tokens |
| `models.*.reasoning` | false | Whether model supports extended thinking |
| `models.*.cost` | — | Token costs (for budget tracking) |

### Merge Mode

When adding local providers alongside cloud, use `models.mode: "merge"` to preserve hosted options:

```json5
{
  "models": {
    "mode": "merge",
    "providers": {
      "ollama": { ... }
    }
  }
}
```

Without merge mode, custom providers replace the defaults entirely.

---

## Hardware Requirements

| Model Size | RAM | GPU VRAM | Quality | Example Models |
|-----------|-----|----------|---------|----------------|
| 7-8B | 8 GB | 6 GB | Basic tasks, simple chat | Qwen3 8B, Llama 3.3 8B |
| 13-14B | 16 GB | 10 GB | Good general use | Qwen3 14B |
| 30-34B | 32 GB | 24 GB | Strong coding and reasoning | Qwen3 32B (Q4), DeepSeek-R1-Distill-32B |
| 70B | 64 GB | 40 GB+ | Near cloud-quality | Llama 3.3 70B |

### Quantization

Quantized models reduce VRAM requirements with minimal quality loss:

| Quantization | VRAM Savings | Quality Impact | Best For |
|-------------|-------------|----------------|----------|
| **Q4_K_M** | ~75% | Small loss on complex tasks | Consumer GPUs (8-16 GB) |
| **Q5_K_M** | ~65% | Minimal loss | Mid-range GPUs (16-24 GB) |
| **Q8_0** | ~50% | Negligible loss | High-end consumer (24 GB+) |
| **FP16** | 0% (baseline) | Full quality | Data center GPUs (40 GB+) |

```bash
# Pull a quantized model
ollama pull qwen3:32b-q4_K_M    # Fits in 24 GB VRAM
ollama pull qwen3:14b-q8_0      # Fits in 16 GB VRAM
```

### Apple Silicon

Apple Silicon Macs can run models using unified memory:

| Mac | Unified Memory | Recommended Model |
|-----|---------------|-------------------|
| M1/M2 (8 GB) | 8 GB | Qwen3 8B (Q4) |
| M1/M2 Pro (16 GB) | 16 GB | Qwen3 14B |
| M1/M2 Max (32 GB) | 32 GB | Qwen3 32B (Q4) |
| M2/M3/M4 Ultra (64-192 GB) | 64-192 GB | Llama 3.3 70B (FP16) |

:::tip
For Apple Silicon, **MLX** provides optimized inference. Ollama also uses Metal acceleration automatically on macOS.
:::

---

## Recommended Models for OpenClaw

### Tool-Use Capability

OpenClaw requires models that support function calling. Not all local models handle this well:

| Model | Tool Use | Coding | Reasoning | Notes |
|-------|----------|--------|-----------|-------|
| **Qwen3 32B** | Good | Excellent | Good | Best overall local model |
| **Qwen 2.5 Coder** | Good | Excellent | Good | Optimized for coding tasks |
| **DeepSeek-R1-Distill-32B** | Moderate | Good | Excellent | Best for reasoning-heavy tasks |
| **Llama 3.3 70B** | Good | Good | Good | Near cloud-quality, needs big GPU |
| **Mistral Small 3.2 24B** | Moderate | Good | Good | Good balance |
| **Gemma 4 12B** | Moderate | Good | Moderate | Lightweight option |

:::caution
Models smaller than ~14B parameters often struggle with complex multi-step tool calling. For reliable agent behavior with multiple tool calls, use 30B+ models or fall back to cloud providers.
:::

---

## Hybrid Mode

Use local models for cheap tasks and cloud models for complex ones:

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6"
  },
  "heartbeat": {
    "model": "ollama/qwen3:14b"
  },
  "agents": {
    "list": [
      {
        "id": "researcher",
        "model": "claude-opus-4-6"
      },
      {
        "id": "worker",
        "model": "ollama/qwen3:32b"
      }
    ]
  }
}
```

### Three Hybrid Strategies

| Strategy | Description | Config |
|----------|------------|--------|
| **Primary with fallbacks** | Cloud primary, local fallback when cloud is down | `brain.fallback` points to local |
| **Local-first** | Local primary, cloud safety net for complex tasks | `brain.provider: "local"` with cloud fallback |
| **Merge mode** | Both available, route by task | `models.mode: "merge"` |

---

## Performance Tips

1. **Keep the model loaded** — Set `keep_alive: "-1"` in Ollama to avoid cold-start delays
2. **Use GPU offloading** — Even partial GPU offload dramatically speeds inference
3. **Match model to task** — 8B for heartbeat, 32B+ for complex reasoning
4. **Monitor VRAM** — Watch for OOM errors with `nvidia-smi` or `ollama ps`
5. **Set timeouts** — Local inference can be slow; set `timeoutSeconds: 120` or higher
6. **Use quantization** — Q4_K_M fits most models in consumer VRAM with minimal quality loss
7. **Enable concurrent loading** — Set `OLLAMA_NUM_PARALLEL` for multiple simultaneous requests

```bash
# Environment variables for Ollama tuning
export OLLAMA_KEEP_ALIVE=-1           # Never unload models
export OLLAMA_NUM_PARALLEL=4          # Handle 4 concurrent requests
export OLLAMA_MAX_LOADED_MODELS=2     # Keep 2 models in memory
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Tool calls silently fail | Using Ollama's `/v1` endpoint | Ensure OpenClaw uses native `/api/chat` (default since v2026.3.2) |
| `No API provider registered for api: undefined` | Missing `api` field in config | Add `"api": "openai-completions"` to provider config |
| VRAM OOM | Model too large for GPU | Use a smaller quantization (Q4_K_M) or smaller model |
| Slow inference | CPU-only, no GPU offload | Enable GPU with `ollama run --gpu` or check CUDA drivers |
| Model not found | Model not pulled or wrong name | Run `ollama list` to check, `ollama pull model-name` |
| Empty responses | Context window mismatch | Set both `contextWindow` and `params.num_ctx` to match |
| Connection refused | Ollama not running | Start with `ollama serve` or check port |
| Timeout errors | Slow inference exceeding default | Increase `timeoutSeconds` to 120-300 |
| Fallback overwrites primary | Known bug (#47705) | Update to latest version, report if persists |

---

## Limitations

- Local models are generally less capable than Claude Opus or GPT-5 for complex tasks
- Complex multi-step reasoning may fail more often, especially with smaller models
- Browser automation skills may need cloud models for reliable tool calling
- Speed depends heavily on your hardware — expect 10-50 tokens/sec on consumer GPUs vs. 100+ from cloud APIs
- Some OpenAI-specific features (prompt caching, reasoning-compat payload shaping) are not available with custom providers

---

## See Also

- [Model Selection Guide](/guides/model-selection) — Choosing the right model for your use case and budget
- [Cloud GPU & Self-Hosted Models](/guides/cloud-gpu-models) — Run your own models on cloud GPUs (RunPod, Vast.ai)
- [Brain & Hands Architecture](/architecture/brain-and-hands) — How models are integrated
- [Cost Management](/guides/cost-management) — Monitoring and reducing API costs
- [Performance Tuning](/guides/performance-tuning) — Ollama optimization, quantization guidance
- [Privacy & Compliance](/guides/privacy-compliance) — Air-gapped deployments with local models
- [Configuration Reference](/reference/configuration) — All model settings
