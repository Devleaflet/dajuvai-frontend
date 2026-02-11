import React, { useState, useEffect, FC } from 'react';
import { Vendor, District, VendorUpdateRequest, PaymentType, PaymentOptionInput } from '../Types/vendor';
import { FaTrash, FaPlus, FaWallet, FaUniversity } from 'react-icons/fa';
import '../../Styles/AdminVendor.css';
import '../../Styles/AddVendorModal.css';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

interface ImageUploadResponse {
  success: boolean;
  data: string;
  publicId?: string;
}

interface VendorEditModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (vendorData: Partial<VendorUpdateRequest>) => void;
  vendor: Vendor | null;
  districts?: District[];
}

const VendorEditModal: FC<VendorEditModalProps> = ({ show, onClose, onSave, vendor, districts = [] }) => {
  interface VendorFormData {
    id?: number;
    businessName: string;
    email: string;
    phoneNumber: string;
    telePhone: string;
    businessRegNumber: string;
    districtId: number;
    district: string;
    taxNumber: string;
    taxDocuments: string[];
    citizenshipDocuments: string[];
    paymentOptions: PaymentOptionInput[];
    businessAddress: string;
    profilePicture: string;
  }

  // File states for uploads
  const [taxFiles, setTaxFiles] = useState<File[]>([]);
  const [citizenshipFiles, setCitizenshipFiles] = useState<File[]>([]);
  const [chequeFile, setChequeFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<VendorFormData>({
    businessName: '',
    email: '',
    phoneNumber: '',
    telePhone: '',
    businessRegNumber: '',
    districtId: 0,
    district: '',
    taxNumber: '',
    taxDocuments: [],
    citizenshipDocuments: [],
    paymentOptions: [],
    businessAddress: '',
    profilePicture: '',
  });

  // Payment Options UI state
  const [currentPaymentType, setCurrentPaymentType] = useState<PaymentType | "">("");
  const [walletNumber, setWalletNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [bankBranch, setBankBranch] = useState<string>("");

  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormData, string>>>({});

  // File upload function
  const uploadFile = async (file: File): Promise<string> => {
    //(`Uploading file: ${file.name}`);
    const formData = new FormData();
    formData.append("file", file);

    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await axios.post<ImageUploadResponse>(
        `${API_BASE_URL}/api/image?folder=vendor`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(`No URL returned for file: ${file.name}`);
      }
      //(`File uploaded successfully: ${file.name} -> ${response.data.data}`);
      return response.data.data;
    } catch (error: any) {
      console.error(`Failed to upload file ${file.name}:`, error.response?.data || error.message);
      throw new Error(`Failed to upload file ${file.name}: ${error.response?.data?.message || error.message}`);
    }
  };

  // File handling methods
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const files = Array.from(e.target.files || []);
    //(`File input changed for ${field}:`, files.map((f) => f.name));
    if (files.length > 0) {
      if (field === "taxDocuments") setTaxFiles((prev) => [...prev, ...files]);
      if (field === "citizenshipDocuments") setCitizenshipFiles((prev) => [...prev, ...files]);
      if (field === "chequePhoto") setChequeFile(files[0]);
      if (field === "profilePicture") setProfileFile(files[0]);
    }
  };

  const handleRemoveFile = (index: number, field: string) => {
    //(`Removing file from ${field} at index ${index}`);
    if (field === "taxDocuments") setTaxFiles((prev) => prev.filter((_, i) => i !== index));
    if (field === "citizenshipDocuments") setCitizenshipFiles((prev) => prev.filter((_, i) => i !== index));
    if (field === "profilePicture") setProfileFile(null);
  };

  const handleAddPaymentOption = () => {
    if (!currentPaymentType) {
      toast.error("Please select a payment method type");
      return;
    }
    const isWallet = ["ESEWA", "KHALTI", "IMEPAY", "FONEPAY"].includes(currentPaymentType);

    if (isWallet) {
      if (!walletNumber.trim() || !accountName.trim()) {
        toast.error("Wallet number and account name are required for wallet types.");
        return;
      }
    } else {
      if (!accountNumber.trim() || !bankName.trim() || !accountName.trim() || !bankBranch.trim()) {
        toast.error("Account number, bank name, account name, and branch are required for NPS.");
        return;
      }
    }

    const newOption: PaymentOptionInput = {
      paymentType: currentPaymentType as PaymentType,
      details: isWallet ? {
        walletNumber,
        accountName
      } : {
        accountNumber,
        bankName,
        accountName,
        branch: bankBranch
      },
      isActive: true
    };

    setFormData(prev => ({
      ...prev,
      paymentOptions: [...prev.paymentOptions, newOption]
    }));

    // Reset current inputs
    setWalletNumber("");
    setAccountNumber("");
    setBankName("");
    setAccountName("");
    setBankBranch("");
  };

  const removePaymentOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      paymentOptions: prev.paymentOptions.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    if (vendor) {
      let districtName = '';
      let districtId = 0;

      const districtField = vendor.district;
      if (districtField && typeof districtField === 'object') {
        districtId = districtField.id;
        districtName = districtField.name || '';
      } else if (typeof districtField === 'string') {
        districtName = districtField;
        const foundDistrict = districts.find(d => d.name === districtField);
        districtId = foundDistrict?.id || 0;
      }

      setFormData({
        id: vendor.id,
        businessName: vendor.businessName || '',
        email: vendor.email || '',
        phoneNumber: vendor.phoneNumber || '',
        telePhone: vendor.telePhone || '',
        businessRegNumber: vendor.businessRegNumber || '',
        districtId: districtId,
        district: districtName,
        taxNumber: vendor.taxNumber || '',
        taxDocuments: vendor.taxDocuments || [],
        citizenshipDocuments: vendor.citizenshipDocuments || [],
        paymentOptions: (vendor.paymentOptions as any) || [],
        businessAddress: vendor.businessAddress || '',
        profilePicture: vendor.profilePicture || '',
      });
    }
  }, [vendor, districts]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof VendorFormData, string>> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business Name is required';
    }
    // Email field is disabled, so no validation needed
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone Number is required';
    }
    if (formData.districtId === 0) {
      newErrors.districtId = 'Please select a district';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'districtId') {
      const selectedDistrict = districts.find(d => d.id === parseInt(value));
      setFormData((prev) => ({
        ...prev,
        districtId: parseInt(value),
        district: selectedDistrict?.name || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDocumentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'taxDocuments' | 'citizenshipDocuments'
  ) => {
    const value = e.target.value.trim();
    if (!value) return;

    setFormData((prev) => {
      const currentArray = [...prev[field]];
      if (!currentArray.includes(value)) {
        currentArray.push(value);
      }
      return {
        ...prev,
        [field]: currentArray,
      };
    });
  };

  const handleRemoveDocument = (
    field: 'taxDocuments' | 'citizenshipDocuments',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);
    setIsUploading(true);
    try {
      // Upload files and get URLs
      const uploadedTaxDocs = [...formData.taxDocuments];
      const uploadedCitizenshipDocs = [...formData.citizenshipDocuments];
      let uploadedChequePhoto = formData.chequePhoto;
      let uploadedProfilePicture = formData.profilePicture;

      // Upload tax documents
      for (const file of taxFiles) {
        const url = await uploadFile(file);
        uploadedTaxDocs.push(url);
      }

      // Upload citizenship documents
      for (const file of citizenshipFiles) {
        const url = await uploadFile(file);
        uploadedCitizenshipDocs.push(url);
      }

      // Upload profile picture
      if (profileFile) {
        uploadedProfilePicture = await uploadFile(profileFile);
      }

      const apiData: Partial<VendorUpdateRequest> = {
        businessName: formData.businessName,
        phoneNumber: formData.phoneNumber,
        telePhone: formData.telePhone,
        businessRegNumber: formData.businessRegNumber,
        district: formData.district,
        taxNumber: formData.taxNumber,
        businessAddress: formData.businessAddress,
        profilePicture: uploadedProfilePicture,
        taxDocuments: uploadedTaxDocs.filter(doc => doc && doc.trim() !== '') as string[],
        citizenshipDocuments: uploadedCitizenshipDocs.filter(doc => doc && doc.trim() !== '') as string[],
        paymentOptions: formData.paymentOptions,
      };

      //('Sending API data:', apiData);
      await onSave(apiData);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(`Failed to upload files: ${error.message}`);
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  if (!show || !vendor) return null;

  return (
    <div className="vendor-edit-modal">
      <div className="vendor-edit-modal__content">
        <div className="vendor-edit-modal__header">
          <h2 className="vendor-edit-modal__title">Edit Vendor</h2>
        </div>
        <form onSubmit={handleSubmit} className="vendor-edit-modal__form">
          <div className="vendor-edit-modal__form-group">
            <label htmlFor="businessName" className="vendor-edit-modal__label">
              Business Name
            </label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
            {errors.businessName && <p className="vendor-edit-modal__error">{errors.businessName}</p>}
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="email" className="vendor-edit-modal__label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
              disabled
            />
            {errors.email && <p className="vendor-edit-modal__error">{errors.email}</p>}
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="phoneNumber" className="vendor-edit-modal__label">
              Phone Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
            {errors.phoneNumber && <p className="vendor-edit-modal__error">{errors.phoneNumber}</p>}
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="telePhone" className="vendor-edit-modal__label">
              Telephone
            </label>
            <input
              type="text"
              id="telePhone"
              name="telePhone"
              value={formData.telePhone || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="businessRegNumber" className="vendor-edit-modal__label">
              Business Registration Number
            </label>
            <input
              type="text"
              id="businessRegNumber"
              name="businessRegNumber"
              value={formData.businessRegNumber || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="districtId" className="vendor-edit-modal__label">
              District
            </label>
            <select
              id="districtId"
              name="districtId"
              value={formData.districtId || 0}
              onChange={handleChange}
              className="vendor-edit-modal__select"
            >
              <option value={0}>Select District</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            {errors.districtId && <p className="vendor-edit-modal__error">{errors.districtId}</p>}
            {formData.district && (
              <p className="vendor-edit-modal__label">
                Selected: {formData.district}
              </p>
            )}
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="taxNumber" className="vendor-edit-modal__label">
              Tax Number
            </label>
            <input
              type="text"
              id="taxNumber"
              name="taxNumber"
              value={formData.taxNumber || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
          </div>

          <div className="vendor-edit-modal__form-group">
            <label className="vendor-edit-modal__label">
              Tax Documents
            </label>
            <div className="document-section">
              <div className="document-container">
                <div className="document-item file-upload">
                  <label htmlFor="taxDocuments" className="file-label">
                    Choose Files
                  </label>
                  <input
                    type="file"
                    id="taxDocuments"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, "taxDocuments")}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              {/* Show new files to be uploaded */}
              {taxFiles.length > 0 && (
                <div className="file-list">
                  <p className="vendor-edit-modal__label">New Files to Upload:</p>
                  {taxFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveFile(index, "taxDocuments")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Show existing documents */}
              {formData.taxDocuments && formData.taxDocuments.length > 0 && (
                <div className="vendor-edit-modal__document-list">
                  <p className="vendor-edit-modal__label">Current Documents:</p>
                  {formData.taxDocuments.map((doc, index) => (
                    <div key={index} className="vendor-edit-modal__document-item">
                      <a
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vendor-edit-modal__document-link"
                      >
                        Document {index + 1}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument('taxDocuments', index)}
                        className="vendor-edit-modal__document-remove"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="vendor-edit-modal__form-group">
            <label className="vendor-edit-modal__label">
              Citizenship Documents (Optional)
            </label>
            <div className="document-section">
              <div className="document-container">
                <div className="document-item file-upload">
                  <label htmlFor="citizenshipDocuments" className="file-label">
                    Choose Files
                  </label>
                  <input
                    type="file"
                    id="citizenshipDocuments"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, "citizenshipDocuments")}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              {/* Show new files to be uploaded */}
              {citizenshipFiles.length > 0 && (
                <div className="file-list">
                  <p className="vendor-edit-modal__label">New Files to Upload:</p>
                  {citizenshipFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveFile(index, "citizenshipDocuments")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Show existing documents */}
              {formData.citizenshipDocuments && formData.citizenshipDocuments.length > 0 && (
                <div className="vendor-edit-modal__document-list">
                  <p className="vendor-edit-modal__label">Current Documents:</p>
                  {formData.citizenshipDocuments.map((doc, index) => (
                    <div key={index} className="vendor-edit-modal__document-item">
                      <a
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vendor-edit-modal__document-link"
                      >
                        Document {index + 1}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument('citizenshipDocuments', index)}
                        className="vendor-edit-modal__document-remove"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="vendor-edit-modal__section-title">
            Payment Options
          </div>
          <div className="vendor-edit-modal__form-group">
            <label className="vendor-edit-modal__label">Payment Options *</label>

            {formData.paymentOptions.length > 0 && (
              <div className="vendor-edit-modal__payment-list" style={{ marginBottom: "20px" }}>
                {formData.paymentOptions.map((option, index) => (
                  <div key={index} className="vendor-edit-modal__payment-item" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                    background: "#f9f9f9",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    marginBottom: "8px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {["ESEWA", "KHALTI", "IMEPAY", "FONEPAY"].includes(option.paymentType) ? <FaWallet color="#4caf50" /> : <FaUniversity color="#2196f3" />}
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "14px" }}>{option.paymentType}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {option.details.accountName} - {option.details.walletNumber || option.details.accountNumber}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePaymentOption(index)}
                      style={{ background: "none", border: "none", color: "#ff5722", cursor: "pointer" }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="vendor-edit-modal__add-payment" style={{
              padding: "15px",
              border: "1px dashed #ccc",
              borderRadius: "8px",
              background: "#fff"
            }}>
              <div className="vendor-edit-modal__form-group">
                <label className="vendor-edit-modal__label">Choose Method Type</label>
                <select
                  className="vendor-edit-modal__select"
                  value={currentPaymentType}
                  onChange={(e) => setCurrentPaymentType(e.target.value as PaymentType)}
                >
                  <option value="">Select a method...</option>
                  <option value="ESEWA">eSewa</option>
                  <option value="KHALTI">Khalti</option>
                  <option value="IMEPAY">IME Pay</option>
                  <option value="FONEPAY">Fonepay</option>
                  <option value="NPS">Bank Transfer (NPS)</option>
                </select>

                {currentPaymentType && (
                  <div style={{ marginTop: "10px", padding: "10px", background: "#f0f7ff", borderRadius: "4px", borderLeft: "4px solid #2196f3" }}>
                    <div style={{ fontWeight: "600", fontSize: "12px", color: "#0056b3", marginBottom: "4px" }}>
                      {["ESEWA", "KHALTI", "IMEPAY", "FONEPAY"].includes(currentPaymentType) ? "Digital Wallet (Instant Settlement)" : "Bank Transfer (Standard Settlement)"}
                    </div>
                    <p style={{ fontSize: "11px", color: "#444", margin: 0, lineHeight: "1.4" }}>
                      {["ESEWA", "KHALTI", "IMEPAY", "FONEPAY"].includes(currentPaymentType)
                        ? "Use this for fast, automated payments. Recommended for local vendors with frequent payouts."
                        : "Funds will be transferred directly to your bank account. Suitable for larger, bulk settlements."}
                    </p>
                  </div>
                )}
              </div>

              {currentPaymentType && (
                ["ESEWA", "KHALTI", "IMEPAY", "FONEPAY"].includes(currentPaymentType) ? (
                  <>
                    <div className="vendor-edit-modal__form-group">
                      <label className="vendor-edit-modal__label">Wallet Number</label>
                      <input
                        type="text"
                        className="vendor-edit-modal__input"
                        value={walletNumber}
                        onChange={(e) => setWalletNumber(e.target.value)}
                        placeholder="e.g. 98XXXXXXXX"
                      />
                    </div>
                    <div className="vendor-edit-modal__form-group">
                      <label className="vendor-edit-modal__label">Account Name</label>
                      <input
                        type="text"
                        className="vendor-edit-modal__input"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Account Holder Name"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="vendor-edit-modal__form-group">
                      <label className="vendor-edit-modal__label">Bank Name</label>
                      <input
                        type="text"
                        className="vendor-edit-modal__input"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. Nabil Bank"
                      />
                    </div>
                    <div className="vendor-edit-modal__form-group">
                      <label className="vendor-edit-modal__label">Account Number</label>
                      <input
                        type="text"
                        className="vendor-edit-modal__input"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Account Number"
                      />
                    </div>
                    <div className="vendor-edit-modal__form-group">
                      <label className="vendor-edit-modal__label">Account Name</label>
                      <input
                        type="text"
                        className="vendor-edit-modal__input"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Account Holder Name"
                      />
                    </div>
                    <div className="vendor-edit-modal__form-group">
                      <label className="vendor-edit-modal__label">Bank Branch</label>
                      <input
                        type="text"
                        className="vendor-edit-modal__input"
                        value={bankBranch}
                        onChange={(e) => setBankBranch(e.target.value)}
                        placeholder="e.g. New Road Branch"
                      />
                    </div>
                  </>
                )
              )}

              <button
                type="button"
                className="vendor-edit-modal__button vendor-edit-modal__button--add"
                onClick={handleAddPaymentOption}
                style={{
                  marginTop: "10px",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: "#4caf50",
                  color: "white",
                  padding: "10px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                <FaPlus /> Add Payment Method
              </button>
            </div>
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="businessAddress" className="vendor-edit-modal__label">
              Business Address
            </label>
            <textarea
              id="businessAddress"
              name="businessAddress"
              value={formData.businessAddress || ''}
              onChange={handleChange}
              className="vendor-edit-modal__textarea"
              rows={4}
            />
          </div>

          <div className="vendor-edit-modal__form-group">
            <label className="vendor-edit-modal__label">
              Profile Picture
            </label>
            <div className="document-section">
              <div className="document-container">
                <div className="document-item file-upload">
                  <label htmlFor="profilePicture" className="file-label">
                    Choose File
                  </label>
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "profilePicture")}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              {/* Show new file to be uploaded */}
              {profileFile && (
                <div className="file-list">
                  <p className="vendor-edit-modal__label">New File to Upload:</p>
                  <div className="file-item">
                    <span className="file-name">{profileFile.name}</span>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveFile(0, "profilePicture")}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              {/* Show existing profile picture */}
              {formData.profilePicture && !profileFile && (
                <div className="vendor-edit-modal__document-list">
                  <p className="vendor-edit-modal__label">Current Profile Picture:</p>
                  <div className="vendor-edit-modal__document-item">
                    <a
                      href={formData.profilePicture}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vendor-edit-modal__document-link"
                    >
                      View Profile Picture
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="vendor-edit-modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="vendor-edit-modal__button vendor-edit-modal__button--cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vendor-edit-modal__button vendor-edit-modal__button--save"
              disabled={isSaving || isUploading}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorEditModal;