import { normalizeSearchTerm } from "./recentSearches";

export type CatalogSort =
  | "relevance"
  | "newest"
  | "price_low_high"
  | "price_high_low"
  | "discount_high_low"
  | "best_selling";

export interface CatalogFilters {
  search: string;
  categoryIds: number[];
  subcategoryIds: number[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  hasDeal?: boolean;
  dealIds: number[];
  bannerId?: number;
  sort: CatalogSort;
  page: number;
}

const parseIds = (value: string | null): number[] =>
  [...new Set((value ?? "").split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0))];

const parseNumber = (value: string | null, min = 0): number | undefined => {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min ? parsed : undefined;
};

const sorts: CatalogSort[] = [
  "relevance",
  "newest",
  "price_low_high",
  "price_high_low",
  "discount_high_low",
  "best_selling",
];

export const parseCatalogFilters = (params: URLSearchParams): CatalogFilters => {
  const requestedSort = params.get("sort") as CatalogSort | null;
  const search = normalizeSearchTerm(params.get("q") ?? params.get("search") ?? "");
  const sort = requestedSort && sorts.includes(requestedSort)
    ? requestedSort
    : "newest";
  return {
    search,
    categoryIds: parseIds(params.get("categoryId")),
    subcategoryIds: parseIds(params.get("subcategoryId")),
    minPrice: parseNumber(params.get("minPrice")),
    maxPrice: parseNumber(params.get("maxPrice")),
    minRating: parseNumber(params.get("minRating"), 1),
    hasDeal: params.get("hasDeal") === "true" ? true : undefined,
    dealIds: parseIds(params.get("dealId")),
    bannerId: parseNumber(params.get("bannerId"), 1),
    // Relevance has meaning only for a text search. Keep URLs and the selected
    // UI option truthful when a stale or hand-written URL omits the query.
    sort: sort === "relevance" && !search ? "newest" : sort,
    page: Math.max(1, Math.floor(parseNumber(params.get("page"), 1) ?? 1)),
  };
};

export const updateCatalogFilters = (
  current: CatalogFilters,
  updates: Partial<CatalogFilters>,
): CatalogFilters => {
  const next = {
    ...current,
    ...updates,
    page: updates.page ?? 1,
  };

  return {
    ...next,
    sort: next.sort === "relevance" && !next.search.trim() ? "newest" : next.sort,
  };
};

export const toggleCatalogSubcategoryFilter = (
  current: CatalogFilters,
  parentCategoryId: number,
  subcategoryId: number,
): Pick<CatalogFilters, "categoryIds" | "subcategoryIds"> => ({
  categoryIds: current.categoryIds.filter((id) => id !== parentCategoryId),
  subcategoryIds: current.subcategoryIds.includes(subcategoryId)
    ? current.subcategoryIds.filter((id) => id !== subcategoryId)
    : [...current.subcategoryIds, subcategoryId],
});

export const catalogFiltersToSearchParams = (filters: CatalogFilters): URLSearchParams => {
  const params = new URLSearchParams();
  const search = filters.search.trim();
  if (search) params.set("q", search);
  if (filters.categoryIds.length) params.set("categoryId", filters.categoryIds.join(","));
  if (filters.subcategoryIds.length) params.set("subcategoryId", filters.subcategoryIds.join(","));
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.minRating !== undefined) params.set("minRating", String(filters.minRating));
  if (filters.dealIds.length) params.set("dealId", filters.dealIds.join(","));
  else if (filters.hasDeal) params.set("hasDeal", "true");
  if (filters.bannerId !== undefined) params.set("bannerId", String(filters.bannerId));
  if (filters.sort !== "newest" && !(filters.sort === "relevance" && !search)) {
    params.set("sort", filters.sort);
  }
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
};

export interface CatalogCategoryForSearch {
  id: number;
  name: string;
  subcategories?: Array<{
    id: number;
    name: string;
  }>;
}

export const filterCatalogCategories = <T extends CatalogCategoryForSearch>(
  categories: T[],
  query: string,
): T[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return categories;

  return categories
    .map((category) => {
      const parentMatches = category.name.toLowerCase().includes(normalized);
      const matchingSubcategories =
        category.subcategories?.filter((subcategory) =>
          subcategory.name.toLowerCase().includes(normalized),
        ) ?? [];

      if (!parentMatches && matchingSubcategories.length === 0) return null;

      return {
        ...category,
        subcategories: parentMatches
          ? category.subcategories
          : matchingSubcategories,
      } as T;
    })
    .filter((category): category is T => category !== null);
};
