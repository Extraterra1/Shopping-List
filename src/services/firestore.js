import { db } from '../firebaseDb';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { getEmojiForProduct } from '../utils/emoji';

const userGroceriesCollection = (uid) => collection(db, 'users', uid, 'groceries');
const userCustomEmojisCollection = (uid) => collection(db, 'users', uid, 'custom_emojis');
const userGroceryDoc = (uid, id) => doc(db, 'users', uid, 'groceries', id);
const userCustomEmojiDoc = (uid, id) => doc(db, 'users', uid, 'custom_emojis', id);

export const subscribeToGroceries = (uid, callback) => {
  // Sort by 'order' by default.
  // Note: New items will have high 'order' (Date.now()), so if we want them at top,
  // we might want descending?
  // User wants Drag & Drop. Usually Top = 0.
  // Let's use ascending sort.
  // We'll set new items to have a very small order (negative timestamp) to appear at top.
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

export const addGroceryItem = async (uid, name) => {
  try {
    const cleanName = titleCase(name);
    const emoji = getEmojiForProduct(cleanName);
    // Negative timestamp ensures new items appear at the top (smallest number) in ascending sort
    const order = -Date.now();

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
  items.forEach((item, index) => {
    const ref = userGroceryDoc(uid, item.id);
    // Assign explicit index as order (0, 1, 2...)
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
