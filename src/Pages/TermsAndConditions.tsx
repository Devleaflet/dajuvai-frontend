import React from 'react';
import '../Styles/TermsAndConditions.css';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';

const TermsAndConditions = () => {

  const handleGoBack = () => {
    window.close()
  }
  return (
    <>
      <Navbar />
      <div className="container">
        <header className="header">
          <h1 className="header__title">Terms and Conditions</h1>
          <p className="header__subtitle">DajuVai - Your Trusted E-Commerce Platform in Nepal</p>
        </header>

        <section className="section section--terms">
          <h2 className="section__title">1. Acceptance of Terms</h2>
          <p className="section__text">
            By accessing or using the DajuVai platform, you agree to be bound by these Terms and Conditions, including our Privacy Policy and any additional guidelines or rules posted on our website. If you do not agree, please refrain from using our services.
          </p>
        </section>

        <section className="section section--terms">
          <h2 className="section__title">2. Use of the Platform</h2>
          <p className="section__text">
            DajuVai provides an e-commerce marketplace for buyers and sellers across Nepal. Users must:
          </p>
          <ul className="list list--vision">
            <li className="list__item">Be at least 18 years old or have parental consent to use the platform.</li>
            <li className="list__item">Provide accurate and complete information during registration and transactions.</li>
            <li className="list__item">Not engage in fraudulent activities, including misrepresentation of products or services.</li>
            <li className="list__item">Comply with all applicable laws and regulations in Nepal.</li>
          </ul>
        </section>

        <section className="section section--terms">
          <h2 className="section__title">3. Seller Responsibilities</h2>
          <p className="section__text">
            Sellers on DajuVai, including artisans, women, and youth entrepreneurs, agree to:
          </p>
          <ul className="list list--vision">
            <li className="list__item">Offer authentic, high-quality products, including Nepali craftsmanship like Dhaka, Lokta paper, and Khukuri.</li>
            <li className="list__item">Provide accurate product descriptions and images.</li>
            <li className="list__item">Fulfill orders promptly and ensure safe delivery using DajuVai’s AI-driven logistics.</li>
            <li className="list__item">Adhere to our zero-commission policy for women and youth sellers, where applicable.</li>
          </ul>
        </section>

        <section className="section section--terms">
          <h2 className="section__title">4. Buyer Responsibilities</h2>
          <p className="section__text">
            Buyers using DajuVai agree to:
          </p>
          <ul className="list list--vision">
            <li className="list__item">Make payments through approved methods on the platform.</li>
            <li className="list__item">Provide accurate delivery information.</li>
            <li className="list__item">Use our sign language checkout feature responsibly, if applicable.</li>
            <li className="list__item">Contact our 24/7 Nepali-speaking support for any issues or disputes.</li>
          </ul>
        </section>

        <section className="section section--terms">
          <h2 className="section__title">5. Intellectual Property</h2>
          <p className="section__text">
            All content on the DajuVai platform, including logos, designs, and technology, is 100% Nepal-made and owned by DajuVai. Users may not reproduce, distribute, or use our content without prior written consent.
          </p>
        </section>

        <section className="section section--terms">
          <h2 className="section__title">6. Limitation of Liability</h2>
          <p className="section__text">
            DajuVai is not liable for any damages arising from the use of our platform, including but not limited to issues with product quality, delivery delays, or disputes between buyers and sellers. We strive to resolve disputes fairly through our support team.
          </p>
        </section>

        <section className="section section--terms">
          <h2 className="section__title">7. Changes to Terms</h2>
          <p className="section__text">
            DajuVai reserves the right to modify these Terms and Conditions at any time. Updates will be posted on our website, and continued use of the platform constitutes acceptance of the revised terms.
          </p>
        </section>

        <section className="section section--terms">
          <h2 className="section__title">8. Contact Us</h2>
          <p className="section__text">
            For any questions or concerns regarding these Terms and Conditions, please reach out to our 24/7 Nepali-speaking support team via the DajuVai platform or email us at support@dajuvai.com.
          </p>
        </section>
        <div style={{ margin: '20px 0', textAlign: 'right' }}>
          <button
            onClick={handleGoBack}
            style={{
              backgroundColor: 'rgb(255, 107, 0)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsAndConditions;
