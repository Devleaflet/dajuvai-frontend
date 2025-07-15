import axiosInstance from './axiosInstance';

export interface Category {
  id: number;
  name: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: number;
  name: string;
  image: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

export const fetchCategories = async () => {
  try {
    const response = await axiosInstance.get('/api/categories');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const fetchSubcategories = async (categoryId: number) => {
  try {
    const response = await axiosInstance.get(`/api/categories/${categoryId}/subcategories`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    throw error;
  }
}; 