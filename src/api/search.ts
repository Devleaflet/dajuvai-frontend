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

export interface SearchSuggestions {
  query: string;
  products: SearchProductSuggestion[];
  categories: SearchScopeSuggestion[];
  brands: SearchScopeSuggestion[];
  totalProducts: number;
}

export async function fetchSearchSuggestions(query: string, signal?: AbortSignal): Promise<SearchSuggestions> {
  const response = await axiosInstance.get<{ success: boolean; data: SearchSuggestions }>(
    "/api/search/suggestions",
    { params: { q: query }, signal },
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
