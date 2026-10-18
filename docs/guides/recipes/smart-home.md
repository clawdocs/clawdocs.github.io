---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: "Recipe: Smart Home"
description: Control Philips Hue lights in plain language with the bundled openhue skill, limited to your own DMs and one allowlisted command
keywords: [openclaw, smart home, home automation, philips hue, openhue, iot control, home assistant]
---

# Recipe: Smart Home

:::danger Read before you run this recipe
This recipe gives an agent your shell (through `openhue`) and your lights. By default OpenClaw runs host commands **without asking** (`tools.exec.mode` is `full`) and the sandbox is **off**. Turn on approvals first (`openclaw config set tools.exec.mode ask`), use a strong model for anything that runs tools unattended, and give the agent only the accounts and devices it needs. See [Security hardening](/security/hardening#exec-approvals) and upstream [permission modes](https://docs.openclaw.ai/tools/permission-modes).
:::

Turn lights on and off, dim rooms and set scenes from chat. This recipe covers Philips Hue. For locks, alarms, thermostats and other devices, see the [Home Assistant recipe](/guides/recipes/advanced-recipes#home-assistant-control), which needs stricter guardrails.

## The Skill

OpenClaw ships a bundled `openhue` skill that drives the [OpenHue CLI](https://www.openhue.io/cli). There is nothing to write or install from ClawHub. Install the CLI on the Gateway host and pair it with your Hue Bridge:

```bash
brew install openhue/cli/openhue-cli   # or see openhue.io/cli for other installs
openhue setup                          # press the button on the Hue Bridge when asked
openhue get room                       # check it can see your rooms
openclaw skills info openhue
```

`openhue setup` stores the bridge address and key in `~/.openhue/config.yaml`, owned by the OpenHue CLI. Don't copy the key into a skill file, `SOUL.md`, `AGENTS.md` or chat: workspace files are read by the agent and sent to your model provider. The Gateway host must be on the same local network as the bridge.

## Guardrails

Lights are low-stakes, but the pattern is the one to use for any device:

1. **Only you can reach it.** Use an allowlist rather than pairing on the channel you control the house from, and keep the bot out of groups.
2. **Only the one command runs freely.** Turn exec approvals on, then allowlist `openhue`. OpenHue commands run without a prompt; anything else the agent tries to run waits for your approval.

```json5 title="~/.openclaw/openclaw.json"
{
  tools: {
    exec: { mode: "ask" }, // allowlisted commands run; everything else asks you
  },
  channels: {
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["123456789"], // your numeric Telegram user ID
      groupPolicy: "disabled",  // no group chats
    },
  },
}
```

```bash
openclaw config validate
openclaw approvals allowlist add openhue
openclaw exec-policy show
```

More on both: [who can talk to the agent](/security/hardening#channel-access) and [exec approvals](/security/hardening#exec-approvals).

## Usage

From your Telegram DM with the bot (or the Control UI):

```
You: Turn off the bedroom lights
Bot: Done. Bedroom is off.

You: Set the office to bright cool white
Bot: Office set to 100% brightness, cool white.

You: Movie mode in the living room
Bot: Living Room dimmed to 10%.
```

Under the hood the skill runs commands such as `openhue set room "Bedroom" --off` and `openhue set room "Office" --on --brightness 100 --temperature 250`.

The skill covers Hue lights, rooms, zones and scenes only. It does not control thermostats, plugs from other brands or TVs.

### Schedules

Lights on a schedule are an automation:

```bash
openclaw cron add "30 22 * * *" \
  "Dim the bedroom lights to 20% warm white." \
  --name "Bedtime lights" --tools exec,read --no-deliver
```

`--tools exec,read` lets the job run `openhue` (through the allowlist) and read the skill, nothing else. `--no-deliver` keeps the run out of your chat.

## See Also

- [Advanced Recipes: Home Assistant](/guides/recipes/advanced-recipes#home-assistant-control): more devices, more guardrails
- [Day 5: Channels](/guides/first-7-days/day-5-multi-channel): `dmPolicy` and allowlists
- [Skill Development](/guides/skill-development): building your own integrations
