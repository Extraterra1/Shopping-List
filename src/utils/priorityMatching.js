const normalizeInput = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const normalizeItemName = normalizeInput;

const getTokenSet = (normalizedValue) => {
  if (!normalizedValue) {
    return new Set();
  }

  return new Set(normalizedValue.split(" ").filter(Boolean));
};

const getBigrams = (normalizedValue) => {
  if (!normalizedValue) {
    return [];
  }

  const compact = normalizedValue.replace(/\s+/g, " ").trim();
  if (compact.length < 2) {
    return compact ? [compact] : [];
  }

  const grams = [];
  for (let index = 0; index < compact.length - 1; index += 1) {
    grams.push(compact.slice(index, index + 2));
  }
  return grams;
};

const jaccardSimilarity = (leftSet, rightSet) => {
  if (leftSet.size === 0 || rightSet.size === 0) {
    return 0;
  }

  let intersection = 0;
  leftSet.forEach((token) => {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  });

  const union = leftSet.size + rightSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

const diceCoefficient = (leftBigrams, rightBigrams) => {
  if (leftBigrams.length === 0 || rightBigrams.length === 0) {
    return 0;
  }

  const rightCounts = new Map();
  rightBigrams.forEach((gram) => {
    rightCounts.set(gram, (rightCounts.get(gram) ?? 0) + 1);
  });

  let overlap = 0;
  leftBigrams.forEach((gram) => {
    const count = rightCounts.get(gram) ?? 0;
    if (count > 0) {
      overlap += 1;
      rightCounts.set(gram, count - 1);
    }
  });

  return (2 * overlap) / (leftBigrams.length + rightBigrams.length);
};

const isSubset = (subset, superset) => {
  if (subset.size === 0 || superset.size === 0 || subset.size > superset.size) {
    return false;
  }

  for (const token of subset) {
    if (!superset.has(token)) {
      return false;
    }
  }
  return true;
};

const computeConfidence = (inputNormalized, candidateNormalized) => {
  const inputTokens = getTokenSet(inputNormalized);
  const candidateTokens = getTokenSet(candidateNormalized);
  const tokenScore = jaccardSimilarity(inputTokens, candidateTokens);

  const inputBigrams = getBigrams(inputNormalized);
  const candidateBigrams = getBigrams(candidateNormalized);
  const bigramScore = diceCoefficient(inputBigrams, candidateBigrams);

  const baseScore = 0.55 * tokenScore + 0.45 * bigramScore;
  const subsetScore = isSubset(candidateTokens, inputTokens)
    ? Math.min(0.95, 0.85 + 0.1 * bigramScore)
    : 0;
  const containsScore = inputNormalized.includes(candidateNormalized) ||
    candidateNormalized.includes(inputNormalized)
    ? 0.82
    : 0;

  return Math.max(baseScore, subsetScore, containsScore);
};

export const findBestPriorityMatch = (inputName, priorities, options = {}) => {
  const threshold = options.threshold ?? 0.78;
  const normalizedInput = normalizeItemName(inputName);

  if (!normalizedInput || !Array.isArray(priorities) || priorities.length === 0) {
    return null;
  }

  let bestCandidate = null;

  priorities.forEach((entry) => {
    const candidateName = normalizeItemName(entry.canonicalName ?? "");
    if (!candidateName) {
      return;
    }

    const confidence =
      candidateName === normalizedInput
        ? 1
        : computeConfidence(normalizedInput, candidateName);

    if (confidence < threshold) {
      return;
    }

    if (!bestCandidate) {
      bestCandidate = { ...entry, canonicalName: candidateName, confidence };
      return;
    }

    if (confidence > bestCandidate.confidence) {
      bestCandidate = { ...entry, canonicalName: candidateName, confidence };
      return;
    }

    if (confidence === bestCandidate.confidence) {
      const sampleCount = Number(entry.sampleCount ?? 0);
      const bestSamples = Number(bestCandidate.sampleCount ?? 0);
      if (sampleCount > bestSamples) {
        bestCandidate = { ...entry, canonicalName: candidateName, confidence };
        return;
      }

      if (sampleCount === bestSamples) {
        const score = Number(entry.priorityScore ?? Number.POSITIVE_INFINITY);
        const bestScore = Number(bestCandidate.priorityScore ?? Number.POSITIVE_INFINITY);
        if (score < bestScore) {
          bestCandidate = { ...entry, canonicalName: candidateName, confidence };
        }
      }
    }
  });

  return bestCandidate;
};
