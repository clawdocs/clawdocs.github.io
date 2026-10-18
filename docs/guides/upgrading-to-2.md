---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Upgrading across OpenClaw 2.0
description: A field guide for getting an OpenClaw install from 2026.5–2026.7 to v2026.10.4. Covers backups, Node first, the 2026.9.5/2026.9.7 bridge releases, what Doctor migrates or refuses, tested before/after configs, rollback, and what to check afterwards.
keywords: [openclaw upgrade, openclaw 2.0, 2026.8.1, 2026.10.4, openclaw doctor --fix, bridge release, 2026.9.5, 2026.9.7, HEARTBEAT.md migration, agents.list, agents.entries, codex model refs, QMD, rollback]
---

# Upgrading across OpenClaw 2.0

This page is for you if your OpenClaw was installed or last updated around **2026.5 to 2026.7** and you need to reach **v2026.10.4**. It is a field guide: what to do in what order, what will break, and what Doctor does about it. Every migration example below was run through the real Doctor of the releases named, in a throwaway home directory. The fixtures and the script are in the repo, so you can re-run them (see [Re-run the tests yourself](#rerun)).

The official reference is upstream [Updating](https://docs.openclaw.ai/install/updating) and [Doctor config migrations](https://docs.openclaw.ai/gateway/doctor/config-migrations). The [Migration Guide](/guides/migration) on this site covers the older Clawdbot/Moltbot renames and has the full [list of refused keys](/guides/migration#refused-keys).

## What changed, in one paragraph

**v2026.8.1 ("OpenClaw 2.0")** rebuilt the web UI and moved sessions and transcripts into SQLite. Cron became **Automations**: `openclaw automations` is the same command family as `openclaw cron`, which still works. `HEARTBEAT.md` was retired in favour of a "monitor scratch" stored in the state database, built-in memory replaced QMD, and `codex/*` model refs moved to `openai/*`. The releases after it tightened the screws. **2026.9.3** dropped Node 22 (it now needs Node 24.16+ or 26.1+) and made Workshop skills belong to an agent rather than a workspace. **2026.9.6** made Code Mode JavaScript-only. And current Doctor **only migrates formats written by releases published on or after July 1, 2026**. For anything older, it stops and names a "bridge" release to pass through first. Full notes: [v2026.8.1 release notes](https://docs.openclaw.ai/releases/2026.8.1).

---

## Before you start {#before-you-start}

### 1. Know where you are

```bash
openclaw --version
openclaw update status
```

Write the version down: you need it to roll back. `update status` shows your update channel. If it says `extended-stable`, `openclaw update` takes you to the 2026.9.3x line, not to 2026.10.4. Pass `--channel stable` when you reach the last step. If it says `beta`, `openclaw update` installs 2026.10.10-beta.1 (npm `beta` since 2026-10-15), which is newer than this guide; version numbers are not chronological, and that beta was published before 2026.10.4. This guide covers the move to 2026.10.4.

### 2. Upgrade Node first

OpenClaw 2026.9.3 and later need **Node 24.16+ (on 24.x) or 26.1+**. Node 22, 23 and 25 are unsupported, and so are 24.x before 24.16 and 26.x before 26.1. Upgrade Node **before** you upgrade OpenClaw. Upstream's reason is SQLite safety: older Node builds link SQLite libraries that can truncate TEXT values, and from 2.0 your sessions live in SQLite. See [Node.js](https://docs.openclaw.ai/install/node) and [Node.js compatibility](https://docs.openclaw.ai/install/node-compatibility).

```bash
node -v   # want v24.16.0+ or v26.1.0+
```

### 3. Make two backups {#backup}

Stop the Gateway, then take both of these. The first is OpenClaw's own verified archive. The second is a plain copy of the stopped state directory. Older file-backed installs still have JSONL transcripts and logs, which the portable archive leaves out, and the plain copy is what a [rollback](#rollback) restores.

```bash
openclaw gateway stop
mkdir -p ~/Backups/openclaw && chmod 700 ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
tar -C ~ -czf ~/Backups/openclaw/pre-2.0-$(date +%F).tar.gz .openclaw
```

`openclaw backup create` and `openclaw backup verify` have existed since 2026.3.8. If your old CLI rejects `--verify` on `create`, run `openclaw backup verify <archive>` on the file it wrote. If your workspace or any agent directory lives outside `~/.openclaw`, add those paths to the `tar` command too. Both files contain credentials, so keep them owner-only.

Leave the Gateway stopped until the upgrade is done. Doctor refuses to repair state while another live owner is writing to it.

### 4. Rehearse on a copy (recommended) {#rehearse}

You can run the new Doctor against a copy of your state without touching the live install. This is how the examples on this page were produced:

```bash
R=$(mktemp -d)
cp -a ~/.openclaw "$R/.openclaw"
npm i --prefix "$R/oc" --no-save --ignore-scripts openclaw@2026.10.4
env -i PATH="$PATH" HOME="$R" OPENCLAW_STATE_DIR="$R/.openclaw" \
  OPENCLAW_CONFIG_PATH="$R/.openclaw/openclaw.json" \
  OPENCLAW_SERVICE_REPAIR_POLICY=external \
  "$R/oc/node_modules/.bin/openclaw" doctor --fix --non-interactive
```

`env -i` keeps your real API keys and environment out of the run. `OPENCLAW_SERVICE_REPAIR_POLICY=external` stops Doctor from touching Gateway services. If Doctor refuses and names a bridge release, you know you need [staging](#staging). If it completes, read its "Doctor changes" boxes and compare `"$R/.openclaw/openclaw.json"` with your live file.

:::warning Absolute paths escape the copy
If your config uses absolute paths (for example `"workspace": "/home/you/.openclaw/workspace"` or a custom `agentDir`), the rehearsal Doctor will follow them to your **real** files, and the `HEARTBEAT.md` migration deletes the original. Before running it, edit the copy's `openclaw.json` so that those paths point inside `$R`. Paths written as `~/...` resolve to the copy, because `HOME` is set to `$R`.
:::

---

## The staging rule {#staging}

| You are on | Path to 2026.10.4 |
|---|---|
| A release published **before July 1, 2026** (2026.5.x, 2026.6.x up to 2026.6.11) | Bridge through **2026.9.5**, then **2026.9.7** if Doctor names it, then latest. |
| **2026.7.x** | Rehearse first. If Doctor completes, update directly. If it names 2026.9.5 or 2026.9.7, stage as above. |
| 2026.8.x or 2026.9.x | `openclaw update` (add `--dry-run` first to preview). |

The cutoff goes by **publication date**, not version number. Upstream's rule is "for installations older than July 2026, upgrade to `2026.9.5` first, run its Doctor migrations, and then upgrade to `latest`." 2026.9.7 is the bridge for a second set of formats, and Doctor names it when you need it. Upstream lists these as: cron `jobs.json` stores, pre-July delivery queue files, the same-file memory index, Discord `voice.tts` and guild-channel `allow`/`agentId`, Voice Call JSONL logs, old `openclaw.extension.json` stubs, and OAuth credential sidecars. In our tests, 2026.9.5 also imported a legacy `cron/jobs.json`. Running 2026.9.5, then 2026.9.7, then 2026.10.4 worked on a config that mixed both sets (fixture `d-june-everything`).

### Commands for each stage (npm install, managed service) {#stage-commands}

These are upstream's commands. Keep the same user account, install prefix, `--profile` and state paths throughout.

```bash
# Stage 1: bridge release
openclaw gateway stop &&
  npm install -g openclaw@2026.9.5 --allow-scripts=openclaw &&
  openclaw --version &&
  openclaw doctor --fix

# Stage 2 (only if Doctor named it): second bridge
npm install -g openclaw@2026.9.7 --allow-scripts=openclaw &&
  openclaw --version &&
  openclaw doctor --fix

# Stage 3: current release, then start
npm install -g openclaw@latest --allow-scripts=openclaw &&
  openclaw doctor --fix &&
  openclaw gateway start &&
  openclaw gateway status --deep
```

- After stage 1, confirm the version is `2026.9.5` and that Doctor imported the task, flow, plugin and channel state you need. Doctor imports channel state only for **enabled** channels, so temporarily enable any you need (with the Gateway still stopped), rerun Doctor, then put the settings back.
- `--allow-scripts=openclaw` needs npm 12 or 11.16+. On npm 11.15 and earlier, leave it out.
- On pnpm, use `pnpm add -g --allow-build=openclaw openclaw@2026.9.5` (then `@latest`). On Bun, use `bun add -g --trust openclaw@<version>`. For Docker, run the bridge image tag once against your mounted state, as described in the [Migration Guide](/guides/migration#bridge-upgrade).
- From 2026.9.5 onwards, the built-in updater stages the target and can roll back. If you prefer it to raw npm for the later hops, use `openclaw update --tag 2026.9.7` and then `openclaw update`.
- On 2026.7.1 with **pnpm 11**, upstream says to run `pnpm add -g openclaw@latest` once, because that updater cannot do this hop.
- Updaters older than 2026.7.2-beta.5 stop with `plugins.load.paths: plugin path not found` if a configured plugin path is missing. Restore the directory or remove the path, then retry.

---

## What breaks {#what-breaks}

"Migrates" means `openclaw doctor --fix` on 2026.10.4 rewrites it. "Refuses" means 2026.10.4 leaves your config untouched and stops, naming the bridge release. Rows marked **tested** were run through Doctor for this page.

| Old (mid-2026) | Now | What Doctor does |
|---|---|---|
| Node 22 / 23 / 25 | Node 24.16+ or 26.1+ (2026.9.3) | Nothing. **You must act**, before updating. |
| `HEARTBEAT.md` in the workspace | Monitor scratch in the state DB | Migrates: imports the prose, archives the original under `backups/heartbeat-migration/`, deletes the file. **Tested.** |
| `tasks:` block in `HEARTBEAT.md` | One automation job per task | Migrates, keeping each interval. **Tested.** |
| Top-level `heartbeat: {...}` | `agents.defaults.heartbeat` | **Refuses** on 2026.10.4; 2026.9.5 moves it. **Tested.** |
| `heartbeat.interval`, `heartbeat.quiet_hours` | `every` (duration string) and `activeHours` (when it may run) | Silently **removes** them and falls back to the default 30m with no time window. **You must act.** **Tested.** |
| `openclaw cron …`, cron jobs in SQLite | `openclaw automations …` (alias), same jobs | Nothing to do. Jobs keep working. |
| `~/.openclaw/cron/jobs.json` (pre-May-30 store) | SQLite cron store | **Refuses**; a bridge imports it and renames the file `jobs.json.migrated`. **Tested.** |
| `agents.list: [...]` | `agents.entries.<id>` | Migrates. With 2+ agents it also sets `agents.ownership: "explicit"`, `agents.defaults.systemAgent`, and a binding for each unbound channel account. **Tested.** |
| QMD (`memory.backend: "qmd"`, `memory.qmd`) | Built-in memory | Migrates: removes QMD settings and keeps paths as `memory.search.extraPaths`. **Tested.** |
| `memorySearch` | `memory.search` | Migrates. **Tested.** |
| `codex/*`, `openai-codex/*` model refs | `openai/*` with `agentRuntime.id: "codex"` | Migrates, and installs the Codex plugin. **Tested.** |
| Retired model IDs (e.g. `anthropic/claude-sonnet-4-5`) | A catalog model | Migrates to the next catalog entry (`claude-sonnet-4-6`), **not** to the current 5.x family. Pick a current model yourself. **Tested.** |
| `tools.exec.security` + `tools.exec.ask` | `tools.exec.mode` | Migrates (`allowlist` + `on-miss` became `"ask"`). **Tested.** |
| `messages.tts`, provider `edge` | Top-level `tts`, provider `microsoft` | Migrates. **Tested.** |
| `session.idleMinutes` | `session.reset.idleMinutes` | Migrates. **Tested.** |
| `gateway.nodes.denyCommands` | `gateway.nodes.commands.deny` | Migrates. **Tested.** |
| `channels.telegram.requireMention`, `streamMode` | `groups["*"].requireMention`, `streaming.mode` | **Refuses** on 2026.10.4; 2026.9.5 moves them. **Tested.** |
| `CLAWDBOT_*`, `MOLTBOT_*` env vars | `OPENCLAW_*` | Nothing. They have been ignored since 2026.3.22. **You must rename them.** |
| Workspace-owned Workshop skills | One Workshop collection per agent (2026.9.3) | Startup and Doctor migrate proven skills, and leave ambiguous ones for review. `skills.workshop.allowSymlinkTargetWrites` is retired. |
| JSON/JSONL session files | SQLite (2026.8.1) | Migrates. Older releases cannot read sessions created afterwards (see [Rollback](#rollback)). |
| OpenProse plugin, `/prose` | Removed (2026.8.1) | Cleans up the config; your `.prose` files stay. |
| TypeScript Code Mode cells | JavaScript only (2026.9.6) | Removes `tools.codeMode.languages`. **Rewrite TS cells yourself.** |
| `plugins.entries.webhooks` (TaskFlow Webhooks) | Removed; use Gateway HTTP hooks | Ignored with a warning; Doctor removes the entry. |

The rest of the refusal list includes `agents.defaults.llm`, `embeddedPi`, agent `model.timeoutMs`, `gateway.webchat`, `channels.webchat`, `routing.allowFrom`, the top-level `talk.*` selectors, Telegram flat streaming keys, `threadBindings.ttlHours`, Slack `channels.<id>.allow` and Matrix `dm.policy: "trusted"`. All of them get the same answer: pass through the bridge. The list is summarised on [Migration Guide → Config keys Doctor refuses](/guides/migration#refused-keys), and the canonical list is upstream [Retired state and config formats](https://docs.openclaw.ai/gateway/doctor/config-migrations#retired-state-and-config-formats).

---

## Tested migrations {#tested}

Each example lists the legacy config, the real Doctor output (excerpts, box borders kept), and the resulting config, trimmed to the relevant keys. Fixture files are in [`scripts/upgrade-fixtures/`](https://github.com/clawdocs/clawdocs.github.io/tree/gh-pages/scripts/upgrade-fixtures). The tokens are fake.

### Example 1: a July two-agent install (migrates directly) {#example-july}

This fixture is a 2026.7.1-era config with `agents.list`, a `codex/*` ref, QMD, the old exec and TTS keys, and a workspace `HEARTBEAT.md` with two `tasks:`. Current validation fails on it ("agents.list moved to keyed agents.entries"), and one `doctor --fix` on 2026.10.4 repairs it.

{/* snippet:skip: legacy config shown for migration */}
```json5 title="~/.openclaw/openclaw.json (before, 2026.7.1)"
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-5", fallbacks: ["openai-codex/gpt-5.5"] },
      heartbeat: { every: "30m", activeHours: { start: "08:00", end: "22:00" } },
      memorySearch: { provider: "openai" },
    },
    list: [
      { id: "main", name: "Main", default: true },
      { id: "family", name: "Family", model: "codex/gpt-5.5" },
    ],
  },
  memory: { backend: "qmd" },
  messages: { tts: { provider: "edge" } },
  tools: { exec: { security: "allowlist", ask: "on-miss" } },
  session: { idleMinutes: 120 },
  gateway: { mode: "local", bind: "loopback", nodes: { denyCommands: ["system.run"] } },
}
```

Doctor (2026.10.4) output, excerpt (blank border lines and unrelated boxes removed):

```text
◇  Doctor changes ────────────────────────────────────────────────────────╮
│  Migrated legacy config keys in the active openclaw.json:               │
│  - Moved legacy memorySearch defaults → memory.search.                  │
│  - Upgraded config.agents.defaults.model.primary from                   │
│    "anthropic/claude-sonnet-4-5" to "anthropic/claude-sonnet-4-6".      │
│  - Moved messages.tts to top-level tts.                                 │
│  - Moved tts.provider "edge" → "microsoft".                             │
│  - Removed retired QMD memory configuration; builtin memory is now the  │
│    only memory engine.                                                  │
│  - Moved session.idleMinutes → session.reset.idleMinutes.               │
│  - Moved root.tools.exec.security/ask → root.tools.exec.mode.           │
│  - Applied tier-eval tranche retirements; canonical settings and        │
│    built-in defaults now apply.                                         │
│  - Moved gateway.nodes.denyCommands → gateway.nodes.commands.deny.      │
│  - Moved agents.list → keyed agents.entries.                            │
│  - Preserved legacy per-surface agent ownership and workspace.          │
│  - Removed retired agents.entries default marker.                       │
│  - Stamped the multi-agent roster for explicit per-surface ownership.   │
├─────────────────────────────────────────────────────────────────────────╯
◇  Doctor changes ───────────────────────────────────╮
│  Installed missing configured plugin "codex" from  │
│  @openclaw/codex@2026.10.4.                        │
├────────────────────────────────────────────────────╯
◇  Doctor changes ───────────────────────────────────────────────────────╮
│  Repaired Codex model routes:- agents.defaults.model.fallbacks.0:      │
│  openai-codex/gpt-5.5 -> openai/gpt-5.5.                               │
│  Set agents.defaults.models.openai/gpt-5.5.agentRuntime.id to "codex"  │
│  so repaired OpenAI refs keep Codex auth routing.                      │
├────────────────────────────────────────────────────────────────────────╯
◇  Doctor changes ──────────────────────────────────────╮
│  Create heartbeat monitor for agent "main" at 30m.    │
│  Create heartbeat monitor for agent "family" at 30m.  │
├───────────────────────────────────────────────────────╯
◇  Doctor changes ────────────────────────────────────────────────────╮
│  Migrated ~/.openclaw/workspace/HEARTBEAT.md into cron scratch for  │
│  Heartbeat (main).                                                  │
├─────────────────────────────────────────────────────────────────────╯
◇  Doctor changes ───────────────────────────────────────────────╮
│  Converted 2 heartbeat tasks into cron jobs for agent "main".  │
├────────────────────────────────────────────────────────────────╯
Updated config: ~/.openclaw/openclaw.json
  Backup: ~/.openclaw/openclaw.json.bak
└  Doctor complete.
```

Result, trimmed (this block passes `openclaw config validate` on 2026.10.4):

```json5 title="~/.openclaw/openclaw.json (after Doctor, 2026.10.4)"
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6", fallbacks: ["openai/gpt-5.5"] },
      heartbeat: { every: "30m", activeHours: { start: "08:00", end: "22:00" } },
      systemAgent: { agentId: "main" },
      models: { "openai/gpt-5.5": { agentRuntime: { id: "codex" } } },
    },
    entries: {
      main: { name: "Main", workspace: "/home/you/.openclaw/workspace" },
      family: {
        name: "Family",
        model: "openai/gpt-5.5",
        models: { "openai/gpt-5.5": { agentRuntime: { id: "codex" } } },
      },
    },
    ownership: "explicit",
  },
  memory: { search: { provider: "openai" } },
  tools: { exec: { mode: "ask" } },
  session: { reset: { mode: "idle", idleMinutes: 120 } },
  tts: { provider: "microsoft" },
  gateway: { mode: "local", bind: "loopback", nodes: { commands: { deny: ["system.run"] } } },
  bindings: [{ agentId: "main", match: { channel: "telegram", accountId: "*" } }],
}
```

Points to check after a migration like this:

- **The model went to `claude-sonnet-4-6`, not to a current model.** Switch to a current ref such as `anthropic/claude-sonnet-5-5` yourself (see [Model Selection](/guides/model-selection)).
- **The default agent became the owner.** The agent marked `default: true` became `systemAgent`, and the Telegram account got an explicit binding to it. Review the bindings if you meant traffic to go elsewhere ([Multi-Agent](/guides/multi-agent)).
- **The workspace path is now absolute.** Doctor pinned it. If you move the state directory later, update it.
- **Doctor also copied Telegram `allowFrom` into `groupAllowFrom`** (not shown in the trimmed block).
- **Your heartbeat checklist is now in the database.** `HEARTBEAT.md` is gone from the workspace. Find the monitor job with `openclaw automations list --all` and read the checklist with `openclaw automations scratch <jobId>` (both need a running Gateway). See [Heartbeat](/guides/heartbeat#migrating-from-heartbeatmd).
- **Doctor may disable skills.** In our clean test environment, `doctor --fix --non-interactive` disabled 28 bundled skills whose binaries were missing (it writes `skills.entries.<name>.enabled: false`). Run `openclaw skills list` afterwards and re-enable any you rely on.

### Example 2: refused keys (needs the 2026.9.5 bridge) {#example-refused}

This is a June-era config with a top-level `heartbeat` and the flat Telegram keys.

{/* snippet:skip: legacy config shown for migration */}
```json5 title="~/.openclaw/openclaw.json (before, 2026.6.8)"
{
  heartbeat: { every: "30m", activeHours: { start: "08:00", end: "22:00" } },
  agents: { defaults: { model: "anthropic/claude-sonnet-4-5" } },
  channels: {
    telegram: { enabled: true, botToken: "123456:fixture-not-a-real-token", requireMention: true, streamMode: "partial" },
  },
}
```

On 2026.10.4, Doctor leaves the config byte-for-byte unchanged and exits 1 (long lines wrapped):

```text
Doctor could not complete maintenance. Check the reported service state and resolve the failure.
Config contains retired pre-July-2026 settings: heartbeat, channels.telegram.requireMention,
channels.telegram.streamMode. Doctor cannot remove these settings safely. Install OpenClaw
2026.9.5, run "openclaw doctor --fix", then upgrade to latest.
See https://docs.openclaw.ai/install/updating#upgrading-very-old-versions.
```

Doctor on 2026.9.5 moves the keys:

```text
◇  Doctor changes ────────────────────────────────────────────────────╮
│  Migrated legacy config keys in the active openclaw.json:           │
│  - Moved channels.telegram.requireMention →                         │
│    channels.telegram.groups."*".requireMention.                     │
│  - Moved heartbeat → agents.defaults.heartbeat.                     │
│  - Upgraded config.agents.defaults.model from                       │
│    "anthropic/claude-sonnet-4-5" to "anthropic/claude-sonnet-4-6".  │
│  - Moved channels.telegram.streamMode →                             │
│    channels.telegram.streaming.mode (partial).                      │
```

After that, Doctor on 2026.10.4 completes (exit 0) and the config validates:

```json5 title="~/.openclaw/openclaw.json (after 2026.9.5 + 2026.10.4 Doctor)"
{
  agents: {
    defaults: {
      model: "anthropic/claude-sonnet-4-6",
      heartbeat: { every: "30m", activeHours: { start: "08:00", end: "22:00" } },
    },
    entries: { main: {} },
  },
  channels: {
    telegram: {
      enabled: true,
      botToken: "123456:fixture-not-a-real-token",
      groups: { "*": { requireMention: true } },
      streaming: { mode: "partial" },
    },
  },
}
```

### Example 3: an old cron store (needs a bridge) {#example-cron}

This install still has a `~/.openclaw/cron/jobs.json` from before the May 30, 2026 SQLite cutover, with an otherwise valid config. Doctor on 2026.10.4 refuses and leaves the file alone (temp path shortened to `~/.openclaw`, lines wrapped):

```text
Cron state: retired files whose last writer predates July 1, 2026:
~/.openclaw/cron/jobs.json. The files were left unchanged. Upgrade through OpenClaw 2026.9.7,
run "openclaw doctor --fix" on the original host, then retry this upgrade.
exit=1
```

Doctor on 2026.9.7 imports the job and renames the file to `jobs.json.migrated`:

```text
◇  Doctor changes ─────────────────────────────────────────────────╮
│  - Cron store migrated to SQLite at ~/.openclaw/cron/jobs.json.  │
├──────────────────────────────────────────────────────────────────╯
...
◇  Cron ──────────────────────────────────────────────────────────────────╮
│  1 tool-bearing cron job keeps legacy sender-policy resolution because  │
│  an explicit tool cap or provable stored account identity is missing:   │
│  `Morning brief`.                                                       │
│  - Reauthorize with an exact explicit cap: `openclaw cron edit <id>     │
│    --tools <tool,...>`.                                                 │
```

The 2026.10.4 Doctor run after it completes (exit 0) and repeats the same Cron box. That box is advice, not an error: imported jobs keep a restrictive tool policy until you give each one an explicit tool list with `openclaw cron edit <id> --tools …`.

### Example 4: heartbeat keys from old guides (silently dropped) {#example-heartbeat-keys}

Some older guides, including earlier versions of this site, taught `interval` and `quiet_hours`. The schema never accepted them. Doctor on 2026.10.4 removes them, exits 0, and you get the defaults:

```text
◇  Doctor changes ──────────────────────────╮
│  - agents.defaults.heartbeat.interval     │
│  - agents.defaults.heartbeat.quiet_hours  │
...
│  Create heartbeat monitor for agent "main" at 30m.  │
```

The result is `heartbeat: {}`: every 30 minutes, **around the clock**. Write the intent back in the current form. `activeHours` is when the heartbeat may run, the inverse of quiet hours:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      heartbeat: {
        every: "1h",
        activeHours: { start: "07:00", end: "22:00", timezone: "Europe/London" },
      },
    },
  },
}
```

:::warning The bare-number trap
`every` is a duration **string** whose default unit is minutes. `every: "30"` validates and means 30 minutes, and `every: "1"` means **every minute**, not every hour. A bare number (`every: 30`) fails validation. Always write the unit: `"30m"`, `"1h"`. Use `"0m"` to turn the recurring heartbeat off.
:::

### Re-run the tests yourself {#rerun}

`scripts/upgrade-fixtures/run.sh` copies each fixture into a fresh temp `HOME` and runs `config validate`, `doctor --fix --non-interactive` and `config validate` again with a wiped environment. It saves the before/after configs and the logs. `BRIDGE_BIN` adds bridge releases in front of the pinned one:

```bash
npm i --prefix /tmp/oc95 --no-save --ignore-scripts openclaw@2026.9.5
npm i --prefix /tmp/oc97 --no-save --ignore-scripts openclaw@2026.9.7
OPENCLAW_BIN=tools/openclaw/node_modules/.bin/openclaw scripts/upgrade-fixtures/run.sh
BRIDGE_BIN=/tmp/oc95/node_modules/.bin/openclaw:/tmp/oc97/node_modules/.bin/openclaw \
  OPENCLAW_BIN=tools/openclaw/node_modules/.bin/openclaw \
  scripts/upgrade-fixtures/run.sh b-refused-keys c-pre-sqlite-cron d-june-everything
```

Results on 2026-10-18, run directly on 2026.10.4: `a-july-two-agents` and `e-guide-era-heartbeat-keys` repaired (exit 0); `b-refused-keys` and `c-pre-sqlite-cron` refused (exit 1). With the bridges in front, `b`, `c` and `d` all completed and validated.

---

## Defaults that changed under you {#new-defaults}

Doctor does not flag these, because nothing is broken. They do change behaviour after the upgrade.

- **Self-learning is on.** `skills.workshop.autonomous.mode` defaults to `auto`: the agent maintains its own Workshop skills. On 2026.10.4 you can set `propose` to review changes first, or `off` ([Self-learning](https://docs.openclaw.ai/tools/self-learning)). `propose` is removed in 2026.10.10, where `doctor --fix` turns it into `off`; see [Skill Workshop](/guides/skill-workshop).
- **Dreaming is on.** Background memory consolidation runs by default and writes `DREAMS.md` ([Dreaming](https://docs.openclaw.ai/concepts/dreaming)).
- **Heartbeat alerts go to the owner's DM.** The default `target` is `owner`. Without a command owner, Doctor reports "No command owner is configured" and ambient alerts have nowhere to go. Set `commands.ownerAllowFrom`.
- **Sessions no longer reset at idle or day boundaries** unless you configured a reset policy. An explicit `session.reset` is kept, as in Example 1.

To get the more conservative behaviour back:

```json5 title="~/.openclaw/openclaw.json"
{
  commands: { ownerAllowFrom: ["telegram:123456789"] },
  skills: { workshop: { autonomous: { mode: "propose" } } },
  plugins: { entries: { "memory-core": { config: { dreaming: { enabled: false } } } } },
}
```

---

## Rollback {#rollback}

**Do not just reinstall the old package.** `npm install -g openclaw@<old>` on top of migrated state does not undo config or database migrations. The old release then refuses to start, or misreads newer SQLite schemas. Sessions created after 2.0 exist only in SQLite, and older releases cannot see them. The supported route is to restore the pre-upgrade state together with the release that wrote it:

```bash
openclaw gateway stop
mv ~/.openclaw ~/.openclaw.after-upgrade          # keep it; do not delete
tar -C ~ -xzf ~/Backups/openclaw/pre-2.0-YYYY-MM-DD.tar.gz
npm install -g openclaw@<the-version-you-wrote-down>
openclaw --version
openclaw doctor
openclaw gateway start
openclaw gateway status --deep
```

- Restore the config, the shared database and every per-agent database **from the same backup generation**. Never mix a pre-upgrade config with post-upgrade databases.
- To restore from the verified archive instead, run `openclaw backup restore <archive> --target ~/openclaw-restored` before downgrading the package (the target must be new or empty). Move the restored state into place with the Gateway stopped.
- Restoring is time travel. WhatsApp and other channels with ratcheting credentials may need relinking, and approvals and delivery state roll back too. Plugin `node_modules` are not archived. Reinstall plugins with `openclaw plugins install <spec> --force`.
- If you enabled the auto-updater, set `OPENCLAW_NO_AUTO_UPDATE=1` in the Gateway's environment so it does not immediately re-apply the new release.
- Once you are on 2.0, rolling back **within** 2.0 is simpler: `openclaw update --tag <known-good-version> --dry-run`, then without `--dry-run`. The updater checks compatibility and refuses a downgrade the older release cannot read.

Upstream: [Rollback and recovery](https://docs.openclaw.ai/install/updating/rollback-and-recovery), [Backups → Restore](https://docs.openclaw.ai/install/backups#restore).

---

## Afterwards {#afterwards}

```bash
openclaw --version
openclaw doctor
openclaw config validate
openclaw security audit --deep
openclaw skills list
openclaw automations list --all
openclaw gateway status --deep
```

1. **Run `openclaw doctor` with no flags.** It should report no pending repairs. Read its warnings: our test runs flagged plaintext secrets in `openclaw.json` (move them to SecretRefs with `openclaw secrets configure`), a missing command owner, and memory search with no embedding key.
2. **Run the security audit and review approvals and sandboxing.** An upgraded agent keeps whatever shell, channel and device access it had, and 2.0 added per-session permission modes. Work through [Security Hardening](/security/hardening).
3. **Check your heartbeat and automations.** Confirm the monitor job and its scratch, and that each old `tasks:` entry became its own job: [Heartbeat](/guides/heartbeat), [Automation](/guides/automation).
4. **With two or more agents, check ownership and bindings** against [Multi-Agent](/guides/multi-agent).
5. **Retire recovery data only once everything works.** `openclaw update cleanup --dry-run` shows what it would remove. Keep your two backups for a while longer.
6. **Re-check the pages you copy from.** Pages on this site marked "verified with 2026.10.4" had their config blocks and commands checked against that release. Treat anything older, here or elsewhere, as pre-2.0.

---

## Coming next {#coming-next}

:::tip Changes on upstream `main` that will matter for your next upgrade
These are in upstream's development docs as of 2026-10-18 and are **not** in 2026.10.4. They may change before release.

- **Already in 2026.10.10-beta.1** (npm `beta`, 2026-10-15): the Skill Workshop proposal flow is retired, and `doctor --fix` turns `propose` mode **off** ([Skill Workshop](/guides/skill-workshop)); tool payloads and `.env` reads are no longer masked in model context and transcripts ([hardening](/security/hardening)); the macOS and iOS apps and the Control UI in Safari need 26.2 or newer ([installation](/getting-started/installation)).
- **Plugin installs default to ClawHub** (main only; merged after both 10.10 beta tags, so it may not be in 2026.10.10). A bare `openclaw plugins install <package>`, including `@openclaw/*` names, will resolve through ClawHub with no automatic npm fallback. To install from npm, write `npm:@openclaw/<plugin>@<version>`. Scripts that rely on npm resolution will need the prefix.
- **`openai-codex-responses` joins the refused list.** In 2026.10.4, Doctor still rewrites this provider API id to `openai-chatgpt-responses`. On `main`, current Doctor refuses it and sends you to an intermediate release. Run `openclaw doctor --fix` on 2026.10.4 before you move past it.
- **Crabbox cloud-worker `settings.setupEnv` is retired** in favour of `settings.setupSecrets` store references. This only matters if you use cloud workers.
:::

---

## Related

- [Migration Guide](/guides/migration): Clawdbot/Moltbot renames, the bridge upgrade, refused keys, imports from Claude Code and Hermes
- [Heartbeat](/guides/heartbeat) · [Automation](/guides/automation) · [Multi-Agent](/guides/multi-agent) · [Security Hardening](/security/hardening)
- Upstream: [Updating](https://docs.openclaw.ai/install/updating), [Doctor config migrations](https://docs.openclaw.ai/gateway/doctor/config-migrations), [Backups](https://docs.openclaw.ai/install/backups), [Release channels](https://docs.openclaw.ai/install/development-channels), [Retired HEARTBEAT.md](https://docs.openclaw.ai/reference/templates/HEARTBEAT), [Migrating from QMD](https://docs.openclaw.ai/concepts/memory-builtin#migrating-from-qmd)
