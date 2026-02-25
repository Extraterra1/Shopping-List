#!/usr/bin/env bash

set -euo pipefail

ab() {
  local session="${UI_BROWSER_SESSION:-shopping-ui-tests}"
  agent-browser --session "$session" "$@"
}

ui_set_viewport() {
  local target="$1"
  case "$target" in
    mobile)
      ab set viewport 390 844 >/dev/null
      ;;
    *)
      ab set viewport 1366 900 >/dev/null
      ;;
  esac
}

ui_open_app() {
  local url="${1:-http://127.0.0.1:4173}"
  ab open "$url" >/dev/null
  ab wait 500 >/dev/null
}

ui_login_test_user() {
  local has_shell
  local has_onboarding

  for _ in {1..30}; do
    has_shell="$(ab eval 'String(Boolean(document.querySelector("[data-testid=\"app-shell\"]")))')"
    if [[ "$has_shell" == "true" || "$has_shell" == "\"true\"" ]]; then
      ui_wait_for_testid "add-input"
      return 0
    fi

    has_onboarding="$(ab eval 'String(Boolean(document.querySelector("[data-testid=\"onboarding-screen\"]")))')"
    if [[ "$has_onboarding" == "true" || "$has_onboarding" == "\"true\"" ]]; then
      ui_click_testid "test-login"
      ui_wait_for_testid "app-shell"
      ui_wait_for_testid "add-input"
      return 0
    fi

    sleep 0.2
  done

  echo "[ASSERT] Unable to reach onboarding or app shell before test login."
  return 1
}

ui_wait_for_testid() {
  local testid="$1"
  ab wait "[data-testid=\"$testid\"]" >/dev/null
}

ui_click_testid() {
  local testid="$1"
  ab find testid "$testid" click >/dev/null
}

ui_fill_testid() {
  local testid="$1"
  local value="$2"
  ab find testid "$testid" fill "$value" >/dev/null
}

ui_get_body_text() {
  ab get text body
}
