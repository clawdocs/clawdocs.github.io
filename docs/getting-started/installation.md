---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Installation
description: Install OpenClaw with the installer script, npm, Docker, a desktop app, or from source, then update and uninstall it cleanly
keywords: [openclaw, openclaw install, openclaw setup, how to install openclaw, openclaw docker, openclaw npm, openclaw windows, openclaw raspberry pi]
---

# Installation

OpenClaw runs on **macOS**, **Linux** (including 64-bit Raspberry Pi) and **Windows**. Pick one method below. The official reference is [docs.openclaw.ai/install](https://docs.openclaw.ai/install).

## Prerequisites

- **Node.js 24.16+ or 26.1+** (Node 26 recommended). Node 22, 23 and 25 are unsupported since v2026.9.3 ([Node.js requirements](https://docs.openclaw.ai/install/node)). The installer script provisions a supported Node for you if it is missing.
- **An AI provider:** an existing Claude Code or Codex CLI login, a provider API key (Anthropic, OpenAI, OpenRouter, Google, xAI and many others), or a local model server. Onboarding can detect and reuse what you have.
- **pnpm** only if you build from source.

## Method 1: Installer script (recommended)

macOS, Linux and WSL2:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Windows (PowerShell):

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

The script detects your OS, installs Node if needed, installs the `openclaw` package and starts onboarding. To install without onboarding:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
```

To keep OpenClaw and its own Node under a local prefix (no system Node), use `https://openclaw.ai/install-cli.sh` instead. All installer flags are in [Installer internals](https://docs.openclaw.ai/install/installer).

## Method 2: npm, pnpm or Bun

If you already manage Node yourself. With npm 12 or 11.16+:

```bash
npm install -g openclaw@latest --allow-scripts=openclaw
openclaw onboard --install-daemon
```

npm 12 blocks package lifecycle scripts unless you allow them, so `--allow-scripts=openclaw` is required there. On npm 11.15 and earlier, drop the flag.

pnpm:

```bash
pnpm add -g --allow-build=openclaw openclaw@latest
openclaw onboard --install-daemon
```

Bun (1.4.3+) works too: see [Bun](https://docs.openclaw.ai/install/bun).

:::tip Permission errors on `npm install -g`
Do not use `sudo npm`. Point npm's global prefix at a directory you own (for example `npm config set prefix ~/.npm-global` and add `~/.npm-global/bin` to `PATH`), or use the installer script. See [Node setup](https://docs.openclaw.ai/install/node).
:::

## Method 3: Desktop apps

- **Windows:** the native **Windows Hub** is the recommended desktop path: a signed installer with setup, tray status, chat and node mode. Download it from the [Windows Hub releases](https://github.com/openclaw/openclaw-windows-node/releases/latest) (x64 and Arm64). Details: [Windows](https://docs.openclaw.ai/platforms/windows).
- **macOS:** download `OpenClaw-<version>.dmg` from [GitHub releases](https://github.com/openclaw/openclaw/releases) and launch **OpenClaw.app** (menu bar app). Details: [macOS](https://docs.openclaw.ai/platforms/macos).
- **iOS and Android:** official companion apps on the App Store and Google Play. They pair with a running Gateway; they do not replace it. See [Platforms](https://docs.openclaw.ai/platforms).

Both desktop apps can set up a local Gateway on first run or connect to a remote one.

## Method 4: Docker

Use Docker for a headless server or an isolated Gateway. The supported path is the setup script in the repo, which builds or pulls the image, runs onboarding, writes a Gateway token to `.env` and starts Docker Compose:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
./scripts/docker/setup.sh
```

Then open `http://127.0.0.1:18789/` and paste the token from `.env`. Full guide: [Docker](https://docs.openclaw.ai/install/docker).

If you write your own `docker run` or Compose file, get these right:

- **State lives at `/home/node/.openclaw`** inside the container (the image runs as user `node`). Mount your volume there, not at `/root/.openclaw`, or nothing persists.
- **Publish on loopback:** `-p 127.0.0.1:18789:18789`, not `-p 18789:18789`, which exposes the Gateway on every host interface. Reach it remotely through an SSH tunnel or Tailscale.
- **Set a token:** pass `OPENCLAW_GATEWAY_TOKEN`. Inside a container the Gateway must bind beyond loopback (`--bind lan`) to receive traffic, and it refuses to do that without auth.
- **Health checks:** the image's built-in `HEALTHCHECK` uses `/healthz`. `/readyz` is the deeper, channel-aware probe.
- Use only `ghcr.io/openclaw/openclaw` or the Docker Hub mirror `openclaw/openclaw`.

On upgrade, the container entrypoint runs `openclaw doctor --fix` against the mounted state before the Gateway starts. Podman, Nix, Kubernetes, Ansible and cloud recipes are listed on the [install index](https://docs.openclaw.ai/install); see also [Deployment Options](/guides/deployment-options).

## Method 5: From source (developers)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
corepack enable
pnpm install && pnpm build && pnpm ui:build
pnpm add --global "openclaw@link:$PWD"
openclaw onboard --install-daemon
```

`pnpm ui:build` builds the Control UI; skip it and the dashboard will not load. On a server that only runs OpenClaw, `pnpm build:runtime` is a lighter build. Development workflow: [Setup](https://docs.openclaw.ai/start/setup).

## Raspberry Pi

Pi 4 or 5 with 2 GB+ RAM and **64-bit** Raspberry Pi OS works well as an always-on Gateway (models run in the cloud). Use the installer script as in Method 1. Follow the [Raspberry Pi guide](https://docs.openclaw.ai/install/raspberry-pi) for swap and SD-card tips. 32-bit OS images are not supported.

## Post-install setup

The installer script starts onboarding for you. Otherwise run:

```bash
openclaw onboard --install-daemon
```

Onboarding:

1. **Sets up model access.** It detects a Claude Code or Codex login or an API key and verifies it with a real request, or walks you through provider setup.
2. **Creates the workspace** at `~/.openclaw/workspace` and writes `~/.openclaw/openclaw.json`, including a generated Gateway token.
3. **Installs the Gateway service** (with `--install-daemon`): a LaunchAgent on macOS, a systemd user service on Linux and WSL2, or a Scheduled Task on Windows.

Channels can be added later with `openclaw channels add`. To change things afterwards, use `openclaw configure`. Onboarding reference: [Onboarding (CLI)](https://docs.openclaw.ai/start/wizard).

:::tip
Without `--install-daemon`, onboarding can leave the Gateway running in the foreground of that terminal. Install the background service any time with `openclaw gateway install`.
:::

## Verify installation

```bash
openclaw --version        # CLI is on PATH
openclaw doctor           # config and environment checks
openclaw gateway status   # service running, RPC probe OK
openclaw dashboard        # opens the Control UI with your token
```

Send a message in the Control UI chat. If you get a reply, the install works. For a one-shot test from the terminal:

```bash
openclaw agent --agent main --message "Hello, what can you do?"
```

If something fails, `openclaw triage` collects sanitized diagnostics and suggests fixes.

## Updating

```bash
openclaw update
```

`openclaw update` works for npm, pnpm and git installs. It runs `openclaw doctor` afterwards, migrates config and can roll back on failure. Prefer it over `npm update -g`, which skips those steps. Useful options:

```bash
openclaw update --dry-run                    # preview
openclaw update status                       # current channel and version
openclaw update --channel extended-stable    # monthly supported line
```

Desktop apps update through their own updaters, and Docker installs update by replacing the image. See [Updating](https://docs.openclaw.ai/install/updating).

:::danger
**Update promptly.** OpenClaw publishes security fixes often (see [Known Vulnerabilities](/security/known-vulnerabilities)). Running an old version exposes you to published exploits.
:::

## Uninstalling

```bash
openclaw uninstall --dry-run --all   # preview what would be removed
openclaw uninstall                   # interactive; preselects the Gateway service
openclaw uninstall --all             # service + state + workspace + app
```

Then remove the CLI itself, for example `npm uninstall -g openclaw`.

:::warning
`--state` keeps your workspace unless you also pass `--workspace`. Deleting `~/.openclaw` by hand removes everything, including `~/.openclaw/workspace` (your memory, `SOUL.md` and skills). Back up first with `openclaw backup create`. See [Uninstall](https://docs.openclaw.ai/install/uninstall).
:::

## Next steps

- [Quick Start](/getting-started/quick-start): your first conversation in 5 minutes
- [Core Concepts](/getting-started/core-concepts): Gateway, agent, tools, memory and heartbeat
- [Deployment Options](/guides/deployment-options): servers, VPS and containers
- [Configuration Reference](/reference/configuration): how `openclaw.json` works
- [Security Hardening](/security/hardening): do this before connecting channels
