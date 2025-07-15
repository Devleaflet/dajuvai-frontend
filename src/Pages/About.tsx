import { useState, useEffect } from 'react';
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import '../Styles/About.css';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../api/axiosInstance';

const About = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  // Handle window resize for responsive features
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/api/contacts', formData);
      toast.success(
        <div className="flex items-center">
          <FaCheckCircle size={24} className="mr-2 text-green-500" />
          <span>Your message has been sent successfully! We'll get back to you soon.</span>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          toastId: "contact-success",
        }
      );
      // Reset form after submission
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err: any) {
      toast.error(
        <div className="flex items-center">
          <FaExclamationCircle size={24} className="mr-2 text-red-500" />
          <span>{err?.response?.data?.message || "Oops! Something went wrong. Please try again later."}</span>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          toastId: "contact-error",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="contact-container">
        <div className="contact-content">
          <div className="contact-content-left">
            <h2 className="contact-title">Contact Us</h2>
            <p className="contact-subtext">We will Contact you as soon as you fill up the details or text us on +977- 9708555024 | support@dajuvai.com</p>
            <div className="contact-info">
              <div className="contact-info-item">
                <FaPhone className="contact-icon" />
                <span>+977- 9708555024</span>
              </div>
              <div className="contact-info-item">
                <FaEnvelope className="contact-icon" />
                <span>support@dajuvai.com</span>
              </div>
              <div className="contact-info-item">
                <FaMapMarkerAlt className="contact-icon" />
                <span>Kathmandu, Nepal</span>
              </div>
            </div>
            <button className="vendor-button">Become A Vendor</button>
          </div>
          <div className="contact-content-right">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name <span className="required">*</span></label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name <span className="required">*</span></label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label htmlFor="email">Email <span className="required">*</span></label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="phone">Phone <span className="required">*</span></label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="9800000000"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="subject">Subject <span className="required">*</span></label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  placeholder="Type your subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={windowWidth < 576 ? 4 : 5}
                  value={formData.message}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? <span className="contact-loader">Loading...</span> : "Submit Form"}
              </button>
            </form>
          </div>
        </div>
        <div className="find-store">
          <h2 className="store-title">Find our store</h2>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d56516.31625952881!2d85.29111349649788!3d27.70895594444538!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb198a307baabf%3A0xb5137c1bf18db1ea!2sKathmandu%2044600%2C%20Nepal!5e0!3m2!1sen!2sus!4v1715125639033!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Kathmandu Map"
              aria-label="Store location map"
            ></iframe>
          </div>
        </div>
      </div>
      <ToastContainer />
      <Footer />
    </>
  );
}

export default About;