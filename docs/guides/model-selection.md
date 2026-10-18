---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Model Selection Guide
description: Which LLM to use with OpenClaw, by use case, budget and hardware, with current model refs, dated prices and routing config that validates
keywords: [openclaw, openclaw model, which model, claude vs gpt, model comparison, cheapest model]
---

# Model Selection Guide

OpenClaw is model-agnostic. It ships provider plugins for the major cloud APIs, for OpenRouter and other aggregators, and for local servers such as Ollama, llama.cpp, LM Studio and vLLM. This page helps you choose a model and configure routing. Upstream keeps the authoritative per-provider pages under [Providers](https://docs.openclaw.ai/providers), and the model config reference at [Models](https://docs.openclaw.ai/concepts/models).

Model refs are always `provider/model`, for example `anthropic/claude-sonnet-5-5`. To see what your credentials can use, run `openclaw models list` (configured models) or `openclaw models list --all` (full catalog).

:::tip Prices change
Prices below are per million input/output tokens, **as of 2026-10-18**. Anthropic prices are from [Anthropic's pricing page](https://platform.claude.com/docs/en/about-claude/pricing). Where no source is given, check the provider's pricing page before you rely on a number.
:::

---

## Quick pick

| Your priority | Model ref | Price (in / out) |
|---|---|---|
| Most capable | `anthropic/claude-fable-5-1` | $10 / $50 |
| Best default for agent work | `anthropic/claude-opus-5-5` (fresh Anthropic setups pick this) | $4 / $20 |
| Balance of cost and quality | `anthropic/claude-sonnet-5-5` | $2 / $10 |
| Cheap and fast | `anthropic/claude-haiku-5-5` | $0.10 / $0.50 up to 100K-token prompts; $0.50 / $2.50 above |
| OpenAI default | `openai/gpt-6-astra` (also the built-in fallback when no model is configured) | See [OpenAI pricing](https://openai.com/api/pricing/) |
| Google default | `google/gemini-4-argon` | See [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Budget cloud | `deepseek/deepseek-flash` (V4.1 Flash) | About $0.30 / $1.20 at peak hours (OpenClaw's bundled estimate) |
| Free, local | `ollama/qwen3:32b` or similar | $0 per token, your hardware |
| One key for many providers | `openrouter/auto` | Pass-through pricing |

---

## Recently added model support

From the release notes ([CHANGELOG](https://github.com/openclaw/openclaw/tree/main/CHANGELOG), [releases](https://docs.openclaw.ai/releases)):

| Version | Added |
|---|---|
| v2026.6.6 | Claude Fable 5; OpenRouter OAuth onboarding |
| v2026.6.7 | Kimi K2.7 Code |
| v2026.6.8 | GLM-5.2 |
| v2026.6.11 | Gemini 3.5 Flash; Ollama Cloud `glm-5.2:cloud` |
| v2026.7.1 | Claude Sonnet 5 and Claude Mythos 5 (limited access); OpenAI GPT-5.6 family; bundled ClawRouter provider |
| v2026.9.1 | Claude Fable 5.1 |
| v2026.9.2 | OpenAI GPT-6 Astra |
| v2026.9.6 | Claude Opus 5.5; GPT-6 Sol and Luna; Grok 4.7 |
| v2026.9.7 | Claude Sonnet 5.5 (the `sonnet` alias now selects it) |
| v2026.9.9 | GPT-6.1 Sol; Claude Haiku 5.5 |

Retired or hidden upstream, so do not configure them for new setups: DeepSeek `deepseek-chat` and `deepseek-reasoner` (retired by DeepSeek on 2026-07-24), Gemini 3 Pro Preview (retired 2026-03-09), and GPT-4o/GPT-4.1 (hidden from the picker, still selectable by exact ref). Claude 4.x models still work but cost more than their 5.5 successors.

---

## By use case

### Heartbeat and background work

The heartbeat is a scheduled agent turn, every 30 minutes by default. Run it on a cheap model and keep its context small. [Cost Management](./cost-management.md#heartbeat-costs) has the cost formula and worked numbers for each model.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      heartbeat: {
        every: "1h",
        model: "anthropic/claude-haiku-5-5",
        isolatedSession: true,
        lightContext: true,
      },
      // Short internal tasks: titles, narration, recaps, summaries
      utilityModel: "anthropic/claude-haiku-5-5",
    },
  },
}
```

### Complex reasoning, planning and coding

| Model ref | Notes | Price (in / out) |
|---|---|---|
| `anthropic/claude-fable-5-1` | Most capable Claude. Long turns on hard tasks. | $10 / $50 |
| `anthropic/claude-opus-5-5` | Strong default for agent and coding work. Thinking is always on; use `/think low` to reduce it. | $4 / $20 |
| `openai/gpt-6.1-sol` | OpenAI's top tier. Reasoning cannot be disabled. | See OpenAI pricing |
| `anthropic/claude-sonnet-5-5` | Most coding at half the Opus price | $2 / $10 |
| `deepseek/deepseek-v4-pro` | DeepSeek's onboarding default | See [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing) |

### General chat and daily tasks

| Model ref | Notes |
|---|---|
| `anthropic/claude-sonnet-5-5` | Good quality per dollar |
| `anthropic/claude-haiku-5-5` | Cheapest Claude. Text and image input, 1M context. |
| `openai/gpt-6-luna` | Lower-cost GPT-6 tier; check your account's catalog |
| `google/gemini-3.8-flash` | Google's bundled Flash model (alias `gemini-flash`) |
| `deepseek/deepseek-flash` | Budget option |

### Long context

Current Claude models (Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5) and Opus/Sonnet 4.6 and later have a 1M-token context window; Haiku 4.5 has 200K. `google/gemini-4-argon` has 1,048,576 tokens and DeepSeek V4 models 1M. A large window is not free: every token you send is billed, so keep sessions compact either way.

### Tool use (agent workloads)

OpenClaw relies on reliable function calling with streamed tool-call deltas and well-formed JSON arguments.

| Model class | Tool-use reliability |
|---|---|
| Current Claude, GPT-6 and Gemini models | Reliable |
| DeepSeek V4 | Good |
| Local 30B+ models (Qwen3 32B, Llama 3.3 70B) | Good, with enough context (`num_ctx`) configured |
| Local models under ~14B | Often fail multi-step tool chains |

:::caution
Local models smaller than about 14B parameters often struggle with multi-step tool calling. For reliable agent behaviour, use 30B+ local models or a cloud model. Small local models are also easier to manipulate with prompt injection, so keep approvals on for tools that act on your system ([Hardening](/security/hardening)).
:::

---

## By budget

### $0 per token (local only)

Run models on your own hardware with Ollama, llama.cpp, LM Studio, vLLM or SGLang. No API key is needed.

| VRAM | Example model | Quality |
|---|---|---|
| 8 GB | Qwen3 8B, Llama 3.1 8B | Basic tasks |
| 12-16 GB | Qwen3 14B | Good for most tasks |
| 24 GB | Qwen3 32B (Q4_K_M) | A capable daily driver |
| 48-80 GB | Llama 3.3 70B (quantized) | Close to cloud quality |

```json5 title="~/.openclaw/openclaw.json"
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://127.0.0.1:11434",
        api: "ollama",
        apiKey: "ollama-local",
        models: [
          { id: "qwen3:32b", name: "qwen3:32b", params: { num_ctx: 32768 } },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "ollama/qwen3:32b" },
    },
  },
}
```

The [Local Models guide](/guides/local-models) covers setup, the `/v1` pitfall and `num_ctx`.

### Budget cloud

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: {
        primary: "deepseek/deepseek-flash",
        fallbacks: ["anthropic/claude-haiku-5-5"],
      },
    },
  },
}
```

### Premium cloud

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-5-5",
        fallbacks: ["anthropic/claude-sonnet-5-5"],
      },
      heartbeat: { model: "anthropic/claude-haiku-5-5" },
      utilityModel: "anthropic/claude-haiku-5-5",
    },
  },
}
```

### Hybrid: cloud primary, local fallback

```json5 title="~/.openclaw/openclaw.json"
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://127.0.0.1:11434",
        api: "ollama",
        apiKey: "ollama-local",
        models: [
          { id: "qwen3:32b", name: "qwen3:32b", params: { num_ctx: 32768 } },
          { id: "qwen3:14b", name: "qwen3:14b", params: { num_ctx: 32768 } },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-5-5",
        fallbacks: ["ollama/qwen3:32b"],
      },
      heartbeat: { model: "ollama/qwen3:14b" },
    },
  },
}
```

---

## Model Routing

OpenClaw picks a model in this order: the primary, then each fallback in order. Inside one provider, it rotates auth profiles before moving to the next fallback ([selection order](https://docs.openclaw.ai/concepts/models)).

### Where each model is set

| Config key | Controls |
|---|---|
| `agents.defaults.model.primary` | Default chat and agent model. A fresh Anthropic setup picks `anthropic/claude-opus-5-5`; with no model configured the built-in fallback is `openai/gpt-6-astra`. |
| `agents.defaults.model.fallbacks` | Ordered list tried when the primary fails |
| `agents.defaults.heartbeat.model` | Heartbeat turns |
| `agents.defaults.utilityModel` | Short internal tasks (titles, narration, recaps, summaries) |
| `agents.defaults.imageModel` | Used only when the primary cannot accept images |
| `agents.entries.<id>.model` | Per-agent override |

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    // Required once you define more than one agent
    ownership: "explicit",
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-5-5",
        fallbacks: ["openai/gpt-6-astra", "deepseek/deepseek-flash"],
      },
      heartbeat: { model: "anthropic/claude-haiku-5-5" },
    },
    entries: {
      main: {},
      researcher: { model: "anthropic/claude-opus-5-5" },
      worker: { model: "anthropic/claude-haiku-5-5" },
    },
  },
}
```

`agents.list` is rejected in current releases. If an older config has it, `openclaw doctor --fix` migrates it to `agents.entries`.

### From the CLI and chat

```bash
openclaw models set anthropic/claude-sonnet-5-5
openclaw models fallbacks add openai/gpt-6-astra
openclaw models fallbacks list
openclaw models status
```

In chat, `/model` shows or switches the session's model. Choosing a model other than the default pins it to that session and turns off fallback for it; `/model default` clears the pin ([selection rules](https://docs.openclaw.ai/concepts/models#selection-source-and-fallback-strictness)).

### Restricting which models can be used

`agents.defaults.modelPolicy.allow` is an optional allowlist of exact refs or trailing wildcards such as `anthropic/*`. Leave it unset to allow any model.

### Adding providers: merge vs replace

Custom providers under `models.providers` are merged with the built-in catalog by default. Set `models.mode: "replace"` only if you want pickers to list nothing but your own providers' `models` arrays. Each custom provider needs a `baseUrl` and a `models` array of `{ id, name, ... }` objects. A map keyed by model name is rejected.

---

## Provider comparison

### Cloud providers

| Provider | Current refs | Context | Pricing |
|---|---|---|---|
| Anthropic | `claude-fable-5-1`, `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5` | 1M | $0.10 / $0.50 (Haiku 5.5) to $10 / $50 (Fable 5.1), [source](https://platform.claude.com/docs/en/about-claude/pricing) |
| OpenAI | `gpt-6-astra`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-6-luna`, `gpt-5.6-*` | Varies by model | [openai.com/api/pricing](https://openai.com/api/pricing/) |
| Google | `gemini-4-argon`, `gemini-3.8-flash` | 1,048,576 (Argon) | [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| DeepSeek | `deepseek-v4-pro`, `deepseek-v4-flash`, `deepseek-flash` | 1M | [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing) |
| xAI | `grok-4.7` and earlier 4.x | Varies | [xAI pricing](https://docs.x.ai/docs/models) |
| OpenRouter | `openrouter/auto` or `openrouter/<author>/<slug>` | Varies | Pass-through, [openrouter.ai/models](https://openrouter.ai/models) |

Provider setup pages: [Anthropic](https://docs.openclaw.ai/providers/anthropic), [OpenAI](https://docs.openclaw.ai/providers/openai/models), [Google](https://docs.openclaw.ai/providers/google), [DeepSeek](https://docs.openclaw.ai/providers/deepseek), [xAI](https://docs.openclaw.ai/providers/xai), [OpenRouter](https://docs.openclaw.ai/providers/openrouter).

### Local providers

| Provider | Setup | Best for |
|---|---|---|
| llama.cpp (managed) | `openclaw onboard`, then "Managed local server" | A hardware-aware default that OpenClaw starts for you |
| Ollama | One installer | CLI users; auto-discovery of pulled models |
| LM Studio | Desktop app | Beginners; a GUI |
| vLLM | `pip install vllm` | Production, multi-GPU throughput |
| SGLang | `pip install sglang` | High throughput |

---

## OpenRouter

[OpenRouter](https://openrouter.ai) gives one API key for many providers. Onboarding defaults to `openrouter/auto`, which lets OpenRouter pick a model per request. Use `openrouter/<author>/<slug>` for a specific model; `openclaw models list --provider openrouter` shows what is available.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

### Provider routing

OpenRouter's `provider` routing object goes under `models.providers.openrouter.params.provider`, and OpenClaw forwards it unchanged. Fields use OpenRouter's snake_case names: `sort`, `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`, `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`, `preferred_min_throughput`, `zdr` and `enforce_distillable_text`.

```json5 title="~/.openclaw/openclaw.json"
{
  models: {
    providers: {
      openrouter: {
        params: {
          provider: {
            sort: "price",
            require_parameters: true,
            data_collection: "deny",
          },
        },
      },
    },
  },
}
```

A per-model override goes in `agents.defaults.models["openrouter/<author>/<slug>"].params.provider`. Routing params apply only on OpenRouter routes ([OpenRouter provider](https://docs.openclaw.ai/providers/openrouter)).

---

## Cost tips

1. Put heartbeats and `utilityModel` on a cheap model, and make heartbeats lean with `isolatedSession` and `lightContext`.
2. Use Opus or Fable only where they earn their price; Sonnet 5.5 or Haiku 5.5 cover most routine work.
3. Lower thinking effort for routine turns (`agents.defaults.thinkingDefault`, or `/think low`).
4. Keep sessions short with `/new` and `/compact`.
5. Set spend limits at the provider. OpenClaw has no built-in spend cap.

[Cost Management](/guides/cost-management) has the full method and settings.

---

## Known issues

| Issue | Status |
|---|---|
| Ollama through its OpenAI-compatible `/v1` URL breaks tool calls | Use the native URL without `/v1` and `api: "ollama"` ([Ollama provider](https://docs.openclaw.ai/providers/ollama)) |
| Fallback overwrote the primary model in config ([#47705](https://github.com/openclaw/openclaw/issues/47705)) | Closed as fixed. Update to a current release. |
| Missing `api` on a custom provider ([#6054](https://github.com/openclaw/openclaw/issues/6054)) | Obsolete: `api` now defaults to `openai-completions` when a `baseUrl` is set |
| Slow local models time out | Set `timeoutSeconds` on the provider, for example `300` |

---

## See also

- [Local Models](/guides/local-models): Ollama, llama.cpp, LM Studio and vLLM setup
- [Cloud GPU Models](/guides/cloud-gpu-models): self-hosted models on rented GPUs
- [Cost Management](/guides/cost-management): estimating and reducing spend
- [Performance Tuning](/guides/performance-tuning): latency and resource tuning
- [Privacy & Compliance](/guides/privacy-compliance): data residency and air-gapped operation
- [Brain & Hands Architecture](/architecture/brain-and-hands): provider integration internals
- [Configuration Reference](/reference/configuration)
