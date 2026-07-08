---
sidebar_position: 2
title: Installation
description: Three ways to install OpenClaw — one-liner, npm, or git clone for developers
keywords: [openclaw, openclaw install, openclaw setup, how to install openclaw, openclaw docker, openclaw npm, openclaw getting started]
---

# Installation

OpenClaw runs on **macOS**, **Linux**, and **Windows**. Choose the installation method that fits your workflow.

## Prerequisites

- **Node.js 24** (recommended) or **Node.js 22 LTS** (22.19+ minimum). Node 23.11+ currently works, but avoid it — starting with v2026.7.1 the installer, CLI launcher, and `openclaw doctor` reject Node 23 and steer you to Node 22 or 24.
- **pnpm** (for git/developer installs — run `corepack enable` first)
- A supported LLM API key (Anthropic, OpenAI, OpenRouter, Google, xAI) *or* a local model setup

## Method 1: One-Liner (Recommended)

The fastest way to get started:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

This downloads the latest release, installs it globally, and prompts you to run onboarding.

## Method 2: npm

```bash
npm i -g openclaw
openclaw onboard
```

## Method 3: Docker

Run OpenClaw as a container — ideal for servers and VPS deployments:

```bash
docker run -d \
  --name openclaw \
  --restart unless-stopped \
  -v ~/.openclaw:/root/.openclaw \
  -p 18789:18789 \
  ghcr.io/openclaw/openclaw:latest
```

One-click deployment is also available via **[Coolify](https://coolify.io)**, **[1Panel](https://1panel.dev)**, and **[Portainer](https://portainer.io)** templates. See [Deployment Options](/guides/deployment-options) for full Docker Compose, Kubernetes Helm, and cloud hosting guides.

## Method 4: Git Clone (Developer Mode)

For contributors or anyone who wants to hack on OpenClaw itself:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
corepack enable
pnpm install
pnpm build
```

Then link it globally:

```bash
pnpm link --global
```

## Post-Install Setup

After installation, run the onboarding wizard:

```bash
openclaw onboard --install-daemon
```

This does three things:

1. **Connects your LLM** — Enter your API key (Anthropic, OpenAI, xAI) or configure a local model endpoint
2. **Installs the gateway daemon** — Sets up `openclaw gateway` as a background service
3. **Connects messaging channels** — Walk through connecting WhatsApp, Telegram, Slack, or other platforms

:::tip
The `--install-daemon` flag registers the gateway as a system service so it starts on boot. You can skip this and run `openclaw gateway` manually if you prefer.
:::

## Verify Installation

```bash
# Check version
openclaw --version

# Check gateway status
openclaw status

# Send a test message
openclaw chat "Hello, what can you do?"
```

## macOS Menubar App (Beta)

A companion menubar app is available for macOS:

```bash
openclaw install-menubar
```

This gives you quick access to gateway status, recent conversations, and settings from the system tray.

## Updating

```bash
# If installed via npm/one-liner
npm update -g openclaw

# If installed via git
cd openclaw
git pull
pnpm install
pnpm build
```

:::danger
**Always update promptly.** OpenClaw has had critical security vulnerabilities (including [CVE-2026-25253](/security/known-vulnerabilities)). Running outdated versions exposes you to known exploits.
:::

## Uninstalling

```bash
# Stop the daemon
openclaw gateway stop

# Remove global install
npm uninstall -g openclaw

# Remove data (optional — this deletes your memory and config)
rm -rf ~/.openclaw
```

## Next Steps

- [Quick Start](/getting-started/quick-start) — Get your first agent conversation in 5 minutes
- [Core Concepts](/getting-started/core-concepts) — Understand the Gateway, Brain, Hands, and Heartbeat
- [Deployment Options](/guides/deployment-options) — Docker, 1Panel, Coolify, and cloud hosting
- [Configuration Reference](/reference/configuration) — Full config file documentation
