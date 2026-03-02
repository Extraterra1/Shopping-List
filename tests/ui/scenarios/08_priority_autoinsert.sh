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
node "$ROOT_DIR/tests/ui/scripts/firestore-data.mjs" seed-priority-insert >/dev/null

ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_login_test_user

ui_fill_testid "add-input" "Whole Milk"
ui_click_testid "add-submit"
ab wait 600 >/dev/null

ordered_check="$(ab eval '(() => { const rows = [...document.querySelectorAll("[data-testid^=\"active-row-\"] [data-testid^=\"item-text-\"]")].map((el) => el.textContent?.trim() ?? ""); const deodorant = rows.findIndex((value) => value.includes("Deodorant")); const milk = rows.findIndex((value) => value.includes("Whole Milk")); const cheese = rows.findIndex((value) => value.includes("Cheese")); return String(deodorant !== -1 && milk !== -1 && cheese !== -1 && deodorant < milk && milk < cheese); })()')"
assert_equals "$ordered_check" "true" "Whole Milk should auto-insert between Deodorant and Cheese."
