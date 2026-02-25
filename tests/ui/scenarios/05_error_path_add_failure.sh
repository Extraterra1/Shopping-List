#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

ui_set_viewport "${TARGET:-desktop}"
ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_wait_for_testid "add-input"

# Force Firestore writes to fail and validate UI behavior.
ab network route "**127.0.0.1:8080/**" --abort >/dev/null

ui_fill_testid "add-input" "Papaya"
ui_click_testid "add-submit"
ab wait 500 >/dev/null

input_value="$(ab eval 'document.querySelector("[data-testid=\"add-input\"]")?.value ?? "__missing__"')"
assert_equals "$input_value" "Papaya" "Input value should be preserved when add request fails."

page_text="$(ui_get_body_text)"
assert_not_contains "$page_text" "Papaya" "Failed add should not insert a new item."

console_logs="$(ab console)"
assert_contains "$console_logs" "Failed to add item" "Error path should emit failure log for add item."

ab network unroute >/dev/null
