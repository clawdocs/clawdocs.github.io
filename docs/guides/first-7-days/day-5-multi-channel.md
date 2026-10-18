---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: "Day 5: Be Everywhere"
description: "Connect a second chat platform, control who can reach your bot, and approve new senders with pairing"
keywords: [openclaw, multi-channel, whatsapp, telegram setup, discord bot, slack, signal, pairing, dmPolicy, chat platforms]
---

# Day 5: Be Everywhere

You've been talking to your bot from one place, probably the Control UI or Telegram. Today you connect a second channel, decide who is allowed to talk to the bot on each one, and learn the pairing flow that keeps strangers out.

**Time:** ~45 minutes

---

## Why Multi-Channel?

One Gateway, one agent, one workspace. Every channel you connect talks to the same agent, with the same `SOUL.md`, `USER.md` and `MEMORY.md`.

What is **not** shared automatically is the conversation itself. Each chat is its own session. By default all your direct messages share the agent's main session (`session.dmScope: "main"`), which is fine when you are the only person talking to the bot. As soon as anyone else can DM it, isolate DMs so one person's conversation is not visible to another ([sessions](https://docs.openclaw.ai/concepts/session)):

```json5 title="~/.openclaw/openclaw.json"
{
  session: {
    dmScope: "per-channel-peer", // one session per channel + sender (recommended)
  },
}
```

Group chats and server channels always get their own sessions.

The bot can also **act across platforms**: post a summary to a Slack channel while you talk to it on Telegram, for example. It does this with the `message` tool, and only on channels it is connected to and allowed to post in.

---

## Add a Second Channel

Telegram ships with OpenClaw. Other official channels (Discord, Slack, WhatsApp, Signal and more) are separate plugins. The guided setup offers to install the plugin the first time you pick a channel:

```bash
openclaw channels add
```

Pick the channel, follow the prompts, and you're done. The rest of this section shows what each platform needs so you have it ready before you start.

### Discord

1. In the [Discord Developer Portal](https://discord.com/developers/applications), click **New Application** and give it a name. The bot user is created with the application.
2. On the **Bot** page, click **Reset Token** and copy the token. (Despite the name, this generates your first token.)
3. Under **Privileged Gateway Intents**, enable **Message Content Intent**. Enable **Server Members Intent** too if you want role-based allowlists.
4. Under **OAuth2 → URL Generator**, select the `bot` scope plus **Send Messages** and **Read Message History**, open the generated URL and add the bot to your server.
5. In Discord, turn on **Developer Mode** (User Settings → Advanced) so you can right-click to copy your user ID and the server ID. OpenClaw matches Discord users by numeric ID.

Keep the token out of chat and out of `openclaw.json` in plain text. Upstream's setup reads it from an environment variable through a SecretRef:

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
```

Put `DISCORD_BOT_TOKEN=...` in `~/.openclaw/.env` so the Gateway service can read it after a restart. Full walkthrough: [Discord setup](https://docs.openclaw.ai/channels/discord/setup).

To install the plugin yourself instead of through the guided setup:

```bash
openclaw plugins install @openclaw/discord
```

### WhatsApp

WhatsApp links like WhatsApp Web: you scan a QR code with your phone. `openclaw channels add` offers to install the `@openclaw/whatsapp` plugin when you pick it, then:

```bash
openclaw channels login --channel whatsapp
```

On your phone, open **WhatsApp → Linked devices → Link a device** and scan the QR. The code expires quickly, so run this where you can see the terminal. Use a dedicated number if you can ([WhatsApp](https://docs.openclaw.ai/channels/whatsapp)).

### Slack

Slack uses an app you create from a manifest, not a browser OAuth prompt:

1. Install the plugin: `openclaw plugins install @openclaw/slack` (or let `openclaw channels add` do it).
2. At [api.slack.com/apps](https://api.slack.com/apps/new), choose **Create New App → From a manifest**, pick your workspace and paste the manifest from the [Slack setup page](https://docs.openclaw.ai/channels/slack/setup).
3. Install the app to the workspace and copy the **bot token** (`xoxb-…`). Create an **app-level token** (`xapp-…`) with `connections:write` for Socket Mode.

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    slack: {
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
    },
  },
}
```

Socket Mode needs no public URL, which makes it the right choice for a home server.

### Signal

Signal goes through [`signal-cli`](https://github.com/AsamK/signal-cli), which links to a Signal account like a desktop client:

```bash
openclaw plugins install @openclaw/signal
openclaw channels add
```

The wizard offers to install `signal-cli` if it is missing, then asks for the bot's number. You link the account with `signal-cli link -n "OpenClaw"` and scan the QR in Signal. A dedicated number is strongly recommended ([Signal](https://docs.openclaw.ai/channels/signal)).

:::tip
`openclaw channels list --all` shows every channel you can install. For details on each platform, see the [Channels & Integrations](/guides/channels) guide and the [upstream channel docs](https://docs.openclaw.ai/channels).
:::

### Apply the change

The Gateway watches `openclaw.json` and applies most changes by itself, restarting the affected channel when needed ([hot reload](https://docs.openclaw.ai/gateway/configuration/hot-reload)). An invalid edit is skipped, so validate after every hand edit, and restart if a change does not seem to take effect:

```bash
openclaw config validate
openclaw gateway restart
```

A newly added env variable in `~/.openclaw/.env` needs that restart.

---

## Channel Status

```bash
# Channels you have configured
openclaw channels list

# Connection state, with a live credential check
openclaw channels status --probe

# Just one channel
openclaw channels status --channel discord --probe

# Recent log lines for a channel
openclaw channels logs --channel discord
```

If a channel drops:

- **Token rejected:** fix the token (or the env variable it points at), then `openclaw gateway restart`.
- **WhatsApp logged out:** run `openclaw channels login --channel whatsapp` again and rescan.
- **Everything else:** `openclaw status --deep` runs a fuller connection check, and `openclaw doctor` explains common misconfigurations.

To disconnect a channel, `openclaw channels remove --channel <id>` disables it (add `--delete` to remove its config).

---

## Who Can Talk to Your Bot

This is the most important part of today. Anyone who can message a tool-enabled agent can use its tools, so decide per channel who gets in.

### Direct messages: `dmPolicy`

| `dmPolicy` | What happens when an unknown person DMs the bot |
|---|---|
| `pairing` (default) | They get a short pairing code; their message is not processed until you approve it. |
| `allowlist` | Only senders listed in `allowFrom` get through. Everyone else is ignored. |
| `open` | Anyone can talk to it. Requires `allowFrom: ["*"]`. Only for deliberately public bots with very limited tools. |
| `disabled` | DMs are ignored. |

Source: [shared channel policies](https://docs.openclaw.ai/gateway/config-channels/shared-policies).

For a personal bot, `pairing` is a good default. Once you and the few people you trust are approved, switching to `allowlist` closes the door completely.

### Groups and servers: `groupPolicy` and mention gating

Group access is separate from DM access. Groups default to `groupPolicy: "allowlist"`, so the bot only participates in groups or servers you list. In those groups it replies only when mentioned, by default ([mention gating](https://docs.openclaw.ai/gateway/config-channels/mention-gating-and-history)).

### A worked example

This config keeps Telegram on pairing with mention-gated groups, limits Discord to one server and two channels, limits Slack to one channel, and allowlists a single WhatsApp number:

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    telegram: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
    discord: {
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "allowlist",
      allowFrom: ["123456789012345678"], // your Discord user ID
      groupPolicy: "allowlist",
      guilds: {
        "111111111111111111": {         // your server ID
          requireMention: true,
          users: ["123456789012345678"], // who may use the bot in this server
          channels: {
            "bot-commands": { enabled: true, requireMention: false },
            general: { enabled: true },
          },
        },
      },
    },
    slack: {
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { enabled: true, requireMention: true }, // Slack channel ID
      },
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123"],
      groupPolicy: "allowlist",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Notes:

- Discord and Slack match people and channels by **ID**. Discord's old `name#1234` tags no longer exist. Use `openclaw channels resolve` to turn names into IDs.
- In Discord, a server's `channels` map is itself an allowlist: channels not listed are ignored. `roles: ["<role id>"]` works alongside `users` if you enabled Server Members Intent.
- To also wake the bot on a text pattern (for example `!bot`), add `groupChat.mentionPatterns` to the agent: `agents.entries.main.groupChat.mentionPatterns: ["!bot"]`.
- There is no per-channel message rate limit setting. Control cost with model choice and by keeping the bot out of busy rooms.

Upstream's channel access guidance, with more examples: [Who can talk to the agent](/security/hardening#channel-access).

---

## Pairing: Approving New People {#pairing-new-devices}

Pairing is how a new person gets access to your bot's DMs when `dmPolicy` is `pairing`:

1. Someone you don't know yet DMs the bot.
2. The bot replies to **them** with an 8-character pairing code. Their message is not passed to the agent.
3. They send you the code through some other channel (or you just look at the pending list).
4. **You**, the operator, approve it.

```bash
# See pending requests for a channel
openclaw pairing list telegram

# Approve one (add --notify to tell them they're in)
openclaw pairing approve telegram ABCD2345 --notify
```

You can do the same in the Control UI under **Settings → Channels → DM access requests**, where **Dismiss** removes a request you don't want. There is no `reject` command: a request you ignore expires on its own after one hour, and each channel account keeps at most three pending requests ([pairing](https://docs.openclaw.ai/channels/pairing)).

Approval grants DM access only, not group access. The first approval from the CLI also makes that sender the command owner (`commands.ownerAllowFrom`) if you don't have one yet, which is where heartbeat alerts and exec approval prompts go.

:::caution
A pairing request from someone you don't recognise just means a stranger found your bot and messaged it. Your credentials are not compromised. Don't approve it. If you get a lot of them, switch that channel to `dmPolicy: "allowlist"`.
:::

Pairing a **device** (the iOS or Android app, or another computer joining the Gateway as a node) is a different thing, managed with `openclaw devices list` and `openclaw devices approve`.

---

## What You've Done Today

- Connected a second (and maybe third) chat platform, with tokens kept out of plain-text config
- Checked channel health with `openclaw channels status --probe`
- Isolated DM sessions with `session.dmScope`
- Decided who can reach the bot with `dmPolicy`, `allowFrom`, `groupPolicy` and mention gating
- Approved a new sender with the pairing flow

Tomorrow you build your own skill and give a second agent its own job.

**Next: [Day 6: Build Your Own](day-6-power-moves) — create custom skills and go multi-agent**
