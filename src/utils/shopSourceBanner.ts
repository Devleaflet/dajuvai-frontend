export type ShopSourceBannerType = "hero" | "sidebar";

export interface ShopSourceBanner {
  id: number;
  type: ShopSourceBannerType;
}

export interface ShopSourceBannerRecord {
  id: number;
  type: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
}

const sourceBannerTypes = new Set<ShopSourceBannerType>(["hero", "sidebar"]);

export const parseShopSourceBanner = (
  params: URLSearchParams,
): ShopSourceBanner | undefined => {
  const id = Number(params.get("sourceBannerId"));
  const type = params.get("sourceBannerType") as ShopSourceBannerType | null;

  if (!Number.isInteger(id) || id < 1 || !type || !sourceBannerTypes.has(type)) {
    return undefined;
  }

  return { id, type };
};

export const isActiveShopSourceBanner = (
  banner: ShopSourceBannerRecord,
  source: ShopSourceBanner,
  now = new Date(),
): boolean => {
  if (banner.id !== source.id || banner.status !== "ACTIVE") return false;
  if (source.type === "hero" && banner.type !== "HERO") return false;
  if (source.type === "sidebar" && banner.type !== "SIDEBAR") return false;
  if (banner.startDate && new Date(banner.startDate) > now) return false;
  if (banner.endDate && new Date(banner.endDate) < now) return false;

  return true;
};
