#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

if [[ "${TARGET:-desktop}" == "mobile" ]]; then
  echo "[INFO] Skipping error-path add failure scenario on mobile target."
  exit 0
fi

ui_set_viewport "${TARGET:-desktop}"
ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_wait_for_testid "add-input"

# Force Firestore writes to fail and validate UI behavior.
ab network route "**localhost:8080/**" --abort >/dev/null

ui_fill_testid "add-input" "Papaya"
ui_click_testid "add-submit"
ab wait 500 >/dev/null

input_value="$(ab eval 'document.querySelector("[data-testid=\"add-input\"]")?.value ?? "__missing__"')"
assert_equals "$input_value" "Papaya" "Input value should be preserved when add request fails."

console_logs="$(ab console)"
assert_contains "$console_logs" "transport errored" "Error path should report Firestore transport failure."

ab network unroute >/dev/null
