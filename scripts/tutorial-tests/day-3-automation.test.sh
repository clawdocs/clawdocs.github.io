#!/usr/bin/env bash
# Tutorial test: docs/guides/first-7-days/day-3-automation.md
source "$(dirname "$0")/lib.sh"
page docs/guides/first-7-days/day-3-automation.md

onboard
gateway_start

# Before you start: where messages go
run "openclaw config set commands.ownerAllowFrom '[\"telegram:123456789\"]'"

# Your first automation (CLI form). Delivery targets a Telegram chat that does
# not exist here; creating and listing the job must still work.
run -e 'Morning brief' "openclaw cron add \"0 8 * * 1-5\"..."
run -e 'Morning brief' "openclaw cron list"
capture jobId "openclaw cron list --json" '(j.jobs||j).find(x=>x.name==="Morning brief").id'
skip "openclaw cron run <jobId> --wait" "runs the job's prompt: needs a model provider key"

# Practical automation ideas: each one is created for real
run "openclaw cron add \"0 8 * * *\"..."
run "openclaw cron add \"every 2h\" \"Check github.com/myorg/myrepo..."
run "openclaw cron add \"0 * * * *\"..."
run "openclaw cron add \"every 2h\" \"Check the current BTC..."
run "openclaw cron add \"0 21 * * *\"..."
run "openclaw cron add \"0 18 * * 0\"..."
run -e 'Weekly summary' "openclaw cron list --all"

# The heartbeat monitor
config_block 1
run "openclaw config validate"
capture heartbeatJobId "openclaw cron list --all --json" '(j.jobs||j).find(x=>/Heartbeat/.test(x.displayName||x.name||"")).id'
run "openclaw cron scratch <heartbeatJobId> --set \"If a background job..."
setup -e 'background job' "scratch reads back" "openclaw cron scratch <heartbeatJobId>"

# Model choice and cost
run "openclaw gateway usage-cost --days 7"

# Managing automations
run -e 'Morning brief' "openclaw cron list"
run -e 'Morning brief' "openclaw cron show <jobId>"
run "openclaw cron disable <jobId>"
run "openclaw cron enable <jobId>"
skip "openclaw cron edit <jobId>" "no fields given on the page; see the cron edit reference"

# Debugging
run "openclaw cron status"
run "openclaw cron runs <jobId>"
skip "openclaw cron run <jobId> --wait" "runs the job's prompt: needs a model provider key"
run "openclaw system heartbeat last"
skip "openclaw system event --text \"Check whether my backup finished\" --mode now" "wakes a heartbeat turn: needs a model provider key"
skip "openclaw logs --follow" "streams until interrupted"
run "openclaw gateway status"
run "openclaw cron rm <jobId>"
setup -e '^gone$' "the job is gone" "openclaw cron list --all --json | grep -q '\"<jobId>\"' && echo still-there || echo gone"

finish
