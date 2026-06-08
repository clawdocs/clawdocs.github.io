---
sidebar_position: 22
title: CI/CD & Testing
description: Test skills, validate agents, and build deployment pipelines for OpenClaw
---

# CI/CD & Testing

OpenClaw agents run in production 24/7 — so testing matters. This guide covers the full lifecycle: testing skills locally, scanning for security issues, validating agent behavior, automating deployments, and monitoring in production.

---

## Testing Skills

### Dry-Run Testing

Test a skill against a trigger phrase without installing it:

```bash
# Test a skill file with a sample message
openclaw skill test ./my-skill.md "trigger phrase here"

# Test an installed skill
openclaw skill test ~/.openclaw/skills/daily-standup.md "run my standup"
```

The agent processes the message as if it came from a real channel, but doesn't send any replies or execute side effects. You see the full reasoning chain, tool calls, and generated response.

### Validation

Check that a skill file has valid frontmatter and structure before deploying:

```bash
# Validate format and structure
openclaw clawhub validate ./my-skill.md
```

This checks:
- Valid YAML frontmatter (name, version, description, trigger)
- No syntax errors in the Markdown body
- Required fields are present
- Tool references are valid

### Heartbeat Dry-Run

Test your HEARTBEAT.md instructions without executing them:

```bash
# Preview what the heartbeat would do
openclaw heartbeat --now --dry-run

# Actually run one heartbeat cycle
openclaw heartbeat --now
```

---

## Security Scanning

### Built-In Scanners

OpenClaw includes static analysis that runs automatically when skills are installed or published:

| Scanner | What It Checks | Since |
|---------|---------------|-------|
| **Static analysis** | Pattern matching for known bad patterns | v2026.2.6 |
| **VirusTotal** | SHA-256 hash check + Code Insight (Gemini-powered) | v2026.2.6 |
| **Daily re-scan** | Active skills re-scanned for drift | v2026.2.6 |

```bash
# Scan all installed skills
openclaw security scan --all

# Scan a specific skill
openclaw security scan ./skill.md

# Check a ClawHub skill's security report before installing
openclaw clawhub security-report <skill-name>

# View full source before installing
openclaw clawhub view <skill-name>
```

### Third-Party Scanners

| Tool | What It Does |
|------|-------------|
| **Clawdex** | Pre-installation check against Koi Security's malicious skills database |
| **SkillGuard** | File scanner for vulnerability patterns |
| **SafeClaw Scanner** | Detects prompt injections, backdoors, obfuscated code |
| **Snyk mcp-scan** | Free Python tool powered by Snyk ML |

### Skill Workshop Gating

The [Skill Workshop](/guides/skill-workshop) (v2026.6.1+) adds a proposal queue with scanner gating:

```bash
# Create a skill proposal (enters review queue)
openclaw skills workshop propose-create \
  --name "deploy-helper" \
  --description "Assists with deployments" \
  --proposal ./PROPOSAL.md

# Scanner runs automatically at apply time
# Verdicts: Clean → applied, Suspicious → quarantined, Malicious → rejected

# Apply after review
openclaw skills workshop apply <proposal-id>

# Quarantine if suspicious
openclaw skills workshop quarantine <proposal-id> \
  --reason "Unexpected external API calls"
```

Skills that fail scanning are blocked from activation. See the [Skill Workshop guide](/guides/skill-workshop) for the full lifecycle.

---

## Integration Testing

### Testing Agent Responses

Test how your agent responds to specific inputs:

```bash
# Single-prompt test (no persistent session)
openclaw chat "What's the status of the staging deployment?"

# Test with context injection
openclaw chat --context ./test-data.json "Analyze this data"

# Test without memory (clean slate)
openclaw chat --no-memory "What do you know about our deployment schedule?"
```

### Conversation Regression Testing

Create a test script that validates agent behavior across key scenarios:

```bash title="test-agent.sh"
#!/bin/bash
set -e

echo "=== Skill Trigger Test ==="
openclaw skill test ~/.openclaw/skills/deploy-helper.md "deploy to staging"

echo "=== Security Scan ==="
openclaw security scan --all

echo "=== Health Check ==="
openclaw doctor

echo "=== Channel Connectivity ==="
openclaw channel status

echo "=== MCP Server Status ==="
openclaw mcp status

echo "=== Config Validation ==="
openclaw config list > /dev/null

echo "All tests passed."
```

```bash
chmod +x test-agent.sh
./test-agent.sh
```

### Testing MCP Servers

Verify MCP server connections and tool availability:

```bash
# Check all MCP servers
openclaw mcp doctor

# Probe a specific server's tools
openclaw mcp probe github

# Test a server interactively
npx @modelcontextprotocol/inspector
```

### Testing Plugins

```bash
# Check plugin health
openclaw plugins doctor

# Inspect a specific plugin's runtime state
openclaw plugins inspect workboard --runtime

# View plugin logs
openclaw logs --filter plugin --follow
```

---

## GitHub Actions

### PR Review Bot

Automatically review pull requests with your OpenClaw agent:

```yaml title=".github/workflows/openclaw-review.yml"
name: OpenClaw PR Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install OpenClaw
        run: npm install -g openclaw

      - name: Review PR
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          openclaw chat --once \
            "Review this pull request. Check for bugs, security issues, \
             and style. Post your review as a GitHub comment."
```

:::tip
Use a **read-only** GitHub token. The agent doesn't need push access to review code.
:::

### Skill Validation Pipeline

Validate skills on every push to your skills repository:

```yaml title=".github/workflows/validate-skills.yml"
name: Validate Skills
on:
  push:
    paths:
      - 'skills/**'
  pull_request:
    paths:
      - 'skills/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install OpenClaw
        run: npm install -g openclaw

      - name: Validate all skills
        run: |
          for skill in skills/*.md; do
            echo "Validating $skill..."
            openclaw clawhub validate "$skill"
          done

      - name: Security scan
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          for skill in skills/*.md; do
            echo "Scanning $skill..."
            openclaw security scan "$skill"
          done
```

### Deploy on Merge

Automatically deploy your agent when changes merge to main:

```yaml title=".github/workflows/deploy-agent.yml"
name: Deploy Agent
on:
  push:
    branches: [main]
    paths:
      - 'config/**'
      - 'skills/**'
      - 'HEARTBEAT.md'
      - 'SOUL.md'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install OpenClaw
        run: npm install -g openclaw
      - name: Validate config
        run: openclaw clawhub validate config/openclaw.json || true
      - name: Scan skills
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          for skill in skills/*.md; do
            openclaw security scan "$skill"
          done

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to server
        env:
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key

          # Sync config and skills
          rsync -avz -e "ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no" \
            config/ skills/ HEARTBEAT.md SOUL.md \
            deploy@$DEPLOY_HOST:~/.openclaw/

          # Restart gateway
          ssh -i ~/.ssh/deploy_key deploy@$DEPLOY_HOST \
            "openclaw gateway restart"
```

### Nightly Health Check

Run a full diagnostic suite on a schedule:

```yaml title=".github/workflows/nightly-health.yml"
name: Nightly Health Check
on:
  schedule:
    - cron: '0 3 * * *'  # 3 AM UTC daily

jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - name: Health check
        env:
          AGENT_HOST: ${{ secrets.AGENT_HOST }}
          SSH_KEY: ${{ secrets.SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_KEY" > ~/.ssh/key
          chmod 600 ~/.ssh/key

          ssh -i ~/.ssh/key -o StrictHostKeyChecking=no \
            deploy@$AGENT_HOST "openclaw doctor && openclaw mcp doctor && openclaw plugins doctor"

      - name: Alert on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: '{"text": "OpenClaw health check failed! Check the logs."}'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## GitLab CI

```yaml title=".gitlab-ci.yml"
stages:
  - validate
  - scan
  - deploy

validate-skills:
  stage: validate
  image: node:20
  script:
    - npm install -g openclaw
    - for skill in skills/*.md; do openclaw clawhub validate "$skill"; done
  only:
    changes:
      - skills/**

security-scan:
  stage: scan
  image: node:20
  script:
    - npm install -g openclaw
    - openclaw security scan --all
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
  only:
    changes:
      - skills/**

deploy:
  stage: deploy
  image: node:20
  script:
    - apt-get update && apt-get install -y rsync openssh-client
    - mkdir -p ~/.ssh
    - echo "$DEPLOY_SSH_KEY" > ~/.ssh/deploy_key
    - chmod 600 ~/.ssh/deploy_key
    - rsync -avz -e "ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no"
        config/ skills/ HEARTBEAT.md SOUL.md
        deploy@$DEPLOY_HOST:~/.openclaw/
    - ssh -i ~/.ssh/deploy_key deploy@$DEPLOY_HOST "openclaw gateway restart"
  only:
    - main
  when: manual
```

---

## Docker Deployment

### Basic Docker Compose

```yaml title="docker-compose.yml"
services:
  openclaw:
    image: openclaw/openclaw:latest
    ports:
      - "127.0.0.1:18789:18789"
    volumes:
      - openclaw-data:/root/.openclaw
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "openclaw", "doctor"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  openclaw-data:
```

### Production-Hardened Docker

```yaml title="docker-compose.prod.yml"
services:
  openclaw:
    image: openclaw/openclaw:latest
    user: "1000:1000"
    read_only: true
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=64M
    volumes:
      - openclaw-data:/home/node/.openclaw:rw
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    networks:
      - openclaw-internal
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "2.0"
    healthcheck:
      test: ["CMD", "openclaw", "doctor"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

networks:
  openclaw-internal:
    driver: bridge

volumes:
  openclaw-data:
```

### Docker with Local Models

```yaml title="docker-compose.local-llm.yml"
services:
  openclaw:
    image: openclaw/openclaw:latest
    environment:
      - OPENCLAW_BRAIN_PROVIDER=ollama
      - OLLAMA_HOST=http://ollama:11434
    depends_on:
      ollama:
        condition: service_healthy

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama-models:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  ollama-models:
```

### Kubernetes (Helm)

```bash
helm repo add openclaw https://serhanekicii.github.io/openclaw-helm
helm install openclaw openclaw/openclaw -f values.yaml
```

The Helm chart provides:
- StatefulSet with Chromium sidecar for web scraping
- Non-root, read-only root filesystems
- Init containers for auto-installing ClawHub skills
- ArgoCD and Stakater Reloader compatible
- Network policies with deny-all-ingress defaults

---

## Pre-Deployment Checks

Run these before every deployment or upgrade:

### Backup

```bash
# Full backup
tar czf ~/openclaw-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/openclaw.json \
  ~/.openclaw/workspace/ \
  ~/.openclaw/memory/ \
  ~/.openclaw/skills/
```

| Directory | Contents |
|-----------|----------|
| `openclaw.json` | Configuration, API keys, security settings |
| `workspace/` | SOUL.md, IDENTITY.md, USER.md |
| `memory/` | Persistent memory |
| `skills/` | Installed skills |

### Validation Checklist

```bash
# 1. Health check
openclaw doctor

# 2. Security audit
openclaw security audit

# 3. Scan all skills
openclaw security scan --all

# 4. Check channels
openclaw channel list

# 5. Check MCP servers
openclaw mcp doctor

# 6. Check plugins
openclaw plugins doctor

# 7. Verify config loads
openclaw config list > /dev/null && echo "Config OK"
```

### Upgrade Procedure

```bash
# 1. Backup (see above)

# 2. Check release notes
gh release view --repo openclaw/openclaw

# 3. Upgrade
npm update -g openclaw

# 4. Validate
openclaw doctor

# 5. Restart gateway
openclaw gateway restart

# 6. Verify channels reconnected
openclaw channel list
```

### Rollback

If something breaks after an upgrade:

```bash
# Stop the agent
openclaw stop

# Restore from backup
tar xzf ~/openclaw-backup-YYYYMMDD.tar.gz -C /

# Downgrade to previous version
npm install -g openclaw@<previous-version>

# Restart
openclaw start

# Verify
openclaw doctor
```

---

## Continuous Monitoring

### Cron-Based Testing

Schedule recurring tests with OpenClaw's cron system:

```bash
# Nightly regression test
openclaw cron add "regression-test" \
  --schedule "0 2 * * *" \
  --message "Run the full test suite, compare against baseline, alert if regressions"

# Weekly integration check
openclaw cron add "integration-test" \
  --schedule "0 3 * * 0" \
  --message "Test all third-party integrations, verify API connectivity"

# Hourly health check during work hours
openclaw cron add "health-check" \
  --schedule "0 9-17 * * 1-5" \
  --message "Check API health, database connections, service status"
```

### Heartbeat Monitoring

Use the heartbeat system for continuous self-monitoring:

```markdown title="~/.openclaw/HEARTBEAT.md"
## System Health (every heartbeat cycle)

- Check that all channels are connected
- Verify MCP servers are responsive
- Monitor memory usage (alert if > 90%)
- Check disk usage (alert if > 85%)
- Review error logs since last heartbeat
- Send health summary to Telegram if any issues found
```

### Production Diagnostics

```bash
# Real-time log monitoring
openclaw logs --follow

# Filter by component
openclaw logs --filter heartbeat --follow
openclaw logs --filter channel --follow

# Token usage
openclaw stats tokens

# Cost breakdown
openclaw gateway usage-cost

# Channel statistics
openclaw stats channels

# Per-heartbeat stats
openclaw stats heartbeat
```

### Deep Security Audit

```bash
# Standard audit
openclaw security audit

# Deep audit (live WebSocket probe, browser exposure, plugin validation)
openclaw security audit --deep

# Auto-fix safe defaults (chmod, groupPolicy, logging)
openclaw security audit --fix
```

---

## Lobster Workflow Shell

[Lobster](https://github.com/nicholasgriffintn/lobster) is OpenClaw's official workflow shell for typed CI/CD pipelines:

```yaml title="workflows/deploy-pipeline.yml"
name: Deploy Pipeline
steps:
  - name: lint
    skill: code-lint
    input: "{{ files.changed }}"

  - name: test
    skill: run-tests
    needs: [lint]

  - name: security-scan
    skill: security-check
    needs: [lint]

  - name: deploy-staging
    skill: deploy-staging
    needs: [test, security-scan]

  - name: smoke-test
    skill: smoke-test
    needs: [deploy-staging]

  - name: deploy-production
    skill: deploy-production
    needs: [smoke-test]
    approval: required
```

**Key features:**
- Typed, local-first macro engine
- Approval gates for side-effect actions (deploy, publish)
- Stateful workflows with persistence
- Data shaping tools (`where`, `pick`, `head`)
- Reduces token usage via composable automation

---

## Patterns

### Multi-Agent DevOps Pipeline

Use the [Workboard](/guides/workboard) to coordinate specialized agents:

```
PR opened
  ├─ Reviewer Agent → Code review + security check
  ├─ Tester Agent   → Test suite execution
  └─ Deployer Agent → Staging → approval gate → Production
```

Each agent works independently, updating Workboard cards as they progress. The deployer agent waits for both review and test agents to complete before promoting.

See the [Advanced Recipes](/guides/recipes/advanced-recipes) guide for a full implementation.

### Skill Version Control

Keep skills in a git repository for version control and CI:

```
skills-repo/
├── .github/
│   └── workflows/
│       └── validate.yml    # CI pipeline
├── skills/
│   ├── deploy-helper.md
│   ├── code-review.md
│   └── incident-response.md
└── README.md
```

On every push, CI validates structure and scans for security issues. On merge to main, skills are synced to the production agent.

### Canary Deployment

Deploy to a subset of agents first, then roll out:

```bash
# Deploy to canary agent (10% traffic)
rsync skills/ canary-host:~/.openclaw/skills/
ssh canary-host "openclaw gateway restart"

# Monitor for 30 minutes
# Check error rates, response quality, channel stability

# If healthy, deploy to remaining agents
rsync skills/ prod-host-1:~/.openclaw/skills/
rsync skills/ prod-host-2:~/.openclaw/skills/
ssh prod-host-1 "openclaw gateway restart"
ssh prod-host-2 "openclaw gateway restart"
```

### Webhook-Triggered Deployments

Trigger agent actions from external CI/CD:

```json5 title="~/.openclaw/openclaw.json"
{
  "webhooks": {
    "incoming": {
      "enabled": true,
      "secret": "${WEBHOOK_SECRET}",
      "endpoints": [
        {
          "path": "/deploy-complete",
          "message": "Deployment completed: {{body.service}} {{body.status}}. Run post-deploy checks."
        },
        {
          "path": "/ci-failure",
          "message": "CI failed for {{body.repo}} on branch {{body.branch}}. Error: {{body.error}}. Investigate and suggest fixes."
        }
      ]
    }
  }
}
```

```bash
# Trigger from your CI pipeline
curl -X POST http://your-agent:18789/webhook/deploy-complete \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
  -d '{"service": "api-v2", "status": "success", "commit": "abc123"}'
```

---

## Checklist

A quick reference for production-ready deployments:

### Before First Deploy

- [ ] Config validated (`openclaw doctor`)
- [ ] Security audit passed (`openclaw security audit`)
- [ ] All skills scanned (`openclaw security scan --all`)
- [ ] Channels tested individually
- [ ] MCP servers probed (`openclaw mcp doctor`)
- [ ] Backup script in place
- [ ] Monitoring configured (heartbeat + health checks)
- [ ] Rate limits set for all channels
- [ ] Access controls configured (`allowed_users`, `require_mention`)

### Before Every Update

- [ ] Backup taken
- [ ] Release notes reviewed
- [ ] Skills re-validated after upgrade
- [ ] `openclaw doctor` passes
- [ ] Channels reconnected
- [ ] Rollback plan ready

### Ongoing

- [ ] Nightly security scan (cron or CI)
- [ ] Weekly integration test
- [ ] Monthly credential rotation
- [ ] Quarterly deep security audit

---

## See Also

- [Automation](/guides/automation) — Cron jobs, webhooks, and GitHub Actions
- [Deployment Options](/guides/deployment-options) — Docker, Kubernetes, managed hosting
- [Security Hardening](/security/hardening) — Production security checklist
- [Skill Verification](/security/skill-verification) — VirusTotal scanning and trust model
- [Skill Workshop](/guides/skill-workshop) — Governed skill creation with scanner gating
- [Workboard](/guides/workboard) — Multi-agent task orchestration
- [Advanced Recipes](/guides/recipes/advanced-recipes) — Multi-agent DevOps pipeline
- [First 7 Days: Day 7](/guides/first-7-days/day-7-production) — Production readiness walkthrough
