// ================================
// WISHLIST COMPONENT — TSX FILE
// ================================
import React, { useState, useEffect } from 'react';
import '../Styles/Wishlist.css';
import { FaTrash, FaShoppingCart, FaMinus, FaPlus, FaUser, FaHeart } from 'react-icons/fa';
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

// ================================
// TYPES & INTERFACES
// ================================
interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  productImages?: string[];
  image?: string;
}

interface Variant {
  id: number;
  basePrice?: number | string;
  discount?: number | string;
  discountType?: 'PERCENTAGE' | 'FLAT' | string;
  attributes?: Record<string, any> | Array<any>;
  variantImages?: Array<any>;
}

interface WishlistItem {
  id: number;
  productId: number;
  product: Product;
  variantId?: number;
  variant?: Variant;
  quantity?: number;
}

interface WishlistData {
  items: WishlistItem[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ================================
// SKELETON LOADER COMPONENT
// ================================
const WishlistItemSkeleton: React.FC = () => (
  <div className="wishlist__item wishlist__item--skeleton" aria-hidden="true">
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

// ================================
// EMPTY WISHLIST COMPONENT
// ================================
const EmptyWishlist: React.FC = () => {
  return (
    <div className="wishlist__empty" aria-label="Empty wishlist">
      <div className="wishlist__empty-container">
        <div className="wishlist__empty-illustration">
          <div className="wishlist__empty-heart">
            <FaHeart />
          </div>
          <div className="wishlist__empty-stars">
            <div className="wishlist__empty-star"></div>
            <div className="wishlist__empty-star"></div>
            <div className="wishlist__empty-star"></div>
          </div>
        </div>
        <div className="wishlist__empty-content">
          <h2 className="wishlist__empty-title">Your Wishlist is Empty</h2>
          <p className="wishlist__empty-subtitle">Looks like you haven't added any items to your wishlist yet.</p>
        </div>
        <div className="wishlist__empty-actions">
          <Link to="/shop" className="wishlist__shop-button wishlist__shop-button--primary">
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

// ================================
// MAIN WISHLIST COMPONENT
// ================================
const Wishlist: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { refreshCart } = useCart();

  // ================================
  // HELPER FUNCTIONS
  // ================================
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  const toFullUrl = (imgUrl: string): string => {
    if (!imgUrl) return '';
    return imgUrl.startsWith('http')
      ? imgUrl
      : `${window.location.origin}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
  };

  const parseImageEntry = (img: any): string => {
    try {
      if (!img) return '';
      if (typeof img === 'string') {
        try {
          const parsed = JSON.parse(img);
          const url = parsed?.url || parsed?.imageUrl || img;
          return toFullUrl(url);
        } catch {
          return toFullUrl(img);
        }
      }
      if (typeof img === 'object') {
        const url = img.url || img.imageUrl || '';
        return toFullUrl(url);
      }
      return '';
    } catch {
      return '';
    }
  };

  const getItemImage = (item: WishlistItem): string => {
    const vImgs = (item.variant?.variantImages || []) as any[];
    if (vImgs.length > 0) {
      const first = parseImageEntry(vImgs[0]);
      if (first) return first;
    }
    const pImgs = item.product.productImages || [];
    if (pImgs.length > 0) {
      const first = parseImageEntry(pImgs[0]);
      if (first) return first;
    }
    return item.product.image || defaultProductImage;
  };

  const formatVariantAttributes = (attributes: any): string => {
    if (!attributes) return '';
    if (Array.isArray(attributes)) {
      return attributes
        .map((attr: any) => {
          const label = String(attr?.type ?? attr?.attributeType ?? '');
          const vals = Array.isArray(attr?.values)
            ? attr.values.map((v: any) => String(v?.value ?? v)).filter(Boolean)
            : Array.isArray(attr?.attributeValues)
              ? attr.attributeValues.map((v: any) => String(v?.value ?? v)).filter(Boolean)
              : [];
          return label && vals.length ? `${label}: ${vals.join(', ')}` : '';
        })
        .filter(Boolean)
        .join(', ');
    }
    if (typeof attributes === 'object') {
      return Object.entries(attributes)
        .map(([key, value]) => {
          if (value == null) return '';
          if (Array.isArray(value)) {
            const vals = value.map((v: any) => String(v?.value ?? v)).filter(Boolean);
            return `${key}: ${vals.join(', ')}`;
          }
          if (typeof value === 'object') {
            const val = (value as any).value ?? (value as any).name ?? '';
            return val ? `${key}: ${String(val)}` : `${key}: ${JSON.stringify(value)}`;
          }
          return `${key}: ${String(value)}`;
        })
        .filter(Boolean)
        .join(', ');
    }
    return String(attributes);
  };

  const getItemPrice = (item: WishlistItem): number => {
    if (item.variant) {
      const base = Number(item.variant.basePrice) || 0;
      const disc = Number(item.variant.discount) || 0;
      if (item.variant.discountType === 'PERCENTAGE') {
        return Math.max(0, base - base * (disc / 100));
      }
      if (item.variant.discountType === 'FLAT') {
        return Math.max(0, base - disc);
      }
      return base;
    }
    return Number(item.product.basePrice) || 0;
  };

  // ================================
  // API CALLS
  // ================================
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
        await refreshCart();
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

  // ================================
  // UI HANDLERS
  // ================================
  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setWishlistItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleAddAllToCart = async () => {
    try {
      setActionLoading(prev => ({ ...prev, 'add_all': true }));
      for (const item of wishlistItems) {
        await handleMoveToCart(item.id, item.quantity || 1, false);
      }
      await refreshCart();
      toast.success('All items moved to cart successfully!');
      await fetchWishlist();
    } catch (err) {
      console.error('Error adding all to cart:', err);
      toast.error('Failed to move all items to cart');
    } finally {
      setActionLoading(prev => ({ ...prev, 'add_all': false }));
    }
  };

  // ================================
  // LIFECYCLE & CALCULATIONS
  // ================================
  useEffect(() => {
    fetchWishlist();
  }, []);

  const totalPrice = wishlistItems.reduce((sum, item) => {
    const price = getItemPrice(item);
    return sum + price * (item.quantity || 1);
  }, 0);

  const handleRetry = () => {
    fetchWishlist();
  };

  // ================================
  // RENDER
  // ================================
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="wishlist__main-content">
        <div className="wishlist" role="main">
          <div className="wishlist__container">
            <h1 className="wishlist__title">My Wishlist</h1>
            {loading ? (
              <div className="wishlist__items" aria-busy="true">
                {[...Array(3)].map((_, index) => (
                  <WishlistItemSkeleton key={index} />
                ))}
              </div>
            ) : error ? (
              <div className="wishlist__error" role="alert">
                {error.includes('Please log in') ? (
                  <div className="wishlist__login-container">
                    <p className="wishlist__login-message">Please log in to view and manage your wishlist items</p>
                    <button 
                      className="wishlist__login-button"
                      onClick={() => setShowAuthModal(true)}
                      aria-label="Log in to continue"
                    >
                      <FaUser className="wishlist__login-icon" />
                      Log In to Continue
                    </button>
                  </div>
                ) : (
                  <button 
                    className="wishlist__retry-button"
                    onClick={handleRetry}
                    aria-label="Retry loading wishlist"
                  >
                    Try Again
                  </button>
                )}
              </div>
            ) : wishlistItems.length === 0 ? (
              <EmptyWishlist />
            ) : (
              <>
                <div className="wishlist__items">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="wishlist__item" data-testid={`wishlist-item-${item.id}`}>
                      <div className="wishlist__item-image">
                        <img 
                          src={getItemImage(item)}
                          alt={item.product.name}
                          onError={e => { e.currentTarget.src = defaultProductImage; }}
                          loading="lazy"
                          className="wishlist__product-image"
                        />
                      </div>
                      <div className="wishlist__item-details">
                        <h3 className="wishlist__item-name">{item.product.name}</h3>
                        {item.variant && (
                          <div className="wishlist__item-variant">
                            Variant: {formatVariantAttributes(item.variant.attributes)}
                          </div>
                        )}
                        <p className="wishlist__item-specs">{item.product.description}</p>
                      </div>
                      <div className="wishlist__item-price">
                        Rs. {getItemPrice(item).toLocaleString('en-IN')}
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
                        <span className="wishlist__qty-value" aria-live="polite">{item.quantity || 1}</span>
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
                            <div className="spinner" aria-label="Removing item"></div>
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
                            <div className="spinner" aria-label="Adding to cart"></div>
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
                    aria-label="Add all items to cart"
                  >
                    {actionLoading['add_all'] ? (
                      <>
                        <div className="spinner" aria-label="Processing"></div>
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
      </main>
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


