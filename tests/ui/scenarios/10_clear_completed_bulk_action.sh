#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

ui_set_viewport "${TARGET:-desktop}"
ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_login_test_user

page_text="$(ui_get_body_text)"
assert_contains "$page_text" "🥚 Eggs" "Baseline completed item should exist before bulk clear."

clear_button_present="$(ab eval 'String(Boolean(document.querySelector("[data-testid=\"clear-completed-button\"]")))')"
assert_equals "$clear_button_present" "true" "Completed section should expose the bulk clear button."

initial_label="$(ab eval 'document.querySelector("[data-testid=\"clear-completed-button\"]")?.innerText ?? "__missing__"')"

ui_click_testid "clear-completed-button"
ab wait 250 >/dev/null

confirm_label="$(ab eval 'document.querySelector("[data-testid=\"clear-completed-button\"]")?.innerText ?? "__missing__"')"
if [[ "$confirm_label" == "$initial_label" ]]; then
  echo "[ASSERT] First tap should arm the clear-all action."
  echo "Expected button label to change from: $initial_label"
  echo "Actual: $confirm_label"
  exit 1
fi

completed_section_present="$(ab eval 'String(Boolean(document.querySelector("[data-testid=\"completed-section\"]")))')"
assert_equals "$completed_section_present" "true" "First tap should not clear completed items yet."

ab wait 3000 >/dev/null

reset_label="$(ab eval 'document.querySelector("[data-testid=\"clear-completed-button\"]")?.innerText ?? "__missing__"')"
assert_equals "$reset_label" "$initial_label" "Confirmation state should reset after the timeout."

ui_click_testid "clear-completed-button"
ab wait 250 >/dev/null
confirm_label="$(ab eval 'document.querySelector("[data-testid=\"clear-completed-button\"]")?.innerText ?? "__missing__"')"
if [[ "$confirm_label" == "$initial_label" ]]; then
  echo "[ASSERT] Clear-all action should arm again after timing out."
  echo "Expected button label to change from: $initial_label"
  echo "Actual: $confirm_label"
  exit 1
fi

ui_click_testid "clear-completed-button"
ab wait 500 >/dev/null

completed_section_present="true"
for _ in {1..20}; do
  completed_section_present="$(ab eval 'String(Boolean(document.querySelector("[data-testid=\"completed-section\"]")))')"
  if [[ "$completed_section_present" == "false" ]]; then
    break
  fi
  sleep 0.2
done

assert_equals "$completed_section_present" "false" "Completed section should disappear after clearing all completed items."

page_text="$(ui_get_body_text)"
assert_not_contains "$page_text" "🥚 Eggs" "Completed item should be removed after bulk clear."
