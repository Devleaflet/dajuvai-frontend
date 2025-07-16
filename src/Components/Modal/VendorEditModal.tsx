// VendorEditModal.tsx
import React, { useState, useEffect } from "react";
import "../../Styles/VendorModal.css";
import { API_BASE_URL } from '../../config';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface District {
  id: number;
  name: string;
}

interface Vendor {
  id: number;
  businessName: string;
  email: string;
  phoneNumber: string;
  isVerified: boolean;
  status: "Active" | "Inactive";
  district?: {
    id: number;
    name: string;
  };
}

interface VendorEditModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (vendor: Vendor) => void;
  vendor: Vendor | null;
}

const VendorEditModal: React.FC<VendorEditModalProps> = ({ show, onClose, onSave, vendor }) => {
  const [formData, setFormData] = useState<Vendor>({
    id: 0,
    businessName: "",
    email: "",
    phoneNumber: "",
    isVerified: true,
    status: "Active",
  });
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch districts when modal opens
  useEffect(() => {
    if (show) {
      fetchDistricts();
    }
  }, [show]);

  useEffect(() => {
    if (vendor) {
      setFormData({
        ...vendor,
        status: vendor.isVerified ? "Active" : "Inactive"
      });
    }
  }, [vendor]);

  const fetchDistricts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/district`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch districts');
      }
      
      const data = await response.json();
      setDistricts(data.data || []);
    } catch (err) {
      console.error('Error fetching districts:', err);
      toast.error('Failed to load districts');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "district") {
      // Find the selected district object
      const selectedDistrict = districts.find(d => d.name === value);
      setFormData((prev) => ({
        ...prev,
        district: selectedDistrict || undefined,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "status" ? value : value,
        ...(name === "status" ? { isVerified: value === "Active" } : {}),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (!formData.businessName.trim()) {
      setError("Business name is required");
      toast.error("Business name is required");
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      toast.error("Email is required");
      setLoading(false);
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError("Phone number is required");
      toast.error("Phone number is required");
      setLoading(false);
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vendor';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay add-vendor-modal-overlay">
      <div className="modal-content add-vendor-modal-content">
        <div className="modal-header add-vendor-modal-header">
          <h3 className="add-vendor-title">Edit Vendor</h3>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        {error && <div className="error-message add-vendor-error">{error}</div>}

        <form onSubmit={handleSubmit} className="add-vendor-form">
          <div className="add-vendor-form-row">
            <div className="form-group">
              <label>Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                minLength={3}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="add-vendor-form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="add-vendor-form-row">
            <div className="form-group">
              <label>District</label>
              <input
                type="text"
                name="district"
                value={formData.district?.name || ""}
                readOnly
                disabled
                style={{ backgroundColor: '#f5f5f5', color: '#888' }}
              />
            </div>
          </div>

          <div className="modal-actions add-vendor-actions">
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Updating..." : "Update Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorEditModal;