import axios, { AxiosInstance } from 'axios';
import { ApiResponse, CreateDealDto, UpdateDealDto, Deal, GetAllDealsResponse } from '../Components/Types/Deal';
import { API_BASE_URL } from '../config';

export class DealApiService {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string = `${API_BASE_URL}/api`) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add interceptor for auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Create a new deal
  async createDeal(dealData: CreateDealDto): Promise<ApiResponse<Deal>> {
    try {
      const response = await this.axiosInstance.post('/deal', dealData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get all deals, optionally filtered by status
  async getAllDeals(status?: 'ENABLED' | 'DISABLED'): Promise<ApiResponse<GetAllDealsResponse>> {
    try {
      const response = await this.axiosInstance.get('/deal', {
        params: status ? { status } : undefined,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get deal by ID
  async getDealById(id: number): Promise<ApiResponse<Deal>> {
    try {
      const response = await this.axiosInstance.get(`/deal/${id}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Update deal by ID
  async updateDeal(id: number, dealData: UpdateDealDto): Promise<ApiResponse<Deal>> {
    try {
      const response = await this.axiosInstance.patch(`/deal/${id}`, dealData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Delete deal by ID
  async deleteDeal(id: number): Promise<ApiResponse<Deal>> {
    try {
      const response = await this.axiosInstance.delete(`/deal/${id}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Set auth token
  setAuthToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  // Clear auth token
  clearAuthToken(): void {
    localStorage.removeItem('accessToken');
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  // Error handling
  private handleError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 400:
          return new Error(data.message || 'Validation error or duplicate deal name');
        case 401:
          return new Error(data.message || 'Unauthorized - Admin authentication required');
        case 404:
          return new Error(data.message || 'Deal not found');
        case 500:
          return new Error(data.message || 'Internal server error');
        default:
          return new Error(data.message || 'An unexpected error occurred');
      }
    }
    return new Error('Network error or server is unreachable');
  }
}

export const dealApiService = new DealApiService();