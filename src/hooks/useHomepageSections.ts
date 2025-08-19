import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../config';
import type { ProductVariant } from '../types/product';

export interface HomepageProduct {
  id: number;
  name: string;
  description: string;
  basePrice: string;
  stock: number;
  discount: string;
  discountType?: string;
  size: string[];
  productImages: string[];
  status: string;
  quantity: number | null;
  vendorId: number | null;
  userId: number | null;
  brand_id: number | null;
  dealId: number | null;
  created_at: string;
  updated_at: string;
  // Optional fields for variant-aware rendering
  hasVariants?: boolean;
  variants?: ProductVariant[];
}

export interface HomepageSection {
  id: number;
  title: string;
  isActive: boolean;
  products: HomepageProduct[];
}

export function useHomepageSections(includeInactive = false) {
  return useQuery<HomepageSection[]>({
    queryKey: ['homepageSections', includeInactive],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/homepage?includeInactive=${includeInactive}`);
      if (!res.ok) throw new Error('Failed to fetch homepage sections');
      const data = await res.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
} 