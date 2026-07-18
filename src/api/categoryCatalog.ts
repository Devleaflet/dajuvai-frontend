import { fetchPlacementCategories, PLACEMENTS } from "./placements";

/**
 * Homepage category catalog, sourced from the HOMEPAGE placement.
 *
 * The [{ id, category: {…} }] shape is what CategoryCatalogSection and
 * CategorySection already render, so it is preserved here rather than changed
 * in both components.
 */
export const fetchCategoryCatalog = async () => {
	const rows = await fetchPlacementCategories(PLACEMENTS.HOMEPAGE);

	return rows.map((row) => ({
		id: row.id,
		category: {
			id: row.id,
			name: row.name,
			image: row.image ?? "",
			subcategories: row.subcategories.map((sub) => ({
				id: sub.id,
				name: sub.name,
				image: sub.image ?? "",
			})),
		},
	}));
};
