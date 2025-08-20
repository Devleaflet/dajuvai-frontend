export interface Vendor {
  id: number;
  businessName: string;
  email: string;
  businessAddress?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
  taxNumber?: string;
  taxDocument?: string;
}

export interface VendorSignupRequest {
  businessName: string;
  email: string;
  password: string;

  phoneNumber: string;
  district: string;
  taxNumber?: string;
  taxDocument?: string;
}

export interface VendorLoginRequest {
  email: string;
  password: string;
    taxNumber?: string;
  taxDocument?: string;
}

export interface VendorUpdateRequest {
  businessName: string;
  email: string;
  phoneNumber: string;
  isVerified: boolean;
  taxNumber?: string;
  taxDocument?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  vendor?: T;
  message?: string;
  errors?: { path: string[]; message: string }[];
  token?: string;
}