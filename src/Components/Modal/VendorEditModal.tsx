import React, { useState, useEffect } from "react";
import "../../Styles/VendorModal.css";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios"; // Assuming axios is available; install if not: npm install axios

interface District {
  id: number;
  name: string;
}

interface Vendor {
  id: number;
  businessName: string;
  email: string;
  phoneNumber: string;
  businessAddress?: string;
  profilePicture?: string;
  taxNumber: string;
  taxDocuments: string[] | null;
  businessRegNumber: string;
  citizenshipDocuments: string[] | null;
  chequePhoto: string[] | null;
  accountName: string;
  bankName: string;
  accountNumber: string;
  bankBranch: string;
  bankCode: string;
  isVerified: boolean;
  status: "Active" | "Inactive";
  district?: District;
}

interface ImageUploadResponse {
  url: string;
  publicId: string;
}

interface VendorEditModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (vendor: Vendor) => Promise<void>;
  vendor: Vendor | null;
}

const VendorEditModal: React.FC<VendorEditModalProps> = ({ show, onClose, onSave, vendor }) => {
  const [formData, setFormData] = useState<Vendor>({
    id: 0,
    businessName: "",
    email: "",
    phoneNumber: "",
    businessAddress: "",
    profilePicture: "",
    taxNumber: "",
    taxDocuments: null,
    businessRegNumber: "",
    citizenshipDocuments: null,
    chequePhoto: null,
    accountName: "",
    bankName: "",
    accountNumber: "",
    bankBranch: "",
    bankCode: "",
    isVerified: true,
    status: "Active",
    district: undefined,
  });
  const [districts, setDistricts] = useState<District[]>([]);
  const [taxFiles, setTaxFiles] = useState<File[]>([]);
  const [citizenshipFiles, setCitizenshipFiles] = useState<File[]>([]);
  const [chequeFiles, setChequeFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      fetchDistricts();
    }
  }, [show]);

  useEffect(() => {
    if (vendor) {
      setFormData({
        ...vendor,
        status: vendor.isVerified ? "Active" : "Inactive",
        businessAddress: vendor.businessAddress || "",
        profilePicture: vendor.profilePicture || "",
        taxNumber: vendor.taxNumber || "",
        taxDocuments: Array.isArray(vendor.taxDocuments) ? vendor.taxDocuments : vendor.taxDocuments ? [vendor.taxDocuments] : null,
        businessRegNumber: vendor.businessRegNumber || "",
        citizenshipDocuments: Array.isArray(vendor.citizenshipDocuments) ? vendor.citizenshipDocuments : vendor.citizenshipDocuments ? [vendor.citizenshipDocuments] : null,
        chequePhoto: Array.isArray(vendor.chequePhoto) ? vendor.chequePhoto : vendor.chequePhoto ? [vendor.chequePhoto] : null,
        accountName: vendor.accountName || "",
        bankName: vendor.bankName || "",
        accountNumber: vendor.accountNumber || "",
        bankBranch: vendor.bankBranch || "",
        bankCode: vendor.bankCode || "",
      });
      // Reset file inputs when vendor changes
      setTaxFiles([]);
      setCitizenshipFiles([]);
      setChequeFiles([]);
 
    }
  }, [vendor]);

  const fetchDistricts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/district`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch districts");
      }

      const data = await response.json();
      setDistricts(data.data || []);
    } catch (err) {
      console.error("Error fetching districts:", err);
      toast.error("Failed to load districts");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "district") {
      const selectedDistrict = districts.find((d) => d.name === value);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (field === "taxDocuments") setTaxFiles(files);
      if (field === "citizenshipDocuments") setCitizenshipFiles(files);
      if (field === "chequePhoto") setChequeFiles(files);
     
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post<ImageUploadResponse>(
        `${API_BASE_URL}/api/image?folder=vendor`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data.url; // Return the secure URL
    } catch (error) {
      throw new Error("Failed to upload file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const requiredFields = [
      { field: formData.businessName, name: "Business name" },
      { field: formData.email, name: "Email" },
      { field: formData.phoneNumber, name: "Phone number" },
      { field: formData.taxNumber, name: "Tax number" },
      { field: formData.businessRegNumber, name: "Business registration number" },
      { field: formData.accountName, name: "Account name" },
      { field: formData.bankName, name: "Bank name" },
      { field: formData.accountNumber, name: "Account number" },
      { field: formData.bankBranch, name: "Bank branch" },
      { field: formData.bankCode, name: "Bank code" },
    ];

    for (const { field, name } of requiredFields) {
      if (!field?.trim()) {
        setError(`${name} is required`);
        toast.error(`${name} is required`);
        setLoading(false);
        return;
      }
    }

    const updatedFormData = { ...formData };
    try {
      if (taxFiles.length > 0) {
        updatedFormData.taxDocuments = await Promise.all(taxFiles.map((file) => uploadFile(file)));
      }
      if (citizenshipFiles.length > 0) {
        updatedFormData.citizenshipDocuments = await Promise.all(citizenshipFiles.map((file) => uploadFile(file)));
      }
      if (chequeFiles.length > 0) {
        updatedFormData.chequePhoto = await Promise.all(chequeFiles.map((file) => uploadFile(file)));
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload files";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
      return;
    }

    try {
      await onSave(updatedFormData);
      onClose();
      toast.success("Vendor updated successfully");
      window.location.href = "/admin-vendors"; // Redirect after successful update
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update vendor";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Vendor</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="vendor-details">
          <form onSubmit={handleSubmit}>
            <div className="detail-grid two-column">
              <div className="detail-item">
                <label>
                  <strong>Business Name</strong>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                    minLength={3}
                    className="form-input"
                  />
                </label>
              </div>
              <div className="detail-item">
                <label>
                  <strong>Email</strong>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </label>
              </div>
              <div className="detail-item">
                <label>
                  <strong>Phone Number</strong>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </label>
              </div>
              <div className="detail-item">
                <label>
                  <strong>PAN Number</strong>
                  <input
                    type="text"
                    name="taxNumber"
                    value={formData.taxNumber}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </label>
              </div>
              <div className="detail-item">
                <label>
                  <strong>Business Reg Number</strong>
                  <input
                    type="text"
                    name="businessRegNumber"
                    value={formData.businessRegNumber}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </label>
              </div>
           
              <div className="detail-item">
                <label>
                  <strong>Account Name</strong>
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </label>
              </div>
              <div className="detail-item">
                <label>
                  <strong>Bank Name</strong>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </label>
              </div>
              <div className="detail-item">
                <label>
                  <strong>Account Number</strong>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </label>
              </div>
              <div className="detail-item">
                <label>
                  <strong>Bank Branch</strong>
                  <input
                    type="text"
                    name="bankBranch"
                    value={formData.bankBranch}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </label>
              </div>
              <div className="detail-item">
                <label>
                  <strong>Bank Code</strong>
                  <input
                    type="text"
                    name="bankCode"
                    value={formData.bankCode}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </label>
              </div>
              <div className="detail-item">
                <label>
                  <strong>District</strong>
                  <select
                    name="district"
                    value={formData.district?.name || ""}
                    onChange={handleChange}
                    required
                    className="form-input"
                  >
                    <option value="">Select a district</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="detail-item">
                <label>
                  <strong>Status</strong>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="form-input"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </div>

          

            <div className="document-section">
              <h3>PAN Documents</h3>
              <div className="document-container">
                {formData.taxDocuments && formData.taxDocuments.length > 0 && (
                  <div className="document-preview">
                    {formData.taxDocuments.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                        View Document {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
                <div className="document-item file-upload">
                  <label htmlFor="taxDocuments" className="file-label">
                    Choose Images
                  </label>
                  <input
                    type="file"
                    id="taxDocuments"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, "taxDocuments")}
                  />
                </div>
              </div>
            </div>

            <div className="document-section">
              <h3>Citizenship Documents</h3>
              <div className="document-container">
                {formData.citizenshipDocuments && formData.citizenshipDocuments.length > 0 && (
                  <div className="document-preview">
                    {formData.citizenshipDocuments.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                        View Document {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
                <div className="document-item file-upload">
                  <label htmlFor="citizenshipDocuments" className="file-label">
                    Choose Images
                  </label>
                  <input
                    type="file"
                    id="citizenshipDocuments"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, "citizenshipDocuments")}
                  />
                </div>
              </div>
            </div>

            <div className="document-section">
              <h3>Cheque Photo</h3>
              <div className="document-container">
                {formData.chequePhoto && formData.chequePhoto.length > 0 && (
                  <div className="document-preview">
                    {formData.chequePhoto.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                        View Cheque {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
                <div className="document-item file-upload">
                  <label htmlFor="chequePhoto" className="file-label">
                    Choose Images
                  </label>
                  <input
                    type="file"
                    id="chequePhoto"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, "chequePhoto")}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
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
    </div>
  );
};

export default VendorEditModal;