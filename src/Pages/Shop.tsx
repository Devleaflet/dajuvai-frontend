import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../Components/ProductCard";
import { Product } from "../Components/Types/Product";
import { Deal } from "../Components/Types/Deal";
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import CategorySlider from "../Components/CategorySlider";
import ProductBannerSlider from "../Components/ProductBannerSlider";
import ProductCardSkeleton from "../skeleton/ProductCardSkeleton";
import defaultProductImage from "../assets/logo.webp";
import { API_BASE_URL } from "../config";
import CategoryService, { Category } from "../services/categoryService";
import { dealApiService } from "../services/apiDeals";
import "../Styles/Shop.css";
import {
  CatalogFilters,
  CatalogSort,
  catalogFiltersToSearchParams,
  filterCatalogCategories,
  parseCatalogFilters,
  toggleCatalogSubcategoryFilter,
  updateCatalogFilters,
} from "../utils/catalogFilters";

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
const sortOptions: Array<{ value: CatalogSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "price_low_high", label: "Price: Low to high" },
  { value: "price_high_low", label: "Price: High to low" },
  { value: "discount_high_low", label: "Highest discount" },
  { value: "best_selling", label: "Best selling" },
];

const toCardProduct = (raw: RawCatalogProduct): Product => {
  const variant = raw.hasVariants ? raw.variants?.[0] : undefined;
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
  const requests = Array.from({ length: filters.page }, (_, index) => {
    const params = catalogFiltersToSearchParams({
      ...filters,
      page: index + 1,
    });
    params.set("limit", String(PER_PAGE));
    return fetch(
      `${API_BASE_URL}/api/categories/all/products?${params.toString()}`,
    ).then(async (response) => {
      if (!response.ok)
        throw new Error("Could not load products. Please retry.");
      return response.json() as Promise<CatalogResponse>;
    });
  });
  const pages = await Promise.all(requests);
  const last = pages.at(-1);
  return {
    products: pages.flatMap((page) => (page.data ?? []).map(toCardProduct)),
    meta: last?.meta ?? {
      total: 0,
      page: 1,
      limit: PER_PAGE,
      totalPages: 0,
      hasNextPage: false,
    },
  };
};

interface FilterPanelProps {
  categories: Category[];
  deals: Deal[];
  dealProductCounts: Record<string, number>;
  dealsLoading?: boolean;
  filters: CatalogFilters;
  onChange: (updates: Partial<CatalogFilters>) => void;
  onReset: () => void;
  compact?: boolean;
}

const FilterPanel = ({
  categories,
  deals,
  dealProductCounts,
  dealsLoading,
  filters,
  onChange,
  onReset,
  compact,
}: FilterPanelProps) => {
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? "");
  const [categorySearch, setCategorySearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    () => new Set(filters.categoryIds),
  );
  useEffect(() => {
    setMinPrice(filters.minPrice?.toString() ?? "");
    setMaxPrice(filters.maxPrice?.toString() ?? "");
  }, [filters.minPrice, filters.maxPrice]);
  const visibleCategories = useMemo(
    () => filterCatalogCategories(categories, categorySearch),
    [categories, categorySearch],
  );

  useEffect(() => {
    if (!categorySearch.trim()) return;
    setExpandedCategories(
      new Set(visibleCategories.map((category) => category.id)),
    );
  }, [categorySearch, visibleCategories]);

  const toggleId = (key: "categoryIds" | "subcategoryIds", id: number) => {
    const selected = filters[key];
    const next = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    if (key === "categoryIds" && selected.includes(id)) {
      const childIds =
        categories
          .find((category) => category.id === id)
          ?.subcategories?.map((item) => item.id) ?? [];
      onChange({
        categoryIds: next,
        subcategoryIds: filters.subcategoryIds.filter(
          (child) => !childIds.includes(child),
        ),
      });
      return;
    }
    onChange({ [key]: next });
  };
  const toggleSubcategory = (parentCategoryId: number, subcategoryId: number) =>
    onChange(
      toggleCatalogSubcategoryFilter(filters, parentCategoryId, subcategoryId),
    );
  const applyPrice = () => {
    const min = minPrice.trim() === "" ? undefined : Number(minPrice);
    const max = maxPrice.trim() === "" ? undefined : Number(maxPrice);
    if (
      (min !== undefined && (!Number.isFinite(min) || min < 0)) ||
      (max !== undefined && (!Number.isFinite(max) || max < 0))
    )
      return;
    onChange({ minPrice: min, maxPrice: max });
  };
  const toggleCategoryExpanded = (categoryId: number) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <aside
      className={`catalog-filters ${compact ? "catalog-filters--sheet" : ""}`}
      aria-label="Product filters"
    >
      <div className="catalog-filters__heading">
        <h2>Filters</h2>
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
      <section className="catalog-filters__section">
        <h3>Categories</h3>
        <label className="catalog-filters__category-search">
          <Search size={15} />
          <input
            value={categorySearch}
            onChange={(event) => setCategorySearch(event.target.value)}
            placeholder="Search categories"
            aria-label="Search categories and subcategories"
          />
          {categorySearch && (
            <button
              type="button"
              onClick={() => setCategorySearch("")}
              aria-label="Clear category search"
            >
              <X size={14} />
            </button>
          )}
        </label>
        {visibleCategories.length === 0 && (
          <p className="catalog-filters__empty">No categories found</p>
        )}
        {visibleCategories.map((category) => (
          <div className="catalog-filters__category" key={category.id}>
            <div className="catalog-filters__category-row">
              <label className="catalog-control catalog-control--category">
                <input
                  type="checkbox"
                  checked={filters.categoryIds.includes(category.id)}
                  onChange={() => toggleId("categoryIds", category.id)}
                />
                <span>{category.name}</span>
              </label>
              {category.subcategories?.length > 0 && (
                <button
                  type="button"
                  className="catalog-filters__expander"
                  onClick={() => toggleCategoryExpanded(category.id)}
                  aria-label={`Show ${category.name} subcategories`}
                  aria-expanded={expandedCategories.has(category.id)}
                >
                  {expandedCategories.has(category.id) ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              )}
            </div>
            {expandedCategories.has(category.id) &&
              category.subcategories?.map((subcategory) => (
                <label
                  className="catalog-control catalog-control--subcategory"
                  key={subcategory.id}
                >
                  <input
                    type="checkbox"
                    checked={filters.subcategoryIds.includes(subcategory.id)}
                    onChange={() =>
                      toggleSubcategory(category.id, subcategory.id)
                    }
                  />
                  <span>{subcategory.name}</span>
                </label>
              ))}
          </div>
        ))}
      </section>
      <section className="catalog-filters__section">
        <h3>Price</h3>
        <div className="catalog-filters__price">
          <input
            inputMode="decimal"
            aria-label="Minimum price"
            placeholder="Min"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
          <span>to</span>
          <input
            inputMode="decimal"
            aria-label="Maximum price"
            placeholder="Max"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="catalog-filters__apply-price"
          onClick={applyPrice}
        >
          Apply price
        </button>
      </section>
      <section className="catalog-filters__section">
        <h3>Deals</h3>
        <label className="catalog-control">
          <input
            type="checkbox"
            checked={filters.hasDeal === true && filters.dealId === undefined}
            onChange={(event) =>
              onChange({
                hasDeal: event.target.checked ? true : undefined,
                dealId: undefined,
              })
            }
          />
          <span>Deals only</span>
        </label>
        {dealsLoading ? (
          <p className="catalog-filters__empty">Loading deals...</p>
        ) : deals.length > 0 ? (
          <div className="catalog-filters__deal-list">
            {deals.map((deal) => {
              const productCount = dealProductCounts[String(deal.id)] ?? 0;
              return (
                <label
                  className="catalog-control catalog-control--deal"
                  key={deal.id}
                >
                  <input
                    type="radio"
                    name={`deal-${compact ? "mobile" : "desktop"}`}
                    checked={filters.dealId === deal.id}
                    onChange={() =>
                      onChange({ dealId: deal.id, hasDeal: undefined })
                    }
                  />
                  <span>{deal.name}</span>
                  <strong>{Number(deal.discountPercentage)}%</strong>
                  <em>{productCount}</em>
                </label>
              );
            })}
            {filters.dealId !== undefined && (
              <button
                type="button"
                className="catalog-filters__clear-inline"
                onClick={() => onChange({ dealId: undefined })}
              >
                Clear selected deal
              </button>
            )}
          </div>
        ) : (
          <p className="catalog-filters__empty">No active deals</p>
        )}
      </section>
      {/* <section className="catalog-filters__section">
        <h3>Rating</h3>
        {[4, 3, 2, 1].map((rating) => (
          <label className="catalog-control" key={rating}>
            <input
              type="radio"
              name={`rating-${compact ? "mobile" : "desktop"}`}
              checked={filters.minRating === rating}
              onChange={() => onChange({ minRating: rating })}
            />
            <Star size={14} fill="currentColor" /> <span>{rating} and up</span>
          </label>
        ))}
        <label className="catalog-control">
          <input
            type="radio"
            name={`rating-${compact ? "mobile" : "desktop"}`}
            checked={filters.minRating === undefined}
            onChange={() => onChange({ minRating: undefined })}
          />
          <span>All ratings</span>
        </label>
      </section> */}
    </aside>
  );
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => parseCatalogFilters(searchParams),
    [searchParams],
  );
  const [searchInput, setSearchInput] = useState(filters.search);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  useEffect(() => setSearchInput(filters.search), [filters.search]);

  const updateFilters = (updates: Partial<CatalogFilters>) =>
    setSearchParams(
      catalogFiltersToSearchParams(updateCatalogFilters(filters, updates)),
    );
  const resetFilters = () => setSearchParams(new URLSearchParams());
  const { data: categories = [] } = useQuery({
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
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["catalog", filters],
    queryFn: () => fetchCatalog(filters),
    placeholderData: (previous) => previous,
  });
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
      filters.dealId === undefined && {
        key: "deal",
        label: "Deals only",
        update: { hasDeal: undefined },
      },
    filters.dealId !== undefined && {
      key: `deal-${filters.dealId}`,
      label:
        deals.find((deal) => deal.id === filters.dealId)?.name ??
        `Deal ${filters.dealId}`,
      update: { dealId: undefined },
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    update: Partial<CatalogFilters>;
  }>;
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  return (
    <>
      <Navbar />
      <div className="catalog-showcase">
        <ProductBannerSlider />
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
                />
                <button type="submit">Search</button>
              </form>
              <div className="catalog-toolbar__result" aria-live="polite">
                <strong>{data?.meta.total ?? 0}</strong>
                <span>products</span>
              </div>
              <label className="catalog-toolbar__sort">
                Sort{" "}
                <select
                  value={filters.sort}
                  onChange={(event) =>
                    updateFilters({ sort: event.target.value as CatalogSort })
                  }
                >
                  {sortOptions.map((option) => (
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
            ) : (
              <>
                <div className="catalog-grid">
                  {isLoading
                    ? Array.from({ length: 12 }, (_, index) => (
                        <ProductCardSkeleton key={index} count={1} />
                      ))
                    : data?.products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                </div>
                {!isLoading && data?.products.length === 0 && (
                  <div className="catalog-state">
                    <h2>No products found</h2>
                    <button onClick={resetFilters}>Clear filters</button>
                  </div>
                )}
                {data?.meta.hasNextPage && (
                  <div className="catalog-load-more">
                    <button
                      disabled={isFetching}
                      onClick={() => updateFilters({ page: filters.page + 1 })}
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
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  className={
                    filters.sort === option.value
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
