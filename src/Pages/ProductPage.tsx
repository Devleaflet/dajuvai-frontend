import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

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

import React from "react";
import axiosInstance from "../api/axiosInstance";
import { addToWishlist } from "../api/wishlist";
import AuthModal from "../Components/AuthModal";
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import Preloader from "../Components/Preloader";
import RecommendedProducts from "../Components/Product/RecommendedProducts";
import Reviews from "../Components/Reviews";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "../Styles/ProductPage.css";

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
  const toFullUrl = (imgUrl: string): string => {
    if (!imgUrl) return ""; // Return empty string if no image URL
    return imgUrl.startsWith("http")
      ? imgUrl
      : `${window.location.origin}${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`;
  };

  const {
    id: productId,
    categoryId,
    subcategoryId,
  } = useParams<{
    id: string;
    categoryId?: string;
    subcategoryId?: string;
  }>();
  const id = productId;
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [imageError, setImageError] = useState<boolean[]>([]);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);

  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const mainImageRef = useRef<HTMLDivElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const ZOOM_LEVEL = 3;
  const ZOOM_BOX_SIZE = 450;

  const { handleCartOnAdd } = useCart();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: productData, isLoading: isProductLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id || isNaN(Number(id))) throw new Error("Invalid product ID");

      const response = await axiosInstance.get(`/api/product/${id}`);
      const apiProduct = response.data.product;

      if (!apiProduct) {
        throw new Error("Product not found");
      }

      const variantImages: string[] = [];
      let allVariants = [];
      let defaultVariant = null;

      if (apiProduct.variants && Array.isArray(apiProduct.variants)) {
        allVariants = apiProduct.variants.map((variant: any) => {
          const variantImgUrls: string[] = [];
          if (variant.variantImages && Array.isArray(variant.variantImages)) {
            variant.variantImages.forEach((img: any) => {
              try {
                let imgUrl = "";
                if (typeof img === "string") {
                  try {
                    const parsed = JSON.parse(img);
                    imgUrl = parsed.url || parsed.imageUrl || img;
                  } catch {
                    imgUrl = img;
                  }
                } else if (img && typeof img === "object") {
                  imgUrl = img.url || img.imageUrl || "";
                }
                if (imgUrl) {
                  const fullUrl = toFullUrl(imgUrl);
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

          if (!defaultVariant) {
            defaultVariant = variantData;
          }

          return variantData;
        });
      }

      const productImages = Array.isArray(apiProduct.productImages)
        ? apiProduct.productImages
          .map((img: any) => {
            try {
              let imgUrl = "";
              if (typeof img === "string") {
                try {
                  const parsed = JSON.parse(img);
                  imgUrl = parsed.url || parsed.imageUrl || img;
                } catch {
                  imgUrl = img;
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

      const allImages = [...new Set([...productImages, ...variantImages])].filter(
        Boolean
      );

      let productPrice = 0;
      let productOriginalPrice = 0;

      if (apiProduct.hasVariants) {
        if (defaultVariant) {
          productPrice = defaultVariant.calculatedPrice;
          productOriginalPrice = defaultVariant.originalPrice;
        }
      } else {
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
          rating: 0,
          ratingCount: "0",
          image: allImages[0] || "",
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

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
      return {
        reviews: response.data.data.reviews || [],
        averageRating: response.data.data.averageRating || 0,
        totalReviews: response.data.data.total || 0,
        totalPages: response.data.data.totalPages || 1,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const product = productData?.product;
  const vendorId = productData?.vendorId;

  const effectiveCategoryId =
    categoryId ??
    (product?.category?.id != null ? String(product.category.id) : undefined);
  const effectiveSubcategoryId =
    subcategoryId ??
    (product?.subcategory?.id != null
      ? String(product.subcategory.id)
      : undefined);

  const { data: recommendedProducts, isLoading: isLoadingRecommended } = useQuery({
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
          const rating = product.avgRating || product.rating || 0;
          const ratingCount = product.count || product.reviews?.length || 0;
          return {
            ...product,
            rating,
            ratingCount,
          };
        });
      };

      try {
        if (effectiveCategoryId && effectiveSubcategoryId) {
          const params = new URLSearchParams();
          params.append("categoryId", String(effectiveCategoryId));
          params.append("subcategoryId", String(effectiveSubcategoryId));
          let data = await fetchWithParams(params);
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

        if (effectiveSubcategoryId && !effectiveCategoryId) {
          const params = new URLSearchParams();
          params.append("subcategoryId", String(effectiveSubcategoryId));
          let data = await fetchWithParams(params);
          if (!Array.isArray(data) || data.length <= 1) {
            data = await fetchWithParams(new URLSearchParams());
          }
          return data;
        }

        if (effectiveCategoryId && !effectiveSubcategoryId) {
          const params = new URLSearchParams();
          params.append("categoryId", String(effectiveCategoryId));
          let data = await fetchWithParams(params);
          if (!Array.isArray(data) || data.length <= 1) {
            data = await fetchWithParams(new URLSearchParams());
          }
          return data;
        }

        return await fetchWithParams(new URLSearchParams());
      } catch (error) {
        console.error("Failed to fetch recommended products:", error);
        return [];
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });

  const formatVariantAttributes = (attributes: any): string => {
    if (!attributes) return "";
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

  const subcategory = categoryData?.data?.subcategories?.find(
    (sub: any) => sub.id === Number(subcategoryId)
  );

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

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  const getCurrentImages = () => {
    if (selectedVariant?.variantImgUrls?.length > 0) {
      return selectedVariant.variantImgUrls;
    }
    if (
      product?.hasVariants &&
      product?.variants?.[0]?.variantImgUrls?.length > 0
    ) {
      return product.variants[0].variantImgUrls;
    }
    return product?.productImages || [];
  };

  useEffect(() => {
    const imgs = getCurrentImages();
    setImageError(new Array(imgs && imgs.length ? imgs.length : 1).fill(false));
    if (selectedImageIndex >= (imgs?.length || 0)) {
      setSelectedImageIndex(0);
    }
  }, [selectedVariant, product]);

  const getCurrentStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock || 0;
    }
    return product?.stock || 0;
  };

  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.calculatedPrice || 0;
    }
    return parseFloat(product?.price || "0");
  };

  const getOriginalPrice = () => {
    if (selectedVariant) {
      return (
        selectedVariant.originalPrice || selectedVariant.calculatedPrice || 0
      );
    }
    return parseFloat(product?.originalPrice || product?.price || "0");
  };

  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant);
    if (variant.variantImgUrls && variant.variantImgUrls.length > 0) {
      setSelectedImageIndex(0);
    } else if (product?.productImages?.length > 0) {
      setSelectedImageIndex(0);
    }
  };

  const handleMouseEnter = () => {
    const currentImages = getCurrentImages();
    if (currentImages[selectedImageIndex] && !imageError[selectedImageIndex]) {
      setIsZoomActive(true);
    }
  };

  const handleMouseLeave = () => {
    setIsZoomActive(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomActive || !mainImageRef.current) return;

    const rect = mainImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate relative position (0-1)
    const relativeX = Math.max(0, Math.min(1, x / rect.width));
    const relativeY = Math.max(0, Math.min(1, y / rect.height));

    // Convert to percentage for background-position
    const percentX = relativeX * 100;
    const percentY = relativeY * 100;

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
    navigate("/checkout", {
      state: {
        buyNow: true,
        products: [
          {
            product: {
              ...product,
              selectedColor,
              price: getCurrentPrice().toFixed(2),
              originalPrice:
                getOriginalPrice() > getCurrentPrice()
                  ? getOriginalPrice().toFixed(2)
                  : undefined,
              selectedVariant: selectedVariant
                ? {
                  id: selectedVariant.id,
                  attributes: selectedVariant.attributes,
                  calculatedPrice: selectedVariant.calculatedPrice,
                  originalPrice: selectedVariant.originalPrice,
                  stock: selectedVariant.stock,
                  variantImgUrls: selectedVariant.variantImgUrls,
                }
                : undefined,
            },
            quantity,
          },
        ],
      },
    });
  };

  const handleQuantityChange = (increment: boolean) => {
    if (!product) return;
    const currentStock = getCurrentStock();
    if (increment && quantity < currentStock) {
      setQuantity((prev) => prev + 1);
    } else if (!increment && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleQuantityInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    const currentStock = getCurrentStock();

    if (value === "") {
      setQuantity(1);
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      if (numValue <= 0) {
        setQuantity(1);
      } else if (numValue <= currentStock) {
        setQuantity(numValue);
      } else {
        setQuantity(currentStock);
      }
    }
  };

  const handleQuantityBlur = () => {
    if (quantity < 1) {
      setQuantity(1);
    }
  };

  const handleQuantitySelect = () => {
    if (quantityInputRef.current) {
      quantityInputRef.current.select();
    }
  };

  useEffect(() => {
    setZoomPosition({ x: 50, y: 50 }); // Center the zoom initially
  }, [selectedImageIndex, selectedVariant]);

  useEffect(() => {
    return () => {
      setIsZoomActive(false);
      setZoomPosition({ x: 50, y: 50 });
    };
  }, []);

  const handleImageLoad = () => {
    // Reset zoom when image loads
    setZoomPosition({ x: 50, y: 50 });
  };

  const handleImageError = (index: number) => {
    console.warn(`Image failed to load: ${getCurrentImages()[index]}`);
    setImageError((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const handleReviewPageChange = (page: number) => {
    setCurrentReviewPage(page);
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
    currentImages[selectedImageIndex] && !imageError[selectedImageIndex]
      ? currentImages[selectedImageIndex]
      : "";

  return (
    <div className="app">
      <Navbar />
      <main className="product-page">
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
                  id="imageZoom"
                >
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt={product.name}
                      onError={() => handleImageError(selectedImageIndex)}
                      onLoad={handleImageLoad}
                      draggable={false}
                    />
                  ) : (
                    <div className="product-gallery__no-image">
                      No image available
                    </div>
                  )}
                  {isZoomActive && currentImage && (
                    <div
                      className={`product-gallery__zoom-box ${isZoomActive ? "active" : ""}`}
                      style={{
                        backgroundImage: `url(${currentImage})`,
                        backgroundSize: `${ZOOM_LEVEL * 100}%`,
                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        backgroundRepeat: "no-repeat",
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
                        onClick={() => handleImageSelect(index)}
                      >
                        {image && !imageError[index] ? (
                          <img
                            src={image}
                            alt={`Product view ${index + 1}`}
                            onError={() => handleImageError(index)}
                          />
                        ) : (
                          <div className="product-gallery__thumbnail-no-image">
                            No image
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="product-info">
              <div className="product-info__header">
                <h1 className="product-info__title">{product.name}</h1>

                <div className="product-price">
                  <span className="product-price__current">
                    Rs. {getCurrentPrice().toFixed(2)}
                  </span>
                  {getOriginalPrice() > getCurrentPrice() && (
                    <>
                      <span className="product-price__original">
                        Rs. {getOriginalPrice().toFixed(2)}
                      </span>
                      <span className="product-price__savings">
                        Save Rs.{" "}
                        {(getOriginalPrice() - getCurrentPrice()).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {product.description && (
                <div className="product-info__description">
                  <h3>Description</h3>
                  <p>{product.description}</p>
                </div>
              )}

              {product.hasVariants &&
                product.variants &&
                product.variants.length > 1 && (
                  <div className="product-options">
                    <h4 className="product-options__label">Available Options:</h4>
                    <div className="product-options__variants">
                      {product.variants.map((variant: any) => (
                        <div
                          key={variant.id}
                          className={`product-options__variant ${selectedVariant?.id === variant.id
                              ? "product-options__variant--active"
                              : ""
                            }`}
                          onClick={() =>
                            variant.stock > 0 && handleVariantSelect(variant)
                          }
                        >
                          <div className="product-options__variant-info">
                            <div>{formatVariantAttributes(variant.attributes)}</div>
                            <div className="product-options__variant-sku">
                              Rs. {variant.calculatedPrice?.toFixed(2) || "0.00"}
                            </div>
                            {variant.stock <= 0 && <div>Out of Stock</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="product-quantity">
                <h4 className="product-quantity__label">Quantity:</h4>
                <div className="product-quantity__selector">
                  <button
                    className="product-quantity__button"
                    onClick={() => handleQuantityChange(false)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    ref={quantityInputRef}
                    type="number"
                    className="product-quantity__input"
                    value={quantity}
                    onChange={handleQuantityInputChange}
                    onBlur={handleQuantityBlur}
                    onClick={handleQuantitySelect}
                    onFocus={handleQuantitySelect}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-", "."].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    min="1"
                    max={getCurrentStock()}
                  />
                  <button
                    className="product-quantity__button"
                    onClick={() => handleQuantityChange(true)}
                    disabled={quantity >= getCurrentStock()}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="seller-info">
                <div
                  className="seller-info__identity"
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
                        },
                      });
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      const data = await response.json();
                      if (data.success) {
                        window.location.href = `/vendor/${vendorId}`;
                      } else {
                        console.error(
                          "Failed to fetch vendor details:",
                          data.message
                        );
                      }
                    } catch (error) {
                      console.error("Error fetching vendor details:", error);
                      window.location.href = `/vendor/${vendorId}`;
                    }
                  }}
                >
                  <div className="seller-info__icon">
                    {product.vendor?.businessName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <h4 className="seller-info__name">
                    Sold by: {product.vendor?.businessName || "Unknown Vendor"}
                  </h4>
                </div>
              </div>

              <div className="product-actions">
                <button
                  className="product-actions__button product-actions__button--primary"
                  onClick={handleAddToCart}
                  disabled={getCurrentStock() <= 0}
                >
                  {getCurrentStock() > 0 ? "Add to Cart" : "Out of Stock"}
                </button>

                <button
                  className="product-actions__button product-actions__button--secondary"
                  onClick={handleBuyNow}
                  disabled={getCurrentStock() <= 0}
                >
                  Buy Now
                </button>
                <button
                  className="product-actions__button product-actions__button--secondary"
                  onClick={handleAddToWishlist}
                >
                  Add to Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>

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

        <div className="product-page__recommended">
          <RecommendedProducts
            products={recommendedProducts ?? []}
            currentProductId={product.id}
            fallbackCategoryId={effectiveCategoryId}
            fallbackSubcategoryId={effectiveSubcategoryId}
            isLoading={isLoadingRecommended}
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
