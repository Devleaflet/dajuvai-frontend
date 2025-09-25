import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaStore, FaCheckCircle, FaEnvelope, FaRocket, FaChartLine, FaShieldAlt, FaClock } from "react-icons/fa";
import "../Styles/BecomeVendor.css";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import VendorSignup from "../Pages/VendorSignup";

const BecomeVendor: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const openSignupModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Navbar />
      <div className={`become-vendor ${isVisible ? 'become-vendor--visible' : ''}`}>
        <div className="become-vendor__container">
          <div className="become-vendor__content">
            <div className="become-vendor__hero">
              <h1 className="become-vendor__title">
                <div className="become-vendor__icon-wrapper">
                  <FaStore className="become-vendor__icon" aria-hidden="true" />
                  <div className="become-vendor__icon-glow"></div>
                </div>
                Become a Vendor with DajuVai
              </h1>
              <p className="become-vendor__intro">
                Reach thousands of customers across Nepal. Launch your store in minutes.
              </p>
              <div className="become-vendor__floating-elements">
                <div className="floating-element floating-element--1">🚀</div>
                <div className="floating-element floating-element--2">💎</div>
                <div className="floating-element floating-element--3">⭐</div>
              </div>
            </div>

            <div className="become-vendor__section become-vendor__section--featured">
              <div className="section-decoration"></div>
              <h2 className="become-vendor__section-title">
                <FaRocket className="section-title-icon" />
                Why Partner With Us?
              </h2>
              <ul className="become-vendor__list">
                <li className="become-vendor__list-item">
                  <div className="list-item-content">
                    <FaCheckCircle className="become-vendor__list-icon" aria-hidden="true" />
                    <div>
                      <strong>Wide Reach:</strong> Sell across Kathmandu, Pokhara, Chitwan & more.
                      <div className="list-item-subtext">Access 50,000+ active customers monthly</div>
                    </div>
                  </div>
                </li>
                <li className="become-vendor__list-item">
                  <div className="list-item-content">
                    <FaCheckCircle className="become-vendor__list-icon" aria-hidden="true" />
                    <div>
                      <strong>Zero Setup Cost:</strong> No upfront fees. Start selling instantly.
                      <div className="list-item-subtext">Complete setup in under 10 minutes</div>
                    </div>
                  </div>
                </li>
                <li className="become-vendor__list-item">
                  <div className="list-item-content">
                    <FaCheckCircle className="become-vendor__list-icon" aria-hidden="true" />
                    <div>
                      <strong>Marketing Boost:</strong> Featured in DajuVai promotions & campaigns.
                      <div className="list-item-subtext">Get featured in our weekly newsletters</div>
                    </div>
                  </div>
                </li>
                <li className="become-vendor__list-item">
                  <div className="list-item-content">
                    <FaCheckCircle className="become-vendor__list-icon" aria-hidden="true" />
                    <div>
                      <strong>Fast Payouts:</strong> Get paid securely within 3 business days.
                      <div className="list-item-subtext">Real-time payment tracking</div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="become-vendor__section become-vendor__section--steps">
              <div className="steps-container">
                <h2 className="become-vendor__section-title">
                  <FaChartLine className="section-title-icon" />
                  Get Started in 3 Simple Steps
                </h2>
                <ol className="become-vendor__ordered-list">
                  <li>
                    <div className="step-content">
                      <div className="step-number"></div>
                      <div>
                        <strong>Sign Up</strong> — Provide basic business info
                        <div className="step-detail">Takes less than 2 minutes</div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="step-content">
                      <div className="step-number"></div>
                      <div>
                        <strong>Get Verified</strong> — Approved within 48 hours
                        <div className="step-detail">Quick and seamless process</div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="step-content">
                      <div className="step-number"></div>
                      <div>
                        <strong>Go Live</strong> — Start selling immediately
                        <div className="step-detail">Upload products and start earning</div>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            <div className="become-vendor__cta">
              <div className="cta-card">
                <div className="become-vendor__cta-badge">
                  <FaShieldAlt className="badge-icon" />
                  Trusted by 500+ Sellers
                </div>
                <h3 className="become-vendor__cta-title">Ready to Grow Your Business?</h3>
                <p className="cta-subtitle">Join Nepal's fastest growing marketplace today</p>
                
                <div className="become-vendor__buttons">
                  <button
                    className="become-vendor__button become-vendor__button--primary"
                    onClick={openSignupModal}
                    aria-label="Sign up as a vendor"
                  >
                    <FaRocket className="button-icon" />
                    Sign Up Now — Free
                    <div className="button-shine"></div>
                  </button>
                  <Link
                    to="/contact"
                    className="become-vendor__button become-vendor__button--secondary"
                    aria-label="Contact DajuVai support"
                  >
                    <FaEnvelope className="button-icon" />
                    Contact Support
                  </Link>
                </div>

                <div className="cta-footer">
                  <FaClock className="cta-footer-icon" />
                  <span>Average setup time: 10 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VendorSignup isOpen={isModalOpen} onClose={closeModal} />
      <Footer />
    </>
  );
};

export default BecomeVendor;