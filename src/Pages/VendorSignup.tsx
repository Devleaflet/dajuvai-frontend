import React, { useState, FormEvent } from 'react';
import { VendorAuthService } from '../services/vendorAuthService';
import { VendorSignupRequest } from '../types/vendor';
import '../Styles/VendorSignup.css';

const VendorSignup: React.FC = () => {
  const [formData, setFormData] = useState<VendorSignupRequest>({
    businessName: '',
    email: '',
    password: '',
    businessAddress: '',
    phoneNumber: '',
    district: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const response = await VendorAuthService.signup(formData, null);

    if (response.success && response.vendor) {
      setSuccess('Signup successful! Please check your email for verification.');
    } else {
      setError(response.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="vendor-signup">
      <h2 className="vendor-signup__title">Vendor Signup</h2>
      {error && <div className="vendor-signup__error">{error}</div>}
      {success && <div className="vendor-signup__success">{success}</div>}
      <form className="vendor-signup__form" onSubmit={handleSubmit}>
        <div className="vendor-signup__field">
          <label className="vendor-signup__label" htmlFor="businessName">Business Name</label>
          <input
            className="vendor-signup__input"
            type="text"
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="vendor-signup__field">
          <label className="vendor-signup__label" htmlFor="email">Email</label>
          <input
            className="vendor-signup__input"
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="vendor-signup__field">
          <label className="vendor-signup__label" htmlFor="password">Password</label>
          <input
            className="vendor-signup__input"
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="vendor-signup__field">
          <label className="vendor-signup__label" htmlFor="businessAddress">Business Address</label>
          <input
            className="vendor-signup__input"
            type="text"
            id="businessAddress"
            name="businessAddress"
            value={formData.businessAddress}
            onChange={handleChange}
            required
          />
        </div>
        <div className="vendor-signup__field">
          <label className="vendor-signup__label" htmlFor="district">District</label>
          <input
            className="vendor-signup__input"
            type="text"
            id="district"
            name="district"
            value={formData.district}
            onChange={handleChange}
            required
          />
        </div>
        <div className="vendor-signup__field">
          <label className="vendor-signup__label" htmlFor="phoneNumber">Phone Number</label>
          <input
            className="vendor-signup__input"
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>
        <button className="vendor-signup__button" type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default VendorSignup;