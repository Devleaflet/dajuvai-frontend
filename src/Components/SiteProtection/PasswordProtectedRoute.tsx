import React, { useState, useEffect } from "react";

// ========================================
// PASSWORD PROTECTED ROUTE COMPONENT
// ========================================
const PASSWORD = "this is password";

// Lucide React-style SVG Icons (Light Orange Theme)
const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="m12 13.5 4-4a3.2 3.2 0 0 1 4.5 4.5l-4 4"/>
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const PasswordProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const isLocal = false; // set true in development

    // If local, just render without password
    if (isLocal) {
        return <>{children}</>;
    }

    const [enteredPassword, setEnteredPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const savedAuth = localStorage.getItem("authenticated");
        if (savedAuth === "true") {
            setIsAuthenticated(true);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (enteredPassword === PASSWORD) {
            setIsAuthenticated(true);
            localStorage.setItem("authenticated", "true");
        } else {
            alert("Incorrect password");
        }
    };

    // ========================================
    // AUTHENTICATION UI (Light Orange Theme)
    // ========================================
    if (!isAuthenticated) {
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
                    {/* Header Section */}
                    <div
                        style={{
                            backgroundColor: "#fff7ed",
                            padding: "2rem 1.5rem",
                            textAlign: "center",
                            position: "relative",
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

                    {/* Form Section */}
                    <div style={{ padding: "2rem 1.5rem 1.5rem" }}>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: "1.25rem" }}>
                                <label
                                    htmlFor="password"
                                    style={{
                                        display: "block",
                                        marginBottom: "0.5rem",
                                        fontWeight: "600",
                                        color: "#1c1917",
                                        fontSize: "0.875rem",
                                        lineHeight: "1.25",
                                    }}
                                >
                                    Password
                                </label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        id="password"
                                        type="password"
                                        value={enteredPassword}
                                        onChange={(e) =>
                                            setEnteredPassword(e.target.value)
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem 1rem 0.75rem 2.75rem",
                                            border: "1px solid #fde6d0",
                                            borderRadius: "8px",
                                            fontSize: "1rem",
                                            backgroundColor: "#fff",
                                            color: "#1c1917",
                                            transition:
                                                "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            lineHeight: "1.5",
                                            outline: "none",
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
                                    transition:
                                        "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    position: "relative",
                                    overflow: "hidden",
                                    lineHeight: "1.5",
                                    boxShadow:
                                        "0 1px 3px 0 rgba(249, 115, 22, 0.15)",
                                }}
                                onMouseEnter={(e) => {
                                    (e.target as HTMLButtonElement).style.backgroundColor =
                                        "#ea580c";
                                    (e.target as HTMLButtonElement).style.transform =
                                        "translateY(-1px)";
                                    (e.target as HTMLButtonElement).style.boxShadow =
                                        "0 4px 8px -1px rgba(249, 115, 22, 0.25), 0 2px 4px -1px rgba(249, 115, 22, 0.15)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLButtonElement).style.backgroundColor =
                                        "#f97316";
                                    (e.target as HTMLButtonElement).style.transform =
                                        "translateY(0)";
                                    (e.target as HTMLButtonElement).style.boxShadow =
                                        "0 1px 3px 0 rgba(249, 115, 22, 0.15)";
                                }}
                            >
                                <span style={{ position: "relative", zIndex: "2" }}>
                                    Sign In
                                </span>
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "0",
                                        left: "-100%",
                                        width: "100%",
                                        height: "100%",
                                        background:
                                            "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
                                        transition: "left 0.7s ease",
                                        zIndex: "1",
                                    }}
                                ></div>
                            </button>
                        </form>
                    </div>

                    {/* Footer Section */}
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
                        Secure authentication required
                    </div>
                </div>

                {/* Responsive & Enhancement Styles */}
                <style>{`
                    @media (max-width: 640px) {
                        div[style*="maxWidth: '420px'"] {
                            margin: 0.75rem;
                            border-radius: 12px;
                        }
                        
                        div[style*="padding: '2rem 1.5rem'"] {
                            padding: 1.5rem 1.25rem;
                        }
                        
                        div[style*="padding: '2rem 1.5rem 1.5rem'"] {
                            padding: 1.5rem 1.25rem 1.25rem;
                        }
                        
                        h1[style*="fontSize: '1.5rem'"] {
                            font-size: 1.25rem;
                        }
                        
                        div[style*="padding: '1rem 1.5rem'"] {
                            padding: 0.875rem 1.25rem;
                        }
                    }
                    
                    /* Smooth focus transitions for all interactive elements */
                    input, button {
                        will-change: transform, box-shadow;
                    }
                    
                    /* Prevent layout shift on hover */
                    div[style*="boxShadow"] {
                        contain: layout style paint;
                    }
                `}</style>
            </div>
        );
    }

    return <>{children}</>;
};

export default PasswordProtectedRoute;