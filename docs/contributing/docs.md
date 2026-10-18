---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Contributing to These Docs
description: How to contribute to the ClawDocs community documentation, including the snippet checks every page must pass
keywords: [openclaw, contributing, documentation, help, community docs, how to contribute, open source]
---

# Contributing to These Docs

ClawDocs is community-maintained and lives at [github.com/clawdocs/clawdocs.github.io](https://github.com/clawdocs/clawdocs.github.io) (default branch `gh-pages`). Contributions of any size are welcome.

ClawDocs is a companion to the official docs, not a copy of them. A good page here is short, tested against a specific OpenClaw version, says what we recommend and why, and deep-links [docs.openclaw.ai](https://docs.openclaw.ai) for the full reference.

## Quick edits

Every page has an **Edit this page** link at the bottom that opens the file on GitHub.

## Local development

```bash
git clone https://github.com/clawdocs/clawdocs.github.io.git
cd clawdocs.github.io
npm install
npm start
```

This serves the site at `http://localhost:3000` with hot reload. Before opening a PR, run `npm run build`: it fails on broken internal links and anchors.

## Verify against upstream

Config keys, commands, flags and environment variables are the most common source of errors. Do not write one from memory or from a blog post.

- **Config:** check keys against `openclaw config schema` or upstream `src/config/zod-schema*.ts`. OpenClaw refuses to start on an unknown key, so one wrong line breaks a reader's install.
- **Commands and flags:** check them with `openclaw <command> --help` on the pinned version.
- **Environment variables:** check them against upstream [Environment variables](https://docs.openclaw.ai/help/environment).
- **Packages:** check that anything a reader installs (`npx`, `npm i`, `pip install`, `plugins install`) is the real, intended package: `npm view <pkg> maintainers repository.url`.
- **Links:** when you link docs.openclaw.ai, check that the page exists (upstream `docs/<path>.md` maps to `https://docs.openclaw.ai/<path>`).

## Snippet checks

`scripts/check-snippets.mjs` tests every page's copy-paste snippets against the OpenClaw version pinned in `scripts/openclaw-version.txt`. CI runs it on every PR and push (`.github/workflows/snippets.yml`) and puts a per-page report in the job summary. It has three gates:

| Gate | What must pass |
|------|----------------|
| config | Every `json`/`json5` block meant for `openclaw.json` passes `openclaw config validate`. |
| commands | Every `openclaw ...` line in a shell block names a real command path, and every `--flag` appears in that command's `--help`. |
| installs | Every install target is listed in `scripts/install-allowlist.json`. |

A JSON block counts as config when its fence title names `openclaw.json` or one of its top-level keys is an OpenClaw root key. So give every config block this title:

````md
```json5 title="~/.openclaw/openclaw.json"
{
  tools: { exec: { mode: "ask" } },
}
```
````

JSON that is not `openclaw.json` (an API payload, a skill or plugin manifest) gets a title naming what it is instead.

### Running the check locally

Install the pinned OpenClaw into the git-ignored `tools/openclaw` folder, then run the check. It never starts a Gateway and runs every OpenClaw process with a throwaway `HOME`. Node 24.16+ is required.

```bash
npm i --prefix tools/openclaw --no-save --ignore-scripts "openclaw@$(cat scripts/openclaw-version.txt)"
npm run check:snippets
npm run check:snippets -- docs/reference
```

The last form limits the scan to some paths. To check a single config snippet by hand, save it to a file and run `OPENCLAW_CONFIG_PATH=./snippet.json5 openclaw config validate --json`, then read `valid` and `issues`.

### Opting a block out

Only blocks that are meant to fail, such as a "don't do this" example, or that cannot be checked in a sandbox, may opt out. Put the marker on the line immediately before the fence and give a reason:

````md
{/* snippet:skip deliberately wrong: shows a retired key */}
```json5 title="~/.openclaw/openclaw.json"
{ heartbeat: { every: "1h" } }
```
````

Use the `{/* ... */}` form. These pages are compiled as MDX, where an HTML comment can break the build. Adding `nocheck` to the fence meta also works. Details, including how blocks are detected and how to update the pin or the allowlist, are in [`scripts/README.md`](https://github.com/clawdocs/clawdocs.github.io/blob/gh-pages/scripts/README.md).

## Adding or updating a page

1. Create or edit a Markdown file in the right `docs/` subdirectory.
2. Add the page to `sidebars.ts`; that file alone sets the sidebar order.
3. Fill in the front matter (below).
4. Run `npm run check:snippets -- <your page>` and `npm run build`.
5. Open a PR.

### Front matter

```markdown
---
title: Your Page Title
description: One sentence for search results
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
---
```

- `last_update.date` is shown as "Last updated" on the page. Change it only when you have re-checked the content, not for formatting-only edits, so the date means something.
- `verified_with` is the OpenClaw version you tested the page against: the version whose schema, `--help` and docs you checked. Bump it when you re-verify after an upgrade.
- Keep existing `id`/slug values and heading anchors. Other pages link to them; if you must rename a heading, keep the old anchor with an explicit `{#old-slug}`.

## Style

- **Correct over complete.** A short page that is right beats a long one with invented details.
- **Be specific.** Real keys, real commands, real versions. Date any number that changes (prices, stars, counts) with "as of" and a source.
- **Use current model refs** in `provider/model` form, for example `anthropic/claude-opus-5-5`.
- **Warn about risks.** Any page that gives the agent shell, browser, email, money or device access needs a short note on approvals and sandboxing linking [Security Hardening](/security/hardening). Use `:::danger` and `:::warning` admonitions.
- **Plain language, no marketing, no emoji.**

## Submitting changes

1. Fork the repository.
2. Create a branch: `git checkout -b fix-gateway-auth-docs`.
3. Make your changes and run the checks above.
4. Open a PR that says what you changed and which OpenClaw version you verified it against.

## Reporting issues

- Wrong or missing documentation: [open an issue](https://github.com/clawdocs/clawdocs.github.io/issues), or edit the page.
- A bug in OpenClaw itself belongs upstream; see [Contributing to OpenClaw](/contributing/openclaw).

## Note

ClawDocs is community-maintained and not affiliated with the OpenClaw project or the OpenClaw Foundation. The official documentation is at [docs.openclaw.ai](https://docs.openclaw.ai).
