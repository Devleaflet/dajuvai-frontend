import React from "react";
import { Link } from "react-router-dom";
import { FaStore, FaCheckCircle, FaEnvelope } from "react-icons/fa";
import "../Styles/BecomeVendor.css";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";

const BecomeVendor: React.FC = () => {
  return (
    <>
    <Navbar/>
   
    <div className="become-vendor">
      <div className="become-vendor__container">
        <div className="become-vendor__content">
          <h1 className="become-vendor__title">
            <FaStore className="become-vendor__icon" /> Become a Vendor with DajuVai
          </h1>
          <p className="become-vendor__intro">
            Join our growing marketplace and reach thousands of customers across Nepal. Partner with DajuVai to showcase your products and grow your business!
          </p>

          <div className="become-vendor__section">
            <h2 className="become-vendor__section-title">
              Why Sell with DajuVai?
            </h2>
            <ul className="become-vendor__list">
              <li className="become-vendor__list-item">
                <FaCheckCircle className="become-vendor__list-icon" />
                <span>
                  <strong>Wide Reach:</strong> Access a large customer base across Nepal, including cities like Kathmandu, Pokhara, Chitwan, and Butwal.
                </span>
              </li>
              <li className="become-vendor__list-item">
                <FaCheckCircle className="become-vendor__list-icon" />
                <span>
                  <strong>Easy Setup:</strong> Simple onboarding process with dedicated support to get your store up and running quickly.
                </span>
              </li>
              <li className="become-vendor__list-item">
                <FaCheckCircle className="become-vendor__list-icon" />
                <span>
                  <strong>Marketing Support:</strong> Benefit from our promotional campaigns and social media presence to boost your sales.
                </span>
              </li>
              <li className="become-vendor__list-item">
                <FaCheckCircle className="become-vendor__list-icon" />
                <span>
                  <strong>Secure Payments:</strong> Fast and reliable payment processing to ensure you get paid on time.
                </span>
              </li>
            </ul>
          </div>

          <div className="become-vendor__section">
            <h2 className="become-vendor__section-title">
              How to Get Started
            </h2>
            <ol className="become-vendor__ordered-list">
              <li>
                <strong>Sign Up:</strong> Create a vendor account by providing your business name and contact information.
              </li>
              
              <li>
                <strong>Get Approved:</strong> Our team will review your account and approve your store within 48 hours.
              </li>
              <li>
                <strong>Start Selling:</strong> Once approved, your products will be live on DajuVai, ready for customers to purchase.
              </li>
            </ol>
          </div>

          <div className="become-vendor__cta">
            <h3 className="become-vendor__cta-title">
              Ready to Join Us?
            </h3>
            <p className="become-vendor__cta-text">
              Start your journey as a DajuVai vendor today! Contact us or sign up to get started.
            </p>
            <div className="become-vendor__buttons">
              <Link
                to="/vendor-login"
                className="become-vendor__button become-vendor__button--primary"
              >
                Sign Up Now
              </Link>
              <Link
                to="/contact"
                className="become-vendor__button become-vendor__button--secondary"
              >
                <FaEnvelope className="become-vendor__button-icon" /> Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
     <Footer />
    </>
  );
};

export default BecomeVendor;