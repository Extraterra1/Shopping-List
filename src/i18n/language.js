export const DEFAULT_LANGUAGE = "en-US";
export const LANGUAGE_STORAGE_KEY = "shopping_list_language";

export const SUPPORTED_LANGUAGES = [
  { code: "en-US", flag: "🇺🇸", labelKey: "language.englishUs" },
  { code: "pt-PT", flag: "🇵🇹", labelKey: "language.portuguesePt" },
  { code: "es-ES", flag: "🇪🇸", labelKey: "language.spanishEs" }
];

const SUPPORTED_CODES = new Set(SUPPORTED_LANGUAGES.map((entry) => entry.code));

export const isSupportedLanguage = (value) => SUPPORTED_CODES.has(value);

export const normalizeLanguage = (value) => {
  if (!value || typeof value !== "string") {
    return DEFAULT_LANGUAGE;
  }

  const trimmed = value.trim();
  if (isSupportedLanguage(trimmed)) {
    return trimmed;
  }

  const lowered = trimmed.toLowerCase();

  if (lowered.startsWith("pt")) {
    return "pt-PT";
  }

  if (lowered.startsWith("es")) {
    return "es-ES";
  }

  if (lowered.startsWith("en")) {
    return "en-US";
  }

  return DEFAULT_LANGUAGE;
};

export const detectDeviceLanguage = () => {
  if (typeof navigator === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = normalizeLanguage(candidate);
    if (isSupportedLanguage(normalized)) {
      return normalized;
    }
  }

  return DEFAULT_LANGUAGE;
};

export const getStoredLanguage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const normalized = normalizeLanguage(stored);
    return isSupportedLanguage(normalized) ? normalized : null;
  } catch (error) {
    console.error("Failed to read stored language", error);
    return null;
  }
};

export const setStoredLanguage = (language) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(language));
  } catch (error) {
    console.error("Failed to persist language", error);
  }
};
