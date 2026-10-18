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

`.github/workflows/advisories.yml` runs this every Monday (and on manual
dispatch) with the workflow's `GITHUB_TOKEN`. If any advisory changed (a
`generatedAt`-only change is ignored), it opens or updates a PR from
`bot/advisories-refresh` via `peter-evans/create-pull-request`. When merging,
check whether the page's prose (batch sections, the latest release passed to
`<MinimumSafeVersion latest="...">`) needs updating too. PRs opened with
`GITHUB_TOKEN` don't trigger other workflows; re-run the snippet check by hand
or push a commit to the branch if needed.

## Link check

`.github/workflows/links.yml` runs lychee weekly over external links in
`docs/**/*.md` and posts the result to the job summary. It does not fail the
job. Site-relative links are covered by the Docusaurus build.
