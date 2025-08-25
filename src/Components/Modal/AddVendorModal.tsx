import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../Styles/AddVendorModal.css";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { VendorSignupRequest } from "../Types/vendor";
import "../../Styles/AuthModal.css";

interface District {
  id: number;
  name: string;
}

interface ImageUploadResponse {
  success: boolean;
  data: string;
  publicId?: string;
}

interface VerificationResponse {
  message: string;
}

interface AddVendorModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (vendor: VendorSignupRequest) => Promise<void>;
  districts: District[];
  token: string;
}

const AddVendorModal: React.FC<AddVendorModalProps> = ({ show, onClose, districts, token }) => {
  const [formData, setFormData] = useState<VendorSignupRequest>({
    businessName: "",
    email: "",
    password: "",
    phoneNumber: "",
    district: "",
    taxNumber: "",
    taxDocuments: [],
    businessRegNumber: "",
    citizenshipDocuments: null,
    chequePhoto: "",
    bankDetails: {
      accountName: "",
      bankName: "",
      accountNumber: "",
      bankBranch: "",
      bankCode: "",
    },
    profilePicture: "",
  });
  const [taxFiles, setTaxFiles] = useState<File[]>([]);
  const [citizenshipFiles, setCitizenshipFiles] = useState<File[]>([]);
  const [chequeFile, setChequeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [isVerificationComplete, setIsVerificationComplete] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showVerification && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, showVerification]);

  useEffect(() => {
    if (!show) {
      console.log("Modal closed, resetting form");
      setFormData({
        businessName: "",
        email: "",
        password: "",
        phoneNumber: "",
        district: "",
        taxNumber: "",
        taxDocuments: [],
        businessRegNumber: "",
        citizenshipDocuments: null,
        chequePhoto: "",
        bankDetails: {
          accountName: "",
          bankName: "",
          accountNumber: "",
          bankBranch: "",
          bankCode: "",
        },
        profilePicture: "",
      });
      setTaxFiles([]);
      setCitizenshipFiles([]);
      setChequeFile(null);
      setShowVerification(false);
      setVerificationToken("");
      setIsVerificationComplete(false);
      setCountdown(0);
    }
  }, [show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    if (name in formData.bankDetails) {
      setFormData((prev) => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [name]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        toast.warn("Please enter a valid email address");
      }
      if (name === "phoneNumber" && value && !/^\+?[\d\s-]{10,}$/.test(value)) {
        toast.warn("Please enter a valid phone number (e.g., +9779812345678)");
      }
      if (name === "taxNumber" && value && value.length !== 9) {
        toast.warn("Tax number must be exactly 9 characters");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const files = Array.from(e.target.files || []);
    console.log(`File input changed for ${field}:`, files.map((f) => f.name));
    if (files.length > 0) {
      if (field === "taxDocuments") setTaxFiles((prev) => [...prev, ...files]);
      if (field === "citizenshipDocuments") setCitizenshipFiles((prev) => [...prev, ...files]);
      if (field === "chequePhoto") setChequeFile(files[0]);
    }
  };

  const handleRemoveFile = (index: number, field: string) => {
    console.log(`Removing file from ${field} at index ${index}`);
    if (field === "taxDocuments") setTaxFiles((prev) => prev.filter((_, i) => i !== index));
    if (field === "citizenshipDocuments") setCitizenshipFiles((prev) => prev.filter((_, i) => i !== index));
    if (field === "chequePhoto") setChequeFile(null);
  };

  const uploadFile = async (file: File, token: string): Promise<string> => {
    console.log(`Uploading file: ${file.name}`);
    const formData = new FormData();
    formData.append("file", file);
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
      console.log(`File uploaded successfully: ${file.name} -> ${response.data.data}`);
      return response.data.data;
    } catch (error: any) {
      console.error(`Failed to upload file ${file.name}:`, error.response?.data || error.message);
      throw new Error(`Failed to upload file ${file.name}: ${error.response?.data?.message || error.message}`);
    }
  };

  const validateForm = () => {
    console.log("Validating form data:", formData);
    const errors: string[] = [];
    const requiredFields = [
      { field: formData.businessName, name: "Business name" },
      { field: formData.email, name: "Email" },
      { field: formData.password, name: "Password" },
      { field: formData.phoneNumber, name: "Phone number" },
      { field: formData.taxNumber, name: "Tax number" },
      { field: formData.businessRegNumber, name: "Business registration number" },
      { field: formData.bankDetails.accountName, name: "Account name" },
      { field: formData.bankDetails.bankName, name: "Bank name" },
      { field: formData.bankDetails.accountNumber, name: "Account number" },
      { field: formData.bankDetails.bankBranch, name: "Bank branch" },
      { field: formData.bankDetails.bankCode, name: "Bank code" },
    ];

    for (const { field, name } of requiredFields) {
      if (!field?.trim()) {
        errors.push(`${name} is required`);
      }
    }

    if (formData.password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    if (!/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber)) {
      errors.push("Please enter a valid phone number (e.g., +9779812345678)");
    }

    if (formData.taxNumber.length !== 9) {
      errors.push("Tax number must be 9 characters");
    }

    if (taxFiles.length === 0 && formData.taxDocuments.length === 0) {
      errors.push("At least one tax document is required");
    }

    if (!chequeFile && !formData.chequePhoto) {
      errors.push("Cheque photo is required");
    }

    if (!formData.district || !districts.find((d) => d.name.toLowerCase() === formData.district.toLowerCase())) {
      errors.push("Please select a valid district from the list");
    }

    taxFiles.forEach((doc, index) => {
      if (!/\.(jpg|jpeg|png|pdf)$/i.test(doc.name)) {
        errors.push(`Tax document ${index + 1} must be an image (JPG, JPEG, PNG) or PDF`);
      }
      if (doc.size > 5 * 1024 * 1024) {
        errors.push(`Tax document ${index + 1} exceeds 5MB`);
      }
    });

    citizenshipFiles.forEach((doc, index) => {
      if (!/\.(jpg|jpeg|png|pdf)$/i.test(doc.name)) {
        errors.push(`Citizenship document ${index + 1} must be an image (JPG, JPEG, PNG) or PDF`);
      }
      if (doc.size > 5 * 1024 * 1024) {
        errors.push(`Citizenship document ${index + 1} exceeds 5MB`);
      }
    });

    if (chequeFile) {
      if (!/\.(jpg|jpeg|png)$/i.test(chequeFile.name)) {
        errors.push("Cheque photo must be an image (JPG, JPEG, PNG)");
      }
      if (chequeFile.size > 5 * 1024 * 1024) {
        errors.push("Cheque photo exceeds 5MB");
      }
    }

    if (errors.length > 0) {
      console.log("Validation errors:", errors);
      errors.forEach((err) => toast.error(err));
      return false;
    }

    console.log("Form validation passed");
    return true;
  };

  const handleSendVerification = async (email: string) => {
    console.log("handleSendVerification called with email:", email);
    try {
      setLoading(true);
      const response = await axios.post<VerificationResponse>(
        `${API_BASE_URL}/api/auth/verify/resend`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Verification email sent response:", response.data);
      toast.success(response.data.message || "Verification code sent successfully!");
      setShowVerification(true);
      setCountdown(120);
    } catch (err: any) {
      console.error("Error in handleSendVerification:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to send verification code";
      toast.error(errorMessage);
      if (err.response?.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else if (err.response?.status === 400) {
        toast.error("Invalid email. Please check and try again.");
      } else if (err.response?.status === 404) {
        toast.error("User not found. Please register again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (verificationToken.length !== 6 || !/^\d{6}$/.test(verificationToken)) {
      console.log("Invalid OTP input:", verificationToken);
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }
    console.log("handleVerifyOtp called with email:", formData.email, "and token:", verificationToken);
    try {
      setLoading(true);
      const response = await axios.post<VerificationResponse>(
        `${API_BASE_URL}/api/auth/verify`,
        { email: formData.email, token: verificationToken },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("OTP verification response:", response.data);
      toast.success(response.data.message || "Email verified successfully!");
      setShowVerification(false);
      setIsVerificationComplete(true);
      setVerificationToken("");
      setCountdown(0);
    } catch (err: any) {
      console.error("Error in handleVerifyOtp:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Verification failed";
      toast.error(errorMessage);
      if (errorMessage.toLowerCase().includes("token") && errorMessage.toLowerCase().includes("invalid")) {
        toast.error("Invalid verification code. Please try again.");
      } else if (errorMessage.toLowerCase().includes("token") && errorMessage.toLowerCase().includes("expired")) {
        toast.error("Verification code expired. Please request a new one.");
      } else if (err.response?.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else if (err.response?.status === 400) {
        toast.error("Invalid verification attempt. Please check the code and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    console.log("handleResendOtp called with email:", formData.email);
    try {
      setLoading(true);
      setVerificationToken("");
      const response = await axios.post<VerificationResponse>(
        `${API_BASE_URL}/api/auth/verify/resend`,
        { email: formData.email },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Resend OTP response:", response.data);
      toast.success(response.data.message || "Verification code resent successfully!");
      setCountdown(120);
    } catch (err: any) {
      console.error("Error in handleResendOtp:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to resend verification code";
      toast.error(errorMessage);
      if (err.response?.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else if (err.response?.status === 404) {
        toast.error("User not found. Please register again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called with formData:", formData);
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setLoading(true);
    const updatedFormData: VendorSignupRequest = { ...formData };

    try {
      const district = districts.find((d) => d.name.toLowerCase() === formData.district.toLowerCase());
      if (!district) {
        console.log("Invalid district selected:", formData.district);
        toast.error("Selected district is invalid.");
        setLoading(false);
        return;
      }
      updatedFormData.district = district.name;

      // Upload files
      if (taxFiles.length > 0) {
        try {
          console.log("Uploading tax documents:", taxFiles.map((f) => f.name));
          updatedFormData.taxDocuments = await Promise.all(
            taxFiles.map(async (file) => await uploadFile(file, token))
          );
          console.log("Tax documents uploaded:", updatedFormData.taxDocuments);
        } catch (error: any) {
          console.error("Error uploading tax documents:", error.message);
          toast.error(`Failed to upload tax documents: ${error.message}`);
          setLoading(false);
          return;
        }
      }

      if (chequeFile) {
        try {
          console.log("Uploading cheque photo:", chequeFile.name);
          updatedFormData.chequePhoto = await uploadFile(chequeFile, token);
          console.log("Cheque photo uploaded:", updatedFormData.chequePhoto);
        } catch (error: any) {
          console.error("Error uploading cheque photo:", error.message);
          toast.error(`Failed to upload cheque photo: ${error.message}`);
          setLoading(false);
          return;
        }
      } else if (formData.chequePhoto) {
        updatedFormData.chequePhoto = formData.chequePhoto;
      } else {
        console.log("No cheque photo provided");
        toast.error("Cheque photo is required");
        setLoading(false);
        return;
      }

      if (citizenshipFiles.length > 0) {
        try {
          console.log("Uploading citizenship documents:", citizenshipFiles.map((f) => f.name));
          updatedFormData.citizenshipDocuments = await Promise.all(
            citizenshipFiles.map(async (file) => await uploadFile(file, token))
          );
          console.log("Citizenship documents uploaded:", updatedFormData.citizenshipDocuments);
        } catch (error: any) {
          console.error("Error uploading citizenship documents:", error.message);
          toast.error(`Failed to upload citizenship documents: ${error.message}`);
          setLoading(false);
          return;
        }
      }


      console.log("Calling vendor registration API with updatedFormData:", updatedFormData);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/vendors/request/register`, 
        updatedFormData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Vendor registration API response:", response.data);
      toast.success("Vendor registered successfully! Please verify your email.");
      
      console.log("Setting up email verification for:", formData.email);
      setShowVerification(true);
      setCountdown(120);
      
   

    } catch (err: any) {
      console.error("Error in handleSubmit:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.map((e: any) => e.message).join("; ") ||
        err.message ||
        "Failed to add vendor";
      

      toast.error(errorMessage);
      

      if (err.response?.status === 500) {
        toast.error("Server error occurred. Please try again later.");
      } else if (err.response?.status === 400) {
        toast.error("Invalid data provided. Please check your information.");
      } else if (err.response?.status === 409) {
        toast.error("Vendor with this email already exists.");
      }
      
    } finally {
      setLoading(false);
    }
  };

  if (!show) {
    console.log("Modal not shown, returning null");
    return null;
  }

  if (districts.length === 0) {
    console.log("No districts available");
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Error</h2>
            <button className="close-btn" onClick={onClose} aria-label="Close modal">
              ×
            </button>
          </div>
          <div className="vendor-details">
            <p>No districts available. Please contact support.</p>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log("Rendering modal, showVerification:", showVerification, "isVerificationComplete:", isVerificationComplete);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isVerificationComplete
              ? "Account Verification Complete"
              : showVerification
              ? "Verify Vendor Email"
              : "Add New Vendor"}
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="vendor-details">
          {isVerificationComplete ? (
            <div className="auth-modal__verification-complete">
              <div className="auth-modal__success-message">
                <h3>Email Verified Successfully!</h3>
                <p>Your vendor account has been registered and verified. An admin needs to approve your account.</p>
                <p>
                  <strong>You will receive an email notification after your account gets approved.</strong>
                </p>
                <p>This process may take 24-48 hours. Thank you for your patience!</p>
              </div>
              <button
                type="button"
                className="auth-modal__submit"
                onClick={() => {
                  console.log("Closing modal and redirecting to /admin-vendors");
                  onClose();
                  window.location.href = "/admin-vendors";
                }}
              >
                Close
              </button>
            </div>
          ) : showVerification ? (
            <form
              className="auth-modal__form"
              onSubmit={(e) => {
                e.preventDefault();
                console.log("Verification form submitted");
                handleVerifyOtp();
              }}
            >
              <div className="auth-modal__verification-info">
                <p>We've sent a verification code to</p>
                <strong>{formData.email}</strong>
                <p>Please enter the 6-digit code below:</p>
              </div>
              
              <div className="auth-modal__form-group">
                <input
                  type="text"
                  className="auth-modal__input auth-modal__input--verification"
                  placeholder="______"
                  value={verificationToken}
                  onChange={(e) => {
                    console.log("OTP input changed:", e.target.value);
                    setVerificationToken(e.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                  required
                  disabled={loading}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="\d{6}"
                />
              </div>
              
              <button
                type="submit"
                className="auth-modal__submit"
                disabled={loading || verificationToken.length !== 6 || !/^\d{6}$/.test(verificationToken)}
              >
                {loading ? "Verifying..." : "VERIFY EMAIL"}
              </button>
              
              <div className="auth-modal__verification-actions">
                <button
                  type="button"
                  className="auth-modal__link-button"
                  onClick={handleResendOtp}
                  disabled={loading || countdown > 0}
                >
                  Resend Verification Code
                  {countdown > 0 && (
                    <span className="auth-modal__countdown">
                      {" "}
                      ({Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")})
                    </span>
                  )}
                </button>
              </div>
            </form>
          ) : (
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
                      aria-label="Business Name"
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
                      aria-label="Email"
                    />
                  </label>
                </div>
                <div className="detail-item">
                  <label>
                    <strong>Password</strong>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="form-input"
                      aria-label="Password"
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
                      placeholder="+9779812345678"
                      className="form-input"
                      aria-label="Phone Number"
                    />
                  </label>
                </div>
                <div className="detail-item">
                  <label>
                    <strong>District</strong>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                      className="form-input"
                      aria-label="District"
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
                    <strong>Tax Number</strong>
                    <input
                      type="text"
                      name="taxNumber"
                      value={formData.taxNumber}
                      onChange={handleChange}
                      required
                      minLength={9}
                      maxLength={9}
                      className="form-input"
                      aria-label="Tax Number"
                    />
                  </label>
                </div>
                <div className="detail-item">
                  <label>
                    <strong>Business Registration Number</strong>
                    <input
                      type="text"
                      name="businessRegNumber"
                      value={formData.businessRegNumber}
                      onChange={handleChange}
                      required
                      className="form-input"
                      aria-label="Business Registration Number"
                    />
                  </label>
                </div>
                <div className="detail-item">
                  <label>
                    <strong>Account Name</strong>
                    <input
                      type="text"
                      name="accountName"
                      value={formData.bankDetails.accountName}
                      onChange={handleChange}
                      required
                      className="form-input"
                      aria-label="Account Name"
                    />
                  </label>
                </div>
                <div className="detail-item">
                  <label>
                    <strong>Bank Name</strong>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankDetails.bankName}
                      onChange={handleChange}
                      required
                      className="form-input"
                      aria-label="Bank Name"
                    />
                  </label>
                </div>
                <div className="detail-item">
                  <label>
                    <strong>Account Number</strong>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.bankDetails.accountNumber}
                      onChange={handleChange}
                      required
                      className="form-input"
                      aria-label="Account Number"
                    />
                  </label>
                </div>
                <div className="detail-item">
                  <label>
                    <strong>Bank Branch</strong>
                    <input
                      type="text"
                      name="bankBranch"
                      value={formData.bankDetails.bankBranch}
                      onChange={handleChange}
                      required
                      className="form-input"
                      aria-label="Bank Branch"
                    />
                  </label>
                </div>
                <div className="detail-item">
                  <label>
                    <strong>Bank Code</strong>
                    <input
                      type="text"
                      name="bankCode"
                      value={formData.bankDetails.bankCode}
                      onChange={handleChange}
                      required
                      className="form-input"
                      aria-label="Bank Code"
                    />
                  </label>
                </div>
              </div>

              <div className="document-section">
                <h3>Tax Documents</h3>
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
                      required
                      aria-label="Upload Tax Documents"
                    />
                    <div className="file-list">
                      {taxFiles.map((file, index) => (
                        <div key={index} className="file-item">
                          <span className="file-name">{file.name}</span>
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => handleRemoveFile(index, "taxDocuments")}
                            aria-label={`Remove ${file.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="document-section">
                <h3>Citizenship Documents (Optional)</h3>
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
                      aria-label="Upload Citizenship Documents"
                    />
                    <div className="file-list">
                      {citizenshipFiles.map((file, index) => (
                        <div key={index} className="file-item">
                          <span className="file-name">{file.name}</span>
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => handleRemoveFile(index, "citizenshipDocuments")}
                            aria-label={`Remove ${file.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
<div className="document-section">
  <h3 className="cheque-header">
    Cheque Photo
   
    {chequeFile && <span className="file-name">{chequeFile.name}</span>}
  </h3>
  <div
    className="document-container cheque-container"
    onClick={() => document.getElementById("chequePhoto")?.click()}
    style={{ cursor: 'pointer' }}
  >
    <div className="document-item file-upload">
      <input
        type="file"
        id="chequePhoto"
        accept="image/*"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            setChequeFile(files[0]); // Update chequeFile state with the first file
          }
        }}
        required
        aria-label="Upload Cheque Photo"
        style={{ display: "none" }}
      />
    </div>
  </div>
</div>
              <div className="modal-actions">
                <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? "Creating..." : "Create Vendor"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddVendorModal;