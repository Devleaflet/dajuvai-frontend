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
  id: number; // This is the cart item ID from backend
  productId?: number; // Product ID (might be separate field)
  name: string;
  price: number;
  quantity: number;
  image: string;
  product?: Product;
}

// Reducer action types
type ActionType =
  | { type: "SET_ITEMS"; payload: CartItem[] }
  | { type: "ADD_ITEM"; payload: { product: Product; quantity: number } }
  | { type: "DELETE_ITEM"; payload: { cartItem: CartItem } }
  | { type: "INC_QUANTITY"; payload: { product: Product; quantity: number } }
  | { type: "DEC_QUANTITY"; payload: { product: Product; quantity: number } };

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
        },
        ...state,
      ];
    }

    case "DELETE_ITEM": {
      // Delete using cart item ID
      return state.filter((item) => item.id !== action.payload.cartItem.id);
    }

    case "INC_QUANTITY": {
      console.log('INC_QUANTITY action:', action);
      console.log('State before INC_QUANTITY:', state);
      const productId = action.payload.product.id;
      const newState = state.map((item) => {
        const itemProductId = item.productId || item.product?.id;
        return itemProductId === productId
          ? { ...item, quantity: item.quantity + action.payload.quantity }
          : item;
      });
      console.log('State after INC_QUANTITY:', newState);
      return newState;
    }

    case "DEC_QUANTITY": {
      console.log('DEC_QUANTITY action:', action);
      console.log('State before DEC_QUANTITY:', state);
      const productId = action.payload.product.id;
      const newState = state
        .map((item) => {
          const itemProductId = item.productId || item.product?.id;
          return itemProductId === productId
            ? { ...item, quantity: Math.max(0, item.quantity - action.payload.quantity) }
            : item;
        })
        .filter((item) => item.quantity > 0);
      console.log('State after DEC_QUANTITY:', newState);
      return newState;
    }

    default:
      return state;
  }
};

// Context type
interface CartContextType {
  cartItems: CartItem[];
  handleCartOnAdd: (product: Product, quantity?: number) => void;
  handleCartItemOnDelete: (cartItem: CartItem) => void;
  handleIncreaseQuantity: (product: Product, quantity?: number) => void;
  handleDecreaseQuantity: (product: Product, quantity?: number) => void;
  setCartItems: (items: CartItem[]) => void;
  refreshCart: () => Promise<void>;
  deletingItems: Set<number>; // Track which cart items are being deleted (by cart item ID)
  addingItems: Set<number>; // Track which products are being added (by product ID)
  updatingItems: Set<number>; // Track which products are being updated (by product ID)
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
        console.log("User not authenticated, clearing cart");
        setCartItems([]);
        return;
      }
      
      try {
        const items = await fetchCart();
        setCartItems(items);
      } catch (error) {
        // If there's an auth error, clear the cart
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.log("Auth error while fetching cart, clearing cart");
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
            console.log("Auth error while refreshing cart, clearing cart");
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
        console.log("User not authenticated, clearing cart");
        setCartItems([]);
        return;
      }
      
      try {
        const items = await fetchCart();
        setCartItems(items);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.log("Auth error while refreshing cart, clearing cart");
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
      console.log("Clearing cart on logout");
      setCartItems([]);
    };

    window.addEventListener('userLoggedOut', handleLogout);
    return () => window.removeEventListener('userLoggedOut', handleLogout);
  }, []);

  const setCartItems = (items: CartItem[]) => {
    dispatch({ type: "SET_ITEMS", payload: items });
  };

  const handleCartOnAdd = async (product: Product, quantity = 1) => {
    console.log("=== handleCartOnAdd START ===");
    console.log("Product being added:", product);
    console.log("Quantity:", quantity);
    console.log("Current cart items:", cartItems);
    console.log("Is authenticated:", auth.isAuthenticated);
    
    if (!auth.isAuthenticated) {
      console.log("User not authenticated, cannot add to cart");
      return;
    }
    
    // Prevent multiple clicks using product ID
    if (addingItems.has(product.id)) {
      console.log("Item is already being added, product ID:", product.id);
      return;
    }
    
    console.log("Adding product ID to addingItems set:", product.id);
    // Add item to adding set
    setAddingItems(prev => new Set(prev).add(product.id));
    
    try {
      console.log("Making API call to add item to cart...");
      const response = await axiosInstance.post("/api/cart", {
        productId: product.id,
        quantity,
      }, { withCredentials: true });
      
      console.log("API response:", response.data);

      console.log("Refreshing cart from backend...");
      // Refresh cart from backend to get the correct item structure
      await refreshCart();
      console.log("Cart refreshed successfully");
      
      toast.success("Item added to cart successfully!");
      console.log("=== handleCartOnAdd SUCCESS ===");
    } catch (error: any) {
      console.error("=== handleCartOnAdd ERROR ===");
      console.error("Cart POST error:", error?.response?.data || error.message);
      console.error("Full error object:", error);
      toast.error("Failed to add item to cart. Please try again.");
    } finally {
      console.log("Removing product ID from addingItems set:", product.id);
      // Remove item from adding set
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
      console.log("=== handleCartOnAdd END ===");
    }
  };

  const handleCartItemOnDelete = async (cartItem: CartItem) => {
    console.log("=== handleCartItemOnDelete START ===");
    console.log("Cart item being deleted:", cartItem);
    console.log("Cart item ID:", cartItem.id);
    console.log("Product ID:", cartItem.productId || cartItem.product?.id);
    console.log("Current cart items:", cartItems);
    console.log("Is authenticated:", auth.isAuthenticated);
    
    if (!auth.isAuthenticated) {
      console.log("User not authenticated, cannot delete from cart");
      return;
    }
    
    // Prevent multiple clicks using cart item ID
    if (deletingItems.has(cartItem.id)) {
      console.log("Item is already being deleted, cart item ID:", cartItem.id);
      return;
    }
    
    console.log("Adding cart item ID to deletingItems set:", cartItem.id);
    // Add item to deleting set
    setDeletingItems(prev => new Set(prev).add(cartItem.id));
    
    try {
      console.log("Making API call to delete item from cart...");
      console.log("Sending cartItemId:", cartItem.id);
      
      const response = await axiosInstance.delete("/api/cart", {
        data: { cartItemId: cartItem.id },
        withCredentials: true
      });
      
      console.log("Delete API response:", response.data);

      console.log("Refreshing cart from backend...");
      // Refresh cart from backend to get the correct state
      await refreshCart();
      console.log("Cart refreshed successfully after deletion");
      
      console.log("Item deleted successfully from backend");
      toast.success("Item removed from cart successfully!");
      console.log("=== handleCartItemOnDelete SUCCESS ===");
    } catch (error: any) {
      console.error("=== handleCartItemOnDelete ERROR ===");
      console.error("Delete error:", error?.response?.data || error.message);
      console.error("Full error object:", error);
      console.error("Error response status:", error?.response?.status);
      console.error("Error response headers:", error?.response?.headers);
      
      // Show error toast notification
      toast.error("Failed to remove item from cart. Please try again.");
    } finally {
      console.log("Removing cart item ID from deletingItems set:", cartItem.id);
      // Remove item from deleting set
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItem.id);
        return newSet;
      });
      console.log("=== handleCartItemOnDelete END ===");
    }
  };

  const handleIncreaseQuantity = async (
    product: Product,
    amount: number = 1
  ) => {
    if (!auth.isAuthenticated) {
      console.log("User not authenticated, cannot modify cart");
      return;
    }
    
    // Prevent multiple clicks using product ID
    if (updatingItems.has(product.id)) {
      console.log("Item is already being updated");
      return;
    }
    
    // Add item to updating set
    setUpdatingItems(prev => new Set(prev).add(product.id));
    
    try {
      await axiosInstance.put("/api/cart/increase", {
        productId: product.id,
        quantity: amount,
      }, { withCredentials: true });
      
      // Refresh cart from backend to get the correct state
      await refreshCart();
      console.log("Quantity increased for:", product.name || product.title);
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
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  const handleDecreaseQuantity = async (
    product: Product,
    amount: number = 1
  ) => {
    if (!auth.isAuthenticated) {
      console.log("User not authenticated, cannot modify cart");
      return;
    }
    
    // Prevent multiple clicks using product ID
    if (updatingItems.has(product.id)) {
      console.log("Item is already being updated");
      return;
    }
    
    // Add item to updating set
    setUpdatingItems(prev => new Set(prev).add(product.id));
    
    try {
      await axiosInstance.put("/api/cart/decrease", {
        productId: product.id,
        quantity: amount,
      }, { withCredentials: true });
      
      // Refresh cart from backend to get the correct state
      await refreshCart();
      console.log("Quantity decreased for:", product.name || product.title);
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
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  const refreshCart = async () => {
    console.log("=== refreshCart START ===");
    console.log("Is authenticated:", auth.isAuthenticated);
    
    if (!auth.isAuthenticated) {
      console.log("User not authenticated, clearing cart");
      setCartItems([]);
      return;
    }
    
    try {
      console.log("Fetching cart from backend...");
      const items = await fetchCart();
      console.log("Fetched cart items from backend:", items);
      console.log("Number of items fetched:", items.length);
      
      // Log the structure of each item for debugging
      items.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          id: item.id,
          productId: item.productId || item.product?.id,
          name: item.name,
          quantity: item.quantity,
          allFields: Object.keys(item)
        });
      });
      
      console.log("Setting cart items in state...");
      setCartItems(items);
      console.log("Cart items set successfully");
      console.log("=== refreshCart SUCCESS ===");
    } catch (error) {
      console.error("=== refreshCart ERROR ===");
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log("Auth error while refreshing cart, clearing cart");
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