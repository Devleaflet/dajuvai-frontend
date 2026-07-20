import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { addToWishlist, getWishlist, removeFromWishlist } from '../api/wishlist';
import { useAuth } from './AuthContext';

type WishlistVariantId = number | string | null | undefined;

interface WishlistContextType {
  wishlist: any[];
  wishlistMap: Map<string, any>;
  pendingKeys: Set<string>;
  loading: boolean;
  refreshWishlist: () => Promise<void>;
  isWishlisted: (productId: number, variantId?: WishlistVariantId) => boolean;
  getWishlistItem: (productId: number, variantId?: WishlistVariantId) => any | undefined;
  addWishlistItem: (productId: number, variantId?: WishlistVariantId) => Promise<any | null>;
  removeWishlistItem: (wishlistItemId: number) => Promise<void>;
  removeWishlistItemsLocally: (wishlistItemIds: number[]) => void;
  replaceWishlistItems: (items: any[]) => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const makeWishlistKey = (
  productId: number | string,
  variantId?: WishlistVariantId,
) => {
  const normalizedProductId = Number(productId);
  const normalizedVariantId =
    variantId === null || variantId === undefined || variantId === ''
      ? null
      : Number(variantId);

  return normalizedVariantId && Number.isFinite(normalizedVariantId)
    ? `${normalizedProductId}:${normalizedVariantId}`
    : `${normalizedProductId}`;
};

const itemKey = (item: any) => {
  const productId = item?.productId ?? item?.product?.id;
  const variantId = item?.variantId ?? item?.variant?.id ?? null;
  return makeWishlistKey(productId, variantId);
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  // Wishlist is a customer-only concept — the backend rejects any other
  // role with 409 CONFLICT. Admin/vendor/staff/rider tokens are also
  // `isAuthenticated`, so gate on role too or every non-customer session
  // spams the storefront with 409s.
  const isCustomer = isAuthenticated && user?.role === 'user';
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const setPending = useCallback((key: string, isPending: boolean) => {
    setPendingKeys((current) => {
      const next = new Set(current);
      if (isPending) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (!isCustomer || !token) {
      setWishlist([]);
      setPendingKeys(new Set());
      return;
    }

    setLoading(true);
    try {
      const items = await getWishlist(token);
      setWishlist(items);
    } catch (err) {
      console.warn('Failed to load wishlist', err);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [isCustomer, token]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  useEffect(() => {
    if (!isCustomer || !token) return;

    const interval = window.setInterval(refreshWishlist, 30_000);
    const onFocus = () => refreshWishlist();
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [isCustomer, refreshWishlist, token]);

  const wishlistMap = useMemo(() => {
    const map = new Map<string, any>();
    wishlist.forEach((item) => {
      map.set(itemKey(item), item);
    });
    return map;
  }, [wishlist]);

  const getWishlistItem = useCallback(
    (productId: number, variantId?: WishlistVariantId) =>
      wishlistMap.get(makeWishlistKey(productId, variantId)),
    [wishlistMap],
  );

  const isWishlisted = useCallback(
    (productId: number, variantId?: WishlistVariantId) =>
      Boolean(getWishlistItem(productId, variantId)),
    [getWishlistItem],
  );

  const addWishlistItem = useCallback(
    async (productId: number, variantId?: WishlistVariantId) => {
      if (!isCustomer || !token) {
        throw new Error('Please login to use wishlist');
      }

      const key = makeWishlistKey(productId, variantId);
      const existing = wishlistMap.get(key);
      if (existing) return existing;
      if (pendingKeys.has(key)) return null;

      const normalizedVariantId =
        variantId === null || variantId === undefined || variantId === ''
          ? null
          : Number(variantId);
      const optimisticItem = {
        id: -Date.now(),
        productId,
        variantId: normalizedVariantId,
        __optimistic: true,
      };

      setPending(key, true);
      setWishlist((current) =>
        current.some((item) => itemKey(item) === key) ? current : [optimisticItem, ...current],
      );

      try {
        const savedItem = await addToWishlist(
          productId,
          normalizedVariantId ?? undefined,
          token,
        );
        await refreshWishlist();
        return savedItem ?? null;
      } catch (err) {
        setWishlist((current) => current.filter((item) => item.id !== optimisticItem.id));
        throw err;
      } finally {
        setPending(key, false);
      }
    },
    [isCustomer, pendingKeys, refreshWishlist, setPending, token, wishlistMap],
  );

  const removeWishlistItem = useCallback(
    async (wishlistItemId: number) => {
      if (!isCustomer || !token) {
        throw new Error('Please login to use wishlist');
      }

      const existing = wishlist.find((item) => Number(item.id) === Number(wishlistItemId));
      const removeKey = `remove:${wishlistItemId}`;
      if (pendingKeys.has(removeKey)) return;

      setPending(removeKey, true);
      setWishlist((current) =>
        current.filter((item) => Number(item.id) !== Number(wishlistItemId)),
      );

      try {
        await removeFromWishlist(wishlistItemId, token);
        await refreshWishlist();
      } catch (err) {
        if (existing) {
          setWishlist((current) => {
            if (current.some((item) => Number(item.id) === Number(existing.id))) {
              return current;
            }
            return [existing, ...current];
          });
        }
        throw err;
      } finally {
        setPending(removeKey, false);
      }
    },
    [isCustomer, pendingKeys, refreshWishlist, setPending, token, wishlist],
  );

  const removeWishlistItemsLocally = useCallback((wishlistItemIds: number[]) => {
    const ids = new Set(wishlistItemIds.map((id) => Number(id)));
    setWishlist((current) =>
      current.filter((item) => !ids.has(Number(item.id))),
    );
  }, []);

  const replaceWishlistItems = useCallback((items: any[]) => {
    setWishlist(Array.isArray(items) ? items : []);
  }, []);

  const value = useMemo(
    () => ({
      wishlist,
      wishlistMap,
      pendingKeys,
      loading,
      refreshWishlist,
      isWishlisted,
      getWishlistItem,
      addWishlistItem,
      removeWishlistItem,
      removeWishlistItemsLocally,
      replaceWishlistItems,
    }),
    [
      addWishlistItem,
      getWishlistItem,
      isWishlisted,
      loading,
      pendingKeys,
      refreshWishlist,
      removeWishlistItem,
      removeWishlistItemsLocally,
      replaceWishlistItems,
      wishlist,
      wishlistMap,
    ],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
