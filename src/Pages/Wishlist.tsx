import React, { useState, useEffect } from 'react';
import '../Styles/Wishlist.css';
import { FaTrash, FaShoppingCart, FaMinus, FaPlus } from 'react-icons/fa';
import Footer from '../Components/Footer';
import Navbar from '../Components/Navbar';
import { API_BASE_URL } from '../config';
import { Link } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollToTop from '../Components/ScrollToTop';
import AuthModal from '../Components/AuthModal';
import { useAuth } from '../context/AuthContext';
import defaultProductImage from "../assets/logo.webp";
import { useCart } from '../context/CartContext';

// Define types for wishlist items from API
interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  productImages?: string[]; // Added for product images
  image?: string; // Fallback image
}

interface WishlistItem {
  id: number;
  productId: number;
  product: Product;
  quantity?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface WishlistData {
  items: WishlistItem[];
}

// Skeleton component for loading state
const WishlistItemSkeleton: React.FC = () => (
  <div className="wishlist__item wishlist__item--skeleton">
    <div className="wishlist__item-image">
      <div className="skeleton skeleton--image"></div>
    </div>
    
    <div className="wishlist__item-details">
      <div className="skeleton skeleton--title"></div>
      <div className="skeleton skeleton--text"></div>
      <div className="skeleton skeleton--text skeleton--text-small"></div>
    </div>
    
    <div className="wishlist__item-price">
      <div className="skeleton skeleton--price"></div>
    </div>
    
    <div className="wishlist__item-quantity">
      <div className="skeleton skeleton--quantity"></div>
    </div>
    
    <div className="wishlist__item-actions">
      <div className="skeleton skeleton--button"></div>
      <div className="skeleton skeleton--button"></div>
    </div>
  </div>
);

const Wishlist: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { refreshCart } = useCart();

  // API headers with authentication
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          setShowAuthModal(true);
          throw new Error('Please log in to view your wishlist');
        }
        if (response.status === 404) {
          throw new Error('Wishlist not found');
        }
        throw new Error(`Failed to fetch wishlist: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned unexpected response format');
      }

      const data: ApiResponse<WishlistData> = await response.json();

      if (data.success) {
        const itemsWithQuantity = data.data.items.map(item => ({
          ...item,
          quantity: 1
        }));
        setWishlistItems(itemsWithQuantity);
      } else {
        throw new Error(data.message || 'Failed to load wishlist');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  // Remove item from wishlist
  const handleRemoveItem = async (wishlistItemId: number) => {
    try {
      setActionLoading(prev => ({ ...prev, [`remove_${wishlistItemId}`]: true }));
      
      const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ wishlistItemId }),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to remove items');
        }
        if (response.status === 404) {
          throw new Error('Item not found in wishlist');
        }
        throw new Error('Failed to remove item');
      }

      const data: ApiResponse<unknown> = await response.json();
      
      if (data.success) {
        setWishlistItems(prev => prev.filter(item => item.id !== wishlistItemId));
        toast.success('Item removed from wishlist!');
      } else {
        throw new Error('Failed to remove item');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error removing item:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`remove_${wishlistItemId}`]: false }));
    }
  };

  // Move item to cart
  const handleMoveToCart = async (wishlistItemId: number, quantity: number, showToast: boolean = true) => {
    try {
      setActionLoading(prev => ({ ...prev, [`cart_${wishlistItemId}`]: true }));
      
      const response = await fetch(`${API_BASE_URL}/api/wishlist/move-to-cart`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ wishlistItemId, quantity }),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to add items to cart');
        }
        if (response.status === 404) {
          throw new Error('Item not found in wishlist');
        }
        throw new Error('Failed to move item to cart');
      }

      const data: ApiResponse<unknown> = await response.json();
      
      if (data.success) {
        setWishlistItems(prev => prev.filter(item => item.id !== wishlistItemId));
        await refreshCart(); // Refresh cart after moving item
        if (showToast) {
          toast.success('Item moved to cart successfully!');
        }
      } else {
        throw new Error('Failed to move item to cart');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move item to cart';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error moving to cart:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`cart_${wishlistItemId}`]: false }));
    }
  };

  // Handle quantity change (local state only)
  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setWishlistItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Handle adding all items to cart
  const handleAddAllToCart = async () => {
    try {
      setActionLoading(prev => ({ ...prev, 'add_all': true }));
      // Sequentially move each item to cart to ensure cookies are sent and state is updated
      for (const item of wishlistItems) {
        // eslint-disable-next-line no-await-in-loop
        await handleMoveToCart(item.id, item.quantity || 1, false);
      }
      await refreshCart(); // Refresh cart after moving all items
      toast.success('All items moved to cart successfully!');
      await fetchWishlist();
    } catch (err) {
      console.error('Error adding all to cart:', err);
      toast.error('Failed to move all items to cart');
    } finally {
      setActionLoading(prev => ({ ...prev, 'add_all': false }));
    }
  };

  // Load wishlist on component mount
  useEffect(() => {
    fetchWishlist();
  }, []);

  // Calculate total price of all items
  const totalPrice = wishlistItems.reduce((sum, item) => 
    sum + (item.product.basePrice * (item.quantity || 1)), 0
  );

  // Handle retry
  const handleRetry = () => {
    fetchWishlist();
  };

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <div className="wishlist">
        <div className="wishlist__container">
          <h1 className="wishlist__title">My Wishlist</h1>
          
          {loading ? (
            <div className="wishlist__items">
              {[...Array(3)].map((_, index) => (
                <WishlistItemSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="wishlist__error">
              <p>{error}</p>
              {error.includes('Please log in') ? (
                <button 
                  className="wishlist__retry-button"
                  onClick={() => setShowAuthModal(true)}
                >
                  Log In
                </button>
              ) : (
                <button 
                  className="wishlist__retry-button"
                  onClick={handleRetry}
                >
                  Try Again
                </button>
              )}
            </div>
          ) : wishlistItems.length === 0 ? (
            /* Empty State */
            <div className="wishlist__empty">
              <p>Your wishlist is empty</p>
              <Link to="/shop" className="wishlist__shop-button">Shop Now</Link>
            </div>
          ) : (
            /* Wishlist Items */
            <>
              <div className="wishlist__items">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="wishlist__item">
                    <div className="wishlist__item-image">
                      <img 
                        src={item.product.productImages?.[0] || item.product.image || defaultProductImage}
                        alt={item.product.name}
                        onError={e => { e.currentTarget.src = defaultProductImage; }}
                        style={{ objectFit: 'cover', width: 80, height: 80, borderRadius: 8, border: '1px solid #eee' }}
                      />
                    </div>
                    
                    <div className="wishlist__item-details">
                      <h3 className="wishlist__item-name">{item.product.name}</h3>
                      <p className="wishlist__item-specs">{item.product.description}</p>
                    </div>
                    
                    <div className="wishlist__item-price">
                      Rs. {item.product.basePrice.toLocaleString('en-IN')}
                    </div>
                    
                    <div className="wishlist__item-quantity">
                      <button 
                        className="wishlist__qty-btn"
                        onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                        aria-label="Decrease quantity"
                        disabled={actionLoading[`cart_${item.id}`] || actionLoading[`remove_${item.id}`]}
                      >
                        <FaMinus />
                      </button>
                      <span className="wishlist__qty-value">{item.quantity || 1}</span>
                      <button 
                        className="wishlist__qty-btn"
                        onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                        aria-label="Increase quantity"
                        disabled={actionLoading[`cart_${item.id}`] || actionLoading[`remove_${item.id}`]}
                      >
                        <FaPlus />
                      </button>
                    </div>
                    
                    <div className="wishlist__item-actions">
                      <button 
                        className="wishlist__action-btn wishlist__action-btn--delete"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label="Remove from wishlist"
                        disabled={actionLoading[`remove_${item.id}`] || actionLoading[`cart_${item.id}`]}
                      >
                        {actionLoading[`remove_${item.id}`] ? (
                          <div className="spinner"></div>
                        ) : (
                          <FaTrash />
                        )}
                      </button>
                      
                      <button 
                        className="wishlist__action-btn wishlist__action-btn--cart"
                        onClick={() => handleMoveToCart(item.id, item.quantity || 1)}
                        aria-label="Move to cart"
                        disabled={actionLoading[`cart_${item.id}`] || actionLoading[`remove_${item.id}`]}
                      >
                        {actionLoading[`cart_${item.id}`] ? (
                          <div className="spinner"></div>
                        ) : (
                          <FaShoppingCart />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="wishlist__footer">
                <div className="wishlist__summary">
                  <div className="wishlist__total">
                    <span className="wishlist__total-label">Total:</span>
                    <span className="wishlist__total-value">Rs. {totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                
                <button 
                  className="wishlist__add-all-btn"
                  onClick={handleAddAllToCart}
                  disabled={actionLoading['add_all'] || wishlistItems.length === 0}
                >
                  {actionLoading['add_all'] ? (
                    <>
                      <div className="spinner"></div>
                      ADDING TO CART...
                    </>
                  ) : (
                    'ADD ALL TO CART'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Footer />
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default Wishlist;