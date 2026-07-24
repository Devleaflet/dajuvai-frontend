import "../Styles/ProductCarousel.css";
import "../Styles/ProductCard.css";
import star from "../assets/star.png";
import { FaCartPlus } from "react-icons/fa";
import { Product } from "./Types/Product";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { makeWishlistKey, useWishlist } from "../context/WishlistContext";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import defaultProductImage from "../assets/logo.webp";
import { getProductPrimaryImage } from "../utils/getProductPrimaryImage";
import { getDiscountDisplay } from "../utils/priceDisplay";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../config";
interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { handleCartOnAdd } = useCart();
  const { isAuthenticated } = useAuth();
  const {
    isWishlisted: hasWishlistItem,
    getWishlistItem,
    addWishlistItem,
    removeWishlistItem,
    pendingKeys,
  } = useWishlist();
  const { cartOpen } = useUI();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const navigate = useNavigate();
  const { title, description, rating, ratingCount, id } = product;

  // Gate on hasVariants, not just array presence — a product just converted
  // to non-variant can still have orphaned variant rows in the DB (kept
  // around only because they have real order history), and some read paths
  // don't strip them. The flag is the single source of truth for "is this
  // a variant product" everywhere in the app.
  const variantsArr = product.hasVariants
    ? [...(product.variants || [])].sort(
        (a, b) => (Number(a?.id) || 0) - (Number(b?.id) || 0),
      )
    : [];
  const inStockVariants = variantsArr.filter(
    (v) => Number(v.stock || 0) > 0 && v.status !== "OUT_OF_STOCK",
  );
  const defaultVariant = inStockVariants[0] || variantsArr[0] || null;
  const variantId = defaultVariant?.id;

  // Single source of truth: WishlistContext, so every card/page reflects the
  // same state instantly instead of each component tracking its own copy.
  const isWishlisted = hasWishlistItem(id, variantId);
  const wishlistPending = pendingKeys.has(makeWishlistKey(id, variantId));

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

  // All variant images, so the hover auto-slider previews every variant —
  // ordered with the default (first in-stock) variant's photos leading, to
  // stay consistent with the price/discount shown (also from that variant).
  const getProductImages = () => {
    const images = [];

    try {
      // variantsArr is already id-sorted; just float the default variant
      // to the front so its photo leads (matching the price/discount shown).
      if (variantsArr.length > 0) {
        const rest = variantsArr.filter((v: any) => v.id !== defaultVariant?.id);
        const orderedVariants = defaultVariant
          ? [defaultVariant, ...rest]
          : rest;

        orderedVariants.forEach((variant) => {
          // Add variant.image
          if (typeof variant?.image === "string" && variant.image.trim()) {
            const url = processImageUrl(variant.image);
            if (url && !images.includes(url)) {
              images.push(url);
            }
          }

          // Add variant.images array
          if (Array.isArray(variant?.images)) {
            variant.images.forEach((img) => {
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
            variant.variantImages.forEach((img) => {
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
        product.productImages.forEach((img) => {
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
        const primaryImage = getProductPrimaryImage(
          product,
          defaultProductImage,
        );
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
  const displayImage = imageErrors.has(currentImageIndex)
    ? defaultProductImage
    : productImages[currentImageIndex];

  // Auto-rotate images on hover
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isHovering && productImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
      }, 1500); // Change image every 1.5 seconds
    } else {
      setCurrentImageIndex(0); // Reset to first image when not hovering
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovering, productImages.length]);

  const handleImageError = () => {
    setImageErrors((prev) => new Set(prev).add(currentImageIndex));
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (wishlistPending) return;

    try {
      if (isWishlisted) {
        const item = getWishlistItem(id, variantId);
        if (item?.id) {
          await removeWishlistItem(item.id);
          toast.success("Removed from wishlist");
        }
      } else {
        const addedItem = await addWishlistItem(id, variantId);
        if (addedItem !== null) {
          toast.success("Added to wishlist");
        }
      }
    } catch (e: any) {
      const status = e?.response?.status;
      const msg: string =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "";

      if (status === 409 || /already/i.test(msg)) {
        toast("Already present in the wishlist");
      } else {
        toast.error(
          isWishlisted
            ? "Failed to remove from wishlist"
            : "Failed to add to wishlist",
        );
        console.error("Wishlist operation failed:", e);
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (
      target.closest(".product-card__wishlist-button") ||
      target.closest(".product-card__cart-button") ||
      target.closest(".product-card__dot")
    ) {
      return;
    }

    // Navigate first
    navigate(`/product-page/${product.id}`);

    // Then FORCE scroll to top on next tick (beats React Router restoration)
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);

    // Extra insurance: also after a tiny delay
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  };

  // Price/discount always mirror the default (first in-stock) variant, so
  // they stay consistent with the image and stock state shown on the card.
  const getDisplayPrices = () => {
    if (product.hasVariants && defaultVariant) {
      const base = Number(defaultVariant.basePrice) || 0;
      const final = Number(defaultVariant.finalPrice) || base;
      return {
        base,
        final,
        // A vendor sets discount per-variant, not on the product itself
        // (the product-level discount fields are only used for
        // non-variant products), so the badge must read the *variant's*
        // discount here — falling back to product.discount only if the
        // variant genuinely doesn't specify one.
        discount:
          defaultVariant.discount !== undefined
            ? defaultVariant.discount
            : product.discount,
        discountType:
          defaultVariant.discountType !== undefined
            ? defaultVariant.discountType
            : product.discountType,
      };
    }

    return {
      base: Number(product.basePrice) || 0,
      final: Number(product.finalPrice) || Number(product.basePrice) || 0,
      discount: product.discount,
      discountType: product.discountType,
    };
  };

  const {
    base: basePriceNum,
    final: finalPriceNum,
    discount: displayDiscount,
    discountType: displayDiscountType,
  } = getDisplayPrices();

  // Same shared utility used on product details/cart/checkout, so the
  // badge/savings shown here never disagrees with those pages.
  const discountDisplay = getDiscountDisplay({
    basePrice: basePriceNum,
    finalPrice: finalPriceNum,
    discount: displayDiscount,
    discountType: displayDiscountType,
  });
  const hasDiscount = discountDisplay.hasDiscount;
  const discountLabel = discountDisplay.savingsLabel;

  // Stock state — variant-level stock is authoritative when the product has
  // variants (matches backend: a product is only out of stock when every
  // variant is out of stock).
  const isOutOfStock = product.hasVariants
    ? inStockVariants.length === 0
    : (product as any).status === "OUT_OF_STOCK" ||
      Number((product as any).stock || (product as any).piece || 0) <= 0;

  return (
    <div onClick={handleCardClick} className="product-card__link-wrapper">
      <div
        className="product-card"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="product-card__media">
          <div className="product-card__image">
            <img
              src={displayImage}
              alt={title || "Product image"}
              onError={handleImageError}
              loading="lazy"
            />

            {productImages.length > 1 && (
              <div className="product-card__pagination product-card__pagination--inside">
                <div className="product-card__dots">
                  {productImages.slice(0, 5).map((_, index) => (
                    <span
                      key={index}
                      className={`product-card__dot ${
                        index === currentImageIndex
                          ? "product-card__dot--active"
                          : ""
                      }`}
                      onClick={(e) => handleDotClick(index, e)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {discountDisplay.badgeLabel && (
            <span className="product-card__discount-badge">
              {discountDisplay.badgeLabel}
            </span>
          )}

          {!cartOpen && (
            <button
              className="product-card__wishlist-button"
              aria-label={
                isWishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleWishlist();
              }}
              disabled={wishlistPending}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isWishlisted ? "red" : "none"}
                stroke={isWishlisted ? "red" : "currentColor"}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          )}

          {!cartOpen && (
            <button
              type="button"
              className="product-card__cart-button"
              disabled={isOutOfStock}
              aria-label={isOutOfStock ? "Out of stock" : "Add to cart"}
              title={isOutOfStock ? "Out of stock" : "Add to cart"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isOutOfStock) return;
                if (!isAuthenticated) {
                  setAuthModalOpen(true);
                  return;
                }
                handleCartOnAdd(product, 1, variantId);
              }}
            >
              <FaCartPlus style={{ color: "#fff", width: "16px", height: "16px" }} />
            </button>
          )}
        </div>

        <div className="product-card__info">
          <div className="product-card__title-row">
            <h3 className="product-card__title" title={title}>
              {title}
            </h3>
            {isOutOfStock && (
              <span
                className="product-card__stock-badge product-card__stock-badge--out"
              >
                Out of stock
              </span>
            )}
          </div>

          <p className="product-card__description">{description}</p>

          <div className="product-card__rating">
            <span className="product-card__rating-star">
              <img src={star} alt="Rating" />
            </span>
            <div className="product-card__rating-info">
              <span className="product-card__rating-score">{rating} |</span>
              <span className="product-card__rating-count">
                {" "}
                ({ratingCount})
              </span>
            </div>
          </div>

          <div className="product-card__price">
            <span className="product-card__current-price">
              Rs {finalPriceNum?.toFixed(2)}
            </span>

            {hasDiscount && (
              <div className="product-card__price-details">
                <span className="product-card__original-price">
                  Rs {basePriceNum?.toFixed(2)}
                </span>

                {discountLabel && (
                  <span className="product-card__discount">
                    {discountLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <AuthModal
        isOpen={authModalOpen}
        onClose={(e?: React.MouseEvent) => {
          e?.stopPropagation();
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
};

export default ProductCard;
