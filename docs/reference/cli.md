---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: CLI Reference
description: The real openclaw command tree, grouped by task, with the commands a self-hoster uses most and links to the official per-command pages
keywords: [openclaw, openclaw cli, commands, openclaw chat, terminal, cli reference, command line]
---

# CLI Reference

This is a map of the `openclaw` command tree as of v2026.10.4, grouped by what you are trying to do. It lists the commands most self-hosters need and links each to its official page. For flags, run `openclaw <command> --help` (the authoritative list for your installed version) or read the [official CLI reference](https://docs.openclaw.ai/cli).

## Global flags

These go before the command, for example `openclaw --profile work status`.

| Flag | Purpose |
|------|---------|
| `--profile <name>` | Isolate state and config under `~/.openclaw-<name>` |
| `--dev` | Dev profile: state under `~/.openclaw-dev`, Gateway on port 19001 |
| `--container <name>` | Run the CLI inside a running Docker/Podman container (not a sandbox) |
| `--log-level <level>` | `silent`, `fatal`, `error`, `warn`, `info`, `debug` or `trace` |
| `--no-color` | Disable ANSI colours (`NO_COLOR=1` also works) |
| `--update` | Shorthand for `openclaw update` |
| `-V`, `--version` | Print the version |

There is no global `--config`, `--json`, `--verbose` or `--quiet`. Use `OPENCLAW_CONFIG_PATH` to point at another config file; `--json` is a per-command flag (`openclaw status --json`).

## Set up and change your install

| Command | What it does |
|---------|--------------|
| [`onboard`](https://docs.openclaw.ai/cli/onboard) | Guided first-time setup: model auth, Gateway, workspace, channels, skills. `--install-daemon` also installs the background service. |
| [`setup`](https://docs.openclaw.ai/cli/setup) | Chat with OpenClaw, onboarding first if setup is incomplete. `setup --baseline` just writes the baseline config and workspace. |
| [`configure`](https://docs.openclaw.ai/cli/configure) | Interactive editor for an existing setup (models, Gateway, channels, plugins, skills). |
| [`config`](https://docs.openclaw.ai/cli/config) | Non-interactive `get`, `set`, `patch`, `unset`, `file`, `schema`, `validate`. See [Configuration](/reference/configuration). |
| [`doctor`](https://docs.openclaw.ai/cli/doctor) | Health checks; `--fix` applies repairs and config migrations. Run it after every upgrade. |
| [`update`](https://docs.openclaw.ai/cli/update) | Update OpenClaw (`--channel stable\|extended-stable\|beta\|dev`, `--dry-run`, `status`). |
| [`backup`](https://docs.openclaw.ai/cli/backup) | `create`, `verify`, `restore` archives of config, credentials, sessions and workspaces. |
| [`reset`](https://docs.openclaw.ai/cli/reset) / [`uninstall`](https://docs.openclaw.ai/cli/uninstall) | Reset local state, or remove the service and local data. |
| [`migrate`](https://docs.openclaw.ai/cli/migrate) | Import state from another agent system (`list`, `plan`, `apply`). |

```bash
openclaw onboard --install-daemon
openclaw config set tools.exec.mode ask
openclaw doctor --fix
openclaw update --dry-run
openclaw backup create --verify
```

## Talk to the agent

| Command | What it does |
|---------|--------------|
| [`tui`](https://docs.openclaw.ai/cli/tui) | Terminal UI connected to the Gateway. |
| `chat`, `terminal` | Aliases for `tui --local`: the terminal UI against the embedded local runtime. |
| [`agent`](https://docs.openclaw.ai/cli/agent) | One agent turn through the Gateway (`--local` for embedded); good for scripts. `agent exec` runs an isolated headless turn. |
| [`resume`](https://docs.openclaw.ai/cli/resume) | Reopen a recent Gateway session in the TUI. |
| [`message`](https://docs.openclaw.ai/cli/message) | Send, read, react to and manage messages on a channel directly. |
| [`dashboard`](https://docs.openclaw.ai/cli/dashboard) | Open the Control UI (web chat, settings, approvals) with your token; `--no-open` prints the URL. |
| [`attach`](https://docs.openclaw.ai/cli/attach) | Attach Claude Code to a Gateway session with scoped MCP tools. |

```bash
openclaw chat --message "What can you do?"
openclaw agent --agent main --message "Summarise today's inbox" --json
openclaw message send --channel telegram --target @mychat --message "Hi"
openclaw dashboard --no-open
```

A positional argument to `chat` or `tui` is a session **target**, not a message, and `chat` rejects targets because it runs in local mode. `openclaw chat "hello"` fails; use `--message`.

## Run the Gateway

| Command | What it does |
|---------|--------------|
| [`gateway`](https://docs.openclaw.ai/cli/gateway) | `run` (foreground), `install` / `uninstall` / `start` / `stop` / `restart` / `status` (service), plus `health`, `probe`, `call`, `usage-cost`, `discover`, `auth-token`. |
| [`daemon`](https://docs.openclaw.ai/cli/daemon) | Legacy alias for the Gateway service subcommands. |
| [`status`](https://docs.openclaw.ai/cli/status) | Gateway, channel, model and session overview (`--all`, `--deep`, `--usage`, `--json`). |
| [`health`](https://docs.openclaw.ai/cli/health) | Health from the running Gateway. |
| [`logs`](https://docs.openclaw.ai/cli/logs) | Tail Gateway file logs (`--follow`, `--limit`, `--json`, `--max-bytes`). There is no `--filter`; pipe to `grep`. |
| [`system`](https://docs.openclaw.ai/cli/system) | `heartbeat last\|enable\|disable`, `event`, `presence`. |
| [`triage`](https://docs.openclaw.ai/cli/triage) | Collect sanitised diagnostics and open a local coding agent to repair. |

```bash
openclaw gateway status
openclaw gateway run --port 18789 --bind loopback
openclaw gateway restart
openclaw gateway usage-cost
openclaw status --all
openclaw logs --follow --limit 100
openclaw system heartbeat last
```

`gateway run` has no `--daemon` or `--host`: use `gateway install` for a background service and `--bind loopback|lan|tailnet|custom|auto` for the listen address. Gateway flags are on the [running page](https://docs.openclaw.ai/cli/gateway/running).

## Channels, pairing and devices

| Command | What it does |
|---------|--------------|
| [`channels`](https://docs.openclaw.ai/cli/channels) | `add`, `remove`, `list`, `status`, `login`, `logout`, `logs`, `capabilities`, `resolve`, `dead-letters`. |
| [`pairing`](https://docs.openclaw.ai/cli/pairing) | DM pairing: `list` and `approve <channel> <code>` for strangers who messaged the bot. |
| [`devices`](https://docs.openclaw.ai/cli/devices) | Device pairing and tokens for Control UI, apps and CLI clients (`list`, `approve`, `reject`, `revoke`, `rotate`). |
| [`qr`](https://docs.openclaw.ai/cli/qr) | Mobile pairing QR code and setup code. |
| [`nodes`](https://docs.openclaw.ai/cli/nodes) / [`node`](https://docs.openclaw.ai/cli/node) | Manage paired nodes (phones, other machines) / run this machine as a headless node. |
| [`directory`](https://docs.openclaw.ai/cli/directory) | Look up contact and group IDs on a channel. |

```bash
openclaw channels add telegram
openclaw channels status
openclaw pairing list
openclaw devices list
```

## Models, agents and memory

| Command | What it does |
|---------|--------------|
| [`models`](https://docs.openclaw.ai/cli/models) | `list`, `status`, `set`, `fallbacks`, `aliases`, `auth`, `scan`. |
| [`agents`](https://docs.openclaw.ai/cli/agents) | Isolated agents: `list`, `add`, `delete`, `bind`, `unbind`, `bindings`, `set-identity`. |
| [`memory`](https://docs.openclaw.ai/cli/memory) | `status`, `search`, `index`, `forget`, `reset`, `rem-harness`. |
| [`sessions`](https://docs.openclaw.ai/cli/sessions) | List, tail, export, archive and clean up stored sessions. |
| [`infer`](https://docs.openclaw.ai/cli/infer) | Provider-backed inference from the CLI (model, image, audio, TTS, web, embeddings). Alias: `capability`. |

```bash
openclaw models status
openclaw models set anthropic/claude-sonnet-5-5
openclaw agents list
openclaw memory status --deep
openclaw memory search "invoice"
```

## Automation

| Command | What it does |
|---------|--------------|
| [`cron`](https://docs.openclaw.ai/cli/cron) (alias `automations`) | Scheduled jobs: `add`, `list`, `edit`, `run`, `runs`, `enable`, `disable`, `rm`, and `scratch` for a job's notes (where the old `HEARTBEAT.md` checklist went). |
| [`hooks`](https://docs.openclaw.ai/cli/hooks) | Internal agent hooks. |
| [`webhooks`](https://docs.openclaw.ai/cli/webhooks) | Webhook helpers (Gmail). |

```bash
openclaw cron list --all
openclaw cron status
```

There is no `openclaw heartbeat` command. Heartbeat settings live in `agents.defaults.heartbeat`; inspect it with `openclaw system heartbeat last`.

## Skills, plugins and MCP

| Command | What it does |
|---------|--------------|
| [`skills`](https://docs.openclaw.ai/cli/skills) | `search`, `install`, `update`, `list`, `info`, `check`, `verify`, `workshop`, `library`. Installs from ClawHub go through here. |
| [`plugins`](https://docs.openclaw.ai/cli/plugins) | `list`, `search`, `inspect`, `install`, `uninstall`, `update`, `enable`, `disable`, `doctor`, plus authoring commands (`init`, `build`, `validate`, `pack`). |
| [`mcp`](https://docs.openclaw.ai/cli/mcp) | Manage `mcp.servers` (`add`, `list`, `show`, `probe`, `tools`, `login`) and `serve` OpenClaw as an MCP server. |

```bash
openclaw skills search weather
openclaw skills check
openclaw plugins list
openclaw mcp list
```

:::warning Changing in 2026.10.10 (beta)
2026.10.10-beta.1 (npm `beta`, 2026-10-15; not in 2026.10.4) removes the Skill Workshop proposal subcommands (`propose-create`, `propose-update`, `inspect`, `revise`, `evaluate`, `apply`, `reject`, `quarantine`). `skills workshop` becomes `list`, `changes`, `show`, `archive` and `restore`. Scripts that call the proposal commands will fail after upgrading; see [Skill Workshop](/guides/skill-workshop).
:::

On 2026.10.4, `plugins install <name>` without a prefix installs from npm. Always write `clawhub:<package>` or `npm:<package>`: a change on upstream `main` (not in any release yet) makes bare names resolve to ClawHub, and explicit prefixes work on both sides of it. See [Plugin System](/guides/plugin-system).

`openclaw clawhub` and `openclaw skill` (singular) do not exist. ClawHub also has its own separate `clawhub` CLI for publishing; see the [ClawHub CLI docs](https://docs.openclaw.ai/clawhub/cli).

## Security, approvals and sandbox

| Command | What it does |
|---------|--------------|
| [`security`](https://docs.openclaw.ai/cli/security) | `audit` (`--deep`, `--fix`, `--json`): checks config and state for common mistakes. |
| [`approvals`](https://docs.openclaw.ai/cli/approvals) (alias `exec-approvals`) | Approval policy, the exec allowlist (`allowlist add\|remove`), pending requests and grants. |
| `exec-policy` | Show or sync the requested exec policy with host approvals; see [approvals](https://docs.openclaw.ai/cli/approvals). |
| [`sandbox`](https://docs.openclaw.ai/cli/sandbox) | `list`, `recreate`, `explain` sandbox containers. |
| [`secrets`](https://docs.openclaw.ai/cli/secrets) | `reload`, `audit`, `configure`, `apply`, `store`. |

```bash
openclaw security audit --deep
openclaw approvals get
openclaw sandbox explain
openclaw secrets audit
```

See [Security Hardening](/security/hardening) before giving the agent shell, browser or channel access.

## Everything else

`acp`, `audit`, `browser`, `clawbot` (legacy), `completion`, `connect`, `database`, `dns`, `docs` (search the live docs), `file-transfer`, `fleet`, `googlemeet`, `promos`, `proxy`, `storage`, `teamsmeetings`, `telemetry`, `transcripts`, `users`, `worker`, `worktrees`, `zoommeetings`. Plugins can add more (for example `workboard`). All are listed in the [command index](https://docs.openclaw.ai/cli). `fleet` is removed in 2026.10.10 (beta); it is absent from the 2026.10.10-beta.1 command index.

## Exit codes and JSON errors

Commands exit `0` on success and nonzero on failure. OpenClaw does not define a general table of exit codes. With `--json`, a failure prints one JSON document to stdout:

{/* snippet:skip CLI error output, not openclaw.json */}
```json title="CLI --json failure envelope"
{ "ok": false, "error": { "type": "cli_error", "message": "Description of the failure" } }
```

Scripts should parse stdout and still check the exit status. Set `OPENCLAW_DEBUG=1` to include diagnostics when you rerun a failing command.

## See also

- [Configuration Reference](/reference/configuration)
- [Environment Variables](/reference/environment-variables)
- [Slash commands](https://docs.openclaw.ai/tools/slash-commands) (the `/...` commands inside a chat)
