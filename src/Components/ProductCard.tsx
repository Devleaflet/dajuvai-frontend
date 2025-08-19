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

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
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
    productImages,
    variants,
    id,
  } = product;

  // Enhanced image handling with debugging
  const getDisplayImage = () => {
    console.log('Product data:', { 
      id: product.id, 
      title: product.title,
      hasVariants: !!variants?.length,
      variantImages: variants?.map(v => ({
        hasImage: !!v.image,
        hasImages: v.images?.length > 0,
        image: v.image,
        images: v.images
      })),
      mainImage: image,
      productImages: productImages
    });

    // Check if there are variants with images
    if (variants?.length > 0) {
      // Find first variant with an image
      const variantWithImage = variants.find(v => v.image || v.images?.length > 0);
      
      if (variantWithImage) {
        const variantImage = variantWithImage.image || variantWithImage.images?.[0];
        console.log('Using variant image:', variantImage);
        return variantImage;
      }
    }
    
    // Fall back to product images or default
    const fallbackImage = productImages?.[0] || image || defaultProductImage;
    console.log('Using fallback image:', fallbackImage);
    return imageError ? defaultProductImage : fallbackImage;
  };

  const displayImage = getDisplayImage();
  console.log('Final display image:', displayImage);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleWishlist = async () => {
    if (!token) {
      setToast("Please log in to add to wishlist");
      setTimeout(() => setToast(null), 2000);
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
    <Link to={`/product-page/${product.category?.id || 1}/${product.subcategory?.id || 1}/${product.id}`} className="product-card__link-wrapper">
      <div className="product-card">
        <div className="product-card__header">
          {isBestSeller && <span className="product-card__tag">Best seller</span>}
          <button
            className="product-card__wishlist-button"
            aria-label="Add to wishlist"
            onClick={handleWishlist}
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
        <div className="product-card__image">
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
                // If there's exactly one variant, pass its id; otherwise leave undefined
                const variantId = product.variants?.length === 1 ? product.variants[0].id : undefined;
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
            <span className="product-card__current-price">Rs {price}</span>
            <div className="product-card__price-details">
              {originalPrice && (
                <span className="product-card__original-price">
                  Rs {originalPrice}
                </span>
              )}
              {discount && (
                <span className="product-card__discount">{discount} % </span>
              )}
            </div>
          </div>
          <div className="product-card__delivery">
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
          <div className="product-card__toast">{toast}</div>
        )}
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </Link>
  );
};

export default ProductCard;