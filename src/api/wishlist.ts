import axios from "axios";
import { API_BASE_URL } from "../config";

let inflight = new Map<string, Promise<any[]>>();
let cache = new Map<string, { ts: number; data: any[] }>();

const clearWishlistCache = () => {
  inflight.clear();
  cache.clear();
};

export const getWishlist = async (token?: string) => {
  const key = token ? `bearer:${token}` : "cookie";
  const cached = cache.get(key);
  const now = Date.now();
  if (cached && now - cached.ts < 4000) {
    return cached.data;
  }
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = axios
    .get(`${API_BASE_URL}/api/wishlist`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    })
    .then((res) => {
      const items = res.data?.data?.items || [];
      cache.set(key, { ts: Date.now(), data: items });
      inflight.delete(key);
      return items;
    })
    .catch((e) => {
      inflight.delete(key);
      throw e;
    });
  inflight.set(key, p);
  return p;
};

export const addToWishlist = async (
  productId: number,
  variantId?: number,
  token?: string
) => {
  const hasVariant = variantId !== undefined && variantId !== null;
  const payload = hasVariant ? { productId, variantId } : { productId };
  const res = await axios.post(
    `${API_BASE_URL}/api/wishlist`,
    payload,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    }
  );
  clearWishlistCache();
  // The API returns the updated wishlist; return the matching item
  const items = res.data?.data?.items || [];
  return items.find(
    (item: any) =>
      item.productId === productId && (
        hasVariant ? item.variantId === variantId : !item.variantId
      )
  );
};

export const removeFromWishlist = async (wishlistItemId: number, token?: string) => {
  const res = await axios.delete(`${API_BASE_URL}/api/wishlist`, {
    data: { wishlistItemId },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });
  clearWishlistCache();
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
  clearWishlistCache();
  // The API returns the updated wishlist
  return res.data.data;
};
