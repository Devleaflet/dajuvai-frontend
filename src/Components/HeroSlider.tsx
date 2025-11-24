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
  productSource?: string;
  selectedCategory?: { id: number } | null;
  selectedSubcategory?: { id: number; category: { id: number } } | null;
  externalLink?: string | null;
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
  console.table(data)
  //('Fetched banners:', data);

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
      productSource: banner.productSource,
      selectedCategory: banner.selectedCategory,
      selectedSubcategory: banner.selectedSubcategory,
      externalLink: banner.externalLink,
    }));
};

const HeroSlider: React.FC<HeroSliderProps> = ({ onLoad }) => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [translateX, setTranslateX] = useState<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const clickThreshold = 5; // Pixels to consider as a click vs. drag
  const swipeThreshold = sliderRef.current ? sliderRef.current.offsetWidth / 4 : 100;

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
    //('Slides loaded:', slides);
  }, [onLoad, slides]);

  const goToSlide = (index: number): void => {
    setActiveSlide(index);
    setTranslateX(0);
    //('Go to slide:', index);
  };

  const goToPrevSlide = (): void => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    setTranslateX(0);
    //('Previous slide');
  };

  const goToNextSlide = (): void => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    setTranslateX(0);
    //('Next slide');
  };

  const handleDragStart = (clientX: number, clientY: number): void => {
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

  const handleDragEnd = (clientX: number, clientY: number): void => {
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
        handleImageClick(slides[activeSlide]);
      }
    }
    setStartPos(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return; // Only left-click
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>): void => {
    handleDragEnd(e.clientX, e.clientY);
  };

  const handleMouseLeave = (): void => {
    if (isDragging) {
      handleDragEnd(startPos?.x || 0, startPos?.y || 0);
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
    handleDragEnd(clientX, clientY);
  };

  const handleImageClick = (slide: Slide): void => {
    //('Banner clicked:', slide);
    if (!slide) {
      //('No slide found, navigating to /shop');
      try {
        navigate('/shop');
      } catch (error) {
        console.error('Navigation failed:', error);
        window.location.href = '/shop';
      }
      return;
    }

    if (slide.productSource === 'category' && slide.selectedCategory?.id) {
      //('Navigating to category:', slide.selectedCategory.id);
      try {
        navigate(`/shop?categoryId=${slide.selectedCategory.id}`);
      } catch (error) {
        console.error('Navigation failed:', error);
        window.location.href = `/shop?categoryId=${slide.selectedCategory.id}`;
      }
    } else if (
      slide.productSource === 'subcategory' &&
      slide.selectedSubcategory?.id &&
      slide.selectedSubcategory?.category?.id
    ) {
      
      try {
        navigate(
          `/shop?categoryId=${slide.selectedSubcategory.category.id}&subcategoryId=${slide.selectedSubcategory.id}`
        );
      } catch (error) {
        console.error('Navigation failed:', error);
        window.location.href = `/shop?categoryId=${slide.selectedSubcategory.category.id}&subcategoryId=${slide.selectedSubcategory.id}`;
      }
    } else if (slide.productSource === 'manual') {
      //('Navigating to manual banner:', slide.id);
      try {
        navigate(`/shop?bannerId=${slide.id}`);
      } catch (error) {
        console.error('Navigation failed:', error);
        window.location.href = `/shop?bannerId=${slide.id}`;
      }
    } else if (slide.productSource === 'external' && slide.externalLink) {
      //('Opening external link:', slide.externalLink);
      try {
        window.open(slide.externalLink, '_blank');
      } catch (error) {
        console.error('Failed to open external link:', error);
      }
    } else {
      console.warn(
        'No valid navigation criteria met. Slide properties:',
        {
          productSource: slide.productSource,
          hasSelectedCategory: !!slide.selectedCategory,
          hasSelectedSubcategory: !!slide.selectedSubcategory,
          hasExternalLink: !!slide.externalLink,
          slideName: slide.name,
        }
      );
      try {
        navigate('/shop');
      } catch (error) {
        console.error('Navigation failed:', error);
        window.location.href = '/shop';
      }
    }
  };

  if (isLoading) return <SliderSkeleton />;
  if(error) //(error)
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
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
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
              onClick={() => goToSlide(index)}
              className={`hero-slider__indicator ${activeSlide === index ? 'hero-slider__indicator--active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;