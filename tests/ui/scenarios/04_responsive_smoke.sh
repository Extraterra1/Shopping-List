#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

ui_set_viewport "${TARGET:-desktop}"
ui_open_app "${APP_URL:-http://127.0.0.1:4173}"

ui_login_test_user
ui_wait_for_testid "product-list"

is_input_visible="$(ab is visible "[data-testid=\"add-input\"]")"
is_submit_visible="$(ab is visible "[data-testid=\"add-submit\"]")"
assert_equals "$is_input_visible" "true" "Add input should be visible."
assert_equals "$is_submit_visible" "true" "Add submit should be visible."

if [[ "${TARGET:-desktop}" == "mobile" ]]; then
  width="$(ab eval 'String(window.innerWidth)')"
  assert_equals "$width" "390" "Mobile viewport width should be applied."
fi

ui_fill_testid "add-input" "Water"
ui_click_testid "add-submit"
ab wait 500 >/dev/null

page_text="$(ui_get_body_text)"
assert_contains "$page_text" "💧 Water" "Smoke flow should add an item in the current viewport."
