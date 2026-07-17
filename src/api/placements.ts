import axiosInstance from "./axiosInstance";

export const PLACEMENTS = {
	MEGA_MENU: "MEGA_MENU",
	HOMEPAGE: "HOMEPAGE",
	MOBILE: "MOBILE",
	SEARCH: "SEARCH",
	CATEGORY_GRID: "CATEGORY_GRID",
	FEATURED: "FEATURED",
	DEALS: "DEALS",
} as const;

export interface PlacementSubcategory {
	id: number;
	name: string;
	image: string | null;
}

/**
 * Shaped like the /api/categories rows the components already consume, so a
 * component switches source by changing its queryFn and nothing else.
 */
export interface PlacementCategory {
	id: number;
	name: string;
	image: string | null;
	featured: boolean;
	pinned: boolean;
	subcategories: PlacementSubcategory[];
}

interface RawPlacementCategory {
	categoryId: number;
	name: string;
	image: string | null;
	featured: boolean;
	pinned: boolean;
	subcategories?: PlacementSubcategory[];
}

/**
 * Categories for a placement, in merchandising order.
 *
 * Strict: a placement shows exactly what is configured. An empty placement
 * returns [] (the surface renders nothing) rather than falling back to the full
 * catalog — placements fully control every storefront surface. A failed request
 * also yields [] so the page degrades to empty instead of crashing.
 */
export const fetchPlacementCategories = async (
	code: string,
): Promise<PlacementCategory[]> => {
	try {
		const response = await axiosInstance.get(`/api/placements/${code}/categories`);
		const rows: RawPlacementCategory[] = response.data?.data ?? [];

		return rows.map((row) => ({
			id: row.categoryId,
			name: row.name,
			image: row.image ?? null,
			featured: row.featured,
			pinned: row.pinned,
			subcategories: row.subcategories ?? [],
		}));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.warn(`Placement ${code} unavailable:`, message);
		return [];
	}
};
