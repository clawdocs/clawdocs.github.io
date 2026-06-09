---
sidebar_position: 14
title: API & Webhooks
description: Integrate OpenClaw with external systems using the WebSocket API, webhook ingress/egress, and HTTP channels
keywords: [openclaw, openclaw api, webhook, websocket, integration, rest api]
---

# API & Webhooks

OpenClaw exposes a real-time WebSocket control plane and a webhook system for bidirectional integration with external services. This guide covers how to programmatically send messages, trigger skills, receive notifications, and build integrations with CI/CD pipelines, monitoring systems, chat platforms, and automation tools.

:::tip Key concept
OpenClaw uses **WebSocket** for real-time control and **HTTP webhooks** for event-driven integration. There is no traditional REST API — everything is either a WebSocket message or a webhook POST.
:::

---

## Architecture

```
External Systems                    OpenClaw Gateway (port 18789)
─────────────────                   ─────────────────────────────
                                    
GitHub Actions ─── webhook POST ──► /webhook/deploy-alert ──► Agent processes
Monitoring     ─── webhook POST ──► /webhook/error-alert  ──► Agent investigates
Your App       ─── WebSocket ─────► ws://localhost:18789   ──► Full control
                                    
                                    Agent events ──► webhook POST ──► Slack
                                    Agent errors ──► webhook POST ──► PagerDuty
                                    Messages     ──► webhook POST ──► Your App
```

| Method | Direction | Use Case |
|--------|-----------|----------|
| WebSocket API | Bidirectional | Full agent control — send messages, invoke skills, get responses |
| Webhook Ingress | External → Agent | Trigger actions from CI/CD, monitoring, forms, IoT |
| Webhook Egress | Agent → External | Notify Slack, PagerDuty, your app when events occur |
| Custom HTTP Channel | Both | Build a full HTTP API adapter for your platform |

---

## WebSocket API

### Connecting

The gateway listens on `ws://localhost:18789` by default:

```javascript
const ws = new WebSocket('ws://localhost:18789');

ws.onopen = () => {
  console.log('Connected to OpenClaw gateway');
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('Received:', msg.type, msg.payload);
};
```

With authentication enabled:

```javascript
const ws = new WebSocket('ws://localhost:18789?token=your-auth-token');
```

### Message Format

Every message follows this structure:

```json
{
  "type": "message_type",
  "id": "optional-correlation-id",
  "payload": {},
  "timestamp": "2026-06-08T12:00:00Z"
}
```

The `id` field lets you correlate responses to requests. If omitted, the gateway generates one.

### Sending Messages

#### Chat Message

Send a message to the agent as if a user typed it:

```json
{
  "type": "chat",
  "id": "msg-001",
  "payload": {
    "text": "What's the status of our deployment?",
    "context": {
      "user": "api-client",
      "channel": "api"
    },
    "options": {
      "model": "claude-haiku-4-5-20251001",
      "no_memory": false
    }
  }
}
```

**Response:**

```json
{
  "type": "response",
  "id": "msg-001",
  "payload": {
    "text": "All systems operational. Last deploy was 2 hours ago...",
    "tool_calls": [],
    "tokens_used": 847
  }
}
```

#### Invoke a Skill

Trigger a specific skill directly, bypassing the brain's routing:

```json
{
  "type": "skill_invoke",
  "id": "skill-001",
  "payload": {
    "skill": "deploy-check",
    "args": {
      "service": "api-v2",
      "environment": "production"
    }
  }
}
```

#### Trigger Heartbeat

Run the heartbeat cycle on demand:

```json
{
  "type": "heartbeat_trigger",
  "id": "hb-001",
  "payload": {
    "dry_run": false
  }
}
```

**Response:**

```json
{
  "type": "heartbeat_status",
  "id": "hb-001",
  "payload": {
    "status": "HEARTBEAT_OK",
    "actions_taken": ["checked channels", "sent morning brief"],
    "tokens_used": 2340
  }
}
```

#### Request Status

Get current gateway state:

```json
{
  "type": "status",
  "id": "status-001"
}
```

### Event Stream

The gateway pushes events as they happen:

```json
{
  "type": "tool_call",
  "payload": {
    "tool": "shell",
    "args": "git status"
  }
}
```

```json
{
  "type": "tool_result",
  "payload": {
    "tool": "shell",
    "output": "On branch main\nnothing to commit",
    "exit_code": 0
  }
}
```

```json
{
  "type": "error",
  "payload": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication token required"
  }
}
```

### Node.js Client Example

```javascript
import WebSocket from 'ws';

class OpenClawClient {
  constructor(url = 'ws://localhost:18789', token = null) {
    const wsUrl = token ? `${url}?token=${token}` : url;
    this.ws = new WebSocket(wsUrl);
    this.pending = new Map();
    this.counter = 0;

    this.ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id && this.pending.has(msg.id)) {
        this.pending.get(msg.id)(msg);
        this.pending.delete(msg.id);
      }
    });
  }

  send(type, payload) {
    return new Promise((resolve) => {
      const id = `req-${++this.counter}`;
      this.pending.set(id, resolve);
      this.ws.send(JSON.stringify({ type, id, payload }));
    });
  }

  async chat(text, options = {}) {
    return this.send('chat', { text, ...options });
  }

  async invokeSkill(skill, args = {}) {
    return this.send('skill_invoke', { skill, args });
  }

  async triggerHeartbeat(dryRun = false) {
    return this.send('heartbeat_trigger', { dry_run: dryRun });
  }

  async status() {
    return this.send('status', {});
  }
}

// Usage
const claw = new OpenClawClient(
  'ws://localhost:18789',
  process.env.OPENCLAW_AUTH_TOKEN
);

claw.ws.on('open', async () => {
  const status = await claw.status();
  console.log('Gateway status:', status.payload);

  const reply = await claw.chat('Summarize today\'s alerts');
  console.log('Agent says:', reply.payload.text);
});
```

### Python Client Example

```python
import asyncio
import json
import websockets

class OpenClawClient:
    def __init__(self, url='ws://localhost:18789', token=None):
        self.url = f'{url}?token={token}' if token else url
        self.ws = None
        self.counter = 0
        self.pending = {}

    async def connect(self):
        self.ws = await websockets.connect(self.url)
        asyncio.create_task(self._listen())

    async def _listen(self):
        async for data in self.ws:
            msg = json.loads(data)
            msg_id = msg.get('id')
            if msg_id and msg_id in self.pending:
                self.pending[msg_id].set_result(msg)
                del self.pending[msg_id]

    async def send(self, msg_type, payload):
        self.counter += 1
        msg_id = f'req-{self.counter}'
        future = asyncio.get_event_loop().create_future()
        self.pending[msg_id] = future
        await self.ws.send(json.dumps({
            'type': msg_type,
            'id': msg_id,
            'payload': payload
        }))
        return await future

    async def chat(self, text, **options):
        return await self.send('chat', {'text': text, **options})

    async def invoke_skill(self, skill, args=None):
        return await self.send('skill_invoke', {'skill': skill, 'args': args or {}})

    async def heartbeat(self, dry_run=False):
        return await self.send('heartbeat_trigger', {'dry_run': dry_run})

# Usage
async def main():
    import os
    client = OpenClawClient(token=os.environ.get('OPENCLAW_AUTH_TOKEN'))
    await client.connect()

    reply = await client.chat('What happened overnight?')
    print(reply['payload']['text'])

asyncio.run(main())
```

### curl (Quick Test)

Use `websocat` for quick WebSocket testing from the command line:

```bash
# Install websocat
cargo install websocat
# or: brew install websocat

# Send a chat message
echo '{"type":"chat","id":"test-1","payload":{"text":"Hello from the API"}}' | \
  websocat ws://localhost:18789

# Interactive session
websocat ws://localhost:18789?token=your-token
```

---

## Webhook Ingress (External to Agent)

Webhook ingress lets external systems trigger agent actions via HTTP POST.

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "webhooks": {
    "incoming": {
      "enabled": true,
      "secret": "your-webhook-secret",
      "endpoints": [
        {
          "path": "/deploy-alert",
          "message": "Deployment completed: {{body.service}} is now {{body.status}} (commit {{body.commit}})"
        },
        {
          "path": "/error-alert",
          "message": "Production error in {{body.service}}: {{body.error}}"
        },
        {
          "path": "/github-event",
          "message": "GitHub event: {{body.action}} on {{body.repository.full_name}}"
        },
        {
          "path": "/form-submission",
          "message": "New form submission from {{body.email}}: {{body.message}}"
        }
      ]
    }
  }
}
```

### Sending a Webhook

```bash
# Trigger a deploy alert
curl -X POST http://localhost:18789/webhook/deploy-alert \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-webhook-secret" \
  -d '{"service": "api-v2", "status": "success", "commit": "abc123"}'

# Trigger an error alert
curl -X POST http://localhost:18789/webhook/error-alert \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-webhook-secret" \
  -d '{"service": "payments", "error": "Connection timeout to database"}'
```

### Template Variables

The `message` field supports `{{body}}` interpolation:

| Variable | Description |
|----------|-------------|
| `{{body}}` | Entire POST body as string |
| `{{body.field}}` | Specific field from JSON body |
| `{{body.nested.field}}` | Nested field access |

### Security

Always set a webhook secret:

```json5
{
  "webhooks": {
    "incoming": {
      "secret": "${WEBHOOK_SECRET}"
    }
  }
}
```

The gateway validates the `X-Webhook-Secret` header against this value. Requests without a matching secret are rejected with 401.

For stronger security, use HMAC-SHA256 validation in a custom channel adapter (see [Custom Channels](/guides/custom-channels) for the full HMAC implementation).

---

## Webhook Egress (Agent to External)

Webhook egress sends HTTP POST notifications when events occur inside the agent.

### Configuration

```json5 title="~/.openclaw/openclaw.json"
{
  "webhooks": {
    "outgoing": [
      {
        "event": "agent.task.completed",
        "url": "https://hooks.slack.com/services/T00/B00/your-webhook-url",
        "headers": {
          "Content-Type": "application/json"
        }
      },
      {
        "event": "agent.error",
        "url": "https://events.pagerduty.com/v2/enqueue",
        "headers": {
          "Content-Type": "application/json"
        }
      },
      {
        "event": "channel.message.received",
        "url": "https://your-app.example.com/agent-messages",
        "headers": {
          "Authorization": "Bearer ${APP_API_KEY}"
        },
        "filter": {
          "channel": "telegram"
        }
      },
      {
        "event": "security.alert",
        "url": "https://your-siem.example.com/api/events"
      },
      {
        "event": "channel.disconnected",
        "url": "https://your-monitoring.example.com/alerts"
      }
    ]
  }
}
```

### Supported Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `agent.task.completed` | Skill or task finishes | Task name, result, duration |
| `agent.error` | Unhandled error occurs | Error message, stack, context |
| `channel.message.received` | Message arrives on a channel | Channel, sender, text |
| `channel.disconnected` | Channel adapter loses connection | Channel name, error |
| `security.alert` | Security event detected | Alert type, severity, details |

### Filtering

Add a `filter` object to only fire on matching events:

```json5
{
  "event": "channel.message.received",
  "url": "https://your-app.example.com/vip-messages",
  "filter": {
    "channel": "telegram",
    "sender": "boss-user-id"
  }
}
```

---

## Integration Patterns

### Pattern 1: GitHub Actions Trigger

Notify your agent when a deployment completes:

```yaml title=".github/workflows/deploy.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh

      - name: Notify OpenClaw
        if: always()
        run: |
          curl -X POST https://your-agent.example.com/webhook/deploy-alert \
            -H "Content-Type: application/json" \
            -H "X-Webhook-Secret: ${{ secrets.OPENCLAW_WEBHOOK_SECRET }}" \
            -d "{\"service\": \"${{ github.repository }}\", \"status\": \"${{ job.status }}\", \"commit\": \"${{ github.sha }}\", \"actor\": \"${{ github.actor }}\"}"
```

The agent receives a message like: *"Deployment completed: myorg/api is now success (commit abc1234)"* and can run post-deploy checks, notify the team, or roll back if the status is `failure`.

### Pattern 2: Slack Bot via Webhooks

Forward agent messages to Slack:

```json5 title="Egress to Slack"
{
  "webhooks": {
    "outgoing": [
      {
        "event": "agent.task.completed",
        "url": "https://hooks.slack.com/services/T00/B00/xxx",
        "transform": {
          "text": "OpenClaw completed: {{event.task_name}} — {{event.result}}"
        }
      }
    ]
  }
}
```

Receive commands from Slack (using Slack's outgoing webhooks):

```json5 title="Ingress from Slack"
{
  "webhooks": {
    "incoming": {
      "endpoints": [
        {
          "path": "/slack-command",
          "message": "Slack user {{body.user_name}} says: {{body.text}}"
        }
      ]
    }
  }
}
```

### Pattern 3: Home Assistant

Trigger agent actions from smart home events:

```yaml title="Home Assistant automation"
automation:
  - alias: "Notify agent on motion"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door_motion
        to: "on"
    action:
      - service: rest_command.openclaw_webhook
        data:
          service: "security"
          event: "motion_detected"
          location: "front_door"

rest_command:
  openclaw_webhook:
    url: "http://192.168.1.100:18789/webhook/home-event"
    method: POST
    headers:
      Content-Type: "application/json"
      X-Webhook-Secret: !secret openclaw_webhook_secret
    payload: '{"service":"{{ service }}","event":"{{ event }}","location":"{{ location }}"}'
```

```json5 title="OpenClaw ingress config"
{
  "webhooks": {
    "incoming": {
      "endpoints": [
        {
          "path": "/home-event",
          "message": "Home event: {{body.event}} at {{body.location}}"
        }
      ]
    }
  }
}
```

### Pattern 4: n8n / Make / Zapier

Low-code automation platforms can trigger OpenClaw via webhook:

```
n8n Workflow:
  Trigger (Schedule/Event) → HTTP Request Node → OpenClaw Webhook

Config:
  Method: POST
  URL: https://your-agent.example.com/webhook/automation
  Headers: X-Webhook-Secret = your-secret
  Body: {"task": "generate-report", "params": {"period": "weekly"}}
```

And OpenClaw can trigger n8n workflows via egress webhooks:

```json5
{
  "webhooks": {
    "outgoing": [
      {
        "event": "agent.task.completed",
        "url": "https://your-n8n.example.com/webhook/agent-complete"
      }
    ]
  }
}
```

### Pattern 5: Custom Dashboard

Build a web dashboard that talks to your agent:

```html title="dashboard.html"
<script>
const ws = new WebSocket('ws://localhost:18789?token=your-token');

// Send a question
function askAgent(question) {
  ws.send(JSON.stringify({
    type: 'chat',
    id: `q-${Date.now()}`,
    payload: { text: question }
  }));
}

// Handle responses
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'response') {
    document.getElementById('output').textContent = msg.payload.text;
  }
};

// Request status on load
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'status', id: 'init' }));
};
</script>

<button onclick="askAgent('System health report')">Health Check</button>
<button onclick="askAgent('Token usage this week')">Token Report</button>
<pre id="output"></pre>
```

### Pattern 6: Monitoring Integration

Forward agent errors to PagerDuty:

```json5
{
  "webhooks": {
    "outgoing": [
      {
        "event": "agent.error",
        "url": "https://events.pagerduty.com/v2/enqueue",
        "transform": {
          "routing_key": "${PAGERDUTY_ROUTING_KEY}",
          "event_action": "trigger",
          "payload": {
            "summary": "OpenClaw error: {{event.message}}",
            "severity": "error",
            "source": "openclaw-agent"
          }
        }
      }
    ]
  }
}
```

Forward to Datadog:

```json5
{
  "webhooks": {
    "outgoing": [
      {
        "event": "agent.error",
        "url": "https://http-intake.logs.datadoghq.com/api/v2/logs",
        "headers": {
          "DD-API-KEY": "${DATADOG_API_KEY}",
          "Content-Type": "application/json"
        }
      }
    ]
  }
}
```

---

## Custom HTTP Channel

For full HTTP API control, build a custom channel adapter that exposes REST-like endpoints. This is more powerful than webhooks — you get structured request/response, authentication, and routing.

See [Custom Channels](/guides/custom-channels) for the complete tutorial. Here's the key pattern:

```typescript title="channels/http-api/index.ts"
import express from 'express';
import crypto from 'crypto';

export default class HttpApiChannel {
  name = 'http-api';
  private app = express();
  private server: any;
  private gateway: any;

  async connect(config: any, context: any) {
    this.gateway = context;
    this.app.use(express.json());

    // Verify HMAC signature
    this.app.use((req, res, next) => {
      const signature = req.headers['x-signature'] as string;
      const expected = crypto
        .createHmac('sha256', config.hmac_secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (signature !== expected) return res.status(401).json({ error: 'Invalid signature' });
      next();
    });

    // POST /message — send a message to the agent
    this.app.post('/message', async (req, res) => {
      const message = {
        id: crypto.randomUUID(),
        channel: this.name,
        text: req.body.text,
        sender: { id: req.body.user_id, name: req.body.user_name },
        conversation: { id: req.body.conversation_id || 'default', type: 'direct' },
        timestamp: Date.now()
      };

      // Store callback for async reply
      this.pendingReplies.set(message.id, res);
      context.onMessage(message);
    });

    // GET /health
    this.app.get('/health', (req, res) => {
      res.json({ ok: true, uptime: process.uptime() });
    });

    const port = config.port || 18800;
    this.server = this.app.listen(port);
  }

  async sendReply(message: any, reply: string) {
    const res = this.pendingReplies.get(message.id);
    if (res) {
      res.json({ reply, message_id: message.id });
      this.pendingReplies.delete(message.id);
    }
  }

  private pendingReplies = new Map();

  async disconnect() {
    this.server?.close();
  }
}
```

This gives you a synchronous HTTP API: POST a message, get the agent's reply in the response body.

---

## Exposing the Agent as an MCP Server

OpenClaw can also serve as an MCP server, letting other AI agents use your agent's skills as tools:

```bash
# Start OpenClaw as an MCP server
openclaw mcp serve
```

This exposes all installed skills as MCP tools over stdio or HTTP, making your agent composable with other MCP-compatible systems (Claude Desktop, other OpenClaw instances, custom agents).

```json5 title="Another agent's MCP config"
{
  "mcp": {
    "servers": {
      "my-openclaw": {
        "command": "ssh",
        "args": ["user@server", "openclaw", "mcp", "serve"]
      }
    }
  }
}
```

---

## Authentication & Security

### Enable Authentication

```json5 title="~/.openclaw/openclaw.json"
{
  "gateway": {
    "host": "127.0.0.1",
    "port": 18789,
    "auth": {
      "enabled": true,
      "mode": "token",
      "token": "${OPENCLAW_AUTH_TOKEN}"
    }
  }
}
```

```bash title="Set the token"
export OPENCLAW_AUTH_TOKEN=$(openssl rand -hex 32)
```

### Reverse Proxy (Nginx)

For external access, always put a reverse proxy in front:

```nginx title="/etc/nginx/sites-available/openclaw-api"
upstream openclaw {
    server 127.0.0.1:18789;
}

server {
    listen 443 ssl;
    server_name agent.example.com;

    ssl_certificate /etc/letsencrypt/live/agent.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agent.example.com/privkey.pem;

    # WebSocket upgrade
    location /ws {
        proxy_pass http://openclaw;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Webhook endpoints
    location /webhook/ {
        proxy_pass http://openclaw;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
    }

    # Block everything else
    location / {
        return 404;
    }
}
```

### Trusted Proxies

When behind a reverse proxy, configure trusted proxies so the gateway validates the real client IP:

```json5
{
  "gateway": {
    "bind": "loopback",
    "trustedProxies": ["127.0.0.1"],
    "auth": {
      "mode": "token"
    }
  }
}
```

### Security Checklist

- [ ] **Never bind to 0.0.0.0** — always use `127.0.0.1` (loopback)
- [ ] **Enable authentication** — set `gateway.auth.enabled: true`
- [ ] **Use a strong token** — at least 32 random bytes
- [ ] **Set webhook secrets** — validate `X-Webhook-Secret` on all ingress
- [ ] **Use TLS** — terminate SSL at the reverse proxy
- [ ] **Strip forwarded headers** — prevent IP spoofing through proxy
- [ ] **Rate limit** — configure `max_messages_per_hour` per channel
- [ ] **Audit logs** — enable `log_level: "info"` to track API access

---

## Rate Limiting

### Channel-Level Limits

```json5
{
  "channels": {
    "http-api": {
      "max_messages_per_hour": 100,
      "cooldown_seconds": 2,
      "max_connections": 10
    }
  }
}
```

### Gateway-Level Limits

```json5
{
  "gateway": {
    "max_connections": 10
  }
}
```

For webhook ingress, implement rate limiting at the reverse proxy layer:

```nginx
limit_req_zone $binary_remote_addr zone=webhooks:10m rate=10r/s;

location /webhook/ {
    limit_req zone=webhooks burst=20 nodelay;
    proxy_pass http://openclaw;
}
```

---

## Remote Access

### SSH Tunnel (Simplest)

Access your agent's API from anywhere without exposing it to the internet:

```bash
# On your local machine
ssh -L 18789:localhost:18789 user@your-server

# Now connect locally
websocat ws://localhost:18789?token=your-token
```

### Tailscale / WireGuard

For always-on remote access without port exposure:

```bash
# Install Tailscale on your VPS
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Access from any Tailscale device
websocat ws://100.x.y.z:18789?token=your-token
```

### Cloudflare Tunnel

Zero-config HTTPS tunnel:

```bash
# On your VPS
cloudflared tunnel create openclaw
cloudflared tunnel route dns openclaw agent.example.com

# Config
cloudflared tunnel run --url ws://localhost:18789 openclaw
```

---

## Error Handling

### Common Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| `AUTH_REQUIRED` | No token provided or auth enabled | Add `?token=` to WebSocket URL |
| `AUTH_INVALID` | Token doesn't match | Check `OPENCLAW_AUTH_TOKEN` |
| `RATE_LIMITED` | Too many requests | Reduce request frequency |
| `SKILL_NOT_FOUND` | Skill name doesn't exist | Check `openclaw skills list` |
| `GATEWAY_BUSY` | Max connections reached | Wait or increase `max_connections` |
| `WEBHOOK_INVALID` | Bad webhook path or missing secret | Check endpoint config and secret header |

### Reconnection

WebSocket connections can drop. Always implement reconnection:

```javascript
function connectWithRetry(url, maxRetries = 10) {
  let retries = 0;

  function connect() {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      retries = 0;
      console.log('Connected');
    };

    ws.onclose = () => {
      if (retries < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retries), 30000);
        retries++;
        console.log(`Reconnecting in ${delay}ms (attempt ${retries})`);
        setTimeout(connect, delay);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err.message);
      ws.close();
    };

    return ws;
  }

  return connect();
}
```

---

## Testing

### Test Webhook Ingress

```bash
# Verify webhook endpoint is accessible
curl -v -X POST http://localhost:18789/webhook/deploy-alert \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{"service": "test", "status": "success"}'

# Expected: 200 OK
```

### Test WebSocket API

```bash
# Using websocat
echo '{"type":"status","id":"test"}' | websocat ws://localhost:18789

# Using wscat
npx wscat -c ws://localhost:18789?token=your-token
> {"type":"chat","id":"t1","payload":{"text":"ping"}}
```

### Test Webhook Egress

```bash
# Start a local listener
npx http-echo-server 9999

# Configure egress to localhost:9999
# Trigger an event and check the listener output
```

### Health Check

```bash
# CLI
openclaw status
openclaw doctor

# From another machine (via SSH)
ssh user@server "openclaw doctor"

# HTTP (if custom channel exposes /health)
curl http://localhost:18800/health
```

---

## See Also

- [Gateway API Reference](/reference/gateway-api) — Complete WebSocket message specification
- [Custom Channels](/guides/custom-channels) — Build a full HTTP API channel adapter
- [Automation](/guides/automation) — Cron jobs, webhook triggers, and scheduling
- [Security Hardening](/security/hardening) — Gateway auth, TLS, and reverse proxy setup
- [Monitoring & Observability](/guides/monitoring) — Health checks and alerting
- [CI/CD & Testing](/guides/cicd-testing) — Pipeline integration with webhooks
- [MCP Servers](/guides/mcp-servers) — MCP protocol for tool integration
- [Configuration Reference](/reference/configuration) — All gateway config options
- [Environment Variables](/reference/environment-variables) — API tokens and port settings
