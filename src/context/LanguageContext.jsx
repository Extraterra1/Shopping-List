/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import PropTypes from "prop-types";
import messages from "../i18n/messages";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  detectDeviceLanguage,
  getStoredLanguage,
  isSupportedLanguage,
  normalizeLanguage,
  setStoredLanguage
} from "../i18n/language";

const LanguageContext = createContext(null);

const getNestedValue = (source, key) => key.split(".").reduce((acc, part) => {
  if (!acc || typeof acc !== "object") {
    return undefined;
  }

  return acc[part];
}, source);

const interpolate = (template, vars) => {
  if (!vars) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token) => {
    const value = vars[token];
    return value === undefined || value === null ? "" : String(value);
  });
};

export const LanguageProvider = ({ children }) => {
  const initialLanguage = getStoredLanguage() || detectDeviceLanguage();
  const [language, setLanguageState] = useState(normalizeLanguage(initialLanguage));

  const setLanguage = useCallback((nextLanguage, options = {}) => {
    const { persist = true } = options;
    const resolvedLanguage = normalizeLanguage(nextLanguage);

    setLanguageState(resolvedLanguage);
    if (persist) {
      setStoredLanguage(resolvedLanguage);
    }

    return resolvedLanguage;
  }, []);

  const t = useCallback((key, vars) => {
    const activeMessages = messages[language] || messages[DEFAULT_LANGUAGE];
    const fallbackMessages = messages[DEFAULT_LANGUAGE];

    const value = getNestedValue(activeMessages, key) || getNestedValue(fallbackMessages, key);
    if (typeof value !== "string") {
      return key;
    }

    return interpolate(value, vars);
  }, [language]);

  const supportedLanguages = useMemo(() => SUPPORTED_LANGUAGES.map((entry) => ({
    ...entry,
    label: t(entry.labelKey)
  })), [t]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    supportedLanguages,
    isSupportedLanguage
  }), [language, setLanguage, t, supportedLanguages]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
};
