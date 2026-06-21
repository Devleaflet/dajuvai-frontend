import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSiteProtection } from "./SiteProtectionContext";
import FeatureComingSoon from "../../Pages/WebsiteComingSoon";

const ShieldCheckIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const KeyIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m12 13.5 4-4a3.2 3.2 0 0 1 4.5 4.5l-4 4" />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const SiteGate = ({ children }: { children: React.ReactNode }) => {
  const { isUnlocked, tryUnlock } = useSiteProtection();
  const location = useLocation();
  const navigate = useNavigate();
  const [enteredPassword, setEnteredPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Already unlocked for this session — render everything normally
  if (isUnlocked) return <>{children}</>;

  // On root path while locked, show the generic "Something Went Wrong" / Coming Soon blocker
  if (location.pathname === "/") return <FeatureComingSoon />;

  // On any other valid path, show the password form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = tryUnlock(enteredPassword);
    if (success) {
      navigate("/");
    } else {
      setEnteredPassword("");
      navigate("/");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#fdf9f5",
        padding: "1rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow:
            "0 4px 12px -3px rgba(255, 140, 0, 0.08), 0 2px 4px -2px rgba(255, 140, 0, 0.05)",
          overflow: "hidden",
          transition:
            "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease",
          position: "relative",
          border: "1px solid #ffedd5",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow =
            "0 12px 20px -4px rgba(255, 140, 0, 0.12), 0 6px 8px -3px rgba(255, 140, 0, 0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 4px 12px -3px rgba(255, 140, 0, 0.08), 0 2px 4px -2px rgba(255, 140, 0, 0.05)";
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#fff7ed",
            padding: "2rem 1.5rem",
            textAlign: "center",
            borderBottom: "1px solid #ffedd5",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "#ffedd5",
              borderRadius: "50%",
              margin: "0 auto 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ea580c",
            }}
          >
            <ShieldCheckIcon />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#1c1917",
              marginBottom: "0.25rem",
              lineHeight: "1.25",
            }}
          >
            Secure Access
          </h1>
          <p
            style={{
              color: "#78350f",
              fontSize: "0.875rem",
              lineHeight: "1.4",
            }}
          >
            Enter your password to continue
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "2rem 1.5rem 1.5rem" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="site-password"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                  color: "#1c1917",
                  fontSize: "0.875rem",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="site-password"
                  type={showPassword ? "text" : "password"}
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 3.25rem 0.75rem 2.75rem",
                    border: "1px solid #fde6d0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    backgroundColor: "#fff",
                    color: "#1c1917",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    lineHeight: "1.5",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  placeholder="••••••••"
                  onFocus={(e) => {
                    e.target.style.borderColor = "#fdba74";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(251, 191, 36, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#fde6d0";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#f97316",
                  }}
                >
                  <KeyIcon />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#f97316";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#9ca3af";
                  }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.875rem",
                backgroundColor: "#f97316",
                color: "white",
                fontWeight: "600",
                fontSize: "1rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                lineHeight: "1.5",
                boxShadow: "0 1px 3px 0 rgba(249, 115, 22, 0.15)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#ea580c";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 4px 8px -1px rgba(249, 115, 22, 0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#f97316";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 1px 3px 0 rgba(249, 115, 22, 0.15)";
              }}
            >
              Unlock Access
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: "#fffdf9",
            padding: "1rem 1.5rem",
            textAlign: "center",
            borderTop: "1px solid #ffedd5",
            color: "#b45309",
            fontSize: "0.75rem",
            lineHeight: "1.33",
          }}
        >
          Demo access — developers &amp; managers only
        </div>
      </div>
    </div>
  );
};

export default SiteGate;
