#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
UI_DIR="$ROOT_DIR/tests/ui"
HELPERS_DIR="$UI_DIR/helpers"
ARTIFACTS_DIR="$UI_DIR/artifacts"

source "$HELPERS_DIR/browser.sh"
source "$HELPERS_DIR/assert.sh"

UI_RUN_ID="${UI_RUN_ID:-$(date +%Y%m%d-%H%M%S)}"
UI_BROWSER_SESSION="${UI_BROWSER_SESSION:-shopping-ui-tests}"
UI_RUN_ARTIFACT_DIR=""

log_info() {
  echo "[INFO] $*"
}

log_warn() {
  echo "[WARN] $*"
}

log_error() {
  echo "[ERROR] $*" >&2
}

log_success() {
  echo "[PASS] $*"
}

init_ui_test_run() {
  local target="$1"
  UI_RUN_ARTIFACT_DIR="$ARTIFACTS_DIR/$UI_RUN_ID/$target"
  mkdir -p "$UI_RUN_ARTIFACT_DIR"
}

capture_failure_artifacts() {
  local scenario_name="$1"
  local scenario_artifacts="$UI_RUN_ARTIFACT_DIR/$scenario_name"

  mkdir -p "$scenario_artifacts"

  ab screenshot "$scenario_artifacts/failure.png" || true
  ab snapshot -i > "$scenario_artifacts/failure.snapshot.txt" || true
  ab get text body > "$scenario_artifacts/body.txt" || true
  ab console > "$scenario_artifacts/console.txt" || true
  ab errors > "$scenario_artifacts/errors.txt" || true
}

run_ui_scenario() {
  local scenario_path="$1"
  local target="$2"
  local scenario_name
  scenario_name="$(basename "$scenario_path" .sh)"

  log_info "Running scenario: $scenario_name"

  if TARGET="$target" ROOT_DIR="$ROOT_DIR" UI_RUN_ARTIFACT_DIR="$UI_RUN_ARTIFACT_DIR" UI_BROWSER_SESSION="$UI_BROWSER_SESSION" bash "$scenario_path"; then
    log_success "$scenario_name"
    return 0
  fi

  log_error "$scenario_name failed. Capturing browser artifacts."
  capture_failure_artifacts "$scenario_name"
  return 1
}

close_browser_session() {
  ab close >/dev/null 2>&1 || true
}
