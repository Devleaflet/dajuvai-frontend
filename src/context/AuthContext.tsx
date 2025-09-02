import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  login: (token: string | null, user: UserData) => void;
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
  login: () => { },
  logout: () => { },
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

// AuthProvider component to wrap the app
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Partial<UserData> | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Determine if user is authenticated
  const isAuthenticated = !!user;

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");
    console.log("[Auth Debug] initializeAuth called");
    console.log("[Auth Debug] localStorage.authToken:", storedToken);
    console.log("[Auth Debug] localStorage.authUser:", storedUser);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("[Auth Debug] Parsed user from localStorage:", parsedUser);
        if (storedToken && isTokenValid(storedToken)) {
          setToken(storedToken);
          setUser(parsedUser);
          setIsLoading(false);
          return; // Skip /api/auth/me verification for token-based users
        }
        // If no valid token, try cookie-based verification
        setUser(parsedUser);
        // Verify with backend that the user is still authenticated (cookie/cookie-based auth)
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // Update user data with latest from server
              const updatedUser = {
                id: data.data.userId,
                email: data.data.email,
                role: data.data.role,
                username: data.data.email.split('@')[0],
                isVerified: true,
              };
              setUser(updatedUser);
              localStorage.setItem("authUser", JSON.stringify(updatedUser));
              console.log("[Auth Debug] User verified with backend:", updatedUser);
            } else {
              console.log("[Auth Debug] Backend verification failed, clearing auth");
              logout();
            }
          } else {
            console.log("[Auth Debug] Backend verification failed (HTTP error), clearing auth");
            logout();
          }
        } catch (verifyError) {
          console.error("[Auth Debug] Error verifying with backend:", verifyError);
          // Don't logout on network errors, keep the user logged in
          console.log("[Auth Debug] Network error during verification, keeping user logged in");
        }
      } catch (error) {
        console.error("[Auth Debug] Error initializing auth (JSON parse):", error);
        logout();
      }
    } else {
      console.log("[Auth Debug] No authUser in localStorage after refresh.");
    }
    setIsLoading(false);
  }, []);

  // Run initialization on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authToken" || e.key === "authUser") {
        if (!e.newValue) {
          // Token or user removed in another tab
          setToken(null);
          setUser(null);
        } else if (e.key === "authToken" && e.newValue !== token) {
          // Token updated in another tab
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

  // Token refresh logic - Much more conservative approach
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const refreshToken = async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
            timeout: 10000, // 10 second timeout
          }
        );
        if (response.data.success && response.data.data.token) {
          setToken(response.data.data.token);
          console.log("Token refreshed successfully");
        } else {
          throw new Error("Failed to refresh token");
        }
      } catch (error) {
        console.error("Token refresh error:", error);
        // Only logout if it's a clear auth error
        if (axios.isAxiosError(error) && error.response?.status === 401) {
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

      // Much more conservative refresh threshold - only refresh 30 minutes before expiry
      const refreshThreshold = 30 * 60 * 1000; // 30 minutes

      if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
        console.log(`Token expires in ${Math.round(timeUntilExpiry / 60000)} minutes, refreshing...`);
        refreshToken();
      }
    };

    // Check token expiration every 15 minutes (instead of 5)
    const interval = setInterval(checkTokenExpiration, 15 * 60 * 1000);
    checkTokenExpiration(); // Check immediately on token change

    return () => clearInterval(interval);
  }, [token, isAuthenticated]);

  // Login function
  const login = (newToken: string | null, newUser: UserData) => {
    // Accept login if either a token or a user is provided (for cookie-based auth)
    if (!newToken && !newUser) {
      console.error("No token or user provided to login function");
      return;
    }
    if (newToken) {
      setToken(newToken);
      localStorage.setItem("authToken", newToken);
    }
    setUser(newUser);
    localStorage.setItem("authUser", JSON.stringify(newUser));
  };

  // Logout function
  const logout = useCallback(() => {
    console.log("AuthContext logout - user only (full cleanse)");
    setToken(null);
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
    // Attempt to clear all cookies (best effort, not HttpOnly)
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    // Call logout API (non-blocking)
    axios
      .post(`${API_BASE_URL}/api/auth/logout`, {}, {
        withCredentials: true,
        timeout: 5000
      })
      .catch((err) => console.error("Logout API error (non-critical):", err));
    // Reload the page to ensure all state is reset
    window.location.href = '/';
  }, []);

  // Fetch user data by ID
  const fetchUserData = async (userId: number): Promise<UserData | null> => {
    const currentToken = token || localStorage.getItem("authToken");
    console.log("[Auth Debug] fetchUserData called with userId:", userId);
    console.log("[Auth Debug] Using token:", currentToken);
    if (!currentToken) {
      console.error("[Auth Debug] No token available for fetching user data");
      return null;
    }

    try {
      setIsLoading(true);
      const response = await axios.get<{ success: boolean; data: UserData }>(
        `${API_BASE_URL}/api/auth/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );
      console.log("[Auth Debug] fetchUserData response:", response.data);
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        return userData;
      } else {
        console.error("[Auth Debug] Failed to fetch user data:", response.data);
        return null;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("[Auth Debug] Error fetching user data:", error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
          logout();
        }
      } else {
        console.error("[Auth Debug] Unexpected error fetching user data:", error);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get user status
  const getUserStatus = (): string => {
    if (isLoading) return "Loading...";
    if (!isAuthenticated || !user) return "Not logged in";
    return `Logged in as ${user.username || user.email || "User"}`;
  };

  // Setup axios interceptors
  useEffect(() => {
    setupAxiosInterceptors(() => token || localStorage.getItem("authToken"));
  }, [token]);

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