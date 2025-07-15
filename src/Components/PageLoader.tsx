import React from 'react';
import '../Styles/PageLoader.css';
import logo from '../assets/logo.webp';

const PageLoader: React.FC = () => {
  return (
    <div className="page-loader">
      <div className="page-loader__content">
        <img 
          src={logo} 
          alt="DajuVai" 
          className="page-loader__logo"
        />
      </div>
    </div>
  );
};

export default PageLoader; 