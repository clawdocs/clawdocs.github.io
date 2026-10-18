---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Basic Usage
description: Everyday patterns for working with OpenClaw — talking to your agent from the Control UI, TUI and CLI, slash commands, exec approvals, sessions, memory, skills and config
keywords: [openclaw, openclaw usage, openclaw commands, how to use openclaw, openclaw tui, openclaw agent, slash commands, exec approvals]
---

# Basic Usage

This guide covers what you need day to day: how to talk to your agent, the slash commands, exec approvals, sessions, memory, skills and the config file. It assumes you have run `openclaw onboard` and the Gateway is running (`openclaw gateway status`).

---

## Talking to Your Agent {#cli-chat}

There are four ways in. They all talk to the same Gateway and the same agent.

| Where | Command | Good for |
|-------|---------|----------|
| Browser (Control UI) | `openclaw dashboard` | Chat, settings, editing workspace files, approving pairing requests |
| Terminal UI | `openclaw` or `openclaw tui` | Interactive chat in a terminal |
| One-shot CLI | `openclaw agent --agent main --message "..."` | Scripts, quick questions |
| Chat apps | Telegram, Discord, Slack, WhatsApp… | Everyday use from your phone ([channels](/guides/channels)) |

### Terminal UI

```bash
# Open the TUI on the main session
openclaw tui

# Open it and send a first message straight away
openclaw tui --message "What files changed in git today?"
```

Type messages and slash commands at the prompt. Press **Ctrl+D** (or type `/exit`) to quit; **Ctrl+C** clears the input, and pressing it twice exits ([TUI](https://docs.openclaw.ai/web/tui)).

`openclaw chat` and `openclaw terminal` also exist, but `chat` is an alias for `openclaw tui --local`, which runs an embedded agent instead of connecting to the Gateway. It takes no message argument: `openclaw chat "hello"` fails with an error.

### One-shot messages

`openclaw agent` sends one turn through the Gateway and prints the reply:

```bash
openclaw agent --agent main --message "What's in my workspace directory?"

# Pick a model for this run only
openclaw agent --agent main --model anthropic/claude-opus-5-5 --message "Analyze this architecture decision"

# Machine-readable output
openclaw agent --agent main --message "List my five largest files" --json
```

You must pass a session selector: `--agent`, `--session-key`, `--session-id` or `--to`. `--agent main` uses the main agent's main session, so the turn shares context with your TUI and Control UI conversation.

### Global flags

These work on every command (`openclaw --help`):

| Flag | Effect |
|------|--------|
| `--dev` | Dev profile: separate state under `~/.openclaw-dev`, Gateway port 19001 |
| `--profile <name>` | Separate state and config under `~/.openclaw-<name>` (for example a work install) |
| `--container <name>` | Run the CLI inside an existing Podman/Docker container with that name |
| `--log-level <level>` | Log level override (`silent` … `trace`) |
| `--no-color` | Disable ANSI colors |
| `-V`, `--version` | Print the version |

There is no global `--model` or `--format` flag. `--model` is an option of `openclaw agent`, and most commands take `--json` for machine-readable output.

---

## Setup Commands

| Command | Purpose |
|---------|---------|
| `openclaw onboard` | Guided setup: verifies model access, writes config, seeds the workspace, and offers channels and skills |
| `openclaw setup` | Same initialization; also recreates missing workspace files without overwriting existing ones |
| `openclaw configure` | Targeted wizard for one area later (models, channels, gateway…) |
| `openclaw channels add` | Connect a chat channel |
| `openclaw dashboard` | Open the Control UI |

```bash
openclaw onboard
openclaw gateway install      # run the Gateway as a background service
openclaw channels add         # guided channel setup
openclaw dashboard
```

---

## Slash Commands

Type these in the TUI, the Control UI or any chat channel. `/help` shows a short summary and `/commands` the full catalog ([slash commands](https://docs.openclaw.ai/tools/slash-commands)).

### Session control

| Command | What it does |
|---------|-------------|
| `/new [model]` | Archive the current session and start a fresh one |
| `/reset` | Reset the current session in place (`/reset soft` keeps the transcript) |
| `/compact [instructions]` | Compact the conversation context to save tokens |
| `/stop` | Abort the current run |
| `/restart` | Restart OpenClaw. Owner-only, and can be disabled with `commands.restart: false` |

### Inspection

| Command | What it does |
|---------|-------------|
| `/status` | Runtime status, uptime, plugin health, provider usage and quota |
| `/usage off\|tokens\|full\|cost` | Per-reply usage footer, or `cost` for a local cost summary |
| `/context` | Explain how the context is assembled |
| `/tools` | Show which tools the agent can use right now |
| `/whoami` | Show your sender ID |

### Model and thinking

| Command | What it does |
|---------|-------------|
| `/model [name]` | Show or switch the model for this session |
| `/think <level>` | Set the thinking level (`off`, `low`, `medium`, `high`, …) or `default` |
| `/verbose on\|off\|full` | Show tool calls and intermediate steps (debugging; keep off in groups) |
| `/trace on\|off` | Toggle plugin trace output |

### Other

| Command | What it does |
|---------|-------------|
| `/skill <name> [input]` | Run a skill by name |
| `/approve <id> <decision>` | Resolve a pending exec approval |
| `/activation mention\|always` | In a group: reply only when mentioned, or to everything |

---

## Execution Approval {#execution-approval}

:::danger Commands run without asking by default
By default OpenClaw runs host shell commands **without asking**: `tools.exec.mode` resolves to `full` on the Gateway host, and the sandbox is **off**. If your agent reads email, web pages, PRs or anything else you didn't write, a prompt injection can run commands as your user. Turn on approvals and consider the sandbox: [exec approvals](/security/hardening#exec-approvals), [sandboxing](/security/hardening#sandboxing).
:::

Approvals are set with `tools.exec.mode`. There is no `permissions` key, and OpenClaw refuses to start with unknown config keys.

| Mode | Behavior |
|------|----------|
| `full` (default on the Gateway host) | Runs host commands without prompts |
| `auto` | Runs allowlisted commands; an automatic reviewer allows, denies or asks you about the rest |
| `ask` | Runs allowlisted commands; asks you about everything else |
| `allowlist` | Runs allowlisted commands; silently denies the rest |
| `deny` | No host commands at all |

Source: [permission modes](https://docs.openclaw.ai/tools/permission-modes).

```bash
openclaw config set tools.exec.mode ask
openclaw gateway restart

openclaw approvals get       # requested policy, host approvals file, effective result
openclaw exec-policy show    # what the agent's terminal tools can do, in plain words
```

In `ask` mode, approval prompts reach you in the Control UI or as a chat message with buttons on channels that support them (you can also reply `/approve <id> <decision>`). Choosing "always allow" adds that exact command, in that directory, to the allowlist.

The allowlist lives in the host approvals file, not in `openclaw.json`. You can add entries yourself; patterns are command-name or binary-path globs:

```bash
openclaw approvals allowlist add "rg"
openclaw approvals allowlist add "git" --agent main
openclaw approvals pending   # anything waiting for you
```

The effective policy is the **stricter** of `openclaw.json` and the approvals file. Allowlisting a binary allows all of its subcommands (`git` includes `git push`), so allowlist only tools you are happy to see run with any arguments. Details: [exec approvals](https://docs.openclaw.ai/tools/exec-approvals).

---

## Sessions

Every conversation is a session, stored in the agent's SQLite database. Sessions survive restarts.

```bash
# Sessions for the default agent
openclaw sessions list
openclaw sessions list --active 60      # updated in the last hour

# Follow what a session is doing
openclaw sessions tail --follow
openclaw sessions tail --session-key agent:main:main

# Send a message into a specific session
openclaw agent --session-key agent:main:main --message "Check on that deployment"
```

### Session tools (in chat)

The agent itself can work with sessions through tools such as `sessions_list`, `sessions_history` and `sessions_send` ([session tools](https://docs.openclaw.ai/concepts/session-tool)). To redirect a run that is already in progress, see [steer](https://docs.openclaw.ai/tools/steer).

```
> List my active sessions
> Send "status update?" to the researcher session
```

### What a session holds

A session holds its own conversation history and context. Tool policy and the workspace belong to the **agent**, not the session. By default all your direct messages, across channels, share the agent's main session; set `session.dmScope: "per-channel-peer"` when other people can message the bot ([sessions](https://docs.openclaw.ai/concepts/session)). Group chats always get their own session.

The heartbeat runs in the main session by default, so heartbeat turns share context with your main conversation unless you set `isolatedSession: true`.

---

## Memory

Memory is plain Markdown in the agent workspace (`~/.openclaw/workspace/`):

- `MEMORY.md`: curated long-term facts and decisions, loaded at the start of private sessions.
- `memory/YYYY-MM-DD.md`: daily notes. These are **not** injected every turn; the agent retrieves them with its memory search tool when relevant.
- `USER.md`: your preferences as directives, loaded every session.

Source: [memory](https://docs.openclaw.ai/concepts/memory), [agent workspace](https://docs.openclaw.ai/concepts/agent-workspace).

### Natural language

```
> Remember that the production database is on db.prod.internal:5432
> Remember that deploy freezes happen every Friday after 3pm
> What do you remember about the database?
```

You can also open and edit the files directly, or in the Control UI under **Settings → Agents → Files**.

### Memory commands

```bash
openclaw memory status            # index and embedding provider status
openclaw memory status --deep     # also probe the embedding provider
openclaw memory search "database" # search memory files
openclaw memory index             # reindex after editing files by hand
openclaw memory forget --session <id-or-key> --dry-run   # preview deleting memories from a session
```

Deleting a line from `MEMORY.md` removes it from future context; run `openclaw memory index` so search stops returning it. Session transcripts are kept separately.

:::tip
Memory is good for facts that don't change often: server addresses, team conventions, preferences. Never put secrets in memory files; they are sent to the model provider with the context.
:::

---

## Common Task Patterns

Each line works as a message in the TUI, the Control UI or a chat app. From a script, wrap it in `openclaw agent --agent main --message "..."`.

### File operations

```
Create a .gitignore for a Node.js project in ~/new-project
Find all TODO comments in ~/project/src
Rename all .jpeg files in ~/photos to .jpg
```

### Development

```
Run the test suite in ~/app and summarize any failures
Review the diff in my current git branch and suggest improvements
Set up a new Express API project with TypeScript in ~/api
```

### Research

Web search needs a configured search provider ([web tools](https://docs.openclaw.ai/tools/web)).

```
What are the top Hacker News stories right now?
Summarize this paper: https://arxiv.org/abs/2401.12345
```

### System administration

```
What processes are using the most memory?
Check if ports 3000, 5432 and 6379 are in use
```

For a recurring check ("alert me if a disk is above 90%"), ask for an automation, or create one with `openclaw cron add`. See [Day 3](/guides/first-7-days/day-3-automation).

### Git workflows

```
Show me what changed since the last release tag
Create a branch, fix the typo in README.md and commit it
```

:::caution
Requests that push, open PRs or rewrite history are unattended writes under the default `full` exec mode. Use `ask` mode, or review before you say "go".
:::

---

## Working with Context

Within a session the agent remembers everything said so far:

```
> I'm working on the authentication module in ~/project
> What does the login function do?
> Refactor it to use JWT instead of sessions
> Now update the tests to match
```

When context grows large, `/compact` summarizes it. Start `/new` for unrelated work.

### Context tips

| Technique | When to use |
|-----------|------------|
| Start with a path | "I'm working on ~/project/src/auth.ts" sets the context |
| Reference files explicitly | "Look at `config.yaml` line 42" avoids ambiguity |
| Use `/compact` early | When a session has run long and replies slow down |
| Start `/new` for unrelated work | Prevents cross-contamination between tasks |

---

## Piping Input

`openclaw agent` reads the message from a file with `--message-file`. On Linux and macOS, `/dev/stdin` works as that file, so you can build a prompt in the shell and pipe it in:

```bash
# Ask about a log file (prompt + data in one message)
{ echo "What's causing these errors?"; tail -n 200 error.log; } \
  | openclaw agent --agent main --message-file /dev/stdin

# Review a diff
{ echo "Review these changes for bugs:"; git diff HEAD~5; } \
  | openclaw agent --agent main --message-file /dev/stdin

# A prompt kept in a file
openclaw agent --agent main --message-file ./task.md
```

The message limit is 4 MiB.

### `agent exec`: isolated headless runs

`openclaw agent exec` is different: it runs one embedded agent turn **without** the Gateway, in a throwaway state directory, with the current directory as its workspace. It is meant for CI and coding automation, and accepts stdin with `--message-file -`:

```bash
cat task.md | openclaw agent exec --message-file - --json
```

Unless your config says otherwise, `agent exec` runs with the sandbox off and the **full** exec policy, scoped to `--cwd`. Use it in a repository you trust, not on untrusted input ([agent exec](https://docs.openclaw.ai/cli/agent)).

---

## Output

Replies are Markdown. For scripts, use `--json` and pick fields with `jq`:

```bash
openclaw agent --agent main --message "Write a commit message for my staged changes" --json > reply.json

# Save a reply as a file
openclaw agent --agent main --message "Generate a project README" > README.md
```

Don't pipe model output straight into a shell command (`| xargs`, `| sh`). Read it first.

---

## Multi-Step Tasks

For larger tasks the agent plans and works through the steps itself:

```
Set up a PostgreSQL database for ~/myapp, create a users table,
add seed data and generate a TypeScript ORM client
```

Watch tool calls as they happen with `/verbose on`, or from another terminal with `openclaw sessions tail --follow`. With `tools.exec.mode: "ask"` you approve each command that isn't allowlisted.

---

## Multi-Agent Basics

You can run several isolated agents, each with its own workspace, model, tools and sessions:

```bash
openclaw agents list
openclaw agents add researcher --model anthropic/claude-opus-5-5
openclaw agent --agent researcher --message "Analyze the competitor landscape"
openclaw agents bindings
```

Messages reach an agent through **bindings** (deterministic routing rules by channel, account, peer, guild or team), or when you address it with `--agent`. There is no topic-based routing. A roster with more than one agent needs `agents.ownership: "explicit"`:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: {
      model: { primary: "anthropic/claude-sonnet-5-5" },
    },
    entries: {
      main: {},
      researcher: {
        workspace: "~/.openclaw/workspace-researcher",
        model: { primary: "anthropic/claude-opus-5-5" },
      },
    },
  },
  bindings: [
    // Messages in one Discord channel go to the researcher
    { agentId: "researcher", match: { channel: "discord", peer: { kind: "channel", id: "222222222222222222" } } },
  ],
}
```

Older configs with `agents.list` are rejected until `openclaw doctor --fix` migrates them. See the [Multi-Agent Guide](/guides/multi-agent) and [Day 6](/guides/first-7-days/day-6-power-moves).

---

## Skills

Skills are folders with a `SKILL.md` that teach the agent a task. Many ship with OpenClaw (`github`, `weather`, `summarize`, `healthcheck` and more); they only need their CLI tools installed.

```bash
openclaw skills list              # everything the agent can see
openclaw skills check             # which skills are ready, and what's missing
openclaw skills info github

openclaw skills search "email digest"
openclaw skills verify @owner/<slug> --card   # read the ClawHub verification first
openclaw skills install @owner/<slug>
```

ClawHub skills are installed by owner and slug (`@owner/<slug>`); bare slugs are often ambiguous. Treat a community skill like code you are about to run ([supply chain](/security/hardening#supply-chain)).

In chat, run a skill with `/skill <name>`:

```
> /skill github list my open PRs in myorg/myrepo
```

See [Day 4](/guides/first-7-days/day-4-skills) and [Skill Development](/guides/skill-development).

---

## Configuration Essentials

Config and state live in `~/.openclaw/`; the agent's personality and memory live in its workspace:

| Path | Purpose |
|------|---------|
| `~/.openclaw/openclaw.json` | Main config (JSON5): models, channels, tools, heartbeat |
| `~/.openclaw/.env` | Environment variables the Gateway loads (tokens) |
| `~/.openclaw/workspace/AGENTS.md` | Operating instructions (required) |
| `~/.openclaw/workspace/SOUL.md` | Persona and tone |
| `~/.openclaw/workspace/USER.md` | Your preferences, as directives |
| `~/.openclaw/workspace/MEMORY.md`, `memory/` | Long-term memory and daily notes |
| `~/.openclaw/workspace/skills/` | Your own skills |
| `~/.openclaw/agents/<id>/agent/openclaw-agent.sqlite` | Sessions, transcripts, auth profiles |

`HEARTBEAT.md` is retired: heartbeat instructions live in the monitor's scratch, and recurring tasks are automations. If an old workspace still has one, `openclaw doctor --fix` migrates it.

### Changing config

```bash
openclaw config file                          # where the active config is
openclaw config get agents.defaults.model
openclaw config set tools.exec.mode ask
openclaw config patch --file ./change.json5 --dry-run
openclaw config validate
openclaw configure                            # guided wizard
```

You can also edit `openclaw.json` by hand. The Gateway watches it and applies most changes itself; run `openclaw config validate` after every hand edit, because unknown keys or wrong types stop the Gateway from starting.

### Minimal config

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "anthropic/claude-sonnet-5-5" },
    },
  },
}
```

### With common options

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      userTimezone: "Europe/Berlin",
      model: {
        primary: "anthropic/claude-sonnet-5-5",
        fallbacks: ["openai/gpt-6-astra"],
      },
      heartbeat: {
        every: "30m",
        activeHours: { start: "07:00", end: "22:00" },
      },
    },
  },
  session: { dmScope: "per-channel-peer" },
  tools: {
    exec: { mode: "ask" },
    fs: { workspaceOnly: true },
  },
}
```

More starting points: [configuration examples](https://docs.openclaw.ai/gateway/configuration-examples).

---

## CLI Command Reference (Quick)

The commands you'll use most. `openclaw --help` lists them all, and every command has `--help`.

| Command | Purpose |
|---------|---------|
| `openclaw` / `openclaw tui` | Terminal chat |
| `openclaw dashboard` | Open the Control UI |
| `openclaw agent --agent <id> --message "..."` | One-shot turn through the Gateway |
| `openclaw onboard` / `setup` / `configure` | Setup wizards |
| `openclaw status` | Overall health |
| `openclaw gateway start\|stop\|restart\|status` | Manage the Gateway service |
| `openclaw channels add\|list\|status\|login\|remove` | Manage chat channels |
| `openclaw pairing list\|approve` | Approve new DM senders |
| `openclaw sessions list\|tail` | Inspect sessions |
| `openclaw agents list\|add\|bindings` | Manage agents |
| `openclaw cron add\|list\|runs\|rm` | Automations (alias: `openclaw automations`) |
| `openclaw memory status\|search\|index\|forget` | Memory |
| `openclaw skills list\|search\|install\|verify\|update` | Skills |
| `openclaw approvals get` / `openclaw exec-policy show` | Exec approvals |
| `openclaw config get\|set\|patch\|validate` | Edit config |
| `openclaw models list` | Available models |
| `openclaw gateway usage-cost` | Cost summary |
| `openclaw logs --follow` | Gateway logs |
| `openclaw doctor` / `openclaw triage` | Diagnose problems |
| `openclaw update` | Update OpenClaw |

See the [CLI Reference](/reference/cli) and the [upstream CLI docs](https://docs.openclaw.ai/cli).

---

## Tips for Better Results

| Tip | Example |
|-----|---------|
| Be specific about paths | "Edit `~/project/src/auth.ts`" not "edit the auth file" |
| State desired output | "Create a JSON config file" not just "set up config" |
| Provide constraints | "Use Python 3.12, no external dependencies" |
| Reference past context | "Like the script we made yesterday" |
| One-shot for simple tasks | `openclaw agent --agent main --message "What's my public IP?"` |
| Interactive for complex work | `openclaw tui`, then build up context |
| Pipe large inputs | `{ echo "Find errors:"; cat big.log; } \| openclaw agent --agent main --message-file /dev/stdin` |
| Use JSON for scripts | `openclaw agent --agent main --message "..." --json \| jq .` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Gateway not running" | `openclaw gateway status`, then `openclaw gateway start` (or `openclaw gateway install` if no service exists) |
| Gateway won't start after a config edit | `openclaw config validate` names the bad key; `openclaw doctor --fix` migrates old shapes |
| "Model not found" | `openclaw models list` shows valid model refs (`provider/model`) |
| Slow or expensive replies | `/usage tokens` and `/context`; then `/compact` or `/new` |
| Agent won't run commands | `openclaw exec-policy show` and `openclaw approvals get` |
| Memory search returns nothing | `openclaw memory status --deep`, then `openclaw memory index` |
| Channel disconnected | `openclaw channels status --probe`; re-link with `openclaw channels login` or `openclaw gateway restart` |
| Not sure what's wrong | `openclaw triage` runs read-only checks and writes a sanitized diagnosis |

---

## See Also

- [Channels & Integrations](/guides/channels) — Use OpenClaw from WhatsApp, Slack, etc.
- [Heartbeat Guide](/guides/heartbeat) — Background check-ins
- [Skill Development](/guides/skill-development) — Write your own skills
- [Multi-Agent Guide](/guides/multi-agent) — Run multiple agents
- [Model Selection](/guides/model-selection) — Choose the right model
- [SOUL.md Guide](/guides/soul-md) — Customize your agent's personality
- [Security Hardening](/security/hardening) — Approvals, sandboxing, channel access
- [CLI Reference](/reference/cli) — All CLI commands and flags
- [Configuration Reference](/reference/configuration) — All config options
