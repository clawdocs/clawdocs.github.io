---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: "Day 4: Supercharge It"
description: "Use the skills that ship with OpenClaw, find more on ClawHub, and check them before you install"
keywords: [openclaw, skills, install skills, clawhub, skill tutorial, community skills, extend bot]
---

# Day 4: Supercharge It

Your bot can chat and run scheduled jobs. Today you give it **skills**: written instructions that teach it how to do specific jobs well, like working with GitHub, your calendar or your notes. Many skills already ship with OpenClaw. More are on ClawHub, the community registry.

## What are skills?

A skill is a **directory** that contains a `SKILL.md` file. The file has YAML frontmatter with a `name` and a `description`, then Markdown instructions ([Skills](https://docs.openclaw.ai/tools/skills)).

- OpenClaw shows the agent each eligible skill's name and description. The agent decides from the **description** when a skill is relevant, then reads the full instructions. There are no trigger words.
- You can run a skill explicitly from chat with `/skill <name> [input]`.
- Skills only give **instructions**. A skill cannot grant or remove tools. What the agent can actually do (shell, files, browser, web) is set by tool policy in `openclaw.json`, not by the skill.

Skills load from several places. The most useful two:

| Location | What goes there |
|---|---|
| `~/.openclaw/workspace/skills/<name>/SKILL.md` | Your skills and skills installed from ClawHub (highest precedence) |
| Shipped with OpenClaw | Bundled skills such as `github`, `weather`, `summarize` |

The full precedence list is in [Skills: loading order](https://docs.openclaw.ai/tools/skills#loading-order).

## Start with the skills you already have

OpenClaw ships about 50 bundled skills. List them and see which are ready:

```bash
openclaw skills list
openclaw skills check
```

`skills check` reports skills that are missing a requirement, usually a command-line tool or an API key. A few bundled skills worth setting up first:

| Skill | What it does | Needs |
|---|---|---|
| `github` | Issues, PRs, CI logs and reviews through the `gh` CLI | `gh`, then `gh auth login` |
| `weather` | Current weather and forecasts | nothing extra (falls back to `curl`) |
| `summarize` | Summarise URLs, files and transcripts | the `summarize` CLI |
| `obsidian` | Read and write notes in an Obsidian vault | the `obsidian` CLI |
| `gog` | Gmail, Calendar and Drive | the `gog` CLI and a Google login |
| `himalaya` | Email over IMAP/SMTP | the `himalaya` CLI |
| `healthcheck` | Audit and harden the host OpenClaw runs on | nothing extra |

See the details and missing requirements for one skill:

```bash
openclaw skills info github
```

Once its requirements are met, the skill becomes eligible. Start a new session (`/new`) so the agent sees the refreshed list, then try it from the TUI, the Control UI chat or any connected channel:

```text
/skill weather Berlin
```

Or from the command line through the Gateway:

```bash
openclaw agent --agent main --message "What's the weather in Berlin this afternoon?"
```

:::tip
A skill that works with your email or GitHub uses whatever access you give its CLI. Log `gh` in with a token scoped to the repos you need, and prefer read-only access until you trust the setup.
:::

## Find more on ClawHub

ClawHub is the public skill registry. Browse it at [clawhub.ai](https://clawhub.ai) or search from the CLI:

```bash
openclaw skills search "calendar"
openclaw skills search "rss digest" --limit 10
```

Results are identified as `@owner/slug`. Always use the owner-qualified form: many slugs are shared by several publishers. For example, `calendar` and `weather` each have several unrelated publishers on ClawHub, and the bare name will not tell you which one you get.

## Check before you install {#security-check}

:::danger Read skills before you install them
In February 2026, Koi Security audited the 2,857 skills then on ClawHub and found **341 malicious skills**. Most had a "Prerequisites" section telling the user to download and run an obfuscated installer that delivered macOS malware ([Koi Security](https://koisecurity.com/clawdex); summary in [Known Vulnerabilities](/security/known-vulnerabilities#the-clawhavoc-campaign)). ClawHub now scans uploads, but a scan is not a review. A skill's instructions run with all the tools your agent has.
:::

Ask ClawHub for its verdict and the generated Skill Card before installing. The example is the CalDAV calendar skill by `asleep123`, a community publisher:

```bash
openclaw skills verify @asleep123/caldav-calendar --card
```

`--card` prints a readable summary and exits non-zero when ClawHub's decision is a fail. Then read the source on the skill's page, `https://clawhub.ai/<owner>/skills/<slug>` (here [clawhub.ai/asleep123/skills/caldav-calendar](https://clawhub.ai/asleep123/skills/caldav-calendar)).

Red flags:

- Instructions to download and run something (`curl … | sh`, "install this helper first").
- Encoded or obfuscated text, or instructions to send data to URLs you don't recognise.
- Instructions to read files outside the task, such as `~/.ssh`, `~/.openclaw/credentials` or browser profiles.
- A brand-new publisher with almost no installs, or a name that imitates a popular skill.

Remember that the skill cannot limit what the agent does. If a skill doesn't need the shell, the place to enforce that is tool policy and exec approvals, not the skill file. See [Security Hardening: exec approvals](/security/hardening#exec-approvals) and [skills and plugins](/security/hardening#supply-chain). The full checklist is in [Skill Verification](/security/skill-verification).

## Install your first skill

Once you are happy with what you read, install it into your workspace:

```bash
openclaw skills install @asleep123/caldav-calendar
openclaw skills list
```

The skill lands in `~/.openclaw/workspace/skills/caldav-calendar/`. OpenClaw watches skill folders, so new sessions pick it up without a restart. In a conversation that was already open, send `/new` to start a fresh session.

Pin a version you reviewed with `--version <version>`. Add `--global` to install into the shared managed directory (`~/.openclaw/skills/`) for every agent instead of one workspace.

:::tip
**Start with two or three skills, not twenty.** Every eligible skill adds its name and description to the prompt, which costs tokens on every turn, and every skill is more text you have to trust.
:::

## Managing skills

```bash
# What is installed, and what is ready
openclaw skills list
openclaw skills list --eligible

# Update everything installed from ClawHub (keeps local edits unless you pass --force)
openclaw skills update --all

# Update one skill
openclaw skills update @asleep123/caldav-calendar
```

To turn a skill off without uninstalling it, disable it in config:

```json5 title="~/.openclaw/openclaw.json"
{
  skills: {
    entries: {
      weather: { enabled: false },
    },
  },
}
```

API keys and settings for a skill also go in `skills.entries.<name>` (`apiKey`, `env`, `config`), not in the skill file ([Skills config](https://docs.openclaw.ai/tools/skills-config)). Those values are injected into the host process for that turn, not into a sandbox.

To remove a ClawHub skill, use the standalone ClawHub CLI, which asks for confirmation before deleting the folder:

```bash
npm i -g clawhub
clawhub uninstall @asleep123/caldav-calendar
```

## Building vs installing

Everything on ClawHub uses the same format you can write yourself. A minimal skill:

````markdown title="~/.openclaw/workspace/skills/my-custom-skill/SKILL.md"
---
name: my-custom-skill
description: One line that tells the agent when to use this skill.
---

# My Custom Skill

## Steps
1. Do the first thing.
2. Then the second thing.
3. Return the result in this format:

```
Result: ...
```
````

Keep the folder name and the `name` field the same. Day 6 walks through building one. The full reference is [Creating skills](https://docs.openclaw.ai/tools/creating-skills) and the [Skill Development Guide](/guides/skill-development).

---

**Next: [Day 5: Be Everywhere](day-5-multi-channel)**: connect more platforms and control who can talk to your bot.
