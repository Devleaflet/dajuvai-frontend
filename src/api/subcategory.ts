import axiosInstance from "./axiosInstance";

export const fetchSubCategory = async (id: number) => {
  try {
    const response = await axiosInstance.get(
      `/api/categories/${id}/subcategories`
    );
    console.log("sub cat = :", response.data.data);
    return response.data.data;
  } catch (error: any) {
    console.log(error.message);
  }
};
