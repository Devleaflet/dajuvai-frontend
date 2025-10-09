import axiosInstance from "./axiosInstance";
import { CategoryItem } from "../context/Category";

export const fetchSubCategory = async (id: number): Promise<CategoryItem[]> => {
  try {
    const response = await axiosInstance.get(`/api/categories/${id}/subcategories`);
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        image: item.image || '',
        link: `/shop?categoryId=${id}&subcategoryId=${item.id}`,
      }));
    } else {
      return [];
    }
  } catch (error: any) {
    return [];
  }
};