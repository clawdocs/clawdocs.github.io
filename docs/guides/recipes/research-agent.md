---
sidebar_position: 4
title: "Recipe: Research Agent"
description: Build an OpenClaw skill for deep web research and report generation
---

# Recipe: Research Agent

Turn OpenClaw into a research assistant that finds, synthesizes, and reports on any topic.

## The Skill

```markdown title="~/.openclaw/skills/research-agent.md"
---
name: research-agent
version: 1.0.0
description: Deep web research and report generation
trigger: "research|investigate|find out|deep dive"
tools: [browser, shell, filesystem, chat]
---

# Research Agent

## Process
1. Break the research question into sub-queries
2. Search multiple sources (web, Hacker News, Reddit, academic)
3. Cross-reference findings for accuracy
4. Synthesize into a structured report
5. Save report to ~/research/ with date stamp

## Output Format
- Executive summary (3-5 sentences)
- Key findings (bulleted)
- Sources (with URLs)
- Confidence assessment
- Unanswered questions / areas for further research
```

## Usage

```bash
openclaw chat "Research the current state of WebAssembly in 2026"
openclaw chat "Investigate alternatives to Kubernetes for small teams"
openclaw chat "Deep dive into the OpenClaw security incidents from last month"
```

## Heartbeat Integration

```markdown title="~/.openclaw/HEARTBEAT.md"
## Research (daily)
- Monitor Hacker News for posts about AI agents with 100+ points
- Track new papers on arxiv.org about autonomous agents
- Weekly summary every Monday
```

## See Also

- [Basic Usage](/guides/basic-usage) — Research task patterns
- [Heartbeat Guide](/guides/heartbeat) — Automated monitoring
