import React from 'react';
import { ApiProduct } from '../../types/product';
import ProductCard1 from '../../ALT/ProductCard1';
import type { Product as UIProduct } from '../Types/Product';
import "../../Styles/RecommendedProducts.css";

interface RecommendedProductsProps {
  products: ApiProduct[];
  currentProductId: number;
  // Optional fallbacks from current page URL if product items miss categoryId/subcategoryId
  fallbackCategoryId?: string | number;
  fallbackSubcategoryId?: string | number;
  isLoading?: boolean;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  products,
  currentProductId,
  fallbackCategoryId,
  fallbackSubcategoryId,
  isLoading = false
}) => {
  // Filter out current product from recommendations
  const filteredProducts = products.filter(p => p.id !== currentProductId);
  
  if (isLoading) {
    return (
      <div className="recommended-products">
        <div className="recommended-products__header">
          <h3 className="recommended-products__title">Recommended for you</h3>
          <p className="recommended-products__subtitle">Products you might love</p>
        </div>
        <div className="recommended-products__grid">
          {Array.from({ length: 6 }).map((_, i) => ( // Changed to 6 skeletons
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
      </div>
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
    <div className="recommended-products">
      <div className="recommended-products__header">
        <h3 className="recommended-products__title">Recommended for you</h3>
        <p className="recommended-products__subtitle">Products you might love</p>
      </div>
      <div className="recommended-products__grid">
        {filteredProducts.slice(0, 8).map((p) => { // Already slicing to 6 products
          // Derive IDs from multiple possible shapes
          const categoryId = (p as any).categoryId
            ?? (p as any)?.category?.id
            ?? (fallbackCategoryId != null ? Number(fallbackCategoryId) : undefined);
          const subcatId = (p as any).subcategoryId
            ?? (p as any)?.subcategory?.id
            ?? (fallbackSubcategoryId != null ? Number(fallbackSubcategoryId) : undefined);

          // Map ApiProduct to UI Product expected by ProductCard
          const mapped: UIProduct = {
            id: p.id,
            title: p.name,
            description: p.description || '',
            // Base values; ProductCard recalculates using variants/discounts
            price: (p as any).price ?? p.basePrice ?? 0,
            basePrice: p.basePrice ?? undefined,
            originalPrice: undefined,
            discount: (p as any).discount ?? undefined,
            discountType: p.discountType ?? undefined,
            rating: Number((p as any).avgRating.avg ?? (p as any).rating ?? 0) || 0,
            ratingCount: String(
              (Array.isArray((p as any).reviews) ? (p as any).reviews.length : undefined)
              ?? (p as any).avgRating.count
              ?? (p as any).ratingCount
              ?? 0
            ),
            isBestSeller: false,
            freeDelivery: false,
            image: p.image || (p.productImages && p.productImages[0]) || '',
            stock: (p as any).stock ?? undefined,
            category: categoryId != null ? { id: Number(categoryId) } as any : undefined,
            subcategory: subcatId != null ? { id: Number(subcatId), name: (p as any)?.subcategory?.name || '' } : undefined,
            productImages: p.productImages || [],
            // Pass variants through with fields ProductCard may use (variantImages, discount, discountType, price/basePrice)
            variants: (p.variants || []).map((v: any) => ({
              id: v.id,
              price: v.price ?? v.basePrice,
              originalPrice: v.originalPrice ?? v.basePrice,
              stock: v.stock,
              sku: v.sku,
              image: Array.isArray(v.variantImages) ? v.variantImages[0] : v.image,
              images: Array.isArray(v.variantImages) ? v.variantImages : (Array.isArray(v.images) ? v.images : undefined),
              discount: v.discount,
              discountType: v.discountType,
              attributes: v.attributes,
            })),
          };

          return (
            <div key={p.id} className="recommended-products__item">
              <ProductCard1 product={mapped} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedProducts;