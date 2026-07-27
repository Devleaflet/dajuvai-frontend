export type BannerSourceType = "hero" | "sidebar";

interface BannerSourceParams {
  sourceBannerId: number;
  sourceBannerType: BannerSourceType;
}

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
