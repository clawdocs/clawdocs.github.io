---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Running with Local Models
sidebar_label: Local Models
description: Run OpenClaw with local LLMs via llama.cpp, Ollama, LM Studio, vLLM, SGLang or any OpenAI-compatible server, with zero API costs and full privacy
keywords: [openclaw, openclaw local models, ollama, lm studio, vllm, llama.cpp, run locally, free ai]
---

# Running with Local Models

OpenClaw can run entirely on your own hardware. You either let OpenClaw install and manage a local model server, or point it at a server you already run. Both routes end up as an entry under `models.providers` plus a model ref such as `ollama/qwen3:32b` in `agents.defaults.model`.

The official reference is [Local models](https://docs.openclaw.ai/gateway/local-models). This page summarises it, adds tested config, and covers the mistakes people actually make.

:::warning Config is strict
OpenClaw validates `openclaw.json` against a strict schema. An unknown key or a wrong shape (for example `models` written as an object instead of an array) stops the Gateway from starting. Run `openclaw config validate` after every edit.
:::

:::danger Local models have no hosted safety filters
Hosted providers run their own safety classifiers; a local model does not. Smaller models are also easier to steer with prompt injection. Keep tool approvals and sandboxing appropriate for the model you run. See [Security Hardening](/security/hardening).
:::

---

## Supported Local Backends

| Backend | Default URL | Best For | `api` value |
|---------|------------|----------|-------------|
| **llama.cpp (managed)** | Chosen by setup (loopback) | Hardware-aware model choice; OpenClaw installs and runs the server | set by setup |
| **LM Studio** | `http://127.0.0.1:1234/v1` | GUI model management, first-time setup | `openai-responses` |
| **Ollama** | `http://127.0.0.1:11434` (no `/v1`) | CLI-first, model library, auto-discovery | `ollama` |
| **vLLM** | `http://127.0.0.1:8000/v1` | Production, GPU clusters, tensor parallelism | `openai-completions` |
| **SGLang** | `http://127.0.0.1:30000/v1` | High-throughput serving, RadixAttention | `openai-completions` |
| **MLX** (`mlx_lm.server`, oMLX) | Varies | Apple Silicon | `openai-completions` |
| **LiteLLM** / other proxies | Varies | Fronting another API as OpenAI | `openai-completions` |
| **Custom** | Any URL | Any OpenAI-compatible server | `openai-completions` (default) |

Upstream also documents [ds4](https://docs.openclaw.ai/providers/ds4) (local DeepSeek V4 Flash on macOS Metal) and [llmman](https://docs.openclaw.ai/providers/llmman) (OCI-registry model pulls, hybrid local + hosted routing).

If you omit `api` on a custom provider with a `baseUrl`, OpenClaw defaults to `openai-completions`. Use `openai-responses` only when the server supports `/v1/responses` (LM Studio does).

Credentials: vLLM and SGLang auto-discovery is opt-in with `VLLM_API_KEY` / `SGLANG_API_KEY` (any non-empty value if the server has no auth). For loopback, LAN, `.local` or bare-hostname URLs, a non-secret marker such as `apiKey: "ollama-local"` is accepted as a valid local credential. Public hosts need a real key.

:::warning WSL2 + Ollama + NVIDIA
The official Ollama Linux installer enables a systemd service with `Restart=always`. On WSL2 GPU setups, autostart can reload the last model during boot, pin host memory and send the VM into a restart loop. See [Ollama troubleshooting](https://docs.openclaw.ai/providers/ollama/troubleshooting).
:::

---

## Managed llama.cpp (Hardware-Aware Setup)

This is upstream's first recommendation for a new local setup. Install the official plugin and run onboarding:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
openclaw onboard
# choose: Managed local server
```

Setup checks RAM, GPU memory and disk, shows the model, download size and execution backend before downloading, installs a pinned `llama-server`, and verifies a real tool call before it changes your default model. Models are referenced as `llama-cpp/<model>`. See the [llama.cpp provider](https://docs.openclaw.ai/plugins/llama-cpp) page for the current recipe catalog (its curated recipes use a 64K context; the smallest has an 8 GiB host-memory floor).

### Start a local server only when needed (`localService`)

Any provider can carry a `localService` block. When a request selects that provider, OpenClaw polls `healthUrl`, starts `command` if the server is down, waits for readiness, and (with `idleStopMs`) stops it again after it has been idle. The managed llama.cpp setup writes this block for you. A hand-written example for vLLM:

```json5 title="~/.openclaw/openclaw.json"
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "vllm-local",
        api: "openai-completions",
        localService: {
          command: "/usr/local/bin/vllm",
          args: ["serve", "Qwen/Qwen3-32B", "--port", "8000"],
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 1800000,
        },
        models: [{ id: "Qwen/Qwen3-32B", name: "Qwen3 32B", contextWindow: 32768 }],
      },
    },
  },
}
```

OpenClaw does not install a daemon for this; the server is a child process of the OpenClaw process that first needed it. Details: [Local model services](https://docs.openclaw.ai/gateway/local-model-services).

---

## Setup with LM Studio

1. Install [LM Studio](https://lmstudio.ai/) (desktop) or the headless `llmster` daemon.
2. Download a model that fits your hardware; prefer the largest build you can run over heavily quantized "small" variants.
3. Start the server (`lms server start --port 1234`) and check that `http://127.0.0.1:1234/v1/models` lists the model.
4. Run `openclaw onboard` and choose LM Studio, or configure it by hand:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/qwen3-32b" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "qwen3-32b",
            name: "Qwen3 32B (LM Studio)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

Replace `qwen3-32b` with the exact model ID LM Studio shows. The `id` is provider-local: never include the `lmstudio/` prefix inside `models[].id`. The Responses API keeps reasoning separate from final text, which matters on channels like WhatsApp. Upstream's [LM Studio provider page](https://docs.openclaw.ai/providers/lmstudio) also shows `openai-completions` examples; both work.

---

## Setup with Ollama

### Install Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull qwen3:32b       # Good balance of quality and speed (24 GB VRAM at Q4)
ollama pull qwen3:14b       # Good for most tasks, less memory
ollama pull llama3.3:70b    # Highest quality here (needs 40 GB+ VRAM)
```

### Ollama Setups

| Setup | What it uses |
|-------|--------------|
| **Cloud + Local** | A reachable Ollama host serving local models and, if you are signed in to Ollama, `:cloud` models |
| **Local only** | A reachable Ollama host, local models only |
| **Ollama Cloud** | `https://ollama.com` directly through the separate `ollama-cloud` provider, no local daemon |

`openclaw onboard` offers all three. Hosted-only access uses `ollama-cloud/<model>` refs and needs a real `OLLAMA_API_KEY`; see [Ollama Cloud](https://docs.openclaw.ai/providers/ollama-cloud).

### Configure OpenClaw

The simplest route is implicit discovery: `export OLLAMA_API_KEY="ollama-local"` and OpenClaw discovers whatever is installed on `http://127.0.0.1:11434`. To pin a host, model settings or a default model, write the provider explicitly:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: { primary: "ollama/qwen3:32b" },
    },
  },
  models: {
    providers: {
      ollama: {
        baseUrl: "http://127.0.0.1:11434", // native API: no /v1
        apiKey: "ollama-local",
        api: "ollama",
        timeoutSeconds: 300,
        models: [
          {
            id: "qwen3:32b",
            name: "qwen3:32b",
            params: { num_ctx: 32768, keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

In 2026.10.4 a non-empty `models` list selects those models and skips discovery; use `models: []` on an explicit self-hosted endpoint to keep discovery on. (After 2026.10.4, listed models keep their settings and other installed models are still discovered beside them.) Then apply the change:

```bash
openclaw config validate
openclaw gateway restart
openclaw models list --provider ollama
```

### Auto-Discovery

OpenClaw lists installed models via `/api/tags` and reads capabilities via `/api/show`:

- **Vision models**: detected from the model's reported capabilities
- **Reasoning models**: detected from the `thinking` capability first; name heuristics are only a fallback
- **Context window**: read from model metadata, including `PARAMETER num_ctx` in custom Modelfiles

See [Ollama model discovery](https://docs.openclaw.ai/providers/ollama/model-discovery).

### The /v1 Warning

:::danger
**Do not use Ollama's `/v1` OpenAI-compatible URL** (`http://host:11434/v1`). OpenClaw talks to Ollama's native `/api/chat`. The `/v1` path selects OpenAI-compatible mode, where streaming does not reliably emit tool-call deltas: tool calls silently fail or show up as raw JSON text. Use `baseUrl: "http://host:11434"` with `api: "ollama"`.
:::

### Context Window Tuning

Ollama has separate context settings, and they do different jobs:

| Setting | Where | Purpose |
|---------|-------|---------|
| `contextWindow` | `models[]` entry | Declares the model's native window to OpenClaw |
| `contextTokens` | `models[]` entry | Caps the input OpenClaw actually sends (the effective budget) |
| `params.num_ctx` | `models[].params` | Sent to Ollama as `options.num_ctx`: how much context Ollama allocates |

On the native API, OpenClaw sends `num_ctx` from a positive `params.num_ctx` first, then from `contextTokens`. Discovery normally caps `contextTokens` at 32,768. If neither is set, Ollama picks its own default, which can be much smaller than you expect and silently truncate prompts. For OpenAI-compatible Ollama routes, OpenClaw injects `options.num_ctx` too; set `injectNumCtxForOpenAICompat: false` on the provider if the upstream rejects it. Details: [Ollama advanced configuration](https://docs.openclaw.ai/providers/ollama/advanced).

```json5 title="~/.openclaw/openclaw.json"
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://127.0.0.1:11434",
        api: "ollama",
        models: [
          {
            id: "qwen3:32b",
            name: "qwen3:32b",
            contextWindow: 32768,
            contextTokens: 32768,
            params: { num_ctx: 32768 },
          },
        ],
      },
    },
  },
}
```

### Runtime Parameters

These Ollama options are forwarded from `models[].params` as native `/api/chat` options. The defaults shown are Ollama's, not OpenClaw's.

| Parameter | Ollama default | Description |
|-----------|---------|-------------|
| `temperature` | 0.8 | Randomness (0 = deterministic) |
| `top_p` | 0.9 | Nucleus sampling threshold |
| `top_k` | 40 | Top-K sampling |
| `min_p` | 0.0 | Minimum probability threshold |
| `num_predict` | -1 | Max tokens to generate (-1 = unlimited) |
| `num_batch` | 512 | Batch size for prompt processing |
| `num_thread` | auto | CPU threads for inference |
| `num_gpu` | auto | Layers to offload to the GPU |
| `use_mmap` | true | Memory-map model files |
| `keep_alive` | 5m | How long the model stays loaded (sent as a top-level request field) |

```json5 title="~/.openclaw/openclaw.json"
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://127.0.0.1:11434",
        api: "ollama",
        models: [
          {
            id: "qwen3:32b",
            name: "qwen3:32b",
            params: { temperature: 0.7, num_ctx: 32768, keep_alive: "-1" },
          },
        ],
      },
    },
  },
}
```

:::tip
`keep_alive: "-1"` keeps the model loaded indefinitely, which avoids a cold load on every heartbeat or after a quiet spell. Upstream's examples use `"15m"`, which frees VRAM sooner.
:::

### Multiple Ollama Hosts

Give each host its own provider ID with `api: "ollama"`. Each provider has its own base URL, auth, timeout and model list:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: {
        primary: "ollama-fast/gemma4:12b",
        fallbacks: ["ollama-large/qwen3.5:27b"],
      },
    },
  },
  models: {
    providers: {
      "ollama-fast": {
        baseUrl: "http://gpu-server-1:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [{ id: "gemma4:12b", name: "gemma4:12b", contextWindow: 32768 }],
      },
      "ollama-large": {
        baseUrl: "http://gpu-server-2:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", contextWindow: 65536 }],
      },
    },
  },
}
```

Fallbacks switch models per turn on provider errors. Sub-agents resolve the `ollama-local` marker through the Ollama provider, so they can use these hosts too. To run Ollama on a paired node instead of the Gateway host, see [node-local inference](https://docs.openclaw.ai/providers/ollama/node-local-inference).

---

## Setup with vLLM

vLLM suits dedicated GPU hardware: tensor parallelism, continuous batching and PagedAttention.

```bash
pip install vllm

# One 80 GB GPU: a 32B model in BF16, or a 70B model quantized (AWQ/FP8)
vllm serve Qwen/Qwen3-32B --host 127.0.0.1 --port 8000

# Multi-GPU (tensor parallelism) for a 70B model in BF16
vllm serve meta-llama/Llama-3.1-70B-Instruct \
  --host 127.0.0.1 \
  --port 8000 \
  --tensor-parallel-size 2
```

A 70B model at 16-bit needs about 140 GB for weights alone, so it does not fit on a single 80 GB GPU. Bind to `127.0.0.1` unless OpenClaw runs on another machine; if it does, start vLLM with `--api-key` and put TLS in front.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: { primary: "vllm/meta-llama/Llama-3.1-70B-Instruct" },
    },
  },
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "meta-llama/Llama-3.1-70B-Instruct",
            name: "Llama 3.1 70B",
            contextWindow: 131072,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

If you define `models.providers.vllm` explicitly, OpenClaw uses only the models you list. Add `"vllm/*": {}` to `agents.defaults.models` to also include everything the server advertises at `/v1/models`. See [vLLM](https://docs.openclaw.ai/providers/vllm).

### vLLM vs Ollama

| Feature | Ollama | vLLM |
|---------|--------|------|
| Setup | One command | pip install + config |
| GUI | No | No |
| Multi-GPU | Limited | Full tensor parallelism |
| Batching | Limited parallel requests | Continuous batching |
| Memory | Standard | PagedAttention (efficient) |
| Quantization | GGUF (Q4/Q5/Q8) | AWQ, GPTQ, FP8 |
| Best for | Development, consumer hardware | Production, multi-user |

---

## Setup with SGLang

[SGLang](https://github.com/sgl-project/sglang) offers high-throughput serving with RadixAttention:

```bash
pip install sglang

python -m sglang.launch_server \
  --model-path Qwen/Qwen3-32B \
  --host 127.0.0.1 \
  --port 30000
```

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: { primary: "sglang/Qwen/Qwen3-32B" },
    },
  },
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "Qwen/Qwen3-32B",
            name: "Qwen3 32B (SGLang)",
            contextWindow: 32768,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

As with vLLM, an explicit provider uses only the models you list; add `"sglang/*": {}` to `agents.defaults.models` to keep discovery. See [SGLang](https://docs.openclaw.ai/providers/sglang).

---

## Custom OpenAI-Compatible Providers

Any server that implements the OpenAI Chat Completions API works. The wizard can do this for you: `openclaw onboard`, choose **Custom Provider** (under **More…** when shown), and enter the endpoint compatibility, base URL, optional API key and model ID; setup verifies a real model reply before saving. By hand:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: { primary: "my-local/my-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "my-local": {
        baseUrl: "http://127.0.0.1:5000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-model",
            name: "My Local Model",
            contextWindow: 32768,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Custom providers must declare `baseUrl` and `models`. `api` is optional and defaults to `openai-completions`.

### Compatibility Flags

Some backends need adjustments. The flags live on each model entry under `compat`, not on the provider:

| Setting | Purpose | When Needed |
|------|---------|-------------|
| `models[].compat.requiresStringContent: true` | Send message content as a plain string, not content-part arrays | Servers that reject structured content |
| `models[].compat.strictMessageKeys: true` | Strip messages to `role` and `content` only | Servers that reject extra fields |
| `agents.defaults.models["<ref>"].params.extra_body.tool_choice: "required"` | Force tool use | Backends whose tool parser only works in forced mode |

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      models: {
        "my-local/my-model": {
          params: { extra_body: { tool_choice: "required" } },
        },
      },
    },
  },
  models: {
    providers: {
      "my-local": {
        baseUrl: "http://127.0.0.1:5000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        models: [
          {
            id: "my-model",
            name: "My Local Model",
            compat: { requiresStringContent: true, strictMessageKeys: true },
          },
        ],
      },
    },
  },
}
```

Only force `tool_choice` when every normal turn should call a tool. First check that the server's chat template and parser support tool calls at all.

---

## The `models.providers` Config Structure

All local (and custom cloud) providers share one shape. `models` is an **array** of model entries:

```json5 title="~/.openclaw/openclaw.json"
{
  models: {
    mode: "merge",
    providers: {
      "provider-id": {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 120,
        models: [
          {
            id: "model-name",
            name: "Model Name",
            contextWindow: 200000,
            maxTokens: 8192,
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          },
        ],
      },
    },
  },
}
```

| Field | Description |
|-------|-------------|
| `baseUrl` | API endpoint URL (Ollama native: no `/v1`; OpenAI-compatible servers: usually ends in `/v1`) |
| `apiKey` | API key, a `${ENV_VAR}` reference, or a local marker for loopback/LAN hosts |
| `api` | One of `openai-completions` (default for custom providers), `openai-responses`, `ollama`, `anthropic-messages`, `google-generative-ai`, and others (see the [config reference](https://docs.openclaw.ai/gateway/config-tools)) |
| `timeoutSeconds` | Provider request timeout: connect, headers and streaming. Raise it for slow local models before raising `agents.defaults.timeoutSeconds` |
| `localService` | Optional on-demand server start (see above) |
| `models[].id` | Provider-local model ID (no provider prefix) |
| `models[].name` | Display name |
| `models[].contextWindow` | Native context window; OpenClaw's default is 200,000 when unknown |
| `models[].contextTokens` | Effective input cap |
| `models[].maxTokens` | Max output tokens |
| `models[].reasoning` | Whether the model supports thinking |
| `models[].input` | `["text"]` or `["text", "image"]` for vision models |
| `models[].cost` | Per-million-token `input`, `output`, `cacheRead`, `cacheWrite` used for cost estimates |
| `models[].compat` | Compatibility flags (see above) |

### Merge Mode

`models.mode` is `"merge"` by default: your providers are added to the bundled catalog, so hosted models stay available as fallbacks. Set `mode: "replace"` only if you want your providers to replace the bundled catalog.

---

## Hardware Requirements

Memory needs depend on the weights, the context size, the runtime and whatever else runs on the host. A model that answers a short prompt can still fail a full agent turn, which carries the system prompt, tools and history. Test real tasks before making a model your default.

| Model Size | RAM | GPU VRAM (Q4) | Quality | Example Models |
|-----------|-----|----------|---------|----------------|
| 7-9B | 8 GB | 6 GB | Basic tasks, simple chat | Qwen3 8B, Llama 3.1 8B |
| 13-14B | 16 GB | 10 GB | Good general use | Qwen3 14B |
| 27-35B | 32 GB | 20-24 GB | Strong coding and reasoning | Qwen3 32B, Qwen3.5 27B, DeepSeek-R1-Distill-Qwen-32B |
| 70B | 64 GB | 40 GB+ | Closest to hosted quality | Llama 3.3 70B |

### Quantization

Savings below are relative to FP16:

| Quantization | VRAM Savings | Quality Impact | Best For |
|-------------|-------------|----------------|----------|
| **Q4_K_M** | ~70-75% | Small loss on complex tasks | Consumer GPUs (8-16 GB) |
| **Q5_K_M** | ~65% | Minimal loss | Mid-range GPUs (16-24 GB) |
| **Q8_0** | ~50% | Negligible loss | High-end consumer (24 GB+) |
| **FP16 / BF16** | 0% (baseline) | Full quality | Data center GPUs (40 GB+) |

```bash
# Pull a quantized model
ollama pull qwen3:32b-q4_K_M    # Fits in 24 GB VRAM
ollama pull qwen3:14b-q8_0      # Fits in 16 GB VRAM
```

### Apple Silicon

Apple Silicon Macs run models from unified memory:

| Mac | Unified Memory | Suggested Model |
|-----|---------------|-------------------|
| M-series (8 GB) | 8 GB | Qwen3 8B (Q4) |
| M-series Pro (16-18 GB) | 16-18 GB | Qwen3 14B (Q4) |
| M-series Max (32-48 GB) | 32-48 GB | Qwen3 32B (Q4) |
| M-series Ultra / Max (64-192 GB) | 64-192 GB | Llama 3.3 70B (Q4 or Q8) |

:::tip
On Apple Silicon, **MLX** (`mlx_lm.server`, or oMLX as a custom OpenAI-compatible provider) is usually the fastest runtime. A dedicated [oMLX provider](https://docs.openclaw.ai/providers/omlx) arrives after 2026.10.4. Ollama and LM Studio use Metal acceleration automatically.
:::

---

## Recommended Models for OpenClaw

### Tool-Use Capability

OpenClaw needs models that handle function calling. Not all local models do this well:

| Model | Tool Use | Coding | Reasoning | Notes |
|-------|----------|--------|-----------|-------|
| **Qwen3 32B / Qwen3.5 27B-35B** | Good | Excellent | Good | Strong all-round local choice |
| **Qwen 2.5 Coder 32B** | Good | Excellent | Good | Coding-focused |
| **DeepSeek-R1-Distill-Qwen-32B** | Moderate | Good | Excellent | Reasoning-heavy tasks |
| **Llama 3.3 70B** | Good | Good | Good | Needs a big GPU |
| **Mistral Small 3.2 24B** | Moderate | Good | Good | Good balance |
| **Gemma 4 12B** | Moderate | Good | Moderate | Lightweight option |

These ratings are community experience, not benchmarks. The [llama.cpp recipe catalog](https://docs.openclaw.ai/plugins/llama-cpp) is the maintained reference in 2026.10.4; upstream adds a [recommended models](https://docs.openclaw.ai/concepts/recommended-models) page after that release.

:::caution
Models smaller than about 14B parameters often struggle with multi-step tool calling. For reliable agent behaviour, use 30B+ models or keep a hosted model as a fallback.
:::

---

## Hybrid Mode

Use local models for cheap, frequent work and a hosted model for hard tasks:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-5-5",
        fallbacks: ["ollama/qwen3:32b"],
      },
      heartbeat: {
        every: "1h",
        model: "ollama/qwen3:14b",
        isolatedSession: true,
        lightContext: true,
      },
    },
    ownership: "explicit", // required once you define more than one agent
    entries: {
      researcher: { model: "anthropic/claude-opus-5-5" },
      worker: { model: "ollama/qwen3:32b" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ollama: {
        baseUrl: "http://127.0.0.1:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          { id: "qwen3:32b", name: "qwen3:32b", params: { num_ctx: 32768 } },
          { id: "qwen3:14b", name: "qwen3:14b", params: { num_ctx: 16384 } },
        ],
      },
    },
  },
}
```

With two or more agents, `agents.ownership: "explicit"` is required and channels need `bindings` (or an `agentId`) to reach a specific agent; see [agent config](https://docs.openclaw.ai/gateway/config-agents). A heartbeat on a local model costs nothing per token. For what a heartbeat costs on hosted models, see [Cost Management](./cost-management.md#heartbeat-costs).

### Three Hybrid Strategies

| Strategy | Description | Config |
|----------|------------|--------|
| **Hosted primary, local fallback** | Local model takes over when the hosted provider errors | `agents.defaults.model.fallbacks: ["ollama/..."]` |
| **Local-first** | Local primary, hosted safety net | `primary: "ollama/..."`, hosted ref in `fallbacks` |
| **Route by task** | Different models per agent or job | `agents.entries.<id>.model`, `heartbeat.model` |

Keep `models.mode` at its `merge` default so both catalogs stay available. Fallbacks switch per turn on errors; they do not route by prompt size. For size-based routing see [llmman hybrid inference](https://docs.openclaw.ai/providers/llmman).

---

## Performance Tips

1. **Keep the model loaded**: set `keep_alive` (`"15m"` or `"-1"`) to avoid cold loads
2. **Use GPU offloading**: even partial offload speeds inference a lot (`num_gpu`)
3. **Match model to task**: a small model for heartbeats, 32B+ for complex reasoning
4. **Watch VRAM**: `nvidia-smi` or `ollama ps`
5. **Set timeouts**: local inference can be slow; set the provider's `timeoutSeconds` to 300 or more
6. **Use quantization**: Q4_K_M fits most models in consumer VRAM with small quality loss
7. **Allow parallel requests**: Ollama's `OLLAMA_NUM_PARALLEL`

```bash
# Ollama server environment variables
export OLLAMA_KEEP_ALIVE=-1           # Never unload models
export OLLAMA_NUM_PARALLEL=4          # Handle 4 concurrent requests
export OLLAMA_MAX_LOADED_MODELS=2     # Keep 2 models in memory
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Tool calls fail or print as raw JSON | `baseUrl` ends in `/v1` for Ollama | Use `http://host:11434` with `api: "ollama"` |
| Gateway refuses to start after an edit | Unknown key or wrong shape (e.g. `models` as an object) | `openclaw config validate`; `models` must be an array |
| VRAM OOM | Model too large for GPU | Smaller quantization (Q4_K_M) or smaller model |
| Slow inference | CPU-only, no GPU offload | Check CUDA/ROCm drivers and `ollama ps`; set `num_gpu` |
| Model not found | Model not pulled, wrong name, or prefix inside `models[].id` | `ollama list`; use the bare ID in `models[].id` and `provider/id` in refs |
| Truncated or empty responses | Ollama allocated less context than the prompt | Set `params.num_ctx` (and `contextTokens`) |
| Connection refused | Server not running, or bound to another interface | Start it (`ollama serve`) and check host/port |
| Timeout errors | Slow inference | Raise the provider's `timeoutSeconds` to 300+ |
| WSL2 VM restarts repeatedly | Ollama systemd autostart loading a GPU model at boot | See the WSL2 warning above |

---

## Limitations

- Local models are generally less capable than frontier hosted models on complex tasks
- Multi-step reasoning fails more often, especially with smaller models
- Browser automation and long tool chains may need a hosted model for reliable tool calling
- Speed depends heavily on hardware; expect roughly 10-50 tokens/sec on consumer GPUs
- On OpenAI-compatible proxy routes, OpenAI-only request shaping (`service_tier`, Responses `store`, prompt-cache hints) does not apply. Anthropic prompt caching (`cacheRetention`) does work on custom `anthropic-messages` endpoints when set explicitly

---

## See Also

- [Model Selection Guide](/guides/model-selection): choosing a model for your use case and budget
- [Cloud GPU & Self-Hosted Models](/guides/cloud-gpu-models): run your own models on rented GPUs
- [Brain & Hands Architecture](/architecture/brain-and-hands): how models are integrated
- [Cost Management](/guides/cost-management): monitoring and reducing API costs
- [Performance Tuning](/guides/performance-tuning): latency and resource tuning
- [Privacy & Compliance](/guides/privacy-compliance): air-gapped deployments with local models
- [Configuration Reference](/reference/configuration): all model settings
- Upstream: [Local models](https://docs.openclaw.ai/gateway/local-models), [Ollama](https://docs.openclaw.ai/providers/ollama), [Local model services](https://docs.openclaw.ai/gateway/local-model-services)
