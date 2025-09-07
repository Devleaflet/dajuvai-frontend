import axios from 'axios';
import { API_BASE_URL } from '../config';

export enum PromoType {
  LINE_TOTAL = "LINE_TOTAL",
  SHIPPING = "SHIPPING"
}

export interface PromoCode {
  id: number;
  promoCode: string;
  discountPercentage: number;
  applyOn: string;
  isValid: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromoCodeData {
  promoCode: string;
  discountPercentage: number;
  applyOn: string;
  isValid: boolean;
}

export interface PromoCodeResponse {
  success: boolean;
  data?: PromoCode[];
  message?: string;
}

export interface CreatePromoCodeResponse {
  success: boolean;
  msg?: string;
  message?: string;
}

export interface DeletePromoCodeResponse {
  success: boolean;
  msg?: string;
  message?: string;
}

class PromoService {
  private static instance: PromoService;

  private constructor() {}

  public static getInstance(): PromoService {
    if (!PromoService.instance) {
      PromoService.instance = new PromoService();
    }
    return PromoService.instance;
  }

  // Get all promo codes
  async getAllPromoCodes(token: string): Promise<PromoCodeResponse> {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    try {
      const response = await axios.get<PromoCodeResponse>(`${API_BASE_URL}/api/promo`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        throw new Error(error.response?.data?.message || 'Network error');
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Create a new promo code
  async createPromoCode(data: CreatePromoCodeData, token: string): Promise<CreatePromoCodeResponse> {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    try {
      const response = await axios.post<CreatePromoCodeResponse>(
        `${API_BASE_URL}/api/promo`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        if (error.response?.status === 403) {
          throw new Error('Forbidden: Insufficient permissions');
        }
        if (error.response?.status === 400) {
          throw new Error(error.response?.data?.message || 'Validation failed');
        }
        throw new Error(error.response?.data?.message || 'Network error');
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Delete a promo code
  async deletePromoCode(id: number, token: string): Promise<DeletePromoCodeResponse> {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    try {
      const response = await axios.delete<DeletePromoCodeResponse>(
        `${API_BASE_URL}/api/promo/${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        if (error.response?.status === 403) {
          throw new Error('Forbidden: Insufficient permissions');
        }
        if (error.response?.status === 404) {
          throw new Error('Promo code not found');
        }
        if (error.response?.status === 400) {
          throw new Error(error.response?.data?.message || 'Invalid request');
        }
        throw new Error(error.response?.data?.message || 'Network error');
      }
      throw new Error('An unexpected error occurred');
    }
  }
}

export default PromoService;

