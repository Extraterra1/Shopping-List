# Agent Onboarding

This doc set is for a new agent reading the repository for the first time.

## Start Here

Read these in order:

1. [`docs/architecture.md`](./architecture.md)
2. [`docs/testing-and-ops.md`](./testing-and-ops.md)
3. [`README.md`](../README.md) for local setup and screenshots

## What This App Is

This repository is a mobile-first shopping list PWA built with Vite, React 19, Firebase Authentication, and Firestore.

Core product behavior:

- Signed-out users land on an onboarding screen and authenticate with Google.
- Signed-in users get a private shopping list scoped to their Firebase user id.
- Items can be added, toggled complete, reordered, edited, and deleted.
- The app learns custom emoji choices per user.
- The app also learns ordering preferences from drag-and-drop and uses that history to auto-insert future items.
- UI copy is localized for `en-US`, `pt-PT`, and `es-ES`.

## Fast Mental Model

The app has two top-level modes:

- `Onboarding`: rendered when there is no authenticated user.
- `AppShell`: rendered after auth resolves and a user session exists.

Most state is remote-first:

- Firestore is the source of truth for grocery items, custom emojis, user profile data, and learned item priorities.
- The client mostly subscribes to Firestore and renders snapshot updates.
- Local storage is only used for UI bootstrap hints and language persistence.

The most important invariant in the repo:

- `users/{uid}/groceries/*` sorted by `order` is the render truth.
- Learned priorities in `users/{uid}/item_priorities/*` only help choose the `order` of newly inserted items.

## Where To Start By Task

If you need to change auth or session bootstrap:

- Start in `src/App.jsx`
- Then read `src/services/auth.js`
- Then read `src/services/userProfile.js`

If you need to change list CRUD, ordering, or item rendering:

- Start in `src/components/AddItem.jsx`
- Then read `src/components/ProductList.jsx`
- Then read `src/services/firestore.js`

If you need to change learned ordering:

- Start in `src/services/firestore.js`
- Then read `src/services/itemPriorities.js`
- Then read `src/utils/priorityMatching.js`
- Then read `src/utils/priorityLearning.js`
- Then read `src/utils/priorityOrder.js`
- Historical background lives in:
  - `docs/plans/2026-03-02-priority-order-learning-design.md`
  - `docs/plans/2026-03-02-priority-order-learning-implementation-plan.md`

If you need to change emoji mapping behavior:

- Start in `src/utils/emoji.js`
- Then read `src/services/firestore.js` for custom emoji persistence

If you need to change language behavior:

- Start in `src/context/LanguageContext.jsx`
- Then read `src/i18n/language.js`
- Then read `src/i18n/messages.js`
- Then read `src/services/userProfile.js`

If you need to change styling:

- Start in `src/index.css`
- Then inspect inline styles in `src/components/AppShell.jsx` and `src/components/Onboarding.jsx`
- `src/components/ProductList.jsx` uses `styled-components`

If you need to work on tests or emulators:

- Start in `tests/ui/README.md`
- Then read `tests/ui/run.sh`
- Then read `tests/ui/helpers/common.sh`
- Then inspect `tests/ui/scenarios/*.sh`

## Repo Shape

High-value directories and files:

- `src/`: application code
- `src/components/`: screens and interactive UI
- `src/services/`: Firestore and auth operations
- `src/utils/`: emoji lookup and priority-learning logic
- `src/context/`: language provider
- `src/i18n/`: supported languages and message catalogs
- `tests/unit/`: pure-logic tests for priority utilities
- `tests/ui/`: browser-based regression suite using emulators
- `docs/plans/`: existing design and implementation planning docs
- `firestore.rules`: user-isolation and document-shape constraints
- `vite.config.js`: PWA manifest and Vite plugins

## Non-Obvious Repo Notes

- `src/App.jsx` is the real application orchestrator. It owns auth bootstrap, redirect handling, profile upsert, language hydration, and custom emoji subscription.
- `src/index.css` is the real global stylesheet. `src/App.css` looks like leftover Vite starter CSS and is currently unused.
- `src/firebase.js` is a tiny re-export shim for `auth` and `db`; it also appears unused in the current codebase.
- `ProductList` mixes three styling approaches in one file: global classes, inline props, and `styled-components`. Preserve that context before refactoring.
- The test login button only exists when `VITE_E2E_AUTH_BYPASS === "true"`. That path is for emulator-backed UI automation only.
- Reorder and priority-learning helpers intentionally write sparse `order` values (`0`, `100`, `200`, ...) so the app can insert learned items between existing neighbors. Do not assume every existing fixture or document already follows that spacing.
- Completed items are rendered separately from active items. Reorder logic only applies to active items.
- Completed rows still show an edit icon, but the current component wiring effectively disables completed-item edit mode. Treat that as a current quirk, not a guaranteed supported flow.

## Safe Assumptions

These assumptions are consistent with the current code:

- Each user owns a completely isolated document subtree under `users/{uid}`.
- UI snapshots should update in real time when Firestore changes.
- Priority learning is enabled by default unless `VITE_PRIORITY_LEARNING` is explicitly set to `"false"`.
- If learned ordering fails, the app should still work by appending new active items.
- If custom emoji lookup fails, the app should still work with static emoji matching and a fallback bag emoji.
