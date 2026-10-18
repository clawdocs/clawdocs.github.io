---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: CI/CD & Testing
description: Test OpenClaw config, skills and plugins in CI with commands that exist — config validate, skills check, agent exec, security audit — plus safe deploy and upgrade steps
keywords: [openclaw, ci cd, testing, github actions, config validate, skills check, agent exec]
---

# CI/CD & Testing

If you keep your OpenClaw config, skills or plugins in git, CI can catch most mistakes before they reach a running Gateway. This page sticks to commands that exist in v2026.10.4. There is no `openclaw skill test`, no skill dry-run mode, and no `openclaw security scan`; the checks below are what you can actually run.

| What to check | Command | Fails on |
|---|---|---|
| Config is valid | `openclaw config validate --json` | `"valid": false` (exit code is 0 either way) |
| Skills load and are eligible | `openclaw skills check --json` | Skills missing from `eligible` |
| Config health | `openclaw doctor --lint --json` | Exit 1 when there are findings |
| Security foot-guns | `openclaw security audit --json` | `summary.critical > 0` |
| A skill is publishable | `clawhub skill publish <dir> --dry-run` | Non-zero exit |
| A plugin builds and loads | `openclaw plugins validate`, `npm pack`, `openclaw plugins install npm-pack:...` | Non-zero exit |
| The agent does the job | `openclaw agent exec --json` | Exit 1 (error) or 2 (timeout) |

Every check here runs without a Gateway. Run them with a throwaway `HOME` and `OPENCLAW_STATE_DIR` so CI never touches real state.

---

## Setting Up the Runner

OpenClaw needs **Node 24.16+ or 26.1+**. Pin the version you deploy:

```yaml
- uses: actions/setup-node@v6
  with:
    node-version: 24
- name: Install OpenClaw
  run: npm i -g openclaw@2026.10.4
```

Point OpenClaw at the config in your repository and at empty state:

```yaml
env:
  OPENCLAW_CONFIG_PATH: ${{ github.workspace }}/config/openclaw.json
  OPENCLAW_STATE_DIR: ${{ runner.temp }}/openclaw-state
```

GitHub Actions sets `CI=true`, and OpenClaw sends no update check or telemetry when `CI` is set ([telemetry](https://docs.openclaw.ai/gateway/telemetry)). On other runners, set `CI=true` yourself or `update.checkOnStart: false` in the CI config.

Keep secrets out of the committed config. Use `${VAR}` substitution or SecretRefs (`{ source: "env", provider: "default", id: "MY_KEY" }`), so the file validates in CI without real keys.

---

## Validating Config

```bash
openclaw config validate --json
```

The command always exits 0. Read the JSON:

```bash
openclaw config validate --json | tee validate.json
jq -e '.valid' validate.json > /dev/null || { jq '.issues' validate.json; exit 1; }
```

The schema is strict, so typos and invented keys (`skills.allow_install`, `plugins.sandbox_level`, a root `webhooks` block) fail here instead of stopping the Gateway at startup. One exception: entries under `mcp.servers` accept unknown keys, so a wrong key such as `allowed_tools` validates but does nothing. See [MCP Servers](/guides/mcp-servers#filtering-tools).

Then lint for health problems:

```bash
openclaw doctor --lint --json --severity-min warning
```

`doctor --lint` is read-only and exits 1 when it reports findings. Some findings (no Gateway token, `gateway.mode` unset) only make sense on the real host. Use `--skip <check-id>` for those, rather than ignoring the exit code.

---

## Checking Skills

There is no skill linter. `openclaw skills check` loads every skill root the config points at and reports which skills are ready, visible or missing requirements. A broken `SKILL.md` (for example, no `description`) is skipped with a log warning, not an error, so CI has to look for it.

Point the agent workspace at your repository's skills in a CI-only config:

```bash
cat > "$RUNNER_TEMP/ci.json5" <<EOF
{ agents: { defaults: { workspace: "$GITHUB_WORKSPACE/workspace" } } }
EOF
export OPENCLAW_CONFIG_PATH="$RUNNER_TEMP/ci.json5"
```

Then fail the job if any skill folder is not eligible:

```bash title="scripts/check-skills.sh"
#!/usr/bin/env bash
set -euo pipefail
openclaw skills check --json > skills-check.json 2> skills-check.log
fail=0
for dir in workspace/skills/*/; do
  name=$(basename "$dir")
  if ! jq -e --arg n "$name" '.eligible | index($n) != null' skills-check.json > /dev/null; then
    echo "::error file=${dir}SKILL.md::skill '$name' is not eligible"
    fail=1
  fi
done
if grep -q "Skipping invalid skill" skills-check.log; then
  grep "Skipping invalid skill" skills-check.log
  fail=1
fi
exit $fail
```

This assumes each folder name matches its `name`, which is the convention. Eligibility depends on the runner: a skill gated on `requires.bins: ["docker"]` or `os: ["darwin"]` is not eligible on a stock Ubuntu runner. Install the binaries in CI, or skip those skills deliberately.

`openclaw skills info <name> --json` shows one skill's source, requirements and visibility.

### Publishing skills from CI {#publishing-skills-from-ci}

ClawHub ships a reusable workflow that runs `clawhub skill publish` for every changed skill folder. Dry-run on pull requests, publish on demand:

```yaml title=".github/workflows/skill-publish.yml"
name: Skill Publish
on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

`root` defaults to `skills/`; pass `skill_path` for a single skill and `owner` to publish under an organization. Create the token locally with `clawhub login` and `clawhub token`. Locally, the same check is `clawhub skill publish ./skills/my-skill --dry-run`. See [ClawHub CLI](https://docs.openclaw.ai/clawhub/cli).

---

## Testing Plugins

```bash
npm ci
npm run build
openclaw plugins validate --root .
npm pack --pack-destination "$RUNNER_TEMP"
openclaw plugins install "npm-pack:$RUNNER_TEMP/myorg-openclaw-my-plugin-1.0.0.tgz" --force
openclaw plugins inspect my-plugin --runtime --json
```

Installing the packed tarball catches runtime dependencies left in `devDependencies` and entries that point at `.ts` source. Before publishing, `clawhub package validate .` runs ClawHub's Plugin Inspector offline, and `clawhub package publish . --family code-plugin --dry-run` previews the release. See [Plugin System](/guides/plugin-system#building-a-plugin).

## Testing MCP Servers

```bash
openclaw mcp doctor --json
openclaw mcp doctor my-tools --probe --json
```

`doctor` without `--probe` is static and safe in CI. `--probe` starts or connects to the server, so the runner needs the server's binaries and credentials.

---

## Smoke-Testing the Agent

`openclaw agent exec` runs one agent turn with no Gateway and a temporary state directory, then cleans up. It exits 0 on success, 1 on any error, 2 on timeout, and `--json` prints a stable result envelope.

```bash
openclaw agent exec \
  --isolated --auth-env-only \
  --model anthropic/claude-haiku-5-5 \
  --cwd "$GITHUB_WORKSPACE/fixtures/sample-repo" \
  --timeout 300 --json \
  --message-file tests/summarize-repo.md > result.json
jq -e '.ok and (.final | test("commit"; "i"))' result.json
```

- `--isolated` ignores any ambient config; `--config <path>` pins a specific one instead. Both make the run reproducible.
- `--auth-env-only` uses only provider keys in the environment (for example `ANTHROPIC_API_KEY` from a CI secret).
- The model's answer varies between runs. Assert on structure or a few key facts, not exact text.

:::danger A smoke test is a real agent turn
`agent exec` defaults to **no sandbox and full exec permissions**, with file tools limited to `--cwd`. The agent can run any shell command on the runner. Point `--cwd` at a disposable fixture, never at a checkout with secrets, and never run it on untrusted pull request content. If you test against your own config, give it `agents.defaults.sandbox.mode: "all"` and a restrictive tool policy. See [Security hardening](/security/hardening).
:::

---

## Security Checks

```bash
openclaw security audit --json > audit.json
jq -e '.summary.critical == 0' audit.json > /dev/null || { jq '.findings[] | select(.severity == "critical")' audit.json; exit 1; }
```

`openclaw security audit` checks config and local state; `--deep` also probes a live Gateway, which you only have on the deploy host. Suppress accepted findings in config with `security.audit.suppressions` (each with a `checkId` and `reason`) rather than in the pipeline.

For ClawHub skills you depend on, verify the exact release:

```bash
openclaw skills verify @owner/slug --version 1.2.3
```

It exits non-zero when ClawHub marks the release as failed. Third-party scanners such as [Snyk agent-scan](https://github.com/snyk/agent-scan) can scan skills and MCP config too.

---

## A Complete Workflow

```yaml title=".github/workflows/openclaw.yml"
name: OpenClaw checks
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      OPENCLAW_STATE_DIR: ${{ runner.temp }}/openclaw-state
      OPENCLAW_CONFIG_PATH: ${{ github.workspace }}/config/openclaw.json
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npm i -g openclaw@2026.10.4

      - name: Validate config
        run: |
          openclaw config validate --json | tee validate.json
          jq -e '.valid' validate.json > /dev/null

      - name: Security audit
        run: |
          openclaw security audit --json > audit.json
          jq -e '.summary.critical == 0' audit.json > /dev/null

      - name: Check skills
        run: |
          cat > "$RUNNER_TEMP/ci.json5" <<EOF
          { agents: { defaults: { workspace: "$GITHUB_WORKSPACE/workspace" } } }
          EOF
          OPENCLAW_CONFIG_PATH="$RUNNER_TEMP/ci.json5" bash scripts/check-skills.sh
```

This workflow needs no secrets and runs no model, so it is safe on pull requests from forks. Keep model-backed smoke tests in a separate job that only runs on `push` to your own branches, with the provider key as a secret.

### Example: the clawdocs snippet gate

This site tests its own copy-paste snippets the same way. [`scripts/check-snippets.mjs`](https://github.com/clawdocs/clawdocs.github.io/blob/gh-pages/scripts/check-snippets.mjs) installs the pinned OpenClaw from `scripts/openclaw-version.txt`, then for every page:

- writes each `openclaw.json` block to a temporary directory and runs `openclaw config validate --json`
- resolves each `openclaw …` command path and flag against `--help`
- checks every `npx`, `npm i`, `uvx`, `plugins install` and `skills install` target against an allowlist of verified publishers

Every OpenClaw process gets a temporary `HOME`, `OPENCLAW_STATE_DIR` and `OPENCLAW_CONFIG_PATH`; only `--help`, `--version`, `config schema` and `config validate` run, and no Gateway starts. The pattern works for any repository that documents or templates OpenClaw config.

---

## Deploying

### Ship files to the right places

Config lives in `~/.openclaw/openclaw.json`. Workspace files (`SOUL.md`, `AGENTS.md`, `skills/`) live in the agent workspace, `~/.openclaw/workspace/` by default. Shared skills go in `~/.openclaw/skills/`.

```bash
rsync -av --delete skills/ deploy@agent-host:~/.openclaw/workspace/skills/
rsync -av SOUL.md AGENTS.md deploy@agent-host:~/.openclaw/workspace/
```

Mind the trailing slashes: `skills/` copies the folder's contents. Do not rsync a whole directory into `~/.openclaw/`, which can overwrite `openclaw.json`, credentials and state. Validate config on the host before swapping it in.

For SSH from CI, pin the host key (store the output of `ssh-keyscan agent-host` as a secret and write it to `~/.ssh/known_hosts`). Never use `StrictHostKeyChecking=no`.

The skills watcher picks up skill changes on the next agent turn; config changes that need it trigger a reload, or run `openclaw gateway restart`.

### Upgrade procedure

```bash
openclaw backup create --verify --output ~/Backups
openclaw update --dry-run
openclaw update --yes
openclaw doctor --fix
openclaw config validate
openclaw channels status --probe
```

`openclaw update` rehearses the update, restarts the Gateway, and rolls back if the post-update doctor fails. Run `openclaw doctor --fix` after every upgrade: releases retire config keys and Doctor migrates them. To roll back by hand, restore the backup and install the previous version with `openclaw update --tag <version>`.

### Docker

Use the official image `ghcr.io/openclaw/openclaw` (or `openclaw/openclaw`) with a pinned version tag, and mount state at `/home/node/.openclaw`; the image runs as `node`, not root.

```yaml title="docker-compose.yml"
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:2026.10.4
    restart: unless-stopped
    volumes:
      - openclaw-state:/home/node/.openclaw
    ports:
      - "127.0.0.1:18789:18789"
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://127.0.0.1:18789/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
volumes:
  openclaw-state:
```

The image already has a `HEALTHCHECK` on `/healthz` (liveness). Use `/startupz` for orchestrator startup probes and `/readyz` for channel-aware readiness. Bind the port to localhost and reach it over a tunnel or Tailscale. See [Docker](https://docs.openclaw.ai/install/docker) and [Deployment Options](/guides/deployment-options).

---

## Triggering the Agent From CI

To have a pipeline wake an agent (for example, "summarize this failed build"), enable Gateway HTTP hooks with a dedicated token:

```json5 title="~/.openclaw/openclaw.json"
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    path: "/hooks",
    allowedAgentIds: ["main"],
    allowRequestSessionKey: false,
  },
}
```

```bash
curl -fsS https://agent.example.com/hooks/agent \
  -H "Authorization: Bearer $OPENCLAW_HOOKS_TOKEN" \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: build-$GITHUB_RUN_ID" \
  --data '{"message":"Build failed on main. Summarize the log at the attached URL.","agentId":"main","deliver":true}'
```

An HTTP 200 means the run was admitted, not that it finished. Expose the Gateway only over HTTPS or a private network, never as plain HTTP on the internet. Treat the message as untrusted input to the agent. See [Inbound webhooks](https://docs.openclaw.ai/automation/cron-jobs/webhooks) and [API & Webhooks](/guides/api-webhooks).

For scheduled checks on the agent host itself, use an [Automation](/guides/automation) job, for example `openclaw cron add "0 2 * * *" "Run the nightly health checklist" --name nightly-check`.

---

## Checklist

### In CI

- [ ] OpenClaw version pinned; Node 24.16+ on the runner
- [ ] `config validate --json` checked for `"valid": true`
- [ ] `doctor --lint` and `security audit` clean, with explicit skips and suppressions
- [ ] Every skill folder eligible in `skills check`
- [ ] Plugins installed from their packed tarball and inspected
- [ ] Model-backed smoke tests only on trusted branches, on a disposable fixture
- [ ] `permissions: contents: read` unless a job needs more

### Before every deploy

- [ ] `openclaw backup create --verify`
- [ ] Release notes read; `openclaw update --dry-run`
- [ ] `openclaw doctor --fix` and `openclaw config validate` after the update
- [ ] `openclaw channels status --probe` shows channels back

---

## See Also

- [Skill Development](/guides/skill-development): writing and testing skills
- [Plugin System](/guides/plugin-system): building and testing plugins
- [Lobster Workflows](/guides/lobster-workflows): deterministic multi-step pipelines ([openclaw/lobster](https://github.com/openclaw/lobster))
- [Monitoring](/guides/monitoring): watching a running Gateway
- [Security hardening](/security/hardening)
- Upstream: [`openclaw agent exec`](https://docs.openclaw.ai/cli/agent), [`openclaw config`](https://docs.openclaw.ai/cli/config), [`openclaw security`](https://docs.openclaw.ai/cli/security)
