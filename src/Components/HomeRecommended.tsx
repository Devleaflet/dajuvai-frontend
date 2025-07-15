import { useEffect, useState } from "react";
import p1 from "../assets/galaxy.jpg";
import ProductCarousel from "./ProductCarousel";

import { Product } from "./Types/Product";
import { fetchProduct, fetchReviewOf } from "../api/products";
import { useQuery } from "@tanstack/react-query";

import ProductCardSkeleton from "../skeleton/ProductCardSkeleton";

const CACHE_KEY = "homeRecommendedProducts";

const HomeRecommended: React.FC = () => {
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
      image: item.productImages[0] || p1,
      category: item.subcategory?.category,
      subcategory: item.subcategory,
    };
  };

  useEffect(() => {
    if (!data) return;
    (async () => {
      const newItems = await Promise.all(data.map(getProductWithReview));
      setRecommendedProducts(newItems);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newItems));
    })();
  }, [data]);

  if ((isLoading && recommendedProducts.length === 0) || isError)
    return <ProductCardSkeleton count={4} />;

  return (
    <ProductCarousel
      title="RECOMMENDED FOR YOU"
      products={recommendedProducts}
      scrollAmount={300}
    />
  );
};

export default HomeRecommended;
