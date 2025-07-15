// hooks/useWishlistApi.ts
import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
}

interface WishlistItem {
  id: number;
  productId: number;
  product: Product;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface WishlistData {
  items: WishlistItem[];
}

interface UseWishlistApiReturn {
  loading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<WishlistItem[]>;
  addToWishlist: (productId: number) => Promise<boolean>;
  removeFromWishlist: (wishlistItemId: number) => Promise<boolean>;
  moveToCart: (wishlistItemId: number, quantity: number) => Promise<boolean>;
  clearError: () => void;
}

export const useWishlistApi = (): UseWishlistApiReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth token from localStorage
  const getAuthToken = useCallback((): string | null => {
    return localStorage.getItem('authToken');
  }, []);

  // API headers with authentication
  const getHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }, [getAuthToken]);

  // Handle API errors
  const handleApiError = useCallback((response: Response, defaultMessage: string): Error => {
    if (response.status === 401) {
      return new Error('Please log in to continue');
    }
    if (response.status === 404) {
      return new Error('Item not found');
    }
    if (response.status === 400) {
      return new Error('Invalid request');
    }
    return new Error(defaultMessage);
  }, []);

  // Fetch wishlist items
  const fetchWishlist = useCallback(async (): Promise<WishlistItem[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw handleApiError(response, 'Failed to fetch wishlist');
      }

      const data: ApiResponse<WishlistData> = await response.json();
      
      if (data.success) {
        return data.data.items;
      } else {
        throw new Error('Failed to load wishlist');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getHeaders, handleApiError]);

  // Add product to wishlist
  const addToWishlist = useCallback(async (productId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw handleApiError(response, 'Failed to add item to wishlist');
      }

      const data: ApiResponse<unknown> = await response.json();
      return data.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to wishlist';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getHeaders, handleApiError]);

  // Remove item from wishlist
  const removeFromWishlist = useCallback(async (wishlistItemId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ wishlistItemId }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw handleApiError(response, 'Failed to remove item from wishlist');
      }

      const data: ApiResponse<unknown> = await response.json();
      return data.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getHeaders, handleApiError]);

  // Move item from wishlist to cart
  const moveToCart = useCallback(async (wishlistItemId: number, quantity: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/wishlist/move-to-cart`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ wishlistItemId, quantity }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw handleApiError(response, 'Failed to move item to cart');
      }

      const data: ApiResponse<unknown> = await response.json();
      return data.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move item to cart';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getHeaders, handleApiError]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    moveToCart,
    clearError,
  };
};