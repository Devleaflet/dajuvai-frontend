import React from 'react';

const ProductCardSkeleton: React.FC<{ count: number }> = ({ count }) => {
  return (
    <>
      {Array(count).fill(null).map((_, index) => (
        <div key={index} className="product-card-skeleton-wrapper">
          <div className="product-card-skeleton">
            {/* Image skeleton */}
            <div className="skeleton-image shimmer" />
            <div className="skeleton-content">
              <div className="skeleton-title shimmer" />
              <div className="skeleton-desc shimmer" />
              <div className="skeleton-price shimmer" />
              <div className="skeleton-rating shimmer" />
            </div>
            <div className="skeleton-button shimmer" />
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductCardSkeleton;
