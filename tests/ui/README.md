# UI Test Runbook

This project includes an automated UI regression suite powered by `agent-browser` and Firestore emulator data seeding.

## What it covers

- Add item happy path
- Validation for empty/whitespace input
- Toggle active/completed behavior
- Edit item + learned custom emoji reuse
- Delete completed item
- Reorder persistence after reload
- Responsive smoke checks (desktop + mobile viewport)
- Error path when Firestore writes fail

## Prerequisites

- `node` + `npm`
- `firebase` CLI (`firebase --version`)
- Java runtime (required by Firestore emulator)
- `agent-browser` CLI (`agent-browser --version`)

## Commands

```bash
# Full suite (desktop + mobile)
npm run test:ui

# Single target
npm run test:ui:desktop
npm run test:ui:mobile

# Seed or clean emulator data manually
npm run test:ui:seed
npm run test:ui:clean
```

## Useful environment variables

- `UI_FIREBASE_PROJECT_ID` (default: `demo-shopping-list`)
- `UI_FIRESTORE_EMULATOR_HOST` (default: `127.0.0.1`)
- `UI_FIRESTORE_EMULATOR_PORT` (default: `8080`)
- `UI_APP_PORT` (default: `4173`)
- `UI_SCENARIO_FILTER` (run subset by filename match)
- `UI_SKIP_EMULATOR=1` (skip auto `firebase emulators:exec`, useful if emulator already runs separately)

Example:

```bash
UI_SCENARIO_FILTER=reorder npm run test:ui:desktop
```

## Failure artifacts

On scenario failure, artifacts are written under:

`tests/ui/artifacts/<run-id>/<target>/<scenario-name>/`

Each failing scenario stores:

- `failure.png`
- `failure.snapshot.txt`
- `body.txt`
- `console.txt`
- `errors.txt`
- `dev-server.log` (target-level)

## Troubleshooting

- `Error: java -version ...`:
  install Java and re-run tests.
- `agent-browser command not found`:
  install via `npm install -g agent-browser`.
- Emulator already in use on `8080`:
  stop existing process or set `UI_FIRESTORE_EMULATOR_PORT`.
- Tests hang waiting for app:
  inspect `dev-server.log` in the artifacts folder for startup errors.
