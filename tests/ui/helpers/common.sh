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
UI_APP_PORT="${UI_APP_PORT:-4173}"
UI_APP_URL="${UI_APP_URL:-http://127.0.0.1:${UI_APP_PORT}}"
UI_DEV_SERVER_PID=""

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

start_app_server() {
  local log_dir="${UI_RUN_ARTIFACT_DIR:-$ARTIFACTS_DIR/$UI_RUN_ID/bootstrap}"
  mkdir -p "$log_dir"
  local log_file="$log_dir/dev-server.log"

  if command -v lsof >/dev/null 2>&1; then
    local stale_pids
    stale_pids="$(lsof -ti tcp:"$UI_APP_PORT" || true)"
    if [[ -n "$stale_pids" ]]; then
      # Clear stale dev servers so tests always hit the intended app instance.
      kill $stale_pids >/dev/null 2>&1 || true
      sleep 1
    fi
  fi

  VITE_USE_FIRESTORE_EMULATOR=true \
  VITE_FIRESTORE_EMULATOR_HOST="${UI_FIRESTORE_EMULATOR_HOST:-localhost}" \
  VITE_FIRESTORE_EMULATOR_PORT="${UI_FIRESTORE_EMULATOR_PORT:-8080}" \
  VITE_USE_AUTH_EMULATOR=true \
  VITE_AUTH_EMULATOR_HOST="${UI_AUTH_EMULATOR_HOST:-localhost}" \
  VITE_AUTH_EMULATOR_PORT="${UI_AUTH_EMULATOR_PORT:-9099}" \
  VITE_E2E_AUTH_BYPASS=true \
  VITE_TEST_USER_EMAIL="${UI_TEST_USER_EMAIL:-ui-test@example.com}" \
  VITE_TEST_USER_PASSWORD="${UI_TEST_USER_PASSWORD:-ui-test-password}" \
  VITE_FIREBASE_PROJECT_ID="${UI_FIREBASE_PROJECT_ID:-demo-shopping-list}" \
  npm run dev -- --host 127.0.0.1 --port "$UI_APP_PORT" --strictPort > "$log_file" 2>&1 &

  UI_DEV_SERVER_PID=$!

  for _ in {1..60}; do
    if curl -sf "$UI_APP_URL" > /dev/null; then
      log_info "Dev server ready at $UI_APP_URL"
      return 0
    fi
    sleep 1
  done

  log_error "Dev server did not become ready. See $log_file"
  return 1
}

stop_app_server() {
  if [[ -n "$UI_DEV_SERVER_PID" ]]; then
    kill "$UI_DEV_SERVER_PID" >/dev/null 2>&1 || true
    wait "$UI_DEV_SERVER_PID" 2>/dev/null || true
    UI_DEV_SERVER_PID=""
  fi
}

seed_test_data() {
  UI_FIREBASE_PROJECT_ID="${UI_FIREBASE_PROJECT_ID:-demo-shopping-list}" \
  UI_FIRESTORE_EMULATOR_HOST="${UI_FIRESTORE_EMULATOR_HOST:-localhost}" \
  UI_FIRESTORE_EMULATOR_PORT="${UI_FIRESTORE_EMULATOR_PORT:-8080}" \
  UI_AUTH_EMULATOR_HOST="${UI_AUTH_EMULATOR_HOST:-localhost}" \
  UI_AUTH_EMULATOR_PORT="${UI_AUTH_EMULATOR_PORT:-9099}" \
  UI_TEST_USER_EMAIL="${UI_TEST_USER_EMAIL:-ui-test@example.com}" \
  UI_TEST_USER_PASSWORD="${UI_TEST_USER_PASSWORD:-ui-test-password}" \
  bash "$UI_DIR/scripts/seed.sh"
}

clean_test_data() {
  UI_FIREBASE_PROJECT_ID="${UI_FIREBASE_PROJECT_ID:-demo-shopping-list}" \
  UI_FIRESTORE_EMULATOR_HOST="${UI_FIRESTORE_EMULATOR_HOST:-localhost}" \
  UI_FIRESTORE_EMULATOR_PORT="${UI_FIRESTORE_EMULATOR_PORT:-8080}" \
  UI_AUTH_EMULATOR_HOST="${UI_AUTH_EMULATOR_HOST:-localhost}" \
  UI_AUTH_EMULATOR_PORT="${UI_AUTH_EMULATOR_PORT:-9099}" \
  UI_TEST_USER_EMAIL="${UI_TEST_USER_EMAIL:-ui-test@example.com}" \
  UI_TEST_USER_PASSWORD="${UI_TEST_USER_PASSWORD:-ui-test-password}" \
  bash "$UI_DIR/scripts/clean.sh"
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

  if ! seed_test_data; then
    log_error "Failed to seed test data before $scenario_name"
    capture_failure_artifacts "$scenario_name"
    return 1
  fi

  local status=0
  if ! TARGET="$target" ROOT_DIR="$ROOT_DIR" APP_URL="$UI_APP_URL" UI_RUN_ARTIFACT_DIR="$UI_RUN_ARTIFACT_DIR" UI_BROWSER_SESSION="$UI_BROWSER_SESSION" bash "$scenario_path"; then
    status=1
  fi

  if ! clean_test_data; then
    log_warn "Data cleanup failed after $scenario_name"
    status=1
  fi

  if [[ "$status" -eq 0 ]]; then
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
