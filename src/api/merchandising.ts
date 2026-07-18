import axiosInstance from "./axiosInstance";

export type EntityType = "category" | "subcategory";

export interface PlacementOption {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: string;
}

export interface ItemRow {
  itemId: number;
  entityId: number;
  displayOrder: number;
  visible: boolean;
  name: string;
  image: string | null;
}

export interface MegaMenuCategoryRow extends ItemRow {
  subcategories: ItemRow[];
}

export interface FlatItemRow extends ItemRow {
  entityType: EntityType;
  categoryId: number | null;
  categoryName: string | null;
}

export type PlacementItems = { categories: MegaMenuCategoryRow[] } | { items: FlatItemRow[] };

export interface AvailableEntity {
  id: number;
  name: string;
  image: string | null;
}

export type AvailableItems =
  | { groups: { categoryId: number; categoryName: string; subcategories: AvailableEntity[] }[] }
  | { items: AvailableEntity[] };

export const fetchPlacements = async (): Promise<PlacementOption[]> => {
  const response = await axiosInstance.get("/api/placements");
  return response.data?.data ?? [];
};

export const fetchPlacementItems = async (slug: string): Promise<PlacementItems> => {
  const response = await axiosInstance.get(`/api/admin/placements/${slug}/items`);
  return response.data?.data ?? { items: [] };
};

export const fetchAvailableItems = async (
  slug: string,
  opts: { entityType?: EntityType; categoryId?: number } = {},
): Promise<AvailableItems> => {
  const response = await axiosInstance.get(`/api/admin/placements/${slug}/available-items`, {
    params: opts,
  });
  return response.data?.data ?? { items: [] };
};

/** Returns how many were actually added — duplicates/unknown ids are silently skipped. */
export const addItems = async (
  slug: string,
  items: { entityType: EntityType; entityId: number }[],
): Promise<number> => {
  const response = await axiosInstance.post(`/api/admin/placements/${slug}/items`, { items });
  return response.data?.addedCount ?? 0;
};

export const updateVisibility = async (slug: string, itemId: number, visible: boolean): Promise<void> => {
  await axiosInstance.patch(`/api/admin/placements/${slug}/items/${itemId}`, { visible });
};

export const removeItem = async (slug: string, itemId: number): Promise<void> => {
  await axiosInstance.delete(`/api/admin/placements/${slug}/items/${itemId}`);
};

/** Sends the whole ordering in one request. Array position becomes displayOrder. */
export const reorderPlacement = async (
  slug: string,
  items: { itemId: number; displayOrder: number }[],
): Promise<void> => {
  await axiosInstance.put(`/api/admin/placements/${slug}/reorder`, { items });
};
