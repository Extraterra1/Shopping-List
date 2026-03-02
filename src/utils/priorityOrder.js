export const ORDER_STEP = 100;

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const deriveReferenceScore = (item, fallbackIndex) => {
  if (Number.isFinite(Number(item.learnedPriorityScore))) {
    return Number(item.learnedPriorityScore);
  }

  if (Number.isFinite(Number(item.priorityScore))) {
    return Number(item.priorityScore);
  }

  if (Number.isFinite(Number(item.order))) {
    return Number(item.order);
  }

  return fallbackIndex * ORDER_STEP;
};

const sortByOrder = (items) =>
  [...items].sort((left, right) => toFiniteNumber(left.order) - toFiniteNumber(right.order));

export const computeInsertedOrder = (activeItems, targetScore) => {
  if (!Array.isArray(activeItems) || activeItems.length === 0) {
    return 0;
  }

  const withScores = activeItems
    .map((item, index) => ({
      ...item,
      _referenceScore: deriveReferenceScore(item, index),
      _orderValue: toFiniteNumber(item.order, index * ORDER_STEP)
    }))
    .sort((left, right) => left._referenceScore - right._referenceScore);

  const lower = [...withScores]
    .reverse()
    .find((item) => item._referenceScore <= targetScore);
  const upper = withScores.find((item) => item._referenceScore > targetScore);

  if (lower && upper) {
    const midpoint = Math.round((lower._orderValue + upper._orderValue) / 2);
    if (midpoint !== lower._orderValue && midpoint !== upper._orderValue) {
      return midpoint;
    }
    return lower._orderValue + 1;
  }

  if (lower) {
    const sortedByOrder = sortByOrder(activeItems);
    const maxOrder = toFiniteNumber(sortedByOrder[sortedByOrder.length - 1].order);
    return maxOrder + ORDER_STEP;
  }

  const sortedByOrder = sortByOrder(activeItems);
  const minOrder = toFiniteNumber(sortedByOrder[0].order);
  return minOrder - ORDER_STEP;
};

export const createSparseOrderUpdates = (items) =>
  items.map((item, index) => ({
    id: item.id,
    order: index * ORDER_STEP
  }));

export const buildReorderLearningTargets = (items) =>
  items.map((item, index) => ({
    name: item.name,
    targetScore: index * ORDER_STEP
  }));
