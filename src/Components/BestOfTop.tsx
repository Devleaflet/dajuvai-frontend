import { useQuery } from "@tanstack/react-query";
import ProductCarousel from "./ProductCarousel";
import { fetchProduct, fetchReviewOf } from "../api/products";
import { useEffect, useState } from "react";
import ProductCardSkeleton from "../skeleton/ProductCardSkeleton";
import defaultProductImage from "../assets/logo.webp";

// Define the type for a single product
import { Product } from "./Types/Product";

const CACHE_KEY = "bestOfTopProducts";

const BestOfTop: React.FC = () => {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  // Try to load from cache on mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecommendedProducts(parsed);
        }
      } catch {}
    }
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProduct("/api/categories/all/products"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const getProductWithReview = async (item: any): Promise<Product> => {
    const { averageRating, reviews } = await fetchReviewOf(item.id);
    return {
      id: item.id,
      title: item.name,
      description: item.description,
      originalPrice: item.basePrice,
      discount: item.discount,
      price: Number(item.basePrice * (1 - item.discount / 100)).toFixed(2),
      rating: Number(averageRating),
      ratingCount: reviews.length,
      isBestSeller: item.stock > 20,
      freeDelivery: true,
      image: item.productImages?.[0] || defaultProductImage,
      productImages: item.productImages || [],
      category: item.subcategory?.category,
      subcategory: item.subcategory,
    };
  };

  useEffect(() => {
    if (data?.data) {
      const processProducts = async () => {
        const products = await Promise.all(
          data.data.map(getProductWithReview)
        );
        setRecommendedProducts(products);
        localStorage.setItem(CACHE_KEY, JSON.stringify(products));
      };
      processProducts();
    }
  }, [data]);

  if (isLoading) {
    return <ProductCardSkeleton count={4} />;
  }

  if (isError || !recommendedProducts.length) {
    return null;
  }

  return (
    <ProductCarousel
      title="Best of Top Products"
      products={recommendedProducts}
      scrollAmount={300}
    />
  );
};

export default BestOfTop;
