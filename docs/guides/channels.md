---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Channels & Integrations
description: Connect OpenClaw to Telegram, WhatsApp, Discord, Slack and 27 other chat platforms — which channels are bundled, how to install the rest, DM pairing, group policy, and troubleshooting
keywords: [openclaw, openclaw channels, whatsapp, telegram, discord, slack, pairing, dmPolicy, groupPolicy]
---

# Channels & Integrations

A **channel** is a chat platform connected to your OpenClaw Gateway. The same agent, memory and tools are reachable from Telegram on your phone, Discord on your desktop or Slack at work. Channels are transport: they decide who may reach the agent and how replies are delivered, not what the agent can do.

Checked against OpenClaw **v2026.10.4** on 2026-10-18. The 2026.10.4 catalog lists 31 channels plus WebChat: [docs.openclaw.ai/channels](https://docs.openclaw.ai/channels). This page is the opinionated short version; each section links the upstream page with the full key reference.

---

## Supported Channels

Upstream sorts channels into four groups:

- **Bundled plugin**: ships with the core install. Only **Telegram**, **A2A** and **Reef**.
- **Included in core**: **WebChat** (the Control UI chat tab and the native apps).
- **Official plugin**: maintained in the OpenClaw repo, installed on demand as `@openclaw/<id>`. `openclaw onboard` and `openclaw channels add` offer the install the first time you pick one.
- **External plugin**: maintained by someone else, under their own package name.

| Channel | Channel id | Package | How it connects |
|---------|-----------|---------|-----------------|
| **Telegram** | `telegram` | bundled | Bot token from BotFather (grammY, long polling or webhook) |
| **WhatsApp** | `whatsapp` | `@openclaw/whatsapp` | WhatsApp Web via Baileys, QR login. Unofficial; see the [ban-risk warning](#whatsapp) |
| **Discord** | `discord` | `@openclaw/discord` | Bot token (Developer Portal) |
| **Slack** | `slack` | `@openclaw/slack` | Socket Mode, HTTP Request URLs, or relay mode |
| **Signal** | `signal` | `@openclaw/signal` | `signal-cli` daemon or the bbernhard container; OpenClaw does not embed libsignal |
| **iMessage** | `imessage` | `@openclaw/imessage` | The `imsg` CLI on a signed-in Mac (BlueBubbles support was removed) |
| **WebChat** | — | core | Control UI at `http://127.0.0.1:18789/`, or the macOS/iOS app |
| **Matrix** | `matrix` | `@openclaw/matrix` | Homeserver + access token, optional E2EE |
| **Microsoft Teams** | `msteams` | `@openclaw/msteams` | Azure bot registration (Teams SDK) |
| **Google Chat** | `googlechat` | `@openclaw/googlechat` | Workspace app |
| **Feishu / Lark** | `feishu` | `@openclaw/feishu` | App credentials |
| **LINE** | `line` | `@openclaw/line` | Messaging API channel token |
| **IRC** | `irc` | `@openclaw/irc` | Server + nick |
| **Mattermost** | `mattermost` | `@openclaw/mattermost` | Bot token |
| **Nextcloud Talk** | `nextcloud-talk` | `@openclaw/nextcloud-talk` | App password |
| **Nostr** | `nostr` | `@openclaw/nostr` | Private key; DMs only, NIP-04 encrypted |
| **SMS** | `sms` | `@openclaw/sms` | Twilio SMS/MMS |
| **Synology Chat** | `synology-chat` | `@openclaw/synology-chat` | Webhook |
| **Tlon / Urbit** | `tlon` | `@openclaw/tlon` | Ship credentials |
| **Twitch** | `twitch` | `@openclaw/twitch` | OAuth (twurple), with token refresh |
| **Zalo** / **Zalo personal** | `zalo` / `zalouser` | `@openclaw/zalo` / `@openclaw/zalouser` | Bot token / QR login |
| **A2A**, **Reef** | `a2a`, `reef` | bundled | Agent-to-agent protocols |
| **Buzz**, **ClickClack**, **Raft** | `buzz`, `clickclack`, `raft` | `@openclaw/<id>` | See the upstream page for each |
| **WeChat** | — | external: `@tencent-weixin/openclaw-weixin` | Tencent's plugin |
| **QQ Bot** | `qqbot` | external: `@tencent-connect/openclaw-qqbot` | Tencent's plugin |
| **WeCom**, **Yuanbao**, **Zalo ClawBot** | — | external | See the upstream page for each |

**Voice Call** (`@openclaw/voice-call`, telephony via Plivo, Telnyx or Twilio) is a communication plugin, not a chat channel: [docs.openclaw.ai/plugins/voice-call](https://docs.openclaw.ai/plugins/voice-call).

### Service integrations are skills, not channels

Gmail, GitHub, Spotify, Obsidian and Philips Hue are reached through **skills** that ship with OpenClaw, not through channel plugins: `gog` (Gmail, Calendar, Drive, Contacts, Sheets, Docs), `himalaya` (IMAP/SMTP email), `github` and `gh-issues`, `spotify-player`, `obsidian`, `openhue`. Browse them in [the upstream `skills/` folder](https://github.com/openclaw/openclaw/tree/main/skills). Browser automation is the built-in [browser tool](https://docs.openclaw.ai/tools/browser). For push-style Gmail ingress, use `openclaw webhooks gmail setup` (see [API & Webhooks](/guides/api-webhooks)).

---

## Quick Setup

Start with Telegram: it is bundled and needs only a bot token.

```bash
# Guided setup: pick a channel from a list
openclaw channels add

# Non-interactive Telegram setup
openclaw channels add --channel telegram --token <bot-token>

# Official plugin channels install on demand, or explicitly:
openclaw plugins install @openclaw/matrix

# See every channel id, configured or installable
openclaw channels list --all

# Check that the running Gateway picked it up
openclaw channels status --probe
```

With the default hot reload, a running Gateway applies new channel config without a restart. If the Gateway is not running, start it with `openclaw gateway start` (service) or `openclaw gateway run` (foreground).

In 2026.10.4, `openclaw plugins install @openclaw/<id>` installs from npm first and falls back to the package's ClawHub listing only when the npm target is unavailable; prefix `npm:` or `clawhub:` to force a source. Reference: [`openclaw channels`](https://docs.openclaw.ai/cli/channels), [plugins](https://docs.openclaw.ai/tools/plugin).

---

## WhatsApp

WhatsApp uses **Baileys** (the `baileys` package), a reverse-engineered implementation of the WhatsApp Web protocol. It is not the WhatsApp Business API or Cloud API, and there is no Twilio WhatsApp channel.

### Setup

```bash
openclaw plugins install @openclaw/whatsapp   # or let channels add/login offer it
openclaw channels login --channel whatsapp
```

1. A QR code appears in your terminal. Login is QR-only.
2. On the phone: **Settings → Linked Devices → Link a Device**, then scan it.
3. Credentials are saved under `~/.openclaw/credentials/whatsapp/<accountId>/`.

On a headless host, make sure you can get the live QR to the phone quickly; screenshots and forwarded images often expire in transit. A dedicated number is recommended, but a personal number with self-chat mode is supported.

The QR login links the *account*. It is separate from DM pairing, which approves the *people* who message that account.

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],          // E.164 numbers
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],     // who may trigger the bot inside groups
      groups: { "*": { requireMention: true } },
      sendReadReceipts: false,
    },
  },
}
```

### Multiple accounts

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    whatsapp: {
      defaultAccount: "personal",
      accounts: {
        personal: { dmPolicy: "allowlist", allowFrom: ["+15551234567"], sendReadReceipts: false },
        biz: { dmPolicy: "pairing", mediaMaxMb: 25 },
      },
    },
  },
}
```

Log each account in with `openclaw channels login --channel whatsapp --account <id>`. With two or more accounts, set `defaultAccount` so routing is explicit; `openclaw doctor` warns otherwise.

:::warning Ban risk
WhatsApp is reached through an unofficial, reverse-engineered API. Meta has banned numbers for automated use, and users have reported bans and unstable sessions (see [issue #4376](https://github.com/openclaw/openclaw/issues/4376)). Mitigate by:
- using a dedicated number, not the one you cannot afford to lose
- keeping message volume low and never sending bulk or unsolicited messages
- leaving `sendReadReceipts: false`
- keeping a second channel (Telegram) configured as a fallback
:::

Full reference: [docs.openclaw.ai/channels/whatsapp](https://docs.openclaw.ai/channels/whatsapp).

---

## Telegram

### Setup

1. Chat with [@BotFather](https://t.me/botfather) (check the handle is exactly `@BotFather`), send `/newbot`, and copy the token.
2. Run `openclaw channels add --channel telegram --token <bot-token>`, or edit the config below.
3. Send your bot any message, then approve yourself: `openclaw pairing list telegram` and `openclaw pairing approve telegram <CODE>`.

Telegram does not use `openclaw channels login`. The env var `TELEGRAM_BOT_TOKEN` works as a fallback for the default account only.

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "${TELEGRAM_BOT_TOKEN}",
      dmPolicy: "pairing",
      allowFrom: ["123456789"],            // numeric Telegram user IDs, not usernames
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
      groups: { "*": { requireMention: true } },
      historyLimit: 50,
    },
  },
}
```

Group chat IDs (negative numbers, `-100…` for supergroups) go under `groups` as keys, not in `groupAllowFrom`. After a group is allowed, `/whoami@<bot_username>` in that group shows both IDs. `openclaw doctor --fix` migrates old username entries in `allowFrom` to numeric IDs, and moves the retired flat `channels.telegram.requireMention` to `groups["*"].requireMention`.

Telegram bots default to **Privacy Mode** and do not see ordinary group messages. Disable it with `/setprivacy` in BotFather, or make the bot a group admin, then remove and re-add the bot.

### Webhook mode

Long polling is the default and needs no public URL. Webhook mode is enabled by setting a URL and secret; there is no `mode` key.

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    telegram: {
      botToken: "${TELEGRAM_BOT_TOKEN}",
      webhookUrl: "https://bot.example.com/telegram-webhook",
      webhookSecret: "${TELEGRAM_WEBHOOK_SECRET}",
      proxy: "socks5://127.0.0.1:1080",     // optional, a plain string
    },
  },
}
```

The webhook route is served on the Gateway port (default path `/telegram-webhook`); point your HTTPS reverse proxy there. Telegram's secret header is the authentication for that route. Details: [Telegram transports](https://docs.openclaw.ai/channels/telegram/transports).

Full reference: [docs.openclaw.ai/channels/telegram](https://docs.openclaw.ai/channels/telegram).

---

## Discord

### Setup

1. In the [Discord Developer Portal](https://discord.com/developers/applications), create an application and add a bot.
2. Copy the bot token. Under **Privileged Gateway Intents**, enable **Message Content Intent**.
3. Under **OAuth2 → URL Generator**, select the `bot` scope with `Send Messages` and `Read Message History`, and open the URL to invite the bot.
4. Install the plugin (`openclaw plugins install @openclaw/discord`, or let `openclaw channels add` do it) and set the token.
5. DM the bot. It replies with a pairing code; approve it with `openclaw pairing approve discord <CODE>`.

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "pairing",
      allowFrom: ["123456789012345678"],          // Discord user IDs
      groupPolicy: "allowlist",
      guilds: {
        "111111111111111111": {                   // server (guild) ID
          requireMention: true,
          users: ["123456789012345678"],
        },
      },
    },
  },
}
```

The token key is `token` (not `botToken`). Servers and channels are restricted with `guilds.<guildId>` (and its `channels` map) plus `groupPolicy`; there are no `allowedGuildIds` or `allowedChannelIds` keys. Use user IDs everywhere: Discord discriminators (`name#1234`) no longer exist. Turn on Developer Mode in Discord to copy IDs.

What the agent may do on Discord (reactions, pins, threads, moderation, role changes) is gated by `channels.discord.actions.*`. Leave moderation and role actions off unless you need them.

Full reference: [docs.openclaw.ai/channels/discord](https://docs.openclaw.ai/channels/discord), including [voice channels](https://docs.openclaw.ai/channels/discord/voice-channels).

---

## Slack

### Setup

1. `openclaw plugins install @openclaw/slack`.
2. At [api.slack.com/apps](https://api.slack.com/apps), choose **Create New App → From a manifest** and paste the manifest from the [upstream Slack setup page](https://docs.openclaw.ai/channels/slack/setup). It sets the scopes and events for you.
3. Install the app to the workspace. Copy the **Bot Token** (`xoxb-…`) and create an **App-Level Token** (`xapp-…`) for Socket Mode.

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "pairing",
      groupPolicy: "allowlist",
      channels: {
        C12345678: { enabled: true, requireMention: true },   // channel ID, or "#name"
      },
    },
  },
}
```

| Mode | Needs | Use when |
|------|-------|----------|
| `socket` (default) | `botToken` + `appToken` | Most setups; no public URL |
| `http` | `botToken` + `signingSecret` (+ `webhookPath`) | You already have HTTPS ingress |
| `relay` | a trusted router | Managed deployments where a router owns Slack ingress |

Channel messages are mention-gated by default. Slack multi-person DMs are treated as group chats, so group policy applies to them. Full reference: [docs.openclaw.ai/channels/slack](https://docs.openclaw.ai/channels/slack).

---

## Signal, iMessage, Matrix and Others

- **Signal**: `openclaw plugins install @openclaw/signal`. You run `signal-cli` (native daemon or the [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) container) and OpenClaw talks to it over HTTP. Use a separate bot number: on your personal account the bot ignores your own messages. [Upstream page](https://docs.openclaw.ai/channels/signal).
- **iMessage**: `openclaw plugins install @openclaw/imessage`. The Gateway spawns `imsg rpc` on a signed-in Mac (JSON-RPC over stdio). Replies, tapbacks and group actions need the `imsg` private API mode. If the Gateway runs elsewhere, point `channels.imessage.cliPath` at an SSH wrapper. [Upstream page](https://docs.openclaw.ai/channels/imessage).
- **Matrix**: `openclaw plugins install @openclaw/matrix`, then `openclaw channels add --channel matrix`. [Upstream page](https://docs.openclaw.ai/channels/matrix).
- **Microsoft Teams**: `openclaw plugins install @openclaw/msteams`; the channel id is `msteams`. [Upstream page](https://docs.openclaw.ai/channels/msteams).
- **Feishu / Lark**: `openclaw plugins install @openclaw/feishu`. [Upstream page](https://docs.openclaw.ai/channels/feishu).

The pattern for any official plugin channel is the same:

```bash
openclaw plugins install @openclaw/<id>
openclaw channels add --channel <id>
openclaw channels status --probe
```

---

## Twitter/X with TweetClaw {#twitterx-with-tweetclaw}

OpenClaw 2026.10.4 has no built-in X / Twitter channel.

:::note Next release
Upstream `main` adds a bundled **X channel** (`x`) that turns mentions of your bot account into conversations and posts public replies, only for allowlisted authors by default, with no DMs, likes or original posts. It is not in 2026.10.4. See [docs.openclaw.ai/channels/x](https://docs.openclaw.ai/channels/x) once you upgrade.
:::

For X automation today (search, follower export, monitors, giveaways), [TweetClaw](https://github.com/Xquik-dev/tweetclaw) is a **third-party** plugin backed by Xquik's paid API:

```bash
openclaw plugins install @xquik/tweetclaw
```

Read its pricing and data policy before installing; it is not maintained by OpenClaw.

---

## DM Access Control

Every DM-capable channel has a `dmPolicy`:

| Policy | Behavior | Use case |
|--------|----------|----------|
| `pairing` (default) | Unknown senders get a pairing code; their message is not processed until you approve | Personal use |
| `allowlist` | Only senders in `allowFrom` get through; no code is sent | Family or team |
| `open` | Anyone can DM; requires `"*"` in `allowFrom` as an explicit opt-in | Public bots |
| `disabled` | Inbound DMs ignored | Group-only bots |

When no policy is set, DMs default to `pairing` and groups to `allowlist`. A channel account with no config does not silently open up.

### Pairing flow

The **sender** gets the code from the bot; the **operator** approves it.

1. Someone you do not know yet DMs the bot.
2. The bot replies once with an 8-character code (uppercase, no `0`, `O`, `1` or `I`). Their message is held, not processed.
3. You approve it from the CLI, or in the Control UI under **Settings → Channels → DM access requests**.

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
openclaw pairing approve telegram <CODE> --notify     # tell the sender
openclaw pairing approve whatsapp <CODE> --account biz
```

Codes expire after 1 hour. Pending requests are capped at 3 per channel account; extra requests are ignored until one expires or is approved. There is no `pairing create` or `pairing reject`: dismiss a request in the Control UI, or let it expire.

Approval grants DM access only, never group access. The first CLI approval on a fresh install also sets `commands.ownerAllowFrom` (the owner allowed to run privileged commands and answer exec approvals) when no owner exists yet. Later approvals do not add owners.

### Allowlists

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    whatsapp: { dmPolicy: "allowlist", allowFrom: ["+15551234567", "+15557654321"] },
    telegram: { dmPolicy: "allowlist", allowFrom: ["123456789"] },
    discord: { dmPolicy: "allowlist", allowFrom: ["123456789012345678"] },
  },
}
```

WhatsApp takes E.164 numbers, Telegram numeric user IDs, Discord user IDs. Approved pairings are stored in SQLite at `~/.openclaw/state/openclaw.sqlite` (tables `channel_pairing_requests` and `channel_pairing_allow_entries`), merged with the config allowlist. Older installs kept `~/.openclaw/credentials/<channel>-allowFrom.json`; `openclaw doctor --fix` imports those. Treat the database as sensitive.

To reuse one trusted sender list across channels, define top-level `accessGroups` and reference them as `accessGroup:<name>`: [Access groups](https://docs.openclaw.ai/channels/access-groups).

If more than one person can DM the bot, also set `session: { dmScope: "per-channel-peer" }` so each sender gets an isolated session instead of sharing your main one. Reference: [Access control](https://docs.openclaw.ai/gateway/security/access-control).

---

## Group Chat Configuration

Groups need guard rails, or the bot answers every message. Three settings do the work:

- `groupPolicy`: `allowlist` (default, fail-closed), `open` (any group the bot is in), or `disabled`.
- **Which rooms**: `groups` (WhatsApp, Telegram, iMessage), `guilds` (Discord) or `channels` (Slack). When set, the map is also the room allowlist; use the `"*"` key for defaults that apply to all.
- **Who inside a room**: `groupAllowFrom`, a sender allowlist checked before mention rules. Replying to the bot does not bypass it.

```json5 title="~/.openclaw/openclaw.json"
{
  messages: { groupChat: { mentionPatterns: ["@claw", "hey claw"] } },
  channels: {
    telegram: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": { requireMention: false },   // a private family group
      },
    },
  },
}
```

`requireMention` makes the bot respond only to @mentions, replies to its own messages, or your `mentionPatterns`. Set per-agent patterns under `agents.entries.<id>.groupChat.mentionPatterns`.

For a private room of people you trust, `groupPolicy: "open"` with mention gating off is a normal setup. Keep sender allowlists and mention gating on any room strangers can join.

There are no per-channel rate-limit keys (`maxMessagesPerHour` and similar do not exist). Supported channels can also post a short join introduction when the bot is added to a group (`joinIntro`, on by default for Discord, LINE, Matrix, Slack and Telegram) and treat unmentioned chatter as quiet context ([ambient room events](https://docs.openclaw.ai/channels/ambient-room-events)). Reference: [Groups](https://docs.openclaw.ai/channels/groups).

### Bot loop protection

On channels that accept bot-authored messages (Discord and Slack do by default), a shared guard stops two bots from replying to each other forever. It is a sliding-window budget per bot pair, on by default:

```json5 title="~/.openclaw/openclaw.json"
{
  channels: {
    defaults: {
      botLoopProtection: { maxEventsPerWindow: 20, windowSeconds: 60, cooldownSeconds: 60 },
    },
  },
}
```

Those are the defaults; you only need the block to change them. Channels can override it per channel, account or room. Reference: [Bot loop protection](https://docs.openclaw.ai/channels/bot-loop-protection).

---

## What the Agent May Do per Channel

There is no generic `permissions` block. Two layers control what happens on a channel:

- **Who can trigger the agent**: `dmPolicy`, `groupPolicy` and the allowlists above.
- **What the agent can do there**: channel `actions.*` gates (for example `channels.discord.actions.moderation`, `channels.telegram.actions.deleteMessage`) and tool policy, including per-chat `tools` overrides on channels that support them.

The agent can run shell commands, read files and browse no matter which channel the message came from. Anyone who can message it can steer it. Keep exec approvals on for chat-triggered work and read [Security Hardening](/security/hardening) before you open a channel to other people.

---

## Multi-Channel Routing

One agent can read from one channel and post to another ("summarise today's Slack threads and send them to my Telegram DM"). It can only read rooms it has been added to and post where the platform allows it.

To route channels to **different agents**, use top-level `bindings`:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    entries: {
      main: {},
      work: { workspace: "~/.openclaw/workspace-work" },
    },
  },
  bindings: [
    { agentId: "work", match: { channel: "slack", accountId: "*" } },
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
  ],
}
```

The most specific match wins. Reference: [Multi-agent routing](https://docs.openclaw.ai/concepts/multi-agent) and [Channel routing](https://docs.openclaw.ai/channels/channel-routing).

---

## Channel Security

### Prompt injection sanitization

OpenClaw sanitizes incoming channel content to make prompt injection harder:

1. **Strips LLM special tokens**: chat-template delimiters from major model families (ChatML `<|im_start|>`, Llama `<|start_header_id|>`, Gemma `<start_of_turn>`, Mistral `[INST]`, Phi and GPT-OSS tokens) are removed.
2. **Wraps external content in boundary markers**: it is enclosed in `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` with `Source: External` metadata.

:::info
This closes tokenizer-level bypasses. It does not make untrusted messages safe to act on. See [Security Hardening](/security/hardening) for the rest of the defense stack.
:::

### Credentials

Channel tokens accept plain strings, `${ENV_VAR}` substitution, or a **SecretRef**:

| Source | Example |
|--------|---------|
| Environment variable | `"${DISCORD_BOT_TOKEN}"` or `{ source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" }` |
| File | `{ source: "file", provider: "<name>", id: "..." }` with the provider registered under `secrets.providers` |
| Exec (password manager CLI) | `{ source: "exec", provider: "<name>", id: "..." }`, same |
| Secret Store | `{ source: "store", provider: "default", id: "..." }` |

Plaintext tokens in config or `.env` are readable by the agent itself. SecretRefs keep them out of reach. Telegram's `tokenFile` must be a regular file; symlinks are rejected. Reference: [Secrets](https://docs.openclaw.ai/gateway/secrets).

### Encryption comparison

| Channel | Encryption | Metadata exposure | Self-hostable |
|---------|-----------|-------------------|---------------|
| **Signal** | E2E | Minimal | No (you run `signal-cli`) |
| **WhatsApp** | E2E | Meta collects metadata | No |
| **Matrix** | Optional E2E | Depends on homeserver | Yes |
| **Telegram** | TLS to Telegram servers (bots cannot use secret chats) | Moderate | Partial (Bot API server) |
| **Discord** | TLS only | High | No |
| **Slack** | TLS only | High (workspace retention) | No |
| **WebChat** | Your Gateway, over loopback or your TLS | You control everything | Yes |
| **IRC** | TLS optional | High | Yes |
| **Nostr** | NIP-04 encrypted DMs | Relays see metadata | Yes |

### Security checklist

- [ ] Keep `dmPolicy` at `pairing` or `allowlist` on every channel
- [ ] Keep `groupPolicy: "allowlist"` and `requireMention: true` in rooms strangers can join
- [ ] Set `session.dmScope: "per-channel-peer"` if more than one person can DM the bot
- [ ] Store channel tokens as SecretRefs, not plaintext
- [ ] Keep the Gateway on `gateway.bind: "loopback"` with token auth
- [ ] Run `openclaw security audit` after adding a channel
- [ ] Review [Security Hardening](/security/hardening)

---

## Managing Channels

```bash
openclaw channels list                       # configured channels
openclaw channels list --all                 # plus bundled and installable ones
openclaw channels status --probe             # check credentials and connections
openclaw channels logs --channel whatsapp    # recent channel log lines
openclaw channels login --channel whatsapp   # re-link after a logout or expired session
openclaw channels logout --channel whatsapp
openclaw channels remove --channel telegram  # disable (add --delete to remove config)
openclaw channels dead-letters list --channel telegram   # failed inbound events
openclaw plugins search matrix               # find channel plugins on ClawHub
```

There is no `reconnect` command. For a token channel, fix the token and let hot reload apply it, or run `openclaw gateway restart`. For a QR channel, run `channels login` again.

---

## Plugin Architecture

Channels are plugins. Telegram, A2A and Reef ship in core; the official ones live in the OpenClaw repo under `extensions/<id>` and publish as `@openclaw/<id>`; external ones publish under their own scope. WhatsApp's runtime ships outside the core npm package so its dependencies stay with the plugin, and the Gateway loads it only when the channel is active.

The channel plugin SDK lives at `openclaw/plugin-sdk/channel-core` (`defineChannelPluginEntry`, `createChatChannelPlugin`). Core owns the shared `message` tool, session keys and dispatch; a plugin supplies config, security, pairing and outbound delivery for its platform. See [Custom Channels](/guides/custom-channels).

---

## Troubleshooting

Start with `openclaw channels status --probe` and `openclaw channels logs --channel <id>`. Upstream has a per-symptom guide: [Channel troubleshooting](https://docs.openclaw.ai/channels/troubleshooting).

### WhatsApp

| Problem | Cause | Fix |
|---------|-------|-----|
| QR code doesn't appear | Plugin not installed, or Gateway down | `openclaw plugins install @openclaw/whatsapp`; `openclaw status` |
| QR expires before you scan it | QR relayed through screenshots or chat | Scan from the terminal directly, or use a faster path to the phone |
| Session keeps dropping | Network or WhatsApp Web instability | Update OpenClaw; check `openclaw channels logs --channel whatsapp`; re-run `channels login` |
| Account banned | Automated usage detected | Lower volume, use a dedicated number, keep a fallback channel |

### Telegram

| Problem | Cause | Fix |
|---------|-------|-----|
| Bot ignores group messages | Privacy Mode, or group not in `groups` | `/setprivacy` → Disable and re-add the bot; add the group ID or `"*"` under `groups` |
| Your DMs are ignored | `allowFrom` has a username | Use the numeric user ID; run `openclaw doctor --fix` |
| Webhook not receiving | Ingress not pointing at the Gateway port and `webhookPath` | Check the reverse proxy and HTTPS certificate; `openclaw channels status --probe` |

### Discord

| Problem | Cause | Fix |
|---------|-------|-----|
| Bot doesn't respond in a server | Message Content Intent off, or guild not allowed | Enable the intent; add the guild under `guilds` |
| Can't read messages | Missing permissions | Re-invite with `Read Message History` |
| Responds to everything | Mention gating off | Set `requireMention: true` on the guild |

### Slack

| Problem | Cause | Fix |
|---------|-------|-----|
| Socket Mode won't connect | Missing App-Level Token | Create one under Basic Information → App-Level Tokens |
| Can't post to a channel | Bot not in channel, or channel not allowed | `/invite @botname`; add the channel ID under `channels` |

### General

| Problem | Cause | Fix |
|---------|-------|-----|
| New sender gets no reply | DM pairing pending | `openclaw pairing list <channel>`, then approve |
| Messages silently dropped | `dmPolicy`/`groupPolicy` blocking | Check policies and allowlists; `openclaw channels logs` |
| Gateway won't start after a config edit | Unknown key (the schema is strict) | `openclaw config validate`; `openclaw doctor --fix` for retired keys |
| Two bots reply to each other | Loop protection disabled | Remove `botLoopProtection.enabled: false` |

---

## See Also

- [Custom Channels](/guides/custom-channels): build a channel plugin with the SDK
- [WebClaw](/guides/webclaw): third-party web front-ends, and the built-in Control UI
- [API & Webhooks](/guides/api-webhooks): `/hooks` ingress and the Gateway protocol
- [Security Hardening](/security/hardening): channel access, secrets, prompt injection
- [First 7 Days: Day 5](/guides/first-7-days/day-5-multi-channel): multi-channel tutorial
- [Configuration Reference](/reference/configuration): all settings
