---
sidebar_position: 2
title: Channels & Integrations
description: Connect OpenClaw to WhatsApp, Telegram, Discord, Slack, and 20+ other platforms — setup, configuration, security, and troubleshooting
---

# Channels & Integrations

A **channel** is any messaging platform connected to your OpenClaw gateway. The same agent, same brain, same memory — accessible from WhatsApp on your phone, Discord on your desktop, or Slack during a meeting. Channels are just transport.

As of v2026.6, OpenClaw supports **26 channels** spanning messaging platforms, enterprise tools, and niche services. Since v2026.3.22, most channels are distributed as install-on-demand plugins via ClawHub rather than bundled in core.

---

## Supported Channels

### Messaging Platforms

| Channel | Library | Auth Method | Status | Notes |
|---------|---------|-------------|--------|-------|
| **WhatsApp** | Baileys | QR code scan | Bundled | Unofficial API; ban risk — see [WhatsApp](#whatsapp) |
| **Telegram** | grammY | Bot token | Bundled | Fastest setup — see [Telegram](#telegram) |
| **Discord** | discord.js | Bot token | Bundled | Thread binding, mention gating — see [Discord](#discord) |
| **Slack** | Bolt | Bot + App token | Bundled | Socket Mode or HTTP — see [Slack](#slack) |
| **Signal** | libsignal | Phone number link | Bundled | E2E encrypted, most private |
| **iMessage** | Native | System integration | Bundled | macOS only |
| **WebChat** | Built-in | Gateway URL | Bundled | `http://localhost:18789/chat` |
| **IRC** | irc-framework | Server + nick | Bundled | Multiple networks supported |
| **Matrix** | matrix-js-sdk | Access token | Plugin | Self-hostable, optional E2E |
| **Microsoft Teams** | Bot Framework | Azure AD app | Plugin | Enterprise SSO |
| **Google Chat** | googleapis | Service account | Plugin | Workspace integration |
| **Feishu / Lark** | larksuite SDK | App credentials | Plugin | Chinese/intl enterprise |
| **LINE** | LINE Messaging API | Channel token | Plugin | Popular in Japan/SE Asia |
| **WeChat** | WeChat API | AppID + secret | Plugin | Chinese market |
| **Nostr** | nostr-tools | Private key (nsec) | Plugin | Decentralized protocol |
| **Twitch** | tmi.js | OAuth token | Plugin | Chat integration |
| **Zalo** | Zalo OA API | OA token | Plugin | Vietnam market |
| **QQ Bot** | QQ Bot API | App ID + secret | Plugin | China market |
| **Mattermost** | Mattermost API | Bot token | Plugin | Self-hosted Slack alternative |
| **Nextcloud Talk** | Nextcloud API | App password | Plugin | Self-hosted |
| **Synology Chat** | Synology API | Bot token | Plugin | NAS integration |
| **SMS** | Twilio | Account SID + token | Plugin | Outbound/inbound SMS |
| **Voice Call** | Plivo / Twilio | Account credentials | Plugin | Phone call channel |
| **Tlon / Urbit** | Urbit API | Ship credentials | Plugin | Experimental |

### Service Integrations

| Integration | Capabilities | Connection |
|-------------|-------------|------------|
| **Gmail** | Read, send, search, label emails | OAuth or App Password |
| **GitHub** | Issues, PRs, notifications, code review | Personal Access Token |
| **Spotify** | Playback control, playlist management | OAuth |
| **Obsidian** | Read/write notes, search vault | Local filesystem |
| **Philips Hue** | Smart light control | Bridge API key |
| **Google Calendar** | Event management, scheduling | OAuth |
| **Outlook Calendar** | Event management, scheduling | Azure AD |
| **Twitter/X** | Timeline, search, post | [TweetClaw](#twitterx-with-tweetclaw) plugin |
| **Browser** | Full Chromium automation | Built-in (Playwright) |
| **Home Assistant** | Smart home device control | Long-lived access token |

---

## Quick Setup

```bash
# Add a channel interactively
openclaw channel add telegram
openclaw channel add discord
openclaw channel add whatsapp

# Install a plugin channel first, then add
openclaw plugins install @openclaw/channel-matrix
openclaw channel add matrix
```

Each channel walks you through authentication specific to that platform. For the fastest start, **Telegram** only needs a bot token (2 minutes). WhatsApp requires QR scanning from your phone. Discord and Slack need app/bot creation in their developer portals.

---

## WhatsApp

WhatsApp uses the unofficial **Baileys** library (`@whiskeysockets/baileys`) — a reverse-engineered implementation of the WhatsApp Web protocol. This is not the WhatsApp Business API or Cloud API.

### Setup

```bash
openclaw channel add whatsapp
```

1. A QR code appears in your terminal
2. Open WhatsApp on your phone: **Settings > Linked Devices > Link a Device**
3. Scan the QR code
4. Session credentials are saved to `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`

The gateway owns the WhatsApp socket and handles automatic reconnection. A `.bak` backup of credentials is maintained and restored on corruption.

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "sendReadReceipts": false,
      "mediaMaxMb": 50,
      "dmPolicy": "pairing",
      "allowFrom": [],
      "group": {
        "requireMention": true,
        "senderPolicy": "allowlist",
        "pendingHistoryCount": 50
      }
    }
  }
}
```

### Features

- **Multi-account** — Configure separate accounts (default, personal, biz) with per-account settings
- **Group chats** — Mention gating with regex matching, reply-to-bot detection, allowlist/sender policy
- **Voice notes** — Automatic transcription (shipped v2026.2, PR #9973)
- **Native mentions** — Outbound `@+<digits>` mention metadata (v2026.5, PR #73961)
- **Media** — Images, video, documents, audio up to 50 MB
- **Text chunking** — Long messages split at 4,000 character boundaries
- **Read receipts** — Configurable per account

### Multi-Account Setup

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "whatsapp": {
      "accounts": {
        "default": {
          "sendReadReceipts": false,
          "dmPolicy": "allowlist",
          "allowFrom": ["+1234567890"]
        },
        "personal": {
          "sendReadReceipts": true,
          "dmPolicy": "open",
          "mediaMaxMb": 25
        }
      }
    }
  }
}
```

Migrate from single-account to multi-account: `openclaw doctor --fix`

### Known Issues

:::warning Ban risk
WhatsApp uses an unofficial reverse-engineered API. Meta has banned users for automated usage. Community reports (GitHub issues #4376, #73016) document bans and session instability ("frequent Web connection closed status 408 storms"). Mitigate by:
- Keeping message volume reasonable
- Not sending bulk messages
- Using `sendReadReceipts: false` to reduce API surface
- Having a backup channel (Telegram) configured
:::

---

## Telegram

Telegram is the **fastest channel to set up** — it only needs a bot token from BotFather.

### Setup

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot`, choose a name and username
3. Copy the bot token

```bash
openclaw channel add telegram
# ? Bot token: paste-your-token-here
# ✓ Telegram connected
```

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "${TELEGRAM_BOT_TOKEN}",
      "mode": "polling",
      "dmPolicy": "pairing",
      "group": {
        "requireMention": true
      },
      "proxy": {
        "url": "socks5://proxy:1080"
      }
    }
  }
}
```

### Features

- **Polling or webhook** — Long polling is the default; set `webhookUrl` and `webhookSecret` for webhook mode
- **Self-hosted API** — Point to your own Telegram Bot API server via `apiRoot`
- **Forum topics** — Bind topics to specific agent routing with per-topic configuration
- **Streaming preview** — Responses stream via `sendMessage` + `editMessageText` for real-time output
- **Bot menu commands** — Custom command menu via `commands` config
- **Proxy support** — SOCKS5 and HTTP proxy for restricted networks
- **Retry logic** — 3 attempts, 400-30000ms delay, 0.1 jitter factor
- **Media conversion** — Markdown image syntax is converted to media replies on outbound path
- **Reactions** — Configurable notification modes: off, own, all

### Webhook Mode

For production deployments behind a reverse proxy:

```json5
{
  "channels": {
    "telegram": {
      "mode": "webhook",
      "webhookUrl": "https://yourdomain.com/telegram/webhook",
      "webhookSecret": "${TELEGRAM_WEBHOOK_SECRET}"
    }
  }
}
```

---

## Discord

### Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**, give it a name
3. Go to **Bot** in the sidebar, click **Add Bot**
4. Copy the bot token
5. Under **Privileged Gateway Intents**, enable **Message Content Intent**
6. Go to **OAuth2 > URL Generator**, select `bot` scope and `Send Messages` + `Read Message History` permissions
7. Copy the generated URL and open it to invite the bot to your server

```bash
openclaw channel add discord
# ? Bot token: paste-your-token-here
# ? Default server ID (optional): 123456789
# ? Default channel ID (optional): 987654321
# ✓ Discord connected
```

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "discord": {
      "enabled": true,
      "botToken": "${DISCORD_BOT_TOKEN}",
      "dmPolicy": "pairing",
      "allowedGuildIds": [],
      "allowedChannelIds": [],
      "group": {
        "requireMention": true,
        "mentionPrefix": ["!bot", "/ask"]
      },
      "thread": {
        "enabled": true,
        "historyScope": "thread"
      },
      "reactions": "allowlist",
      "typingIndicator": true
    }
  }
}
```

### Features

- **Thread binding** — Reply in threads with per-thread history isolation and spawn/idle/maxAge controls
- **Mention gating** — Respond only when @mentioned or with custom prefixes
- **Guild/channel restrictions** — Allowlist specific servers and channels
- **Typing indicator** — Show "typing..." while processing
- **Reactions** — Configurable: off, own, allowlist, all
- **Role-based access** — Restrict bot interaction to specific Discord roles

---

## Slack

### Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app
2. Under **OAuth & Permissions**, add bot scopes: `chat:write`, `channels:history`, `groups:history`, `im:history`, `users:read`
3. Install to your workspace
4. Copy the **Bot Token** (`xoxb-...`) and **App Token** (`xapp-...`) for Socket Mode

```bash
openclaw channel add slack
# ? Bot token: xoxb-...
# ? App token: xapp-...
# ✓ Slack connected via Socket Mode
```

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "slack": {
      "enabled": true,
      "botToken": "${SLACK_BOT_TOKEN}",
      "appToken": "${SLACK_APP_TOKEN}",
      "mode": "socket",
      "nativeTransport": true,
      "dmPolicy": "pairing",
      "allowedChannels": ["ask-bot", "dev-ops"],
      "thread": {
        "enabled": true,
        "historyScope": "thread"
      }
    }
  }
}
```

### Connection Modes

| Mode | Requires | Best For |
|------|----------|----------|
| **Socket Mode** | botToken + appToken | Most setups — no public URL needed |
| **HTTP** | botToken + signingSecret | Production behind reverse proxy |

### Features

- **Native streaming** — Enable with `nativeTransport: true` for real-time response streaming
- **Per-thread history** — Thread conversations are isolated with `historyScope: "thread"`
- **Channel restrictions** — Only respond in listed channels
- **Thread replies** — Force responses into threads to reduce noise

---

## Signal

The most private channel — full end-to-end encryption with minimal metadata exposure.

```bash
openclaw channel add signal
```

Link via phone number, similar to Signal Desktop. Follow the on-screen prompts to pair your device. Signal's privacy guarantees mean OpenClaw cannot see metadata about other participants beyond the message content.

---

## iMessage

macOS only — uses native system integration.

```bash
openclaw channel add imessage
```

Requires macOS with Messages.app configured. Works with both iMessage (Apple devices) and SMS (non-Apple) conversations routed through your Mac.

---

## Matrix

Self-hostable, optionally E2E encrypted. Install the plugin first:

```bash
openclaw plugins install @openclaw/channel-matrix
openclaw channel add matrix
# ? Homeserver URL: https://matrix.org
# ? Access token: paste-your-token
```

Matrix is the second-most downloaded channel plugin (13.3k downloads) after WhatsApp (43.1k).

---

## Other Channels

### Microsoft Teams

```bash
openclaw plugins install @openclaw/channel-teams
openclaw channel add teams
```

Requires Azure AD app registration with Bot Framework credentials. Supports enterprise SSO.

### Feishu / Lark

```bash
openclaw plugins install @openclaw/channel-feishu
openclaw channel add feishu
```

Popular in Chinese enterprise environments. The [larksuite/openclaw-lark](https://github.com/larksuite/openclaw-lark) community integration is also available.

### Additional Plugin Channels

Install any plugin channel with:

```bash
openclaw plugins install @openclaw/channel-<name>
openclaw channel add <name>
```

Available: `line`, `wechat`, `nostr`, `twitch`, `zalo`, `qqbot`, `mattermost`, `nextcloud-talk`, `synology-chat`, `sms`, `voice-call`, `tlon`.

---

## Twitter/X with TweetClaw

The base Twitter/X integration is limited. For full automation, use the [TweetClaw](https://github.com/Xquik-dev/tweetclaw) plugin:

```bash
openclaw plugins install @xquik/tweetclaw
```

TweetClaw adds: tweet search, reply search, post tweets, post replies, follower export, user lookup, media upload/download, direct messages, tweet monitors, webhooks, and giveaway draws.

- **Package**: [@xquik/tweetclaw](https://www.npmjs.com/package/@xquik/tweetclaw)
- **ClawHub**: [clawhub.ai/plugins/@xquik/tweetclaw](https://clawhub.ai/plugins/@xquik/tweetclaw)

---

## DM Access Control

Every channel enforces access control for direct messages. Four policies are available:

| Policy | Behavior | Use Case |
|--------|----------|----------|
| **pairing** (default) | Users must enter an 8-character code to pair | Personal use — secure by default |
| **allowlist** | Only pre-approved contacts can DM | Team/family use |
| **open** | Anyone can DM (requires explicit `"*"` wildcard) | Public bots |
| **disabled** | DMs are turned off entirely | Group-only bots |

### Pairing Flow

When `dmPolicy` is `"pairing"`:

1. A new contact sends a message
2. OpenClaw responds: "Send the pairing code to chat with me"
3. The user gets the code from the gateway operator
4. Code is 8 uppercase characters (excluding ambiguous chars: 0, O, 1, I)
5. Codes expire after **1 hour**, max **3 pending** codes per channel

```bash
# Generate a pairing code
openclaw pairing create whatsapp

# List pending codes
openclaw pairing list

# Approve or reject
openclaw pairing approve whatsapp abc12345
openclaw pairing reject whatsapp abc12345
```

### Allowlist

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["+1234567890", "+0987654321"]
    },
    "telegram": {
      "dmPolicy": "allowlist",
      "allowFrom": ["alice_username", "bob_username"]
    },
    "discord": {
      "dmPolicy": "allowlist",
      "allowFrom": ["alice#1234", "bob#5678"]
    }
  }
}
```

WhatsApp uses **E.164-normalized** phone numbers. Allowlists are stored at `~/.openclaw/credentials/<channel>-allowFrom.json`.

:::caution
If no channel config block exists, the default is `allowlist` — which blocks all DMs with a startup warning. Always configure access control explicitly.
:::

---

## Group Chat Configuration

Groups need guard rails to prevent the bot from replying to every message.

### Mention Gating

The most important group setting — the bot only responds when directly mentioned:

```json5
{
  "channels": {
    "discord": {
      "group": {
        "requireMention": true,
        "mentionPrefix": ["!bot", "/ask"]
      }
    },
    "telegram": {
      "group": {
        "requireMention": true
      }
    }
  }
}
```

### Channel Restrictions

Restrict the bot to specific channels within a server:

```json5
{
  "channels": {
    "discord": {
      "allowedChannels": ["bot-chat", "ask-anything"],
      "ignoreChannels": ["off-topic", "memes"]
    },
    "slack": {
      "allowedChannels": ["ask-bot", "dev-ops"]
    }
  }
}
```

### Group Access Policies

| Policy | Behavior |
|--------|----------|
| **allowlist** (default) | Only allowed groups — fail-closed |
| **open** | All groups the bot is in |
| **disabled** | Ignore all group messages |

### Rate Limiting

```json5
{
  "channels": {
    "whatsapp": {
      "maxMessagesPerHour": 30,
      "cooldownSeconds": 5
    }
  }
}
```

### Bot Loop Protection

A shared cross-channel mechanism prevents runaway bot-to-bot conversations using a sliding window budget (default: `maxEventsPerWindow: 20`).

---

## Channel Permissions

Control what OpenClaw can do per channel:

```json5
{
  "channels": {
    "whatsapp": {
      "permissions": {
        "read": true,
        "reply": true,
        "initiate": false,
        "send_media": false
      }
    }
  }
}
```

| Permission | Description |
|-----------|-------------|
| `read` | Process incoming messages |
| `reply` | Respond to messages |
| `initiate` | Start new conversations unprompted |
| `send_media` | Send images, files, audio, video |

---

## Multi-Channel Routing

The same agent can act across platforms — read from one, post to another:

```
You (Telegram): "Forward any Slack messages from my manager to me here"
→ Bot monitors Slack, pushes matching messages to your Telegram DM

You (Discord): "Summarize today's emails and post to #daily-updates on Slack"
→ Bot reads Gmail, compiles summary, posts to Slack channel

You (WhatsApp): "Check Discord for the last message from Alice in #project-alpha"
→ Bot reads from Discord, reports back on WhatsApp
```

Cross-channel routing requires the bot to have appropriate permissions on each platform. It can only read channels it's been added to and post where it has write access.

---

## Channel Security

### Prompt Injection Sanitization

OpenClaw sanitizes incoming messages to defend against prompt injection:

1. **Strips LLM special tokens** — Removes chat-template delimiters from major model families (ChatML `<|im_start|>`, Llama `<|start_header_id|>`, Gemma `<start_of_turn>`, Mistral `[INST]`, Phi, GPT-OSS tokens)
2. **Wraps in boundary markers** — External content is enclosed in `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` with `Source: External` metadata

:::info
This closes tokenizer-layer bypasses but does not replace other hardening measures. See [Security Hardening](/security/hardening) for the full defense stack.
:::

### Credential Storage

Channel credentials are stored per-channel with configurable providers:

| Provider | Syntax | Example |
|----------|--------|---------|
| **Environment variable** | `${ENV_VAR}` | `"botToken": "${DISCORD_BOT_TOKEN}"` |
| **File** | `{"type": "file", "path": "..."}` | Read token from a file |
| **Exec** | `{"type": "exec", "command": "..."}` | Run a command to get token |

SecretRef providers were expanded to channel credentials after v2026.2 (issue #28306). Telegram `tokenFile` rejects symlinks for security.

### Encryption Comparison

| Channel | Encryption | Metadata Exposure | Self-Hostable |
|---------|-----------|-------------------|---------------|
| **Signal** | E2E | Minimal | No |
| **WhatsApp** | E2E | Meta collects metadata | No |
| **Matrix** | Optional E2E | Depends on server | Yes |
| **Telegram** | Server-side TLS | Moderate | Partial (Bot API) |
| **Discord** | TLS only | High (server logs) | No |
| **Slack** | TLS only | High (workspace logs) | No |
| **WebChat** | TLS (local) | You control everything | Yes |
| **IRC** | TLS optional | High | Yes |
| **Nostr** | NIP-44 E2E | Relay sees metadata | Yes |

### Security Checklist

- [ ] Set `dmPolicy` to `pairing` or `allowlist` on every channel
- [ ] Enable `requireMention: true` in all group chats
- [ ] Configure `maxMessagesPerHour` rate limits
- [ ] Store tokens in environment variables, not config files
- [ ] Bind gateway to `127.0.0.1` (never `0.0.0.0`)
- [ ] Enable gateway authentication token
- [ ] Review [Security Hardening](/security/hardening) for full defense stack

---

## Managing Channels

```bash
# List active channels
openclaw channel list

# Check channel status
openclaw channel status whatsapp

# Disconnect a channel
openclaw channel remove telegram

# Reconnect after auth expires
openclaw channel reconnect discord

# Install a plugin channel
openclaw plugins install @openclaw/channel-matrix

# Check available channel plugins
openclaw plugins search channel
```

---

## Plugin Architecture

Since v2026.3.22, channels follow a plugin architecture:

- **Bundled channels** (installed with core): WhatsApp, Telegram, Slack, Discord, Signal, iMessage, WebChat, IRC
- **Plugin channels** (install on demand): Teams, Matrix, Feishu, LINE, WeChat, Nostr, Twitch, Zalo, QQBot, Mattermost, Nextcloud Talk, Synology Chat, SMS, Voice Call, Tlon

Plugin channels are distributed via ClawHub and npm. Install with `openclaw plugins install @openclaw/channel-<name>`.

The channel plugin SDK is TypeScript-based with a `ChannelPlugin` interface using declarative builder APIs (`createChatChannelPlugin`, `createChannelPluginBase`). Core owns the shared message tool, prompt wiring, session-key shape, thread bookkeeping, and dispatch; plugins handle channel-specific adapters. See [Custom Channels](/guides/custom-channels) for the full SDK reference.

---

## Troubleshooting

### WhatsApp

| Problem | Cause | Fix |
|---------|-------|-----|
| QR code doesn't appear | Gateway not running | Check `openclaw status` |
| Session disconnects frequently | Baileys connection storms | Update OpenClaw, check issue #73016 |
| Account banned | Automated usage detected | Reduce message volume, use backup channel |
| "Credentials corrupted" | Bad shutdown | Auto-restored from `.bak`; run `openclaw doctor --fix` |
| Voice notes not transcribed | Feature regression | Update to v2026.4.26+ (fix for issue #52213) |

### Telegram

| Problem | Cause | Fix |
|---------|-------|-----|
| Bot doesn't respond | Missing Message Content intent | N/A for Telegram (no intents needed) |
| Rate limited | Too many API calls | Enable polling mode (default), add proxy |
| Webhook not receiving | Firewall/SSL issue | Verify public URL, valid HTTPS cert |
| Forum topics not routing | Missing topic config | Configure per-topic bindings |

### Discord

| Problem | Cause | Fix |
|---------|-------|-----|
| Bot doesn't respond in server | Missing Message Content Intent | Enable in Developer Portal > Bot > Privileged Intents |
| Can't read messages | Missing permissions | Re-invite with `Read Message History` scope |
| Responds to everything | Mention gating not set | Add `"requireMention": true` to group config |

### Slack

| Problem | Cause | Fix |
|---------|-------|-----|
| Socket Mode won't connect | Missing App Token | Generate under Basic Information > App-Level Tokens |
| Can't post to channel | Bot not in channel | Invite bot to channel: `/invite @botname` |
| Thread context lost | History scope wrong | Set `"historyScope": "thread"` |

### General

| Problem | Cause | Fix |
|---------|-------|-----|
| Channel shows "disconnected" | Token expired or network issue | `openclaw channel reconnect <name>` |
| Messages silently dropped | DM policy blocking | Check `dmPolicy` setting, verify allowlist |
| Bot responds to other bots | Loop protection disabled | Ensure `maxEventsPerWindow` is set |
| High API costs from channels | Too many channels active | Disable unused channels, increase heartbeat interval |

---

## See Also

- [Custom Channels](/guides/custom-channels) — Build new channel adapters with the TypeScript SDK
- [WebClaw](/guides/webclaw) — Browser-based web client frontend
- [API & Webhooks](/guides/api-webhooks) — WebSocket API, webhook integrations, custom HTTP channel
- [Security Hardening](/security/hardening) — Channel security, rate limiting, prompt injection defense
- [First 7 Days: Day 5](/guides/first-7-days/day-5-multi-channel) — Multi-channel setup tutorial
- [Configuration Reference](/reference/configuration) — All channel settings
