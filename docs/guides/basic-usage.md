---
sidebar_position: 1
title: Basic Usage
description: Everyday patterns for working with OpenClaw — chat, tasks, file operations, and more
---

# Basic Usage

This guide covers the most common ways to interact with OpenClaw day-to-day.

## CLI Chat

The simplest way to talk to OpenClaw:

```bash
# One-shot message
openclaw chat "What's in my current directory?"

# Interactive session
openclaw chat
> What files changed in git today?
> Summarize the largest one
> exit
```

## Common Task Patterns

### File Operations

```bash
openclaw chat "Create a .gitignore for a Node.js project in ~/new-project"
openclaw chat "Find all TODO comments in ~/project/src"
openclaw chat "Rename all .jpeg files in ~/photos to .jpg"
```

### Development Tasks

```bash
openclaw chat "Run the test suite in ~/app and summarize any failures"
openclaw chat "Review the diff in my current git branch and suggest improvements"
openclaw chat "Set up a new Express API project with TypeScript in ~/api"
```

### Research

```bash
openclaw chat "What are the top Hacker News stories right now?"
openclaw chat "Compare the latest pricing for AWS, GCP, and Azure for a small web app"
openclaw chat "Find the best-rated restaurants near me that are open now"
```

### System Administration

```bash
openclaw chat "What processes are using the most memory?"
openclaw chat "Check if ports 3000, 5432, and 6379 are in use"
openclaw chat "Monitor my disk usage and alert me if any partition is above 90%"
```

## Working with Context

OpenClaw remembers context within a session and across sessions via [memory](/architecture/memory-system):

```bash
openclaw chat
> I'm working on the authentication module in ~/project
> What does the login function do?
> Refactor it to use JWT instead of sessions
> Now update the tests to match
```

Each message builds on the previous, and the agent remembers your project context for next time.

## Piping Input

```bash
# Pipe file contents
cat error.log | openclaw chat "What's causing these errors?"

# Pipe command output
docker ps | openclaw chat "Which containers are using the most resources?"

# Pipe JSON
curl -s https://api.example.com/data | openclaw chat "Summarize this API response"
```

## Output Formatting

OpenClaw responds in Markdown by default. Control the format:

```bash
# Get JSON output
openclaw chat --format json "List my 5 largest files"

# Plain text (no markdown)
openclaw chat --format plain "What time is it?"

# Save to file
openclaw chat "Generate a project README" > README.md
```

## Multi-Step Tasks

For complex tasks, OpenClaw breaks work into steps automatically:

```bash
openclaw chat "Set up a PostgreSQL database, create a users table, \
  add seed data, and generate a TypeScript ORM client"
```

The agent will:
1. Check if PostgreSQL is installed
2. Create the database
3. Write and execute the schema
4. Insert seed data
5. Generate the ORM client
6. Report what it did

## Tips for Better Results

| Tip | Example |
|-----|---------|
| Be specific about paths | "Edit `~/project/src/auth.ts`" not "edit the auth file" |
| State desired output | "Create a JSON config file" not just "set up config" |
| Provide constraints | "Use Python 3.12, no external dependencies" |
| Reference past context | "Like the script we made yesterday" |

## See Also

- [Channels & Integrations](/guides/channels) — Use OpenClaw from WhatsApp, Slack, etc.
- [Skill Development](/guides/skill-development) — Automate recurring tasks
- [CLI Reference](/reference/cli) — All CLI commands and flags
