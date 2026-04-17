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

const getTokens = (normalizedValue) => {
  if (!normalizedValue) {
    return [];
  }

  return normalizedValue.split(" ").filter(Boolean);
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

const levenshteinDistance = (left, right) => {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array(right.length + 1).fill(0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
    }

    for (let rightIndex = 0; rightIndex <= right.length; rightIndex += 1) {
      previous[rightIndex] = current[rightIndex];
    }
  }

  return previous[right.length];
};

const normalizedEditSimilarity = (left, right) => {
  if (!left || !right) {
    return 0;
  }

  const maxLength = Math.max(left.length, right.length);
  if (maxLength === 0) {
    return 1;
  }

  return 1 - levenshteinDistance(left, right) / maxLength;
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

const computeTypoTokenScore = (inputNormalized, candidateNormalized) => {
  const inputTokens = getTokens(inputNormalized);
  const candidateTokens = getTokens(candidateNormalized);

  if (inputTokens.length === 0 || inputTokens.length !== candidateTokens.length) {
    return 0;
  }

  let exactMatches = 0;
  let fuzzyMatches = 0;
  let similarityTotal = 0;

  for (let index = 0; index < inputTokens.length; index += 1) {
    const inputToken = inputTokens[index];
    const candidateToken = candidateTokens[index];

    if (inputToken === candidateToken) {
      exactMatches += 1;
      similarityTotal += 1;
      continue;
    }

    const similarity = normalizedEditSimilarity(inputToken, candidateToken);
    if (similarity < 0.8) {
      return 0;
    }

    fuzzyMatches += 1;
    similarityTotal += similarity;
  }

  if (exactMatches === 0 || fuzzyMatches === 0) {
    return 0;
  }

  return similarityTotal / inputTokens.length;
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
  const typoTokenScore = computeTypoTokenScore(inputNormalized, candidateNormalized);

  return Math.max(baseScore, subsetScore, containsScore, typoTokenScore);
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
