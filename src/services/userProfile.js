import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebaseDb";
import { isSupportedLanguage, normalizeLanguage } from "../i18n/language";

const resolveLanguageForProfile = (existingLanguage, preferredLanguage, overrideLanguage) => {
  const normalizedExisting = isSupportedLanguage(existingLanguage) ? existingLanguage : null;
  const normalizedPreferred = preferredLanguage ? normalizeLanguage(preferredLanguage) : null;

  if (overrideLanguage && normalizedPreferred) {
    return normalizedPreferred;
  }

  return normalizedExisting || normalizedPreferred || null;
};

export const upsertUserProfile = async (user, options = {}) => {
  const { preferredLanguage = null, overrideLanguage = false } = options;
  const profileRef = doc(db, "users", user.uid);
  const existing = await getDoc(profileRef);
  const existingData = existing.exists() ? existing.data() : null;
  const resolvedLanguage = resolveLanguageForProfile(
    existingData?.language,
    preferredLanguage,
    overrideLanguage
  );

  const profileData = {
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    lastLoginAt: serverTimestamp()
  };

  if (resolvedLanguage) {
    profileData.language = resolvedLanguage;
  }

  if (existingData) {
    await setDoc(
      profileRef,
      {
        ...profileData,
        createdAt: existingData.createdAt
      },
      { merge: true }
    );
    return { ...existingData, ...profileData, createdAt: existingData.createdAt };
  }

  await setDoc(
    profileRef,
    {
      ...profileData,
      createdAt: serverTimestamp()
    },
    { merge: true }
  );

  return profileData;
};
