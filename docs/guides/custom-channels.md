---
sidebar_position: 10
title: Custom Channels
description: Build custom channel adapters for OpenClaw — connect your agent to any messaging platform, webhook, or API
---

# Custom Channels

OpenClaw ships with 50+ channel adapters — Telegram, Discord, Slack, Matrix, and many more. But sometimes you need to connect to a platform that isn't supported, or build a custom ingress for your own application.

This guide covers how channels work, how to build your own, and how to publish them for the community.

:::tip
Before building a custom channel, check if one already exists. Run `openclaw channel list --available` or browse [ClawHub](https://clawhub.com) — someone may have already built what you need.
:::

---

## How Channels Work

### Architecture

Channels are **gateway-level adapters** that translate between an external messaging platform and OpenClaw's internal message format. They live inside the gateway process (port 18789) and share the same brain, memory, and tool access.

```
External Platform          Gateway (port 18789)           Agent
─────────────────    ─────────────────────────────    ───────────
                     ┌──────────────────────────┐
Telegram ──────────► │  Telegram Adapter         │
Discord  ──────────► │  Discord Adapter          │──► Router ──► Brain ──► Hands
Slack    ──────────► │  Slack Adapter            │              (LLM)    (tools)
Your App ──────────► │  Your Custom Adapter      │◄── Response ◄────────────┘
                     └──────────────────────────┘
```

All channels share one gateway process. A single OpenClaw instance can serve Telegram, Discord, and your custom channel simultaneously — same agent, same memory, same skills.

### Message Lifecycle

1. **Receive** — External platform sends a message (WebSocket event, HTTP callback, polling result)
2. **Normalize** — Channel adapter converts it to OpenClaw's internal `ChannelMessage` format
3. **Route** — Gateway router dispatches to the orchestrator
4. **Process** — Brain (LLM) generates a response, optionally calling tools
5. **Reply** — Channel adapter converts the response back to the platform's format and sends it

---

## Channel Adapter Interface

Every channel adapter implements the `ChannelAdapter` interface:

```typescript
import type { ChannelAdapter, ChannelMessage, ChannelConfig, GatewayContext } from '@openclaw/sdk';

export interface ChannelAdapter {
  /** Unique channel identifier */
  name: string;

  /** Connect to the external platform */
  connect(config: ChannelConfig, context: GatewayContext): Promise<void>;

  /** Disconnect cleanly */
  disconnect(): Promise<void>;

  /** Called when the agent has a response to send */
  sendReply(message: ChannelMessage, reply: string): Promise<void>;

  /** Optional: called on gateway shutdown for cleanup */
  shutdown?(): Promise<void>;

  /** Optional: health check for openclaw channel status */
  healthCheck?(): Promise<{ ok: boolean; detail?: string }>;
}
```

### ChannelMessage Format

The normalized message format that all channels produce:

```typescript
interface ChannelMessage {
  /** Unique message ID from the source platform */
  id: string;

  /** Channel name (matches adapter name) */
  channel: string;

  /** Message text content */
  text: string;

  /** Sender information */
  sender: {
    id: string;
    name: string;
    displayName?: string;
  };

  /** Conversation context */
  conversation: {
    id: string;          // Chat/thread/room ID
    type: 'direct' | 'group';
    title?: string;
  };

  /** Optional attachments */
  attachments?: Array<{
    type: 'image' | 'file' | 'audio' | 'video' | 'link';
    url: string;
    name?: string;
    mimeType?: string;
  }>;

  /** Raw platform-specific data (for advanced use) */
  raw?: unknown;

  /** Timestamp */
  timestamp: number;
}
```

---

## Building a Custom Channel

Let's build a channel adapter that receives messages via HTTP webhook — useful for connecting custom applications, internal tools, or platforms without a dedicated adapter.

### Project Setup

```bash
mkdir openclaw-channel-webhook-custom
cd openclaw-channel-webhook-custom
npm init -y
npm install @openclaw/sdk express
npm install -D typescript @types/express @types/node
npx tsc --init
```

### Implement the Adapter

```typescript title="src/index.ts"
import type {
  ChannelAdapter,
  ChannelMessage,
  ChannelConfig,
  GatewayContext,
} from '@openclaw/sdk';
import express from 'express';
import crypto from 'node:crypto';

interface WebhookChannelConfig extends ChannelConfig {
  port?: number;
  secret: string;
  replyUrl?: string;
}

let server: ReturnType<typeof express> | null = null;
let httpServer: any = null;
let gatewayCtx: GatewayContext;
let channelConfig: WebhookChannelConfig;

const adapter: ChannelAdapter = {
  name: 'webhook-custom',

  async connect(config: WebhookChannelConfig, context: GatewayContext) {
    channelConfig = config;
    gatewayCtx = context;

    const port = config.port ?? 18800;
    server = express();
    server.use(express.json());

    server.post('/message', (req, res) => {
      // Verify HMAC signature
      const signature = req.headers['x-signature'] as string;
      if (!verifySignature(req.body, signature, config.secret)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const message: ChannelMessage = {
        id: req.body.id ?? crypto.randomUUID(),
        channel: 'webhook-custom',
        text: req.body.text,
        sender: {
          id: req.body.sender?.id ?? 'unknown',
          name: req.body.sender?.name ?? 'Webhook User',
        },
        conversation: {
          id: req.body.conversation_id ?? 'default',
          type: req.body.group ? 'group' : 'direct',
        },
        attachments: req.body.attachments,
        raw: req.body,
        timestamp: Date.now(),
      };

      // Forward to gateway
      context.onMessage(message);

      res.json({ accepted: true, id: message.id });
    });

    server.get('/health', (_req, res) => {
      res.json({ ok: true, channel: 'webhook-custom' });
    });

    httpServer = server.listen(port, () => {
      context.log(`webhook-custom listening on port ${port}`);
    });
  },

  async disconnect() {
    if (httpServer) {
      httpServer.close();
      httpServer = null;
    }
  },

  async sendReply(message: ChannelMessage, reply: string) {
    // Option 1: POST reply to a configured callback URL
    if (channelConfig.replyUrl) {
      await fetch(channelConfig.replyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          in_reply_to: message.id,
          conversation_id: message.conversation.id,
          text: reply,
        }),
      });
      return;
    }

    // Option 2: Store for polling (if no callback URL)
    gatewayCtx.storeReply(message.conversation.id, {
      in_reply_to: message.id,
      text: reply,
      timestamp: Date.now(),
    });
  },

  async healthCheck() {
    return { ok: httpServer !== null, detail: 'HTTP server running' };
  },
};

function verifySignature(body: unknown, signature: string, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex'),
  );
}

export default adapter;
```

### Package Manifest

```json title="package.json"
{
  "name": "@yourscope/openclaw-channel-webhook-custom",
  "version": "1.0.0",
  "description": "Custom HTTP webhook channel for OpenClaw",
  "main": "dist/index.js",
  "type": "module",
  "exports": {
    ".": "./dist/index.js"
  },
  "openclaw": {
    "type": "channel",
    "channel": "webhook-custom"
  },
  "peerDependencies": {
    "openclaw": ">=2026.6.0"
  }
}
```

The `openclaw.type` and `openclaw.channel` fields in `package.json` tell the gateway this is a channel adapter and what name to register it under.

### Configure and Test

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "webhook-custom": {
      "enabled": true,
      "port": 18800,
      "secret": "${WEBHOOK_SECRET}",
      "replyUrl": "https://your-app.com/openclaw-reply"
    }
  }
}
```

```bash
# Set the secret
export WEBHOOK_SECRET="your-random-secret-here"

# Restart gateway to load the channel
openclaw gateway restart

# Test with curl
SIGNATURE=$(echo -n '{"text":"Hello from my app","sender":{"id":"user1","name":"Alice"}}' \
  | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $2}')

curl -X POST http://localhost:18800/message \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -d '{"text":"Hello from my app","sender":{"id":"user1","name":"Alice"}}'
```

---

## Built-In Channel Types

### WebSocket Channels

Most chat platforms use WebSocket or long-polling connections. The adapter maintains a persistent connection and receives events in real-time.

**Examples:** Discord (Gateway WebSocket), Slack (Socket Mode), Matrix (sync loop)

```typescript
// Simplified WebSocket channel pattern
async connect(config, context) {
  this.ws = new WebSocket(config.gatewayUrl);

  this.ws.on('message', (data) => {
    const event = JSON.parse(data);
    if (event.type === 'message') {
      context.onMessage(normalize(event));
    }
  });

  this.ws.on('close', () => {
    // Reconnect with exponential backoff
    this.reconnect();
  });
}
```

### Bot Token Channels

Platforms where you register a bot and receive a token for API access. The adapter polls or listens for updates.

**Examples:** Telegram (Bot API with long polling or webhooks), Discord (Bot token), Slack (Bot token + Socket Mode)

```json5 title="Telegram configuration"
{
  "channels": {
    "telegram": {
      "enabled": true,
      "bot_token": "${TELEGRAM_BOT_TOKEN}",
      "allowed_chat_ids": [],
      "polling_interval": 1000
    }
  }
}
```

### OAuth Channels

Platforms requiring OAuth app registration. The adapter handles token exchange and refresh.

**Examples:** Slack (OAuth app), Microsoft Teams (Azure AD), Google Chat (Service account)

### HTTP Callback Channels

Platforms that push events to your server via webhooks. The adapter runs an HTTP server and processes incoming POSTs.

**Examples:** WhatsApp Business API, custom webhooks, CI/CD integrations

### WebChat (Built-In)

OpenClaw includes a built-in web chat interface served by the gateway itself — no additional channel setup needed.

```json5
{
  "channels": {
    "webchat": {
      "enabled": true,
      "title": "My Agent",
      "theme": "dark"
    }
  }
}
```

Access at `http://localhost:18789/chat`. Useful for testing, internal tools, or embedding in web applications via iframe.

---

## Channel Configuration Reference

### Common Fields

Every channel supports these configuration options:

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "telegram": {
      "enabled": true,

      // Access control
      "allowed_users": [],           // Empty = allow all
      "allowed_chat_ids": [],        // Restrict to specific chats
      "blocked_users": [],           // Deny specific users

      // Group behavior
      "require_mention": true,       // Only respond when @mentioned in groups
      "allowed_channels": [],        // Restrict to specific group channels
      "ignore_channels": [],         // Ignore specific channels

      // Rate limiting
      "max_messages_per_hour": 60,   // Per-user rate limit
      "cooldown_seconds": 2,         // Minimum gap between responses

      // Behavior
      "auto_reply": true,            // Respond to every message (DMs)
      "typing_indicator": true,      // Show "typing..." while processing
      "thread_replies": false        // Reply in threads (Slack/Discord)
    }
  }
}
```

### Per-Channel Secrets

Use environment variable expansion for credentials — never hardcode tokens:

```json5
{
  "channels": {
    "discord": {
      "enabled": true,
      "bot_token": "${DISCORD_BOT_TOKEN}"
    },
    "slack": {
      "enabled": true,
      "bot_token": "${SLACK_BOT_TOKEN}",
      "app_token": "${SLACK_APP_TOKEN}"
    }
  }
}
```

---

## CLI Commands

```bash
openclaw channel <subcommand>
```

| Command | What It Does |
|---------|-------------|
| `openclaw channel add <name>` | Interactive setup for a new channel |
| `openclaw channel list` | Show all configured channels and their status |
| `openclaw channel status <name>` | Connection status for a specific channel |
| `openclaw channel remove <name>` | Disconnect and remove a channel |
| `openclaw channel reconnect <name>` | Force reconnect (useful after token refresh) |
| `openclaw logs --filter channel` | View channel-specific log entries |
| `openclaw stats channels` | Usage statistics per channel |

### Quick Setup

```bash
# Add Telegram interactively
openclaw channel add telegram
# Prompts for bot token, allowed chats, etc.

# Check all channels
openclaw channel list

# Something disconnected?
openclaw channel reconnect telegram
```

---

## Multi-Channel Patterns

### Shared Agent, Multiple Channels

The most common setup — one agent personality across all channels:

```json5
{
  "channels": {
    "telegram": { "enabled": true, "bot_token": "${TG_TOKEN}" },
    "discord": { "enabled": true, "bot_token": "${DISCORD_TOKEN}" },
    "webchat": { "enabled": true }
  }
}
```

All channels share the same brain, memory, and skills. A conversation on Telegram and one on Discord are separate threads but the agent remembers context from both.

### Dedicated Agents per Channel

For different personalities or roles per platform:

```json5
{
  "agents": {
    "support-bot": {
      "soul": "You are a friendly support agent.",
      "channels": ["telegram", "webchat"],
      "skills": ["faq", "ticket-create"]
    },
    "dev-bot": {
      "soul": "You are a terse DevOps assistant.",
      "channels": ["slack"],
      "skills": ["deploy", "monitoring", "incident"]
    }
  }
}
```

### Cross-Channel Forwarding

Forward messages between channels using skills:

```markdown title="~/.openclaw/skills/forward-urgent.md"
---
name: forward-urgent
trigger: "urgent:"
tools: [chat]
---

When a message starts with "urgent:", forward it to the Telegram channel
and acknowledge on the originating channel.
```

### Channel-Specific Behavior

Use `require_mention` to control group behavior while keeping DMs responsive:

```json5
{
  "channels": {
    "discord": {
      "enabled": true,
      "bot_token": "${DISCORD_TOKEN}",
      "require_mention": true,       // In servers, only respond to @bot
      "auto_reply": true,            // In DMs, always respond
      "thread_replies": true,        // Keep conversations in threads
      "allowed_roles": ["admin", "developer"]
    }
  }
}
```

---

## Webhook Channels

For integrating with systems that push events via HTTP — CI/CD, monitoring alerts, form submissions, IoT devices.

### Incoming Webhooks

External services POST messages to your agent:

```json5 title="~/.openclaw/openclaw.json"
{
  "webhooks": {
    "incoming": {
      "enabled": true,
      "secret": "${WEBHOOK_SECRET}",
      "endpoints": [
        {
          "path": "/deploy",
          "message": "Deployment event: {{body.status}} for {{body.service}}"
        },
        {
          "path": "/alert",
          "message": "Alert: {{body.title}} — severity {{body.severity}}"
        },
        {
          "path": "/form",
          "message": "New submission from {{body.name}}: {{body.message}}"
        }
      ]
    }
  }
}
```

```bash
# Trigger a webhook
curl -X POST http://localhost:18789/webhook/deploy \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
  -d '{"status": "success", "service": "api-v2", "commit": "abc123"}'
```

The agent receives the templated message and processes it like any other conversation.

### Outgoing Webhooks

Notify external services when events happen:

```json5
{
  "webhooks": {
    "outgoing": [
      {
        "event": "agent.task.completed",
        "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
      },
      {
        "event": "agent.error",
        "url": "https://your-pagerduty-endpoint.com/events"
      },
      {
        "event": "channel.message.received",
        "url": "https://your-app.com/log",
        "filter": { "channel": "telegram" }
      }
    ]
  }
}
```

### HMAC Validation

All incoming webhooks are validated with HMAC-SHA256:

1. Set a `secret` in your webhook config
2. Senders compute `HMAC-SHA256(request_body, secret)` and include it as `X-Webhook-Secret` header
3. Gateway rejects requests with missing or invalid signatures

---

## Channel Hooks (for Plugins)

Plugins can intercept channel messages before and after agent processing. This is different from building a channel — hooks augment existing channels.

```typescript title="Plugin that logs all incoming messages"
import type { PluginContext } from '@openclaw/plugin-sdk';

export async function initialize(context: PluginContext) {
  context.registerHook('channel', 'onMessage', async (message) => {
    console.log(`[${message.channel}] ${message.sender.name}: ${message.text}`);
    // Return the message to continue processing
    // Return null to block the message
    return message;
  });

  context.registerHook('channel', 'onReply', async (message, reply) => {
    console.log(`[${message.channel}] Agent: ${reply}`);
    // Modify reply before sending
    return reply;
  });
}
```

| Hook | When It Fires | Can Modify |
|------|--------------|-----------|
| `onMessage` | Before agent processes incoming | Message text, metadata. Return `null` to drop. |
| `onReply` | After agent generates response | Reply text. Return modified string. |

See the [Plugin System](/guides/plugin-system) guide for full details on building plugins with hooks.

---

## State Management

### Reconnection

Channels should handle disconnections gracefully with exponential backoff:

```typescript
class ReconnectableChannel {
  private retryDelay = 1000;
  private maxDelay = 60000;
  private retryCount = 0;

  async reconnect() {
    while (true) {
      try {
        await this.connect();
        this.retryDelay = 1000;
        this.retryCount = 0;
        return;
      } catch (err) {
        this.retryCount++;
        this.retryDelay = Math.min(this.retryDelay * 2, this.maxDelay);
        await new Promise(r => setTimeout(r, this.retryDelay));
      }
    }
  }
}
```

The built-in channels handle reconnection automatically. Custom channels should implement their own backoff logic.

### Credential Refresh

For OAuth channels, tokens expire. Handle refresh in your adapter:

```typescript
async connect(config, context) {
  this.tokenRefreshTimer = setInterval(async () => {
    if (this.tokenExpiresAt - Date.now() < 300_000) {
      this.token = await refreshOAuthToken(this.refreshToken);
    }
  }, 60_000);
}

async disconnect() {
  clearInterval(this.tokenRefreshTimer);
}
```

---

## Testing

### Local Testing

Test your channel without connecting to production:

```bash
# Start gateway with your channel
openclaw gateway restart

# Check it loaded
openclaw channel status webhook-custom

# Send a test message
curl -X POST http://localhost:18800/message \
  -H "Content-Type: application/json" \
  -H "X-Signature: $(echo -n '{"text":"test"}' | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $2}')" \
  -d '{"text":"test"}'

# Watch logs
openclaw logs --filter channel --follow
```

### Integration Testing

For WebSocket-based channels, use a mock server:

```typescript title="test/mock-platform.ts"
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 9999 });

wss.on('connection', (ws) => {
  // Simulate incoming message after 1 second
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'message',
      text: 'Hello from mock platform',
      user: { id: '123', name: 'Test User' },
    }));
  }, 1000);

  // Log replies
  ws.on('message', (data) => {
    console.log('Agent replied:', JSON.parse(data.toString()));
  });
});
```

### Health Checks

Implement `healthCheck()` so `openclaw channel status` reports accurate state:

```bash
$ openclaw channel status
CHANNEL          STATUS      LATENCY   MESSAGES/HR
telegram         connected   45ms      12
discord          connected   62ms      8
webhook-custom   connected   2ms       34
webchat          listening   —         3
```

---

## Publishing

### To npm

```bash
npm publish --access public
```

Users install with:
```bash
npm install @yourscope/openclaw-channel-webhook-custom
openclaw gateway restart
```

### To ClawHub

```bash
openclaw clawhub publish . --type channel
```

Users install with:
```bash
openclaw channel add webhook-custom  # Finds it on ClawHub
```

### Package Conventions

- Name: `openclaw-channel-<name>` or `@scope/openclaw-channel-<name>`
- Include `openclaw.type: "channel"` in package.json
- Export a default `ChannelAdapter` implementation
- Include a README with configuration examples
- Test on at least Node.js 20+

---

## Security

### Channel-Specific Risks

| Channel Type | Primary Risk | Mitigation |
|-------------|-------------|-----------|
| **Public groups** | Prompt injection from unknown users | `require_mention`, `allowed_users`, rate limits |
| **Webhooks** | Spoofed requests | HMAC validation, IP allowlisting |
| **OAuth** | Token theft or expiry | Secure storage, auto-refresh, `${ENV_VAR}` expansion |
| **WebSocket** | Connection hijacking | TLS, token auth on connect |
| **WebChat** | Open access | Authentication middleware, rate limiting |

### Best Practices

- **Never hardcode tokens** — use `${ENV_VAR}` expansion in config
- **Restrict access** — use `allowed_users`, `allowed_chat_ids`, `allowed_roles`
- **Enable mention-gating** in group channels to avoid responding to everything
- **Rate limit** — set `max_messages_per_hour` to prevent abuse
- **Validate webhooks** — always check HMAC signatures on incoming HTTP
- **Use TLS** — expose webhook endpoints behind HTTPS (use a reverse proxy)
- **Audit regularly** — check `openclaw stats channels` for unusual patterns
- **Rotate credentials** — change bot tokens periodically, especially after team changes

### Privacy by Channel

| Channel | Encryption | Metadata Exposure | Notes |
|---------|-----------|-------------------|-------|
| Signal | E2E | Minimal | Most private option |
| WhatsApp | E2E | Meta collects metadata | Uses reverse-engineered API |
| Telegram | Server-side | Moderate | Not E2E by default |
| Discord | TLS only | High (server logs) | Admins can read all messages |
| Slack | TLS only | High (workspace logs) | Enterprise has full retention |
| Matrix | Optional E2E | Depends on server | Self-hostable, most control |
| WebChat | TLS | You control everything | Best for internal use |

---

## See Also

- [Channels Guide](/guides/channels) — Setup and configuration for all built-in channels
- [Multi-Channel Setup](/guides/first-7-days/day-5-multi-channel) — First 7 Days walkthrough
- [Plugin System](/guides/plugin-system) — Building plugins with channel hooks
- [Automation](/guides/automation) — Webhooks, cron jobs, and CI/CD integration
- [MCP Servers](/guides/mcp-servers) — Protocol-based integrations (different from channels)
- [Security Hardening](/security/hardening) — Protecting your gateway
- [Gateway API](/reference/gateway-api) — WebSocket message protocol reference
