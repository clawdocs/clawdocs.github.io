---
sidebar_position: 7
title: Resources
description: Official links, community spaces, learning resources, hosting providers, SDKs, and curated collections for OpenClaw
---

# Resources

Everything you need to get started, get help, and go deeper with OpenClaw — organized by category.

For community-built tools, projects, and alternatives, see the [Ecosystem & Community Tools](/reference/ecosystem) page.

---

## Official

| Resource | Link | Description |
|----------|------|-------------|
| **Website** | [openclaw.ai](https://openclaw.ai) | Official site, install scripts, downloads |
| **GitHub** | [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) | Source code (377k+ stars, 79k forks) |
| **Documentation** | [docs.openclaw.ai](https://docs.openclaw.ai) | Official docs |
| **ClawHub** | [github.com/openclaw/clawhub](https://github.com/openclaw/clawhub) | Skill marketplace (8,900 stars, 10,700+ skills) |
| **Releases** | [GitHub Releases](https://github.com/openclaw/openclaw/releases) | Changelog, downloads (latest: v2026.6.1) |
| **Issues** | [GitHub Issues](https://github.com/openclaw/openclaw/issues) | Bug reports, feature requests (7,900+ open) |
| **Security** | [Security Advisories](https://github.com/openclaw/openclaw/security/advisories) | Vulnerability reports, CVEs |
| **Lobster** | [github.com/openclaw/lobster](https://github.com/openclaw/lobster) | Official workflow shell (440 stars) |

### Sponsors

OpenAI, GitHub, NVIDIA, Vercel, Blacksmith, and Convex.

---

## Community Spaces

### Discord

The primary community hub with ~176,000 members across two servers:

| Server | Members | Purpose |
|--------|---------|---------|
| **Main** | ~176,000 | Primary community, support, announcements |
| **Backup** | ~16,200 | Fallback space at [discord.gg/openclaw](https://discord.gg/openclaw) |

Key channels include `#help`, `#users-helping-users`, `#showcase`, and `#announcements`.

#### Governance

Community governance is documented at [github.com/openclaw/community](https://github.com/openclaw/community) with dedicated leads:

| Role | Responsibility |
|------|---------------|
| **Moderation Lead** | Server rules, user conduct |
| **Help Lead** | `#help` and `#users-helping-users` channels |
| **Reddit Lead** | Subreddit moderation (u/vacinc) |
| **Events Lead** | Weekly Claw events, recordings |
| **Admin / Community Lead** | Policy, staffing, final decisions |

### Reddit

| Subreddit | Description |
|-----------|-------------|
| **r/OpenClaw** | Main subreddit — discussion, help, showcases |
| **r/Clawdbot** | Legacy subreddit (original project name) |

Both managed by Reddit Lead VACInc.

### GitHub Discussions

Feature requests, architecture discussions, and Q&A happen on [GitHub Discussions](https://github.com/openclaw/openclaw/discussions) in the main repo.

---

## Learning Resources

### Official Guides

| Guide | Description |
|-------|-------------|
| [Getting Started](/getting-started/introduction) | Installation, quick start, core concepts |
| [First 7 Days](/guides/first-7-days) | Structured onboarding — from setup to production |
| [Architecture Deep Dives](/architecture/overview) | Gateway, Brain & Hands, Memory, Heartbeat |
| [Security Hardening](/security/hardening) | Lock down your deployment |

### Community Tutorials

| Source | Topic | Link |
|--------|-------|------|
| **FreeCodeCamp** | Full beginner tutorial | [freecodecamp.org](https://www.freecodecamp.org/news/openclaw-full-tutorial-for-beginners/) |
| **DataCamp** | ClawHub CLI and skill management | [datacamp.com](https://www.datacamp.com) |
| **Lenny's Newsletter** | Complete guide to building with OpenClaw | [lennysnewsletter.com](https://www.lennysnewsletter.com/p/openclaw-the-complete-guide-to-building) |
| **DEV Community** | Various tutorials and guides | [dev.to/t/openclaw](https://dev.to/t/openclaw) |
| **OpenClaw Playbook** | MCP server integration guides | [openclawplaybook.ai](https://www.openclawplaybook.ai/) |

### Curated Collections

| Collection | Stars | Description |
|------------|-------|-------------|
| [Awesome OpenClaw Skills](https://github.com/VoltAgent/awesome-openclaw-skills) | 13,000 | 2,999 curated skills across 20+ categories |
| [Awesome OpenClaw Use Cases](https://github.com/hesamsheikh/awesome-openclaw-usecases) | 1,000 | Verified real-world use cases (tested 1+ day before submission) |
| [Awesome OpenClaw](https://github.com/vincentkoc/awesome-openclaw) | 560 | 60+ resources, tools, and tutorials (maintained by Chief Architect) |
| [Awesome OpenClaw Hosting](https://github.com/rohitg00/awesome-openclaw) | 107 | Hosting cost comparisons and security hardening |

### Community Content

| Platform | Description |
|----------|-------------|
| [OpenClaw Ecosystem Directory](https://openclawsearch.com) | Web directory of 80+ curated projects |
| [BetterClaw](https://www.betterclaw.io/) | Security analysis and best practices blog |
| [Cubitrek](https://cubitrek.com/blog/openclaw-alternatives-2026) | Alternatives comparison |

---

## Managed Hosting

15+ providers offer managed OpenClaw hosting. Pricing, features, and reliability vary — some are early-stage ventures.

| Provider | Website | Notes |
|----------|---------|-------|
| **Agent37** | [agent37.com](https://agent37.com) | |
| **ClawCloud** | [clawcloud.sh](https://clawcloud.sh) | |
| **ClawSimple** | [clawsimple.com](https://clawsimple.com) | |
| **Contabo OpenClaw** | [contabo.com](https://contabo.com/en/openclaw-hosting/) | Budget VPS option |
| **EasyClaw** | [easyclaw.com](https://easyclaw.com) | |
| **GetClawHelp** | [getclawhelp.com](https://getclawhelp.com) | |
| **KiloClaw** | [kilo.ai/kiloclaw](https://kilo.ai/kiloclaw) | |
| **MyClaw.ai** | [myclaw.ai](https://myclaw.ai) | |
| **OpenClaw Cloud** | — | Official (beta) |
| **OpenClaw Hosting** | — | |
| **OpenClawd.ai** | [openclawd.ai](https://openclawd.ai) | Managed with automatic updates |
| **SimpleClaw** | — | |
| **xCloud** | [xcloud.host](https://xcloud.host/openclaw-hosting/) | |

:::tip
For self-hosting comparisons, see the [Hosting Providers guide](/guides/hosting-providers) and the [Deployment Options guide](/guides/deployment-options).
:::

---

## Deployment Templates

One-click or near-one-click deployment options for self-hosting:

| Template | Stars | Platform | Description |
|----------|-------|----------|-------------|
| [Railway Template](https://github.com/arjunkomath/openclaw-railway-template) | 43 | Railway | Gateway + Control UI, Setup Wizard, persistent volume |
| [Helm Chart (XROW)](https://artifacthub.io/packages/helm/openclaw/openclaw) | — | Kubernetes | v1.45.4, 173 releases, OCI registry on GitLab |
| [Helm Chart (Community)](https://github.com/serhanekicii/openclaw-helm) | 60 | Kubernetes | StatefulSet, Chromium sidecar, ArgoCD compatible |
| [Coolify Template](https://github.com/essamamdani/openclaw-coolify) | 96 | Coolify | Docker sidecar, Cloudflare Tunnel, SearXNG |
| [Moltworker](https://github.com/cloudflare/moltworker) | 8,400 | Cloudflare Workers | Fully managed, ~$34.50/mo |

### Docker Images

| Image | Maintainer | Notes |
|-------|-----------|-------|
| `openclaw/openclaw` | OpenClaw team | Official |
| `1panel/openclaw` | 1Panel team | Optimized for 1Panel App Store |
| `alpine/openclaw` | Community | Alpine-based minimal image |
| `coollabsio/openclaw` | Coolify team | Daily CalVer builds, arm64 |
| `land007/webclaw` | Community | WebClaw frontend image |

### Cloud Platforms

Official deployment guides exist for: VPS, Docker, Kubernetes, Fly.io, Hetzner, Google Cloud Platform, Azure, Railway, Render, and Northflank — see [docs.openclaw.ai/install](https://docs.openclaw.ai/install).

---

## SDKs & Client Libraries

### Go

[openclaw-go](https://pkg.go.dev/github.com/a3tai/openclaw-go) — independently maintained Go client library by Rude Company LLC / a3t.ai.

- **License**: MIT | **Version**: v2026.4.8
- Typed Gateway WebSocket client (153+ typed RPC methods)
- OpenAI-compatible Chat Completions HTTP API
- OpenAI Responses API
- Tools Invoke HTTP API
- mDNS/DNS-SD local network discovery
- Agent Client Protocol (ACP) over JSON-RPC 2.0 / NDJSON

```go
import "github.com/a3tai/openclaw-go/gateway"

client, err := gateway.Dial("ws://localhost:18789", gateway.WithToken("your-token"))
```

:::info
No official Python, Rust, Ruby, or Java SDKs exist yet. The Gateway's [WebSocket API](/reference/gateway-api) is language-agnostic — connect from any language that supports WebSockets and JSON.
:::

### VS Code Extension

[openclaw-vscode](https://github.com/xiaoyaner-home/openclaw-vscode) — connects VS Code and Cursor to the Gateway via WebSocket.

- WebSocket integration with TLS support (`wss://`)
- Default port 18789
- Cursor Agent CLI integration (agent/plan/ask modes)
- Available on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=xiaoyaner.openclaw-node-vscode)

---

## Memory & Context Plugins

10+ memory and context systems integrate with OpenClaw:

| Plugin | Stars | Backend | Description |
|--------|-------|---------|-------------|
| **Built-in** | — | Markdown + sqlite-vec | Default, local, no dependencies |
| **memory-core** | — | Enhanced built-in | Dreaming mode (consolidation) |
| [Mem0](https://github.com/mem0ai/mem0) | — | Dedicated plugin | `@mem0/openclaw-mem0` |
| [memU](https://github.com/NevaMind-AI/memU) | 8,800 | PostgreSQL + pgvector | Three-layer knowledge graph |
| [Redis Agent Memory](https://github.com/redis-developer/openclaw-redis-agent-memory) | 14 | Redis | Official Redis integration (v0.2.0) |
| [memov](https://github.com/memovai/memov) | — | Git-like | Traceable memory with versioning |
| [MemOS](https://github.com/MemTensor/MemOS) | — | Custom | Self-evolving memory OS |
| [PowerMem](https://github.com/oceanbase/powermem) | — | OceanBase | Long-term memory plugin |
| [OpenAmnesia](https://github.com/vincentkoc/openamnesia) | — | Custom | Continual learning context engine |
| [Supermemory](https://supermemory.ai/docs/integrations/openclaw) | — | Hosted | Cloud memory with integration docs |
| [qmd](https://github.com/tobi/qmd) | — | Markdown | Markdown-native memory/search with MCP |

For detailed comparison, see [Memory Systems Compared](/guides/memory-systems).

---

## Security Resources

### Official

| Resource | Description |
|----------|-------------|
| [Security Advisories](https://github.com/openclaw/openclaw/security/advisories) | Official CVEs and vulnerability reports |
| [Security Overview](/security/overview) | Threat model and architecture |
| [Security Hardening](/security/hardening) | Configuration lockdown guide |
| [Known Vulnerabilities](/security/known-vulnerabilities) | CVE history and incident timeline |
| [Skill Verification](/security/skill-verification) | Validating skills before installation |

### Community Tools

| Tool | Description |
|------|-------------|
| [ClawSec](https://github.com/prompt-security/clawsec) | Security skill suite — audits, monitoring, drift detection (265 stars) |
| [Clawprint](https://github.com/cyntrisec/clawprint) | Tamper-evident audit trail with SHA-256 hash chain |
| [ClawBands](https://github.com/SeyZ/clawbands) | Approval middleware for dangerous actions (34 stars) |
| [SkillGuard](https://github.com/bossondehiggs/skillguard) | Security scanner for skill files |
| [Security Monitor](https://github.com/adibirzu/openclaw-security-monitor) | 32 scripts for daily automated scans |

---

## Browser Frontends

| Frontend | Stars | Status | Key Feature | Guide |
|----------|-------|--------|-------------|-------|
| **Built-in WebChat** | — | Stable | Zero setup, `localhost:18789/chat` | — |
| [WebClaw](https://github.com/ibelick/webclaw) | 637 | Beta | Lightweight SPA, `npx webclaw` | [WebClaw Guide](/guides/webclaw) |
| [PinchChat](https://github.com/MarlBurroW/pinchchat) | 182 | Stable (119 releases) | Multi-session, PWA, i18n | [WebClaw Guide](/guides/webclaw#pinchchat-alternative-frontend) |
| [Windows Hub](https://github.com/shanselman/openclaw-windows-hub) | 211 | Active | Tray app, hotkeys, Node Mode | [Ecosystem](/reference/ecosystem#openclaw-windows-hub) |
| [TitanShell](https://github.com/DaguangZhou/TitanShell) | 6 | Early | Security-first, biometric keys | [Ecosystem](/reference/ecosystem#titanshell) |

---

## Companion Apps

| Platform | Status | Stack | Notes |
|----------|--------|-------|-------|
| **macOS** | Beta | Swift, Universal Binary | Menu bar app with voice, debug tools. macOS 15+ |
| **iOS** | Source available | Swift | In `apps/ios/`, no App Store release yet |
| **Android** | Source available | Kotlin + Jetpack Compose | In `apps/android/`, minSdk 31 |
| **Windows** | Community | C# (.NET), WebView2 | [Windows Hub](https://github.com/shanselman/openclaw-windows-hub) by Scott Hanselman |

---

## Lightweight Alternatives

For when you need something smaller than full OpenClaw:

| Project | Stars | Language | Unique Feature |
|---------|-------|----------|----------------|
| [Nanobot](https://github.com/HKUDS/nanobot) | 15,900 | Python | ~4,000 lines, 8 chat platforms |
| [NanoClaw](https://github.com/gavrielc/nanoclaw) | 6,900 | TypeScript | Container isolation, Anthropic SDK |
| [MimiClaw](https://github.com/memovai/mimiclaw) | 807 | C | Runs on $5 ESP32-S3, 0.5W power |
| [TinyClaw](https://github.com/jlia0/tinyclaw) | — | — | 400 lines of code |
| [IronClaw](https://github.com/nearai/ironclaw) | — | Rust | Privacy and security focused |
| [PicoClaw](https://github.com/sipeed/picoclaw) | — | Go | Targets $10 hardware, under 10MB RAM |

For more, see [Lightweight Variants guide](/guides/lightweight-variants) and [Ecosystem page](/reference/ecosystem#lightweight-alternatives).

---

## Installation Methods

OpenClaw supports 10+ installation methods:

| Method | Command / Steps |
|--------|----------------|
| **Installer script (macOS/Linux)** | `curl -fsSL https://openclaw.ai/install.sh \| bash` |
| **Installer script (Windows)** | `iwr https://openclaw.ai/install.ps1 -UseB \| iex` |
| **CLI-only** | `curl -fsSL https://openclaw.ai/install-cli.sh \| bash` |
| **npm** | `npm install -g openclaw` |
| **pnpm** | `pnpm add -g openclaw` |
| **Bun** | `bun add -g openclaw` |
| **Docker** | `docker run openclaw/openclaw` |
| **Podman** | `podman run openclaw/openclaw` |
| **Nix** | Nix flake |
| **Ansible** | Playbook |
| **Source** | `git clone https://github.com/openclaw/openclaw.git` |
| **Windows Hub** | Native WinUI 3 app |

For step-by-step instructions, see [Installation](/getting-started/installation).

---

## See Also

- [Ecosystem & Community Tools](/reference/ecosystem) — 25+ community projects, tools, and alternatives
- [Deployment Options](/guides/deployment-options) — Self-hosting comparison
- [Hosting Providers](/guides/hosting-providers) — Managed hosting deep-dive
- [Channels & Integrations](/guides/channels) — 26 messaging platform connections
- [FAQ](/reference/faq) — Common questions and answers
