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
    } catch (err: any) {
      toast.error(
        <div className="flex items-center">
          <FaExclamationCircle size={24} className="mr-2" />
          <span>{err?.response?.data?.message || "Oops! Something went wrong. Please try again later."}</span>
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