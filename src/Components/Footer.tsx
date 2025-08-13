import '../Styles/Footer.css';
import { TbTruckDelivery } from "react-icons/tb";
import { FaPhoneVolume, FaLocationDot, FaFacebookF, FaInstagram } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { IoLogoWhatsapp } from "react-icons/io";
import khalti from '../assets/khalti1.png';
import esewa from '../assets/esewa.png';
import logo from '../assets/logo.webp';
import { Link } from "react-router-dom";
import npx from '../assets/npx.png';
import { useState } from 'react';
import OrderTrackingModal from './Modal/OrderTrackingModal';
import { OrderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';

const Footer: React.FC = () => {
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [trackingResult, setTrackingResult] = useState<{
    success: boolean;
    orderStatus?: string;
    message?: string;
  } | null>(null);
  
  const { token } = useAuth();

  const handleTrackOrder = async () => {
    if (!orderId.trim()) {
      setTrackingResult({
        success: false,
        message: 'Please enter an Order ID'
      });
      setIsTrackingModalOpen(true);
      return;
    }

    if (!token) {
      setTrackingResult({
        success: false,
        message: 'Please log in to track your order'
      });
      setIsTrackingModalOpen(true);
      return;
    }

    try {
      const result = await OrderService.trackOrder(parseInt(orderId), token);
      setTrackingResult({
        success: true,
        orderStatus: result.orderStatus
      });
      setIsTrackingModalOpen(true);
    } catch (error) {
      console.error('Order tracking error:', error);
      setTrackingResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred while tracking the order'
      });
      setIsTrackingModalOpen(true);
    }
  };

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__main-content">
          {/* Track Order Section */}
          <div className="footer__section footer__track-section">
            <h2 className="footer__heading">Track your Order</h2>
            <p className="footer__description">
              To track your order please enter your Order ID in the box below and press the "Track"
              button. This was given to you on your receipt and in the confirmation email you
              should have received.
            </p>

            <div className="footer__form">
              <div className="footer__form-row">
                <div className="footer__form-group">
                  <label className="footer__label">Order ID</label>
                  <p className="footer__hint">Found in your order confirmation email</p>
                  <input 
                    type="text" 
                    className="footer__input" 
                    placeholder="Enter your Order ID" 
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>

                <div className="footer__form-group">
                  <label className="footer__label">Billing email</label>
                  <p className="footer__hint">Email you used check out.</p>
                  <input 
                    type="email" 
                    className="footer__input" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                className="footer__track-button"
                onClick={handleTrackOrder}
                disabled={!orderId.trim()}
              >
                <span className="button-icon">📦</span>
                Track Order
              </button>
            </div>
          </div>

          {/* Links Sections Container */}
          <div className="footer__links-wrapper">
            {/* Top Row with Main Categories */}
            <div className="footer__top-links">
              {/* Useful Links Section */}
              <div className="footer__section footer__links-section">
                <h3 className="footer__section-title">Useful Links</h3>
                <ul className="footer__list">
                  <li><Link to="#" className="footer__link">Careers</Link></li>
                  <li><Link to="#" className="footer__link">Help Center</Link></li>
                  <li><Link to="#" className="footer__link">Shop List</Link></li>
                  <li><Link to="#" className="footer__link">Track Order</Link></li>
                  <li><Link to="#" className="footer__link">Contact Us</Link></li>
                  <li><Link to="#" className="footer__link">FAQ</Link></li>
                </ul>
              </div>

              {/* Account Section */}
              <div className="footer__section footer__account-section">
                <h3 className="footer__section-title">Account</h3>
                <ul className="footer__list">
                  <li><Link to="#" className="footer__link">User Dashboard</Link></li>
                  <li><Link to="#" className="footer__link">Wishlist</Link></li>
                  <li><Link to="#" className="footer__link">Downloads</Link></li>
                  <li><Link to="#" className="footer__link">Orders</Link></li>
                  <li><Link to="#" className="footer__link">Complain</Link></li>
                  <li><Link to="#" className="footer__link">Delivery Detail</Link></li>
                  <li><Link to="#" className="footer__link">Support</Link></li>
                </ul>
              </div>

              {/* Services Section */}
              <div className="footer__section footer__services-section">
                <h3 className="footer__section-title">Services</h3>
                <ul className="footer__list">
                  <li className="footer__service-item">
                    <div className="footer__service-icon">
                      <TbTruckDelivery />
                    </div>
                    <div className="footer__service-text">
                      <span className="footer__service-label">Delivery:</span>
                      <span>Kathmandu, Bhaktapur, Lalitpur</span>
                    </div>
                  </li>
                  <li className="footer__service-item">
                    <div className="footer__service-icon">
                      <FaPhoneVolume />
                    </div>
                    <div className="footer__service-text">
                      <span className="footer__service-label">Phone:</span>
                      <span>+977 - 9708555024</span>
                    </div>
                  </li>
                  <li className="footer__service-item">
                    <div className="footer__service-icon">
                      <FaLocationDot />
                    </div>
                    <div className="footer__service-text">
                      <span className="footer__service-label">Address:</span>
                      <span>Kathmandu, Nepal</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Row with Contact and Payment */}
            <div className="footer__bottom-links">
              {/* Contact With Us Section */}
              <div className="footer__section footer__contact-section">
                <h3 className="footer__section-title">Contact With Us</h3>
                <div className="footer__social-icons">
                  <a href="#" className="footer__social-link">
                    <FaFacebookF />
                  </a>
                  <a href="#" className="footer__social-link">
                    <MdEmail />
                  </a>
                  <a href="#" className="footer__social-link">
                    <IoLogoWhatsapp />
                  </a>
                  <a href="#" className="footer__social-link">
                    <FaInstagram />
                  </a>
                </div>
              </div>

              {/* Payment Methods Section */}
              <div className="footer__section footer__payment-section">
                <h3 className="footer__section-title">Payment Methods</h3>
                <div className="footer__payment-icons">
                  <img src={esewa} alt="eSewa Payment" className="footer__payment-image" />
                  <img src={npx} alt="eSewa Payment" className="footer__payment-image" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer__bottom">
        <div className="footer__copyright">
          Copyright Dajuvai © 2025 - <a href="#" className="footer__copyright-link">Leaflet Digital Soultions Pvt Ltd.</a>
        </div>
        <div className="footer__bottom-links">
          <a href="#" className="footer__bottom-link">Privacy Policy</a>
          <a href="#" className="footer__bottom-link">Terms & Condition</a>
          <a href="#" className="footer__bottom-link">Site Map</a>
        </div>
      </div>

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        trackingResult={trackingResult}
      />
    </footer>
  );
};

export default Footer;