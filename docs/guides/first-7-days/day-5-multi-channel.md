---
sidebar_position: 6
title: "Day 5: Be Everywhere"
description: "Connect multiple chat platforms and route messages between them"
keywords: [openclaw, multi-channel, whatsapp, telegram setup, discord bot, cross-channel, chat platforms]
---

# Day 5: Be Everywhere

You've been talking to your bot from one platform. That works, but it's limiting — you're on your phone with Telegram, at your desk with Discord, in a meeting with Slack. Your bot should meet you wherever you are.

Today you connect a second (and third) channel and learn the killer feature: cross-channel routing.

**Time:** ~45 minutes

---

## Why Multi-Channel?

Same bot. Same brain. Same memory. Accessible from anywhere.

Start a conversation from Telegram on your phone during your commute. Pick it up from Discord on your desktop when you sit down. Ask a question in Slack during a meeting. The bot maintains context across all of them because it's the same agent with the same memory — the channel is just a transport.

This also means your bot can **act across platforms**: monitor Slack for you while you're on Telegram, post summaries to Discord, forward urgent messages wherever you are.

---

## Add a Second Channel

You already have Telegram (or whichever channel you started with). Let's add Discord.

```bash
openclaw channel add discord
```

OpenClaw will prompt you for credentials. Here's the quick setup:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**, give it a name
3. Go to **Bot** in the sidebar, click **Add Bot**
4. Copy the bot token
5. Under **Privileged Gateway Intents**, enable **Message Content Intent**
6. Go to **OAuth2 > URL Generator**, select `bot` scope and `Send Messages` + `Read Message History` permissions
7. Copy the generated URL and open it to add the bot to your server

Paste the token when OpenClaw asks:

```bash
openclaw channel add discord
# ? Bot token: paste-your-token-here
# ? Default server ID (optional): 123456789
# ? Default channel ID (optional): 987654321
# ✓ Discord connected — say "hello" in your server to verify
```

Test it by messaging the bot in Discord. It should respond with the same personality and memory as your Telegram bot — because it is the same bot.

---

## Add More Channels

Each platform has a slightly different setup flow. Here's the quick reference:

### WhatsApp

```bash
openclaw channel add whatsapp
```

Scan the QR code that appears in your terminal with WhatsApp on your phone (Settings > Linked Devices > Link a Device). No API keys needed.

### Slack

```bash
openclaw channel add slack
```

Opens a browser for OAuth. Authorize the app for your workspace, select the channels it should have access to.

### Signal

```bash
openclaw channel add signal
```

Link via phone number — similar to Signal Desktop. Follow the on-screen prompts to pair.

:::tip
For full setup instructions for all 50+ supported platforms, see the [Channels & Integrations](/guides/channels) guide.
:::

---

## Channel Status

Keep track of what's connected:

```bash
# List all configured channels
openclaw channel list
```

```
NAME       STATUS      LAST MESSAGE
telegram   connected   2 minutes ago
discord    connected   5 minutes ago
whatsapp   connected   1 hour ago
slack      disconnected
```

Check a specific channel:

```bash
openclaw channel status discord
```

```
Channel:    discord
Status:     connected
Server:     My Server (#general)
Uptime:     4h 23m
Messages:   47 today
```

If a channel disconnects (network blip, token expiry), reconnect it:

```bash
openclaw channel reconnect slack
```

---

## Cross-Channel Routing

This is the killer feature. Your bot isn't just reachable on multiple platforms — it can **act across them**. You talk on one platform and it operates on another.

### Example 1: Forward urgent messages

From Telegram on your phone:

```
Forward any Slack messages from my manager to me here on Telegram
```

The bot monitors Slack and pushes anything matching to your Telegram DM. You never have to open Slack on your phone.

### Example 2: Post to another platform

From Discord on your desktop:

```
Summarize today's conversation history and post it to my #daily-updates channel on Slack
```

The bot compiles the summary and posts it directly to Slack.

### Example 3: Cross-platform lookup

From Telegram:

```
Check Discord for the last message from Alice in #project-alpha and tell me what she said
```

The bot reads from Discord and reports back to you on Telegram.

:::info
Cross-channel routing requires the bot to have appropriate permissions on each platform. It can only read channels it's been added to and post where it has write access.
:::

---

## Per-Channel Settings

Different platforms need different behavior. Your bot should respond to every DM on Telegram but only when mentioned in a busy Discord server. Configure this per channel:

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    telegram: {
      // Respond to all DMs, require mention in groups
      directMessage: { autoReply: true },
      group: { requireMention: true }
    },
    discord: {
      // Only respond when @mentioned or in specific channels
      requireMention: true,
      allowedChannels: ["bot-commands", "general"],
      // Restrict who can talk to the bot
      allowlist: ["alice#1234", "bob#5678"]
    },
    slack: {
      // Only respond in DMs and specific channels
      allowedChannels: ["#ask-bot", "#dev-ops"],
      // Require thread replies to avoid noise
      requireThread: true
    },
    whatsapp: {
      // Only respond to contacts in your allowlist
      allowlist: ["+1234567890", "+0987654321"],
      // Rate limit to avoid runaway costs
      maxMessagesPerHour: 30
    }
  }
}
```

---

## Group Chat Tips

Bots in group chats need guard rails. Without them, your bot replies to every single message — annoying for everyone.

### Mention-gating

The most important setting for groups. When enabled, the bot only responds when directly mentioned:

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    discord: {
      group: {
        requireMention: true,  // Only respond to @BotName
        mentionPrefix: ["!bot", "/ask"]  // Also respond to these prefixes
      }
    },
    telegram: {
      group: {
        requireMention: true  // Only respond to @bot_username
      }
    }
  }
}
```

### Dedicated bot channels

Instead of letting the bot loose in every channel, restrict it:

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    discord: {
      allowedChannels: ["bot-chat", "ask-anything"],
      // Ignore everything else
      ignoreChannels: ["off-topic", "memes"]
    }
  }
}
```

### Permissions per user

Control who can interact with the bot in group settings:

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    discord: {
      group: {
        // Only these roles can use the bot
        allowedRoles: ["admin", "bot-user"],
        // Or specify individual users
        allowlist: ["alice#1234"]
      }
    }
  }
}
```

---

## Pairing New Devices

When you add a channel from a new device or location, OpenClaw requires approval for security:

```bash
openclaw pairing approve discord abc123
```

You can also view pending pairing requests:

```bash
openclaw pairing list
```

```
CHANNEL    CODE     REQUESTED       STATUS
discord    abc123   2 minutes ago   pending
whatsapp   xyz789   1 hour ago      pending
```

Reject a request you don't recognize:

```bash
openclaw pairing reject discord abc123
```

:::caution
If you see a pairing request you didn't initiate, someone else is trying to connect to your bot. Reject it and rotate your channel credentials.
:::

---

## What You've Done Today

- Connected a second (and maybe third) chat platform
- Learned cross-channel routing — the bot acts across platforms on your behalf
- Configured per-channel behavior so the bot is quiet where it should be
- Set up group chat guard rails with mention-gating and allowlists
- Understood the pairing approval flow for new devices

Your bot is now accessible from anywhere, and smart enough to act across platforms. Tomorrow you start building your own extensions.

**Next: [Day 6: Build Your Own](day-6-power-moves) — create custom skills and go multi-agent**
