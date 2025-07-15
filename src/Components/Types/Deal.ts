export interface User {
  id: number;
  username?: string;
  email: string;
  role: string;
  addressId?: number | null;

  provider?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Deal {
  id: number;
  name: string;
  discountPercentage: number | string; // API returns string in some responses
  status: 'ENABLED' | 'DISABLED';
  createdById: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
}

export interface CreateDealDto {
  name: string;
  discountPercentage: number;
  status: 'ENABLED' | 'DISABLED';
}

export interface UpdateDealDto {
  name?: string;
  discountPercentage?: number;
  status?: 'ENABLED' | 'DISABLED';
}

export interface GetAllDealsResponse {
  deals: Deal[];
  total: number;
  productCounts: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  msg?: string;
  deletedDeal?: Deal;
}