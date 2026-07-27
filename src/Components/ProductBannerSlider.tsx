import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import '../Styles/HeroSlider.css';
import SliderSkeleton from '../skeleton/SliderSkeleton';
import ResponsiveBanner from './ResponsiveBanner';
import { API_BASE_URL } from '../config';

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
  //("Fetched product banners:", data);

  return data.data
    .filter(
      (banner: any) =>
        banner.type === 'PRODUCT' &&
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
      externalLink: banner.externalLink,
    }));
};

const ProductBannerSlider: React.FC<ProductBannerSliderProps> = ({ onLoad }) => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const clickThreshold = 5;
  const swipeThreshold = sliderRef.current ? sliderRef.current.offsetWidth / 4 : 100;

  const AUTO_SLIDE_DELAY = 4000;

  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);


  const { data: slides = [], isLoading, error } = useQuery<Slide[], Error>({
    queryKey: ['productBanners'],
    queryFn: fetchProductBanners,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    onLoad?.();

    if (slides.length > 1) {
      startAutoSlide();
    }

    return () => {
      clearAutoSlide();
    };
  }, [slides]);


  const goToSlide = (index: number) => {
    clearAutoSlide();
    setActiveSlide(index);
    setTranslateX(0);
    startAutoSlide();
  };
  const goToPrevSlide = () => {
    clearAutoSlide();
    setActiveSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
    setTranslateX(0);
    startAutoSlide();
  };
  const goToNextSlide = () => {
    clearAutoSlide();
    setActiveSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
    setTranslateX(0);
    startAutoSlide();
  };

  const handleDragStart = (x: number, y: number) => {
    isPausedRef.current = true;
    clearAutoSlide();
    setIsDragging(true);
    setStartPos({ x, y });
    setTranslateX(0);
  };

  const handleDragMove = (x: number) => {
    if (!isDragging) return;
    const d = x - (startPos?.x || 0);
    const max = sliderRef.current ? sliderRef.current.offsetWidth / 3 : 200;
    setTranslateX(Math.max(-max, Math.min(max, d)));
  };

  const handleDragEnd = (x: number, y: number, resumeWhenDone = true) => {
    if (!isDragging) return;

    setIsDragging(false);

    if (Math.abs(translateX) > swipeThreshold) {
      translateX > 0 ? goToPrevSlide() : goToNextSlide();
    }

    const dx = x - (startPos?.x || 0);
    const dy = y - (startPos?.y || 0);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= clickThreshold) {
      handleBannerClick(slides[activeSlide]);
    }

    setTranslateX(0);
    setStartPos(null);
    if (resumeWhenDone) {
      isPausedRef.current = false;
      startAutoSlide();
    }
  };

  const handleBannerClick = (slide: Slide) => {
    if (!slide) return navigate('/shop');

    if (slide.productSource === 'category' && slide.selectedCategory?.id) {
      return navigate(`/shop?categoryId=${slide.selectedCategory.id}`);
    }

    if (
      slide.productSource === 'subcategory' &&
      slide.selectedSubcategory?.id &&
      slide.selectedSubcategory.category?.id
    ) {
      return navigate(
        `/shop?categoryId=${slide.selectedSubcategory.category.id}&subcategoryId=${slide.selectedSubcategory.id}`
      );
    }

    if (slide.productSource === 'manual') {
      return navigate(`/shop?bannerId=${slide.id}`);
    }

    if (slide.productSource === 'external' && slide.externalLink) {
      return window.open(slide.externalLink, '_blank');
    }

    navigate('/shop');
  };

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
      setActiveSlide((prev) =>
        prev === slides.length - 1 ? 0 : prev + 1
      );
      setTranslateX(0);
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

  if (isLoading) return <SliderSkeleton />;
  if (error) return <div>Error loading banners: {error.message}</div>;
  if (slides.length === 0) return <div>No product banners available</div>;

  return (
    <div
      className="hero-slider"
      ref={sliderRef}
      onMouseEnter={pauseAutoSlide}
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={(e) => handleDragEnd(e.clientX, e.clientY, false)}
      onMouseLeave={() => {
        if (isDragging) {
          handleDragEnd(startPos?.x || 0, startPos?.y || 0, true);
        } else {
          resumeAutoSlide();
        }
      }}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={(e) =>
        handleDragEnd(
          e.changedTouches[0]?.clientX || 0,
          e.changedTouches[0]?.clientY || 0
        )
      }
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        className="hero-slider__track"
        style={{
          transform: `translateX(calc(-${activeSlide * 100}% + ${translateX}px))`,
          transition: isDragging ? 'none' : 'transform 0.5s ease',
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

      {slides.length > 1 && (
        <div className="hero-slider__indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`hero-slider__indicator ${activeSlide === index ? 'hero-slider__indicator--active' : ''
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductBannerSlider;
