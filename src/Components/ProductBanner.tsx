import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import '../Styles/HeroSlider.css';
import SliderSkeleton from '../skeleton/SliderSkeleton';
import ResponsiveBanner from './ResponsiveBanner';
import { API_BASE_URL } from '../config';
import { getBannerShopPath } from '../utils/bannerNavigation';

interface Slide {
  id: number;
  name: string;
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

const fetchProductBanners = async (): Promise<Slide[]> => {
  const response = await fetch(`${API_BASE_URL}/api/banners`);
  if (!response.ok) {
    throw new Error(`Failed to fetch banners: ${response.statusText}`);
  }
  const data = await response.json();
  //('Fetched banners:', data);

  return data.data
    .filter(
      (banner: any) =>
        (banner.type === 'PRODUCT' || banner.type === 'SIDEBAR') &&
        banner.status === 'ACTIVE' &&
        (!banner.startDate || new Date(banner.startDate) <= new Date()) &&
        (!banner.endDate || new Date(banner.endDate) >= new Date())
    )
    .map((banner: any) => ({
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

const ProductBanner: React.FC = () => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [translateX, setTranslateX] = useState<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);

  const clickThreshold = 5; // Pixels to consider as a click vs. drag
  const swipeThreshold = sliderRef.current ? sliderRef.current.offsetWidth / 4 : 100;
  const AUTO_SLIDE_DELAY = 4000;

  const { data: slides = [], isLoading, error } = useQuery<Slide[], Error>({
    queryKey: ['productBanners'],
    queryFn: fetchProductBanners,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes('404') || error.message.includes('400')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    startAutoSlide();
    return clearAutoSlide;
  }, [slides.length]);

  const clearAutoSlide = (): void => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = null;
    }
  };

  const startAutoSlide = (): void => {
    clearAutoSlide();
    if (slides.length <= 1 || isPausedRef.current) return;
    autoSlideRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      setTranslateX(0);
    }, AUTO_SLIDE_DELAY);
  };

  const pauseAutoSlide = (): void => {
    isPausedRef.current = true;
    clearAutoSlide();
  };

  const resumeAutoSlide = (): void => {
    isPausedRef.current = false;
    startAutoSlide();
  };

  const goToSlide = (index: number): void => {
    clearAutoSlide();
    setActiveSlide(index);
    setTranslateX(0);
    startAutoSlide();
    //('Go to slide:', index);
  };

  const goToPrevSlide = (): void => {
    clearAutoSlide();
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    setTranslateX(0);
    startAutoSlide();
    //('Previous slide');
  };

  const goToNextSlide = (): void => {
    clearAutoSlide();
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    setTranslateX(0);
    startAutoSlide();
    //('Next slide');
  };

  const handleDragStart = (clientX: number, clientY: number): void => {
    pauseAutoSlide();
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
    setTranslateX(0);
    //('Drag start at:', { x: clientX, y: clientY });
  };

  const handleDragMove = (clientX: number): void => {
    if (!isDragging) return;
    const currentDrag = clientX - (startPos?.x || 0);
    const maxDrag = sliderRef.current ? sliderRef.current.offsetWidth / 3 : 200;
    setTranslateX(Math.max(-maxDrag, Math.min(maxDrag, currentDrag)));
    //('Dragging, translateX:', currentDrag);
  };

  const handleDragEnd = (
    clientX: number,
    clientY: number,
    resumeWhenDone = true,
  ): void => {
    if (!isDragging) return;
    setIsDragging(false);

    // Check drag distance for swipe
    if (Math.abs(translateX) > swipeThreshold) {
      if (translateX > 0) {
        goToPrevSlide();
      } else {
        goToNextSlide();
      }
    } else {
      setTranslateX(0); // Snap back
    }
    //('Drag end, translateX:', translateX);

    // Check for click (minimal movement)
    if (startPos) {
      const dx = clientX - startPos.x;
      const dy = clientY - startPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= clickThreshold) {
        handleBannerClick(slides[activeSlide]);
      }
    }
    setStartPos(null);
    if (resumeWhenDone) {
      resumeAutoSlide();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return; // Only left-click
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>): void => {
    handleDragEnd(e.clientX, e.clientY, false);
  };

  const handleMouseLeave = (): void => {
    if (isDragging) {
      handleDragEnd(startPos?.x || 0, startPos?.y || 0, true);
    } else {
      resumeAutoSlide();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>): void => {
    const clientX = e.changedTouches[0]?.clientX || startPos?.x || 0;
    const clientY = e.changedTouches[0]?.clientY || startPos?.y || 0;
    handleDragEnd(clientX, clientY, true);
  };

  const handleBannerClick = (slide: Slide) => {
    //('🎯 ProductBanner clicked:', slide);
    if (!slide) {
      //('⚠️ No slide found, navigating to /shop');
      try {
        navigate('/shop');
      } catch (error) {
        console.error('❌ Navigation failed:', error);
        window.location.href = '/shop';
      }
      return;
    }

    if (slide.productSource === 'external' && slide.externalLink) {
      window.open(slide.externalLink, '_blank');
    } else {
      //('Navigating to category:', slide.selectedCategory.id);
      try {
        navigate(getBannerShopPath(slide));
      } catch (error) {
        console.error('Navigation failed:', error);
        window.location.href = getBannerShopPath(slide);
      }
    }
  };

  if (isLoading) return <SliderSkeleton />;
  if (error) return <div>Error loading banners: {error.message}</div>;
  if (slides.length === 0) return <div>No product banners available</div>;

  return (
    <div
      className="hero-slider"
      ref={sliderRef}
      onMouseEnter={pauseAutoSlide}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        className="hero-slider__track"
        style={{
          transform: `translateX(calc(-${activeSlide * 100}% + ${translateX}px))`,
          transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {slides.map((slide, idx) => (
          <div key={slide.id} className="hero-slider__slide">
            <ResponsiveBanner
              type="hero"
              desktopImageUrl={slide.desktopImage ?? ''}
              mobileImageUrl={slide.mobileImage}
              altText={slide.name}
              priority={idx === 0}
              className="hero-slider__image"
            />
          </div>
        ))}
      </div>

      <div className="hero-slider__indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`hero-slider__indicator ${activeSlide === index ? 'hero-slider__indicator--active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductBanner;
