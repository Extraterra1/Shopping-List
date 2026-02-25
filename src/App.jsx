import { useEffect, useState } from "react";
import "./index.css";
import AppShell from "./components/AppShell";
import Onboarding from "./components/Onboarding";
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
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let hasResolvedRedirect = false;
    let hasReceivedAuthState = false;

    const markReady = () => {
      if (!isMounted) {
        return;
      }

      if (hasResolvedRedirect && hasReceivedAuthState) {
        setIsAuthReady(true);
        setIsBusy(false);
      }
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
        setAuthError(`We couldn't complete sign-in${errorCode}. Please try again.`);
      } finally {
        hasResolvedRedirect = true;
        markReady();
      }
    };

    const unsubscribe = observeAuthState((currentUser) => {
      hasReceivedAuthState = true;

      if (currentUser) {
        upsertUserProfile(currentUser).catch((error) => {
          console.error("Failed to upsert user profile", error);
        });
      }

      setUser(currentUser);
      markReady();
    });
    initializeAuth();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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
    setAuthError("");
    try {
      await signInWithGoogleRedirect();
    } catch (error) {
      console.error("Google sign-in failed", error);
      setAuthError("Google sign-in failed. Please try again.");
      setIsBusy(false);
    }
  };

  const handleTestSignIn = async () => {
    setIsBusy(true);
    setAuthError("");
    try {
      await signInTestUser();
    } catch (error) {
      console.error("Test sign-in failed", error);
      setAuthError(error.message || "Test sign-in failed.");
      setIsBusy(false);
    }
  };

  const handleSignOut = async () => {
    setIsBusy(true);
    setAuthError("");
    try {
      await signOutCurrentUser();
    } catch (error) {
      console.error("Sign-out failed", error);
      setAuthError("Sign-out failed. Please try again.");
      setIsBusy(false);
    }
  };

  if (!isAuthReady) {
    return (
      <main>
        <div className="container" style={{ paddingTop: "var(--spacing-xl)" }}>
          <p className="subtitle" data-testid="auth-loading">Loading your session...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <Onboarding
        onGoogleSignIn={handleGoogleSignIn}
        onTestSignIn={handleTestSignIn}
        loading={isBusy}
        error={authError}
      />
    );
  }

  return (
    <AppShell user={user} onSignOut={handleSignOut} />
  );
}

export default App;
