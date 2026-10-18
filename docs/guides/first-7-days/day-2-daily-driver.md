---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: "Day 2: Your Daily Driver"
description: "Put OpenClaw to work — summaries, research, file management, and real daily tasks"
keywords: [openclaw, daily use, everyday tasks, productivity, chat commands, summarize, file management]
---

# Day 2: Your Daily Driver

Today you put the bot to work: summaries, research, file management, quick scripts and system checks.

**Time:** ~30 minutes

Type the prompts below into whichever chat you use: the Control UI (`openclaw dashboard`), the terminal UI (`openclaw tui`), or a connected channel such as Telegram. To send a single prompt from the shell, use `openclaw agent --agent main --message "..."`.

---

## Summarize Anything

OpenClaw can digest content from URLs, local files, or raw text you paste in. Fetching a URL uses the `web_fetch` tool, and the bundled `summarize` skill helps with long pages, videos and podcasts ([web fetch](https://docs.openclaw.ai/tools/web-fetch)).

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

Web search needs a search provider. OpenClaw auto-detects one from the credentials you have configured; if the bot says it cannot search, set one up as described in [web tools](https://docs.openclaw.ai/tools/web).

---

## File Management

Managing files without memorizing find/xargs/sed incantations. These prompts move and rename real files, so read this first:

:::warning The bot does not ask first by default
By default OpenClaw runs commands **without asking**, including destructive ones (deleting, moving, overwriting): `tools.exec.mode` defaults to `full` and the sandbox is off. Asking it to "show me the plan first" is a request the model may or may not honour, not a safety control.

For a real confirmation step, turn on approvals and check the result:

```bash
openclaw config set tools.exec.mode ask
openclaw exec-policy show
```

In `ask` mode, allowlisted commands run and everything else waits for you to approve it in the chat or Control UI. `openclaw approvals get` shows the requested policy, the host approvals file and the effective result. See [permission modes](https://docs.openclaw.ai/tools/permission-modes) and the [hardening checklist](/security/hardening#exec-approvals).
:::

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

---

## Quick Scripts

Need a one-off script? Describe what you want in plain language. The bot writes it, explains it, and can run it for you.

```
Write a bash script that backs up ~/Documents/notes to ~/backups with a timestamp
```

(For OpenClaw's own state, use `openclaw backup create` instead; copying `~/.openclaw` while the Gateway runs can catch its SQLite databases mid-write. See [Day 7](./day-7-production.md#backups).)

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
System access depends on the permissions of the user running OpenClaw. The bot can do anything that user can do in a terminal. If that user has passwordless `sudo`, the bot can install packages and change system files without asking you, unless approvals are on. Run OpenClaw as an ordinary user without passwordless `sudo`, turn on approvals (above), and consider the [sandbox](/security/hardening#sandboxing) for anything that reads untrusted input.
:::

---

## Tips for Better Results

**Be specific.** "Write a script" is vague. "Write a bash script that monitors CPU temperature and logs it to ~/logs/temp.csv every 5 minutes" gives the bot everything it needs in one shot.

**Give context.** If you're working on a specific project, mention it: "In my Node.js app at ~/api, find all API endpoints that don't have input validation." The bot will look at the actual code, not guess.

**Ask for step-by-step when you're unsure.** If you want to understand what's happening, say: "Walk me through setting up a cron job, explaining each part." The bot will teach instead of just doing.

**Chain tasks.** The bot remembers context within a session. You can build on previous answers:

```
Find all large log files in /var/log
> now compress any that are older than 7 days
> create an automation that does this weekly
```

The last step creates an OpenClaw automation (a scheduled job inside the Gateway), not an entry in your system crontab. You'll set these up properly on [Day 3](./day-3-automation.md).

**Save recurring preferences as directives.** If you always want concise answers, add a directive to `~/.openclaw/workspace/USER.md` (see [Day 1](./day-1-make-it-yours.md#tell-it-about-you)), or simply tell the bot "save this as a directive":

```markdown title="~/.openclaw/workspace/USER.md"
<!-- observed: 2026-10-18 | status: active -->

- Prefer concise answers with bullet points over paragraphs.
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

**Next: [Day 3: Set It Free](day-3-automation) — schedule automations and tune the heartbeat**
