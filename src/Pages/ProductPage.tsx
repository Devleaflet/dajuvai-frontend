import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

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
import "../Styles/ProductPage.css";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import axiosInstance from "../api/axiosInstance";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { addToWishlist } from "../api/wishlist";
import Preloader from "../Components/Preloader";
import AuthModal from "../Components/AuthModal";
import defaultProductImage from "../assets/logo.webp";
import Reviews from "../Components/Reviews";
import React from "react";
import RecommendedProducts from "../Components/Product/RecommendedProducts";

const CACHE_KEY_REVIEWS = "productReviewsData";

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
    total: number;
    totalPages: number;
  };
}

const ProductPage = () => {
  // Helper to normalize any relative URL to an absolute URL
  const toFullUrl = (imgUrl: string): string => {
    if (!imgUrl) return "";
    return imgUrl.startsWith("http")
      ? imgUrl
      : `${window.location.origin}${imgUrl.startsWith("/") ? "" : "/"
      }${imgUrl}`;
  };
  // Extract productId, categoryId, and subcategoryId from URL
  const {
    id: productId,
    categoryId,
    subcategoryId,
  } = useParams<{
    id: string;
    categoryId?: string;
    subcategoryId?: string;
  }>();
  const id = productId; // For backward compatibility
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [imageError, setImageError] = useState<boolean[]>([]);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);

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
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id || isNaN(Number(id))) throw new Error("Invalid product ID");

      const response = await axiosInstance.get(`/api/product/${id}`);
      const apiProduct = response.data.product;

      if (!apiProduct) {
        throw new Error("Product not found");
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
            variant.variantImages.forEach((img: any) => {
              try {
                // Handle both string URLs and object formats
                let imgUrl = "";
                if (typeof img === "string") {
                  // If it's a string, it might be a direct URL or a JSON string
                  try {
                    const parsed = JSON.parse(img);
                    imgUrl = parsed.url || parsed.imageUrl || img;
                  } catch {
                    imgUrl = img; // It's already a URL string
                  }
                } else if (img && typeof img === "object") {
                  // Handle image object
                  imgUrl = img.url || img.imageUrl || "";
                }

                if (imgUrl) {
                  // Ensure we have a full URL
                  const fullUrl = imgUrl.startsWith("http")
                    ? imgUrl
                    : `${window.location.origin}${imgUrl.startsWith("/") ? "" : "/"
                    }${imgUrl}`;
                  variantImgUrls.push(fullUrl);
                  if (!variantImages.includes(fullUrl)) {
                    variantImages.push(fullUrl);
                  }
                }
              } catch (e) {
                console.error("Error parsing variant image:", e, img);
              }
            });
          }

          // Calculate variant pricing
          const basePrice = parseFloat(variant.basePrice) || 0;
          const discount = parseFloat(variant.discount) || 0;
          let price = basePrice;
          let savings = 0;

          if (variant.discountType === "PERCENTAGE") {
            savings = basePrice * (discount / 100);
            price = basePrice - savings;
          } else if (variant.discountType === "FLAT") {
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
            status: variant.status || "AVAILABLE",
          };

          // Set first variant as default
          if (!defaultVariant) {
            defaultVariant = variantData;
          }

          return variantData;
        });
      }

      // Process product images (normalize to absolute URLs; handle strings/objects/JSON strings)
      const productImages = Array.isArray(apiProduct.productImages)
        ? apiProduct.productImages
          .map((img: any) => {
            try {
              let imgUrl = "";
              if (typeof img === "string") {
                // Could be a direct URL or a JSON string
                try {
                  const parsed = JSON.parse(img);
                  imgUrl = parsed.url || parsed.imageUrl || img;
                } catch {
                  imgUrl = img; // already a URL string
                }
              } else if (img && typeof img === "object") {
                imgUrl = img.url || img.imageUrl || "";
              }
              return imgUrl ? toFullUrl(imgUrl) : "";
            } catch (e) {
              console.error("Error parsing product image:", e, img);
              return "";
            }
          })
          .filter(Boolean)
        : [];

      const allImages = [
        ...new Set([...productImages, ...variantImages]),
      ].filter(Boolean);

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

        if (apiProduct.discountType === "PERCENTAGE") {
          productPrice = basePrice - basePrice * (discount / 100);
        } else if (apiProduct.discountType === "FLAT") {
          productPrice = basePrice - discount;
        }
      }

      // Extract size and color options from variants
      const sizeOptions = new Set<string>();
      const colorOptions = new Set<{ name: string; img: string }>();

      allVariants.forEach((variant: any) => {
        if (variant.attributes) {
          Object.entries(variant.attributes).forEach(([key, value]) => {
            if (typeof value === "string") {
              if (key.toLowerCase().includes("size")) {
                sizeOptions.add(value);
              } else if (key.toLowerCase().includes("color")) {
                colorOptions.add({
                  name: value,
                  img: variant.variantImgUrls?.[0] || "",
                });
              }
            }
          });
        }
      });

      // Derive category/subcategory IDs robustly (support nested objects or top-level IDs)
      const derivedCategoryId =
        apiProduct?.category?.id != null
          ? Number(apiProduct.category.id)
          : (apiProduct as any)?.categoryId != null
            ? Number((apiProduct as any).categoryId)
            : undefined;
      const derivedCategoryName = apiProduct?.category?.name;

      const derivedSubcategoryId =
        apiProduct?.subcategory?.id != null
          ? Number(apiProduct.subcategory.id)
          : (apiProduct as any)?.subcategoryId != null
            ? Number((apiProduct as any).subcategoryId)
            : undefined;
      const derivedSubcategoryName = apiProduct?.subcategory?.name;

      return {
        product: {
          id: apiProduct.id,
          name: apiProduct.name,
          description: apiProduct.description,
          price: productPrice.toFixed(2),
          originalPrice:
            productOriginalPrice > productPrice
              ? productOriginalPrice.toFixed(2)
              : undefined,
          rating: 0, // Will be populated from reviews
          ratingCount: "0", // Will be populated from reviews
          image: allImages[0] || defaultProductImage,
          brand: apiProduct.brand?.name || "Unknown Brand",
          category:
            derivedCategoryId != null
              ? {
                id: derivedCategoryId,
                name: derivedCategoryName || "Category",
              }
              : undefined,
          subcategory:
            derivedSubcategoryId != null
              ? {
                id: derivedSubcategoryId,
                name: derivedSubcategoryName || "Subcategory",
              }
              : undefined,
          vendor: apiProduct.vendor || {
            id: null,
            businessName: "Unknown Vendor",
          },
          productImages: allImages,
          colors: Array.from(colorOptions),
          memoryOptions: Array.from(sizeOptions),
          stock: apiProduct.stock || defaultVariant?.stock || 0,
          isBestSeller: false,
          variants: allVariants,
          hasVariants: apiProduct.hasVariants || false,
          selectedVariant: defaultVariant,
        },
        vendorId: apiProduct.vendorId || null,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data for 10 minutes
  });

  // Fetch reviews data using React Query with pagination
  const { data: reviewsData, isLoading: isReviewsLoading } = useQuery({
    queryKey: ["reviews", id, currentReviewPage],
    queryFn: async () => {
      if (!id || isNaN(Number(id))) throw new Error("Invalid product ID");

      const response = await axiosInstance.get<ReviewsResponse>(
        `/api/reviews/${id}?page=${currentReviewPage}`
      );
      if (!response.data.success) {
        throw new Error("Failed to fetch reviews");
      }
      console.log("Revies", response.data);
      return {
        reviews: response.data.data.reviews || [],
        averageRating: response.data.data.averageRating || 0,
        totalReviews: response.data.data.total || 0,
        totalPages: response.data.data.totalPages || 1,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data for 10 minutes
  });

  const product = productData?.product;
  const vendorId = productData?.vendorId;

  // Determine effective category/subcategory for recommendations
  const effectiveCategoryId =
    categoryId ??
    (product?.category?.id != null ? String(product.category.id) : undefined);
  const effectiveSubcategoryId =
    subcategoryId ??
    (product?.subcategory?.id != null
      ? String(product.subcategory.id)
      : undefined);

  // Fetch recommended products using effective IDs (works even when URL lacks params)
  const { data: recommendedProducts, isLoading: isLoadingRecommended } =
    useQuery({
      queryKey: [
        "recommendedProducts",
        effectiveCategoryId,
        effectiveSubcategoryId,
      ],
      queryFn: async () => {
        const fetchWithParams = async (p: URLSearchParams) => {
          const url = p.toString()
            ? `/api/categories/all/products?${p.toString()}`
            : `/api/categories/all/products`;
          const res = await axiosInstance.get(url);
          const products = (res?.data?.data ?? []) as any[];
          return products.map((product) => {
            // Assuming the API returns review data like averageRating and ratingCount
            // Adjust field names based on actual API response structure
            const rating = product.avgRating || product.rating || 0; // Map to API field
            const ratingCount = product.count || product.reviews?.length || 0; // Map to API field

            return {
              ...product,
              rating, // Add avgRating field
              ratingCount, // Add count field
            };
          });
        };

        try {
          // 1) Try most-specific: subcategory + category when both available
          if (effectiveCategoryId && effectiveSubcategoryId) {
            const params = new URLSearchParams();
            params.append("categoryId", String(effectiveCategoryId));
            params.append("subcategoryId", String(effectiveSubcategoryId));
            let data = await fetchWithParams(params);
            // If only the current product shows up or very few, broaden scope
            if (!Array.isArray(data) || data.length <= 1) {
              const catOnly = new URLSearchParams();
              catOnly.append("categoryId", String(effectiveCategoryId));
              data = await fetchWithParams(catOnly);
              if (!Array.isArray(data) || data.length <= 1) {
                data = await fetchWithParams(new URLSearchParams());
              }
            }
            return data;
          }

          // 2) If only subcategory
          if (effectiveSubcategoryId && !effectiveCategoryId) {
            const params = new URLSearchParams();
            params.append("subcategoryId", String(effectiveSubcategoryId));
            let data = await fetchWithParams(params);
            if (!Array.isArray(data) || data.length <= 1) {
              data = await fetchWithParams(new URLSearchParams());
            }
            return data;
          }

          // 3) If only category
          if (effectiveCategoryId && !effectiveSubcategoryId) {
            const params = new URLSearchParams();
            params.append("categoryId", String(effectiveCategoryId));
            let data = await fetchWithParams(params);
            if (!Array.isArray(data) || data.length <= 1) {
              data = await fetchWithParams(new URLSearchParams());
            }
            return data;
          }

          // 4) Fallback: no filters available, fetch general list
          return await fetchWithParams(new URLSearchParams());
        } catch (error) {
          console.error("Failed to fetch recommended products:", error);
          return [];
        }
      },
      // Always enabled so we can show general recommendations as a fallback
      enabled: true,
      staleTime: 5 * 60 * 1000,
    });

  // Safely format variant attributes coming from different API shapes
  const formatVariantAttributes = (attributes: any): string => {
    if (!attributes) return "";
    // New shape: Array<{ type: string; values: { value: string }[] }>
    if (Array.isArray(attributes)) {
      return attributes
        .map((attr: any) => {
          const label = String(attr?.type ?? attr?.attributeType ?? "");
          const vals = Array.isArray(attr?.values)
            ? attr.values.map((v: any) => String(v?.value ?? v)).filter(Boolean)
            : Array.isArray(attr?.attributeValues)
              ? attr.attributeValues
                .map((v: any) => String(v?.value ?? v))
                .filter(Boolean)
              : [];
          return label && vals.length ? `${label}: ${vals.join(", ")}` : "";
        })
        .filter(Boolean)
        .join(", ");
    }
    // Legacy/object shape: { color: 'Red', size: 'M' } or values as arrays/objects
    if (typeof attributes === "object") {
      return Object.entries(attributes)
        .map(([key, value]) => {
          if (value == null) return "";
          if (Array.isArray(value)) {
            const vals = value
              .map((v: any) => String(v?.value ?? v))
              .filter(Boolean);
            return `${key}: ${vals.join(", ")}`;
          }
          if (typeof value === "object") {
            // Try common fields; fallback to JSON
            const val = (value as any).value ?? (value as any).name ?? "";
            return val
              ? `${key}: ${String(val)}`
              : `${key}: ${JSON.stringify(value)}`;
          }
          return `${key}: ${String(value)}`;
        })
        .filter(Boolean)
        .join(", ");
    }
    return String(attributes);
  };

  // Fetch category data
  const { data: categoryData } = useQuery<{ data: Category }>({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      try {
        const response = await axiosInstance.get(
          `/api/categories/${categoryId}`
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching category:", error);
        return null;
      }
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
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
    userName:
      review.user?.username || review.user?.email?.split("@")[0] || "Anonymous",
  }));
  const averageRating = reviewsData?.averageRating || 0;
  const totalReviews = reviewsData?.totalReviews || 0;
  const totalPages = reviewsData?.totalPages || 1;

  useEffect(() => {
    if (product) {
      setSelectedColor(
        product.colors && product.colors.length > 0
          ? product.colors[0].name
          : ""
      );
      // Determine default variant and current images at mount
      const defaultVar =
        product.hasVariants && product.variants && product.variants.length > 0
          ? product.variants[0]
          : null;
      setSelectedVariant(defaultVar);
      const imgs =
        defaultVar &&
          defaultVar.variantImgUrls &&
          defaultVar.variantImgUrls.length > 0
          ? defaultVar.variantImgUrls
          : product.productImages || [];
      setImageError(
        new Array(imgs && imgs.length ? imgs.length : 1).fill(false)
      );
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
    // If no variant selected but product has variants with images, show first variant's images
    if (
      product?.hasVariants &&
      product?.variants?.[0]?.variantImgUrls?.length > 0
    ) {
      return product.variants[0].variantImgUrls;
    }
    return product?.productImages || [];
  };

  // Keep error-state array and selected image index in sync with current images
  useEffect(() => {
    const imgs = getCurrentImages();
    setImageError(new Array(imgs && imgs.length ? imgs.length : 1).fill(false));
    if (selectedImageIndex >= (imgs?.length || 0)) {
      setSelectedImageIndex(0);
    }
  }, [selectedVariant, product]);

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
    return parseFloat(product?.price || "0");
  };

  // Get original price based on selected variant or product
  const getOriginalPrice = () => {
    if (selectedVariant) {
      return (
        selectedVariant.originalPrice || selectedVariant.calculatedPrice || 0
      );
    }
    return parseFloat(product?.originalPrice || product?.price || "0");
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
    // Pass selectedVariant id when available for variant-aware add-to-cart
    const variantId = selectedVariant?.id;
    handleCartOnAdd(product, quantity, variantId);
    showNotification("Product added to cart!");
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated || !product) {
      setAuthModalOpen(true);
      return;
    }
    try {
      const variantId = selectedVariant?.id;
      await addToWishlist(product.id, variantId, token);
      toast.success("Added to wishlist");
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
        toast.error("Failed to add to wishlist");
      }
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (!product) return;
    // Pass product info to checkout page via state
    navigate("/checkout", {
      state: {
        buyNow: true,
        product: {
          ...product,
          selectedColor,
          quantity,
        },
      },
    });
  };

  const handleQuantityChange = (increment: boolean) => {
    if (!product) return;
    if (increment && quantity < getCurrentStock()) {
      setQuantity((prev) => prev + 1);
    } else if (!increment && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleQuantityInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // Allow empty input (for backspace/delete) or numeric input
    if (value === "") {
      setQuantity(1);
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue <= getCurrentStock()) {
      setQuantity(numValue);
    }
  };

  const handleQuantityBlur = () => {
    // Ensure quantity is at least 1
    if (quantity < 1) {
      setQuantity(1);
    }
  };

  const handleImageError = (index: number) => {
    setImageError((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const handleReviewPageChange = (page: number) => {
    setCurrentReviewPage(page);
    // Scroll to reviews section
    document
      .getElementById("reviews-section")
      ?.scrollIntoView({ behavior: "smooth" });
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

  const currentImages = getCurrentImages();
  const currentImage =
    imageError[selectedImageIndex] || !currentImages[selectedImageIndex]
      ? defaultProductImage
      : currentImages[selectedImageIndex];

  return (
    <div className="app">
      <Navbar />
      <main className="product-page">
        <div className="product-page__container">
          <div className="product-page__content">
            <div
              className="product-gallery"
              style={{ display: "flex", flexDirection: "row", gap: "20px" }}
            >
              <div className="product-gallery__images" style={{ flex: 1 }}>
                <div
                  className="product-gallery__main-image"
                  ref={mainImageRef}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    cursor: isZoomActive ? "crosshair" : "zoom-in",
                  }}
                >
                  <img
                    src={currentImage}
                    alt={product.name}
                    onError={() => handleImageError(selectedImageIndex)}
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      userSelect: "none",
                      transition: "transform 0.2s cubic-bezier(0.4,0,0.2,1)",
                      transform: "scale(1)",
                      transformOrigin: "center center",
                    }}
                  />
                  {isZoomActive && (
                    <div
                      style={{
                        position: "fixed",
                        left: mainImageRef.current
                          ? mainImageRef.current.getBoundingClientRect().right +
                          32
                          : "60%",
                        top: mainImageRef.current
                          ? mainImageRef.current.getBoundingClientRect().top
                          : 100,
                        width: `${ZOOM_BOX_SIZE}px`,
                        height: `${ZOOM_BOX_SIZE}px`,
                        border: "2px solid #ddd",
                        borderRadius: "8px",
                        overflow: "hidden",
                        zIndex: 2000,
                        boxShadow:
                          "0 8px 32px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1)",
                        backgroundColor: "#fff",
                        backgroundImage: `url(${currentImage})`,
                        backgroundSize: `${ZOOM_LEVEL * 100}%`,
                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        backgroundRepeat: "no-repeat",
                        pointerEvents: "none",
                        opacity: 1,
                        transition: "opacity 0.2s ease-out",
                      }}
                    />
                  )}
                </div>

                {currentImages && currentImages.length > 1 && (
                  <div className="product-gallery__thumbnails">
                    {currentImages.map((image: string, index: number) => (
                      <button
                        key={index}
                        className={`product-gallery__thumbnail ${selectedImageIndex === index
                            ? "product-gallery__thumbnail--active"
                            : ""
                          }`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img
                          src={imageError[index] ? defaultProductImage : image}
                          alt={`Product view ${index + 1}`}
                          onError={() => handleImageError(index)}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              className="product-info"
              style={{
                flex: 1,
                padding: "0 20px",
                maxWidth: "600px",
              }}
            >
              <h1
                style={{
                  fontSize: "40px",
                  fontWeight: "700",
                  marginBottom: "20px",
                  color: "#1a1a1a",
                  lineHeight: "1.3",
                  letterSpacing: "-0.3px",
                }}
              >
                {product.name}
              </h1>

              {product.description && (
                <div
                  style={{
                    marginBottom: "25px",
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#4a4a4a",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      marginBottom: "10px",
                      color: "#333",
                    }}
                  >
                    Description
                  </h3>
                  <p style={{ margin: 0 }}>{product.description}</p>
                </div>
              )}

              <div
                style={{
                  marginBottom: "0px",
                  fontSize: "14px",
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              ></div>

              {product.hasVariants &&
                product.variants &&
                product.variants.length > 1 && (
                  <div className="product-info__variants">
                    <h4
                      style={{
                        marginBottom: "10px",
                        fontSize: "16px",
                        fontWeight: "600",
                      }}
                    >
                      Available Options:
                    </h4>
                    <div
                      className="product-info__variant-options"
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "10px",
                        marginBottom: "20px",
                      }}
                    >
                      {product.variants.map((variant: any) => (
                        <div
                          key={variant.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                            padding: "10px",
                            border:
                              selectedVariant?.id === variant.id
                                ? "1px solid #007bff"
                                : "1px solid #ddd",
                            borderRadius: "4px",
                            backgroundColor:
                              variant.stock <= 0 ? "#f8f9fa" : "#fff",
                            opacity: variant.stock <= 0 ? 0.7 : 1,
                            cursor:
                              variant.stock <= 0 ? "not-allowed" : "pointer",
                          }}
                          onClick={() =>
                            variant.stock > 0 && handleVariantSelect(variant)
                          }
                        >
                          <div style={{ fontWeight: "500" }}>
                            {formatVariantAttributes(variant.attributes)}
                          </div>
                          <div style={{ color: "#28a745", fontWeight: "600" }}>
                            ${variant.calculatedPrice?.toFixed(2) || "0.00"}
                          </div>
                          {variant.stock <= 0 && (
                            <div style={{ color: "#dc3545", fontSize: "14px" }}>
                              Out of Stock
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div
                className="product-info__quantity"
                style={{ margin: "20px 0" }}
              >
                <h4
                  style={{
                    marginBottom: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  Quantity:
                </h4>
                <div
                  className="product-info__quantity-selector"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <button
                    style={{
                      padding: "5px 15px",
                      border: "1px solid #ddd",
                      background: "#fff",
                      borderRadius: "4px",
                      cursor: quantity <= 1 ? "not-allowed" : "pointer",
                      opacity: quantity <= 1 ? 0.5 : 1,
                    }}
                    onClick={() => handleQuantityChange(false)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={getCurrentStock()}
                    value={quantity}
                    onChange={handleQuantityInputChange}
                    onBlur={handleQuantityBlur}
                    style={{
                      width: "70px",
                      textAlign: "center",
                      padding: "5px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontWeight: "600",
                      MozAppearance: "textfield",
                      WebkitAppearance: "none",
                      margin: "0 5px",
                    }}
                    onKeyDown={(e) => {
                      // Prevent typing 'e', '+', '-', '.'
                      if (["e", "E", "+", "-", "."].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  <button
                    style={{
                      padding: "5px 15px",
                      border: "1px solid #ddd",
                      background: "#fff",
                      borderRadius: "4px",
                      cursor:
                        quantity >= getCurrentStock()
                          ? "not-allowed"
                          : "pointer",
                      opacity: quantity >= getCurrentStock() ? 0.5 : 1,
                    }}
                    onClick={() => handleQuantityChange(true)}
                    disabled={quantity >= getCurrentStock()}
                  >
                    +
                  </button>
                </div>
                <div
                  style={{
                    color: getCurrentStock() <= 5 ? "#dc3545" : "#28a745",
                    fontWeight: "500",
                    marginBottom: "20px",
                  }}
                >
                  {getCurrentStock()} in stock
                  {getCurrentStock() <= 5 && " - Order soon!"}
                </div>
              </div>

              {/* Vendor Information */}
              <div
                className="seller-info"
                onClick={async () => {
                  const vendorId = product.vendor?.id;
                  if (!vendorId) {
                    console.warn("Vendor ID not found in product data");
                    return;
                  }

                  try {
                    const response = await fetch(`/api/vendors/${vendorId}`, {
                      method: "GET",
                      headers: {
                        "Content-Type": "application/json",
                        // Add authentication token if required
                        // 'Authorization': `Bearer ${yourAuthToken}`
                      },
                    });

                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    if (data.success) {
                      // Navigate to the vendor page with the vendor ID
                      window.location.href = `/vendor/${vendorId}`;
                    } else {
                      console.error(
                        "Failed to fetch vendor details:",
                        data.message
                      );
                    }
                  } catch (error) {
                    console.error("Error fetching vendor details:", error);
                    // Fallback to the vendor page with just the ID if the API call fails
                    window.location.href = `/vendor/${vendorId}`;
                  }
                }}
                style={{
                  margin: "15px 0",
                  padding: "10px 0",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div
                  className="seller-info__identity"
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    className="seller-info__icon"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      color: "#666",
                    }}
                  >
                    {product.vendor?.businessName?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                  <h4
                    className="seller-info__name"
                    style={{ margin: 0, fontSize: "15px" }}
                  >
                    Sold by: {product.vendor?.businessName || "Unknown Vendor"}
                  </h4>
                </div>
              </div>

              <div
                className="product-info__actions"
                style={{
                  display: "flex",
                  gap: "15px",
                  marginTop: "20px",
                  width: "100%",
                }}
              >
                <button
                  className="product-info__add-to-cart"
                  onClick={handleAddToCart}
                  disabled={getCurrentStock() <= 0}
                  style={
                    {
                      flex: 1,
                      padding: "12px 24px",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#fff",
                      backgroundColor: "#ff6b35",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        getCurrentStock() <= 0 ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      ...(getCurrentStock() > 0 && {
                        ":hover": {
                          backgroundColor: "#0069d9",
                          transform: "translateY(-1px)",
                          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        },
                        ":active": {
                          transform: "translateY(0)",
                          boxShadow: "none",
                        },
                      }),
                    } as React.CSSProperties
                  }
                >
                  <span></span>
                  {getCurrentStock() > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
                <button
                  className="product-info__wishlist"
                  onClick={handleAddToWishlist}
                  style={
                    {
                      flex: 1,
                      padding: "12px 24px",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "orange",
                      backgroundColor: "transparent",
                      border: "2px solid orange",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      ":hover": {
                        backgroundColor: "#5a32a3",
                        transform: "translateY(-1px)",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                      },
                      ":active": {
                        transform: "translateY(0)",
                        boxShadow: "none",
                      },
                    } as React.CSSProperties
                  }
                >
                  <span></span>
                  Add to Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews-section" className="product-page__reviews">
          <Reviews
            productId={Number(id)}
            initialReviews={reviews}
            initialAverageRating={averageRating}
            totalReviews={totalReviews}
            currentPage={currentReviewPage}
            totalPages={totalPages}
            onReviewUpdate={async () => {
              localStorage.removeItem(`${CACHE_KEY_REVIEWS}_${id}`);
              setCurrentReviewPage(1);
            }}
            onPageChange={handleReviewPageChange}
          />
        </div>

        {/* Recommended Products */}
        <div className="product-page__recommended">
          <RecommendedProducts
            products={recommendedProducts ?? []}
            currentProductId={product.id}
            fallbackCategoryId={effectiveCategoryId}
            fallbackSubcategoryId={effectiveSubcategoryId}
            isLoading={isLoadingRecommended}
          />
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
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductPage;