---
sidebar_position: 3
title: "Recipe: Smart Home"
description: Control lights, devices, and home automation through OpenClaw
---

# Recipe: Smart Home

Use OpenClaw to control smart home devices through natural language, from any messaging platform.

## The Skill

```markdown title="~/.openclaw/skills/smart-home.md"
---
name: smart-home
version: 1.0.0
description: Natural language smart home control
trigger: "lights|temperature|thermostat|home|scene"
tools: [http, chat]
config:
  hue_bridge_ip: ""
  hue_api_key: ""
---

# Smart Home Control

## Supported Actions
- Turn lights on/off by room or name
- Set brightness and color
- Activate scenes (movie night, reading, sleep)
- Adjust thermostat
- Check device status

## Examples
- "Turn off all lights" → Send OFF to all Hue groups
- "Set living room to 50% warm white" → Hue API call
- "Movie night" → Activate movie scene (dim lights, warm colors)
```

## Usage

From any connected channel (WhatsApp, Telegram, etc.):

```
You: "Turn off the bedroom lights"
OpenClaw: Done. Bedroom lights are off.

You: "Set the office to bright cool white"
OpenClaw: Office lights set to 100% brightness, 6500K color temperature.
```

## See Also

- [Channels & Integrations](/guides/channels) — Message from any platform
- [Skill Development](/guides/skill-development) — Building custom integrations
