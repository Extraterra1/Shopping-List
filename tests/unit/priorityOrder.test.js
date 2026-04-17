import test from "node:test";
import assert from "node:assert/strict";
import {
  getFallbackInsertOrder,
  ORDER_STEP,
  buildReorderLearningTargets,
  computeInsertedOrder,
  createSparseOrderUpdates
} from "../../src/utils/priorityOrder.js";
import { buildPriorityUpdates } from "../../src/utils/priorityLearning.js";

test("computeInsertedOrder places item between learned neighbors", () => {
  const active = [
    { name: "Deodorant", order: 0, learnedPriorityScore: 0 },
    { name: "Cheese", order: 200, learnedPriorityScore: 200 }
  ];

  const order = computeInsertedOrder(active, 100);
  assert.equal(order, 100);
});

test("computeInsertedOrder appends at end when target is highest", () => {
  const active = [
    { name: "Milk", order: 0, learnedPriorityScore: 0 },
    { name: "Cheese", order: 100, learnedPriorityScore: 100 }
  ];

  const order = computeInsertedOrder(active, 1000);
  assert.equal(order, 200);
});

test("getFallbackInsertOrder prepends unknown items to the top of the active list", () => {
  const active = [
    { name: "Milk", order: 100 },
    { name: "Cheese", order: 200 }
  ];

  const order = getFallbackInsertOrder(active);
  assert.equal(order, 0);
});

test("createSparseOrderUpdates spaces order by ORDER_STEP", () => {
  const updates = createSparseOrderUpdates([
    { id: "a" },
    { id: "b" },
    { id: "c" }
  ]);

  assert.deepEqual(updates, [
    { id: "a", order: 0 },
    { id: "b", order: ORDER_STEP },
    { id: "c", order: ORDER_STEP * 2 }
  ]);
});

test("buildReorderLearningTargets maps drag order to scores", () => {
  const targets = buildReorderLearningTargets([{ name: "Milk" }, { name: "Bread" }]);
  assert.deepEqual(targets, [
    { name: "Milk", targetScore: 0 },
    { name: "Bread", targetScore: ORDER_STEP }
  ]);
});

test("buildPriorityUpdates remembers the latest learned position immediately", () => {
  const updates = buildPriorityUpdates([
    {
      name: "Milk",
      targetScore: 0,
      existing: { canonicalName: "milk", priorityScore: 100, sampleCount: 2 }
    }
  ]);

  assert.equal(updates[0].canonicalName, "milk");
  assert.equal(updates[0].priorityScore, 0);
  assert.equal(updates[0].sampleCount, 3);
});
