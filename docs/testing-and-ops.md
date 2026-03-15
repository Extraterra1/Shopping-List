# Testing and Ops Guide

This file explains how the repo is verified and how to work with its emulator-backed workflows.

## Command Reference

Standard commands from `package.json`:

```bash
npm run dev
npm run build
npm run lint
npm run test:unit
npm run preview
npm run test:ui
npm run test:ui:desktop
npm run test:ui:mobile
npm run test:ui:seed
npm run test:ui:clean
```

## Prerequisites

For normal local development:

- Node.js and npm

For the full UI suite:

- Firebase CLI
- Java runtime for local Firebase emulators
- `agent-browser` CLI

## What Is Actually Tested

### Unit Tests

Current unit coverage lives in:

- `tests/unit/priorityMatching.test.js`
- `tests/unit/priorityOrder.test.js`

These cover the pure priority-learning utilities:

- normalization
- fuzzy matching
- sparse order generation
- reorder learning targets
- running-average priority updates

Important limitation:

- There are no unit tests yet for the main React components.
- Most end-to-end behavior is covered by the UI harness instead.

### UI Regression Suite

Main files:

- `tests/ui/run.sh`
- `tests/ui/helpers/common.sh`
- `tests/ui/helpers/browser.sh`
- `tests/ui/helpers/assert.sh`
- `tests/ui/scenarios/*.sh`
- `tests/ui/scripts/firestore-data.mjs`

The UI suite uses:

- Firebase Auth emulator
- Firestore emulator
- a real Vite dev server
- `agent-browser` as the browser driver

`tests/ui/run.sh` normally wraps itself inside:

```bash
firebase emulators:exec --only firestore,auth ...
```

That means you usually do not need to start emulators manually for standard runs.

## UI Scenario Inventory

Current scenario coverage:

- `00_auth_gate_flow.sh`: signed-out onboarding, test login, sign out
- `01_add_validation_toggle.sh`: add-item validation, add success, completion toggle behavior
- `02_edit_emoji_delete.sh`: edit item, learned custom emoji reuse, delete completed item
- `03_reorder_persistence.sh`: reorder persistence across reload
- `04_responsive_smoke.sh`: basic desktop/mobile smoke coverage
- `05_error_path_add_failure.sh`: failed Firestore write path while adding
- `06_language_switching.sh`: onboarding and authenticated language switching
- `07_refresh_session_shell.sh`: authenticated refresh resolves back to shell
- `08_priority_autoinsert.sh`: fuzzy learned insertion (`Whole Milk` between learned neighbors)
- `09_priority_rebuild_memory.sh`: learned ordering survives list rebuild cycles

Important detail:

- Some scenarios intentionally skip mobile, especially ones that depend on desktop drag/reorder behavior or network interception assumptions.

## Seed and Fixture Strategy

`tests/ui/scripts/firestore-data.mjs` is the fixture engine.

Supported modes:

- `seed`
- `clean`
- `reorder-active`
- `seed-priority-insert`
- `seed-priority-rebuild`
- `verify-priority-rules`

What it does:

- creates or signs in a test auth user in the auth emulator
- clears Firestore emulator state when needed
- writes baseline documents directly through emulator REST endpoints
- verifies selected Firestore rule behavior

This script is the fastest place to inspect if a UI scenario depends on custom seeded data.

## Environment Variables

### App Runtime

Core app variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Local emulator toggles:

- `VITE_USE_FIRESTORE_EMULATOR`
- `VITE_FIRESTORE_EMULATOR_HOST`
- `VITE_FIRESTORE_EMULATOR_PORT`
- `VITE_USE_AUTH_EMULATOR`
- `VITE_AUTH_EMULATOR_HOST`
- `VITE_AUTH_EMULATOR_PORT`

Feature toggle:

- `VITE_PRIORITY_LEARNING`

E2E-only variables:

- `VITE_E2E_AUTH_BYPASS`
- `VITE_TEST_USER_EMAIL`
- `VITE_TEST_USER_PASSWORD`

### UI Harness Variables

The test harness also accepts `UI_*` variables, including:

- `UI_FIREBASE_PROJECT_ID`
- `UI_FIRESTORE_EMULATOR_HOST`
- `UI_FIRESTORE_EMULATOR_PORT`
- `UI_AUTH_EMULATOR_HOST`
- `UI_AUTH_EMULATOR_PORT`
- `UI_TEST_USER_EMAIL`
- `UI_TEST_USER_PASSWORD`
- `UI_APP_PORT`
- `UI_SCENARIO_FILTER`
- `UI_SKIP_EMULATOR`

The harness maps those into the corresponding `VITE_*` variables when it starts the dev server.

## Running Focused Checks

Run unit tests only:

```bash
npm run test:unit
```

Run one UI scenario by filename match:

```bash
UI_SCENARIO_FILTER=reorder npm run test:ui:desktop
```

Run the priority rules verification directly:

```bash
firebase emulators:exec --project demo-shopping-list --only firestore,auth \
  "node tests/ui/scripts/firestore-data.mjs verify-priority-rules"
```

## Failure Artifacts

On UI scenario failure, artifacts are written under:

```text
tests/ui/artifacts/<run-id>/<target>/<scenario-name>/
```

Typical artifacts:

- `failure.png`
- `failure.snapshot.txt`
- `body.txt`
- `console.txt`
- `errors.txt`
- `dev-server.log`

If a UI test fails, inspect `dev-server.log` first if the page did not boot, then inspect `console.txt` and `failure.snapshot.txt`.

## Practical Change Checklist

If you change list business logic:

- run `npm run test:unit`
- run at least the relevant UI subset
- pay special attention to ordering and item text assertions

If you change Firestore document shape:

- update `firestore.rules`
- update seeding in `tests/ui/scripts/firestore-data.mjs`
- run the relevant UI scenarios
- re-run rule verification if priority docs are involved

If you change auth behavior:

- check `00_auth_gate_flow.sh`
- check `07_refresh_session_shell.sh`
- check that `VITE_E2E_AUTH_BYPASS` behavior still only appears in test mode

If you change i18n:

- check `06_language_switching.sh`
- inspect `src/i18n/messages.js` for missing keys

If you change the learned ordering flow:

- run `npm run test:unit`
- run `UI_SCENARIO_FILTER=priority npm run test:ui:desktop`

## Repo Operations Notes

- `firebase.json` defines emulator ports and the Firestore rules file path.
- `src/firebaseApp.js`, `src/firebaseAuth.js`, and `src/firebaseDb.js` separate Firebase initialization concerns cleanly.
- The app defaults to demo Firebase values when real env vars are absent, which keeps local emulator work simple.
- Production safety still depends on not enabling `VITE_E2E_AUTH_BYPASS` outside automated test runs.
