---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Cost Management
description: What drives OpenClaw API spend, how to estimate it, and the settings and habits that cut it, for any model provider
keywords: [openclaw, openclaw cost, reduce cost, save money, api cost, token optimization, heartbeat cost]
---

# Cost Management

OpenClaw itself is free (MIT licence). What you pay for is model usage: every agent turn, heartbeat, utility task (titles, narration, recaps), embedding and paid tool call goes to a provider that bills per token or draws on a plan quota. This page explains where the tokens go, how to estimate a bill, and which settings reduce it. It is provider-neutral; prices below are examples.

:::warning OpenClaw has no built-in spend cap
There is no `daily_budget_usd` or `monthly_budget_usd` setting. The config schema is strict, so invented keys like these stop the Gateway from starting ([configuration](https://docs.openclaw.ai/gateway/configuration)). Set hard limits where billing happens: in your provider's console, on an OpenRouter or ClawRouter key, or by using a subscription plan with fixed quotas.
:::

## Where the money goes

| Spend | What it is | Main lever |
|---|---|---|
| Agent turns | Your messages and the tool loop that follows. Each request resends the system prompt, workspace bootstrap files, tool definitions and session history. | Model choice, `/compact`, `/new`, prompt caching |
| Heartbeats | Scheduled main-session turns, every `30m` by default (`1h` with Anthropic OAuth or Claude CLI auth) | `every`, `activeHours`, `isolatedSession`, `lightContext`, a cheaper `heartbeat.model` |
| Automations | Each cron/automation job is its own agent run | Job schedule and `--model` |
| Utility tasks | Session and thread titles, progress narration, Activity recaps | `agents.defaults.utilityModel` |
| Other paid features | Media understanding, image and video generation, memory embeddings, web search and fetch, speech | Turn off what you don't use |

Upstream lists every feature that can spend a key in [API usage and costs](https://docs.openclaw.ai/reference/api-usage-costs), and explains how the prompt is built in [Token use](https://docs.openclaw.ai/reference/token-use).

### Runaway patterns

| Cause | What happens |
|---|---|
| Context snowball | A long session grows, and every request carries all of it. Cost per turn rises steadily. |
| Tool loop | A failing tool appends its error, the model retries, and the history keeps growing. |
| Large tool output | A huge file listing or web page lands in context and is resent every iteration. |
| Expensive heartbeat | The main model with full context runs 48 times a day while nothing is happening. |
| High thinking effort everywhere | Reasoning tokens are billed as output. |

## Estimate before you pay

Use one formula for any provider:

```text
cost per request = (input_tokens x input_price + output_tokens x output_price) / 1,000,000
monthly cost     = cost per request x requests per day x 30
```

Cached input is billed at the provider's cache-read price instead of the full input price. Anthropic charges 0.1x the input price for cache reads on most models and 0.05x on Opus 5.5 and Sonnet 5.5.

### Model prices used on this page

Per million tokens (input / output), as of 2026-10-18, from [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing):

| Model | Ref | Input / output | Cache read |
|---|---|---|---|
| Claude Fable 5.1 | `anthropic/claude-fable-5-1` | $10 / $50 | $0.25 |
| Claude Opus 5.5 | `anthropic/claude-opus-5-5` | $4 / $20 | $0.20 |
| Claude Sonnet 5.5 | `anthropic/claude-sonnet-5-5` | $2 / $10 | $0.10 |
| Claude Haiku 5.5 (prompt up to 100K tokens) | `anthropic/claude-haiku-5-5` | $0.10 / $0.50 | $0.01 |
| Claude Haiku 5.5 (prompt over 100K tokens) | `anthropic/claude-haiku-5-5` | $0.50 / $2.50 | $0.05 |
| Legacy: Opus 4.6 to 4.8, Sonnet 4.6, Haiku 4.5 | | $5 / $25, $3 / $15, $1 / $5 | 0.1x input |

Other providers, per million tokens (input / output), as of 2026-10-18, from each provider's pricing page:

| Model | Ref | Input / output | Source |
|---|---|---|---|
| GPT-6 Astra | `openai/gpt-6-astra` | $10 / $50 | [OpenAI](https://developers.openai.com/api/docs/pricing), Standard tier, short-context rates |
| GPT-6.1 Sol | `openai/gpt-6.1-sol` | $2 / $10 | same |
| GPT-6 Luna | `openai/gpt-6-luna` | $0.10 / $0.50 | same |
| Gemini 3.1 Pro Preview (prompt up to 200K tokens) | `google/gemini-3.1-pro-preview` | $2 / $12 | [Google](https://ai.google.dev/gemini-api/docs/pricing), paid tier |
| Gemini 4 Argon (not in the 2026.10.4 catalog) | | $2 / $10 until 2026-11-30, then $4 / $20 | same |
| DeepSeek V4.1 Flash | `deepseek/deepseek-flash` | $0.30 / $1.20 at peak, $0.15 / $0.60 off-peak | [DeepSeek](https://api-docs.deepseek.com/quick_start/pricing), cache-miss input |
| DeepSeek V4 Pro | `deepseek/deepseek-v4-pro` | $1.32 / $3.96 at peak, $0.66 / $1.98 off-peak | same |

OpenAI charges more for long prompts (for example GPT-6.1 Sol $4 / $15). DeepSeek's peak hours are 01:00-04:00 and 06:00-10:00 UTC on weekdays. Two dated changes are worth knowing: Gemini 4 Argon, which the 2026.10.10 beta makes OpenClaw's default Gemini model, doubles in price on 2026-12-01; and DeepSeek bills its Search and Fetch APIs at $0.75 per 1,000 requests, which matters if DeepSeek serves your `web_search` (details in [Model Selection](/guides/model-selection#price-changes-ahead)). Local models cost nothing per token.

### Heartbeat costs {#heartbeat-costs}

This is the one heartbeat cost method used across clawdocs. Two scenarios:

- **Full context**: a heartbeat in the main session with history and bootstrap files. Assume 120K input tokens, 500 output tokens, no cache hits.
- **Lean**: `isolatedSession: true` and `lightContext: true`, so no conversation history and no workspace bootstrap files. Assume 10K input tokens, 500 output tokens.

The token counts are assumptions. Measure your own with `/usage full` on a heartbeat turn, then put your numbers into the formula.

| Model | Full context, per beat | Full, 30m (48/day) | Full, 1h (24/day) | Lean, per beat | Lean, 30m | Lean, 1h |
|---|---:|---:|---:|---:|---:|---:|
| Opus 5.5 | $0.490 | $705.60 | $352.80 | $0.050 | $72.00 | $36.00 |
| Sonnet 5.5 | $0.245 | $352.80 | $176.40 | $0.025 | $36.00 | $18.00 |
| Haiku 5.5 | $0.061 | $88.20 | $44.10 | $0.00125 | $1.80 | $0.90 |
| Local (Ollama, llama.cpp) | $0 | $0 | $0 | $0 | $0 | $0 |

Worked example, Opus 5.5 full context: (120,000 x $4 + 500 x $20) / 1,000,000 = $0.49 per beat; x 48 x 30 = $705.60 a month. Haiku 5.5 at 120K is above its 100K threshold, so the higher tier applies: (120,000 x $0.50 + 500 x $2.50) / 1,000,000 = $0.061.

Two things move these numbers more than the model does. Isolated, light-context heartbeats cut input by roughly 10x. Restricting `activeHours` to 14 hours a day removes about 42% of beats. If most of the prompt is a cache hit, the input cost falls further. The flip side: a heartbeat that fires after the cache has expired pays to rewrite it.

## Settings that reduce cost

Every block below passes `openclaw config validate` on 2026.10.4. Merge the parts you want into your config.

### 1. Route work to the right model

Keep a capable primary model, and send background work somewhere cheaper:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-5-5",
        fallbacks: ["anthropic/claude-haiku-5-5"],
      },
      // Short internal tasks: titles, progress narration, Activity recaps
      utilityModel: "anthropic/claude-haiku-5-5",
      heartbeat: {
        every: "1h",
        model: "anthropic/claude-haiku-5-5",
        isolatedSession: true,
        lightContext: true,
        activeHours: { start: "08:00", end: "22:00" },
      },
    },
  },
}
```

- `model.primary` and `model.fallbacks` select the chat model; fallbacks are tried in order ([Models](https://docs.openclaw.ai/concepts/models)).
- `utilityModel` handles short internal tasks. When unset, OpenClaw uses the primary provider's small-model default if it has one, otherwise the primary model.
- `heartbeat.model` runs heartbeats on a different model from chat. A local model works too, for example `"ollama/qwen3:14b"` once the Ollama provider is set up ([Local Models](/guides/local-models)).
- Per-agent overrides go under `agents.entries.<id>.model`, never `agents.list`.

You can make the same changes from the CLI:

```bash
openclaw models set anthropic/claude-sonnet-5-5
openclaw models fallbacks add anthropic/claude-haiku-5-5
openclaw config set agents.defaults.heartbeat.every '"1h"'
```

See the [Model Selection Guide](/guides/model-selection) for which models suit which tasks.

### 2. Tune the heartbeat

| Change | Effect on heartbeat spend |
|---|---|
| `every: "30m"` to `"1h"` | About -50% |
| `every: "30m"` to `"2h"` | About -75% |
| `activeHours` of 14h instead of 24h | About -42% |
| `isolatedSession: true` + `lightContext: true` | Roughly -90% in the scenarios above |
| Cheaper `heartbeat.model` | Proportional to the price difference |
| `every: "0m"` | Stops the recurring heartbeat. Event-driven wakes, such as a background command finishing, can still run a turn. |

Recurring checks (inbox, calendar, health pings) belong in [automations](https://docs.openclaw.ai/automation/cron-jobs), each with its own schedule and model, not in the heartbeat. The old `HEARTBEAT.md` file is retired; `openclaw doctor --fix` migrates it into the heartbeat monitor's scratch. See [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat).

### 3. Keep context small

| Habit | Why |
|---|---|
| `/new` or `/reset` when you change topic | Starts a session without the old history |
| `/compact` on long sessions | Summarises older messages |
| Opt into an automatic reset if you want one | The default is no automatic reset. Set `session.reset.mode` to `"daily"` (with `atHour`, default 4) or `"idle"` ([Sessions](https://docs.openclaw.ai/concepts/session)). |
| Trim tool output | Ask for summaries, not full dumps |
| Keep skill descriptions short | The skill list is injected into every prompt |

```json5 title="~/.openclaw/openclaw.json"
{
  session: {
    reset: { mode: "daily", atHour: 4 },
  },
}
```

### 4. Lower thinking effort for routine work

Reasoning tokens are billed as output. Set a lower default and raise it per message when needed with `/think high`:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      thinkingDefault: "low",
    },
  },
}
```

Claude Opus 5.5 always thinks: a stored `off` maps to `low` ([Anthropic provider](https://docs.openclaw.ai/providers/anthropic)). On other models `off` is available. See [Thinking levels](https://docs.openclaw.ai/tools/thinking).

### 5. Use prompt caching well

OpenClaw sets cache breakpoints for Anthropic and other providers that support caching. `cacheRetention` accepts `"none"`, `"short"` (the provider's default window, 5 minutes on Anthropic) or `"long"` (1 hour on Anthropic). Set it globally, per model, or per agent:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      params: { cacheRetention: "long" },
      // Keep the 1h cache warm across idle gaps
      heartbeat: { every: "55m" },
      // Drop old tool results once the cache has expired
      contextPruning: { mode: "cache-ttl", ttl: "1h" },
    },
  },
}
```

A 1-hour cache write costs more than a 5-minute one (2x input instead of 1.25x on Anthropic), so `"long"` pays off only when you come back within the hour. See [Prompt caching](https://docs.openclaw.ai/reference/prompt-caching).

### 6. Use a subscription you already have

| Plan | How OpenClaw uses it | Caveat |
|---|---|---|
| Claude Pro or Max | Claude CLI auth (`claude-cli/*` route), reusing your Claude Code login | Usage draws on your plan's limits, and Anthropic's terms for this can change. API-key billing is more predictable for shared automation ([Anthropic provider](https://docs.openclaw.ai/providers/anthropic)). |
| ChatGPT plans | Sign in with Codex OAuth (`openai/gpt-6-astra` by default) | An OpenAI API key is separate pay-as-you-go billing ([OpenAI models](https://docs.openclaw.ai/providers/openai/models)) |
| Google One AI plans | Not usable as Gemini API credit | Gemini API keys are billed separately |

## Track what you spend

| Where | What it shows |
|---|---|
| `/status` in chat | Session tokens and estimated cost (API-key models) |
| `/usage full` in chat | Usage footer on every reply |
| `/usage cost` in chat | Cost summary from OpenClaw's session logs |
| `openclaw gateway usage-cost --days 7` | The same summary from the CLI. Add `--all-agents` or `--agent <id>`, and `--json` for scripts. |
| `openclaw status --usage` | Provider-reported quota and usage snapshots |
| Control UI, **Usage** | Session-derived estimates, plus provider-reported spend when an admin key is set |

OpenClaw's own figures are estimates from session logs. For actual billing, set `ANTHROPIC_ADMIN_KEY` or `OPENAI_ADMIN_KEY`; the Control UI then shows 30 days of provider-reported cost alongside them ([Usage tracking](https://docs.openclaw.ai/concepts/usage-tracking)).

### Hard limits, at the provider

| Where | How |
|---|---|
| Anthropic Console | Workspace spend limits and alerts |
| OpenAI dashboard | Project budgets and usage alerts |
| OpenRouter | Per-key credit limits. Model ref `openrouter/auto` lets OpenRouter pick the model per prompt ([OpenRouter provider](https://docs.openclaw.ai/providers/openrouter)). |
| ClawRouter | Monthly budget per key, shown in `openclaw status --usage` ([ClawRouter](https://docs.openclaw.ai/providers/clawrouter)) |

### Community dashboards

These are third-party projects, not reviewed by clawdocs. Check what they read and where they send it before connecting them to your Gateway.

| Tool | What it does |
|---|---|
| [openclaw-dashboard](https://github.com/tugcantopaloglu/openclaw-dashboard) | Usage-limit notifications and cost analysis by model |
| [ClawWatcher](https://news.ycombinator.com/item?id=46954200) | Token usage and cost per model |
| [OpenClaw Cost Calculator](https://calculator.vlvt.sh/) | Pre-deployment estimates |

## Quick start: cut costs today

1. Run `/usage full` for a day and `openclaw gateway usage-cost --days 1` to see where tokens go.
2. Make heartbeats lean: `isolatedSession: true`, `lightContext: true`, `activeHours`, and `every: "1h"` or longer.
3. Put heartbeats and `utilityModel` on a cheap model (Haiku 5.5 or a local model).
4. Start new sessions with `/new` when the topic changes, and `/compact` long ones.
5. Lower `thinkingDefault` and raise it per message when needed.
6. Set a spend limit in your provider's console.

## See also

- [Model Selection](/guides/model-selection): which model for which task
- [Local Models](/guides/local-models): zero per-token cost
- [Cloud GPU & Self-Hosted Models](/guides/cloud-gpu-models): renting GPUs and inference APIs
- [Performance Tuning](/guides/performance-tuning): latency and resource tuning
- [Monitoring](/guides/monitoring): logs, health and metrics
