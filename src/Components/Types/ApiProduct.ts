import { ApiProduct, ProductVariant, Attribute } from "../../types/product";

// Re-export the unified ApiProduct type for backward compatibility
export type { ApiProduct };

// Helper function to convert API product to display product
export const convertApiProductToDisplayProduct = (apiProduct: ApiProduct) => {
  return {
    id: apiProduct.id,
    title: apiProduct.name,
    description: apiProduct.description,
    price: apiProduct.basePrice?.toString() || '0',
    originalPrice: apiProduct.discount && apiProduct.basePrice
      ? apiProduct.discountType === 'PERCENTAGE'
        ? (apiProduct.basePrice * (1 + apiProduct.discount / 100)).toFixed(2)
        : (apiProduct.basePrice + apiProduct.discount).toFixed(2)
      : undefined,
    discount: apiProduct.discount?.toString() || undefined,
    // Prefer backend-provided avgRating when available, else fall back to 0
    rating: Number((apiProduct as any).avgRating ?? (apiProduct as any).rating ?? 0) || 0,
    // Try reviews array length, then reviewsCount/ratingCount fields, else 0
    ratingCount: String(
      (Array.isArray((apiProduct as any).reviews) ? (apiProduct as any).reviews.length : undefined)
      ?? (apiProduct as any).reviewsCount
      ?? (apiProduct as any).ratingCount
      ?? 0
    ),
    image: apiProduct.productImages?.[0] || '',
    brand: apiProduct.brand?.name,
    name: apiProduct.name,
    category: apiProduct.subcategory, // Map subcategory to category for compatibility
    subcategory: apiProduct.subcategory,
    vendor: apiProduct.vendor.businessName,
    productImages: apiProduct.productImages,
  };
};