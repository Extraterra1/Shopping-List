#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

ui_set_viewport "${TARGET:-desktop}"
ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_wait_for_testid "add-input"

# Edit existing active item and save a custom emoji preference.
ui_click_testid "edit-item-milk"
ui_fill_testid "edit-name-input-milk" "Matcha Tea"
ui_fill_testid "edit-emoji-input-milk" "🍵"
ui_click_testid "save-edit-milk"
ab wait 500 >/dev/null

page_text="$(ui_get_body_text)"
assert_contains "$page_text" "🍵 Matcha Tea" "Edited item should show updated name and emoji."

# Add same product name in lowercase; it should reuse learned custom emoji.
ui_fill_testid "add-input" "matcha tea"
ui_click_testid "add-submit"
ab wait 500 >/dev/null

page_text="$(ui_get_body_text)"
assert_contains "$page_text" "🍵 Matcha tea" "New item with learned name should reuse custom emoji."

# Delete completed item.
assert_contains "$page_text" "🥚 Eggs" "Baseline completed item should exist before delete."
ui_click_testid "delete-item-eggs"
ab wait 500 >/dev/null

page_text="$(ui_get_body_text)"
assert_not_contains "$page_text" "🥚 Eggs" "Completed item should be removed after delete."
