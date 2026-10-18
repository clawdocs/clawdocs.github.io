---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Custom Channels
description: Build a channel plugin for OpenClaw with the real plugin SDK (openclaw/plugin-sdk/channel-core) — package layout, manifest, a minimal channel object, a signed inbound webhook, testing and publishing
keywords: [openclaw, openclaw custom channel, channel plugin, plugin sdk, createChatChannelPlugin, defineChannelPluginEntry]
---

# Custom Channels

OpenClaw 2026.10.4 supports 31 chat channels plus WebChat (see [Channels](/guides/channels)). If your platform is not among them, you can write a **channel plugin**. This page gives a minimal skeleton and points to the upstream reference for the rest.

The authoritative guide is [Building channel plugins](https://docs.openclaw.ai/plugins/sdk-channel-plugins). The SDK moves quickly (several subpaths were removed in 2026.8 to 2026.10), so check it before you start.

---

## Do You Need a Channel Plugin?

Often you do not. Check these first:

| You want to... | Use |
|----------------|-----|
| Use a platform someone already supports | `openclaw channels list --all`, `openclaw plugins search <name>`, or [clawhub.ai](https://clawhub.ai) |
| Let your app, CI or Home Assistant send the agent a task | [Webhooks (`/hooks/agent`)](/guides/api-webhooks), no plugin needed |
| Build your own chat UI or client | The [Gateway WebSocket protocol](/reference/gateway-api#websocket-protocol-v4) and `@openclaw/gateway-client` |
| Let another MCP client read and send through your existing channels | `openclaw mcp serve` |
| React to or rewrite messages on existing channels | A plugin with [hooks](#hooks-instead-of-a-channel) |

Build a channel plugin when you need a two-way conversation surface: senders, DM policy and pairing, sessions per conversation, and replies delivered back to a platform.

---

## What a Channel Plugin Owns

Core provides one shared `message` tool, the prompt wiring, the session-key shape, thread bookkeeping and dispatch. Your plugin does **not** implement send, edit or react tools. It supplies:

- **Config**: how accounts are listed, resolved and inspected
- **Security**: DM policy and allowlists
- **Pairing**: how a pairing code reaches an unknown sender
- **Outbound**: sending text and media to the platform
- **Threading**: how replies attach to messages
- **Inbound**: receiving platform events and handing them to OpenClaw

Plugins run in-process with the Gateway and have the same privileges. Treat third-party channel plugins like any other code you run as yourself.

---

## Package Layout

```text
openclaw-acme-chat/
├── package.json              # openclaw.extensions, setupEntry, channel metadata
├── openclaw.plugin.json      # manifest: channels + channelConfigs schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry (light load during setup)
└── src/
    ├── channel.ts            # createChatChannelPlugin
    ├── channel.test.ts
    └── client.ts             # your platform API client
```

### package.json

```json title="package.json"
{
  "name": "@myorg/openclaw-acme-chat",
  "version": "1.0.0",
  "type": "module",
  "peerDependencies": { "openclaw": ">=2026.10.4" },
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "acme-chat",
      "label": "Acme Chat",
      "blurb": "Connect OpenClaw to Acme Chat."
    }
  }
}
```

For a published package, point `extensions` and `setupEntry` at built JavaScript (`./dist/index.js`) and make sure `npm pack` includes `dist/`. TypeScript entries only work from source checkouts and local paths.

### openclaw.plugin.json

The `channels` array is what marks a plugin as owning a channel (there is no `kind` or `type` field). `channelConfigs.<id>.schema` validates `channels.<id>` in the user's config, so every key your channel accepts must be declared here.

```json title="openclaw.plugin.json"
{
  "id": "acme-chat",
  "channels": ["acme-chat"],
  "name": "Acme Chat",
  "description": "Acme Chat channel plugin",
  "configSchema": { "type": "object", "additionalProperties": false, "properties": {} },
  "channelConfigs": {
    "acme-chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "enabled": { "type": "boolean" },
          "token": { "type": "string" },
          "webhookSecret": { "type": "string" },
          "dmPolicy": { "type": "string", "enum": ["pairing", "allowlist", "open", "disabled"] },
          "allowFrom": { "type": "array", "items": { "type": "string" } }
        }
      },
      "uiHints": {
        "token": { "label": "Bot token", "sensitive": true },
        "webhookSecret": { "label": "Webhook signing secret", "sensitive": true }
      }
    }
  }
}
```

`configSchema` is for plugin-wide settings under `plugins.entries.acme-chat.config`; channel account settings go in `channelConfigs`. Reference: [Plugin manifest](https://docs.openclaw.ai/plugins/manifest).

---

## The Channel Object

Start with `id`, `config` and `setup`, then add security, pairing, threading and outbound. This follows the upstream walkthrough:

```typescript title="src/channel.ts"
import {
  createChatChannelPlugin,
  createChannelPluginBase,
} from "openclaw/plugin-sdk/channel-core";
import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
import { acmeChatApi } from "./client.js";

type ResolvedAccount = {
  accountId: string | null;
  token: string;
  allowFrom: string[];
  dmPolicy: string | undefined;
};

function section(cfg: OpenClawConfig) {
  return (cfg.channels as Record<string, any>)?.["acme-chat"];
}

function resolveAccount(cfg: OpenClawConfig, accountId?: string | null): ResolvedAccount {
  const s = section(cfg);
  if (!s?.token) throw new Error("acme-chat: token is required");
  return {
    accountId: accountId ?? null,
    token: s.token,
    allowFrom: s.allowFrom ?? [],
    dmPolicy: s.dmPolicy,
  };
}

export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
  base: createChannelPluginBase({
    id: "acme-chat",
    config: {
      listAccountIds: () => ["default"],
      resolveAccount,
      // Synchronous, read-only, must not resolve secrets.
      inspectAccount(cfg) {
        const s = section(cfg);
        return {
          enabled: s?.enabled !== false && Boolean(s?.token),
          configured: Boolean(s?.token),
          tokenStatus: s?.token ? "available" : "missing",
        };
      },
    },
    setup: {
      applyAccountConfig: ({ cfg, input }) => ({
        ...cfg,
        channels: { ...cfg.channels, "acme-chat": { ...section(cfg), ...input } },
      }),
    },
  }),

  security: {
    dm: {
      channelKey: "acme-chat",
      resolvePolicy: (account) => account.dmPolicy,
      resolveAllowFrom: (account) => account.allowFrom,
      defaultPolicy: "pairing",
    },
  },

  pairing: {
    text: {
      idLabel: "Acme Chat username",
      message: "Send this code to verify your identity:",
      notify: async ({ target, code }) => {
        await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
      },
    },
  },

  threading: { topLevelReplyToMode: "reply" },

  outbound: {
    attachedResults: {
      channel: "acme-chat",
      sendText: async (params) => {
        const result = await acmeChatApi.sendMessage(params.to, params.text);
        return { messageId: result.id };
      },
    },
    base: {
      sendMedia: async (params) => {
        await acmeChatApi.sendFile(params.to, params.filePath);
      },
    },
  },
});
```

`createChatChannelPlugin` defaults to direct messages only. Declare `capabilities.chatTypes` if your platform has groups, and `capabilities.reactions` if it supports reactions. If account resolution reads stored credentials, add the async variants (`config.resolveAccountAsync` and friends) described upstream.

### Entry points

```typescript title="index.ts"
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { acmeChatPlugin } from "./src/channel.js";
import { registerInbound } from "./src/inbound.js";

export default defineChannelPluginEntry({
  id: "acme-chat",
  name: "Acme Chat",
  description: "Acme Chat channel plugin",
  plugin: acmeChatPlugin,
  registerFull(api) {
    registerInbound(api);
  },
});
```

```typescript title="setup-entry.ts"
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { acmeChatPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(acmeChatPlugin);
```

OpenClaw loads the setup entry while the channel is disabled or unconfigured, so keep it free of heavy runtime imports. Put runtime-only work in `registerFull`. If you register Gateway RPC methods, give them a plugin-specific prefix.

---

## Receiving Messages Safely

Register inbound webhooks **on the Gateway** with `api.registerHttpRoute`. Do not start your own Express server: a separate `listen()` binds outside Gateway auth and TLS and, by default, on every interface.

With `auth: "plugin"` you verify requests yourself. Sign the **raw body**, not re-serialized JSON, compare in constant time after checking lengths, and reject stale timestamps:

```typescript title="src/inbound.ts"
import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

const MAX_BODY = 1_000_000;      // 1 MB
const MAX_SKEW_SECONDS = 300;    // replay window

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("body too large");
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

function validSignature(secret: string, ts: string, raw: Buffer, header: string): boolean {
  const expected = createHmac("sha256", secret).update(`${ts}.`).update(raw).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(header, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function registerInbound(api: any) {
  api.registerHttpRoute({
    path: "/acme-chat/webhook",
    auth: "plugin",
    handler: async (req, res) => {
      const secret = api.config?.channels?.["acme-chat"]?.webhookSecret;
      const ts = String(req.headers["x-acme-timestamp"] ?? "");
      const sig = String(req.headers["x-acme-signature"] ?? "");
      const age = Math.abs(Date.now() / 1000 - Number(ts));

      let raw: Buffer;
      try {
        raw = await readRawBody(req);
      } catch {
        res.statusCode = 413;
        res.end();
        return true;
      }
      if (!secret || !Number.isFinite(age) || age > MAX_SKEW_SECONDS || !validSignature(secret, ts, raw, sig)) {
        res.statusCode = 401;
        res.end();
        return true;
      }

      const event = JSON.parse(raw.toString("utf8"));
      await handleAcmeChatInbound(api, event);   // your inbound pipeline, see below
      res.statusCode = 200;
      res.end("ok");
      return true;
    },
  });
}
```

The header names and signing scheme are whatever your platform uses; the pattern is what matters. How `api.config` is read, and the full `api` type, are in [Plugin entry points](https://docs.openclaw.ai/plugins/sdk-entrypoints).

`handleAcmeChatInbound` is where the event becomes an OpenClaw turn. That pipeline is channel-specific and is the part most worth copying from a real plugin: upstream points at the Microsoft Teams (`extensions/msteams`) and Google Chat (`extensions/googlechat`) plugins. The helpers live in `openclaw/plugin-sdk/channel-inbound` (`runChannelInboundEvent`, `dispatchChannelInboundReply`, and `dispatchInboundDirectDm` for DM-only channels). See [Channel inbound API](https://docs.openclaw.ai/plugins/sdk-channel-inbound) and [Channel ingress](https://docs.openclaw.ai/plugins/sdk-channel-ingress).

Platforms that push over WebSocket or need polling run that client from `registerFull` instead of an HTTP route. Either way, keep the plugin's DM policy defaulting to `pairing`.

---

## Configure and Test Locally

Once installed, the channel takes config under its id. The keys are the ones your manifest declares:

{/* snippet:skip: channels.acme-chat validates only after the example plugin is installed */}
```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    "acme-chat": {
      enabled: true,
      token: "${ACME_CHAT_TOKEN}",
      webhookSecret: "${ACME_CHAT_WEBHOOK_SECRET}",
      dmPolicy: "pairing",
    },
  },
}
```

Install from a local path while developing, then test the shape users will get from a packed tarball:

```bash
openclaw plugins install --link ./openclaw-acme-chat --force   # --force acknowledges a local source
openclaw plugins validate --root ./openclaw-acme-chat
openclaw plugins inspect acme-chat --runtime --json

npm pack --pack-destination /tmp
openclaw plugins install npm-pack:/tmp/myorg-openclaw-acme-chat-1.0.0.tgz --force

openclaw channels status --probe
openclaw channels logs --channel acme-chat
```

Runtime imports must be in `dependencies`, not only `devDependencies`, or the managed install will miss them.

Write colocated unit tests against `config.resolveAccount` and `config.inspectAccount` (vitest in the upstream examples). Shared helpers: [Plugin testing](https://docs.openclaw.ai/plugins/sdk-testing).

### Route the channel to an agent

To send the new channel to a dedicated agent, add a binding:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    entries: {
      main: {},
      support: { workspace: "~/.openclaw/workspace-support" },
    },
  },
  bindings: [{ agentId: "support", match: { channel: "telegram", accountId: "support" } }],
}
```

Replace `telegram` with your channel id once the plugin is installed. Reference: [Multi-agent routing](https://docs.openclaw.ai/concepts/multi-agent).

---

## Publishing

Publishing uses the separate `clawhub` CLI:

```bash
npm i -g clawhub
clawhub login
clawhub package publish myorg/openclaw-acme-chat --dry-run
clawhub package publish myorg/openclaw-acme-chat
```

The argument is a GitHub `owner/repo[@ref]`, a URL, or a local package folder such as `.`.

Users then install it with `openclaw plugins install clawhub:myorg/openclaw-acme-chat` (ClawHub) or `openclaw plugins install @myorg/openclaw-acme-chat` (npm). In 2026.10.4 a bare package spec installs from npm, so the `clawhub:` prefix is required for ClawHub. Name packages `@<scope>/openclaw-<name>`; the `@openclaw/` scope belongs to the OpenClaw project. Reference: [Building plugins](https://docs.openclaw.ai/plugins/building-plugins).

---

## Hooks Instead of a Channel

If you only need to observe or change traffic on existing channels, a plain plugin with hooks is simpler than a channel:

```typescript title="index.ts"
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "urgent-forwarder",
  name: "Urgent forwarder",
  description: "Watch inbound messages and adjust outgoing ones.",
  register(api) {
    api.on("message_received", async (event) => {
      // inspect event; channel envelopes are plaintext here, treat them as untrusted
    });
    api.on("message_sending", async (event) => {
      // return rewritten content, or cancel the send
    });
  },
});
```

The hook names and their merge rules are in [Plugin hooks](https://docs.openclaw.ai/plugins/hooks). For "when X arrives, do Y" logic that the model should decide, a skill (a folder with a `SKILL.md`) is often enough; see [Skill Development](/guides/skill-development).

---

## See Also

- [Channels & Integrations](/guides/channels): built-in channels, pairing and group policy
- [API & Webhooks](/guides/api-webhooks): `/hooks/agent`
- [Gateway API](/reference/gateway-api): the WebSocket protocol
- [Plugin System](/guides/plugin-system): plugin basics
- [Security Hardening](/security/hardening): what an in-process plugin can reach
- Upstream: [Building channel plugins](https://docs.openclaw.ai/plugins/sdk-channel-plugins), [Channel outbound API](https://docs.openclaw.ai/plugins/sdk-channel-outbound)
