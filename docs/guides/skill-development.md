---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Skill Development
description: Write OpenClaw skills as SKILL.md folders — frontmatter, gating, per-skill config, testing, and publishing to ClawHub
keywords: [openclaw, openclaw skills, build skill, skill development, SKILL.md, clawhub]
---

# Skill Development

A skill is a folder with a `SKILL.md` file in it. The file has YAML frontmatter (a name and a one-line description) and a Markdown body that tells the agent how to do one job with the tools it already has. Skills add no new tools and run no code of their own. They are instructions.

This page covers writing, gating, configuring, testing and publishing your own skills. To install existing skills, see [ClawHub](/guides/clawhub). The official references are [Creating skills](https://docs.openclaw.ai/tools/creating-skills) and [Skills](https://docs.openclaw.ai/tools/skills).

---

## Your First Skill

Skills you write live in your agent's workspace, one folder per skill:

```bash
mkdir -p ~/.openclaw/workspace/skills/git-summary
```

Create `~/.openclaw/workspace/skills/git-summary/SKILL.md`:

```markdown title="~/.openclaw/workspace/skills/git-summary/SKILL.md"
---
name: git-summary
description: Summarize recent git activity in a repository - commits, authors, changed areas.
---

# Git Summary

When the user asks what changed in a repository:

1. Use the `exec` tool to run `git log --oneline -20` in the repository they name.
2. Run `git diff --stat HEAD~10` to see which files changed most.
3. Group the commits by theme (features, fixes, refactors).
4. Reply with a short summary: what changed, who did it, which areas were touched.

If the folder is not a git repository, say so and stop.
```

Check that OpenClaw found it, then try it:

```bash
openclaw skills list
openclaw skills info git-summary
openclaw agent --agent main --message "summarize recent git activity in ~/projects/myapp"
```

OpenClaw watches skill folders and picks up changes within about a minute. A running session keeps the skill list it started with, so send `/new` in chat (or start a new session) to see a new skill. You can also call it by name: `/git-summary` as a slash command, or `$git-summary` anywhere in a message.

:::warning A test turn is a real turn
There is no dry-run mode for skills. `openclaw agent --message` runs the agent with its normal tools, so a skill that deletes files or sends messages will do that. Test risky skills in a sandboxed agent or a throwaway workspace. See [Sandboxing](https://docs.openclaw.ai/gateway/sandboxing).
:::

---

## Where Skills Live

OpenClaw loads skills from several roots. When two skills have the same `name`, the higher one wins:

| Priority | Source | Path |
|---|---|---|
| 1 (highest) | Workspace skills | `<workspace>/skills` (default `~/.openclaw/workspace/skills`) |
| 2 | Project agent skills | `<workspace>/.agents/skills` |
| 3 | Personal agent skills | `~/.agents/skills` |
| 4 | Managed / shared skills | `~/.openclaw/skills` (`openclaw skills install --global` puts them here) |
| 5 | Workshop skills | `~/.openclaw/agents/<agentId>/agent/workshop-skills` |
| 6 | Bundled skills | shipped with OpenClaw |
| 7 (lowest) | Extra directories and plugin skills | `skills.load.extraDirs`, plugin `skills` dirs |

A skill is found wherever a `SKILL.md` appears under a root, up to six levels deep, so you can group skills in subfolders (`skills/personal/git-summary/SKILL.md`). The folder path is only for your own organization. The skill's name comes from `name` in the frontmatter.

Since 2026.9.3, Workshop skills belong to one agent, not to a workspace. In a multi-agent setup, put a skill in that agent's workspace to keep it private, or in `~/.openclaw/skills` to share it. See [Skill Workshop](/guides/skill-workshop).

---

## SKILL.md Format

### Frontmatter

OpenClaw reads these frontmatter keys and ignores everything else (`src/skills/loading/frontmatter.ts`):

| Field | Required | Default | What it does |
|---|---|---|---|
| `name` | Yes | folder name | Lowercase letters, digits and hyphens. Keep it the same as the folder name. |
| `description` | Yes | | One line, under 160 characters. The agent sees it in its skill list and decides from it when to read the skill. |
| `homepage` | No | | URL shown as "Website" in the macOS Skills UI. |
| `user-invocable` | No | `true` | Expose the skill as a `/name` slash command. |
| `disable-model-invocation` | No | `false` | Keep the skill out of the agent's prompt. It still runs when you call it with `/name` or `$name`. |
| `command-dispatch` | No | | Set to `tool` to send the slash command straight to a tool, bypassing the model. |
| `command-tool` | No | | Which tool receives the command when `command-dispatch: tool`. |
| `command-arg-mode` | No | `raw` | For tool dispatch, pass the argument string through unparsed. |
| `metadata` | No | | Gating and installer hints under `metadata.openclaw` (see [Conditional Activation](#conditional-activation)). |

Fields such as `version`, `trigger`, `tools`, `author`, `config` or `depends` do nothing in OpenClaw. ClawHub reads `version` as registry metadata when you publish, but the agent never sees it.

:::note
Skills written for the pre-July 2026 `metadata.clawdbot` block are no longer gated correctly. Rename that block to `metadata.openclaw`. OpenClaw does not rewrite the file for you.
:::

OpenClaw follows the [AgentSkills](https://agentskills.io) format, so a well-formed skill also works in other agents that read it.

### Markdown Body

The body is what the agent reads when it decides to use the skill. Write it like a briefing for a capable colleague:

- **What to do**: clear steps in order
- **When to use it and when not to**: edge cases and boundaries
- **How to present the result**: the output format you want
- **Examples**: an input and the output you expect

Refer to files inside the skill folder with `{baseDir}`, which OpenClaw resolves to the skill's own directory:

```markdown
Run the helper script at `{baseDir}/scripts/report.sh`.
Use the checklist in `{baseDir}/references/checklist.md`.
```

---

## How the Agent Picks a Skill

There are no trigger keywords or regexes. For each eligible skill, OpenClaw puts its name, description and location into a compact `<available_skills>` block in the system prompt. The model reads a skill's full `SKILL.md` when the task matches. With a large catalogue, skills that do not fit the prompt budget stay findable through the `skills_search` and `skills_read` tools.

You can also force a skill:

- `/git-summary ...` runs it as a slash command (when `user-invocable` is true).
- `$git-summary` anywhere in a message tells the agent to read that skill first. One message can name up to eight skills.

This is why the `description` matters most. A vague description means the skill is never picked, or picked for the wrong job.

### Token cost

Each eligible skill costs about 24 tokens of fixed overhead plus the length of its name, description and path, on every turn. The body costs nothing until the agent reads it. So keep descriptions short and specific, and put the detail in the body. When the list overflows `skills.limits.maxSkillsPromptChars`, OpenClaw shortens or drops descriptions and tells you to run `openclaw skills check`.

---

## Conditional Activation

Gate a skill so it only appears when it can work. Gates go under `metadata.openclaw`, which OpenClaw parses as JSON5 (the YAML block form also works):

```markdown title="skills/container-manager/SKILL.md"
---
name: container-manager
description: Check, restart and read logs of Docker containers on this host.
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["docker"] },
        "os": ["linux", "darwin"],
      },
  }
---
```

| Key (under `metadata.openclaw`) | Meaning |
|---|---|
| `requires.bins` | Every binary must be on `PATH` |
| `requires.anyBins` | At least one of these binaries must be on `PATH` |
| `requires.env` | Each environment variable must be set, in the process or via config |
| `requires.config` | Each `openclaw.json` path must be truthy, for example `browser.enabled` |
| `os` | Only load on these platforms: `darwin` (or `macos`), `linux`, `win32` |
| `always` | Load even when `requires.*` fails (the `os` filter still applies) |
| `primaryEnv` | The env var that `skills.entries.<name>.apiKey` fills in |
| `skillKey` | Use a different key under `skills.entries` |
| `emoji` | Icon in the macOS Skills UI |
| `install` | Installer hints for the macOS Skills UI (`brew`, `node`, `go`, `uv`, `download`) |

`requires.bins` is checked on the host. If the agent runs in a sandbox, the binary must also exist inside the container.

A skill that fails its gates is filtered out, not deleted. To see why:

```bash
openclaw skills check
openclaw skills list --eligible
openclaw skills list --verbose
```

---

## Per-Skill Configuration

Skills have no config schema of their own. You toggle and configure them in `openclaw.json` under `skills.entries.<name>`:

```json5 title="~/.openclaw/openclaw.json"
{
  skills: {
    entries: {
      "git-summary": {
        enabled: true,
        config: { maxCommits: 20, defaultRepo: "~/projects/myapp" },
      },
      "weather-lookup": {
        apiKey: { source: "env", provider: "default", id: "WEATHER_API_KEY" },
      },
      sag: { enabled: false },
    },
  },
}
```

- `enabled: false` turns a skill off, including bundled ones.
- `config` is a free-form bag. Tell the agent in the skill body which keys to look for.
- `env` and `apiKey` are injected into the **host** process for that agent turn only. They do not reach a sandbox. `apiKey` needs the skill to declare `metadata.openclaw.primaryEnv`.

Set single values from the CLI:

```bash
openclaw config set skills.entries.git-summary.config.maxCommits 20
openclaw config set skills.entries.git-summary.enabled false
```

Full schema: [Skills config](https://docs.openclaw.ai/tools/skills-config).

---

## State and Files

A skill has no storage of its own. If it needs to keep notes between runs, tell it to write a file in the workspace, for example `notes/uptime-state.md`, and read it back next time. Long-term facts belong in the agent's [memory](/guides/memory-systems), not in a skill.

---

## Multi-File Skills

Put supporting files next to `SKILL.md`:

```
skills/code-review/
├── SKILL.md
├── references/
│   └── checklist.md
├── templates/
│   └── review.md
└── scripts/
    └── lint-summary.sh
```

Reference them with `{baseDir}`. Size limits depend on where the skill goes:

| Destination | Limit |
|---|---|
| ClawHub publish | 50 MB per bundle. Any regular file is accepted, except Python bytecode (`.pyc`, `.pyo`, `.pyd`). |
| Personal skill library (shared Gateway) | 256 files, 1 MiB per file, 8 MiB in total |
| Skill Workshop proposal | 64 support files, 256 KiB each, 2 MiB in total, under `assets/`, `examples/`, `references/`, `scripts/` or `templates/` |

---

## Skills Do Not Restrict Tools

A skill cannot limit what the agent does. Mentioning `exec` in a skill does not grant it, and leaving it out does not take it away. Upstream says plainly that skill visibility "is not a host shell authorization boundary". To limit what an agent can do, use:

- tool policy (`tools.profile`, `tools.allow`, `tools.deny`)
- [sandboxing](https://docs.openclaw.ai/gateway/sandboxing) (`agents.defaults.sandbox.mode`)
- exec approvals

```json5 title="~/.openclaw/openclaw.json"
{
  tools: { deny: ["browser"] },
  agents: {
    defaults: {
      sandbox: { mode: "all" },
    },
  },
}
```

:::warning
Skills that use `exec`, browser, email or messaging act with whatever access the agent has. Before you give an agent such skills, read [Security hardening](/security/hardening) and decide on approvals and sandboxing.
:::

### Which agent sees which skill

Skill location and skill visibility are separate. Use allowlists to choose which skills an agent can see:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    ownership: "explicit",
    defaults: { skills: ["github", "weather"] },
    entries: {
      main: {},
      docs: { skills: ["docs-search"] },
      "locked-down": { skills: [] },
    },
  },
}
```

- `ownership: "explicit"` is required once you list more than one agent.
- No `agents.defaults.skills`: every eligible skill is visible.
- An agent without `skills` inherits the default list. A non-empty list replaces it entirely. `[]` means no skills.
- Learned Workshop skills bypass these allowlists. Archive or reject them in the Workshop to hide them.

---

## Testing & Debugging

```bash
# Is the skill discovered, and is it eligible?
openclaw skills list --verbose
openclaw skills info git-summary
openclaw skills check --json

# Run a real turn against it
openclaw agent --agent main --message "summarize recent git activity in ~/projects/myapp"

# Watch the Gateway while you test
openclaw logs --follow
```

For a repeatable test with no Gateway and a temporary state directory, use `openclaw agent exec` with a pinned config. See [CI/CD & Testing](/guides/cicd-testing).

### Common Issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Skill not in `skills list` | File is not called `SKILL.md`, or it is not in a skill root | Move it to `<workspace>/skills/<name>/SKILL.md` |
| Listed but not eligible | A `requires.*` or `os` gate fails | `openclaw skills check` shows which one |
| Eligible but the agent ignores it | The description does not match how you ask | Rewrite the description; test with `$name` |
| Agent cannot see it | An agent skill allowlist hides it | Check `agents.defaults.skills` and `agents.entries.<id>.skills` |
| Edit not picked up | The session keeps its skill snapshot | Send `/new`, or wait about a minute for the watcher |
| Two skills with the same name | A higher-priority root wins | Rename one, or remove the duplicate |
| Gates ignored on an old skill | It uses `metadata.clawdbot` | Rename the block to `metadata.openclaw` |

---

## Security Best Practices for Skill Authors

### Do

- Say in the body which tools the skill uses and why
- Declare every environment variable the skill reads, in `requires.env`, `primaryEnv` or ClawHub's `envVars`. ClawHub's scanner flags undeclared ones.
- Treat input from messages, web pages and files as untrusted. Do not paste it into shell commands unquoted.
- Ask for confirmation before destructive steps (deleting, restarting, sending)

### Don't

- Read credential paths (`~/.ssh`, `~/.aws`, `~/.gnupg`) without a clear reason
- Use `curl | bash` or `wget | bash` patterns
- Embed Base64-encoded content
- Hardcode URLs to unknown external domains
- Edit `SOUL.md` or other agent configuration
- Put secrets in the skill text. Use `skills.entries.<name>.apiKey` or `env` instead.
- Use `chmod 777` or loosen file permissions

### Supply Chain Awareness

If your skill fetches external resources (APIs, scripts, packages):

- Document every external dependency
- Pin versions where possible
- Prefer well-known, trusted sources
- Consider what happens if an external resource is compromised

---

## Real-World Examples

### DevOps: Container Manager

```markdown title="skills/container-manager/SKILL.md"
---
name: container-manager
description: Check, restart and read logs of Docker containers on this host.
metadata: { "openclaw": { "requires": { "bins": ["docker"] }, "os": ["linux", "darwin"] } }
---

# Container Manager

## Status
1. Run `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`.
2. Run `docker ps --filter health=unhealthy` and highlight anything listed.

## Logs
1. Work out which container the user means. If unclear, ask.
2. Run `docker logs --tail 50 <container>` and summarize errors and warnings.

## Restart
1. Confirm the container name with the user before restarting.
2. Run `docker restart <container>`, wait 10 seconds, then check its status.
3. Report whether the restart worked.
```

### Productivity: Meeting Notes

```markdown title="skills/meeting-notes/SKILL.md"
---
name: meeting-notes
description: Turn a meeting transcript into decisions, action items and open questions.
---

# Meeting Notes

When given a meeting transcript (pasted text or a file path):

1. Write a 2-3 sentence summary at the top.
2. List the **decisions** made, and who made them.
3. List the **action items** with owner and deadline.
4. List **open questions** that were not resolved.

Save the result to `notes/meetings/YYYY-MM-DD-<topic>.md` in the workspace,
using the template in `{baseDir}/templates/notes.md`.
```

### Monitoring: Uptime Checker

```markdown title="skills/uptime-checker/SKILL.md"
---
name: uptime-checker
description: Check whether the user's websites respond, and report changes since the last check.
metadata: { "openclaw": { "requires": { "bins": ["curl"] } } }
---

# Uptime Checker

The sites to check are listed in `skills.entries.uptime-checker.config.urls`.

1. For each URL, run `curl -s -o /dev/null -w "%{http_code} %{time_total}" <url>`.
2. Read `notes/uptime-state.md` from the workspace if it exists.
3. Report any site that is down, slow (over 3 seconds) or changed since the last run.
4. Overwrite `notes/uptime-state.md` with the current results.
```

To run a check like this on a schedule, create an [Automation](/guides/automation) job that asks the agent to use the skill.

---

## Publishing

### To ClawHub

Publishing uses the separate `clawhub` CLI ([docs](https://docs.openclaw.ai/clawhub/cli)), not `openclaw`:

```bash
npm i -g clawhub
clawhub login

# Check what would be published, without uploading
clawhub skill publish ~/.openclaw/workspace/skills/git-summary --dry-run

# Publish (new skills start at 1.0.0; changes bump the patch version)
clawhub skill publish ~/.openclaw/workspace/skills/git-summary --categories development

# Publish every new or changed skill in a folder
clawhub sync --all --dry-run
clawhub sync --all
```

Published skills are released under MIT-0, free to use without attribution. ClawHub has no paid skills. Your GitHub account must be at least 14 days old to publish.

### Publishing Checklist

- [ ] `name` matches the folder name; `description` is one line under 160 characters
- [ ] Gates (`requires.bins`, `requires.env`, `os`) match what the skill really needs
- [ ] Every env var the skill reads is declared (`requires.env`, `primaryEnv`, or `envVars` with `required: false` for optional ones)
- [ ] `homepage` points to the source
- [ ] No secrets, no `curl | bash`, no Base64 blobs, no `.pyc` files
- [ ] Tested with a real turn in a sandboxed or throwaway agent
- [ ] `clawhub skill publish <dir> --dry-run` succeeds

See [ClawHub — Publishing](https://docs.openclaw.ai/clawhub/publishing) for owners, categories and review.

### Via Skill Workshop

Skills that the agent writes for itself go through [Skill Workshop](/guides/skill-workshop), not through your workspace folder.

---

## CLI Reference

```bash
# Discover and inspect
openclaw skills list [--eligible] [--verbose] [--json]
openclaw skills info <name>
openclaw skills check [--json]

# Install and update (ClawHub, skills.sh, a local folder; git:owner/repo@ref also works)
openclaw skills search "query"
openclaw skills install @owner/slug [--version 1.2.3] [--global]
openclaw skills install ./path/to/skill --as my-skill
openclaw skills update --all
openclaw skills verify @owner/slug

# Learned skills
openclaw skills workshop list
```

```bash
# Standalone ClawHub CLI
clawhub login
clawhub skill publish <dir> [--dry-run] [--version <v>] [--owner <handle>]
clawhub sync --all
clawhub uninstall <slug>
```

There is no `openclaw skill` (singular) or `openclaw clawhub` command.

---

## See Also

- [ClawHub](/guides/clawhub): find, verify and install community skills
- [Skill Workshop](/guides/skill-workshop): skills the agent proposes for itself
- [Plugin System](/guides/plugin-system): when you need real code, not instructions
- [Security hardening](/security/hardening): sandboxing and approvals
- Upstream: [Creating skills](https://docs.openclaw.ai/tools/creating-skills), [Skills](https://docs.openclaw.ai/tools/skills), [Skills config](https://docs.openclaw.ai/tools/skills-config), [`openclaw skills`](https://docs.openclaw.ai/cli/skills)
