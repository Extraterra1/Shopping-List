import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut
} from "firebase/auth";
import { auth } from "../firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const observeAuthState = (callback) => onAuthStateChanged(auth, callback);

export const signInWithGoogleRedirect = async () => {
  await signInWithRedirect(auth, googleProvider);
};

export const maybeHandleRedirectResult = async () => {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
};

export const signOutCurrentUser = async () => {
  await signOut(auth);
};

export const signInTestUser = async () => {
  if (import.meta.env.VITE_E2E_AUTH_BYPASS !== "true") {
    throw new Error("Test sign-in is disabled outside E2E bypass mode.");
  }

  const email = import.meta.env.VITE_TEST_USER_EMAIL || "ui-test@example.com";
  const password = import.meta.env.VITE_TEST_USER_PASSWORD || "ui-test-password";
  await signInWithEmailAndPassword(auth, email, password);
};
