import "../Styles/ProductCard.css";
import star from "../assets/star.png";
import { FaCartPlus } from "react-icons/fa";
import { Product } from "./Types/Product";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { addToWishlist } from "../api/wishlist";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthModal from "./AuthModal";
import defaultProductImage from "../assets/logo.webp";
import { getProductPrimaryImage } from "../utils/getProductPrimaryImage";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../config";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { handleCartOnAdd } = useCart();
  const { token, isAuthenticated } = useAuth();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

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

  // Process image URL helper (same as in getProductPrimaryImage)
  const processImageUrl = (imgUrl: string): string => {
    if (!imgUrl) return "";
    const trimmed = imgUrl.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("/")
    ) {
      return trimmed;
    }
    const base = API_BASE_URL.replace(/\/?api\/?$/, "");
    const needsSlash = !trimmed.startsWith("/");
    const url = `${base}${needsSlash ? "/" : ""}${trimmed}`;
    return url.replace(/([^:]\/)\/+/, "$1/");
  };

  // Get all available images following the same logic as getProductPrimaryImage
  const getProductImages = () => {
    const images = [];
    
    try {
      const variantsArray: any[] = Array.isArray(product?.variants) ? product.variants : [];
      
      // Process variants in order (position first, then id)
      if (variantsArray.length > 0) {
        const orderedVariants = [...variantsArray].sort((a: any, b: any) => {
          const ap = Number(a?.position);
          const bp = Number(b?.position);
          if (Number.isFinite(ap) && Number.isFinite(bp)) return ap - bp;
          const aid = Number(a?.id);
          const bid = Number(b?.id);
          if (Number.isFinite(aid) && Number.isFinite(bid)) return aid - bid;
          return 0;
        });

        orderedVariants.forEach(variant => {
          // Add variant.image
          if (typeof variant?.image === "string" && variant.image.trim()) {
            const url = processImageUrl(variant.image);
            if (url && !images.includes(url)) {
              images.push(url);
            }
          }
          
          // Add variant.images array
          if (Array.isArray(variant?.images)) {
            variant.images.forEach(img => {
              if (typeof img === "string" && img.trim()) {
                const url = processImageUrl(img);
                if (url && !images.includes(url)) {
                  images.push(url);
                }
              }
            });
          }
          
          // Add variant.variantImages array
          if (Array.isArray(variant?.variantImages)) {
            variant.variantImages.forEach(img => {
              if (typeof img === "string" && img.trim()) {
                const url = processImageUrl(img);
                if (url && !images.includes(url)) {
                  images.push(url);
                }
              }
            });
          }
        });
      }

      // Add product.productImages array
      if (Array.isArray(product?.productImages)) {
        product.productImages.forEach(img => {
          if (typeof img === "string" && img.trim()) {
            const url = processImageUrl(img);
            if (url && !images.includes(url)) {
              images.push(url);
            }
          }
        });
      }

      // Add main product.image
      if (typeof product?.image === "string" && product.image.trim()) {
        const url = processImageUrl(product.image);
        if (url && !images.includes(url)) {
          images.push(url);
        }
      }

      // If no images found, use the primary image from utility function
      if (images.length === 0) {
        const primaryImage = getProductPrimaryImage(product, defaultProductImage);
        if (primaryImage && primaryImage !== defaultProductImage) {
          images.push(primaryImage);
        }
      }

    } catch (e) {
      console.warn("Error processing product images:", e);
    }

    // Ensure we have at least one image
    return images.length > 0 ? images : [defaultProductImage];
  };

  const productImages = getProductImages();
  const displayImage = imageError ? defaultProductImage : productImages[currentImageIndex];

  // Auto-rotate images on hover
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isHovering && productImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % productImages.length);
      }, 1500); // Change image every 1.5 seconds
    } else {
      setCurrentImageIndex(0); // Reset to first image when not hovering
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovering, productImages.length]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
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
      discountLabel = v.discountType === "PERCENTAGE" ? `${v.discount}%` : `Rs ${v.discount}`;
    } else if (product.discount && product.discountType) {
      currentPrice = calculatePrice(baseNum, product.discount, product.discountType);
      originalPriceDisplay = baseNum;
      discountLabel = product.discountType === "PERCENTAGE" ? `${product.discount}%` : `Rs ${product.discount}`;
    } else {
      currentPrice = baseNum;
    }
  } else {
    const baseNum = typeof price === "string" ? parseFloat(price) : Number(price) || 0;
    if (product.discount && product.discountType) {
      currentPrice = calculatePrice(baseNum, product.discount, product.discountType);
      originalPriceDisplay = baseNum;
      discountLabel = product.discountType === "PERCENTAGE" ? `${product.discount}%` : `Rs ${product.discount}`;
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
      <div 
        className="product-card"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="product-card__header">
          {isBestSeller && <span className="product-card__tag">Best seller</span>}
        </div>
        
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
          
              <div className="product-card__image">
          <img
            src={displayImage}
            alt={title || "Product image"}
            onError={handleImageError}
            loading="lazy"
          />
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
                  const variantId = variantCount > 0 ? product.variants![0].id : undefined;
                  handleCartOnAdd(product, 1, variantId);
                }}
              />
            </div>
        <div className="product__info">
          <div className="product-card__rating">
            <span className="product-card__rating-star">
                <img src={star} alt="Rating" />
              </span>
            <div className="product-card__rating-info">
              
              <span className="product-card__rating-score">{rating} |</span>
              
              <span className="product-card__rating-count"> Sold {ratingCount}</span>
            </div>
            
          </div>

          {/* Pagination dots - only show if there are multiple images */}
          {productImages.length > 1 && (
            <div className="product-card__pagination">
              <div className="product-card__dots">
                {productImages.slice(0, 5).map((_, index) => (
                  <span
                    key={index}
                    className={`product-card__dot ${
                      index === currentImageIndex ? "product-card__dot--active" : ""
                    }`}
                    onClick={(e) => handleDotClick(index, e)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="product-card__info">
            <h3 className="product-card__title">{title}</h3>
            <p className="product-card__description">{description}</p>
            <div className="product-card__price">
              <span className="product-card__current-price">Rs {currentPrice.toFixed(2)}</span>
              <div className="product-card__price-details">
                {typeof originalPriceDisplay === "number" && originalPriceDisplay > currentPrice && (
                  <span className="product-card__original-price">Rs {originalPriceDisplay.toFixed(2)}</span>
                )}
                {Number(discount)==0 ?null : (
                  <span className="product-card__discount">{discountLabel} off</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </Link>
  );
};

export default ProductCard;