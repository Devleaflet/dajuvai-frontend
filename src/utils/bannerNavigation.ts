export type BannerSourceType = "hero" | "sidebar";

interface BannerSourceParams {
  sourceBannerId: number;
  sourceBannerType: BannerSourceType;
}

type BannerNavigationTarget = {
  id: number;
  productSource?: string | null;
  selectedCategory?: { id: number } | null;
  selectedSubcategory?: { id: number; category?: { id: number } | null } | null;
  selectedDeal?: { id: number } | null;
};

export const getBannerShopPath = (banner: BannerNavigationTarget): string => {
  const params = new URLSearchParams();

  if (banner.productSource === "category" && banner.selectedCategory?.id) {
    params.set("categoryId", banner.selectedCategory.id.toString());
  } else if (banner.productSource === "subcategory" && banner.selectedSubcategory?.id) {
    // The catalog API treats categoryId+subcategoryId as an OR, so sending both
    // widens the filter to the whole parent category. Subcategory alone is exact.
    params.set("subcategoryId", banner.selectedSubcategory.id.toString());
  } else if (banner.productSource === "deal" && banner.selectedDeal?.id) {
    params.set("dealId", banner.selectedDeal.id.toString());
  } else if (banner.productSource === "manual") {
    params.set("bannerId", banner.id.toString());
  }

  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
};

export const appendBannerSourceToShopLink = (
  link: string | null | undefined,
  { sourceBannerId, sourceBannerType }: BannerSourceParams,
): string | null => {
  const trimmedLink = link?.trim();
  if (!trimmedLink) return null;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";

  try {
    const url = new URL(trimmedLink, origin);
    const isSameOrigin = url.origin === origin;
    const isShopPage = url.pathname.replace(/\/+$/, "") === "/shop";

    if (!isSameOrigin || !isShopPage) return null;

    url.searchParams.set("sourceBannerId", sourceBannerId.toString());
    url.searchParams.set("sourceBannerType", sourceBannerType);

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};
