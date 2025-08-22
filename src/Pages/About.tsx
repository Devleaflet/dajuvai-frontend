// About.tsx
import { useState, useEffect } from 'react';
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import '../Styles/About.css';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaExclamationCircle } from 'react-icons/fa';
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

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/api/contact', formData);
      toast.success('Your message has been sent successfully!', { position: 'top-right', autoClose: 5000 });
      setFormData({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Oops! Something went wrong.';
      toast.error(<span><FaExclamationCircle size={20} className="mr-2" />{msg}</span>, { position: 'top-right', autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <section className="contact-section">
        <div className="contact-container">
          <div className="contact-content">
            <div className="contact-content-left">
              <h2 className="contact-title">Contact Us</h2>
              <p className="contact-subtext">
                We’re here to help! Have questions, feedback, or need assistance?
                Reach out via email, phone, or the form and we’ll respond promptly.
              </p>
              <div className="contact-info">
                <div className="contact-info-item"><FaPhone /><span>+977-9700620004</span></div>
                <div className="contact-info-item"><FaPhone /><span>01-4720234</span></div>
                <div className="contact-info-item"><FaEnvelope /><span>Dajuvai106@gmail.com</span></div>
                <div className="contact-info-item"><FaMapMarkerAlt /><span>Kathmandu, Nepal</span></div>
              </div>

              <div className="vendor-cta">
                <h3>Want to Become a Vendor?</h3>
                <p>Join our platform and reach thousands of customers across Nepal.</p>
                <a href="/becomevendor" className="btn btn--primary">Become a Vendor</a>
              </div>
            </div>

            <div className="contact-content-right">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-group"><label>Email *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Phone *</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Subject *</label><input name="subject" value={formData.subject} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Message</label><textarea rows={windowWidth < 576 ? 5 : 7} name="message" value={formData.message} onChange={handleInputChange}></textarea></div>
                <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? 'Sending…' : 'Send Message'}</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <ToastContainer />
      <Footer />
    </>
  );
};

export default About;