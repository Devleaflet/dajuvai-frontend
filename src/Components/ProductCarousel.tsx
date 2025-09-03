import type React from "react";
import { useEffect, useRef, useState } from "react";
import { IoIosArrowDropleftCircle, IoIosArrowDroprightCircle } from "react-icons/io";
import { Link } from "react-router-dom";
import "../Styles/ProductCarousel.css";
import ProductCard from "./ProductCard";
import type { Product } from "./Types/Product";

interface ProductCarouselProps {
  title: string;
  sectionId: number;
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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollButtons, setShowScrollButtons] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);

  const displayedProducts = isHomepage ? products.slice(0, 25) : products;

  useEffect(() => {
    const checkWidth = (): void => {
      setShowScrollButtons(window.innerWidth >= 768);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);

    return () => {
      window.removeEventListener("resize", checkWidth);
    };
  }, []);

  const scroll = (direction: "left" | "right"): void => {
    if (scrollContainerRef.current) {
      const scrollDistance = direction === "left" ? -scrollAmount : scrollAmount;
      scrollContainerRef.current.scrollBy({
        left: scrollDistance,
        behavior: "smooth",
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    if (scrollContainerRef.current) {
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.touches[0].clientX;
    const walk = (startX - x) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft + walk;
  };

  const handleTouchEnd = (): void => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.pointerEvents = "auto";
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

  const ProductCardSkeleton = () => (
    <div className="product-card product-card--skeleton">
      <div className="product-card__header">
        <div className="product-card__tag-skeleton skeleton"></div>
        <div className="product-card__wishlist-skeleton skeleton"></div>
      </div>
      <div className="product-card__image">
        <div className="product-card__image-skeleton skeleton"></div>
      </div>
      <div className="product-card__rating">
        <div className="product-card__rating-skeleton skeleton"></div>
        <div className="product-card__cart-skeleton skeleton"></div>
      </div>
      <div className="product-card__info">
        <div className="product-card__title-skeleton skeleton"></div>
        <div className="product-card__description-skeleton skeleton"></div>
        <div className="product-card__price">
          <div className="product-card__price-skeleton skeleton"></div>
          <div className="product-card__price-details">
            <div className="product-card__original-price-skeleton skeleton"></div>
            <div className="product-card__discount-skeleton skeleton"></div>
          </div>
        </div>
        <div className="product-card__delivery-skeleton skeleton"></div>
      </div>
    </div>
  );

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
              transition: "all 0.2s ease ",
              flexShrink: "0"
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
        {/* Left arrow button removed */}

        <div
          className={`product-carousel__products ${isDragging ? "product-carousel__products--dragging" : ""}`}
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => <ProductCardSkeleton key={`skeleton-${index}`} />)
            : displayedProducts.map((product) => (
              <div key={product.id} className="product-card__wrapper">
                <ProductCard product={product} />
              </div>
            ))}
        </div>

        {/* Right arrow button removed */}
      </div>
    </section>
  );
};

export default ProductCarousel;