// api/axiosInstance.ts
import axios from "axios";
import { API_BASE_URL } from "../config";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Single permanent interceptor.
// Priority: vendorToken first, then authToken.
// This prevents the three separate setupAxiosInterceptors calls
// (main.tsx, VendorAuthContext, AuthContext) from stacking and the
// last one overwriting the vendor token with a user/OAuth token.
axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("vendorToken") || localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    if (status === 401) {
      console.error(`401 Unauthorized on ${url}. Token may be missing or expired.`);
    } else if (status === 403) {
      console.error(`403 Forbidden on ${url}. Insufficient permissions.`);
    }
    return Promise.reject(error);
  }
);

// No-op: kept so existing callers (main.tsx, VendorAuthContext, AuthContext)
// don't break at import time. The real interceptor above never needs re-setup.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const setupAxiosInterceptors = (_getTokenFn: () => string | null): void => {};

export default axiosInstance;
