import axiosInstance from "./axiosInstance";

export const fetchCart = async () => {
  //"=== fetchCart START ===");
  try {
    //"Making GET request to /api/cart...");
    const response = await axiosInstance.get("/api/cart", { withCredentials: true });
    //"Full API response:", response);
    //"Response status:", response.status);
    //"Response data:", response.data);
    //"Response data.data:", response.data.data);
    //"Response data.data.items:", response.data.data.items);
    //"cart found = ", response.data.data.items);
    
    const items = response.data.data.items;
    //"Returning items:", items);
    //"Number of items:", items.length);
    //"=== fetchCart SUCCESS ===");
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
