import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/TermsAndConditions.css';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import TermsContent from '../Components/TermsContent';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    // react-router navigation, not a full page reload: a hard navigation
    // (window.location.href) here used to wipe Buy Now cart state, which
    // only lives in router location.state, since a full reload has no way
    // to carry it back.
    navigate(-1);
  };

  return (
    <>
      <Navbar />
      <div className="tnc-container">
        <header className="tnc-header">
          <div className="tnc-header-content">
            <h1 className="tnc-title">Terms and Conditions</h1>
            <p className="tnc-subtitle">DajuVai - Your Trusted E-Commerce Platform in Nepal</p>
            <div className="tnc-divider"></div>
          </div>
        </header>

        <main className="tnc-content">
          <TermsContent />

          <div className="tnc-actions">
            <button className="tnc-button" onClick={handleGoBack}>
              <span className="button-icon">←</span>
              Go Back
            </button>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default TermsAndConditions;