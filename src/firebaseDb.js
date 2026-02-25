import { connectFirestoreEmulator, getFirestore, initializeFirestore } from "firebase/firestore";
import { app } from "./firebaseApp";

const useFirestoreEmulator = import.meta.env.VITE_USE_FIRESTORE_EMULATOR === "true";

export const db = useFirestoreEmulator
  ? initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false
    })
  : getFirestore(app);

if (useFirestoreEmulator) {
  const host = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || "localhost";
  const port = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || "8080");
  connectFirestoreEmulator(db, host, port);
}
