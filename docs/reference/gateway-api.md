---
sidebar_position: 3
title: Gateway API
description: WebSocket message protocol for the OpenClaw Gateway control plane
---

# Gateway API

The Gateway exposes a WebSocket API on port 18789 (default) for programmatic control.

## Connecting

```typescript
const ws = new WebSocket('ws://localhost:18789');

ws.on('open', () => {
  console.log('Connected to OpenClaw Gateway');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log(msg.type, msg.payload);
});
```

## Message Format

All messages follow this structure:

```typescript
interface GatewayMessage {
  type: string;           // Message type
  id?: string;            // Optional correlation ID
  payload: object;        // Type-specific data
  timestamp: string;      // ISO 8601 timestamp
}
```

## Client → Gateway Messages

### `chat`

Send a message to the agent.

```json
{
  "type": "chat",
  "id": "msg-001",
  "payload": {
    "text": "What files are in my home directory?",
    "context": {},
    "options": {
      "model": "claude-opus-4-6",
      "no_memory": false
    }
  }
}
```

### `heartbeat_trigger`

Trigger an immediate heartbeat.

```json
{
  "type": "heartbeat_trigger",
  "payload": {
    "dry_run": false
  }
}
```

### `status`

Request gateway status.

```json
{
  "type": "status",
  "payload": {}
}
```

### `skill_invoke`

Directly invoke a skill.

```json
{
  "type": "skill_invoke",
  "payload": {
    "skill": "email-assistant",
    "args": "check for urgent emails"
  }
}
```

## Gateway → Client Messages

### `response`

Agent response to a chat message.

```json
{
  "type": "response",
  "id": "msg-001",
  "payload": {
    "text": "Here are the files in your home directory:\n...",
    "tool_calls": [],
    "tokens_used": 1250
  }
}
```

### `tool_call`

Notification that a tool is being executed.

```json
{
  "type": "tool_call",
  "payload": {
    "tool": "shell",
    "args": {"command": "ls ~"},
    "status": "executing"
  }
}
```

### `tool_result`

Result of a tool execution.

```json
{
  "type": "tool_result",
  "payload": {
    "tool": "shell",
    "output": "Desktop\nDocuments\nDownloads\n...",
    "exit_code": 0
  }
}
```

### `error`

Error response.

```json
{
  "type": "error",
  "payload": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required for this operation"
  }
}
```

### `heartbeat_status`

Result of a heartbeat cycle.

```json
{
  "type": "heartbeat_status",
  "payload": {
    "result": "HEARTBEAT_OK",
    "actions_taken": 0,
    "tokens_used": 450
  }
}
```

## Authentication

By default, the Gateway trusts all localhost connections. For additional security:

```yaml title="~/.openclaw/config.yml"
gateway:
  auth:
    enabled: true
    token: "${OPENCLAW_AUTH_TOKEN}"
```

Include the token in the WebSocket URL:

```typescript
const ws = new WebSocket('ws://localhost:18789?token=your-auth-token');
```

:::danger
**The lack of default authentication was the root cause of CVE-2026-25253.** Enable auth if multiple users share the machine.
:::

## See Also

- [The Gateway](/architecture/gateway) — Architecture details
- [Configuration](/reference/configuration) — Gateway config options
- [Security Hardening](/security/hardening) — Securing the API
