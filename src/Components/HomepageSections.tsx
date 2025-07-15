import React from 'react';
import { useHomepageSections } from '../hooks/useHomepageSections';
import ProductCarousel from './ProductCarousel';
import ProductCardSkeleton from '../skeleton/ProductCardSkeleton';
import '../Styles/Home.css';

const HomepageSections: React.FC = () => {
  const { data: sections, isLoading, error } = useHomepageSections();

  if (isLoading) {
    const skeletonSections = [];
    for (let i = 0; i < 2; i++) {
      skeletonSections.push(
        <div key={i} style={{ marginBottom: 32 }}>
          <div className="homepage-section-title skeleton" style={{ width: 200, height: 32, marginBottom: 16 }} />
          <div className="homepage-sections-loading-row">
            {[0, 1, 2, 3].map((_, j) => (
              <ProductCardSkeleton key={j} count={1} />
            ))}
          </div>
        </div>
      );
    }
    return <div className="homepage-sections-loading">{skeletonSections}</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', margin: 32 }}>Failed to load homepage sections.</div>;
  }

  if (!sections || sections.length === 0) {
    return <div style={{ textAlign: 'center', margin: 32 }}>No homepage sections available.</div>;
  }

  return (
    <div className="homepage-sections">
      {sections.filter(section => section.isActive).map(section => {
        const mappedProducts = section.products.map(product => ({
          id: product.id,
          title: product.name,
          description: product.description,
          price: product.basePrice,
          originalPrice: undefined,
          discount: product.discount,
          rating: 0,
          ratingCount: '0',
          isBestSeller: false,
          freeDelivery: true,
          image: product.productImages?.[0] || '',
          stock: product.stock,
          productImages: product.productImages,
        }));
        return (
          <ProductCarousel
            key={section.id}
            title={section.title}
            products={mappedProducts}
            scrollAmount={300}
            showTitle={true}
          />
        );
      })}
    </div>
  );
};

export default HomepageSections; 