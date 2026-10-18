#!/usr/bin/env bash
# Tutorial test: docs/guides/first-7-days/day-7-production.md
source "$(dirname "$0")/lib.sh"
page docs/guides/first-7-days/day-7-production.md

onboard
skip "openclaw update" "would replace the pinned version under test"
skip "openclaw plugins update --all" "nothing installed from a registry on a fresh install; covered by the upgrade section skip"

# A baseline config: the token comes from ~/.openclaw/.env, as the comment says
setup "put the Gateway token in ~/.openclaw/.env" \
  "printf 'OPENCLAW_GATEWAY_TOKEN=%s\n' '$TT_TOKEN' > ~/.openclaw/.env && chmod 600 ~/.openclaw/.env"
config_block 1
setup -e 'OPENCLAW_GATEWAY_TOKEN' "openclaw.json no longer holds the token itself" "grep -o 'OPENCLAW_GATEWAY_TOKEN' ~/.openclaw/openclaw.json && ! grep -qF '$TT_TOKEN' ~/.openclaw/openclaw.json"
run "openclaw config validate"
gateway_start
skip "openclaw gateway restart" "needs an installed service; CI started the Gateway with the new config instead"
run -e 'ask' "openclaw approvals get"
run -x 0,1 "openclaw security audit --deep"
run "openclaw security audit --fix"
run "openclaw secrets audit --check"

# Cost check
run "openclaw gateway usage-cost"
run "openclaw gateway usage-cost --days 7 --all-agents"

# Monitoring
run "openclaw status"
run "openclaw status --deep"
run "openclaw gateway status"
run "openclaw doctor"
skip "openclaw logs --follow" "streams until interrupted"
run -e 'Daily self-check' "openclaw cron add \"30 7 * * *\"..."

# Backups
run "mkdir -p ~/Backups/openclaw"
run -e 'erif' "openclaw backup create --output ~/Backups/openclaw --verify"
capture archive "ls -t ~/Backups/openclaw/*.tar.gz | head -1 | xargs -n1 basename | sed 's/\\.tar\\.gz\$//' | node -e 'process.stdout.write(JSON.stringify([require(\"fs\").readFileSync(0,\"utf8\").trim()]))'" 'j[0]'
setup "openclaw backup verify <archive> (inline on the page)" "openclaw backup verify ~/Backups/openclaw/<archive>.tar.gz"

# Upgrades
run "openclaw backup create --output ~/Backups/openclaw --verify"
run "openclaw update status"
skip "gh release view --repo openclaw/openclaw" "GitHub CLI call, not OpenClaw; needs a GH token"
run "openclaw update --dry-run"
skip "openclaw update" "would replace the pinned version under test"
skip "openclaw plugins update --all" "would update bundled plugins away from the pin"
run "openclaw skills update --all"
run "openclaw doctor"
run "openclaw status --deep"
skip "openclaw gateway stop" "stops the installed service; CI stops its foreground Gateway at the end"
run -e 'restore|Restore' "openclaw backup restore ~/Backups/openclaw/<archive>.tar.gz --target ~/openclaw-restore"
setup -e '^ok$' "restore wrote a staging copy" "test -d ~/openclaw-restore && echo ok"

finish
