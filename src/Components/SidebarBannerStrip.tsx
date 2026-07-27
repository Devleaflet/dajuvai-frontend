import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ResponsiveBanner from "./ResponsiveBanner";
import { API_BASE_URL } from "../config";
import { appendBannerSourceToShopLink } from "../utils/bannerNavigation";

interface SidebarBanner {
  id: number;
  name: string;
  desktopImage: string;
  mobileImage: string | null;
  placementAfterSection: number | null;
  productSource?: string;
  selectedCategory?: { id: number; name?: string } | null;
  selectedSubcategory?: { id: number; category?: { id: number } } | null;
  externalLink?: string | null;
}

interface RawBannerResponse {
  id: number;
  name: string;
  type: string;
  status: string;
  desktopImage: string | null;
  mobileImage: string | null;
  startDate?: string;
  endDate?: string;
  placementAfterSection: number | null;
  productSource?: string;
  selectedCategory?: { id: number; name?: string } | null;
  selectedSubcategory?: { id: number; category?: { id: number } } | null;
  externalLink?: string | null;
}

const fetchSidebarBanners = async (): Promise<SidebarBanner[]> => {
  const response = await fetch(`${API_BASE_URL}/api/banners`);
  if (!response.ok) {
    throw new Error(`Failed to fetch banners: ${response.statusText}`);
  }
  const data: { data?: RawBannerResponse[] } = await response.json();

  return (data.data || [])
    .filter(
      (banner) =>
        banner.type === "SIDEBAR" &&
        banner.status === "ACTIVE" &&
        !!banner.desktopImage &&
        banner.placementAfterSection != null &&
        (!banner.startDate || new Date(banner.startDate) <= new Date()) &&
        (!banner.endDate || new Date(banner.endDate) >= new Date()),
    )
    .map((banner) => ({
      id: banner.id,
      name: banner.name,
      desktopImage: banner.desktopImage,
      mobileImage: banner.mobileImage,
      placementAfterSection: banner.placementAfterSection,
      productSource: banner.productSource,
      selectedCategory: banner.selectedCategory,
      selectedSubcategory: banner.selectedSubcategory,
      externalLink: banner.externalLink,
    }));
};

interface SidebarBannerStripProps {
  placementAfterSection: number;
}

const SidebarBannerStrip: React.FC<SidebarBannerStripProps> = ({
  placementAfterSection,
}) => {
  const navigate = useNavigate();
  const [brokenImageIds, setBrokenImageIds] = useState<Set<number>>(new Set());

  const { data: banners = [] } = useQuery<SidebarBanner[], Error>({
    queryKey: ["sidebarBanners"],
    queryFn: fetchSidebarBanners,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, err) => {
      if (err.message.includes("404") || err.message.includes("400")) return false;
      return failureCount < 3;
    },
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  });

  // First match wins if two banners are misconfigured onto the same slot —
  // keeps rendering deterministic without needing a separate sortOrder field.
  const banner = banners.find(
    (b) => b.placementAfterSection === placementAfterSection && !brokenImageIds.has(b.id),
  );

  if (!banner) return null;

  const getBannerShopUrl = () => {
    const params = new URLSearchParams({
      sourceBannerId: banner.id.toString(),
      sourceBannerType: "sidebar",
    });

    if (banner.productSource === "category" && banner.selectedCategory) {
      params.set("categoryId", banner.selectedCategory.id.toString());
    } else if (
      banner.productSource === "subcategory" &&
      banner.selectedSubcategory
    ) {
      const catId = banner.selectedSubcategory.category?.id;
      if (catId) params.set("categoryId", catId.toString());
      params.set("subcategoryId", banner.selectedSubcategory.id.toString());
    } else if (banner.productSource === "manual") {
      params.set("bannerId", banner.id.toString());
    }

    return `/shop?${params.toString()}`;
  };

  const handleClick = () => {
    if (banner.productSource === "category" && banner.selectedCategory) {
      navigate(getBannerShopUrl());
    } else if (
      banner.productSource === "subcategory" &&
      banner.selectedSubcategory
    ) {
      navigate(getBannerShopUrl());
    } else if (banner.productSource === "manual") {
      navigate(getBannerShopUrl());
    } else if (banner.productSource === "external" && banner.externalLink) {
      const url = appendBannerSourceToShopLink(banner.externalLink, {
        sourceBannerId: banner.id,
        sourceBannerType: "sidebar",
      });

      if (url) {
        navigate(url);
      } else {
        window.open(banner.externalLink, "_blank", "noopener,noreferrer");
      }
    } else {
      navigate(getBannerShopUrl());
    }
  };

  return (
    <ResponsiveBanner
      type="section"
      desktopImageUrl={banner.desktopImage}
      mobileImageUrl={banner.mobileImage}
      altText={banner.name}
      onClick={handleClick}
      onError={() =>
        setBrokenImageIds((prev) => new Set(prev).add(banner.id))
      }
    />
  );
};

export default SidebarBannerStrip;
