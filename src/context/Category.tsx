import React, { useContext, createContext, useState, useCallback } from "react";
import { fetchSubCategory } from "../api/subcategory";
import { useQueryClient } from "@tanstack/react-query";

// category item
export interface CategoryItem {
  id: number;
  name: string;
  link: string;
  image?: string;
}

// category
export interface Category {
  id: number;
  name: string;
  icon: string;
  link: string;
  items: CategoryItem[];
}

//context type
interface CategoryContextType {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  updateCategoriesWithSubcategories: (categoryData: any) => Promise<void>;
}

// context
const categoryContext = createContext<CategoryContextType | undefined>(
  undefined
);

const CategoryContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const queryClient = useQueryClient();

  // Cache for subcategories
  const subcategoryCache = new Map<number, CategoryItem[]>();

  // Memoized function to fetch subcategories with caching
  const fetchSubcategoriesWithCache = useCallback(async (categoryId: number) => {
    // Check if subcategories are already in cache
    if (subcategoryCache.has(categoryId)) {
      return subcategoryCache.get(categoryId)!;
    }

    // If not in cache, fetch and store in cache
    const subItems = await fetchSubCategory(categoryId);
    subcategoryCache.set(categoryId, subItems);
    return subItems;
  }, []);

  // Update categories with subcategories
  const updateCategoriesWithSubcategories = async (categoryData: any) => {
    if (!categoryData) return;

    try {
      // Fetch all subcategories in parallel
      const categoriesWithSubcategoriesPromises = categoryData.map(
        async (mainCategory: any) => {
          const subItems = await fetchSubcategoriesWithCache(mainCategory.id);
          return {
            id: mainCategory.id,
            name: mainCategory.name,
            icon: mainCategory.icon || "",
            link: mainCategory.link,
            items: subItems,
          };
        }
      );

      const resolvedCategories = await Promise.all(categoriesWithSubcategoriesPromises);

      // Only update if different
      const isDifferent =
        resolvedCategories.length !== categories.length ||
        resolvedCategories.some((cat, i) =>
          cat.id !== categories[i]?.id || cat.items.length !== categories[i]?.items.length
        );

      if (isDifferent) {
        setCategories(resolvedCategories);
        
        // Prefetch subcategories for each category
        resolvedCategories.forEach((category) => {
          queryClient.prefetchQuery({
            queryKey: ['subcategory', category.id],
            queryFn: () => fetchSubcategoriesWithCache(category.id),
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes
          });
        });
      }
    } catch (error) {
      console.error('Error updating categories:', error);
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
