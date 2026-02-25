import {
  browserLocalPersistence,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  setPersistence,
  signOut
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const observeAuthState = (callback) => onAuthStateChanged(auth, callback);

export const initializeAuthPersistence = async () => {
  await setPersistence(auth, browserLocalPersistence);
};

export const signInWithGoogleRedirect = async () => {
  // Popup is more reliable for local desktop workflows; redirect is fallback.
  try {
    await signInWithPopup(auth, googleProvider);
    return;
  } catch (error) {
    const redirectFallbackCodes = new Set([
      "auth/popup-blocked",
      "auth/operation-not-supported-in-this-environment"
    ]);

    if (!redirectFallbackCodes.has(error.code)) {
      throw error;
    }
  }

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

export const upsertUserProfile = async (user) => {
  const profileRef = doc(db, "users", user.uid);
  const profileData = {
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    lastLoginAt: serverTimestamp()
  };

  const existing = await getDoc(profileRef);
  if (existing.exists()) {
    await setDoc(profileRef, {
      ...profileData,
      createdAt: existing.data().createdAt
    }, { merge: true });
    return;
  }

  await setDoc(profileRef, {
    ...profileData,
    createdAt: serverTimestamp()
  });
};
