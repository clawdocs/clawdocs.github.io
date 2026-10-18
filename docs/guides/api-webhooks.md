---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: API & Webhooks
description: Integrate OpenClaw with external systems — /hooks/agent and /hooks/wake webhooks, the Gateway WebSocket protocol v4, the OpenAI-compatible endpoint, auth, reverse proxies and remote access
keywords: [openclaw, openclaw api, webhook, hooks, websocket, gateway protocol, integration]
---

# API & Webhooks

Everything external talks to the Gateway on one port (default `18789`). This page covers webhooks in, results out, the client library, and how to expose them safely.

---

## Architecture

```
External systems                       OpenClaw Gateway (127.0.0.1:18789)
────────────────                       ──────────────────────────────────
CI, Home Assistant, n8n ── POST ─────► /hooks/agent, /hooks/wake, /hooks/<name>
Your app or dashboard  ─── WebSocket ► protocol v4 (connect.challenge → connect → req/res/event)
OpenAI-compatible tools ── POST ─────► /v1/chat/completions   (opt-in)
Scripts                ─── POST ─────► /tools/invoke
Monitoring             ─── GET ──────► /healthz, /readyz
Browser                ─── HTTPS ────► Control UI at /
```

| Surface | Direction | Auth | Default |
|---------|-----------|------|---------|
| **Webhooks** (`/hooks/*`) | External → agent | Dedicated hook token | Off |
| **WebSocket protocol** | Both | Gateway token + device pairing | On |
| **OpenAI-compatible HTTP** (`/v1/*`) | Request/response | Gateway token = full operator | Off |
| **Tools invoke** (`/tools/invoke`) | Request/response | Gateway token = full operator | On |
| **Health checks** | Read | None | On |

There is no outbound "webhook egress" system that posts agent events to arbitrary URLs. For outbound notifications, see [Sending results out](#sending-results-out).

---

## Webhook Ingress (External to Agent) {#webhook-ingress-external-to-agent}

Gateway HTTP hooks let an external service submit an agent turn or wake an agent. They are **disabled by default**. They are separate from internal event hooks (`HOOK.md` handlers) and plugin hooks.

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",   // long random value, NOT the Gateway token
    path: "/hooks",
    allowedAgentIds: ["main"],
    allowRequestSessionKey: false,
  },
}
```

- Use a token dedicated to hooks. Reusing the Gateway token logs a warning, and `openclaw security audit` flags it as critical. `hooks.token` takes a string or `${ENV}` reference, not a SecretRef object.
- `allowedAgentIds` limits which agents callers may target. Omitting it allows all agents; `[]` denies all.
- Keep `allowRequestSessionKey: false` unless callers really need to pick sessions.

Apply it and watch the logs:

```bash
openclaw config validate
openclaw gateway restart
openclaw logs --follow
```

### Sending a webhook

```bash
curl --include http://127.0.0.1:18789/hooks/agent \
  -H "Authorization: Bearer $OPENCLAW_HOOKS_TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: deploy-2026-10-18-001' \
  --data '{"message":"Deploy of api finished with status success. Check for anything unusual.","name":"Deploy alert","agentId":"main","deliver":false}'
```

A `200 {"ok":true,"runId":"..."}` means the run was **admitted**. It does not mean the model finished or a message was delivered. Add `"waitForCompletion": true` to keep the request open until the run settles; the response then includes a `completion` object with `status` and delivery facts (never the model's output).

Useful `/hooks/agent` fields:

| Field | Meaning |
|-------|---------|
| `message` | Required. The agent input. External content is safety-wrapped. |
| `name` | Label in logs and completion events |
| `agentId` | Target agent (must be in `allowedAgentIds`) |
| `sessionMode` | `isolated` (default, fresh context) or `persistent` (needs an explicit `sessionKey` and prefix policy) |
| `deliver` | Default `true`. `false` suppresses the success announcement. |
| `channel` + `to` (+ `accountId`) | Deliver the result straight to a chat, for example `"channel":"telegram","to":"123456789"`. Both are required; `"last"` is not allowed here. |
| `model`, `thinking`, `timeoutSeconds` | Per-run overrides |
| `waitForCompletion` | Wait for the run to settle (direct `/hooks/agent` only) |

Send an `Idempotency-Key` header on anything you might retry: a replay with the same key and payload returns the original result instead of running the agent again.

### Wake vs agent

`POST /hooks/wake` enqueues a short notification into the agent's **main session**:

```bash
curl --include http://127.0.0.1:18789/hooks/wake \
  -H "Authorization: Bearer $OPENCLAW_HOOKS_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"text":"Nightly backup completed","mode":"now","agentId":"main"}'
```

:::warning Wake text is trusted
Wake text is a system event in your main session, not a safety-wrapped external turn. Only send short text you control. Route raw emails, issue bodies, form submissions and other untrusted content through `/hooks/agent`, ideally to an agent with restricted tools.
:::

### Mapped hooks and templates

Custom paths (`POST /hooks/<name>`) resolve through `hooks.mappings`. The first match wins. Templates use `{{payload.field}}`, `{{headers.x-event-type}}`, `{{query.kind}}` and `{{now}}`:

```json5 title="~/.openclaw/openclaw.json"
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    allowedAgentIds: ["main"],
    mappings: [
      {
        id: "deploy",
        match: { path: "deploy" },        // POST /hooks/deploy
        action: "agent",
        agentId: "main",
        name: "Deploy alert",
        messageTemplate: "Deploy of {{payload.service}} finished: {{payload.status}}. Investigate if it failed.",
        channel: "telegram",
        to: "123456789",
      },
    ],
  },
}
```

For logic a template cannot express, a mapping can name a trusted JS/TS `transform` module under `~/.openclaw/hooks/transforms`. For Gmail, `openclaw webhooks gmail setup` wires Pub/Sub, `gogcli` and the `gmail` preset for you. Reference: [Hooks configuration](https://docs.openclaw.ai/gateway/config-hooks).

### Security

- Every request needs `Authorization: Bearer <token>` or `x-openclaw-token: <token>`. A `?token=` query parameter is **rejected** (it would leak into proxy logs).
- Wrong tokens return `401`. After 20 failures in 60 seconds from one client, the Gateway returns `429` with `Retry-After`. Loopback is not exempt.
- Requests are capped at 256 KiB with a 30-second body-read timeout.
- Keep hooks on loopback, a tailnet or behind a trusted reverse proxy, and use HTTPS for anything remote.
- A hook token grants ingress, not identity. Treat payloads as untrusted data, and remember that safety-wrapping does not remove the agent's tools. Exec approvals and sandboxing still matter: see [Security Hardening](/security/hardening).

Services that cannot set a custom header (GitHub repository webhooks, Stripe) need a small relay or a channel plugin that verifies their signatures; see [Custom Channels](/guides/custom-channels#receiving-messages-safely).

Full reference: [Inbound webhooks](https://docs.openclaw.ai/automation/cron-jobs/webhooks).

---

## Integration Patterns

### GitHub Actions

Store the hook token as a repository secret and call the Gateway over your tailnet or a protected tunnel:

```yaml
# .github/workflows/notify-openclaw.yml
on:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Tell the agent
        run: |
          curl --fail -X POST "$OPENCLAW_URL/hooks/agent" \
            -H "Authorization: Bearer $OPENCLAW_HOOKS_TOKEN" \
            -H "Content-Type: application/json" \
            -H "Idempotency-Key: gh-${{ github.event.workflow_run.id }}" \
            --data "{\"message\":\"Deploy workflow ${{ github.event.workflow_run.conclusion }} for ${{ github.repository }}.\",\"name\":\"GitHub deploy\",\"agentId\":\"main\"}"
        env:
          OPENCLAW_URL: ${{ secrets.OPENCLAW_URL }}
          OPENCLAW_HOOKS_TOKEN: ${{ secrets.OPENCLAW_HOOKS_TOKEN }}
```

### Home Assistant

```yaml
# configuration.yaml
rest_command:
  openclaw_alert:
    url: "https://openclaw.your-tailnet.ts.net/hooks/agent"
    method: POST
    headers:
      Authorization: !secret openclaw_hooks_bearer   # "Bearer <token>"
      Content-Type: application/json
    payload: '{"message": "Home Assistant: {{ message }}", "name": "Home Assistant", "agentId": "main", "deliver": true, "channel": "telegram", "to": "123456789"}'
```

Do not point Home Assistant at `http://<lan-ip>:18789`: that needs `gateway.bind: "lan"` and sends the token in plain HTTP across your network. Use Tailscale Serve or another HTTPS path.

### n8n, Make, Zapier

Use an HTTP Request node: `POST` to `<gateway>/hooks/agent`, header `Authorization: Bearer <hook token>`, JSON body with `message`, `agentId` and optionally `channel` + `to`. Set `Idempotency-Key` from the trigger's event ID so retries do not run the agent twice.

---

## Sending Results Out {#sending-results-out}

OpenClaw has no generic outbound-webhook system (`webhooks.outgoing` does not exist, and the strict config schema rejects it). Use one of these:

- **Deliver to a chat**: `channel` + `to` on `/hooks/agent`, or the agent's `message` tool.
- **Automation delivery**: scheduled jobs can deliver results to a channel or to a webhook URL, behind a strict SSRF guard (private and loopback targets are refused unless you allow them under `cron.webhookSsrfPolicy`). See [Automation](/guides/automation) and [delivery](https://docs.openclaw.ai/automation/cron-jobs/delivery).
- **Plugin hooks**: a plugin can react to events such as `message_received` and call your API ([plugin hooks](https://docs.openclaw.ai/plugins/hooks)).
- **Observability**: OpenTelemetry and Prometheus export ([Monitoring](/guides/monitoring)).

---

## WebSocket API

The Gateway's WebSocket protocol (version 4) is what the CLI, Control UI and native apps use. Frames, the `connect.challenge` handshake, scopes and the method list are summarised in the [Gateway API reference](/reference/gateway-api); this section covers what an integrator does differently.

- The token goes in `connect.params.auth.token`, **never** in the URL.
- A third-party UI client signs the challenge with its own Ed25519 device key and must be approved once on the Gateway host (`openclaw devices list`, then `openclaw devices approve <requestId>`). After pairing, `hello-ok` returns a `deviceToken` for later connections.
- Request only the scopes you need: `operator.read` (history, sessions), `operator.write` (`chat.send`), `operator.approvals` (exec approvals). `operator.admin` is full control.

### Use the reference client

Writing the handshake, device signing and reconnect logic yourself is error-prone. Use the published packages:

```bash
npm install --save-exact @openclaw/gateway-client@2026.8.1 @openclaw/gateway-protocol@2026.8.1
```

That is the release upstream's client guide names as verified; package versions follow OpenClaw releases and are separate from the wire version. Pin and test them against your Gateway version.

```ts
import { GatewayClient } from "@openclaw/gateway-client";
import { PROTOCOL_VERSION } from "@openclaw/gateway-protocol/version";

const connected = Promise.withResolvers<void>();
const client = new GatewayClient({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  minProtocol: PROTOCOL_VERSION,   // 4
  maxProtocol: PROTOCOL_VERSION,
  onHelloOk: () => connected.resolve(),
  onConnectError: (error) => connected.reject(error),
  onEvent: (event) => console.log(event.event, event.payload),
});

client.start();
await connected.promise;
console.log(await client.request("status", {}));
client.stop();
```

This loopback example uses the client's default local backend identity. A UI that runs remotely or in a browser must supply device-identity callbacks and go through pairing; see [Building a Gateway client](https://docs.openclaw.ai/gateway/clients). Common methods are `chat.send` (`sessionKey`, `message`, `idempotencyKey`), `chat.history`, `sessions.list` and `status`; the full list is in the [protocol reference](https://docs.openclaw.ai/gateway/protocol).

For a one-off call from the shell, `openclaw gateway call <method>` does the handshake for you, for example `openclaw gateway call health`.

---

## OpenAI-Compatible HTTP and Tools Invoke

The Gateway can serve `POST /v1/chat/completions`, `GET /v1/models` and `POST /v1/embeddings` for tools that expect an OpenAI API. It is off by default:

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    http: { endpoints: { chatCompletions: { enabled: true } } },
  },
}
```

The `model` field selects an OpenClaw **agent** (`openclaw/<agentId>`), not a raw provider model. `POST /tools/invoke` runs a single tool under tool policy and is always on. Endpoint details are in the [Gateway API reference](/reference/gateway-api#http-endpoints).

:::danger Full operator access
With token or password auth, a request to `/v1/*` or `/tools/invoke` carrying the Gateway token is treated as the owner, with every operator scope including `operator.admin`. If the agent may use exec or other sensitive tools, so may the caller. Keep these endpoints on loopback or a tailnet; never publish them.
:::

References: [OpenAI chat completions](https://docs.openclaw.ai/gateway/openai-http-api), [Tools invoke](https://docs.openclaw.ai/gateway/tools-invoke-http-api).

---

## Exposing Channels over MCP

`openclaw mcp serve` runs a **stdio** MCP server that connects to your Gateway and exposes your routed channel conversations: list conversations, read transcripts, send messages over existing routes, poll events, and answer approvals. It does not expose your skills as MCP tools.

```json title="MCP client config (for example Claude Desktop)"
{
  "mcpServers": {
    "openclaw": { "command": "openclaw", "args": ["mcp", "serve"] }
  }
}
```

Reference: [`openclaw mcp serve`](https://docs.openclaw.ai/cli/mcp/serve). For connecting MCP servers *to* OpenClaw, see [MCP Servers](/guides/mcp-servers).

---

## Authentication & Security

### Gateway auth

Token auth has been the default since 2026.2.19; onboarding generates the token. A typical locked-down config:

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    bind: "loopback",
    port: 18789,
    auth: {
      mode: "token",
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Allowed `auth.mode` values are `token`, `password`, `trusted-proxy` and `none`. There is no `gateway.host` or `gateway.auth.enabled`. Show the current token with `openclaw gateway auth-token --show`. The Gateway token is an operator credential: never put it in browser JavaScript, a public repo or a URL.

### Reverse proxy (Nginx)

The WebSocket, Control UI, hooks and HTTP APIs all share one port, so proxy `/` with upgrade headers:

```nginx
server {
    listen 443 ssl;
    server_name openclaw.example.com;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;   # overwrite, do not append
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
    }
}
```

If only machines need access, expose just `location /hooks/` and keep the rest on the tailnet.

### Trusted proxies

A same-host proxy must be listed, or the Gateway rejects proxied requests with `403 proxy_attribution_required`:

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    bind: "loopback",
    trustedProxies: ["127.0.0.1"],
  },
}
```

Listing the proxy only lets the Gateway trust its forwarded client address. It does not switch on `trusted-proxy` auth, which is a separate mode for identity-aware proxies. Details: [Security Hardening, reverse proxies](/security/hardening#configure-trustedproxies-critical-for-reverse-proxies).

### Security checklist

- [ ] `gateway.bind: "loopback"` unless you have a reason; any non-loopback bind needs auth
- [ ] `gateway.auth.mode: "token"` with a strong token, stored outside the repo
- [ ] Hook token distinct from the Gateway token; `hooks.allowedAgentIds` set
- [ ] `/v1/*` endpoints off unless needed, and never public
- [ ] HTTPS (Tailscale Serve, Cloudflare Access, or your proxy) for any remote access
- [ ] `openclaw security audit` clean
- [ ] Read [Security Hardening](/security/hardening)

---

## Rate Limiting

The Gateway has built-in limits; there are no per-channel `max_*` keys.

| Surface | Default | Configurable |
|---------|---------|--------------|
| Failed Gateway auth (token/password/device) | 10 failures / 60 s, 5 min lockout | `gateway.auth.rateLimit` |
| Failed hook auth | 20 failures / 60 s | No |
| Control-plane write RPCs | 30 / 60 s per method | No |
| Unauthenticated WebSocket connections | 128 outstanding per client IP | Env override only |

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    auth: {
      mode: "token",
      token: "${OPENCLAW_GATEWAY_TOKEN}",
      rateLimit: { maxAttempts: 10, windowMs: 60000, lockoutMs: 300000 },
    },
  },
}
```

Reference: [Rate limiting](https://docs.openclaw.ai/gateway/security/rate-limiting).

---

## Remote Access

### SSH Tunnel (Simplest)

```bash
# On your local machine
ssh -N -L 18789:127.0.0.1:18789 user@your-server
# Now the Gateway is at http://127.0.0.1:18789 on your machine
```

### Tailscale / WireGuard

Tailscale Serve gives tailnet-only HTTPS while the Gateway stays on loopback:

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: { bind: "loopback", tailscale: { mode: "serve" } },
}
```

Or run `openclaw gateway --tailscale serve`. `funnel` mode is public and needs password auth; avoid it for hooks. For WireGuard, see [Security Hardening](/security/hardening). Reference: [Tailscale](https://docs.openclaw.ai/gateway/tailscale).

### Cloudflare Tunnel

:::danger A quick tunnel publishes the whole Gateway
The URL a quick tunnel prints reaches everything on the port: the Control UI, the WebSocket and the hooks. Anyone who finds it can try your token. Use it only for a short test, and stop it afterwards.
:::

For quick testing, a zero-config quick tunnel needs no account or DNS setup:

```bash
cloudflared tunnel --url http://localhost:18789
```

For production, create a named tunnel on your own domain (requires a Cloudflare account):

```bash
# On your VPS — authenticate first, then create and route the tunnel
cloudflared tunnel login
cloudflared tunnel create openclaw
cloudflared tunnel route dns openclaw agent.example.com

# Run it
cloudflared tunnel run --url http://localhost:18789 openclaw
```

The tunnel provides transport encryption only. Keep Gateway token auth on, add `gateway.trustedProxies: ["127.0.0.1"]` (otherwise proxied requests get `403 proxy_attribution_required`), and put a **Cloudflare Access** policy in front of the hostname. The supported production setup uses Access with `trusted-proxy` auth: see [Security Hardening, Cloudflare Tunnel and Access](/security/hardening#cloudflare-tunnel-and-access) and [upstream](https://docs.openclaw.ai/gateway/cloudflare-access).

---

## Error Handling

### Hook status codes

| Status | Meaning |
|--------|---------|
| `200` | Admitted (not necessarily finished or delivered) |
| `204` | A mapping produced no action |
| `400` | Bad JSON, payload, session policy or delivery target; also a `?token=` query |
| `401` | Wrong or missing hook token |
| `404` | Hooks disabled, wrong `hooks.path`, or no matching mapping |
| `409` | Target session cannot accept work |
| `413` | Body over 256 KiB |
| `429` | Too many failed auth attempts; honor `Retry-After` |
| `502` / `503` | Preparation failed, admission timed out (15 s), or the Gateway is restarting |

### WebSocket handshake errors

The `connect` response carries structured `error.details`. The ones you will meet first: a **protocol mismatch** (your client is not on v4; update it), **pairing required** (approve the device with `openclaw devices approve <requestId>` and reconnect), and auth failures (wrong token, or rate limited). See the [protocol error reference](https://docs.openclaw.ai/gateway/protocol).

### Reconnection

Connections drop when the Gateway restarts or updates. `@openclaw/gateway-client` reconnects with jittered exponential backoff (1 s up to 30 s) and reports sequence gaps. After a reconnect, refetch history and restore your subscriptions. If you write your own client, do the same: back off exponentially, redo the full `connect.challenge` handshake each time, and never resend a `chat.send` without its original `idempotencyKey`.

---

## Testing

### Test webhook ingress

```bash
curl --include -X POST http://127.0.0.1:18789/hooks/wake \
  -H "Authorization: Bearer $OPENCLAW_HOOKS_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"text":"webhook smoke test","mode":"next-heartbeat"}'
# Expected: HTTP 200 with "ok": true
```

Then look for the run in `openclaw logs --follow`.

### Health check

```bash
openclaw status
openclaw gateway health
curl -fsS http://127.0.0.1:18789/healthz   # process is live
curl -fsS http://127.0.0.1:18789/readyz    # ready for traffic, channels healthy
```

`/healthz`, `/readyz` and `/startupz` need no auth and return no sensitive detail. Reference: [Health checks](https://docs.openclaw.ai/gateway/health).

---

## See Also

- [Gateway API Reference](/reference/gateway-api): protocol notes
- [Custom Channels](/guides/custom-channels): build a channel plugin with a signed webhook route
- [Automation](/guides/automation): scheduled jobs and delivery
- [Security Hardening](/security/hardening): Gateway auth, TLS, reverse proxies
- [Monitoring & Observability](/guides/monitoring): health checks and alerting
- [CI/CD & Testing](/guides/cicd-testing): pipeline integration
- [MCP Servers](/guides/mcp-servers): MCP tools for your agent
- [Configuration Reference](/reference/configuration): all settings
- [Environment Variables](/reference/environment-variables): `OPENCLAW_GATEWAY_TOKEN` and friends
