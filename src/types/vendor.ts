export interface Vendor {
  id: number;
  businessName: string;
  email: string;
  businessAddress: string;
  phoneNumber: string;
  district: string;
}

export interface VendorUpdateRequest {
  businessName: string;
  email: string;
  businessAddress: string;
  phoneNumber: string;
  district: string;
}

export interface VendorSignupRequest {
  businessName: string;
  email: string;
  password: string;
  businessAddress: string;
  phoneNumber: string;
  district: string;
} 