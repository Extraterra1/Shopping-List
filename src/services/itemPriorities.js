import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebaseDb";
import { normalizeItemName } from "../utils/priorityMatching.js";
import { buildPriorityUpdates, getPriorityDocId } from "../utils/priorityLearning.js";

const priorityCollection = (uid) => collection(db, "users", uid, "item_priorities");
const priorityDoc = (uid, id) => doc(db, "users", uid, "item_priorities", id);

const toInt = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.round(parsed);
};

export const fetchItemPriorities = async (uid) => {
  if (!uid) {
    return [];
  }

  const snapshot = await getDocs(priorityCollection(uid));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const upsertItemPriorities = async (uid, entries) => {
  if (!uid || !Array.isArray(entries) || entries.length === 0) {
    return;
  }

  const batch = writeBatch(db);
  entries.forEach((entry) => {
    batch.set(
      priorityDoc(uid, entry.id),
      {
        canonicalName: entry.canonicalName,
        priorityScore: toInt(entry.priorityScore, 0),
        sampleCount: toInt(entry.sampleCount, 0),
        createdAt: entry.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  });
  await batch.commit();
};

export const learnPrioritiesFromReorder = async (uid, learningTargets) => {
  if (!uid || !Array.isArray(learningTargets) || learningTargets.length === 0) {
    return;
  }

  const existing = await fetchItemPriorities(uid);
  const existingById = new Map(existing.map((item) => [getPriorityDocId(item.canonicalName), item]));
  const updates = buildPriorityUpdates(
    learningTargets.map((target) => {
      const canonicalName = normalizeItemName(target.name);
      const docId = getPriorityDocId(canonicalName);
      return {
        canonicalName,
        targetScore: target.targetScore,
        existing: existingById.get(docId) ?? null
      };
    })
  );

  await upsertItemPriorities(uid, updates);
};
