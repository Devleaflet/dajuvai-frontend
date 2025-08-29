import axiosInstance from "./axiosInstance";
import { CategoryItem } from "../context/Category";

export const fetchSubCategory = async (id: number): Promise<CategoryItem[]> => {
  try {
    const response = await axiosInstance.get(`/api/categories/${id}/subcategories`);
    console.log("sub cat = :", response.data.data);
    return response.data.data.map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      link: `/shop?categoryId=${id}&subcategoryId=${sub.id}`,
      image: sub.image,
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch subcategories for category ${id}: ${error.message}`);
  }
};