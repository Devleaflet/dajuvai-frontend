import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import '../Styles/HeroSlider.css';
import SliderSkeleton from '../skeleton/SliderSkeleton';
import { API_BASE_URL } from '../config';

interface Slide {
  id: number;
  name: string;
  desktopImage: string | null;
  mobileImage: string | null;
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
  console.log('Fetched banners:', data);

  return data.data
    .filter(
      (banner: any) =>
        banner.type === 'HERO' &&
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
    }));
};


const HeroSlider: React.FC<HeroSliderProps> = ({ onLoad }) => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [translateX, setTranslateX] = useState<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);

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
    console.log('Slides loaded:', slides); // Debug slides data
  }, [onLoad, slides]);

  const goToSlide = (index: number): void => {
    setActiveSlide(index);
    setTranslateX(0);
    console.log('Go to slide:', index); // Debug slide change
  };

  const goToPrevSlide = (): void => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    setTranslateX(0);
    console.log('Previous slide'); // Debug navigation
  };

  const goToNextSlide = (): void => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    setTranslateX(0);
    console.log('Next slide'); // Debug navigation
  };

  const handleDragStart = (clientX: number): void => {
    setIsDragging(true);
    setStartX(clientX);
    setTranslateX(0);
    console.log('Drag start at:', clientX); // Debug drag start
  };

  const handleDragMove = (clientX: number): void => {
    if (!isDragging) return;
    const currentDrag = clientX - startX;
    const maxDrag = sliderRef.current ? sliderRef.current.offsetWidth / 3 : 200;
    setTranslateX(Math.max(-maxDrag, Math.min(maxDrag, currentDrag)));
    console.log('Dragging, translateX:', currentDrag); // Debug drag movement
  };

  const handleDragEnd = (): void => {
    if (!isDragging) return;
    setIsDragging(false);
    const swipeThreshold = sliderRef.current ? sliderRef.current.offsetWidth / 4 : 100;

    if (Math.abs(translateX) > swipeThreshold) {
      if (translateX > 0) {
        goToPrevSlide();
      } else {
        goToNextSlide();
      }
    } else {
      setTranslateX(0); // Snap back
    }
    console.log('Drag end, translateX:', translateX); // Debug drag end
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return; // Only left-click
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
    if (Math.abs(translateX) > 5) return; // Prevent click during drag
    console.log('Banner clicked:', slide); // Debug click
    if (slide?.name) {
      const searchQuery = encodeURIComponent(slide.name);
      console.log('Navigating to:', `/shop?search=${searchQuery}`);
      try {
        navigate(`/shop?search=${searchQuery}`);
      } catch (error) {
        console.error('Navigation failed:', error);
        window.location.href = `/shop?search=${searchQuery}`;
      }
    } else {
      console.log('No slide name, navigating to /shop');
      try {
        navigate('/shop');
      } catch (error) {
        console.error('Navigation failed:', error);
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
      ref={sliderRef}
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
        {slides.map((slide) => (
          <div key={slide.id} className="hero-slider__slide">
            <div className="hero-slider__image-container">
              <img
                src={window.innerWidth < 768 ? slide.mobileImage || slide.desktopImage : slide.desktopImage}
                alt={slide.name}
                className="hero-slider__image"
                loading="lazy"
                onClick={() => handleImageClick(slide)}
                draggable={false}
              />

              {/* Navigation arrow buttons removed */}
            </div>
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

export default HeroSlider;