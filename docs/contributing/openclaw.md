---
sidebar_position: 2
title: Contributing to OpenClaw
description: How to contribute to the OpenClaw project itself
---

# Contributing to OpenClaw

OpenClaw is open source (MIT license) and welcomes contributions. Here's how to get involved.

## Repository

The main repository is at [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw).

## Development Setup

```bash
# Clone
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Start in development mode
pnpm dev
```

## Areas to Contribute

| Area | Description | Good For |
|------|-------------|----------|
| **New channels** | Add messaging platform integrations | Backend developers |
| **Skills** | Build and publish skills on ClawHub | Anyone |
| **Bug fixes** | Fix reported issues | All skill levels |
| **Security** | Find and report vulnerabilities | Security researchers |
| **Documentation** | Improve official docs or these community docs | Writers |
| **Local model support** | Improve compatibility with local LLMs | ML engineers |
| **Testing** | Add test coverage | QA-minded developers |

## Contribution Guidelines

- **Issues first** — Open or claim an issue before starting work
- **Small PRs** — Keep pull requests focused on a single change
- **Tests** — Add tests for new functionality
- **Conventional commits** — Use `feat:`, `fix:`, `docs:`, etc.
- **Security** — Report vulnerabilities via [security advisories](https://github.com/openclaw/openclaw/security/advisories), not public issues

## Community

- **Discord**: [discord.gg/openclaw](https://discord.gg/openclaw)
- **GitHub Discussions**: [github.com/openclaw/openclaw/discussions](https://github.com/openclaw/openclaw/discussions)

## See Also

- [Contributing to these docs](/contributing/docs) — Help improve ClaweDocs
- [Skill Development](/guides/skill-development) — Build and share skills
- [ClawHub](/guides/clawhub) — Publish skills to the marketplace
