import React, { useContext, createContext, useReducer, useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { Product } from "../Components/Types/Product";
import iphone from "../assets/iphone.jpg";
import { fetchCart } from "../api/cart";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../config";

// Define cart item type with proper ID structure
interface CartItem {
  id: number; // cart item ID from backend
  productId?: number; // product ID
  lineItemId?: number;
  itemId?: number;
  variantId?: number; // optional variant ID
  name: string;
  price: number;
  quantity: number;
  image: string;
  product?: Product & { id: number };
  variant?: any;
  selectedVariant?: any;
  stock?: number;
  // Set server-side (CartService.getCart) when the item's product/variant
  // is gone, unavailable, or its stock has dropped below the cart quantity
  // since it was added — surfaced so the user finds out here, not at checkout.
  warningMessage?: string;
}

// Reducer action types
type ActionType =
  | { type: "SET_ITEMS"; payload: CartItem[] }
  | { type: "ADD_ITEM"; payload: { product: Product; quantity: number; variantId?: number } }
  | { type: "DELETE_ITEM"; payload: { cartItem: CartItem } }
  | { type: "INC_QUANTITY"; payload: { cartItemId: number; quantity: number } }
  | { type: "DEC_QUANTITY"; payload: { cartItemId: number; quantity: number } };

// Reducer function
const cartReducer = (state: CartItem[], action: ActionType): CartItem[] => {
  switch (action.type) {
    case "SET_ITEMS": {
      return action.payload;
    }

    case "ADD_ITEM": {
      // Check if product already exists using product ID
      const productId = action.payload.product.id;
      const exists = state.find((item) =>
        (item.productId === productId) ||
        (item.product?.id === productId)
      );

      if (exists) {
        return state.map((item) => {
          const itemProductId = item.productId || item.product?.id;
          return itemProductId === productId
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item;
        });
      }

      return [
        {
          id: Date.now(), // Temporary ID - backend will provide real cart item ID
          productId: action.payload.product.id,
          name: String(action.payload.product.name || action.payload.product.title),
          price: Number(action.payload.product.price),
          quantity: action.payload.quantity,
          image: action.payload.product.image || iphone,
          product: action.payload.product,
          variantId: action.payload.variantId,
        },
        ...state,
      ];
    }

    case "DELETE_ITEM": {
      // Delete using cart item ID
      return state.filter((item) => item.id !== action.payload.cartItem.id);
    }

    case "INC_QUANTITY": {
      //('INC_QUANTITY action:', action);
      //('State before INC_QUANTITY:', state);
      const cartItemId = action.payload.cartItemId;
      const newState = state.map((item) => {
        return item.id === cartItemId
          ? { ...item, quantity: item.quantity + action.payload.quantity }
          : item;
      });
      //('State after INC_QUANTITY:', newState);
      return newState;
    }

    case "DEC_QUANTITY": {
      //('DEC_QUANTITY action:', action);
      //('State before DEC_QUANTITY:', state);
      const cartItemId = action.payload.cartItemId;
      const newState = state
        .map((item) => {
          return item.id === cartItemId
            ? { ...item, quantity: Math.max(0, item.quantity - action.payload.quantity) }
            : item;
        })
        .filter((item) => item.quantity > 0);
      //('State after DEC_QUANTITY:', newState);
      return newState;
    }

    default:
      return state;
  }
};

// Context type
interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  handleCartOnAdd: (product: Product, quantity?: number, variantId?: number) => Promise<boolean>;
  handleCartItemOnDelete: (cartItem: CartItem) => void;
  handleIncreaseQuantity: (cartItemId: number, quantity?: number) => Promise<void>;
  handleDecreaseQuantity: (cartItemId: number, quantity?: number) => Promise<void>;
  setCartItems: (items: CartItem[]) => void;
  refreshCart: () => Promise<CartItem[]>;
  deletingItems: Set<number>; // cart item IDs being deleted
  addingItems: Set<number>; // product IDs being added
  updatingItems: Set<number>; // cart item IDs being updated
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const normalizeCartItemId = (cartItemId: number | string): number | null => {
  const parsedId = Number(cartItemId);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
};

const getCartItemStockLimit = (item: CartItem): number | null => {
  const rawStock =
    item.variant?.stock ??
    item.selectedVariant?.stock ??
    item.product?.stock ??
    item.stock;
  const parsedStock = Number(rawStock);
  return Number.isFinite(parsedStock) && parsedStock >= 0 ? parsedStock : null;
};

const getCartErrorMessage = (
  error: any,
  fallback = "Failed to update quantity. Please try again.",
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

// Provider component
const CartContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, dispatch] = useReducer(cartReducer, []);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [addingItems, setAddingItems] = useState<Set<number>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const [cartCount, setCartCount] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);
  const refreshDebounceRef = useRef<number | null>(null);

  const location = useLocation();
  const auth = useAuth();
  // Cart is a customer-only concept — the backend rejects any other role
  // with 409 CONFLICT ("Only customer accounts can perform this action").
  // Admin/vendor/staff/rider tokens are also `isAuthenticated`, so gate on
  // role too or every non-customer session spams the storefront with 409s.
  const isCustomer = auth.isAuthenticated && auth.user?.role === 'user';

  // Fetch cart items on mount and set them
  useEffect(() => {
    const loadCart = async () => {
      // Don't fetch cart if user is not authenticated as a customer
      if (!isCustomer) {
        //("User not authenticated, clearing cart");
        setCartItems([]);
        return;
      }

      try {
        const items = await fetchCart();
        setCartItems(items);
      } catch (error) {
        // If there's an auth error, clear the cart
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          //("Auth error while fetching cart, clearing cart");
          setCartItems([]);
        } else {
          console.error("Failed to load cart on mount:", error);
        }
      }
    };
    loadCart();
  }, [isCustomer]);

  // Refresh cart when navigating to cart-related pages
  useEffect(() => {
    const cartRelatedPages = ['/checkout', '/cart'];
    const isCartPage = cartRelatedPages.some(page => location.pathname.includes(page));

    if (isCartPage && isCustomer) {
      const refreshCart = async () => {
        try {
          const items = await fetchCart();
          setCartItems(items);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            //("Auth error while refreshing cart, clearing cart");
            setCartItems([]);
          } else {
            console.error("Failed to refresh cart on navigation:", error);
          }
        }
      };
      refreshCart();
    } else if (isCartPage && !isCustomer) {
      // Clear cart if user is not an authenticated customer on cart pages
      setCartItems([]);
    }
  }, [location.pathname, isCustomer]);

  // Refresh cart when authentication state changes
  useEffect(() => {
    const refreshCart = async () => {
      if (!isCustomer) {
        //("User not authenticated, clearing cart");
        setCartItems([]);
        return;
      }

      try {
        const items = await fetchCart();
        setCartItems(items);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          //("Auth error while refreshing cart, clearing cart");
          setCartItems([]);
        } else {
          console.error("Failed to refresh cart:", error);
        }
      }
    };
    refreshCart();
  }, [isCustomer]);

  // Listen for logout event and clear cart
  useEffect(() => {
    const handleLogout = () => {
      //("Clearing cart on logout");
      setCartItems([]);
    };

    window.addEventListener('userLoggedOut', handleLogout);
    return () => window.removeEventListener('userLoggedOut', handleLogout);
  }, []);

  const setCartItems = (items: CartItem[]) => {
    dispatch({ type: "SET_ITEMS", payload: items });
    const count = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setCartCount(count);
  };

  const handleCartOnAdd = async (product: Product, quantity = 1, variantId?: number) => {
    //("=== handleCartOnAdd START ===");
    //("Product being added:", product);
    //("Quantity:", quantity);
    //("Current cart items:", cartItems);
    //("Is authenticated:", auth.isAuthenticated);

    if (!isCustomer) {
      //("User not authenticated, cannot add to cart");
      return false;
    }

    // Prevent multiple clicks using product ID
    if (addingItems.has(product.id)) {
      //("Item is already being added, product ID:", product.id);
      return false;
    }

    //("Adding product ID to addingItems set:", product.id);
    // Add item to adding set
    setAddingItems(prev => new Set(prev).add(product.id));

    try {
      //("Making API call to add item to cart...");
      const payload: any = {
        productId: product.id,
        quantity,
      };
      if (variantId) {
        payload.variantId = variantId;
      }
      const response = await axiosInstance.post("/api/cart", payload, { withCredentials: true });
      //("API response:", response.data);

      //("Refreshing cart from backend...");
      // Refresh cart from backend to get the correct item structure
      await refreshCart();
      //("Cart refreshed successfully");

      toast.success("Item added to cart successfully!");
      return true;
      //("=== handleCartOnAdd SUCCESS ===");
    } catch (error: any) {
      console.error("=== handleCartOnAdd ERROR ===");
      console.error("Cart POST error:", error?.response?.data || error.message);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message;

      //("-----------Message---------")
      //(message)

      if (message.includes("stock")) {
        toast.error("Cannot add more than available stock.");
      } else if (message.includes("customer")) {
        toast.error("Only customer accounts can perform this action. If you are an admin or vendor, please create a customer account first.");
      } else if (message.includes("items")) {
        toast.error(message);
      } else {
        toast.error(message)
      }
      await refreshCart().catch(() => undefined);
      return false;
    } finally {
      //("Removing product ID from addingItems set:", product.id);
      // Remove item from adding set
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
      //("=== handleCartOnAdd END ===");
    }
  };

  const handleCartItemOnDelete = async (cartItem: CartItem) => {
    //("=== handleCartItemOnDelete START ===");
    //("Cart item being deleted:", cartItem);
    //("Cart item ID:", cartItem.id);
    //("Product ID:", cartItem.productId || cartItem.product?.id);
    //("Current cart items:", cartItems);
    //("Is authenticated:", auth.isAuthenticated);

    if (!isCustomer) {
      //("User not authenticated, cannot delete from cart");
      return;
    }

    // Prevent multiple clicks using cart item ID
    if (deletingItems.has(cartItem.id)) {
      //("Item is already being deleted, cart item ID:", cartItem.id);
      return;
    }

    //("Adding cart item ID to deletingItems set:", cartItem.id);
    // Add item to deleting set
    setDeletingItems(prev => new Set(prev).add(cartItem.id));

    try {
      //("Making API call to delete item from cart...");
      //("Sending cartItemId:", cartItem.id);

      const response = await axiosInstance.delete("/api/cart", {
        data: { cartItemId: cartItem.id },
        withCredentials: true
      });
      //("Delete API response:", response.data);

      //("Refreshing cart from backend...");
      // Refresh cart from backend to get the correct state
      await refreshCart();
      //("Cart refreshed successfully after deletion");

      //("Item deleted successfully from backend");
      toast.success("Item removed from cart successfully!");
      //("=== handleCartItemOnDelete SUCCESS ===");
    } catch (error: any) {
      console.error("=== handleCartItemOnDelete ERROR ===");
      console.error("Delete error:", error?.response?.data || error.message);
      console.error("Full error object:", error);
      console.error("Error response status:", error?.response?.status);
      console.error("Error response headers:", error?.response?.headers);

      // Show error toast notification
      toast.error("Failed to remove item from cart. Please try again.");
    } finally {
      //("Removing cart item ID from deletingItems set:", cartItem.id);
      // Remove item from deleting set
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItem.id);
        return newSet;
      });
      //("=== handleCartItemOnDelete END ===");
    }
  };

  const handleIncreaseQuantity = async (
    cartItemId: number,
    amount: number = 1
  ) => {
    const normalizedCartItemId = normalizeCartItemId(cartItemId);
    const quantityDelta = Number(amount);

    if (!isCustomer) {
      //("User not authenticated, cannot modify cart");
      return;
    }

    if (!normalizedCartItemId || !Number.isInteger(quantityDelta) || quantityDelta <= 0) {
      toast.error("Unable to update quantity. Please refresh your cart.");
      return;
    }

    if (updatingItems.has(normalizedCartItemId)) {
      //("Item is already being updated");
      return;
    }

    // Find the cart item to derive productId and variantId
    const item = cartItems.find(ci => normalizeCartItemId(ci.id) === normalizedCartItemId);
    if (!item) {
      console.warn("Cart item not found for increase:", normalizedCartItemId);
      return;
    }

    const stockLimit = getCartItemStockLimit(item);
    if (stockLimit !== null && item.quantity + quantityDelta > stockLimit) {
      toast.error(
        stockLimit === 0
          ? "This item is out of stock."
          : `Only ${stockLimit} available in stock.`,
      );
      return;
    }

    const productId = Number(item.productId ?? item.product?.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      toast.error("Unable to update quantity. Product information is missing.");
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(normalizedCartItemId));

    // Optimistic: reflect the new quantity immediately via the existing
    // reducer action instead of waiting on a full refetch — this is what was
    // causing every +/- click to visibly reload the whole cart list.
    dispatch({ type: "INC_QUANTITY", payload: { cartItemId: normalizedCartItemId, quantity: quantityDelta } });
    setCartCount(prev => prev + quantityDelta);

    try {
      const payload: any = {
        productId,
        quantity: quantityDelta,
      };
      if (item.variant?.id || item.variantId) {
        payload.variantId = item.variant?.id || item.variantId;
      }

      await axiosInstance.post("/api/cart", payload, { withCredentials: true });
    } catch (error: any) {
      // Roll back the optimistic bump and resync with the server's real state.
      dispatch({ type: "DEC_QUANTITY", payload: { cartItemId: normalizedCartItemId, quantity: quantityDelta } });
      setCartCount(prev => Math.max(0, prev - quantityDelta));
      await refreshCart();

      const message = getCartErrorMessage(error);
      console.error(
        "Failed to increase quantity:",
        error?.response?.data || error.message
      );
      toast.error(message);
      throw error;
    } finally {
      // Remove item from updating set
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(normalizedCartItemId);
        return newSet;
      });
    }
  };

  const handleDecreaseQuantity = async (
    cartItemId: number,
    amount: number = 1
  ) => {
    const normalizedCartItemId = normalizeCartItemId(cartItemId);
    const quantityDelta = Number(amount);

    if (!isCustomer) {
      //("User not authenticated, cannot modify cart");
      return;
    }

    if (!normalizedCartItemId || !Number.isInteger(quantityDelta) || quantityDelta <= 0) {
      toast.error("Unable to update quantity. Please refresh your cart.");
      return;
    }

    if (updatingItems.has(normalizedCartItemId)) {
      //("Item is already being updated");
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(normalizedCartItemId));

    // Optimistic: matches handleIncreaseQuantity — reflect the decrement (or
    // removal, if quantity hits 0) immediately instead of waiting on a full
    // refetch.
    dispatch({ type: "DEC_QUANTITY", payload: { cartItemId: normalizedCartItemId, quantity: quantityDelta } });
    setCartCount(prev => Math.max(0, prev - quantityDelta));

    try {
      // The DELETE endpoint supports decreaseOnly; loop for amount times
      for (let i = 0; i < quantityDelta; i++) {
        await axiosInstance.delete("/api/cart", {
          data: { cartItemId: normalizedCartItemId, decreaseOnly: true },
          withCredentials: true
        });
      }
    } catch (error: any) {
      // Roll back and resync with the server's real state.
      dispatch({ type: "INC_QUANTITY", payload: { cartItemId: normalizedCartItemId, quantity: quantityDelta } });
      setCartCount(prev => prev + quantityDelta);
      await refreshCart();

      const message = getCartErrorMessage(error);
      console.error(
        "Failed to decrease quantity:",
        error?.response?.data || error.message
      );
      toast.error(message);
      throw error;
    } finally {
      // Remove item from updating set
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(normalizedCartItemId);
        return newSet;
      });
    }
  };

  const refreshCart = async (): Promise<CartItem[]> => {
    //("=== refreshCart START ===");
    //("Is authenticated:", auth.isAuthenticated);

    if (!isCustomer) {
      //("User not authenticated, clearing cart");
      setCartItems([]);
      return [];
    }

    try {
      //("Fetching cart from backend...");
      const items = await fetchCart();
      //("Fetched cart items from backend:", items);
      //("Number of items fetched:", items.length);

     

      //("Setting cart items in state...");
      setCartItems(items);
      return items;
      //("Cart items set successfully");
      //("=== refreshCart SUCCESS ===");
    } catch (error) {
      console.error("=== refreshCart ERROR ===");
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        //("Auth error while refreshing cart, clearing cart");
        setCartItems([]);
      } else {
        console.error("Failed to refresh cart:", error);
        console.error("Error response:", error?.response?.data);
        console.error("Error status:", error?.response?.status);
      }
      throw error;
    }
  };

  // Connect to Socket.IO for cart count updates
  useEffect(() => {
    if (!isCustomer || !auth.token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const isCartPage = ["/checkout", "/cart"].some((page) =>
      location.pathname.includes(page)
    );

    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
      withCredentials: true,
      auth: {
        token: auth.token,
      },
    });

    socketRef.current = socket;

    const debouncedRefreshCart = () => {
      if (refreshDebounceRef.current) {
        window.clearTimeout(refreshDebounceRef.current);
      }
      refreshDebounceRef.current = window.setTimeout(() => {
        void refreshCart().catch(() => undefined);
        refreshDebounceRef.current = null;
      }, 300);
    };

    const handleCartUpdate = (payload?: { count?: number }) => {
      if (typeof payload?.count === "number") {
        setCartCount(payload.count);
      }
      if (isCartPage) {
        debouncedRefreshCart();
      }
    };

    socket.on("cart:update", handleCartUpdate);
    socket.on("cart:count", handleCartUpdate);
    // Stock belongs to the catalog, not to a single shopper's cart. Refresh
    // when any completed order changes it so stale cart limits never survive
    // until the next navigation.
    socket.on("product:stockUpdated", debouncedRefreshCart);

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err);
    });

    return () => {
      socket.off("cart:update", handleCartUpdate);
      socket.off("cart:count", handleCartUpdate);
      socket.off("product:stockUpdated", debouncedRefreshCart);
      if (refreshDebounceRef.current) {
        window.clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = null;
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isCustomer, auth.token, location.pathname]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        setCartItems,
        handleCartOnAdd,
        handleCartItemOnDelete,
        handleDecreaseQuantity,
        handleIncreaseQuantity,
        refreshCart,
        deletingItems,
        addingItems,
        updatingItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContextProvider;

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartContextProvider");
  }
  return context;
};
