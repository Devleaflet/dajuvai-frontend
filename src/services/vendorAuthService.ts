import { API_BASE_URL } from "../config";
import type { Vendor, VendorSignupRequest, VendorLoginRequest, ApiResponse, VendorUpdateRequest } from "../Components/Types/vendor";

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

      const payload = {
        businessName: vendorData.businessName,
        email: vendorData.email,
        password: vendorData.password,
        phoneNumber: vendorData.phoneNumber,
        district: vendorData.district,
        taxNumber: vendorData.taxNumber,
        taxDocuments: vendorData.taxDocuments,
        businessRegNumber: vendorData.businessRegNumber,
        citizenshipDocuments: vendorData.citizenshipDocuments,
        chequePhoto: vendorData.chequePhoto,
        bankDetails: vendorData.bankDetails,
        businessAddress: vendorData.businessAddress,
        profilePicture: vendorData.profilePicture,
      };
      //("API Request Payload:", JSON.stringify(payload, null, 2));

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
        console.error("Non-JSON response:", text);
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
          vendor: {
            ...data.vendor,
            district: data.vendor.district || { id: 0, name: data.vendor.district || "N/A" },
            status: data.vendor.isVerified ? "Active" : "Inactive",
            taxNumber: data.vendor.taxNumber || "N/A",
            taxDocuments: Array.isArray(data.vendor.taxDocuments) ? data.vendor.taxDocuments : data.vendor.taxDocuments ? [data.vendor.taxDocuments] : null,
            businessRegNumber: data.vendor.businessRegNumber || "N/A",
            citizenshipDocuments: Array.isArray(data.vendor.citizenshipDocuments) ? data.vendor.citizenshipDocuments : data.vendor.citizenshipDocuments ? [data.vendor.citizenshipDocuments] : null,
            chequePhoto: Array.isArray(data.vendor.chequePhoto) ? data.vendor.chequePhoto : data.vendor.chequePhoto ? [data.vendor.chequePhoto] : null,
            accountName: data.vendor.accountName || "N/A",
            bankName: data.vendor.bankName || "N/A",
            accountNumber: data.vendor.accountNumber || "N/A",
            bankBranch: data.vendor.bankBranch || "N/A",
            bankCode: data.vendor.bankCode || "N/A",
            businessAddress: data.vendor.businessAddress || "N/A",
            profilePicture: data.vendor.profilePicture || "N/A",
          },
          token: data.token,
        };
      }

      if (!response.ok) {
        console.error("Signup Error Response:", data);
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

  static async adminsignup(vendorData: VendorSignupRequest, token: string | null): Promise<ApiResponse<Vendor>> {
    try {
      if (!token) {
        return {
          success: false,
          message: "No authentication token provided. Please log in.",
        };
      }

      const payload = {
        businessName: vendorData.businessName,
        email: vendorData.email,
        password: vendorData.password,
        phoneNumber: vendorData.phoneNumber,
        district: vendorData.district,
        taxNumber: vendorData.taxNumber,
        taxDocuments: vendorData.taxDocuments,
        businessRegNumber: vendorData.businessRegNumber,
        citizenshipDocuments: vendorData.citizenshipDocuments,
        chequePhoto: vendorData.chequePhoto,
        bankDetails: vendorData.bankDetails,
        businessAddress: vendorData.businessAddress,
        profilePicture: vendorData.profilePicture,
      };
      //("API Request Payload:", JSON.stringify(payload, null, 2));

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
        console.error("Non-JSON response:", text);
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
          vendor: {
            ...data.vendor,
            district: data.vendor.district || { id: 0, name: data.vendor.district || "N/A" },
            status: data.vendor.isVerified ? "Active" : "Inactive",
            taxNumber: data.vendor.taxNumber || "N/A",
            taxDocuments: Array.isArray(data.vendor.taxDocuments) ? data.vendor.taxDocuments : data.vendor.taxDocuments ? [data.vendor.taxDocuments] : null,
            businessRegNumber: data.vendor.businessRegNumber || "N/A",
            citizenshipDocuments: Array.isArray(data.vendor.citizenshipDocuments) ? data.vendor.citizenshipDocuments : data.vendor.citizenshipDocuments ? [data.vendor.citizenshipDocuments] : null,
            chequePhoto: Array.isArray(data.vendor.chequePhoto) ? data.vendor.chequePhoto : data.vendor.chequePhoto ? [data.vendor.chequePhoto] : null,
            accountName: data.vendor.accountName || "N/A",
            bankName: data.vendor.bankName || "N/A",
            accountNumber: data.vendor.accountNumber || "N/A",
            bankBranch: data.vendor.bankBranch || "N/A",
            bankCode: data.vendor.bankCode || "N/A",
            businessAddress: data.vendor.businessAddress || "N/A",
            profilePicture: data.vendor.profilePicture || "N/A",
          },
          token: data.token,
        };
      }

      if (!response.ok) {
        console.error("Signup Error Response:", data);
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

      const formattedPhoneNumber = vendorData.phoneNumber.startsWith('+')
        ? vendorData.phoneNumber
        : `+977${vendorData.phoneNumber}`;

      // Debug: Log what we received
      //("🔍 VendorAuthService.updateVendor - Received vendorData:", vendorData);
      //("🔍 VendorAuthService.updateVendor - chequePhoto type:", typeof vendorData.chequePhoto);
      //("🔍 VendorAuthService.updateVendor - chequePhoto isArray:", Array.isArray(vendorData.chequePhoto));
      //("🔍 VendorAuthService.updateVendor - chequePhoto value:", vendorData.chequePhoto);

      const payload = {
        ...vendorData,
        phoneNumber: formattedPhoneNumber,
        ...(vendorData.district && { district: vendorData.district }),
      };


      
      //("Request payload:", payload);

      const response = await fetch(`${API_BASE_URL}/api/vendors/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      //("Response status:", response.status);
      //("Response headers:", Object.fromEntries(response.headers.entries()));

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
      //("Response data:", data);

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
    //("VendorAuthService logout - clearing all vendor data");
    
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorData");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentTxnId");
    
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
    
    document.cookie = "vendorToken=; Max-Age=0; path=/;";
    document.cookie = "authToken=; Max-Age=0; path=/;";
    
    sessionStorage.clear();
    
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }

  static comprehensiveLogout() {
    //("Comprehensive logout - clearing all user and vendor data");
    
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorData");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentTxnId");
    
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
    
    document.cookie = "vendorToken=; Max-Age=0; path=/;";
    document.cookie = "authToken=; Max-Age=0; path=/;";
    
    sessionStorage.clear();
    
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    window.location.href = '/';
  }

  static clearAllUserData() {
    //("Clearing all user data");
    
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorData");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentTxnId");
    
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
    
    document.cookie = "vendorToken=; Max-Age=0; path=/;";
    document.cookie = "authToken=; Max-Age=0; path=/;";
    
    sessionStorage.clear();
    
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