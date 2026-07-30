import { ApiProduct } from "../../types/product";

// Re-export the unified ApiProduct type for backward compatibility
export type { ApiProduct };

// Helper function to convert API product to display product
export const convertApiProductToDisplayProduct = (apiProduct: ApiProduct) => {
  // Sort variants similar to getProductPrimaryImage (by position then id)
  const variantsArr: any[] = Array.isArray((apiProduct as any).variants)
    ? ((apiProduct as any).variants as any[])
    : [];
  const orderedVariants = [...variantsArr].sort((a: any, b: any) => {
    const ap = Number(a?.position);
    const bp = Number(b?.position);
    if (Number.isFinite(ap) && Number.isFinite(bp)) return ap - bp;
    const aid = Number(a?.id);
    const bid = Number(b?.id);
    if (Number.isFinite(aid) && Number.isFinite(bid)) return aid - bid;
    return 0;
  });

  const firstV = orderedVariants[0];

  const toNum = (v: any): number => {
    if (v === undefined || v === null) return 0;
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return isFinite(n) ? n : 0;
  };

  // Compute display price: prefer first variant if present, else product base
  let displayPrice = 0;
  let originalPrice: string | undefined = undefined;
  if (firstV) {
    displayPrice = toNum(firstV.finalPrice ?? firstV.price ?? firstV.basePrice ?? apiProduct.basePrice ?? 0);
    const baseNum = toNum(firstV.basePrice ?? firstV.price ?? firstV.originalPrice ?? apiProduct.basePrice ?? 0);
    if (baseNum > displayPrice) originalPrice = baseNum.toFixed(2);
  } else {
    displayPrice = toNum(apiProduct.finalPrice ?? apiProduct.basePrice ?? 0);
    const baseNum = toNum(apiProduct.basePrice ?? 0);
    if (Number(apiProduct.discountAmount) > 0 && baseNum > displayPrice) originalPrice = baseNum.toFixed(2);
  }

  return {
    id: apiProduct.id,
    title: apiProduct.name,
    description: apiProduct.description,
    price: displayPrice.toFixed(2),
    originalPrice,
    discountAmount: apiProduct.discountAmount,
    discountPercent: apiProduct.discountPercent,
    // Prefer backend-provided avgRating when available, else fall back to 0
    rating: Number((apiProduct as any).avgRating ?? (apiProduct as any).rating ?? 0) || 0,
    // Try reviews array length, then reviewsCount/ratingCount fields, else 0
    ratingCount: String(
      (Array.isArray((apiProduct as any).reviews) ? (apiProduct as any).reviews.length : undefined)
      ?? (apiProduct as any).reviewsCount
      ?? (apiProduct as any).ratingCount
      ?? 0
    ),
    image: (apiProduct.productImages && apiProduct.productImages[0]) || '',
    brand: typeof apiProduct.brand === 'object' && apiProduct.brand ? apiProduct.brand.name : (typeof apiProduct.brand === 'string' ? apiProduct.brand : undefined),
    keywords: apiProduct.keywords || undefined,
    name: apiProduct.name,
    // Map correctly
    category: (apiProduct as any).category ?? undefined,
    subcategory: apiProduct.subcategory,
    vendor: apiProduct.vendor?.businessName,
    productImages: apiProduct.productImages,
    // Pass through variants in a UI-friendly shape
    variants: orderedVariants.map((v: any) => ({
      id: v?.id,
      price: v?.price ?? v?.basePrice,
      originalPrice: v?.originalPrice ?? v?.basePrice,
      stock: v?.stock,
      sku: v?.sku,
      image: v?.image,
      images: Array.isArray(v?.images) ? v.images : undefined,
      variantImages: Array.isArray(v?.variantImages) ? v.variantImages : undefined,
      discountAmount: v?.discountAmount,
      discountPercent: v?.discountPercent,
      discountType: v?.discountType,
      position: v?.position,
      attributes: v?.attributes,
    })),
  };
};
