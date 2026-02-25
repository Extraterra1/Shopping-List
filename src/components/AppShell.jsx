import PropTypes from "prop-types";
import AddItem from "./AddItem";
import ProductList from "./ProductList";
import Button from "./ui/Button";

const AppShell = ({ user, onSignOut }) => {
  const userName = user.displayName || user.email || "User";
  const avatarChar = userName[0]?.toUpperCase() || "U";

  return (
    <main data-testid="app-shell">
      <div className="container">
        <header style={{ marginBottom: "var(--spacing-xl)", paddingTop: "var(--spacing-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--spacing-md)" }}>
            <div>
              <h1 className="title">Groceries</h1>
              <p className="subtitle">Your mobile shopping list</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
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
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} data-testid="user-name">
                  {userName}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "var(--spacing-sm)", maxWidth: 150 }}>
            <Button variant="secondary" onClick={onSignOut} data-testid="sign-out" aria-label="Sign out">
              Sign Out
            </Button>
          </div>
        </header>

        <AddItem />
        <ProductList />
      </div>
    </main>
  );
};

AppShell.propTypes = {
  user: PropTypes.shape({
    displayName: PropTypes.string,
    email: PropTypes.string,
    photoURL: PropTypes.string
  }).isRequired,
  onSignOut: PropTypes.func.isRequired
};

export default AppShell;
