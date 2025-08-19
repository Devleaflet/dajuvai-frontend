import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useVendorAuth } from "../context/VendorAuthContext";
import VendorService from "../services/vendorService";
import { API_BASE_URL } from "../config";
import "../Styles/AuthModal.css";
import popup from "../assets/auth.jpg";
import close from "../assets/close.png";
import { Toaster, toast } from "react-hot-toast";

interface VendorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceSignupMode?: boolean;
  forceLoginMode?: boolean;
}

interface SignupResponse {
  message: string;
  userId: number;
  username: string;
  token?: string;
}

interface VerificationResponse {
  message: string;
}

interface District {
  id: number;
  name: string;
}

interface ImageUploadResponse {
  msg: string;
  success: boolean;
  data: string;
  publicId?: string;
}

const VendorAuthModal: React.FC<VendorAuthModalProps> = ({
  isOpen,
  onClose,
  forceSignupMode = false,
  forceLoginMode = false,
}) => {
  const { login: vendorLogin } = useVendorAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [taxNumber, setTaxNumber] = useState<string>("");
  const [taxDocument, setTaxDocument] = useState<File | null>(null);

  const [taxDocumentPreview, setTaxDocumentPreview] = useState<string>("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(
    forceLoginMode ? true : forceSignupMode ? false : false
  );
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [isStepValid, setIsStepValid] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoginMode && !showVerification) {
      const validateCurrentStep = () => {
        if (currentStep === 1) {
          return businessName.trim().length >= 3 && taxNumber.trim().length >= 9 && taxDocument !== null;
        }
        return true;
      };
      setIsStepValid(validateCurrentStep());
    }
  }, [businessName, taxNumber, taxDocument, currentStep, isLoginMode, showVerification]);

  useEffect(() => {
    if (forceLoginMode) {
      setIsLoginMode(true);
    } else if (forceSignupMode) {
      setIsLoginMode(false);
    }
  }, [forceLoginMode, forceSignupMode]);

  useEffect(() => {
    if (!isLoginMode && isOpen && !showVerification) {
      const fetchDistricts = async () => {
        try {
          setIsLoading(true);
          const response = await axios.get(`${API_BASE_URL}/api/district`, {
            headers: { "Content-Type": "application/json", Accept: "application/json" },
          });
          const districtData = response.data?.success && Array.isArray(response.data.data) ? response.data.data : [];
          setDistricts(districtData);
        } catch (err) {
          console.error("Failed to fetch districts:", err);
          setError("Failed to load districts. Please try again.");
          toast.error("Failed to load districts. Please try again.");
          setDistricts([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDistricts();
    }
  }, [isLoginMode, isOpen, showVerification]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("auth-modal--open");
    } else {
      document.body.classList.remove("auth-modal--open");
    }

    const handleClickOutside = (event: MouseEvent): void => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

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
    setError("");
    setSuccess("");
  }, [isLoginMode]);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setBusinessName("");
      setPhoneNumber("");
      setDistrict("");
      setTaxNumber("");
      setTaxDocument(null);
      setTaxDocumentPreview("");
      setDistricts([]);
      setError("");
      setSuccess("");
      setShowVerification(false);
      setVerificationToken("");
      setPendingVerificationEmail("");
      setCountdown(0);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setCurrentStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (taxDocumentPreview) {
        URL.revokeObjectURL(taxDocumentPreview);
      }
    };
  }, [taxDocumentPreview]);

  const validateSignup = (): boolean => {
    const errors: string[] = [];
    if (!businessName.trim()) errors.push("Business name is required");
    if (businessName.length < 3) errors.push("Business name must be at least 3 characters");
    if (!email.trim()) errors.push("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Please enter a valid email");
    if (email.length > 255) errors.push("Email is too long");
    if (!phoneNumber.trim()) errors.push("Phone number is required");
    if (!/^\+?[\d\s-]{10,}$/.test(phoneNumber)) errors.push("Please enter a valid phone number");
    if (!district.trim()) errors.push("District is required");
    if (!taxNumber.trim()) errors.push("Pan/Vat number is required");
    if (taxNumber.length < 9) errors.push("Pan/Vat number must be at least 9 characters");
    if (!taxDocument) errors.push("Pan/Vat document is required");
    if (!password.trim()) errors.push("Password is required");
    if (password.length < 8) errors.push("Password must be at least 8 characters");
    if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
    if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
    if (!/[^a-zA-Z0-9]/.test(password)) errors.push("Password must contain at least one special character");
    if (password.length > 128) errors.push("Password is too long");
    if (!confirmPassword.trim()) errors.push("Please confirm your password");
    if (password !== confirmPassword) errors.push("Passwords do not match");

    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
      setError(errors[0]);
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setTaxDocument(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setTaxDocumentPreview(previewUrl);
    } else {
      setTaxDocumentPreview("");
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post<ImageUploadResponse>(
        `${API_BASE_URL}/api/image?folder=vendor`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.msg || "Failed to upload Pan/Vat document");
      }
    } catch (err) {
      console.error("File upload error:", err);
      setError("Failed to upload Pan/Vat document. Please try again.");
      toast.error("Failed to upload Pan/Vat document. Please try again.");
      return null;
    }
  };

  const handleSignup = async (userData: {
    businessName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    district: string;
    taxNumber: string;
    taxDocumentUrl: string;
  }) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await axios.post<SignupResponse>(
        `${API_BASE_URL}/api/vendors/request/register`,
        userData,
        { headers: { "Content-Type": "application/json" } }
      );

      setSuccess(response.data.message);
      console.log("Vendor signup successful:", response.data);

      setPendingVerificationEmail(userData.email);
      setShowVerification(true);
      setCountdown(120);
      setPassword("");
      setConfirmPassword("");
      setBusinessName("");
      setPhoneNumber("");
      setDistrict("");
      setTaxNumber("");
      setTaxDocument(null);
      setTaxDocumentPreview("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Signup error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
        });
        if (err.response?.status === 400 && err.response?.data?.errors) {
          const errorMessages = Object.entries(err.response.data.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join("\n");
          setError(`Validation errors:\n${errorMessages}`);
        } else if (err.response?.status === 400 && err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.response?.status === 409) {
          setError(err.response.data.message || "Email or business name already in use");
        } else {
          setError(`Signup failed (${err.response?.status || "unknown error"}). Please try again.`);
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setIsLoading(true);
      setError("");
      console.log("Sending verification request:", { email: pendingVerificationEmail, token: verificationToken });

      const response = await axios.post<VerificationResponse>(
        `${API_BASE_URL}/api/auth/verify`,
        { email: pendingVerificationEmail, token: verificationToken },
        { headers: { "Content-Type": "application/json", Accept: "application/json" } }
      );

      console.log("Verification response:", response.data);
      setSuccess(response.data.message);

      setTimeout(() => {
        setShowVerification(false);
        setVerificationToken("");
        setPendingVerificationEmail("");
        setIsLoginMode(true);
        setSuccess("");
        setCountdown(0);
        navigate("/dashboard");
        onClose();
      }, 3000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Verification error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
        });
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Verification failed";
        if (errorMessage.toLowerCase().includes("token") && errorMessage.toLowerCase().includes("invalid")) {
          setError("The verification code is invalid. Please check the code or request a new one.");
          toast.error("The verification code is invalid. Please check the code or request a new one.");
        } else if (errorMessage.toLowerCase().includes("token") && errorMessage.toLowerCase().includes("expired")) {
          setError("The verification code has expired. Please request a new code.");
          toast.error("The verification code has expired. Please request a new code.");
        } else {
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        setError("An unexpected error occurred during verification");
        toast.error("An unexpected error occurred during verification");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      setError("");
      setVerificationToken("");
      console.log("Sending resend verification request for:", pendingVerificationEmail);

      const response = await axios.post<VerificationResponse>(
        `${API_BASE_URL}/api/auth/verify/resend`,
        { email: pendingVerificationEmail },
        { headers: { "Content-Type": "application/json", Accept: "application/json" } }
      );

      console.log("Resend verification response:", response.data);
      setSuccess(response.data.message);
      toast.success("Verification code resent successfully");
      setCountdown(120);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Resend verification error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
        });
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to resend verification code";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError("An unexpected error occurred while resending the verification code");
        toast.error("An unexpected error occurred while resending the verification code");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (userData: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const vendorService = VendorService.getInstance();
      const response = await vendorService.login(userData);

      if (response.success && response.token && response.vendor) {
        console.log("Vendor login successful:", response);
        vendorLogin(response.token, response.vendor);
        navigate("/dashboard");
        onClose();
      } else if (response.message === "Vendor not approved") {
        toast.error("Your account is pending approval. Please wait for admin approval.");
        setError("Your account is pending approval. Please wait for admin approval.");
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401 && err.response?.data?.message === "Email not verified") {
          setPendingVerificationEmail(userData.email);
          setShowVerification(true);
          setCountdown(120);
          setError("Please verify your email first. We've sent you a verification code.");
        } else if (err.response?.status === 403 && err.response?.data?.message === "Vendor not approved") {
          toast.error("Your account is pending approval. Please wait for admin approval.");
          setError("Your account is pending approval. Please wait for admin approval.");
        } else {
          const errorMessage = err.response?.data?.message || err.response?.data?.error || "Login failed";
          setError(errorMessage);
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (showVerification) {
      if (verificationToken.length !== 6 || !/^\d{6}$/.test(verificationToken)) {
        setError("Please enter a valid 6-digit verification code");
        toast.error("Please enter a valid 6-digit verification code");
        return;
      }
      await handleVerifyEmail();
      return;
    }

    if (isLoginMode) {
      if (!email.trim()) {
        setError("Email is required");
        return;
      }
      if (!password.trim()) {
        setError("Password is required");
        return;
      }
      await handleLogin({ email: email.trim(), password });
    } else {
      if (currentStep < 3) {
        handleNext();
        return;
      }
      if (!validateSignup()) return;

      if (taxDocument) {
        const uploadedUrl = await handleFileUpload(taxDocument);
        if (!uploadedUrl) return;
        await handleSignup({
          businessName: businessName.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          phoneNumber,
          district,
          taxNumber: taxNumber.trim(),
          taxDocumentUrl: uploadedUrl,
        });
      }
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  if (!isOpen) return null;

  return (
    <div className={`auth-modal${isOpen ? " auth-modal--open" : ""}`}>
      <Toaster position="top-center" />
      <div className="auth-modal__overlay"></div>
      <div className="auth-modal__content" ref={modalRef}>
        <button className="auth-modal__close" onClick={onClose}>
          <img src={close} alt="Close" />
        </button>

        <div className="auth-modal__header">
          <img src={popup} alt="Scrolling background" className="auth-modal__background" />
        </div>

        <div className="auth-modal__title">
          {showVerification ? "Verify Your Email" : isLoginMode ? "Vendor Login" : "Vendor Sign Up"}
        </div>

        {!showVerification && !forceSignupMode && !forceLoginMode && (
          <div className="auth-modal__tabs">
            <button
              className={`auth-modal__tab ${isLoginMode ? "auth-modal__tab--active" : ""}`}
              onClick={() => setIsLoginMode(true)}
            >
              LOG IN
            </button>
            <button
              className={`auth-modal__tab ${!isLoginMode ? "auth-modal__tab--active" : ""}`}
              onClick={() => setIsLoginMode(false)}
            >
              SIGN UP
            </button>
          </div>
        )}

        {error && <div className="auth-modal__message auth-modal__message--error">{error}</div>}
        {success && <div className="auth-modal__message auth-modal__message--success">{success}</div>}

        {!isLoginMode && !showVerification && (
          <div className="auth-modal__step-indicator">
            Step {currentStep} of 3
          </div>
        )}

        <form className="auth-modal__form" onSubmit={handleSubmit}>
          {showVerification ? (
            <>
              <div className="auth-modal__verification-info">
                <p>We've sent a verification code to</p>
                <strong>{pendingVerificationEmail}</strong>
                <p>Please enter the 6-digit code below:</p>
              </div>
              <div className="auth-modal__form-group">
                <input
                  type="text"
                  className="auth-modal__input auth-modal__input--verification"
                  placeholder="______"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="\d{6}"
                />
              </div>
              <button
                type="submit"
                className="auth-modal__submit"
                disabled={isLoading || verificationToken.length !== 6 || !/^\d{6}$/.test(verificationToken)}
              >
                {isLoading ? "Verifying..." : "VERIFY EMAIL"}
              </button>
              <div className="auth-modal__verification-actions">
                <button
                  type="button"
                  className="auth-modal__link-button"
                  onClick={handleResendVerification}
                  disabled={isLoading || countdown > 0}
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
            </>
          ) : (
            <>
              {isLoginMode ? (
                <>
                  <div className="auth-modal__form-group">
                    <label className="auth-modal__label">Email</label>
                    <input
                      type="email"
                      className="auth-modal__input"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="auth-modal__form-group" style={{ marginBottom: "20px", position: "relative" , paddingBottom: "20px" }}>
  <label className="auth-modal__label">Password</label>
  <input
    type={showPassword ? "text" : "password"}
    className="auth-modal__input"
    placeholder="Enter your password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    disabled={isLoading}
    style={{ paddingRight: "40px" }}
  />
  <button
    type="button"
    onClick={togglePasswordVisibility}
    style={{
      position: "absolute",
      right: "10px",
      top: "55%", // Adjusted from 50% to 55% to move it down slightly
      transform: "translateY(-55%)", // Adjusted to match the new top value
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "0",
      fontSize: "16px",
    }}
    aria-label={showPassword ? "Hide password" : "Show password"}
  >
    {showPassword ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="12" rx="10" ry="7"/>
        <circle cx="12" cy="12" r="3.5"/>
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 1l22 22"/>
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33"/>
        <path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33"/>
      </svg>
    )}
  </button>
</div>
                  <button type="submit" className="auth-modal__submit" disabled={isLoading}>
                    {isLoading ? "Loading..." : "LOG IN"}
                  </button>
                </>
              ) : (
                <>
                  {currentStep === 1 && (
                    <>
                      <div className="auth-modal__form-group">
                        <label className="auth-modal__label">Business Name</label>
                        <input
                          type="text"
                          className="auth-modal__input"
                          placeholder="Enter business name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="auth-modal__form-group">
                        <label className="auth-modal__label">Vat/Pan Number</label>
                        <input
                          type="text"
                          className="auth-modal__input"
                          placeholder="Enter pan/vat number"
                          value={taxNumber}
                          onChange={(e) => setTaxNumber(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="auth-modal__form-group">
                        <label className="auth-modal__label">Please attach your business PAN/VAT registration document below</label>
                        <div className="auth-modal__file-upload">
                          <label htmlFor="taxDocument" className="auth-modal__file-label">
                            Choose File
                          </label>
                          <input
                            id="taxDocument"
                            type="file"
                            className="auth-modal__file-input"
                            accept="image/*"
                            onChange={handleFileChange}
                            required
                            disabled={isLoading}
                          />
                          {taxDocument && <span className="auth-modal__file-name">{taxDocument.name}</span>}
                          {taxDocumentPreview && (
                            <img
                              src={taxDocumentPreview}
                              alt="Tax Document Preview"
                              className="auth-modal__file-preview"
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <div className="auth-modal__form-group">
                        <label className="auth-modal__label">Email</label>
                        <input
                          type="email"
                          className="auth-modal__input"
                          placeholder="Enter email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="auth-modal__form-group">
                        <label className="auth-modal__label">Phone Number</label>
                        <input
                          type="text"
                          className="auth-modal__input"
                          placeholder="Enter phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="auth-modal__form-group">
                        <label className="auth-modal__label">District</label>
                        <select
                          className="auth-modal__input"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          required
                          disabled={isLoading || districts.length === 0}
                        >
                          <option value="" disabled>
                            Select a district
                          </option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
               {currentStep === 3 && (
  <>
    <div className="auth-modal__form-group" style={{ position: "relative" }}>
      <label className="auth-modal__label">Password</label>
      <input
        type={showPassword ? "text" : "password"}
        className="auth-modal__input" style={{ marginBottom: "20px"}}
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
       
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        style={{
          position: "absolute",
          right: "10px",
          top: "55%", // Adjusted from 50% to 55% to move it down slightly
          transform: "translateY(-55%)", // Adjusted to match the new top value
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0",
          fontSize: "16px",
        }}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="12" rx="10" ry="7"/>
            <circle cx="12" cy="12" r="3.5"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l22 22"/>
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33"/>
            <path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33"/>
          </svg>
        )}
      </button>
    </div>
    <div className="auth-modal__form-group" style={{ position: "relative", marginTop: "15px"  ,  paddingBottom: "15px"}}>
      <label className="auth-modal__label">Confirm Password</label>
      <input
        type={showConfirmPassword ? "text" : "password"}
        className="auth-modal__input"  style={{ marginBottom: "10px"}}
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={isLoading}
  
      />
      <button
        type="button"
        onClick={toggleConfirmPasswordVisibility}
        style={{
          position: "absolute",
          right: "10px",
          top: "55%", // Adjusted from 50% to 55% to move it down slightly
          transform: "translateY(-55%)", // Adjusted to match the new top value
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0",
          fontSize: "16px",
        }}
        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
      >
        {showConfirmPassword ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="12" rx="10" ry="7"/>
            <circle cx="12" cy="12" r="3.5"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l22 22"/>
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33"/>
            <path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33"/>
          </svg>
        )}
      </button>
    </div>
  </>
)}
                  <div className="auth-modal__step-buttons">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        className="auth-modal__back-button-improved"
                        onClick={handleBack}
                        disabled={isLoading}
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      className="auth-modal__submit"
                      onClick={handleNext}
                      disabled={isLoading || !isStepValid}
                    >
                      {isLoading ? "Loading..." : "Next"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </form>

        {!showVerification && (
          <div className="auth-modal__footer">
            <p className="auth-modal__footer-text">
              {!forceSignupMode && !forceLoginMode && (
                <button
                  type="button"
                  className="auth-modal__link-button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                >
                  {isLoginMode ? "Sign up" : "Log in"}
                </button>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorAuthModal;