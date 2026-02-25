import { useEffect, useRef, useState } from "react";
import "./index.css";
import AppShell from "./components/AppShell";
import Onboarding from "./components/Onboarding";
import { useLanguage } from "./context/LanguageContext";
import {
  initializeAuthPersistence,
  maybeHandleRedirectResult,
  observeAuthState,
  signInTestUser,
  signInWithGoogleRedirect,
  signOutCurrentUser,
  upsertUserProfile
} from "./services/auth";
import { subscribeToCustomEmojis } from "./services/firestore";
import { setCustomEmojiMap } from "./utils/emoji";

function App() {
  const { language, setLanguage, t } = useLanguage();
  const languageRef = useRef(language);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
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
        if (isInitial) {
          hasSettledInitialAuth = true;
          markReady();
        }
        return;
      }

      upsertUserProfile(currentUser, { preferredLanguage: languageRef.current })
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

    const unsubscribe = subscribeToCustomEmojis(user.uid, (map) => {
      setCustomEmojiMap(map);
    });

    return () => {
      unsubscribe();
      setCustomEmojiMap({});
    };
  }, [user?.uid]);

  const handleGoogleSignIn = async () => {
    setIsBusy(true);
    setAuthError(null);
    try {
      await signInWithGoogleRedirect();
    } catch (error) {
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
      await upsertUserProfile(user, {
        preferredLanguage: resolvedLanguage,
        overrideLanguage: true
      });
    } catch (error) {
      console.error("Failed to persist language preference", error);
      setLanguageErrorKey("menu.languageSaveFailed");
    }
  };

  if (!isAuthReady) {
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

  const authErrorMessage = authError
    ? authError.raw || t(authError.key, authError.vars)
    : "";

  if (!user) {
    return (
      <Onboarding
        onGoogleSignIn={handleGoogleSignIn}
        onTestSignIn={handleTestSignIn}
        onLanguageChange={handleLanguageChange}
        loading={isBusy}
        error={authErrorMessage}
      />
    );
  }

  return (
    <AppShell
      user={user}
      onSignOut={handleSignOut}
      onLanguageChange={handleLanguageChange}
      languageError={languageErrorKey ? t(languageErrorKey) : ""}
    />
  );
}

export default App;
