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

interface HeroSliderProps {
  onLoad?: () => void;
}

const fetchHeroBanners = async (): Promise<Slide[]> => {
  const response = await fetch(`${API_BASE_URL}/api/banners?type=HERO`);

  if (!response.ok) {
    throw new Error(`Failed to fetch banners: ${response.statusText}`);
  }
  const data = await response.json();
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
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);
  // Set once a drag/swipe moves past a few pixels; the subsequent native
  // click (which the browser fires on mouseup regardless) checks this to
  // avoid triggering navigation right after a swipe.
  const didDragRef = useRef(false);
  // Drag bookkeeping lives in refs, not state: mousemove can fire dozens of
  // times per drag, and re-rendering on every one of them (plus reading
  // offsetWidth mid-render, which forces a synchronous layout) is what made
  // dragging feel laggy/glitchy. The track's transform is mutated directly
  // during the drag; React only re-renders at drag start/end.
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragXRef = useRef(0);
  const sliderWidthRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const lastSampleRef = useRef<{ x: number; t: number } | null>(null);
  const velocityRef = useRef(0);
  const isHoveringRef = useRef(false);
  const activeSlideRef = useRef(0);

  const DRAG_THRESHOLD = 5; // Movement before a press counts as a drag, not a click
  const SWIPE_DISTANCE = 50; // Committing to the next slide takes only a short drag
  const SWIPE_VELOCITY = 0.35; // px/ms — a fast flick commits regardless of distance
  const AUTO_SLIDE_DELAY = 5000;

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
    startAutoSlide();

    return () => {
      clearAutoSlide();
    };
  }, [slides.length]);


  useEffect(() => {
    onLoad?.();
    //('Slides loaded:', slides);
  }, [onLoad, slides]);

  // Single authoritative place that writes the track's resting transform.
  // handleDragMove also writes trackRef.current.style.transform directly
  // (for the high-frequency drag-follow update, see below) — once a style
  // property is ever set imperatively, letting React's declarative style
  // diffing ALSO manage it is unreliable: React compares against its own
  // last-rendered value, not the DOM's actual current value, so it can
  // silently skip writing a value it thinks is unchanged even though the
  // live DOM disagrees. Routing every settled position through this one
  // effect (keyed on the only two things that should move the track)
  // avoids that class of bug entirely.
  useEffect(() => {
    activeSlideRef.current = activeSlide;
    if (!trackRef.current) return;
    trackRef.current.style.transition = isDragging
      ? 'none'
      : 'transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1)';
    if (!isDragging) {
      trackRef.current.style.transform = `translateX(calc(-${activeSlide * 100}% + 0px))`;
    }
  }, [activeSlide, isDragging]);

  const goToSlide = (index: number): void => {
    clearAutoSlide();
    setActiveSlide(index);
    startAutoSlide();
    //('Go to slide:', index);
  };

  const goToPrevSlide = (): void => {
    clearAutoSlide();
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    startAutoSlide();
    //('Previous slide');
  };

  const goToNextSlide = (): void => {
    clearAutoSlide();
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    startAutoSlide();
    //('Next slide');
  };

  // Pointer events (rather than separate mouse/touch handlers) give one code
  // path for mouse, touch and pen, and pointer capture keeps the move/up
  // stream coming even when the cursor leaves the slider mid-drag — the old
  // mouse-only version silently dropped the gesture in that case.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // Left button only
    pauseAutoSlide();
    didDragRef.current = false;
    dragXRef.current = 0;
    velocityRef.current = 0;
    sliderWidthRef.current = sliderRef.current?.offsetWidth || 0;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    lastSampleRef.current = { x: e.clientX, t: e.timeStamp };
    pointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture is best-effort; the drag still works without it.
    }
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
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
    // Written straight to the node: this fires on every pointer sample, and
    // routing it through React state would re-render the whole slider dozens
    // of times per gesture.
    trackRef.current.style.transform = `translateX(calc(-${activeSlideRef.current * 100}% + ${clamped}px))`;
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!startPosRef.current) return;
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Already released (or never captured) — nothing to undo.
    }

    const dx = dragXRef.current;
    const v = velocityRef.current;
    setIsDragging(false);

    // Either a short deliberate drag or a quick flick commits to the
    // neighbouring slide; anything less snaps back. Whichever happens, the
    // settle effect above applies the resting transform, since isDragging
    // flipping to false always re-runs it.
    const committed =
      Math.abs(dx) > SWIPE_DISTANCE || Math.abs(v) > SWIPE_VELOCITY;
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

    // A mouse resting on the slider should stay paused until it actually
    // leaves; touch/pen have no hover, so autoplay picks straight back up.
    if (e.pointerType !== 'mouse' || !isHoveringRef.current) {
      resumeAutoSlide();
    }
  };

  // Native click handles navigation — the pointer handlers above only drive
  // the drag/swipe animation. didDragRef swallows the click the browser still
  // fires after a real drag.
  const handleSlideClick = (slide: Slide): void => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    handleImageClick(slide);
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.pointerType !== 'mouse') return;
    isHoveringRef.current = true;
    pauseAutoSlide();
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.pointerType !== 'mouse') return;
    isHoveringRef.current = false;
    // Mid-drag the pointer is captured, so the gesture continues off-element
    // and pointerup still resolves it; only resume when nothing is in flight.
    if (!startPosRef.current) resumeAutoSlide();
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
  if (error) //(error)
    if (error) return <div>Error loading banners: {error.message}</div>;
  if (slides.length === 0) return <div>No hero banners available</div>;

  return (
    <div
      className="hero-slider"
      ref={sliderRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        className="hero-slider__track"
        ref={trackRef}
      >
        {slides.map((slide, idx) => (
          <div key={slide.id} className="hero-slider__slide">
            <div className="hero-slider__image-container">
              <ResponsiveBanner
                type="hero"
                desktopImageUrl={slide.desktopImage ?? ''}
                mobileImageUrl={slide.mobileImage}
                altText={slide.name}
                priority={idx === 0}
                className="hero-slider__image"
                onClick={() => handleSlideClick(slide)}
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
