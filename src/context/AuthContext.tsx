import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { setupAxiosInterceptors } from "../api/axiosInstance";

// Define types for user data
interface UserData {
    id: number;
    username: string;
    email: string;
    role: string;
    isVerified: boolean;
    provider?: string;
    products?: unknown[];
    profilePicture?: string;
}

// Define the shape of the context
interface AuthContextType {
    user: UserData | null;
    token: string | null;
    login: (
        token: string | null,
        user: UserData,
        refreshToken?: string,
    ) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    fetchUserData: (userId: number) => Promise<UserData | null>;
    getUserStatus: () => string;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: () => {},
    logout: () => {},
    isAuthenticated: false,
    isLoading: false,
    fetchUserData: async () => null,
    getUserStatus: () => "Not logged in",
});

// Helper to decode JWT token and get expiration time
const getTokenExpiration = (token: string): number | null => {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};

// Helper to check if token is still valid (not expired)
const isTokenValid = (token: string): boolean => {
    const expiration = getTokenExpiration(token);
    return expiration ? expiration > Date.now() : false;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const isAuthenticated = !!user;

    // Initialize auth state
    const initializeAuth = useCallback(async () => {
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("authUser");

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (storedToken && isTokenValid(storedToken)) {
                    setToken(storedToken);
                    setUser(parsedUser);
                    setIsLoading(false);
                    return;
                }
                setUser(parsedUser);
                try {
                    const response = await fetch(
                        `${API_BASE_URL}/api/auth/me`,
                        {
                            credentials: "include",
                            headers: {
                                Accept: "application/json",
                            },
                        },
                    );
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data) {
                            const updatedUser = {
                                id: data.data.id || data.data.userId,
                                email: data.data.email,
                                role: data.data.role,
                                username:
                                    data.data.username ||
                                    (data.data.email
                                        ? data.data.email.split("@")[0]
                                        : "User"),
                                isVerified: true,
                            };
                            setUser(updatedUser);
                            localStorage.setItem(
                                "authUser",
                                JSON.stringify(updatedUser),
                            );
                        } else {
                            logout();
                        }
                    } else {
                        logout();
                    }
                } catch (verifyError) {
                    console.error(
                        "[Auth Debug] Error verifying with backend:",
                        verifyError,
                    );
                    //("[Auth Debug] Network error during verification, keeping user logged in");
                }
            } catch (error) {
                console.error(
                    "[Auth Debug] Error initializing auth (JSON parse):",
                    error,
                );
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    // Run initialization on mount
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "authToken" || e.key === "authUser") {
                if (!e.newValue) {
                    setToken(null);
                    setUser(null);
                } else if (e.key === "authToken" && e.newValue !== token) {
                    initializeAuth();
                }
            }
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [token, initializeAuth]);

    // Save token and user to local storage
    useEffect(() => {
        if (token) {
            localStorage.setItem("authToken", token);
        } else {
            localStorage.removeItem("authToken");
        }
        if (user) {
            localStorage.setItem("authUser", JSON.stringify(user));
        } else {
            localStorage.removeItem("authUser");
        }
    }, [token, user]);

    // Logout function
    const logout = useCallback(() => {
        //("AuthContext logout - user only (full cleanse)");
        setToken(null);
        setUser(null);

        // IMPORTANT: Do not nuke the whole browser storage here.
        // Vendors use separate keys (vendorToken/vendorData) and should not be logged out
        // when user auth expires or /api/auth/me returns 401.
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        localStorage.removeItem("authRefreshToken");

        // Keep sessionStorage mostly intact as it can contain vendor/session UI state.
        // If you want a stronger reset for user-only flows, clear only user-related keys here.

        // Clear only known user cookies (best-effort; cannot clear HttpOnly cookies from JS).
        document.cookie = "authToken=; Max-Age=0; path=/;";
        document.cookie = "authRefreshToken=; Max-Age=0; path=/;";
        // Call logout API (non-blocking)
        axios
            .post(
                `${API_BASE_URL}/api/auth/logout`,
                {},
                {
                    withCredentials: true,
                    timeout: 5000,
                },
            )
            .catch((err) =>
                console.error("Logout API error (non-critical):", err),
            );
        // Reload the page to ensure all state is reset
        window.location.href = "/";
    }, []);

    // Token refresh logic - Much more conservative approach
    useEffect(() => {
        if (!token || !isAuthenticated) return;

        const refreshToken = async () => {
            try {
                const storedRefreshToken =
                    localStorage.getItem("authRefreshToken");
                const response = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh-token`,
                    {},
                    {
                        withCredentials: true,
                        timeout: 10000,
                        headers: storedRefreshToken
                            ? { Authorization: `Bearer ${storedRefreshToken}` }
                            : {},
                    },
                );
                console.log("-------------REFRESH TOKEN ---------------");
                console.log(response);
                console.log("-------------REFRESH TOKEN ---------------");
                if (response.data.success && response.data.token) {
                    setToken(response.data.token);
                    //("Token refreshed successfully");
                } else {
                    throw new Error("Failed to refresh token");
                }
            } catch (error) {
                console.error("Token refresh error:", error);
                // Only logout if it's a clear auth error
                if (
                    axios.isAxiosError(error) &&
                    error.response?.status === 401
                ) {
                    logout();
                }
            }
        };

        const checkTokenExpiration = () => {
            const expiration = getTokenExpiration(token);
            if (!expiration) {
                console.warn("No expiration found in token");
                return;
            }
            const now = Date.now();
            const timeUntilExpiry = expiration - now;

            const refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry

            if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
                refreshToken();
            }
        };

        // Check token expiration every 2 minutes
        const interval = setInterval(checkTokenExpiration, 2 * 60 * 1000);
        checkTokenExpiration(); // Check immediately on token change

        return () => clearInterval(interval);
    }, [token, isAuthenticated, logout]);

    // Login function
    const login = useCallback(
        (
            newToken: string | null,
            newUser: UserData,
            newRefreshToken?: string,
        ) => {
            if (!newToken && !newUser) {
                console.error("No token or user provided to login function");
                return;
            }
            if (newToken) {
                setToken(newToken);
                localStorage.setItem("authToken", newToken);
            }
            if (newRefreshToken) {
                localStorage.setItem("authRefreshToken", newRefreshToken);
            }
            setUser(newUser);
            localStorage.setItem("authUser", JSON.stringify(newUser));
        },
        [],
    );

    const fetchUserData = useCallback(
        async (userId: number): Promise<UserData | null> => {
            const currentToken = token || localStorage.getItem("authToken");
            //("[Auth Debug] fetchUserData called with userId:", userId);
            //("[Auth Debug] Using token:", currentToken);
            if (!currentToken) {
                console.error(
                    "[Auth Debug] No token available for fetching user data",
                );
                return null;
            }

            try {
                setIsLoading(true);
                const response = await axios.get<{
                    success: boolean;
                    data: UserData;
                }>(`${API_BASE_URL}/api/auth/users/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${currentToken}`,
                        Accept: "application/json",
                    },
                    timeout: 10000,
                });
                //("[Auth Debug] fetchUserData response:", response.data);
                if (response.data.success) {
                    const rawData = response.data.data;
                    const normalizedUser = {
                        ...rawData,
                        id: rawData.id || rawData.id,
                        username:
                            rawData.username ||
                            (rawData.email
                                ? rawData.email.split("@")[0]
                                : "User"),
                    } as UserData;
                    setUser(normalizedUser);
                    return normalizedUser;
                } else {
                    console.error(
                        "[Auth Debug] Failed to fetch user data:",
                        response.data,
                    );
                    return null;
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error(
                        "[Auth Debug] Error fetching user data:",
                        error.response?.data?.message || error.message,
                    );
                    if (error.response?.status === 401) {
                        logout();
                    }
                } else {
                    console.error(
                        "[Auth Debug] Unexpected error fetching user data:",
                        error,
                    );
                }
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [token, logout],
    );

    // Get user status
    const getUserStatus = (): string => {
        if (isLoading) return "Loading...";
        if (!isAuthenticated || !user) return "Not logged in";
        return `Logged in as ${user.username || user.email || "User"}`;
    };

    // Axios interceptors are set up once in src/main.tsx to avoid stacking/overriding.

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated,
                isLoading,
                fetchUserData,
                getUserStatus,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
