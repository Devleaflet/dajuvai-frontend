"use client";

import React, { useRef, useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import "../Styles/CategorySlider.css";
import { useCategory } from "../context/Category";
import { fetchCategory } from "../api/category";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "../context/Category";

const CategorySlider: React.FC = () => {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [showPrev, setShowPrev] = useState<boolean>(false);
  const [showNext, setShowNext] = useState<boolean>(true);
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768);
  const [isCategoriesReady, setIsCategoriesReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);

  const categoryContext = useCategory();
  const updateCategoriesWithSubcategories =
    categoryContext?.updateCategoriesWithSubcategories;
  const categories = categoryContext?.categories || [];
  const navigate = useNavigate();
  const location = useLocation();

  const { data: categoryData, isLoading: isCategoryLoading } = useQuery({
    queryKey: ["cat"],
    queryFn: fetchCategory,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (updateCategoriesWithSubcategories && categoryData) {
      updateCategoriesWithSubcategories(categoryData).then(() => {
        setIsCategoriesReady(true);
      });
    }
  }, [categoryData, updateCategoriesWithSubcategories]);

  const showLoading = isCategoryLoading || !isCategoriesReady;

  useEffect(() => {
    if (!showLoading && categories.length > 0) {
      setTimeout(() => {
        checkScroll();
      }, 100);
    }
  }, [showLoading, categories.length]);

  // Additional effect to ensure scroll check happens after render
  useEffect(() => {
    if (sliderRef.current && categories.length > 0 && !showLoading) {
      const timer = setTimeout(() => {
        checkScroll();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [categories, showLoading]);

  const handleCategoryClick = (mainCategoryId: string, itemId: string) => {
    if (Math.abs(dragDistance) > 5) return;

    const newUrl = `/shop?categoryId=${mainCategoryId}&subcategoryId=${itemId}`;

    if (location.pathname === "/shop") {
      navigate(newUrl, { replace: true });

      const event = new CustomEvent("shopFiltersChanged", {
        detail: {
          categoryId: Number(mainCategoryId),
          subcategoryId: Number(itemId),
        },
      });

      setTimeout(() => {
        window.dispatchEvent(event);
      }, 10);
    } else {
      navigate(newUrl);
    }
  };

  const scroll = (direction: "left" | "right") => {
    const slider = sliderRef.current;
    if (!slider) return;

    const scrollAmount = slider.offsetWidth * 0.8; // Scroll 80% of container width
    const newScrollLeft =
      direction === "left"
        ? Math.max(0, slider.scrollLeft - scrollAmount)
        : Math.min(slider.scrollWidth - slider.clientWidth, slider.scrollLeft + scrollAmount);

    slider.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });

    // Update navigation buttons after scroll
    setTimeout(() => {
      checkScroll();
    }, 300);
  };

  const checkScroll = () => {
    const slider = sliderRef.current;
    if (!slider) return;

    const hasOverflow = slider.scrollWidth > slider.clientWidth;
    setShowPrev(hasOverflow && slider.scrollLeft > 0);
    setShowNext(
      hasOverflow &&
        slider.scrollLeft < slider.scrollWidth - slider.clientWidth - 10
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const slider = sliderRef.current;
    if (!slider) return;

    setIsDragging(true);
    setStartX(e.pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
    setDragDistance(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    const slider = sliderRef.current;
    if (!slider) return;

    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    setDragDistance(Math.abs(walk));
    slider.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setDragDistance(0), 100);
  };

  const handleMouseLeave = () => {
    if (isDragging) handleMouseUp();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const slider = sliderRef.current;
    if (!slider) return;

    setIsDragging(true);
    setStartX(e.touches[0].pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
    setDragDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const slider = sliderRef.current;
    if (!slider) return;

    const x = e.touches[0].pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5;
    setDragDistance(Math.abs(walk));
    slider.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTimeout(() => setDragDistance(0), 100);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
      if (sliderRef.current) checkScroll();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Add scroll event listener to update navigation buttons
  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      const handleScroll = () => {
        checkScroll();
      };
      
      slider.addEventListener('scroll', handleScroll);
      return () => slider.removeEventListener('scroll', handleScroll);
    }
  }, [categories.length, showLoading]);

  const CategorySkeleton = () => (
    <div className="top-category__card top-category__card--skeleton">
      <div className="top-category__image-container">
        <div className="top-category__image-skeleton skeleton"></div>
      </div>
      <div className="top-category__name-skeleton skeleton-text"></div>
    </div>
  );

  // 🔹 Subcomponent that shows fallback if image fails
  const ImageWithFallback: React.FC<{ src?: string; name: string }> = ({
    src,
    name,
  }) => {
    const [error, setError] = useState(false);

    if (!src || error) {
      return (
        <div className="top-category__image-fallback">
          {name || "No Image"}
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={name || "Category image"}
        className="top-category__image"
        loading="lazy"
        decoding="async"
        width="80"
        height="80"
        draggable={false}
        onError={() => setError(true)}
      />
    );
  };

  return (
    <div className="top-category">
      {isDesktop && showPrev && (
        <button
          className="top-category__nav top-category__nav--prev"
          onClick={() => scroll("left")}
        >
          <ArrowLeft />
        </button>
      )}
      {isDesktop && showNext && (
        <button
          className="top-category__nav top-category__nav--next"
          onClick={() => scroll("right")}
        >
          <ArrowRight />
        </button>
      )}

      <div
        className="top-category__slider-container"
        ref={sliderRef}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {showLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <CategorySkeleton key={`skeleton-${index}`} />
          ))
        ) : categories.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "#666",
            }}
          >
            No categories available
          </div>
        ) : (
          categories.map((maincategory: Category) =>
            maincategory.items.map((item) => (
              <div
                key={item.id}
                className="top-category__card"
                onClick={() =>
                  handleCategoryClick(maincategory.id, item.id)
                }
              >
                <div className="top-category__image-container">
                  <ImageWithFallback src={item.image} name={item.name} />
                </div>
                <p className="top-category__name">{item.name}</p>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default CategorySlider;
