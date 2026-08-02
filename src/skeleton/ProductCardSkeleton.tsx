import React from 'react';
import '../Styles/ProductCardSkeleton.css';

const ProductCardSkeleton: React.FC<{ count: number }> = ({ count }) => {
  return (
    <>
      {Array(count).fill(null).map((_, index) => (
        <div key={index} className="product-card-skeleton-wrapper">
          <div className="product-card-skeleton">
            <div className="product-card-skeleton__media">
              <div className="product-card-skeleton__image product-card-skeleton__shimmer" />
            </div>
            <div className="product-card-skeleton__content">
              <div className="product-card-skeleton__line product-card-skeleton__line--title product-card-skeleton__shimmer" />
              <div className="product-card-skeleton__line product-card-skeleton__line--description product-card-skeleton__shimmer" />
              <div className="product-card-skeleton__line product-card-skeleton__line--rating product-card-skeleton__shimmer" />
              <div className="product-card-skeleton__line product-card-skeleton__line--price product-card-skeleton__shimmer" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductCardSkeleton;
