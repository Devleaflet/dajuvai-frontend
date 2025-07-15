import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, MapPin, Phone, Building, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface VendorData {
  id: number;
  email: string;
  businessName: string;
}

interface AuthResponse {
  success: boolean;
  vendor?: VendorData;
  token?: string;
  message?: string;
  errors?: Array<{
    path: string[];
    message: string;
  }>;
}

const VendorAuth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    businessAddress: '',
    phoneNumber: ''
  });
  
  // Messages and errors
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => {
        setShowMessage(false);
        setMessage('');
        setErrors([]);
        setIsSuccess(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (errors.length > 0 || message) {
      setErrors([]);
      setMessage('');
      setIsSuccess(false);
      setShowMessage(false);
    }
  };

  // Validation function
  // const validateForm = () => {
  //   const newErrors: string[] = [];
    
  //   if (!formData.email) {
  //     newErrors.push('Email is required');
  //   } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
  //     newErrors.push('Please enter a valid email address');
  //   }
    
  //   if (!formData.password) {
  //     newErrors.push('Password is required');
  //   } else if (formData.password.length < 6) {
  //     newErrors.push('Password must be at least 6 characters long');
  //   }
    
  //   if (!isLogin) {
  //     if (!formData.businessName) {
  //       newErrors.push('Business name is required');
  //     } else if (formData.businessName.length < 3) {
  //       newErrors.push('Business name must be at least 3 characters long');
  //     }
      
  //     if (!formData.businessAddress) {
  //       newErrors.push('Business address is required');
  //     }
      
  //     if (!formData.phoneNumber) {
  //       newErrors.push('Phone number is required');
  //     }
  //   }
    
  //   return newErrors;
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
    
  //   // Validate form
  //   const validationErrors = validateForm();
  //   if (validationErrors.length > 0) {
  //     setErrors(validationErrors);
  //     setShowMessage(true);
  //     return;
  //   }

  //   setIsLoading(true);
  //   setMessage('');
  //   setErrors([]);
  //   setShowMessage(false);

  //   try {
  //     const response = await fetch(`${API_BASE_URL}/api/vendors/${isLogin ? 'login' : 'signup'}`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(formData),
  //     });

  //     const data: AuthResponse = await response.json();

  //     setShowMessage(true);
  //     if (data.success) {
  //       setMessage(isLogin ? 'Login successful!' : 'Registration successful!');
  //       setIsSuccess(true);
  //       if (data.token) {
  //         localStorage.setItem('vendorToken', data.token);
  //       }
  //     } else {
  //       setErrors(data.errors?.map(err => err.message) || ['Authentication failed']);
  //     }
  //   } catch (error) {
  //     setMessage('Network error. Please check your connection and try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSendVerification = async () => {
    if (!verificationEmail) {
      setMessage('Please enter your email address');
      setShowMessage(true);
      return;
    }

    setIsLoading(true);
    setMessage('');
    setErrors([]);
    setShowMessage(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verificationEmail }),
      });

      const data: AuthResponse = await response.json();

      setShowMessage(true);
      if (data.success) {
        setMessage('Verification email sent! Please check your inbox.');
        setIsSuccess(true);
      } else {
        setErrors(data.errors?.map(err => err.message) || ['Failed to send verification email']);
      }
    } catch (error) {
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      businessName: '',
      businessAddress: '',
      phoneNumber: ''
    });
    setErrors([]);
    setMessage('');
    setIsSuccess(false);
    setShowMessage(false);
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verification</h2>
            <p className="text-gray-600">Enter your email to receive a verification token</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Enter your email"
                value={verificationEmail}
                onChange={(e) => setVerificationEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleSendVerification}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send Verification Token'}
            </button>

            {showMessage && message && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isSuccess ? (
                  <CheckCircle size={20} />
                ) : (
                  <XCircle size={20} />
                )}
                {message}
              </div>
            )}

            <button
              onClick={() => setShowVerification(false)}
              className="w-full text-green-600 hover:text-green-700 py-2 font-medium"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isLogin ? 'Vendor Login' : 'Vendor Registration'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to your vendor account' : 'Create your vendor account'}
          </p>
        </div>

        <div className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="businessName"
                  placeholder="Business Name"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                <textarea
                  name="businessAddress"
                  placeholder="Business Address"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
          </button>

          {showMessage && errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <XCircle size={20} />
                <span className="font-medium">Please fix the following errors:</span>
              </div>
              {errors.map((error, index) => (
                <div key={index} className="text-red-600 text-sm ml-6">
                  • {error}
                </div>
              ))}
            </div>
          )}

          {showMessage && message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {isSuccess ? (
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
              )}
              {message}
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={toggleMode}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                {isLogin ? 'Register here' : 'Login here'}
              </button>
            </p>
            
            {isLogin && (
              <button
                type="button"
                onClick={() => setShowVerification(true)}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Need email verification?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAuth;