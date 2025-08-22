import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import '../Styles/HeroSlider.css';
import SliderSkeleton from '../skeleton/SliderSkeleton';
import { API_BASE_URL } from '../config';

interface Slide {
  id: number;
  image: string;
  name: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface HeroSliderProps {
  onLoad?: () => void;
}

const fetchHeroBanners = async (): Promise<Slide[]> => {
  const response = await fetch(`${API_BASE_URL}/api/banners?type=HERO`);
  if (!response.ok) {
    throw new Error(`Failed to fetch banners: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data.filter((banner: Slide & { type: string; status: string; startDate?: string; endDate?: string }) => 
    banner.type === 'HERO' && 
    banner.status === 'ACTIVE' &&
    (!banner.startDate || new Date(banner.startDate) <= new Date()) &&
    (!banner.endDate || new Date(banner.endDate) >= new Date())
  );
};

const HeroSlider: React.FC<HeroSliderProps> = ({ onLoad }) => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [dragDistance, setDragDistance] = useState<number>(0);
  const [translateX, setTranslateX] = useState<number>(0);

  const { data: slides = [], isLoading, error } = useQuery<Slide[], Error>({
    queryKey: ['heroBanners'],
    queryFn: fetchHeroBanners,
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
    onLoad?.();
  }, [onLoad]);

  const goToSlide = (index: number): void => {
    setActiveSlide(index);
    setTranslateX(0);
  };

  const goToPrevSlide = (): void => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    setTranslateX(0);
  };

  const goToNextSlide = (): void => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    setTranslateX(0);
  };

  const handleDragStart = (clientX: number): void => {
    setIsDragging(true);
    setStartX(clientX);
    setDragDistance(0);
  };

  const handleDragMove = (clientX: number): void => {
    if (!isDragging) return;
    const currentDrag = clientX - startX;
    setDragDistance(currentDrag);
    setTranslateX(currentDrag);
  };

  const handleDragEnd = (): void => {
    if (!isDragging) return;
    setIsDragging(false);

    // Determine swipe direction based on drag distance
    const swipeThreshold = 50; // Minimum distance to trigger slide change
    if (dragDistance > swipeThreshold) {
      goToPrevSlide();
    } else if (dragDistance < -swipeThreshold) {
      goToNextSlide();
    } else {
      setTranslateX(0); // Reset position if swipe is too small
    }

    // Reset drag distance after a short delay
    setTimeout(() => setDragDistance(0), 100);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = (): void => {
    handleDragEnd();
  };

  const handleMouseLeave = (): void => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = (): void => {
    handleDragEnd();
  };

  const handleImageClick = (slide: Slide): void => {
    // Prevent navigation if user was dragging
    if (Math.abs(dragDistance) > 5) {
      return;
    }

    console.log('🎯 HeroSlider banner clicked:', slide);
    if (slide && slide.name) {
      const searchQuery = encodeURIComponent(slide.name);
      console.log('🔍 Navigating to shop with search:', {
        bannerName: slide.name,
        encodedSearch: searchQuery,
        fullUrl: `/shop?search=${searchQuery}`,
      });
      try {
        navigate(`/shop?search=${searchQuery}`);
        console.log('✅ Navigation successful');
      } catch (error) {
        console.error('❌ Navigation failed:', error);
        window.location.href = `/shop?search=${searchQuery}`;
      }
    } else {
      console.log('⚠️ No slide name found, navigating to shop without search');
      try {
        navigate('/shop');
      } catch (error) {
        console.error('❌ Fallback navigation failed:', error);
        window.location.href = '/shop';
      }
    }
  };

  if (isLoading) return <SliderSkeleton />;
  if (error) return <div>Error loading banners: {error.message}</div>;
  if (slides.length === 0) return <div>No hero banners available</div>;

  return (
    <div
      className="hero-slider"
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
          transition: isDragging ? 'none' : 'transform 500ms ease-in-out',
        }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="hero-slider__slide">
            <div className="hero-slider__image-container">
              <img
                src={slide.image}
                alt={slide.name}
                className="hero-slider__image"
                loading="lazy"
                onClick={() => handleImageClick(slide)}
                style={{ cursor: 'pointer' }}
                draggable={false}
              />
              <button
                className="hero-slider__nav-button hero-slider__nav-button--prev"
                onClick={goToPrevSlide}
              >
                <ArrowLeft size={24} color="white" />
              </button>
              <button
                className="hero-slider__nav-button hero-slider__nav-button--next"
                onClick={goToNextSlide}
              >
                <ArrowRight size={24} color="white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hero-slider__indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`hero-slider__indicator ${
              activeSlide === index ? 'hero-slider__indicator--active' : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;