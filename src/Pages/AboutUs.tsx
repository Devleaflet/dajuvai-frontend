import "../Styles/AboutUs.css";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import aboutHead from "../assets/aboutHead.png";
import aboutimg from "../assets/about2nd.png";

const AboutUs = () => {
  return (
    <>
      <Navbar />
      <main className="about">
        {/* Hero */}
        <section className="about__hero">
          <div className="about__container">
            <div className="about__hero-content">
              <div className="about__hero-text">
                <p className="about__eyebrow">About DajuVai</p>
                <h1 className="about__title">
                  Nepal's Fastest-Growing E-Commerce Marketplace
                </h1>
                <p className="about__subtitle">
                  Founded in 2022 by two brothers in Kathmandu, DajuVai began as a
                  humble startup. Inspired by Silicon Valley experiences, they
                  envisioned a platform to bridge Nepal's digital divide. Today,
                  we serve <strong>1.2M+ users</strong> across all{" "}
                  <strong>75 districts</strong> and empower{" "}
                  <strong>18,000+ sellers</strong>, including artisans from
                  remote Himalayan villages.
                </p>
                <div className="about__stats" role="list">
                  <div className="about__stat" role="listitem">
                    <span className="about__stat-number">1.2M+</span>
                    <span className="about__stat-label">Active users</span>
                  </div>
                  <div className="about__stat" role="listitem">
                    <span className="about__stat-number">75</span>
                    <span className="about__stat-label">Districts served</span>
                  </div>
                  <div className="about__stat" role="listitem">
                    <span className="about__stat-number">18k+</span>
                    <span className="about__stat-label">Empowered sellers</span>
                  </div>
                </div>
              </div>
              <div className="about__hero-image">
                <img
                  src={aboutHead}
                  alt="DajuVai founders Aarav and Rohan Thapa working in their Kathmandu office"
                  className="about__hero-img"
                />
                <div className="about__hero-badge">
                  <span>🇳🇵 Made in Nepal</span>
                </div>
              </div>
            </div>
          </div>
          <div className="about__ribbon">
            <span className="about__ribbon-chip">Daju = guide</span>
            <span className="about__ribbon-dot" aria-hidden="true">
              •
            </span>
            <span className="about__ribbon-chip">Vai = innovate</span>
            <span className="about__ribbon-dot" aria-hidden="true">
              •
            </span>
            <span className="about__ribbon-chip">Together, we rise</span>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="about__section">
          <div className="about__container">
            <h2 className="about__heading">Why Choose Us?</h2>
            <ul className="about__featurelist">
              <li className="about__feature">
                <IconCheck /> <span>100% Nepal-Made Technology</span>
              </li>
              <li className="about__feature">
                <IconCheck />{" "}
                <span>Zero Commission for Women & Youth Sellers</span>
              </li>
              <li className="about__feature">
                <IconCheck /> <span>24/7 Nepali-speaking support</span>
              </li>
              <li className="about__feature">
                <IconCheck />{" "}
                <span>First platform with sign language checkout</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Our Vision */}
        <section className="about__section about__section--alt" id="vision">
          <div className="about__container about__grid">
            <div>
              <p className="about__eyebrow">Our Vision</p>
              <h2 className="about__heading">
                "To Make Nepal the Digital Commerce Capital of South Asia."
              </h2>
              <p className="about__text">
                We're building inclusive commerce that uplifts every maker,
                merchant, and micro-entrepreneur. Our commitment drives us to
                innovate and empower communities across Nepal.
              </p>
              <ul className="about__cards">
                <li className="about__card">
                  <IconTarget />
                  <h3>Global by 2030</h3>
                  <p>Connect every Nepali SME to global markets by 2030.</p>
                </li>
                <li className="about__card">
                  <IconRoute />
                  <h3>AI-Driven Logistics</h3>
                  <p>
                    Use AI to navigate Nepal's challenging terrains with smarter
                    routing.
                  </p>
                </li>
                <li className="about__card">
                  <IconHeart />
                  <h3>5% for Literacy</h3>
                  <p>
                    Allocate 5% of profits to digital literacy in Karnali &
                    Terai villages.
                  </p>
                </li>
                <li className="about__card">
                  <IconStar />
                  <h3>Curated Craft</h3>
                  <p>
                    Showcase Dhaka, Lokta paper, Khukuri, and world-class Nepali
                    craftsmanship.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* For Sellers */}
        <section className="about__section" id="sellers">
          <div className="about__container about__grid about__grid--reverse">
            <div>
              <p className="about__eyebrow">For Sellers</p>
              <h2 className="about__heading">Grow with DajuVai</h2>
              <p className="about__text">
                Whether you're a home-based creator or a scaling SME, we provide
                zero-hassle onboarding, fast payouts, nationwide reach, and real
                human support—always.
              </p>
              <ul className="about__bullets">
                <li>
                  <IconBolt /> Zero fees for women & youth sellers
                </li>
                <li>
                  <IconTruck /> Nationwide pick-up & delivery
                </li>
                <li>
                  <IconShield /> Buyer protection & dispute resolution
                </li>
                <li>
                  <IconChart /> Analytics to understand and grow your sales
                </li>
              </ul>
              <div className="about__ctas">
                <a
                  href="/becomevendor"
                  className="btn btn--primary"
                  aria-label="Become a Vendor"
                >
                  Become a Vendor
                </a>
              </div>
            </div>
            <div className="about__seller-showcase">
              <img
                src={aboutimg}
                alt="Nepali artisan creating traditional Dhaka fabric, representing DajuVai sellers"
                className="about__seller-img"
              />
              <div className="about__panel">
                <div className="about__panel-inner">
                  <h3 className="about__panel-title">Your brand, your way</h3>
                  <p className="about__panel-text">
                    Custom storefronts, easy product uploads, and tools that put
                    you in control.
                  </p>
                  <ul className="about__panel-points">
                    <li>Instant KYC</li>
                    <li>Bulk listing via CSV</li>
                    <li>Discount & campaign tools</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

/* --- Minimal inline SVG icons (CSS-colored) --- */
const IconCheck = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M20 6L9 17l-5-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTarget = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

const IconRoute = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 6h6a4 4 0 014 4v4a4 4 0 004 4h2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="4" cy="6" r="2" fill="currentColor" />
    <circle cx="20" cy="18" r="2" fill="currentColor" />
  </svg>
);

const IconHeart = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
      fill="currentColor"
    />
  </svg>
);

const IconStar = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.84L18.18 22 12 18.77 5.82 22 7 14.11 2 9.27l6.91-1.01L12 2z"
      fill="currentColor"
    />
  </svg>
);

const IconBolt = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" fill="currentColor" />
  </svg>
);

const IconTruck = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M1 7h13v8H1zM14 9h4l4 3v3h-8z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="5" cy="17" r="2" fill="currentColor" />
    <circle cx="17" cy="17" r="2" fill="currentColor" />
  </svg>
);

const IconShield = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M9 12l2 2 4-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconChart = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 19V5M10 19V9M16 19V3M22 21H2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default AboutUs;