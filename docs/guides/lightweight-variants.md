---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Lightweight Variants
description: Independent OpenClaw-style agents, from a 678 KB Zig binary to a $5 ESP32 board, with star counts as of 2026-10-18
keywords: [openclaw, alternative, lightweight, nanoclaw, nanobot, picoclaw, ironclaw, zeroclaw, minimal]
---

# Lightweight Variants

OpenClaw's success produced a wave of smaller, independent agents. Some fit in a 678 KB binary, one runs on a $5 microcontroller, one runs in a browser tab. This page covers the ones worth knowing, grouped by what makes them different.

:::info
These are **community projects, not OpenClaw**. Each is an independent codebase with its own config, security model and release cadence. None of them runs OpenClaw skills, plugins or `openclaw.json` unchanged. Star counts and last-push dates are from `gh api` **as of 2026-10-18**; refresh them with `node scripts/refresh-stars.mjs`.
:::

## Quick comparison

| Variant | Repo | Stars | Language | Key strength |
|---------|------|------:|----------|--------------|
| [Nanobot](#nanobot) | [HKUDS/nanobot](https://github.com/HKUDS/nanobot) | 49.1k | Python | Python-native, many chat apps and providers |
| [ZeroClaw](#zeroclaw) | [zeroclaw-labs/zeroclaw](https://github.com/zeroclaw-labs/zeroclaw) | 33.0k | Rust | Single binary, 30+ channels, hardware control |
| [NanoClaw](#nanoclaw) | [nanocoai/nanoclaw](https://github.com/nanocoai/nanoclaw) | 31.0k | TypeScript | Agents run in containers |
| [PicoClaw](#picoclaw) | [sipeed/picoclaw](https://github.com/sipeed/picoclaw) | 30.1k | Go | $10 boards, ~10-20 MB RAM |
| [IronClaw](#ironclaw) | [nearai/ironclaw](https://github.com/nearai/ironclaw) | 12.7k | Rust | WASM-sandboxed tools, encrypted credential store |
| [NullClaw](#nullclaw) | [nullclaw/nullclaw](https://github.com/nullclaw/nullclaw) | 8.1k | Zig | 678 KB static binary |
| [MimiClaw](#mimiclaw) | [memovai/mimiclaw](https://github.com/memovai/mimiclaw) | 5.8k | C | Runs on an ESP32-S3, no OS |
| [TinyAGI](#tinyclaw) (fka TinyClaw) | [TinyAGI/tinyagi](https://github.com/TinyAGI/tinyagi) | 3.6k | TypeScript | Multi-agent teams |
| [MicroClaw](#microclaw) | [microclaw/microclaw](https://github.com/microclaw/microclaw) | 746 | Rust | Lean multi-channel bot |
| [Tiny Claw](#tinyclaw) | [warengonzaga/tinyclaw](https://github.com/warengonzaga/tinyclaw) | 295 | TypeScript | Independent design, model routing |
| [VibeClaw](#vibeclaw) | [jasonkneen/vibeclaw](https://github.com/jasonkneen/vibeclaw) | 135 | TypeScript | Runs in the browser |
| [JSClaw](#jsclaw) | [jsclaw/jsclaw](https://github.com/jsclaw/jsclaw) | 1 | JavaScript | Container-orchestration library |

---

## Zero install: browser

### VibeClaw

Runs an OpenClaw-style agent in a browser tab via almostnode (Node.js in the browser with a virtual filesystem). Visit [vibeclaw.dev](https://vibeclaw.dev), pick a personality and chat. A sandbox mode runs entirely client-side with no persistence; a live-gateway mode connects to a running OpenClaw Gateway.

- 135 stars, AGPL-3.0, last push 2026-04-21 (quiet since spring).
- **Best for:** demos and workshops, trying the idea before installing anything.

---

## Ultra-lightweight and embedded

### NullClaw

A 678 KB static Zig binary (Zig 0.16.0) with about 1 MB of RAM and under 2 ms startup, per its README. It claims 50+ providers, 19 channels, 35+ tools, MCP and GPIO/I2C/SPI peripheral control.

- 8.1k stars, MIT, last push 2026-10-08.
- **Best for:** edge devices and anywhere memory is measured in megabytes.

### PicoClaw

Sipeed's agent, written from scratch in Go (not a fork) and inspired by Nanobot. It targets $10 hardware such as Sipeed's LicheeRV boards, and also ships an Android APK and a system-tray build for Windows and Linux. It supports MCP, many chat channels (Telegram, Discord, Matrix, IRC, WeChat/WeCom and others) and multiple providers.

- 30.1k stars, MIT, latest release v0.3.1 (2026-07-03), last push 2026-10-15.
- The README itself warns that it is in early, fast development, "may have unresolved security issues", and should not go to production before v1.0. It also says the only official site is [picoclaw.io](https://picoclaw.io), and that PicoClaw has issued no token: crypto "PicoClaw" tokens are scams.
- **Best for:** cheap RISC-V and ARM boards, hardware experiments.

:::note
An unrelated, inactive repo, `AbuZar-Ansarii/PicoClaw` (36 stars, no push since March 2026), shares the name. The PicoClaw people mean is `sipeed/picoclaw`.
:::

### MimiClaw

A pure C agent on an ESP32-S3 (16 MB flash, 8 MB PSRAM), with no Linux and no Node.js. It talks to an LLM API over Wi-Fi, keeps `MEMORY.md`/`SOUL.md`-style files in flash, and uses Telegram as its interface. It also does web search, OTA updates, scheduled jobs and GPIO.

- 5.8k stars, MIT, last push 2026-10-04.
- Build and flash with ESP-IDF following the [repo README](https://github.com/memovai/mimiclaw).
- **Best for:** always-on IoT endpoints at about 0.5 W.

---

## Security-first

### NanoClaw

Runs each agent in its own container (Docker, or Apple Containers on macOS), built on Anthropic's Agents SDK. Per its README it connects to WhatsApp, Telegram, Slack, Discord, Gmail and other apps, with memory and scheduled jobs. The repo moved from `gavrielc/nanoclaw` to `nanocoai/nanoclaw`.

- 31.0k stars, MIT, last push 2026-10-18.
- Container isolation limits what a misbehaving agent can reach, but it is not escape-proof: you still need sensible mounts, network policy and credentials hygiene.
- **Best for:** multi-user setups and handling sensitive data in a small codebase.

### IronClaw

NEAR AI's Rust "Agent OS focused on privacy, security and extensibility". Untrusted tools run in WASM sandboxes with capability permissions, secrets are injected at the host boundary rather than exposed to tools, outbound HTTP is allowlisted, and there is an optional Docker sandbox for jobs. Channels include a REPL, HTTP webhooks, Telegram and Slack (as WASM channels) and a web UI. Install from a pinned `ironclaw-v*` release, then run `ironclaw onboard`, as the [README](https://github.com/nearai/ironclaw) describes.

- 12.7k stars, Apache-2.0, latest release ironclaw-v1.4.1 (2026-09-29), last push 2026-10-18.
- **Best for:** people who want stronger tool isolation by default.

:::note
`JoasASantos/ironclaw` (83 stars, last push 2026-02-18) is a different project with the same name. The "13-layer, 432+ security tests" claims that circulated earlier come from that repo, not from NEAR's.
:::

### ZeroClaw

A single Rust binary that, per its README, talks to Anthropic, OpenAI, Ollama and about 20 other providers, reaches 30+ channels (Discord, Telegram, Matrix, email, voice, webhooks), and acts through shell, browser, HTTP, hardware and MCP tools. It adds workspace boundaries, command policies and OS-level sandboxes.

- 33.0k stars, Apache-2.0, latest release v0.8.6 (2026-10-18).
- **Best for:** combining a software agent with hardware automation in one binary.

---

## Python

### Nanobot

The University of Hong Kong's (HKUDS) Python agent and the most-starred variant. Its README now describes it as a self-hosted agent framework "with WebUI, tools, memory, MCP, multi-agent workflows, automation, and chat apps". The early "4,000 lines" claim is no longer made.

- 49.1k stars, 8.6k forks, MIT, latest release v0.3.5 (PyPI `nanobot-ai`), last push 2026-10-18.
- **Best for:** Python shops, research and quick prototyping across providers.

---

## Multi-channel and teams

### MicroClaw

A Rust chat agent inspired by NanoClaw: multi-step tool use, scoped persistent memory, MCP servers and optional SQLite memory. Channels: Telegram, Discord, Slack, Feishu/Lark, IRC, a web UI and optional Matrix.

- 746 stars, MIT, last push 2026-10-18.
- **Best for:** a small VPS where you want Rust efficiency.

### TinyClaw and TinyAGI {#tinyclaw}

Two different projects have used this name:

- **Tiny Claw** ([warengonzaga/tinyclaw](https://github.com/warengonzaga/tinyclaw), 295 stars, GPL-3.0, last push 2026-10-13). An independent framework, explicitly not a smaller OpenClaw, with its own personality engine, a web UI, adaptive memory and cheap/strong model routing.
- **TinyAGI** ([TinyAGI/tinyagi](https://github.com/TinyAGI/tinyagi), 3.6k stars, MIT, last push 2026-03-30). Formerly `jlia0/tinyclaw`, now "the agent teams orchestrator": multiple isolated agents in teams, Discord/WhatsApp/Telegram, a browser dashboard and a SQLite queue. It uses the Claude Code or Codex CLI as its provider backend.

---

## Libraries

### JSClaw

A JavaScript (ESM) library for running Claude agents in Docker containers with filesystem-based IPC, inspired by NanoClaw. It also includes a small OpenClaw-shaped gateway and CLI. See the [README](https://github.com/jsclaw/jsclaw) for its actual API; there is no `spawn()` function.

- 1 star, AGPL-3.0, last push 2026-06-12. Treat it as a proof of concept.

---

## Mobile

For an always-on phone, use the official OpenClaw apps. They are companion nodes that pair with a Gateway running elsewhere: [iOS on the App Store](https://docs.openclaw.ai/platforms/ios) and [Android on Google Play](https://docs.openclaw.ai/platforms/android).

`Natfii/ZeroClaw-Android` (308 stars) is **archived** (last push 2026-03-07). Do not start new setups on it.

---

## Decision framework

### By constraint

| Constraint | Pick |
|------------|------|
| No install at all | VibeClaw (browser) |
| Under 1 MB binary | NullClaw |
| $5-10 hardware | MimiClaw (ESP32) or PicoClaw |
| Phone | Official OpenClaw iOS/Android app, paired with a Gateway |
| $5/month VPS | MicroClaw, NanoClaw or PicoClaw |
| A real server | OpenClaw |

### By priority

| Priority | Pick |
|----------|------|
| Tool isolation by default | IronClaw (WASM) or NanoClaw (containers) |
| Smallest footprint | NullClaw |
| Most features in one binary | ZeroClaw |
| Fastest to try | VibeClaw |
| Python | Nanobot |
| Hardware/IoT | MimiClaw, PicoClaw or ZeroClaw |
| Agent teams | TinyAGI |

### Variant or OpenClaw?

**Use OpenClaw when** you want the full feature set (Control UI, Automations, the Secret Store, approvals, native apps), ClawHub skills and plugins, and official docs at [docs.openclaw.ai](https://docs.openclaw.ai).

**Use a variant when** your hardware cannot run Node.js 24, you want a smaller attack surface or code you can read in an afternoon, you are in a Python-only environment, or you want to try the idea with no install.

Whichever you run, an agent with shell, files, email or browser access needs approvals and isolation. For OpenClaw, see [Security Hardening](/security/hardening); for a variant, read its own security notes first.

---

## See also

- [Ecosystem](/reference/ecosystem#lightweight-alternatives): the short index of these projects, plus community tools, clients and hosting
- [Installation](/getting-started/installation): standard OpenClaw setup
- [Local Models](/guides/local-models): running models on your own hardware
- [Security Overview](/security/overview): threat model and hardening
