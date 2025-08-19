import axios from "axios";
import { API_BASE_URL } from "../config";

export const getWishlist = async (token?: string) => {
  const res = await axios.get(`${API_BASE_URL}/api/wishlist`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });
  return res.data.data.items;
};

export const addToWishlist = async (
  productId: number,
  variantId?: number,
  token?: string
) => {
  const payload = variantId ? { productId, variantId } : { productId };
  const res = await axios.post(
    `${API_BASE_URL}/api/wishlist`,
    payload,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    }
  );
  // The API returns the updated wishlist; return the matching item
  const items = res.data?.data?.items || [];
  return items.find(
    (item: any) =>
      item.productId === productId && (
        variantId ? item.variantId === variantId : !item.variantId
      )
  );
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