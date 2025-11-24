import React, { useContext, createContext, useReducer, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { Product } from "../Components/Types/Product";
import iphone from "../assets/iphone.jpg";
import { fetchCart } from "../api/cart";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";

// Define cart item type with proper ID structure
interface CartItem {
  id: number; // cart item ID from backend
  productId?: number; // product ID
  variantId?: number; // optional variant ID
  name: string;
  price: number;
  quantity: number;
  image: string;
  product?: Product & { id: number };
  variant?: any;
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
  handleCartOnAdd: (product: Product, quantity?: number, variantId?: number) => void;
  handleCartItemOnDelete: (cartItem: CartItem) => void;
  handleIncreaseQuantity: (cartItemId: number, quantity?: number) => void;
  handleDecreaseQuantity: (cartItemId: number, quantity?: number) => void;
  setCartItems: (items: CartItem[]) => void;
  refreshCart: () => Promise<void>;
  deletingItems: Set<number>; // cart item IDs being deleted
  addingItems: Set<number>; // product IDs being added
  updatingItems: Set<number>; // cart item IDs being updated
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
const CartContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, dispatch] = useReducer(cartReducer, []);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [addingItems, setAddingItems] = useState<Set<number>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

  const location = useLocation();
  const auth = useAuth();

  // Fetch cart items on mount and set them
  useEffect(() => {
    const loadCart = async () => {
      // Don't fetch cart if user is not authenticated
      if (!auth.isAuthenticated) {
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
  }, [auth.isAuthenticated]);

  // Refresh cart when navigating to cart-related pages
  useEffect(() => {
    const cartRelatedPages = ['/checkout', '/cart'];
    const isCartPage = cartRelatedPages.some(page => location.pathname.includes(page));

    if (isCartPage && auth.isAuthenticated) {
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
    } else if (isCartPage && !auth.isAuthenticated) {
      // Clear cart if user is not authenticated on cart pages
      setCartItems([]);
    }
  }, [location.pathname, auth.isAuthenticated]);

  // Refresh cart when authentication state changes
  useEffect(() => {
    const refreshCart = async () => {
      if (!auth.isAuthenticated) {
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
  }, [auth.isAuthenticated]);

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
  };

  const handleCartOnAdd = async (product: Product, quantity = 1, variantId?: number) => {
    //("=== handleCartOnAdd START ===");
    //("Product being added:", product);
    //("Quantity:", quantity);
    //("Current cart items:", cartItems);
    //("Is authenticated:", auth.isAuthenticated);

    if (!auth.isAuthenticated) {
      //("User not authenticated, cannot add to cart");
      return;
    }

    // Prevent multiple clicks using product ID
    if (addingItems.has(product.id)) {
      //("Item is already being added, product ID:", product.id);
      return;
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

    if (!auth.isAuthenticated) {
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
    if (!auth.isAuthenticated) {
      //("User not authenticated, cannot modify cart");
      return;
    }

    if (updatingItems.has(cartItemId)) {
      //("Item is already being updated");
      return;
    }

    // Add cartItem to updating set
    setUpdatingItems(prev => new Set(prev).add(cartItemId));

    try {
      // Find the cart item to derive productId and variantId
      const item = cartItems.find(ci => ci.id === cartItemId);
      if (!item) {
        console.warn("Cart item not found for increase:", cartItemId);
        return;
      }

      const payload: any = {
        productId: item.product?.id || item.productId,
        quantity: amount,
      };
      if (item.variant?.id || item.variantId) {
        payload.variantId = item.variant?.id || item.variantId;
      }

      await axiosInstance.post("/api/cart", payload, { withCredentials: true });

      // Refresh cart from backend to get the correct state
      await refreshCart();
      //("Quantity increased for cart item:", cartItemId);
    } catch (error: any) {
      console.error(
        "Failed to increase quantity:",
        error?.response?.data || error.message
      );
      toast.error("Failed to update quantity. Please try again.");
    } finally {
      // Remove item from updating set
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  const handleDecreaseQuantity = async (
    cartItemId: number,
    amount: number = 1
  ) => {
    if (!auth.isAuthenticated) {
      //("User not authenticated, cannot modify cart");
      return;
    }

    if (updatingItems.has(cartItemId)) {
      //("Item is already being updated");
      return;
    }

    // Add cartItem to updating set
    setUpdatingItems(prev => new Set(prev).add(cartItemId));

    try {
      // The DELETE endpoint supports decreaseOnly; loop for amount times
      for (let i = 0; i < amount; i++) {
        await axiosInstance.delete("/api/cart", {
          data: { cartItemId, decreaseOnly: true },
          withCredentials: true
        });
      }

      // Refresh cart from backend to get the correct state
      await refreshCart();
      //("Quantity decreased for cart item:", cartItemId);
    } catch (error: any) {
      console.error(
        "Failed to decrease quantity:",
        error?.response?.data || error.message
      );
      toast.error("Failed to update quantity. Please try again.");
    } finally {
      // Remove item from updating set
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  const refreshCart = async () => {
    //("=== refreshCart START ===");
    //("Is authenticated:", auth.isAuthenticated);

    if (!auth.isAuthenticated) {
      //("User not authenticated, clearing cart");
      setCartItems([]);
      return;
    }

    try {
      //("Fetching cart from backend...");
      const items = await fetchCart();
      //("Fetched cart items from backend:", items);
      //("Number of items fetched:", items.length);

     

      //("Setting cart items in state...");
      setCartItems(items);
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
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
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