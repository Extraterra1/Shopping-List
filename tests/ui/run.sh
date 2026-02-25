#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
UI_DIR="$ROOT_DIR/tests/ui"
SCENARIOS_DIR="$UI_DIR/scenarios"
HELPERS_DIR="$UI_DIR/helpers"

source "$HELPERS_DIR/common.sh"

TARGET="all"
SCENARIO_FILTER="${UI_SCENARIO_FILTER:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --desktop)
      TARGET="desktop"
      shift
      ;;
    --mobile)
      TARGET="mobile"
      shift
      ;;
    --scenario)
      SCENARIO_FILTER="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 2
      ;;
  esac
done

init_ui_test_run "$TARGET"
log_info "Running UI scenarios for target: $TARGET"
log_info "Artifacts: $UI_RUN_ARTIFACT_DIR"

if ! compgen -G "$SCENARIOS_DIR/*.sh" > /dev/null; then
  log_info "No scenarios found in $SCENARIOS_DIR"
  exit 0
fi

mapfile -t SCENARIOS < <(find "$SCENARIOS_DIR" -type f -name "*.sh" | sort)

if [[ -n "$SCENARIO_FILTER" ]]; then
  FILTERED=()
  for scenario in "${SCENARIOS[@]}"; do
    if [[ "$(basename "$scenario")" == *"$SCENARIO_FILTER"* ]]; then
      FILTERED+=("$scenario")
    fi
  done
  SCENARIOS=("${FILTERED[@]}")
fi

if [[ "${#SCENARIOS[@]}" -eq 0 ]]; then
  log_warn "No scenarios matched the filter."
  exit 1
fi

overall=0
for scenario in "${SCENARIOS[@]}"; do
  if ! run_ui_scenario "$scenario" "$TARGET"; then
    overall=1
  fi
done

close_browser_session

if [[ "$overall" -ne 0 ]]; then
  log_error "One or more UI scenarios failed."
  exit "$overall"
fi

log_success "All UI scenarios passed."
