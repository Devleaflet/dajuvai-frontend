// components/SliderSkeleton.tsx
import React from 'react';
import '../Styles/SliderSkeleton.css';

const SliderSkeleton: React.FC = () => {
  return (
    <div className="hero-slider skeleton-container">
      <div className="skeleton-slider">
        <div className="skeleton-slide"></div>
      </div>
      <div className="skeleton-indicators">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="skeleton-indicator"></div>
        ))}
      </div>
    </div>
  );
};

export default SliderSkeleton;