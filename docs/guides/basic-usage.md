---
sidebar_position: 1
title: Basic Usage
description: Everyday patterns for working with OpenClaw — CLI commands, slash commands, sessions, memory, execution approval, and power-user tips
keywords: [openclaw, openclaw usage, openclaw commands, how to use openclaw, cli chat, slash commands]
---

# Basic Usage

This guide covers everything you need to work with OpenClaw day-to-day, from your first chat message through sessions, memory, slash commands, and multi-agent workflows.

---

## CLI Chat

The main entry point is `openclaw chat`:

```bash
# One-shot message
openclaw chat "What's in my current directory?"

# Interactive session
openclaw chat
> What files changed in git today?
> Summarize the largest one
> exit
```

### Global Flags

| Flag | Effect |
|------|--------|
| `--dev` | Development mode (verbose logging, local gateway) |
| `--profile <name>` | Use a named configuration profile |
| `--container` | Run inside a sandboxed container |
| `--no-color` | Disable colored output |
| `--format json\|plain\|md` | Control output format |
| `--model <id>` | Override the default model for this session |

```bash
# Use a specific model for one session
openclaw chat --model claude-opus-4-8 "Analyze this architecture decision"

# Use a named profile
openclaw chat --profile work "Check my team's PRs"
```

---

## Setup Commands

Run these after installing to configure OpenClaw for first use:

| Command | Purpose |
|---------|---------|
| `openclaw setup` | Interactive first-time setup — API keys, default model, basic config |
| `openclaw onboard` | Guided walkthrough of features for new users |
| `openclaw configure` | Edit config file interactively (model, provider, heartbeat, etc.) |
| `openclaw channels add` | Connect a messaging channel (WhatsApp, Telegram, Discord, Slack) |

```bash
# Full setup from scratch
openclaw setup
openclaw channels add whatsapp
openclaw onboard
```

---

## Slash Commands

Inside an interactive session, type `/` followed by a command. These control the session without leaving the conversation:

### Session Control

| Command | What It Does |
|---------|-------------|
| `/new` | Start a fresh conversation (clears context) |
| `/reset` | Reset the agent to default state |
| `/compact` | Compress conversation history to save tokens |
| `/restart` | Restart the gateway process |

### Inspection

| Command | What It Does |
|---------|-------------|
| `/status` | Show agent state, model, memory usage, active channels |
| `/usage` | Show token consumption and estimated cost for this session |
| `/trace` | Show detailed execution trace of the last action |

### Thinking Modes

| Command | What It Does |
|---------|-------------|
| `/think` | Enable extended thinking — the agent reasons step-by-step before answering |
| `/verbose` | Increase output detail (show tool calls, intermediate steps) |

### Other

| Command | What It Does |
|---------|-------------|
| `/activation` | Show current activation status and license info |
| `/help` | List all available slash commands |

```
> /status
Agent: active | Model: claude-sonnet-4-6 | Memory: 1,847 tokens
Channels: whatsapp (connected), discord (connected)
Heartbeat: running (last: 4m ago, next: 26m)

> /usage
Session tokens: 12,450 in / 3,200 out
Estimated cost: $0.05

> /compact
Compressed 47 messages → 1 summary (saved ~8,200 tokens)
```

---

## Execution Approval

When OpenClaw needs to run a shell command, make a network request, or modify files, it asks for your approval:

```
Agent wants to execute:
  $ rm -rf node_modules && npm install

  [approve] [deny] [approve all similar]
```

### Approval Modes

Configure how the agent asks for permission in `~/.openclaw/openclaw.json`:

```json5
{
  "permissions": {
    "mode": "ask",           // "ask" | "auto" | "deny"
    "auto_approve": [
      "git status",
      "git diff",
      "ls",
      "cat"
    ],
    "always_deny": [
      "rm -rf /",
      "sudo rm"
    ]
  }
}
```

| Mode | Behavior |
|------|----------|
| `ask` (default) | Prompt before each action |
| `auto` | Auto-approve everything (use with caution) |
| `deny` | Block all shell commands (read-only mode) |

The `auto_approve` list lets you whitelist safe commands that skip the prompt. Commands in `always_deny` are blocked even in `auto` mode.

:::caution
Only use `"mode": "auto"` on machines where you trust the agent completely. In auto mode, the agent can run any command without asking.
:::

---

## Sessions

Every conversation is a session. Sessions persist across restarts, and you can manage multiple concurrent sessions.

### Session Commands

```bash
# List all sessions
openclaw sessions list

# View history of a specific session
openclaw sessions history <session-id>

# Send a message to a running session
openclaw sessions send <session-id> "Check on that deployment"
```

### Session Tools (In-Chat)

Inside a session, OpenClaw exposes session management as tools:

| Tool | Purpose |
|------|---------|
| `sessions_list` | List active and recent sessions |
| `sessions_history` | View messages from another session |
| `sessions_send` | Send a message to another active session |
| `sessions.steer` | Redirect the current session's behavior |

```
> List my active sessions
Using tool: sessions_list
You have 3 active sessions:
  1. main (this one) — started 2h ago
  2. heartbeat — started 14h ago, last active 12m ago
  3. researcher — started 45m ago, running task

> Send "status update?" to the researcher session
Using tool: sessions_send → researcher
Response: "Analyzed 47 files, found 3 security issues. Writing report now."
```

### Session Isolation

Each session maintains its own:
- Conversation history and context
- Working directory
- Tool permissions
- Token budget

The heartbeat runs in the main session by default, not in a separate background process. This means heartbeat actions share context with your primary conversation.

---

## Memory

OpenClaw has a persistent memory system. Memory survives across sessions and gateway restarts.

### Natural Language Memory

Talk to memory using natural language — no special syntax needed:

```
> Remember that the production database is on db.prod.internal:5432
Saved to memory.

> Remember that deploy freezes happen every Friday after 3pm
Saved to memory.

> What do you remember about the database?
I remember: the production database is on db.prod.internal:5432

> Forget about the database location
Removed from memory.
```

### Memory Commands

```bash
# View all memories from the CLI
openclaw memory list

# Search memories
openclaw memory search "database"

# Clear all memories
openclaw memory clear
```

### How Memory Works

- Memories are stored in `~/.openclaw/memory/` as structured files
- Each message loads relevant memories into context (default: up to 2,000 tokens)
- Memory retrieval uses semantic search — it finds relevant memories even with different wording
- You can cap memory loading with `max_context_tokens` in config

```json5 title="~/.openclaw/openclaw.json"
{
  "memory": {
    "max_context_tokens": 2000,
    "auto_save": true
  }
}
```

:::tip
Memory is great for facts that don't change often: server addresses, team conventions, personal preferences. For ephemeral tasks, use the conversation context instead.
:::

---

## Common Task Patterns

### File Operations

```bash
openclaw chat "Create a .gitignore for a Node.js project in ~/new-project"
openclaw chat "Find all TODO comments in ~/project/src"
openclaw chat "Rename all .jpeg files in ~/photos to .jpg"
```

### Development Tasks

```bash
openclaw chat "Run the test suite in ~/app and summarize any failures"
openclaw chat "Review the diff in my current git branch and suggest improvements"
openclaw chat "Set up a new Express API project with TypeScript in ~/api"
```

### Research

```bash
openclaw chat "What are the top Hacker News stories right now?"
openclaw chat "Compare the latest pricing for AWS, GCP, and Azure for a small web app"
openclaw chat "Summarize this paper: https://arxiv.org/abs/2401.12345"
```

### System Administration

```bash
openclaw chat "What processes are using the most memory?"
openclaw chat "Check if ports 3000, 5432, and 6379 are in use"
openclaw chat "Monitor my disk usage and alert me if any partition is above 90%"
```

### Git Workflows

```bash
openclaw chat "Create a branch, fix the typo in README.md, commit, and open a PR"
openclaw chat "Rebase my feature branch on main and resolve any conflicts"
openclaw chat "Show me what changed since the last release tag"
```

---

## Working with Context

OpenClaw remembers context within a session and across sessions via [memory](/architecture/memory-system):

```bash
openclaw chat
> I'm working on the authentication module in ~/project
> What does the login function do?
> Refactor it to use JWT instead of sessions
> Now update the tests to match
```

Each message builds on the previous. When context grows large, use `/compact` to compress the history.

### Context Tips

| Technique | When to Use |
|-----------|------------|
| Start with a path | "I'm working on ~/project/src/auth.ts" — sets the context |
| Reference files explicitly | "Look at `config.yaml` line 42" — avoids ambiguity |
| Use `/compact` early | Before context exceeds ~50 messages |
| Start `/new` for unrelated work | Prevents cross-contamination between tasks |

---

## Piping Input

```bash
# Pipe file contents
cat error.log | openclaw chat "What's causing these errors?"

# Pipe command output
docker ps | openclaw chat "Which containers are using the most resources?"

# Pipe JSON
curl -s https://api.example.com/data | openclaw chat "Summarize this API response"

# Pipe a diff
git diff HEAD~5 | openclaw chat "Review these changes for bugs"

# Chain with other tools
openclaw chat "List files over 100MB" | xargs du -sh
```

---

## Output Formatting

OpenClaw responds in Markdown by default. Control the format:

```bash
# Get JSON output
openclaw chat --format json "List my 5 largest files"

# Plain text (no markdown)
openclaw chat --format plain "What time is it?"

# Save to file
openclaw chat "Generate a project README" > README.md

# Pipe to clipboard (macOS)
openclaw chat "Write a commit message for my staged changes" | pbcopy
```

---

## Multi-Step Tasks

For complex tasks, OpenClaw breaks work into steps automatically:

```bash
openclaw chat "Set up a PostgreSQL database, create a users table, \
  add seed data, and generate a TypeScript ORM client"
```

The agent will:
1. Check if PostgreSQL is installed
2. Create the database
3. Write and execute the schema
4. Insert seed data
5. Generate the ORM client
6. Report what it did

### Monitoring Progress

For long-running multi-step tasks, the agent shows progress:

```
Step 1/5: Checking PostgreSQL installation... done
Step 2/5: Creating database "myapp_dev"... done
Step 3/5: Applying schema (3 tables, 2 indexes)... done
Step 4/5: Seeding 100 rows... done
Step 5/5: Generating Prisma client... done

All steps completed. Database ready at localhost:5432/myapp_dev
```

---

## Multi-Agent Basics

OpenClaw supports running multiple agents simultaneously. From a user's perspective:

```bash
# Start a named agent
openclaw agent start researcher --model claude-opus-4-8

# List running agents
openclaw agent list

# Send a task to a specific agent
openclaw agent send researcher "Analyze the competitor landscape"

# View agent output
openclaw agent logs researcher
```

### Agent Routing

When multiple agents are running, messages route to the most relevant agent based on priority tiers:

| Priority | Route To |
|----------|---------|
| Highest | Agent whose workspace matches the file/topic |
| Default | The primary agent (your main session) |
| Heartbeat | Heartbeat tasks run in the main session |

Configure per-agent models to optimize cost:

```json5 title="~/.openclaw/openclaw.json"
{
  "agents": {
    "list": [
      { "id": "researcher", "model": "claude-opus-4-8" },
      { "id": "monitor", "model": "ollama/qwen3:14b" },
      { "id": "worker", "model": "claude-haiku-4-5-20251001" }
    ]
  }
}
```

See [Multi-Agent Guide](/guides/multi-agent) for advanced patterns.

---

## Skills

Skills are reusable task templates that extend what OpenClaw can do:

```bash
# List installed skills
openclaw skills list

# Run a skill
openclaw skills run deploy-to-staging

# Install a skill from ClawHub
openclaw skills install clawdocs/email-digest
```

Inside a chat session, invoke skills directly:

```
> /skill deploy-to-staging
Running skill: deploy-to-staging
  Building... done
  Running tests... done
  Deploying to staging.myapp.com... done
  Health check passed.
```

See [Skill Development](/guides/skill-development) for creating your own skills.

---

## Configuration Essentials

OpenClaw's configuration lives in `~/.openclaw/`:

| File | Purpose |
|------|---------|
| `openclaw.json` | Main config — model, provider, heartbeat, permissions |
| `SOUL.md` | Agent personality and instructions |
| `HEARTBEAT.md` | Heartbeat task definitions |
| `memory/` | Persistent memory storage |
| `skills/` | Installed skills |

### Quick Config Changes

```bash
# Open config in your editor
openclaw configure

# Or edit directly
vim ~/.openclaw/openclaw.json
```

### Minimal Config

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6"
  }
}
```

### With All Common Options

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
    "interval": 1800,
    "model": "claude-haiku-4-5-20251001",
    "quiet_hours": { "start": "22:00", "end": "07:00" }
  },
  "permissions": {
    "mode": "ask"
  },
  "memory": {
    "max_context_tokens": 2000
  }
}
```

After editing the config, restart the gateway:

```bash
openclaw gateway restart
```

---

## CLI Command Reference (Quick)

The full CLI has 50+ subcommands. Here are the ones you'll use most:

| Command | Purpose |
|---------|---------|
| `openclaw chat` | Start a conversation |
| `openclaw setup` | First-time configuration |
| `openclaw configure` | Edit config interactively |
| `openclaw gateway start\|stop\|restart` | Manage the gateway |
| `openclaw channels add\|list\|remove` | Manage channels |
| `openclaw sessions list\|history\|send` | Session management |
| `openclaw agent start\|list\|send\|logs` | Multi-agent management |
| `openclaw heartbeat --now\|--dry-run` | Trigger/test heartbeat |
| `openclaw memory list\|search\|clear` | Memory management |
| `openclaw skills list\|run\|install` | Skill management |
| `openclaw stats` | Usage statistics |
| `openclaw logs` | View logs |
| `openclaw update` | Update OpenClaw |

See [CLI Reference](/reference/cli) for the complete list.

---

## Tips for Better Results

| Tip | Example |
|-----|---------|
| Be specific about paths | "Edit `~/project/src/auth.ts`" not "edit the auth file" |
| State desired output | "Create a JSON config file" not just "set up config" |
| Provide constraints | "Use Python 3.12, no external dependencies" |
| Reference past context | "Like the script we made yesterday" |
| Use one-shot for simple tasks | `openclaw chat "What's my IP?"` |
| Use interactive for complex work | `openclaw chat` then build up context |
| Pipe large inputs | `cat bigfile.log \| openclaw chat "Find errors"` |
| Combine with Unix tools | `openclaw chat --format json "..." \| jq '.results'` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Gateway not running" | Run `openclaw gateway start` |
| "Model not found" | Check `openclaw configure` for valid model IDs |
| Slow responses | Check `/usage` — context may be too large, use `/compact` |
| Agent won't run commands | Check `permissions.mode` in config |
| Memory not loading | Verify `~/.openclaw/memory/` exists and has files |
| Channel disconnected | Run `openclaw channels list` then `openclaw channels add <name>` |

---

## See Also

- [Channels & Integrations](/guides/channels) — Use OpenClaw from WhatsApp, Slack, etc.
- [Heartbeat Guide](/guides/heartbeat) — Set up autonomous background tasks
- [Skill Development](/guides/skill-development) — Automate recurring tasks
- [Multi-Agent Guide](/guides/multi-agent) — Run multiple agents
- [Model Selection](/guides/model-selection) — Choose the right model
- [SOUL.md Guide](/guides/soul-md) — Customize your agent's personality
- [CLI Reference](/reference/cli) — All CLI commands and flags
- [Configuration Reference](/reference/configuration) — All config options
