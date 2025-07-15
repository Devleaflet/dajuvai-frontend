export interface ApiProduct {
  id: number;
  name: string;
  description: string;
  basePrice: number | null;
  stock: number;
  discount: number | null;
  discountType: 'PERCENTAGE' | 'FLAT' | null;
  size: string[];
  status: 'AVAILABLE' | 'UNAVAILABLE';
  productImages: string[];
  inventory: {
    sku: string;
    quantity: number;
    status: string;
  }[];
  vendorId: number;
  brand_id: number | null;
  dealId: number | null;
  created_at: string;
  updated_at: string;
  categoryId: number; // Added for API path parameter
  subcategory: {
    id: number;
    name: string;
    image: string | null;
    createdAt: string;
    updatedAt: string;
  };
  vendor: {
    id: number;
    businessName: string;
    email: string;
    phoneNumber: string;
    districtId: number;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    district: {
      id: number;
      name: string;
    };
  };
  brand: {
    id: number;
    name: string;
  } | null;
  deal: {
    id: number;
    title: string;
  } | null;
}

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
    rating: 0, // Default value since API doesn't provide this
    ratingCount: '0', // Default value since API doesn't provide this
    image: apiProduct.productImages[0] || '',
    brand: apiProduct.brand?.name,
    name: apiProduct.name,
    category: apiProduct.subcategory, // Map subcategory to category for compatibility
    subcategory: apiProduct.subcategory,
    vendor: apiProduct.vendor.businessName,
    productImages: apiProduct.productImages,
  };
};