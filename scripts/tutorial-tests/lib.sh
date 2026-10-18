# lib.sh: shared helpers for tutorial tests. Source it from a *.test.sh file.
#
# A test names its page, then walks it in order:
#
#   page docs/getting-started/quick-start.md
#   onboard                               # CI stand-in for the page's onboarding
#   gateway_start                         # loopback + token, in the background
#   run "openclaw gateway status"         # a command copied from the page
#   run "openclaw cron add \"0 8 * * *\"..."   # "..." = the one page command with this prefix
#   config_block 1                        # 1st openclaw.json block: patch + validate
#   file_block "~/.openclaw/workspace/SOUL.md"
#   skip "openclaw tui" "interactive terminal UI"
#   finish
#
# `run` and `skip` look the command up on the page (whitespace-insensitive) and
# fail if it is not there, so a test cannot drift from its page silently. The
# command that runs is the page's text, with <placeholders> filled from
# `ph name value`. Every process gets a throwaway HOME, so `~/.openclaw/...`
# on the page means the sandbox.
#
# Env: OPENCLAW_BIN   pinned binary (default tools/openclaw/node_modules/.bin/openclaw)
#      TT_OUT         where <slug>.json results go (default ./tutorial-report)
#      TT_DRY=1       only check that every run/skip/block exists on the page; run nothing
#      TT_ALLOW_GATEWAY=1  allow gateway_start outside GitHub Actions (off by default:
#                     never start a Gateway on a workstation by accident)

set -uo pipefail

TT_LIB_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
TT_ROOT=$(cd "$TT_LIB_DIR/../.." && pwd)
TT_OUT=${TT_OUT:-$TT_ROOT/tutorial-report}
TT_DRY=${TT_DRY:-0}
TT_PIN=$(tr -d '[:space:]' < "$TT_ROOT/scripts/openclaw-version.txt")
TT_STEP_TIMEOUT=${TT_STEP_TIMEOUT:-120}
TT_GW_PID=
TT_N=0

if [[ -n "${OPENCLAW_BIN:-}" ]]; then TT_BIN=$OPENCLAW_BIN
elif [[ -x "$TT_ROOT/tools/openclaw/node_modules/.bin/openclaw" ]]; then TT_BIN=$TT_ROOT/tools/openclaw/node_modules/.bin/openclaw
else TT_BIN=$(command -v openclaw || true)
fi

_tt() { node "$TT_LIB_DIR/tt.mjs" "$@"; }
_gh() { [[ "${GITHUB_ACTIONS:-}" == "true" ]]; }
_group() { if _gh; then echo "::group::$*"; else echo "--- $*"; fi; }
_endgroup() { if _gh; then echo "::endgroup::"; fi; }

# _record kind status line cmd reason seconds exit
_record() {
  local json
  json=$(node -e 'const [kind,status,line,cmd,reason,secs,exit]=process.argv.slice(1);
    process.stdout.write(JSON.stringify({kind,status,line:line?Number(line):null,cmd,reason:reason||null,seconds:secs?Number(secs):null,exit:exit===""?null:Number(exit)}))' \
    "$1" "$2" "$3" "$4" "$5" "${6:-}" "${7:-}")
  _tt record "$TT_STEPS" "$json"
  local mark=$2; [[ $2 == pass ]] && mark=ok
  printf '[%s] %s%s%s\n' "$mark" "${3:+L$3 }" "${4%%$'\n'*}" "${5:+  ($5)}"
}

page() {
  TT_PAGE=$1
  TT_SLUG=$(sed 's#^docs/##; s#\.mdx\{0,1\}$##; s#/#__#g' <<< "$1")
  mkdir -p "$TT_OUT"
  TT_WORK=$(mktemp -d "${TMPDIR:-/tmp}/tt-$TT_SLUG.XXXXXX")
  (cd "$TT_ROOT" && node "$TT_LIB_DIR/extract.mjs" "$TT_PAGE") > "$TT_WORK/page.json" || { echo "cannot read $TT_PAGE"; exit 2; }
  TT_STEPS=$TT_WORK/steps.jsonl; : > "$TT_STEPS"
  [[ -n "$TT_BIN" || "$TT_DRY" == 1 ]] || { echo "openclaw binary not found (set OPENCLAW_BIN)"; exit 2; }

  # Sandbox: the page's ~ is this directory.
  export HOME=$TT_WORK/home
  export OPENCLAW_STATE_DIR=$HOME/.openclaw
  export OPENCLAW_CONFIG_PATH=$HOME/.openclaw/openclaw.json
  export OPENCLAW_DISABLE_UPDATE_CHECK=1 NO_COLOR=1 FORCE_COLOR=0 COLUMNS=200
  unset OPENCLAW_GATEWAY_TOKEN OPENCLAW_GATEWAY_PASSWORD ANTHROPIC_API_KEY OPENAI_API_KEY
  mkdir -p "$HOME" "$TT_WORK/bin"
  [[ -n "$TT_BIN" ]] && ln -sf "$TT_BIN" "$TT_WORK/bin/openclaw"
  export PATH=$TT_WORK/bin:$PATH
  cd "$HOME" || exit 2
  trap _tt_cleanup EXIT
  echo "== $TT_PAGE (OpenClaw $TT_PIN$([[ $TT_DRY == 1 ]] && echo ", dry run"))"
}

_tt_cleanup() { gateway_stop quiet; }

# ph name value: fill <name> in page commands
ph() { printf -v "PH_$1" '%s' "$2"; export "PH_$1"; }

_fill() {
  local text=$1 name var
  while [[ $text =~ \<([A-Za-z][A-Za-z0-9_]*)\> ]]; do
    name=${BASH_REMATCH[1]}; var=PH_$name
    if [[ -z "${!var:-}" ]]; then echo "__MISSING__$name"; return 1; fi
    text=${text//<$name>/${!var}}
  done
  printf '%s' "$text"
}

# _exec kind line label cmd codes expect timeout
_exec() {
  local kind=$1 line=$2 label=$3 cmd=$4 codes=$5 expect=$6 t=$7
  TT_N=$((TT_N + 1))
  if [[ "$TT_DRY" == 1 ]]; then _record "$kind" pass "$line" "$label" "dry run" 0 0; return 0; fi
  local out=$TT_WORK/out.$TT_N start=$SECONDS rc status=pass reason=
  _group "L${line:-?} $label"
  printf '$ %s\n' "$cmd"
  (cd "$HOME" && timeout "$t" bash -c "$cmd" < /dev/null) > "$out" 2>&1
  rc=$?
  head -c 20000 "$out"; echo
  _endgroup
  if [[ $rc == 124 ]]; then status=fail; reason="timed out after ${t}s"
  elif [[ ",$codes," != *",$rc,"* ]]; then status=fail; reason="exit $rc (expected $codes): $(grep -v '^\s*$' "$out" | tail -n 3 | tr '\n' ' ' | cut -c1-300)"
  elif [[ -n "$expect" ]] && ! grep -Eq -- "$expect" "$out"; then status=fail; reason="output did not match /$expect/"
  fi
  TT_LAST_OUT=$out
  _record "$kind" "$status" "$line" "$label" "$reason" $((SECONDS - start)) "$rc"
  [[ $status == pass ]]
}

_opts() {
  TT_CODES=0; TT_EXPECT=; TT_T=$TT_STEP_TIMEOUT
  while [[ $# -gt 1 ]]; do
    case $1 in
      -x) TT_CODES=$2; shift 2 ;;
      -e) TT_EXPECT=$2; shift 2 ;;
      -t) TT_T=$2; shift 2 ;;
      *) break ;;
    esac
  done
  TT_ARG=$1
}

# run [-x 0,1] [-e regex] [-t secs] "<command as on the page>"
run() {
  _opts "$@"
  local hit line src text cmd
  if ! hit=$(_tt resolve "$TT_WORK/page.json" "$TT_ARG" "$TT_STEPS" 2>&1); then
    _record page fail "" "$TT_ARG" "$hit"; return 1
  fi
  { read -r line; read -r src; text=$(cat); } <<< "$hit"
  if ! cmd=$(_fill "$text"); then
    _record page fail "$line" "$text" "no value for placeholder <${cmd#__MISSING__}>"; return 1
  fi
  _exec page "$line" "$text" "$cmd" "$TT_CODES" "$TT_EXPECT" "$TT_T"
}

# run_as [-x ..] [-e ..] "<command as on the page>" "<what CI runs instead>"
# For page steps that need a CI-safe variant (non-interactive flags, the pinned
# version instead of @latest). Recorded against the page line, with both texts.
run_as() {
  _opts "$@"; local q=$TT_ARG; shift $(($# - 1)); local cmd=$1
  local hit line src text
  if ! hit=$(_tt resolve "$TT_WORK/page.json" "$q" "$TT_STEPS" 2>&1); then
    _record page fail "" "$q" "$hit"; return 1
  fi
  { read -r line; read -r src; text=$(cat); } <<< "$hit"
  _exec page "$line" "$text  [CI: $cmd]" "$cmd" "$TT_CODES" "$TT_EXPECT" "$TT_T"
}

# skip "<command as on the page>" "<why it cannot run in CI>"
skip() {
  local hit line src text
  if ! hit=$(_tt resolve "$TT_WORK/page.json" "$1" "$TT_STEPS" 2>&1); then
    _record page fail "" "$1" "skip target $hit"; return 1
  fi
  { read -r line; read -r src; text=$(cat); } <<< "$hit"
  _record page skip "$line" "$text" "$2"
}

# skip_step "<page step that is not a command>" "<why>"
skip_step() { _record page skip "" "$1" "$2"; }

# setup [-x codes] [-e regex] "<label>" "<command>": CI scaffolding, not from
# the page. <placeholders> are filled as in run.
setup() {
  _opts "$@"; local label=$TT_ARG; shift $(($# - 1)); local cmd=$1
  [[ "$label" == "$cmd" ]] && { echo "setup needs a label and a command"; return 1; }
  local filled
  if ! filled=$(_fill "$cmd"); then
    _record setup fail "" "$label" "no value for placeholder <${filled#__MISSING__}>"; return 1
  fi
  _exec setup "" "$label" "$filled" "$TT_CODES" "$TT_EXPECT" "$TT_T"
}

# config_block N [--dry-run]: merge the page's Nth openclaw.json block into the
# sandbox config with `openclaw config patch` (as the page says: merge, don't
# replace), then `openclaw config validate`. --dry-run validates the merge
# without writing it (for reference blocks that are not meant to be applied).
config_block() {
  local n=$1 mode=${2:-} hit line title body f
  if ! hit=$(_tt block "$TT_WORK/page.json" "config:$n" 2>&1); then
    _record page fail "" "config block #$n" "$hit"; return 1
  fi
  { read -r line; read -r title; body=$(cat); } <<< "$hit"
  f=$TT_WORK/block-L$line.json5
  printf '%s\n' "$body" > "$f"
  _exec page "$line" "config block #$n ($title)${mode:+ $mode}" \
    "openclaw config patch --file '$f' $mode && openclaw config validate" 0 "" "$TT_STEP_TIMEOUT"
}

# file_block "<fence title>": write that block to its path (~ = sandbox HOME)
file_block() {
  local hit line title body dest
  if ! hit=$(_tt block "$TT_WORK/page.json" "title:$1" 2>&1); then
    _record page fail "" "write $1" "$hit"; return 1
  fi
  { read -r line; read -r title; body=$(cat); } <<< "$hit"
  dest=${title/#\~/$HOME}
  if [[ "$TT_DRY" == 1 ]]; then _record page pass "$line" "write $title" "dry run"; return 0; fi
  mkdir -p "$(dirname "$dest")" && printf '%s\n' "$body" > "$dest"
  _record page pass "$line" "write $title" "" 0 0
}

# onboard: non-interactive stand-in for the page's interactive onboarding.
# No model credentials (--auth-choice skip), no service, loopback + token.
onboard() {
  TT_TOKEN=$(node -e 'process.stdout.write(require("crypto").randomBytes(24).toString("hex"))')
  setup -e '"ok": true' "onboard (non-interactive, no model auth)" \
    "openclaw onboard --non-interactive --accept-risk --mode local --auth-choice skip \
      --gateway-bind loopback --gateway-auth token --gateway-token $TT_TOKEN \
      --skip-daemon --skip-health --skip-channels --skip-search --skip-skills --skip-ui --json"
}

# gateway_start: `openclaw gateway run` in the background (the CI stand-in for
# the installed service), then wait for `openclaw health`.
gateway_start() {
  [[ "$TT_DRY" == 1 ]] && { _record setup pass "" "gateway start" "dry run"; return 0; }
  if ! _gh && [[ "${TT_ALLOW_GATEWAY:-}" != 1 ]]; then
    _record setup fail "" "gateway start" "refusing to start a Gateway outside GitHub Actions (set TT_ALLOW_GATEWAY=1)"; return 1
  fi
  local start=$SECONDS ok=
  (cd "$HOME" && exec openclaw gateway run --bind loopback < /dev/null > "$TT_WORK/gateway.log" 2>&1) &
  TT_GW_PID=$!
  for _ in $(seq 1 90); do
    if openclaw health --json > "$TT_WORK/health.json" 2>&1; then ok=1; break; fi
    kill -0 "$TT_GW_PID" 2> /dev/null || break
    sleep 1
  done
  if [[ -n $ok ]]; then
    _record setup pass "" "gateway start (openclaw gateway run, loopback, token auth)" "" $((SECONDS - start)) 0
  else
    _group "gateway.log"; tail -n 80 "$TT_WORK/gateway.log"; cat "$TT_WORK/health.json"; _endgroup
    _record setup fail "" "gateway start (openclaw gateway run, loopback, token auth)" "no healthy Gateway after $((SECONDS - start))s" $((SECONDS - start)) 1
    return 1
  fi
}

gateway_stop() {
  [[ -z "$TT_GW_PID" ]] && return 0
  local pid=$TT_GW_PID; TT_GW_PID=
  kill "$pid" 2> /dev/null
  for _ in $(seq 1 20); do kill -0 "$pid" 2> /dev/null || break; sleep 1; done
  kill -9 "$pid" 2> /dev/null
  [[ "${1:-}" == quiet ]] && return 0
  _group "gateway.log (tail)"; tail -n 40 "$TT_WORK/gateway.log"; _endgroup
  _record setup pass "" "gateway stop" "" 0 0
}

# json_get '<js expr on j>': read JSON (after any leading noise) from stdin
json_get() {
  node -e 'const s=require("fs").readFileSync(0,"utf8");const i=s.search(/[\[{]/);const j=JSON.parse(s.slice(i));const v=eval(process.argv[1]);if(v===undefined||v===null)process.exit(1);process.stdout.write(String(v))' "$1"
}

# capture name "<command>" '<js expression on j>': run a command that prints
# JSON, evaluate the expression and store it as <name> (see ph).
capture() {
  local name=$1 cmd=$2 expr=$3 v out=$TT_WORK/capture.$1
  if [[ "$TT_DRY" == 1 ]]; then ph "$name" "DRY-$name"; return 0; fi
  bash -c "$cmd" < /dev/null > "$out" 2>&1
  if v=$(json_get "$expr" < "$out" 2> /dev/null) && [[ -n "$v" ]]; then
    ph "$name" "$v"; _record setup pass "" "capture <$name> from: $cmd" "" 0 0
  else
    _group "capture <$name> output"; head -c 4000 "$out"; echo; _endgroup
    _record setup fail "" "capture <$name> from: $cmd" "expression $expr found nothing"; return 1
  fi
}

finish() {
  gateway_stop
  cd "$TT_ROOT" || true
  _tt finish "$TT_WORK/page.json" "$TT_STEPS" "$TT_OUT/$TT_SLUG.json" "$TT_PIN"
  local ok
  ok=$(node -e 'process.stdout.write(String(require(process.argv[1]).ok))' "$TT_OUT/$TT_SLUG.json")
  [[ "$ok" == true ]] && exit 0 || exit 1
}
