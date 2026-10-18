---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Glossary
description: Definitions of OpenClaw-specific terms, components, tools, and concepts
keywords: [openclaw, openclaw glossary, terms, definitions, openclaw terminology, concepts, vocabulary]
---

# Glossary

Short definitions of OpenClaw terms, with links to the full documentation. Star counts are as of 2026-10-18.

---

## activeHours {#activehours}

The window in which the [Heartbeat](#heartbeat) may run, set with `agents.defaults.heartbeat.activeHours: { start, end }` and checked in the configured timezone. This replaces the older "quiet hours" idea. See [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat).

## AMOS

**Atomic macOS Stealer**, an infostealer that targets Keychain passwords, browser credentials and crypto wallets. Spread by the [ClawHavoc](#clawhavoc) campaign on [ClawHub](#clawhub). See [Known Vulnerabilities](/security/known-vulnerabilities#the-clawhavoc-campaign).

## Automations

Scheduled and event-triggered agent jobs, formerly called cron jobs (renamed in v2026.8.1; `openclaw cron` still works). Recurring checks belong here, not in the heartbeat. See [Automations](https://docs.openclaw.ai/automation/cron-jobs).

## Brain

This site's name for the LLM side of the agent: the model that reasons and decides which tools to call. Upstream calls it the agent runtime and model. Set it with `agents.defaults.model` (for example `anthropic/claude-sonnet-5-5`). See [Brain & Hands](/architecture/brain-and-hands).

## Channel

A connection between OpenClaw and a messaging platform such as WhatsApp, Telegram, Discord or Slack. Configured under `channels.<id>`; many channels ship as plugins. Email is an [automation](#automations) trigger, not a channel. See [Channels & Integrations](/guides/channels).

## ClawBands

Community middleware ([SeyZ/clawbands](https://github.com/SeyZ/clawbands), 196 stars) that asks for human approval before dangerous tool calls. No commits since 2026-02. Upstream [exec approvals](#exec-approvals) now cover most of this.

## Clawdbot {#clawdbot}

The original name of OpenClaw (November 2025). Renamed to [Moltbot](#moltbot) on January 27, 2026 after Anthropic asked for a name change.

## Clawdex

Koi Security's [pre-install skill check](https://koisecurity.com/clawdex) against its database of known malicious skills. See [Skill Verification](/security/skill-verification#2-check-against-koi-securitys-database).

## ClawHub {#clawhub}

OpenClaw's skill and plugin registry at [clawhub.ai](https://clawhub.ai). Since 2026-10-13 a new release stays unpublished until its TruffleHog and ClawScan checks pass; `openclaw skills verify @owner/<slug>` fetches a release's audit verdict. Target of the [ClawHavoc](#clawhavoc) campaign. See [ClawHub Guide](/guides/clawhub).

## ClawHavoc {#clawhavoc}

A supply-chain campaign reported by Koi Security in February 2026: **341 malicious skills** on ClawHub, 335 of which delivered [AMOS](#amos) through fake "Prerequisites" steps. See [Known Vulnerabilities](/security/known-vulnerabilities#the-clawhavoc-campaign).

## ClawPhone

Community project ([marshallrichards/ClawPhone](https://github.com/marshallrichards/ClawPhone), 549 stars) that runs OpenClaw on a cheap Android phone via Termux. For a supported phone client, use the official Android app (see [Companion apps](#companion-apps)).

## Clawprint

A tamper-evident audit-trail tool, now **archived** ([tsyrulb/clawprint](https://github.com/tsyrulb/clawprint), formerly `cyntrisec/clawprint`). Historical only; for audit logging use upstream `logging.audit` and `openclaw audit`.

## ClawSec

Security skill suite by Prompt Security ([prompt-security/clawsec](https://github.com/prompt-security/clawsec), 1.1k stars): advisory monitoring, audits and SOUL.md drift detection.

## Clawery

[clawery.com](https://clawery.com), an enterprise AI assistant service. Its site no longer mentions OpenClaw. Not part of the open-source project.

## Code Insight

VirusTotal's AI-based package analysis, which early-2026 reports said [ClawHub](#clawhub) used on uploads. Current upstream docs name VirusTotal, ClawScan and static analysis as ClawHub's scan sources. See [Skill Verification](/security/skill-verification#virustotal-integration-v202626).

## Companion apps

Official native clients: the macOS app (macOS 15.0+ in v2026.10.4; the 2026.10.10 beta raises it to 26.2), the iOS app on the App Store, the Android app on Google Play, and the [Windows Hub](#windows-hub). See [Platforms](https://docs.openclaw.ai/platforms).

## openclaw.json

The main config file, `~/.openclaw/openclaw.json` (JSON5). Holds models, channels, gateway, tools and heartbeat settings (for example `agents.defaults.heartbeat.every`). Override the path with `OPENCLAW_CONFIG_PATH`; check it with `openclaw config validate`. See [Configuration Reference](/reference/configuration).

## Context Accumulation

Session history growing over a long conversation, which raises the token count of every call. A main cost driver; keep sessions short or `/compact` them. See [Cost Management](/guides/cost-management).

## Control Plane

The Gateway's WebSocket endpoint (default `ws://127.0.0.1:18789`). The Control UI, CLI, apps and nodes all connect to it. See [Gateway](/architecture/gateway).

## Control UI

The browser app served by the Gateway at `http://127.0.0.1:18789/`: chat, approvals, settings, files and dashboards. Rebuilt in v2026.8.1. See [Control UI](https://docs.openclaw.ai/web/control-ui).

## CVE-2026-25253

High-severity (CVSS 8.8) one-click RCE fixed in v2026.1.29 on January 30, 2026. The Control UI trusted a `gatewayUrl` query parameter and sent the Gateway token to it, so a crafted link could steal the token, even from loopback-only instances. See [Known Vulnerabilities](/security/known-vulnerabilities#cve-2026-25253-one-click-remote-code-execution).

## Daemon Mode

Running the Gateway as a background service (launchd, systemd or Scheduled Tasks) that starts on login or boot. Install it with `openclaw gateway install` (or the equivalent `openclaw daemon install`); manage it with `openclaw gateway status|stop|start|restart`. There is no `--daemon` flag. See [`openclaw gateway`](https://docs.openclaw.ai/cli/gateway).

## Doctor

`openclaw doctor` checks config, services and state. `openclaw doctor --fix` applies repairs and migrations, such as retired config keys, `agents.list`, and `HEARTBEAT.md`. Run it after skipping releases. See [Doctor](https://docs.openclaw.ai/cli/doctor).

## Exec approvals {#exec-approvals}

The policy that decides whether the agent may run a shell command on the host. `tools.exec.mode` is `deny`, `allowlist`, `ask`, `auto` or `full`; inspect it with `openclaw approvals get`. See [Exec approvals](https://docs.openclaw.ai/tools/exec-approvals) and [hardening](/security/hardening#exec-approvals).

## Gateway {#gateway}

The single long-running Node.js process at the centre of OpenClaw. It runs the agent, owns channels, sessions and tools, and exposes the [control plane](#control-plane) on port 18789. Binds to loopback by default (`gateway.bind`). See [Gateway Architecture](/architecture/gateway).

## Hands

This site's name for the agent's tools: shell (`exec`), file read/write, browser, `web_fetch`, `web_search` and so on. What they may do is set by [exec approvals](#exec-approvals), [permission modes](#permission-mode) and the [sandbox](#sandbox-mode). See [Brain & Hands](/architecture/brain-and-hands).

## HEARTBEAT.md

**Retired.** A workspace file that used to hold the heartbeat checklist. Since v2026.8.1 the runtime never reads it. `openclaw doctor --fix` imports it into the heartbeat's [monitor scratch](#monitor-scratch), turns `tasks:` entries into [automations](#automations), and archives the file. See [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat).

## Heartbeat {#heartbeat}

A periodic agent turn that checks whether anything needs attention. Configured with `agents.defaults.heartbeat` (`every`, default `30m`; `"0m"` turns it off; plus `activeHours`, `model`, `isolatedSession`, `lightContext`). When nothing needs doing the agent replies `NO_REPLY`. A notable [cost driver](#context-accumulation). See [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat) and [Heartbeat Architecture](/architecture/heartbeat).

## Lobster

OpenClaw's official workflow shell ([openclaw/lobster](https://github.com/openclaw/lobster), 1.3k stars): a typed, local-first macro engine that chains skills and tools into pipelines. See [Lobster Workflows](/guides/lobster-workflows).

## Memory {#memory}

Long-term notes in the agent workspace: `~/.openclaw/workspace/MEMORY.md` plus daily files in `memory/YYYY-MM-DD.md`, searched by the built-in memory. Memory is stored locally but is injected into prompts, so it reaches your model provider. See [Memory System](/architecture/memory-system) and [Agent workspace](https://docs.openclaw.ai/concepts/agent-workspace).

## memU

Third-party memory framework for proactive agents ([NevaMind-AI/memU](https://github.com/NevaMind-AI/memU), 14.6k stars). Check its LICENSE file before use.

## MimiClaw

A separate agent written in C for the ESP32-S3 microcontroller ([memovai/mimiclaw](https://github.com/memovai/mimiclaw), 5.8k stars). Not OpenClaw itself. See [Lightweight Variants](/guides/lightweight-variants).

## Moltbook

A separate social network (created by Matt Schlicht) where AI agents post, comment and vote. Suffered a [major database breach](/security/known-vulnerabilities#moltbook-database-breach-january-31-2026) in January 2026.

## Moltbot {#moltbot}

OpenClaw's second name (January 27-30, 2026), adopted after the [Clawdbot](#clawdbot) trademark request, then dropped because "Moltbot never quite rolled off the tongue".

## Moltworker

[cloudflare/moltworker](https://github.com/cloudflare/moltworker) (9.9k stars) runs OpenClaw in a Cloudflare Sandbox on Workers. Its README calls it an experimental proof of concept, not officially supported. About $34.50/month running 24/7 per the README. Last pushed 2026-05.

## Monitor scratch {#monitor-scratch}

The heartbeat's instruction text, stored in the state database instead of a file. The heartbeat runs as an automation job: find its id with `openclaw cron list --all`, then read the scratch with `openclaw cron scratch <jobId>` or replace it with `--set "..."`. Replaces [HEARTBEAT.md](#heartbeatmd). See [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat).

## NanoClaw

An independent lightweight agent that runs each agent in a container ([nanocoai/nanoclaw](https://github.com/nanocoai/nanoclaw), formerly `gavrielc/nanoclaw`, 31k stars). See [Lightweight Variants](/guides/lightweight-variants).

## Nanobot

An independent lightweight Python agent from the University of Hong Kong ([HKUDS/nanobot](https://github.com/HKUDS/nanobot), 49k stars). See [Lightweight Variants](/guides/lightweight-variants).

## NO_REPLY

The reply a [heartbeat](#heartbeat) turn gives when nothing needs attention; OpenClaw then sends nothing. `HEARTBEAT_OK` is the legacy form.

## OpenClaw

Free, open-source AI agent you run yourself, connecting LLMs to your files, shell, browser and messaging apps. About 392k GitHub stars as of 2026-10-18. Created by Peter Steinberger, stewarded by the OpenClaw Foundation, MIT licensed. Previously [Clawdbot](#clawdbot) and [Moltbot](#moltbot).

## Orchestrator

This site's name for the part of the [Gateway](#gateway) that routes work between the model, tools and memory. See [Architecture Overview](/architecture/overview).

## Permission mode {#permission-mode}

A per-session access level: `read-only`, `guarded`, `workspace` or `full`, setting the session's filesystem boundary and who reviews exec escalations. Separate from `tools.exec.mode`, which governs host exec approvals. See [Session permission modes](https://docs.openclaw.ai/gateway/permission-modes).

## Profile

A named, isolated OpenClaw instance with its own config, state and workspace (`~/.openclaw-<name>/`). Select it with `openclaw --profile <name> …` or `OPENCLAW_PROFILE`. Used to run several gateways on one machine. See [Multiple gateways](https://docs.openclaw.ai/gateway/multiple-gateways).

## Prompt Injection

An attack where untrusted content (messages, web pages, skill output, documents) steers the agent into unintended actions. Trusted and untrusted text share one model context. See [Security Overview](/security/overview#the-prompt-injection-problem).

## Quiet Hours

Older name for [activeHours](#activehours): the heartbeat runs only inside `agents.defaults.heartbeat.activeHours`.

## Router

This site's name for the [Gateway](#gateway) logic that decides which agent and session handle an incoming message. Upstream configures it with bindings ([multi-agent routing](https://docs.openclaw.ai/gateway/config-agents/entries-and-multi-agent)). See [Architecture Overview](/architecture/overview).

## Sandbox Mode

Running an agent's tool execution inside a container instead of on the host, set with `agents.defaults.sandbox.mode` (`off` by default, `non-main` or `all`) or per agent. It applies per agent or session, not per skill; there is no `--sandbox` install flag. See [Security Hardening: sandboxing](/security/hardening#sandboxing) and [Skill Verification](/security/skill-verification#safe-installation-practices).

## Skill {#skill}

A folder containing a `SKILL.md` file (YAML frontmatter plus instructions) and any supporting files, which teaches the agent a task. Install from [ClawHub](#clawhub) with `openclaw skills install`, or write your own. See [Skill Development](/guides/skill-development).

## SkillGuard

A skill scanner ([bossondehiggs/skillguard](https://github.com/bossondehiggs/skillguard)) with 0 stars and a single push in February 2026. Effectively abandoned; don't rely on it. Use `openclaw skills verify` and `openclaw security audit --deep`.

## SOUL.md {#soulmd}

The agent's identity and tone file, `~/.openclaw/workspace/SOUL.md`. A [prompt injection](#prompt-injection) target: an attacker who can write to it can change the agent's behaviour persistently. See [SOUL.md Guide](/guides/soul-md).

## ToxicSkills

Snyk's February 5, 2026 audit of 3,984 skills from ClawHub and skills.sh: 36% had security flaws, 13.4% critical. See [Known Vulnerabilities](/security/known-vulnerabilities#snyk-studies-february-5-2026).

## trustedProxies

`gateway.trustedProxies` lists the reverse-proxy IPs whose forwarding headers the Gateway trusts. Without it, a proxied gateway can treat every request as local or accept spoofed `X-Forwarded-For` headers. See [Reverse proxies](/security/hardening#configure-trustedproxies-critical-for-reverse-proxies).

## VisionClaw

Community project for Meta Ray-Ban smart glasses with voice and vision ([Intent-Lab/VisionClaw](https://github.com/Intent-Lab/VisionClaw), formerly `sseanliu/VisionClaw`, 2.6k stars).

## WebChat

The chat surface over the Gateway WebSocket, available in the [Control UI](#control-ui) and the native apps. The old `gateway.webchat` and `channels.webchat` config keys are retired. See [WebChat](https://docs.openclaw.ai/web/webchat).

## WebClaw

Third-party browser client for the Gateway ([ibelick/webclaw](https://github.com/ibelick/webclaw), 647 stars). No commits since 2026-03. It only speaks Gateway protocol 3, so it cannot connect to current Gateways; use the built-in [Control UI](#control-ui). See [WebClaw Guide](/guides/webclaw).

## Windows Hub

The official native Windows app ([openclaw/openclaw-windows-node](https://github.com/openclaw/openclaw-windows-node), 2.2k stars, formerly `shanselman/openclaw-windows-hub`). Upstream recommends it for Windows 10 20H2+ and 11. See [Windows](https://docs.openclaw.ai/platforms/windows).

---

## See Also

- [Core Concepts](/getting-started/core-concepts): the fundamental building blocks
- [Architecture Overview](/architecture/overview): how components fit together
- [Ecosystem](/reference/ecosystem): community tools and projects
- [FAQ](/reference/faq): frequently asked questions
