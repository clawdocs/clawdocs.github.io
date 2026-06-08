---
sidebar_position: 3
title: "Day 2: Your Daily Driver"
description: "Put OpenClaw to work — summaries, research, file management, and real daily tasks"
---

# Day 2: Your Daily Driver

Yesterday you gave your bot a personality. Today you put it to work on the things you actually do every day — summarizing content, researching topics, managing files, writing scripts, and keeping your system healthy.

**Time:** ~30 minutes

---

## Summarize Anything

OpenClaw can digest content from URLs, local files, or raw text you paste in.

### Summarize a web page

```
Summarize https://news.ycombinator.com — just the top 10 stories with one-line descriptions
```

```
Summarize this article and list the 3 main takeaways: https://example.com/long-article
```

### Summarize a local file

```
Summarize ~/.openclaw/workspace/SOUL.md
```

```
Read ~/Documents/meeting-notes.txt and give me the action items
```

### Summarize a long email thread

Paste the email thread directly into chat:

```
Summarize this email thread and tell me what I need to respond to:

[paste email thread here]
```

:::tip
For long content, tell the bot what you care about: "Summarize this, focusing on pricing changes" beats "Summarize this" every time.
:::

---

## Research Assistant

The bot can research topics, compare options, and find documentation — saving you the tab-switching and skimming.

```
What are the main differences between SQLite, PostgreSQL, and MySQL for a small self-hosted app?
```

```
Find the current documentation for setting up Tailscale on Ubuntu 24.04
```

```
Compare Hetzner, DigitalOcean, and Vultr for a 4GB VPS — pricing, locations, and any gotchas
```

```
What's the recommended way to handle authentication in a Next.js 15 app?
```

The bot will search the web, pull from documentation, and synthesize what it finds. If you need it to go deeper, ask follow-up questions — the context carries between messages.

---

## File Management

One of OpenClaw's strongest practical uses: managing files without memorizing find/xargs/sed incantations.

### Organize files

```
Sort all files in ~/Downloads into subdirectories by file type (images, documents, archives, etc.)
```

### Find duplicates

```
Find duplicate files in ~/Photos based on content, not just filename
```

### Rename batches

```
Rename all files in ~/screenshots to the format YYYY-MM-DD_HH-MM-SS.png based on their modification time
```

### Create directory structures

```
Create a project structure for a Python CLI tool called "timetrack" with src, tests, docs, and config directories, including __init__.py files and a pyproject.toml
```

:::warning
For destructive operations (deleting, moving, overwriting), the bot will show you the plan and ask for confirmation before executing. If you want it to just do it, say "go ahead without asking."
:::

---

## Quick Scripts

Need a one-off script? Describe what you want in plain language. The bot writes it, explains it, and can run it for you.

```
Write a bash script that backs up my ~/.openclaw directory to ~/backups with a timestamp
```

```
Write a Python script that reads a CSV file and outputs the rows where the "status" column is "failed"
```

```
Create a script that watches ~/Downloads for new PDF files and moves them to ~/Documents/PDFs
```

```
Write a quick API call to check if my website is returning 200 — just curl, no dependencies
```

The bot matches your preferred language (from USER.md) by default. Ask for a different one if you want:

```
Write that in Go instead
```

---

## System Admin

Your bot has access to the system it's running on. Use it for quick health checks and admin tasks.

```
Check disk space on all partitions and warn me about anything above 80%
```

```
What processes are using the most memory right now?
```

```
Is port 8080 in use? If so, what's using it?
```

```
Show me the last 20 lines of /var/log/syslog and flag anything unusual
```

```
Install htop if it's not already installed
```

:::info
System access depends on the permissions of the user running OpenClaw. The bot can't do anything you couldn't do yourself in a terminal. For privileged operations, it'll tell you the `sudo` command to run.
:::

---

## Practical Examples

Copy-paste these into your next chat session. Each one is a real task you can try right now:

```
Summarize https://news.ycombinator.com
```

```
Find all files larger than 100MB in my home directory
```

```
Write a bash script that backs up my ~/.openclaw directory to ~/backups with a timestamp
```

```
What processes are using the most memory right now?
```

```
Create a Python script that converts all PNG files in ~/images to JPEG
```

```
Show my current git branches across all repos in ~/projects and flag any with uncommitted changes
```

---

## Tips for Better Results

**Be specific.** "Write a script" is vague. "Write a bash script that monitors CPU temperature and logs it to ~/logs/temp.csv every 5 minutes" gives the bot everything it needs in one shot.

**Give context.** If you're working on a specific project, mention it: "In my Node.js app at ~/api, find all API endpoints that don't have input validation." The bot will look at the actual code, not guess.

**Ask for step-by-step when you're unsure.** If you want to understand what's happening, say: "Walk me through setting up a cron job, explaining each part." The bot will teach instead of just doing.

**Chain tasks.** The bot remembers context within a session. You can build on previous answers:

```
Find all large log files in /var/log
> now compress any that are older than 7 days
> create a cron job that does this weekly
```

**Use configuration for recurring preferences.** If you always want concise answers, add it to `~/.openclaw/openclaw.json`:

```json5
{
  // Default instructions appended to every message
  "systemPromptSuffix": "Be concise. Prefer bullet points over paragraphs."
}
```

This saves you from repeating "be brief" every session.

---

## What You've Done Today

- Summarized web pages, local files, and pasted content
- Used the bot as a research assistant
- Managed files without memorizing shell commands
- Generated and ran one-off scripts
- Ran system health checks
- Learned patterns for getting better results

You're now using OpenClaw for real work. Tomorrow you stop babysitting it.

**Next: [Day 3: Set It Free](day-3-automation) — automate tasks with the heartbeat**
