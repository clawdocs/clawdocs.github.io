#!/usr/bin/env bash
# Upgrade fixtures for docs/guides/upgrading-to-2.md.
#
# Each subdirectory is a legacy (mid-2026) OpenClaw install:
#   <fixture>/openclaw.json   the legacy config
#   <fixture>/workspace/      optional, copied to ~/.openclaw/workspace
#   <fixture>/state/          optional, copied over ~/.openclaw (legacy state files)
#
# For each fixture this script builds a throwaway HOME, runs
#   openclaw config validate --json        (before)
#   openclaw doctor --fix --non-interactive
#   openclaw config validate --json        (after)
# with the pinned OpenClaw, and saves the config before/after plus all output
# under $OUT/<fixture>/. It never touches the real HOME and never starts a
# Gateway: OPENCLAW_SERVICE_REPAIR_POLICY=external keeps Doctor away from
# service install/start/restart, and the environment is wiped (env -i) so no
# real API keys, systemd user bus or OPENCLAW_* settings leak into the run.
#
# Usage:
#   OPENCLAW_BIN=/path/to/openclaw scripts/upgrade-fixtures/run.sh [fixture...]
# OUT defaults to a new temp directory; it is printed at the end.
#
# Staged (bridge) upgrade: set BRIDGE_BIN to one or more older OpenClaw
# binaries, colon-separated, in upgrade order, e.g.
#   npm i --prefix /tmp/oc95 --no-save --ignore-scripts openclaw@2026.9.5
#   npm i --prefix /tmp/oc97 --no-save --ignore-scripts openclaw@2026.9.7
#   BRIDGE_BIN=/tmp/oc95/node_modules/.bin/openclaw:/tmp/oc97/node_modules/.bin/openclaw \
#     OPENCLAW_BIN=... run.sh d-june-everything
# Each bridge's `doctor --fix --non-interactive` runs in turn (output in
# bridge<N>-doctor.log, config in bridge<N>.json), then the pinned release's.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
OC="${OPENCLAW_BIN:-$ROOT/tools/openclaw/node_modules/.bin/openclaw}"
command -v "$OC" >/dev/null 2>&1 || { echo "openclaw not found at $OC (set OPENCLAW_BIN)" >&2; exit 2; }
OUT="${OUT:-$(mktemp -d)}"
mkdir -p "$OUT"

if [ "$#" -gt 0 ]; then FIXTURES=("$@"); else
  FIXTURES=(); for d in "$HERE"/*/; do FIXTURES+=("$(basename "$d")"); done
fi

echo "openclaw $("$OC" --version 2>/dev/null | head -1)"
for f in "${FIXTURES[@]}"; do
  src="$HERE/$f"; dst="$OUT/$f"; mkdir -p "$dst"
  T="$(mktemp -d)"; S="$T/.openclaw"; mkdir -p "$S"
  [ -d "$src/state" ] && cp -a "$src/state/." "$S/"
  [ -d "$src/workspace" ] && cp -a "$src/workspace" "$S/workspace"
  cp "$src/openclaw.json" "$S/openclaw.json"
  cp "$src/openclaw.json" "$dst/before.json"

  run() {
    env -i PATH="$PATH" LANG=C.UTF-8 TMPDIR="${TMPDIR:-/tmp}" \
      HOME="$T" OPENCLAW_STATE_DIR="$S" OPENCLAW_CONFIG_PATH="$S/openclaw.json" \
      OPENCLAW_SERVICE_REPAIR_POLICY=external OPENCLAW_NO_AUTO_UPDATE=1 NO_COLOR=1 \
      "$OC" "$@"
  }
  run config validate --json >"$dst/validate-before.json" 2>&1 || true
  set +e
  if [ -n "${BRIDGE_BIN:-}" ]; then
    OC_SAVED="$OC"; n=0
    IFS=: read -r -a BRIDGES <<<"$BRIDGE_BIN"
    for b in "${BRIDGES[@]}"; do
      n=$((n + 1)); OC="$b"
      echo "bridge: $("$OC" --version 2>/dev/null | head -1)" >"$dst/bridge$n-doctor.log"
      run doctor --fix --non-interactive >>"$dst/bridge$n-doctor.log" 2>&1
      echo "exit=$?" >>"$dst/bridge$n-doctor.log"
      cp "$S/openclaw.json" "$dst/bridge$n.json"
    done
    OC="$OC_SAVED"
  fi
  run doctor --fix --non-interactive >"$dst/doctor.log" 2>&1
  echo "exit=$?" >>"$dst/doctor.log"
  set -e
  run config validate --json >"$dst/validate-after.json" 2>&1 || true
  cp "$S/openclaw.json" "$dst/after.json"
  ( cd "$S" && find . -path '*/node_modules' -prune -o -type f -print | sort ) >"$dst/state-files.txt"
  [ -f "$S/workspace/HEARTBEAT.md" ] && echo "HEARTBEAT.md still present" >>"$dst/state-files.txt"
  rm -rf "$T"
  printf '%-22s doctor %s, valid before: %s, after: %s\n' "$f" \
    "$(tail -1 "$dst/doctor.log")" \
    "$(grep -o '"valid": *[a-z]*' "$dst/validate-before.json" | head -1 | sed 's/.*: *//')" \
    "$(grep -o '"valid": *[a-z]*' "$dst/validate-after.json" | head -1 | sed 's/.*: *//')"
done
echo "output: $OUT"
