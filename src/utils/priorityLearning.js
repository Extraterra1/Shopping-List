import { normalizeItemName } from "./priorityMatching.js";

const toInt = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.round(parsed);
};

export const getPriorityDocId = (name) => normalizeItemName(name);

export const buildPriorityUpdates = (entries) =>
  entries
    .map((entry) => {
      const canonicalName = normalizeItemName(entry.canonicalName ?? entry.name ?? "");
      if (!canonicalName) {
        return null;
      }

      const existing = entry.existing ?? null;
      const previousSamples = toInt(existing?.sampleCount, 0);
      const previousScore = toInt(existing?.priorityScore, toInt(entry.targetScore, 0));
      const targetScore = toInt(entry.targetScore, 0);
      const nextSamples = previousSamples + 1;
      const nextScore =
        previousSamples === 0
          ? targetScore
          : Math.round((previousScore * previousSamples + targetScore) / nextSamples);

      return {
        id: getPriorityDocId(canonicalName),
        canonicalName,
        priorityScore: nextScore,
        sampleCount: nextSamples,
        createdAt: existing?.createdAt ?? null
      };
    })
    .filter(Boolean);
