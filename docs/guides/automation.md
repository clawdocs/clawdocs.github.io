---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Automation & Integrations
description: Automations (cron jobs), inbound webhooks, CI with openclaw agent exec, Lobster, and connecting OpenClaw to external services
keywords: [openclaw, openclaw automation, automations, cron, webhooks, scheduled jobs, agent exec]
---

# Automation & Integrations

OpenClaw can act on schedules, HTTP calls and CI pipelines, not only on chat messages. Since v2026.8.1 the scheduler is called **Automations**. `openclaw automations` is the new name for `openclaw cron`; both work, and they are the same command. The [heartbeat](/guides/heartbeat) runs on the same scheduler as a system-owned job.

Official reference: [Automation](https://docs.openclaw.ai/automation) and [Automations](https://docs.openclaw.ai/automation/cron-jobs).

---

## Automations (cron jobs) {#cron-jobs}

An automation is a stored job with a schedule, a payload (an agent prompt, a system event, a shell command or a script) and a delivery policy. Jobs survive restarts.

### Creating a job {#creating-a-cron-job}

The short form takes the schedule and the prompt as positional arguments:

```bash
openclaw automations create "0 7 * * *" "Summarize overnight updates." \
  --name "Morning brief" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

The long form uses flags, which is clearer in scripts:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Schedules: a cron expression (`--cron` or positional), an interval (`--every 30m` or `"every 30m"`), or a one-shot (`--at 20m`, an ISO time, or positional `"20m"`). In chat, the owner-only `/loop 5m <prompt>` creates a recurring job bound to that conversation.

Session targets (`--session`): `isolated` (fresh session per run, the CLI default for prompts), `main` (a system event in the agent's main session, with `--system-event`), `current`, or `session:<id>` to keep context across runs.

:::info Jobs are not in openclaw.json
Jobs, run history and quarantined jobs live in the shared SQLite state database. Create and change them with the CLI, the Control UI **Automations** page, or the Gateway API. There is no `cron: [...]` array in `openclaw.json`; `cron` is an object of scheduler settings (see [below](#scheduler-settings)). Jobs from old `~/.openclaw/cron/jobs.json` files need a staged upgrade: install `2026.9.7`, run its `openclaw doctor --fix`, then upgrade.
:::

### Automations vs heartbeat {#cron-vs-heartbeat}

| | Your automations | Heartbeat monitor |
|---|---|---|
| Timing | One-shot, interval or cron expression | One cadence per agent (`agents.defaults.heartbeat.every`, default 30m) |
| Session | Isolated, current, named or main | Main session, optionally isolated |
| Instructions | The job's own prompt or command | Default heartbeat prompt plus monitor scratch |
| Delivery | Channel, webhook, or none | Owner DM by default, or silent |
| Use for | Reports, reminders, inbox checks, any recurring task | Ambient "anything need attention?" awareness |

Rule of thumb: if it has its own schedule or instructions, make it an automation. "Check my inbox every 30 minutes" is an automation, not a heartbeat task. `HEARTBEAT.md` is retired; see [Migrating from HEARTBEAT.md](/guides/heartbeat#migrating-from-heartbeatmd).

### Example jobs {#example-cron-jobs}

```bash
# Weekday standup summary at 9 AM
openclaw automations create "0 9 * * 1-5" \
  "Summarize what I worked on yesterday from git logs and calendar." --name standup

# Weekly report every Friday at 5 PM, on a stronger model
openclaw automations create "0 17 * * 5" \
  "Generate my weekly status report from this week's git activity." \
  --name weekly-report --model anthropic/claude-opus-5-5

# Inbox check every 30 minutes, alert only if something matters
openclaw automations create "every 30m" \
  "Check for urgent unread email from my VIP list. If nothing is urgent, reply NO_REPLY." \
  --name inbox-check --session isolated --announce --channel telegram --to "123456789"

# One-shot reminder in 20 minutes
openclaw automations create "20m" "Remind me to call the bank." --name bank-reminder

# Shell check with no model call, every 15 minutes
openclaw automations create "*/15 * * * *" --name queue-depth \
  --command "scripts/check-queue.sh" --command-cwd "/srv/app" \
  --announce --channel telegram --to "123456789"
```

In multi-agent setups add `--agent <id>`. Limit a job's tools with `--tools exec,read` (or `--tools ""` for none).

### Managing jobs {#managing-cron-jobs}

```bash
openclaw automations list                 # enabled jobs
openclaw automations list --all           # include disabled jobs (and Heartbeat monitors)
openclaw automations show <jobId>         # one job, with its resolved delivery route
openclaw automations disable <jobId>      # pause without deleting
openclaw automations enable <jobId>       # resume
openclaw automations edit <jobId> --every 1h
openclaw automations run <jobId> --wait   # run now and wait for the result
openclaw automations runs <jobId> --limit 20
openclaw automations rm <jobId>
```

Commands take the job **id** (from `list`), not its name. There is no `pause`/`resume`; use `disable`/`enable`. A job that fails 10 times in a row is disabled automatically; `enable` resets its counters.

### Scheduler settings {#scheduler-settings}

```json5 title="~/.openclaw/openclaw.json"
{
  cron: {
    enabled: true,          // false (or OPENCLAW_SKIP_CRON=1) stops all automations, including heartbeats
    skipMissedJobs: true,   // don't catch up recurring slots missed while the Gateway was down
    sessionRetention: "24h",
    webhookToken: "replace-with-a-dedicated-token", // Bearer token on outbound job webhooks
  },
}
```

### Other triggers {#other-triggers}

Beyond time schedules, automations can fire from events. Each is documented upstream:

- **Command exit** (`--on-exit`), **stream sources** (`--stream-command`) and **condition scripts** (`--trigger-script`): [Schedules and triggers](https://docs.openclaw.ai/automation/cron-jobs/schedules)
- **New IMAP email**, read in sender-gated isolated sessions: [IMAP](https://docs.openclaw.ai/automation/imap)
- **Gmail Pub/Sub** (`openclaw webhooks gmail setup`): [Gmail](https://docs.openclaw.ai/automation/cron-jobs/gmail)
- **Lifecycle hooks** (`HOOK.md` scripts on session reset and similar events): [Hooks](https://docs.openclaw.ai/automation/hooks)
- **Standing orders**, instructions injected into every session: [Standing orders](https://docs.openclaw.ai/automation/standing-orders)

---

## Webhooks {#webhooks}

### Inbound webhooks {#incoming-webhooks}

Gateway HTTP hooks let an external service wake an agent or submit a turn. They are off by default and live under the `hooks` key:

```json5 title="~/.openclaw/openclaw.json"
{
  hooks: {
    enabled: true,
    token: "replace-with-a-long-random-hook-token", // not your Gateway token
    path: "/hooks",
    allowedAgentIds: ["main"],
    allowRequestSessionKey: false,
  },
}
```

After `openclaw config validate` and `openclaw gateway restart`, test it from the Gateway host:

```bash
curl --include http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer replace-with-a-long-random-hook-token' \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: deploy-2026-10-18-001' \
  --data '{"message":"A deployment just completed. Summarize the release notes.","agentId":"main","deliver":false}'
```

Endpoints:

- `POST /hooks/agent`: run an agent turn with `message`. Add `channel` and `to` to deliver the result, or `"waitForCompletion": true` to get the outcome in the response.
- `POST /hooks/wake`: queue a short system event (`text`) for the main session.
- `POST /hooks/<name>`: custom paths, defined in `hooks.mappings` with templates or transforms. See [Hooks config](https://docs.openclaw.ai/gateway/config-hooks).

HTTP `200` means the run was admitted, not that it finished or delivered. Check `openclaw logs --follow` for `hook agent run completed`.

:::warning Webhook payloads are untrusted
Anything a webhook carries (an email body, an issue title, a deploy message) can contain instructions aimed at your agent. Route untrusted content through `/hooks/agent` to an agent with restricted tools, never through `/hooks/wake`, and keep the hook token separate from Gateway auth. See [Security hardening](/security/hardening).
:::

### Outbound webhooks {#outgoing-webhooks}

There is no global event-webhook list. An automation can POST its finished result to a URL instead of a chat:

```bash
openclaw automations create "0 18 * * 1-5" "Summarize today's deploys as JSON." \
  --name deploy-digest --webhook "https://example.com/openclaw/deploys"
```

`cron.webhookToken` is sent as `Authorization: Bearer <token>`. Outbound webhook URLs are subject to a strict SSRF policy; set `cron.webhookSsrfPolicy.allowedHostnames` for an intentional private receiver.

---

## CI/CD integration {#cicd-integration}

### GitHub Actions {#github-actions}

`openclaw agent exec` runs one headless agent turn without a Gateway, which suits CI. Its defaults are permissive (sandbox off, full exec, filesystem tools limited to `--cwd`), so in CI the job itself must be the boundary. Treat the pull request as hostile input: a PR can contain text that tells the agent to print secrets.

The workflow below keeps the model key away from any write token. The agent only reads and writes `review.md`; a separate step, which never runs the agent, posts the comment.

```yaml title=".github/workflows/openclaw-review.yml"
name: OpenClaw PR Review
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read
  pull-requests: write   # used only by the final gh step

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false   # no GitHub token left in .git/config
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - name: Install OpenClaw (pinned)
        run: npm install -g openclaw@2026.10.4
      - name: Review PR
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          git fetch --no-tags --depth=1 origin "${{ github.base_ref }}"
          git diff "origin/${{ github.base_ref }}"...HEAD > pr.diff
          openclaw agent exec --auth-env-only --cwd . \
            --model anthropic/claude-sonnet-5-5 \
            "Review pr.diff for bugs, security issues and style. Write the review to review.md. Do not run commands or contact the network."
      - name: Post review
        env:
          GH_TOKEN: ${{ github.token }}
        run: gh pr comment "${{ github.event.pull_request.number }}" --body-file review.md
```

Notes:

- `pull_request` from a fork gets no secrets, so this workflow only reviews same-repo branches. Do not switch to `pull_request_target` with a checkout of the PR head; that combination hands secrets to untrusted code.
- The prompt asks the agent not to run commands, but a prompt is not a control. For stronger isolation, run `agent exec` with `--config <file>` pointing at a CI config that sets `tools.deny: ["exec", "process"]`.
- `--auth-env-only` uses only the key in the environment and ignores stored credentials.

| Pattern | Token the agent step needs | Use case |
|---|---|---|
| PR review | None (comment posted by a separate step) | Review comments, suggestions |
| Issue triage | None; labels applied by a separate step | Categorise, request info |
| Release notes | `contents: read` | Changelogs from commits |
| Test analysis | None | Explain failures, suggest fixes |

### Lobster workflows {#lobster-workflows}

[Lobster](/guides/lobster-workflows) is OpenClaw's workflow runtime for deterministic, multi-step pipelines with approval gates. A minimal workflow:

```yaml title="deploy.lobster"
name: deploy
args:
  env:
    default: staging
steps:
  - id: test
    run: npm test
  - id: approve
    approval:
      prompt: "Tests passed. Deploy to staging?"
  - id: deploy
    run: ./scripts/deploy.sh "$LOBSTER_ARG_ENV"
    when: $approve.approved
```

Run it with `lobster run deploy.lobster`. Syntax, approvals and the OpenClaw plugin are covered in the [Lobster guide](/guides/lobster-workflows).

---

## Service integrations {#service-integrations}

### Messaging platforms {#messaging-platforms}

Full guides are in [Channels & Integrations](/guides/channels).

| Platform | Setup | Automation use case |
|----------|-------|---------------------|
| **Slack** | App token | Team notifications, standup bots, incident response |
| **Discord** | Bot token | Community management, moderation, FAQ bot |
| **Telegram** | Bot token | Personal assistant, alerts, remote control |
| **WhatsApp** | QR pairing | Personal messaging, family coordination |
| **iMessage** | macOS only | Personal assistant (calendar, reminders) |

### Developer tools and smart home {#developer-tools}

GitHub, Google Workspace, Notion, Linear, Jira, Home Assistant and similar services are reached through skills, MCP servers or plugins rather than core config. See [MCP Servers](/guides/mcp-servers), [ClawHub](/guides/clawhub) and the [Smart Home recipe](/guides/recipes/smart-home). Gmail can also trigger runs directly through [Gmail Pub/Sub](https://docs.openclaw.ai/automation/cron-jobs/gmail).

---

## Automation patterns {#automation-patterns}

### Morning briefing {#morning-briefing}

```bash
openclaw automations create "0 7 * * 1-5" \
  "Check my calendar for today, summarize unread email and GitHub notifications, and give me a weather forecast." \
  --name morning-brief --tz "Europe/London" --session isolated \
  --announce --channel whatsapp --to "+15551234567"
```

### Inbox monitor {#inbox-monitor}

```bash
openclaw automations create "every 30m" \
  "Check Gmail for unread mail from VIP contacts. If any is urgent, write a two-line alert. Otherwise reply NO_REPLY." \
  --name inbox-monitor --session isolated --announce --channel telegram --to "123456789"
```

For event-driven email, prefer the [IMAP trigger](https://docs.openclaw.ai/automation/imap) or Gmail Pub/Sub over polling.

### Deploy watcher {#deploy-watcher}

```bash
openclaw automations create "every 15m" \
  "Check GitHub Actions in myorg/myapp for failed deployments since the last run. For each failure, summarize the error and a likely fix. If none failed, reply NO_REPLY." \
  --name deploy-watch --session isolated --announce --channel slack --to "channel:C1234567890"
```

### Content pipeline {#content-pipeline}

```bash
openclaw automations create "0 8 * * 1-5" \
  "Check my content calendar. For any post due today, draft it from the outline and tell me on Slack when it is ready for review." \
  --name content-pipeline --session isolated --announce --channel slack --to "channel:C1234567890"
```

---

## Security considerations {#security-considerations}

Automations act without a human watching, so mistakes and injected instructions run unattended:

- **Limit scope:** give each job only the tools it needs (`--tools`), and run untrusted-content readers on agents without shell access.
- **Keep approvals on** for anything that writes, sends or spends. See [Security hardening](/security/hardening).
- **Waking hours:** write cron expressions that avoid the night (`0 8-20 * * *`), and use heartbeat `activeHours` for the heartbeat.
- **Audit regularly:** `openclaw automations list --all`, `openclaw automations runs --all`, and `openclaw cron scratch <jobId>` for each heartbeat monitor.
- **Webhook secrets:** a dedicated `hooks.token`, distinct from Gateway auth; never put tokens in URLs.
- **CI tokens:** repository-scoped, minimal permissions, and never in the same step as the agent.

---

## See also {#see-also}

- [Heartbeat Guide](/guides/heartbeat): the system-owned monitor
- [Lobster Workflows](/guides/lobster-workflows): multi-step pipelines with approvals
- [Channels & Integrations](/guides/channels): connecting messaging platforms
- [Multi-Agent Workflows](/guides/multi-agent): per-agent jobs with `--agent`
- [Cost Management](/guides/cost-management): controlling automation costs
- Official docs: [Manage automations](https://docs.openclaw.ai/automation/cron-jobs/managing-jobs), [Inbound webhooks](https://docs.openclaw.ai/automation/cron-jobs/webhooks), [`openclaw agent exec`](https://docs.openclaw.ai/cli/agent)
