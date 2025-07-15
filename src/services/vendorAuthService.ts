import { API_BASE_URL } from "../config";
import type { Vendor, VendorSignupRequest, VendorLoginRequest, ApiResponse } from "../Components/Types/vendor";

export interface VendorUpdateRequest {
  id: number;
  businessName: string;
  email: string;
  phoneNumber: string;
  businessAddress?: string;
  district?: string;
}

export class VendorAuthService {
  private static async setAuthToken(token: string) {
    localStorage.setItem("vendorToken", token);
    document.cookie = `vendorToken=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`;
  }

static async signup(vendorData: VendorSignupRequest, token: string | null): Promise<ApiResponse<Vendor>> {
  try {
    if (!token) {
      return {
        success: false,
        message: "No authentication token provided. Please log in.",
      };
    }

    // The API expects district name, not districtId
    const payload = {
      businessName: vendorData.businessName,
      email: vendorData.email,
      password: vendorData.password,
      businessAddress: vendorData.businessAddress,
      phoneNumber: vendorData.phoneNumber,
      district: vendorData.district, // Send district name as string, not districtId as number
    };
    console.log("API Request Payload:", payload);

    const response = await fetch(`${API_BASE_URL}/api/vendors/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      return {
        success: false,
        message: `Server returned ${response.status}: ${text.substring(0, 100)}`,
      };
    }

    const data: ApiResponse<Vendor> = await response.json();

    if (response.status === 201 && data.success && data.vendor && data.token) {
      await this.setAuthToken(data.token);
      return {
        success: true,
        vendor: data.vendor,
        token: data.token,
      };
    }

    if (!response.ok) {
      console.log("Signup Error Response:", data);
      
      // Handle specific error cases
      if (response.status === 409) {
        return {
          success: false,
          message: "A vendor with this email already exists. Please use a different email address.",
        };
      }
      
      if (response.status === 400 && data.message?.includes("District")) {
        return {
          success: false,
          message: "The selected district is not valid. Please select a different district.",
        };
      }
      
      if (data.errors) {
        const errorMessage = data.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        return {
          success: false,
          errors: data.errors,
          message: errorMessage,
        };
      }
      return {
        success: false,
        message: data.message || `Request failed with status ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error("Vendor signup error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error during signup",
    };
  }
}

  static async login(credentials: VendorLoginRequest): Promise<ApiResponse<Vendor>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await response.text();
        return {
          success: false,
          message: `Server returned ${response.status}: ${text.substring(0, 100)}`,
        };
      }

      const data: ApiResponse<Vendor> = await response.json();

      if (response.status === 200 && data.success && data.token) {
        await this.setAuthToken(data.token);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error during login",
      };
    }
  }

  static async updateVendor(id: number, vendorData: VendorUpdateRequest, token: string | null): Promise<ApiResponse<Vendor>> {
    try {
      if (!token) {
        console.error("No authentication token found in updateVendor");
        return {
          success: false,
          message: "No authentication token found",
        };
      }

      // Format phone number with country code if not already present
      const formattedPhoneNumber = vendorData.phoneNumber.startsWith('+')
        ? vendorData.phoneNumber
        : `+977${vendorData.phoneNumber}`; // Assuming Nepal country code; adjust as needed

      const payload = {
        ...vendorData,
        phoneNumber: formattedPhoneNumber,
        ...(vendorData.district && { district: vendorData.district }),
      };

      console.log("Making vendor update request to:", `${API_BASE_URL}/api/vendors/${id}`);
      console.log("Request headers:", {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token.substring(0, 10)}...`,
      });
      console.log("Request payload:", payload);

      const response = await fetch(`${API_BASE_URL}/api/vendors/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        return {
          success: false,
          message: `Server returned ${response.status}: ${text.substring(0, 100)}`,
        };
      }

      const data: ApiResponse<Vendor> = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        console.error("Update request failed:", {
          status: response.status,
          data: data,
        });
        if (data.errors) {
          return {
            success: false,
            errors: data.errors,
            message: data.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
          };
        }
        return {
          success: false,
          message: data.message || `Request failed with status ${response.status}`,
        };
      }

      // Return the updated vendor data
      return {
        success: true,
        vendor: data.data || data.vendor,
        message: data.message,
      };
    } catch (error) {
      console.error("Error in updateVendor:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error during update",
      };
    }
  }

  static logout() {
    console.log("VendorAuthService logout - clearing all vendor data");
    
    // Clear all vendor-related localStorage items
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorData");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentTxnId");
    
    // Clear all admin-related cache
    const adminCacheKeys = [
      'admin_products',
      'admin_dashboard_stats',
      'admin_districts',
      'admin_vendors',
      'admin_categories',
      'admin_banners',
      'deal_admin_cache'
    ];
    adminCacheKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear cookies
    document.cookie = "vendorToken=; Max-Age=0; path=/;";
    document.cookie = "authToken=; Max-Age=0; path=/;";
    
    // Clear any session storage
    sessionStorage.clear();
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }

  // Comprehensive logout utility that clears all user data
  static comprehensiveLogout() {
    console.log("Comprehensive logout - clearing all user and vendor data");
    
    // Clear all authentication tokens
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorData");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentTxnId");
    
    // Clear all cache data
    const cacheKeys = [
      'admin_products',
      'admin_dashboard_stats',
      'admin_districts',
      'admin_vendors',
      'admin_categories',
      'admin_banners',
      'deal_admin_cache',
      'home_recommended_cache',
      'best_of_top_cache',
      'best_of_bottom_cache'
    ];
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear all cookies
    document.cookie = "vendorToken=; Max-Age=0; path=/;";
    document.cookie = "authToken=; Max-Age=0; path=/;";
    
    // Clear session storage
    sessionStorage.clear();
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    // Force page reload to ensure complete cleanup
    window.location.href = '/';
  }

  // Clear all user data without forcing page reload
  static clearAllUserData() {
    console.log("Clearing all user data");
    
    // Clear all authentication tokens
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorData");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentTxnId");
    
    // Clear all cache data
    const cacheKeys = [
      'admin_products',
      'admin_dashboard_stats',
      'admin_districts',
      'admin_vendors',
      'admin_categories',
      'admin_banners',
      'deal_admin_cache',
      'home_recommended_cache',
      'best_of_top_cache',
      'best_of_bottom_cache'
    ];
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear all cookies
    document.cookie = "vendorToken=; Max-Age=0; path=/;";
    document.cookie = "authToken=; Max-Age=0; path=/;";
    
    // Clear session storage
    sessionStorage.clear();
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }

  static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message || 'Password reset email sent successfully' };
      } else {
        return { success: false, message: data.message || 'Failed to send password reset email' };
      }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Network error' };
    }
  }

  static async resetPassword(newPass: string, confirmPass: string, token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ newPass, confirmPass, token }),
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message || 'Password reset successful' };
      } else {
        return { success: false, message: data.message || 'Failed to reset password' };
      }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Network error' };
    }
  }
}