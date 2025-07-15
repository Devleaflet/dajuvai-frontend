import React, { useState } from "react";
import { VendorSignupRequest } from "../Types/vendor";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../Styles/AddVendorModal.css";

interface District {
  id: number;
  name: string;
}

interface AddVendorModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (vendor: VendorSignupRequest) => Promise<void>;
  districts: District[];
}

const AddVendorModal: React.FC<AddVendorModalProps> = ({ show, onClose, onAdd, districts }) => {
  const [formData, setFormData] = useState<VendorSignupRequest>({
    businessName: "",
    email: "",
    password: "",
    businessAddress: "",
    phoneNumber: "",
    district: districts[0]?.name || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Log the form data before submission
    console.log("Form Data Submitted:", formData);

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
    if (!formData.password.trim() || formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      toast.error("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }
    if (!formData.businessAddress.trim()) {
      setError("Business address is required");
      toast.error("Business address is required");
      setLoading(false);
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError("Phone number is required");
      toast.error("Phone number is required");
      setLoading(false);
      return;
    }
    
    // Enhanced district validation
    if (!formData.district) {
      setError("Please select a district");
      toast.error("Please select a district");
      setLoading(false);
      return;
    }
    
    // Check if the selected district name exists in the districts array
    const selectedDistrict = districts.find(d => d.name === formData.district);
    if (!selectedDistrict) {
      setError("Please select a valid district from the list");
      toast.error("Please select a valid district from the list");
      setLoading(false);
      return;
    }

    try {
      await onAdd(formData);
      setFormData({
        businessName: "",
        email: "",
        password: "",
        businessAddress: "",
        phoneNumber: "",
        district: districts[0]?.name || "",
      });
      toast.success("Vendor created successfully!");
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add vendor";
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
        <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        <div className="modal-header add-vendor-modal-header">
          <h3 className="add-vendor-title">Add New Vendor</h3>
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
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label>Business Address</label>
              <input
                type="text"
                name="businessAddress"
                value={formData.businessAddress}
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
            <div className="form-group">
              <label>District</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
              >
                <option value="">Select a district</option>
                {districts.length === 0 ? (
                  <option disabled>No districts found</option>
                ) : (
                  districts.map((district) => (
                    <option key={district.id} value={district.name}>
                      {district.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="modal-actions add-vendor-actions">
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Creating..." : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendorModal;