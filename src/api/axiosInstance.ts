import axios from "axios";
import { API_BASE_URL } from "../config";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let requestInterceptorId: number | null = null;
let responseInterceptorId: number | null = null;

export const setupAxiosInterceptors = (
  getTokenFn: () => string | null,
  onUnauthorized?: () => void,
  tokenStorageKey: "authToken" | "vendorToken" = "authToken",
) => {
  if (requestInterceptorId !== null) {
    axiosInstance.interceptors.request.eject(requestInterceptorId);
  }
  if (responseInterceptorId !== null) {
    axiosInstance.interceptors.response.eject(responseInterceptorId);
  }

  requestInterceptorId = axiosInstance.interceptors.request.use((config) => {
    const url = config.url ?? "";
    const isVendorRequest =
      url.startsWith("/api/vendor") || url.startsWith("/api/vendors");

    // Use vendor token only for vendor endpoints; otherwise use user token.
    const token = isVendorRequest
      ? localStorage.getItem("vendorToken")
      : (getTokenFn?.() ?? localStorage.getItem("authToken"));
    //("Axios interceptor - Token:", token ? `exists (${token.substring(0, 20)}...)` : 'null');
    //("Axios interceptor - URL:", config.url);
    //("Axios interceptor - Method:", config.method);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      //("Axios interceptor - Authorization header set:", config.headers.Authorization);
    } else {
      console.warn("Axios interceptor - No token available for request:", config.url);
      if (config.headers) {
        delete (config.headers as any).Authorization;
        delete (config.headers as any).authorization;
      }
    }



    return config;
  }, (error) => {
    console.error("Axios interceptor - Request error:", error);
    return Promise.reject(error);
  });

  // Add response interceptor to handle 401 errors
  responseInterceptorId = axiosInstance.interceptors.response.use(
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

      // If we get a 401 and there's a stored token, it's invalid — clear it
      // so the user is prompted to log in again instead of silently failing
      if (error.response?.status === 401) {
        const url = error.config?.url ?? "";
        const isVendorRequest =
          url.startsWith("/api/vendor") || url.startsWith("/api/vendors");

        if (isVendorRequest && localStorage.getItem("vendorToken")) {
          localStorage.removeItem("vendorToken");
          localStorage.removeItem("vendorData");
          window.dispatchEvent(new CustomEvent("vendorLoggedOut"));
        }

        if (!isVendorRequest && localStorage.getItem("authToken")) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          localStorage.removeItem("authRefreshToken");
          window.dispatchEvent(new CustomEvent("userLoggedOut"));
        }

        if (typeof onUnauthorized === "function") {
          try {
            onUnauthorized();
          } catch (e) {
            console.error("Axios interceptor - onUnauthorized error:", e);
          }
        }
      }

      return Promise.reject(error);
    }
  );
};

export default axiosInstance;
