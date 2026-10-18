---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Resources
description: Official links, community spaces, learning resources, hosting, client libraries and curated collections for OpenClaw
keywords: [openclaw, openclaw resources, community, learning, tutorials, sdks, hosting]
---

# Resources

Where to get OpenClaw, get help and go deeper. For community-built tools and alternatives, see [Ecosystem & Community Tools](/reference/ecosystem).

Figures on this page (stars, versions, issue counts) are from `gh api` **as of 2026-10-18**.

---

## Official

| Resource | Link | Notes |
|----------|------|-------|
| **Website** | [openclaw.ai](https://openclaw.ai) | Install scripts and downloads |
| **GitHub** | [openclaw/openclaw](https://github.com/openclaw/openclaw) | 392k stars, 82k forks |
| **Documentation** | [docs.openclaw.ai](https://docs.openclaw.ai) | The reference docs |
| **ClawHub** | [clawhub.ai](https://clawhub.ai) ([repo](https://github.com/openclaw/clawhub), 9.5k stars) | Skill and plugin registry |
| **Releases** | [GitHub Releases](https://github.com/openclaw/openclaw/releases) | Latest stable: v2026.10.4 (2026-10-16); channels explained in [development channels](https://docs.openclaw.ai/install/development-channels) |
| **Issues** | [GitHub Issues](https://github.com/openclaw/openclaw/issues) | Bugs and feature requests (about 9,400 open issues and PRs) |
| **Security** | [Security Advisories](https://github.com/openclaw/openclaw/security/advisories) | Published GHSAs; report through [SECURITY.md](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) |
| **Lobster** | [openclaw/lobster](https://github.com/openclaw/lobster) | Workflow shell (1.3k stars) |
| **Windows Hub** | [openclaw/openclaw-windows-node](https://github.com/openclaw/openclaw-windows-node) | Recommended Windows desktop app |

### Foundation and sponsors

OpenClaw is developed by the [OpenClaw Foundation](https://openclaw.org), an independent 501(c)(3) that employs the core team and signs releases. Per the upstream README, donors include Amazon, Lobster Computer Company, Offline Holdings, OpenAI, Red Hat and the University of Michigan, with infrastructure support from Blacksmith, Convex, GitHub, NVIDIA and Vercel. "OpenAI is a donor, not an owner."

---

## Community spaces

### Discord

The official Discord is [discord.gg/clawd](https://discord.gg/clawd), the invite the upstream README uses. Ask setup questions there; `#help` and `#users-helping-users` are the support channels.

#### Governance

Community roles (moderation, help, Reddit, events) are documented at [openclaw/community](https://github.com/openclaw/community).

### Reddit

| Subreddit | Description |
|-----------|-------------|
| [r/OpenClaw](https://www.reddit.com/r/OpenClaw/) | Main subreddit: discussion, help, showcases |
| r/Clawdbot | Legacy subreddit from the original project name |

### GitHub

GitHub Discussions are **disabled** on the main repo. Use the [issue chooser](https://github.com/openclaw/openclaw/issues/new/choose) for bugs and feature requests, and Discord for questions.

---

## Learning resources

### Guides on this site

| Guide | Description |
|-------|-------------|
| [Getting Started](/getting-started/introduction) | Installation, quick start, core concepts |
| [First 7 Days](/guides/first-7-days) | Structured onboarding |
| [Architecture Deep Dives](/architecture/overview) | Gateway, agent runtime, memory, heartbeat |
| [Security Hardening](/security/hardening) | Lock down your deployment |

### Community tutorials

| Source | Topic | Link |
|--------|-------|------|
| **freeCodeCamp** | Full beginner tutorial | [freecodecamp.org](https://www.freecodecamp.org/news/openclaw-full-tutorial-for-beginners/) |
| **Lenny's Newsletter** | Guide to building with OpenClaw | [lennysnewsletter.com](https://www.lennysnewsletter.com/p/openclaw-the-complete-guide-to-building) |
| **DEV Community** | Tutorials tagged `openclaw` | [dev.to/t/openclaw](https://dev.to/t/openclaw) |
| **OpenClaw Playbook** | MCP server integration guides | [openclawplaybook.ai](https://www.openclawplaybook.ai/) |

These were written for earlier releases. Check commands against `--help` and [docs.openclaw.ai](https://docs.openclaw.ai) before copying them.

### Curated collections

| Collection | Stars | Description |
|------------|------:|-------------|
| [Awesome OpenClaw Skills](https://github.com/VoltAgent/awesome-openclaw-skills) | 53,191 | Curated, filtered skill list |
| [Awesome OpenClaw Use Cases](https://github.com/hesamsheikh/awesome-openclaw-usecases) | 31,657 | Real-world use cases, tested before submission (no push since 2026-03-24) |
| [Awesome OpenClaw (rohitg00)](https://github.com/rohitg00/awesome-openclaw) | 560 | Hosting cost comparisons and hardening |
| [Awesome OpenClaw (vincentkoc)](https://github.com/vincentkoc/awesome-openclaw) | 146 | General resource list (no push since 2026-04-20) |

### Community content

| Site | Description |
|------|-------------|
| [OpenClaw Ecosystem Directory](https://openclawsearch.com) | Web directory of community projects |
| [BetterClaw](https://www.betterclaw.io/) | Security analysis blog |
| [Cubitrek](https://cubitrek.com/blog/openclaw-alternatives) | Alternatives comparison |

---

## Managed hosting

The [Hosting Providers guide](/guides/hosting-providers) is the maintained list, with dated prices and a listing policy. There is **no official OpenClaw cloud**; every managed host is a third party.

Quick pointers (all live on 2026-10-18):

| Provider | Website | Notes |
|----------|---------|-------|
| **Agent37** | [agent37.com](https://agent37.com) | Now a general "cloud sandbox for agents"; hosts OpenClaw and Hermes |
| **ClawCloud** | [clawcloud.sh](https://clawcloud.sh) | |
| **ClawSimple** | [clawsimple.com](https://clawsimple.com) | |
| **Contabo** | [contabo.com](https://contabo.com/en/openclaw-hosting/) | Budget VPS |
| **GetClawHelp** | [getclawhelp.com](https://getclawhelp.com) | Setup service, not hosting |
| **MyClaw.ai** | [myclaw.ai](https://myclaw.ai) | Also hosts Hermes, Claude Code, Codex |
| **OpenClawd.ai** | [openclawd.ai](https://openclawd.ai) | Info and deploy site |
| **xCloud** | [xcloud.host](https://xcloud.host/openclaw-hosting/) | |

EasyClaw (easyclaw.com) is now a desktop app for Mac and Windows rather than a host, and the KiloClaw page at kilo.ai/kiloclaw now redirects to the generic Kilo homepage.

:::tip
For self-hosting, see [Deployment Options](/guides/deployment-options).
:::

---

## Deployment templates

| Template | Stars | Platform | Notes |
|----------|------:|----------|-------|
| [Railway template](https://github.com/arjunkomath/openclaw-railway-template) | 51 | Railway | Gateway + Control UI, persistent volume; upstream guide at [docs.openclaw.ai/install/railway](https://docs.openclaw.ai/install/railway) |
| [Helm chart (XROW)](https://artifacthub.io/packages/helm/openclaw/openclaw) | — | Kubernetes | Version 1.111.0 on Artifact Hub |
| [Helm chart (community)](https://github.com/serhanekicii/openclaw-helm) | 192 | Kubernetes | **Archived** (last push 2026-05-24) |
| [Coolify template](https://github.com/essamamdani/openclaw-coolify) | 154 | Coolify | Docker sidecar, Cloudflare Tunnel, SearXNG |
| [Moltworker](https://github.com/cloudflare/moltworker) | 9,948 | Cloudflare Workers | Experimental proof of concept, not officially supported; about $34.50/month 24/7 per its README |

Upstream maintains its own guides for Kubernetes (Kustomize), Cloudflare (Workers + Durable Object) and more: [docs.openclaw.ai/install](https://docs.openclaw.ai/install).

### Docker images

:::warning
Upstream says to use `ghcr.io/openclaw/openclaw` or `openclaw/openclaw` and to "avoid unofficial mirrors" ([Docker install](https://docs.openclaw.ai/install/docker)).
:::

| Image | Maintainer | Notes |
|-------|-----------|-------|
| `ghcr.io/openclaw/openclaw` | OpenClaw | **Official**, primary; `-slim` and `-browser` variants |
| `openclaw/openclaw` | OpenClaw | **Official** Docker Hub mirror |
| `1panel/openclaw` | 1Panel | Unofficial |
| `coollabsio/openclaw` | Coolify team | Unofficial |
| `alpine/openclaw` | Community | Unofficial; last updated 2026-06-21 |
| `land007/webclaw` | Community | Unofficial WebClaw frontend image |

### Cloud platforms

Upstream install guides cover Docker, Podman, Kubernetes, Ansible, Nix, Fly.io, Hetzner, GCP, Azure, DigitalOcean, Oracle, Railway, Render, Northflank, Hostinger, Raspberry Pi and others: [docs.openclaw.ai/install](https://docs.openclaw.ai/install).

---

## SDKs & client libraries

### Official (TypeScript)

Upstream publishes `@openclaw/gateway-client` (the reference WebSocket client, Node and browser entry points) and `@openclaw/gateway-protocol` on npm, versioned with OpenClaw releases. See [Gateway clients](https://docs.openclaw.ai/gateway/clients) and the [Gateway protocol](https://docs.openclaw.ai/gateway/protocol). The protocol is plain WebSocket and JSON, so any language can speak it.

### Go (community, unverified)

`openclaw-go` by a3t.ai is still served on [pkg.go.dev](https://pkg.go.dev/github.com/a3tai/openclaw-go), but its GitHub repository returns 404 as of 2026-10-18. Treat it as unmaintained until it reappears.

### VS Code extension (archived)

[openclaw-vscode](https://github.com/xiaoyaner-home/openclaw-vscode) connected VS Code and Cursor to the Gateway. The repo is **archived** (last push 2026-02-14), though the [Marketplace listing](https://marketplace.visualstudio.com/items?itemName=xiaoyaner.openclaw-node-vscode) remains. For coding agents, see upstream's [ACP agents](https://docs.openclaw.ai/tools/acp-agents-setup).

---

## Memory & context plugins

OpenClaw's built-in memory (workspace `MEMORY.md` plus daily notes, with built-in search) needs no plugin; see [docs.openclaw.ai/concepts/memory](https://docs.openclaw.ai/concepts/memory). Third-party options:

| Plugin | Stars | Description |
|--------|------:|-------------|
| [Mem0](https://github.com/mem0ai/mem0) | 67,372 | Plugin package `@mem0/openclaw-mem0` (1.2.1) |
| [memU](https://github.com/NevaMind-AI/memU) | 14,553 | Memory framework for long-running agents |
| [MemOS](https://github.com/MemTensor/MemOS) | 11,917 | Memory OS |
| [PowerContext](https://github.com/oceanbase/powercontext) | 1,337 | OceanBase long-term memory (formerly PowerMem) |
| [memov](https://github.com/memovai/memov) | 194 | Git-like versioned memory (no push since 2026-02-05) |
| [OpenAmnesia](https://github.com/vincentkoc/openamnesia) | 31 | Context engine (no push since 2026-04-30) |
| [Redis Agent Memory](https://github.com/redis-developer/openclaw-redis-agent-memory) | 17 | Redis-backed memory |
| [Supermemory](https://supermemory.ai/docs/integrations/openclaw) | — | Hosted memory with integration docs |
| [qmd](https://github.com/tobi/qmd) | 30,467 | Markdown search with MCP. OpenClaw's own QMD backend was retired in 2026.8.1 in favour of built-in memory |

For a comparison, see [Memory Systems](/guides/memory-systems).

---

## Security resources

### Official

| Resource | Description |
|----------|-------------|
| [Security Advisories](https://github.com/openclaw/openclaw/security/advisories) | Published advisories |
| [Security Overview](/security/overview) | Threat model |
| [Security Hardening](/security/hardening) | Configuration lockdown |
| [Known Vulnerabilities](/security/known-vulnerabilities) | CVE history |
| [Skill Verification](/security/skill-verification) | Checking skills before install |

### Community tools

| Tool | Stars | Status |
|------|------:|--------|
| [ClawSec](https://github.com/prompt-security/clawsec) | 1,122 | Active; security skill suite |
| [Security Monitor](https://github.com/adibirzu/openclaw-security-monitor) | 49 | Active; scheduled threat checks |
| [ClawBands](https://github.com/SeyZ/clawbands) | 196 | No push since 2026-02-09; approval middleware |
| [Clawprint](https://github.com/tsyrulb/clawprint) | 1 | **Archived**; "historical personal project" |
| [SkillGuard](https://github.com/bossondehiggs/skillguard) | 0 | Abandoned; not recommended |

---

## Browser and desktop frontends

| Frontend | Stars | Status | Notes |
|----------|------:|--------|-------|
| **Control UI** (built in) | — | Official | Served by the Gateway at `http://127.0.0.1:18789/`; chat, files, approvals, settings ([docs](https://docs.openclaw.ai/web/control-ui)) |
| [Windows Hub](https://github.com/openclaw/openclaw-windows-node) | 2,158 | Official | Native WinUI app ([Ecosystem](/reference/ecosystem#openclaw-windows-hub)) |
| [WebClaw](https://github.com/ibelick/webclaw) | 647 | No push since 2026-03-17 | [WebClaw Guide](/guides/webclaw) |
| [PinchChat](https://github.com/MarlBurroW/pinchchat) | 187 | Last push 2026-06-18 | [WebClaw Guide](/guides/webclaw#pinchchat-alternative-frontend) |

---

## Companion apps

| Platform | Status | Notes |
|----------|--------|-------|
| **macOS** | Released | OpenClaw.app, macOS 26.2 or later ([docs](https://docs.openclaw.ai/platforms/macos)) |
| **iOS / iPadOS** | App Store | iOS/iPadOS 26.2 or later ([docs](https://docs.openclaw.ai/platforms/ios)) |
| **Android** | Google Play | Companion node, minSdk 31; signed APK on some GitHub releases ([docs](https://docs.openclaw.ai/platforms/android)) |
| **Windows** | Official | [Windows Hub](https://docs.openclaw.ai/platforms/windows), x64 and ARM64 |

---

## Lightweight alternatives

| Project | Stars | Language | Notes |
|---------|------:|----------|-------|
| [Nanobot](https://github.com/HKUDS/nanobot) | 49,143 | Python | HKUDS; many chat apps and providers |
| [NanoClaw](https://github.com/nanocoai/nanoclaw) | 30,964 | TypeScript | Agents in containers |
| [PicoClaw](https://github.com/sipeed/picoclaw) | 30,087 | Go | $10 hardware; pre-1.0 |
| [IronClaw](https://github.com/nearai/ironclaw) | 12,661 | Rust | NEAR AI; WASM-sandboxed tools |
| [MimiClaw](https://github.com/memovai/mimiclaw) | 5,799 | C | ESP32-S3 |
| [TinyAGI](https://github.com/TinyAGI/tinyagi) | 3,621 | TypeScript | Agent teams; formerly `jlia0/tinyclaw` |

More in [Lightweight Variants](/guides/lightweight-variants) and [Ecosystem](/reference/ecosystem#lightweight-alternatives).

---

## Installation methods

The supported paths are the installer script, npm/pnpm/Bun, Docker or Podman, Nix, Ansible, building from source, and the native apps. Commands, flags and platform notes change between releases, so follow [Installation](/getting-started/installation) or [docs.openclaw.ai/install](https://docs.openclaw.ai/install) rather than a one-line summary. For Docker in particular, a bare `docker run` without a config volume and token does not give you a usable Gateway; use the [upstream Docker guide](https://docs.openclaw.ai/install/docker).

---

## See also

- [Ecosystem & Community Tools](/reference/ecosystem)
- [Deployment Options](/guides/deployment-options)
- [Hosting Providers](/guides/hosting-providers)
- [Channels & Integrations](/guides/channels)
- [FAQ](/reference/faq)
