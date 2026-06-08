---
sidebar_position: 1
title: Introduction
description: What is OpenClaw and why it matters — the open-source autonomous AI agent with 377k+ stars
---

# Introduction to OpenClaw

**OpenClaw** is a free, open-source, autonomous AI agent that runs locally on your machine. It connects large language models — Claude, GPT, Grok, or fully local models — to your files, shell, browser, messaging apps, and dozens of other services.

Think of it as a personal AI assistant that actually *does things*, not just answers questions.

## What Makes OpenClaw Different

Unlike chatbots that wait for you to type, OpenClaw is an **autonomous agent**:

| Feature | Traditional Chatbot | OpenClaw |
|---------|-------------------|----------|
| Execution | Responds to prompts | Acts proactively via heartbeat |
| Scope | Text in, text out | Full system access (files, shell, browser, APIs) |
| Memory | Session-based | Persistent local Markdown memory |
| Integrations | None | 50+ platforms (WhatsApp, Slack, Gmail, GitHub...) |
| Hosting | Cloud service | Runs on your machine |
| Privacy | Data sent to provider | All data stays local |

## Key Capabilities

- **Autonomous operation** — The [heartbeat system](/architecture/heartbeat) checks for pending tasks every 30 minutes and takes action without prompting
- **Multi-platform messaging** — Operate through WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Teams, Feishu/Lark, and more
- **10,700+ skills** — Extensible via [ClawHub](/guides/clawhub), the community skill marketplace with security scanning
- **Model-agnostic** — Works with any LLM provider or [local models](/guides/local-models) via Ollama/vLLM
- **Self-improving** — Can write code for its own new capabilities
- **Private by default** — All data stored locally as Markdown files

## A Brief History

OpenClaw has had one of the most dramatic trajectories in open-source history:

1. **November 2025** — Created by **Peter Steinberger** (founder of PSPDFKit) as **Clawdbot**
2. **January 27, 2026** — Renamed to **Moltbot** after Anthropic filed trademark complaints over the "Clawd" name being too close to "Claude"
3. **January 28, 2026** — **Moltbook** launches — a social network where AI agents autonomously post, comment, and vote. Andrej Karpathy calls it *"the most incredible sci-fi takeoff-adjacent thing"*
4. **January 30, 2026** — Renamed again to **OpenClaw** ("Moltbot never quite rolled off the tongue") — completing the fastest triple rebrand in open-source history
5. **January 30, 2026** — **CVE-2026-25253** disclosed: a critical one-click RCE vulnerability. Patched in v2026.1.29
6. **Late January 2026** — Goes massively viral, gaining **100,000+ GitHub stars in ~2 days** — the fastest repo to 100K stars in GitHub history
7. **February 2026** — 341 malicious ClawHub skills discovered; VirusTotal partnership announced; 40,000+ exposed instances found; adopted by Alibaba and Tencent; banned by Korean tech firms

As of June 2026, OpenClaw has **377,000+ GitHub stars**, 78,900+ forks, and 365+ contributors. It drew 2 million visitors to its website in a single week.

:::info
Steinberger has said he *"ships code he doesn't read"* — having made 6,600 commits in January alone using AI coding tools. This philosophy of rapid AI-assisted development is both OpenClaw's strength and a source of its security challenges.
:::

## Who Is This For?

OpenClaw is aimed at:

- **Developers** who want an AI that can read/write code, run tests, manage repos
- **Power users** who want to automate email triage, messaging, scheduling
- **Self-hosters** who value privacy and local-first architecture
- **Tinkerers** who want to build custom AI skills and workflows

:::warning
OpenClaw grants your AI agent significant system access. It has been described as a *"security dumpster fire"* by npm's founding CTO and a *"security nightmare"* by Cisco. Before deploying, read the [Security Guide](/security/overview) carefully. Start with read-only permissions and expand gradually.
:::

## The Cost Question

OpenClaw itself is free (MIT license), but LLM API costs can add up quickly:

| Usage Level | Approximate Daily Cost |
|-------------|----------------------|
| Light (CLI chat only) | $1–5 |
| Moderate (heartbeat + channels) | $5–20 |
| Heavy (many channels, complex skills) | $20–50+ |
| Local models (Ollama/vLLM) | $0 |

Some users have reported bills of $600+/month with heavy use. See [Local Models](/guides/local-models) for the zero-cost alternative and [Performance Tuning](/guides/performance-tuning) for techniques that have cut costs by 97%.

## Next Steps

- [Install OpenClaw](/getting-started/installation) on your machine
- Follow the [Quick Start](/getting-started/quick-start) to get running in 5 minutes
- Understand the [Core Concepts](/getting-started/core-concepts) behind the architecture
- Walk through the [First 7 Days](/guides/first-7-days) for a structured learning path
