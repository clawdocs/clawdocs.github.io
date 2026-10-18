---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: WebClaw Web Client
description: WebClaw and PinchChat are third-party browser front-ends for OpenClaw. WebClaw cannot connect to current Gateways; use the built-in Control UI, or PinchChat with care.
keywords: [openclaw, webclaw, pinchchat, web client, browser frontend, control ui]
---

# WebClaw Web Client

:::danger WebClaw does not work with current OpenClaw
[WebClaw](https://github.com/ibelick/webclaw) hard-codes Gateway protocol **3** (`minProtocol: 3, maxProtocol: 3`). Gateways have required protocol **4** for operator and UI clients since 2026.5.19; only node-role devices may still use v3. Against v2026.10.4 the handshake fails with a protocol mismatch. Updating the Gateway does not help: the Gateway update is what broke it. The project has had no commits since 2026-03-17.
:::

Checked on 2026-10-18 against OpenClaw **v2026.10.4**.

---

## Use the Built-in Control UI First

Every Gateway serves the **Control UI** on its own port: `http://127.0.0.1:18789/` by default. It is maintained with the Gateway, so it always speaks the current protocol. It has the WebChat chat tab, a session rail, side chat, themes, approvals, config and channel management, and the DM access request queue. The macOS and iOS apps provide the same WebChat natively.

```bash
openclaw dashboard        # opens the Control UI with your Gateway token
```

For access from other devices, keep the Gateway on loopback and use Tailscale Serve or an SSH tunnel rather than exposing the port:

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: { bind: "loopback", tailscale: { mode: "serve" } },
}
```

Reference: [Control UI](https://docs.openclaw.ai/web/control-ui), [WebChat](https://docs.openclaw.ai/web/webchat), [remote access](/guides/api-webhooks#remote-access).

---

## WebClaw, for the Record

| | |
|---|---|
| Repo | [ibelick/webclaw](https://github.com/ibelick/webclaw), MIT, 647 stars (2026-10-18) |
| Last commit | 2026-03-17; no releases; npm `webclaw` 0.1.1 (2026-02-14) |
| Stack | TanStack Start (React) with server routes; the Gateway connection runs server-side |
| Protocol | v3 only, so it is rejected by v2026.5.19 and later |
| Env vars | Reads only `CLAWDBOT_GATEWAY_URL`, `CLAWDBOT_GATEWAY_TOKEN`, `CLAWDBOT_GATEWAY_PASSWORD` (WebClaw reads these, not the Gateway) |
| Scope | Connects with `operator.admin` and has no login of its own |

If WebClaw is updated to protocol 4, two warnings still apply. Anyone who can open the WebClaw page gets admin control of your Gateway, so it must sit behind its own authentication (Tailscale, an SSH tunnel, or an authenticating proxy). And unofficial Docker images of it (for example on Docker Hub) are not published by the author; do not hand them your Gateway token.

---

## PinchChat (Alternative Frontend) {#pinchchat-alternative-frontend}

[PinchChat](https://github.com/MarlBurroW/pinchchat) is a third-party browser chat UI with tool-call visualization, multi-session navigation, split view, themes and PWA support.

| | |
|---|---|
| Repo | MarlBurroW/pinchchat, MIT, 187 stars (2026-10-18) |
| Latest release | v1.71.4 (2026-06-14); last push 2026-06-18, so quiet for four months |
| Protocol | Negotiates `minProtocol: 3, maxProtocol: 4` and signs the `connect.challenge` with a browser device key |
| Scopes requested | `operator.read`, `operator.write`, `operator.admin`, `operator.approvals` |
| Credentials | Gateway URL and token entered at runtime, stored in the browser's `localStorage` |

Its code speaks protocol 4, but this site has not tested it against v2026.10.4. Gateway changes after June 2026 may affect it.

### Installing PinchChat

```bash
docker run -p 127.0.0.1:3000:80 ghcr.io/marlburrow/pinchchat:v1.71.4
```

The image is published by the author under their GitHub account. Pin a release tag rather than `latest`, and bind it to localhost as above. Then open `http://localhost:3000` and enter the Gateway URL and token.

Because PinchChat connects from the browser, the Gateway must accept its origin. Same-origin loads from loopback, LAN and tailnet hosts are accepted; for a public hostname, allow it explicitly:

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    controlUi: { allowedOrigins: ["https://chat.example.com"] },
  },
}
```

On first connect, the browser's device key needs approval on the Gateway host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

:::warning
PinchChat asks for `operator.admin` and keeps your Gateway token in `localStorage`. Anything that can run script on that origin, such as a malicious extension or an XSS bug, can take that token. Use it on a device you trust, serve it over HTTPS, and do not put it on a public URL without an authenticating proxy in front. See [Security Hardening](/security/hardening).
:::

---

## Building Your Own Client

Use `@openclaw/gateway-client` and follow the protocol v4 handshake (`connect.challenge` → `connect` → `hello-ok`) rather than copying an old client. See [Gateway API: WebSocket protocol](/reference/gateway-api#websocket-protocol-v4) and upstream's [Building a Gateway client](https://docs.openclaw.ai/gateway/clients).

---

## See Also

- [Gateway API](/reference/gateway-api): WebSocket protocol, scopes, auth
- [API & Webhooks](/guides/api-webhooks): webhooks and remote access
- [Channels & Integrations](/guides/channels): chat apps as front-ends
- [Security Hardening](/security/hardening): exposing the Gateway safely
- [Ecosystem](/reference/ecosystem): other community projects
