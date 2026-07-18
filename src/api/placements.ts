import axiosInstance from "./axiosInstance";

export const PLACEMENTS = {
	MEGA_MENU: "mega-menu",
	CATEGORY_GRID: "category-grid",
	HOMEPAGE: "homepage",
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
	subcategories: PlacementSubcategory[];
}

interface RawMegaMenuCategory {
	entityId: number;
	name: string;
	image: string | null;
	subcategories?: { entityId: number; name: string; image: string | null }[];
}

interface RawFlatItem {
	entityId: number;
	name: string;
	image: string | null;
	categoryId: number | null;
	categoryName: string | null;
}

interface RawHomepageRow {
	id: number;
	category: {
		id: number;
		name: string;
		image: string | null;
		subcategories: PlacementSubcategory[];
	};
}

/**
 * Categories for a placement, in merchandising order.
 *
 * Strict: a placement shows exactly what is configured. An empty placement
 * returns [] (the surface renders nothing) rather than falling back to the full
 * catalog — placements fully control every storefront surface. A failed request
 * also yields [] so the page degrades to empty instead of crashing.
 */
export const fetchPlacementCategories = async (slug: string): Promise<PlacementCategory[]> => {
	try {
		if (slug === PLACEMENTS.MEGA_MENU) {
			const response = await axiosInstance.get("/api/storefront/mega-menu");
			const rows: RawMegaMenuCategory[] = response.data?.data?.categories ?? [];
			return rows.map((row) => ({
				id: row.entityId,
				name: row.name,
				image: row.image ?? null,
				subcategories: (row.subcategories ?? []).map((sub) => ({
					id: sub.entityId,
					name: sub.name,
					image: sub.image ?? null,
				})),
			}));
		}

		if (slug === PLACEMENTS.HOMEPAGE) {
			const response = await axiosInstance.get("/api/home/category/section");
			const rows: RawHomepageRow[] = response.data?.data ?? [];
			return rows.map((row) => ({
				id: row.category.id,
				name: row.category.name,
				image: row.category.image ?? null,
				subcategories: row.category.subcategories ?? [],
			}));
		}

		// category-grid: a flat subcategory list. Wrapped one-per-group so
		// existing category-shaped consumers (which flatten immediately anyway)
		// need no changes, and array order is preserved exactly.
		const response = await axiosInstance.get("/api/storefront/category-grid");
		const rows: RawFlatItem[] = response.data?.data?.items ?? [];
		return rows.map((row) => ({
			id: row.categoryId ?? row.entityId,
			name: row.categoryName ?? "",
			image: null,
			subcategories: [{ id: row.entityId, name: row.name, image: row.image ?? null }],
		}));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.warn(`Placement ${slug} unavailable:`, message);
		return [];
	}
};
