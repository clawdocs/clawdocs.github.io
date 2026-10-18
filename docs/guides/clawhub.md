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

- [skills.sh](https://skills.sh): an Agent Skills directory across agents. OpenClaw installs from it with `openclaw skills install skills-sh:owner/repo/slug`. These entries are marked **Not scanned by ClawHub**.
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

New skills reach new sessions within about a minute. Send `/new` to use one in the current chat.

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

Publishes are staged: a release is held behind pre-publication checks (static analysis, VirusTotal, SkillSpector, Tencent A.I.G, ClawScan risk analysis) and appears in search once it clears. Releases that are held or blocked stay visible to their owner. Download the scan report for a blocked version with:

```bash
clawhub scan download my-skill --version 1.0.1 --output report.zip
```

Skills the agent writes for itself go through [Skill Workshop](/guides/skill-workshop), not ClawHub.

---

## Security

### The ClawHavoc incident (February 2026)

Koi Security audited all 2,857 skills then on ClawHub and flagged 341 as malicious, 335 of them from one campaign it named **ClawHavoc** ([The Hacker News](https://thehackernews.com/2026/02/researchers-find-341-malicious-clawhub.html), [SC Media](https://www.scworld.com/news/openclaw-agents-targeted-with-341-malicious-clawhub-skills), [eSecurity Planet](https://www.esecurityplanet.com/threats/hundreds-of-malicious-skills-found-in-openclaws-clawhub/)). The skills posed as crypto wallet trackers, Polymarket bots, YouTube tools and Google Workspace integrations, often under typosquatted names. Most told the user to run a fake "Prerequisites" step that installed **Atomic macOS Stealer (AMOS)**. Windows users were sent a password-protected ZIP containing a keylogger.

Around the same time, Snyk's **ToxicSkills** study scanned 3,984 skills from ClawHub and skills.sh and found at least one security flaw in 36.8% of them, a critical issue in 13.4%, and 76 confirmed malicious payloads ([Snyk](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub)).

### Unit 42 findings (June 2026)

On 23 June 2026, Palo Alto Networks Unit 42 reported five malicious skills that had passed ClawHub's scanning between February and May 2026 ([Unit 42](https://unit42.paloaltonetworks.com/openclaw-ai-supply-chain-risk/)):

- **Two macOS infostealers** with command-and-control connectivity
- **`omnicogg`**, which hid an AMOS dropper in `README.md` and padded the file with 22 MB of junk to get past scanner size limits. Both VirusTotal and ClawScan returned clean.
- **`money-radar`**, a fake financial adviser that injected affiliate links at runtime
- **`letssendit`**, an agentic Solana front-running skill

The publisher accounts were banned and the skills removed. The lesson stands: scanning catches a lot, and attackers design around it.

### What ClawHub checks today

Each release gets a security audit on its skill page, combining ([Security audits](https://docs.openclaw.ai/clawhub/security-audits)):

- **NVIDIA SkillSpector** findings
- **Tencent A.I.G** findings on agent instructions. Because A.I.G cannot inspect Python bytecode, ClawHub rejects skills containing `.pyc`, `.pyo` or `.pyd` files.
- **ClawScan** risk analysis, which asks whether the name, description, declared permissions and actual content line up, using the OWASP Agentic Skills Top 10 as a lens
- **VirusTotal** and static analysis results, shown as detail pages

Signed-in users can report a skill with the **Report skill** button; a skill is hidden automatically after more than three unique reports, pending moderator review.

OpenClaw itself also has a local code-safety scanner (since 2026.2.6), and `openclaw skills install` refuses releases ClawHub has marked malicious or blocked.

### Third-party tools

- [Clawdex by Koi](https://clawhub.ai/wearekoi/skills/clawdex) (`@wearekoi/clawdex`): a skill that checks other skills against Koi's malicious-skills database before you install them. Koi is now part of Palo Alto Networks.
- [Snyk agent-scan](https://github.com/snyk/agent-scan): an open-source security scanner for AI agents, MCP servers and agent skills (formerly `mcp-scan`).

### Red flags

Avoid skills that contain:

- `curl | bash` or `wget | bash`, or a "prerequisites" step that downloads and runs something
- Base64-encoded strings or zero-width Unicode characters
- Very large files with little content (padding to evade scanners)
- Hardcoded URLs to unknown domains
- Reads of `~/.ssh`, `~/.aws`, browser profiles, wallets or other credential paths
- Environment variables that do not fit the skill's purpose
- `chmod 777`, or instructions to edit `SOUL.md` or agent config

### Locking down installs

There is no setting that switches ClawHub off. To control what can be installed, use `security.installPolicy`: a trusted local command that OpenClaw runs before every skill or plugin install or update (ClawHub, skills.sh, git, local, uploads, dependency installers). It answers `allow`, `warn` or `block`, and installs fail closed if it cannot answer.

```json5 title="~/.openclaw/openclaw.json"
{
  security: {
    installPolicy: {
      enabled: true,
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        timeoutMs: 10000,
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

The command reads one JSON request on stdin and writes one decision on stdout:

```js title="/usr/local/bin/openclaw-install-policy"
#!/usr/bin/env node
let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  const req = JSON.parse(input);
  const decision =
    req.targetType === "skill"
      ? { protocolVersion: 1, decision: "block", reason: "skill installs are disabled on this host" }
      : { protocolVersion: 1, decision: "allow" };
  process.stdout.write(JSON.stringify(decision));
});
```

The file must be a regular file owned by a trusted user with restricted permissions. `openclaw doctor --deep` runs a test request against it. See [Operator install policy](https://docs.openclaw.ai/tools/skills-config#operator-install-policy-security-installpolicy) for the full request and response format.

Two more controls:

- `skills.allowBundled: ["github", "weather"]` limits which **bundled** skills are eligible.
- `agents.defaults.skills` and `agents.entries.<id>.skills` limit which skills each agent can see. See [Skill Development](/guides/skill-development#which-agent-sees-which-skill).

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
clawhub uninstall @owner/slug
clawhub list
clawhub pin <slug> [--reason <text>]
clawhub unpin <slug>
clawhub skill publish <dir> [--dry-run] [--version <v>] [--owner <handle>] [--categories <slugs>]
clawhub sync --all [--dry-run] [--bump minor]
clawhub scan download <slug> --version <v>
```

Full reference: [ClawHub CLI](https://docs.openclaw.ai/clawhub/cli) and [`openclaw skills`](https://docs.openclaw.ai/cli/skills).

---

## See Also

- [Skill Development](/guides/skill-development): write your own skills
- [Skill Workshop](/guides/skill-workshop): skills the agent writes for itself
- [Skill Verification](/security/skill-verification): a deeper vetting walkthrough
- [Security hardening](/security/hardening): sandboxing, tool policy, approvals
- [Plugin System](/guides/plugin-system): ClawHub also hosts plugins
