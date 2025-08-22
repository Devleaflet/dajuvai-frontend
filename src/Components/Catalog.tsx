import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageLoader from "./PageLoader";
import { fetchProductsBySection } from "../api/products";
import "../Styles/Catalog.css";
import type { Product } from "../Types/Product";

const Catalog: React.FC = () => {
  const { sectionId } = useParams<{ sectionId: string }>();

  // Fetch products for the given sectionId using React Query
  const {
    data: products,
    isLoading,
    error,
  } = useQuery<Product[], Error>({
    queryKey: ["products", sectionId],
    queryFn: () => fetchProductsBySection(Number(sectionId)),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    enabled: !!sectionId, // Only fetch if sectionId is present
  });

  // Scroll to top when the page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="catalog__error">
        <Navbar />
        <div className="catalog__content">
          <h2>Error Loading Products</h2>
          <p>{error.message}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="catalog">
      <Navbar />
      <div className="catalog__content">
        <h2 className="catalog__title">All Products</h2>
        {products && products.length > 0 ? (
          <div className="catalog__products">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="catalog__empty">No products available in this section.</p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Catalog;