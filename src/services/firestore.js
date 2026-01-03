import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { getEmojiForProduct } from '../utils/emoji';

const COLLECTION_NAME = 'groceries';

export const subscribeToGroceries = (callback) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  });
};

export const addGroceryItem = async (name) => {
  try {
    const emoji = getEmojiForProduct(name);
    await addDoc(collection(db, COLLECTION_NAME), {
      name,
      emoji,
      checked: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const toggleGroceryItem = async (id, currentStatus) => {
  const itemRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(itemRef, {
    checked: !currentStatus
  });
};

export const removeGroceryItem = async (id) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
