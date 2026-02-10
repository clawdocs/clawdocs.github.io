---
sidebar_position: 1
title: Architecture Overview
description: How OpenClaw's Gateway-centric architecture connects LLMs to your system
---

# Architecture Overview

OpenClaw uses a **Gateway-centric architecture** where a single long-running process orchestrates communication between an LLM (the "Brain"), local execution capabilities (the "Hands"), persistent memory, and external messaging channels.

## High-Level Architecture

```
                    ┌─────────────┐
                    │   Channels   │
                    │  (WhatsApp,  │
                    │  Telegram,   │
                    │  Discord...) │
                    └──────┬──────┘
                           │
                           ▼
┌──────────────────────────────────────────────┐
│                   Gateway                     │
│            (ws://localhost:18789)              │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Router   │  │ Heartbeat│  │  Skill     │ │
│  │          │  │  Timer   │  │  Registry  │ │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘ │
│       │              │              │         │
│       └──────────────┼──────────────┘         │
│                      │                         │
│              ┌───────┴────────┐                │
│              │  Orchestrator  │                │
│              └───────┬────────┘                │
│                      │                         │
│         ┌────────────┼────────────┐            │
│         ▼            ▼            ▼            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Brain   │ │  Hands   │ │  Memory  │      │
│  │  (LLM)  │ │ (Exec)   │ │  (Local) │      │
│  └──────────┘ └──────────┘ └──────────┘      │
└──────────────────────────────────────────────┘
```

## Component Summary

| Component | Role | Details |
|-----------|------|---------|
| **Gateway** | Central process | WebSocket server, daemon, process manager |
| **Brain** | Reasoning | LLM API calls (Anthropic, OpenAI, xAI, local) |
| **Hands** | Execution | Shell, filesystem, browser automation |
| **Memory** | Persistence | Local Markdown files in `~/.openclaw/memory/` |
| **Heartbeat** | Autonomy | Periodic task checker (default: every 30 min) |
| **Channels** | I/O | Messaging platform bridges |
| **Skills** | Extensions | YAML+Markdown skill definitions |
| **Router** | Dispatch | Routes messages to appropriate handlers |

## Data Flow

1. **Input arrives** — via a channel (WhatsApp message), heartbeat trigger, or CLI command
2. **Router dispatches** — determines if this needs the Brain, a skill, or a direct response
3. **Brain reasons** — the LLM analyzes the request and decides on a plan
4. **Hands execute** — shell commands, file operations, browser actions
5. **Memory updates** — relevant context saved for future conversations
6. **Response sent** — back through the originating channel

## Design Principles

- **Single process** — One gateway manages everything. No microservices, no containers required.
- **Local-first** — All data stays on disk. No cloud dependencies beyond the LLM API.
- **Model-agnostic** — Swap LLM providers by changing a config line.
- **Extensible** — Skills are just Markdown files. Anyone can write them.
- **Transparent** — Memory is human-readable Markdown. Config is YAML. No black boxes.

## Deep Dives

- [Gateway](/architecture/gateway) — The central process and WebSocket control plane
- [Brain & Hands](/architecture/brain-and-hands) — LLM integration and execution environment
- [Memory System](/architecture/memory-system) — How persistent memory works
- [Heartbeat](/architecture/heartbeat) — The autonomous task loop
