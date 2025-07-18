import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface Vendor {
  id: number;
  businessName: string;
  email: string;
  businessAddress?: string;
  phoneNumber: string;
  isVerified: boolean;
  district?: string;
}

export interface VendorLoginData {
  email: string;
  password: string;
}

export interface VendorSignupData {
  businessName: string;
  email: string;
  password: string;
  phoneNumber: string;
  district: string;
}

export interface VendorUpdateData {
  businessName?: string;
  email?: string;
  businessAddress?: string;
  phoneNumber?: string;
}

class VendorService {
  private static instance: VendorService;
  private baseURL: string;

  private constructor() {
    this.baseURL = `${API_BASE_URL}/api/vendors`;
  }

  public static getInstance(): VendorService {
    if (!VendorService.instance) {
      VendorService.instance = new VendorService();
    }
    return VendorService.instance;
  }

  // Get all vendors (Admin only)
  async getAllVendors(token: string): Promise<Vendor[]> {
    const response = await axios.get(`${this.baseURL}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }

  // Get vendor by ID
  async getVendorById(id: number, token: string): Promise<Vendor> {
    try {
      const response = await axios.get(`${this.baseURL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Vendor API response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch vendor');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Vendor not found');
        }
        if (error.response?.status === 400) {
          throw new Error('Invalid vendor ID');
        }
        if (error.response?.status === 503) {
          throw new Error('Vendor service temporarily unavailable');
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch vendor');
      }
      throw error;
    }
  }

  // Get vendor products
  async getVendorProducts(vendorId: number, page: number = 1, limit: number = 10, token: string) {
    const response = await axios.get(`${this.baseURL}/${vendorId}/products`, {
      params: { page, limit },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }

  // Update vendor information
  async updateVendor(id: number, data: VendorUpdateData, token: string): Promise<Vendor> {
    const response = await axios.put(`${this.baseURL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }

  // Vendor signup
  async signup(data: VendorSignupData) {
    const response = await axios.post(`${this.baseURL}/signup`, data);
    return response.data;
  }

  // Vendor login
  async login(data: VendorLoginData) {
    const response = await axios.post(`${this.baseURL}/login`, data);
    return response.data;
  }

  // Resend verification email
  async resendVerification(email: string) {
    const response = await axios.post(`${this.baseURL}/verify/resend`, { email });
    return response.data;
  }

  // Send verification token
  async sendVerification(email: string) {
    const response = await axios.post(`${this.baseURL}/verify`, { email });
    return response.data;
  }

  // Request password reset
  async forgotPassword(email: string) {
    const response = await axios.post(`${this.baseURL}/forgot-password`, { email });
    return response.data;
  }

  // Reset password
  async resetPassword(newPass: string, confirmPass: string, token: string) {
    const response = await axios.post(`${this.baseURL}/reset-password`, {
      newPass,
      confirmPass,
      token
    });
    return response.data;
  }
}

export default VendorService; 