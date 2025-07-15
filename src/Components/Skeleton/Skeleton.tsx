import React from 'react';
import '../../Styles/Skeleton.css';

interface SkeletonProps {
  type: 'text' | 'title' | 'avatar' | 'thumbnail' | 'button';
  width?: string;
  height?: string;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ type, width, height, className }) => {
  const classes = `skeleton skeleton-${type} ${className || ''}`;
  const style = {
    width: width || '100%',
    height: height || '1rem',
  };

  return <div className={classes} style={style} />;
};

export default Skeleton; 