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
