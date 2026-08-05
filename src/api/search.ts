import { useQuery } from "@tanstack/react-query";
import axiosInstance from "./axiosInstance";
import { normalizeSearchTerm } from "../utils/recentSearches";

export interface SearchProductSuggestion {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  effectivePrice: number;
  originalPrice: number;
  discountPercentage: number;
  averageRating: number;
  totalReviews: number;
  inStock: boolean;
  matchedVariant: { id: number; color?: string; size?: string } | null;
}

export interface SearchScopeSuggestion {
  id: number;
  name: string;
  image?: string | null;
}

export interface SearchResolvedFilters {
  categoryIds: number[];
  subcategoryIds: number[];
  brandNames: string[];
  keyword: string | null;
}

export interface SearchSuggestions {
  query: string;
  normalizedQuery?: string;
  resolvedFilters?: SearchResolvedFilters;
  products: SearchProductSuggestion[];
  categories: SearchScopeSuggestion[];
  subcategories?: SearchScopeSuggestion[];
  brands: SearchScopeSuggestion[];
  totalProducts: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export async function fetchSearchSuggestions(query: string, signal?: AbortSignal): Promise<SearchSuggestions> {
  const response = await axiosInstance.get<{ success: boolean; data: SearchSuggestions }>(
    "/api/search/catalog",
    { params: { q: query, mode: "suggest", limit: 8 }, signal },
  );
  return response.data.data;
}

export async function fetchSearchCatalog(
  query: string,
  signal?: AbortSignal,
  options?: {
    page?: number;
    limit?: number;
    sort?: string;
    categoryIds?: number[];
    subcategoryIds?: number[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    hasDeal?: boolean;
    dealIds?: number[];
    bannerId?: number;
  },
): Promise<SearchSuggestions> {
  const response = await axiosInstance.get<{ success: boolean; data: SearchSuggestions }>(
    "/api/search/catalog",
    {
      params: {
        q: query,
        mode: "catalog",
        page: options?.page ?? 1,
        limit: options?.limit ?? 40,
        sort: options?.sort ?? "relevance",
        categoryIds: options?.categoryIds?.length ? options.categoryIds.join(",") : undefined,
        subcategoryIds: options?.subcategoryIds?.length ? options.subcategoryIds.join(",") : undefined,
        minPrice: options?.minPrice,
        maxPrice: options?.maxPrice,
        minRating: options?.minRating,
        hasDeal: options?.hasDeal,
        dealIds: options?.dealIds?.length ? options.dealIds.join(",") : undefined,
        bannerId: options?.bannerId,
      },
      signal,
    },
  );
  return response.data.data;
}

export function useSearchSuggestions(query: string) {
  const normalizedQuery = normalizeSearchTerm(query);
  return useQuery({
    queryKey: ["search-suggestions", normalizedQuery],
    enabled: normalizedQuery.length >= 2,
    queryFn: ({ signal }) => fetchSearchSuggestions(normalizedQuery, signal),
    staleTime: 30_000,
    gcTime: 300_000,
    placeholderData: (previousData) => previousData,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
