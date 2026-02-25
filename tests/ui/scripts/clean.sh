#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"

export UI_FIREBASE_PROJECT_ID="${UI_FIREBASE_PROJECT_ID:-demo-shopping-list}"
export UI_FIRESTORE_EMULATOR_HOST="${UI_FIRESTORE_EMULATOR_HOST:-127.0.0.1}"
export UI_FIRESTORE_EMULATOR_PORT="${UI_FIRESTORE_EMULATOR_PORT:-8080}"

echo "[clean] project=$UI_FIREBASE_PROJECT_ID host=$UI_FIRESTORE_EMULATOR_HOST port=$UI_FIRESTORE_EMULATOR_PORT"
node tests/ui/scripts/firestore-data.mjs clean
