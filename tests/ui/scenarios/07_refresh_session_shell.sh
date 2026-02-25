#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

ui_set_viewport "${TARGET:-desktop}"
ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_login_test_user

# Refresh the app and ensure it resolves directly back to authenticated shell.
ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_wait_for_testid "app-shell"

onboarding_visible="$(ab eval 'String(Boolean(document.querySelector("[data-testid=\"onboarding-screen\"]")))')"
loading_visible="$(ab eval 'String(Boolean(document.querySelector("[data-testid=\"auth-loading\"]")))')"

assert_equals "$onboarding_visible" "false" "Onboarding should not remain visible after refreshing an authenticated session."
assert_equals "$loading_visible" "false" "Auth loading skeleton should disappear once authenticated shell is ready."
