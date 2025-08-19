import './ProductCartd1.css'
import star from "../assets/star.png";
import { FaCartPlus } from "react-icons/fa";
import { Product } from "../Components/Types/Product";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { addToWishlist } from "../api/wishlist";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthModal from "../Components/AuthModal";
import defaultProductImage from "../assets/logo.webp";
// Removed VariantSelectModal: add first variant directly to match thumbnail price

interface ProductCardProps {
  product: Product;
}

const Product1: React.FC<ProductCardProps> = ({ product }) => {
  const { handleCartOnAdd } = useCart();
  const { token, isAuthenticated } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    title,
    description,
    price,
    originalPrice,
    discount,
    rating,
    ratingCount,
    isBestSeller,
    freeDelivery,
    image,
    productImages = [],
    id,
  } = product;

  // Helper function to get the first available image from variants or fall back to product images
  const getProductImage = () => {
    // Check if there are variants with images
    if (product.variants?.length > 0) {
      // Find the first variant with an image
      const variantWithImage = product.variants.find(v => v.image || (v.images && v.images.length > 0));
      if (variantWithImage) {
        // Return the variant's image or the first image from variant's images array
        return variantWithImage.image || variantWithImage.images?.[0];
      }
    }
    // Fall back to product images or default image
    return productImages?.[0] || image || defaultProductImage;
  };

  const displayImage = getProductImage();

  const handleImageError = () => {
    setImageError(true);
  };

  // Compute display price: if product price is null/0, fall back to first variant's price
  const toNumber = (v: any): number => {
    if (v === undefined || v === null) return 0;
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return isFinite(n) ? n : 0;
  };

  const calculatePrice = (base: any, disc?: any, discType?: string): number => {
    const baseNum = toNumber(base);
    if (!disc || !discType) return baseNum;
    const d = typeof disc === 'string' ? parseFloat(disc) : Number(disc);
    if (!isFinite(d)) return baseNum;
    if (discType === 'PERCENTAGE') return baseNum * (1 - d / 100);
    if (discType === 'FIXED' || discType === 'FLAT') return baseNum - d;
    return baseNum;
  };

  let displayPriceNum = 0;
  const productPriceNum = toNumber(price as any);
  if ((price === null || price === undefined || productPriceNum === 0) && (product.variants?.length || 0) > 0) {
    const first = product.variants![0] as any;
    const variantBase = first?.price ?? first?.originalPrice ?? first?.basePrice ?? product.basePrice ?? product.price;
    if (typeof first?.calculatedPrice === 'number' && isFinite(first.calculatedPrice)) {
      displayPriceNum = first.calculatedPrice as number;
    } else if (first?.discount && first?.discountType) {
      displayPriceNum = calculatePrice(variantBase, first.discount, String(first.discountType));
    } else if (product.discount && product.discountType) {
      displayPriceNum = calculatePrice(variantBase, product.discount as any, String(product.discountType));
    } else {
      displayPriceNum = toNumber(variantBase);
    }
  } else {
    // product price already includes discount mapping from Shop.tsx when applicable
    displayPriceNum = productPriceNum;
  }
  const displayPrice = `Rs. ${displayPriceNum.toFixed(2)}`;

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setWishlistLoading(true);
    try {
      // If there's exactly one variant, pass its id; otherwise leave undefined
      const variantId = product.variants?.length === 1 ? product.variants[0].id : undefined;
      await addToWishlist(id, variantId, token);
      setToast("Added to wishlist!");
    } catch (e) {
      setToast("Failed to add to wishlist");
    } finally {
      setWishlistLoading(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <Link to={`/product-page/${product.category?.id || 1}/${product.subcategory?.id || 1}/${product.id}`} className="product1__link-wrapper">
      <div className="product1">
        <div className="product1__header">
          {isBestSeller && <span className="product1__tag">Best seller</span>}
          <button
            className="product1__wishlist-button"
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWishlist();
            }}
            disabled={wishlistLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div className="product1__image">
          <img 
            src={displayImage}
            alt={title || "Product image"}
            onError={handleImageError}
            loading="lazy"
            style={{ 
              width: '100%', 
              height: '200px',
              objectFit: 'contain',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}
          />
        </div>
        <div className="product1__rating">
          <div className="product1__rating-info">
            <span className="product1__rating-score">{rating}</span>
            <span className="product1__rating-star">
              <img src={star} alt="Rating" />
            </span>
            <span className="product1__rating-count">({ratingCount})</span>
          </div>
          <div className="product1__cart-button">
            <FaCartPlus
              style={{ color: "#ea5f0a", width: "25px" }}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                if (!token) {
                  setAuthModalOpen(true);
                  return;
                }
                const variantCount = product.variants?.length || 0;
                const variantId = variantCount > 0 ? product.variants![0].id : undefined;
                handleCartOnAdd(product, 1, variantId);
              }}
            />
          </div>
        </div>
        <div className="product1__pagination">
          <div className="product1__dots">
            <span className="product1__dot product1__dot--active"></span>
            <span className="product1__dot"></span>
            <span className="product1__dot"></span>
            <span className="product1__dot"></span>
            <span className="product1__dot"></span>
          </div>
        </div>
        <div className="product1__info">
          <h3 className="product1__title">{title}</h3>
          <p className="product1__description">{description}</p>
          <div className="product1__price">
            <span className="product1__current-price">{displayPrice}</span>
            <div className="product1__price-details">
              {originalPrice && (
                <span className="product1__original-price">
                  {originalPrice}
                </span>
              )}
              {discount && (
                <span className="product1__discount">{discount}%</span>
              )}
            </div>
          </div>
          <div className="product1__delivery">
            {freeDelivery && (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                <span>Free Delivery</span>
              </>
            )}
          </div>
        </div>
        {toast && (
          <div className="product1__toast">{toast}</div>
        )}
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </Link>
  );
};

export default Product1;