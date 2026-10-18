---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Skill Verification
description: How to review OpenClaw skills before installing them — ClawHub audit results, openclaw skills verify, reading the source, red flags, install policy, and what to do after a bad install
keywords: [openclaw, openclaw skill security, clawhub security, malicious skills, skill scanning, supply chain attack, skill verification]
---

# Skill Verification

Skills are instructions, and often scripts, that your agent follows with its own tools. Upstream's guidance is to treat third-party skills as **untrusted code** and read them before enabling them ([skills: security](https://docs.openclaw.ai/tools/skills)). The commands below were checked against OpenClaw v2026.10.4 on 2026-10-18.

Why it matters: in February 2026, researchers found **341 malicious skills** on ClawHub, **283 skills leaking credentials**, and security flaws in **36%** of the skills sampled (details on [Known Vulnerabilities](/security/known-vulnerabilities#malicious-clawhub-skills-february-2026)). Snyk called this "the first documented supply-chain attack specifically targeting AI agent skills."

:::danger Supply chain risk
Snyk's ToxicSkills study found that **91% of malicious skills** combined prompt injection with traditional malware. A skill doesn't need to contain malicious code. It can simply tell the agent to do something harmful.
:::

---

## The Threat Landscape

### What was found on ClawHub (February 2026)

| Study | Skills analysed | Malicious / flawed | Key finding |
|-------|----------------|-------------------|-------------|
| **Koi Security** | 2,857 | 341 malicious (12%) | ClawHavoc campaign: 335 skills distributing AMOS malware |
| **Snyk ToxicSkills** | 3,984 | 1,467 flawed (36%), 534 critical (13.4%), 76 confirmed malicious | Hybrid prompt-injection and malware attacks |
| **Snyk credential leaks** | 3,984 | 283 leaking credentials (7.1%) | Popular skills push API keys through the model context |
| **Bitdefender** | not stated | ~900 malicious (~20%, Bitdefender's estimate) | Highest published estimate |
| **Cisco AI Defense** | The top-ranked skill | 9 vulnerabilities (2 critical) | Data exfiltration and prompt injection without user awareness |

These are third-party figures from early 2026. ClawHub's scanning and moderation have changed since then (see [ClawHub scanning](#virustotal-integration-v202626)).

### How malicious skills work

**Traditional malware (ClawHavoc):**
1. The skill has a "Prerequisites" section.
2. It tells the user to download a password-protected ZIP or run an obfuscated shell script.
3. The download is **Atomic Stealer (AMOS)**, a macOS infostealer that targets Keychain passwords, browser credentials and crypto wallets.
4. The skill itself may work, which provides cover.

**Prompt injection (91% of malicious skills in Snyk's sample):**
1. The skill's instructions contain hidden directives for the model.
2. The model is told to exfiltrate data, create backdoors, or edit `SOUL.md`.
3. No malware is needed; the agent's own tools do the work.

**Credential leaks (283 skills):**
1. Working skills tell the agent to pass API keys through the model context.
2. The keys end up in transcripts, logs and generated files.

---

## Pre-Installation Checklist

### 1. Check ClawHub's audit result

Every ClawHub release carries an audit status and risk level, shown on its page before you install ([ClawHub security audits](https://github.com/openclaw/clawhub/blob/main/docs/security-audits.md)):

| Status | Meaning |
|---|---|
| `Pass` | No visible issue above low risk |
| `Review` | Read the findings before installing; may still be legitimate |
| `Warn` | A high-impact concern or warning signal |
| `Malicious` | Do not install |
| `Pending` | Scans have not finished |
| `Error` | The audit could not complete |

From the CLI, fetch the same trust envelope (`clawhub.skill.verify.v1`) ([`openclaw skills`](https://docs.openclaw.ai/cli/skills)):

```bash
openclaw skills verify @owner/<slug>                     # JSON envelope
openclaw skills verify @owner/<slug> --card              # readable Skill Card
openclaw skills verify @owner/<slug> --version <version>
```

`verify` exits non-zero when ClawHub marks verification as failed. When ClawHub has kept them, the JSON includes the full SkillSpector and AIG scanner reports under `security.scannerReports`. Use owner-qualified refs (`@owner/<slug>`) to avoid picking up a lookalike publisher.

A pass is a signal, not a guarantee. A pending or stale scan can still allow installation with a warning, so installation is not proof that every scan completed ([why OpenClaw](https://docs.openclaw.ai/start/why-openclaw)).

### 2. Check Against Koi Security's Database

[Clawdex](https://koisecurity.com/clawdex) is Koi Security's own lookup of skills against its malicious-skills database. Check the skill there by name. OpenClaw has no built-in Clawdex integration.

### 3. Review the source

Read `SKILL.md` and every script before installing. With the standalone ClawHub CLI you can inspect a release without installing it ([ClawHub CLI](https://github.com/openclaw/clawhub/blob/main/docs/cli.md)):

```bash
npm i -g clawhub
clawhub inspect @owner/<slug> --versions
clawhub inspect @owner/<slug> --files
clawhub inspect @owner/<slug> --file SKILL.md
```

For a Git-hosted skill, clone it, read it, then install from the reviewed directory:

```bash
openclaw skills install ./reviewed-skill --as reviewed-skill
```

Red flags:

| Red flag | Example | Risk |
|----------|---------|------|
| "Prerequisites" with downloads | "Download this ZIP first", "run this script" | AMOS-style malware delivery |
| `curl ... \| bash` anywhere in instructions or scripts | Fetching and running unknown code | Malware installation |
| Password-protected archives | ZIPs that need a password to open | Evades scanners |
| Obfuscated content | Base64 blobs, packed scripts, zero-width characters | Hidden behaviour |
| Hardcoded external URLs | `https://random-domain.xyz/collect` | Data exfiltration |
| Credential paths | `~/.ssh`, `~/.aws`, `~/.openclaw/credentials` | Credential theft |
| Instructions aimed at the model | "Ignore previous instructions", "update your SOUL.md" | Agent hijacking, persistence |
| Asking you to paste API keys into chat | "Send me your OpenAI key to configure" | Keys land in transcripts |
| More tools than the task needs | A formatter that needs shell and browser | Over-privileged |

### 4. Check the author

On the skill's ClawHub page, look at the owner, source repository, version history, changelog, downloads and stars. Publishing requires a GitHub account at least **14 days** old as of 2026-10-18 ([ClawHub security and moderation spec](https://github.com/openclaw/clawhub/blob/main/specs/security-moderation.md)). At the time of ClawHavoc the requirement was one week, so an established account is a weak signal at best.

### 5. Check community signal

- New skills with few installs and no history deserve extra scrutiny.
- Search the skill name in the OpenClaw Discord and GitHub issues.
- **Reports do not hide a skill automatically.** As of 2026-10-18, ClawHub's spec says reports "never change skill visibility or installability automatically"; moderators review them. Older guides that mention auto-hiding after 3 or 4 reports are out of date.

---

## Safe Installation Practices

```bash
# Install an exact, reviewed version into one agent's workspace
openclaw skills install @owner/<slug> --version <version> --agent <id>

# Confirm what the agent can actually see
openclaw skills check --agent <id>
openclaw skills info <name>
```

- **Pin the version you reviewed** with `--version`. `openclaw skills update --all` replaces skills with newer releases, which you have not reviewed. With the standalone CLI, `clawhub pin <skill>` freezes an installed skill.
- **Don't use `--force-install`.** It installs a pending GitHub-backed skill **before** ClawHub's scan completes.
- **Know what isn't scanned.** `skills-sh:`, `git:` and local directory installs are marked **Not scanned by ClawHub**, and that trust state is kept through updates.
- **Install per agent, not globally**, until you trust a skill. `--global` installs into `~/.openclaw/skills`, which every local agent can see.
- **Skills can't be sandboxed individually.** There is no `--sandbox` or `--no-shell` install flag. Sandboxing applies per agent or session (`agents.defaults.sandbox`, `agents.entries.<id>.sandbox`). Skill secrets in `skills.entries.*.env` and `apiKey` are injected into the **host** process, not the sandbox.
- **Path containment.** Skill roots must resolve inside their configured directory unless `skills.load.allowSymlinkTargets` trusts a target ([skills: security](https://docs.openclaw.ai/tools/skills)).
- **Metadata moved.** ClawHub tracking now lives in `.clawhub/`. The pre-July-2026 `.clawdhub/` directory is no longer read; rename it before updating or verifying older installs.

### Principle of least privilege

OpenClaw has no per-skill permission grants. A skill can use whatever tools its agent has, so give risky skills their own agent:

| Skill type | Agent configuration |
|-----------|----------------------|
| Information lookup | `tools.profile: "messaging"`, deny `group:runtime` and `group:fs` |
| Code formatting | Sandbox with `workspaceAccess: "rw"`, no network (`docker.network: "none"` is the default) |
| Deployment automation | Exec with `tools.exec.mode: "ask"` or an allowlist; scoped deploy credentials |
| Browser tasks | Strict `browser.ssrfPolicy`, no exec |

For example:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    entries: {
      research: {
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          profile: "messaging",
          deny: ["group:runtime", "group:fs"],
          exec: { mode: "deny" },
        },
      },
    },
  },
}
```

See [tool and agent permissions](https://docs.openclaw.ai/gateway/security/tool-permissions) and [Security Hardening: sandboxing](/security/hardening#sandboxing).

---

## Automated Scanning

### Built-in code safety scanner

OpenClaw has a skill and plugin code safety scanner, added in v2026.2.6 (`CHANGELOG/2026.2.6.md` upstream). There is no `openclaw security scan` command. The scanner runs on installed skills as part of the deep audit and reports `skills.code_safety.*` findings ([audit checks](https://docs.openclaw.ai/gateway/security/audit-checks)):

```bash
openclaw security audit --deep
openclaw security audit --deep --json | jq '.findings[] | select(.checkId | startswith("skills."))'
```

### ClawHub scanning {#virustotal-integration-v202626}

Since 2026-10-13, every new skill version and package release on ClawHub is stored as **pending** and becomes installable only after the TruffleHog and ClawScan pre-publication checks pass on that exact artifact. A malicious verdict blocks the release; a scanner failure or timeout leaves it unpublished. Before that change, a deployment flag decided whether checks ran before or after a release went public ([clawhub PR #3947](https://github.com/openclaw/clawhub/pull/3947)). Releases are also rescanned later. Sources include VirusTotal, ClawScan and static analysis, plus SkillSpector and AIG reports where retained ([`openclaw skills`](https://docs.openclaw.ai/cli/skills), [ClawHub CLI: scan](https://github.com/openclaw/clawhub/blob/main/docs/cli.md)). Upstream's threat model notes that VirusTotal and LLM-based review depend on ClawHub's operator-side configuration being enabled ([THREAT-MODEL-ATLAS](https://docs.openclaw.ai/security/THREAT-MODEL-ATLAS)). At install time, OpenClaw refuses community releases that ClawHub marks malicious or blocked.

### Third-party scanning tools

Not reviewed by clawdocs. Vet them like any other code you run.

| Tool | What it does |
|------|-------------|
| [**Clawdex**](https://koisecurity.com/clawdex) | Lookup against Koi Security's malicious-skills database |
| [**Cisco Skill Scanner**](https://github.com/cisco-ai-defense/skill-scanner) | Static, dataflow, LLM and VirusTotal-based skill scanning |
| [**Snyk agent-scan**](https://github.com/snyk/agent-scan) | Scans MCP servers and agent skills (formerly `mcp-scan`) |
| [**SafeClaw Scanner**](https://safeclaw.io/secure-openclaw-setup) | Looks for prompt injection, backdoor commands and obfuscation |

### Restrict or block installs

There are no `skills.allow_install` or `allow_clawhub` keys. Two real controls exist ([skills config](https://docs.openclaw.ai/tools/skills-config)):

- `security.installPolicy` runs a trusted local command before **every** skill and plugin install or update: ClawHub, Git, local, uploaded and dependency installers. It can return allow, warn or block. With `enabled: true` and no working command, installs are blocked, so a command that always blocks disables installs entirely.
- `skills.allowBundled` limits which **bundled** skills are eligible. It doesn't affect workspace or managed skills.

```json5 title="~/.openclaw/openclaw.json"
{
  security: {
    installPolicy: {
      enabled: true,
      targets: ["skill"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
  skills: {
    allowBundled: ["gemini", "peekaboo"],
  },
}
```

`--force` does not override a `block`. Neither does `--acknowledge-install-policy-warning`, which only accepts `warn` results after review.

---

## Post-Incident: If You Installed a Malicious Skill

1. **Remove the skill.** For ClawHub installs, use the standalone CLI ([remove a ClawHub skill](https://docs.openclaw.ai/cli/skills)):

   ```bash
   clawhub --workdir /path/to/agent-workspace uninstall @owner/<slug>
   clawhub --workdir ~/.openclaw uninstall @owner/<slug>    # if installed with --global
   ```

   For Git or local installs, delete the skill directory from the workspace `skills/` folder.
2. **Rotate the Gateway token properly**, then every API key and channel token the agent could reach. See [incident response](/security/hardening#incident-response).
3. **Check for plaintext secrets**: `openclaw secrets audit --check`.
4. **Check workspace files** (`~/.openclaw/workspace/SOUL.md`, `AGENTS.md`, `MEMORY.md`) for changes, and `openclaw cron list` for scheduled persistence.
5. **Review activity**: `openclaw audit --kind tool_action`, `openclaw logs`, and the affected transcripts (`openclaw transcripts list`).
6. **Scan the host** with your OS malware scanner, and check browser profiles for stolen sessions.
7. **Run `openclaw security audit --deep`** until no critical findings remain.

---

## Reporting Malicious Skills

- **On ClawHub:** sign in and use **Report skill** on the skill's page ([ClawHub moderation](https://github.com/openclaw/clawhub/blob/main/docs/moderation.md)). Moderators review reports.
- **A vulnerability in ClawHub itself** (scanning, moderation, downloads, auth): a GitHub Security Advisory on [openclaw/clawhub](https://github.com/openclaw/clawhub).
- **A vulnerability in OpenClaw** that a skill exploits (an auth, policy or sandbox bypass): a private advisory on [openclaw/openclaw](https://github.com/openclaw/openclaw/security/advisories/new). A skill that is merely malicious is a ClawHub moderation matter, not an OpenClaw advisory ([SECURITY.md](https://github.com/openclaw/openclaw/blob/main/SECURITY.md)).

---

## See Also

- [Known Vulnerabilities](/security/known-vulnerabilities): incident history including ClawHavoc
- [Security Hardening](/security/hardening): supply-chain, sandbox and incident-response sections
- [ClawHub Guide](/guides/clawhub): using the marketplace
- [Ecosystem](/reference/ecosystem#security-tools): security tools
