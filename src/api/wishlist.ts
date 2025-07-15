import axios from "axios";
import { API_BASE_URL } from "../config";

export const getWishlist = async (token?: string) => {
  const res = await axios.get(`${API_BASE_URL}/api/wishlist`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });
  return res.data.data.items;
};

export const addToWishlist = async (productId: number, token?: string) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/wishlist`,
    { productId },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    }
  );
  // The API returns the updated wishlist, but for consistency, return the new item
  // Find the item with this productId
  const items = res.data.data.items;
  return items.find((item: any) => item.productId === productId);
};

export const removeFromWishlist = async (wishlistItemId: number, token?: string) => {
  const res = await axios.delete(`${API_BASE_URL}/api/wishlist`, {
    data: { wishlistItemId },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });
  // The API returns the updated wishlist
  return res.data.data.items;
};

export const moveToCart = async (wishlistItemId: number, quantity: number, token?: string) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/wishlist/move-to-cart`,
    { wishlistItemId, quantity },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    }
  );
  // The API returns the updated wishlist
  return res.data.data;
}; 