// staff.ts - API service for staff-related operations

import axiosInstance from './axiosInstance';

// PermissionLevel mirrors the backend enum
export enum PermissionLevel {
  VIEW = 1,
  CREATE_EDIT = 2,
  DELETE = 3,
}

// All available modules a staff member can have permissions for
export type ModuleName = 'arrangement' | 'banner' | 'catalog' | 'category' | 'customer' | 'deal' | 'delivery' | 'order' | 'product' | 'promo' | 'vendor';

export const MODULE_NAMES: ModuleName[] = ['arrangement', 'banner', 'catalog', 'category', 'customer', 'deal', 'delivery', 'order', 'product', 'promo', 'vendor'];

export type StaffPermissions = Partial<Record<ModuleName, PermissionLevel>>;

// Types
export interface StaffUser {
  id: number;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  role?: string;
  createdAt?: string;
  permissions?: Record<string, number>;
}

export interface StaffRegistrationData {
  email: string;
  password: string;
  phoneNumber: string;
  fullName?: string;
  permissions: StaffPermissions;
}

export interface StaffUpdateData {
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  permissions?: StaffPermissions;
}

// Generic API response matching our backend style
export type FieldErrorObject = Record<string, string[] | string>;
export type FieldErrorArray = Array<{ message: string; field?: string }>;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: FieldErrorArray | FieldErrorObject;
  statusCode?: number;
}

const staffApi = {
  // Register a new staff user
  async registerStaff(staffData: StaffRegistrationData): Promise<ApiResponse<{ user: StaffUser }>> {
    try {
      const requestData = {
        email: staffData.email.trim().toLowerCase(),
        password: staffData.password,
        phoneNumber: staffData.phoneNumber.trim(),
        fullName: staffData.fullName?.trim() || undefined,
        permissions: staffData.permissions,
      };
      
      const response = await axiosInstance.post('/api/auth/signup/staff', requestData, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        validateStatus: (status) => status < 500 // do not throw for < 500
      });
      
      // Successful response (201 Created)
      if (response.status === 201) {
        return {
          success: true,
          data: { user: response.data.user }
        };
      }

      // Error responses (400, 409, etc.)
      return {
        success: false,
        ...(typeof response.data === 'object' ? response.data : { message: String(response.data) }),
        statusCode: response.status
      };
      
    } catch (error: any) {
      console.error('Unexpected error in registerStaff:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Network error',
        statusCode: error.response?.status || 0
      };
    }
  },
  
  // Get all staff users (includes permissions)
  async getStaffList(): Promise<ApiResponse<StaffUser[]>> {
    try {
      const response = await axiosInstance.get('/api/auth/staff');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching staff list:', error);
      
      if (error.response?.status === 404) {
        return { success: true, data: [] };
      }
      
      if (error.response?.data) {
        return {
          success: false,
          ...error.response.data,
          statusCode: error.response.status
        };
      }
      
      return {
        success: false,
        message: error.message || 'Failed to fetch staff list'
      };
    }
  },

  // Get permissions for a specific staff user
  async getStaffPermissions(id: number): Promise<ApiResponse<Record<string, number>>> {
    try {
      const response = await axiosInstance.get(`/api/auth/staff/${id}/permissions`, {
        validateStatus: (status) => status < 500,
      });
      if (response.status === 200) {
        return { success: true, data: response.data.data };
      }
      return {
        success: false,
        ...(typeof response.data === 'object' ? response.data : { message: String(response.data) }),
        statusCode: response.status,
      };
    } catch (error: any) {
      console.error('Error fetching staff permissions:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch staff permissions',
        statusCode: error.response?.status,
      };
    }
  },

  // Update a staff user's profile and/or permissions
  async updateStaff(id: number, data: StaffUpdateData): Promise<ApiResponse<StaffUser>> {
    try {
      const response = await axiosInstance.put(`/api/auth/staff/${id}`, data, {
        validateStatus: (status) => status < 500,
      });

      if (response.status === 200) {
        return { success: true, data: response.data.data };
      }

      return {
        success: false,
        ...(typeof response.data === 'object' ? response.data : { message: String(response.data) }),
        statusCode: response.status,
      };
    } catch (error: any) {
      console.error('Error updating staff:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update staff member',
        statusCode: error.response?.status,
      };
    }
  },

  // Delete a staff user
  async deleteStaff(id: number): Promise<ApiResponse<void>> {
    try {
      await axiosInstance.delete(`/api/auth/staff/${id}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete staff member',
        statusCode: error.response?.status
      };
    }
  }
};

export default staffApi;
