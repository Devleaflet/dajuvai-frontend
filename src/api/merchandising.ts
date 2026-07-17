import axiosInstance from "./axiosInstance";

export type MerchTarget = "categories" | "subcategories";

export interface PlacementOption {
  code: string;
  label: string;
  sortOrder: number;
}

/**
 * One row of the admin merchandising list. The API names its id field
 * categoryId or subcategoryId depending on the target; the page only ever
 * needs "the thing being merchandised", so it is normalised to targetId here
 * and nowhere else.
 */
export interface MerchRow {
  targetId: number;
  name: string;
  image: string | null;
  parentName: string | null;
  inPlacement: boolean;
  displayOrder: number;
  visible: boolean;
  featured: boolean;
  pinned: boolean;
}

export interface PlacementConfigPatch {
  visible?: boolean;
  featured?: boolean;
  pinned?: boolean;
}

interface RawMerchRow {
  categoryId?: number;
  subcategoryId?: number;
  name: string;
  image: string | null;
  categoryName?: string | null;
  inPlacement: boolean;
  displayOrder: number;
  visible: boolean;
  featured: boolean;
  pinned: boolean;
}

const normalize = (row: RawMerchRow): MerchRow => ({
  targetId: (row.categoryId ?? row.subcategoryId)!,
  name: row.name,
  image: row.image ?? null,
  parentName: row.categoryName ?? null,
  inPlacement: row.inPlacement,
  displayOrder: row.displayOrder,
  visible: row.visible,
  featured: row.featured,
  pinned: row.pinned,
});

const idKey = (target: MerchTarget) =>
  target === "categories" ? "categoryId" : "subcategoryId";

export const fetchPlacements = async (): Promise<PlacementOption[]> => {
  const response = await axiosInstance.get("/api/placements");
  return response.data?.data ?? [];
};

export const fetchMerchRows = async (
  code: string,
  target: MerchTarget,
): Promise<MerchRow[]> => {
  const response = await axiosInstance.get(`/api/admin/placements/${code}/${target}`);
  return (response.data?.data ?? []).map(normalize);
};

export const addToPlacement = async (
  code: string,
  target: MerchTarget,
  targetId: number,
): Promise<void> => {
  await axiosInstance.post(`/api/admin/placements/${code}/${target}`, {
    [idKey(target)]: targetId,
  });
};

export const removeFromPlacement = async (
  code: string,
  target: MerchTarget,
  targetId: number,
): Promise<void> => {
  await axiosInstance.delete(`/api/admin/placements/${code}/${target}/${targetId}`);
};

export const updatePlacementConfig = async (
  code: string,
  target: MerchTarget,
  targetId: number,
  patch: PlacementConfigPatch,
): Promise<void> => {
  await axiosInstance.patch(`/api/admin/placements/${code}/${target}/${targetId}`, patch);
};

/** Sends the whole ordering. Array position becomes displayOrder. */
export const reorderPlacement = async (
  code: string,
  target: MerchTarget,
  orderedIds: number[],
): Promise<void> => {
  await axiosInstance.patch(
    `/api/admin/placements/${code}/${target}/reorder`,
    orderedIds.map((id, index) => ({ [idKey(target)]: id, displayOrder: index })),
  );
};
