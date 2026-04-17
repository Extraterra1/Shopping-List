# Architecture Guide

This file explains how the app boots, where data lives, and which modules own each behavior.

## Runtime Overview

The runtime chain is:

1. `src/main.jsx` mounts React.
2. `LanguageProvider` from `src/context/LanguageContext.jsx` wraps the app.
3. `src/App.jsx` decides whether to show onboarding, an auth-loading skeleton, or the signed-in shell.
4. `src/components/AppShell.jsx` renders the authenticated UI and delegates to `AddItem` and `ProductList`.

In practice, `src/App.jsx` is the highest-value file in the repo because it coordinates:

- auth persistence initialization
- popup-or-redirect Google sign-in
- redirect result recovery
- auth state subscription
- user profile upsert
- language profile hydration
- custom emoji subscription
- lazy loading of the signed-in shell

## Top-Level UI Structure

### `src/components/Onboarding.jsx`

Rendered when there is no signed-in user.

Responsibilities:

- hero/marketing copy
- language picker before login
- Google sign-in trigger
- optional test-user sign-in button in E2E mode
- auth error display

### `src/components/AppShell.jsx`

Rendered for authenticated users.

Responsibilities:

- header/title
- account menu
- language switching after login
- sign-out entry point
- composition of `AddItem` and `ProductList`

### `src/components/AddItem.jsx`

Minimal controlled form for creating grocery items.

Important detail:

- It does not compute emoji, ordering, or persistence rules itself.
- It calls `addGroceryItem(uid, value)` in `src/services/firestore.js`.

### `src/components/ProductList.jsx`

This is the main interactive list surface.

Responsibilities:

- subscribes to groceries
- splits active vs completed items
- drag-and-drop reorder for active items via Framer Motion
- toggle completion
- edit active items
- delete completed items
- optimistic local reorder before Firestore commit

Important detail:

- Active items are rendered in a `Reorder.Group`.
- Completed items are rendered as a static list.
- Reorder persistence and learning happen in one service call: `persistReorderAndLearn`.

## State and Persistence Model

The app is remote-first. Firestore drives almost everything visible after login.

### Firestore Collections

```text
users/{uid}
users/{uid}/groceries/{itemId}
users/{uid}/custom_emojis/{emojiName}
users/{uid}/item_priorities/{priorityId}
```

### User Profile Document

Document: `users/{uid}`

Used for:

- `displayName`
- `email`
- `photoURL`
- `language`
- `createdAt`
- `lastLoginAt`

Owned by: `src/services/userProfile.js`

Behavior:

- Upserted after successful auth bootstrap.
- Language preference is persisted here after sign-in.
- `createdAt` is immutable under Firestore rules.

### Grocery Items

Document: `users/{uid}/groceries/{itemId}`

Fields:

- `name`
- `emoji`
- `checked`
- `order`
- `createdAt`
- `updatedAt`

Owned by: `src/services/firestore.js`

Important invariants:

- Rendering uses `orderBy("order", "asc")`.
- `order` is the real list-order source of truth.
- Checked and unchecked items live in the same collection; the UI filters them client-side.

### Custom Emoji Documents

Document: `users/{uid}/custom_emojis/{emojiName}`

Fields:

- `emoji`
- `updatedAt`

Behavior:

- The document id is the lowercased, trimmed product name.
- `App.jsx` subscribes to this collection after login.
- The subscription updates an in-memory map in `src/utils/emoji.js`.

### Learned Item Priorities

Document: `users/{uid}/item_priorities/{priorityId}`

Fields:

- `canonicalName`
- `priorityScore`
- `sampleCount`
- `createdAt`
- `updatedAt`

Owned by:

- `src/services/itemPriorities.js`
- `src/utils/priorityLearning.js`
- `src/utils/priorityMatching.js`
- `src/utils/priorityOrder.js`

Important invariant:

- These docs do not directly drive rendering.
- They only influence where a newly added active item gets its `order`.

## Auth Flow

Main code:

- `src/services/auth.js`
- `src/App.jsx`

The flow is:

1. Set Firebase auth persistence to `browserLocalPersistence`.
2. Attempt to recover any pending redirect sign-in.
3. Subscribe to `onAuthStateChanged`.
4. If a user exists, upsert the user profile and hydrate language preference.
5. If no user exists, show onboarding.

Google sign-in behavior:

- The app prefers `signInWithPopup`.
- It falls back to `signInWithRedirect` if popup auth is blocked or unsupported.

Local storage bootstrap hints:

- `shopping_list_last_auth_user`
- `shopping_list_auth_redirect_pending`

These are only used to improve perceived loading behavior around auth restoration. They are not security boundaries.

## Language Flow

Main code:

- `src/context/LanguageContext.jsx`
- `src/i18n/language.js`
- `src/i18n/messages.js`
- `src/services/userProfile.js`

Behavior:

- Initial language comes from local storage or device language.
- Supported languages are `en-US`, `pt-PT`, and `es-ES`.
- The context exposes `t(key, vars)` and language metadata.
- Before login, language changes only affect local state and local storage.
- After login, language changes are also persisted to the user profile document.

Important detail:

- Translation fallback is `en-US` if a key is missing for the active language.

## Emoji Resolution Flow

Main code:

- `src/utils/emoji.js`
- `src/services/firestore.js`
- item edit flow in `src/components/ProductList.jsx`

Resolution order for `getEmojiForProduct(productName)`:

1. Exact raw custom emoji match
2. Normalized custom emoji match
3. Exact built-in emoji map match
4. Partial built-in keyword match
5. Fallback to `🛍️`

Learning behavior:

- When an item is edited and the emoji changes, `saveCustomEmoji(uid, name, emoji)` persists the preference.
- Future adds with that normalized name reuse the learned emoji.

## Priority Learning Flow

This is the most specialized subsystem in the repo.

Main code:

- `src/services/firestore.js`
- `src/services/itemPriorities.js`
- `src/utils/priorityMatching.js`
- `src/utils/priorityLearning.js`
- `src/utils/priorityOrder.js`

### How Add-Item Placement Works

When `addGroceryItem(uid, name)` runs:

1. Normalize and title-case the item name.
2. Pick an emoji.
3. Fetch active groceries.
4. If priority learning is enabled, fetch `item_priorities`.
5. Fuzzy-match the new item name against learned canonical names.
6. If a match clears the confidence threshold, compute an insertion `order`.
7. If a learned placement was used, persist that exact position for the newly added canonical item immediately.
8. Otherwise append to the end of active items.

Current constants:

- `ORDER_STEP = 100`
- fuzzy threshold in `src/services/firestore.js`: `0.78`

### How Reorder Learning Works

When active items are reordered:

1. The UI immediately applies an optimistic item order.
2. `persistReorderAndLearn(uid, reorderedActiveItems, currentItems)` writes sparse grocery orders.
3. The same call builds learning targets for active items.
4. `learnPrioritiesFromReorder` updates `item_priorities` so the latest drag position wins immediately.

Important rule:

- Dragging teaches learned priority ordering immediately.
- Learned auto-inserts also store the exact placed position for the newly added canonical item.
- Toggling complete, deleting, or editing an item does not teach ordering.

### Matching Details

`src/utils/priorityMatching.js` does:

- diacritic removal
- punctuation cleanup
- lowercase normalization
- token-set overlap scoring
- bigram Dice coefficient scoring
- tie-breaking by `sampleCount`, then lower `priorityScore`

### Ordering Details

`src/utils/priorityOrder.js` does:

- placement between neighbors when a learned score fits between them
- append/prepend fallback when the learned score belongs outside the current range
- sparse order updates to leave insertion room

## Services Layer

### `src/services/firestore.js`

This is the main business-logic service.

Responsibilities:

- grocery subscription
- add/update/delete/toggle flows
- reorder persistence
- learned-priority integration
- custom emoji subscription and persistence

This file is the first place to inspect when business rules change.

### `src/services/itemPriorities.js`

This file owns:

- reading item-priority documents
- upserting priority documents in batches
- adapting reorder targets into Firestore payloads

### `src/services/userProfile.js`

This file owns:

- creating/updating the top-level user profile document
- preserving `createdAt`
- resolving which language value should win

### `src/services/auth.js`

This file intentionally stays thin. It wraps the Firebase SDK for:

- auth persistence
- redirect/popup sign-in
- auth state observation
- sign-out
- E2E-only test login

## Styling System

The styling approach is mixed:

- `src/index.css` contains the real global visual system and layout primitives.
- `src/components/Onboarding.jsx` and `src/components/AppShell.jsx` rely heavily on inline styles plus global classes.
- `src/components/ProductList.jsx` uses `styled-components`.

Important note:

- `src/App.css` appears to be unused Vite starter CSS and is not part of the live styling path.

## Build and PWA Layer

Main code:

- `vite.config.js`
- `index.html`
- `public/`

Behavior:

- Uses `vite-plugin-pwa`
- Registers with `autoUpdate`
- Ships icons from `public/`
- Declares a simple installable manifest

The app is PWA-enabled, but most business complexity is in auth and Firestore, not service worker code.

## Firestore Rules and Safety Boundaries

Main file:

- `firestore.rules`

Rules enforce:

- owner-only access to all user-scoped docs
- field whitelists
- string length limits
- integer bounds for `order`, `priorityScore`, and `sampleCount`
- `createdAt` immutability on updates where applicable

When changing document shape, always update both:

1. client write logic
2. `firestore.rules`

## Current Quirks Worth Knowing

- `ProductList` comment text suggests completed-item editing might be optional, but the current prop wiring effectively disables completed-item edit mode while still showing the edit icon.
- `setGroceryOrder` exists in `src/services/firestore.js`, but `persistReorderAndLearn` uses `updateGroceryOrder` instead.
- `src/firebase.js` is present as a re-export helper but is not part of the main import path today.
