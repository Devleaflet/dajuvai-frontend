import React, { useContext, createContext, useReducer, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { Product } from "../Components/Types/Product";
import iphone from "../assets/iphone.jpg";
import { fetchCart } from "../api/cart";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import axios from "axios";

// Define cart item type
interface CartItem {
  id: number;
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
  | { type: "DELETE_ITEM"; payload: { product: CartItem } }
  | { type: "INC_QUANTITY"; payload: { product: Product; quantity: number } }
  | { type: "DEC_QUANTITY"; payload: { product: Product; quantity: number } };

// Reducer function
const cartReducer = (state: CartItem[], action: ActionType): CartItem[] => {
  switch (action.type) {
    case "SET_ITEMS": {
      return action.payload;
    }

    case "ADD_ITEM": {
      const exists = state.find(
        (item) => item.id === action.payload.product.id
      );
      if (exists) {
        return state.map((item) =>
          item.id === action.payload.product.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      }
      return [
        {
          id: action.payload.product.id,
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
      return state.filter((item) => item.id !== action.payload.product.id);
    }

    case "INC_QUANTITY": {
      console.log('INC_QUANTITY action:', action);
      console.log('State before INC_QUANTITY:', state);
      const newState = state.map((item) =>
        item.id === action.payload.product.id
          ? { ...item, quantity: item.quantity + action.payload.quantity }
          : item
      );
      console.log('State after INC_QUANTITY:', newState);
      return newState;
    }

    case "DEC_QUANTITY": {
      console.log('DEC_QUANTITY action:', action);
      console.log('State before DEC_QUANTITY:', state);
      const newState = state
        .map((item) =>
          item.id === action.payload.product.id
            ? { ...item, quantity: Math.max(0, item.quantity - action.payload.quantity) }
            : item
        )
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
  handleCartItemOnDelete: (product: CartItem) => void;
  handleIncreaseQuantity: (product: Product, quantity?: number) => void;
  handleDecreaseQuantity: (product: Product, quantity?: number) => void;
  setCartItems: (items: CartItem[]) => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
const CartContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, dispatch] = useReducer(cartReducer, []);
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
    if (!auth.isAuthenticated) {
      console.log("User not authenticated, cannot add to cart");
      return;
    }
    
    try {
      await axiosInstance.post("/api/cart", {
        productId: product.id,
        quantity,
      }, { withCredentials: true });

      dispatch({ type: "ADD_ITEM", payload: { product, quantity } });
      console.log("Item Added:", [{ ...product, quantity }]);
    } catch (error: any) {
      console.error("Cart POST error:", error?.response?.data || error.message);
      // Optionally revert the local state if API call fails
    }
  };

  const handleCartItemOnDelete = async (product: CartItem) => {
    if (!auth.isAuthenticated) {
      console.log("User not authenticated, cannot delete from cart");
      return;
    }
    
    try {
      await axiosInstance.delete("/api/cart", {
        data: { cartItemId: product.id },
        withCredentials: true
      });

      dispatch({ type: "DELETE_ITEM", payload: { product } });
      console.log("item deleted");
    } catch (error: any) {
      console.error("Delete error:", error?.response?.data || error.message);
      // Optionally revert the local state if API call fails
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
    // Optimistic update
    dispatch({
      type: "INC_QUANTITY",
      payload: { product, quantity: amount },
    });
    try {
      await axiosInstance.put("/api/cart/increase", {
        productId: product.id,
        quantity: amount,
      }, { withCredentials: true });
      console.log("Quantity increased for:", product.name || product.title);
    } catch (error: any) {
      console.error(
        "Failed to increase quantity:",
        error?.response?.data || error.message
      );
      // Optionally revert the local state if API call fails
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
    // Optimistic update
    dispatch({
      type: "DEC_QUANTITY",
      payload: { product, quantity: amount },
    });
    try {
      await axiosInstance.put("/api/cart/decrease", {
        productId: product.id,
        quantity: amount,
      }, { withCredentials: true });
      console.log("Quantity decreased for:", product.name || product.title);
    } catch (error: any) {
      console.error(
        "Failed to decrease quantity:",
        error?.response?.data || error.message
      );
      // Optionally revert the local state if API call fails
    }
  };

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