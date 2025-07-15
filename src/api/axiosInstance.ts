// api/axiosInstance.ts
import axios from "axios";
import { API_BASE_URL } from "../config";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Always send cookies for cross-origin requests
});

export const setupAxiosInterceptors = (getTokenFn: () => string | null) => {
  axiosInstance.interceptors.request.use((config) => {
    const token = getTokenFn?.();
    console.log("Axios interceptor - Token:", token ? 'exists' : 'null');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Axios interceptor - Authorization header set:", config.headers.Authorization);
    }
    
    console.log("Axios interceptor - Request config:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      hasAuth: !!config.headers.Authorization
    });
    
    return config;
  }, (error) => {
    console.error("Axios interceptor - Request error:", error);
    return Promise.reject(error);
  });

  // Add response interceptor to handle 401 errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error("Axios interceptor - Response error:", {
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      if (error.response?.status === 401) {
        // Only clear tokens and redirect if we're on a vendor route
        const currentPath = window.location.pathname;
        const isVendorRoute = currentPath.startsWith('/dashboard') || 
                            currentPath.startsWith('/vendor-product') || 
                            currentPath.startsWith('/vendor-orders') || 
                            currentPath.startsWith('/vendor-profile');

        if (isVendorRoute) {
          // Clear vendor tokens
          localStorage.removeItem('vendorToken');
          localStorage.removeItem('vendorData');
          // Redirect to vendor login only if on a vendor route
          window.location.href = '/vendor/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

export default axiosInstance;
