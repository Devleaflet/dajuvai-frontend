import React from 'react';
import '../Styles/TermsAndConditions.css';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';

const TermsAndConditions = () => {

  const handleGoBack = () => {
    window.location.href = "/checkout"; 
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
          <section className="tnc-section">
            <div className="section-header">
              <div className="section-number">1</div>
              <h2 className="section-title">Acceptance of Terms</h2>
            </div>
            <div className="section-content">
              <p className="section-text">
                By accessing or using the DajuVai platform, you agree to be bound by these Terms and Conditions, including our Privacy Policy and any additional guidelines or rules posted on our website. If you do not agree, please refrain from using our services.
              </p>
            </div>
          </section>

          <section className="tnc-section">
            <div className="section-header">
              <div className="section-number">2</div>
              <h2 className="section-title">Use of the Platform</h2>
            </div>
            <div className="section-content">
              <p className="section-text">
                DajuVai provides an e-commerce marketplace for buyers and sellers across Nepal. Users must:
              </p>
              <ul className="tnc-list">
                <li className="list-item">Be at least 18 years old or have parental consent to use the platform.</li>
                <li className="list-item">Provide accurate and complete information during registration and transactions.</li>
                <li className="list-item">Not engage in fraudulent activities, including misrepresentation of products or services.</li>
                <li className="list-item">Comply with all applicable laws and regulations in Nepal.</li>
              </ul>
            </div>
          </section>

          <section className="tnc-section">
            <div className="section-header">
              <div className="section-number">3</div>
              <h2 className="section-title">Seller Responsibilities</h2>
            </div>
            <div className="section-content">
              <p className="section-text">
                Sellers on DajuVai, including artisans, women, and youth entrepreneurs, agree to:
              </p>
              <ul className="tnc-list">
                <li className="list-item">Offer authentic, high-quality products, including Nepali craftsmanship like Dhaka, Lokta paper, and Khukuri.</li>
                <li className="list-item">Provide accurate product descriptions and images.</li>
                <li className="list-item">Fulfill orders promptly and ensure safe delivery using DajuVai's AI-driven logistics.</li>
                <li className="list-item">Adhere to our zero-commission policy for women and youth sellers, where applicable.</li>
              </ul>
            </div>
          </section>

          <section className="tnc-section">
            <div className="section-header">
              <div className="section-number">4</div>
              <h2 className="section-title">Buyer Responsibilities</h2>
            </div>
            <div className="section-content">
              <p className="section-text">
                Buyers using DajuVai agree to:
              </p>
              <ul className="tnc-list">
                <li className="list-item">Make payments through approved methods on the platform.</li>
                <li className="list-item">Provide accurate delivery information.</li>
                <li className="list-item">Use our sign language checkout feature responsibly, if applicable.</li>
                <li className="list-item">Contact our 24/7 Nepali-speaking support for any issues or disputes.</li>
              </ul>
            </div>
          </section>

          <section className="tnc-section">
            <div className="section-header">
              <div className="section-number">5</div>
              <h2 className="section-title">Intellectual Property</h2>
            </div>
            <div className="section-content">
              <p className="section-text">
                All content on the DajuVai platform, including logos, designs, and technology, is 100% Nepal-made and owned by DajuVai. Users may not reproduce, distribute, or use our content without prior written consent.
              </p>
            </div>
          </section>

          <section className="tnc-section">
            <div className="section-header">
              <div className="section-number">6</div>
              <h2 className="section-title">Limitation of Liability</h2>
            </div>
            <div className="section-content">
              <p className="section-text">
                DajuVai is not liable for any damages arising from the use of our platform, including but not limited to issues with product quality, delivery delays, or disputes between buyers and sellers. We strive to resolve disputes fairly through our support team.
              </p>
            </div>
          </section>

          <section className="tnc-section">
            <div className="section-header">
              <div className="section-number">7</div>
              <h2 className="section-title">Changes to Terms</h2>
            </div>
            <div className="section-content">
              <p className="section-text">
                DajuVai reserves the right to modify these Terms and Conditions at any time. Updates will be posted on our website, and continued use of the platform constitutes acceptance of the revised terms.
              </p>
            </div>
          </section>

          <section className="tnc-section">
            <div className="section-header">
              <div className="section-number">8</div>
              <h2 className="section-title">Contact Us</h2>
            </div>
            <div className="section-content">
              <p className="section-text">
                For any questions or concerns regarding these Terms and Conditions, please reach out to our 24/7 Nepali-speaking support team via the DajuVai platform or email us at support@dajuvai.com.
              </p>
            </div>
          </section>

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