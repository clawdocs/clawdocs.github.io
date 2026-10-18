---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Monitoring & Observability
description: Monitor a production OpenClaw Gateway with status and health commands, HTTP probes, logs, the audit ledger, OpenTelemetry and Prometheus
keywords: [openclaw, monitoring, observability, metrics, alerting, opentelemetry, prometheus, healthz]
---

# Monitoring & Observability

An agent that runs all day needs checks that run all day too. This page covers what OpenClaw ships: CLI status and health commands, unauthenticated HTTP probes, file logs, a metadata-only audit ledger, and two official exporters (OpenTelemetry and Prometheus). Everything here was checked against OpenClaw 2026.10.4. The official reference is [Health checks](https://docs.openclaw.ai/gateway/health), [Logging](https://docs.openclaw.ai/logging) and [OpenTelemetry export](https://docs.openclaw.ai/gateway/opentelemetry).

:::warning Config is strict
`openclaw.json` is validated against a strict schema. An unknown key stops the Gateway from starting. Older guides invented keys such as `budget`, `webhooks`, `logging.path` and `logging.audit.log_tool_calls`; none of them exist.
:::

---

## Status and health

```bash
openclaw status            # local summary: gateway reachability, channels, sessions
openclaw status --all      # full read-only diagnosis, safe to paste into an issue
openclaw status --deep     # asks the running gateway to probe channels live
openclaw status --usage    # provider usage/quota snapshots
openclaw health            # the running gateway's health snapshot
openclaw health --json     # same, machine-readable
openclaw gateway status    # service and RPC probe
```

`openclaw doctor` is a diagnose-and-repair tool, not a health check. Even without `--fix` it can migrate config and state, so do not use it as a probe. For a read-only report (for example in CI), use `openclaw doctor --lint`.

### Component checks

```bash
openclaw channels list                 # configured channels
openclaw channels status --probe       # live credential check per channel
openclaw mcp status                    # MCP transport status without connecting
openclaw mcp doctor                    # static setup problems
openclaw mcp probe                     # connect and list capabilities
openclaw plugins doctor                # plugin load problems
openclaw plugins inspect <id> --runtime
openclaw security audit --deep         # config, permissions, live gateway probes
```

In any chat, the standalone command `/status` returns runtime status and provider quota without invoking the agent.

### Support bundle

```bash
openclaw gateway diagnostics export --output ~/openclaw-diagnostics.zip
```

The zip holds a summary, the newest stability bundle, sanitized log metadata, health/status snapshots and the config shape. Chat text, tool output and secrets are omitted or redacted. See [Diagnostics export](https://docs.openclaw.ai/gateway/diagnostics). For recent internal events, `openclaw gateway stability` shows the bounded stability recorder.

---

## HTTP probes

The Gateway answers three unauthenticated `GET`/`HEAD` checks on its port (default 18789):

| Endpoint | Meaning | Use it for |
|---|---|---|
| `/healthz` | The HTTP server is live. Body includes `"ok": true`. | Liveness and restart decisions |
| `/startupz` | Startup work has settled and the Gateway is not draining. Ignores channel health. | Startup checks, orchestrator readiness |
| `/readyz` | Started, agent databases admitted, and configured channel accounts pass deep checks. Body includes `"ready": true`. | Monitoring that should alert when a channel is down |

```bash
curl -fsS http://127.0.0.1:18789/healthz
curl -fsS http://127.0.0.1:18789/readyz
```

:::tip Check the body, not just the status code
The Control UI serves a catch-all `200` for unknown paths. Against an old image without the probe route, a status-only check passes forever. Upstream's Kubernetes manifests parse the JSON and require `ok === true` (or `ready === true`). Do the same: `curl -fsS http://127.0.0.1:18789/healthz | grep -q '"ok":true'`.
:::

### Docker

The official image already has a `HEALTHCHECK` that pings `/healthz`, so you do not need to add one. Check it with:

```bash
docker inspect --format='{{.State.Health.Status}}' openclaw-gateway
```

For an authenticated deep snapshot inside the upstream compose setup:

```bash
docker compose exec openclaw-gateway sh -lc 'node dist/index.js gateway health --token "$OPENCLAW_GATEWAY_TOKEN"'
```

### Kubernetes

Upstream ships Kustomize manifests (`scripts/k8s/`, see [Kubernetes](https://docs.openclaw.ai/install/kubernetes)) whose probes look like this:

```yaml title="deployment.yaml (excerpt)"
livenessProbe:
  exec:
    command:
      - node
      - -e
      - "require('http').get('http://127.0.0.1:18789/healthz', r => { let b = ''; r.on('data', d => b += d); r.on('end', () => { try { process.exit(r.statusCode < 400 && JSON.parse(b).ok === true ? 0 : 1); } catch { process.exit(1); } }); }).on('error', () => process.exit(1))"
  initialDelaySeconds: 60
  periodSeconds: 30
  timeoutSeconds: 10
readinessProbe:
  exec:
    command:
      - node
      - -e
      - "require('http').get('http://127.0.0.1:18789/readyz', r => { let b = ''; r.on('data', d => b += d); r.on('end', () => { try { process.exit(r.statusCode < 400 && JSON.parse(b).ready === true ? 0 : 1); } catch { process.exit(1); } }); }).on('error', () => process.exit(1))"
  initialDelaySeconds: 15
  periodSeconds: 10
  timeoutSeconds: 5
```

Use `/startupz` instead of `/readyz` for readiness if one broken channel account should not take the whole Gateway out of service.

### External uptime monitors

Do not publish port 18789 to the internet just to monitor it. Run the probe on the host (cron, systemd timer) or over a private network such as Tailscale, and alert from there:

```bash title="/etc/cron.d/openclaw-watchdog"
*/5 * * * * deploy curl -fsS --max-time 10 http://127.0.0.1:18789/healthz | grep -q '"ok":true' || curl -fsS -X POST -H 'Content-Type: application/json' -d '{"text":"OpenClaw gateway health check failed"}' "$SLACK_WEBHOOK_URL"
```

Set `SLACK_WEBHOOK_URL` at the top of the cron file. An external watchdog is the only alert that still fires when the Gateway itself is down.

---

## Logs

### Where they are

The Gateway writes JSONL file logs to `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (named profiles use `openclaw-<profile>-YYYY-MM-DD.log`). Each file rotates at `logging.maxFileBytes` (default 100 MB) with up to five numbered archives, and dated files are pruned after 24 hours. If `/tmp/openclaw` is unsafe, and always on Windows, OpenClaw uses an `openclaw-<uid>` directory under the OS temp dir.

### Reading them

```bash
openclaw logs --follow             # live tail through the gateway
openclaw logs --limit 500          # last 500 lines (default 200)
openclaw logs --follow --json      # JSON lines, for filtering
```

There is no `--filter` flag. Filter JSON output yourself:

```bash
openclaw logs --follow --json | grep -i heartbeat
```

The Control UI also has a Logs tab.

### Levels and config

Levels are `silent`, `fatal`, `error`, `warn`, `info` (default), `debug` and `trace`. Raise verbosity for one run without editing config:

```bash
openclaw --log-level debug gateway run
# or
OPENCLAW_LOG_LEVEL=debug openclaw gateway run
```

Persistent settings:

```json5 title="~/.openclaw/openclaw.json"
{
  logging: {
    level: "info",              // file log level
    consoleLevel: "warn",       // console verbosity
    file: "/var/log/openclaw/openclaw.log", // optional fixed path
    maxFileBytes: 52428800,     // rotate at 50 MB (default 100 MB, 5 archives)
    redactPatterns: ["sk-[A-Za-z0-9_-]+"],  // extra secret patterns to mask
  },
}
```

The directory in `logging.file` must exist and be writable by the Gateway user. See [Logging](https://docs.openclaw.ai/logging).

---

## Audit ledger

OpenClaw keeps a **metadata-only** activity ledger: who ran which agent or tool, when, and how it ended. It never stores message or tool content. Run and tool records are on by default; message lifecycle records are off by default.

```json5 title="~/.openclaw/openclaw.json"
{
  logging: {
    audit: {
      enabled: true,          // default true
      messages: "direct",     // "off" (default) | "direct" | "all"
      executionIdentity: true // default false; per-run identity attribution
    },
  },
}
```

Records live in the shared state database (`state/openclaw.sqlite` under the state directory), not in a log file. Queries return at most 30 days, and the ledger is capped at 100,000 rows. Query it with the CLI:

```bash
openclaw audit --limit 50
openclaw audit --kind tool_action --status failed --limit 20
openclaw audit --agent main --after 2026-10-17T00:00:00Z --json
```

Upstream is explicit that this is "not a lossless compliance archive". If you need long retention, export through OpenTelemetry to a system you control. See [Audit history](https://docs.openclaw.ai/gateway/audit) and [`openclaw audit`](https://docs.openclaw.ai/cli/audit).

---

## OpenTelemetry

The official `diagnostics-otel` plugin exports metrics, traces and logs over OTLP/HTTP (protobuf) to any OTLP collector or backend (Grafana, Datadog, Honeycomb, Tempo, Jaeger and so on). It is bundled in the default Docker images. On npm installs, install it from the official scope:

```bash
openclaw plugins install @openclaw/diagnostics-otel
# Docker image (already bundled): just enable it
openclaw plugins enable diagnostics-otel
```

```json5 title="~/.openclaw/openclaw.json"
{
  plugins: {
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      headers: { Authorization: "Bearer ${OTEL_TOKEN}" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

Notes:

- If you use a restrictive `plugins.allow` list, `diagnostics-otel` must be in it. `plugins install` adds it to an existing list.
- `protocol` accepts only `http/protobuf`; gRPC was retired. Doctor rewrites an old `grpc` value.
- When `endpoint` is unset, the standard `OTEL_EXPORTER_OTLP_*` variables are used as a fallback.
- `captureContent` (default off) puts raw message and tool content in span attributes. Leave it off unless your collector's retention policy allows that data.
- `openclaw status --all` (read-only) shows exporter health per signal.
- `openclaw agent exec` runs do not export telemetry; dispatch through the Gateway or use `openclaw agent --local`.

Field reference, metric names and span names: [Setup](https://docs.openclaw.ai/gateway/opentelemetry/setup), [Configuration](https://docs.openclaw.ai/gateway/opentelemetry/configuration), [Privacy and trace context](https://docs.openclaw.ai/gateway/opentelemetry/privacy-and-trace-context).

### Local Jaeger for testing

```yaml title="docker-compose.otel.yml (add to your existing compose)"
services:
  jaeger:
    image: jaegertracing/jaeger:latest   # Jaeger v2; the v1 all-in-one image is end-of-life
    ports:
      - "127.0.0.1:16686:16686"   # Jaeger UI
```

Point `diagnostics.otel.endpoint` at `http://jaeger:4318` and open `http://localhost:16686`. Export is outbound from the Gateway, so the Gateway container needs no extra published port.

### Third-party plugin

The community [OpenClaw Observability Plugin](https://github.com/henrikrexed/openclaw-observability-plugin) is an alternative exporter. Prefer the official plugin above unless you need something it adds.

:::warning
The npm package for this plugin is `@henrikrexed/openclaw-otel-observability`. The unscoped name `openclaw-observability` belongs to an unrelated publisher; do not install it. Plugins run with your agent's access, so pin the version and check the [plugin README](https://github.com/henrikrexed/openclaw-observability-plugin) for the current config options.
:::

```bash
openclaw plugins install npm:@henrikrexed/openclaw-otel-observability --pin
```

---

## Prometheus

The official `diagnostics-prometheus` plugin renders the same diagnostics as Prometheus text at an **authenticated** Gateway route:

```text
GET /api/diagnostics/prometheus
```

```bash
openclaw plugins install @openclaw/diagnostics-prometheus
openclaw gateway restart
curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
  http://127.0.0.1:18789/api/diagnostics/prometheus
```

```json5 title="~/.openclaw/openclaw.json"
{
  plugins: {
    entries: {
      "diagnostics-prometheus": { enabled: true },
    },
  },
  diagnostics: { enabled: true },
}
```

```yaml title="prometheus.yml"
scrape_configs:
  - job_name: openclaw
    scrape_interval: 30s
    metrics_path: /api/diagnostics/prometheus
    authorization:
      credentials_file: /etc/prometheus/openclaw-gateway-token
    static_configs:
      - targets: ["openclaw-gateway:18789"]
```

:::danger
The route needs operator auth (`operator.read` scope or higher). Do not expose it as a public unauthenticated `/metrics` endpoint, and do not put a reverse proxy in front of it that strips auth. A gateway token is an operator credential: keep the scrape token file readable only by Prometheus.
:::

Metric names and labels: [Prometheus metrics](https://docs.openclaw.ai/gateway/prometheus).

---

## Cost monitoring

OpenClaw has **no built-in spend cap**. It reports usage; your provider enforces limits. Set a monthly limit or alert in each provider's console.

```bash
openclaw gateway usage-cost              # estimated cost from session logs, last 30 days
openclaw gateway usage-cost --days 7 --all-agents
openclaw status --usage                  # provider quota snapshots
```

In chat, `/usage full` adds a per-response usage footer and `/usage cost` prints a local cost summary. With an Anthropic Admin API key configured, the Control UI **Usage** view shows provider-reported cost history. `usage-cost` is an estimate derived from sessions; the provider bill is the source of truth.

For where the money goes and how to cut it (heartbeat cadence, model routing, caching), see [Cost Management](./cost-management.md).

| Symptom | Likely cause | Check |
|---|---|---|
| Steady cost with no chat activity | Heartbeat on an expensive model or with full context | `agents.defaults.heartbeat` ([cost](./cost-management.md#heartbeat-costs)) |
| Sudden spike | Loop or stuck tool | `openclaw logs --follow`, `openclaw audit --kind tool_action` |
| Cost from an unexpected model | A fallback took over | `openclaw status --deep`, primary provider health |

---

## Alerting

### Scheduled checks with automations

Recurring checks are automation jobs (`openclaw cron` and `openclaw automations` are the same command). The schedule comes first, then the prompt:

```bash
# Weekday business hours, hourly
openclaw cron add "0 9-17 * * 1-5" \
  "Check channel and MCP health. Reply only if something is disconnected or failing, with details." \
  --name health-check

# Nightly cost note
openclaw cron add "0 23 * * *" \
  "Summarise today's estimated model spend and flag anything unusual." \
  --name cost-check

# POST the result to your own endpoint instead of a chat
openclaw cron add "0 3 * * 0" \
  "Summarise this week's failed automations as JSON." \
  --name weekly-failures \
  --webhook "https://alerts.example.com/openclaw"
```

Isolated jobs announce their result to chat by default. Once a failure-alert route is configured (per job, or globally under `cron.failureAlert`), a job alerts after two consecutive failures, with a one-hour cooldown. See [`openclaw cron`](https://docs.openclaw.ai/cli/cron) for delivery and `failureAlert` options.

:::warning Agents running commands
A check that asks the agent to run shell commands depends on its exec tool, approvals and sandbox settings. Review [Security Hardening](/security/hardening) before letting a scheduled agent run commands unattended. For pure liveness, prefer the external watchdog above: it needs no model call and still works when the Gateway is down.
:::

The heartbeat is a separate, system-owned automation configured under `agents.defaults.heartbeat`. `HEARTBEAT.md` is retired; `openclaw doctor --fix` moves an old file into the heartbeat monitor's scratch. See [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat).

### Nightly check from CI

```yaml title=".github/workflows/nightly-health.yml"
name: Nightly Health Check
on:
  schedule:
    - cron: '0 3 * * *'

jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - name: Check agent health
        env:
          AGENT_HOST: ${{ secrets.AGENT_HOST }}
          SSH_KEY: ${{ secrets.SSH_KEY }}
          KNOWN_HOSTS: ${{ secrets.AGENT_KNOWN_HOSTS }}   # output of ssh-keyscan, checked once by hand
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_KEY" > ~/.ssh/key && chmod 600 ~/.ssh/key
          echo "$KNOWN_HOSTS" > ~/.ssh/known_hosts
          ssh -i ~/.ssh/key deploy@"$AGENT_HOST" \
            "openclaw health && openclaw channels status --probe && openclaw mcp doctor && openclaw plugins doctor"

      - name: Alert on failure
        if: failure()
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: '{"text": "OpenClaw health check FAILED. Check logs."}'
```

Pin the host key in `known_hosts` rather than disabling host verification. Use a deploy user with only the access this check needs.

---

## Dashboards

### Control UI

The built-in Control UI on the Gateway port shows chat, sessions, channels, automations, logs and usage. It needs the gateway token. To reach a remote Gateway, tunnel instead of exposing the port:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@your-server
# then open http://localhost:18789
```

See [Control UI](https://docs.openclaw.ai/web/control-ui).

### Grafana

Feed Grafana from either exporter: OTLP via `diagnostics-otel`, or Prometheus via `diagnostics-prometheus`. Useful panels: model-call latency, tokens by model, error rate, channel message throughput, queue depth, and the gateway event-loop delay. Exact metric names are in [Model calls and exported metrics](https://docs.openclaw.ai/gateway/opentelemetry/model-calls-and-metrics).

### Simple terminal monitor

```bash title="monitor.sh"
#!/bin/bash
while true; do
  clear
  echo "=== OpenClaw $(date) ==="
  curl -fsS --max-time 5 http://127.0.0.1:18789/healthz | grep -q '"ok":true' \
    && echo "gateway: live" || echo "gateway: DOWN"
  openclaw channels status 2>/dev/null
  echo "--- recent warnings/errors ---"
  openclaw logs --limit 200 --plain 2>/dev/null | grep -iE "error|warn" | tail -10
  sleep 60
done
```

---

## Process management

### systemd (Linux) and launchd (macOS)

`openclaw gateway install` (also run by `openclaw onboard --install-daemon`) installs a **user** service: `openclaw-gateway.service` on Linux, a LaunchAgent on macOS.

```bash
systemctl --user status openclaw-gateway
journalctl --user -u openclaw-gateway -f
openclaw gateway restart
```

On a headless server, enable lingering (`sudo loginctl enable-linger $(whoami)`) so the user service runs without a login session. The system unit `openclaw` (`systemctl status openclaw`) exists only for the [Ansible](https://docs.openclaw.ai/install/ansible) install. See [Gateway](https://docs.openclaw.ai/gateway).

### Docker

```yaml title="docker-compose.yml (excerpt)"
services:
  openclaw-gateway:
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "2.0"
```

Upstream's Kubernetes manifests request 512 Mi and limit at 2 Gi, which is a reasonable starting point. Diagnostics record RSS and heap pressure, so watch the memory metrics rather than guessing thresholds from `ps`.

---

## Files worth watching

| Path | Why |
|---|---|
| `~/.openclaw/openclaw.json` | Unexpected config changes |
| `~/.openclaw/workspace/` (`SOUL.md`, `AGENTS.md`, memory files) | Persona or memory tampering |
| `~/.openclaw/skills/` | Skills you did not install |
| `/tmp/openclaw/openclaw-*.log` | Errors and crashes |
| `~/.openclaw/logs/stability/` | Stability bundles written on fatal exits |

Run `openclaw security audit --deep` after changes, and see [Security Hardening](/security/hardening) for file-integrity monitoring.

---

## See Also

- [Troubleshooting](/reference/troubleshooting) — fix specific errors
- [CI/CD & Testing](/guides/cicd-testing) — automated checks and deployment validation
- [Cost Management](/guides/cost-management) — where tokens go and how to cut them
- [Security Hardening](/security/hardening) — production security checklist
- [Heartbeat](/guides/heartbeat) — heartbeat configuration
- [Plugin System](/guides/plugin-system) — plugin diagnostics and hooks
