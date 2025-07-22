import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import '../Styles/ProductPage.css';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import axiosInstance from '../api/axiosInstance';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addToWishlist } from '../api/wishlist';
import Preloader from '../Components/Preloader';
import AuthModal from '../Components/AuthModal';
import defaultProductImage from '../assets/logo.webp';
import Reviews from '../Components/Reviews';
import React from 'react';

const CACHE_KEY_REVIEWS = 'productReviewsData';

interface Review {
  id: number;
  userId: number;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    username?: string;
    email?: string;
  };
}

interface ReviewsResponse {
  success: boolean;
  data: {
    averageRating: number;
    reviews: Review[];
  };
}

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedMemory, setSelectedMemory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [imageError, setImageError] = useState<boolean[]>([]);

  // Enhanced Amazon-style zoom state
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const mainImageRef = useRef<HTMLDivElement>(null);
  
  // Amazon-like zoom configuration
  const ZOOM_LEVEL = 2.5;
  const ZOOM_BOX_SIZE = 200; // Size of the zoomed-in box

  const { handleCartOnAdd } = useCart();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch product data using React Query
  const { data: productData, isLoading: isProductLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id || isNaN(Number(id))) throw new Error('Invalid product ID');
      
      const response = await axiosInstance.get(`/api/product/${id}`);
      const apiProduct = response.data.product;

      if (!apiProduct) {
        throw new Error('Product not found');
      }

      const basePrice = parseFloat(apiProduct.basePrice) || 0;
      const discount = parseFloat(apiProduct.discount) || 0;
      let price = basePrice;
      let savings = '0';
      
      if (apiProduct.discountType === 'PERCENTAGE') {
        savings = (basePrice * (discount / 100)).toFixed(2);
        price = basePrice - parseFloat(savings);
      } else if (apiProduct.discountType === 'FLAT') {
        savings = discount.toFixed(2);
        price = basePrice - discount;
      }

      return {
        product: {
          id: apiProduct.id,
          name: apiProduct.name,
          description: apiProduct.description,
          price: price.toFixed(2),
          originalPrice: basePrice > price ? basePrice.toFixed(2) : undefined,
          rating: 0,
          ratingCount: '0',
          image: apiProduct.productImages?.[0] || '',
          brand: apiProduct.brand?.name || 'Unknown Brand',
          category: { id: 0, name: 'update testing subcategory' },
          subcategory: { id: 0, name: 'update testing subcategory' },
          vendor: apiProduct.vendor?.businessName || 'Himalayan Crafts',
          productImages: apiProduct.productImages || [],
          colors: [] as { name: string; img: string }[],
          memoryOptions: apiProduct.size || [],
          stock: apiProduct.stock || 10,
          isBestSeller: false,
        },
        vendorId: apiProduct.vendorId || null
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data for 10 minutes
  });

  // Fetch reviews data using React Query
  const { data: reviewsData, isLoading: isReviewsLoading } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      if (!id || isNaN(Number(id))) throw new Error('Invalid product ID');
      
      const response = await axiosInstance.get<ReviewsResponse>(`/api/reviews/${id}`);
      if (!response.data.success) {
        throw new Error('Failed to fetch reviews');
      }
      
      return {
        reviews: response.data.data.reviews || [],
        averageRating: response.data.data.averageRating || 0,
        ratingCount: response.data.data.reviews?.length || 0
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data for 10 minutes
  });

  const product = productData?.product;
  const vendorId = productData?.vendorId;
  const reviews = (reviewsData?.reviews || []).map((review: Review) => ({
    ...review,
    userName: review.user?.username || review.user?.email?.split('@')[0] || 'Anonymous',
  }));
  const averageRating = reviewsData?.averageRating || 0;
  const ratingCount = reviewsData?.ratingCount || 0;

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0].name : '');
      setSelectedMemory(product.memoryOptions && product.memoryOptions.length > 0 ? product.memoryOptions[0] : '');
      setImageError(new Array(product.productImages?.length || 1).fill(false));
    }
  }, [product]);

  // Enhanced Amazon-style zoom handlers
  const handleMouseEnter = () => {
    setIsZoomActive(true);
  };

  const handleMouseLeave = () => {
    setIsZoomActive(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return;

    const rect = mainImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Constrain mouse position within image bounds
    const constrainedX = Math.max(0, Math.min(x, rect.width));
    const constrainedY = Math.max(0, Math.min(y, rect.height));

    // Calculate percent position for transform-origin
    const percentX = (constrainedX / rect.width) * 100;
    const percentY = (constrainedY / rect.height) * 100;
    setZoomPosition({ x: percentX, y: percentY });
  };

  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (!product) return;
    handleCartOnAdd(product, quantity);
    showNotification('Product added to cart!');
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated || !product) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await addToWishlist(product.id, token);
      showNotification('Product added to wishlist!');
    } catch {
      showNotification('Failed to add to wishlist');
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (!product) return;
    // Pass product info to checkout page via state
    navigate('/checkout', {
      state: {
        buyNow: true,
        product: {
          ...product,
          selectedColor,
          selectedMemory,
          quantity
        }
      }
    });
  };

  const handleQuantityChange = (increment: boolean) => {
    if (!product) return;
    if (increment && quantity < Math.min(product.stock || 10, 10)) {
      setQuantity(quantity + 1);
    } else if (!increment && quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleImageError = (index: number) => {
    setImageError((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  if (isProductLoading || isReviewsLoading || !product) {
    return (
      <>
        <Navbar />
        <Preloader />
        <Footer />
      </>
    );
  }

  const currentImage = imageError[selectedImageIndex]
    ? defaultProductImage
    : product.productImages?.[selectedImageIndex] || defaultProductImage;

  return (
    <>
      <Navbar />
      <div className="product-page">
        <div className="product-page__container">
          <div className="product-page__content">
            <div className="product-gallery">
              <div className="product-gallery__images">
                <div 
                  className="product-gallery__main-image"
                  ref={mainImageRef}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                  style={{ 
                    position: 'relative', 
                    overflow: 'hidden',
                    cursor: isZoomActive ? 'crosshair' : 'zoom-in',
                  }}
                >
                  <img
                    src={currentImage}
                    alt={product.name}
                    onError={() => handleImageError(selectedImageIndex)}
                    style={{ 
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      userSelect: 'none',
                      transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
                      // Remove in-place zoom
                      transform: 'scale(1)',
                      transformOrigin: 'center center',
                    }}
                  />
                  {/* Zoom box overlay on the right, over product info */}
                  {isZoomActive && (
                    <div
                      style={{
                        position: 'fixed', // Use fixed to overlay anywhere
                        left: mainImageRef.current ? mainImageRef.current.getBoundingClientRect().right + 32 : '60%',
                        top: mainImageRef.current ? mainImageRef.current.getBoundingClientRect().top : 100,
                        width: `${ZOOM_BOX_SIZE}px`,
                        height: `${ZOOM_BOX_SIZE}px`,
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        zIndex: 2000,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1), 0 6px 20px rgba(0,0,0,0.15)',
                        backgroundColor: '#fff',
                        backgroundImage: `url(${currentImage})`,
                        backgroundSize: `${ZOOM_LEVEL * 100}%`,
                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        backgroundRepeat: 'no-repeat',
                        pointerEvents: 'none',
                        opacity: 1,
                        transition: 'opacity 0.2s ease-out',
                      }}
                    />
                  )}
                </div>

                {/* Clean up: Remove always-false blocks */}

                {product.productImages && product.productImages.length > 1 && (
                  <div className="product-gallery__thumbnails">
                    {product.productImages.map((image: string, index: number) => (
                      <button
                        key={index}
                        className={`product-gallery__thumbnail ${
                          selectedImageIndex === index ? 'product-gallery__thumbnail--active' : ''
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img
                          src={imageError[index] ? defaultProductImage : image}
                          alt={`Product view ${index + 1}`}
                          onError={() => handleImageError(index)}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="product-info">
                <div className="product-info__badges">
                  {product.isBestSeller && (
                    <span className="product-info__badge product-info__badge--bestseller">
                      Best Seller
                    </span>
                  )}
                  <span className="product-info__badge product-info__badge--category">
                    {product.category?.name || 'Category'}
                  </span>
                </div>
                <h1 className="product-info__brand">{product.brand || 'Unknown Brand'}</h1>
                <h2 className="product-info__title">{product.name}</h2>
                <p className="product-info__description">{product.description}</p>
                <div className="product-rating">
                  <span className="product-rating__score">{averageRating.toFixed(1)}</span>
                  <div className="product-rating__stars">
                    {Array(5).fill('★').map((star, i) => (
                      <span key={i} style={{ color: i < Math.round(averageRating) ? '#fbbf24' : '#d1d5db' }}>
                        {star}
                      </span>
                    ))}
                  </div>
                  <span className="product-rating__count">({ratingCount} ratings)</span>
                </div>
                <div className="product-price">
                  <span className="product-price__current">Rs.{product.price}</span>
                  {product.originalPrice && (
                    <>
                      <span className="product-price__original">Rs.{product.originalPrice}</span>
                      <span className="product-price__savings">
                        Save Rs.{(parseFloat(String(product.originalPrice)) - parseFloat(String(product.price))).toFixed(2)}
                      </span>
                    </>
                  )}
                  <span className="product-price__vat">Inclusive of all taxes</span>
                </div>
                {product.memoryOptions && product.memoryOptions.length > 0 && (
                  <div className="product-storage">
                    <div className="product-storage__label">Storage:</div>
                    <div className="product-storage__value">{product.memoryOptions[0]}</div>
                  </div>
                )}
                <div className="product-options">
                  {product.colors && product.colors.length > 0 && (
                    <div className="product-options__group">
                      <label className="product-options__label">Color: {selectedColor}</label>
                      <div className="product-options__colors">
                        {product.colors.map((color: { name: string; img: string }) => (
                          <button
                            key={color.name}
                            className={`product-options__color ${
                              selectedColor === color.name ? 'product-options__color--active' : ''
                            }`}
                            onClick={() => setSelectedColor(color.name)}
                          >
                            <img src={color.img} alt={color.name} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.memoryOptions && product.memoryOptions.length > 0 && (
                    <div className="product-options__group">
                      <label className="product-options__label">Storage: {selectedMemory}</label>
                      <div className="product-options__memory">
                        {product.memoryOptions.map((memory: string) => (
                          <button
                            key={memory}
                            className={`product-options__memory-item ${
                              selectedMemory === memory ? 'product-options__memory-item--active' : ''
                            }`}
                            onClick={() => setSelectedMemory(memory)}
                          >
                            {memory}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="product-quantity">
                  <label className="product-quantity__label">Quantity:</label>
                  <div className="product-quantity__selector">
                    <button
                      className="product-quantity__button"
                      onClick={() => handleQuantityChange(false)}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="product-quantity__value">{quantity}</span>
                    <button
                      className="product-quantity__button"
                      onClick={() => {
                        if (quantity >= (product.stock || 10)) {
                          showNotification(`Only ${product.stock} item${product.stock > 1 ? 's' : ''} in stock`);
                          return;
                        }
                        handleQuantityChange(true);
                      }}
                      disabled={quantity >= Math.min(product.stock || 10, 10)}
                    >
                      +
                    </button>
                  </div>
                  <div className="product-quantity__stock">In stock: {product.stock}</div>
                </div>
                <div className="product-actions">
                  {/* <button
                    className="product-actions__button product-actions__button--primary"
                    style={{ order: 1 }}
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </button> */}
                  <button
                    className="product-actions__button product-actions__button--primary"
                    style={{ order: 2 }}
                    onClick={handleAddToCart}
                  >
                    Add to Cart
                  </button>
                  <button
                    className="product-actions__button product-actions__button--secondary"
                    style={{ order: 3 }}
                    onClick={handleAddToWishlist}
                  >
                    Add to Wishlist
                  </button>
                </div>
                <div className="seller-info">
                  <h3 className="seller-info__title">Seller Information</h3>
                  <div className="seller-info__identity">
                    <div className="seller-info__icon">
                      {(product.vendor || 'Unknown Vendor').charAt(0)}
                    </div>
                    <h4 className="seller-info__name">
                      {vendorId !== null ? (
                        <Link to={`/vendor/${vendorId.toString()}`} className="seller-info__link">
                          {product.vendor || 'Unknown Vendor'}
                        </Link>
                      ) : (
                        <span>{product.vendor || 'Unknown Vendor'}</span>
                      )}
                    </h4>
                  </div>
                  <div className="seller-info__details">
                    <div className="seller-info__detail">
                      <span className="seller-info__checkmark">✓</span>
                      <span>Partner Since 4+ Years</span>
                    </div>
                    <div className="seller-info__detail">
                      <span className="seller-info__checkmark">✓</span>
                      <span>Great Recent Rating</span>
                    </div>
                    <div className="seller-info__detail">
                      <span className="seller-info__checkmark">✓</span>
                      <span>Ships on Time</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="product-page__reviews">
          <Reviews
            productId={Number(id)}
            initialReviews={reviews}
            initialAverageRating={averageRating}
            onReviewUpdate={async () => {
              localStorage.removeItem(`${CACHE_KEY_REVIEWS}_${id}`);
            }}
          />
        </div>
        {showToast && (
          <div className="toast">
            <div className="toast__content">
              <span className="toast__icon">✓</span>
              <span className="toast__message">{toastMessage}</span>
            </div>
          </div>
        )}
        {authModalOpen && (
          <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        )}
      </div>
      <Footer />
    </>
  );
};

export default ProductPage;