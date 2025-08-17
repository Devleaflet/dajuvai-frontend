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
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);

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
    if (slides.length === 0) return;

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  const goToSlide = (index: number): void => {
    setActiveSlide(index);
  };

  const goToPrevSlide = (): void => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNextSlide = (): void => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (): void => {
    if (touchStart - touchEnd > 50) {
      goToNextSlide();
    }
    if (touchStart - touchEnd < -50) {
      goToPrevSlide();
    }
  };

  const handleImageClick = (slide: Slide): void => {
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
    <div className="hero-slider">
      <div
        className="hero-slider__track"
        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
              />
              {/* Navigation buttons inside the slide */}
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