#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"

export UI_FIREBASE_PROJECT_ID="${UI_FIREBASE_PROJECT_ID:-demo-shopping-list}"
export UI_FIRESTORE_EMULATOR_HOST="${UI_FIRESTORE_EMULATOR_HOST:-localhost}"
export UI_FIRESTORE_EMULATOR_PORT="${UI_FIRESTORE_EMULATOR_PORT:-8080}"
export UI_AUTH_EMULATOR_HOST="${UI_AUTH_EMULATOR_HOST:-localhost}"
export UI_AUTH_EMULATOR_PORT="${UI_AUTH_EMULATOR_PORT:-9099}"
export UI_TEST_USER_EMAIL="${UI_TEST_USER_EMAIL:-ui-test@example.com}"
export UI_TEST_USER_PASSWORD="${UI_TEST_USER_PASSWORD:-ui-test-password}"

echo "[seed] project=$UI_FIREBASE_PROJECT_ID firestore=$UI_FIRESTORE_EMULATOR_HOST:$UI_FIRESTORE_EMULATOR_PORT auth=$UI_AUTH_EMULATOR_HOST:$UI_AUTH_EMULATOR_PORT"
node tests/ui/scripts/firestore-data.mjs seed
