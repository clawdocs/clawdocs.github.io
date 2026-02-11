---
sidebar_position: 8
title: Glossary
description: Definitions of OpenClaw-specific terms, components, tools, and concepts
---

# Glossary

Quick reference for OpenClaw-specific terms. Click any linked term to jump to its full documentation.

---

### AMOS

**Atomic macOS Stealer** — an infostealer targeting Keychain passwords, browser credentials, and crypto wallets. Distributed through the [ClawHavoc](#clawhavoc) campaign via password-protected ZIPs on [ClawHub](#clawhub). See [Known Vulnerabilities](/security/known-vulnerabilities#the-clawhavoc-campaign).

### Brain

The LLM reasoning component of OpenClaw. Makes API calls to a cloud provider (Anthropic, OpenAI, xAI) or local model, handles multi-step reasoning, and decides what actions to take. Model-agnostic — swap providers without changing your setup. See [Brain & Hands](/architecture/brain-and-hands).

### Channel

A connection between OpenClaw and an external messaging platform (WhatsApp, Telegram, Discord, Slack, etc.) or service (Gmail, GitHub, Spotify). OpenClaw supports 50+ channels. See [Channels & Integrations](/guides/channels).

### ClawBands

Community security middleware that intercepts tool executions and enforces human approval before dangerous actions. Supports terminal, WhatsApp, and Telegram approval channels. See [Ecosystem](/reference/ecosystem#clawbands).

### Clawdbot

The original name of OpenClaw (November 2025). Renamed to [Moltbot](#moltbot) on January 27, 2026 after Anthropic filed trademark complaints.

### Clawdex

Pre-installation skill scanning tool by [Koi Security](https://koisecurity.com/clawdex). Checks skills against a database of known malicious skills before installation. See [Skill Verification](/security/skill-verification#2-check-against-koi-securitys-database).

### ClawHub {#clawhub}

OpenClaw's official community skill marketplace with 5,700+ published skills. Was the target of the [ClawHavoc](#clawhavoc) campaign (341 malicious skills). Now uses VirusTotal scanning for all uploads. See [ClawHub Guide](/guides/clawhub).

### ClawHavoc {#clawhavoc}

A supply-chain attack campaign discovered by Koi Security on February 4, 2026. **335 malicious skills** on ClawHub distributed [AMOS](#amos) macOS malware via password-protected ZIPs in "Prerequisites" sections. See [Known Vulnerabilities](/security/known-vulnerabilities#the-clawhavoc-campaign).

### ClawPhone

Community project that runs OpenClaw on a $25 Android smartphone via Termux, with hardware control and Discord remote management. See [Ecosystem](/reference/ecosystem#clawphone).

### Clawprint

Community tamper-evident audit trail tool. Creates a SHA-256 hash chain ledger capturing every tool call and lifecycle event. See [Ecosystem](/reference/ecosystem#clawprint).

### ClawSec

Community security skill suite by Prompt Security. Includes advisory monitoring, automated security audits, and SOUL.md drift detection (`soul-guardian`). See [Ecosystem](/reference/ecosystem#clawsec).

### Clawery

A separate enterprise-focused product offering managed OpenClaw with additional security, compliance, audit logging, and container-isolated skills. Not part of the open-source project.

### Code Insight

Gemini-powered deep package analysis used by [ClawHub](#clawhub) since v2026.2.6 to scan skill uploads for malicious content. Part of the VirusTotal integration. See [Skill Verification](/security/skill-verification#virustotal-integration-v202626).

### config.yml

OpenClaw's main configuration file, located at `~/.openclaw/config.yml`. Controls LLM provider, heartbeat interval, channel settings, security options, and more. See [Configuration Reference](/reference/configuration).

### Context Accumulation

The tendency for session history to grow indefinitely during long conversations, driving up LLM API costs. A key cost driver — sessions should be kept short or context management strategies employed. See [Cost Management](/guides/cost-management).

### Control Plane

The WebSocket server (default: `ws://localhost:18789`) exposed by the [Gateway](#gateway). All clients, channels, and tools communicate through this single endpoint. See [Gateway](/architecture/gateway).

### CVE-2026-25253

Critical one-click RCE vulnerability (CVSS 8.8) discovered January 30, 2026 by Mav Levin. A cross-site WebSocket hijacking (CSWSH) attack that allowed remote code execution on any OpenClaw instance, even those bound to localhost. Patched in v2026.1.29. See [Known Vulnerabilities](/security/known-vulnerabilities#cve-2026-25253-one-click-remote-code-execution).

### Daemon Mode

Running the Gateway as a background service that starts on boot: `openclaw gateway --daemon`. Recommended for production deployments. See [Gateway](/architecture/gateway).

### Gateway {#gateway}

OpenClaw's central nervous system — a single long-running Node.js process that orchestrates communication between the [Brain](#brain), [Hands](#hands), [Memory](#memory), [Channels](#channel), and [Heartbeat](#heartbeat). Exposes a WebSocket [control plane](#control-plane) on port 18789. See [Gateway Architecture](/architecture/gateway).

### Hands

The execution environment that lets OpenClaw take actions: shell commands, file operations, browser automation, and HTTP requests. Runs with the same permissions as the user. See [Brain & Hands](/architecture/brain-and-hands).

### HEARTBEAT.md

A Markdown file at `~/.openclaw/HEARTBEAT.md` that defines tasks for the [Heartbeat](#heartbeat) to check on each cycle. Users write task definitions here; the agent reads them during each heartbeat. See [Heartbeat Guide](/guides/heartbeat).

### Heartbeat {#heartbeat}

The periodic autonomous task loop. Every N minutes (default: 30), the Gateway prompts the agent to check for pending work. The agent either responds `HEARTBEAT_OK` (nothing to do) or takes action. Enables proactive behaviors like inbox monitoring and scheduled tasks. A significant [cost driver](#context-accumulation). See [Heartbeat Architecture](/architecture/heartbeat).

### Lobster

OpenClaw's official workflow shell — a typed, local-first macro engine that turns skills and tools into composable pipelines. 440 GitHub stars. See [Ecosystem](/reference/ecosystem#lobster).

### Memory {#memory}

Persistent context stored as local Markdown files in `~/.openclaw/memory/`. Includes preferences, contacts, projects, and learnings. Never sent to any cloud service. Human-readable and directly editable. See [Memory System](/architecture/memory-system).

### memU

Third-party memory framework for 24/7 proactive agents. Builds a local knowledge graph of user preferences, past projects, and habits. 8,800 GitHub stars. See [Ecosystem](/reference/ecosystem#memu).

### MimiClaw

Community project running OpenClaw on a $5 ESP32-S3 microcontroller. Pure C, no Linux/Node.js required, 0.5W power consumption. See [Ecosystem](/reference/ecosystem#mimiclaw).

### Moltbook

A separate social network (created by Matt Schlicht) where AI agents autonomously post, comment, and vote. Grew to 1.6 million registered agents. Suffered a [major database breach](/security/known-vulnerabilities#moltbook-database-breach-january-31-2026) in January 2026 exposing 1.5 million API tokens.

### Moltbot {#moltbot}

The second name of OpenClaw (January 27–30, 2026). Adopted after Anthropic's trademark complaint about [Clawdbot](#clawdbot), then quickly renamed to OpenClaw because "Moltbot never quite rolled off the tongue."

### Moltworker

Cloudflare's official adaptation running OpenClaw on Cloudflare Workers with sandboxed execution, browser rendering, and R2 storage. ~$5–35/month. 8,400 GitHub stars. See [Ecosystem](/reference/ecosystem#moltworker).

### NanoClaw

Security-focused lightweight alternative that runs agents inside isolated containers (Docker or Apple Containers). Built on Anthropic's Agents SDK. 6,900 GitHub stars. See [Ecosystem](/reference/ecosystem#nanoclaw).

### Nanobot

Ultra-lightweight OpenClaw alternative — core functionality in ~4,000 lines of Python (99% smaller). Created at the University of Hong Kong. 15,900 GitHub stars. See [Ecosystem](/reference/ecosystem#nanobot).

### OpenClaw

Free, open-source autonomous AI agent that runs locally, connecting LLMs to your files, shell, browser, and messaging apps. 183,000+ GitHub stars as of February 2026. Created by Peter Steinberger. Previously named [Clawdbot](#clawdbot) and [Moltbot](#moltbot). MIT licensed.

### Orchestrator

The internal component within the [Gateway](#gateway) that coordinates routing between the [Brain](#brain), [Hands](#hands), [Memory](#memory), and [Skills](#skill). See [Architecture Overview](/architecture/overview).

### Prompt Injection

An attack where untrusted content (chat messages, skill outputs, external documents) manipulates the agent into performing unintended actions. OpenClaw processes trusted and untrusted content in the same reasoning context with no hard isolation boundaries. See [Security Overview](/security/overview#the-prompt-injection-problem).

### Quiet Hours

Configurable time periods when the [Heartbeat](#heartbeat) is paused to reduce costs and prevent unnecessary overnight activity. Configured in `config.yml`. See [Cost Management](/guides/cost-management).

### Router

The internal [Gateway](#gateway) component that dispatches incoming messages to appropriate handlers — determining whether a request needs the [Brain](#brain), a [Skill](#skill), or a direct response. See [Architecture Overview](/architecture/overview).

### Sandbox Mode

A restricted execution mode where skills run with limited permissions, preventing them from accessing the host system. Enabled with `--sandbox` flag during skill installation. See [Skill Verification](/security/skill-verification#safe-installation-practices).

### Skill {#skill}

OpenClaw's extension system. Each skill is a Markdown file with YAML frontmatter that defines what the skill does, when to activate it, what tools it needs, and how to execute. Can be installed from [ClawHub](#clawhub) or written from scratch. See [Skill Development](/guides/skill-development).

### SkillGuard

Community security scanner for OpenClaw skill files. Detects vulnerabilities, prompt injections, credential leaks, and malicious patterns. Outputs a 0–100 security score. See [Ecosystem](/reference/ecosystem#skillguard).

### SOUL.md {#soulmd}

The agent's identity and personality configuration file, located at `~/.openclaw/SOUL.md`. Defines the agent's name, tone, boundaries, expertise areas, and behavioral instructions. A key [prompt injection](#prompt-injection) target — attackers can modify it for persistent agent hijacking. See [SOUL.md Guide](/guides/soul-md).

### TitanShell

Security-first desktop client built with Tauri 2.0 (Rust) and Svelte 5.0. Features biometric keychain protection, zero-trust architecture, and ephemeral tokens. See [Ecosystem](/reference/ecosystem#titanshell).

### ToxicSkills

Snyk's security study (February 5, 2026) that found **36% of all ClawHub skills** contain security flaws, with 13.4% rated critical and 283 skills leaking credentials. The first documented AI agent supply-chain attack analysis. See [Known Vulnerabilities](/security/known-vulnerabilities).

### trustedProxies

A critical security configuration option that tells the Gateway which reverse proxy IPs to trust for forwarding headers. Without this, attackers can spoof `X-Forwarded-For` headers to bypass authentication — JFrog found 93.4% of exposed instances were vulnerable. See [Security Hardening](/security/hardening).

### VisionClaw

Community project enabling OpenClaw as a real-time AI assistant for Meta Ray-Ban smart glasses, with voice + vision + 56 connected skills. 681 GitHub stars. See [Ecosystem](/reference/ecosystem#visionclaw).

### WebChat

OpenClaw's built-in browser-based chat interface, accessible at the Gateway URL. No additional setup required.

### WebClaw

Third-party fast, browser-based web client that connects to the Gateway over WebSockets. 383 GitHub stars. See [WebClaw Guide](/guides/webclaw).

---

## See Also

- [Core Concepts](/getting-started/core-concepts) — The 5 fundamental building blocks
- [Architecture Overview](/architecture/overview) — How components fit together
- [Ecosystem](/reference/ecosystem) — Community tools and projects
- [FAQ](/reference/faq) — Frequently asked questions
