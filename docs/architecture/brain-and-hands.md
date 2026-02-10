---
sidebar_position: 3
title: Brain & Hands
description: How OpenClaw separates reasoning (LLM) from execution (shell, files, browser)
---

# Brain & Hands

OpenClaw separates AI reasoning from system execution into two distinct layers.

## The Brain (Reasoning Engine)

The Brain is the LLM that interprets requests and decides what to do.

### Supported Providers

| Provider | Models | Config Key |
|----------|--------|------------|
| **Anthropic** | Claude Opus 4.6, Sonnet 4.5, Haiku 4.5 | `anthropic` |
| **OpenAI** | GPT-5.3-Codex, GPT-4o | `openai` |
| **xAI** | Grok | `xai` |
| **Local** | Any model via Ollama or vLLM | `local` |

### Configuration

```yaml title="~/.openclaw/config.yml"
brain:
  provider: "anthropic"
  model: "claude-opus-4-6"
  api_key: "${ANTHROPIC_API_KEY}"  # Or set env var
  temperature: 0.7
  max_tokens: 4096

  # Fallback if primary provider is down
  fallback:
    provider: "openai"
    model: "gpt-4o"
```

### How the Brain Works

1. Receives a message (from user, channel, or heartbeat)
2. Loads relevant memory context
3. Applies active skill instructions
4. Generates a plan (internal chain-of-thought)
5. Outputs either a response, a tool call, or both

The Brain never directly touches the filesystem or network — it requests actions from the Hands.

## The Hands (Execution Environment)

The Hands execute what the Brain decides to do.

### Capabilities

| Hand | Description | Examples |
|------|-------------|---------|
| **Shell** | Execute terminal commands | `ls`, `git`, `python`, `curl` |
| **Filesystem** | Read/write/modify files | Create configs, edit code, manage logs |
| **Browser** | Chromium automation | Fill forms, scrape pages, take screenshots |
| **HTTP** | Make API requests | REST calls, webhook delivery |

### Shell Execution

By default, commands run with the same permissions as the user who started OpenClaw:

```yaml title="~/.openclaw/config.yml"
hands:
  shell:
    enabled: true
    timeout: 30000  # ms, per command
    allowed_commands: []  # Empty = all allowed
    blocked_commands:
      - "rm -rf /"
      - "shutdown"
      - "reboot"
```

### Browser Automation

OpenClaw includes a headless Chromium instance for web tasks:

```yaml title="~/.openclaw/config.yml"
hands:
  browser:
    enabled: true
    headless: true
    timeout: 60000
    allowed_domains: []  # Empty = all allowed
```

:::tip
Set `headless: false` during development to watch the browser in action.
:::

### Sandboxing

For production deployments, you can isolate the Hands:

```yaml title="~/.openclaw/config.yml"
hands:
  sandbox:
    enabled: true
    type: "docker"  # or "firejail" on Linux
    image: "openclaw/sandbox:latest"
    network: false  # Disable network in sandbox
    writable_paths:
      - "~/.openclaw/memory"
      - "/tmp/openclaw"
```

## Brain-Hands Communication

The Brain and Hands communicate through a structured tool-call protocol:

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

The Brain can chain multiple tool calls in sequence, analyzing each result before deciding the next step.

## Cost Considerations

OpenClaw's token consumption is a commonly cited concern:

- **Average daily cost**: $5–50 depending on usage and model
- **Heartbeat alone**: ~$1–5/day (varies by interval and task count)
- **Heavy automation**: Can spike significantly with complex skills

To manage costs:
- Use cheaper models for simple tasks (`haiku` for heartbeat, `opus` for complex work)
- Increase heartbeat interval
- Use [local models](/guides/local-models) to eliminate API costs entirely

## See Also

- [Local Models Guide](/guides/local-models) — Run without API costs
- [Configuration Reference](/reference/configuration) — All brain/hands settings
- [Security Hardening](/security/hardening) — Restricting execution capabilities
