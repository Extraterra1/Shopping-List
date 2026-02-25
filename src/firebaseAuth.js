import { connectAuthEmulator, getAuth } from "firebase/auth";
import { app } from "./firebaseApp";

export const auth = getAuth(app);

const useAuthEmulator = import.meta.env.VITE_USE_AUTH_EMULATOR === "true";

if (useAuthEmulator) {
  const host = import.meta.env.VITE_AUTH_EMULATOR_HOST || "localhost";
  const port = Number(import.meta.env.VITE_AUTH_EMULATOR_PORT || "9099");
  connectAuthEmulator(auth, `http://${host}:${port}`, { disableWarnings: true });
}
