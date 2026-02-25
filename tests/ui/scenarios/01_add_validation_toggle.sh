#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

ui_set_viewport "${TARGET:-desktop}"
ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_wait_for_testid "add-input"

# Validation: submit stays disabled for whitespace input.
ui_fill_testid "add-input" "   "
disabled_state="$(ab eval 'String(document.querySelector("[data-testid=\"add-submit\"]")?.disabled)')"
assert_equals "$disabled_state" "true" "Add submit button should stay disabled for whitespace input."

# Add flow
ui_fill_testid "add-input" "Tea"
ui_click_testid "add-submit"
ab wait 500 >/dev/null

page_text="$(ui_get_body_text)"
assert_contains "$page_text" "🍵 Tea" "Added item should be visible with mapped emoji."

input_value="$(ab eval 'document.querySelector("[data-testid=\"add-input\"]")?.value ?? "__missing__"')"
assert_equals "$input_value" "" "Input should be cleared after successful add."

# Toggle flow
ui_click_testid "item-card-bread-active"
ab wait 500 >/dev/null

bread_in_active="$(ab eval 'String(document.querySelector("[data-testid=\"active-list\"]")?.innerText?.includes("Bread") ?? false)')"
bread_in_completed="$(ab eval 'String(document.querySelector("[data-testid=\"completed-list\"]")?.innerText?.includes("Bread") ?? false)')"
assert_equals "$bread_in_active" "false" "Bread should no longer appear in the active list after toggling."
assert_equals "$bread_in_completed" "true" "Bread should move to the completed list after toggling."
