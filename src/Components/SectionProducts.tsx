// src/Pages/SectionProducts.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Settings2, Search } from "lucide-react";
import Navbar from "../Components/Navbar";
import ProductBanner from "../Components/ProductBanner";
import CategorySlider from "../Components/CategorySlider";
import Footer from "../Components/Footer";
import ProductCard1 from "../ALT/ProductCard1";
import ProductCardSkeleton from "../skeleton/ProductCardSkeleton";
import { useAuth } from "../context/AuthContext";
import type { Product } from "../Components/Types/Product";
import { fetchReviewOf } from "../api/products";
import { API_BASE_URL } from "../config";
import phone from "../assets/phone.png";
import "../Styles/Shop.css";
import "../Styles/ProductCard.css";

// Define interfaces (same as provided)
interface ApiProduct {
  id: number;
  name: string;
  description: string;
  basePrice: number | null;
  stock: number;
  discount: number | null;
  discountType: "PERCENTAGE" | "FLAT" | null;
  size: string[];
  status: string;
  productImages: string[];
  inventory: { sku: string; quantity: number; status: string }[];
  vendorId: number;
  brand_id: number | null;
  dealId: number | null;
  created_at: string;
  updated_at: string;
  categoryId: number;
  variants?: Array<{
    id?: number;
    name?: string;
    price?: number | string;
    originalPrice?: number | string;
    stock?: number;
    sku?: string;
    image?: string;
    images?: string[];
    attributes?: Record<string, any>;
    discount?: number | string;
    discountType?: "PERCENTAGE" | "FLAT";
    basePrice?: number | string;
    calculatedPrice?: number;
    [key: string]: any;
  }>;
  subcategory: {
    id: number;
    name: string;
    image: string | null;
    createdAt: string;
    updatedAt: string;
    category?: { id: number; name: string };
  };
  vendor: {
    id: number;
    businessName: string;
    email: string;
    phoneNumber: string;
    districtId: number;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    district: { id: number; name: string };
  };
  brand: { id: number; name: string } | null;
  deal: { id: number; title: string } | null;
}

interface HomepageSection {
  id: number;
  title: string;
  isActive: boolean;
  products: ApiProduct[];
}

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

// API request function (unchanged)
const apiRequest = async (endpoint: string, token: string | null | undefined = undefined) => {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error(`Expected JSON response but received ${contentType}`);
  }
  return await response.json();
};

const processProductWithReview = async (item: ApiProduct): Promise<Product> => {
  try {
    const { averageRating, reviews } = await fetchReviewOf(item.id);
    const isDev = Boolean((import.meta as any)?.env?.DEV);

    const processImageUrl = (imgUrl: string): string => {
      if (!imgUrl) return "";
      const trimmed = imgUrl.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("//")) return `https:${trimmed}`;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
        return trimmed;
      }
      const base = API_BASE_URL.replace(/\/?api\/?$/, "");
      const needsSlash = !trimmed.startsWith("/");
      const url = `${base}${needsSlash ? "/" : ""}${trimmed}`;
      return url.replace(/([^:]\/)\/+/g, "$1/");
    };

    const processedProductImages = (item.productImages || [])
      .filter((img): img is string => !!img && typeof img === "string" && img.trim() !== "")
      .map(processImageUrl)
      .filter(Boolean);

    const processedVariants = (item.variants || []).map((variant) => {
      const rawImages = Array.isArray((variant as any).images)
        ? (variant as any).images
        : Array.isArray((variant as any).variantImages)
        ? (variant as any).variantImages
        : [];
      const normalizedImages = rawImages
        .filter((img): img is string => !!img && typeof img === "string" && img.trim() !== "")
        .map(processImageUrl)
        .filter(Boolean);
      const primaryImage =
        typeof (variant as any).image === "string" && (variant as any).image.trim()
          ? processImageUrl((variant as any).image)
          : normalizedImages[0] || undefined;
      return { ...variant, image: primaryImage, images: normalizedImages };
    });

    const variantImagePool = processedVariants
      .flatMap((v) => [v.image, ...(v.images || [])])
      .filter((x): x is string => typeof x === "string" && x.length > 0);

    const getDisplayImage = () => {
      if (processedProductImages.length > 0) return processedProductImages[0];
      const allVariantImages = processedVariants
        .flatMap((v) => [v.image, ...(v.images || [])])
        .filter((x): x is string => typeof x === "string" && x.length > 0);
      if (allVariantImages.length > 0) return allVariantImages[0];
      if (isDev) console.log("No valid images found for product, using default image");
      return phone;
    };

    const displayImage = getDisplayImage();

    // Calculate display price (aligned with ProductCard1)
    let displayPriceNum = 0;
    const productPriceNum = toNumber(item.basePrice);
    if ((item.basePrice === null || item.basePrice === undefined || productPriceNum === 0) && (item.variants?.length || 0) > 0) {
      const first = item.variants![0] as any;
      const variantBase = first?.price ?? first?.originalPrice ?? first?.basePrice ?? item.basePrice ?? 0;
      if (typeof first?.calculatedPrice === 'number' && isFinite(first.calculatedPrice)) {
        displayPriceNum = first.calculatedPrice as number;
      } else if (first?.discount && first?.discountType) {
        displayPriceNum = calculatePrice(variantBase, first.discount, String(first.discountType));
      } else if (item.discount && item.discountType) {
        displayPriceNum = calculatePrice(variantBase, item.discount, String(item.discountType));
      } else {
        displayPriceNum = toNumber(variantBase);
      }
    } else {
      if (item.discount && item.discountType) {
        displayPriceNum = calculatePrice(productPriceNum, item.discount, String(item.discountType));
      } else {
        displayPriceNum = productPriceNum;
      }
    }

    return {
      id: item.id,
      title: item.name || "Unknown Product",
      description: item.description || "No description available",
      originalPrice: item.basePrice?.toString() || "0",
      discount: item.discount ? `${item.discount}` : undefined,
      discountPercentage: item.discount ? `${item.discount}%` : "0%",
      price: displayPriceNum.toString(),
      rating: Number(averageRating) || 0,
      ratingCount: reviews?.length?.toString() || "0",
      isBestSeller: item.stock > 20,
      freeDelivery: true,
      image: displayImage,
      productImages:
        processedProductImages.length > 0
          ? processedProductImages
          : variantImagePool.length > 0
          ? variantImagePool
          : [phone],
      variants: processedVariants,
      category: item.subcategory?.category?.name || "Misc",
      subcategory: item.subcategory,
      brand: item.brand?.name || "Unknown",
      brand_id: item.brand?.id || null,
      status: item.status === "UNAVAILABLE" ? "OUT_OF_STOCK" : "AVAILABLE",
      stock: item.stock || 0,
    };
  } catch (error) {
    const isDev = Boolean((import.meta as any)?.env?.DEV);
    if (isDev) console.error("Error processing product:", error);
    // Fallback logic (unchanged for brevity, but includes same image processing)
    const processImageUrl = (imgUrl: string): string => {
      if (!imgUrl) return "";
      const trimmed = imgUrl.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("//")) return `https:${trimmed}`;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
        return trimmed;
      }
      const base = API_BASE_URL.replace(/\/?api\/?$/, "");
      const needsSlash = !trimmed.startsWith("/");
      const url = `${base}${needsSlash ? "/" : ""}${trimmed}`;
      return url.replace(/([^:]\/)\/+/g, "$1/");
    };

    const processedProductImages = (item.productImages || [])
      .filter((img): img is string => !!img && typeof img === "string" && img.trim() !== "")
      .map(processImageUrl)
      .filter(Boolean);

    const processedVariants = (item.variants || []).map((variant) => {
      const rawImages = Array.isArray((variant as any).images)
        ? (variant as any).images
        : Array.isArray((variant as any).variantImages)
        ? (variant as any).variantImages
        : [];
      const normalizedImages = rawImages
        .filter((img): img is string => !!img && typeof img === "string" && img.trim() !== "")
        .map(processImageUrl)
        .filter(Boolean);
      const primaryImage =
        typeof (variant as any).image === "string" && (variant as any).image.trim()
          ? processImageUrl((variant as any).image)
          : normalizedImages[0] || undefined;
      return { ...variant, image: primaryImage, images: normalizedImages };
    });

    const variantImagePool = processedVariants
      .flatMap((v) => [v.image, ...(v.images || [])])
      .filter((x): x is string => typeof x === "string" && x.length > 0);

    const getFallbackImage = () => {
      if (processedProductImages.length > 0) return processedProductImages[0];
      const allVariantImages = processedVariants
        .flatMap((v) => [v.image, ...(v.images || [])])
        .filter((x): x is string => typeof x === "string" && x.length > 0);
      if (allVariantImages.length > 0) return allVariantImages[0];
      return phone;
    };
    const displayImage = getFallbackImage();

    // Calculate display price for fallback
    let displayPriceNum = 0;
    const productPriceNum = toNumber(item.basePrice);
    if ((item.basePrice === null || item.basePrice === undefined || productPriceNum === 0) && (item.variants?.length || 0) > 0) {
      const first = item.variants![0] as any;
      const variantBase = first?.price ?? first?.originalPrice ?? first?.basePrice ?? item.basePrice ?? 0;
      if (typeof first?.calculatedPrice === 'number' && isFinite(first.calculatedPrice)) {
        displayPriceNum = first.calculatedPrice as number;
      } else if (first?.discount && first?.discountType) {
        displayPriceNum = calculatePrice(variantBase, first.discount, String(first.discountType));
      } else if (item.discount && item.discountType) {
        displayPriceNum = calculatePrice(variantBase, item.discount, String(item.discountType));
      } else {
        displayPriceNum = toNumber(variantBase);
      }
    } else {
      if (item.discount && item.discountType) {
        displayPriceNum = calculatePrice(productPriceNum, item.discount, String(item.discountType));
      } else {
        displayPriceNum = productPriceNum;
      }
    }

    return {
      id: item.id,
      title: item.name || "Unknown Product",
      description: item.description || "No description available",
      originalPrice: item.basePrice?.toString() || "0",
      discountPercentage: "0%",
      price: "0",
      rating: 0,
      ratingCount: "0",
      isBestSeller: false,
      freeDelivery: true,
      image: displayImage,
      category: "Misc",
      brand: "Unknown",
    };
  }
};

const SectionProducts: React.FC = () => {
  const { token } = useAuth();
  const { sectionId } = useParams<{ sectionId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInputValue, setSearchInputValue] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sectionName, setSectionName] = useState<string>("");
  const prevSearchQueryRef = useRef<string>("");
  const prevSearchInputValueRef = useRef<string>("");
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Initialize search and section name from URL parameters
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      const decodedSearch = decodeURIComponent(searchParam);
      if (decodedSearch !== prevSearchQueryRef.current) {
        setSearchQuery(decodedSearch);
        prevSearchQueryRef.current = decodedSearch;
      }
      if (decodedSearch !== prevSearchInputValueRef.current) {
        setSearchInputValue(decodedSearch);
        prevSearchInputValueRef.current = decodedSearch;
      }
    } else {
      if (prevSearchQueryRef.current !== "") {
        setSearchQuery("");
        prevSearchQueryRef.current = "";
      }
      if (prevSearchInputValueRef.current !== "") {
        setSearchInputValue("");
        prevSearchInputValueRef.current = "";
      }
    }
    const sectionNameParam = searchParams.get("sectionname");
    if (sectionNameParam) {
      const decodedSectionName = decodeURIComponent(sectionNameParam);
      setSectionName(decodedSectionName);
    }
  }, [searchParams]);

  // Fetch section products
  const { data: sectionData, isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ["sectionProducts", sectionId],
    queryFn: async () => {
      if (!sectionId) throw new Error("Section ID is required");
      const response = await apiRequest(`/api/homepage/${sectionId}`, token);
      let productsArray: ApiProduct[] = [];
      if (response?.success && Array.isArray(response.data)) {
        productsArray = response.data;
      } else if (Array.isArray(response)) {
        productsArray = response;
      }
      const processedProducts = await Promise.all(
        productsArray.map(async (item) => {
          try {
            return await processProductWithReview(item);
          } catch {
            return {
              id: item.id,
              title: item.name || "Unknown Product",
              description: item.description || "No description available",
              originalPrice: item.basePrice?.toString() || "0",
              discountPercentage: "0%",
              price: "0",
              rating: 0,
              ratingCount: "0",
              isBestSeller: false,
              freeDelivery: true,
              image: phone,
              category: "Misc",
              brand: "Unknown",
            };
          }
        })
      );
      return {
        title: response?.data?.[0]?.section?.title || sectionName || "Section Products",
        products: processedProducts,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!sectionId,
  });

  // Client-side filtering for price and search
  const filteredProducts = (sectionData?.products || []).filter((product) => {
    if (selectedPriceRange) {
      const maxPrice = parseFloat(selectedPriceRange);
      const productPrice = toNumber(product.price);
      if (isNaN(productPrice) || productPrice > maxPrice) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const productName = product.title?.toLowerCase() || "";
      const productDescription = product.description?.toLowerCase() || "";
      const productCategory = product.category?.toLowerCase() || "";
      const productBrand = product.brand?.toLowerCase() || "";
      return (
        productName.includes(query) ||
        productDescription.includes(query) ||
        productCategory.includes(query) ||
        productBrand.includes(query)
      );
    }
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = toNumber(a.price);
    const priceB = toNumber(b.price);
    if (isNaN(priceA) && isNaN(priceB)) return 0;
    if (isNaN(priceA)) return 1;
    if (isNaN(priceB)) return -1;
    if (sortBy === "low-to-high") return priceA - priceB;
    if (sortBy === "high-to-low") return priceB - priceA;
    return 0;
  });

  // Event handlers (unchanged)
  const handleSortChange = (newSort: string | undefined): void => {
    setSortBy(newSort || "all");
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchInputValue.trim();
    const newSearchParams = new URLSearchParams(searchParams);
    if (trimmedSearch) {
      newSearchParams.set("search", encodeURIComponent(trimmedSearch));
    } else {
      newSearchParams.delete("search");
    }
    setSearchParams(newSearchParams);
  };

  const handleClearSearch = () => {
    setSearchInputValue("");
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("search");
    setSearchParams(newSearchParams);
  };

  const toggleSidebar = (): void => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const clearAllFilters = (): void => {
    setSelectedPriceRange(undefined);
    setSortBy("all");
    setSearchInputValue("");
    const newSearchParams = new URLSearchParams();
    setSearchParams(newSearchParams);
  };

  const hasActiveFilters = selectedPriceRange !== undefined || sortBy !== "all" || searchQuery.trim() !== "";

  // Error state (unchanged)
  if (productsError) {
    return (
      <div className="shop-error">
        <Navbar />
        <div
          className="error-message"
          style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            margin: "2rem",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <h2 style={{ color: "#dc3545", marginBottom: "1rem" }}>Unable to Load Products</h2>
          <p style={{ marginBottom: "1rem" }}>
            {productsError instanceof Error ? productsError.message : "Unknown error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Refresh Page
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Render (updated)
  return (
    <>
      {!isSidebarOpen && <Navbar />}
      <ProductBanner />
      <CategorySlider />
      <div className="shop-max-width-container">
        <div className="shop-container">
          <div className="shop-header">
            <div className="shop-header-title">
              <h2 className="shop-title">
                {sectionName || sectionData?.title || "Section Products"}
              </h2>
            </div>
            <div className="shop-header-actions">
              <form onSubmit={handleSearchSubmit} className="section-search-form">
                <div className={`search-input-container ${searchInputValue ? "has-clear-button" : ""}`}>
                  <input
                    type="text"
                    value={searchInputValue}
                    onChange={handleSearchInputChange}
                    placeholder="Search products..."
                    className="search-input"
                  />
                  {searchInputValue && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="search-clear-button"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button type="submit" className="search-submit-button" aria-label="Search">
                  <Search size={16} />
                </button>
              </form>
              <div className="product-count">
                {isLoadingProducts ? "Loading..." : `${sortedProducts.length} products`}
              </div>
            </div>
          </div>
          <div className="shop-content">
            <div className="shop">
              <button
                className="filter-button"
                onClick={toggleSidebar}
                aria-label="Toggle filters"
              >
                <span className="filter-icon">
                  <Settings2 />
                </span>
              </button>
              <div
                className={`filter-sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
                onClick={toggleSidebar}
                aria-label="Close filters"
              />
              <div
                className={`filter-sidebar ${isSidebarOpen ? "open" : ""}`}
                ref={sidebarRef}
              >
                <div className="filter-sidebar__header">
                  <h3>Filter</h3>
                  <button
                    className="filter-sidebar__close"
                    onClick={toggleSidebar}
                    aria-label="Close filters"
                  >
                    ×
                  </button>
                </div>
                {hasActiveFilters && (
                  <div className="filter-sidebar__section">
                    <button
                      onClick={clearAllFilters}
                      className="sidebar-clear-all-button"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
                <div className="filter-sidebar__section">
                  <h4 className="filter-sidebar__section-title">Sort By</h4>
                  <div className="filter-sidebar__radio-list">
                    {[
                      { value: "all", label: "Default" },
                      { value: "low-to-high", label: "Price: Low to High" },
                      { value: "high-to-low", label: "Price: High to Low" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        className="filter-sidebar__radio-item"
                      >
                        <input
                          type="radio"
                          id={`sort-${option.value}`}
                          name="sort"
                          checked={sortBy === option.value}
                          onChange={() => handleSortChange(option.value)}
                        />
                        <label htmlFor={`sort-${option.value}`}>
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="filter-sidebar__section">
                  <h4 className="filter-sidebar__section-title">Price Range</h4>
                  <div className="filter-sidebar__radio-list">
                    {[
                      { value: undefined, label: "All Prices" },
                      { value: "1000", label: "Under Rs. 1,000" },
                      { value: "5000", label: "Under Rs. 5,000" },
                      { value: "10000", label: "Under Rs. 10,000" },
                      { value: "20000", label: "Under Rs. 20,000" },
                    ].map((option) => (
                      <div
                        key={option.value || "all"}
                        className="filter-sidebar__radio-item"
                      >
                        <input
                          type="radio"
                          id={`price-${option.value || "all"}`}
                          name="price"
                          checked={selectedPriceRange === option.value}
                          onChange={() => setSelectedPriceRange(option.value)}
                        />
                        <label htmlFor={`price-${option.value || "all"}`}>
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="shop-products">
                {isLoadingProducts ? (
                  Array(8)
                    .fill(null)
                    .map((_, index) => <ProductCardSkeleton key={index} count={1} />)
                ) : sortedProducts.length > 0 ? (
                  sortedProducts.map((product) => (
                    <ProductCard1 key={product.id} product={product} />
                  ))
                ) : (
                  <div className="shop-no-products">
                    <div
                      className="shop-no-products-icon"
                      style={{
                        opacity: 0.3,
                        animation: "bounce 1s infinite",
                      }}
                    >
                      📦
                    </div>
                    <h3
                      className="shop-no-products-title"
                      style={{ color: "#333", marginBottom: "0.75rem", fontSize: "1.5rem" }}
                    >
                      No products found
                    </h3>
                    <p
                      className="shop-no-products-text"
                      style={{
                        color: "#666",
                        marginBottom: "1.5rem",
                        fontSize: "1rem",
                        maxWidth: "400px",
                        margin: "0 auto 1.5rem",
                      }}
                    >
                      {searchQuery.trim()
                        ? `No products found matching "${searchQuery}". Try adjusting your search terms.`
                        : `No products available in this section.`}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        style={{
                          padding: "0.75rem 1.5rem",
                          backgroundColor: "#ff6b00",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "1rem",
                          transition: "all 0.2s ease",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#e05a00";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "#ff6b00";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
                        }}
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SectionProducts;