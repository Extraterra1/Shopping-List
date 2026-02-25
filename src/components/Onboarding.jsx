import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FaLanguage } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useLanguage } from "../context/LanguageContext";
import Button from "./ui/Button";

const Onboarding = ({
  onGoogleSignIn,
  onTestSignIn,
  onLanguageChange,
  loading,
  error
}) => {
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef(null);
  const { language, supportedLanguages, t } = useLanguage();

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!languageMenuRef.current?.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <main className="onboarding-root" data-testid="onboarding-screen">
      <div className="container onboarding-container">
        <div className="onboarding-language-menu-wrap" ref={languageMenuRef}>
          <button
            type="button"
            className="onboarding-language-trigger"
            onClick={() => setLanguageMenuOpen((current) => !current)}
            aria-label={t("onboarding.languageMenuAria")}
            aria-expanded={languageMenuOpen}
            data-testid="onboarding-language-trigger"
          >
            <FaLanguage />
          </button>

          {languageMenuOpen ? (
            <div
              className="onboarding-language-menu"
              data-testid="onboarding-language-menu"
            >
              {supportedLanguages.map((entry) => (
                <button
                  type="button"
                  key={entry.code}
                  className="onboarding-language-option"
                  data-active={entry.code === language ? "true" : "false"}
                  data-testid={`lang-option-${entry.code}`}
                  onClick={() => {
                    onLanguageChange(entry.code);
                    setLanguageMenuOpen(false);
                  }}
                >
                  <span>{entry.flag}</span>
                  <span>{entry.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <section className="card onboarding-hero">
          <p className="onboarding-eyebrow">{t("onboarding.eyebrow")}</p>
          <h1 className="onboarding-title">{t("onboarding.title")}</h1>
          <p className="onboarding-description">{t("onboarding.description")}</p>
          <div className="onboarding-tags" aria-hidden="true">
            <span>{t("onboarding.tagFastAdd")}</span>
            <span>{t("onboarding.tagLiveSync")}</span>
            <span>{t("onboarding.tagPerUserLists")}</span>
          </div>
        </section>

        <section className="card onboarding-auth-card">
          <p className="onboarding-cta-kicker">{t("onboarding.ctaKicker")}</p>
          <h2 className="onboarding-cta-title">{t("onboarding.ctaTitle")}</h2>
          <p className="onboarding-cta-description">{t("onboarding.ctaDescription")}</p>
          <Button
            className="google-signin-button"
            variant="secondary"
            onClick={onGoogleSignIn}
            disabled={loading}
            icon={FcGoogle}
            aria-label={t("onboarding.continueWithGoogle")}
            data-testid="google-signin"
            style={{
              backgroundColor: "var(--surface-color)",
              border: "1px solid rgba(125, 125, 130, 0.35)"
            }}
          >
            {t("onboarding.continueWithGoogle")}
          </Button>

          {import.meta.env.VITE_E2E_AUTH_BYPASS === "true" && (
            <div style={{ marginTop: "var(--spacing-sm)" }}>
              <Button
                variant="secondary"
                onClick={onTestSignIn}
                disabled={loading}
                aria-label={t("onboarding.testSignIn")}
                data-testid="test-login"
              >
                {t("onboarding.testSignIn")}
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
  onLanguageChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string
};

export default Onboarding;
