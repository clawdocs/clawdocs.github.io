---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: ClawHub
description: Find, verify, install, update and publish OpenClaw skills on ClawHub — the real commands, security audits, and the registry's malware history
keywords: [openclaw, clawhub, openclaw marketplace, install skills, skill registry, clawhavoc]
---

# ClawHub

[ClawHub](https://clawhub.ai) is the public registry for OpenClaw skills and plugins. Anyone with a GitHub account at least 14 days old can publish, and everything published is MIT-0. The registry is open source at [openclaw/clawhub](https://github.com/openclaw/clawhub), which also owns its documentation ([docs.openclaw.ai/clawhub](https://docs.openclaw.ai/clawhub)).

ClawHub has a real malware history (see [Security](#security)). Treat every community skill as untrusted code: read it before you enable it.

There are two command-line tools:

| Tool | Use it for |
|---|---|
| `openclaw skills …` | Searching, installing, updating and verifying skills for your agent |
| `clawhub …` (separate npm package) | Uninstalling, pinning, inspecting, publishing and syncing; publisher accounts |

There is no `openclaw clawhub` command. Install the standalone CLI with `npm i -g clawhub`.

For the skill format itself, see [Skill Development](/guides/skill-development).

---

## Finding Skills

```bash
openclaw skills search "calendar"
openclaw skills search "postgres backup" --limit 20 --json
```

The `clawhub` CLI has more browsing options:

```bash
clawhub search "calendar"
clawhub explore --sort downloads --limit 25
clawhub inspect @owner/slug --files
clawhub inspect @owner/slug --file SKILL.md
```

`clawhub inspect` shows a skill's metadata, versions and files without installing it. Use it to read `SKILL.md` and any scripts first.

On [clawhub.ai](https://clawhub.ai), skills can be filtered by category: `integrations`, `automation`, `research`, `development`, `productivity`, `communication`, `creative`, `knowledge`, `agents`, `operations`, `security`, `finance`, `lifestyle`, `other`.

### Always use owner-qualified names

Skill names are scoped to their publisher: `@alice/meeting-notes` and `@bob/meeting-notes` are different skills. Common names such as `email-triage`, `daily-standup`, `web-search` and `meeting-notes` have several publishers, so a bare slug is ambiguous. On a registry with a history of typosquatting, always install with `@owner/slug`, and check that the owner is who you expect.

### Other directories

- [skills.sh](https://skills.sh): an Agent Skills directory across agents. OpenClaw installs from it with `openclaw skills install skills-sh:owner/repo/slug`. OpenClaw marks these installs **Not scanned by ClawHub**.
- [VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills): a large community list. Inclusion is not a security review.
- [clawskills.sh](https://clawskills.sh): a third-party discovery site, unrelated to skills.sh.

---

## Installing Skills

```bash
# From ClawHub, into the current agent's workspace skills/ folder
openclaw skills install @owner/slug
openclaw skills install @owner/slug --version 1.2.3

# For every local agent (into ~/.openclaw/skills)
openclaw skills install @owner/slug --global

# For a specific agent
openclaw skills install @owner/slug --agent work

# From a local folder (needs SKILL.md at its root)
openclaw skills install ./path/to/skill --as my-skill
```

skills.sh entries use `skills-sh:owner/repo/slug`, and git repositories `git:owner/repo` or `git:owner/repo@ref` (with `SKILL.md` at the repo root). `openclaw skills update` only tracks ClawHub installs; reinstall git and local sources to refresh them.

The skills watcher picks up a new skill on the next agent turn, including in a running chat. If it does not show up, send `/new`.

### Release trust

Before downloading a community skill, `openclaw skills install` and `update` check ClawHub's trust data for that exact release. Malicious or blocked releases are refused. Releases that need review print the audit summary and a link, then continue. `--force-install` installs a GitHub-backed skill whose ClawHub scan is still pending; do not use it for skills you have not read.

### Verify before installing

1. **Read the security audit** on the skill's page at `https://clawhub.ai/<owner>/skills/<slug>/security-audit`. Status is `Pass`, `Review`, `Warn`, `Malicious`, `Pending` or `Error`, with a separate risk level (`Low`, `Medium`, `High`). A `Review` with `Medium` risk is normal for a skill that can, say, post to your accounts. `Malicious` means do not install.
2. **Verify the release** with OpenClaw. The command exits non-zero when ClawHub marks verification as failed:

   ```bash
   openclaw skills verify @owner/slug
   openclaw skills verify @owner/slug --card   # print the generated Skill Card
   ```

3. **Read the files**: `clawhub inspect @owner/slug --files`, then `--file SKILL.md` and any scripts.
4. **Check the declared requirements**: binaries, environment variables and config paths in `metadata.openclaw`. A weather skill that asks for `AWS_SECRET_ACCESS_KEY` is a red flag.
5. **Check the publisher**: owner handle, source repository, version history, downloads.

There is no flag that installs a skill "in a sandbox". A skill runs with whatever tools and access its agent has. To contain untrusted skills, run them in an agent with sandboxing and a restrictive tool policy. See [Security hardening](/security/hardening).

---

## Managing Installed Skills

```bash
openclaw skills list
openclaw skills check
openclaw skills update @owner/slug
openclaw skills update --all
openclaw skills update --all --global
```

Updates are explicit; nothing updates on its own. An update refuses to overwrite local edits unless you pass `--force`.

Disable a skill without removing it:

```bash
openclaw config set skills.entries.slug.enabled false
```

Remove a skill with the `clawhub` CLI. Point `--workdir` at the folder it was installed into: the agent workspace, or the state directory for `--global` installs:

```bash
clawhub --workdir ~/.openclaw/workspace uninstall @owner/slug
clawhub --workdir ~/.openclaw uninstall @owner/slug
```

### Pinning and local edits

`openclaw skills install` writes `.clawhub/lock.json` in the workspace and `.clawhub/origin.json` in each skill. If you edit an installed skill, an update will refuse to replace it unless forced. To freeze it on purpose:

```bash
clawhub --workdir ~/.openclaw/workspace pin slug --reason "local changes"
clawhub --workdir ~/.openclaw/workspace list
clawhub --workdir ~/.openclaw/workspace unpin slug
```

For heavy changes, copy the skill to a new folder with a new `name` instead; it then stops being a ClawHub-tracked install. Installs made before July 2026 used a `.clawdhub` folder, which is no longer read. Rename it to `.clawhub` before updating or verifying.

---

## Publishing Skills

```bash
npm i -g clawhub
clawhub login

clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill --categories productivity --topics "email,triage"
clawhub skill publish ./my-skill --version 2.0.0
clawhub sync --all --dry-run
```

- New skills start at `1.0.0`; changed content gets the next patch version. Publishing unchanged content is a no-op.
- `--owner <handle>` publishes under an organization where you have publisher access.
- Up to 3 categories and 5 topics. An unknown category fails the publish.
- ClawHub accepts any regular file in the folder up to 50 MB in total, except Python bytecode (`.pyc`, `.pyo`, `.pyd`). Use `.clawhubignore` to leave files out.
- All skills are MIT-0. There are no paid skills, and `SKILL.md` cannot set another licence.

ClawHub's own field reference adds `envVars` (with `required: false` for optional variables) on top of the `metadata.openclaw` fields OpenClaw reads. Its scanner flags code that reads an environment variable the frontmatter does not declare. See [Skill format](https://docs.openclaw.ai/clawhub/skill-format).

For CI, ClawHub ships a reusable GitHub Actions workflow; see [CI/CD & Testing](/guides/cicd-testing#publishing-skills-from-ci).

### After you publish

A new release stays pending until it clears ClawHub's pre-publication checks (see [What ClawHub checks today](#what-clawhub-checks-today)), then appears in search. Releases that are held or blocked stay visible to their owner. Download the scan report for a blocked version with:

```bash
clawhub scan download my-skill --version 1.0.1 --output report.zip
```

Skills the agent writes for itself go through [Skill Workshop](/guides/skill-workshop), not ClawHub.

---

## Security

### Incident history {#the-clawhavoc-incident-february-2026}

In February 2026 Koi Security flagged 341 of the 2,857 skills then on ClawHub as malicious, 335 of them from one campaign (**ClawHavoc**) that used a fake "Prerequisites" step to install the Atomic macOS Stealer. In June 2026 Palo Alto Networks Unit 42 reported five more malicious skills that had passed ClawHub's scanning, including one that padded `README.md` with 22 MB of junk to get past scanner size limits ([Unit 42](https://unit42.paloaltonetworks.com/openclaw-ai-supply-chain-risk/)). Scanning catches a lot, and attackers design around it. The full history is in [Known Vulnerabilities](/security/known-vulnerabilities#malicious-clawhub-skills-february-2026).

### What ClawHub checks today

Since 2026-10-13 every new skill version and package release is held as **pending** until the TruffleHog and ClawScan pre-publication checks pass on that exact artifact. A malicious verdict blocks the release; a scanner failure or timeout leaves it unpublished ([clawhub PR #3947](https://github.com/openclaw/clawhub/pull/3947)). The skill's security audit page then combines results from NVIDIA SkillSpector, Tencent A.I.G, ClawScan, VirusTotal and static analysis ([Security audits](https://docs.openclaw.ai/clawhub/security-audits)). Because A.I.G cannot inspect Python bytecode, ClawHub rejects skills containing `.pyc`, `.pyo` or `.pyd` files.

Signed-in users can report a skill with the **Report skill** button. Reports never hide a skill automatically; moderators review them ([ClawHub moderation spec](https://github.com/openclaw/clawhub/blob/main/specs/security-moderation.md)). The old auto-hide rule was withdrawn after GHSA-5jj4-m8c9-gwcq showed that four ordinary accounts could hide any skill, official ones included.

On the OpenClaw side, `openclaw skills install` refuses releases ClawHub has marked malicious or blocked, and `openclaw security audit --deep` runs the local code-safety scanner over installed skills. Red flags to look for when reading a skill, and third-party scanners, are in [Skill Verification](/security/skill-verification#3-review-the-source).

### Locking down installs

There is no setting that switches ClawHub off. `security.installPolicy` runs a trusted local command before every skill or plugin install or update (ClawHub, skills.sh, git, local, uploads, dependency installers); it answers `allow`, `warn` or `block`, and installs fail closed if it cannot answer. `skills.allowBundled` limits which bundled skills are eligible, and `agents.defaults.skills` / `agents.entries.<id>.skills` limit which skills each agent sees. Config and caveats: [Skill Verification](/security/skill-verification#restrict-or-block-installs) and upstream [Operator install policy](https://docs.openclaw.ai/tools/skills-config#operator-install-policy-security-installpolicy).

### Reporting

- **A malicious or misleading skill**: use **Report skill** on its ClawHub page. For plugins and other packages: `clawhub package report <name> --reason "..."`.
- **A bug in ClawHub itself** (site, API, CLI, scanning, install trust): a security advisory on [openclaw/clawhub](https://github.com/openclaw/clawhub/security/advisories).
- **A vulnerability in someone's skill code**: tell the publisher or the linked source repository.
- **Your own listing was held or your account restricted**: appeal at [appeals.openclaw.ai](https://appeals.openclaw.ai).

---

## CLI Reference

```bash
# OpenClaw side
openclaw skills search "query" [--limit <n>] [--json]
openclaw skills install @owner/slug [--version <v>] [--global] [--agent <id>]
openclaw skills update @owner/slug | --all [--global] [--force]
openclaw skills verify @owner/slug [--version <v>] [--card] [--json]
openclaw skills list [--eligible] [--verbose]
openclaw skills info <name>
openclaw skills check [--json]
```

```bash
# Standalone ClawHub CLI (npm i -g clawhub)
clawhub login
clawhub whoami
clawhub search "query"
clawhub explore [--sort downloads]
clawhub inspect @owner/slug [--files] [--file <path>] [--versions]
clawhub --workdir <dir> uninstall @owner/slug   # <dir>: agent workspace, or ~/.openclaw for --global
clawhub --workdir <dir> list
clawhub --workdir <dir> pin <slug> [--reason <text>]
clawhub --workdir <dir> unpin <slug>
clawhub skill publish <dir> [--dry-run] [--version <v>] [--owner <handle>] [--categories <slugs>]
clawhub sync --all [--dry-run] [--bump minor]
clawhub scan download <slug> --version <v>
```

Full reference: [ClawHub CLI](https://docs.openclaw.ai/clawhub/cli), [`openclaw skills`](https://docs.openclaw.ai/cli/skills) and the site [CLI Reference](/reference/cli#skills-plugins-and-mcp).

---

## See Also

- [Skill Development](/guides/skill-development): write your own skills
- [Skill Workshop](/guides/skill-workshop): skills the agent writes for itself
- [Skill Verification](/security/skill-verification): a deeper vetting walkthrough
- [Security hardening](/security/hardening): sandboxing, tool policy, approvals
- [Plugin System](/guides/plugin-system): ClawHub also hosts plugins
