---
sidebar_position: 3
title: Brain & Hands
description: How OpenClaw separates reasoning (LLM) from execution (shell, files, browser) — model routing, prompt assembly, tool permissions, and sandboxing
---

# Brain & Hands

OpenClaw separates AI reasoning from system execution into two distinct layers. The **Brain** (LLM) decides what to do; the **Hands** (execution environment) carry it out. The Brain never directly touches the filesystem or network — it requests actions from the Hands via a structured tool-call protocol.

---

## The Brain (Reasoning Engine)

The Brain is the LLM that interprets requests, reasons about them, and decides on a plan of action.

### Supported Providers

| Provider | Models | Config Key | Cost Range |
|----------|--------|------------|------------|
| **Anthropic** | Claude Opus 4.6, Sonnet 4.5, Haiku 4.5 | `anthropic` | $0.25-$75/M tokens |
| **OpenAI** | GPT-5.3-Codex, GPT-4o | `openai` | $2.50-$60/M tokens |
| **Google** | Gemini 2.5 Flash, Gemini 2.5 Pro | `google` | $0.20-$15/M tokens |
| **xAI** | Grok | `xai` | $5-$25/M tokens |
| **OpenRouter** | 200+ models via single API | `openrouter` | Varies |
| **DeepSeek** | DeepSeek V3, R1 | `deepseek` | $0.27-$2.19/M tokens |
| **Local** | Any model via Ollama or vLLM | `local` | $0 |

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-opus-4-6",
    "api_key": "${ANTHROPIC_API_KEY}",
    "temperature": 0.7,
    "max_tokens": 4096,
    "fallback": {
      "provider": "openai",
      "model": "gpt-4o"
    }
  }
}
```

### How the Brain Works

1. **Receives** a message (from user, channel, or heartbeat)
2. **Loads** relevant memory via hybrid search
3. **Assembles** the prompt (SOUL.md + memory + skills + history + message)
4. **Generates** a plan (internal chain-of-thought)
5. **Outputs** either a response, one or more tool calls, or both
6. **Loops** — if tool calls were made, results feed back for another reasoning pass

### Prompt Assembly Pipeline

Each LLM call assembles context from multiple layers:

```
┌─────────────────────────────────────────────┐
│  SOUL.md (identity, personality, rules)     │  ← Always loaded
├─────────────────────────────────────────────┤
│  AGENTS.md + TOOLS.md (instructions)        │  ← Per-agent
├─────────────────────────────────────────────┤
│  Memory (hybrid search results)             │  ← Up to max_context_tokens
├─────────────────────────────────────────────┤
│  Active skill instructions (triggered)      │  ← 0-N skills
├─────────────────────────────────────────────┤
│  Conversation history                       │  ← Session context
├─────────────────────────────────────────────┤
│  <<<EXTERNAL_UNTRUSTED_CONTENT>>>           │
│  Channel message (with boundary markers)    │  ← The actual input
│  <<</EXTERNAL_UNTRUSTED_CONTENT>>>          │
└─────────────────────────────────────────────┘
```

External messages are wrapped in `EXTERNAL_UNTRUSTED_CONTENT` boundary markers with `Source: External` metadata to defend against prompt injection.

### Model Routing

Route different tasks to different models based on complexity and cost:

| Task | Recommended Model | Why |
|------|------------------|-----|
| Heartbeat checks | Haiku 4.5 ($0.25/$1.25/M) | Simple decisions, runs frequently |
| Chat responses | Sonnet 4.5 ($3/$15/M) | Good balance of quality and cost |
| Complex reasoning | Opus 4.6 ($15/$75/M) | Maximum capability |
| Sub-agent workers | Sonnet or Haiku | Cheaper for parallelized tasks |
| Privacy-sensitive | Local (Ollama/vLLM) | Nothing leaves your machine |

Configure per-task models:

```json5
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6"
  },
  "heartbeat": {
    "model": "claude-haiku-4-5-20251001"
  },
  "agents": {
    "list": [
      { "id": "researcher", "model": "claude-opus-4-6" },
      { "id": "worker", "model": "claude-haiku-4-5-20251001" }
    ]
  }
}
```

### Provider Fallback

If the primary provider is down or rate-limited, the Brain falls back:

```json5
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "fallback": {
      "provider": "openai",
      "model": "gpt-4o"
    }
  }
}
```

### Bootstrap Context (Per-Session Scoping)

In multi-agent setups, sub-agents don't need the full context of the lead agent. Per-session scoping (v2026.5.22+) loads only **AGENTS.md + TOOLS.md** for sub-agents instead of the full SOUL.md + memory stack, significantly reducing token cost.

```json5
{
  "agents": {
    "defaults": {
      "bootstrap": "scoped"
    }
  }
}
```

See [Multi-Agent Workflows](/guides/multi-agent) and [Performance Tuning](/guides/performance-tuning) for details.

---

## The Hands (Execution Environment)

The Hands execute what the Brain decides to do.

### Capabilities

| Hand | Description | Examples |
|------|-------------|---------|
| **Shell** | Execute terminal commands | `ls`, `git`, `python`, `curl`, `docker` |
| **Filesystem** | Read/write/modify files | Create configs, edit code, manage logs |
| **Browser** | Chromium automation (Playwright) | Fill forms, scrape pages, take screenshots |
| **HTTP** | Make API requests | REST calls, webhook delivery, API integration |

### Tool-Call Protocol

The Brain and Hands communicate through structured JSON:

```json
// Brain requests action
{
  "type": "tool_call",
  "tool": "shell",
  "args": {
    "command": "git status",
    "cwd": "/home/user/project"
  }
}

// Hands return result
{
  "type": "tool_result",
  "tool": "shell",
  "output": "On branch main\nnothing to commit, working tree clean",
  "exit_code": 0
}
```

The Brain can chain multiple tool calls, analyzing each result before deciding the next step. This loop continues until the Brain produces a final text response.

### Execution Approval

Before executing commands, the Exec Approval Manager presents them for approval:

1. Brain emits a `tool_call` with the command
2. Gateway creates an `exec.approval.request` with canonical argv, cwd, and rawCommand
3. User sees the exact command and approves or denies
4. Only after approval does the command execute

Configure approval behavior:

| Policy | Behavior |
|--------|----------|
| `always` | Every command requires approval |
| `on-miss` | Approve only commands not in the allowlist |
| `off` | Auto-approve everything (dangerous) |

---

## Tool Permissions

### Named Profiles

Pre-built permission sets for common use cases:

| Profile | Shell | Filesystem | Browser | HTTP | Best For |
|---------|-------|-----------|---------|------|----------|
| **minimal** | ✗ | Read only | ✗ | ✗ | Information lookup |
| **coding** | ✓ | Read/write | ✗ | ✓ | Software development |
| **messaging** | ✗ | ✗ | ✗ | ✓ | Chat-only bots |
| **full** | ✓ | Read/write | ✓ | ✓ | Full automation |

### Tool Groups

Configure deny lists by group:

| Group | Tools | Purpose |
|-------|-------|---------|
| `group:automation` | heartbeat_respond, cron, gateway | Block autonomous actions |
| `group:runtime` | exec, process, code_execution | Block command execution |
| `group:fs` | read, write, edit, apply_patch | Block file operations |

### Shell Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "hands": {
    "shell": {
      "enabled": true,
      "timeout": 30000,
      "blocked_commands": [
        "rm -rf /",
        "shutdown",
        "reboot",
        "mkfs",
        "dd",
        "chmod 777"
      ]
    }
  }
}
```

### Browser Configuration

```json5
{
  "hands": {
    "browser": {
      "enabled": true,
      "headless": true,
      "timeout": 60000,
      "allowed_domains": [],
      "blocked_domains": ["internal.company.com"]
    }
  }
}
```

:::tip
Set `headless: false` during development to watch the browser in action.
:::

---

## Sandboxing

For production deployments, isolate the Hands in a container:

### Docker Sandbox

```json5 title="~/.openclaw/openclaw.json"
{
  "hands": {
    "sandbox": {
      "enabled": true,
      "type": "docker",
      "image": "openclaw/sandbox:latest",
      "network": false,
      "writable_paths": [
        "~/.openclaw/memory",
        "/tmp/openclaw"
      ]
    }
  }
}
```

### Sandbox Scope

| Scope | Behavior |
|-------|----------|
| **agent** | One container per agent (default) |
| **session** | One container per session (more isolated) |
| **shared** | One container for all agents (less isolated) |

### Sandbox Modes

| Mode | Behavior |
|------|----------|
| **off** | No sandboxing |
| **non-main** | Sandbox sub-agents only, main agent runs on host |
| **all** | Sandbox everything including the main agent |

### Workspace Access

| Level | Behavior |
|-------|----------|
| **none** | No workspace access |
| **ro** | Read-only workspace |
| **rw** | Read-write workspace |

### Security Note

A TOCTOU (time-of-check-to-time-of-use) vulnerability in file sandbox validation was discovered by Snyk Labs and patched in v2026.3.31 (GHSA-9p3r-hh9g-5cmg, CVSS 9.4). The fix moved file operations inside the Docker container rather than validating paths on the host. Always run the latest version.

---

## Cost Considerations

Token costs are the primary ongoing expense:

| Component | Typical Daily Cost (Opus) | Cost (Haiku) | Cost (Local) |
|-----------|--------------------------|-------------|-------------|
| Heartbeat (48 cycles/day) | $10-20 | $1-3 | $0 |
| Chat (moderate use) | $5-15 | $1-5 | $0 |
| Skills (triggered) | $2-10 | $0.50-2 | $0 |
| Multi-agent (if used) | $20-50+ | $5-15 | $0 |

See [Performance Tuning](/guides/performance-tuning) for techniques that have cut costs by 97%.

---

## See Also

- [Architecture Overview](/architecture/overview) — High-level component diagram
- [Model Selection](/guides/model-selection) — Choosing the right LLM provider
- [Local Models](/guides/local-models) — Run without API costs
- [Performance Tuning](/guides/performance-tuning) — Token optimization and cost reduction
- [Security Hardening](/security/hardening) — Restricting execution capabilities
- [Configuration Reference](/reference/configuration) — All brain/hands settings
