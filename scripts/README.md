# scripts

## Snippet gates (`check-snippets.mjs`)

`npm run check:snippets` scans `docs/**/*.md` and reports, per page, copy-paste
snippets that would not work against the pinned OpenClaw. CI runs it on every
PR and push to `gh-pages` (`.github/workflows/snippets.yml`) and writes the
report to the job summary, plus `snippet-report.json` as an artifact.

| Gate | What it checks |
|---|---|
| config | `json`/`json5`/`jsonc` blocks meant for `openclaw.json` are written to a throwaway dir and run through `openclaw config validate --json` (we read `valid` and `issues`). |
| commands | In `bash`/`sh`/`shell`/`console`/`zsh` blocks, every `openclaw <sub> [<sub2> ...]` invocation must resolve to a real command path (`--help`, cached once per path), and every `--flag` must appear in that path's `--help` or the global options. Commands from bundled plugins that are off by default (e.g. `workboard`) are checked with that plugin enabled in the sandbox. |
| installs | `npx`, `bunx`, `npm i/install`, `pnpm add/dlx`, `pip install`, `uvx`, `pipx install`, `clawhub install`, `openclaw plugins install`, `openclaw skills install`, and MCP `"command": "npx", "args": [...]` stanzas in any block. The target must be in `install-allowlist.json`; anything in its `denied` section is reported as known-bad. |

**Which JSON blocks count as config:** the fence title mentions `openclaw.json`
(or `openclaw…/config.json5`), or, with no title naming another file, at least
one top-level key is an OpenClaw root key from the pinned schema
(`openclaw config schema`). A titled block that is a bare fragment
(`"gateway": {...}`) is wrapped in `{}` first. Lines that are only `...` or
`// ...` are dropped; a block with `...` anywhere else is skipped and listed
as skipped. Blocks whose only issue is a missing `$include` file are skipped.

**Command lines:** `$ ` prompts are stripped (in `console` blocks only prompt
lines count), `\` continuations are joined, heredoc bodies are ignored, and
`sudo`, `env`, `VAR=x`, `docker exec <ctr>` and `npx openclaw` prefixes are
looked through.

### Opting a block out

Put the marker on the line before the fence (MDX-safe form):

````md
{/* snippet:skip deliberately wrong example */}
```json5
...
```
````

or add `nocheck` to the fence meta: ` ```json5 title="bad.json5" nocheck `.
`<!-- snippet:skip -->` is also recognised. Use this only for snippets that are
meant to be wrong (for example "don't do this" examples) and say why.

### Modes

- Report only (default): always exits 0.
- Blocking: `--strict` or `SNIPPETS_STRICT=1` exits 1 on any failure. In CI, set
  the repository variable `SNIPPETS_STRICT=1`, or tick "strict" on a manual run.

Other flags: `--only config,commands,installs`, `--json <file>`, `--network`
(asks npm about unlisted packages and checks allowlisted maintainers still
match; never used as the source of truth), and paths to limit the scan,
e.g. `npm run check:snippets -- docs/security`.

### Running locally

The script looks for OpenClaw at `OPENCLAW_BIN`, then
`tools/openclaw/node_modules/.bin/openclaw` (git-ignored), then `PATH`:

```bash
npm i --prefix tools/openclaw --no-save --ignore-scripts "openclaw@$(cat scripts/openclaw-version.txt)"
npm run check:snippets
```

Every OpenClaw process gets a temporary `HOME`, `OPENCLAW_STATE_DIR` and
`OPENCLAW_CONFIG_PATH`; only `--help`, `--version`, `config schema` and
`config validate` are run. No gateway is started. Needs Node 24.16+.

### Updating the OpenClaw pin

1. Edit `scripts/openclaw-version.txt` (the only place the version lives).
2. Run the check locally against the new version and compare the totals with
   the previous run. New failures usually mean the docs drifted from a real
   CLI or schema change.
3. Note the bump in the PR description.

### Adding to the allowlist

Check the publisher first (`npm view <pkg> maintainers repository.url`, or the
PyPI project page) and confirm it matches the project the page links to. Then
add `name -> { maintainers, repository }` (npm) or `{ note }` (pypi/clawhub).
A trailing `*` matches a prefix such as `@openclaw/*`. Never allowlist a name
just because it exists on the registry.

## Security advisory data (`advisories.mjs`)

`/security/known-vulnerabilities` renders its chart, advisory table and
"minimum safe version" callout from `static/data/openclaw-advisories.json`
(component: `src/components/AdvisoryTimeline.tsx`). The JSON holds only public
advisory fields: `generatedAt`, `repo`, and per advisory `ghsa_id`, `cve_id`,
`severity`, `cvss` (3.1 score, else 4.0, with `cvss_version`), `summary`,
`published_at`, `patched` (first patched versions of the core package,
including the old `clawdbot` name), `patched_other` (plugins and apps, as
`name version`) and `html_url`. One advisory per line keeps diffs readable.

```bash
# needs `gh` logged in, or GITHUB_TOKEN set; prints a Markdown summary too
node scripts/advisories.mjs --json static/data/openclaw-advisories.json
# from a saved dump (JSON array or JSONL) instead of the API
node scripts/advisories.mjs --file adv.jsonl --json static/data/openclaw-advisories.json
```

Refreshing is manual for now: run the command above, and if the JSON changed
(not just `generatedAt`), open a PR with it. When merging, check whether the
page's prose (batch sections, the latest release passed to
`<MinimumSafeVersion latest="...">`) needs updating too. A scheduled workflow
that opens the PR automatically was removed until the repo allows GitHub
Actions to create pull requests.

## Tutorial tests (`tutorial-tests/`)

The snippet gates check that commands *exist*. The tutorial tests check that
the beginner path *works*: each `*.test.sh` walks one page in order and runs its
commands for real against the pinned OpenClaw, with a Gateway running on the
GitHub Actions runner (`.github/workflows/tutorials.yml`: pushes and PRs that
touch `docs/` or the tests, weekly, and on demand).

| Test | Page |
|---|---|
| `quick-start.test.sh` | `getting-started/quick-start.md` |
| `day-1-make-it-yours.test.sh` | `guides/first-7-days/day-1-make-it-yours.md` |
| `day-3-automation.test.sh` | `guides/first-7-days/day-3-automation.md` |
| `day-4-skills.test.sh` | `guides/first-7-days/day-4-skills.md` |
| `day-7-production.test.sh` | `guides/first-7-days/day-7-production.md` |
| `heartbeat.test.sh` | `guides/heartbeat.md` |

Each test gets a fresh sandbox `HOME` (so `~/.openclaw/...` on the page is the
sandbox), a non-interactive onboarding with no model credentials, and its own
Gateway (`openclaw gateway run`, loopback, token auth), which is stopped at the
end. Tests re-run themselves under `env -i`, so no API key or token from the
calling shell reaches OpenClaw.

**The page is the source.** A test names commands by their text on the page;
`lib.sh` finds them in the page's shell blocks (or inline code) and runs the
page's own text, so a test cannot drift from its page silently:

```bash
source "$(dirname "$0")/lib.sh"
page docs/guides/heartbeat.md
onboard                                  # CI stand-in for interactive onboarding
gateway_start
run -e 'Heartbeat \(main\)' "openclaw cron list --all"   # -e: output must match
run "openclaw automations add \"every 30m\"..."         # "...": the one command with this prefix
capture jobId "openclaw cron list --all --json" '(j.jobs).find(x=>x.displayName==="Heartbeat (main)").id'
run "openclaw cron scratch <jobId>"      # <placeholders> come from capture/ph
config_block 1                           # Nth openclaw.json block: config patch + validate
config_block 4 --dry-run                 # reference block: validate the merge, don't apply
file_block "~/.openclaw/workspace/SOUL.md"   # write a titled block to its path
skip "openclaw tui" "interactive terminal UI"
finish
```

Other helpers: `run_as "<page command>" "<CI variant>"` for steps that need a
non-interactive form or the pinned version, `setup "<label>" "<command>"` for
CI-only checks between steps, `skip_step` for non-command steps, `-x 0,1` for
accepted exit codes, `-t <secs>` for a timeout. A step that needs a model key
or a channel account is a `skip` with the reason, never faked. Page commands a
test neither runs nor skips are listed as "unmapped" in the report.

**Output:** a job summary table (page, steps run, skipped, failed, unmapped,
with every step and reason under each page) and `tutorial-report.json`
(artifact `tutorial-report`). For a passing page the summary prints the front
matter to add.

**Report only for now.** The job passes even when a page fails. To make it
blocking, set the repository variable `TUTORIALS_STRICT=1`, or tick "strict"
on a manual run (`run.mjs --strict` exits 1 on any failed page).

### Running locally

```bash
TT_DRY=1 bash scripts/tutorial-tests/heartbeat.test.sh   # check the test/page mapping; runs nothing
node scripts/tutorial-tests/run.mjs                      # full run: needs a Gateway, so CI only
```

`gateway_start` refuses to run outside GitHub Actions unless you set
`TT_ALLOW_GATEWAY=1`. Do that only in a disposable VM or container: it starts a
real Gateway on port 18789.

### The "Verified in CI" banner

Pages that pass get a front matter entry, added by hand after a green run
(the workflow never commits):

```yaml
ci_verified:
  version: 2026.10.4
  date: 2026-10-18
  steps: 24
```

`src/theme/DocItem/Content` (a wrapper around the theme's component) reads it
and renders `src/components/CiVerified.tsx` above the page: "Verified in CI on
OpenClaw 2026.10.4, 2026-10-18 — 24 steps run", linking to the workflow.
`steps` is the "Steps run" count minus failures from the summary. When a page
starts failing, fix the page or remove its `ci_verified` entry. Bump the
entries when the pin moves.

### Adding a page

Copy a test, point `page` at the new file, and walk the page top to bottom.
Run it with `TT_DRY=1` until it reports `0 page commands not mapped`, then
push and read the job summary.

## Link check

`.github/workflows/links.yml` runs lychee weekly over external links in
`docs/**/*.md` and posts the result to the job summary. It does not fail the
job. Site-relative links are covered by the Docusaurus build.
