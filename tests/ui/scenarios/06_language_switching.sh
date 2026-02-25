#!/usr/bin/env bash

set -euo pipefail

source "$ROOT_DIR/tests/ui/helpers/browser.sh"
source "$ROOT_DIR/tests/ui/helpers/assert.sh"

ui_set_viewport "${TARGET:-desktop}"
ui_open_app "${APP_URL:-http://127.0.0.1:4173}"

has_shell="$(ab eval 'String(Boolean(document.querySelector("[data-testid=\"app-shell\"]")))')"
if [[ "$has_shell" == "true" || "$has_shell" == "\"true\"" ]]; then
  ui_sign_out
fi

ui_wait_for_testid "onboarding-screen"
ui_click_testid "onboarding-language-trigger"
ui_wait_for_testid "onboarding-language-menu"

language_menu_text="$(ab eval 'document.querySelector("[data-testid=\"onboarding-language-menu\"]")?.innerText ?? ""')"
assert_contains "$language_menu_text" "🇺🇸" "Onboarding language menu should show English flag."
assert_contains "$language_menu_text" "🇵🇹" "Onboarding language menu should show Portuguese flag."
assert_contains "$language_menu_text" "🇪🇸" "Onboarding language menu should show Spanish flag."

ui_click_testid "lang-option-pt-PT"
ab wait 250 >/dev/null

onboarding_text="$(ui_get_body_text)"
assert_contains "$onboarding_text" "Compras organizadas sem confusão." "Onboarding should render Portuguese text after selecting Portuguese."

ui_click_testid "test-login"
ui_wait_for_testid "app-shell"
ui_wait_for_testid "add-input"

ui_click_testid "account-menu-trigger"
ui_wait_for_testid "account-menu"
ui_click_testid "account-lang-option-es-ES"
ab wait 300 >/dev/null

shell_text_es="$(ui_get_body_text)"
assert_contains "$shell_text_es" "Tu lista de compras móvil" "App shell should render Spanish subtitle after switching language."

ui_click_testid "account-menu-trigger"
ui_wait_for_testid "account-menu"
ui_click_testid "account-lang-option-en-US"
ab wait 300 >/dev/null

shell_text_en="$(ui_get_body_text)"
assert_contains "$shell_text_en" "Your mobile shopping list" "App shell should render English subtitle after switching back to English."
