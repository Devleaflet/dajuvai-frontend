import "../Styles/ProductCard.css";
import star from "../assets/star.png";
import { FaCartPlus } from "react-icons/fa";
import { Product } from "./Types/Product";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { addToWishlist } from "../api/wishlist";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthModal from "./AuthModal";
import defaultProductImage from "../assets/logo.webp";
import { getProductPrimaryImage } from "../utils/getProductPrimaryImage";
import { toast } from "react-hot-toast";
// Removed VariantSelectModal to directly add the displayed variant on cards

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
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
    freeDelivery,
    variants,
    id,
  } = product;

  const displayImage = imageError ? defaultProductImage : getProductPrimaryImage(product, defaultProductImage);

  const handleImageError = () => {
    setImageError(true);
  };

  // Price calculation helpers and variant-aware display price
  const calculatePrice = (basePrice: string | number, discountVal?: string | number, discountType?: string | null): number => {
    const base = typeof basePrice === "string" ? parseFloat(basePrice) : Number(basePrice) || 0;
    if (!discountVal || !discountType) return base;
    const dVal = typeof discountVal === "string" ? parseFloat(discountVal) : Number(discountVal) || 0;
    if (discountType === "PERCENTAGE") return base * (1 - dVal / 100);
    if (discountType === "FIXED" || discountType === "FLAT") return base - dVal;
    return base;
  };

  let currentPrice = 0;
  let originalPriceDisplay: number | undefined = undefined;
  let discountLabel: string | null = null;

  if (variants && variants.length > 0) {
    const v: any = variants[0] || {};
    const variantBase = v?.price ?? v?.originalPrice ?? v?.basePrice ?? product.basePrice ?? price ?? 0;
    const baseNum = typeof variantBase === "string" ? parseFloat(variantBase) : Number(variantBase) || 0;
    const hasCalculated = typeof v?.calculatedPrice === "number" && isFinite(v.calculatedPrice);

    if (hasCalculated) {
      currentPrice = v.calculatedPrice as number;
    } else if (v?.discount && v?.discountType) {
      currentPrice = calculatePrice(baseNum, v.discount, v.discountType);
      originalPriceDisplay = baseNum;
      discountLabel = v.discountType === "PERCENTAGE" ? `${v.discount} %` : `Rs ${v.discount} off`;
    } else if (product.discount && product.discountType) {
      currentPrice = calculatePrice(baseNum, product.discount, product.discountType);
      originalPriceDisplay = baseNum;
      discountLabel = product.discountType === "PERCENTAGE" ? `${product.discount} %` : `Rs ${product.discount} off`;
    } else {
      currentPrice = baseNum;
    }
  } else {
    const baseNum = typeof price === "string" ? parseFloat(price) : Number(price) || 0;
    if (product.discount && product.discountType) {
      currentPrice = calculatePrice(baseNum, product.discount, product.discountType);
      originalPriceDisplay = baseNum;
      discountLabel = product.discountType === "PERCENTAGE" ? `${product.discount} %` : `Rs ${product.discount} off`;
    } else {
      currentPrice = baseNum;
    }
  }

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setWishlistLoading(true);
    try {
      // Card displays the first variant's price/image when variants exist
      // So add that specific variant to wishlist for consistency
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
    <Link to={`/product-page/${product.id}`} className="product-card__link-wrapper">
      <div className="product-card">
        <div className="product-card__header">
          {isBestSeller && <span className="product-card__tag">Best seller</span>}
        </div>
        <div className="product-card__image">
          <button
            className="product-card__wishlist-button"
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
          <img 
            src={displayImage}
            alt={title || "Product image"} 
            onError={handleImageError}
            loading="lazy"
          />
        </div>
        <div className="product-card__rating">
          <div className="product-card__rating-info">
            <span className="product-card__rating-score">{rating}</span>
            <span className="product-card__rating-star">
              <img src={star} alt="Rating" />
            </span>
            <span className="product-card__rating-count">({ratingCount})</span>
          </div>
          <div className="product-card__cart-button">
            <FaCartPlus
              style={{ color: "#ea5f0a", width: "25px" }}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAuthenticated) {
                  setAuthModalOpen(true);
                  return;
                }
                const variantCount = product.variants?.length || 0;
                // Always add the first variant if present, since card displays its price/image
                const variantId = variantCount > 0 ? product.variants![0].id : undefined;
                handleCartOnAdd(product, 1, variantId);
              }}
            />
          </div>
        </div>
        <div className="product-card__pagination">
          <div className="product-card__dots">
            <span className="product-card__dot product-card__dot--active"></span>
            <span className="product-card__dot"></span>
            <span className="product-card__dot"></span>
            <span className="product-card__dot"></span>
            <span className="product-card__dot"></span>
          </div>
        </div>
        <div className="product-card__info">
          <h3 className="product-card__title">{title}</h3>
          <p className="product-card__description">{description}</p>
          <div className="product-card__price">
            <span className="product-card__current-price">Rs {currentPrice.toFixed(2)}</span>
            <div className="product-card__price-details">
              {typeof originalPriceDisplay === "number" && originalPriceDisplay > currentPrice && (
                <span className="product-card__original-price">Rs {originalPriceDisplay.toFixed(2)}</span>
              )}
              {Number(discountLabel)>0 && (
                <span className="product-card__discount">{discountLabel} off</span>
              )}
            </div>
          </div>
         
        </div>
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </Link>
  );
};

export default ProductCard;