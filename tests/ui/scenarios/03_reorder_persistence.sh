#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

if [[ "${TARGET:-desktop}" == "mobile" ]]; then
  echo "[INFO] Skipping reorder scenario on mobile target."
  exit 0
fi

ui_set_viewport "${TARGET:-desktop}"
UI_FIREBASE_PROJECT_ID="${UI_FIREBASE_PROJECT_ID:-demo-shopping-list}" \
UI_FIRESTORE_EMULATOR_HOST="${UI_FIRESTORE_EMULATOR_HOST:-localhost}" \
UI_FIRESTORE_EMULATOR_PORT="${UI_FIRESTORE_EMULATOR_PORT:-8080}" \
node "$ROOT_DIR/tests/ui/scripts/firestore-data.mjs" reorder-active >/dev/null

ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_login_test_user
ab wait 500 >/dev/null

first_before_reload="$(ab eval 'document.querySelector("[data-testid^=\"active-row-\"] [data-testid^=\"item-text-\"]")?.textContent?.trim() ?? ""')"
assert_contains "$first_before_reload" "Bread" "Bread should render first after order update."

ab reload >/dev/null
ui_wait_for_testid "add-input"
ab wait 500 >/dev/null

first_after_reload="$(ab eval 'document.querySelector("[data-testid^=\"active-row-\"] [data-testid^=\"item-text-\"]")?.textContent?.trim() ?? ""')"
assert_contains "$first_after_reload" "Bread" "Updated order should persist after reload."

page_text="$(ui_get_body_text)"
assert_contains "$page_text" "Completed" "Completed section should still exist after reordering active items."
