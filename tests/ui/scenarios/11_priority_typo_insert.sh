#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

ui_set_viewport "${TARGET:-desktop}"
UI_FIREBASE_PROJECT_ID="${UI_FIREBASE_PROJECT_ID:-demo-shopping-list}" \
UI_FIRESTORE_EMULATOR_HOST="${UI_FIRESTORE_EMULATOR_HOST:-localhost}" \
UI_FIRESTORE_EMULATOR_PORT="${UI_FIRESTORE_EMULATOR_PORT:-8080}" \
UI_AUTH_EMULATOR_HOST="${UI_AUTH_EMULATOR_HOST:-localhost}" \
UI_AUTH_EMULATOR_PORT="${UI_AUTH_EMULATOR_PORT:-9099}" \
node "$ROOT_DIR/tests/ui/scripts/firestore-data.mjs" seed-priority-typo-insert >/dev/null

ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_login_test_user

ui_fill_testid "add-input" "Canned Tuna"
ui_click_testid "add-submit"
ab wait 600 >/dev/null

ordered_check="$(ab eval '(() => { const rows = [...document.querySelectorAll("[data-testid^=\"active-row-\"] [data-testid^=\"item-text-\"]")].map((el) => el.textContent?.trim() ?? ""); const coffee = rows.findIndex((value) => value.includes("Coffee")); const tuna = rows.findIndex((value) => value.includes("Canned Tuna")); const yogurt = rows.findIndex((value) => value.includes("Yogurt")); return String(coffee !== -1 && tuna !== -1 && yogurt !== -1 && coffee < tuna && tuna < yogurt); })()')"
assert_equals "$ordered_check" "true" "Canned Tuna should use the learned priority from the typo variant and insert between Coffee and Yogurt."
