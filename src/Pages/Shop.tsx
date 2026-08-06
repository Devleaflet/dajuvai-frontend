import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import ProductCard from "../Components/ProductCard";
import { Product } from "../Components/Types/Product";
import { Deal } from "../Components/Types/Deal";
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import CategorySlider from "../Components/CategorySlider";
import ProductBannerSlider from "../Components/ProductBannerSlider";
import ResponsiveBanner from "../Components/ResponsiveBanner";
import ProductCardSkeleton from "../skeleton/ProductCardSkeleton";
import defaultProductImage from "../assets/logo.webp";
import { API_BASE_URL } from "../config";
import { fetchSearchCatalog } from "../api/search";
import CategoryService, { Category } from "../services/categoryService";
import { dealApiService } from "../services/apiDeals";
import "../Styles/Shop.css";
import {
  CatalogFilters,
  CatalogSort,
  catalogFiltersToSearchParams,
  filterCatalogCategories,
  normalizeNestedCatalogFilters,
  parseCatalogFilters,
  selectCatalogCategoryFilter,
  toggleCatalogSubcategoryFilter,
  updateCatalogFilters,
} from "../utils/catalogFilters";
import { normalizeSearchTerm } from "../utils/recentSearches";
import {
  isActiveShopSourceBanner,
  parseShopSourceBanner,
  type ShopSourceBannerRecord,
} from "../utils/shopSourceBanner";

interface CatalogResponse {
  data: RawCatalogProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

interface DealsFilterResponse {
  deals: Deal[];
  productCounts: Record<string, number>;
}

interface ShopSourceBannerResponse {
  data: ShopSourceBannerRecord & {
    name: string;
    desktopImage: string | null;
    mobileImage: string | null;
  };
}

interface RawVariant {
  finalPrice?: number | string | null;
  basePrice?: number | string | null;
  images?: string[] | null;
  image?: string | null;
}

interface RawCatalogProduct {
  [key: string]: unknown;
  id?: number | string;
  name?: string;
  description?: string | null;
  hasVariants?: boolean;
  variants?: RawVariant[];
  effectivePrice?: number | string | null;
  finalPrice?: number | string | null;
  basePrice?: number | string | null;
  discount?: number | string | null;
  discountAmount?: number | string | null;
  discountPercent?: number | string | null;
  avgRating?: number | string | null;
  reviewCount?: number | string | null;
  count?: number | string | null;
  productImages?: string[];
  deal?: Product["deal"];
  status?: string;
}

const PER_PAGE = 24;
const catalogPageCache = new Map<string, Map<number, Product[]>>();
const MAX_CATALOG_CACHE_KEYS = 20;
const sortOptions: Array<{ value: CatalogSort; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price_low_high", label: "Price: Low to high" },
  { value: "price_high_low", label: "Price: High to low" },
  { value: "discount_high_low", label: "Highest discount" },
  { value: "best_selling", label: "Best selling" },
];

const toCardProduct = (raw: RawCatalogProduct): Product => {
  const variant = raw.hasVariants
    ? [...(raw.variants ?? [])].sort((left, right) => {
        const leftPrice = Number(
          left.finalPrice ?? left.basePrice ?? Number.POSITIVE_INFINITY,
        );
        const rightPrice = Number(
          right.finalPrice ?? right.basePrice ?? Number.POSITIVE_INFINITY,
        );
        return leftPrice - rightPrice;
      })[0]
    : undefined;
  const finalPrice = Number(
    raw.effectivePrice ??
      raw.finalPrice ??
      variant?.finalPrice ??
      raw.basePrice ??
      0,
  );
  return {
    ...raw,
    id: Number(raw.id),
    title: raw.name,
    name: raw.name,
    description: raw.description ?? "",
    price: finalPrice,
    basePrice: raw.basePrice ?? variant?.basePrice ?? finalPrice,
    finalPrice,
    discount: Number(raw.discount ?? 0),
    discountAmount: Number(raw.discountAmount ?? 0),
    discountPercent: Number(raw.discountPercent ?? 0),
    rating: Number(raw.avgRating ?? 0),
    ratingCount: String(raw.reviewCount ?? raw.count ?? 0),
    image:
      raw.productImages?.[0] ??
      variant?.images?.[0] ??
      variant?.image ??
      defaultProductImage,
    productImages: raw.productImages?.length
      ? raw.productImages
      : [defaultProductImage],
    hasVariants: Boolean(raw.hasVariants),
    deal: raw.deal ?? null,
    status: raw.status === "UNAVAILABLE" ? "OUT_OF_STOCK" : raw.status,
  } as Product;
};

const fetchCatalog = async (
  filters: CatalogFilters,
): Promise<{ products: Product[]; meta: CatalogResponse["meta"] }> => {
  const params = catalogFiltersToSearchParams(filters);
  params.set("limit", String(PER_PAGE));
  let rawProducts: RawCatalogProduct[];
  let meta: CatalogResponse["meta"];

  if (filters.search.trim()) {
    const searchPage = await fetchSearchCatalog(filters.search, undefined, {
      page: filters.page,
      limit: PER_PAGE,
      sort: [
        "relevance",
        "newest",
        "price_low_high",
        "price_high_low",
        "discount_high_low",
        "best_selling",
      ].includes(filters.sort)
        ? filters.sort
        : "relevance",
      categoryIds: filters.categoryIds,
      subcategoryIds: filters.subcategoryIds,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minRating: filters.minRating,
      hasDeal: filters.hasDeal,
      dealIds: filters.dealIds,
      bannerId: filters.bannerId,
    });
    rawProducts = searchPage.products.map((product) => ({
      id: product.id,
      name: product.name,
      effectivePrice: product.effectivePrice,
      basePrice: product.originalPrice,
      discountPercent: product.discountPercentage,
      avgRating: product.averageRating,
      reviewCount: product.totalReviews,
      productImages: product.thumbnailUrl ? [product.thumbnailUrl] : [],
      status: product.inStock ? "AVAILABLE" : "OUT_OF_STOCK",
    }));
    meta = {
      total: searchPage.totalProducts,
      page: searchPage.page ?? filters.page,
      limit: searchPage.limit ?? PER_PAGE,
      totalPages: searchPage.totalPages ?? 0,
      hasNextPage:
        (searchPage.page ?? filters.page) < (searchPage.totalPages ?? 0),
    };
  } else {
    const response = await fetch(
      `${API_BASE_URL}/api/categories/all/products?${params.toString()}`,
    );
    if (!response.ok) throw new Error("Could not load products. Please retry.");
    const page = (await response.json()) as CatalogResponse;
    rawProducts = page.data ?? [];
    meta = page.meta ?? {
      total: 0,
      page: 1,
      limit: PER_PAGE,
      totalPages: 0,
      hasNextPage: false,
    };
  }
  const cacheKey = catalogFiltersToSearchParams({
    ...filters,
    page: 1,
  }).toString();
  if (
    !catalogPageCache.has(cacheKey) &&
    catalogPageCache.size >= MAX_CATALOG_CACHE_KEYS
  ) {
    catalogPageCache.delete(catalogPageCache.keys().next().value as string);
  }
  const pages = catalogPageCache.get(cacheKey) ?? new Map<number, Product[]>();
  if (filters.page === 1) pages.clear();
  pages.set(filters.page, rawProducts.map(toCardProduct));
  catalogPageCache.set(cacheKey, pages);

  return {
    products: [...pages.entries()]
      .filter(([pageNumber]) => pageNumber <= filters.page)
      .sort(([left], [right]) => left - right)
      .flatMap(([, products]) => products),
    meta,
  };
};

const fetchShopSourceBanner = async (
  id: number,
): Promise<ShopSourceBannerResponse["data"]> => {
  const response = await fetch(`${API_BASE_URL}/api/banners/${id}`);
  if (!response.ok) throw new Error("Could not load source banner.");
  const payload = (await response.json()) as ShopSourceBannerResponse;
  return payload.data;
};

import CatalogFilterPanel from "../Components/CatalogFilterPanel";
const FilterPanel = CatalogFilterPanel;


const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
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
  const sourceBanner = useMemo(
    () => parseShopSourceBanner(searchParams),
    [searchParams],
  );
  const [searchInput, setSearchInput] = useState(filters.search);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  useEffect(() => setSearchInput(filters.search), [filters.search]);

  const updateFilters = (
    updates: Partial<CatalogFilters>,
    options?: { replace?: boolean },
  ) => {
    const nextParams = catalogFiltersToSearchParams(
      updateCatalogFilters(filters, updates),
    );
    if (sourceBanner) {
      nextParams.set("sourceBannerId", String(sourceBanner.id));
      nextParams.set("sourceBannerType", sourceBanner.type);
    }
    // Load-more pagination replaces the entry instead of pushing a new one, so
    // ScrollManager doesn't treat it as a fresh page and jump back to the top.
    setSearchParams(nextParams, { replace: options?.replace });
  };

  const resetFilters = () => setSearchParams(new URLSearchParams());
  const { data: dealFilters, isLoading: dealsLoading } = useQuery({
    queryKey: ["catalog-deals"],
    queryFn: async (): Promise<DealsFilterResponse> => {
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
  const sourceBannerQuery = useQuery({
    queryKey: ["shop-source-banner", sourceBanner?.id],
    queryFn: () => fetchShopSourceBanner(sourceBanner!.id),
    enabled: Boolean(sourceBanner),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const staticSourceBanner =
    sourceBannerQuery.data &&
    sourceBanner &&
    Boolean(sourceBannerQuery.data.desktopImage) &&
    isActiveShopSourceBanner(sourceBannerQuery.data, sourceBanner)
      ? sourceBannerQuery.data
      : undefined;
  // A sidebar-sourced banner carries a small (section-sized) image that would
  // look wrong stretched across the shop page, so it gets the full product
  // banner slider instead of the static hero-style banner slot.
  const showsSourceBannerSlot =
    sourceBanner?.type === "hero" &&
    (sourceBannerQuery.isLoading || Boolean(staticSourceBanner));
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["catalog", filters],
    queryFn: () => fetchCatalog(filters),
    // Normalization needs the category tree to drop a parent category that is
    // redundant with one of its own selected subcategories (the catalog API ORs
    // category+subcategory ids). Waiting for categories prevents a first fetch
    // with the un-normalized filter set.
    enabled: !categoriesLoading,
    placeholderData: (previous) => previous,
  });
  // A manual banner can keep same bannerId while admin replaces its products.
  // Every click creates a new history key; refetch prevents React Query from
  // rendering catalog data cached for the previous selection.
  useEffect(() => {
    if (filters.bannerId !== undefined) void refetch();
  }, [filters.bannerId, location.key, refetch]);
  const displayProducts = data?.products ?? [];
  const noResultsFallbackFilters = useMemo<CatalogFilters>(
    () => ({
      ...filters,
      // Keep the selected shop facets and sort/page controls, but remove the
      // unmatched text term so the fallback is the normal catalog query.
      search: "",
      sort: filters.sort === "relevance" ? "newest" : filters.sort,
    }),
    [filters],
  );
  // Do not fetch the fallback while the searched catalog is still loading. The
  // catalog query keeps previous data as a placeholder, so `isFetching` is
  // required to avoid briefly showing unrelated products during a new search.
  const hasNoSearchResults = Boolean(
    filters.search.trim() &&
    data &&
    !isFetching &&
    displayProducts.length === 0,
  );
  const {
    data: noResultsFallbackData,
    isLoading: noResultsFallbackLoading,
    isError: noResultsFallbackError,
    refetch: refetchNoResultsFallback,
  } = useQuery({
    queryKey: ["catalog-no-results-fallback", noResultsFallbackFilters],
    queryFn: () => fetchCatalog(noResultsFallbackFilters),
    enabled: hasNoSearchResults,
    staleTime: 60 * 1000,
    retry: 1,
  });
  const noResultsFallbackProducts = noResultsFallbackData?.products ?? [];
  const visibleSortOptions =
    filters.search && !hasNoSearchResults
      ? sortOptions
      : sortOptions.filter((option) => option.value !== "relevance");
  const selectedSort =
    hasNoSearchResults && filters.sort === "relevance"
      ? "newest"
      : filters.sort;
  const selectedSortLabel =
    sortOptions
      .find((option) => option.value === selectedSort)
      ?.label.toLowerCase() ?? "newest";
  const chips = [
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
        subcategoryIds: filters.subcategoryIds.filter((value) => value !== id),
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
    filters.minRating !== undefined && {
      key: "rating",
      label: `${filters.minRating}+ stars`,
      update: { minRating: undefined },
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
      update: { dealIds: filters.dealIds.filter((dealId) => dealId !== id) },
    })),
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    update: Partial<CatalogFilters>;
  }>;
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const search = normalizeSearchTerm(searchInput);
    updateFilters({ search, sort: search ? "relevance" : "newest" });
  };

  return (
    <>
      <Navbar />
      <div className="catalog-showcase">
        {showsSourceBannerSlot ? (
          staticSourceBanner ? (
            <div className="shop-source-banner">
              <ResponsiveBanner
                type="hero"
                desktopImageUrl={staticSourceBanner.desktopImage ?? ""}
                mobileImageUrl={staticSourceBanner.mobileImage}
                altText={staticSourceBanner.name}
                priority
                className="shop-source-banner__media"
              />
            </div>
          ) : (
            <div
              className="shop-source-banner shop-source-banner--loading"
              aria-busy="true"
            />
          )
        ) : (
          <ProductBannerSlider />
        )}
        <CategorySlider />
      </div>
      <main className="catalog-page">
        <div className="catalog-page__inner">
          <div className="catalog-page__desktop-filters">
            <FilterPanel
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
                  placeholder="Search products"
                  aria-label="Search products"
                  maxLength={80}
                />
                <button type="submit">Search</button>
              </form>
              {/* products count */}
              {/* <div className="catalog-toolbar__result" aria-live="polite">
                <strong>{data?.meta.total ?? 0}</strong>
                <span>products</span>
              </div> */}
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
            {isError ? (
              <div className="catalog-state">
                <h2>Products could not load</h2>
                <button onClick={() => refetch()}>Retry</button>
              </div>
            ) : hasNoSearchResults ? (
              <>
                <div
                  className="catalog-no-results"
                  role="status"
                  aria-live="polite"
                >
                  <div className="catalog-no-results__icon" aria-hidden="true">
                    <SearchX size={26} strokeWidth={1.8} />
                  </div>
                  <h2>No exact matches for “{filters.search}”</h2>
                  <p>
                    We couldn’t find a product matching that search. Browse all
                    catalog products below using filters and sorting.
                  </p>
                  <button type="button" onClick={resetFilters}>
                    Browse all products
                  </button>
                </div>
                <section className="catalog-fallback" aria-label="All products">
                  <div className="catalog-fallback__heading">
                    <div>
                      <h2>All products</h2>
                      <p>
                        Browse the full catalog, sorted by {selectedSortLabel}
                      </p>
                    </div>
                    {noResultsFallbackData?.meta.total !== undefined && (
                      <span>
                        {noResultsFallbackData.meta.total.toLocaleString()}{" "}
                        products
                      </span>
                    )}
                  </div>
                  {noResultsFallbackError ? (
                    <div className="catalog-state catalog-state--compact">
                      <h2>Latest products could not load</h2>
                      <button
                        type="button"
                        onClick={() => refetchNoResultsFallback()}
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="catalog-grid">
                      {noResultsFallbackLoading
                        ? Array.from({ length: 8 }, (_, index) => (
                            <ProductCardSkeleton key={index} count={1} />
                          ))
                        : noResultsFallbackProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                          ))}
                    </div>
                  )}
                  {noResultsFallbackData?.meta.hasNextPage && (
                    <div className="catalog-load-more">
                      <button
                        type="button"
                        disabled={noResultsFallbackLoading || isFetching}
                        onClick={() =>
                          updateFilters(
                            { page: filters.page + 1 },
                            { replace: true },
                          )
                        }
                      >
                        {noResultsFallbackLoading || isFetching
                          ? "Loading..."
                          : "Load more"}
                      </button>
                    </div>
                  )}
                  {!noResultsFallbackLoading &&
                    !noResultsFallbackError &&
                    noResultsFallbackProducts.length === 0 && (
                      <div className="catalog-state catalog-state--compact">
                        <h2>No products are available right now</h2>
                      </div>
                    )}
                </section>
              </>
            ) : (
              <>
                <div className="catalog-grid">
                  {!data || (isFetching && displayProducts.length === 0)
                    ? Array.from({ length: 12 }, (_, index) => (
                        <ProductCardSkeleton key={index} count={1} />
                      ))
                    : displayProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                </div>
                {!isLoading && !isFetching && displayProducts.length === 0 && (
                  <div className="catalog-state">
                    <h2>No products found</h2>
                    <button onClick={resetFilters}>Clear filters</button>
                  </div>
                )}
                {data?.meta.hasNextPage && (
                  <div className="catalog-load-more">
                    <button
                      disabled={isFetching}
                      onClick={() =>
                        updateFilters(
                          { page: filters.page + 1 },
                          { replace: true },
                        )
                      }
                    >
                      {isFetching ? "Loading..." : "Load more"}
                    </button>
                  </div>
                )}
              </>
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
                Refine the products shown in the shop.
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
              <FilterPanel
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

export default Shop;
