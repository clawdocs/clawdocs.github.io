---
sidebar_position: 2
title: Channels & Integrations
description: Connect OpenClaw to WhatsApp, Telegram, Discord, Slack, Gmail, and 50+ other platforms
---

# Channels & Integrations

OpenClaw can communicate through 50+ platforms. Each connection is called a **channel**.

## Supported Channels

### Messaging Platforms

| Channel | Status | Auth Method |
|---------|--------|-------------|
| WhatsApp | Stable | QR code scan |
| Telegram | Stable | Bot token |
| Discord | Stable | Bot token |
| Slack | Stable | OAuth app |
| Signal | Stable | Phone number link |
| iMessage | macOS only | System integration |
| Microsoft Teams | Stable | Azure AD app |
| Google Chat | Stable | Service account |
| Matrix | Stable | Access token |
| Nostr | Stable | Private key (nsec) |
| Twitch | Stable | OAuth token |
| Zalo | Stable | OA token |
| QQBot | Stable | App ID + secret |
| WebChat | Built-in | Gateway URL |

### Service Integrations

| Integration | Capabilities |
|-------------|-------------|
| **Gmail** | Read, send, search, label emails |
| **GitHub** | Issues, PRs, notifications, code review |
| **Spotify** | Playback control, playlist management |
| **Obsidian** | Read/write notes, search vault |
| **Hue** | Smart light control |
| **Calendar** | Google Calendar, Outlook events |
| **Twitter/X** | Read timeline, search tweets and replies, post tweets. See [TweetClaw](#twitter-x-with-tweetclaw) for plugin setup |
| **Browser** | Full Chromium automation |

### Twitter X with TweetClaw

Use [TweetClaw](https://github.com/Xquik-dev/tweetclaw) when an OpenClaw agent needs deeper X/Twitter automation than the base channel entry.

```bash
openclaw plugins install @xquik/tweetclaw
```

TweetClaw adds tweet search, reply search, post tweets, post replies, follower export, user lookup, media upload, media download, direct messages, tweet monitors, webhooks, and giveaway draws through Xquik.

- **Package**: [@xquik/tweetclaw](https://www.npmjs.com/package/@xquik/tweetclaw)
- **ClawHub**: [clawhub.ai/plugins/@xquik/tweetclaw](https://clawhub.ai/plugins/@xquik/tweetclaw)

## Adding a Channel

```bash
# Interactive setup
openclaw channel add <channel-name>

# Examples
openclaw channel add whatsapp
openclaw channel add telegram
openclaw channel add discord
openclaw channel add gmail
```

Each channel walks you through authentication specific to that platform.

## Channel Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "auto_reply": true,
      "allowed_contacts": []  // Empty = all contacts
    },
    "telegram": {
      "enabled": true,
      "bot_token": "${TELEGRAM_BOT_TOKEN}",
      "allowed_chat_ids": []
    },
    "discord": {
      "enabled": true,
      "bot_token": "${DISCORD_BOT_TOKEN}",
      "allowed_guild_ids": [],
      "allowed_channel_ids": []
    },
    "gmail": {
      "enabled": true,
      "credentials_path": "~/.openclaw/gmail-credentials.json",
      "scopes": ["read", "send", "labels"]
    }
  }
}
```

## Channel Permissions

Control what OpenClaw can do per channel:

```json5
{
  "channels": {
    "whatsapp": {
      "permissions": {
        "read": true,
        "reply": true,
        "initiate": false,    // Can't start conversations
        "send_media": false   // Can't send images/files
      }
    }
  }
}
```

## Multi-Channel Routing

OpenClaw can route between channels:

```
You (WhatsApp): "Forward today's urgent emails to my Slack"
OpenClaw: Checks Gmail → Finds 3 urgent emails → Posts summaries to Slack
```

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
```

:::warning
**Security note:** Each connected channel is an attack surface. A compromised WhatsApp contact could send prompt injection via message. See [Security Hardening](/security/hardening) for mitigation strategies.
:::

## See Also

- [Configuration Reference](/reference/configuration) — All channel settings
- [Security Hardening](/security/hardening) — Securing channel access
- [Heartbeat Guide](/guides/heartbeat) — Proactive channel monitoring
