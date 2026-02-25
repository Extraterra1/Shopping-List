import { lazy, Suspense, useEffect, useRef, useState } from "react";
import "./index.css";
import Onboarding from "./components/Onboarding";
import { useLanguage } from "./context/LanguageContext";
import {
  initializeAuthPersistence,
  maybeHandleRedirectResult,
  observeAuthState,
  signInTestUser,
  signInWithGoogleRedirect,
  signOutCurrentUser
} from "./services/auth";
import { setCustomEmojiMap } from "./utils/emoji";

const AppShell = lazy(() => import("./components/AppShell"));
const LAST_AUTH_USER_KEY = "shopping_list_last_auth_user";
const AUTH_REDIRECT_PENDING_KEY = "shopping_list_auth_redirect_pending";

const getStoredFlag = (key) => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
};

const setStoredFlag = (key, value) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value ? "true" : "false");
  } catch {
    // Ignore storage failures in restricted browser modes.
  }
};

const clearStoredFlag = (key) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures in restricted browser modes.
  }
};

function App() {
  const { language, setLanguage, t } = useLanguage();
  const languageRef = useRef(language);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [shouldGateAuth, setShouldGateAuth] = useState(
    () => getStoredFlag(LAST_AUTH_USER_KEY) || getStoredFlag(AUTH_REDIRECT_PENDING_KEY)
  );
  const [isBusy, setIsBusy] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [languageErrorKey, setLanguageErrorKey] = useState("");

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    let isMounted = true;
    let hasResolvedRedirect = false;
    let hasSettledInitialAuth = false;
    let initialNullTimer = null;

    const markReady = () => {
      if (!isMounted) {
        return;
      }

      if (hasResolvedRedirect && hasSettledInitialAuth) {
        setIsAuthReady(true);
        setIsBusy(false);
      }
    };

    const clearInitialNullTimer = () => {
      if (initialNullTimer) {
        clearTimeout(initialNullTimer);
        initialNullTimer = null;
      }
    };

    const applyUser = (currentUser, { isInitial = false } = {}) => {
      if (!isMounted) {
        return;
      }

      if (!currentUser) {
        setUser(null);
        setStoredFlag(LAST_AUTH_USER_KEY, false);
        if (isInitial) {
          setShouldGateAuth(false);
          hasSettledInitialAuth = true;
          markReady();
        }
        return;
      }

      import("./services/userProfile")
        .then(({ upsertUserProfile }) =>
          upsertUserProfile(currentUser, { preferredLanguage: languageRef.current })
        )
        .then((profile) => {
          const profileLanguage = profile?.language;
          if (profileLanguage && profileLanguage !== languageRef.current) {
            const resolved = setLanguage(profileLanguage);
            languageRef.current = resolved;
          }
        })
        .catch((error) => {
          console.error("Failed to upsert user profile", error);
        })
        .finally(() => {
          if (!isMounted) {
            return;
          }

          setUser(currentUser);
          setStoredFlag(LAST_AUTH_USER_KEY, true);
          clearStoredFlag(AUTH_REDIRECT_PENDING_KEY);
          setShouldGateAuth(true);
          if (isInitial) {
            hasSettledInitialAuth = true;
            markReady();
          }
        });
    };

    const initializeAuth = async () => {
      try {
        await initializeAuthPersistence();
      } catch (error) {
        console.error("Failed to initialize auth persistence", error);
      }

      try {
        await maybeHandleRedirectResult();
      } catch (error) {
        console.error("Failed to handle auth redirect result", error);
        const errorCode = error?.code ? ` (${error.code})` : "";
        setAuthError({
          key: "errors.redirectFailed",
          vars: { code: errorCode }
        });
      } finally {
        clearStoredFlag(AUTH_REDIRECT_PENDING_KEY);
        hasResolvedRedirect = true;
        markReady();
      }
    };

    const unsubscribe = observeAuthState((currentUser) => {
      if (hasSettledInitialAuth) {
        applyUser(currentUser);
        return;
      }

      if (currentUser) {
        clearInitialNullTimer();
        applyUser(currentUser, { isInitial: true });
        return;
      }

      if (!initialNullTimer) {
        initialNullTimer = setTimeout(() => {
          initialNullTimer = null;
          applyUser(null, { isInitial: true });
        }, 250);
      }
    });
    initializeAuth();

    return () => {
      isMounted = false;
      clearInitialNullTimer();
      unsubscribe();
    };
  }, [setLanguage]);

  useEffect(() => {
    if (!user?.uid) {
      setCustomEmojiMap({});
      return () => {};
    }

    let active = true;
    let unsubscribe = null;

    import("./services/firestore")
      .then(({ subscribeToCustomEmojis }) => {
        if (!active) {
          return;
        }

        unsubscribe = subscribeToCustomEmojis(user.uid, (map) => {
          setCustomEmojiMap(map);
        });
      })
      .catch((error) => {
        console.error("Failed to load emoji subscriptions", error);
      });

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
      setCustomEmojiMap({});
    };
  }, [user?.uid]);

  const handleGoogleSignIn = async () => {
    setIsBusy(true);
    setAuthError(null);
    setShouldGateAuth(true);
    setStoredFlag(AUTH_REDIRECT_PENDING_KEY, true);
    try {
      const signInMode = await signInWithGoogleRedirect();
      if (signInMode === "popup") {
        clearStoredFlag(AUTH_REDIRECT_PENDING_KEY);
      }
    } catch (error) {
      clearStoredFlag(AUTH_REDIRECT_PENDING_KEY);
      setShouldGateAuth(getStoredFlag(LAST_AUTH_USER_KEY));
      console.error("Google sign-in failed", error);
      setAuthError({ key: "errors.googleSignInFailed" });
      setIsBusy(false);
    }
  };

  const handleTestSignIn = async () => {
    setIsBusy(true);
    setAuthError(null);
    try {
      await signInTestUser();
    } catch (error) {
      console.error("Test sign-in failed", error);
      setAuthError({
        raw: error.message || t("errors.testSignInFailed")
      });
      setIsBusy(false);
    }
  };

  const handleSignOut = async () => {
    setIsBusy(true);
    setAuthError(null);
    setLanguageErrorKey("");
    try {
      await signOutCurrentUser();
      setStoredFlag(LAST_AUTH_USER_KEY, false);
      clearStoredFlag(AUTH_REDIRECT_PENDING_KEY);
      setShouldGateAuth(false);
    } catch (error) {
      console.error("Sign-out failed", error);
      setAuthError({ key: "errors.signOutFailed" });
      setIsBusy(false);
    }
  };

  const handleLanguageChange = async (nextLanguage) => {
    const resolvedLanguage = setLanguage(nextLanguage);
    languageRef.current = resolvedLanguage;
    setLanguageErrorKey("");

    if (!user) {
      return;
    }

    try {
      const { upsertUserProfile } = await import("./services/userProfile");
      await upsertUserProfile(user, {
        preferredLanguage: resolvedLanguage,
        overrideLanguage: true
      });
    } catch (error) {
      console.error("Failed to persist language preference", error);
      setLanguageErrorKey("menu.languageSaveFailed");
    }
  };

  const authErrorMessage = authError
    ? authError.raw || t(authError.key, authError.vars)
    : "";

  const onboardingScreen = (
    <Onboarding
      onGoogleSignIn={handleGoogleSignIn}
      onTestSignIn={handleTestSignIn}
      onLanguageChange={handleLanguageChange}
      loading={isBusy}
      error={authErrorMessage}
    />
  );

  if (!isAuthReady) {
    if (!shouldGateAuth) {
      return onboardingScreen;
    }

    return (
      <main data-testid="auth-loading">
        <div className="container auth-skeleton-container">
          <div className="auth-skeleton-card">
            <div className="auth-skeleton-line auth-skeleton-line-title" />
            <div className="auth-skeleton-line auth-skeleton-line-subtitle" />
            <div className="auth-skeleton-line auth-skeleton-line-subtitle" />
            <div className="auth-skeleton-button" />
          </div>

          <div className="auth-skeleton-list">
            <div className="auth-skeleton-item" />
            <div className="auth-skeleton-item" />
            <div className="auth-skeleton-item" />
          </div>

          <p className="subtitle auth-skeleton-label">{t("app.loadingSession")}</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return onboardingScreen;
  }

  return (
    <Suspense fallback={<main data-testid="app-shell-loading" />}>
      <AppShell
        user={user}
        onSignOut={handleSignOut}
        onLanguageChange={handleLanguageChange}
        languageError={languageErrorKey ? t(languageErrorKey) : ""}
      />
    </Suspense>
  );
}

export default App;
