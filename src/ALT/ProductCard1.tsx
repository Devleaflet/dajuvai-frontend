import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { FaCartPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { addToWishlist } from "../api/wishlist";
import defaultProductImage from "../assets/logo.webp";
import star from "../assets/star.png";
import AuthModal from "../Components/AuthModal";
import { Product } from "../Components/Types/Product";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { getProductPrimaryImage } from "../utils/getProductPrimaryImage";
import '../ALT/ProductCartd1.css';

interface ProductCardProps {
  product: Product;
}

const Product1: React.FC<ProductCardProps> = ({ product }) => {
  const { handleCartOnAdd } = useCart();
  const { token, isAuthenticated } = useAuth();
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
    id,
  } = product;

  const displayImage = imageError ? defaultProductImage : getProductPrimaryImage(product, defaultProductImage);

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
    displayPriceNum = productPriceNum;
  }

  // Remove .00 if it's a whole number
  const formatPrice = (price: number): string => {
    return price % 1 === 0 ? `Rs. ${price.toFixed(0)}` : `Rs. ${price.toFixed(2)}`;
  };

  const displayPrice = formatPrice(displayPriceNum);

  // Check if original price should be shown (only if there's a discount or original price differs)
  const originalPriceNum = toNumber(originalPrice);
  const showOriginalPrice = originalPrice && discount && discount > 0 && originalPriceNum !== displayPriceNum;
  const formattedOriginalPrice = showOriginalPrice ? formatPrice(originalPriceNum) : '';

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setWishlistLoading(true);
    try {
      const variantCount = product.variants?.length || 0;
      const variantId = variantCount > 0 ? product.variants![0].id : undefined;
      await addToWishlist(id, variantId, token);
      toast.success("Added to wishlist");
    } catch (e: any) {
      const status = e?.response?.status;
      const msg: string = e?.response?.data?.message || e?.response?.data?.error || e?.message || "";
      if (status === 409 || /already/i.test(msg)) {
        toast("Already present in the wishlist");
      } else {
        toast.error("Failed to add to wishlist");
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <Link to={`/product-page/${product.id}`} className="product1__link-wrapper">
      <div className="product1">
        <div className="product1__header">
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
          {isBestSeller && <span className="product1__tag">Best seller</span>}
        </div>
        <div className="product1__image">
          <img
            src={displayImage}
            alt={title || "Product image"}
            onError={handleImageError}
            loading="lazy"
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
        <div className="product1__info">
          <h3 className="product1__title">{title}</h3>
          <p className="product1__description">{description}</p>
          <div className="product1__price">
            {discount && discount > 0 && (
              <span className="product1__discount">{discount}% off</span>
            )}
            <span className="product1__current-price">{displayPrice}</span>
            {showOriginalPrice && (
              <span className="product1__original-price">
                {formattedOriginalPrice}
              </span>
            )}
          </div>
        </div>
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </Link>
  );
};

export default Product1;
