import React, { useState } from "react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import axiosInstance from "../api/axiosInstance";
import "../Styles/Contact.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const MAP_HEIGHT = 320;

const Contact: React.FC = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/api/contacts", form);
      toast.success(
        <div className="flex items-center">
          <FaCheckCircle size={24} className="mr-2" />
          <span>Your message has been sent successfully! We'll get back to you soon.</span>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      setForm({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: unknown) {
      let errorMessage = "Oops! Something went wrong. Please try again later.";
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        // @ts-expect-error: dynamic error shape from axios
        errorMessage = err.response.data.message || errorMessage;
      }
      toast.error(
        <div className="flex items-center">
          <FaExclamationCircle size={24} className="mr-2" />
          <span>{errorMessage}</span>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="contact-page">
        <h1 className="contact-title">Contact Us</h1>
        <div className="contact-vendor-info" style={{ marginBottom: '2rem', background: '#f8f8f8', padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Interested in Becoming a Vendor?</h2>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', color: '#444' }}>
            We are always looking to partner with passionate and reliable vendors who want to grow their business with us. If you are interested in selling your products on our platform, please reach out to us! Our team will guide you through the onboarding process, answer your questions, and help you get started. <br /><br />
            To become a vendor, simply contact us at <b>support@dajuvai.com</b> or call us at <b>+977-9708555024</b>. We look forward to working with you and helping your business reach new customers across Nepal.
          </p>
        </div>
        <div className="contact-content">
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-row">
              <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
              <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
            </div>
            <div className="contact-form-row">
              <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
              <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
            </div>
            <input name="subject" placeholder="Subject" value={form.subject} onChange={handleChange} required />
            <textarea name="message" placeholder="Message" value={form.message} onChange={handleChange} required rows={5} />
            <button className="contact-submit-btn" type="submit" disabled={loading}>
              {loading ? <span className="contact-loader"></span> : "Send Message"}
            </button>
          </form>
          <div className="contact-map-section">
            {!mapLoaded && <div className="map-skeleton" style={{ height: MAP_HEIGHT }} />}
            <iframe
              title="Our Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.123456789!2d85.3240!3d27.7172!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb190a1234567%3A0xabcdef123456789!2sKathmandu!5e0!3m2!1sen!2snp!4v1680000000000!5m2!1sen!2snp"
              width="100%"
              height={MAP_HEIGHT}
              style={{ border: 0, display: mapLoaded ? "block" : "none" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setMapLoaded(true)}
            ></iframe>
          </div>
        </div>
      </div>
      <ToastContainer />
      <Footer />
    </>
  );
};

export default Contact;