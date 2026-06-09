---
sidebar_position: 1
title: Introduction
description: What is OpenClaw and why it matters — the open-source autonomous AI agent with 377k+ stars
---

# Introduction to OpenClaw

**OpenClaw** is a free, open-source, autonomous AI agent that runs locally on your machine. It connects large language models — Claude, GPT, Gemini, DeepSeek, Grok, or fully local models — to your files, shell, browser, messaging apps, and dozens of other services.

Think of it as a personal AI assistant that actually *does things*, not just answers questions.

---

## What Makes OpenClaw Different

Unlike chatbots that wait for you to type, OpenClaw is an **autonomous agent**:

| Feature | Traditional Chatbot | OpenClaw |
|---------|-------------------|----------|
| Execution | Responds to prompts | Acts proactively via heartbeat |
| Scope | Text in, text out | Full system access (files, shell, browser, APIs) |
| Memory | Session-based | Persistent local Markdown memory |
| Integrations | None or few | 50+ platforms (WhatsApp, Slack, Gmail, GitHub...) |
| Hosting | Cloud service | Runs on your machine |
| Privacy | Data sent to provider | All data stays local |
| Extensibility | Limited | 10,700+ community skills, 32,600+ MCP servers |
| Autonomy | None | Heartbeat fires every 30 min, takes action without prompting |

---

## Key Capabilities

### Agent Fundamentals

- **Autonomous operation** — The [heartbeat system](/architecture/heartbeat) checks for pending tasks every 30 minutes and takes action without prompting
- **Persistent memory** — Remembers facts, preferences, and context across sessions using local Markdown files
- **Multi-step reasoning** — Breaks complex tasks into steps, executes them, and reports results
- **Execution approval** — Asks permission before running shell commands (configurable: ask, auto, or deny)

### Integrations

- **50+ messaging channels** — WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Teams, Matrix, Feishu/Lark, and more
- **MCP ecosystem** — 32,600+ Model Context Protocol servers with 229,800+ tools for databases, APIs, cloud services
- **Browser automation** — Fill forms, scrape pages, interact with web apps
- **Email** — Gmail integration with label management, auto-reply, digest generation

### Extensibility

- **10,700+ skills** — Reusable task templates on [ClawHub](/guides/clawhub), the community marketplace with security scanning
- **Model-agnostic** — Works with any LLM provider (Anthropic, OpenAI, Google, DeepSeek, xAI) or [local models](/guides/local-models) via Ollama, LM Studio, vLLM
- **Multi-agent** — Spawn sub-agents for parallel work: research pipelines, DevOps fleets, specialized workers
- **Plugin system** — Extend the gateway with custom functionality

### Advanced Features

- **Workboard** — Visual task management for tracking multi-step agent work
- **Voice and multimodal** — Voice input/output, image understanding, screen reading
- **Dreaming mode** — Self-directed exploration during idle heartbeat cycles
- **Self-improving** — Can write code for its own new capabilities

---

## A Brief History

OpenClaw has had one of the most dramatic trajectories in open-source history:

1. **November 2025** — Created by **Peter Steinberger** (founder of PSPDFKit) as **Clawdbot**
2. **January 27, 2026** — Renamed to **Moltbot** after Anthropic filed trademark complaints over the "Clawd" name being too close to "Claude"
3. **January 28, 2026** — **Moltbook** launches — a social network where AI agents autonomously post, comment, and vote. Andrej Karpathy calls it *"the most incredible sci-fi takeoff-adjacent thing"*
4. **January 30, 2026** — Renamed again to **OpenClaw** ("Moltbot never quite rolled off the tongue") — completing the fastest triple rebrand in open-source history
5. **January 30, 2026** — **CVE-2026-25253** disclosed: a critical one-click RCE vulnerability. Patched in v2026.1.29
6. **Late January 2026** — Goes massively viral, gaining **100,000+ GitHub stars in ~2 days** — the fastest repo to reach 100K stars in GitHub history
7. **February 2026** — 341 malicious ClawHub skills discovered; VirusTotal partnership announced; 40,000+ exposed instances found; adopted by Alibaba and Tencent; banned by Korean tech firms
8. **March 2026** — Structured heartbeat tasks, plugin system v2, and major security hardening
9. **June 2026** — **377,000+ GitHub stars**, 78,900+ forks, 365+ contributors

:::info
Steinberger has said he *"ships code he doesn't read"* — having made 6,600 commits in January alone using AI coding tools. This philosophy of rapid AI-assisted development is both OpenClaw's strength and a source of its security challenges.
:::

---

## Community and Ecosystem

| Metric | Count |
|--------|-------|
| GitHub stars | 377,000+ |
| GitHub forks | 78,900+ |
| Contributors | 365+ |
| Discord members | ~176,000 |
| Reddit subscribers | 143,000+ (r/OpenClaw + r/Clawdbot) |
| ClawHub skills | 10,700+ |
| MCP servers | 32,600+ |
| MCP tools | 229,800+ |

Notable community projects include **Nanobot** (15.9K stars, lightweight alternative), **memU** (8.8K stars, memory system), **Moltworker** (8.4K stars, Docker deployment), and **NanoClaw** (6.9K stars, minimal fork). See [Ecosystem](/reference/ecosystem) for the full landscape.

---

## Who Is This For?

OpenClaw is aimed at:

- **Developers** who want an AI that can read/write code, run tests, manage repos, and automate DevOps
- **Power users** who want to automate email triage, messaging, scheduling, and research
- **Self-hosters** who value privacy and local-first architecture
- **Tinkerers** who want to build custom AI skills and workflows
- **Teams** who want a shared AI agent for monitoring, alerting, and coordination

---

## What OpenClaw is NOT

Setting the right expectations:

- **Not a web UI** — OpenClaw is a CLI and gateway. For a web interface, see [WebClaw](/guides/webclaw) (separate project, 637 stars)
- **Not a coding IDE** — It can write and edit code, but it's not a replacement for VS Code or Cursor. It's a general-purpose agent, not a code editor
- **Not free to run** — OpenClaw itself is MIT-licensed and free, but LLM API calls cost money. Local models are free but require capable hardware
- **Not secure by default** — It runs with your user permissions, has had 10 CVEs in 6 months, and has been called a *"security dumpster fire."* Read the [Security Guide](/security/overview) before deploying
- **Not a hosted service** — You run it on your own machine or server. There's no cloud version (by design — privacy is a core value)

---

## Security: Read This First

OpenClaw grants your AI agent significant system access. Before deploying, understand the risks:

| Risk | Detail |
|------|--------|
| **Full system access** | Runs as your user — can read/write any file, execute any command |
| **10 CVEs in 6 months** | Including a critical one-click RCE (CVE-2026-25253) |
| **Exposed instances** | 40,000+ gateways found open on the internet in February 2026 |
| **Malicious skills** | 341 trojanized skills (12% of ClawHub at the time) discovered in the ClawHavoc campaign |
| **No auth by default** | Gateway port 18789 is open without authentication unless configured |

### How to Stay Safe

1. **Always update** — Critical patches ship frequently
2. **Bind to localhost** — Don't expose port 18789 to the internet
3. **Enable gateway authentication** — Set a token or use reverse proxy auth
4. **Start with `ask` permission mode** — Approve each shell command before it runs
5. **Run `openclaw security audit --deep`** — Built-in security scanner
6. **Use sandboxing** — Docker container, `--container` flag, or VM for high-risk tasks

See [Security Overview](/security/overview) and [Hardening Guide](/security/hardening) for complete guidance.

:::warning
Start with read-only permissions and expand gradually. Do not run OpenClaw as root. Do not expose the gateway to the internet without authentication.
:::

---

## The Cost Question

OpenClaw itself is free (MIT license), but LLM API costs can add up quickly:

| Usage Level | Approximate Daily Cost | Monthly |
|-------------|----------------------|---------|
| Light (CLI chat only) | $1-5 | $30-150 |
| Moderate (heartbeat + channels) | $5-20 | $150-600 |
| Heavy (many channels, complex skills) | $20-50+ | $600-1,500+ |
| Local models (Ollama/vLLM) | $0 | $0 |

### Reducing Costs

The biggest cost driver is the **heartbeat** — it fires every 30 minutes, 24/7, each cycle consuming tokens. Five changes can cut costs by up to 97%:

| Change | Effect |
|--------|--------|
| Use Haiku/cheap model for heartbeat | Save 80-90% of heartbeat cost |
| Increase heartbeat interval to 60 min | Save 50% |
| Enable quiet hours (no heartbeat while sleeping) | Save 33% |
| Use a local model for heartbeat | Save 100% of heartbeat API cost |
| Enable `isolatedSession` for heartbeat | Reduce context from 100K to 2-5K tokens per cycle |

One documented case: **$1,200/month reduced to $36/month** with model routing alone.

See [Cost Management](/guides/cost-management) and [Performance Tuning](/guides/performance-tuning) for detailed strategies. For the zero-cost path, see [Local Models](/guides/local-models).

---

## How Does It Compare?

OpenClaw occupies a unique position — the only open-source agent with full system access, 50+ channel integrations, persistent memory, and autonomous heartbeat:

| Agent | Type | Autonomy | Integrations | Cost | Open Source |
|-------|------|----------|-------------|------|-------------|
| **OpenClaw** | General-purpose agent | Full (heartbeat) | 50+ channels | $0 + API | Yes (MIT) |
| **Devin** | Coding agent | Task-based | IDE only | $500/mo | No |
| **Cursor Agent** | Coding agent | IDE-embedded | IDE only | $20-40/mo | No |
| **GitHub Copilot Agent** | Coding agent | GitHub-integrated | GitHub | $10-39/mo | No |
| **Open Interpreter** | CLI agent | Reactive only | Shell only | $0 + API | Yes |
| **CrewAI** | Multi-agent framework | Framework-level | Programmatic | $0 + API | Yes |

OpenClaw is the most autonomous and most integrated option — and also the highest risk. The commercial alternatives (Devin, Cursor, Copilot) are more constrained but safer.

See [Comparison](/reference/comparison) for the full feature matrix.

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | macOS, Linux, Windows (WSL2 required) | macOS or Linux |
| **Node.js** | 22.19+ LTS | 24 |
| **RAM** | 2 GB (gateway only) | 4 GB+ |
| **Disk** | 500 MB | 2 GB+ (for memory, skills, logs) |
| **Network** | Outbound HTTPS (for cloud LLMs) | Stable connection |

For **local models**, add GPU requirements:

| VRAM | Recommended Model | Quality |
|------|-------------------|---------|
| 8 GB | Qwen3 8B | Basic tasks |
| 16 GB | Qwen3 14B | Good for most tasks |
| 24 GB (RTX 4090) | Qwen3 32B | Excellent daily driver |
| 40-80 GB (A100) | Llama 3.3 70B | Near-cloud quality |

:::caution
**Windows** requires WSL2 — native Windows support is experimental. **Raspberry Pi** and ARM single-board computers are not supported.
:::

---

## Next Steps

| Step | Time | Link |
|------|------|------|
| Install OpenClaw | 2 min | [Installation](/getting-started/installation) |
| Get your first chat working | 5 min | [Quick Start](/getting-started/quick-start) |
| Understand the architecture | 10 min | [Core Concepts](/getting-started/core-concepts) |
| Structured learning path | 7 days | [First 7 Days](/guides/first-7-days) |
| Lock down security | 15 min | [Security Hardening](/security/hardening) |
