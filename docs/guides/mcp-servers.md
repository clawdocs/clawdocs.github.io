---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: MCP Servers
description: Connect, filter, secure and build MCP servers for OpenClaw — the real mcp.servers config, transports, toolFilter, and vetted servers
keywords: [openclaw, openclaw mcp, model context protocol, mcp servers, tools, integrations]
---

# MCP Servers

The **Model Context Protocol (MCP)** is how an agent borrows tools from another program. An MCP server exposes tools, resources and prompts; OpenClaw connects to it and makes those tools available to your agents. Server definitions live under `mcp.servers` in `openclaw.json`, and the tools they expose go through the same tool profile and tool policy as every other tool.

The official references are [Connect MCP servers](https://docs.openclaw.ai/tools/mcp) and the [`openclaw mcp` CLI](https://docs.openclaw.ai/cli/mcp).

:::tip
Before building a custom [plugin](/guides/plugin-system) or [skill](/guides/skill-development), check whether the vendor already ships an MCP server.
:::

:::caution Security advisory
Versions v2026.5.20 through v2026.6.5 had a High-severity flaw ([GHSA-52xj-c9p8-78cv](https://github.com/openclaw/openclaw/security/advisories/GHSA-52xj-c9p8-78cv), CVSS 8.3) where the MCP loopback could expose owner-only tools to non-owner runs. Patched in v2026.6.6. See the [June 2026 advisory batch](/security/known-vulnerabilities#june-2026-advisory-batch-june-30-2026).
:::

---

## What MCP Provides

| Capability | What it does | Example |
|---|---|---|
| **Tools** | Functions the agent can call | `read_file`, `run_query`, `send_email` |
| **Resources** | Data the agent can read | Database schemas, documentation |
| **Prompts** | Reusable prompt templates | A code review checklist |

Most servers expose only tools. When a server also has resources or prompts, OpenClaw adds utility tools for them (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`).

MCP uses JSON-RPC 2.0 over one of three transports: stdio (a local child process), Streamable HTTP, or the older SSE.

---

## Adding a Server

Three ways, all writing the same `mcp.servers` entry:

1. **Control UI:** **Settings → MCP → Add server**, or in a chat **+ → Connectors → Add MCP server…**
2. **CLI:** `openclaw mcp add` with flags (it probes the server before saving)
3. **Config:** edit `openclaw.json` directly

Whichever you use, check that the server actually answers:

```bash
openclaw mcp doctor <name> --probe
```

### From the CLI

```bash
# Local stdio server
openclaw mcp add filesystem \
  --command npx \
  --arg -y --arg @modelcontextprotocol/server-filesystem --arg /home/user/projects

# Remote Streamable HTTP server, exposing only some tools
openclaw mcp add docs \
  --url https://mcp.example.com/mcp \
  --transport streamable-http \
  --include 'search,read_*'

# Remote server that uses MCP OAuth
openclaw mcp add tracker --url https://mcp.example.com/mcp --transport streamable-http --auth oauth
openclaw mcp login tracker
```

Other flags: `--env KEY=value`, `--cwd`, `--header KEY=value`, `--timeout`, `--connect-timeout`, `--exclude`, `--disabled`, `--no-probe`.

### Local servers (stdio)

OpenClaw spawns the process and talks to it over stdin/stdout.

```json5 title="~/.openclaw/openclaw.json"
{
  mcp: {
    servers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"],
      },
      git: {
        command: "uvx",
        args: ["mcp-server-git", "--repository", "/home/user/projects/myapp"],
      },
    },
  },
}
```

| Field | Description |
|---|---|
| `command` | Executable to spawn (required for stdio) |
| `args` | Command-line arguments |
| `env` | Extra environment variables. `${VAR}` substitution works here as in the rest of the config. |
| `cwd` | Working directory |
| `enabled` | `false` keeps the definition but does not connect |

OpenClaw silently drops interpreter and loader hooks from a stdio server's `env` (`NODE_OPTIONS`, `PYTHONSTARTUP`, `LD_*`, `DYLD_*`, `BASH_FUNC_*` and similar) and logs a warning. Ordinary credentials such as `GITHUB_TOKEN`, `DATABASE_URL` or `*_API_KEY` pass through.

### Remote servers (HTTP)

```json5 title="~/.openclaw/openclaw.json"
{
  mcp: {
    servers: {
      "cloud-service": {
        url: "https://api.example.com/mcp",
        transport: "streamable-http",
        headers: { "X-API-Key": "${SERVICE_KEY}" },
        connectionTimeoutMs: 5000,
        requestTimeoutMs: 20000,
      },
      "legacy-tools": {
        url: "https://mcp.internal.example.com/sse",
        transport: "sse",
        headers: { Authorization: "Bearer ${MCP_API_KEY}" },
      },
    },
  },
}
```

| Field | Description |
|---|---|
| `url` | Server endpoint (required for HTTP) |
| `transport` | `streamable-http` or `sse`. **When omitted, OpenClaw uses `sse`**, so always set it for Streamable HTTP servers. |
| `headers` | HTTP headers, for example auth tokens. Redacted in logs and status output. |
| `auth` | `"oauth"` to use credentials saved by `openclaw mcp login`; static `Authorization` headers are then ignored |
| `connectionTimeoutMs`, `requestTimeoutMs` | Per-server timeouts |
| `sslVerify`, `clientCert`, `clientKey` | TLS verification and mutual TLS |
| `supportsParallelToolCalls` | Hint that concurrent calls are safe |

The name `__proto__` is reserved. `openclaw mcp doctor` warns when a header or env value looks like a literal secret.

### Transport types

| Transport | When to use it |
|---|---|
| **stdio** | Local servers and CLI tools |
| **Streamable HTTP** | Remote servers; preferred for anything new |
| **SSE** | Older remote servers only |

---

## CLI Commands

| Command | What it does |
|---|---|
| `openclaw mcp list` | List configured servers |
| `openclaw mcp show [name]` | Print one server's definition, or all of them |
| `openclaw mcp status [--verbose]` | Transport, auth, timeouts and filters, without connecting |
| `openclaw mcp doctor [name] [--probe]` | Static checks; `--probe` also connects |
| `openclaw mcp probe [name]` | Connect and list tools, resources and prompts |
| `openclaw mcp add <name> [flags]` | Add a server from flags, probing first |
| `openclaw mcp set <name> <json>` | Write one server from a JSON object |
| `openclaw mcp configure <name>` | Change operator controls such as the Codex approval mode |
| `openclaw mcp tools <name> --include/--exclude/--clear` | Set the server's tool filter |
| `openclaw mcp login <name>` / `logout <name>` | OAuth sign-in and sign-out |
| `openclaw mcp reload` | Drop cached MCP runtimes in this process |
| `openclaw mcp unset <name>` | Remove a server |
| `openclaw mcp serve` | Run OpenClaw as a stdio MCP server (see below) |

```bash
openclaw mcp probe filesystem
openclaw mcp status --verbose
openclaw mcp doctor --probe
```

With Gateway hot reload, changed servers are picked up on the next turn. `openclaw mcp reload` only affects the CLI process it runs in; a Gateway elsewhere needs its own reload or restart. A server that fails to start is retried with exponential backoff (30 seconds, doubling up to 10 minutes).

---

## Filtering Tools

The real mechanism is `toolFilter` on each server, with `include` and `exclude` lists of tool names or `*` globs:

```json5 title="~/.openclaw/openclaw.json"
{
  mcp: {
    servers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/safe-dir"],
        toolFilter: {
          include: ["read_*", "list_*", "search_files"],
          exclude: ["write_file", "move_file"],
        },
      },
    },
  },
}
```

Or from the CLI:

```bash
openclaw mcp tools filesystem --include 'read_*,list_*,search_files' --exclude 'write_file,move_file'
openclaw mcp tools filesystem --clear
```

:::danger `allowed_tools` and `blocked_tools` do nothing
Server entries accept unknown keys without an error. Keys such as `allowed_tools`, `blocked_tools` or `allowedTools` pass `openclaw config validate` and are **silently ignored**, so every tool stays exposed. Use `toolFilter`, then confirm with `openclaw mcp status --verbose` or `openclaw mcp probe <name>`.
:::

Other layers:

- **Tool policy.** MCP tools are named `<server>__<tool>`. `tools.deny: ["filesystem__*"]` removes a whole server before it connects; `tools.deny: ["bundle-mcp"]` disables all MCP tools. The `minimal` tool profile hides MCP tools; `coding` and `messaging` include them.
- **Per session.** In a Control UI chat, **+ → Connectors → Tool access** lets you deny individual tools for that session.

---

## Vetted Servers

An MCP server is code with your credentials. Prefer the [MCP reference servers](https://github.com/modelcontextprotocol/servers) or the vendor's own official server, and check the npm or PyPI publisher before you run anything (`npm view <pkg> maintainers repository.url`).

### MCP reference servers

Maintained by the MCP project. They are reference implementations, written to demonstrate the protocol, not hardened products:

| Server | Package | Run with |
|---|---|---|
| Filesystem | `@modelcontextprotocol/server-filesystem` | `npx` |
| Memory | `@modelcontextprotocol/server-memory` | `npx` |
| Sequential Thinking | `@modelcontextprotocol/server-sequential-thinking` | `npx` |
| Everything (test server) | `@modelcontextprotocol/server-everything` | `npx` |
| Fetch | `mcp-server-fetch` | `uvx` (Python) |
| Git | `mcp-server-git` | `uvx` (Python) |
| Time | `mcp-server-time` | `uvx` (Python) |

The former GitHub, PostgreSQL, SQLite, Google Drive, Brave Search and Puppeteer reference servers are archived. Their npm packages (`@modelcontextprotocol/server-github`, `server-postgres`, `server-brave-search`, `server-gdrive`, `server-puppeteer`) are deprecated and no longer maintained. There is no `@modelcontextprotocol/server-sentry` or `server-google-drive`, and nothing under `@anthropic/mcp-*`.

### Vendor servers

| Service | Official server |
|---|---|
| GitHub | [github/github-mcp-server](https://github.com/github/github-mcp-server): remote at `https://api.githubcopilot.com/mcp/`, or the `ghcr.io/github/github-mcp-server` Docker image |
| Brave Search | `@brave/brave-search-mcp-server` ([brave/brave-search-mcp-server](https://github.com/brave/brave-search-mcp-server)) |
| Browser automation | `@playwright/mcp` ([microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)) |
| Sentry | `@sentry/mcp-server` ([getsentry/sentry-mcp](https://github.com/getsentry/sentry-mcp)) |
| Notion | `@notionhq/notion-mcp-server` ([makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server)) |
| Home Assistant | The built-in [Model Context Protocol Server](https://www.home-assistant.io/integrations/mcp_server/) integration |

For web search, OpenClaw also has a built-in `web_search` tool with a Brave provider, so you may not need an MCP server at all.

### Finding more

- [Official MCP Registry](https://registry.modelcontextprotocol.io) and the [servers repository](https://github.com/modelcontextprotocol/servers)
- Community directories such as [Glama](https://glama.ai/mcp/servers) and [Smithery](https://smithery.ai). Listing there is not a security review.
- `npm search mcp-server` or [pypi.org](https://pypi.org/search/?q=mcp-server). (`pip search` no longer works.)

---

## Recipes

### GitHub (remote, official)

```json5 title="~/.openclaw/openclaw.json"
{
  mcp: {
    servers: {
      github: {
        url: "https://api.githubcopilot.com/mcp/",
        transport: "streamable-http",
        headers: { Authorization: "Bearer ${GITHUB_MCP_PAT}" },
        toolFilter: { exclude: ["delete_*", "merge_pull_request"] },
      },
    },
  },
}
```

Use a fine-grained personal access token limited to the repositories the agent needs.

### Research: search plus fetch

```json5 title="~/.openclaw/openclaw.json"
{
  mcp: {
    servers: {
      "brave-search": {
        command: "npx",
        args: ["-y", "@brave/brave-search-mcp-server"],
        env: { BRAVE_API_KEY: "${BRAVE_API_KEY}" },
      },
      fetch: {
        command: "uvx",
        args: ["mcp-server-fetch"],
      },
    },
  },
}
```

### Databases

Give the agent a **read-only** database user, and use a server from the database vendor or one whose source you have read. Several popular names on PyPI and npm, such as `mcp-server-postgres` on PyPI, are unrelated packages from unknown authors. Do not hand them production credentials.

### Pinning

`npx -y` and `uvx` fetch the latest published version every time. For anything with credentials, pin a version (`@brave/brave-search-mcp-server@2.1.4`, `mcp-server-git==2026.10.10`) or install it once and point `command` at the installed binary.

---

## Building Custom Servers

When no server fits, write your own with an official SDK.

### TypeScript

```bash
npm init -y
npm install @modelcontextprotocol/sdk zod
```

```typescript title="src/server.ts"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "my-tools", version: "1.0.0" });

server.registerTool(
  "get_weather",
  {
    description: "Get current weather for a city",
    inputSchema: { city: z.string().describe("City name") },
  },
  async ({ city }) => {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await res.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data.current_condition[0], null, 2) }],
    };
  },
);

await server.connect(new StdioServerTransport());
```

Resources and prompts use `server.registerResource(...)` and `server.registerPrompt(...)` in the same way.

Register it with OpenClaw:

```bash
npm install -D typescript && npx -p typescript tsc --init && npx -p typescript tsc
openclaw mcp add my-tools --command node --arg ./dist/server.js --cwd /path/to/project
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
        return str(resp.json()["current_condition"][0])

if __name__ == "__main__":
    mcp.run()
```

```bash
openclaw mcp add my-py-tools --command python --arg server.py --cwd /path/to/project
```

### Testing your server

```bash
openclaw mcp doctor my-tools --probe
npx @modelcontextprotocol/inspector
```

The MCP Inspector is a browser UI that connects to a stdio or HTTP server and lets you call its tools by hand.

---

## OpenClaw as an MCP Server

`openclaw mcp serve` runs the other way round: it is a **stdio** MCP server that an MCP client (Claude Code, Codex, Cursor and others) spawns. It connects to your Gateway over WebSocket and exposes **channel conversations**: listing conversations, reading messages, sending messages, waiting for events and handling approvals. It does not expose your agent's skills or memory, and it does not listen on an HTTP port.

Example client entry (for an MCP client's own config file, not `openclaw.json`):

```json title="MCP client config"
{
  "mcpServers": {
    "openclaw": { "command": "openclaw", "args": ["mcp", "serve"] }
  }
}
```

See [Run OpenClaw as an MCP server](https://docs.openclaw.ai/cli/mcp/serve).

---

## Security

MCP servers can read files, query databases, call APIs and run code. Treat them like shell scripts you are about to run.

### Trust model

| Source | What to check |
|---|---|
| MCP reference servers | Maintained, but examples rather than hardened products |
| Vendor's official server | Publisher on npm/PyPI matches the vendor; linked from the vendor's docs |
| Community server | Read the source, check activity and issues, pin the version |

### Credentials

- Use `${ENV_VAR}` substitution or SecretRefs for secrets; never commit tokens in config
- Scope API keys narrowly (read-only where possible)
- Prefer `auth: "oauth"` with `openclaw mcp login` where the server supports it
- Read what environment variables a server asks for

### Containment

- **stdio servers** run as child processes with the Gateway user's permissions
- **Filesystem servers**: pass only the directories they need
- **Database servers**: use read-only users
- **Internal HTTP servers**: keep them behind a firewall or VPN

### Common risks

| Risk | Mitigation |
|---|---|
| Server reads sensitive files | Restrict filesystem paths in server args |
| Server exfiltrates data | Prefer local servers; watch outbound traffic |
| Malicious or typosquatted package | Check the publisher, pin versions, read the source |
| Credential leak via config | `${VAR}` substitution or SecretRefs; `openclaw mcp doctor` warns on literals |
| Agent misuses a tool | `toolFilter.exclude`, `tools.deny`, approvals |

:::warning
An MCP server that can run commands, send email or messages, drive a browser or move money gives that power to every agent with access to it. Combine tool filters with approvals and sandboxing; see [Security hardening](/security/hardening).
:::

---

## Troubleshooting

**Server won't connect:**

```bash
openclaw mcp doctor <name> --probe
openclaw mcp status --verbose
```

For stdio servers, check that `command` resolves in the Gateway's environment and that `cwd` exists. Debug logs prefix server stderr with `bundle-mcp:<name>:`.

**Connects but no tools:** run `openclaw mcp probe <name>` and check `toolFilter.include` and `exclude`. A Streamable HTTP server without `transport: "streamable-http"` is treated as SSE and may fail.

**Server crashes on startup:** run the command directly to see its error, for example `npx -y @modelcontextprotocol/server-filesystem /tmp`.

**Authentication failures:** check that the env var is set in the Gateway's environment, not just your shell. For OAuth servers, run `openclaw mcp login <name>` again.

**Changes not visible:** the Gateway reloads changed servers on the next turn. A CLI `openclaw mcp reload` does not reset a separate Gateway process.

**Too many tools confusing the agent:** narrow each server with `toolFilter.include`, or remove servers the agent does not need.

---

## See Also

- [Plugin System](/guides/plugin-system): Gateway extensions written in code
- [Configuration Reference](/reference/configuration): the full `mcp` block
- [Advanced Recipes](/guides/recipes/advanced-recipes): multi-server patterns
- [Security hardening](/security/hardening)
- Upstream: [Connect MCP servers](https://docs.openclaw.ai/tools/mcp), [`openclaw mcp`](https://docs.openclaw.ai/cli/mcp), [MCP transports](https://docs.openclaw.ai/cli/mcp/transports)
