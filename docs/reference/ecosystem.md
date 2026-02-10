---
sidebar_position: 7
title: Ecosystem & Community Tools
description: 25+ community-built tools, clients, deployment platforms, security tools, and alternatives in the OpenClaw ecosystem
---

# Ecosystem & Community Tools

OpenClaw's explosive growth (0 to 183k GitHub stars in ~60 days) has spawned one of the richest ecosystems in open-source AI. This page catalogs **25+ notable projects** across 10 categories.

## Top Projects by Stars

| Rank | Project | Stars | Category |
|------|---------|-------|----------|
| 1 | [Nanobot](#nanobot) | 15,900 | Lightweight Alternative |
| 2 | [Awesome OpenClaw Skills](#awesome-openclaw-skills) | 13,000 | Skill Collection |
| 3 | [memU](#memu) | 8,800 | Memory Framework |
| 4 | [Moltworker](#moltworker) | 8,400 | Deployment |
| 5 | [NanoClaw](#nanoclaw) | 6,900 | Lightweight Alternative |
| 6 | [ClawHub](#clawhub) | 1,700 | Skill Registry |
| 7 | [Awesome Use Cases](#awesome-openclaw-use-cases) | 1,000 | Community |
| 8 | [MimiClaw](#mimiclaw) | 807 | Embedded/IoT |
| 9 | [VisionClaw](#visionclaw) | 681 | Wearables |
| 10 | [Awesome OpenClaw](#awesome-openclaw) | 560 | Community |

---

## Official Projects

| Project | Stars | Description | Link |
|---------|-------|-------------|------|
| **OpenClaw** | 183k | The core autonomous AI agent | [GitHub](https://github.com/openclaw/openclaw) |
| **ClawHub** | 1,700 | Official skill marketplace (5,700+ skills) | [GitHub](https://github.com/openclaw/clawhub) |
| **Lobster** | 440 | Official workflow shell for composable pipelines | [GitHub](https://github.com/openclaw/lobster) |
| **Skills Archive** | — | Snapshot of all ClawHub skill versions | [GitHub](https://github.com/openclaw/skills) |
| **macOS Companion** | — | Menu bar app with gateway health, voice control, debug tools | Included in OpenClaw |
| **iOS/Android** | — | Mobile companion apps (in development) | In main repo |

### Lobster {#lobster}

The official OpenClaw workflow shell — a typed, local-first macro engine that turns skills and tools into composable pipelines.

- **Stars**: 440 | **License**: MIT | **Stack**: TypeScript (99.7%)
- Typed pipelines using JSON/objects
- YAML/JSON workflow definitions
- Approval gates for side-effect actions
- Stateful workflows with persistence between runs
- Data shaping tools (`where`, `pick`, `head`)
- Reduces token usage through composable automation

### ClawHub {#clawhub}

The official public skill registry with 5,700+ community skills.

- **Stars**: 1,700 | **License**: MIT
- **Stack**: TanStack Start (React/Vite/Nitro), Convex (database, file storage), OpenAI embeddings for vector search
- Browse, search, install, and manage skills from the CLI or web

:::warning
As of February 2026, 341 malicious skills were found on ClawHub (12% of submissions). Always verify skills before installing — see [Skill Verification](/security/skill-verification).
:::

---

## Alternative Clients & Frontends

### WebClaw

A fast, browser-based web client. Connects to the Gateway over WebSockets.

- **Stars**: 383 | **License**: MIT | **Stack**: TypeScript (98.1%)
- **Repo**: [github.com/ibelick/webclaw](https://github.com/ibelick/webclaw)
- **Website**: [webclaw.dev](https://webclaw.dev)
- **Status**: Beta | **Contributors**: 2
- **Setup guide**: [WebClaw Guide](/guides/webclaw)

### OpenClaw Windows Hub

Windows companion suite by **Scott Hanselman** — tray app, chat window, and PowerToys integration.

- **Stars**: 211 | **License**: MIT | **Stack**: C# (.NET), WebView2
- **Repo**: [github.com/shanselman/openclaw-windows-hub](https://github.com/shanselman/openclaw-windows-hub)
- Global hotkey (`Ctrl+Alt+Shift+C`) for quick messaging
- Windows 11-style tray app with dark/light mode
- Embedded WebView2 chat window with real-time sessions/channels/usage
- Clickable Windows toast notifications
- Start/stop Telegram and WhatsApp from the menu
- **Node Mode**: turns Windows PC into an agent-controllable device (screenshots, camera, commands)
- PowerToys Command Palette extension

### TitanShell

Security-first desktop client with tactical terminal UI.

- **Stars**: 6 | **License**: Sustainable Use License | **Stack**: Tauri 2.0 (Rust), Svelte 5.0
- **Repo**: [github.com/DaguangZhou/TitanShell](https://github.com/DaguangZhou/TitanShell)
- Sidecar architecture — OpenClaw runs as an isolated process
- Biometric keychain protection for API keys
- Zero-trust architecture with ephemeral tokens
- Resource monitoring (CPU/memory/disk)
- Cross-platform: Windows, macOS, Linux

---

## Deployment Tools

See the [Deployment Options guide](/guides/deployment-options) for setup instructions. Summary of projects:

### Moltworker {#moltworker}

**Cloudflare's official** adaptation running OpenClaw on Workers/Sandbox containers.

- **Stars**: 8,400 | **License**: Apache-2.0 | **Stack**: TypeScript, Cloudflare Workers
- **Repo**: [github.com/cloudflare/moltworker](https://github.com/cloudflare/moltworker)
- Fully managed, always-on deployment without self-hosting
- Multi-channel chat (Telegram, Discord, Slack)
- Device pairing auth, optional R2 persistent storage
- Browser automation via CDP
- Cloudflare AI Gateway routing
- **Cost**: ~$34.50/month on standard-1 instance

### OpenClaw Helm Chart

Kubernetes deployment via Helm. Built on bjw-s app-template.

- **Stars**: 60 | **License**: MIT
- **Repo**: [github.com/serhanekicii/openclaw-helm](https://github.com/serhanekicii/openclaw-helm)
- StatefulSet with Chromium sidecar for browser automation
- Non-root containers, read-only root filesystems, all capabilities dropped
- Dual config modes: "merge" (preserves runtime) or "overwrite" (strict GitOps)
- Init containers for auto-installing ClawHub skills
- ArgoCD and Stakater Reloader compatible
- Network policies with deny-all-ingress defaults
- Requires K8s 1.26+

### OpenClaw for Coolify

One-click deployment on Coolify (open-source PaaS).

- **Stars**: 96 | **Stack**: Shell, Dockerfile, Python, TypeScript
- **Repo**: [github.com/essamamdani/openclaw-coolify](https://github.com/essamamdani/openclaw-coolify)
- Docker Sidecar Proxy for sandboxing
- Cloudflare Tunnel integration
- SearXNG private search
- Pre-installed dev tools (GitHub CLI, Vercel, Bun, Python, ripgrep)
- **Requires**: ~13 GB free disk space for Docker build cache

### CoolLabs Docker Images

Automated Docker images by the Coolify team (Andras Bacsai).

- **Repo**: [github.com/coollabsio/openclaw](https://github.com/coollabsio/openclaw)
- CalVer versioning with roughly daily releases
- Scheduled builds every 6 hours
- Native arm64 builds
- Nginx reverse proxy config (`:8080` → `:18789`)

### OpenClaw Host Kit

Multi-tenant hosting platform — give each user their own private OpenClaw instance.

- **Stars**: 5 | **License**: MIT | **Stack**: Shell (55.8%), TypeScript (33.5%)
- **Repo**: [github.com/Agent-3-7/openclaw-host-kit](https://github.com/Agent-3-7/openclaw-host-kit)
- Per-user subdomains with resource isolation (CPU/memory/storage limits)
- Traefik reverse proxy with auto-HTTPS
- ttyd web terminals
- HMAC token auth with 24-hour TTL

### Other Deployment Options

| Platform | Description |
|----------|-------------|
| **1Panel** | Web-based server panel with one-click install (33.3k stars) — [Details](/guides/deployment-options#1panel) |
| **DigitalOcean** | Pre-configured Droplet from $24/mo — [Marketplace](https://marketplace.digitalocean.com/apps/openclaw) |
| **Hostinger** | Budget VPS with Docker template from ~$5/mo |
| **OpenClawd** | Managed hosting with automatic updates |

---

## Lightweight Alternatives

### Nanobot {#nanobot}

The ultra-lightweight OpenClaw — core agent functionality in ~4,000 lines of Python (99% smaller than OpenClaw's 430k+ lines). Created at the University of Hong Kong (HKUDS).

- **Stars**: 15,900 | **Forks**: 2,200 | **License**: MIT
- **Repo**: [github.com/HKUDS/nanobot](https://github.com/HKUDS/nanobot)
- **Stack**: Python 3.11+
- **Latest release**: v0.1.3.post6 (February 2026)
- Supports OpenRouter, Anthropic, OpenAI, DeepSeek, Groq, Gemini, local models via vLLM
- Telegram, Discord, WhatsApp, Feishu, DingTalk, Slack, Email, QQ
- Gained 8k+ stars in its first 4 days

### NanoClaw {#nanoclaw}

Security-focused alternative that runs agents inside isolated containers (Docker or Apple Containers).

- **Stars**: 6,900 | **Forks**: 835 | **License**: MIT
- **Repo**: [github.com/gavrielc/nanoclaw](https://github.com/gavrielc/nanoclaw)
- **Stack**: TypeScript (98.7%) | **Contributors**: 10
- Codebase "understandable in 8 minutes"
- WhatsApp connectivity, persistent memory, scheduled jobs
- Built on Anthropic's Agents SDK
- Rogue AI can only affect the sandbox, not your host system

### MimiClaw {#mimiclaw}

OpenClaw on a **$5 ESP32-S3 chip**. No Linux, no Node.js, no Raspberry Pi — pure C on embedded hardware.

- **Stars**: 807 | **License**: MIT
- **Repo**: [github.com/memovai/mimiclaw](https://github.com/memovai/mimiclaw)
- **Stack**: C (99.3%), CMake; ESP32-S3 with 16MB flash, 8MB PSRAM
- Telegram bot interface
- Claude API with tool-use
- Local-first memory, Brave Search, OTA updates
- **0.5W power consumption**, dual-core processing

### Mini-Claw

Minimalist Telegram bot using your Claude Pro/Max or ChatGPT Plus subscription — no API costs.

- **Stars**: 42 | **License**: MIT
- **Repo**: [github.com/htlin222/mini-claw](https://github.com/htlin222/mini-claw)
- **Stack**: Node.js 22+, TypeScript, grammY
- Session persistence with auto-compaction
- Workspace navigation (`/cd`), shell command execution
- Rate limiting, user allowlisting

### Comparison

| Project | Lines of Code | Language | Platforms | Unique Feature |
|---------|--------------|----------|-----------|----------------|
| **Nanobot** | ~4,000 | Python | 8 chat platforms | Research-ready, multi-LLM |
| **NanoClaw** | ~3,000 | TypeScript | WhatsApp | Container isolation |
| **MimiClaw** | Small | C | Telegram | Runs on $5 microcontroller |
| **Mini-Claw** | Small | TypeScript | Telegram | Uses existing subscriptions |

:::tip
These are **not drop-in replacements** for OpenClaw. They're useful if you need a subset of features, want a smaller attack surface, or prefer a different language/platform.
:::

---

## Memory & Companion Tools

### memU {#memu}

Memory framework for 24/7 proactive agents. Builds a local knowledge graph of user preferences, past projects, and habits.

- **Stars**: 8,800 | **License**: Apache-2.0
- **Repo**: [github.com/NevaMind-AI/memU](https://github.com/NevaMind-AI/memU)
- **Stack**: Python 3.13+, Rust components, PostgreSQL with pgvector
- Three-layer file-system-like memory architecture (Resource → Item → Category)
- Proactive context loading (no user commands needed)
- Intent capture across sessions
- Multi-LLM support (OpenAI, OpenRouter, custom)
- Cloud hosted ([memu.so](https://memu.so)) or self-deployable
- Growth directly correlated with OpenClaw's viral rise

### OpenClaw Observability Plugin

OpenTelemetry observability for OpenClaw agents.

- **Stars**: 3 | **License**: MIT
- **Repo**: [github.com/henrikrexed/openclaw-observability-plugin](https://github.com/henrikrexed/openclaw-observability-plugin)
- **Stack**: TypeScript (96.5%)
- Traces complete agent workflows with tool execution spans and token breakdowns
- Session context propagation
- Supports Dynatrace, Grafana Cloud, local OTel collectors
- Optional Tetragon kernel-level monitoring
- Two approaches: official diagnostics plugin (v2026.2+) and custom hook-based plugin

---

## Mobile, Desktop & Wearables

### VisionClaw {#visionclaw}

Real-time AI assistant for **Meta Ray-Ban smart glasses** with voice + vision + agentic actions.

- **Stars**: 681 | **License**: Custom
- **Repo**: [github.com/sseanliu/VisionClaw](https://github.com/sseanliu/VisionClaw)
- **Stack**: iOS native (Swift), iOS 17.0+, Xcode 15.0+
- ~1 FPS video capture from glasses camera
- Bidirectional audio streaming via Gemini Live API (WebSocket)
- 56+ connected skills via OpenClaw
- iPhone camera fallback mode for testing without glasses

### ClawPhone

OpenClaw on a **$25 Android smartphone** via Termux.

- **Stars**: 257 | **License**: —
- **Repo**: [github.com/marshallrichards/ClawPhone](https://github.com/marshallrichards/ClawPhone)
- **Stack**: Python (100%)
- OpenClaw on Android 8+ via Termux
- Hardware control through Termux:API
- Screen overlay daemon, local network dashboard
- Controlled remotely via Discord

### Official Mobile Apps

- **iOS**: Swift, available in source (`apps/ios/`), no App Store release yet
- **Android**: Kotlin + Jetpack Compose, minSdk 31 (`apps/android/`), no Play Store release yet
- **macOS Companion**: Beta available, Universal Binary on macOS 14+

---

## Security Tools

### ClawSec

Complete security skill suite — a "skill-of-skills" that validates and protects other skills.

- **Stars**: 265 | **License**: MIT
- **Repo**: [github.com/prompt-security/clawsec](https://github.com/prompt-security/clawsec)
- **Stack**: React/TypeScript + Vite (frontend), Python 3.10+ (backend)
- `clawsec-feed` — Advisory monitoring, NVD CVE polling
- `openclaw-audit-watchdog` — Automated security audits
- `soul-guardian` — Drift detection and auto-restore for critical files
- `clawtributor` — Community security reporting
- SHA256 checksum verification for all artifacts
- Featured on [SentinelOne blog](https://www.sentinelone.com/blog/clawsec-hardening-openclaw-agents-from-the-inside-out/)

### Clawprint

Tamper-evident audit trail for agent runs. SHA-256 hash chain ledger capturing every tool call and lifecycle event.

- **Stars**: 0 (new) | **License**: MIT
- **Repo**: [github.com/cyntrisec/clawprint](https://github.com/cyntrisec/clawprint)
- **Stack**: Rust, SQLite (WAL mode), Zstandard compression, Axum
- 24/7 daemon mode with web dashboard
- MCP integration for Claude Desktop
- Security scanner (destructive ops, prompt injection, privilege escalation)
- Automatic secret redaction, offline replay, cross-platform binaries

### ClawBands

Security middleware — intercepts tool executions and enforces human approval before dangerous actions.

- **Stars**: 34 | **License**: MIT
- **Repo**: [github.com/SeyZ/clawbands](https://github.com/SeyZ/clawbands)
- **Stack**: TypeScript (98%), Node.js >=18
- Synchronous blocking before file writes, shell commands, API calls
- Granular policies (different rules for reads/writes/deletes)
- Multi-channel approval (terminal, WhatsApp, Telegram)
- Complete audit logging in JSON, zero external API calls

### SkillGuard

Security scanner for OpenClaw skill files.

- **Repo**: [github.com/bossondehiggs/skillguard](https://github.com/bossondehiggs/skillguard)
- **Stack**: JavaScript (100%) | **License**: MIT
- Detects vulnerabilities, prompt injections, credential leaks, malicious patterns
- 4 severity levels (Critical/High/Medium/Low), 0-100 security score
- Scan single files or directories, JSON/text export

### OpenClaw Security Monitor

Proactive monitoring targeting known threats: ClawHavoc, AMOS stealer, CVE-2026-25253, memory poisoning, supply chain attacks.

- **Repo**: [github.com/adibirzu/openclaw-security-monitor](https://github.com/adibirzu/openclaw-security-monitor)
- 32 individual security scripts
- Daily automated scans
- Covers file permissions, exfiltration domain blocking, tool deny lists, gateway hardening

See the [Security Overview](/security/overview) for threat model and hardening guidance.

---

## Skill Collections & Curated Lists

### Awesome OpenClaw Skills {#awesome-openclaw-skills}

The largest curated collection — 2,999 community-built skills across 20+ categories.

- **Stars**: 13,000 | **Forks**: 1,400
- **Repo**: [github.com/VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills)
- Filters out ~2,748 skills from the full registry (spam, crypto, duplicates, security concerns)
- Categories include: Coding Agents (133), Git/GitHub (66), Web & Frontend Dev (201), DevOps & Cloud (212), Browser & Automation (139), Image/Video Generation (60), Search & Research (253), AI & LLMs (287), Marketing & Sales (145), Productivity (134), Communication (133)

### Awesome OpenClaw {#awesome-openclaw}

Curated list of 60+ OpenClaw resources, tools, and tutorials.

- **Stars**: 560 | **Forks**: 88
- **Repo**: [github.com/SamurAIGPT/awesome-openclaw](https://github.com/SamurAIGPT/awesome-openclaw)
- Covers: Official Resources, Installation Guides, Skill Registries, Messaging Platforms, Community Projects, Deployment Tools, Memory Systems, Enterprise Solutions, Monitoring Tools, Development Workflows

### Awesome OpenClaw Use Cases {#awesome-openclaw-use-cases}

Verified, real-world use cases (tested for at least a day before submission).

- **Stars**: 1,000 | **Forks**: 60
- **Repo**: [github.com/hesamsheikh/awesome-openclaw-usecases](https://github.com/hesamsheikh/awesome-openclaw-usecases)
- Categories: Social Media, Creative & Building, Productivity, Research & Learning
- Explicitly bans crypto use cases

### Awesome OpenClaw (Hosting-Focused)

The most comprehensive hosting resource with cost comparisons and security hardening.

- **Stars**: 107 | **Forks**: 15
- **Repo**: [github.com/rohitg00/awesome-openclaw](https://github.com/rohitg00/awesome-openclaw)
- Covers: free tiers, budget VPS, PaaS, serverless, managed services, hardware options

### OpenClaw Ecosystem Directory

Web directory of 80+ curated projects built with OpenClaw.

- **Website**: [openclawsearch.com](https://openclawsearch.com)

---

## Docker Images

| Image | Maintainer | Description |
|-------|-----------|-------------|
| `openclaw/openclaw` | OpenClaw team | Official image |
| `1panel/openclaw` | 1Panel team | Optimized for 1Panel App Store |
| `alpine/openclaw` | Community | Alpine-based minimal image |
| `coollabsio/openclaw` | Coolify team | Daily CalVer builds, arm64 support |

---

## Contributing to the Ecosystem

Building a tool for OpenClaw? The Gateway's [WebSocket API](/reference/gateway-api) is the primary integration point. All clients — official and third-party — connect through the same control plane.

Key resources:
- [Gateway Architecture](/architecture/gateway) — How the control plane works
- [Gateway API Reference](/reference/gateway-api) — WebSocket message protocol
- [Skill Development](/guides/skill-development) — Building and publishing skills
- [ClawHub](/guides/clawhub) — Distributing skills through the marketplace

## See Also

- [Deployment Options](/guides/deployment-options) — Full comparison of deployment methods
- [Channels & Integrations](/guides/channels) — 50+ messaging platform integrations
- [Security Overview](/security/overview) — Threat model and security tools
- [Contributing to OpenClaw](/contributing/openclaw) — Contributing upstream
