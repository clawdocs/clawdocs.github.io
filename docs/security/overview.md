---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Security Overview
description: OpenClaw's security defaults, trust model and threat model, a validated baseline config, and where to go next
keywords: [openclaw, openclaw security, threat model, attack surface, is openclaw safe, security overview, ai agent security]
---

# Security Overview

OpenClaw gives an AI agent real access to your machine and your accounts. This page covers what is safe by default, what isn't, and a baseline config to start from. It was checked against OpenClaw v2026.10.4 on 2026-10-18. For the full checklist, see [Security Hardening](/security/hardening).

---

## Start here

### 1. Run the latest stable release

```bash
openclaw --version
openclaw update
openclaw plugins update --all
```

`openclaw update` works for npm, pnpm and git installs ([`openclaw update`](https://docs.openclaw.ai/cli/update)). Channel plugins ship some security fixes separately, so update them too. See [Known Vulnerabilities](/security/known-vulnerabilities) for why this matters.

### 2. Start from a hardened baseline

This is upstream's ["hardened baseline in 60 seconds"](https://docs.openclaw.ai/gateway/security/hardened-baseline), with the current `tools.exec.mode` key. It keeps the Gateway local, isolates DMs per sender, and turns off shell, file and automation tools. Re-enable tools per trusted agent from there.

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
  session: { dmScope: "per-channel-peer" },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { mode: "deny" },
    elevated: { enabled: false },
    sessions: { visibility: "agent" },
    agentToAgent: { enabled: false },
  },
  channels: {
    telegram: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Set `OPENCLAW_GATEWAY_TOKEN` to the output of `openssl rand -hex 32`, or run `openclaw doctor --generate-gateway-token` to write a token into the config. The Gateway rejects blank and placeholder tokens at startup ([network exposure](https://docs.openclaw.ai/gateway/security/network-exposure)).

:::warning
OpenClaw refuses to start on unknown config keys. Snippets that use `gateway.host`, `channels.*.allowed_chat_ids` or `hands.*` are invalid. Run `openclaw config validate` after every edit.
:::

### 3. Run the audit

```bash
openclaw security audit --deep
openclaw security audit --fix    # tightens group policies and file permissions only
```

The audit tells you when you have drifted from safe defaults. It is not a substitute for tool policy and sandboxing, which upstream treats as the real boundaries ([SECURITY.md](https://github.com/openclaw/openclaw/blob/main/SECURITY.md), [`openclaw security`](https://docs.openclaw.ai/cli/security)).

---

## What is on by default

As of v2026.10.4:

| Setting | Default | Source |
|---|---|---|
| Gateway bind | `loopback` on host installs | [network exposure](https://docs.openclaw.ai/gateway/security/network-exposure) |
| Gateway bind in the Docker setup | **`lan`**, port published on all host interfaces | [Docker networking](https://docs.openclaw.ai/install/docker/networking-and-storage) |
| Gateway auth | Required; fails closed with no secret | [network exposure](https://docs.openclaw.ai/gateway/security/network-exposure) |
| DM policy | `pairing` (unknown senders get a code) | [access control](https://docs.openclaw.ai/gateway/security/access-control) |
| Group policy | `allowlist` | [groups](https://docs.openclaw.ai/channels/groups) |
| Host shell (`tools.exec.mode`) | **`full`**: commands run without asking | [exec approvals](https://docs.openclaw.ai/tools/exec-approvals) |
| Sandbox (`agents.defaults.sandbox.mode`) | **`off`** | [sandboxing](https://docs.openclaw.ai/gateway/sandboxing) |
| Session tool reach | Gateway-wide (`tools.sessions.visibility: "all"`) | [trust model](https://docs.openclaw.ai/gateway/security/trust-model) |
| Update check | A daily request to `telemetry.openclaw.ai` | [telemetry](https://docs.openclaw.ai/gateway/telemetry) |

The bold rows are the ones to change for most setups: [publish Docker ports to loopback](/security/hardening#docker), [turn on exec approvals](/security/hardening#exec-approvals) and [enable the sandbox](/security/hardening#sandboxing).

## What OpenClaw has access to

With the defaults, the agent can:

- **Run shell commands** on the Gateway host as your user, without approval
- **Read and write files** your user can access (file tools can be limited to the workspace; exec can't without a sandbox)
- **Drive a browser**, fill forms and fetch URLs
- **Send messages** on your behalf through connected channels, including across channels
- **Make HTTP requests**
- **Edit its own workspace files**, including `SOUL.md`, `AGENTS.md` and `MEMORY.md`

Source: [SECURITY.md](https://github.com/openclaw/openclaw/blob/main/SECURITY.md), which says exec is host-first by default and recommends sandbox mode plus strict tool policy when you need isolation.

---

## Trust model

OpenClaw is built as a personal assistant for one trusted operator, possibly with many agents. It is not a multi-tenant system ([trust model](https://docs.openclaw.ai/gateway/security/trust-model)):

- **One trust boundary per Gateway.** A single operator, or a team whose members trust each other. For people who don't trust each other, run separate Gateways, ideally under separate OS users or hosts.
- **Everyone who can message an agent shares its tools.** In a shared Slack workspace, any allowed sender can steer the agent within its permissions.
- **Session ownership and operator roles are guardrails, not isolation.**
- **Anyone who can edit `~/.openclaw` is an operator.**
- **The model is not trusted.** Assume prompt injection can manipulate it. A prompt injection on its own is out of scope as a vulnerability report; a report must show a bypass of auth, tool policy, approvals or the sandbox ([SECURITY.md](https://github.com/openclaw/openclaw/blob/main/SECURITY.md)).
- **Plugins are trusted code.** They run in-process with the Gateway's privileges.

## Threat model

| Surface | Risk | Mitigation |
|---------|------|------------|
| **Gateway port** | Full operator access if reached with a valid secret, or with none | Loopback bind, strong token, SSH tunnel or Tailscale Serve for remote access |
| **Docker publishing** | Port exposed on every host interface; bypasses ufw | Publish to `127.0.0.1:18789`, `DOCKER-USER` rules |
| **Reverse proxies** | Forwarded-header spoofing | `gateway.trustedProxies`, overwrite `X-Forwarded-For`. An unconfigured same-host proxy is rejected with `403 proxy_attribution_required` (since [PR #1795](https://github.com/openclaw/openclaw/pull/1795), January 2026) |
| **Channel messages** | Prompt injection from senders | DM pairing or allowlists, mention-gated groups, `contextVisibility` |
| **Host shell** | Injected commands run as your user | `tools.exec.mode: "ask"` or `"deny"`, sandbox |
| **ClawHub skills** | Malicious instructions or code | `openclaw skills verify`, manual review, `security.installPolicy` |
| **Plugins** | Arbitrary code in the Gateway process | Install only what you trust, `plugins.allow` |
| **Credentials** | Plaintext in `openclaw.json`, `.env`, `credentials/` | SecretRefs, `openclaw secrets audit --check`, `600`/`700` permissions |
| **Transcripts and memory** | Private data at rest | Full-disk encryption, tight permissions, pruning |
| **Browser automation** | SSRF into your LAN, session theft | Strict-by-default `browser.ssrfPolicy` (`allowedHostnames`, `blockedHostnames`) |
| **LLM provider** | Your prompts and tool output leave the host | Choose a provider and retention terms you accept, or a local model |

Details: [Security Hardening](/security/hardening), upstream [Security](https://docs.openclaw.ai/gateway/security).

### The Prompt Injection Problem

OpenClaw processes untrusted content (chat messages, web pages, documents, skill text) in the same model context as your instructions. Upstream wraps external content and offers controls such as `contextVisibility`, but the model can still be manipulated. Limit what a manipulated agent can do ([prompt injection](https://docs.openclaw.ai/gateway/security/prompt-injection)).

In February 2026, Zenity Labs demonstrated a [zero-click attack chain](https://labs.zenity.io/p/openclaw-or-opendoor-indirect-prompt-injection-makes-openclaw-vulnerable-to-backdoors-and-much-more) against a default setup:

1. Indirect prompt injection through a **Google Document**
2. The agent creates a **Telegram integration** with an attacker-controlled bot
3. The attacker edits **`SOUL.md`** for persistence across sessions
4. A **scheduled task** re-injects instructions every 2 minutes
5. A traditional **C2 implant** completes the compromise

Every step used intended capabilities. The defences that would have stopped it are the ones that limit capability: exec approvals or `exec.mode: "deny"`, the sandbox, a `messaging` tool profile for agents that read documents, and allowlisted channels.

---

## Checklist

- [ ] **Run the latest stable release** (v2026.10.4 as of 2026-10-18) and `openclaw plugins update --all`
- [ ] **Keep `gateway.bind: "loopback"`**; in Docker, publish to `127.0.0.1` only
- [ ] **Use a token of at least 24 characters**, ideally 64 hex
- [ ] **Remote access via SSH tunnel, Tailscale Serve or Cloudflare Access**, never an open port
- [ ] **Set `gateway.trustedProxies`** if any reverse proxy is in front
- [ ] **Keep DM pairing or allowlists**; mention-gate groups; set `session.dmScope: "per-channel-peer"` if more than one person DMs the bot
- [ ] **Turn on exec approvals** (`tools.exec.mode: "ask"` or `"auto"`) and **the sandbox** (`agents.defaults.sandbox.mode: "non-main"`)
- [ ] **Review skills and plugins**: `openclaw skills list`, `openclaw skills verify @owner/<slug>`, `openclaw plugins list`
- [ ] **Move secrets to SecretRefs** and run `openclaw secrets audit --check`
- [ ] **Limit when heartbeats run** with `agents.defaults.heartbeat.activeHours`
- [ ] **Review memory**: `~/.openclaw/workspace/MEMORY.md` and `memory/*.md`
- [ ] **Watch workspace files** (`SOUL.md`, `AGENTS.md`) for changes you didn't make
- [ ] **Run `openclaw security audit --deep`** after every change

---

## Community security tools

Third-party projects, listed for reference. **clawdocs has not reviewed their code.** A security tool runs with the same access as the agent, so vet it like any other skill or plugin.

| Tool | Description |
|------|-------------|
| [**ClawSec**](https://github.com/prompt-security/clawsec) | Skill suite: SOUL.md drift detection, advisory monitoring, audit watchdog |
| [**ClawBands**](https://github.com/SeyZ/clawbands) | Middleware that asks for human approval before dangerous actions |
| [**Security Monitor**](https://github.com/adibirzu/openclaw-security-monitor) | Monitoring scripts targeting known threat campaigns |
| [**openclaw-secure**](https://github.com/seomikewaltman/openclaw-secure) | Hardware-gated secret management with pluggable backends |
| [**Clawdex**](https://koisecurity.com/clawdex) | Koi Security's lookup of skills against its malicious-skills database |
| [**Cisco Skill Scanner**](https://github.com/cisco-ai-defense/skill-scanner) | Static, dataflow and LLM-based scanning of agent skills |

See the [Ecosystem page](/reference/ecosystem#security-tools) for more.

---

## Enterprise assessment

> *"It is not enterprise software. There is no promise of quality, no vendor support, no SLA... it ships without authentication enforced by default."* — Gartner, February 2026

The authentication part of that quote is out of date: current releases require Gateway auth by default and fail closed ([network exposure](https://docs.openclaw.ai/gateway/security/network-exposure)). The rest still describes an open-source project without a vendor. For compliance questions, see [Privacy & Compliance](/guides/privacy-compliance).

---

## Security incident history

OpenClaw's adoption (392,000+ GitHub stars as of 2026-10-18) outpaced its security work in early 2026. In late January and early February 2026, a one-click RCE (CVE-2026-25253) was patched, tens of thousands of exposed instances were found on the internet, hundreds of malicious skills were found on ClawHub, and the Moltbook breach exposed 1.5 million agent API tokens.

Since then the project has published 722 security advisories (as of 2026-10-18), 14 of them critical. The full timeline, the critical advisories and the current minimum version are on [Known Vulnerabilities](/security/known-vulnerabilities).

---

## Deep dives

- [Security Hardening](/security/hardening): the full self-hosting checklist
- [Known Vulnerabilities](/security/known-vulnerabilities): advisories, incidents and timeline
- [Skill Verification](/security/skill-verification): reviewing skills before installing them
- [Privacy & Compliance](/guides/privacy-compliance): data flows, telemetry, GDPR, SOC 2, HIPAA
- Upstream: [Security](https://docs.openclaw.ai/gateway/security) · [Trust model](https://docs.openclaw.ai/gateway/security/trust-model) · [Threat model (MITRE ATLAS)](https://docs.openclaw.ai/security/THREAT-MODEL-ATLAS)
