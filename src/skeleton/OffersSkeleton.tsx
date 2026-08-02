import React from "react";
import "../Styles/OffersSkeleton.css";

const OffersSkeleton: React.FC = () => {
  return (
    <div className="special-offers-section">
      <div className="special-offers-container">
        <div className="skeleton-header">
          <div className="skeleton-title"></div>
          <div className="skeleton-subtitle"></div>
        </div>
        <div className="special-offers-grid">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="skeleton-card"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OffersSkeleton;
