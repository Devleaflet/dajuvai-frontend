// About.tsx
import { useEffect, useState } from 'react';
import { FaEnvelope, FaInfoCircle, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../api/axiosInstance';
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import '../Styles/About.css';

// ===============================
// TYPES AND INTERFACES
// ===============================

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

// ===============================
// MAIN COMPONENT
// ===============================

const About = () => {
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // ===============================
  // EFFECTS AND EVENT HANDLERS
  // ===============================
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "firstName":
      case "lastName":
        if (!value.trim()) return "This field is required";
        if (value.length < 2) return "Must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(value)) return "Only letters and spaces allowed";
        return "";
      
      case "email":
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
        return "";
      
      case "phone":
        if (!value.trim()) return "Phone number is required";
        const cleanPhone = value.replace(/\D/g, '');
        
        if (cleanPhone.length < 10) {
          return "Phone number must be at least 10 digits";
        }
        if (cleanPhone.length > 10) {
          return "Phone number must not exceed 10 digits";
        }
        if (!/^[0-9]{10}$/.test(cleanPhone)) {
          return "Phone number must contain only digits";
        }
        if (!cleanPhone.startsWith('98') && !cleanPhone.startsWith('97') && !cleanPhone.startsWith('96') && !cleanPhone.startsWith('01')) {
          return "Enter valid Nepali phone number (98XXXXXXXX, 97XXXXXXXX, 96XXXXXXXX, or 01XXXXXXXX)";
        }
        return "";
      
      case "subject":
        if (!value.trim()) return "Subject is required";
        if (value.length < 5) return "Subject must be at least 5 characters";
        return "";
      
      case "message":
        if (!value.trim()) return "Message is required";
        if (value.length < 10) return "Message must be at least 10 characters";
        return "";
      
      default:
        return "";
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setTouched(allTouched);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/api/contact', formData);
      toast.success("Your message has been sent successfully! We'll get back to you soon.", { 
        position: 'top-right', 
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setFormData({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' });
      setErrors({});
      setTouched({});
    } catch (err: unknown) {
      let errorMessage = "Oops! Something went wrong. Please try again later.";
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        if (axiosError.response?.data) {
          if (axiosError.response.data.errors) {
            const serverErrors = axiosError.response.data.errors;
            const newErrors: FormErrors = {};
            
            Object.keys(serverErrors).forEach(key => {
              if (serverErrors[key] && serverErrors[key][0]) {
                newErrors[key as keyof FormErrors] = serverErrors[key][0];
              }
            });
            
            setErrors(newErrors);
            errorMessage = "Please correct the validation errors";
          } else if (axiosError.response.data.message) {
            errorMessage = axiosError.response.data.message;
          }
        }
      }

      toast.error(errorMessage, { 
        position: 'top-right', 
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // RENDER
  // ===============================
  
  return (
    <>
      <Navbar />
      <div className="about-max-width-container">
        {/* ===============================
             CONTACT SECTION
        =============================== */}
        <section className="contact-section">
          <div className="contact-container">
            <div className="contact-content">
              {/* ===============================
                   CONTACT INFORMATION
              =============================== */}
              <div className="contact-content-left">
                <h2 className="contact-title">Contact Us</h2>
                <p className="contact-subtext">
                  We're here to help! Have questions, feedback, or need assistance?
                  Reach out via email, phone, or the form and we'll respond promptly.
                </p>
                
                <div className="contact-info">
                  <div className="contact-info-item">
                    <FaPhone className="contact-icon" />
                    <span>+977-9700620004</span>
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

                {/* ===============================
                     VENDOR CTA
                =============================== */}
                <div className="vendor-cta">
                  <h3>Want to Become a Vendor?</h3>
                  <p>Join our platform and reach thousands of customers across Nepal.</p>
                  <a href="/becomevendor" className="btn btn--primary">Become a Vendor</a>
                </div>
              </div>

              {/* ===============================
                   CONTACT FORM
              =============================== */}
              <div className="contact-content-right">
                <form onSubmit={handleSubmit} className="contact-form" noValidate>
                  {/* First Name & Last Name */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name *</label>
                      <input 
                        id="firstName"
                        name="firstName" 
                        placeholder="Enter your first name"
                        value={formData.firstName} 
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={errors.firstName && touched.firstName ? 'input-error' : ''}
                        required 
                      />
                      {errors.firstName && touched.firstName && (
                        <div className="error-message">
                          <FaInfoCircle className="error-icon" />
                          {errors.firstName}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name *</label>
                      <input 
                        id="lastName"
                        name="lastName" 
                        placeholder="Enter your last name"
                        value={formData.lastName} 
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={errors.lastName && touched.lastName ? 'input-error' : ''}
                        required 
                      />
                      {errors.lastName && touched.lastName && (
                        <div className="error-message">
                          <FaInfoCircle className="error-icon" />
                          {errors.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input 
                      id="email"
                      type="email" 
                      name="email" 
                      placeholder="Enter your email address"
                      value={formData.email} 
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={errors.email && touched.email ? 'input-error' : ''}
                      required 
                    />
                    {errors.email && touched.email && (
                      <div className="error-message">
                        <FaInfoCircle className="error-icon" />
                        {errors.email}
                      </div>
                    )}
                  </div>
                  
                  {/* Phone */}
                  <div className="form-group">
                    <label htmlFor="phone">Phone *</label>
                    <input 
                      id="phone"
                      type="tel" 
                      name="phone" 
                      placeholder="Enter phone number"
                      value={formData.phone} 
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={errors.phone && touched.phone ? 'input-error' : ''}
                      required 
                    />
                    {errors.phone && touched.phone && (
                      <div className="error-message">
                        <FaInfoCircle className="error-icon" />
                        {errors.phone}
                      </div>
                    )}
                  </div>
                  
                  {/* Subject */}
                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <input 
                      id="subject"
                      name="subject" 
                      placeholder="Enter the subject of your message"
                      value={formData.subject} 
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={errors.subject && touched.subject ? 'input-error' : ''}
                      required 
                    />
                    {errors.subject && touched.subject && (
                      <div className="error-message">
                        <FaInfoCircle className="error-icon" />
                        {errors.subject}
                      </div>
                    )}
                  </div>
                  
                  {/* Message */}
                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea 
                      id="message"
                      rows={windowWidth < 576 ? 5 : 7} 
                      name="message" 
                      placeholder="Enter your message here..."
                      value={formData.message} 
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={errors.message && touched.message ? 'input-error' : ''}
                      required
                    />
                    {errors.message && touched.message && (
                      <div className="error-message">
                        <FaInfoCircle className="error-icon" />
                        {errors.message}
                      </div>
                    )}
                  </div>
                  
                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    className="btn btn--primary" 
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <span className="btn-loading">
                        <span className="loading-spinner"></span>
                        Sending…
                      </span>
                    ) : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
};

export default About;