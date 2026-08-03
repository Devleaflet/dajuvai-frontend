import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import ResponsiveBanner from "./ResponsiveBanner";
import { API_BASE_URL } from "../config";
import { appendBannerSourceToShopLink, getBannerShopPath } from "../utils/bannerNavigation";

interface SidebarBanner {
  id: number;
  name: string;
  desktopImage: string;
  mobileImage: string | null;
  placementAfterSection: number | null;
  productSource?: string;
  selectedCategory?: { id: number; name?: string } | null;
  selectedSubcategory?: { id: number; category?: { id: number } } | null;
  selectedDeal?: { id: number } | null;
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
  selectedDeal?: { id: number } | null;
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
      selectedDeal: banner.selectedDeal,
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
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);
  const didDragRef = useRef(false);
  const startPosRef = useRef<{ x: number } | null>(null);
  const dragXRef = useRef(0);
  const sliderWidthRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const lastSampleRef = useRef<{ x: number; t: number } | null>(null);
  const velocityRef = useRef(0);
  const isHoveringRef = useRef(false);
  const activeSlideRef = useRef(0);

  const DRAG_THRESHOLD = 5;
  const SWIPE_DISTANCE = 50;
  const SWIPE_VELOCITY = 0.35;
  const AUTO_SLIDE_DELAY = 5000;

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

  const matchingBanners = banners.filter(
    (b) => b.placementAfterSection === placementAfterSection && !brokenImageIds.has(b.id),
  );

  const slides = matchingBanners;

  useEffect(() => {
    setActiveSlide(0);
    activeSlideRef.current = 0;
  }, [placementAfterSection]);

  useEffect(() => {
    startAutoSlide();
    return () => clearAutoSlide();
  }, [slides.length]);

  useEffect(() => {
    activeSlideRef.current = activeSlide;
    if (!trackRef.current) return;
    trackRef.current.style.transition = isDragging
      ? "none"
      : "transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1)";
    if (!isDragging) {
      trackRef.current.style.transform = `translateX(calc(-${activeSlide * 100}% + 0px))`;
    }
  }, [activeSlide, isDragging]);

  const clearAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = null;
    }
  };

  const startAutoSlide = () => {
    clearAutoSlide();
    if (slides.length <= 1 || isPausedRef.current) return;
    autoSlideRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, AUTO_SLIDE_DELAY);
  };

  const pauseAutoSlide = () => {
    isPausedRef.current = true;
    clearAutoSlide();
  };

  const resumeAutoSlide = () => {
    isPausedRef.current = false;
    startAutoSlide();
  };

  const goToSlide = (index: number) => {
    clearAutoSlide();
    setActiveSlide(index);
    startAutoSlide();
  };

  const goToPrevSlide = () => {
    clearAutoSlide();
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    startAutoSlide();
  };

  const goToNextSlide = () => {
    clearAutoSlide();
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    startAutoSlide();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pauseAutoSlide();
    didDragRef.current = false;
    dragXRef.current = 0;
    velocityRef.current = 0;
    sliderWidthRef.current = sliderRef.current?.offsetWidth || 0;
    startPosRef.current = { x: e.clientX };
    lastSampleRef.current = { x: e.clientX, t: e.timeStamp };
    pointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture can fail when the pointer leaves before capture starts.
    }
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!startPosRef.current || !trackRef.current) return;
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    if (Math.abs(dx) > DRAG_THRESHOLD) didDragRef.current = true;

    const last = lastSampleRef.current;
    if (last) {
      const dt = e.timeStamp - last.t;
      if (dt > 0) velocityRef.current = (e.clientX - last.x) / dt;
    }
    lastSampleRef.current = { x: e.clientX, t: e.timeStamp };

    const maxDrag = sliderWidthRef.current || 400;
    const clamped = Math.max(-maxDrag, Math.min(maxDrag, dx));
    dragXRef.current = clamped;
    trackRef.current.style.transform = `translateX(calc(-${activeSlideRef.current * 100}% + ${clamped}px))`;
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!startPosRef.current) return;
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Release is best-effort; the browser may already have released capture.
    }

    const dx = dragXRef.current;
    const v = velocityRef.current;
    setIsDragging(false);

    const committed = Math.abs(dx) > SWIPE_DISTANCE || Math.abs(v) > SWIPE_VELOCITY;
    if (committed) {
      if (dx > 0 || (dx === 0 && v > 0)) {
        goToPrevSlide();
      } else {
        goToNextSlide();
      }
    }

    dragXRef.current = 0;
    velocityRef.current = 0;
    startPosRef.current = null;
    lastSampleRef.current = null;
    pointerIdRef.current = null;

    if (e.pointerType !== "mouse" || !isHoveringRef.current) {
      resumeAutoSlide();
    }
  };

  const handlePointerEnter = () => {
    isHoveringRef.current = true;
    pauseAutoSlide();
  };

  const handlePointerLeave = () => {
    isHoveringRef.current = false;
    if (!startPosRef.current) resumeAutoSlide();
  };

  const getBannerShopUrl = (banner: SidebarBanner) => {
    return appendBannerSourceToShopLink(getBannerShopPath(banner), {
      sourceBannerId: banner.id,
      sourceBannerType: "sidebar",
    }) ?? getBannerShopPath(banner);
  };

  const handleImageClick = (banner: SidebarBanner) => {
    if (banner.productSource === "external" && banner.externalLink) {
      const url = appendBannerSourceToShopLink(banner.externalLink, {
        sourceBannerId: banner.id,
        sourceBannerType: "sidebar",
      });
      if (url) {
        navigate(url);
      } else {
        window.open(banner.externalLink, "_blank", "noopener,noreferrer");
      }
    } else navigate(getBannerShopUrl(banner));
  };

  const handleSliderClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    const banner = slides[activeSlideRef.current];
    if (banner) handleImageClick(banner);
  };

  if (slides.length === 0) return null;

  if (slides.length === 1) {
    const banner = slides[0];
    return (
      <div className="sidebar-banner-strip sidebar-banner-strip--single">
        <ResponsiveBanner
          type="section"
          desktopImageUrl={banner.desktopImage}
          mobileImageUrl={banner.mobileImage}
          altText={banner.name}
          onClick={() => handleImageClick(banner)}
          onError={() =>
            setBrokenImageIds((prev) => new Set(prev).add(banner.id))
          }
        />
      </div>
    );
  }

  return (
    <div className="sidebar-banner-strip">
      <div
        className="sidebar-slider"
        ref={sliderRef}
        onClick={handleSliderClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const banner = slides[activeSlideRef.current];
            if (banner) handleImageClick(banner);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Sidebar banners"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div className="sidebar-slider__track" ref={trackRef}>
          {slides.map((banner, idx) => (
            <div key={banner.id} className="sidebar-slider__slide">
              <div className="sidebar-slider__image-container">
                <ResponsiveBanner
                  type="section"
                  desktopImageUrl={banner.desktopImage}
                  mobileImageUrl={banner.mobileImage}
                  altText={banner.name}
                  priority={idx === 0}
                  className="sidebar-slider__banner"
                  onError={() =>
                    setBrokenImageIds((prev) => new Set(prev).add(banner.id))
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <div className="sidebar-slider__indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                className={`sidebar-slider__indicator ${activeSlide === index ? "sidebar-slider__indicator--active" : ""}`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarBannerStrip;
