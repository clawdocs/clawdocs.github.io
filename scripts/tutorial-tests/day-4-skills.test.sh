#!/usr/bin/env bash
# Tutorial test: docs/guides/first-7-days/day-4-skills.md
source "$(dirname "$0")/lib.sh"
page docs/guides/first-7-days/day-4-skills.md

onboard
gateway_start

# Start with the skills you already have
run -e 'weather' "openclaw skills list"
run "openclaw skills check"
run -e 'github' "openclaw skills info github"
skip "openclaw agent --agent main --message \"What's the weather in Berlin this afternoon?\"" "needs a model provider key"

# Find more on ClawHub (network: clawhub.ai)
run "openclaw skills search \"calendar\""
run "openclaw skills search \"rss digest\" --limit 10"

# Check before you install
run -x 0,1 "openclaw skills verify @asleep123/caldav-calendar --card"

# Install your first skill
run "openclaw skills install @asleep123/caldav-calendar"
setup -e '^ok$' "skill landed in the workspace" "test -f ~/.openclaw/workspace/skills/caldav-calendar/SKILL.md && echo ok"
run -e 'caldav' "openclaw skills list"

# Managing skills
run "openclaw skills list"
run "openclaw skills list --eligible"
run "openclaw skills update --all"
run "openclaw skills update @asleep123/caldav-calendar"
config_block 1
setup -e 'false' "weather is disabled in config" "openclaw config get skills.entries.weather.enabled"

skip "npm i -g clawhub" "installs the third-party ClawHub CLI globally; out of scope for this test"
skip "clawhub uninstall @asleep123/caldav-calendar" "needs the ClawHub CLI (above) and asks for confirmation"

# Building vs installing: the minimal skill must load
file_block "~/.openclaw/workspace/skills/my-custom-skill/SKILL.md"
setup -e 'my-custom-skill' "custom skill is listed" "openclaw skills list"

finish
