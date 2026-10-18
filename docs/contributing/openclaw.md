---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Contributing to OpenClaw
description: How to contribute to the OpenClaw project itself, summarised from its CONTRIBUTING.md
keywords: [openclaw, openclaw development, contribute to openclaw, open source, pull request, community, github]
---

# Contributing to OpenClaw

OpenClaw is open source under the MIT license (copyright OpenClaw Foundation) at [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw). This page summarises its [CONTRIBUTING.md](https://github.com/openclaw/openclaw/blob/main/CONTRIBUTING.md) as of 2026-10-18; read that file before your first PR, because the rules are strict and enforced by bots.

## What gets accepted

- **Bugs and small fixes:** open a PR directly.
- **New features or architecture changes:** open an issue or ask in Discord first. Most features are not accepted into core; upstream asks for them to be built as third-party plugins with the plugin SDK instead.
- **Refactor-only PRs:** not accepted unless a maintainer asks for one as part of a concrete fix.
- **Test- or CI-only PRs for failures already red on `main`:** not accepted; maintainers already track those.
- **Questions and setup help:** Discord `#help`, not GitHub issues.

There is a hard cap of **20 open PRs per author**; extra PRs are closed automatically.

Good places to help outside core code: skills on [ClawHub](/guides/clawhub), plugins, bug reports with a clean reproduction, the official docs (docs bugs have their own issue template), and these community docs.

## Development setup

You need Node 24.16+ or 26.1+ (Node 22, 23 and 25 are unsupported) and pnpm, which the repo pins through `packageManager`.

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm dev
```

Run focused tests for what you touched rather than the whole suite: `pnpm test <file> --maxWorkers=1`, plus `pnpm test:extension <name>` for a plugin. PR CI runs the full suite.

## Pull requests

- For non-trivial work, link an issue (`Closes #123` or `Related: #123`).
- Fill in the [PR template](https://github.com/openclaw/openclaw/blob/main/.github/pull_request_template.md): the problem in plain language, user impact, and **evidence** (focused test output, screenshots, logs).
- Keep "Allow edits by maintainers" enabled on fork PRs.
- Do not edit `CHANGELOG.md` or `CHANGELOG/**`; release notes are generated at release time.
- Do not guess who to tag; labels and `CODEOWNERS` route the review.

## Reporting a vulnerability

Do not open a public issue. Report privately through GitHub security advisories on the repository where the problem lives ([openclaw/openclaw](https://github.com/openclaw/openclaw/security/advisories) for the CLI, Gateway and apps; [openclaw/clawhub](https://github.com/openclaw/clawhub) for ClawHub), or email **security@openclaw.ai** if unsure. Include severity, impact, the affected component and reproduction steps. See [SECURITY.md](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) for the trust model and what counts as in scope.

## Community

- **Discord:** [discord.gg/clawd](https://discord.gg/clawd) (the official invite, from CONTRIBUTING.md)
- **Forum:** [community.openclaw.ai](https://community.openclaw.ai), the official Discourse forum linked from openclaw.ai
- **Foundation:** [openclaw.org](https://www.openclaw.org), launched 2026-07-08; Dave Morin is Chairperson and Vincent Koc Chief Architect ([people](https://www.openclaw.org/people), 2026-10-18). Press contact: press@openclaw.org
- **Issues:** [github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues). The repository has GitHub Discussions turned off.

## See also

- [Contributing to these docs](/contributing/docs): help improve ClawDocs
- [Skill Development](/guides/skill-development): build and share skills
- [ClawHub](/guides/clawhub): publish skills
