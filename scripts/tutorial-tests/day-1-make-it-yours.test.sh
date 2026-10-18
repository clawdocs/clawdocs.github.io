#!/usr/bin/env bash
# Tutorial test: docs/guides/first-7-days/day-1-make-it-yours.md
source "$(dirname "$0")/lib.sh"
page docs/guides/first-7-days/day-1-make-it-yours.md

onboard
setup -e '^ok$' "onboarding seeded the workspace (BOOTSTRAP.md, AGENTS.md, SOUL.md, IDENTITY.md, USER.md)" \
  "cd ~/.openclaw/workspace && ls BOOTSTRAP.md AGENTS.md SOUL.md IDENTITY.md USER.md > /dev/null && echo ok"
gateway_start

# Meet your bot
skip "openclaw dashboard" "opens a browser"
skip "openclaw tui" "interactive terminal UI"
skip "openclaw agent --agent main --message \"Who are you?\"" "needs a model provider key"

# The workspace files: deleting one and recreating it with setup
setup "delete AGENTS.md and keep a custom SOUL.md" \
  "rm ~/.openclaw/workspace/AGENTS.md && echo '# kept' > ~/.openclaw/workspace/SOUL.md"
run "openclaw setup --baseline"
setup -e '^ok$' "AGENTS.md is back and SOUL.md was not overwritten" \
  "test -f ~/.openclaw/workspace/AGENTS.md && grep -qx '# kept' ~/.openclaw/workspace/SOUL.md && echo ok"

# Write your SOUL.md
file_block "~/.openclaw/workspace/SOUL.md"
skip "openclaw agent --agent main --message \"Who are you?\"" "needs a model provider key"

# Set your identity
file_block "~/.openclaw/workspace/IDENTITY.md"
run -e 'Name: Nova' "openclaw agents set-identity --agent main --from-identity"
setup -e '"name": "Nova"' "identity stored in config" "openclaw config get agents.entries.main.identity"

# Tell it about you
file_block "~/.openclaw/workspace/USER.md"
run "openclaw config set agents.defaults.userTimezone Europe/Berlin"
setup -e 'Europe/Berlin' "timezone stored" "openclaw config get agents.defaults.userTimezone"
setup "config still valid with the gateway running" "openclaw config validate && openclaw health"

# Have a real conversation
skip_step "The five example prompts" "need a model provider key"

# Verify it remembers
skip "openclaw agent --agent main --message \"What do you know about me?\"" "needs a model provider key"
skip "cat ~/.openclaw/workspace/MEMORY.md" "MEMORY.md is written by the agent during a conversation; a fresh install has none"
skip "ls ~/.openclaw/workspace/memory/" "daily notes are written by the agent during a conversation"
run "openclaw memory search \"timezone\""
run "openclaw memory index --force"

finish
