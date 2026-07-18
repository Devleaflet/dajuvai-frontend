import React, { useContext, createContext, useState, useCallback, useEffect } from "react";
import { fetchSubCategory } from "../api/subcategory";
import { useQueryClient } from "@tanstack/react-query";

// Category item
export interface CategoryItem {
  id: number;
  name: string;
  link: string;
  image?: string;
}

// Category
export interface Category {
  id: number;
  name: string;
  icon: string;
  link: string;
  items: CategoryItem[];
}

// Context type
interface CategoryContextType {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  updateCategoriesWithSubcategories: (categoryData: any) => Promise<void>;
}

/**
 * Pure transform: placement/category API rows -> nav Category[] with embedded
 * subcategory items. Each surface (mega menu, slider) maps its OWN placement
 * data locally with this, instead of writing into the one shared context list
 * — otherwise two surfaces with different placements clobber each other.
 */
export const mapToNavCategories = (categoryData: any): Category[] =>
  (Array.isArray(categoryData) ? categoryData : []).map((category: any) => ({
    id: category.id,
    name: category.name,
    icon: category.image || "",
    link: `/shop?categoryId=${category.id}`,
    items:
      category.subcategories?.map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        link: `/shop?categoryId=${category.id}&subcategoryId=${sub.id}`,
        image: sub.image || "",
      })) || [],
  }));

// Context
const categoryContext = createContext<CategoryContextType | undefined>(undefined);

const CategoryContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const queryClient = useQueryClient();
  const subcategoryCache = new Map<number, CategoryItem[]>();

  // Clear cache periodically
  const clearSubcategoryCache = useCallback(() => {
    subcategoryCache.clear();
  }, []);

  useEffect(() => {
    const interval = setInterval(clearSubcategoryCache, 30 * 60 * 1000); // Clear every 30 minutes
    return () => clearInterval(interval);
  }, [clearSubcategoryCache]);

  // Memoized function to fetch subcategories with caching
  const fetchSubcategoriesWithCache = useCallback(async (categoryId: number) => {
    if (subcategoryCache.has(categoryId)) {
      return subcategoryCache.get(categoryId)!;
    }

    const subItems = await fetchSubCategory(categoryId);
    subcategoryCache.set(categoryId, subItems);
    return subItems;
  }, []);

  // Update categories with subcategories
  const updateCategoriesWithSubcategories = async (categoryData: any) => {
    if (!categoryData) return;

    try {
      //('🔄 Processing category data in context:', categoryData);
      
      // Handle new API structure where categories come directly with subcategories
      const categoriesWithSubcategoriesPromises = categoryData.map(async (category: any) => {
        //('📂 Processing category:', category.name, 'with', category.subcategories?.length || 0, 'subcategories');
        
        // Map subcategories to the expected format
        const subItems = category.subcategories?.map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          link: `/shop?categoryId=${category.id}&subcategoryId=${sub.id}`,
          image: sub.image || ""
        })) || [];
        
        return {
          id: category.id,
          name: category.name,
          icon: category.image || "",
          link: `/shop?categoryId=${category.id}`,
          items: subItems,
        };
      });

      const resolvedCategories = await Promise.all(categoriesWithSubcategoriesPromises);
      //('✅ Resolved categories:', resolvedCategories.length, 'categories with subcategories');

      const isDifferent =
        resolvedCategories.length !== categories.length ||
        resolvedCategories.some(
          (cat, i) =>
            cat.id !== categories[i]?.id || cat.items.length !== categories[i]?.items.length
        );

      if (isDifferent) {
        //('🔄 Categories changed, updating state');
        setCategories(resolvedCategories);
        resolvedCategories.forEach((category) => {
          queryClient.prefetchQuery({
            queryKey: ["subcategory", category.id],
            queryFn: () => fetchSubcategoriesWithCache(category.id),
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
          });
        });
      } else {
        //('📋 Categories unchanged, skipping update');
      }
    } catch (error) {
      console.error("❌ Error updating categories:", error);
    }
  };

  return (
    <categoryContext.Provider
      value={{ categories, setCategories, updateCategoriesWithSubcategories }}
    >
      {children}
    </categoryContext.Provider>
  );
};

export const useCategory = () => {
  const context = useContext(categoryContext);
  if (context === undefined) {
    throw new Error("useCategory must be used within a CategoryProvider");
  }
  return context;
};

export default CategoryContextProvider;