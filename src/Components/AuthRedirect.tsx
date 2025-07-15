import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useVendorAuth } from "../context/VendorAuthContext";

const AuthRedirect: React.FC = () => {
  const { isAuthenticated: isAuthAuthenticated, isLoading: authLoading } = useAuth();
  const { authState: vendorAuthState, isLoading: vendorLoading } = useVendorAuth();
  const isVendorAuthenticated = vendorAuthState.isAuthenticated;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const publicRoutes = [
      "/",
      "/contact",
      "/login",
      "/vendor/login",
      "/vendor/signup",
      "/wishlist",
      "/user-profile",
      "/shop",
      "/checkout",
      "/vendor/", // Added to allow vendor pages like /vendor/{id}
    ];

    const isPublicRoute = publicRoutes.some(route => 
      location.pathname === route || 
      location.pathname.startsWith('/product-page/') ||
      location.pathname.startsWith('/shop/') ||
      location.pathname.startsWith('/vendor/') // Added to match /vendor/{id}
    );

    // Combine loading states from both contexts
    const isLoading = authLoading || vendorLoading;

    // Check if the user is authenticated via either context
    const isAuthenticated = isAuthAuthenticated || isVendorAuthenticated;

    // Only redirect if:
    // 1. Not loading
    // 2. Not authenticated
    // 3. Not on a public route
    // 4. Not already on the home page
    if (!isAuthenticated && !isLoading && !isPublicRoute && location.pathname !== '/') {
      console.log("User logged out, redirecting to home from:", location.pathname);
      navigate("/", { replace: true });
    }
  }, [isAuthAuthenticated, isVendorAuthenticated, authLoading, vendorLoading, location.pathname, navigate]);

  return null; // This component doesn't render anything
};

export default AuthRedirect;