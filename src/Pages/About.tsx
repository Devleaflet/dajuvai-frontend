import { useState, useEffect } from 'react';
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import '../Styles/About.css';
import { FaPhone, FaEnvelope, FaMapMarkerAlt} from 'react-icons/fa';
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
      await axiosInstance.post('/api/contact', formData);
      toast.success(
        <div className="flex items-center">
       
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
    } catch (err: unknown) {
      let errorMessage = "Oops! Something went wrong. Please try again later.";
      if(formData.phone.length!=10){
        errorMessage="Phone number should be of 10 digits"
      }
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        // @ts-expect-error: dynamic error shape from axios
        errorMessage = err.response.data.message || errorMessage;
      }
      toast.error(
        <div className="flex items-center">

          <span>{errorMessage}</span>
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
        <div className="contact-content" style={{ alignItems: 'flex-start' }}>
          <div className="contact-content-left">
            <h2 className="contact-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>Contact Us</h2>
            <p className="contact-subtext">We’re here to help! Have questions, feedback, or need assistance? Reach out via email, phone, or by filling out the form, and our team will respond promptly.</p>
            <div className="contact-info">
              <div className="contact-info-item">
                <FaPhone className="contact-icon" />
                <span>+977- 9700620004</span>
              </div>
               <div className="contact-info-item">
         
                <FaPhone className="contact-icon" />
                <span>01-4720234</span>
              </div>
              <div className="contact-info-item">
                <FaEnvelope className="contact-icon" />
                <span>Dajuvai106@gmail.com</span>
              </div>
              <div className="contact-info-item">
                <FaMapMarkerAlt className="contact-icon" />
                <span>Kathmandu, Nepal</span>
              </div>
            </div>
            <div className="vendor-section">
              <h3 className="vendor-title">Want to Become a Vendor?</h3>
              <p className="vendor-subtext">Join our platform and start selling your products today! Partner with us to reach a wider audience and grow your business.</p>
              <div className="about__ctas">
                <a
                  href="/becomevendor"
                  className="btn btn--primary"
                  aria-label="Become a Vendor"
                  style={{ padding: 'clamp(0.7rem, 1.5vw, 0.9rem) clamp(1.5rem, 3vw, 2rem)' }}
                >
                  Become a Vendor
                </a>
              </div>
            </div>
          </div>
          <div className="contact-content-right" style={{ marginTop: 0 }}>
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
              <button type="submit" className="btn btn--primary" disabled={loading} style={{ padding: 'clamp(0.7rem, 1.5vw, 0.9rem) clamp(1.5rem, 3vw, 2rem)' }}>
                {loading ? <span className="contact-loader">Loading...</span> : "Submit Form"}
              </button>
            </form>
          </div>
        </div>
       
      </div>
      <ToastContainer />
      <Footer />
    </>
  );
}

export default About;
