
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import VendorService, { VendorLoginData, VendorSignupData } from '../services/vendorService';
import { useVendorAuth } from '../context/VendorAuthContext';
import '../Styles/VendorLogin.css';

const VendorLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useVendorAuth(); // Access login function from context
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VendorLoginData | VendorSignupData>({
    email: '',
    password: '',
    ...(isLogin ? {} : {
      businessName: '',
      phoneNumber: '',
      district: ''
    })
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vendorService = VendorService.getInstance();
      let response;

      if (isLogin) {
        response = await vendorService.login(formData as VendorLoginData);
        if (response.success) {
          login(response.token, response.vendor); // Update auth state via context
          toast.success('Login successful!');
          navigate('/dashboard');
        }
      } else {
        response = await vendorService.signup(formData as VendorSignupData);
        if (response.success) {
          toast.success('Registration successful! Please check your email for verification.');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      ...(isLogin ? {
        businessName: '',
        phoneNumber: '',
        district: ''
      } : {})
    });
  };

  return (
    <div className="vendor-login">
      <div className="vendor-login__container">
        <div className="vendor-login__header">
          <h1>{isLogin ? 'Vendor Login' : 'Vendor Registration'}</h1>
          <p>{isLogin ? 'Welcome back! Please login to your account.' : 'Create your vendor account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="vendor-login__form">
          {!isLogin && (
            <div className="vendor-login__form-group">
              <label htmlFor="businessName">Business Name</label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={(formData as VendorSignupData).businessName || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter your business name"
              />
            </div>
          )}

          <div className="vendor-login__form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="vendor-login__form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <>
              <div className="vendor-login__form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={(formData as VendorSignupData).phoneNumber || ''}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="vendor-login__form-group">
                <label htmlFor="district">District</label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={(formData as VendorSignupData).district || ''}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your district"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="vendor-login__submit"
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="vendor-login__footer">
          <button
            type="button"
            className="vendor-login__toggle"
            onClick={toggleMode}
          >
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
          {isLogin && (
            <button
              type="button"
              className="vendor-login__forgot-password"
              onClick={() => navigate('/vendor/forgot-password')}
            >
              Forgot Password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;