---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Ecosystem & Community Tools
description: Official apps and community-built clients, deployment tools, security tools, skill lists and alternatives around OpenClaw, with stars as of 2026-10-18
keywords: [openclaw, openclaw ecosystem, community projects, tools, integrations, plugins, open source]
---

# Ecosystem & Community Tools

OpenClaw passed 392,000 GitHub stars about eleven months after its first release, and a large ecosystem grew around it. This page lists the official companion projects first, then community tools by category.

:::info How to read this page
Star counts, last-push dates and archive status come from `gh api` **as of 2026-10-18**. Re-run `node scripts/refresh-stars.mjs` to refresh them. Community projects are not reviewed or endorsed by OpenClaw or by clawdocs; check activity and the code before you give any of them credentials. Archived or abandoned projects are kept below only so that old links still explain themselves.
:::

## Top projects by stars

| Rank | Project | Stars | Category |
|------|---------|------:|----------|
| 1 | [Awesome OpenClaw Skills](#awesome-openclaw-skills) | 53,191 | Skill list |
| 2 | [Nanobot](#nanobot) | 49,143 | Alternative (Python) |
| 3 | [ZeroClaw](#zeroclaw) | 32,989 | Alternative (Rust) |
| 4 | [Awesome OpenClaw Use Cases](#awesome-openclaw-use-cases) | 31,657 | Community list |
| 5 | [NanoClaw](#nanoclaw) | 30,964 | Alternative (containers) |
| 6 | [qmd](https://github.com/tobi/qmd) | 30,467 | Markdown search/memory |
| 7 | [PicoClaw](#picoclaw) | 30,087 | Alternative (Go) |
| 8 | [memU](#memu) | 14,553 | Memory framework |
| 9 | [IronClaw](#ironclaw) | 12,661 | Alternative (Rust) |
| 10 | [Moltworker](#moltworker) | 9,948 | Deployment (experimental) |
| 11 | [ClawHub](#clawhub) | 9,516 | Official skill registry |
| 12 | [NullClaw](#nullclaw) | 8,131 | Alternative (Zig) |

---

## Official projects

| Project | Stars | What it is | Link |
|---------|------:|------------|------|
| **OpenClaw** | 392,325 | The Gateway, CLI and agent runtime | [openclaw/openclaw](https://github.com/openclaw/openclaw) |
| **ClawHub** | 9,516 | Public skill and plugin registry | [clawhub.ai](https://clawhub.ai), [openclaw/clawhub](https://github.com/openclaw/clawhub) |
| **Windows Hub** | 2,158 | Native Windows desktop app (recommended on Windows) | [openclaw/openclaw-windows-node](https://github.com/openclaw/openclaw-windows-node) |
| **Lobster** | 1,275 | Workflow shell for typed, composable pipelines | [openclaw/lobster](https://github.com/openclaw/lobster) |
| **openclaw-ansible** | 602 | Hardened install with Tailscale, UFW and Docker | [openclaw/openclaw-ansible](https://github.com/openclaw/openclaw-ansible), [docs](https://docs.openclaw.ai/install/ansible) |
| **macOS app** | — | Menu bar app, voice wake, node mode; macOS 26.2 or later | [docs](https://docs.openclaw.ai/platforms/macos) |
| **iOS and Android apps** | — | Companion nodes, on the App Store and Google Play | [iOS](https://docs.openclaw.ai/platforms/ios), [Android](https://docs.openclaw.ai/platforms/android) |

The old `openclaw/skills` archive repo no longer exists. Use [ClawHub](https://clawhub.ai) to browse skills.

### Lobster {#lobster}

OpenClaw's workflow shell: a typed, local-first "macro engine" that turns skills and tools into composable pipelines, and lets OpenClaw call a whole workflow in one step.

- 1,275 stars, MIT, TypeScript, last push 2026-10-16.
- Typed pipelines over JSON objects, workflow files, approval gates for side effects, and state kept between runs.
- Guide: [Lobster Workflows](/guides/lobster-workflows).

### ClawHub {#clawhub}

The public registry for skills and plugins at [clawhub.ai](https://clawhub.ai). Install with `openclaw skills install` or `openclaw plugins install`; see [ClawHub](/guides/clawhub).

- 9,516 stars, MIT, last push 2026-10-18.

:::warning
In February 2026, Koi Security reported 341 malicious skills on ClawHub (the first AMOS-stealer cluster it published was 335). Check a skill before you install it: [Skill Verification](/security/skill-verification).
:::

### Windows Hub {#openclaw-windows-hub}

Started by Scott Hanselman as `shanselman/openclaw-windows-hub`, it now lives at [openclaw/openclaw-windows-node](https://github.com/openclaw/openclaw-windows-node) and is upstream's **recommended Windows desktop app**: a native WinUI app for Windows 10 20H2+ and 11 with setup, tray status, chat, diagnostics and Windows node capabilities, signed x64 and ARM64 installers, and no admin rights needed. See [docs.openclaw.ai/platforms/windows](https://docs.openclaw.ai/platforms/windows).

- 2,158 stars, last push 2026-10-17.

### Native apps

- **macOS:** OpenClaw.app needs macOS 26.2 (Tahoe) or later ([docs](https://docs.openclaw.ai/platforms/macos)).
- **iOS/iPadOS:** on the App Store; needs iOS/iPadOS 26.2 or later ([docs](https://docs.openclaw.ai/platforms/ios)).
- **Android:** on Google Play, plus a signed APK on some GitHub releases; minSdk 31. It is a companion node and needs a running Gateway ([docs](https://docs.openclaw.ai/platforms/android)).

---

## Alternative clients and frontends

The Gateway ships its own Control UI (chat, files, approvals, settings) since the 2026.8.1 rebuild, so a separate web client is optional.

### WebClaw {#webclaw}

A browser client that connects to the Gateway over WebSockets.

- 647 stars, MIT, TypeScript. **No push since 2026-03-17**, so it may lag current Gateway releases.
- Repo: [ibelick/webclaw](https://github.com/ibelick/webclaw). Site: [webclaw.dev](https://webclaw.dev). Guide: [WebClaw](/guides/webclaw).

### PinchChat

A multi-session web chat for the Gateway with PWA support.

- 187 stars, last push 2026-06-18. Repo: [MarlBurroW/pinchchat](https://github.com/MarlBurroW/pinchchat).

---

## Deployment tools

See [Deployment Options](/guides/deployment-options) for setup steps. For Cloudflare, upstream now documents its own [Workers and Durable Object setup](https://docs.openclaw.ai/install/cloudflare) using the official image.

### Moltworker {#moltworker}

Cloudflare's **experimental** port of OpenClaw to Workers and Sandbox containers. Its README says: "This is a proof of concept ... It is not officially supported and may break without notice."

- 9,948 stars, Apache-2.0, **last push 2026-05-09**.
- Repo: [cloudflare/moltworker](https://github.com/cloudflare/moltworker).
- Cost per its README: about $34.50/month running 24/7 on a `standard-1` instance ($5 Workers Paid plan plus container compute), less if you let the container sleep when idle.

### Helm charts

- **Community chart** [serhanekicii/openclaw-helm](https://github.com/serhanekicii/openclaw-helm) (192 stars) is **archived** (last push 2026-05-24) and its docs site is gone. Do not start new installs on it.
- **XROW chart** on [Artifact Hub](https://artifacthub.io/packages/helm/openclaw/openclaw), version 1.111.0 as of 2026-10-18.
- Upstream itself ships Kustomize manifests rather than a chart: [docs.openclaw.ai/install/kubernetes](https://docs.openclaw.ai/install/kubernetes).

### OpenClaw for Coolify

A Coolify template with a Docker sidecar proxy, Cloudflare Tunnel and SearXNG.

- 154 stars, last push 2026-08-08. Repo: [essamamdani/openclaw-coolify](https://github.com/essamamdani/openclaw-coolify). Needs about 13 GB of free disk for the build cache.

### CoolLabs images

Docker images from the Coolify team, with arm64 builds and an Nginx front (`:8080` to `:18789`).

- 397 stars, last push 2026-09-10. Repo: [coollabsio/openclaw](https://github.com/coollabsio/openclaw). The repo has no GitHub releases; the `coollabsio/openclaw` Docker Hub image was last updated 2026-10-08.
- This is an **unofficial image**. See [Docker images](#docker-images).

### OpenClaw Host Kit

Multi-tenant hosting: one private OpenClaw per user, with per-user subdomains, resource limits, Traefik with automatic HTTPS, and web terminals.

- 24 stars, MIT, last push 2026-07-20. Repo: [agent37-platform/openclaw-host-kit](https://github.com/agent37-platform/openclaw-host-kit) (formerly `Agent-3-7/openclaw-host-kit`).

### Other deployment options

| Platform | Notes |
|----------|-------|
| **1Panel** | Server panel with a one-click OpenClaw app (1Panel has 37k stars). [Details](/guides/deployment-options#1panel) |
| **DigitalOcean** | Marketplace Droplet: [marketplace.digitalocean.com/apps/openclaw](https://marketplace.digitalocean.com/apps/openclaw); upstream guide at [docs.openclaw.ai/install/digitalocean](https://docs.openclaw.ai/install/digitalocean) |
| **Hostinger** | Upstream guide at [docs.openclaw.ai/install/hostinger](https://docs.openclaw.ai/install/hostinger) |
| **Managed hosts** | See [Hosting Providers](/guides/hosting-providers) |

---

## Lightweight alternatives {#lightweight-alternatives}

Independent agents inspired by OpenClaw. None runs OpenClaw skills or config unchanged. Upstream also documents how to drive other coding agents from OpenClaw over ACP: [ACP agents](https://docs.openclaw.ai/tools/acp-agents-setup). Full write-ups are in [Lightweight Variants](/guides/lightweight-variants).

### Nanobot {#nanobot}

HKUDS's Python agent with WebUI, MCP, multi-agent workflows and many chat apps. 49,143 stars, MIT, v0.3.5. [HKUDS/nanobot](https://github.com/HKUDS/nanobot) · [details](/guides/lightweight-variants#nanobot)

### ZeroClaw {#zeroclaw}

A single Rust binary with 30+ channels and hardware tools. 32,989 stars, Apache-2.0. [zeroclaw-labs/zeroclaw](https://github.com/zeroclaw-labs/zeroclaw) · [details](/guides/lightweight-variants#zeroclaw)

### NanoClaw {#nanoclaw}

Runs each agent in a container, on Anthropic's Agents SDK; WhatsApp, Telegram, Slack, Discord, Gmail and more. 30,964 stars, MIT. Moved from `gavrielc/nanoclaw` to [nanocoai/nanoclaw](https://github.com/nanocoai/nanoclaw). It is an independent codebase, not a fork. [details](/guides/lightweight-variants#nanoclaw)

### PicoClaw {#picoclaw}

Sipeed's Go agent for $10 hardware. 30,087 stars, MIT. Pre-1.0; its README says not to use it in production yet. [sipeed/picoclaw](https://github.com/sipeed/picoclaw) · [details](/guides/lightweight-variants#picoclaw)

### IronClaw {#ironclaw}

NEAR AI's Rust "Agent OS" with WASM-sandboxed tools and an encrypted credential store. 12,661 stars, Apache-2.0. [nearai/ironclaw](https://github.com/nearai/ironclaw) · [details](/guides/lightweight-variants#ironclaw)

### NullClaw {#nullclaw}

A 678 KB static Zig binary. 8,131 stars, MIT. [nullclaw/nullclaw](https://github.com/nullclaw/nullclaw) · [details](/guides/lightweight-variants#nullclaw)

### MimiClaw {#mimiclaw}

A C agent on a $5 ESP32-S3, with no OS. 5,799 stars, MIT. [memovai/mimiclaw](https://github.com/memovai/mimiclaw) · [details](/guides/lightweight-variants#mimiclaw)

### Mini-Claw

A Telegram bot that drives your Claude or ChatGPT subscription. 93 stars, no push since 2026-03-28. [htlin222/mini-claw](https://github.com/htlin222/mini-claw)

:::tip
These are **not drop-in replacements** for OpenClaw. They are useful if you need a subset of features, a smaller attack surface, or a different language or platform.
:::

---

## Memory and observability

### memU {#memu}

A memory framework for long-running agents ("personal memory across agents"), self-hosted or on [memu.so](https://memu.so).

- 14,553 stars, last push 2026-10-17. Repo: [NevaMind-AI/memU](https://github.com/NevaMind-AI/memU). GitHub no longer detects a standard license (NOASSERTION); read its LICENSE file before relying on it.

More memory plugins are listed in [Resources](/reference/resources#memory--context-plugins) and compared in [Memory Systems](/guides/memory-systems).

### Observability

OpenClaw's default Docker images bundle the official [`diagnostics-otel`](https://docs.openclaw.ai/plugins/reference/diagnostics-otel) plugin for OpenTelemetry export; start there. A community alternative is [henrikrexed/openclaw-observability-plugin](https://github.com/henrikrexed/openclaw-observability-plugin) (42 stars, last push 2026-07-20), with traces per tool call and examples for Dynatrace and Grafana.

---

## Mobile, desktop and wearables

### VisionClaw {#visionclaw}

A real-time assistant for Meta Ray-Ban glasses (voice, vision and actions via Gemini Live and OpenClaw), iOS-based.

- 2,592 stars, last push 2026-09-26. Repo: [Intent-Lab/VisionClaw](https://github.com/Intent-Lab/VisionClaw) (formerly `sseanliu/VisionClaw`). License: custom.

### ClawPhone {#clawphone}

OpenClaw on a cheap Android phone via Termux, with hardware access through Termux:API.

- 549 stars, last push 2026-05-25. Repo: [marshallrichards/ClawPhone](https://github.com/marshallrichards/ClawPhone).
- For most people the official [Android app](https://docs.openclaw.ai/platforms/android), paired with a Gateway, is simpler.

---

## Security tools {#security-tools}

Community tools; none replaces OpenClaw's own controls. Start with `openclaw security audit` and [Security Hardening](/security/hardening).

### ClawSec {#clawsec}

A security skill suite from Prompt Security: advisory feed, audit watchdog, drift detection for critical files, and checksum verification.

- 1,122 stars, MIT, last push 2026-10-18. Repo: [prompt-security/clawsec](https://github.com/prompt-security/clawsec). Write-up: [SentinelOne blog](https://www.sentinelone.com/blog/clawsec-hardening-openclaw-agents-from-the-inside-out/).

### ClawBands {#clawbands}

Middleware that blocks tool calls until a human approves them. OpenClaw now has built-in approvals ([exec approvals](https://docs.openclaw.ai/tools/exec-approvals)), which cover most of this.

- 196 stars, MIT, **no push since 2026-02-09**. Repo: [SeyZ/clawbands](https://github.com/SeyZ/clawbands).

### OpenClaw Security Monitor

Scripts for scheduled checks against known threats (ClawHavoc, AMOS, CVE-2026-25253), file permissions and gateway exposure.

- 49 stars, last push 2026-10-18. Repo: [adibirzu/openclaw-security-monitor](https://github.com/adibirzu/openclaw-security-monitor).

### Clawprint (archived) {#clawprint}

A hash-chained audit trail for agent runs. The repo moved to [tsyrulb/clawprint](https://github.com/tsyrulb/clawprint), is **archived**, and now describes itself as a "historical personal project; not a current Cyntrisec product". Use OpenClaw's audit ledger (`openclaw audit`, [config](https://docs.openclaw.ai/gateway/config-observability)) instead.

### SkillGuard (abandoned) {#skillguard}

A skill-file scanner at [bossondehiggs/skillguard](https://github.com/bossondehiggs/skillguard): 0 stars, one push on 2026-02-01. Not recommended. Use `openclaw skills verify` and ClawHub's audit verdicts ([Skill Verification](/security/skill-verification)).

See the [Security Overview](/security/overview) for the threat model.

---

## Skill collections and curated lists

### Awesome OpenClaw Skills {#awesome-openclaw-skills}

The largest curated skill list, filtered from ClawHub to drop spam, duplicates and risky entries.

- 53,191 stars, 5,057 forks, last push 2026-10-11. Repo: [VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills).

### Awesome OpenClaw {#awesome-openclaw}

A general list of OpenClaw resources and tools.

- 146 stars, last push 2026-04-20 (quiet). Repo: [vincentkoc/awesome-openclaw](https://github.com/vincentkoc/awesome-openclaw).
- The old `SamurAIGPT/awesome-openclaw` link now redirects to an unrelated repo; do not use it.

### Awesome OpenClaw Use Cases {#awesome-openclaw-use-cases}

Real-world use cases, each tested for at least a day before submission; crypto use cases are banned.

- 31,657 stars, 2,707 forks, **no push since 2026-03-24**. Repo: [hesamsheikh/awesome-openclaw-usecases](https://github.com/hesamsheikh/awesome-openclaw-usecases).

### Awesome OpenClaw (hosting-focused)

Hosting comparisons: free tiers, VPS, PaaS, serverless and managed hosts.

- 560 stars, 158 forks, last push 2026-06-12. Repo: [rohitg00/awesome-openclaw](https://github.com/rohitg00/awesome-openclaw).

### OpenClaw Ecosystem Directory

A web directory of projects built with OpenClaw: [openclawsearch.com](https://openclawsearch.com).

---

## Docker images {#docker-images}

:::warning Use the official images
Upstream: "Use `ghcr.io/openclaw/openclaw` or `openclaw/openclaw` and avoid unofficial mirrors, which don't share OpenClaw's release timing or retention policy" ([Docker install](https://docs.openclaw.ai/install/docker)). An unofficial image is someone else's build of software that holds your API keys.
:::

| Image | Maintainer | Notes |
|-------|-----------|-------|
| `ghcr.io/openclaw/openclaw` | OpenClaw | **Official**, primary registry. Tags `latest`, `main`, `extended-stable`, version tags; variants `-slim` and `-browser` (with Chromium) |
| `openclaw/openclaw` | OpenClaw | **Official** Docker Hub mirror of the same release |
| `1panel/openclaw` | 1Panel | Unofficial; packaged for the 1Panel app store |
| `coollabsio/openclaw` | Coolify team | Unofficial; arm64 builds |
| `alpine/openclaw` | Community | Unofficial; last updated 2026-06-21, months behind |

---

## Contributing to the ecosystem

The Gateway's [WebSocket protocol](https://docs.openclaw.ai/gateway/protocol) is the main integration point; all clients, official or not, use the same control plane. New capabilities usually belong in a plugin built on the [plugin SDK](https://docs.openclaw.ai/plugins/building-plugins) and published to ClawHub ([community plugins](https://docs.openclaw.ai/plugins/community)).

- [Gateway Architecture](/architecture/gateway)
- [Gateway API Reference](/reference/gateway-api)
- [Skill Development](/guides/skill-development)
- [ClawHub](/guides/clawhub)

## See also

- [Deployment Options](/guides/deployment-options)
- [Hosting Providers](/guides/hosting-providers)
- [Channels & Integrations](/guides/channels)
- [Security Overview](/security/overview)
- [Contributing to OpenClaw](/contributing/openclaw)
