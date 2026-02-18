export interface Product {
  id: number;
  name: string;
  description: string;
  price: string | number;
  basePrice?: number | null;
  finalPrice?: number | null;
  stock: number;
  hasVariants: boolean;
  discount: string | number | null;
  discountType: "PERCENTAGE" | "FLAT" | "NONE" | null;
  size: string[];
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  productImages: string[];
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
  categoryId?: number;
  subcategoryId?: number;
  quantity?: number;
  brand_id?: number | null;
  dealId?: number | null;
  bannerId?: number | null;
  // Computed fields for display
  image: string;
  brand?: { id: number; name: string } | null;
  category?: string;
  piece?: number;
  availableColor?: string;
  onSale?: boolean;
  isFeatured?: boolean;
  rating?: number;
  ratingCount?: string | number;
  isBestSeller?: boolean;
  freeDelivery?: boolean;
  title?: string;
  // Required for ApiProduct compatibility
  inventory: {
    sku: string;
    quantity: number;
    status: string;
  }[];
  vendorId: number;
  created_at: string;
  updated_at: string;
  deal: { id: number; title: string } | null;
}

export interface ListProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: string | number | null;
  rating: number;
  ratingCount: string;
  isBestSeller: boolean;
  freeDelivery: boolean;
  image: string;
  name: string;
  category: string;
  vendor: string;
  piece: number;
  availableColor: string;
  onSale: boolean;
  isFeatured: boolean;
}

export interface ProductFormData {
  name: string;
  description: string;
  basePrice: string | number | null;
  stock: number;
  discount: string | number | null;
  discountType: "PERCENTAGE" | "FLAT" | "NONE" | null;
  size: string[];
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  productImages: (File | string)[];
  categoryId: number;
  subcategoryId: number;
  quantity?: number;
  brand_id?: number | null;
  dealId?: number | null;
  bannerId?: number | null;
  inventory: {
    sku: string;
    status: string;
  }[];
  vendorId: string;
  // New fields for variant support
  hasVariants: boolean;
  variants?: ProductVariant[];
  brandId?: number | null;
}

// New interfaces for the updated API
export interface Image {
  url: string;
}

// Unified complex attribute structure used by both New and Edit modals
export interface Attribute {
  type: string;
  values: Array<{
    value: string;
    nestedAttributes?: Array<{
      type: string;
      values: string[];
    }>;
  }>;
}

export interface ProductVariant {
  sku: string;
  price: number;
  stock: number;
  finalPrice: number;
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  // Use unified complex attributes shape
  attributes: Attribute[];
  // Keep both images fields to support UI and API payload compatibility
  images: (File | string)[];
  variantImages: (File | string)[];
  discount?: number | string | null;
  discountType?: 'PERCENTAGE' | 'FLAT' | 'NONE' | null;
  imagePreviews?: string[]; // For client-side preview URLs
}

export interface NewProductFormData {
  name: string;
  description?: string;
  basePrice?: number;
  discount?: number;
  discountType?: 'PERCENTAGE' | 'FLAT' | 'NONE';
  status?: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  stock?: number;
  hasVariants: boolean;
  variants?: ProductVariant[];
  subcategoryId: number;
  dealId?: number;
  bannerId?: number;
  productImages?: File[];
}

export interface ApiProduct {
  id: number;
  name: string;
  description: string;
  basePrice: number | null;
  finalPrice: number;
  stock: number;
  discount: number | null;
  discountType: 'PERCENTAGE' | 'FLAT' | 'NONE' | null;
  size: string[];
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  productImages: string[];
  inventory: {
    sku: string;
    quantity: number;
    status: string;
  }[];
  vendorId: number;
  brand_id: number | null;
  dealId: number | null;
  bannerId: number | null;
  createdAt: string;
  updated_at: string;
  categoryId: number;
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
  hasVariants: boolean;
  variants?: ProductVariant[];
  // Compatibility fields
  price?: number;
  image?: string;
}