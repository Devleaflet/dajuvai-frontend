import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface Deal {
  id: number;
  name: string;
  discountPercentage: number;
  status: 'ENABLED' | 'DISABLED';
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface DealFormData {
  name: string;
  discountPercentage: number;
  status: 'ENABLED' | 'DISABLED';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface DealsResponse {
  success: boolean;
  data: {
    deals: Deal[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

class DealService {
  private static instance: DealService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${API_BASE_URL}/api/deal`;
  }

  public static getInstance(): DealService {
    if (!DealService.instance) {
      DealService.instance = new DealService();
    }
    return DealService.instance;
  }

  async getAllDeals(token: string, status?: 'ENABLED' | 'DISABLED'): Promise<DealsResponse> {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params: status ? { status } : undefined
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          data: {
            deals: [],
            total: 0,
            page: 1,
            limit: 10
          },
          message: error.response?.data?.message || 'Failed to fetch deals'
        };
      }
      return {
        success: false,
        data: {
          deals: [],
          total: 0,
          page: 1,
          limit: 10
        },
        message: 'Failed to fetch deals'
      };
    }
  }

  async createDeal(dealData: DealFormData, token: string): Promise<ApiResponse<Deal>> {
    try {
      const response = await axios.post(this.baseUrl, dealData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create deal'
        };
      }
      return {
        success: false,
        message: 'Failed to create deal'
      };
    }
  }

  async updateDeal(id: number, dealData: DealFormData, token: string): Promise<ApiResponse<Deal>> {
    try {
      const response = await axios.patch(`${this.baseUrl}/${id}`, dealData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        let message = 'Failed to update deal';
        
        if (status === 400) {
          message = error.response?.data?.message || 'Invalid deal data';
        } else if (status === 401) {
          message = 'Unauthorized access';
        } else if (status === 404) {
          message = 'Deal not found';
        } else if (status === 500) {
          message = 'Internal server error';
        }
        
        return {
          success: false,
          message
        };
      }
      return {
        success: false,
        message: 'Failed to update deal'
      };
    }
  }

  async deleteDeal(id: number, token: string): Promise<ApiResponse<void>> {
    try {
      const response = await axios.delete(`${this.baseUrl}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete deal'
        };
      }
      return {
        success: false,
        message: 'Failed to delete deal'
      };
    }
  }

  async getDealProducts(id: number, token: string): Promise<{ success: boolean; data: any[] }> {
    const response = await axios.get(`${this.baseUrl}/${id}/products`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    return response.data;
  }

  async addProductToDeal(dealId: number, productId: number, token: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${this.baseUrl}/${dealId}/products/${productId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    return response.data;
  }

  async removeProductFromDeal(dealId: number, productId: number, token: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${this.baseUrl}/${dealId}/products/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    return response.data;
  }
}

export default DealService; 