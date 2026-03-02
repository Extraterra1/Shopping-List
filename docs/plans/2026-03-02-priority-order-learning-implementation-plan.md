# Priority Order Learning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-user learned product priority so new items auto-insert in expected order using fuzzy name matching, with learning sourced only from drag reorder actions.

**Architecture:** Keep `groceries.order` as render truth, and add a new per-user `item_priorities` collection that stores learned `priorityScore` plus metadata. Add a pure matching layer (normalize + fuzzy score) and a pure order-placement layer to keep behavior testable. Wire reorder updates to persist both current grocery order and learned priorities, then apply learned scores when inserting new items.

**Tech Stack:** React 19, Firebase Firestore (web SDK + emulator), agent-browser shell scenarios, Node built-in test runner (`node --test`), bash scenario harness.

---

### Task 1: Add Unit Test Harness and Name Normalization Utility

**Files:**
- Create: `src/utils/priorityMatching.js`
- Create: `tests/unit/priorityMatching.test.js`
- Modify: `package.json`

**Step 1: Write the failing test**

```js
// tests/unit/priorityMatching.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeItemName } from '../../src/utils/priorityMatching.js';

test('normalizeItemName removes accents, punctuation, and extra spacing', () => {
  assert.equal(normalizeItemName('  Leite  '), 'leite');
  assert.equal(normalizeItemName('Pão-de-Forma!!'), 'pao de forma');
  assert.equal(normalizeItemName('Queso   Curado'), 'queso curado');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/unit/priorityMatching.test.js`
Expected: FAIL with `Cannot find module ... priorityMatching.js`

**Step 3: Write minimal implementation**

```js
// src/utils/priorityMatching.js
export const normalizeItemName = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/unit/priorityMatching.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json src/utils/priorityMatching.js tests/unit/priorityMatching.test.js
git commit -m "test: add normalization unit coverage for priority matching"
```

### Task 2: Implement Fuzzy Matching and Threshold Selection

**Files:**
- Modify: `src/utils/priorityMatching.js`
- Modify: `tests/unit/priorityMatching.test.js`

**Step 1: Write the failing test**

```js
test('findBestPriorityMatch returns high-confidence fuzzy candidate', () => {
  const priorities = [
    { canonicalName: 'milk', priorityScore: 100, sampleCount: 4 },
    { canonicalName: 'cheese', priorityScore: 200, sampleCount: 2 }
  ];

  const match = findBestPriorityMatch('whole milk', priorities, { threshold: 0.78 });
  assert.equal(match.canonicalName, 'milk');
});

test('findBestPriorityMatch returns null below threshold', () => {
  const priorities = [{ canonicalName: 'deodorant', priorityScore: 10, sampleCount: 3 }];
  const match = findBestPriorityMatch('tomato', priorities, { threshold: 0.78 });
  assert.equal(match, null);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/unit/priorityMatching.test.js`
Expected: FAIL with `findBestPriorityMatch is not a function`

**Step 3: Write minimal implementation**

```js
export const findBestPriorityMatch = (inputName, priorities, opts = {}) => {
  const threshold = opts.threshold ?? 0.78;
  const normalized = normalizeItemName(inputName);

  const exact = priorities.find((entry) => normalizeItemName(entry.canonicalName) === normalized);
  if (exact) return { ...exact, confidence: 1 };

  // Jaccard + bigram Dice score combined
  // Return best candidate >= threshold else null.
};
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/unit/priorityMatching.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/priorityMatching.js tests/unit/priorityMatching.test.js
git commit -m "feat: add fuzzy priority matcher with confidence threshold"
```

### Task 3: Add Priority Score Placement Utility

**Files:**
- Create: `src/utils/priorityOrder.js`
- Create: `tests/unit/priorityOrder.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeInsertedOrder } from '../../src/utils/priorityOrder.js';

test('computeInsertedOrder places item between learned neighbors', () => {
  const active = [
    { name: 'Deodorant', order: 0, learnedScore: 0 },
    { name: 'Cheese', order: 200, learnedScore: 200 }
  ];

  const order = computeInsertedOrder(active, 100);
  assert.equal(order, 100);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/unit/priorityOrder.test.js`
Expected: FAIL with module not found

**Step 3: Write minimal implementation**

```js
export const computeInsertedOrder = (activeItems, targetScore) => {
  // Uses sparse order values and nearest neighbors.
  // Falls back to append when no suitable learned neighbors.
};
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/unit/priorityOrder.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/priorityOrder.js tests/unit/priorityOrder.test.js
git commit -m "feat: add order placement utility for learned insertion"
```

### Task 4: Create Firestore Priority Service Layer

**Files:**
- Create: `src/services/itemPriorities.js`
- Modify: `src/firebaseDb.js` (only if helper exports needed)
- Modify: `tests/unit/priorityOrder.test.js`

**Step 1: Write the failing test**

```js
test('buildPriorityUpdates applies running average for each reordered item', () => {
  const updates = buildPriorityUpdates([
    { name: 'Milk', targetScore: 0, existing: { priorityScore: 100, sampleCount: 2 } }
  ]);

  assert.equal(updates[0].priorityScore, (100 * 2 + 0) / 3);
  assert.equal(updates[0].sampleCount, 3);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/unit/priorityOrder.test.js`
Expected: FAIL with `buildPriorityUpdates is not defined`

**Step 3: Write minimal implementation**

```js
export const buildPriorityUpdates = (entries) => {
  // deterministic pure payload generation
};

export const fetchItemPriorities = async (uid) => {
  // read users/{uid}/item_priorities
};

export const upsertItemPriorities = async (uid, payloads) => {
  // writeBatch set/merge docs
};
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/unit/priorityOrder.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/itemPriorities.js tests/unit/priorityOrder.test.js
git commit -m "feat: add item priority service and running-average updates"
```

### Task 5: Integrate Auto-Insertion Into Add Item Flow

**Files:**
- Modify: `src/services/firestore.js`
- Modify: `src/components/AddItem.jsx` (only if returned placement metadata is surfaced)
- Modify: `tests/ui/scripts/firestore-data.mjs`
- Create: `tests/ui/scenarios/08_priority_autoinsert.sh`

**Step 1: Write the failing test**

```bash
# tests/ui/scenarios/08_priority_autoinsert.sh
# Seed priorities: deodorant(0), milk(100), cheese(200)
# Add "whole milk"
# Assert it renders between deodorant and cheese in active list.
```

**Step 2: Run test to verify it fails**

Run: `UI_SCENARIO_FILTER=priority_autoinsert npm run test:ui:desktop`
Expected: FAIL because new item appends instead of inserting by learned score

**Step 3: Write minimal implementation**

```js
// src/services/firestore.js (inside addGroceryItem)
// 1) fetch priorities
// 2) fuzzy match new name
// 3) compute inserted order
// 4) add doc with computed order
```

**Step 4: Run test to verify it passes**

Run: `UI_SCENARIO_FILTER=priority_autoinsert npm run test:ui:desktop`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/firestore.js tests/ui/scripts/firestore-data.mjs tests/ui/scenarios/08_priority_autoinsert.sh
git commit -m "feat: auto insert new items using learned priority"
```

### Task 6: Persist Learning on Drag Reorder Only

**Files:**
- Modify: `src/components/ProductList.jsx`
- Modify: `src/services/firestore.js`
- Modify: `src/services/itemPriorities.js`
- Create: `tests/ui/scenarios/09_priority_learning_rebuild.sh`

**Step 1: Write the failing test**

```bash
# 09_priority_learning_rebuild.sh
# 1) Start with no priorities
# 2) Reorder active items via drag in UI
# 3) Delete completed/reset list via seeded clean/add cycle
# 4) Re-add fuzzy variant and assert learned placement applies
```

**Step 2: Run test to verify it fails**

Run: `UI_SCENARIO_FILTER=priority_learning_rebuild npm run test:ui:desktop`
Expected: FAIL because reorder does not write priorities yet

**Step 3: Write minimal implementation**

```js
// ProductList.handleReorder
await updateGroceryOrder(uid, combined);
await learnFromActiveReorder(uid, newOrder);
```

**Step 4: Run test to verify it passes**

Run: `UI_SCENARIO_FILTER=priority_learning_rebuild npm run test:ui:desktop`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ProductList.jsx src/services/firestore.js src/services/itemPriorities.js tests/ui/scenarios/09_priority_learning_rebuild.sh
git commit -m "feat: learn item priority from drag reorder events"
```

### Task 7: Add Firestore Rules for Item Priorities

**Files:**
- Modify: `firestore.rules`
- Modify: `tests/ui/scripts/firestore-data.mjs`

**Step 1: Write the failing test**

```bash
# Extend firestore-data.mjs with a check mode:
# - owner write valid priority doc should pass
# - invalid payload / non-owner write should fail
```

**Step 2: Run test to verify it fails**

Run: `node tests/ui/scripts/firestore-data.mjs verify-priority-rules`
Expected: FAIL before rules are updated

**Step 3: Write minimal implementation**

```txt
match /users/{uid}/item_priorities/{priorityId} {
  allow read, delete: if isOwner(uid);
  allow create, update: if isOwner(uid) && validPriorityData(request.resource.data) ...
}
```

**Step 4: Run test to verify it passes**

Run: `node tests/ui/scripts/firestore-data.mjs verify-priority-rules`
Expected: PASS

**Step 5: Commit**

```bash
git add firestore.rules tests/ui/scripts/firestore-data.mjs
git commit -m "security: enforce owner scoped rules for learned item priorities"
```

### Task 8: Full Regression, Docs, and PR

**Files:**
- Modify: `tests/ui/README.md`
- Modify: `README.md`

**Step 1: Write the failing test**

```bash
# Add runbook expectations for new scenarios before implementation finalization.
```

**Step 2: Run test to verify it fails (if docs references missing scenarios)**

Run: `npm run test:ui:desktop`
Expected: FAIL if scenario wiring or commands are wrong

**Step 3: Write minimal implementation**

```md
- Add section: Learned Priority Ordering
- Explain drag-only learning + fuzzy auto-insert behavior
- Add troubleshooting for threshold tuning
```

**Step 4: Run full verification**

Run: `npm run lint && npm run build && npm run test:ui:desktop && npm run test:ui:mobile`
Expected: all PASS

**Step 5: Commit + PR**

```bash
git add README.md tests/ui/README.md
git commit -m "docs: document learned priority ordering behavior"
git push -u origin codex/priority-learning-design
gh pr create --title "feat: learned product priority and fuzzy auto-insert" --body-file .github/pull_request_template.md
```

