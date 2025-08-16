import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

interface Category {
  id: number;
  name: string;
  createdBy?: {
    id: number;
    username: string;
  };
  subcategories?: Array<{
    id: number;
    name: string;
  }>;
}

interface Subcategory {
  id: number;
  name: string;
  category?: Category;
}
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
  // Extract productId, categoryId, and subcategoryId from URL
  const { id: productId, categoryId, subcategoryId } = useParams<{ 
    id: string; 
    categoryId?: string; 
    subcategoryId?: string 
  }>();
  const id = productId; // For backward compatibility
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
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
  const ZOOM_LEVEL = 3.0; // Increased zoom level for better detail
  const ZOOM_BOX_SIZE = 450; // Size of the zoomed-in box (increased from 350)

  const { handleCartOnAdd } = useCart();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch product data using React Query with the new API structure
  // Fetch product data
  const { data: productData, isLoading: isProductLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id || isNaN(Number(id))) throw new Error('Invalid product ID');
      
      const response = await axiosInstance.get(`/api/product/${id}`);
      const apiProduct = response.data.product;

      if (!apiProduct) {
        throw new Error('Product not found');
      }

      // Process variants and images
      const variantImages: string[] = [];
      let allVariants = [];
      let defaultVariant = null;
      
      // Process each variant
      if (apiProduct.variants && Array.isArray(apiProduct.variants)) {
        allVariants = apiProduct.variants.map((variant: any) => {
          // Parse variant images
          const variantImgUrls: string[] = [];
          if (variant.variantImages && Array.isArray(variant.variantImages)) {
            variant.variantImages.forEach((img: string) => {
              try {
                const parsedImg = typeof img === 'string' ? JSON.parse(img) : img;
                const imgUrl = parsedImg.url || parsedImg.imageUrl || '';
                if (imgUrl) {
                  variantImgUrls.push(imgUrl);
                  if (!variantImages.includes(imgUrl)) {
                    variantImages.push(imgUrl);
                  }
                }
              } catch (e) {
                console.error('Error parsing variant image:', e);
              }
            });
          }

          // Calculate variant pricing
          const basePrice = parseFloat(variant.basePrice) || 0;
          const discount = parseFloat(variant.discount) || 0;
          let price = basePrice;
          let savings = 0;
          
          if (variant.discountType === 'PERCENTAGE') {
            savings = basePrice * (discount / 100);
            price = basePrice - savings;
          } else if (variant.discountType === 'FLAT') {
            savings = discount;
            price = basePrice - discount;
          }

          const variantData = {
            ...variant,
            variantImgUrls,
            calculatedPrice: price,
            calculatedSavings: savings,
            originalPrice: basePrice,
            stock: variant.stock || 0,
            status: variant.status || 'AVAILABLE'
          };

          // Set first variant as default
          if (!defaultVariant) {
            defaultVariant = variantData;
          }

          return variantData;
        });
      }
      
      // Process product images
      const productImages = Array.isArray(apiProduct.productImages) 
        ? apiProduct.productImages.map((img: any) => 
            typeof img === 'string' ? img : img.url || img.imageUrl || ''
          ).filter(Boolean)
        : [];
      
      const allImages = [...new Set([...productImages, ...variantImages])].filter(Boolean);

      // Calculate product-level pricing if no variants
      let productPrice = 0;
      let productOriginalPrice = 0;
      
      if (apiProduct.hasVariants) {
        // Use default variant for pricing if available
        if (defaultVariant) {
          productPrice = defaultVariant.calculatedPrice;
          productOriginalPrice = defaultVariant.originalPrice;
        }
      } else {
        // Use product-level pricing
        const basePrice = parseFloat(apiProduct.basePrice) || 0;
        const discount = parseFloat(apiProduct.discount) || 0;
        
        productOriginalPrice = basePrice;
        productPrice = basePrice;
        
        if (apiProduct.discountType === 'PERCENTAGE') {
          productPrice = basePrice - (basePrice * (discount / 100));
        } else if (apiProduct.discountType === 'FLAT') {
          productPrice = basePrice - discount;
        }
      }

      // Extract size and color options from variants
      const sizeOptions = new Set<string>();
      const colorOptions = new Set<{name: string, img: string}>();
      
      allVariants.forEach((variant: any) => {
        if (variant.attributes) {
          Object.entries(variant.attributes).forEach(([key, value]) => {
            if (typeof value === 'string') {
              if (key.toLowerCase().includes('size')) {
                sizeOptions.add(value);
              } else if (key.toLowerCase().includes('color')) {
                colorOptions.add({
                  name: value,
                  img: variant.variantImgUrls?.[0] || ''
                });
              }
            }
          });
        }
      });

      return {
        product: {
          id: apiProduct.id,
          name: apiProduct.name,
          description: apiProduct.description,
          price: productPrice.toFixed(2),
          originalPrice: productOriginalPrice > productPrice ? productOriginalPrice.toFixed(2) : undefined,
          rating: 0, // Will be populated from reviews
          ratingCount: '0', // Will be populated from reviews
          image: allImages[0] || defaultProductImage,
          brand: apiProduct.brand?.name || 'Unknown Brand',
          category: { 
            id: apiProduct.category?.id || 0, 
            name: apiProduct.category?.name || 'Category' 
          },
          subcategory: { 
            id: apiProduct.subcategory?.id || 0, 
            name: apiProduct.subcategory?.name || 'Subcategory' 
          },
          vendor: apiProduct.vendor?.businessName || 'Unknown Vendor',
          productImages: allImages,
          colors: Array.from(colorOptions),
          memoryOptions: Array.from(sizeOptions),
          stock: apiProduct.stock || defaultVariant?.stock || 0,
          isBestSeller: false,
          variants: allVariants,
          hasVariants: apiProduct.hasVariants || false,
          selectedVariant: defaultVariant
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

  // Fetch category data
  const { data: categoryData } = useQuery<{ data: Category }>({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      try {
        const response = await axiosInstance.get(`/api/categories/${categoryId}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching category:', error);
        return null;
      }
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000
  });

  // Find the subcategory from the category data if available
  const subcategory = categoryData?.data?.subcategories?.find(
    (sub: any) => sub.id === Number(subcategoryId)
  );

  // Fallback to product data if URL params are not available
  const displayCategory = categoryData?.data || product?.category;
  const displaySubcategory = subcategory || product?.subcategory;
  const reviews = (reviewsData?.reviews || []).map((review: Review) => ({
    ...review,
    userName: review.user?.username || review.user?.email?.split('@')[0] || 'Anonymous',
  }));
  const averageRating = reviewsData?.averageRating || 0;
  const ratingCount = reviewsData?.ratingCount || 0;

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0].name : '');
      setImageError(new Array(product.productImages?.length || 1).fill(false));
      
      // Set default variant if product has variants
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      }
    }
  }, [product]);

  // Handle image selection
  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  // Get current images to display (variant images or product images)
  const getCurrentImages = () => {
    if (selectedVariant?.variantImgUrls?.length > 0) {
      return selectedVariant.variantImgUrls;
    }
    return product?.productImages || [];
  };

  // Get current stock based on selected variant or product
  const getCurrentStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock || 0;
    }
    return product?.stock || 0;
  };

  // Get current price based on selected variant or product
  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.calculatedPrice || 0;
    }
    return parseFloat(product?.price || '0');
  };

  // Get original price based on selected variant or product
  const getOriginalPrice = () => {
    if (selectedVariant) {
      return selectedVariant.originalPrice || selectedVariant.calculatedPrice || 0;
    }
    return parseFloat(product?.originalPrice || product?.price || '0');
  };

  // Handle variant selection
  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant);
    // Reset to first image when variant changes
    if (variant.variantImgUrls && variant.variantImgUrls.length > 0) {
      setSelectedImageIndex(0);
    } else if (product?.productImages?.length > 0) {
      setSelectedImageIndex(0);
    }
  };

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
    <div className="app">
      <Navbar />
      <main className="product-page">
        <div className="product-page__container">
          <div className="product-page__content">
            <div className="product-gallery" style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
              <div className="product-gallery__images" style={{ flex: 1 }}>
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
                      transform: 'scale(1)',
                      transformOrigin: 'center center',
                    }}
                  />
                  {isZoomActive && (
                    <div
                      style={{
                        position: 'fixed',
                        left: mainImageRef.current ? mainImageRef.current.getBoundingClientRect().right + 32 : '60%',
                        top: mainImageRef.current ? mainImageRef.current.getBoundingClientRect().top : 100,
                        width: `${ZOOM_BOX_SIZE}px`,
                        height: `${ZOOM_BOX_SIZE}px`,
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        zIndex: 2000,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1)',
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
            </div>
            
            <div className="product-info" style={{ 
              flex: 1,
              padding: '0 20px',
              maxWidth: '600px'
            }}>
              <h1 style={{
                fontSize: '40px',
                fontWeight: '700',
                marginBottom: '20px',
                color: '#1a1a1a',
                lineHeight: '1.3',
                letterSpacing: '-0.3px'
              }}>
                {product.name}
              </h1>
              
              {product.description && (
                <div style={{
                  marginBottom: '25px',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#4a4a4a'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '10px',
                    color: '#333'
                  }}>Description</h3>
                  <p style={{ margin: 0 }}>{product.description}</p>
                </div>
              )}
              
              <div style={{
                marginBottom: '20px',
                fontSize: '14px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span>Category: </span>
                <Link 
                  to={`/category/${displayCategory?.id}`}
                  style={{
                    color: '#0066cc',
                    textDecoration: 'none',
                    ':hover': {
                      textDecoration: 'underline'
                    }
                  } as React.CSSProperties}
                >
                  {displayCategory?.name || 'Uncategorized'}
                </Link>
                {displaySubcategory && (
                  <>
                    <span>›</span>
                    <Link 
                      to={`/category/${displayCategory?.id}?subcategory=${displaySubcategory.id}`}
                      style={{
                        color: '#0066cc',
                        textDecoration: 'none',
                        ':hover': {
                          textDecoration: 'underline'
                        }
                      } as React.CSSProperties}
                    >
                      {displaySubcategory.name}
                    </Link>
                  </>
                )}
              </div>
              
              {product.hasVariants && product.variants && product.variants.length > 1 && (
                <div className="product-info__variants" >
                  <h4 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '600' }}>Available Options:</h4>
                  <div className="product-info__variant-options" style={{ 
                    display: 'flex', 
                    flexDirection: 'row',
                    gap: '10px',
                    marginBottom: '20px'
                  }}>
                    {product.variants.map((variant: any) => (
                      <div key={variant.id} style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '5px',
                        padding: '10px',
                        border: selectedVariant?.id === variant.id ? '1px solid #007bff' : '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: variant.stock <= 0 ? '#f8f9fa' : '#fff',
                        opacity: variant.stock <= 0 ? 0.7 : 1,
                        cursor: variant.stock <= 0 ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => variant.stock > 0 && handleVariantSelect(variant)}
                      >
                        <div style={{ fontWeight: '500' }}>
                          {Object.entries(variant.attributes || {})
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')}
                        </div>
                        <div style={{ color: '#28a745', fontWeight: '600' }}>
                          ${variant.calculatedPrice?.toFixed(2) || '0.00'}
                        </div>
                        {variant.stock <= 0 && (
                          <div style={{ color: '#dc3545', fontSize: '14px' }}>Out of Stock</div>
                        )}
                      </div>
                  ))}
                </div>
              </div>
            )}

            <div className="product-info__quantity" style={{ margin: '20px 0' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '600' }}>Quantity:</h4>
              <div className="product-info__quantity-selector" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginBottom: '10px'
              }}>
                <button
                  style={{
                    padding: '5px 15px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    borderRadius: '4px',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    opacity: quantity <= 1 ? 0.5 : 1
                  }}
                  onClick={() => handleQuantityChange(false)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span style={{ 
                  minWidth: '30px', 
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  {quantity}
                </span>
                <button
                  style={{
                    padding: '5px 15px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    borderRadius: '4px',
                    cursor: quantity >= Math.min(getCurrentStock(), 10) ? 'not-allowed' : 'pointer',
                    opacity: quantity >= Math.min(getCurrentStock(), 10) ? 0.5 : 1
                  }}
                  onClick={() => handleQuantityChange(true)}
                  disabled={quantity >= Math.min(getCurrentStock(), 10)}
                >
                  +
                </button>
              </div>
              <div style={{ 
                color: getCurrentStock() <= 5 ? '#dc3545' : '#28a745',
                fontWeight: '500',
                marginBottom: '20px'
              }}>
                {getCurrentStock()} in stock
                {getCurrentStock() <= 5 && ' - Order soon!'}
              </div>
            </div>

            <div className="product-info__actions" style={{ display: 'flex', gap: '15px', marginTop: '20px',width:'100%' }}>
              <button 
                className="product-info__add-to-cart"
                onClick={handleAddToCart}
                disabled={getCurrentStock() <= 0}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#fff',
                  backgroundColor:'#ff6b35',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: getCurrentStock() <= 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  ...(getCurrentStock() > 0 && {
                    ':hover': {
                      backgroundColor: '#0069d9',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                    },
                    ':active': {
                      transform: 'translateY(0)',
                      boxShadow: 'none'
                    }
                  })
                } as React.CSSProperties}
              >
                <span></span>
                {getCurrentStock() > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button 
                className="product-info__wishlist"
                onClick={handleAddToWishlist}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#fff',
                  backgroundColor: 'transparent',
                  border: '2px solid orange',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  ':hover': {
                    backgroundColor: '#5a32a3',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                  },
                  ':active': {
                    transform: 'translateY(0)',
                    boxShadow: 'none'
                  }
                } as React.CSSProperties}
              >
                <span></span>
                Add to Wishlist
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews Section */}
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
      
      {/* Seller Information */}
      <div className="seller-info">
        <h3 className="seller-info__title">Seller Information</h3>
        <div className="seller-info__identity">
          <div className="seller-info__icon">
            {(product.vendor || 'UV').charAt(0).toUpperCase()}
          </div>
          <h4 className="seller-info__name">
            {product.vendor || 'Unknown Vendor'}
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
      
      {/* Toast Notification */}
      {showToast && (
        <div className="toast">
          <div className="toast__content">
            <span className="toast__icon">✓</span>
            <span className="toast__message">{toastMessage}</span>
          </div>
        </div>
      )}
      
      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductPage;