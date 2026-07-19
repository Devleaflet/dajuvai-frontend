// ================================
// WISHLIST COMPONENT — TSX FILE
// ================================
import React, { useState, useEffect } from 'react';
import '../Styles/Wishlist.css';
import { FaTrash, FaShoppingCart, FaMinus, FaPlus, FaUser, FaHeart } from 'react-icons/fa';
import Footer from '../Components/Footer';
import Navbar from '../Components/Navbar';
import { Link } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollToTop from '../Components/ScrollToTop';
import AuthModal from '../Components/AuthModal';
import { useAuth } from '../context/AuthContext';
import defaultProductImage from "../assets/logo.webp";
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { moveToCart as moveWishlistItemToCart } from '../api/wishlist';
// ================================
// TYPES & INTERFACES
// ================================
interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  finalPrice?: number | string;
  stock?: number | string;
  productImages?: string[];
  image?: string;
}
interface Variant {
  id: number;
  basePrice?: number | string;
  finalPrice?: number | string;
  discount?: number | string;
  discountType?: 'PERCENTAGE' | 'FLAT' | string;
  stock?: number | string;
  status?: string;
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
  // The wishlist context is the single source of truth for contents; this
  // page no longer keeps its own fetched copy, so removing/adding elsewhere
  // (product card, product page) is reflected here without a refresh.
  const {
    wishlist,
    loading,
    refreshWishlist,
    removeWishlistItem,
    removeWishlistItemsLocally,
  } = useWishlist();
  const wishlistItems = wishlist as WishlistItem[];
  // Per-item "how many to move to cart" selector — not part of the wishlist
  // record itself, so it stays local UI state keyed by wishlist item id.
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { token, isAuthenticated, user } = useAuth();
  const isCustomer = isAuthenticated && user?.role === 'user';
  const { refreshCart } = useCart();
  const getItemQuantity = (id: number) => quantities[id] || 1;
  // ================================
  // HELPER FUNCTIONS
  // ================================
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
      const variantFinal = Number(item.variant.finalPrice);
      if (Number.isFinite(variantFinal) && variantFinal > 0) return variantFinal;

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
    return Number(item.product.finalPrice) || Number(item.product.basePrice) || 0;
  };
  const getItemStock = (item: WishlistItem): number => {
    if (item.variant) {
      return Math.max(0, Number(item.variant.stock) || 0);
    }
    return Math.max(0, Number(item.product.stock) || 0);
  };
  const isItemOutOfStock = (item: WishlistItem): boolean => {
    if (item.variant?.status === 'OUT_OF_STOCK') return true;
    return getItemStock(item) <= 0;
  };
  // ================================
  // API CALLS
  // ================================
  const handleRemoveItem = async (wishlistItemId: number) => {
    try {
      setActionLoading(prev => ({ ...prev, [`remove_${wishlistItemId}`]: true }));
      await removeWishlistItem(wishlistItemId);
      toast.success('Item removed from wishlist!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item';
      toast.error(errorMessage);
      console.error('Error removing item:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`remove_${wishlistItemId}`]: false }));
    }
  };
  const handleMoveToCart = async (
    wishlistItemId: number,
    quantity: number,
    showToast: boolean = true,
    syncAfterMove: boolean = true,
    optimisticItem?: WishlistItem,
  ): Promise<boolean> => {
    const normalizedWishlistItemId = Number(wishlistItemId);
    const normalizedQuantity = Number(quantity);
    const item =
      optimisticItem ||
      wishlistItems.find(
        wishlistItem => Number(wishlistItem.id) === normalizedWishlistItemId
      );

    try {
      if (!isCustomer) {
        throw new Error('Please log in with a customer account to add items to cart');
      }

      if (
        !item ||
        !Number.isInteger(normalizedWishlistItemId) ||
        normalizedWishlistItemId <= 0 ||
        !Number.isInteger(normalizedQuantity) ||
        normalizedQuantity <= 0
      ) {
        throw new Error('Wishlist item is still syncing. Please try again.');
      }

      if (isItemOutOfStock(item)) {
        throw new Error('This item is currently out of stock');
      }

      setActionLoading(prev => ({ ...prev, [`cart_${normalizedWishlistItemId}`]: true }));

      removeWishlistItemsLocally([normalizedWishlistItemId]);
      setQuantities(prev => {
        const next = { ...prev };
        delete next[normalizedWishlistItemId];
        return next;
      });

      await moveWishlistItemToCart(
        normalizedWishlistItemId,
        normalizedQuantity,
        token,
      );

      if (syncAfterMove) {
        await Promise.all([refreshCart(), refreshWishlist()]);
      }
      if (showToast) {
        toast.success('Item moved to cart successfully!');
      }
      return true;
    } catch (err) {
      if (item) {
        await refreshWishlist();
      }
      const errorMessage =
        (err as any)?.response?.data?.message ||
        (err as any)?.response?.data?.error ||
        (err as any)?.response?.data?.errors?.[0]?.message ||
        (err instanceof Error ? err.message : 'Failed to move item to cart');
      if (showToast) toast.error(errorMessage);
      console.error('Error moving to cart:', err);
      return false;
    } finally {
      setActionLoading(prev => ({ ...prev, [`cart_${normalizedWishlistItemId}`]: false }));
    }
  };
  // ================================
  // UI HANDLERS
  // ================================
  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantities(prev => ({ ...prev, [id]: newQuantity }));
  };
  const handleAddAllToCart = async () => {
    try {
      setActionLoading(prev => ({ ...prev, 'add_all': true }));
      const availableItems = wishlistItems.filter(item => !isItemOutOfStock(item));
      if (availableItems.length === 0) {
        toast.error('No wishlist items are currently in stock');
        return;
      }

      removeWishlistItemsLocally(availableItems.map(item => item.id));
      setQuantities(prev => {
        const next = { ...prev };
        availableItems.forEach(item => delete next[item.id]);
        return next;
      });

      const results = await Promise.all(
        availableItems.map((item) =>
          handleMoveToCart(item.id, getItemQuantity(item.id), false, false, item)
        )
      );
      const movedCount = results.filter(Boolean).length;
      const failedCount = results.length - movedCount;

      if (movedCount > 0) {
        await Promise.all([refreshCart(), refreshWishlist()]);
      }

      if (movedCount === 0) {
        await refreshWishlist();
        toast.error('Could not move wishlist items to cart. Please check stock or try again.');
        return;
      }

      toast.success(
        failedCount === 0 && availableItems.length === wishlistItems.length
          ? 'All items moved to cart successfully!'
          : `${movedCount} item${movedCount === 1 ? '' : 's'} moved to cart${failedCount ? `, ${failedCount} failed` : ''}.`
      );
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
    refreshWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const totalPrice = wishlistItems.reduce((sum, item) => {
    const price = getItemPrice(item);
    return sum + price * getItemQuantity(item.id);
  }, 0);
  const hasCartableItems = wishlistItems.some(item => !isItemOutOfStock(item));
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
            ) : !isCustomer ? (
              <div className="wishlist__error" role="alert">
                <div className="wishlist__login-container">
                  <p className="wishlist__login-message">Please log in with a customer account to view and manage your wishlist items</p>
                  <button
                    className="wishlist__login-button"
                    onClick={() => setShowAuthModal(true)}
                    aria-label="Log in to continue"
                  >
                    <FaUser className="wishlist__login-icon" />
                    Log In to Continue
                  </button>
                </div>
              </div>
            ) : wishlistItems.length === 0 ? (
              <EmptyWishlist />
            ) : (
              <>
                <div className="wishlist__items">
                  {wishlistItems.map((item) => {
                    const itemStock = getItemStock(item);
                    const itemOutOfStock = isItemOutOfStock(item);
                    const productLink = `/product-page/${item.productId || item.product.id}`;

                    return (
                    <div key={item.id} className="wishlist__item" data-testid={`wishlist-item-${item.id}`}>
                      <div className="wishlist__item-image">
                        <Link to={productLink} aria-label={`View ${item.product.name}`}>
                          <img 
                            src={getItemImage(item)}
                            alt={item.product.name}
                            onError={e => { e.currentTarget.src = defaultProductImage; }}
                            loading="lazy"
                            className="wishlist__product-image"
                          />
                        </Link>
                      </div>
                      <div className="wishlist__item-details">
                        <h3 className="wishlist__item-name">
                          <Link to={productLink}>{item.product.name}</Link>
                        </h3>
                        {item.variant && (
                          <div className="wishlist__item-variant">
                            Variant: {formatVariantAttributes(item.variant.attributes)}
                          </div>
                        )}
                        <div className={`wishlist__item-stock${itemOutOfStock ? ' wishlist__item-stock--out' : ''}`}>
                          {itemOutOfStock ? 'Out of stock' : `${itemStock} in stock`}
                        </div>
                        <p className="wishlist__item-specs">{item.product.description}</p>
                      </div>
                      <div className="wishlist__item-price">
                        Rs. {getItemPrice(item).toLocaleString('en-IN')}
                      </div>
                      <div className="wishlist__item-quantity">
                        <button 
                          className="wishlist__qty-btn wishlist__qty-btn--touch"
                          onClick={() => handleQuantityChange(item.id, getItemQuantity(item.id) - 1)}
                          aria-label="Decrease quantity"
                          aria-controls={`qty-value-${item.id}`}
                          disabled={actionLoading[`cart_${item.id}`] || actionLoading[`remove_${item.id}`] || itemOutOfStock}
                        >
                          <FaMinus />
                        </button>
                        <span id={`qty-value-${item.id}`} className="wishlist__qty-value" aria-live="polite">{getItemQuantity(item.id)}</span>
                        <button
                          className="wishlist__qty-btn wishlist__qty-btn--touch"
                          onClick={() => handleQuantityChange(item.id, getItemQuantity(item.id) + 1)}
                          aria-label="Increase quantity"
                          aria-controls={`qty-value-${item.id}`}
                          disabled={actionLoading[`cart_${item.id}`] || actionLoading[`remove_${item.id}`] || itemOutOfStock || getItemQuantity(item.id) >= itemStock}
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
                          onClick={() => handleMoveToCart(item.id, getItemQuantity(item.id))}
                          aria-label={itemOutOfStock ? 'Out of stock' : 'Move to cart'}
                          title={itemOutOfStock ? 'Out of stock' : 'Move to cart'}
                          disabled={actionLoading[`cart_${item.id}`] || actionLoading[`remove_${item.id}`] || itemOutOfStock}
                        >
                          {actionLoading[`cart_${item.id}`] ? (
                            <div className="spinner" aria-label="Adding to cart"></div>
                          ) : (
                            <FaShoppingCart />
                          )}
                        </button>
                      </div>
                    </div>
                    );
                  })}
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
                    disabled={actionLoading['add_all'] || wishlistItems.length === 0 || !hasCartableItems}
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
