# Priority-Based Product Ordering Design

Date: 2026-03-02
Branch: `codex/priority-learning-design`

## Goal
Make item placement smarter over time:
- The app remembers how the user orders products.
- New items auto-insert using learned priority.
- Learning is based only on drag-and-drop reorder actions.
- Learning survives list reset cycles (complete/delete/rebuild).

## Scope
In scope:
- Per-user learned priority storage.
- Fuzzy matching from newly typed item names to learned priorities.
- Auto placement at add-item time.
- Learning updates on active-list drag reorder.
- Tests for matching, insertion, persistence, and regressions.

Out of scope:
- Learning from completion/deletion actions.
- Cross-user shared priorities.
- User-facing confirmation prompts for placement.

## Constraints and Decisions
- Existing manual order field (`order`) remains source of truth for current list rendering.
- Priority learning is additive and backward compatible.
- Auto-apply is enabled; no confirmation modal.
- Matching is fuzzy, with threshold + safe fallback.

## Data Model
Add user-scoped collection:
- `users/{uid}/item_priorities/{priorityId}`

Document fields:
- `canonicalName: string` (normalized representative name)
- `priorityScore: number` (lower means earlier in list)
- `sampleCount: number` (number of drag-learning updates)
- `createdAt: timestamp`
- `updatedAt: timestamp`

Notes:
- Keep groceries in `users/{uid}/groceries/{itemId}` unchanged.
- Existing `order` field continues to drive query ordering.

## Normalization and Identity
Normalization for item matching:
- trim
- lowercase
- remove diacritics
- remove punctuation noise
- collapse repeated whitespace

Matching order:
1. Exact normalized match.
2. Fuzzy match against known `canonicalName` values.
3. Fallback to unlearned insertion when confidence is below threshold.

## Fuzzy Matching Algorithm
Candidate scoring (weighted):
- token-set overlap (Jaccard)
- character n-gram similarity (Dice coefficient)

Selection:
- pick highest scoring candidate above threshold (initial target: `0.78`)
- if tie, pick higher `sampleCount`; if still tie, pick lowest `priorityScore`

Safety:
- below threshold => treat as new/unlearned item
- no UI prompt; placement happens automatically

## Add Item Placement Flow
When adding an item:
1. Normalize typed name.
2. Resolve learned candidate (exact then fuzzy).
3. If learned candidate exists:
- derive target order slot from `priorityScore`
- assign new grocery `order` so it appears in learned position among active items
4. If no learned candidate:
- place at end of active items (stable fallback)

Order spacing strategy:
- use sparse integer order values (e.g. `0, 100, 200...`) for active items
- allows in-between inserts without full reindex every add

## Learning Update Flow (Drag Only)
On active-list drag reorder completion:
1. Read final active list order.
2. Map positions to target scores (`0,100,200...`).
3. For each item, upsert corresponding priority doc with running average:
- `newScore = (oldScore * sampleCount + targetScore) / (sampleCount + 1)`
- `sampleCount += 1`
4. Persist grocery `order` updates (existing behavior).
5. Persist learned priority updates (new behavior).

Why running average:
- converges toward user habit
- smooths out occasional one-off reorder changes

## Error Handling and Resilience
Add-item path:
- If learned priority lookup fails, log warning and continue with fallback insertion.

Drag-learning path:
- If priority upsert fails, do not block UI reorder success.
- Keep existing grocery order persisted; retry learning on next drag naturally.

Conflict handling:
- Last write wins for priority docs.
- Use idempotent upsert keyed by normalized identity.

## Firestore Rules Changes
Add rules for `users/{uid}/item_priorities/{priorityId}`:
- owner read/write only
- allowed fields: `canonicalName`, `priorityScore`, `sampleCount`, `createdAt`, `updatedAt`
- type/length constraints:
  - `canonicalName` string length 1..120
  - `priorityScore` number within sane bounds
  - `sampleCount` int >= 0
- `createdAt` immutable on update

## Testing Strategy
Unit-level:
- normalization cases (accents, punctuation, spacing)
- fuzzy scoring correctness and threshold behavior
- score update formula correctness

Integration/UI:
- adding known fuzzy item auto-places in learned position
- adding unknown item uses fallback placement
- drag reorder updates learned priorities
- after delete/reset and re-add, learned placement still applies
- existing reorder persistence scenario remains green

Regression:
- checkbox-only completion behavior unchanged
- edit/delete behavior unchanged
- desktop/mobile smoke unchanged

## Rollout Plan
1. Add data model + rule updates.
2. Add matching + insertion logic behind a feature flag (`VITE_PRIORITY_LEARNING=true`).
3. Add drag-learning writes.
4. Add/adjust tests.
5. Enable flag by default after local validation.

## Open Tuning Knobs
- fuzzy threshold (start `0.78`)
- score spacing step (start `100`)
- minimum samples before trusting fuzzy candidate (optional future improvement)

## Acceptance Criteria
- New items auto-insert using learned order from drag behavior.
- Learned ordering survives list reset cycles.
- Fuzzy matched variants (e.g., slight naming differences) reuse priority.
- Unknown items fall back predictably.
- No regressions in existing list CRUD and reorder behavior.
