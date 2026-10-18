---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Agent Runtime and Tools
sidebar_label: Agent Runtime & Tools
description: How an OpenClaw agent turn works — the agent loop and models (the "brain"), tools, exec approvals, sandboxing and nodes (the "hands") — mapped onto upstream's real config keys
keywords: [openclaw, agent loop, agent runtime, llm integration, tools, exec approvals, model fallbacks, sandboxing, nodes]
---

# Agent Runtime and Tools

:::note
"Brain and hands" was this site's old analogy for models and tools. There is no `brain` or `hands` config key; this page uses OpenClaw's own terms.
:::

In one sentence: the agent loop sends the assembled prompt to a model, the model answers with text and/or tool calls, OpenClaw runs the tools (subject to tool policy, approvals and the sandbox), and feeds the results back until the model gives a final reply.

Official references: [Agent loop](https://docs.openclaw.ai/concepts/agent-loop), [Tools](https://docs.openclaw.ai/tools), [Exec](https://docs.openclaw.ai/tools/exec), [Sandboxing](https://docs.openclaw.ai/gateway/sandboxing), [Nodes](https://docs.openclaw.ai/nodes).

---

## The agent loop

For each turn, the Gateway:

1. Resolves the agent and session, and queues the run on that session's lane (one run per session at a time).
2. Resolves the model and auth profile, loads the skills snapshot, and resolves the workspace (or a sandbox workspace).
3. Builds the system prompt from the base prompt, skills, workspace bootstrap files (`AGENTS.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`, `MEMORY.md`), and per-run overrides.
4. Calls the model and streams assistant and tool events to clients.
5. Validates each tool call against the tool's schema, applies policy, runs it, and returns the result to the model. Steps 4 and 5 repeat until the model stops.
6. Persists the transcript to the agent's SQLite database.

Tool calls use the provider's native tool-use format. OpenClaw does not have its own `{"type":"tool_call"}` envelope. Untrusted tool and channel content is wrapped in `EXTERNAL_UNTRUSTED_CONTENT` boundary markers before the model sees it.

From the CLI, `openclaw agent --message "..."` runs one turn through the Gateway, and `openclaw chat` opens the local terminal UI.

What goes into the prompt, and the bootstrap size limits, are on [Architecture Overview](/architecture/overview#what-goes-into-the-prompt).

---

## Models

Model refs are always `provider/model`. The default depends on how you onboard: a fresh Anthropic setup picks `anthropic/claude-opus-5-5`, and with no model configured at all the built-in fallback is `openai/gpt-6-astra`.

Current Anthropic refs include `anthropic/claude-opus-5-5`, `anthropic/claude-sonnet-5-5`, `anthropic/claude-haiku-5-5` and `anthropic/claude-fable-5-1` ([Anthropic provider](https://docs.openclaw.ai/providers/anthropic)). Other providers include `openai`, `google`, `xai`, `openrouter`, `deepseek`, and local servers such as `ollama`, `vllm` and `lmstudio`. There is no generic `local` provider for chat models.

### Primary model and fallbacks

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-5-5",
        fallbacks: ["anthropic/claude-sonnet-5-5", "openai/gpt-6-astra"],
      },
    },
  },
}
```

If the primary model fails (outage, rate limit, auth error), OpenClaw tries the fallbacks in order ([Model failover](https://docs.openclaw.ai/concepts/model-failover)). Or set them from the CLI:

```bash
openclaw models set anthropic/claude-opus-5-5
openclaw models fallbacks add anthropic/claude-sonnet-5-5
openclaw models status
```

API keys do not go in this block. Put them in `~/.openclaw/.env` (for example `ANTHROPIC_API_KEY=...`), let onboarding store an auth profile, or use `models.providers.<id>.apiKey` with a SecretRef. See [Environment Variables](/reference/environment-variables).

### Different models per job

Use a cheaper model for scheduled heartbeats, and per-agent models in a multi-agent roster. A roster with more than one agent needs `agents.ownership: "explicit"`. Agents are keyed under `agents.entries.<id>`; the old `agents.list` array is migrated by `openclaw doctor --fix`.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: {
      model: { primary: "anthropic/claude-sonnet-5-5" },
      heartbeat: { every: "1h", model: "anthropic/claude-haiku-5-5" },
    },
    entries: {
      main: {},
      researcher: { model: "anthropic/claude-opus-5-5" },
      worker: { model: "anthropic/claude-haiku-5-5" },
    },
  },
}
```

Model prices change often, so this page does not list them. Check your provider's pricing page and track real spend with `openclaw status --usage` and `openclaw gateway usage-cost`. See [Model Selection](/guides/model-selection) and [Performance Tuning](/guides/performance-tuning).

---

## Tools

Tools are what the agent can do. The main built-in ones:

| Tool | What it does |
|------|--------------|
| `exec` (alias `bash`), `process` | Run shell commands on the Gateway host, a sandbox, or a node |
| `read`, `write`, `edit`, `apply_patch` | File operations |
| `browser` | Drive OpenClaw's managed Chrome/Chromium |
| `web_search`, `web_fetch` | Search and fetch web pages |
| `memory_search`, `memory_get` | Retrieve memory |
| `message`, `sessions_*`, `subagents` | Messaging and multi-session work |
| `cron` / `automations`, `gateway` | Scheduling and Gateway self-management |
| `nodes`, `computer` | Commands on paired devices |

Plugins and MCP servers (`mcp.servers`) add more tools. See the [tool list](https://docs.openclaw.ai/tools).

### Profiles and groups

`tools.profile` selects a base set:

| Profile | Includes |
|---------|----------|
| `minimal` | `session_status`, and `gateway` (update only). No filesystem, no shell. |
| `coding` | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, media tools, and others |
| `messaging` | `group:messaging` plus session and subagent tools |
| `full` | No core filtering, and opts into optional plugin tools |

An unset profile leaves core tools unfiltered. `tools.allow`, `tools.alsoAllow` and `tools.deny` adjust the set, and accept groups:

| Group | Tools |
|-------|-------|
| `group:runtime` | `exec`, `process`, `code_execution` |
| `group:fs` | `read`, `write`, `edit`, `apply_patch` |
| `group:web` | `web_search`, `x_search`, `web_fetch` |
| `group:ui` | `browser`, `screen`, `canvas`, and other UI tools |
| `group:automation` | `heartbeat_respond`, `automations` (`cron`), `gateway`, `plugins`, `openclaw` |

Full tables: [Tool policy](https://docs.openclaw.ai/gateway/config-tools/tool-policy).

```json5 title="~/.openclaw/openclaw.json"
{
  tools: {
    profile: "coding",
    deny: ["group:automation", "browser"],
  },
}
```

### Exec approvals

`tools.exec.mode` decides what happens when the agent runs a host command:

| Mode | Behavior |
|------|----------|
| `deny` | Exec is denied |
| `allowlist` | Only allowlisted and safe-bin commands run; nothing is asked |
| `ask` | Allowlisted commands run; everything else asks a human |
| `auto` | Allowlisted commands run; other commands go to a reviewer model, which allows, denies, or asks a human |
| `full` | **Default.** Runs host commands with no approval prompts |

When a command needs approval, the Gateway creates an approval record with the exact argv and cwd, and the CLI, Control UI or apps resolve it. The older `tools.exec.security` / `tools.exec.ask` fields (`always`, `on-miss`, `off`) are legacy and derived from the mode.

```bash
openclaw config set tools.exec.mode ask
openclaw approvals get
openclaw approvals allowlist add --help
```

A denylist of "dangerous commands" is not a real defense, and OpenClaw has no `blocked_commands` key. Use `ask` or `allowlist`, `tools.deny`, and the sandbox. See [Exec approvals](https://docs.openclaw.ai/tools/exec-approvals).

### Browser

The browser is configured at the top level under `browser`, not under tools. Navigation goes through an SSRF policy that blocks private networks by default. `blockedHostnames` denies extra hosts. `allowedHostnames` is a narrow exception for trusted private hosts, not an allowlist of the whole web.

```json5 title="~/.openclaw/openclaw.json"
{
  browser: {
    enabled: true,
    headless: true,
    ssrfPolicy: { blockedHostnames: ["internal.example.com", "*.corp.example.com"] },
  },
}
```

Set `headless: false` to watch the browser while you develop. See [Browser](https://docs.openclaw.ai/tools/browser).

---

## Sandboxing

Sandboxing runs tools in an isolated environment instead of on the Gateway host. **It is off by default.** Configure it under `agents.defaults.sandbox` (or per agent):

| Setting | Values | Default |
|---------|--------|---------|
| `mode` | `off`, `non-main`, `all` | `off` |
| `scope` | `agent`, `session`, `shared` | `agent` |
| `backend` | `docker`, `podman`, `ssh`, `openshell`, `crabbox` | `docker` |
| `workspaceAccess` | `none`, `ro`, `rw` | `none` |

- `non-main` sandboxes every session except the agent's main session (`agent:<id>:main`). Group and channel sessions have their own keys, so they are sandboxed.
- `all` sandboxes every session.
- The Docker backend defaults to a locally built `openclaw-sandbox:bookworm-slim` image with `network: "none"`, a read-only root, and all capabilities dropped.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        backend: "docker",
        workspaceAccess: "ro",
        docker: { network: "none" },
      },
    },
  },
}
```

Check what applies to a session with `openclaw sandbox explain`. See [Sandboxing](https://docs.openclaw.ai/gateway/sandboxing) and [Sandbox vs tool policy vs elevated](https://docs.openclaw.ai/gateway/sandbox-vs-tool-policy-vs-elevated).

:::warning
With the defaults (`tools.exec.mode: "full"`, sandbox `off`), anyone who can message the agent can get commands run on your host. Before you connect channels, set `tools.exec.mode` to `ask` or `allowlist`, restrict who can DM the bot, and consider `sandbox.mode: "non-main"`. See [Security Hardening](/security/hardening).
:::

---

## Nodes

A node is a paired companion device (macOS, iOS, Android, or a headless `openclaw node run` host) that connects to the Gateway with `role: "node"` and exposes commands such as `camera.*`, `screen.record`, `location.get` and `system.*`. The agent reaches them through the `nodes` tool, and `exec` can target a node with `host=node`. Nodes do not run a Gateway or receive channel messages.

```bash
openclaw nodes list
openclaw nodes describe --help
```

See [Nodes](https://docs.openclaw.ai/nodes).

---

## See also

- [Architecture Overview](/architecture/overview): component map
- [Model Selection](/guides/model-selection): choosing providers and models
- [Local Models](/guides/local-models): running models on your own hardware
- [Performance Tuning](/guides/performance-tuning): token and cost reduction
- [Security Hardening](/security/hardening): restricting execution
- [Configuration Reference](/reference/configuration): how the config file works
