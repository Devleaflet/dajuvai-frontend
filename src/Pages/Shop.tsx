import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../Components/Navbar";
import CategorySlider from "../Components/CategorySlider";
import Footer from "../Components/Footer";
import PageLoader from "../Components/PageLoader";
import { useQuery } from "@tanstack/react-query";
import { fetchReviewOf } from "../api/products";
import "../Styles/Shop.css";
import CategoryService from "../services/categoryService";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import type { Product } from "../Components/Types/Product";
import ProductCard1 from "../ALT/ProductCard1";
import ProductCardSkeleton from "../skeleton/ProductCardSkeleton";
import { API_BASE_URL } from "../config";
import { Search, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
// Interfaces (unchanged)
interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
}
interface Subcategory {
  id: number;
  name: string;
}
interface ProductFilters {
  categoryId?: number | undefined;
  subcategoryId?: number | undefined;
  brandId?: string | undefined;
  dealId?: string | undefined;
  bannerId?: string | undefined;
  sort?: string | undefined;
}
interface ApiProduct {
  id: number;
  name: string;
  description: string;
  basePrice: number | null;
  stock: number;
  discount: number | null;
  discountType: "PERCENTAGE" | "FLAT" | null;
  size: string[];
  status: "AVAILABLE" | "UNAVAILABLE";
  productImages: string[];
  inventory: {
    sku: string;
    quantity: number;
    status: string;
  }[];
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
    category?: {
      id: number;
      name: string;
    };
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
    district: {
      id: number;
      name: string;
    };
  };
  brand: {
    id: number;
    name: string;
  } | null;
  deal: {
    id: number;
    title: string;
  } | null;
}
// Utility functions (unchanged)
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
const apiRequest = async (
  endpoint: string,
  token: string | null | undefined = undefined
) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const textResponse = await response.text();
    if (
      textResponse.trim().startsWith("<!doctype html") ||
      textResponse.trim().startsWith("<html")
    ) {
      throw new Error(
        `API endpoint not found. The server returned HTML instead of JSON.`
      );
    }
    throw new Error(`Expected JSON response but received ${contentType}`);
  }
  return await response.json();
};
const buildQueryParams = (filters: ProductFilters): string => {
  const params = new URLSearchParams();
  if (filters.categoryId !== undefined && filters.categoryId !== null) {
    params.append("categoryId", filters.categoryId.toString());
  }
  if (filters.subcategoryId !== undefined && filters.subcategoryId !== null) {
    params.append("subcategoryId", filters.subcategoryId.toString());
  }
  if (filters.brandId !== undefined && filters.brandId !== null) {
    params.append("brandId", filters.brandId);
  }
  if (filters.dealId !== undefined && filters.dealId !== null) {
    params.append("dealId", filters.dealId);
  }
  if (filters.bannerId !== undefined && filters.bannerId !== null) {
    params.append("bannerId", filters.bannerId);
  }
  return params.toString();
};
const fetchProductsWithFilters = async (
  filters: ProductFilters,
  token: string | null | undefined = undefined
) => {
  if (filters.bannerId) {
    const bannerResponse = await apiRequest(`/api/banners/${filters.bannerId}`, token);
    if (bannerResponse?.data?.selectedProducts) {
      return { success: true, data: bannerResponse.data.selectedProducts };
    }
    return { success: true, data: [] };
  }
  
  const apiFilters = {
    categoryId: filters.categoryId,
    subcategoryId: filters.subcategoryId,
    brandId: filters.brandId,
    dealId: filters.dealId,
    bannerId: filters.bannerId
  };
  
  const queryParams = buildQueryParams(apiFilters);
  const endpoint = `/api/categories/all/products${queryParams ? `?${queryParams}` : ""}`;
  console.log("🔍 Fetching products with filters:", {
    filters: apiFilters,
    originalFilters: filters,
    queryParams,
    endpoint,
    fullUrl: `${API_BASE_URL}${endpoint}`,
    token: token ? "Present" : "Not present",
  });
  try {
    const response = await apiRequest(endpoint, token);
    console.log("✅ Products API response:", response);
    return response;
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    console.error("❌ Request details:", {
      endpoint,
      fullUrl: `${API_BASE_URL}${endpoint}`,
      filters: apiFilters,
      queryParams,
    });
    throw error;
  }
};
// Updated processProductWithReview function
const processProductWithReview = async (
  item: ApiProduct
): Promise<Product> => {
  try {
    const { averageRating, reviews } = await fetchReviewOf(item.id);
    const isDev = Boolean((import.meta as any)?.env?.DEV);
    if (isDev)
      console.log("Processing product:", {
        id: item.id,
        name: item.name,
        hasVariants: !!item.variants?.length,
        productImages: item.productImages,
        variants: item.variants?.map((v) => ({
          id: v.id,
          variantImages: v.images,
          variantImage: v.image,
        })),
      });
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
      return url.replace(/([^:]\/)\/+/g, "$1/");
    };
    const processedProductImages = (item.productImages || [])
      .filter(
        (img): img is string =>
          !!img && typeof img === "string" && img.trim() !== ""
      )
      .map(processImageUrl)
      .filter(Boolean);
    const processedVariants = (item.variants || []).map((variant) => {
      const rawImages = Array.isArray((variant as any).images)
        ? (variant as any).images
        : Array.isArray((variant as any).variantImages)
        ? (variant as any).variantImages
        : [];
      const normalizedImages = rawImages
        .filter(
          (img): img is string =>
            !!img && typeof img === "string" && img.trim() !== ""
        )
        .map(processImageUrl)
        .filter(Boolean);
      const primaryImage =
        typeof (variant as any).image === "string" &&
        (variant as any).image.trim()
          ? processImageUrl((variant as any).image)
          : normalizedImages[0] || undefined;
      return {
        ...variant,
        image: primaryImage,
        images: normalizedImages,
      };
    });
    const variantImagePool = processedVariants
      .flatMap((v) => [v.image, ...(v.images || [])])
      .filter((x): x is string => typeof x === "string" && x.length > 0);
    const getDisplayImage = () => {
      if (processedProductImages.length > 0) {
        return processedProductImages[0];
      }
      const allVariantImages = processedVariants
        .flatMap((v) => [v.image, ...(v.images || [])])
        .filter((x): x is string => typeof x === "string" && x.length > 0);
      if (allVariantImages.length > 0) return allVariantImages[0];
      if (isDev)
        console.log("No valid images found for product, using default image");
      return phone;
    };
    const displayImage = getDisplayImage();
    // Updated price calculation logic
    let displayPriceNum = 0;
    let originalPriceNum = 0;
    const productPriceNum = toNumber(item.basePrice);
    if ((item.basePrice === null || item.basePrice === undefined || productPriceNum === 0) && (item.variants?.length || 0) > 0) {
      const first = item.variants![0] as any;
      // Use the first variant's basePrice for original price
      const variantBase = toNumber(first?.basePrice ?? first?.price ?? first?.originalPrice ?? 0);
      originalPriceNum = variantBase;
      // Apply product-level discount to variant's basePrice
      if (item.discount && item.discountType) {
        displayPriceNum = calculatePrice(variantBase, item.discount, String(item.discountType));
      } else {
        displayPriceNum = variantBase;
      }
    } else {
      originalPriceNum = productPriceNum;
      if (item.discount && item.discountType) {
        displayPriceNum = calculatePrice(productPriceNum, item.discount, String(item.discountType));
      } else {
        displayPriceNum = productPriceNum;
      }
    }
    return {
      id: item.id,
      title: item.name,
      description: item.description,
      originalPrice: originalPriceNum.toString(),
      discount: item.discount ? `${item.discount}` : undefined,
      discountPercentage: item.discount ? `${item.discount}%` : "0%",
      price: displayPriceNum.toString(),
      rating: Number(averageRating) || 0,
      ratingCount: reviews?.length?.toString() || "0",
      isBestSeller: false,
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
      return url.replace(/([^:]\/)\/+/g, "$1/");
    };
    const processedProductImages = (item.productImages || [])
      .filter(
        (img): img is string =>
          !!img && typeof img === "string" && img.trim() !== ""
      )
      .map(processImageUrl)
      .filter(Boolean);
    const processedVariants = (item.variants || []).map((variant) => {
      const rawImages = Array.isArray((variant as any).images)
        ? (variant as any).images
        : Array.isArray((variant as any).variantImages)
        ? (variant as any).variantImages
        : [];
      const normalizedImages = rawImages
        .filter(
          (img): img is string =>
            !!img && typeof img === "string" && img.trim() !== ""
        )
        .map(processImageUrl)
        .filter(Boolean);
      const primaryImage =
        typeof (variant as any).image === "string" &&
        (variant as any).image.trim()
          ? processImageUrl((variant as any).image)
          : normalizedImages[0] || undefined;
      return {
        ...variant,
        image: primaryImage,
        images: normalizedImages,
      };
    });
    const variantImagePool = processedVariants
      .flatMap((v) => [v.image, ...(v.images || [])])
      .filter((x): x is string => typeof x === "string" && x.length > 0);
    const getFallbackImage = () => {
      if (processedProductImages.length > 0) {
        return processedProductImages[0];
      }
      const allVariantImages = processedVariants
        .flatMap((v) => [v.image, ...(v.images || [])])
        .filter((x): x is string => typeof x === "string" && x.length > 0);
      if (allVariantImages.length > 0) return allVariantImages[0];
      return phone;
    };
    const displayImage = getFallbackImage();
    // Fallback price calculation
    let displayPriceNum = 0;
    let originalPriceNum = 0;
    const productPriceNum = toNumber(item.basePrice);
    if ((item.basePrice === null || item.basePrice === undefined || productPriceNum === 0) && (item.variants?.length || 0) > 0) {
      const first = item.variants![0] as any;
      const variantBase = toNumber(first?.basePrice ?? first?.price ?? first?.originalPrice ?? 0);
      originalPriceNum = variantBase;
      displayPriceNum = item.discount && item.discountType
        ? calculatePrice(variantBase, item.discount, String(item.discountType))
        : variantBase;
    } else {
      originalPriceNum = productPriceNum;
      displayPriceNum = item.discount && item.discountType
        ? calculatePrice(productPriceNum, item.discount, String(item.discountType))
        : productPriceNum;
    }
    return {
      id: item.id,
      title: item.name || "Unknown Product",
      description: item.description || "No description available",
      originalPrice: originalPriceNum.toString(),
      discount: item.discount ? `${item.discount}` : undefined,
      discountPercentage: item.discount ? `${item.discount}%` : "0%",
      price: displayPriceNum.toString(),
      rating: 0,
      ratingCount: "0",
      isBestSeller: false,
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
  }
};
// Rest of the Shop component (unchanged)
const Shop: React.FC = () => {
  const { token } = useAuth();
  const { cartOpen } = useUI();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [subcategorySearch, setSubcategorySearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    number | undefined
  >(undefined);
  const [selectedBannerId, setSelectedBannerId] = useState<string | undefined>(
    undefined
  );
  const [sortBy, setSortBy] = useState<string>("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInputValue, setSearchInputValue] = useState<string>("");
  const [showMoreCategories, setShowMoreCategories] = useState<boolean>(false);
  const [showMoreSubcategories, setShowMoreSubcategories] =
    useState<boolean>(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] =
    useState<boolean>(false);
  const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] =
    useState<boolean>(false);
  const currentFilters: ProductFilters = {
    categoryId: selectedCategory,
    subcategoryId: selectedSubcategory,
    bannerId: selectedBannerId,
  };

  const queryKeyFilters = {
    ...currentFilters,
    sort: sortBy // Include sort in query key for proper cache management
  };
  const hasActiveFilters = Boolean(
    selectedCategory || 
    selectedSubcategory || 
    selectedBannerId || 
    searchQuery.trim() ||
    (sortBy && sortBy !== "all")
  );
  useEffect(() => {
    const categoryIdParam = searchParams.get("categoryId");
    const subcategoryIdParam = searchParams.get("subcategoryId");
    const bannerIdParam = searchParams.get("bannerId");
    const searchParam = searchParams.get("search");
    const sortParam = searchParams.get("sort");

    const newCategoryId = categoryIdParam ? Number(categoryIdParam) : undefined;
    setSelectedCategory(newCategoryId);
    const newSubcategoryId = subcategoryIdParam
      ? Number(subcategoryIdParam)
      : undefined;
    setSelectedSubcategory(newSubcategoryId);
    const newBannerId = bannerIdParam ? bannerIdParam : undefined;
    setSelectedBannerId(newBannerId);
    if (searchParam) {
      const decodedSearch = decodeURIComponent(searchParam);
      setSearchQuery(decodedSearch);
      setSearchInputValue(decodedSearch);
    } else {
      setSearchQuery("");
      setSearchInputValue("");
    }
  }, [searchParams]);
  useEffect(() => {
    const handleShopFiltersChanged = (event: CustomEvent) => {
      const { categoryId, subcategoryId, bannerId } = event.detail;
      const newSearchParams = new URLSearchParams(searchParams);
      if (categoryId) {
        newSearchParams.set("categoryId", categoryId.toString());
      } else {
        newSearchParams.delete("categoryId");
      }
      if (subcategoryId) {
        newSearchParams.set("subcategoryId", subcategoryId.toString());
      } else {
        newSearchParams.delete("subcategoryId");
      }
      if (bannerId) {
        newSearchParams.set("bannerId", bannerId.toString());
      } else {
        newSearchParams.delete("bannerId");
      }
      newSearchParams.delete("search");
      setSearchParams(newSearchParams);
    };
    window.addEventListener(
      "shopFiltersChanged",
      handleShopFiltersChanged as EventListener
    );
    return () => {
      window.removeEventListener(
        "shopFiltersChanged",
        handleShopFiltersChanged as EventListener
      );
    };
  }, [searchParams, setSearchParams]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSidebarOpen) {
        const target = event.target as Element;
        const isFilterButton = target.closest(".filter-button");
        const isOverlay = target.classList.contains("filter-sidebar-overlay");
        if (!isFilterButton && !isOverlay) {
          setIsSidebarOpen(false);
        }
      }
    };
    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSidebarOpen]);
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/categories", token);
        if (Array.isArray(response)) return response;
        if (response?.success && Array.isArray(response.data))
          return response.data;
        if (response?.data)
          return Array.isArray(response.data) ? response.data : [];
        return [];
      } catch {
        const categoryService = CategoryService.getInstance();
        return await categoryService.getAllCategories(token || undefined);
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const { data: subcategories = [], isLoading: isLoadingSubcategories } =
    useQuery({
      queryKey: ["subcategories", selectedCategory],
      queryFn: async () => {
        if (!selectedCategory) return [];
        try {
          const response = await apiRequest(
            `/api/categories/${selectedCategory}/subcategories`,
            token
          );
          if (response?.success && Array.isArray(response.data)) {
            return response.data
              .map((item: { id: number; name: string }) => ({
                id: item.id,
                name: item.name,
              }))
              .filter((item: Subcategory) => item.id && item.name);
          }
          return [];
        } catch {
          return [];
        }
      },
      enabled: !!selectedCategory,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery({
    // Use the comprehensive query key that includes sort for proper caching
    queryKey: ["products", queryKeyFilters],
    queryFn: async () => {
      console.log("🔄 Starting products query with filters:", currentFilters);
      console.log("🔄 Query key filters:", queryKeyFilters);
      try {
        const response = await fetchProductsWithFilters(currentFilters, token);
        let productsArray: ApiProduct[] = [];
        console.log("📦 Processing products response:", {
          hasResponse: !!response,
          responseType: typeof response,
          hasSuccess: response?.success,
          hasData: !!response?.data,
          dataIsArray: Array.isArray(response?.data),
          responseKeys: response ? Object.keys(response) : [],
        });
        if (response?.success && Array.isArray(response.data)) {
          productsArray = response.data;
          console.log(
            "✅ Using response.data array, length:",
            productsArray.length
          );
        } else if (Array.isArray(response)) {
          productsArray = response;
          console.log(
            "✅ Using response as array, length:",
            productsArray.length
          );
        } else {
          console.warn("⚠️ Unexpected response format:", response);
          productsArray = [];
        }
        console.log(
          "🔄 Processing products with reviews, count:",
          productsArray.length
        );
        const processedProducts = await Promise.all(
          productsArray.map(async (item, index) => {
            try {
              const processed = await processProductWithReview(item);
              console.log(
                `✅ Processed product ${index + 1}/${productsArray.length}:`,
                item.name
              );
              return processed;
            } catch (error) {
              console.error(
                `❌ Error processing product ${index + 1}:`,
                item.name,
                error
              );
              return {
                id: item.id,
                title: item.name || "Unknown Product",
                description: item.description || "No description available",
                originalPrice: "0",
                discount: item.discount ? `${item.discount}` : undefined,
                discountPercentage: item.discount ? `${item.discount}%` : "0%",
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
        console.log(
          "✅ Successfully processed all products, final count:",
          processedProducts.length
        );
        return processedProducts;
      } catch (error) {
        console.error("❌ Fatal error in products query:", error);
        console.log("🔍 Fallback condition check:", {
          hasCategoryId: !!currentFilters.categoryId,
          hasSubcategoryId: !!currentFilters.subcategoryId,
          hasBrandId: !!currentFilters.brandId,
          hasDealId: !!currentFilters.dealId,
          hasBannerId: !!currentFilters.bannerId,
          currentFilters,
        });
        if (
          currentFilters.categoryId ||
          currentFilters.subcategoryId ||
          currentFilters.brandId ||
          currentFilters.dealId ||
          currentFilters.bannerId
        ) {
          console.log(
            "🔄 Trying fallback: fetching all products without filters"
          );
          try {
            const fallbackResponse = await fetchProductsWithFilters({}, token);
            let fallbackProductsArray: ApiProduct[] = [];
            if (
              fallbackResponse?.success &&
              Array.isArray(fallbackResponse.data)
            ) {
              fallbackProductsArray = fallbackResponse.data;
            } else if (Array.isArray(fallbackResponse)) {
              fallbackProductsArray = fallbackResponse;
            }
            console.log(
              "✅ Fallback successful, got products:",
              fallbackProductsArray.length
            );
            const processedFallbackProducts = await Promise.all(
              fallbackProductsArray.map(async (item) => {
                try {
                  const processed = await processProductWithReview(item);
                  return processed;
                } catch {
                  return {
                    id: item.id,
                    title: item.name || "Unknown Product",
                    description: item.description || "No description available",
                    originalPrice: "0",
                    discount: item.discount ? `${item.discount}` : undefined,
                    discountPercentage: item.discount ? `${item.discount}%` : "0%",
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
            return processedFallbackProducts;
          } catch (fallbackError) {
            console.error("❌ Fallback also failed:", fallbackError);
            if (currentFilters.categoryId && currentFilters.subcategoryId) {
              console.log(
                "🔄 Trying second fallback: category only without subcategory"
              );
              try {
                const secondFallbackResponse = await fetchProductsWithFilters(
                  {
                    categoryId: currentFilters.categoryId,
                  },
                  token
                );
                let secondFallbackProductsArray: ApiProduct[] = [];
                if (
                  secondFallbackResponse?.success &&
                  Array.isArray(secondFallbackResponse.data)
                ) {
                  secondFallbackProductsArray = secondFallbackResponse.data;
                } else if (Array.isArray(secondFallbackResponse)) {
                  secondFallbackProductsArray = secondFallbackResponse;
                }
                console.log(
                  "✅ Second fallback successful, got products:",
                  secondFallbackProductsArray.length
                );
                const processedSecondFallbackProducts = await Promise.all(
                  secondFallbackProductsArray.map(async (item) => {
                    try {
                      const processed = await processProductWithReview(item);
                      return processed;
                    } catch {
                      return {
                        id: item.id,
                        title: item.name || "Unknown Product",
                        description:
                          item.description || "No description available",
                        originalPrice: "0",
                        discount: item.discount ? `${item.discount}` : undefined,
                        discountPercentage: item.discount ? `${item.discount}%` : "0%",
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
                return processedSecondFallbackProducts;
              } catch (secondFallbackError) {
                console.error(
                  "❌ Second fallback also failed:",
                  secondFallbackError
                );
              }
            }
            throw error;
          }
        } else {
          console.log("⚠️ No filters detected, not attempting fallback");
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.log(
        `🔄 Retrying products query (attempt ${failureCount + 1}/3):`,
        error
      );
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  const filteredProducts = (productsData || []).filter((product) => {
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
  const handleCategoryChange = (categoryId: number | undefined): void => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newSearchParams.set("categoryId", categoryId.toString());
    } else {
      newSearchParams.delete("categoryId");
      setCategorySearch("");
    }
    newSearchParams.delete("subcategoryId");
    newSearchParams.delete("bannerId");
    setSubcategorySearch("");
    setSelectedBannerId(undefined);
    newSearchParams.delete("search");
    setSearchParams(newSearchParams);
    if (window.innerWidth <= 992) {
      setIsSidebarOpen(false);
    }
  };
  const handleSubcategoryChange = (subcategoryId: number | undefined): void => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (subcategoryId) {
      newSearchParams.set("subcategoryId", subcategoryId.toString());
    } else {
      newSearchParams.delete("subcategoryId");
      setSubcategorySearch("");
    }
    newSearchParams.delete("bannerId");
    setSelectedBannerId(undefined);
    setSearchParams(newSearchParams);
    if (window.innerWidth <= 992) {
      setIsSidebarOpen(false);
    }
  };
  const handleSortChange = (newSort: string | undefined): void => {
    setSortBy(newSort || "all");

    // Update searchParams to include the sort parameter while preserving other filters
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSort && newSort !== "all") {
      newSearchParams.set("sort", newSort);
    } else {
      newSearchParams.delete("sort");
    }
    setSearchParams(newSearchParams);

    if (window.innerWidth <= 992) {
      setIsSidebarOpen(false);
    }
  };
  const toggleSidebar = (): void => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const clearAllFilters = (): void => {
    setSortBy("all");
    setSearchInputValue("");
    setCategorySearch("");
    setSubcategorySearch("");
    setSelectedBannerId(undefined);
    const newSearchParams = new URLSearchParams();
    setSearchParams(newSearchParams);
    if (window.innerWidth <= 992) {
      setIsSidebarOpen(false);
    }
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
    newSearchParams.delete("categoryId");
    newSearchParams.delete("subcategoryId");
    newSearchParams.delete("bannerId");
    setSelectedBannerId(undefined);
    setSearchParams(newSearchParams);
    if (window.innerWidth <= 992) {
      setIsSidebarOpen(false);
    }
  };
  const handleClearSearch = () => {
    setSearchInputValue("");
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("search");
    setSearchParams(newSearchParams);
  };
  const getCurrentCategoryName = (): string => {
    if (selectedCategory === undefined) return "All Categories";
    const category = categories.find(
      (cat: Category) => cat.id === selectedCategory
    );
    return category ? category.name : "Selected Category";
  };
  const getCurrentSubcategoryName = (): string | undefined => {
    if (selectedSubcategory === undefined) return undefined;
    const subcategory = subcategories.find(
      (sub: Subcategory) => sub.id === selectedSubcategory
    );
    return subcategory ? subcategory.name : "Selected Subcategory";
  };
  const getDisplayTitle = (): string => {
    if (searchQuery.trim()) {
      return `Search Results for "${searchQuery}"`;
    }
    if (selectedBannerId) {
      return "Special Offer Products";
    }
    return getCurrentCategoryName();
  };
  // Loading state management
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  if (loading) {
    return <PageLoader />;
  }
  if (productsError) {
    return (
      <>
        <Navbar />
        <div className="shop-error">
          <div className="error-message">
            <h2 className="error-title">Unable to Load Products</h2>
            <p className="error-text">
              {productsError instanceof Error
                ? productsError.message
                : "Unknown error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="error-refresh-button"
            >
              Refresh Page
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  return (
    <>
      <Navbar />
      <CategorySlider />
      <div className="shop-max-width-container">
        <div className="shop-container">
          <div className="shop-header">
            <div className="shop-header-title">
              <h2 className="shop-title">
                {getDisplayTitle()}
                {getCurrentSubcategoryName() && (
                  <span className="shop-subtitle">
                    {" > "}
                    {getCurrentSubcategoryName()}
                  </span>
                )}
              </h2>
            </div>
            {!cartOpen && (
              <div className="search-bar-container">
                <form
                  onSubmit={handleSearchSubmit}
                  className="search-form"
                >
                  <div
                    className={`search-input-container ${
                      searchInputValue ? "has-clear-button" : ""
                    }`}
                  >
                    <input
                      type="text"
                      value={searchInputValue}
                      onChange={handleSearchInputChange}
                      placeholder="Search for products, brands, or categories..."
                      className="search-input"
                    />
                    {searchInputValue && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="search-clear-button"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="search-button"
                  >
                    <span className="search-text">Search</span>
                    <Search
                      size={15}
                      color="white"
                      className="search-icon"
                    />
                  </button>
                </form>
              </div>
            )}
            <div className="product-count">
              {isLoadingProducts
                ? "Loading..."
                : `${sortedProducts.length} products`}
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
                className={`filter-sidebar-overlay ${
                  isSidebarOpen ? "open" : ""
                }`}
                onClick={toggleSidebar}
                aria-label="Close filters"
              />
              <div
                className={`filter-sidebar ${isSidebarOpen ? "open" : ""}`}
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
                {searchQuery.trim() && (
                  <div className="filter-sidebar__section">
                    <h4 className="filter-sidebar__section-title">Search</h4>
                    <div className="sidebar-search-display">
                      <strong>Searching for:</strong> "{searchQuery}"
                    </div>
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
                  <h4 className="filter-sidebar__section-title">
                    Categories
                    <button
                      className="dropdown-toggle"
                      onClick={() =>
                        setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                      }
                      aria-label="Toggle categories dropdown"
                    >
                      {isCategoryDropdownOpen ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </h4>
                  {isCategoryDropdownOpen && (
                    <div className="filter-sidebar__dropdown-content">
                      <div className="filter-sidebar__search-container filter-sidebar__search-container--categories">
                        <input
                          type="text"
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const match = categories.find((cat: Category) =>
                                cat.name
                                  .toLowerCase()
                                  .includes(categorySearch.toLowerCase())
                              );
                              if (match) {
                                handleCategoryChange(match.id);
                              }
                            }
                          }}
                          className="filter-sidebar__search-input"
                        />
                      </div>
                      <div className="filter-sidebar__checkbox-list">
                        {isLoadingCategories ? (
                          <p className="filter-sidebar__loading">
                            Loading categories...
                          </p>
                        ) : (
                          <>
                            <div className="filter-sidebar__checkbox-item">
                              <input
                                type="radio"
                                id="category-all"
                                name="category"
                                checked={selectedCategory === undefined}
                                onChange={() => handleCategoryChange(undefined)}
                              />
                              <label htmlFor="category-all">
                                All Categories
                              </label>
                            </div>
                            {categories
                              .filter((category: Category) =>
                                category.name
                                  .toLowerCase()
                                  .includes(categorySearch.toLowerCase())
                              )
                              .slice(
                                0,
                                selectedCategory === undefined
                                  ? showMoreCategories
                                    ? undefined
                                    : 5
                                  : undefined
                              )
                              .map((category: Category) => (
                                <div
                                  key={category.id}
                                  className="filter-sidebar__category-group"
                                >
                                  <div className="filter-sidebar__checkbox-item">
                                    <input
                                      type="radio"
                                      id={`category-${category.id}`}
                                      name="category"
                                      checked={selectedCategory === category.id}
                                      onChange={() =>
                                        handleCategoryChange(category.id)
                                      }
                                    />
                                    <label htmlFor={`category-${category.id}`}>
                                      {category.name}
                                    </label>
                                  </div>
                                </div>
                              ))}
                            {selectedCategory === undefined &&
                              categories.length > 5 && (
                                <button
                                  onClick={() =>
                                    setShowMoreCategories(!showMoreCategories)
                                  }
                                  className="view-more-categories-button"
                                >
                                  {showMoreCategories
                                    ? "View Less"
                                    : "View More"}
                                </button>
                              )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {selectedCategory !== undefined && (
                  <div className="filter-sidebar__section">
                    <h4 className="filter-sidebar__section-title">
                      Subcategories
                      <button
                        className="dropdown-toggle"
                        onClick={() =>
                          setIsSubCategoryDropdownOpen(
                            !isSubCategoryDropdownOpen
                          )
                        }
                        aria-label="Toggle subcategories dropdown"
                      >
                        {isSubCategoryDropdownOpen ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </h4>
                    {isSubCategoryDropdownOpen && (
                      <div className="filter-sidebar__dropdown-content">
                        <div className="filter-sidebar__search-container">
                          <input
                            type="text"
                            placeholder="Search subcategories..."
                            value={subcategorySearch}
                            onChange={(e) =>
                              setSubcategorySearch(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const match = subcategories.find(
                                  (sub: Subcategory) =>
                                    sub.name
                                      .toLowerCase()
                                      .includes(subcategorySearch.toLowerCase())
                                );
                                if (match) {
                                  handleSubcategoryChange(match.id);
                                }
                              }
                            }}
                            className="filter-sidebar__search-input"
                          />
                        </div>
                        <div className="filter-sidebar__checkbox-list">
                          {isLoadingSubcategories ? (
                            <p className="filter-sidebar__loading">
                              Loading subcategories...
                            </p>
                          ) : subcategories.length > 0 ? (
                            <>
                              <div className="filter-sidebar__checkbox-item">
                                <input
                                  type="radio"
                                  id="subcategory-all"
                                  name="subcategory"
                                  checked={selectedSubcategory === undefined}
                                  onChange={() =>
                                    handleSubcategoryChange(undefined)
                                  }
                                />
                                <label htmlFor="subcategory-all">
                                  All Subcategories
                                </label>
                              </div>
                              {subcategories
                                .filter((sub: Subcategory) =>
                                  sub.name
                                    .toLowerCase()
                                    .includes(subcategorySearch.toLowerCase())
                                )
                                .slice(0, showMoreSubcategories ? undefined : 5)
                                .map((subcategory: Subcategory) => (
                                  <div
                                    key={subcategory.id}
                                    className="filter-sidebar__checkbox-item"
                                  >
                                    <input
                                      type="radio"
                                      id={`subcategory-${subcategory.id}`}
                                      name="subcategory"
                                      checked={
                                        selectedSubcategory === subcategory.id
                                      }
                                      onChange={() =>
                                        handleSubcategoryChange(subcategory.id)
                                      }
                                    />
                                    <label
                                      htmlFor={`subcategory-${subcategory.id}`}
                                    >
                                      {subcategory.name}
                                    </label>
                                  </div>
                                ))}
                              {subcategories.length > 5 && (
                                <button
                                  onClick={() =>
                                    setShowMoreSubcategories(
                                      !showMoreSubcategories
                                    )
                                  }
                                  className="view-more-subcategories-button"
                                >
                                  {showMoreSubcategories
                                    ? "View Less"
                                    : "View More"}
                                </button>
                              )}
                            </>
                          ) : (
                            <p className="filter-sidebar__no-data">
                              No subcategories available
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="shop-products">
                {isLoadingProducts ? (
                  Array(8)
                    .fill(null)
                    .map((_, index) => (
                      <ProductCardSkeleton
                        key={index}
                        count={1}
                      />
                    ))
                ) : sortedProducts.length > 0 ? (
                  sortedProducts.map((product) => (
                    <ProductCard1
                      key={product.id}
                      product={product}
                    />
                  ))
                ) : (
                  <div className="shop-no-products">
                    <div className="shop-no-products-icon">📦</div>
                    <h3 className="shop-no-products-title">
                      No products found
                    </h3>
                    <p className="shop-no-products-text">
                      {searchQuery.trim()
                        ? `No products found matching "${searchQuery}". Try adjusting your search terms or browse categories.`
                        : selectedBannerId
                        ? "No products found for this special offer."
                        : selectedCategory === undefined
                        ? "No products available at the moment."
                        : `No products found in ${getCurrentCategoryName()}${
                            getCurrentSubcategoryName()
                              ? ` > ${getCurrentSubcategoryName()}`
                              : ""
                          }.`}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="shop-no-products-clear-button"
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
export default Shop;