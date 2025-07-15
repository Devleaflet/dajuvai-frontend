
import type React from "react"
import { useRef, useState, useEffect } from "react"
import ProductCard from "./ProductCard"
import "../Styles/ProductCarousel.css"
import type { Product } from "./Types/Product"
import { IoIosArrowDroprightCircle, IoIosArrowDropleftCircle } from "react-icons/io"

// Define the type for props
interface ProductCarouselProps {
  title: string
  products: Product[]
  scrollAmount?: number
  showTitle?: boolean
  isLoading?: boolean
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  products,
  scrollAmount = 300,
  showTitle = true,
  isLoading = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [showScrollButtons, setShowScrollButtons] = useState<boolean>(false)

  useEffect(() => {
    const checkWidth = (): void => {
      setShowScrollButtons(window.innerWidth >= 768)
    }

    checkWidth()
    window.addEventListener("resize", checkWidth)

    return () => {
      window.removeEventListener("resize", checkWidth)
    }
  }, [])

  const scroll = (direction: "left" | "right"): void => {
    if (scrollContainerRef.current) {
      const scrollDistance = direction === "left" ? -scrollAmount : scrollAmount
      scrollContainerRef.current.scrollBy({
        left: scrollDistance,
        behavior: "smooth",
      })
    }
  }

  // Skeleton loading component
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
  )

  return (
    <section className="product-carousel">
      {showTitle && <h2 className="product-carousel__title">{title}</h2>}

      <div className="product-carousel__container">
        {showScrollButtons && !isLoading && (
          <div
            className="product-carousel__scroll-button product-carousel__scroll-button--left"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <IoIosArrowDropleftCircle />
          </div>
        )}

        <div className="product-carousel__products" ref={scrollContainerRef}>
          {isLoading
            ? // Show skeleton loading state
              Array.from({ length: 6 }).map((_, index) => <ProductCardSkeleton key={`skeleton-${index}`} />)
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        {showScrollButtons && !isLoading && (
          <div
            className="product-carousel__scroll-button product-carousel__scroll-button--right"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <IoIosArrowDroprightCircle />
          </div>
        )}
      </div>
    </section>
  )
}

export default ProductCarousel
