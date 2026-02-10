---
sidebar_position: 2
title: "Recipe: Code Reviewer"
description: Use OpenClaw to automatically review pull requests and monitor CI
---

# Recipe: Code Reviewer

Set up OpenClaw to review pull requests, monitor CI pipelines, and catch issues before they merge.

## The Skill

```markdown title="~/.openclaw/skills/code-reviewer.md"
---
name: code-reviewer
version: 1.0.0
description: Automated PR review and CI monitoring
trigger: "review pr|code review|check ci|pull request"
tools: [shell, github, chat]
config:
  repos: []
  review_style: "thorough"  # thorough | quick | security-only
---

# Code Reviewer

## PR Review Process
1. Fetch the PR diff using `gh pr diff`
2. Analyze changes for:
   - Logic errors and bugs
   - Security vulnerabilities (SQL injection, XSS, etc.)
   - Performance concerns
   - Style inconsistencies
   - Missing tests for new functionality
3. Provide a structured review with severity levels
4. Suggest specific code improvements with diffs

## CI Monitoring
- Check GitHub Actions status for configured repos
- Alert on build failures with error summary
- Track flaky tests (failures that pass on re-run)
```

## Heartbeat Integration

```markdown title="~/.openclaw/HEARTBEAT.md"
## Code Review (every heartbeat)
- Check github.com/myorg/myrepo for new PRs
- Auto-review PRs from dependabot
- Alert on Slack if CI fails on main branch
```

## Usage

```bash
openclaw chat "Review PR #42 in myorg/myrepo"
openclaw chat "What's the CI status for our repos?"
openclaw chat "Find security issues in the latest PR"
```

## See Also

- [Channels & Integrations](/guides/channels) — GitHub integration setup
- [Skill Development](/guides/skill-development) — Customizing the review skill
