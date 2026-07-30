import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  IoIosArrowBack,
  IoIosArrowForward,
} from "react-icons/io";
import { Link } from "react-router-dom";
import "../Styles/ProductCarousel.css";
import ProductCard from "./ProductCard";
import type { Product } from "./Types/Product";
import { useUI } from "../context/UIContext";
import ProductCardSkeleton from "../skeleton/ProductCardSkeleton";

interface ProductCarouselProps {
  title: string;
	sectionId: string | number;
  products: Product[];
  scrollAmount?: number;
  showTitle?: boolean;
  isLoading?: boolean;
  isHomepage?: boolean;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  sectionId,
  products,
  scrollAmount = 300,
  showTitle = true,
  isLoading = false,
  isHomepage = false,
}) => {
  const { cartOpen } = useUI();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollButtons, setShowScrollButtons] = useState<boolean>(false);
  const [showLeftButton, setShowLeftButton] = useState<boolean>(false);
  const [showRightButton, setShowRightButton] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);

  const displayedProducts = isHomepage ? products.slice(0, 25) : products;
  //(products)
  useEffect(() => {
    const checkWidth = (): void => {
      setShowScrollButtons(window.innerWidth >= 768);
    };

    const checkScroll = (): void => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } =
          scrollContainerRef.current;
        setShowLeftButton(scrollLeft > 0);
        setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    checkWidth();
    checkScroll();
    window.addEventListener("resize", checkWidth);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.addEventListener("scroll", checkScroll);
    }

    return () => {
      window.removeEventListener("resize", checkWidth);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener("scroll", checkScroll);
      }
    };
  }, []);

  const scroll = (direction: "left" | "right"): void => {
    if (scrollContainerRef.current) {
      const scrollDistance =
        direction === "left" ? -scrollAmount : scrollAmount;
      scrollContainerRef.current.scrollBy({
        left: scrollDistance,
        behavior: "smooth",
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return;
    if (scrollContainerRef.current) {
      setIsDragging(true);
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
      scrollContainerRef.current.style.cursor = "grabbing";
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab";
      scrollContainerRef.current.style.pointerEvents = "auto";
    }
  };

  const handleMouseLeave = (): void => {
    if (isDragging) {
      setIsDragging(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.cursor = "grab";
        scrollContainerRef.current.style.pointerEvents = "auto";
      }
    }
  };

  return (
    <section className="product-carousel">
      {showTitle && (
        <div className="product-carousel__title-container">
          <h2 className="product-carousel__title">{title}</h2>
          <Link
            to={`/section/${sectionId}?sectionname=${title}`}
            style={{
              padding: "0.4rem 2rem",
              backgroundColor: "#ff6b00",
              color: "white",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "0.85rem",
              transition: "all 0.2s ease",
              flexShrink: "0",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#e05a00";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#ff6b00";
            }}
          >
            View All
          </Link>
        </div>
      )}

      <div className="product-carousel__container">
        {showScrollButtons && showLeftButton && !cartOpen && (
          <button
            className="product-carousel__scroll-button product-carousel__scroll-button--left"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <IoIosArrowBack />
          </button>
        )}
        {showScrollButtons && showRightButton && !cartOpen && (
          <button
            className="product-carousel__scroll-button product-carousel__scroll-button--right"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <IoIosArrowForward />
          </button>
        )}
        <div
          className={`product-carousel__products ${
            isDragging ? "product-carousel__products--dragging" : ""
          }`}
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} count={1} />
              ))
            : displayedProducts.map((product) => (
                <div key={product.id} className="product-card__wrapper">
                  <ProductCard product={product} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
