import axiosInstance from "./axiosInstance";

export const fetchCart = async () => {
  try {
    const response = await axiosInstance.get("/api/cart", { withCredentials: true });
    console.log("cart found = ", response.data.data.items);
    return response.data.data.items;
  } catch (error: any) {
    console.error(
      "Error fetching cart:",
      error?.response?.data || error.message
    );
    throw error;
  }
};
