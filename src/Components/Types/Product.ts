// src/Types/Product.ts

export interface Product {
  id: number;
  title?: string;
  description: string;
  price: string | number;
  basePrice?: string | number;
  originalPrice?: string;
  discount?: string;
  rating: number;
  ratingCount: string | number;
  isBestSeller?: boolean;
  freeDelivery?: boolean;
  image: string;
  stock?: number;

  brand?: string;
  name?: string;
  category?: any;
  subcategory?: { id: number; name: string; category?: any };
  vendor?: string;
  piece?: string | number;
  availableColor?: string;
  onSale?: boolean;
  isFeatured?: boolean;
  discountPercentage?: string;
  colors?: { name: string; img: string }[];
  memoryOptions?: string[];
  quantity?: number;
  productImages?: string[];

  // Additional fields for vendor products
  categoryId?: number;
  subcategoryId?: number;
  brand_id?: number | null;
  dealId?: number | null;
  status?: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  discountType?: "PERCENTAGE" | "FLAT";
  size?: string[];
}
