import PropTypes from "prop-types";
import { FcGoogle } from "react-icons/fc";
import Button from "./ui/Button";

const Onboarding = ({ onGoogleSignIn, onTestSignIn, loading, error }) => {
  return (
    <main className="onboarding-root" data-testid="onboarding-screen">
      <div className="container onboarding-container">
        <section className="card onboarding-hero">
          <p className="onboarding-eyebrow">Private by Default</p>
          <h1 className="onboarding-title">Groceries That Stay Organized Without the Mess.</h1>
          <p className="onboarding-description">
            Build your list fast, keep custom emojis per item, and sync instantly between devices.
            Every account has its own private list and preferences.
          </p>
          <div className="onboarding-tags" aria-hidden="true">
            <span>Fast Add</span>
            <span>Live Sync</span>
            <span>Per-User Lists</span>
          </div>
        </section>

        <section className="card onboarding-auth-card">
          <p className="onboarding-cta-kicker">Get started</p>
          <h2 className="onboarding-cta-title">Continue With Your Google Account</h2>
          <p className="onboarding-cta-description">
            Sign in now and start tracking what you need to buy, edit, and complete in one place.
          </p>
          <Button
            className="google-signin-button"
            variant="secondary"
            onClick={onGoogleSignIn}
            disabled={loading}
            icon={FcGoogle}
            aria-label="Continue with Google"
            data-testid="google-signin"
            style={{
              backgroundColor: "var(--surface-color)",
              border: "1px solid rgba(125, 125, 130, 0.35)"
            }}
          >
            Continue With Google
          </Button>

          {import.meta.env.VITE_E2E_AUTH_BYPASS === "true" && (
            <div style={{ marginTop: "var(--spacing-sm)" }}>
              <Button
                variant="secondary"
                onClick={onTestSignIn}
                disabled={loading}
                aria-label="Sign in with test user"
                data-testid="test-login"
              >
                Sign In Test User
              </Button>
            </div>
          )}
        </section>

        {error ? (
          <p className="onboarding-auth-error" data-testid="auth-error">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
};

Onboarding.propTypes = {
  onGoogleSignIn: PropTypes.func.isRequired,
  onTestSignIn: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string
};

export default Onboarding;
