import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface Category {
  id: number;
  name: string;
  image?: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: number;
  name: string;
  image?: string;
  categoryId: number;
}

class CategoryService {
  private static instance: CategoryService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${API_BASE_URL}/api/categories`;
  }

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  async getAllCategories(token?: string): Promise<Category[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getSubcategories(categoryId: number, token?: string): Promise<Subcategory[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/${categoryId}/subcategories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }
  }
}

export default CategoryService; 