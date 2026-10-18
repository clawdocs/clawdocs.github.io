---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Security Hardening
description: A secure-by-default checklist for self-hosted OpenClaw — loopback bind, gateway auth, remote access, reverse proxies, firewalls, exec approvals, sandboxing, channel access, secrets, supply chain, updates and incident response
keywords: [openclaw, openclaw hardening, secure openclaw, self-hosting security, reverse proxy, tailscale, exec approvals, sandbox, incident response]
---

# Security Hardening

This is an opinionated checklist for people who run their own OpenClaw Gateway. It was checked against OpenClaw **v2026.10.4** on 2026-10-18. Each section says what to do, shows a config that passes `openclaw config validate`, and links the official docs for the details.

OpenClaw's defaults are already conservative on a normal host install: the Gateway binds to loopback, auth is required, unknown DM senders get a pairing code, and groups are allowlisted ([upstream security index](https://docs.openclaw.ai/gateway/security)). Most hardening is about **not undoing those defaults** when you add remote access, and about tightening two defaults that are open on purpose: host shell commands run without approval, and the sandbox is off.

:::danger Unknown config keys stop the Gateway
OpenClaw validates `openclaw.json` strictly. Unknown keys, wrong types or invalid values make the Gateway **refuse to start** ([configuration: strict validation](https://docs.openclaw.ai/gateway/configuration)). Many "hardening" snippets on the web use keys that never existed. Check every change before restarting:

```bash
openclaw config validate
```
:::

:::info Trust model
One Gateway is one trust boundary: a single operator, or a team whose members trust each other. It is not a multi-tenant boundary between people who distrust each other. Anyone who can message a tool-enabled agent shares that agent's tool authority. For mutually untrusted users, run separate Gateways, ideally under separate OS users or hosts ([trust model](https://docs.openclaw.ai/gateway/security/trust-model), [SECURITY.md](https://github.com/openclaw/openclaw/blob/main/SECURITY.md)).
:::

## The checklist

1. [Run the latest stable release](#updating) and update plugins and skills with it.
2. [Keep the Gateway on loopback](#bind). Docker users: [publish the port to `127.0.0.1` only](#docker).
3. [Require a strong token or password](#auth).
4. [Reach it remotely through an SSH tunnel, Tailscale Serve or Cloudflare Access](#remote-access), never by opening port 18789.
5. If you must use a [reverse proxy](#configure-trustedproxies-critical-for-reverse-proxies), set `gateway.trustedProxies` and overwrite forwarded headers.
6. [Firewall the host](#firewall), including the `DOCKER-USER` chain.
7. [Decide who can talk to the agent](#channel-access): pairing or allowlists, mention-gated groups.
8. [Turn on exec approvals](#exec-approvals) and [the sandbox](#sandboxing) for anything that reads untrusted input.
9. [Move secrets out of plaintext](#secrets) and check with `openclaw secrets audit --check`.
10. [Treat skills and plugins as code you are about to run](#supply-chain).
11. [Run `openclaw security audit --deep`](#audit) after every change.
12. Know your [incident response](#incident-response) steps before you need them.

---

## Stay current {#updating}

OpenClaw publishes security fixes often: 722 GitHub advisories as of 2026-10-18, 75 of them on a single day (2026-09-11) ([Known Vulnerabilities](/security/known-vulnerabilities)). An old pinned version is the most common avoidable risk.

```bash
openclaw --version
openclaw update status     # channel, installed version, latest available
openclaw update            # npm, pnpm or git installs; runs doctor afterwards
openclaw plugins update --all
openclaw skills update --all
```

- **Always run the latest stable release.** Do not copy a version number from a blog post or an old guide into `npm install -g openclaw@<version>`.
- Several fixes ship in separate `@openclaw/*` channel plugins (Slack, Discord, WhatsApp, Matrix and others), so `openclaw update` alone is not enough. Run `openclaw plugins update --all` too. Preview with `--dry-run`.
- Docker: pin an exact image tag such as `ghcr.io/openclaw/openclaw:2026.10.4` if you want reproducible deploys, but bump it on every release. Use only `ghcr.io/openclaw/openclaw` or `openclaw/openclaw` images ([Docker install](https://docs.openclaw.ai/install/docker)).
- The `extended-stable` channel trails stable by about a month and never auto-applies ([release channels](https://docs.openclaw.ai/install/development-channels)). If you use it, check each new advisory's patched versions against what you run.
- Watch the repository for security alerts: on GitHub, **Watch → Custom → Security alerts** on [openclaw/openclaw](https://github.com/openclaw/openclaw/security/advisories).

- Background auto-update for stable package installs is opt-in: `update.auto.enabled: true` (default `false`; [updating](https://docs.openclaw.ai/install/updating)).

## Keep the Gateway on loopback {#bind}

`gateway.bind` controls where the Gateway listens. The default is `"loopback"`. The other values, `"lan"`, `"tailnet"`, `"custom"` and `"auto"`, make it reachable by more clients and must be paired with auth and a firewall ([network exposure](https://docs.openclaw.ai/gateway/security/network-exposure)). There is no `gateway.host` key; use the bind mode names, not IP addresses.

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
  },
}
```

Fix a drifted bind:

```bash
openclaw config set gateway.bind loopback
openclaw gateway restart
```

Upstream is explicit: the web interface is meant for local use and "is not hardened for public exposure". Do not bind it to a public interface and do not put it behind a public reverse proxy ([SECURITY.md, web interface safety](https://github.com/openclaw/openclaw/blob/main/SECURITY.md)). Public exposure is also out of scope for vulnerability reports.

Also turn off mDNS broadcasting you don't need. When the Bonjour plugin is on (it auto-starts on macOS), `full` mode advertises your CLI path and SSH port on the LAN. `minimal` is the default when Bonjour is enabled; `discovery.mdns.mode: "off"` suppresses it ([mDNS discovery](https://docs.openclaw.ai/gateway/security/network-exposure)).

### Docker: the one exposed default {#docker}

Container images are the exception to loopback-first. The Docker setup script sets `OPENCLAW_GATEWAY_BIND=lan` so that port publishing works, and the upstream `docker-compose.yml` publishes `${OPENCLAW_GATEWAY_PORT:-18789}:18789` on **all host interfaces** ([Docker networking](https://docs.openclaw.ai/install/docker/networking-and-storage)). On a VPS with a public IP that means the Gateway is on the internet, protected only by its token.

Keep `lan` inside the container, but publish to the host's loopback only. In your compose file:

```yaml
services:
  openclaw-gateway:
    ports:
      - "127.0.0.1:18789:18789"
```

The same compose file also publishes `18790` and `3978` (Microsoft Teams). Bind those to `127.0.0.1` too, or remove them if you don't use them. Then reach the Gateway through an [SSH tunnel or Tailscale](#remote-access). Host firewalls such as ufw do **not** filter Docker-published ports; see [Docker and ufw](#docker-ufw).

## Require a strong secret {#auth}

Gateway auth is required by default. With no valid token, password or trusted proxy configured, the Gateway refuses WebSocket connections. Startup rejects blank tokens, the strings `undefined` and `null`, and published example placeholders, and the audit warns about secrets shorter than 24 characters ([Gateway WebSocket auth](https://docs.openclaw.ai/gateway/security/network-exposure)).

There are four modes: `token` (recommended), `password`, `trusted-proxy` (an identity-aware proxy such as Cloudflare Access), and `none` (private ingress only; don't use it).

Generate and store a token in one step:

```bash
openclaw doctor --generate-gateway-token
openclaw gateway auth-token --show    # copy it to clients
```

Or keep the token out of `openclaw.json` and read it from the environment, for example from `~/.openclaw/.env` or your service manager:

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    auth: { mode: "token", token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

A good value comes from `openssl rand -hex 32`. Treat the token as full operator access: anyone holding it can call `/v1/chat/completions`, `/tools/invoke` and every other authenticated route with full operator scopes ([network exposure](https://docs.openclaw.ai/gateway/security/network-exposure)). Don't reuse it as `hooks.token`; the audit flags that.

## Run the security audit {#audit}

```bash
openclaw security audit            # config and filesystem, read-only
openclaw security audit --deep     # adds live Gateway probes and plugin checks
openclaw security audit --fix      # safe fixes only
openclaw security audit --json
```

`--fix` flips open `groupPolicy` values to `allowlist` and tightens file permissions (`600` files, `700` directories). It does **not** rotate secrets, change bind or auth, disable tools, or remove plugins or skills ([`openclaw security`](https://docs.openclaw.ai/cli/security)). The audit detects drift from safe defaults; it doesn't replace tool policy and sandboxing. The full check catalogue is in [audit checks](https://docs.openclaw.ai/gateway/security/audit-checks), and the fix order is in [running the audit](https://docs.openclaw.ai/gateway/security/running-the-audit).

Before you change remote access, a reverse proxy or DM policy, walk through the upstream [exposure runbook](https://docs.openclaw.ai/gateway/security/exposure-runbook). It has pre-flight and rollback steps.

## Remote access {#remote-access}

Pick one of these. All of them keep `gateway.bind: "loopback"`.

### SSH tunnel (simplest)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Then open `http://127.0.0.1:18789/` locally. For the CLI on your laptop, point it at the tunnel ([remote access](https://docs.openclaw.ai/gateway/remote)):

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    mode: "remote",
    remote: { url: "ws://127.0.0.1:18789", token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

### Tailscale Serve (tailnet only)

OpenClaw can configure `tailscale serve` itself. The Gateway stays on `127.0.0.1` and Tailscale provides HTTPS and identity headers ([Tailscale](https://docs.openclaw.ai/gateway/tailscale)):

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
    auth: { mode: "token", token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

With Serve, `gateway.auth.allowTailscale` (on by default) lets tailnet users into the Control UI without the token. That trusts the Gateway host itself. If untrusted code can run on that host, set `allowTailscale: false` ([Tailscale Serve identity headers](https://docs.openclaw.ai/gateway/security/network-exposure)).

:::warning Funnel is public
`tailscale.mode: "funnel"` publishes the Gateway on the **public internet** and requires password auth. Use Serve unless you really need public access.
:::

### Cloudflare Tunnel and Access

`cloudflared` dials out, so no inbound port is opened. The supported setup uses `gateway.auth.mode: "trusted-proxy"` with Cloudflare's identity headers ([Cloudflare Tunnel and Access](https://docs.openclaw.ai/gateway/cloudflare-access), [trusted proxy auth](https://docs.openclaw.ai/gateway/trusted-proxy-auth)):

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    bind: "loopback",
    trustedProxies: ["127.0.0.1"],
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "cf-access-authenticated-user-email",
        requiredHeaders: ["cf-access-jwt-assertion"],
        allowLoopback: true,
      },
    },
  },
}
```

Know the limits: OpenClaw checks that the Access headers are present; it does **not** verify the Access JWT signature. With `allowLoopback`, any local process can send those headers too, so keep the Gateway port private to the host and run only trusted workloads there. Without this config, a same-host `cloudflared` in front of token auth gets `403 proxy_attribution_required`. CLI and node clients need a Cloudflare Access token; the upstream page shows the `gateway.remote` setup.

### WireGuard or another VPN

Set `gateway.bind: "custom"` with `gateway.customBindHost` set to the VPN interface address (for example `10.8.0.1`), keep token auth on, and firewall the port to the VPN subnet. A non-loopback bind always needs auth ([remote access](https://docs.openclaw.ai/gateway/remote)).

## Reverse proxies {#configure-trustedproxies-critical-for-reverse-proxies}

Prefer the options above. If you still put Nginx or Caddy in front, for example to restrict the Control UI to a VPN range, configure the Gateway to trust only that proxy.

Since [PR #1795](https://github.com/openclaw/openclaw/pull/1795) (January 2026), a request with forwarded headers from an address that is **not** in `gateway.trustedProxies` is not treated as local. With token or password auth, an unconfigured same-host proxy gets `403 proxy_attribution_required` ([reverse proxy configuration](https://docs.openclaw.ai/gateway/security/network-exposure)). So set it:

```json5 title="~/.openclaw/openclaw.json"
{
  gateway: {
    bind: "loopback",
    publicOrigin: "https://openclaw.example.com",
    trustedProxies: ["127.0.0.1"],
    allowRealIpFallback: false,
    auth: { mode: "token", token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

`publicOrigin` gives the Control UI its allowed browser origin. Avoid `gateway.controlUi.allowedOrigins: ["*"]`. The proxy must **overwrite** `X-Forwarded-For`, not append to it. Otherwise a client can put any address in the header.

### Nginx

```nginx title="/etc/nginx/conf.d/openclaw.conf (included inside http {})"
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 443 ssl;
    server_name openclaw.example.com;
    ssl_certificate     /etc/letsencrypt/live/openclaw.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/openclaw.example.com/privkey.pem;

    # Only your VPN or office range.
    allow 100.64.0.0/10;
    deny  all;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # Keep every proxy_set_header in this block. A location that sets any
        # proxy_set_header inherits none from the server block.
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-For   $remote_addr;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        $connection_upgrade;

        # WebSockets idle longer than nginx's 60 s default.
        proxy_read_timeout 1h;
        proxy_send_timeout 1h;
        proxy_buffering off;
    }
}
```

Two common mistakes this avoids. First, `proxy_set_header` lines at `server` level are silently dropped when the `location` defines its own. Second, `$proxy_add_x_forwarded_for` appends the client-supplied header instead of replacing it. `map` and `limit_req_zone` belong in the `http {}` context. Run `nginx -t` before reloading.

### Caddy

Caddy's `reverse_proxy` handles WebSocket upgrades. It also replaces incoming `X-Forwarded-For` unless you configure Caddy's own `trusted_proxies`.

```caddy title="/etc/caddy/Caddyfile"
openclaw.example.com {
    @outside not remote_ip 100.64.0.0/10
    respond @outside 403

    # No path matcher: this covers every path, including the WebSocket.
    basic_auth {
        alice $2a$14$REPLACE_WITH_OUTPUT_OF_caddy_hash-password
    }

    reverse_proxy 127.0.0.1:18789
}
```

Write `basic_auth` with no matcher, or with `/*`. `basicauth /` (the old spelling, still common in guides) matches **only the root path**. Everything else, including the WebSocket, `/v1/*` and `/tools/invoke`, is left unprotected. Basic auth also uses the `Authorization` header that the Gateway's HTTP bearer auth needs, so CLI, node and HTTP API clients can't pass through it. Use it only for browser access to the Control UI. The `basic_auth` spelling needs Caddy 2.8 or later. Generate the hash with `caddy hash-password`.

## Firewall {#firewall}

A loopback-bound Gateway needs no firewall rule. Firewall everything else, and allow SSH **before** you enable the firewall, or you will lock yourself out:

```bash
sudo ufw allow OpenSSH
sudo ufw default deny incoming
sudo ufw enable
sudo ufw status verbose
```

### Docker-published ports bypass ufw {#docker-ufw}

Published container ports go through Docker's forwarding chains, not the host `INPUT` chain that ufw manages. Enforce rules in `DOCKER-USER`. Upstream's example, appended to `/etc/ufw/after.rules` ([Docker port publishing with UFW](https://docs.openclaw.ai/gateway/security/network-exposure)):

```bash
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

Add a matching policy in `/etc/ufw/after6.rules` if Docker IPv6 is on. Then check from **another machine**, not from the host itself:

```bash
sudo ufw reload
sudo iptables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open    # run from outside
```

Only the ports you meant to expose (usually SSH, 80 and 443) should show up. Curling your own IP from the host tests the bind, not the firewall.

## Who can talk to the agent {#channel-access}

Most real incidents are "someone messaged the bot and the bot did what they asked" ([trust model](https://docs.openclaw.ai/gateway/security/trust-model)). The defaults are good: DMs use `dmPolicy: "pairing"`, and groups use `groupPolicy: "allowlist"`. Keep them, or tighten them:

```json5 title="~/.openclaw/openclaw.json"
{
  session: { dmScope: "per-channel-peer" },
  channels: {
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["123456789"],
      groups: { "*": { requireMention: true } },
    },
    discord: {
      dmPolicy: "pairing",
      guilds: { "123456789012345678": { requireMention: true } },
    },
  },
}
```

- `dmPolicy` is `pairing` (default), `allowlist`, `open` or `disabled`. `open` requires `"*"` in the allowlist, so it can't happen by accident ([access control](https://docs.openclaw.ai/gateway/security/access-control)).
- Approve pairing requests with `openclaw pairing list <channel>` and `openclaw pairing approve <channel> <code>`. Approvals are stored in `~/.openclaw/credentials/<channel>-allowFrom.json`.
- `groups` sets per-group defaults and acts as a group allowlist. Use `groupPolicy: "allowlist"` plus `groupAllowFrom` to limit who can trigger the bot inside a group.
- `session.dmScope: "per-channel-peer"` gives each sender their own DM context. The default `main` shares one session across all DMs, which is fine only when you are the only person who DMs the bot.
- Use stable IDs, not display names, in allowlists. The `dangerouslyAllowNameMatching` flags turn on name matching; leave them off.
- Supplemental context (quotes, thread history) is controlled separately by `contextVisibility`.
- Run the bot on its own phone number for WhatsApp, Signal and Telegram ([hardened baseline](https://docs.openclaw.ai/gateway/security/hardened-baseline)).

## Exec approvals and tool policy {#exec-approvals}

By default, host `exec` runs **without asking**. `tools.exec.mode` resolves to `full` on the Gateway and node hosts ([exec approvals](https://docs.openclaw.ai/tools/exec-approvals)). That is intentional for a single trusted operator, but it means a successful prompt injection can run shell commands as your user.

| `tools.exec.mode` | Behaviour |
|---|---|
| `deny` | No host exec at all. |
| `allowlist` | Only allowlisted commands; misses are silently denied. |
| `ask` | Allowlisted commands run; a human approves everything else. |
| `auto` | Like `ask`, but an automatic reviewer allows, denies or escalates misses. Upstream's recommendation for coding agents. |
| `full` | No ordinary prompts (default on gateway/node hosts). |

Source: [permission modes](https://docs.openclaw.ai/tools/permission-modes).

```bash
openclaw config set tools.exec.mode ask
openclaw approvals get        # requested policy, host approvals file, effective result
openclaw gateway restart
openclaw exec-policy show
```

The effective policy is the **stricter** of `tools.exec.*` in `openclaw.json` and the host-local approvals file. If prompts don't behave as you expect, check both. A fuller set of guardrails:

```json5 title="~/.openclaw/openclaw.json"
{
  tools: {
    exec: { mode: "ask", strictInlineEval: true, applyPatch: { workspaceOnly: true } },
    elevated: { enabled: false },
    fs: { workspaceOnly: true },
    sessions: { visibility: "agent" },
    agentToAgent: { enabled: false },
  },
}
```

- `strictInlineEval` makes recognized inline-eval forms such as `python -c` and `node -e` need reviewer or human approval, even under `full`.
- `tools.elevated` is the escape hatch that runs exec outside the sandbox. Keep it off unless you need it ([elevated mode](https://docs.openclaw.ai/tools/elevated)).
- `tools.fs.workspaceOnly` keeps file tools inside the workspace. Exec can still reach the rest of the filesystem, which is why the sandbox matters.
- `sessions.visibility` and `agentToAgent` default to Gateway-wide reach. Narrow them when agents have different trust levels.

For an agent that only chats and should never touch the host, upstream's 60-second baseline denies whole tool groups:

```json5 title="~/.openclaw/openclaw.json"
{
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    exec: { mode: "deny" },
    elevated: { enabled: false },
  },
}
```

Allowlists and approvals are guardrails for operator intent, not a sandbox. Upstream says they don't model every interpreter path. Text blocklists such as "block `rm -rf`" are not a security boundary either ([SECURITY.md](https://github.com/openclaw/openclaw/blob/main/SECURITY.md)). Pair them with the sandbox for anything that reads untrusted input.

## Sandboxing {#sandboxing}

The sandbox is **off by default** (`agents.defaults.sandbox.mode: "off"`). Turning it on moves tool execution into a container; the Gateway itself stays on the host ([sandboxing](https://docs.openclaw.ai/gateway/sandboxing)).

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      sandbox: { mode: "non-main", scope: "session", workspaceAccess: "none" },
    },
  },
}
```

- `non-main` sandboxes every session except the agent's main session, so group and channel sessions always run sandboxed. `all` sandboxes everything ([modes, scope and backend](https://docs.openclaw.ai/gateway/sandboxing/modes-scope-and-backend)).
- `workspaceAccess` is `none`, `ro` or `rw`.
- Docker backend defaults: `network: "none"` (no egress), `readOnlyRoot: true`, `capDrop: ["ALL"]`, image `openclaw-sandbox:bookworm-slim` ([Docker backend](https://docs.openclaw.ai/gateway/sandboxing/docker-backend)). Build that image first. OpenClaw fails fast rather than fall back to a plain image ([images and setup](https://docs.openclaw.ai/gateway/sandboxing/images-and-setup)).
- Inspect the result with `openclaw sandbox explain`. After a config change, run `openclaw sandbox recreate --all`.
- Tool deny lists apply before the sandbox; sandboxing never brings back a denied tool. `tools.elevated` bypasses the sandbox.
- Skill secrets (`skills.entries.*.env`, `apiKey`) are injected into the **host** process, not the sandbox.
- When delegated work must stay sandboxed, call `sessions_spawn` with `sandbox: "require"`.

Per-agent overrides go under `agents.entries.<id>`. For example, a family-facing agent can be fully sandboxed with no shell or file tools:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    entries: {
      family: {
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: { deny: ["group:runtime", "group:fs"], exec: { mode: "deny" } },
      },
    },
  },
}
```

Upstream says the sandbox "is not a perfect security boundary" but "materially limits filesystem and process access". Code Mode's default `node` executor uses `node:vm`, which is **not** a security boundary. Select `tools.codeMode.executor: "quickjs"` if you use Code Mode with untrusted input ([SECURITY.md, Code Mode executors](https://github.com/openclaw/openclaw/blob/main/SECURITY.md)).

## Workspace files: SOUL.md, AGENTS.md, MEMORY.md {#soulmd-protection}

Bootstrap and memory files live in the workspace, by default `~/.openclaw/workspace/` (`SOUL.md`, `AGENTS.md`, `MEMORY.md`, `memory/*.md`). Upstream treats them as trusted operator state: anyone who can edit them is already inside the trust boundary ([SECURITY.md, workspace memory trust boundary](https://github.com/openclaw/openclaw/blob/main/SECURITY.md)). The practical risk is an agent rewriting its own instructions after a prompt injection.

- **`chmod 444` does not stop the agent.** It runs as the file's owner, so exec can `chmod` the file back, and an atomic write-via-rename replaces a read-only file whenever the directory is writable. The real controls are the sandbox (`workspaceAccess: "ro"` or `"none"`), `tools.fs.workspaceOnly`, and exec approvals.
- To track changes, put the **workspace** under git. Don't put `~/.openclaw` itself under git: `openclaw.json` and `credentials/` hold secrets.
- Look for hidden characters after an incident. This matches zero-width and word-joiner characters in UTF-8:

  ```bash
  grep -rnP '[\x{200B}-\x{200D}\x{2060}\x{FEFF}]' ~/.openclaw/workspace/
  ```

## Secrets {#secrets}

Assume anything under `~/.openclaw/` can contain secrets ([secrets, storage and logs](https://docs.openclaw.ai/gateway/security/secrets-and-storage)):

| Path | Contents |
|---|---|
| `openclaw.json` | Gateway and remote tokens, provider settings, allowlists |
| `.env` | Global environment file (`$OPENCLAW_STATE_DIR/.env`) |
| `credentials/` | Channel credentials (for example WhatsApp), pairing allowlists, legacy OAuth imports |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Model auth profiles, session rows and transcripts |
| `state/openclaw.sqlite` | MCP OAuth tokens and other shared state |
| `secrets.json` | Optional payload for `file` SecretRef providers |

- Keep `~/.openclaw` at `700` and files at `600`. `openclaw security audit --fix` does this. Use full-disk encryption, and run the Gateway under a dedicated OS user on shared hosts.
- The global env file is **`~/.openclaw/.env`**, with a leading dot. A file named `~/.openclaw/env` is never loaded. Provider keys and any `OPENCLAW_*` variable are **blocked** from workspace `.env` files, so a cloned repo can't redirect your credentials.
- Plaintext in `openclaw.json` or `.env` stays **readable by the agent**. SecretRefs (`env`, `file`, `exec` and `store` sources) reduce that exposure once every credential is migrated ([secrets management](https://docs.openclaw.ai/gateway/secrets), [SecretRef contract](https://docs.openclaw.ai/gateway/secrets/secretref-contract)). Exec providers cover 1Password, Bitwarden, Vault, `pass` and `sops`.

```json5 title="~/.openclaw/openclaw.json"
{
  secrets: {
    providers: {
      filemain: { source: "file", path: "~/.openclaw/secrets.json", mode: "json" },
    },
  },
  channels: {
    telegram: {
      botToken: { source: "file", provider: "filemain", id: "/telegram/botToken" },
    },
  },
}
```

```bash
openclaw secrets audit --check     # non-zero exit while plaintext or unresolved refs remain
openclaw secrets configure         # interactive migration helper
```

Give the agent its own scoped, short-lived credentials: a read-only GitHub token, a separate email account, a bot number. Don't hand it your personal ones. File logs are written raw with `0600` permissions; add `logging.redactPatterns` for your own token formats, and share `openclaw status --all` (redacted) rather than raw logs.

## Skills and plugins {#supply-chain}

These run with real authority, so review them like code.

**Plugins** load in-process with the Gateway and are trusted code with the Gateway's OS privileges. There are no plugin sandbox levels ([SECURITY.md, plugin trust boundary](https://github.com/openclaw/openclaw/blob/main/SECURITY.md)). Pin the set you trust with `plugins.allow` (ids must be installed; Discord and WhatsApp, for example, are external plugins installed with `openclaw plugins install @openclaw/discord`):

```json5 title="~/.openclaw/openclaw.json"
{
  plugins: { allow: ["telegram", "discord"] },
}
```

How `openclaw plugins install` resolves names ([install plugins](https://docs.openclaw.ai/cli/plugins/install)):

- Package names, including `@openclaw/*`, scoped names and `name@version`, install from **ClawHub by default**, with no fallback to npm.
- Bare official plugin ids such as `discord` follow the official catalog.
- `npm:<package>` installs from npm, explicitly. Add `--pin` to record the exact resolved version.
- Arbitrary npm, git, local or marketplace sources warn and ask first. Non-interactive installs need `--force`. `--force` does not bypass `security.installPolicy`.
- Check what you have with `openclaw plugins list`, `openclaw plugins inspect <id>` and `openclaw plugins doctor`. Remove with `openclaw plugins uninstall <id>`.

**Skills** are directories with a `SKILL.md`. Upstream says to treat third-party skills as untrusted code ([skills: security](https://docs.openclaw.ai/tools/skills)). Before installing:

```bash
openclaw skills verify @owner/<slug>          # ClawHub trust envelope, scanner results
openclaw skills verify @owner/<slug> --card   # human-readable Skill Card
openclaw skills install @owner/<slug> --version <version>
openclaw skills check
```

Avoid `--force-install`: it installs a pending GitHub-backed skill **before** ClawHub's scan finishes. `skills-sh:`, `git:` and local installs are marked **Not scanned by ClawHub**. The review workflow is on [Skill Verification](/security/skill-verification).

For a hard gate on every skill and plugin install path, use `security.installPolicy`. It runs a trusted local command that can block the install ([operator install policy](https://docs.openclaw.ai/tools/skills-config)):

```json5 title="~/.openclaw/openclaw.json"
{
  security: {
    installPolicy: {
      enabled: true,
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

With `enabled: true` and no working command, installs are blocked. If you don't want ClawHub installs at all, a policy that always blocks does that. `skills.allowBundled` limits which **bundled** skills are eligible.

**MCP servers** run as configured processes or remote endpoints. Limit what each one exposes with `mcp.servers.<name>.toolFilter.include` / `exclude` ([MCP](https://docs.openclaw.ai/tools/mcp)). Prefer servers maintained by the service's own vendor: `@modelcontextprotocol/server-github` and `server-postgres`, for example, are marked "no longer supported" on npm.

## Prompt injection {#prompt-injection}

Assume the model can be manipulated. Upstream treats prompt injection by itself as out of scope for vulnerability reports; the boundaries are auth, tool policy, approvals and the sandbox ([prompt injection](https://docs.openclaw.ai/gateway/security/prompt-injection)). In practice:

- Use a strong, current model tier for any agent with tools or that reads hooks, email or web pages. Weaker tiers are easier to inject.
- Keep `hooks.gmail.allowUnsafeExternalContent` and `hooks.mappings[].allowUnsafeExternalContent` off.
- Keep the browser SSRF policy strict. It is strict by default; `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` opens your LAN to the browser tool ([browser control](https://docs.openclaw.ai/gateway/security/browser-control)).
- Give agents that read untrusted content the `messaging` profile, a sandbox, and no exec.

## Monitoring {#monitoring}

There is no `~/.openclaw/logs/audit.log`. The real sources:

```bash
openclaw logs --follow                      # Gateway file log, default /tmp/openclaw/openclaw-YYYY-MM-DD.log
openclaw audit --kind tool_action --limit 50
openclaw transcripts list
openclaw transcripts show <session>
openclaw status --all                       # redacted, pasteable
```

The audit ledger (`logging.audit.enabled`, on by default) lives in the shared state database and is **metadata-only**. It records which agent ran, which tool actions ran, and their outcomes. It never stores prompts, message bodies, tool arguments, URLs or command output ([audit history](https://docs.openclaw.ai/gateway/audit)). If you need content-level logs, the transcripts are the record, so protect them like the database they live in. `openclaw security audit` flags insecure flags under `config.insecure_or_dangerous_flags`; re-run it on a schedule.

## Incident response {#incident-response}

Based on upstream [operator incident response](https://docs.openclaw.ai/gateway/security/operator-incident-response).

**1. Contain**

```bash
openclaw gateway stop
```

If the macOS app supervises the Gateway, quit the app. Before starting again, set `gateway.bind: "loopback"`, turn off Tailscale Serve or Funnel, switch risky channels to `dmPolicy: "disabled"`, and remove any `"*"` allowlist entries.

**2. Rotate the Gateway secret properly.** Exporting a new shell variable does nothing to a running Gateway. Change the configured secret, then prove the old one is dead:

```bash
openclaw config set gateway.auth.token "$(openssl rand -hex 32)"
openclaw gateway restart
openclaw gateway auth-token --show            # copy to your clients
openclaw gateway probe --token <old-token>    # should now report an auth failure
```

If the token comes from `OPENCLAW_GATEWAY_TOKEN`, a SecretRef or `.env`, change it at that source and restart. Changes to process environment only apply after a restart. Then update `gateway.remote.token` on every client machine. Use `gateway.auth.password` and `OPENCLAW_GATEWAY_PASSWORD` the same way in password mode.

**3. Revoke paired devices you don't recognise.** Paired devices hold their own device tokens:

```bash
openclaw devices list
openclaw devices remove <deviceId>
```

**4. Rotate everything the agent could reach:** model API keys (in the per-agent SQLite auth store), channel tokens (Slack, Discord, Telegram), WhatsApp credentials, `hooks.token`, MCP OAuth sessions (`openclaw mcp logout <server>`), and any cloud or SSH keys on the host.

**5. Review**

- `openclaw logs` and `openclaw audit` for the time window.
- The transcripts of the affected sessions.
- Config changes that widened access: `gateway.bind`, `gateway.auth`, DM and group policies, `tools.elevated`, `tools.exec.mode`, plugins.
- Recently installed skills and plugins. Remove ClawHub skills with `clawhub uninstall @owner/<slug>` (`npm i -g clawhub` first). Remove plugins with `openclaw plugins uninstall <id>`.
- Workspace files (`SOUL.md`, `AGENTS.md`, `MEMORY.md`) and scheduled jobs (`openclaw cron list`) for persistence.
- To drop the derived memory index without deleting sessions: `openclaw memory reset --agent <id> --yes`.

**6. Verify and report.** Re-run `openclaw security audit --deep` until no critical findings remain, and scan from outside with `nmap`. Report OpenClaw bugs through a private [GitHub Security Advisory](https://github.com/openclaw/openclaw/security/advisories/new) or `security@openclaw.ai`, and ClawHub issues to [openclaw/clawhub](https://github.com/openclaw/clawhub). Include the timestamp, OS, OpenClaw version, redacted transcript and log tail, and whether the Gateway was exposed beyond loopback.

## Isolating people and agents {#isolation}

- Agents in one Gateway share one trust boundary. Session ownership, visibility and named operator roles are guardrails, not tenant isolation ([SECURITY.md, shared agents](https://github.com/openclaw/openclaw/blob/main/SECURITY.md)).
- For real isolation, run another Gateway under another OS user, or on another host. On one machine, use profiles with base ports at least 120 apart ([multiple gateways](https://docs.openclaw.ai/gateway/multiple-gateways)):

  ```bash
  openclaw --profile work onboard
  openclaw --profile work gateway install --port 19789
  ```

- Inside one Gateway, give each agent the least it needs with `agents.entries.<id>.tools` and `agents.entries.<id>.sandbox` ([tool and agent permissions](https://docs.openclaw.ai/gateway/security/tool-permissions)).

## Further reading

- Upstream: [Security](https://docs.openclaw.ai/gateway/security) · [Hardened baselines](https://docs.openclaw.ai/gateway/security/hardened-baseline) · [Network exposure](https://docs.openclaw.ai/gateway/security/network-exposure) · [Exposure runbook](https://docs.openclaw.ai/gateway/security/exposure-runbook) · [Rate limiting](https://docs.openclaw.ai/gateway/security/rate-limiting) · [Threat model (MITRE ATLAS)](https://docs.openclaw.ai/security/THREAT-MODEL-ATLAS)
- On this site: [Security Overview](/security/overview) · [Known Vulnerabilities](/security/known-vulnerabilities) · [Skill Verification](/security/skill-verification) · [Privacy & Compliance](/guides/privacy-compliance)
