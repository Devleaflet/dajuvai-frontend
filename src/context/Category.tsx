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
      const categoriesWithSubcategoriesPromises = categoryData.map(async (section: any) => {
        const mainCategory = section.category;
        const subItems = await fetchSubcategoriesWithCache(mainCategory.id);
        return {
          id: mainCategory.id,
          name: mainCategory.name,
          icon: mainCategory.image || "",
          link: `/shop?categoryId=${mainCategory.id}`,
          items: subItems,
        };
      });

      const resolvedCategories = await Promise.all(categoriesWithSubcategoriesPromises);

      const isDifferent =
        resolvedCategories.length !== categories.length ||
        resolvedCategories.some(
          (cat, i) =>
            cat.id !== categories[i]?.id || cat.items.length !== categories[i]?.items.length
        );

      if (isDifferent) {
        setCategories(resolvedCategories);
        resolvedCategories.forEach((category) => {
          queryClient.prefetchQuery({
            queryKey: ["subcategory", category.id],
            queryFn: () => fetchSubcategoriesWithCache(category.id),
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
          });
        });
      }
    } catch (error) {
      console.error("Error updating categories:", error);
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