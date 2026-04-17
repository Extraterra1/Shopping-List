import test from "node:test";
import assert from "node:assert/strict";
import { findBestPriorityMatch, normalizeItemName } from "../../src/utils/priorityMatching.js";

test("normalizeItemName removes accents, punctuation, and extra spacing", () => {
  assert.equal(normalizeItemName("  Leite  "), "leite");
  assert.equal(normalizeItemName("Pão-de-Forma!!"), "pao de forma");
  assert.equal(normalizeItemName("Queso   Curado"), "queso curado");
});

test("findBestPriorityMatch returns high-confidence fuzzy candidate", () => {
  const priorities = [
    { canonicalName: "milk", priorityScore: 100, sampleCount: 4 },
    { canonicalName: "cheese", priorityScore: 200, sampleCount: 2 }
  ];

  const match = findBestPriorityMatch("whole milk", priorities, { threshold: 0.78 });
  assert.equal(match?.canonicalName, "milk");
  assert.ok((match?.confidence ?? 0) >= 0.78);
});

test("findBestPriorityMatch returns null below threshold", () => {
  const priorities = [{ canonicalName: "deodorant", priorityScore: 10, sampleCount: 3 }];
  const match = findBestPriorityMatch("tomato", priorities, { threshold: 0.78 });
  assert.equal(match, null);
});

test("findBestPriorityMatch tolerates a small typo in a learned item name", () => {
  const priorities = [{ canonicalName: "canned tunna", priorityScore: 100, sampleCount: 3 }];

  const match = findBestPriorityMatch("canned tuna", priorities, { threshold: 0.78 });
  assert.equal(match?.canonicalName, "canned tunna");
  assert.ok((match?.confidence ?? 0) >= 0.78);
});

test("findBestPriorityMatch tie-breaks by sampleCount and then lower score", () => {
  const priorities = [
    { canonicalName: "whole milk", priorityScore: 200, sampleCount: 1 },
    { canonicalName: "whole milk", priorityScore: 100, sampleCount: 1 },
    { canonicalName: "whole milk", priorityScore: 300, sampleCount: 2 }
  ];

  const match = findBestPriorityMatch("whole milk", priorities, { threshold: 0.78 });
  assert.equal(match?.sampleCount, 2);
});
