import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import "../Styles/HeroSlider.css";
import SliderSkeleton from "../skeleton/SliderSkeleton";
import ResponsiveBanner from "./ResponsiveBanner";
import { API_BASE_URL } from "../config";
import { getBannerShopPath } from "../utils/bannerNavigation";

interface Slide {
  id: number;
  name: string;
  type?: string;
  desktopImage: string | null;
  mobileImage: string | null;
  status?: string;
  startDate?: string;
  endDate?: string;
  productSource?: string;
  selectedCategory?: { id: number } | null;
  selectedSubcategory?: { id: number; category: { id: number } } | null;
  selectedDeal?: { id: number } | null;
  externalLink?: string | null;
}

interface ProductBannerSliderProps {
  onLoad?: () => void;
}

const fetchProductBanners = async (): Promise<Slide[]> => {
  const response = await fetch(`${API_BASE_URL}/api/banners?type=PRODUCT`);
  if (!response.ok) {
    throw new Error(`Failed to fetch product banners: ${response.statusText}`);
  }

  const data = await response.json();
  return (Array.isArray(data.data) ? data.data : [])
    .filter(
      (banner: Slide) =>
        (!banner.type || banner.type === "PRODUCT") &&
        banner.status === "ACTIVE" &&
        (!banner.startDate || new Date(banner.startDate) <= new Date()) &&
        (!banner.endDate || new Date(banner.endDate) >= new Date()),
    )
    .map((banner: Slide) => ({
      id: banner.id,
      name: banner.name,
      desktopImage: banner.desktopImage,
      mobileImage: banner.mobileImage,
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

const ProductBannerSlider: React.FC<ProductBannerSliderProps> = ({ onLoad }) => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);
  const isHoveringRef = useRef(false);
  const didDragRef = useRef(false);
  const activeSlideRef = useRef(0);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragXRef = useRef(0);
  const sliderWidthRef = useRef(0);
  const lastSampleRef = useRef<{ x: number; t: number } | null>(null);
  const velocityRef = useRef(0);

  const DRAG_THRESHOLD = 5;
  const SWIPE_DISTANCE = 50;
  const SWIPE_VELOCITY = 0.35;
  const AUTO_SLIDE_DELAY = 4000;

  const { data: slides = [], isLoading, error } = useQuery<Slide[], Error>({
    queryKey: ["productBanners"],
    queryFn: fetchProductBanners,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

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
      setActiveSlide((previous) =>
        previous === slides.length - 1 ? 0 : previous + 1,
      );
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

  useEffect(() => {
    onLoad?.();
    if (slides.length > 1 && !isPausedRef.current) {
      autoSlideRef.current = setInterval(() => {
        setActiveSlide((previous) =>
          previous === slides.length - 1 ? 0 : previous + 1,
        );
      }, AUTO_SLIDE_DELAY);
    }
    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
        autoSlideRef.current = null;
      }
    };
  }, [onLoad, slides.length]);

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

  const goToSlide = (index: number) => {
    clearAutoSlide();
    setActiveSlide(index);
    startAutoSlide();
  };

  const goToPrevious = () => {
    clearAutoSlide();
    setActiveSlide((previous) =>
      previous === 0 ? slides.length - 1 : previous - 1,
    );
    startAutoSlide();
  };

  const goToNext = () => {
    clearAutoSlide();
    setActiveSlide((previous) =>
      previous === slides.length - 1 ? 0 : previous + 1,
    );
    startAutoSlide();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pauseAutoSlide();
    didDragRef.current = false;
    dragXRef.current = 0;
    velocityRef.current = 0;
    sliderWidthRef.current = sliderRef.current?.offsetWidth || 0;
    startPosRef.current = { x: event.clientX, y: event.clientY };
    lastSampleRef.current = { x: event.clientX, t: event.timeStamp };
    pointerIdRef.current = event.pointerId;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is not available in a few older embedded browsers.
    }
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!startPosRef.current || !trackRef.current) return;
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;

    const dx = event.clientX - startPosRef.current.x;
    if (Math.abs(dx) > DRAG_THRESHOLD) didDragRef.current = true;

    const previous = lastSampleRef.current;
    if (previous) {
      const elapsed = event.timeStamp - previous.t;
      if (elapsed > 0) velocityRef.current = (event.clientX - previous.x) / elapsed;
    }
    lastSampleRef.current = { x: event.clientX, t: event.timeStamp };

    const maxDrag = sliderWidthRef.current || 400;
    const clamped = Math.max(-maxDrag, Math.min(maxDrag, dx));
    dragXRef.current = clamped;
    trackRef.current.style.transform = `translateX(calc(-${activeSlideRef.current * 100}% + ${clamped}px))`;
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!startPosRef.current) return;
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // The pointer may already have been released by the browser.
    }

    const dragX = dragXRef.current;
    const velocity = velocityRef.current;
    setIsDragging(false);

    if (Math.abs(dragX) > SWIPE_DISTANCE || Math.abs(velocity) > SWIPE_VELOCITY) {
      if (dragX > 0 || (dragX === 0 && velocity > 0)) goToPrevious();
      else goToNext();
    }

    dragXRef.current = 0;
    velocityRef.current = 0;
    startPosRef.current = null;
    lastSampleRef.current = null;
    pointerIdRef.current = null;

    if (event.pointerType !== "mouse" || !isHoveringRef.current) {
      resumeAutoSlide();
    }
  };

  const handleImageClick = (slide: Slide) => {
    if (!slide) return;
    if (slide.productSource === "external" && slide.externalLink) {
      window.open(slide.externalLink, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(getBannerShopPath(slide));
  };

  if (isLoading) return <SliderSkeleton />;
  if (error) return <div>Error loading banners: {error.message}</div>;
  if (slides.length === 0) return <div>No product banners available</div>;

  return (
    <div
      className="hero-slider"
      ref={sliderRef}
      role="button"
      tabIndex={0}
      aria-label="Product banner"
      onClick={() => {
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }
        const slide = slides[activeSlideRef.current];
        if (slide) handleImageClick(slide);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const slide = slides[activeSlideRef.current];
          if (slide) handleImageClick(slide);
        }
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          isHoveringRef.current = true;
          pauseAutoSlide();
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          isHoveringRef.current = false;
          if (!startPosRef.current) resumeAutoSlide();
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <div className="hero-slider__track" ref={trackRef}>
        {slides.map((slide, index) => (
          <div key={slide.id} className="hero-slider__slide">
            <div className="hero-slider__image-container">
              <ResponsiveBanner
                type="hero"
                desktopImageUrl={slide.desktopImage ?? ""}
                mobileImageUrl={slide.mobileImage}
                altText={slide.name}
                priority={index === 0}
                className="hero-slider__image"
              />
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="hero-slider__indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={(event) => {
                event.stopPropagation();
                goToSlide(index);
              }}
              className={`hero-slider__indicator ${activeSlide === index ? "hero-slider__indicator--active" : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductBannerSlider;
