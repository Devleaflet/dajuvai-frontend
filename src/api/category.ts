import axiosInstance from "./axiosInstance";

export const fetchCategory = async () => {
  try {
    const response = await axiosInstance.get("/api/home/category/section");
    return response.data.data;
  } catch (error: any) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
};