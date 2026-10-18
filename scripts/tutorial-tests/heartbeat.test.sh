#!/usr/bin/env bash
# Tutorial test: docs/guides/heartbeat.md
source "$(dirname "$0")/lib.sh"
page docs/guides/heartbeat.md

onboard
gateway_start

# How heartbeat works: one system-owned job per agent
run -e 'Heartbeat \(main\)' "openclaw cron list --all"

# Quick setup
config_block 1
run "openclaw config set commands.ownerAllowFrom '[\"telegram:123456789\"]'"
skip "openclaw gateway restart" "needs an installed service; the running Gateway reloads config itself"
run "openclaw cron list --all"
capture jobId "openclaw cron list --all --json" '(j.jobs||j).find(x=>/Heartbeat \(main\)/.test(x.name||x.displayName||"")).id'
run "openclaw cron scratch <jobId> --set \"- Anything urgent..."
skip "openclaw system event --text \"Check for urgent follow-ups\" --mode now" "wakes a heartbeat turn: needs a model provider key"
run "openclaw system heartbeat last"

# Monitor scratch
run -e 'Anything urgent' "openclaw cron scratch <jobId>"
run "openclaw cron scratch <jobId> --set \"...\""
setup "write checklist.md" "printf -- '- If a task is blocked, say what is missing.\n' > checklist.md"
run "openclaw cron scratch <jobId> --file checklist.md"
setup -e 'blocked' "scratch now holds the file" "openclaw cron scratch $PH_jobId"
run "openclaw cron scratch <jobId> --unset"

# Migrating from HEARTBEAT.md: a legacy file is imported into scratch
setup "write a legacy HEARTBEAT.md" "printf '# Heartbeat\n\n- Check whether the nightly backup finished.\n' > ~/.openclaw/workspace/HEARTBEAT.md"
run "openclaw doctor --fix"
setup -e '^ok$' "HEARTBEAT.md was removed from the workspace" "test ! -e ~/.openclaw/workspace/HEARTBEAT.md && echo ok"
setup -e 'nightly backup' "its text is now the monitor scratch" "openclaw cron scratch $PH_jobId"
setup -e '^ok$' "the original was archived under backups/heartbeat-migration/" "ls ~/.openclaw/backups/heartbeat-migration/ | grep -q . && echo ok"

# Quiet replies and visibility
config_block 2

# Recipes: each table row is created for real (deliveries go nowhere here)
run "openclaw automations add \"every 30m\"..."
run "openclaw automations add \"every 1h\" \"List new issues..."
run "openclaw automations add \"0 8 * * *\"..."
run "openclaw automations add \"every 1h\" --name system-health..."
run "openclaw automations add \"0 6 * * 1-5\"..."
run -e 'code-health' "openclaw cron list --all"

# Cost optimization
config_block 3

# Multi-agent heartbeat: validated, not applied (it adds an ops agent and workspace)
config_block 4 --dry-run

# Debugging
skip "openclaw logs --follow" "streams until interrupted"
run "openclaw system heartbeat last --json"
run "openclaw cron list --all"
run "openclaw cron runs <jobId> --limit 10"
run "openclaw cron runs <jobId> --status skipped"
run "openclaw config validate"

# Complete configuration reference: validated, not applied
config_block 5 --dry-run

finish
