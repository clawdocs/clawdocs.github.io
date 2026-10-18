#!/usr/bin/env bash
# Tutorial test: docs/getting-started/quick-start.md
source "$(dirname "$0")/lib.sh"
page docs/getting-started/quick-start.md

# Step 1: Install
skip "curl -fsSL https://openclaw.ai/install.sh | bash" "installer script installs @latest and starts interactive onboarding; CI tests the npm path with the pin"
run_as -t 300 "npm install -g openclaw@latest --allow-scripts=openclaw" \
  "npm install -g openclaw@$TT_PIN --allow-scripts=openclaw --no-audit --no-fund && \"\$(npm prefix -g)/bin/openclaw\" --version | grep -F $TT_PIN"

# Step 2: Onboard (interactive on the page; CI uses the non-interactive form, no service, no model auth)
run_as "openclaw onboard --install-daemon" \
  "openclaw onboard --non-interactive --accept-risk --mode local --auth-choice skip --gateway-bind loopback --gateway-auth token --skip-daemon --skip-health --skip-channels --skip-search --skip-skills --skip-ui --json"
setup -e '^ok$' "workspace and config exist where the page says" \
  "test -f ~/.openclaw/openclaw.json && test -f ~/.openclaw/workspace/SOUL.md && test -f ~/.openclaw/workspace/AGENTS.md && openclaw config get gateway.auth.mode | grep -q token && echo ok"
gateway_start

# Step 3: Check the Gateway
run -e '18789' "openclaw gateway status"
config_block 1 --dry-run          # port 18790 example: validated, not applied
skip "openclaw gateway restart" "needs an installed service (launchd/systemd); CI runs the Gateway in the foreground"

# Step 4: Chat
skip "openclaw dashboard" "opens a browser"
run -e 'http://127\.0\.0\.1:18789' "openclaw dashboard --no-open"
skip "openclaw tui" "interactive terminal UI"
skip "openclaw agent --agent main --message \"What files are in my home directory?\"" "needs a model provider key"

# Step 5: Execution approval
run "openclaw config set tools.exec.mode ask"
run "openclaw approvals get"

# Step 6: Personalize
skip "vim ~/.openclaw/workspace/SOUL.md" "interactive editor; CI writes the page's SOUL.md block instead"
file_block "~/.openclaw/workspace/SOUL.md"

# Step 7: Channels
skip "openclaw channels add telegram" "needs a Telegram bot token"
skip "openclaw channels add whatsapp" "needs a phone to scan the QR code"
skip "openclaw channels add discord" "needs a Discord bot token"
skip "openclaw pairing list telegram" "needs a configured channel"
skip "openclaw pairing approve telegram <code>" "needs a pairing code from a real DM"

# Step 8: Heartbeat and scheduled tasks
config_block 2
run -e 'Morning brief' "openclaw cron add --name \"Morning brief\" --cron \"0 9 * * *\"..."
run -e 'Heartbeat \(main\)' "openclaw cron list --all"
capture jobId "openclaw cron list --all --json" '(j.jobs||j).find(x=>/Heartbeat/.test(x.displayName||x.name||"")).id'
run "openclaw cron scratch <jobId> --set \"...\""

# Verify your setup
run -e "$TT_PIN" "openclaw --version"
run "openclaw doctor"
run -e '18789' "openclaw gateway status"
run "openclaw status"
skip "openclaw agent --agent main --message \"Hello! Tell me what you can do.\"" "needs a model provider key"
run "openclaw channels list"
run "openclaw system heartbeat last"

# Common gotchas
run "openclaw config validate"
run "openclaw models status"

finish
