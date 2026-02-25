import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase project configuration
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-shopping-list";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:demo"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

if (import.meta.env.VITE_USE_FIRESTORE_EMULATOR === "true") {
  const host = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || "127.0.0.1";
  const port = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || "8080");
  connectFirestoreEmulator(db, host, port);
}
