#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

ui_set_viewport "${TARGET:-desktop}"
ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_wait_for_testid "add-input"

# Reorder active items by dragging Bread above Milk.
ab drag "[data-testid=\"drag-handle-bread\"]" "[data-testid=\"drag-handle-milk\"]" >/dev/null
ab wait 800 >/dev/null

first_before_reload="$(ab eval 'document.querySelector("[data-testid^=\"active-row-\"] [data-testid^=\"item-text-\"]")?.textContent?.trim() ?? ""')"
assert_contains "$first_before_reload" "Bread" "Bread should move to the first active position after drag."

ab reload >/dev/null
ui_wait_for_testid "add-input"
ab wait 500 >/dev/null

first_after_reload="$(ab eval 'document.querySelector("[data-testid^=\"active-row-\"] [data-testid^=\"item-text-\"]")?.textContent?.trim() ?? ""')"
assert_contains "$first_after_reload" "Bread" "Dragged order should persist after reload."

page_text="$(ui_get_body_text)"
assert_contains "$page_text" "Completed" "Completed section should still exist after reordering active items."
