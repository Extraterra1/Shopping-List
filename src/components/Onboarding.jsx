import PropTypes from "prop-types";
import Button from "./ui/Button";

const Onboarding = ({ onGoogleSignIn, onTestSignIn, loading, error }) => {
  return (
    <main data-testid="onboarding-screen">
      <div className="container" style={{ paddingTop: "var(--spacing-xl)" }}>
        <header style={{ marginBottom: "var(--spacing-xl)" }}>
          <h1 className="title">Groceries</h1>
          <p className="subtitle">Sign in to keep your shopping list private and synced.</p>
        </header>

        <section className="card" style={{ marginBottom: "var(--spacing-lg)" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--spacing-md)" }}>
            Each account has an independent list and custom emoji preferences. Your data is never shared with other users.
          </p>
          <Button
            onClick={onGoogleSignIn}
            disabled={loading}
            aria-label="Continue with Google"
            data-testid="google-signin"
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
          <p data-testid="auth-error" style={{ color: "var(--danger-color)" }}>
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
