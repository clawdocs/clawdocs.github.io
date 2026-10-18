---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: The Gateway
description: The central long-running process — running it as a service, the WebSocket wire protocol, authentication, device pairing, config, logs, and health endpoints
keywords: [openclaw, gateway, websocket, port 18789, control plane, daemon, wire protocol]
---

# The Gateway

The Gateway is OpenClaw's core: one long-running Node.js process per host that owns the messaging channels, runs agent turns, and serves a WebSocket + HTTP server on one port (default `127.0.0.1:18789`). The CLI, the Control UI, the desktop and mobile apps, and paired nodes are all clients of it.

Official references: [Gateway runbook](https://docs.openclaw.ai/gateway), [Gateway architecture](https://docs.openclaw.ai/concepts/architecture), [Gateway protocol](https://docs.openclaw.ai/gateway/protocol).

---

## Running the Gateway

```bash
# Foreground (logs to stdout)
openclaw gateway run

# Install and start as a service (launchd, systemd user unit, or Windows Scheduled Task)
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop

# Foreground on another port, replacing anything bound to it
openclaw gateway run --port 19000 --force

# Debug logging (--log-level is a global flag, so it goes before the command)
openclaw --log-level debug gateway run
```

`openclaw onboard --install-daemon` installs the service during setup. The Gateway only starts when `gateway.mode` is `"local"`; onboarding sets this. `--bind`, `--auth`, `--token` and `--tailscale` override the matching config for one run; see [`openclaw gateway`](https://docs.openclaw.ai/cli/gateway).

The Gateway watches `openclaw.json` and hot-applies most changes. Some, such as `gateway.auth.mode`, need a restart ([Config hot reload](https://docs.openclaw.ai/gateway/configuration/hot-reload)). An invalid edit is skipped and the running config stays in place.

---

## Wire Protocol

Clients talk to the Gateway over WebSocket using JSON text frames, at **protocol version 4**. For anything you build, prefer the published client packages `@openclaw/gateway-client` and `@openclaw/gateway-protocol` over hand-rolled frames ([Building a Gateway client](https://docs.openclaw.ai/gateway/clients)).

### Frame types

| Type | Direction | Structure | Purpose |
|------|-----------|-----------|---------|
| **Request** | Client → Gateway | `{type: "req", id, method, params}` | RPC calls |
| **Response** | Gateway → Client | `{type: "res", id, ok, payload\|error}` | RPC replies |
| **Event** | Gateway → Client | `{type: "event", event, payload, seq?, stateVersion?}` | Push notifications |

### Connection handshake

1. Client opens a WebSocket to `ws://127.0.0.1:18789`.
2. Gateway sends a `connect.challenge` event with a `nonce` and `ts`.
3. Client sends a `connect` request as its first frame: protocol range (`minProtocol`/`maxProtocol` 4), client info, `role` (`operator` or `node`), scopes, `auth` (for example `{ token }`), and a `device` block that signs the challenge nonce.
4. Gateway replies with `hello-ok`, which carries the negotiated protocol, policy limits, and a presence/health snapshot.

A first frame that is not JSON or not `connect` is a hard close. Events are not replayed, so clients refresh state after a gap. Details: [Handshake and roles](https://docs.openclaw.ai/gateway/protocol/handshake).

### Payload limits

| Phase | Max size |
|-------|----------|
| Pre-handshake frames | 64 KiB |
| Post-handshake (`hello-ok.policy.maxPayload`) | 25 MiB |
| Per-connection send buffer (`maxBufferedBytes`) | 50 MiB |

### Common RPC methods

The protocol has many methods; `hello-ok.features.methods` lists what a Gateway advertises. Commonly used ones:

| Area | Methods |
|------|---------|
| **Chat and sessions** | `chat.send`, `chat.abort`, `chat.history`, `sessions.create`, `sessions.send`, `sessions.steer` |
| **Agent runs** | `agent`, `agent.wait` |
| **Tools** | `tools.catalog`, `tools.effective`, `tools.invoke` |
| **Exec approvals** | `exec.approval.request`, `exec.approval.resolve` |
| **Heartbeat** | `last-heartbeat`, `set-heartbeats`, `wake` |
| **Memory** | `doctor.memory.status` |
| **Agents** | `agents.list`, `agents.create` |
| **Config** | `config.get`, `config.set`, `config.patch`, `config.apply` |
| **Plugins** | `plugins.list`, `plugins.install` |
| **Devices** | `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove` |
| **Talk** | `talk.session.create`, `talk.session.close` |
| **Nodes** | `node.list`, `node.describe`, `node.invoke` |

The full list is in [RPC methods](https://docs.openclaw.ai/gateway/protocol/rpc-methods). From a shell, `openclaw gateway call <method> --params '<json>'` calls one method with your configured auth:

```bash
openclaw gateway call health
openclaw gateway call status --json
```

### Idempotency

Side-effecting methods such as `chat.send` and `agent` require an `idempotencyKey`. The Gateway keeps a short-lived dedupe cache so a retried request is not processed twice.

### Example: sending a chat message

This is the shape of a `chat.send` request, sent after a successful `connect`. `chat.send` is a closed object: it takes `sessionKey`, `message` and `idempotencyKey` (plus optional fields), and rejects unknown keys such as `text`.

```typescript
ws.send(JSON.stringify({
  type: 'req',
  id: 'msg-001',
  method: 'chat.send',
  params: {
    sessionKey: 'agent:main:main',
    message: 'What files are in my home directory?',
    idempotencyKey: 'idem-abc123',
  },
}));

// The Gateway acknowledges with {type: "res", id: "msg-001", ok: true, payload: {...}}
// and then streams progress as `chat` and `agent` events
// (assistant deltas, tool events, lifecycle start/end).
```

---

## Authentication

Gateway auth is **required by default**, and onboarding generates a token. The Gateway refuses to bind to a non-loopback address without auth.

| `gateway.auth.mode` | How it works | Use case |
|------|-------------|----------|
| `token` | Shared token sent in `connect.params.auth.token` | Default |
| `password` | Shared password sent in `connect.params.auth.password` | Human-typed secret |
| `trusted-proxy` | Identity headers from an identity-aware reverse proxy listed in `gateway.trustedProxies` | Behind an auth proxy ([Trusted proxy auth](https://docs.openclaw.ai/gateway/trusted-proxy-auth)) |
| `none` | No shared-secret auth | Trusted loopback only; never on a reachable interface |

Tailscale is not an auth mode. `gateway.tailscale.mode: "serve"` plus `gateway.auth.allowTailscale` lets Tailscale Serve identity satisfy Control UI and WebSocket auth. Send the token in the `connect` frame, never in a URL query string.

### Device identity

Every client also presents an Ed25519 device identity on `connect` and signs the `connect.challenge` nonce. Signature payload v3 binds `platform` and `deviceFamily`. The allowed clock skew for `signedAt` is **2 minutes**. After the first approval the Gateway issues a device token for later connects ([Protocol auth](https://docs.openclaw.ai/gateway/protocol/auth)).

### Device pairing

- Trusted local (loopback) connections, including SSH port forwards, are approved automatically.
- LAN and tailnet devices need explicit approval: `openclaw devices list`, then `openclaw devices approve <requestId>`.
- `openclaw pairing approve <channel> <code>` is different: it approves **DM pairing** for a chat sender, not a device. DM pairing caps pending requests at 3 per channel account ([DM pairing](https://docs.openclaw.ai/channels/pairing)).

See [Device pairing](https://docs.openclaw.ai/gateway/pairing).

:::danger
Do not expose the Gateway on a public interface. Keep `gateway.bind: "loopback"` (the default) and use Tailscale, a VPN, or an SSH tunnel for remote access. If you must use `bind: "lan"`, keep token auth on and firewall the port. Exposed instances have been mass-scanned; see [Exposed Instances](/security/known-vulnerabilities#exposed-instances-january-february-2026).
:::

---

## Internal components

### Command queue

Agent runs are serialized per session key (a "session lane"), optionally through a global lane as well. Only one run touches a given session at a time, so simultaneous messages from several channels or a scheduled turn cannot race. Channels choose how a message that arrives mid-run is handled (steer, follow-up, collect, interrupt). See [Command queue](https://docs.openclaw.ai/concepts/queue).

### Exec approvals

When `tools.exec.mode` is `ask` or `auto`, a command that is not allowlisted becomes an approval record with its exact argv and cwd. Approval clients (CLI, Control UI, apps) resolve it with `exec.approval.resolve`. **The default mode is `full`, which runs host commands with no prompt.** See [Agent runtime and tools](/architecture/brain-and-hands).

### Nodes

Nodes connect to the same WebSocket with `role: "node"` and declare their commands. The Gateway routes `node.invoke` calls to them. Nodes are peripherals: channel messages land on the Gateway, not on nodes ([Nodes](https://docs.openclaw.ai/nodes)).

---

## Logs and health

- **Log file:** `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (per-profile: `openclaw-<profile>-YYYY-MM-DD.log`). There is no PID file. See [Logging](https://docs.openclaw.ai/logging).
- **Tail logs:** `openclaw logs --follow`. Other flags: `--limit`, `--json`, `--plain`, `--max-bytes`. There is no `--filter` flag, so pipe to `grep`.
- **Health:** `openclaw health`, `openclaw gateway status`, and the HTTP probes `/healthz` (liveness), `/startupz` and `/readyz` (readiness).

```bash
openclaw gateway status
openclaw logs --follow
openclaw logs --limit 500 --plain | grep -i heartbeat
curl -fsS http://127.0.0.1:18789/healthz
```

---

## Configuration

A validated starting point. The token comes from the `OPENCLAW_GATEWAY_TOKEN` environment variable (put it in `~/.openclaw/.env`). A missing variable stays unresolved and the token counts as unavailable.

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    mode: "local",
    port: 18789,
    bind: "loopback", // auto | loopback | lan | tailnet | custom
    auth: {
      mode: "token",
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
    trustedProxies: [],
  },
  logging: { level: "info" },
}
```

Port precedence: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`. For `bind: "custom"`, set `gateway.customBindHost`. All gateway keys: [Configuration — gateway](https://docs.openclaw.ai/gateway/config-gateway).

### Transport security

- Plaintext `ws://` is accepted only for loopback, private IPs, `.local` hostnames, and Tailnet `*.ts.net` hosts.
- Everything else requires `wss://` (TLS).
- Browser SSRF to private networks is blocked by default.

---

## See also

- [Architecture Overview](/architecture/overview): component map
- [Gateway API](/reference/gateway-api): protocol and HTTP endpoint summary
- [API & Webhooks](/guides/api-webhooks): integration patterns
- [Security Hardening](/security/hardening): bind, auth, reverse proxy
- [Configuration Reference](/reference/configuration): how the config file works
