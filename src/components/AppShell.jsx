import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FiLogOut } from "react-icons/fi";
import AddItem from "./AddItem";
import ProductList from "./ProductList";
import Button from "./ui/Button";

const AppShell = ({ user, onSignOut }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const userName = user.displayName || user.email || "User";
  const avatarChar = userName[0]?.toUpperCase() || "U";

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
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
    <main data-testid="app-shell">
      <div className="container">
        <header style={{ marginBottom: "var(--spacing-xl)", paddingTop: "var(--spacing-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--spacing-md)" }}>
            <div>
              <h1 className="title">Groceries</h1>
              <p className="subtitle">Your mobile shopping list</p>
            </div>

            <div style={{ position: "relative" }} ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                aria-label="Open account menu"
                aria-expanded={menuOpen}
                data-testid="account-menu-trigger"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-sm)",
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  padding: "var(--spacing-xs) var(--spacing-sm)",
                  borderRadius: "var(--radius-md)"
                }}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={userName}
                    width={36}
                    height={36}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                    referrerPolicy="no-referrer"
                    data-testid="user-avatar"
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(0,0,0,0.08)",
                      fontWeight: 700
                    }}
                    data-testid="user-avatar-fallback"
                  >
                    {avatarChar}
                  </div>
                )}
                <div style={{ minWidth: 0, textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} data-testid="user-name">
                    {userName}
                  </p>
                </div>
              </button>

              {menuOpen ? (
                <div
                  data-testid="account-menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + var(--spacing-sm))",
                    right: 0,
                    width: 170,
                    padding: "var(--spacing-sm)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--surface-color)",
                    boxShadow: "var(--shadow-md)",
                    zIndex: 20
                  }}
                >
                  <Button
                    variant="secondary"
                    icon={FiLogOut}
                    onClick={() => {
                      setMenuOpen(false);
                      onSignOut();
                    }}
                    data-testid="sign-out"
                    aria-label="Sign out"
                    style={{
                      padding: "8px 12px",
                      fontSize: "0.9rem",
                      borderRadius: "var(--radius-md)"
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <AddItem uid={user.uid} />
        <ProductList uid={user.uid} />
      </div>
    </main>
  );
};

AppShell.propTypes = {
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    email: PropTypes.string,
    photoURL: PropTypes.string
  }).isRequired,
  onSignOut: PropTypes.func.isRequired
};

export default AppShell;
