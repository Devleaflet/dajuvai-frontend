// index.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext.tsx";
import CartContextProvider from "./context/CartContext.tsx";
import CategoryContextProvider from "./context/Category.tsx";
import { VendorAuthProvider } from "./context/VendorAuthContext.tsx";
import { UIProvider } from "./context/UIContext.tsx";
import { WishlistProvider } from "./context/WishlistContext.tsx";
import { setupAxiosInterceptors } from './api/axiosInstance';
// import PasswordProtectedRoute from "./Components/SiteProtection/PasswordProtectedRoute.tsx";

if ('scrollRestoration' in window.history) {
  try {
    window.history.scrollRestoration = 'manual';
    //'[EntryPoint] scrollRestoration set to manual');
  } catch {}
}

setupAxiosInterceptors(() => localStorage.getItem('authToken'));
//'[EntryPoint] Axios interceptor set up with token from localStorage');


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes stale time
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
      retry: (failureCount, error) => {
        // Don't retry for 404 or 400 errors
        if (error.message.includes('404') || error.message.includes('400')) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false, // Disable refetch on window focus
    },
  },
});


createRoot(document.getElementById("root")!).render(
  <VendorAuthProvider>
    <AuthProvider>
      <BrowserRouter>
        <StrictMode>
          <QueryClientProvider client={queryClient}>
            <CartContextProvider>
              <CategoryContextProvider>
                <UIProvider>
                  <WishlistProvider>
                    <App />
                  </WishlistProvider>
                </UIProvider>
              </CategoryContextProvider>
            </CartContextProvider>
          </QueryClientProvider>
        </StrictMode>
      </BrowserRouter>
    </AuthProvider>
  </VendorAuthProvider>
);