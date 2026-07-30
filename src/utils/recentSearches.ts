const RECENT_SEARCHES_KEY = "dajuvai_recent_searches";
const MAX_RECENT_SEARCHES = 6;

export const normalizeSearchTerm = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/[^\p{L}\p{N}+\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const storage = (): Storage | null =>
  typeof window === "undefined" ? null : window.localStorage;

export function getRecentSearches(): string[] {
  try {
    const raw = storage()?.getItem(RECENT_SEARCHES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string").slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

const persist = (values: string[]) => {
  try {
    storage()?.setItem(RECENT_SEARCHES_KEY, JSON.stringify(values));
  } catch {
    // Search remains usable when storage is unavailable or full.
  }
};

export function saveRecentSearch(query: string): void {
  const normalized = normalizeSearchTerm(query);
  if (normalized.length < 2) return;
  persist([normalized, ...getRecentSearches().filter((value) => value !== normalized)].slice(0, MAX_RECENT_SEARCHES));
}

export function removeRecentSearch(query: string): void {
  const normalized = normalizeSearchTerm(query);
  persist(getRecentSearches().filter((value) => value !== normalized));
}

export function clearRecentSearches(): void {
  try {
    storage()?.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Search remains usable when storage is unavailable.
  }
}
