#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

ui_set_viewport "${TARGET:-desktop}"
ui_open_app "${APP_URL:-http://127.0.0.1:4173}"
ui_wait_for_testid "onboarding-screen"

onboarding_visible="$(ab is visible "[data-testid=\"onboarding-screen\"]")"
assert_equals "$onboarding_visible" "true" "Onboarding screen should be visible when user is signed out."

shell_visible_before="$(ab eval 'String(Boolean(document.querySelector("[data-testid=\"app-shell\"]")))')"
assert_equals "$shell_visible_before" "false" "App shell should not render before login."

ui_click_testid "test-login"
ui_wait_for_testid "app-shell"
ui_wait_for_testid "add-input"

shell_visible_after_login="$(ab is visible "[data-testid=\"app-shell\"]")"
assert_equals "$shell_visible_after_login" "true" "App shell should be visible after test login."

ui_click_testid "sign-out"
ui_wait_for_testid "onboarding-screen"

onboarding_after_signout="$(ab is visible "[data-testid=\"onboarding-screen\"]")"
assert_equals "$onboarding_after_signout" "true" "Onboarding screen should be visible again after sign out."
