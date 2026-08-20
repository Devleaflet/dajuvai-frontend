import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
  Filter,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ProductCard from "../Components/ProductCard";
import { Product } from "../Components/Types/Product";
import { Deal } from "../Components/Types/Deal";
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import CategorySlider from "../Components/CategorySlider";
import ProductBanner from "../Components/ProductBanner";
import ProductCardSkeleton from "../skeleton/ProductCardSkeleton";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import { cloudinaryUrl } from "../utils/cloudinaryImage";
import { fetchReviewOf } from "../api/products";
import CategoryService from "../services/categoryService";
import { dealApiService } from "../services/apiDeals";
import CatalogFilterPanel from "../Components/CatalogFilterPanel";
import defaultProductImage from "../assets/logo.webp";
import "../Styles/Shop.css";
import {
  CatalogFilters,
  CatalogSort,
  catalogFiltersToSearchParams,
  normalizeNestedCatalogFilters,
  parseCatalogFilters,
  updateCatalogFilters,
} from "../utils/catalogFilters";
import { normalizeSearchTerm } from "../utils/recentSearches";

interface ApiProduct {
  id: number;
  name: string;
  description: string;
  basePrice: number | null;
  stock: number;
  discount: number | null;
  discountType: "PERCENTAGE" | "FLAT" | null;
  discountAmount?: number | null;
  discountPercent?: number | null;
  size: string[];
  status: string;
  finalPrice: number;
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
    discountAmount?: number | null;
    discountPercent?: number | null;
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
  deal: { id: number; title: string; discountPercentage?: number } | null;
}

const sortOptions: Array<{ value: CatalogSort; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price_low_high", label: "Price: Low to high" },
  { value: "price_high_low", label: "Price: High to low" },
  { value: "discount_high_low", label: "Highest discount" },
  { value: "best_selling", label: "Best selling" },
];

const apiRequest = async (
  endpoint: string,
  token: string | null | undefined = undefined,
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
      `API request failed: ${response.status} ${response.statusText}`,
    );
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

    const processImageUrl = (imgUrl: string): string => {
      if (!imgUrl) return "";
      const trimmed = imgUrl.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("//")) return cloudinaryUrl(`https:${trimmed}`, "card");
      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/")
      ) {
        return cloudinaryUrl(trimmed, "card");
      }
      const base = API_BASE_URL.replace(/\/?api\/?$/, "");
      const needsSlash = !trimmed.startsWith("/");
      const url = `${base}${needsSlash ? "/" : ""}${trimmed}`;
      return cloudinaryUrl(url.replace(/([^:]\/)\/+/g, "$1/"), "card");
    };

    const processedProductImages = (item.productImages || [])
      .filter(
        (img): img is string =>
          !!img && typeof img === "string" && img.trim() !== "",
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
            !!img && typeof img === "string" && img.trim() !== "",
        )
        .map(processImageUrl)
        .filter(Boolean);
      const primaryImage =
        typeof (variant as any).image === "string" &&
        (variant as any).image.trim()
          ? processImageUrl((variant as any).image)
          : normalizedImages[0] || undefined;

      const vBasePrice = Number(variant.basePrice) || 0;
      const vFinalPrice = Number(variant.finalPrice) || vBasePrice;

      return {
        ...variant,
        image: primaryImage,
        images: normalizedImages,
        basePrice: vBasePrice,
        finalPrice: vFinalPrice,
        price: vFinalPrice,
        originalPrice: vBasePrice,
      };
    });

    const variantImagePool = processedVariants
      .flatMap((v) => [v.image, ...(v.images || [])])
      .filter((x): x is string => typeof x === "string" && x.length > 0);

    const getDisplayImage = () => {
      if (processedProductImages.length > 0) return processedProductImages[0];
      if (variantImagePool.length > 0) return variantImagePool[0];
      return defaultProductImage;
    };

    const displayImage = getDisplayImage();
    const basePrice = Number(item.basePrice) || 0;
    const finalPrice = Number(item.finalPrice) || basePrice;

    return {
      id: item.id,
      title: item.name || "Unknown Product",
      name: item.name || "Unknown Product",
      description: item.description || "No description available",
      basePrice,
      finalPrice,
      price: finalPrice,
      discount: Number(item.discount || 0),
      discountAmount: Number(item.discountAmount || 0),
      discountPercent: Number(item.discountPercent || 0),
      discountType: item.discountType,
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
            : [defaultProductImage],
      variants: processedVariants as any,
      hasVariants: processedVariants.length > 0,
      category: item.subcategory?.category?.name || "Misc",
      categoryId: item.categoryId || item.subcategory?.category?.id,
      subcategory: item.subcategory,
      subcategoryId: item.subcategory?.id,
      brand: item.brand?.name || "Unknown",
      brand_id: item.brand?.id || null,
      status: item.status === "UNAVAILABLE" ? "OUT_OF_STOCK" : "AVAILABLE",
      stock: item.stock || 0,
      deal: (item as any).deal || null,
      dealId: item.dealId || (item as any).deal?.id,
      ageRestriction: (item as any).ageRestriction ?? null,
      created_at: item.created_at,
    } as Product;
  } catch {
    return {
      id: item.id,
      title: item.name || "Unknown Product",
      name: item.name || "Unknown Product",
      description: item.description || "No description available",
      basePrice: Number(item.basePrice) || 0,
      finalPrice: Number(item.finalPrice) || Number(item.basePrice) || 0,
      price: Number(item.finalPrice) || Number(item.basePrice) || 0,
      discount: Number(item.discount || 0),
      rating: 0,
      ratingCount: "0",
      isBestSeller: false,
      freeDelivery: true,
      image: defaultProductImage,
      productImages: [defaultProductImage],
      category: "Misc",
      brand: "Unknown",
      hasVariants: false,
      deal: null,
      status: item.status === "UNAVAILABLE" ? "OUT_OF_STOCK" : "AVAILABLE",
    } as Product;
  }
};

const SectionProducts: React.FC = () => {
  const { token } = useAuth();
  const { sectionId } = useParams<{ sectionId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch categories tree for filters
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["catalog-categories"],
    queryFn: async () => {
      const service = CategoryService.getInstance();
      const roots = await service.getAllCategories();
      return Promise.all(
        roots.map(async (category) => ({
          ...category,
          subcategories: category.subcategories?.length
            ? category.subcategories
            : await service.getSubcategories(category.id),
        })),
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const filters = useMemo(
    () =>
      normalizeNestedCatalogFilters(
        parseCatalogFilters(searchParams),
        categories,
      ),
    [searchParams, categories],
  );

  const [searchInput, setSearchInput] = useState(filters.search);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => setSearchInput(filters.search), [filters.search]);

  // Fetch section products
  const {
    data: sectionData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery({
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
        productsArray.map((item) => processProductWithReview(item)),
      );
      const sectionNameParam = searchParams.get("sectionname");
      const title =
        response?.data?.[0]?.section?.title ||
        (sectionNameParam ? decodeURIComponent(sectionNameParam) : undefined) ||
        "Section Products";
      return {
        title,
        products: processedProducts,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!sectionId,
  });

  // Fetch deals for filter panel
  const { data: dealFilters, isLoading: dealsLoading } = useQuery({
    queryKey: ["catalog-deals"],
    queryFn: async (): Promise<{ deals: Deal[]; productCounts: Record<string, number> }> => {
      const response = await dealApiService.getAllDeals("ENABLED");
      return {
        deals: response.data?.deals ?? [],
        productCounts: response.data?.productCounts ?? {},
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const deals = dealFilters?.deals ?? [];
  const dealProductCounts = dealFilters?.productCounts ?? {};

  const updateFilters = (
    updates: Partial<CatalogFilters>,
    options?: { replace?: boolean },
  ) => {
    const nextParams = catalogFiltersToSearchParams(
      updateCatalogFilters(filters, updates),
    );
    const sectionNameParam = searchParams.get("sectionname");
    if (sectionNameParam) {
      nextParams.set("sectionname", sectionNameParam);
    }
    setSearchParams(nextParams, { replace: options?.replace });
  };

  const resetFilters = () => {
    const nextParams = new URLSearchParams();
    const sectionNameParam = searchParams.get("sectionname");
    if (sectionNameParam) {
      nextParams.set("sectionname", sectionNameParam);
    }
    setSearchParams(nextParams);
  };

  // Filter section products by all active filters
  const filteredProducts = useMemo(() => {
    const products = sectionData?.products || [];
    return products.filter((product) => {
      // Text search
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const productName = (product.title || product.name || "").toLowerCase();
        const productDesc = (product.description || "").toLowerCase();
        const productCat = (product.category || "").toLowerCase();
        const productBrand = (product.brand || "").toLowerCase();
        const matches =
          productName.includes(query) ||
          productDesc.includes(query) ||
          productCat.includes(query) ||
          productBrand.includes(query);
        if (!matches) return false;
      }

      // Categories filter
      if (filters.categoryIds.length > 0) {
        const prodCatId = (product as any).categoryId;
        if (prodCatId && !filters.categoryIds.includes(prodCatId)) {
          return false;
        }
      }

      // Subcategories filter
      if (filters.subcategoryIds.length > 0) {
        const prodSubId = (product as any).subcategoryId || (product as any).subcategory?.id;
        if (prodSubId && !filters.subcategoryIds.includes(prodSubId)) {
          return false;
        }
      }

      // Price filter
      const pPrice = Number(product.price ?? product.finalPrice ?? 0);
      if (filters.minPrice !== undefined && pPrice < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && pPrice > filters.maxPrice) {
        return false;
      }

      // Deals filter
      if (filters.hasDeal) {
        if (!product.deal) return false;
      }
      if (filters.dealIds.length > 0) {
        const pDealId = (product as any).dealId || product.deal?.id;
        if (!pDealId || !filters.dealIds.includes(pDealId)) {
          return false;
        }
      }

      return true;
    });
  }, [sectionData?.products, filters]);

  // Sort filtered products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (filters.sort === "price_low_high") {
      list.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    } else if (filters.sort === "price_high_low") {
      list.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    } else if (filters.sort === "discount_high_low") {
      list.sort(
        (a, b) =>
          Number(b.discountPercent ?? b.discount ?? 0) -
          Number(a.discountPercent ?? a.discount ?? 0),
      );
    } else if (filters.sort === "newest") {
      list.sort(
        (a, b) =>
          new Date((b as any).created_at || 0).getTime() -
          new Date((a as any).created_at || 0).getTime(),
      );
    }
    return list;
  }, [filteredProducts, filters.sort]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const search = normalizeSearchTerm(searchInput);
    updateFilters({ search, sort: search ? "relevance" : "newest" });
  };

  const visibleSortOptions =
    filters.search && sortedProducts.length > 0
      ? sortOptions
      : sortOptions.filter((option) => option.value !== "relevance");

  const selectedSort =
    filters.sort === "relevance" && !filters.search ? "newest" : filters.sort;

  const chips = useMemo(
    () =>
      [
        filters.search && {
          key: "search",
          label: `Search: ${filters.search}`,
          update: { search: "" },
        },
        ...filters.categoryIds.map((id) => ({
          key: `category-${id}`,
          label:
            categories.find((category) => category.id === id)?.name ??
            `Category ${id}`,
          update: {
            categoryIds: filters.categoryIds.filter((value) => value !== id),
          },
        })),
        ...filters.subcategoryIds.map((id) => ({
          key: `subcategory-${id}`,
          label:
            categories
              .flatMap((category) => category.subcategories ?? [])
              .find((subcategory) => subcategory.id === id)?.name ??
            `Subcategory ${id}`,
          update: {
            subcategoryIds: filters.subcategoryIds.filter(
              (value) => value !== id,
            ),
          },
        })),
        filters.minPrice !== undefined && {
          key: "min",
          label: `Min Rs ${filters.minPrice}`,
          update: { minPrice: undefined },
        },
        filters.maxPrice !== undefined && {
          key: "max",
          label: `Max Rs ${filters.maxPrice}`,
          update: { maxPrice: undefined },
        },
        filters.hasDeal &&
          filters.dealIds.length === 0 && {
            key: "deal",
            label: "Deals only",
            update: { hasDeal: undefined },
          },
        ...filters.dealIds.map((id) => ({
          key: `deal-${id}`,
          label: deals.find((deal) => deal.id === id)?.name ?? `Deal ${id}`,
          update: {
            dealIds: filters.dealIds.filter((dealId) => dealId !== id),
          },
        })),
      ].filter(Boolean) as Array<{
        key: string;
        label: string;
        update: Partial<CatalogFilters>;
      }>,
    [filters, categories, deals],
  );

  return (
    <>
      <Navbar />
      <div className="catalog-showcase">
        <ProductBanner />
        <CategorySlider />
      </div>

      <main className="catalog-page">
        <div className="catalog-page__inner">
          <div className="catalog-page__desktop-filters">
            <CatalogFilterPanel
              categories={categories}
              deals={deals}
              dealProductCounts={dealProductCounts}
              dealsLoading={dealsLoading}
              filters={filters}
              onChange={updateFilters}
              onReset={resetFilters}
            />
          </div>

          <section className="catalog-page__content">
            <header className="catalog-toolbar">
              <form onSubmit={submitSearch} className="catalog-toolbar__search">
                <Search size={18} />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search in section products..."
                  aria-label="Search section products"
                  maxLength={80}
                />
                <button type="submit">Search</button>
              </form>

              <label className="catalog-toolbar__sort">
                Sort By{" "}
                <select
                  value={selectedSort}
                  onChange={(event) =>
                    updateFilters({ sort: event.target.value as CatalogSort })
                  }
                >
                  {visibleSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </header>

            <div style={{ marginBottom: "1rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  margin: "0 0 0.25rem 0",
                }}
              >
                {sectionData?.title || "Section Products"}
              </h2>
              <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                Showing {sortedProducts.length} product
                {sortedProducts.length === 1 ? "" : "s"}
              </span>
            </div>

            {chips.length > 0 && (
              <div className="catalog-chips">
                {chips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => updateFilters(chip.update)}
                  >
                    {chip.label}
                    <X size={14} />
                  </button>
                ))}
                <button className="catalog-chips__clear" onClick={resetFilters}>
                  Clear all
                </button>
              </div>
            )}

            {productsError ? (
              <div className="catalog-state">
                <h2>Products could not load</h2>
                <p>
                  {productsError instanceof Error
                    ? productsError.message
                    : "Unknown error occurred"}
                </p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            ) : isLoadingProducts ? (
              <div className="catalog-grid">
                {Array.from({ length: 8 }, (_, index) => (
                  <ProductCardSkeleton key={index} count={1} />
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="catalog-grid">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="catalog-no-results" role="status">
                <div className="catalog-no-results__icon" aria-hidden="true">
                  <SearchX size={26} strokeWidth={1.8} />
                </div>
                <h2>No products found</h2>
                <p>
                  {filters.search.trim()
                    ? `No products match your search "${filters.search}". Try adjusting your search or filters.`
                    : `No products available in this section matching selected filters.`}
                </p>
                {chips.length > 0 && (
                  <button type="button" onClick={resetFilters}>
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <div className="catalog-mobile-actions">
        <button onClick={() => setSortOpen(true)}>
          <SlidersHorizontal size={18} />
          Sort
        </button>
        <button onClick={() => setFilterOpen(true)}>
          <Filter size={18} />
          Filter
        </button>
      </div>

      <Dialog.Root open={filterOpen} onOpenChange={setFilterOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="catalog-sheet__overlay" />
          <Dialog.Content className="catalog-sheet catalog-sheet--filter">
            <div className="catalog-sheet__header">
              <Dialog.Title>Filter products</Dialog.Title>
              <Dialog.Description className="catalog-sheet__description">
                Refine the products shown in this section.
              </Dialog.Description>
              <Dialog.Close asChild>
                <button
                  className="catalog-sheet__close"
                  aria-label="Close filters"
                >
                  <X />
                </button>
              </Dialog.Close>
            </div>
            <div className="catalog-sheet__body">
              <CatalogFilterPanel
                compact
                categories={categories}
                deals={deals}
                dealProductCounts={dealProductCounts}
                dealsLoading={dealsLoading}
                filters={filters}
                onChange={updateFilters}
                onReset={resetFilters}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={sortOpen} onOpenChange={setSortOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="catalog-sheet__overlay" />
          <Dialog.Content className="catalog-sheet catalog-sheet--sort">
            <div className="catalog-sheet__header">
              <Dialog.Title>Sort products</Dialog.Title>
              <Dialog.Description className="catalog-sheet__description">
                Choose how the products are ordered.
              </Dialog.Description>
              <Dialog.Close asChild>
                <button
                  className="catalog-sheet__close"
                  aria-label="Close sorting"
                >
                  <X />
                </button>
              </Dialog.Close>
            </div>
            <div className="catalog-sheet__body catalog-sheet__body--sort">
              {visibleSortOptions.map((option) => (
                <button
                  key={option.value}
                  className={
                    selectedSort === option.value
                      ? "catalog-sort-option catalog-sort-option--active"
                      : "catalog-sort-option"
                  }
                  onClick={() => {
                    updateFilters({ sort: option.value });
                    setSortOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Footer />
    </>
  );
};

export default SectionProducts;
