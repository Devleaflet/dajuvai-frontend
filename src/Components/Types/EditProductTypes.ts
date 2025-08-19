export type InventoryStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'DISCONTINUED' | 'AVAILABLE' | 'UNAVAILABLE';

export interface ProductVariant {
  sku: string;
  price: number;
  stock: number;
  status: InventoryStatus;
  attributes: Array<{ type: string; value: string }>;
  images: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: number;
  subcategoryId: number;
  hasVariants: boolean;
  basePrice?: number;
  stock?: number;
  status: InventoryStatus;
  discount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FLAT';
  dealId?: string;
  images: string[];
  variants?: ProductVariant[];
  [key: string]: any; // For any additional properties
}

export interface Category {
  id: number;
  name: string;
}

export interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
}

export interface EditProductFormData {
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  hasVariants: boolean;
  basePrice: number;
  stock: number;
  status: InventoryStatus;
  discount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FLAT';
  dealId?: string;
  images: File[];
  variants?: Array<{
    sku: string;
    price: number;
    stock: number;
    status: InventoryStatus;
    attributes: Array<{ type: string; value: string }>;
    images: File[];
  }>;
}
