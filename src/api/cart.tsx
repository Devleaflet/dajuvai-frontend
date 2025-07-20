import axiosInstance from "./axiosInstance";

export const fetchCart = async () => {
  console.log("=== fetchCart START ===");
  try {
    console.log("Making GET request to /api/cart...");
    const response = await axiosInstance.get("/api/cart", { withCredentials: true });
    console.log("Full API response:", response);
    console.log("Response status:", response.status);
    console.log("Response data:", response.data);
    console.log("Response data.data:", response.data.data);
    console.log("Response data.data.items:", response.data.data.items);
    console.log("cart found = ", response.data.data.items);
    
    const items = response.data.data.items;
    console.log("Returning items:", items);
    console.log("Number of items:", items.length);
    console.log("=== fetchCart SUCCESS ===");
    return items;
  } catch (error: unknown) {
    console.error("=== fetchCart ERROR ===");
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(
      "Error fetching cart:",
      errorMessage
    );
    console.error("Full error object:", error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      console.error("Error response status:", axiosError.response?.status);
      console.error("Error response data:", axiosError.response?.data);
    }
    throw error;
  }
};
