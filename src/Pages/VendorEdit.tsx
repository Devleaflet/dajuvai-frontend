import React, { useState, FormEvent } from 'react';
import { VendorAuthService, VendorUpdateRequest } from '../services/vendorAuthService';
import { Vendor } from '../Components/Types/vendor';
import './VendorEdit.css';

interface VendorEditProps {
  vendor: Vendor;
}

const VendorEdit: React.FC<VendorEditProps> = ({ vendor }) => {
  const [formData, setFormData] = useState<VendorUpdateRequest>({
    id: vendor.id,
    businessName: vendor.businessName,
    email: vendor.email,
    phoneNumber: vendor.phoneNumber || '',
    businessAddress: vendor.businessAddress || '',
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

    const token = localStorage.getItem('vendorToken');
    if (!token) {
      setError('Authentication token missing. Please log in.');
      return;
    }

    const response = await VendorAuthService.updateVendor(vendor.id, formData, token);

    if (response.success && response.data) {
      setSuccess('Profile updated successfully!');
    } else {
      setError(response.message || 'Update failed. Please try again.');
    }
  };

  return (
    <div className="vendor-edit">
      <h2 className="vendor-edit__title">Edit Vendor Profile</h2>
      {error && <div className="vendor-edit__error">{error}</div>}
      {success && <div className="vendor-edit__success">{success}</div>}
      <form className="vendor-edit__form" onSubmit={handleSubmit}>
        <div className="vendor-edit__field">
          <label className="vendor-edit__label" htmlFor="businessName">Business Name</label>
          <input
            className="vendor-edit__input"
            type="text"
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="vendor-edit__field">
          <label className="vendor-edit__label" htmlFor="email">Email</label>
          <input
            className="vendor-edit__input"
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="vendor-edit__field">
          <label className="vendor-edit__label" htmlFor="businessAddress">Business Address</label>
          <input
            className="vendor-edit__input"
            type="text"
            id="businessAddress"
            name="businessAddress"
            value={formData.businessAddress}
            onChange={handleChange}
            required
          />
        </div>
        <div className="vendor-edit__field">
          <label className="vendor-edit__label" htmlFor="phoneNumber">Phone Number</label>
          <input
            className="vendor-edit__input"
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>
        <button className="vendor-edit__button" type="submit">Update Profile</button>
      </form>
    </div>
  );
};

export default VendorEdit;