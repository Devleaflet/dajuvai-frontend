import { normalizeSearchTerm } from "./recentSearches.ts";

export const productSearchPath = (id: number): string => `/product-page/${id}`;

export const shopSearchPath = (query: string): string => {
  const normalizedQuery = normalizeSearchTerm(query);
  if (normalizedQuery.length < 2) return "/shop";

  const params = new URLSearchParams({
    search: normalizedQuery,
    sort: "relevance",
    page: "1",
  });
  return `/shop?${params.toString()}`;
};

export const shopCategorySearchPath = (categoryId: number): string =>
  `/shop?${new URLSearchParams({ categoryId: String(categoryId), sort: "relevance", page: "1" }).toString()}`;

export const shopSubcategorySearchPath = (subcategoryId: number): string =>
  `/shop?${new URLSearchParams({ subcategoryId: String(subcategoryId), sort: "relevance", page: "1" }).toString()}`;
