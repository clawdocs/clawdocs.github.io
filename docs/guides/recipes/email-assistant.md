---
last_update:
  date: 2026-06-09
title: "Recipe: Email Assistant"
description: Build an OpenClaw skill that triages, summarizes, and responds to emails
keywords: [openclaw, email assistant, gmail automation, email triage, inbox assistant, ai email, automated replies]
---

# Recipe: Email Assistant

:::danger Read before you run this recipe
These recipes give an agent real powers (shell, SSH, email, smart-home devices). By default OpenClaw runs host commands **without asking** (`tools.exec.mode` is `full`) and the sandbox is **off**. Before you try one, turn on approvals (`openclaw config set tools.exec.mode ask`), use a strong model for anything that runs tools unattended, and give the agent only the accounts and devices the recipe needs. Config blocks on this page predate OpenClaw 2.0 and may be rejected; check them with `openclaw config validate`. See [permission modes](https://docs.openclaw.ai/tools/permission-modes) and [sandboxing](https://docs.openclaw.ai/gateway/sandboxing).
:::

Build a skill that turns OpenClaw into a powerful email triage and response assistant.

## The Skill

```markdown title="~/.openclaw/skills/email-assistant.md"
---
name: email-assistant
version: 1.0.0
description: Intelligent email triage, summarization, and draft responses
trigger: "email|inbox|mail|gmail"
tools: [gmail, chat, memory]
config:
  vip_contacts: []
  auto_archive_promotions: true
  digest_channel: "whatsapp"
---

# Email Assistant

## Triage Rules
1. **VIP emails** (from configured contacts) → Immediate notification
2. **Action required** (contains deadlines, requests, questions) → High priority
3. **FYI/informational** → Batch into daily digest
4. **Promotions/newsletters** → Auto-archive if configured
5. **Spam/suspicious** → Flag and ignore

## Response Drafting
When asked to respond to an email:
1. Read the full thread for context
2. Check memory for past interactions with this sender
3. Draft a response matching the user's communication style
4. Present the draft for approval before sending

## Daily Digest
At the configured time, compile a digest of:
- Unread email count by category
- VIP emails that need attention
- Pending action items
- Calendar conflicts from email invites
```

## Setup

1. Connect Gmail:
```bash
openclaw channel add gmail
```

2. Install the skill:
```bash
openclaw skill install ./email-assistant.md
```

3. Configure VIP contacts:
```bash
openclaw skill config email-assistant --set vip_contacts='["boss@company.com","partner@example.com"]'
```

4. Add heartbeat integration:

```markdown title="~/.openclaw/HEARTBEAT.md"
## Email (every heartbeat)
- Run email-assistant skill to check for new emails
- Send VIP alerts to WhatsApp immediately
- Compile digest at 8am and 5pm
```

## Usage

```bash
openclaw chat "Check my email"
openclaw chat "Summarize emails from this week"
openclaw chat "Draft a reply to the latest email from Sarah"
openclaw chat "Archive all promotional emails from the last month"
```

## Results

Users report this recipe handles 50-200+ emails per day with minimal manual intervention. One notable user processed a **15,000 email backlog** using a variation of this skill.

## See Also

- [Channels & Integrations](/guides/channels) — Gmail setup
- [Heartbeat Guide](/guides/heartbeat) — Automatic email checking
