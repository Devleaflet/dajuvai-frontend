import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import "../Styles/SpecialOffers.css";
import OffersSkeleton from "../skeleton/OffersSkeleton";
import { API_BASE_URL } from "../config";
import { getBannerShopPath } from "../utils/bannerNavigation";

interface Offer {
  id: number;
  name: string;
  desktopImage: string;
  mobileImage?: string;
  discount?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  productSource?: string;
  selectedCategory?: { id: number; name?: string } | null;
  selectedSubcategory?: { id: number; category?: { id: number } } | null;
  selectedDeal?: { id: number } | null;
  externalLink?: string | null;
}

const fetchSpecialDeals = async (): Promise<Offer[]> => {
  const response = await fetch(`${API_BASE_URL}/api/banners`);
  if (!response.ok) {
    throw new Error(`Failed to fetch banners: ${response.statusText}`);
  }
  const data = await response.json();

  return (data.data || [])
    .filter(
      (banner: any) =>
        banner.type === "SPECIAL_DEALS" &&
        banner.status === "ACTIVE" &&
        (!banner.startDate || new Date(banner.startDate) <= new Date()) &&
        (!banner.endDate || new Date(banner.endDate) >= new Date()),
    )
    .map((banner: any) => ({
      id: banner.id,
      name: banner.name,
      desktopImage: banner.desktopImage,
      mobileImage: banner.mobileImage,
      discount: banner.discount || "SPECIAL OFFER",
      status: banner.status,
      startDate: banner.startDate,
      endDate: banner.endDate,
      productSource: banner.productSource,
      selectedCategory: banner.selectedCategory,
      selectedSubcategory: banner.selectedSubcategory,
      selectedDeal: banner.selectedDeal,
      externalLink: banner.externalLink,
    }));
};

const SpecialOffers = () => {
  const navigate = useNavigate();
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  const {
    data: offers = [],
    isLoading,
    error,
  } = useQuery<Offer[], Error>({
    queryKey: ["specialDeals"],
    queryFn: fetchSpecialDeals,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, err) => {
      if (err.message.includes("404") || err.message.includes("400"))
        return false;
      return failureCount < 3;
    },
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  });

  const handleOfferClick = (offer: Offer) => {
    if (offer.productSource === "external" && offer.externalLink) {
      window.open(offer.externalLink, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(getBannerShopPath(offer));
  };

  if (isLoading) return <OffersSkeleton />;

  if (error)
    return (
      <div className="special-offers-section">
        <div className="special-offers-container">
          <div className="special-offers-fallback">
            <p>Special offers are temporarily unavailable.</p>
          </div>
        </div>
      </div>
    );

  const visibleOffers = offers.filter((o) => !brokenImages.has(o.id));

  if (visibleOffers.length === 0) {
    return (
      <div className="special-offers-section">
        <div className="special-offers-container">
          <div className="special-offers-empty">
            <Sparkles
              className="special-offers-empty-icon"
              size={28}
              strokeWidth={1.5}
            />
            <p className="special-offers-empty-title">
              Stay tuned for something special!
            </p>
            <p className="special-offers-empty-subtitle">
              We're cooking up exciting new offers — check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="special-offers-section">
      <div className="special-offers-container">
        <div className="special-offers-header">
          <h2 className="special-offers-title">SPECIAL OFFERS</h2>
          <p className="special-offers-subtitle">
            Find everything to make their special day unforgettable.
          </p>
        </div>

        <div className="special-offers-grid">
          {visibleOffers.map((offer) => (
            <div
              key={offer.id}
              className="special-offer-card"
              onClick={() => handleOfferClick(offer)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOfferClick(offer);
                }
              }}
              aria-label={`View ${offer.name}`}
            >
              <img
                src={offer.desktopImage}
                alt={offer.name}
                className="special-offer-image"
                loading="lazy"
                onError={() =>
                  setBrokenImages((prev) => new Set(prev).add(offer.id))
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpecialOffers;
