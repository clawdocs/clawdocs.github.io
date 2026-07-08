---
sidebar_position: 13
title: MCP Servers
description: Find, connect, and build MCP servers for OpenClaw — the protocol that powers most integrations
keywords: [openclaw, openclaw mcp, model context protocol, mcp servers, tools, integrations]
---

# MCP Servers

The **Model Context Protocol (MCP)** is how OpenClaw connects to external tools, databases, APIs, and services. Instead of hardcoding integrations, MCP provides a standard wire protocol — any tool that speaks MCP works with any agent that speaks MCP.

As of mid-2026, the MCP ecosystem has **32,600+ servers** exposing **229,800+ tools**. This guide covers how to find, connect, and build them.

:::tip
MCP is the recommended integration path for most use cases. Before building a custom [plugin](/guides/plugin-system) or [skill](/guides/skill-development), check if an MCP server already exists for what you need.
:::

:::caution Security advisory
Versions v2026.5.20 through v2026.6.5 had a High-severity flaw ([GHSA-52xj-c9p8-78cv](https://github.com/openclaw/openclaw/security/advisories/GHSA-52xj-c9p8-78cv), CVSS 8.3) where the MCP loopback could expose owner-only tools to non-owner runs. Patched in v2026.6.6 — see the [June 2026 advisory batch](/security/known-vulnerabilities#june-2026-advisory-batch-june-30-2026).
:::

---

## What MCP Provides

MCP servers expose three capability types over a single connection:

| Capability | What It Does | Example |
|------------|-------------|---------|
| **Tools** | Functions the agent can call | `read_file`, `run_query`, `send_email` |
| **Resources** | Data the agent can read | Database schemas, config files, documentation |
| **Prompts** | Reusable prompt templates | Code review checklist, bug report format |

Most servers expose tools. Resources and prompts are optional capabilities that richer servers provide.

### Wire Protocol

MCP uses **JSON-RPC 2.0** — the same protocol used by VS Code's Language Server Protocol. Every message is a JSON object with a method name and parameters. You don't need to understand the wire format to use MCP, but it helps when debugging.

---

## Configuring MCP Servers

MCP servers are configured in `~/.openclaw/openclaw.json` under the `mcp.servers` key.

### Local Servers (stdio)

Local servers run as child processes. OpenClaw spawns them, communicates over stdin/stdout, and stops them when the gateway shuts down.

```json5 title="~/.openclaw/openclaw.json"
{
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"],
        "env": {}
      },
      "sqlite": {
        "command": "uvx",
        "args": ["mcp-server-sqlite", "--db-path", "/data/myapp.db"]
      },
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
        }
      }
    }
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `command` | Yes | Executable to run (`npx`, `uvx`, `node`, `python`, etc.) |
| `args` | No | Command-line arguments |
| `env` | No | Environment variables (supports `${VAR}` expansion) |

### Remote Servers (HTTP)

Remote servers run on a different machine. OpenClaw connects to them over HTTP.

```json5 title="~/.openclaw/openclaw.json"
{
  "mcp": {
    "servers": {
      "company-tools": {
        "url": "https://mcp.internal.company.com/sse",
        "transport": "sse",
        "headers": {
          "Authorization": "Bearer ${MCP_API_KEY}"
        }
      },
      "cloud-service": {
        "url": "https://api.example.com/mcp",
        "transport": "streamable-http",
        "headers": {
          "X-API-Key": "${SERVICE_KEY}"
        }
      }
    }
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Server endpoint URL |
| `transport` | No | `sse` (legacy) or `streamable-http` (modern, default) |
| `headers` | No | HTTP headers for authentication |

### Transport Types

| Transport | When to Use | How It Works |
|-----------|-------------|-------------|
| **stdio** | Local servers, CLI tools, development | Spawns process, communicates via stdin/stdout |
| **SSE** | Legacy remote servers | Server-Sent Events over HTTP (one-way streaming) |
| **Streamable HTTP** | Modern remote servers | Bidirectional HTTP streaming (preferred for new servers) |

**Default to stdio for local servers and Streamable HTTP for remote ones.** SSE is supported for backwards compatibility but is being phased out.

---

## CLI Commands

```bash
openclaw mcp <subcommand>
```

| Command | What It Does |
|---------|-------------|
| `openclaw mcp list` | Show configured MCP servers and their status |
| `openclaw mcp add <name>` | Interactive setup for a new server |
| `openclaw mcp status` | Connection status for all servers |
| `openclaw mcp probe <name>` | Test a server — list its tools, resources, prompts |
| `openclaw mcp doctor` | Diagnose connection issues |
| `openclaw mcp configure <name>` | Edit a server's config |
| `openclaw mcp login <name>` | Authenticate with an OAuth-based server |
| `openclaw mcp serve` | Expose your OpenClaw gateway as an MCP server |

### Quick Examples

```bash
# Add a new MCP server interactively
openclaw mcp add my-database

# Check what tools a server exposes
openclaw mcp probe filesystem

# Something broken? Run doctor
openclaw mcp doctor

# See all connections at a glance
openclaw mcp status
```

---

## Popular Servers

### Official Reference Servers

Maintained by Anthropic under the `@modelcontextprotocol` npm scope:

| Server | Tools | Use Case |
|--------|-------|----------|
| **Filesystem** | read, write, move, search files | File management |
| **Git** | log, diff, commit, branch, status | Repository operations |
| **GitHub** | issues, PRs, repos, search, actions | GitHub automation |
| **PostgreSQL** | query, schema inspection | Database access |
| **SQLite** | query, create tables, analyze | Local database |
| **Google Drive** | search, read, export files | Document access |
| **Brave Search** | web search, local search | Web queries |
| **Memory** | store, retrieve, search knowledge | Persistent key-value memory |
| **Sequential Thinking** | structured reasoning steps | Complex problem decomposition |
| **Fetch** | HTTP GET/POST with content extraction | Web scraping |

```bash
# Install and configure the GitHub server
openclaw mcp add github
# Or manually:
# "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"], "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"} }
```

### Community Servers by Category

#### Knowledge & RAG

| Server | What It Does |
|--------|-------------|
| **Qdrant** | Vector database for semantic search |
| **Pinecone** | Managed vector search |
| **Exa** | AI-native web search with content extraction |
| **Tavily** | Real-time web research API |
| **Obsidian** | Read and search Obsidian vaults |

#### Smart Home & IoT

| Server | What It Does |
|--------|-------------|
| **Home Assistant** | Control lights, sensors, automations, scenes |
| **Apple Shortcuts** | Trigger iOS/macOS shortcuts |

#### Developer Tools

| Server | What It Does |
|--------|-------------|
| **Sentry** | Query errors, releases, performance data |
| **Linear** | Manage issues, projects, cycles |
| **Docker** | Container management |
| **Kubernetes** | Cluster operations via kubectl |
| **Playwright** | Browser automation and testing |
| **Puppeteer** | Web scraping and screenshots |

#### Databases

| Server | What It Does |
|--------|-------------|
| **MongoDB** | Document queries and aggregations |
| **Redis** | Key-value operations |
| **MySQL** | SQL queries with schema inspection |
| **Neo4j** | Graph database queries (Cypher) |
| **Supabase** | PostgreSQL + Auth + Storage |

#### Communication

| Server | What It Does |
|--------|-------------|
| **Slack** | Read/send messages, manage channels |
| **Gmail** | Read, compose, search email |
| **Notion** | Page and database operations |
| **Todoist** | Task management |

#### Cloud & Infrastructure

| Server | What It Does |
|--------|-------------|
| **AWS** | S3, Lambda, EC2, CloudWatch operations |
| **Cloudflare** | DNS, Workers, KV, R2, D1 |
| **Vercel** | Deployments, domains, environment variables |

---

## Finding Servers

### MCP Registries

Three main registries index the ecosystem:

| Registry | Servers | URL |
|----------|---------|-----|
| **Glama** | 7,800+ | glama.ai/mcp/servers |
| **Smithery** | 6,200+ | smithery.ai |
| **Official Directory** | Curated | modelcontextprotocol.io/servers |

### From the CLI

```bash
# Browse available servers (searches ClawHub + registries)
openclaw mcp add
# Then search by keyword
```

### From npm / PyPI

Most servers are published as packages:

```bash
# Search npm for MCP servers
npm search @modelcontextprotocol

# Search PyPI for Python MCP servers
pip search mcp-server  # or browse pypi.org
```

---

## Building Custom Servers

When no existing server fits, build your own. The official SDKs handle the protocol — you just define your tools.

### TypeScript (recommended for most cases)

```bash
npm init -y
npm install @modelcontextprotocol/sdk
```

```typescript title="src/server.ts"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-tools",
  version: "1.0.0",
});

server.tool(
  "get_weather",
  "Get current weather for a city",
  { city: z.string().describe("City name") },
  async ({ city }) => {
    const response = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1`
    );
    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data.current_condition[0], null, 2),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

```bash
# Run it
npx tsx src/server.ts

# Configure in OpenClaw
# "my-tools": { "command": "npx", "args": ["tsx", "src/server.ts"] }
```

### Python (FastMCP)

```bash
pip install mcp
```

```python title="server.py"
from mcp.server.fastmcp import FastMCP
import httpx

mcp = FastMCP("my-tools")

@mcp.tool()
async def get_weather(city: str) -> str:
    """Get current weather for a city."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://wttr.in/{city}?format=j1")
        data = resp.json()
        return str(data["current_condition"][0])

if __name__ == "__main__":
    mcp.run()
```

```bash
# Run it
python server.py

# Or with uvx for zero-install usage
# "my-tools": { "command": "uvx", "args": ["my-tools-package"] }
```

### Server Capabilities

Beyond tools, servers can expose resources and prompts:

```typescript
// Resource — expose data the agent can read
server.resource(
  "config://app",
  "Application configuration",
  async () => ({
    contents: [{
      uri: "config://app",
      mimeType: "application/json",
      text: JSON.stringify(loadConfig()),
    }],
  })
);

// Prompt — reusable template
server.prompt(
  "code-review",
  "Review code for issues",
  { language: z.string() },
  ({ language }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Review this ${language} code for bugs, security issues, and style problems.`,
      },
    }],
  })
);
```

### Testing Your Server

```bash
# Probe to see what your server exposes
openclaw mcp probe my-tools

# Interactive test — sends tool calls and shows responses
npx @modelcontextprotocol/inspector
```

The MCP Inspector is a browser-based debugging UI that connects to any stdio or HTTP server and lets you call tools interactively.

---

## Expose OpenClaw as an MCP Server

OpenClaw can itself act as an MCP server, allowing other tools to call into your agent:

```bash
openclaw mcp serve
```

This exposes your agent's tools (skills, memory, heartbeat) over MCP, so other MCP clients — Claude Desktop, Cursor, VS Code, or another OpenClaw instance — can call them.

```json5 title="Example: connect from another OpenClaw instance"
{
  "mcp": {
    "servers": {
      "remote-agent": {
        "url": "https://your-server.com:3000/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${AGENT_TOKEN}"
        }
      }
    }
  }
}
```

---

## Security

MCP servers have significant access — they can read files, query databases, call APIs, and execute code. Treat them with the same care as shell scripts.

### Trust Model

| Trust Level | What to Check |
|-------------|--------------|
| **Official servers** | Maintained by Anthropic/protocol authors — generally safe |
| **Popular community** | Check stars, recent commits, open issues |
| **Unknown/new** | Read the source code before running |

### Credential Safety

- Use `${ENV_VAR}` expansion for all secrets — never hardcode tokens in config
- Scope API keys narrowly (read-only when possible)
- Rotate credentials regularly
- Review what environment variables a server's `env` block requests

### Tool Filtering

Restrict which tools an agent can call from a specific server:

```json5 title="~/.openclaw/openclaw.json"
{
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/safe-dir"],
        "allowed_tools": ["read_file", "list_directory"],
        "blocked_tools": ["write_file", "move_file"]
      }
    }
  }
}
```

### Sandboxing

- **stdio servers** run as child processes with your user's permissions
- **Filesystem servers** — restrict to specific directories (pass them as args)
- **Database servers** — use read-only database users when possible
- **Network servers** — run behind a firewall or VPN for internal tools

### Common Risks

| Risk | Mitigation |
|------|-----------|
| Server reads sensitive files | Restrict filesystem paths in server args |
| Server exfiltrates data | Monitor network traffic, use local-only servers |
| Malicious server in registry | Review source before installing, check maintainer reputation |
| Credential leak via env | Use `${VAR}` expansion, never commit config with tokens |
| Tool misuse by agent | Use `allowed_tools` / `blocked_tools` filtering |

---

## Patterns & Recipes

### Database Assistant

Give your agent read access to a production database for answering questions:

```json5
{
  "mcp": {
    "servers": {
      "prod-db": {
        "command": "uvx",
        "args": ["mcp-server-postgres"],
        "env": {
          "DATABASE_URL": "${READONLY_DB_URL}"
        }
      }
    }
  }
}
```

### Multi-Source Research

Combine web search, document access, and note-taking:

```json5
{
  "mcp": {
    "servers": {
      "brave-search": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-brave-search"],
        "env": { "BRAVE_API_KEY": "${BRAVE_API_KEY}" }
      },
      "google-drive": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-google-drive"],
        "env": { "GOOGLE_CREDENTIALS": "${GOOGLE_CREDS_PATH}" }
      },
      "obsidian": {
        "command": "npx",
        "args": ["-y", "mcp-obsidian", "--vault", "/path/to/vault"]
      }
    }
  }
}
```

### DevOps Toolkit

GitHub + Sentry + Docker for a development workflow:

```json5
{
  "mcp": {
    "servers": {
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
      },
      "sentry": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-sentry"],
        "env": { "SENTRY_AUTH_TOKEN": "${SENTRY_TOKEN}" }
      },
      "docker": {
        "command": "npx",
        "args": ["-y", "mcp-docker"]
      }
    }
  }
}
```

### Smart Home Control

```json5
{
  "mcp": {
    "servers": {
      "home-assistant": {
        "command": "uvx",
        "args": ["mcp-server-home-assistant"],
        "env": {
          "HA_URL": "http://homeassistant.local:8123",
          "HA_TOKEN": "${HA_LONG_LIVED_TOKEN}"
        }
      }
    }
  }
}
```

---

## Troubleshooting

**Server won't connect:**
```bash
openclaw mcp doctor            # Diagnose all servers
openclaw mcp probe <name>      # Test a specific server
```

**"Tool not found" errors:**
```bash
# List what tools the server actually exposes
openclaw mcp probe <name>
# Check for typos in allowed_tools / blocked_tools
```

**Server crashes on startup:**
```bash
# Test the server command directly
npx -y @modelcontextprotocol/server-filesystem /tmp
# Check for missing dependencies or bad args
```

**Slow tool calls:**
- stdio servers have no network overhead — if slow, the server itself is slow
- Remote servers add network latency — consider running them on the same machine
- Check if the server is doing expensive work per call (e.g., full table scans)

**Authentication failures:**
```bash
# Verify the env var is set
echo $GITHUB_TOKEN

# For OAuth servers, re-authenticate
openclaw mcp login <name>
```

**Too many tools confusing the agent:**
- Use `allowed_tools` to expose only what's needed
- Remove servers the agent doesn't need for its current role
- Split complex setups into task-specific configurations

---

## See Also

- [Plugin System](/guides/plugin-system) — Gateway-level extensions (different from MCP)
- [Configuration Reference](/reference/configuration) — Full `mcp.servers` config options
- [Advanced Recipes](/guides/recipes/advanced-recipes) — Multi-server integration patterns
- [Security Hardening](/security/hardening) — Protecting your gateway
- [Skill Development](/guides/skill-development) — Teaching agents new capabilities via Markdown
