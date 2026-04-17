# Clear Completed Confirmation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a two-step animated bulk-clear control beside the completed heading that deletes all completed grocery items after a confirming second tap.

**Architecture:** Keep the confirm/reset behavior inside `ProductList` so the UI state stays close to the completed list. Add one Firestore batch-delete helper for completed documents, then drive the button label and animation with local React state plus a timeout effect.

**Tech Stack:** React 19, styled-components, framer-motion, Firebase Firestore, bash UI regression scenarios.

---

### Task 1: Add the failing UI regression

**Files:**
- Create: `tests/ui/scenarios/10_clear_completed_bulk_action.sh`

**Step 1: Write the failing test**

Add a scenario that logs in, asserts the completed section exists, taps the new clear button once, verifies the confirmation label appears, taps again, and verifies the baseline completed item is gone.

**Step 2: Run test to verify it fails**

Run: `UI_SCENARIO_FILTER=10_clear_completed_bulk_action bash tests/ui/run.sh --desktop`
Expected: FAIL because the clear button test id does not exist yet.

**Step 3: Write minimal implementation**

Add the bulk-clear helper, button state, animation, and localized copy.

**Step 4: Run test to verify it passes**

Run: `UI_SCENARIO_FILTER=10_clear_completed_bulk_action bash tests/ui/run.sh --desktop`
Expected: PASS

### Task 2: Add the bulk-clear data action

**Files:**
- Modify: `src/services/firestore.js`

**Step 1: Write the failing test**

Use the new UI scenario failure as the red signal for this behavior because there is no existing unit harness for Firestore batch deletes.

**Step 2: Write minimal implementation**

Add a helper that finds completed groceries for the current user and deletes them in a single write batch.

**Step 3: Re-run the UI scenario**

Run: `UI_SCENARIO_FILTER=10_clear_completed_bulk_action bash tests/ui/run.sh --desktop`
Expected: still fail until the UI is wired.

### Task 3: Wire the animated confirm button into the completed header

**Files:**
- Modify: `src/components/ProductList.jsx`
- Modify: `src/i18n/messages.js`

**Step 1: Write minimal implementation**

Render a right-aligned heading row with the `Completed` title and animated pill button. First tap arms confirmation, second tap runs the clear helper, and a timeout resets the armed state.

**Step 2: Run targeted checks**

Run:
- `UI_SCENARIO_FILTER=10_clear_completed_bulk_action bash tests/ui/run.sh --desktop`
- `npm run lint`

Expected:
- UI scenario passes
- Lint passes

### Task 4: Verify against existing related behavior

**Files:**
- Modify if needed: `tests/ui/scenarios/02_edit_emoji_delete.sh`

**Step 1: Run related regression**

Run: `UI_SCENARIO_FILTER=02_edit_emoji_delete bash tests/ui/run.sh --desktop`

**Step 2: Confirm no regression**

Expected: PASS so completed-item delete behavior still works alongside the bulk action.
