---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Lobster Workflows
description: Build typed, resumable workflow pipelines with approval gates using Lobster, OpenClaw's official workflow shell
keywords: [openclaw, lobster, workflow engine, automation pipeline, yaml workflow, typed pipeline, approval gate]
---

# Lobster Workflows

**Lobster** is OpenClaw's official workflow shell: a small, typed (JSON-first) pipeline runtime with approval and input gates that can pause and resume. Instead of letting the agent work out a multi-step process every time, you write the sequence once in a workflow file and Lobster runs it the same way each time. The model is only called where a step explicitly asks for it.

- **Repository**: [openclaw/lobster](https://github.com/openclaw/lobster), MIT, about 1,275 stars as of 2026-10-18
- **Runtime / CLI**: npm `@clawdbot/lobster` (latest release v2026.9.16, 2026-10-01)
- **Gateway plugin**: npm `@openclaw/lobster` (ships with each OpenClaw release, 2026.10.4 at the time of writing)
- **Official docs**: [docs.openclaw.ai/tools/lobster](https://docs.openclaw.ai/tools/lobster)

This page tracks Lobster at commit `8ecbfe1` (2026-10-15). The syntax below comes from the Lobster source (`src/workflows/types.ts`, `load.ts`) and README. Lobster rejects unknown shapes at load time, so a workflow that loads is a good first test.

---

## Why Lobster?

| Without Lobster | With Lobster |
|----------------|-------------|
| The agent decides the steps each time | Steps are fixed in a file |
| One model round trip per step | One tool call for the whole pipeline |
| Side effects happen when the model decides | Side effects wait behind an explicit `approval:` step |
| A paused job has to be re-run from the start | A paused job returns a resume token and continues from the gate |
| Hard to review | The file is data: easy to diff, review and graph (`lobster graph`) |

Lobster is deliberately a small DSL, not a general scripting language. Each step can still call any CLI or script.

---

## Installation

Lobster runs in two modes.

### Standalone CLI

For development, cron-style command jobs and external pipelines:

```bash
npm install -g @clawdbot/lobster
lobster doctor
lobster run path/to/workflow.lobster
```

The package installs three executables: `lobster`, `openclaw.invoke` and its alias `clawd.invoke`.

### Embedded Gateway plugin

The `@openclaw/lobster` plugin runs workflows **in-process** inside the Gateway, using the same runtime. It is not installed or enabled by default.

```bash
openclaw plugins install @openclaw/lobster
```

Then allow the tool, either globally:

```json5 title="~/.openclaw/openclaw.json"
{
  tools: {
    alsoAllow: ["lobster"],
  },
}
```

or for one agent:

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    entries: {
      main: {
        tools: { alsoAllow: ["lobster"] },
      },
    },
  },
}
```

`alsoAllow` adds `lobster` on top of the active tool profile without restricting other tools. The tool is **disabled entirely in sandboxed tool contexts**. See [Lobster plugin reference](https://docs.openclaw.ai/plugins/reference/lobster).

:::caution Embedded mode and `openclaw.invoke`
In embedded mode, `openclaw.invoke` does **not** inherit the Gateway URL or auth for nested tool calls, so steps that call back into the Gateway with it are not reliable there (upstream [openclaw#78736](https://github.com/openclaw/openclaw/pull/78736)). Use `openclaw.invoke` from the standalone CLI with `OPENCLAW_URL` set, or call the tool directly outside Lobster.
:::

---

## Workflow syntax

Workflow files are YAML or JSON (`.lobster`, `.yaml`, `.yml`, `.json`).

### Basic structure

```yaml title="workflows/hello.lobster"
name: hello
description: Greets someone
args:
  greeting:
    default: Hello
    description: Word to greet with
env:
  MY_VAR: some-value
steps:
  - id: say-hello
    run: echo "$LOBSTER_ARG_GREETING, World!"
  - id: show-date
    run: date "+%Y-%m-%d"
```

Run it with an argument override:

```bash
lobster run --file workflows/hello.lobster --args-json '{"greeting":"Hi"}'
```

### Top-level fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Workflow name |
| `description` | string | Optional description |
| `args` | object | `{ <name>: { default, description } }` |
| `env` | object | Environment variables for every step |
| `cwd` | string | Working directory for every step |
| `steps` | array | Non-empty, ordered list of steps |
| `cost_limit` | object | `{ max_usd, action: warn \| stop }` (see [Cost tracking](#cost-tracking)) |

### Arguments and step references

| Syntax | Where | Resolves to |
|--------|-------|-------------|
| `${name}` | command text, `env:` values, `cwd`, `workflow_args` | The arg value, by raw string replacement |
| `$LOBSTER_ARG_<NAME>` | inside the shell | The arg value as an env var (name uppercased, other characters become `_`) |
| `$LOBSTER_ARGS_JSON` | inside the shell | All resolved args as one JSON string |
| `$step.stdout` | `stdin:`, `env:`, `when:`, command text | The step's standard output |
| `$step.json` / `$step.json.field` | same | The parsed JSON output, or one field of it |
| `$step.approved`, `$step.skipped`, `$step.error`, `$step.errorMessage` | same | Approval and error state |

There is no `{{ … }}` template engine and there are no filters. Text in double braces is passed through literally.

:::danger Shell safety
`${name}` is a raw string replace into the shell command. An arg containing quotes, `$`, backticks or newlines can change the command. For anything that might come from a user or another system, read the value from the environment instead:

```yaml
args:
  text:
    default: ""
steps:
  - id: safe
    run: jq -n --arg text "$LOBSTER_ARG_TEXT" '{"result": $text}'
```

The same applies to step output: `run: echo "$prev.stdout"` pastes the output into the command. Pass data with `stdin:`, or map it into a variable with `env:` (env values are not shell-expanded), and quote the variable.
:::

---

## Step types

Each step has an `id` and exactly one of `run`/`command`, `pipeline`, `workflow`, `parallel` or `for_each`, or is an `approval` or `input` gate.

### Shell commands (`run:` / `command:`)

`run:` and `command:` are equivalent; `run:` is the preferred spelling.

```yaml
steps:
  - id: list-files
    run: ls -la
    cwd: /path/to/dir

  - id: run-tests
    run: npm test
    timeout_ms: 60000
```

### Native pipeline stages (`pipeline:`)

Use `pipeline:` for Lobster commands that are not shell executables, such as `llm.invoke` and `openclaw.agent`. The prompt goes in `--prompt`; `stdin:` passes earlier output as artifacts.

```yaml
steps:
  - id: diff
    run: git diff --stat HEAD~1

  - id: summarize
    pipeline: llm.invoke --prompt "Summarize this change in three bullets."
    stdin: $diff.stdout
```

### Approval gates (`approval:`)

An approval step halts the workflow. In an interactive terminal Lobster asks on the TTY. Otherwise (tool mode, the embedded plugin, a scheduled job) it returns `needs_approval` with a resume token and the run ends at the gate.

The short forms are `approval: required` or `approval: "Prompt text"`. Identity checks must be **nested inside** the `approval` object:

```yaml
steps:
  - id: review-deploy
    approval:
      prompt: Deploy to production?
      required_approver: ops-lead
      require_different_approver: true
    stdin: $build.json
```

| Field (under `approval:`) | Description |
|-------|-------------|
| `prompt` | Text shown with the request |
| `preview`, `items` | Optional material for the approver |
| `initiated_by` | Initiator id; defaults to `LOBSTER_APPROVAL_INITIATED_BY` |
| `required_approver` | The approver id must match exactly |
| `require_different_approver` | The approver id must differ from the initiator |

The approver id is read from `LOBSTER_APPROVAL_APPROVED_BY` at resume time. Lobster compares ids; it does not authenticate them, so treat this as a separation-of-duties check and keep the resume token private. If you put these fields beside `approval:` instead of under it, they are ignored and the check does not happen.

### Input gates (`input:`)

An `input` step asks a structured question and resumes with an answer that must match a JSON Schema:

```yaml
steps:
  - id: feedback
    input:
      prompt: What feedback should be included?
      responseSchema:
        type: string
```

The run returns `needs_input`; resume it with `lobster resume --token <token> --response-json '"Shorten the intro."'`. Read the answer later as `$feedback.response`.

---

## Control flow

### Conditions

`when:` (or `condition:`) gates a step on earlier results:

```yaml
steps:
  - id: branch
    run: git branch --show-current | tr -d '\n'

  - id: deploy-staging
    run: ./deploy.sh staging
    when: $branch.stdout == 'main'

  - id: not-main
    run: echo "Not on main, skipping deploy"
    when: $branch.stdout != 'main'
```

Operators: `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`, and parentheses. Conditions can reference steps but not `${args}`. To branch on an arg, add a step that prints it (`printf '%s' "$LOBSTER_ARG_TARGET"`) and compare that step's stdout. Strip trailing newlines from command output before comparing, as above.

### Parallel steps

`parallel` is an object with a `branches` list. Each branch has an `id` and one of `run`, `command` or `pipeline`:

```yaml
steps:
  - id: checks
    parallel:
      wait: all          # or "any": keep the first branch to finish, cancel the rest
      timeout_ms: 600000
      branches:
        - id: lint
          run: npm run lint
        - id: typecheck
          run: npm run typecheck
        - id: test
          run: npm test

  - id: report
    run: echo "all checks passed"
```

With `wait: all`, one failing branch fails the step. Branch results are available as `$lint.stdout` and so on, and `$checks.json` holds an object keyed by branch id.

### For-each loops

`for_each` takes a step reference that resolves to an array and runs its nested `steps` once per item, **in order** (not concurrently). The current item is `$item` (rename with `item_var`) and its position is `$index` (`index_var`):

```yaml
args:
  org:
    default: my-org
steps:
  - id: repos
    run: gh repo list "$LOBSTER_ARG_ORG" --json name --limit 20

  - id: audit-each
    for_each: $repos.json
    item_var: repo
    batch_size: 5
    pause_ms: 2000
    steps:
      - id: alerts
        env:
          REPO_NAME: $repo.json.name
        run: gh api "repos/$LOBSTER_ARG_ORG/$REPO_NAME/dependabot/alerts" --jq length
```

| Field | Description |
|-------|-------------|
| `for_each` | Step reference to an array |
| `item_var` / `index_var` | Names for the item and index (default `item`, `index`) |
| `batch_size` | Group size for pauses: after every `batch_size` items, wait `pause_ms` |
| `pause_ms` | Pause between batches (useful for rate limits) |

Loop sub-steps cannot be approvals, inputs, workflows, parallel steps or nested loops; put a gate after the loop. The loop's `$audit-each.json` is an array with one object per item.

### Sub-workflows

A `workflow:` step runs another workflow file (relative paths resolve from the calling file). Pass args with `workflow_args`:

```yaml
steps:
  - id: lint-and-test
    workflow: ci.lobster
    workflow_args:
      target: src/
    on_error: continue

  - id: deploy
    workflow: deploy.lobster
    when: "!$lint-and-test.error"
```

A workflow that would call itself, directly or through another file, fails with a cycle error. Step results have no `exitCode`; use `.error`, `.errorMessage` and `.skipped`.

:::info
Loop semantics such as `maxIterations` or shell-condition loops were proposed in [lobster#20](https://github.com/openclaw/lobster/pull/20), which was closed without merging. Use `for_each`.
:::

---

## Error handling

### Retry

```yaml
steps:
  - id: flaky-api
    run: curl -fsS https://api.example.com/data
    retry:
      max: 3
      delay_ms: 1000
      max_delay_ms: 10000
      backoff: exponential
      jitter: true
```

| Field | Description |
|-------|-------------|
| `max` | Maximum attempts (positive integer) |
| `delay_ms` | Base delay between attempts |
| `max_delay_ms` | Cap on the delay |
| `backoff` | `fixed` or `exponential` |
| `jitter` | Add random variation to delays |

Steps that dispatch to OpenClaw (`openclaw.invoke`, `clawd.invoke`, `openclaw.agent`) are **not retried** once dispatch was attempted, because the remote action may already have happened. Check the outcome before re-running by hand. On a `for_each` step, a retry restarts the whole loop, so only enable it for work that is safe to repeat.

### Timeout

```yaml
steps:
  - id: slow-task
    run: ./long-running-script.sh
    timeout_ms: 300000   # 5 minutes
```

### On-error policies

| Policy | Behaviour |
|--------|----------|
| `stop` (default) | Halt the workflow |
| `continue` | Record `$step.error` / `$step.errorMessage` and go on |
| `skip_rest` | Skip the remaining steps |

---

## LLM steps

### `llm.invoke`

```yaml
steps:
  - id: read-code
    run: cat src/auth.ts

  - id: review
    pipeline: >
      llm.invoke --prompt "Review this code for security issues.
      Return JSON with a findings array."
      --output-schema '{"type":"object","properties":{"findings":{"type":"array"}},"required":["findings"]}'
    stdin: $read-code.stdout
```

Provider resolution: `--provider` on the `llm.invoke` line, then `LOBSTER_LLM_PROVIDER`, then auto-detect from the environment.

| Provider | Env vars | Notes |
|----------|----------|-------|
| `openclaw` | `OPENCLAW_URL`, `OPENCLAW_TOKEN` | Calls the Gateway's `llm-task` tool, which must be enabled |
| `pi` | `LOBSTER_PI_LLM_ADAPTER_URL` | Usually supplied by the Pi extension |
| `http` | `LOBSTER_LLM_ADAPTER_URL` | Generic HTTP adapter |

To use the `openclaw` provider, enable `llm-task` as well:

```json5 title="~/.openclaw/openclaw.json"
{
  plugins: {
    entries: {
      "llm-task": { enabled: true },
    },
  },
  tools: {
    alsoAllow: ["lobster", "llm-task"],
  },
}
```

See [LLM Task](https://docs.openclaw.ai/tools/llm-task).

### `openclaw.agent`

To hand work to a configured OpenClaw agent (its model, session and auth) rather than make a bare model call:

```yaml
steps:
  - id: logs
    run: journalctl -u myapp --since "1 hour ago" --no-pager | tail -n 200
  - id: triage
    pipeline: openclaw.agent --agent ops --prompt "Summarize these logs and flag errors."
    stdin: $logs.stdout
```

It delegates to the installed `openclaw agent` CLI and accepts `--agent`, `--session-key`, `--session-id`, `--model`, `--thinking`, `--timeout` and `--local`.

### Cost tracking

```yaml
name: research
cost_limit:
  max_usd: 20
  action: stop      # or "warn"
steps:
  - id: design
    run: cat docs/design.md

  - id: research
    pipeline: llm.invoke --provider http --prompt "Outline the main risks of this design."
    stdin: $design.stdout
```

After a run, `_meta.cost` lists tokens and estimated cost per step. Prices come from a built-in table plus `LOBSTER_LLM_PRICING_JSON` (a JSON string such as `{"my-model":{"input":1.0,"output":2.0}}`, USD per million tokens). Unknown models record tokens at zero cost with a warning.

:::warning
The `openclaw` provider does not return token usage, so `cost_limit` cannot see or stop spend made through it. Set budgets on the OpenClaw side as well (see [Cost Management](/guides/cost-management)).
:::

---

## OpenClaw integration

### Calling OpenClaw tools: `openclaw.invoke`

`openclaw.invoke` calls one Gateway tool over HTTP (`/tools/invoke`). `--tool` and `--action` are required; tool arguments go in `--args-json`. It is a real executable, so use it from `run:` steps.

```yaml
args:
  chat:
    default: "123456789"
steps:
  - id: tests
    run: npm test
    on_error: continue

  - id: alert
    when: $tests.error
    env:
      CHAT: ${chat}
    run: >
      openclaw.invoke --tool message --action send
      --args-json "$(jq -nc --arg t "$CHAT" '{channel:"telegram", target:$t, message:"Build failed"}')"
```

Requirements:

- `OPENCLAW_URL` must be set (for example `http://127.0.0.1:18789`) or pass `--url`. There is no default.
- `OPENCLAW_TOKEN` (or `--token`) when Gateway auth is on. The ambient token is only sent to `localhost`, `127.0.0.1` or `[::1]`; for any other host pass `--token` explicitly.
- The Gateway HTTP tool surface denies some tools by default (`exec`, `cron`, `gateway`, `sessions_spawn` and others). See [Tools invoke API](https://docs.openclaw.ai/gateway/tools-invoke-http-api).

`--each --item-key message` maps each pipeline item into one call, for example `... | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"channel":"telegram","target":"123456789"}'` in an inline pipeline.

### Running workflows from the agent (embedded plugin)

With the plugin installed, the agent calls the `lobster` tool with a pipeline string or a workflow file path:

```json title="lobster tool call"
{
  "action": "run",
  "pipeline": "workflows/deploy.lobster",
  "argsJson": "{\"environment\":\"staging\"}",
  "timeoutMs": 60000
}
```

If the run reaches a gate, the tool returns an envelope and the call ends there:

```json title="lobster tool result"
{
  "ok": true,
  "status": "needs_approval",
  "output": [],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Deploy to production?",
    "items": [],
    "resumeToken": "..."
  }
}
```

The agent shows the prompt in chat, and after your decision it resumes with `{ "action": "resume", "token": "<resumeToken>", "approve": true }` (or `false` to cancel). Earlier steps are not re-run. Defaults: `timeoutMs` 20000, `maxStdoutBytes` 512000. Resume state lives under `~/.lobster/state` (override with `LOBSTER_STATE_DIR`). Anyone allowed to use the tool who holds a token can resume it.

### Scheduled runs (Automations)

`HEARTBEAT.md` is no longer read by OpenClaw, so do not put workflow triggers there. Use an [Automation](/guides/automation) job instead.

`openclaw automations` is the current name for `openclaw cron`, and `create` is an alias of `add`. A workflow with no gates can run as a **command job** on the Gateway host, with no model call. The output is delivered to chat:

```bash
openclaw automations add "0 3 * * *" \
  --name "Nightly system check" \
  --command "lobster run --file $HOME/workflows/system-check.lobster" \
  --announce --channel telegram --to "123456789"
```

A workflow with approval gates is better run by the agent, so the gate reaches you in chat:

```bash
openclaw automations add "every 6h" \
  "Run the Lobster workflow workflows/security-scan.lobster with the lobster tool and report the result. If it needs approval, ask me." \
  --name "Security scan" --agent main --session isolated --announce
```

A command job that hits a gate stops and prints the `needs_approval` envelope; resume it with `lobster resume --token <token> --approve yes`.

---

## Visualization

```bash
lobster graph --file workflows/deploy.lobster                 # Mermaid (flowchart TD), the default
lobster graph --file workflows/deploy.lobster --format dot    # Graphviz DOT
lobster graph --file workflows/deploy.lobster --format ascii  # terminal-friendly list
lobster graph --file workflows/deploy.lobster --args-json '{"environment":"production"}'
```

Steps become nodes, `stdin:` references and `when:` conditions become edges, and approval gates are drawn as diamonds in Mermaid and DOT.

---

## Real-world patterns

### Deploy pipeline

```yaml title="workflows/deploy.lobster"
name: deploy
args:
  environment:
    default: staging
steps:
  - id: target
    run: printf '%s' "$LOBSTER_ARG_ENVIRONMENT"

  - id: lint
    run: npm run lint

  - id: test
    run: npm test
    timeout_ms: 300000
    retry:
      max: 2
      delay_ms: 5000

  - id: build
    run: npm run build

  - id: approve-deploy
    when: $target.stdout == 'production'
    approval:
      prompt: Deploy to production?
      required_approver: ops-lead
      require_different_approver: true

  - id: deploy
    when: $target.stdout != 'production' || $approve-deploy.approved
    run: ./scripts/deploy.sh "$LOBSTER_ARG_ENVIRONMENT"

  - id: healthcheck
    when: "!$deploy.skipped"
    run: curl -fsS "https://$LOBSTER_ARG_ENVIRONMENT.example.com/health"
    retry:
      max: 5
      delay_ms: 10000
      backoff: exponential
```

`environment` only ever reaches the shell through `$LOBSTER_ARG_ENVIRONMENT`. Restrict it in `deploy.sh` to known values.

### Code review chain

Two reviews in parallel, then a synthesis and a merge gate:

```yaml title="workflows/code-review.lobster"
name: code-review
args:
  branch:
    default: feature/new-auth
steps:
  - id: get-diff
    run: git diff "main...$LOBSTER_ARG_BRANCH"

  - id: reviews
    parallel:
      wait: all
      branches:
        - id: correctness
          pipeline: llm.invoke --prompt "Review this diff for correctness, edge cases and bugs."
          stdin: $get-diff.stdout
        - id: security
          pipeline: llm.invoke --prompt "Review this diff for vulnerabilities, injection risks and auth issues."
          stdin: $get-diff.stdout

  - id: synthesize
    pipeline: llm.invoke --prompt "Combine these two reviews into one assessment with action items."
    stdin: $reviews.json

  - id: approve-merge
    approval:
      prompt: Merge this branch?
    stdin: $synthesize.json
```

Remember that the diff is untrusted input to the model. Keep this workflow read-only up to the gate.

### System monitoring

```yaml title="workflows/system-check.lobster"
name: system-check
steps:
  - id: disk
    run: df -h --output=pcent,target | awk 'NR>1 && int($1)>85'

  - id: docker
    run: docker ps --filter "health=unhealthy" --format '{{.Names}}'

  - id: report
    when: $disk.stdout != '' || $docker.stdout != ''
    env:
      DISK: $disk.stdout
      DOCKER: $docker.stdout
    run: printf 'Disk over 85%%:\n%s\nUnhealthy containers:\n%s\n' "$DISK" "$DOCKER"
```

The `{{.Names}}` here is Docker's own Go template, not Lobster syntax. Before scheduling it as a command job (see [Scheduled runs](#scheduled-runs-automations)), run it once by hand to see exactly what `lobster run` prints, because that output is what reaches chat. Then trigger the job once with `openclaw cron run <jobId>`.

---

## CLI reference

| Command | Description |
|---------|-------------|
| `lobster run <file>` / `lobster run --file <file>` | Run a workflow file |
| `lobster run --file <file> --args-json '{"k":"v"}'` | Run with args |
| `lobster run --dry-run --file <file>` | Validate and print the plan without running anything |
| `lobster run --mode tool '<pipeline>'` | Print a single JSON envelope (for integrations) |
| `lobster '<pipeline>'` | Run an inline pipeline, for example `lobster 'exec --json "echo [1,2,3]" \| json'` |
| `lobster resume --token <t> --approve yes\|no` | Continue or cancel at an approval gate |
| `lobster resume --token <t> --response-json '<json>'` | Answer an input gate |
| `lobster resume --token <t> --cancel` | Cancel a paused run |
| `lobster graph --file <file> [--format mermaid\|dot\|ascii]` | Visualize a workflow |
| `lobster doctor` | Check the installation |
| `lobster version` | Print the version |
| `lobster help <command>` | Help for one pipeline command |

Named workflows run as a pipeline command: `lobster run --mode tool "workflows.run --name github.pr.monitor.notify --args-json '{\"repo\":\"openclaw/lobster\",\"pr\":167}'"`. `workflows.list` lists them.

### Pipeline commands

| Command | Description |
|---------|-------------|
| `exec` | Run an OS command (`--json` parses stdout, `--stdin raw\|json\|jsonl` feeds input) |
| `where`, `pick`, `head --n N` | Filter, select fields, take the first N items |
| `json`, `table` | Render output |
| `approve --prompt "…"` | Inline approval gate (`--preview-from-stdin --limit N` attaches a preview) |
| `ask` | Inline structured question |
| `llm.invoke`, `openclaw.agent`, `openclaw.invoke` | Model, agent and tool calls (above) |
| `state.get`, `state.set`, `diff.last` | Small persisted state, for "only notify on change" |

---

## Configuration

### Environment variables

| Variable | Description |
|----------|-------------|
| `OPENCLAW_URL` | Gateway URL for `openclaw.invoke` and the `openclaw` LLM provider. No default; for example `http://127.0.0.1:18789` |
| `OPENCLAW_TOKEN` | Gateway bearer token (sent ambiently only to loopback hosts) |
| `LOBSTER_LLM_PROVIDER` | `openclaw`, `pi` or `http` |
| `LOBSTER_LLM_ADAPTER_URL` | Generic HTTP LLM endpoint |
| `LOBSTER_PI_LLM_ADAPTER_URL` | Pi adapter endpoint |
| `LOBSTER_LLM_PRICING_JSON` | Pricing overrides as a JSON string |
| `LOBSTER_STATE_DIR` | Resume-state directory (default `~/.lobster/state`) |
| `LOBSTER_MAX_OUTPUT_BYTES` | Optional per-stream, per-process output cap (unset means unlimited) |
| `LOBSTER_MAX_HTTP_RESPONSE_BYTES` | Optional cap on HTTP response bodies |
| `LOBSTER_APPROVAL_INITIATED_BY` / `LOBSTER_APPROVAL_APPROVED_BY` | Identity ids for approval checks |

---

## Safety

Lobster steps run shell commands as the user who runs Lobster: on your machine for the CLI, inside the Gateway process for the embedded plugin, and on the Gateway host for a command job. Treat a workflow file like a script you are about to run.

- Put every send, post, delete or deploy behind an `approval:` step.
- Pass untrusted values through `$LOBSTER_ARG_*`, `stdin:` or `env:`, never through `${arg}` or `$step.stdout` in command text.
- Keep tokens out of workflow files; Lobster does not manage secrets, it calls OpenClaw tools that do.
- Automation command jobs run as operator-admin automations and are not covered by agent exec approvals.

See [Security hardening](/security/hardening) for approvals, sandboxing and tool allowlists.

---

## Debugging

```bash
lobster doctor
lobster run --dry-run --file workflow.lobster
lobster graph --file workflow.lobster --format ascii
lobster version
```

| Problem | Cause | Fix |
|---------|-------|-----|
| `openclaw.invoke requires --url or OPENCLAW_URL` | No Gateway URL | Export `OPENCLAW_URL` or pass `--url` |
| `openclaw.invoke: connection refused` | Gateway not running or wrong port | `openclaw gateway status` |
| Nested `openclaw.invoke` fails in the plugin | Embedded mode does not pass Gateway auth | Run the workflow with the standalone CLI |
| `... parallel must be an object` | Old `parallel: true` syntax | Use `parallel: { branches: [...] }` |
| `Workflow cost_limit.max_usd must be a non-negative number` | Old `warn`/`stop` keys | Use `cost_limit: { max_usd, action }` |
| `... creates a cycle` | A sub-workflow calls back into a running file | Restructure the composition |
| Literal `{{ ... }}` in output | Wrong template syntax | Use `${arg}` / `$step.stdout`, or env vars |
| `lobster runtime timed out` (plugin) | `timeoutMs` exceeded | Raise `timeoutMs` or split the pipeline |

---

## See also

- [Automation Guide](/guides/automation): Automations (cron), hooks and other triggers
- [Multi-Agent Guide](/guides/multi-agent): agent orchestration and routing
- [Skill Development](/guides/skill-development): building skills that workflows can call
- [CI/CD & Testing](/guides/cicd-testing)
- [Ecosystem](/reference/ecosystem#lobster): Lobster project details
- [Cost Management](/guides/cost-management)
- Upstream: [Lobster](https://docs.openclaw.ai/tools/lobster), [Lobster plugin reference](https://docs.openclaw.ai/plugins/reference/lobster), [Automations](https://docs.openclaw.ai/automation)
