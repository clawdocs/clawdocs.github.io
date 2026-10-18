---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Gateway API
description: Summary of the OpenClaw Gateway protocol v4 (WebSocket frames, handshake, auth) and the HTTP endpoints, with links to the official protocol docs
keywords: [openclaw, openclaw api, websocket api, gateway api, rest api, control plane, message protocol]
---

# Gateway API

The Gateway serves a WebSocket control plane and a small set of HTTP endpoints on one port (`18789` by default, loopback only). The Control UI, the CLI, the desktop and mobile apps, and nodes all use the same protocol. This page summarises it so you know what exists; the [official protocol docs](https://docs.openclaw.ai/gateway/protocol) are the reference.

:::tip Use the client library
Unless you are writing a client in another language, do not hand-roll the handshake. The official TypeScript packages are [`@openclaw/gateway-client`](https://www.npmjs.com/package/@openclaw/gateway-client) and [`@openclaw/gateway-protocol`](https://www.npmjs.com/package/@openclaw/gateway-protocol) (both published from the openclaw/openclaw repo, v2026.10.4). For one-off calls from a shell, use `openclaw gateway call`. See [Building a Gateway client](https://docs.openclaw.ai/gateway/clients).
:::

## Calling methods from the CLI

`openclaw gateway call` connects with your configured credentials, sends one request and prints the response:

```bash
openclaw gateway call health --json
openclaw gateway call status --json
openclaw gateway call cron.list --params '{}' --json
```

This is the easiest way to explore methods before writing code.

## WebSocket protocol (v4)

### Framing

- Text frames with JSON payloads.
- The first client frame **must** be a `connect` request; anything else is rejected.
- Three frame shapes:
  - Request: `{ type: "req", id, method, params }`
  - Response: `{ type: "res", id, ok, payload | error }`
  - Event: `{ type: "event", event, payload, seq?, stateVersion? }`
- Before the handshake completes, frames are capped at 64 KiB. After it, follow `hello-ok.policy.maxPayload` (25 MiB by default) and `policy.maxBufferedBytes` (50 MiB).
- Malformed JSON before the handshake closes the socket; after it, the bad frame is logged and dropped.

Reference: [Transport and framing](https://docs.openclaw.ai/gateway/protocol/transport).

### Handshake

1. The Gateway sends a `connect.challenge` event with a `nonce` and `ts`.
2. The client sends a `connect` request: `minProtocol` / `maxProtocol` (both `4` for operator clients), `client` info, `role` (`operator` or `node`), requested `scopes`, `auth` (for example `{ token }`) and, for paired devices, a `device` block that signs the nonce with the device's Ed25519 key.
3. The Gateway replies with a `res` whose payload is `hello-ok`: negotiated `protocol`, `server` info, the available `features.methods` and `features.events`, a state `snapshot`, the granted `auth.role` and `auth.scopes`, and `policy` limits.

{/* snippet:skip Gateway wire frame, not openclaw.json */}
```json title="connect request (abridged)"
{
  "type": "req",
  "id": "1",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": { "id": "my-script", "version": "0.1.0", "platform": "linux", "mode": "operator" },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "auth": { "token": "<gateway token>" }
  }
}
```

The pre-auth handshake deadline is 15 seconds (`OPENCLAW_HANDSHAKE_TIMEOUT_MS` can raise it). Device-auth errors carry `error.details.code` (for example `DEVICE_AUTH_NONCE_MISMATCH`). Reference: [Handshake and roles](https://docs.openclaw.ai/gateway/protocol/handshake), [Auth](https://docs.openclaw.ai/gateway/protocol/auth).

### Methods and events

After `hello-ok`, the client sends `req` frames and receives `res` frames plus events. A few methods you will meet early:

| Method | Purpose |
|--------|---------|
| `health`, `status` | Gateway and channel health |
| `chat.send`, `chat.abort` | Send a user message to a session; cancel a run |
| `sessions.*` | List, create, send to and steer sessions |
| `config.get`, `config.set`, `config.patch`, `config.apply` | Read and write config (writes need `operator.admin`) |
| `tools.catalog`, `tools.invoke` | Inspect and invoke tools under tool policy |
| `exec.approval.resolve` | Answer a pending exec approval |
| `device.pair.list`, `device.pair.approve` | Device pairing |
| `node.list`, `node.describe`, `node.invoke` | Paired nodes |
| `wake`, `last-heartbeat`, `set-heartbeats` | Heartbeat control |

The live list for your Gateway is in `hello-ok.features.methods`; the full catalog is in [RPC methods](https://docs.openclaw.ai/gateway/protocol/rpc-methods).

`chat.send` is a closed object: `sessionKey`, `message` and `idempotencyKey` are required, and unknown fields such as `text` are rejected. Reuse the same `idempotencyKey` when retrying after a transport failure.

{/* snippet:skip Gateway wire frame, not openclaw.json */}
```json title="chat.send request"
{
  "type": "req",
  "id": "2",
  "method": "chat.send",
  "params": {
    "sessionKey": "main",
    "message": "What is on my calendar today?",
    "idempotencyKey": "7f9c2b1e-0d3a-4c55-9a51-2f6c1d0e8b44"
  }
}
```

Replies stream as `chat` events (display-ready updates with `state: "delta"`, then a final state) and `agent` events (assistant text in `data.delta`, tool activity). Subscribe to one of the two text streams for a display, not both, or you will duplicate output. Reference: [Events](https://docs.openclaw.ai/gateway/protocol/rpc-bootstrap-and-events).

### Scopes

Operator connections are limited by scopes: `operator.read` (status, lists, logs), `operator.write` (send messages, invoke tools), `operator.admin` (config changes, updates, high-risk approvals), plus narrower ones such as `operator.approvals` and `operator.pairing`. Request only what your client needs. Reference: [Operator scopes](https://docs.openclaw.ai/gateway/operator-scopes).

### Versioning

The protocol is **version 4**. Operator and UI clients must include v4 in their `minProtocol`..`maxProtocol` range. Nodes and lightweight probes get an N-1 window and may still connect at v3 during rolling upgrades. Reference: [Versioning](https://docs.openclaw.ai/gateway/protocol/versioning). Protocol-affecting changes are listed in the [upstream changelog](https://github.com/openclaw/openclaw/tree/main/CHANGELOG).

## HTTP endpoints

All on the same port as the WebSocket.

| Endpoint | Default | Auth | Purpose |
|----------|---------|------|---------|
| `GET /healthz` (`/health`) | on | none | Liveness: the HTTP server is up |
| `GET /startupz` | on | none | Startup has settled; ignores channel health |
| `GET /readyz` | on | none | Deep readiness, including channel accounts |
| `/` and `/chat` | on | Gateway auth over the WebSocket | Control UI and web chat |
| `POST /tools/invoke` | on | Bearer | Invoke one tool under tool policy |
| `POST /v1/chat/completions`, `GET /v1/models` | **off** | Bearer | OpenAI-compatible chat, runs a normal agent turn |
| `POST /v1/responses` | **off** | Bearer | OpenResponses-compatible API |

Enable the OpenAI-compatible endpoints in config:

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
        responses: { enabled: true },
      },
    },
  },
}
```

With `token` or `password` auth, HTTP callers send `Authorization: Bearer <token-or-password>`. That bearer is treated as **full operator access** to the Gateway, so do not hand it to a third-party app you would not give a shell to. Select an agent with `model: "openclaw/<agentId>"`. References: [OpenAI chat completions](https://docs.openclaw.ai/gateway/openai-http-api), [OpenResponses](https://docs.openclaw.ai/gateway/openresponses-http-api), [Tools invoke](https://docs.openclaw.ai/gateway/tools-invoke-http-api), [Health checks](https://docs.openclaw.ai/gateway/health#http-probes).

## Authentication

Gateway auth is **required by default**; onboarding generates a token. `gateway.auth.mode` is `token`, `password`, `trusted-proxy` (an identity-aware reverse proxy) or `none` (explicit opt-out, loopback only). A non-loopback bind without auth is refused at startup.

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    bind: "loopback",
    auth: { mode: "token", token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- WebSocket clients send the token in `connect.params.auth.token`, never in the URL.
- HTTP clients send `Authorization: Bearer <token>`.
- `OPENCLAW_GATEWAY_TOKEN` and `OPENCLAW_GATEWAY_PASSWORD` are read natively, so you can also leave `gateway.auth.token` unset and export the variable.
- Paired devices (Control UI in a browser, apps) get a per-device token after approval with `openclaw devices approve`. Loopback connections are approved automatically.
- `openclaw dashboard` opens the Control UI with your token in the URL fragment (`#token=`), which does not reach server logs. A `?token=` query parameter is only a legacy bootstrap fallback.

:::danger Keep tokens out of URLs
CVE-2026-25253 (fixed in v2026.1.29) was a token leak: the Control UI accepted a `gatewayUrl` from a query string and auto-connected, sending the token to an attacker's server. Do not put tokens in query strings, and do not expose the port without auth. See [Network exposure](https://docs.openclaw.ai/gateway/security/network-exposure) and [Security Hardening](/security/hardening).
:::

## See also

- [The Gateway](/architecture/gateway): how the Gateway fits into OpenClaw
- [Configuration](/reference/configuration): `gateway` config section
- [Gateway protocol](https://docs.openclaw.ai/gateway/protocol) (official)
