# Clear Completed Confirmation Design

Date: 2026-04-17

## Goal
Add a bulk action beside the completed-items heading that lets the user clear all completed items with a two-step confirmation.

## Scope
In scope:
- A compact control next to the completed section title.
- First tap expands the control from its idle label to a confirmation label.
- Second tap within a short timeout clears all completed items.
- Confirmation state resets automatically after a short timeout or when no completed items remain.
- Localized copy and UI regression coverage.

Out of scope:
- Global modals or toasts.
- Undo support.
- Changes to active-item behavior.

## UX Decision
- Idle label: `Clear all`
- Confirm label: `You sure?`
- Timeout: about 2.5 seconds
- Placement: inline with the completed section heading
- Style: compact pill button that expands horizontally with a subtle scale/opacity transition

## Architecture
- Keep the interaction state local to `ProductList`.
- Add a Firestore batch helper that deletes all completed grocery documents for the current user.
- Use existing `framer-motion` primitives for the width/label transition instead of introducing a separate animation library.
- Reset the armed state when:
  - the timeout expires
  - the clear action succeeds
  - the completed list becomes empty

## Testing Strategy
- Add a focused shell UI scenario that verifies:
  - the completed section shows the clear button
  - first tap expands the button into confirmation state
  - second tap removes all completed items
- Keep existing edit/delete scenario coverage intact.

## Acceptance Criteria
- The completed section shows a clear-all control only when completed items exist.
- The control changes to a confirmation prompt on the first tap with a visible animation.
- A second tap clears all completed items.
- If the user waits past the timeout, the control returns to idle without clearing anything.
