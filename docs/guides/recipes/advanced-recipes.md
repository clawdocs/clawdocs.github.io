---
sidebar_position: 10
title: Advanced Recipes
description: Production-grade setups — multi-agent DevOps, RAG pipelines, Home Assistant, server monitoring, content pipelines, and voice control
keywords: [openclaw, advanced recipes, production setup, advanced automation, multi-agent, rag pipeline, devops]
---

# Advanced Recipes

These recipes go beyond the basics. Each is a production-grade setup with full configuration, skill files, and step-by-step instructions.

**Prerequisites:** You should be comfortable with [multi-agent configuration](/guides/multi-agent), the [Workboard](/guides/workboard), and [skill development](/guides/skill-development).

---

## Multi-Agent DevOps Pipeline

Three agents coordinate code review, testing, and deployment through the Workboard.

### Architecture

```
PR opened → reviewer agent claims card → reviews code
         → tester agent claims card → runs test suite
         → deployer agent claims card → deploys to staging
         → human approves → deployer promotes to production
```

### Agent Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "agents": {
    "list": [
      {
        "id": "reviewer",
        "workspace": "~/.openclaw/workspace-reviewer",
        "model": "claude-sonnet-4-6"
      },
      {
        "id": "tester",
        "workspace": "~/.openclaw/workspace-tester",
        "model": "claude-haiku-4-5-20251001"
      },
      {
        "id": "deployer",
        "workspace": "~/.openclaw/workspace-deployer",
        "model": "claude-sonnet-4-6"
      }
    ]
  },
  "bindings": [
    { "agentId": "reviewer", "match": { "channel": "discord", "space": "code-review" } },
    { "agentId": "tester", "match": { "channel": "discord", "space": "testing" } },
    { "agentId": "deployer", "match": { "channel": "slack", "space": "deploys" } }
  ],
  "plugins": {
    "entries": {
      "workboard": { "enabled": true }
    }
  }
}
```

### Reviewer Skill

```markdown title="~/.openclaw/workspace-reviewer/skills/pr-review.md"
---
name: pr-review-pipeline
version: 1.0.0
description: Review PRs and create Workboard cards for next steps
trigger: "review pr|new pr|pull request"
tools: [shell, github, workboard]
---

# PR Review Pipeline

## When a PR is assigned to you
1. Fetch the diff: `gh pr diff <number> --repo <org/repo>`
2. Analyze for:
   - Logic errors and potential bugs
   - Security vulnerabilities (OWASP top 10)
   - Performance regressions
   - Missing or inadequate tests
   - Breaking API changes
3. Post a structured review comment via `gh pr review`
4. If approved, create a Workboard card for the tester agent:
   - Title: "Test PR #<number>: <title>"
   - Priority: based on change size (high for >500 lines)
   - Labels: test, pr-<number>
   - Agent: tester
5. If changes requested, post review and wait for updates
```

### Heartbeat for Auto-Detection

```markdown title="~/.openclaw/workspace-reviewer/HEARTBEAT.md"
## Every heartbeat
- Check github.com/myorg/myapp for new PRs without reviews
- For each unreviewed PR, claim it and start a review
- Check for PRs with updated commits that need re-review
- Alert on Slack if any PR has been open >48 hours without review
```

### Deployer Skill

```markdown title="~/.openclaw/workspace-deployer/skills/deploy-pipeline.md"
---
name: deploy-pipeline
version: 1.0.0
description: Deploy to staging and production with safety checks
trigger: "deploy|ship|release"
tools: [shell, github, workboard]
---

# Deployment Pipeline

## Pre-Deploy Checklist
1. Verify all tests passed (check Workboard card status)
2. Check for pending database migrations
3. Verify no active incidents in PagerDuty/OpsGenie
4. Confirm deployment window (no quiet hours, no freeze)

## Deploy to Staging
1. `gh workflow run deploy-staging.yml --ref <branch>`
2. Wait for workflow completion
3. Run smoke tests against staging URL
4. Report status to Slack

## Promote to Production
- Requires explicit human approval ("approve production deploy")
- `gh workflow run deploy-production.yml --ref <tag>`
- Monitor error rates for 15 minutes post-deploy
- If error rate spikes >2x baseline, auto-rollback and alert
```

:::warning
Always require human approval for production deployments. Autonomous production deploys are a recipe for 3 AM incidents.
:::

---

## RAG Pipeline (Chat with Your Docs)

Set up document ingestion, embedding, and retrieval so your agent can answer questions from your own knowledge base.

### Architecture

```
Documents → Chunking → Embeddings → SQLite + sqlite-vec
                                         ↓
User question → Hybrid search (vector + BM25) → Context → LLM → Answer
```

### Option 1: Built-In Memory (Simplest)

OpenClaw's built-in memory already supports hybrid search. For a small knowledge base (under 1,000 documents), just drop files into memory:

```bash
# Copy your docs into the memory directory
cp -r ~/my-docs/*.md ~/.openclaw/memory/knowledge/

# Or create a skill that ingests documents
openclaw chat "Read all markdown files in ~/project/docs/ and save key facts to memory"
```

The built-in hybrid search (70% vector + 30% BM25) handles retrieval automatically.

### Option 2: MCP Knowledge Base Server

For larger knowledge bases, run a dedicated MCP server:

```bash
# Install an MCP-based RAG server (example: using Cognee)
pip install cognee

# Or use Supermemory's MCP server
npx @supermemory/mcp-server
```

Configure OpenClaw to connect:

```json5 title="~/.openclaw/openclaw.json"
{
  "mcp": {
    "servers": {
      "knowledge": {
        "command": "npx",
        "args": ["@supermemory/mcp-server", "--port", "3100"],
        "env": {
          "SUPERMEMORY_PATH": "~/.openclaw/knowledge-base"
        }
      }
    }
  }
}
```

### Ingestion Skill

```markdown title="~/.openclaw/skills/knowledge-ingest.md"
---
name: knowledge-ingest
version: 1.0.0
description: Ingest documents into the knowledge base
trigger: "ingest|index|add to knowledge"
tools: [shell, filesystem, mcp]
---

# Document Ingestion

## Process
1. Accept a file path or directory
2. For each document:
   - Detect format (Markdown, PDF, HTML, plain text)
   - Split into chunks (max 500 tokens each, 50-token overlap)
   - Preserve headings and section structure as metadata
   - Store chunks with source file path and section title
3. Report: number of documents processed, chunks created, any errors

## Chunking Strategy
- Split on heading boundaries first (## and ###)
- If a section exceeds 500 tokens, split on paragraph boundaries
- Keep code blocks intact (never split mid-block)
- Preserve front matter as metadata
```

### Query Skill

```markdown title="~/.openclaw/skills/knowledge-query.md"
---
name: knowledge-query
version: 1.0.0
description: Answer questions from the knowledge base
trigger: "search knowledge|ask docs|find in docs"
tools: [mcp, chat]
---

# Knowledge Base Query

## Process
1. Rephrase the user's question for optimal retrieval
2. Search the knowledge base using hybrid search (semantic + keyword)
3. Retrieve top 5 relevant chunks
4. Synthesize an answer citing specific sources
5. Include source file paths so the user can verify

## Response Format
Always include:
- A direct answer to the question
- Source references: [filename.md, section name]
- Confidence level (high/medium/low based on source relevance)
- "I couldn't find information about X" when sources don't cover the question
```

### Practical Examples

```
You: "What's our API rate limit policy?"
OpenClaw: Based on docs/api/rate-limits.md, the rate limit is 1000
requests per minute per API key, with a burst allowance of 50
additional requests. Enterprise keys have a 5000 RPM limit.
[Source: docs/api/rate-limits.md, "Rate Limiting" section]

You: "Ingest all the markdown files in ~/project/docs"
OpenClaw: Ingested 47 documents, created 312 chunks.
Largest: architecture-overview.md (23 chunks).
3 files skipped (binary/unsupported format).
```

:::tip
Start with Option 1 (built-in memory) and upgrade to an MCP server only when you outgrow it. Most personal knowledge bases work fine with built-in search.
:::

---

## Home Assistant Control

Control your smart home through natural language on any channel.

### Prerequisites

- [Home Assistant](https://www.home-assistant.io/) running on your network
- A long-lived access token (Settings → Security → Long-lived access tokens)
- The `ha-mcp` skill or direct API access

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "mcp": {
    "servers": {
      "home-assistant": {
        "command": "npx",
        "args": ["ha-mcp-server"],
        "env": {
          "HA_URL": "http://homeassistant.local:8123",
          "HA_TOKEN": "${HA_ACCESS_TOKEN}"
        }
      }
    }
  }
}
```

```bash
export HA_ACCESS_TOKEN="eyJ0eXAi..."
openclaw gateway restart
```

### Smart Home Skill

```markdown title="~/.openclaw/skills/home-control.md"
---
name: home-control
version: 2.0.0
description: Natural language smart home control via Home Assistant
trigger: "lights|temperature|thermostat|home|scene|lock|garage|alarm"
tools: [mcp, http, chat]
---

# Home Control

## Available Commands
- **Lights**: on/off, brightness (0-100%), color, color temperature
- **Climate**: set temperature, mode (heat/cool/auto), fan speed
- **Locks**: lock/unlock (require confirmation for unlock)
- **Scenes**: activate named scenes
- **Sensors**: read temperature, humidity, motion, door/window status
- **Media**: play/pause, volume, source selection

## Safety Rules
- Always confirm before unlocking doors or disabling alarms
- Never expose exact sensor values to group chats
- Log all lock/alarm state changes

## Scene Examples
- "Movie night" → dim living room to 20%, set warm white, pause music
- "Good morning" → raise blinds, set kitchen lights to 80% daylight, start coffee
- "Away mode" → all lights off, lock doors, set thermostat to eco, arm alarm
- "Bedtime" → gradual dim over 10 minutes, lock all doors, set night temperature

## Automations
- "Turn on porch light at sunset" → Create HA automation via API
- "Alert me if the garage is open after 10pm" → Create HA automation + notify via Telegram
```

### Heartbeat for Home Monitoring

```markdown title="Add to HEARTBEAT.md"
## Home Monitoring (every heartbeat)
- Check if any doors or windows have been open for more than 30 minutes
- Check if garage door is open after 10pm — if so, alert via Telegram
- Check indoor temperature — alert if outside 18-26°C range
- Check smoke/CO detectors for any triggered alarms (immediate alert)
```

### Usage

From Telegram, WhatsApp, or any connected channel:

```
You: "What's the temperature in the house?"
OpenClaw: Living room: 22.3°C, Bedroom: 20.8°C, Office: 23.1°C.
Thermostat is set to 22°C in auto mode.

You: "It's movie night"
OpenClaw: Movie night activated.
- Living room lights dimmed to 20% warm white
- TV backlight set to ambient blue
- Thermostat set to 21°C
Enjoy the show.

You: "Lock up for the night"
OpenClaw: Confirm: lock front door, back door, and garage, arm alarm?
You: "Yes"
OpenClaw: Done. All doors locked, alarm armed in home mode.
```

:::caution
Always require confirmation for security-critical actions (unlocking doors, disabling alarms). Never let the agent auto-execute these from the heartbeat.
:::

---

## Server Monitoring and Auto-Remediation

An always-on agent that watches your infrastructure and fixes common issues autonomously.

### Monitoring Skill

```markdown title="~/.openclaw/skills/server-monitor.md"
---
name: server-monitor
version: 1.0.0
description: Monitor servers and auto-remediate common issues
trigger: "server status|check servers|infra health"
tools: [shell, http, chat]
---

# Server Monitor

## Health Checks
Run these checks on each configured server:
1. **Disk space**: Alert if any partition >85% full
2. **Memory**: Alert if available RAM <10%
3. **CPU**: Alert if load average >4.0 for 5+ minutes
4. **Services**: Check that nginx, postgresql, redis are running
5. **SSL certificates**: Alert if any cert expires within 14 days
6. **HTTP endpoints**: Check response codes and latency

## Auto-Remediation (safe actions only)
- Disk >90%: Clear apt cache, rotate old logs, delete tmp files older than 7 days
- Service crashed: Restart with `systemctl restart <service>` (max 2 retries)
- High memory: Identify top consumer, report but do NOT kill processes

## Escalation
- If auto-fix fails, send Telegram/Slack alert with diagnostics
- If critical service down for >5 minutes, send urgent alert with ssh command to connect
- Never reboot servers autonomously
```

### Heartbeat Configuration

```markdown title="~/.openclaw/workspace/HEARTBEAT.md"
## Infrastructure (every heartbeat)
- SSH to each server in ~/.openclaw/workspace/servers.md
- Run health checks (disk, memory, CPU, services, SSL, HTTP)
- Auto-remediate safe issues (log rotation, cache clearing, service restart)
- Post summary to Slack #infrastructure channel
- Urgent alerts go to Telegram
```

### Server Inventory

```markdown title="~/.openclaw/workspace/servers.md"
# Server Inventory

| Name | Host | SSH | Role |
|------|------|-----|------|
| web-1 | 10.0.1.10 | ssh deploy@10.0.1.10 | Web server (nginx + app) |
| web-2 | 10.0.1.11 | ssh deploy@10.0.1.11 | Web server (nginx + app) |
| db-1 | 10.0.1.20 | ssh deploy@10.0.1.20 | PostgreSQL primary |
| cache-1 | 10.0.1.30 | ssh deploy@10.0.1.30 | Redis |
```

### Example Alert Flow

```
[Heartbeat fires at 3:15 AM]

OpenClaw → checks web-1 → disk at 92%
OpenClaw → clears apt cache, rotates logs → disk drops to 78%
OpenClaw → posts to Slack: "web-1: disk was at 92%, cleaned to 78% (cleared apt cache, rotated 4 log files)"

[Heartbeat fires at 3:45 AM]

OpenClaw → checks db-1 → PostgreSQL not responding
OpenClaw → restarts PostgreSQL → service recovers in 8 seconds
OpenClaw → posts to Slack: "db-1: PostgreSQL crashed, auto-restarted, recovered in 8s"
OpenClaw → sends Telegram: "⚠️ db-1 PostgreSQL crashed and was restarted. Investigate when available."
```

:::warning
Use a **cheap model** for monitoring heartbeats. This runs every 30 minutes — even Haiku adds up. See [Model Selection](/guides/model-selection) for heartbeat model recommendations.
:::

---

## Content Distribution Pipeline

Automate multi-platform content publishing from a single source.

### Pipeline Skill

```markdown title="~/.openclaw/skills/content-pipeline.md"
---
name: content-pipeline
version: 1.0.0
description: Transform and distribute content across platforms
trigger: "publish|distribute|post to|share on"
tools: [shell, http, filesystem, chat]
---

# Content Distribution

## Input
Accept content in any format: blog post, newsletter, video transcript, meeting notes.

## Platform Adaptation
For each target platform, transform the content:

| Platform | Format | Constraints |
|----------|--------|-------------|
| Twitter/X | Thread | 280 chars per tweet, 10 tweets max |
| LinkedIn | Article | Professional tone, 1300 chars for posts |
| Discord | Embed | Markdown, 2000 chars |
| Telegram | Message | Markdown, 4096 chars |
| Newsletter | Email | HTML, include unsubscribe |
| Blog | Markdown | Full-length, with SEO meta |

## Process
1. Analyze the source content
2. Extract key points, quotes, and data
3. Generate platform-specific versions
4. Present all versions for review before posting
5. Post to approved platforms via API/channel

## Scheduling
- "Post this Tuesday at 9am EST" → Create a cron job
- "Drip this thread over 3 days" → Schedule individual posts
```

### Usage

```
You: "Turn my blog post at ~/writing/ai-agents-2026.md into a Twitter thread and LinkedIn post"

OpenClaw: Here's what I've prepared:

**Twitter Thread (7 tweets):**
1/ AI agents went from novelty to necessity in 2026. Here's what changed...
2/ The big shift: agents stopped being chatbots...
[...]

**LinkedIn Post:**
AI Agents in 2026: From Novelty to Necessity
[...]

Ready to post? Say "post twitter" or "post linkedin" or "post both".
```

---

## Voice-Controlled Agent

Add speech-to-text and text-to-speech for hands-free control.

### Architecture

```
Voice message (Telegram/WhatsApp) → OpenClaw receives audio
  → Whisper transcription → Text prompt → Agent processes
  → Response text → ElevenLabs/Edge TTS → Voice reply
```

### Voice Skill

```markdown title="~/.openclaw/skills/voice-agent.md"
---
name: voice-agent
version: 1.0.0
description: Process voice messages and optionally reply with audio
trigger: "voice|audio|transcribe"
tools: [shell, http, chat]
---

# Voice Agent

## Incoming Voice Messages
1. When a voice message arrives, transcribe using Whisper:
   `whisper --model base --output_format txt <audio_file>`
2. Process the transcribed text as a normal message
3. If the user prefers voice replies, generate TTS audio

## Text-to-Speech (optional)
Generate voice replies using Edge TTS (free) or ElevenLabs (premium):

### Edge TTS (free)
```bash
edge-tts --text "Your response here" --voice en-US-AriaNeural --write-media reply.mp3
```

### ElevenLabs (premium)
```bash
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/<voice-id>" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your response here"}' \
  --output reply.mp3
```

## User Preference
- Ask the user if they want voice replies on first use
- Remember the preference in USER.md
- Default to text replies (cheaper and faster)
```

### Setup

```bash
# Install Whisper for transcription
pip install openai-whisper

# Install Edge TTS for free voice replies
pip install edge-tts

# Or set up ElevenLabs for premium voices
export ELEVENLABS_API_KEY="your-key-here"
```

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "voice": {
    "transcription": {
      "engine": "whisper",
      "model": "base"       // "tiny" for speed, "medium" for accuracy
    },
    "tts": {
      "engine": "edge-tts",  // "edge-tts" (free) or "elevenlabs" (premium)
      "voice": "en-US-AriaNeural"
    }
  }
}
```

---

## Tips for All Recipes

**Start simple.** Get one recipe working end-to-end before combining them. A monitoring agent that works reliably is worth more than a half-built multi-agent pipeline.

**Use cheap models for automation.** Heartbeat tasks, monitoring, and content formatting don't need Opus. Use Haiku, Gemini Flash, or a local model. Reserve Opus/Sonnet for code review and complex reasoning. See [Model Selection](/guides/model-selection).

**Set quiet hours.** Autonomous agents don't need to run at 3 AM unless they're monitoring infrastructure. Set quiet hours to save tokens and avoid surprise Telegram messages.

```json5 title="~/.openclaw/openclaw.json"
{
  "security": {
    "quiet_hours": {
      "enabled": true,
      "start": "23:00",
      "end": "07:00"
    }
  }
}
```

**Require confirmation for destructive actions.** Deploying to production, unlocking doors, deleting files — always require human approval. Set `confirm_dangerous_actions: true`.

**Monitor costs.** Multi-agent setups with frequent heartbeats can get expensive. Check `openclaw stats tokens` regularly. See [Cost Management](/guides/cost-management).

---

## See Also

- [Workboard](/guides/workboard) — Coordinate multi-agent work
- [Multi-Agent Workflows](/guides/multi-agent) — Agent configuration and routing
- [Plugin System](/guides/plugin-system) — Extending the gateway
- [Memory Systems](/guides/memory-systems) — Choosing a memory backend
- [Automation & Integrations](/guides/automation) — Cron, webhooks, CI/CD
- [Model Selection](/guides/model-selection) — Picking models by task and budget
- [Cost Management](/guides/cost-management) — Keeping costs under control
- [Skill Development](/guides/skill-development) — Building skills from scratch
- Existing recipes: [Code Reviewer](code-reviewer) · [Email Assistant](email-assistant) · [Research Agent](research-agent) · [Smart Home](smart-home)
