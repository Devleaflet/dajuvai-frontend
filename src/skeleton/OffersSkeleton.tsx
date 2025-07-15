// components/OffersSkeleton.tsx
import React from 'react';
import '../Styles/OffersSkeleton.css';

const OffersSkeleton: React.FC = () => {
  return (
    <div className="special-offers-container skeleton-container">
      <div className="special-offers-header skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-subtitle"></div>
      </div>
      <div className="offers-grid">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="offer-card skeleton-card">
            <div className="skeleton-image"></div>
            <div className="skeleton-details">
              <div className="skeleton-text"></div>
              <div className="skeleton-text"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OffersSkeleton;