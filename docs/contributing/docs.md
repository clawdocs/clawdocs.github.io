---
sidebar_position: 1
title: Contributing to These Docs
description: How to contribute to the ClaweDocs community documentation
---

# Contributing to These Docs

These docs are community-maintained and hosted at [github.com/clawdocs/clawdocs](https://github.com/clawdocs/clawdocs). We welcome contributions of all sizes.

## Quick Edits

Every page has an **"Edit this page"** link at the bottom. Click it to edit directly on GitHub.

## Local Development

```bash
git clone https://github.com/clawdocs/clawdocs.git
cd clawdocs
npm install
npm start
```

This starts a local dev server at `http://localhost:3000` with hot reload.

## Adding a New Page

1. Create a Markdown file in the appropriate `docs/` subdirectory
2. Add frontmatter with `sidebar_position`, `title`, and `description`
3. Add the page to `sidebars.ts`
4. Submit a PR

### Frontmatter Template

```markdown
---
sidebar_position: 1
title: Your Page Title
description: A brief description for SEO
---

# Your Page Title

Content here...
```

## Style Guidelines

- **Be practical** — Focus on real-world usage, not theory
- **Show code** — Every concept should have a code example
- **Link liberally** — Cross-reference other pages in these docs
- **Warn about risks** — Use `:::danger` and `:::warning` admonitions for security concerns
- **Stay current** — OpenClaw moves fast. Mark outdated info clearly

## Submitting Changes

1. Fork the repository
2. Create a branch: `git checkout -b improve-security-docs`
3. Make your changes
4. Test locally: `npm run build`
5. Submit a PR with a clear description

## Reporting Issues

- Missing documentation? [Open an issue](https://github.com/clawdocs/clawdocs/issues)
- Incorrect information? Edit the page or file a bug
- Feature request? Start a discussion

## Note

These docs are **community-maintained** and not officially affiliated with the OpenClaw project. For official documentation, see [openclaw.ai](https://openclaw.ai).
