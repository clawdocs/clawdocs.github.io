---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Introduction to OpenClaw
sidebar_label: Introduction
description: What OpenClaw is, what it can do, what it costs, and what to read before you install it
keywords: [openclaw, what is openclaw, openclaw overview, openclaw features, open source ai agent, autonomous ai agent, openclaw introduction, ai agent framework]
---

# Introduction to OpenClaw

**OpenClaw** is a free, open-source AI assistant that runs on your own computer or server. A long-running **Gateway** connects a language model (Claude, GPT, Gemini, a local model, and many others) to tools on your machine (shell, files, browser) and to the chat apps you already use (WhatsApp, Telegram, Slack, Discord, iMessage, Teams, and 20+ more).

It is an assistant that *does things*, not only answers questions. That is also why it needs more care than a chatbot.

This site is a community companion to the official docs at [docs.openclaw.ai](https://docs.openclaw.ai). Pages here are tested against a specific OpenClaw release (see `verified_with` at the top of each page) and link to the official reference for details.

---

## What makes OpenClaw different

| | Typical chatbot | OpenClaw |
|---|---|---|
| Where it runs | Vendor cloud | Your machine or server |
| What it can touch | Text in, text out | Shell, files, browser, APIs, paired devices |
| Memory | Per-session, or vendor-held | Markdown files in your workspace (`~/.openclaw/workspace`) |
| How you reach it | One web app | Control UI, terminal UI, desktop and mobile apps, 20+ chat channels |
| Proactivity | Waits for you | Optional [heartbeat](/architecture/heartbeat) and scheduled automations |
| Models | One vendor | Any supported provider, or local models |

"Runs locally" does not mean "nothing leaves your machine". Your prompts, memory snippets and tool output go to the model provider you configure, and memory search uses OpenAI embeddings by default. See [Privacy and compliance](/guides/privacy-compliance).

---

## Key capabilities

### Agent fundamentals

- **Agent runtime and tools.** The agent plans multi-step work and calls tools such as `exec` (shell), `read`/`write`/`edit`, `browser`, `web_search` and `web_fetch`.
- **Persistent memory.** `MEMORY.md`, `USER.md` and daily notes in `memory/YYYY-MM-DD.md` inside the workspace. A nightly "dreaming" sweep (on by default) consolidates them. See [Memory System](/architecture/memory-system).
- **Heartbeat and automations.** The heartbeat is a periodic main-session turn (default every 30 minutes, or 1 hour when Anthropic is authenticated with OAuth or a Claude CLI token). Recurring jobs such as "every morning at 9" are [automations](https://docs.openclaw.ai/automation/cron-jobs) (`openclaw cron`).
- **Execution approval.** Shell commands are governed by `tools.exec.mode` (`deny`, `allowlist`, `ask`, `auto`, `full`). The default is **`full`: commands run without asking** until you turn approvals on.

### Ways to talk to it

- **Control UI.** A web app served by the Gateway at `http://127.0.0.1:18789/`: chat, files, approvals, settings, terminals and dashboards. Open it with `openclaw dashboard`.
- **Terminal UI.** `openclaw tui` (connected to the Gateway) or `openclaw chat` (local embedded runtime).
- **Official apps.** macOS menu bar app, Windows Hub, a Linux desktop companion, and iOS and Android apps (App Store and Google Play). The mobile apps are companion nodes that pair with your Gateway. See [Platforms](https://docs.openclaw.ai/platforms).
- **Chat channels.** WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Microsoft Teams, Matrix, Feishu, LINE and more. See the [Channels guide](/guides/channels).

### Extensibility

- **Skills.** Directories with a `SKILL.md` file that teach the agent a task. Bundled skills ship with OpenClaw; community skills are on [ClawHub](/guides/clawhub). Treat third-party skills as untrusted code.
- **Plugins.** Channels, model providers and many features are plugins. See [Plugin System](/guides/plugin-system).
- **MCP.** Connect Model Context Protocol servers under `mcp.servers`. See [MCP Servers](/guides/mcp-servers).
- **Multiple agents.** Separate agents with their own workspace, model and channels, plus sub-agents for parallel work. See [Multi-Agent](/guides/multi-agent).

---

## A brief history

1. **November 2025.** Peter Steinberger starts the project as **Clawdbot** (the lobster was called Clawd).
2. **January 27, 2026.** Renamed **Moltbot** after Anthropic asked for a name change over the trademark.
3. **January 30, 2026.** Renamed **OpenClaw**. The same week, **CVE-2026-25253** (a one-click token leak through the Control UI's `gatewayUrl` parameter) was fixed in v2026.1.29.
4. **February 2026.** The ClawHavoc campaign: 341 malicious skills found on ClawHub. See [Known Vulnerabilities](/security/known-vulnerabilities).
5. **August 2026.** v2026.8.1, billed as "OpenClaw 2.0": rebuilt Control UI, sessions in SQLite, cron renamed Automations, `HEARTBEAT.md` retired.
6. **October 2026.** Current stable release is **v2026.10.4** (published 2026-10-16).

The project is stewarded by the [OpenClaw Foundation](https://openclaw.org), an independent 501(c)(3) that employs the core team and signs releases. It has no paid tier, hosted service or token. The code is MIT-licensed, copyright OpenClaw Foundation. Upstream's [lore page](https://docs.openclaw.ai/start/lore) tells the naming story.

---

## Community and ecosystem

As of 2026-10-18, [openclaw/openclaw](https://github.com/openclaw/openclaw) has about **392,000 GitHub stars** and **82,000 forks**. Releases use calendar versions (`YYYY.M.N`) and ship every few days on four channels: `stable`, `extended-stable`, `beta` and `dev` ([release channels](https://docs.openclaw.ai/install/development-channels)).

- Chat: the official [Discord](https://discord.gg/clawd).
- Skills: [ClawHub](https://clawhub.ai).
- Related projects, forks and lightweight alternatives: [Ecosystem](/reference/ecosystem).

---

## Who is this for?

- **Developers** who want an agent that can work in repos, run tests and automate chores.
- **Power users** who want help with email, messaging, scheduling and research.
- **Self-hosters** who want state, memory and credentials on their own hardware.
- **Tinkerers** who want to write skills, plugins and workflows.
- **Small teams** sharing one Gateway (see upstream [Teams](https://docs.openclaw.ai/start/teams)). It is not a multi-tenant system: one Gateway is one trust boundary.

---

## What OpenClaw is not

- **Not just a CLI.** It ships a full web Control UI and desktop and mobile apps. [WebClaw](/guides/webclaw) is a separate third-party web client.
- **Not a coding IDE.** It can write and edit code, but it is a general-purpose agent, not a replacement for your editor.
- **Not free to run.** OpenClaw is free; model API calls are not. Local models cost nothing per token but need capable hardware.
- **Not safe by default.** It runs with your user's permissions, shell commands run without approval by default, and the sandbox is off. Read the [Security Overview](/security/overview) before connecting it to anything important.
- **Not a hosted service.** You run it yourself. Third parties sell managed hosting; see [Hosting Providers](/guides/hosting-providers).
- **Not multi-tenant.** Upstream's trust model is one trusted operator per Gateway. Give mutually untrusted people separate Gateways.

---

## Security: read this first

OpenClaw gives a language model real access to your machine. Know these facts before you install:

| Fact | What it means |
|---|---|
| **Host exec defaults to `full`** | The agent can run any shell command as your user without asking. Turn approvals on with `openclaw config set tools.exec.mode ask`. |
| **Sandbox is off by default** | `agents.defaults.sandbox.mode` is `"off"`, so tools run on the host. |
| **Gateway auth is on by default** | Onboarding generates a token, and the Gateway refuses to bind beyond loopback without auth. The risk is turning it off (`gateway.auth.mode: "none"`) or exposing the port carelessly. |
| **Many advisories** | As of 2026-10-18 GitHub lists 722 security advisories for openclaw/openclaw (14 critical, 249 high). Stay on a current release. |
| **Skills are code** | Malicious skills have been published to ClawHub. Review before installing. |

### How to stay safe

1. **Update often:** `openclaw update`.
2. **Keep the Gateway on loopback** (`gateway.bind: "loopback"`, the default). For remote access use SSH tunnels or Tailscale, not a public port.
3. **Keep token auth on** (`gateway.auth.mode: "token"`).
4. **Turn on exec approvals:** `openclaw config set tools.exec.mode ask`.
5. **Consider the sandbox** for anything that reads untrusted input: `agents.defaults.sandbox.mode: "non-main"` or `"all"` (needs Docker or another backend). Note that the global `--container` flag only runs the CLI inside an existing container; it is not a sandbox.
6. **Audit your setup:** `openclaw security audit --deep`.

See [Security Overview](/security/overview) and the [Hardening Guide](/security/hardening).

:::warning
Do not run OpenClaw as root. Do not expose port 18789 to the internet. Do not install skills you have not read.
:::

---

## The cost question

OpenClaw itself is free. Your bill comes from model tokens, and it depends almost entirely on which model you use and how much the agent runs unattended. Check your provider's current price list rather than trusting a table on a community site.

The main levers, all real config keys:

| Lever | How |
|---|---|
| Cheaper model for the heartbeat | `agents.defaults.heartbeat.model`, e.g. `anthropic/claude-haiku-5-5` |
| Less frequent heartbeat | `agents.defaults.heartbeat.every: "1h"` (or `"0m"` to turn the recurring heartbeat off) |
| Only during waking hours | `agents.defaults.heartbeat.activeHours: { start: "08:00", end: "22:00" }` |
| Smaller heartbeat context | `agents.defaults.heartbeat.isolatedSession: true` and `lightContext: true` |
| Local models | Ollama, LM Studio or vLLM; see [Local Models](/guides/local-models) |

See [Cost Management](/guides/cost-management) and the official [heartbeat docs](https://docs.openclaw.ai/gateway/heartbeat).

---

## How does it compare?

| Tool | Type | Runs where | Reaches you via | Open source |
|---|---|---|---|---|
| **OpenClaw** | General-purpose personal agent | Your hardware | Control UI, apps, 20+ chat channels | Yes (MIT) |
| **Claude Code, Codex CLI** | Coding agents | Your terminal | Terminal, IDE | Codex CLI yes, Claude Code no |
| **Cursor, GitHub Copilot** | IDE assistants | Vendor cloud plus IDE | IDE | No |
| **Open Interpreter** | CLI agent | Your machine | Terminal | Yes |
| **CrewAI** | Multi-agent framework | Your code | Your app | Yes |

OpenClaw can also drive Claude Code and Codex as agent harnesses. See [Comparison](/reference/comparison) for more.

---

## System requirements

| Component | Minimum | Recommended |
|---|---|---|
| **OS** | macOS, Linux, Windows (native [Windows Hub](https://docs.openclaw.ai/platforms/windows), PowerShell CLI, or WSL2) | macOS or Linux |
| **Node.js** | 24.16+ or 26.1+ (22, 23 and 25 are unsupported) | 26 |
| **RAM** | 1 GB (Gateway only, cloud models) | 2 GB+ |
| **Disk** | 500 MB | 2 GB+ for memory, sessions and logs |
| **Network** | Outbound HTTPS to your model provider | Stable connection |

The installer script provisions a supported Node.js if needed. **Raspberry Pi** 4 and 5 with a 64-bit OS are supported Gateway hosts ([Raspberry Pi guide](https://docs.openclaw.ai/install/raspberry-pi)); 32-bit ARM (ARMv7) is not.

For **local models**, the GPU matters far more than the Gateway. See [Local Models](/guides/local-models) for sizing.

---

## Next steps

| Step | Link |
|---|---|
| Install OpenClaw | [Installation](/getting-started/installation) |
| Get your first chat working | [Quick Start](/getting-started/quick-start) |
| Understand the moving parts | [Core Concepts](/getting-started/core-concepts) |
| Structured learning path | [First 7 Days](/guides/first-7-days) |
| Lock down security | [Security Hardening](/security/hardening) |
