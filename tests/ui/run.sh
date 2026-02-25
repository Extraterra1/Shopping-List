#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
UI_DIR="$ROOT_DIR/tests/ui"
SCENARIOS_DIR="$UI_DIR/scenarios"

TARGET="all"
if [[ "${1:-}" == "--desktop" ]]; then
  TARGET="desktop"
elif [[ "${1:-}" == "--mobile" ]]; then
  TARGET="mobile"
fi

echo "UI test harness scaffold"
echo "Target: $TARGET"

if ! compgen -G "$SCENARIOS_DIR/*.sh" > /dev/null; then
  echo "No scenarios found yet in $SCENARIOS_DIR"
  exit 0
fi

echo "Scenario execution will be added in upcoming commits."
