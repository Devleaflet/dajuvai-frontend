import React, { useRef, useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { ApiProduct } from '../../types/product';
import ProductCard1 from '../../ALT/ProductCard1';
import type { Product as UIProduct } from '../Types/Product';
import '../../Styles/RecommendedProducts.css';

interface RecommendedProductsProps {
  products: ApiProduct[];
  currentProductId: number;
  fallbackCategoryId?: string | number;
  fallbackSubcategoryId?: string | number;
  isLoading?: boolean;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  products,
  currentProductId,
  fallbackCategoryId,
  fallbackSubcategoryId,
  isLoading = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollButtons, setShowScrollButtons] = useState<boolean>(false);
  const [needsScrolling, setNeedsScrolling] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const scrollAmount = 300;

  // Filter out current product from recommendations
  const filteredProducts = products.filter((p) => p.id !== currentProductId);

  // Slider settings
  const sliderSettings = {
    dots: true, // Show navigation dots
    infinite: filteredProducts.length > 3, // Loop only if enough products
    speed: 500, // Transition speed in ms
    slidesToShow: Math.min(4, filteredProducts.length), // Show up to 3 products
    slidesToScroll: 1, // Scroll 1 product at a time
    arrows: true, // Show next/prev arrows
    responsive: [
      {
        breakpoint: 1024, // For tablets
        settings: {
          slidesToShow: Math.min(3, filteredProducts.length),
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600, // For mobile
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  if (isLoading) {
    return (
      <section className="recommended-products">
        <div className="recommended-products__header">
          <h3 className="recommended-products__title">Recommended for you</h3>
          <p className="recommended-products__subtitle">Products you might love ❤️</p>
        </div>
        <div className="recommended-products__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="recommended-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line long"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="recommended-empty">
        <div className="recommended-empty__icon">✨</div>
        <p className="recommended-empty__text">No recommendations available at the moment</p>
        <p className="recommended-empty__subtext">Check back later for personalized suggestions</p>
      </div>
    );
  }

  return (
    <section className="recommended-products">
      <div className="recommended-products__header">
        <h3 className="recommended-products__title">Recommended for you</h3>
        <p className="recommended-products__subtitle">Products you might love ❤️</p>
      </div>
      <Slider {...sliderSettings}>
        {filteredProducts.slice(0, 8).map((p) => {
          // Derive IDs from multiple possible shapes
          const categoryId =
            (p as any).categoryId ??
            (p as any)?.category?.id ??
            (fallbackCategoryId != null ? Number(fallbackCategoryId) : undefined);
          const subcatId =
            (p as any).subcategoryId ??
            (p as any)?.subcategory?.id ??
            (fallbackSubcategoryId != null ? Number(fallbackSubcategoryId) : undefined);

          // Map ApiProduct to UI Product expected by ProductCard
          const mapped: UIProduct = {
            id: p.id,
            title: p.name,
            description: p.description || '',
            price: (p as any).price ?? p.basePrice ?? 0,
            basePrice: p.basePrice ?? undefined,
            originalPrice: undefined,
            discount: (p as any).discount ?? undefined,
            discountType: p.discountType ?? undefined,
            rating: Number((p as any).avgRating.avg ?? (p as any).rating ?? 0) || 0,
            ratingCount: String(
              (Array.isArray((p as any).reviews) ? (p as any).reviews.length : undefined) ??
                (p as any).avgRating.count ??
                (p as any).ratingCount ??
                0
            ),
            isBestSeller: false,
            freeDelivery: false,
            image: p.image || (p.productImages && p.productImages[0]) || '',
            stock: (p as any).stock ?? undefined,
            category: categoryId != null ? { id: Number(categoryId) } as any : undefined,
            subcategory: subcatId != null ? { id: Number(subcatId), name: (p as any)?.subcategory?.name || '' } : undefined,
            productImages: p.productImages || [],
            variants: (p.variants || []).map((v: any) => ({
              id: v.id,
              price: v.price ?? v.basePrice,
              originalPrice: v.originalPrice ?? v.basePrice,
              stock: v.stock,
              sku: v.sku,
              image: Array.isArray(v.variantImages) ? v.variantImages[0] : v.image,
              images: Array.isArray(v.variantImages) ? v.variantImages : Array.isArray(v.images) ? v.images : undefined,
              discount: v.discount,
              discountType: v.discountType,
              attributes: v.attributes,
            })),
          };

          return (
            <div key={p.id} className="recommended-product-card__wrapper">
              <ProductCard1 product={mapped} />
            </div>
          );
        })}
      </Slider>
    </section>
  );
};

export default RecommendedProducts;