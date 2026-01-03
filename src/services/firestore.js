import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { getEmojiForProduct } from '../utils/emoji';

const COLLECTION_NAME = 'groceries';

export const subscribeToGroceries = (callback) => {
  // Sort by 'order' by default. 
  // Note: New items will have high 'order' (Date.now()), so if we want them at top,
  // we might want descending?
  // User wants Drag & Drop. Usually Top = 0.
  // Let's use ascending sort.
  // We'll set new items to have a very small order (negative timestamp) to appear at top.
  const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  });
};

// Helper to capitalize first letter
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const addGroceryItem = async (name) => {
  try {
    const cleanName = capitalize(name.trim());
    const emoji = getEmojiForProduct(cleanName);
    // Negative timestamp ensures new items appear at the top (smallest number) in ascending sort
    const order = -Date.now(); 
    
    await addDoc(collection(db, COLLECTION_NAME), {
      name: cleanName,
      emoji,
      checked: false,
      order,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const updateGroceryOrder = async (items) => {
  const batch = writeBatch(db);
  items.forEach((item, index) => {
    const ref = doc(db, COLLECTION_NAME, item.id);
    // Assign explicit index as order (0, 1, 2...)
    batch.update(ref, { order: index });
  });
  await batch.commit();
};

export const toggleGroceryItem = async (id, currentStatus) => {
  const itemRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(itemRef, {
    checked: !currentStatus
  });
};

export const updateGroceryItem = async (id, data) => {
  const itemRef = doc(db, COLLECTION_NAME, id);
  const updates = { ...data };
  if (updates.name) {
    updates.name = capitalize(updates.name.trim());
  }
  await updateDoc(itemRef, updates);
};

export const removeGroceryItem = async (id) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

// Custom Emojis
const CUSTOM_EMOJI_COLLECTION = 'custom_emojis';

export const subscribeToCustomEmojis = (callback) => {
  return onSnapshot(collection(db, CUSTOM_EMOJI_COLLECTION), (snapshot) => {
    const emojis = {};
    snapshot.docs.forEach(doc => {
      emojis[doc.id] = doc.data().emoji;
    });
    callback(emojis);
  });
};

export const saveCustomEmoji = async (name, emoji) => {
  const docId = name.toLowerCase().trim();
  try {
    await setDoc(doc(db, CUSTOM_EMOJI_COLLECTION, docId), { emoji });
  } catch (error) {
    console.error("Error saving custom emoji: ", error);
  }
};
