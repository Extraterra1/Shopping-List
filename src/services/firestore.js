import { db } from '../firebaseDb';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { getEmojiForProduct } from '../utils/emoji';
import { findBestPriorityMatch } from '../utils/priorityMatching.js';
import {
  ORDER_STEP,
  buildReorderLearningTargets,
  computeInsertedOrder,
  createSparseOrderUpdates,
  getFallbackInsertOrder
} from '../utils/priorityOrder.js';
import { fetchItemPriorities, learnPrioritiesFromReorder } from './itemPriorities.js';

const userGroceriesCollection = (uid) => collection(db, 'users', uid, 'groceries');
const userCustomEmojisCollection = (uid) => collection(db, 'users', uid, 'custom_emojis');
const userGroceryDoc = (uid, id) => doc(db, 'users', uid, 'groceries', id);
const userCustomEmojiDoc = (uid, id) => doc(db, 'users', uid, 'custom_emojis', id);
const PRIORITY_THRESHOLD = 0.78;
const isPriorityLearningEnabled = import.meta.env.VITE_PRIORITY_LEARNING !== 'false';

export const subscribeToGroceries = (uid, callback) => {
  const q = query(userGroceriesCollection(uid), orderBy('order', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  });
};

// Helper to capitalize each word (title case)
const titleCase = (s) =>
  s
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const fetchActiveGroceries = async (uid) => {
  const q = query(userGroceriesCollection(uid), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => !item.checked);
};

const resolveOrderWithPriorityLearning = async (uid, cleanName, activeItems) => {
  if (!isPriorityLearningEnabled) {
    return getFallbackInsertOrder(activeItems);
  }

  try {
    const priorities = await fetchItemPriorities(uid);
    const match = findBestPriorityMatch(cleanName, priorities, { threshold: PRIORITY_THRESHOLD });
    if (!match) {
      return getFallbackInsertOrder(activeItems);
    }

    const activeWithScores = activeItems.map((item) => {
      const activeMatch = findBestPriorityMatch(item.name, priorities, {
        threshold: PRIORITY_THRESHOLD
      });
      return {
        ...item,
        learnedPriorityScore: activeMatch?.priorityScore
      };
    });

    return computeInsertedOrder(activeWithScores, Number(match.priorityScore));
  } catch (error) {
    console.warn('Failed to resolve learned priority placement, using fallback order.', error);
    return getFallbackInsertOrder(activeItems);
  }
};

export const addGroceryItem = async (uid, name) => {
  try {
    const cleanName = titleCase(name);
    const emoji = getEmojiForProduct(cleanName);
    const activeItems = await fetchActiveGroceries(uid);
    const order = await resolveOrderWithPriorityLearning(uid, cleanName, activeItems);

    await addDoc(userGroceriesCollection(uid), {
      name: cleanName,
      emoji,
      checked: false,
      order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};

export const updateGroceryOrder = async (uid, items) => {
  const batch = writeBatch(db);
  const sparseUpdates = createSparseOrderUpdates(items);
  sparseUpdates.forEach((itemUpdate) => {
    const ref = userGroceryDoc(uid, itemUpdate.id);
    batch.update(ref, { order: itemUpdate.order, updatedAt: serverTimestamp() });
  });
  await batch.commit();
};

export const persistReorderAndLearn = async (uid, reorderedActiveItems, currentItems) => {
  await updateGroceryOrder(uid, currentItems);

  if (!isPriorityLearningEnabled) {
    return;
  }

  try {
    const learningTargets = buildReorderLearningTargets(reorderedActiveItems);
    await learnPrioritiesFromReorder(uid, learningTargets);
  } catch (error) {
    console.warn('Failed to persist learned priorities from drag reorder.', error);
  }
};

export const setGroceryOrder = async (uid, items) => {
  const batch = writeBatch(db);
  items.forEach((item, index) => {
    const ref = userGroceryDoc(uid, item.id);
    batch.update(ref, { order: index, updatedAt: serverTimestamp() });
  });
  await batch.commit();
};

export const toggleGroceryItem = async (uid, id, currentStatus) => {
  const itemRef = userGroceryDoc(uid, id);
  await updateDoc(itemRef, {
    checked: !currentStatus,
    updatedAt: serverTimestamp()
  });
};

export const updateGroceryItem = async (uid, id, data) => {
  const itemRef = userGroceryDoc(uid, id);
  const updates = { ...data };
  if (updates.name) {
    updates.name = titleCase(updates.name);
  }
  updates.updatedAt = serverTimestamp();
  await updateDoc(itemRef, updates);
};

export const removeGroceryItem = async (uid, id) => {
  await deleteDoc(userGroceryDoc(uid, id));
};

export const clearCompletedGroceryItems = async (uid) => {
  const q = query(userGroceriesCollection(uid), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  const completedDocs = snapshot.docs.filter((itemDoc) => itemDoc.data().checked);

  if (completedDocs.length === 0) {
    return 0;
  }

  const batch = writeBatch(db);
  completedDocs.forEach((itemDoc) => {
    batch.delete(itemDoc.ref);
  });

  await batch.commit();
  return completedDocs.length;
};

export const subscribeToCustomEmojis = (uid, callback) => {
  return onSnapshot(userCustomEmojisCollection(uid), (snapshot) => {
    const emojis = {};
    snapshot.docs.forEach((doc) => {
      emojis[doc.id] = doc.data().emoji;
    });
    callback(emojis);
  });
};

export const saveCustomEmoji = async (uid, name, emoji) => {
  const docId = name.toLowerCase().trim();
  try {
    await setDoc(userCustomEmojiDoc(uid, docId), { emoji, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error('Error saving custom emoji: ', error);
  }
};
