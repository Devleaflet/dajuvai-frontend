import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useVendorAuth } from "../context/VendorAuthContext";
import VendorService from "../services/vendorService";
import { API_BASE_URL } from "../config";
import "../Styles/AuthModal.css";
import close from "../assets/close.png";
import { Toaster, toast } from "react-hot-toast";
import popup from "../assets/auth.jpg";

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

  // Form states
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [businessRegNumber, setBusinessRegNumber] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [taxNumber, setTaxNumber] = useState<string>("");
  const [taxDocuments, setTaxDocuments] = useState<File[]>([]);
  const [citizenshipDocuments, setCitizenshipDocuments] = useState<File[]>([]);
  const [accountName, setAccountName] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [bankBranch, setBankBranch] = useState<string>("");
  const [bankCode, setBankCode] = useState<string>("");
  const [blankChequePhoto, setBlankChequePhoto] = useState<File | null>(null);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [acceptListingFee, setAcceptListingFee] = useState<boolean>(false);

  // UI states
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(
    forceLoginMode ? true : forceSignupMode ? false : false
  );
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Verification states
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Final success state
  const [isVerificationComplete, setIsVerificationComplete] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const [isStepValid, setIsStepValid] = useState<boolean>(false);

  // Validate current step
  useEffect(() => {
    if (!isLoginMode && !showVerification && !isVerificationComplete) {
      const validateCurrentStep = () => {
        if (currentStep === 1) {
          return (
            businessName.trim().length >= 3 &&
            phoneNumber.trim().length >= 10 &&
            businessRegNumber.trim().length > 0 &&
            district.trim().length > 0 &&
            acceptTerms &&
            acceptListingFee
          );
        } else if (currentStep === 2) {
          return (
            email.trim().length > 0 &&
            password.trim().length >= 8 &&
            confirmPassword.trim().length >= 8 &&
            password === confirmPassword
          );
        } else if (currentStep === 3) {
          return taxNumber.trim().length === 9 && taxDocuments.length > 0;
        } else if (currentStep === 4) {
          return (
            accountName.trim().length > 0 &&
            bankName.trim().length > 0 &&
            accountNumber.trim().length > 0 &&
            bankBranch.trim().length > 0 &&
            blankChequePhoto !== null
          );
        }
        return true;
      };
      setIsStepValid(validateCurrentStep());
    }
  }, [
    businessName,
    phoneNumber,
    businessRegNumber,
    district,
    acceptTerms,
    acceptListingFee,
    email,
    password,
    confirmPassword,
    taxNumber,
    taxDocuments,
    citizenshipDocuments,
    accountName,
    bankName,
    accountNumber,
    bankBranch,
    blankChequePhoto,
    currentStep,
    isLoginMode,
    showVerification,
    isVerificationComplete,
  ]);

  // Handle force modes
  useEffect(() => {
    if (forceLoginMode) {
      setIsLoginMode(true);
    } else if (forceSignupMode) {
      setIsLoginMode(false);
    }
  }, [forceLoginMode, forceSignupMode]);

  // Fetch districts for signup
  useEffect(() => {
    if (!isLoginMode && isOpen && !showVerification && !isVerificationComplete) {
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
  }, [isLoginMode, isOpen, showVerification, isVerificationComplete]);

  // Handle modal click outside
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

  // Handle countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showVerification && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, showVerification]);

  // Clear error/success messages when switching modes
  useEffect(() => {
    setError("");
    setSuccess("");
  }, [isLoginMode]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setBusinessName("");
      setPhoneNumber("");
      setBusinessRegNumber("");
      setDistrict("");
      setTaxNumber("");
      setTaxDocuments([]);
      setCitizenshipDocuments([]);
      setAccountName("");
      setBankName("");
      setAccountNumber("");
      setBankBranch("");
      setBankCode("");
      setBlankChequePhoto(null);
      setAcceptTerms(false);
      setAcceptListingFee(false);
      setDistricts([]);
      setError("");
      setSuccess("");
      setShowVerification(false);
      setIsVerificationComplete(false);
      setVerificationToken("");
      setPendingVerificationEmail("");
      setCountdown(0);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setCurrentStep(1);
    }
  }, [isOpen]);

  const validateSignup = (): boolean => {
    const errors: string[] = [];

    if (!businessName.trim()) errors.push("Business name is required");
    if (businessName.length < 3) errors.push("Business name must be at least 3 characters");
    if (!businessRegNumber.trim()) errors.push("Business registration number is required");
    if (!email.trim()) errors.push("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Please enter a valid email");
    if (!phoneNumber.trim()) errors.push("Phone number is required");
    if (!/^\+?[\d\s-]{10,}$/.test(phoneNumber)) errors.push("Please enter a valid phone number");
    if (!district.trim()) errors.push("District is required");
    if (!taxNumber.trim()) errors.push("Pan/Vat number is required");
    if (taxNumber.length !== 9) errors.push("Pan/Vat number must be 9 characters");
    if (taxDocuments.length === 0) errors.push("At least one Pan/Vat document is required");
    taxDocuments.forEach((doc, index) => {
      if (!/\.(jpg|jpeg|png|pdf)$/i.test(doc.name)) {
        errors.push(`Pan/Vat document ${index + 1} must be an image (JPG, JPEG, PNG) or PDF`);
      }
    });
    citizenshipDocuments.forEach((doc, index) => {
      if (!/\.(jpg|jpeg|png|pdf)$/i.test(doc.name)) {
        errors.push(`Citizenship document ${index + 1} must be an image (JPG, JPEG, PNG) or PDF`);
      }
    });
    if (!accountName.trim()) errors.push("Account name is required");
    if (!bankName.trim()) errors.push("Bank name is required");
    if (!accountNumber.trim()) errors.push("Account number is required");
    if (!bankBranch.trim()) errors.push("Bank branch is required");
    if (!blankChequePhoto) errors.push("Blank cheque photo is required");
    if (blankChequePhoto && !/\.(jpg|jpeg|png)$/i.test(blankChequePhoto.name)) {
      errors.push("Blank cheque photo must be an image (JPG, JPEG, PNG)");
    }
    if (!password.trim()) errors.push("Password is required");
    if (password.length < 8) errors.push("Password must be at least 8 characters");
    if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
    if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
    if (!/[^a-zA-Z0-9]/.test(password)) errors.push("Password must contain at least one special character");
    if (!confirmPassword.trim()) errors.push("Please confirm your password");
    if (password !== confirmPassword) errors.push("Passwords do not match");
    if (!acceptTerms) errors.push("You must accept the terms and conditions");
    if (!acceptListingFee) errors.push("You must accept the listing fee");

    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
      setError(errors[0]);
      return false;
    }

    return true;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: 'tax' | 'citizenship' | 'cheque'
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (documentType === 'tax') {
      setTaxDocuments((prev) => [...prev, ...files]);
    } else if (documentType === 'citizenship') {
      setCitizenshipDocuments((prev) => [...prev, ...files]);
    } else if (documentType === 'cheque' && files.length > 0) {
      setBlankChequePhoto(files[0]);
    }
  };

  const removeFile = (index: number, documentType: 'tax' | 'citizenship') => {
    if (documentType === 'tax') {
      setTaxDocuments((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCitizenshipDocuments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleFileUpload = async (files: File[]): Promise<string[] | null> => {
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post<ImageUploadResponse>(
          `${API_BASE_URL}/api/image?folder=vendor`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (response.data.success && response.data.data) {
          return response.data.data;
        } else {
          throw new Error(response.data.msg || "Failed to upload document");
        }
      });

      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (err) {
      console.error("File upload failed:", err);
      setError("Failed to upload document(s). Please try again.");
      toast.error("Failed to upload document(s). Please try again.");
      return null;
    }
  };

  const handleSignup = async (userData: {
    businessName: string;
    email: string;
    password: string;
    phoneNumber: string;
    businessRegNumber: string;
    district: string;
    taxNumber: string;
    taxDocuments: string[];
    citizenshipDocuments: string[];
    chequePhoto: string;
    bankDetails: {
      accountName: string;
      bankName: string;
      accountNumber: string;
      bankBranch: string;
      bankCode?: string;
    };
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
      toast.success("Registration successful! Please check your email for verification code.");

      setPendingVerificationEmail(userData.email);
      setShowVerification(true);
      setCountdown(120);

      setPassword("");
      setConfirmPassword("");
      setBusinessName("");
      setPhoneNumber("");
      setBusinessRegNumber("");
      setDistrict("");
      setTaxNumber("");
      setTaxDocuments([]);
      setCitizenshipDocuments([]);
      setAccountName("");
      setBankName("");
      setAccountNumber("");
      setBankBranch("");
      setBankCode("");
      setBlankChequePhoto(null);
      setAcceptTerms(false);
      setAcceptListingFee(false);
      setCurrentStep(1);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400 && err.response?.data?.errors) {
          const errorMessages = Object.entries(err.response.data.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join("\n");
          setError(`Validation errors:\n${errorMessages}`);
          toast.error("Please check your form data");
        } else if (err.response?.status === 400 && err.response?.data?.message) {
          setError(err.response.data.message);
          toast.error(err.response.data.message);
        } else if (err.response?.status === 409) {
          setError(err.response.data.message);
        } else {
          setError(`Signup failed (${err.response?.status || "unknown error"}). Please try again.`);
          toast.error("Signup failed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await axios.post<VerificationResponse>(
        `${API_BASE_URL}/api/auth/verify`,
        { email: pendingVerificationEmail, token: verificationToken },
        { headers: { "Content-Type": "application/json", Accept: "application/json" } }
      );
      console.log(response);
      setShowVerification(false);
      setIsVerificationComplete(true);
      setVerificationToken("");
      setCountdown(0);
      toast.success("Email verified successfully! Waiting for admin approval.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Verification failed";
        if (errorMessage.toLowerCase().includes("token") && errorMessage.toLowerCase().includes("invalid")) {
          setError("The verification code is invalid. Please check the code or request a new one.");
          toast.error("Invalid verification code. Please try again.");
        } else if (errorMessage.toLowerCase().includes("token") && errorMessage.toLowerCase().includes("expired")) {
          setError("The verification code has expired. Please request a new code.");
          toast.error("Verification code expired. Please request a new one.");
        } else {
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        setError("An unexpected error occurred during verification");
        toast.error("Verification failed. Please try again.");
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
      const response = await axios.post<VerificationResponse>(
        `${API_BASE_URL}/api/auth/verify/resend`,
        { email: pendingVerificationEmail },
        { headers: { "Content-Type": "application/json", Accept: "application/json" } }
      );
      setSuccess(response.data.message);
      toast.success("Verification code resent successfully");
      setCountdown(120);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to resend verification code";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError("An unexpected error occurred while resending the verification code");
        toast.error("Failed to resend verification code");
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
        vendorLogin(response.token, response.vendor);
        navigate("/dashboard");
        onClose();
      } else if (response.message === "Vendor not approved") {
        toast.error("Your account is pending approval. Please wait for admin approval.");
        setError("Your account is pending approval. Please wait for admin approval.");
      } else {
        setError(response.message || "Login failed");
        toast.error(response.message || "Login failed");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401 && err.response?.data?.message === "Email not verified") {
          setPendingVerificationEmail(userData.email);
          setShowVerification(true);
          setCountdown(120);
          setError("Please verify your email first. We've sent you a verification code.");
          toast.error("Please verify your email first");
        } else if (err.response?.status === 403 && err.response?.data?.message === "Vendor not approved") {
          toast.error("Your account is pending approval. Please wait for admin approval.");
          setError("Your account is pending approval. Please wait for admin approval.");
        } else {
          const errorMessage = err.response?.data?.message || err.response?.data?.error || "Login failed";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
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
        toast.error("Email is required");
        return;
      }
      if (!password.trim()) {
        setError("Password is required");
        toast.error("Password is required");
        return;
      }
      await handleLogin({ email: email.trim(), password });
      return;
    }

    if (currentStep < 4) {
      if (!isStepValid) {
        toast.error("Please complete all required fields before proceeding.");
        return;
      }
      handleNext();
      return;
    }

    if (!validateSignup()) {
      return;
    }

    if (taxDocuments.length === 0 || !blankChequePhoto) {
      setError("Please upload at least one Pan/Vat document and a blank cheque photo");
      toast.error("Please upload at least one Pan/Vat document and a blank cheque photo");
      return;
    }

    const taxDocumentUrls = await handleFileUpload(taxDocuments);
    const citizenshipDocumentUrls = await handleFileUpload(citizenshipDocuments);
    const chequePhotoUrl = blankChequePhoto ? await handleFileUpload([blankChequePhoto]) : null;

    if (!taxDocumentUrls || (blankChequePhoto && !chequePhotoUrl)) {
      setError("Failed to obtain document URLs. Please try again.");
      toast.error("Failed to obtain document URLs. Please try again.");
      return;
    }

    const userData = {
      businessName: businessName.trim(),
      email: email.trim(),
      password,
      phoneNumber: phoneNumber.trim(),
      businessRegNumber: businessRegNumber.trim(),
      district,
      taxNumber: taxNumber.trim(),
      taxDocuments: taxDocumentUrls,
      citizenshipDocuments: citizenshipDocumentUrls || [],
      chequePhoto: chequePhotoUrl ? chequePhotoUrl[0] : null,
      bankDetails: {
        accountName: accountName.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        bankBranch: bankBranch.trim(),
        bankCode: bankCode.trim() || undefined,
      },
    };

    if (!userData.chequePhoto) {
      setError("Blank cheque photo is required");
      toast.error("Blank cheque photo is required");
      return;
    }

    await handleSignup(userData);
  };

  const handleCloseModal = () => {
    onClose();
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  if (!isOpen) return null;

  return (
    <div className={`auth-modal${isOpen ? " auth-modal--open" : ""}`}>
      <Toaster position="top-center" />
      <div className="auth-modal__overlay"></div>
      <div className="auth-modal__content" ref={modalRef}>
        <button className="auth-modal__close" onClick={handleCloseModal}>
          <img src={close} alt="Close" />
        </button>

        <div className="auth-modal__header">
          <img src={popup} alt="Scrolling background" className="auth-modal__background" />
        </div>

        <div className="auth-modal__title">
          {isVerificationComplete
            ? "Account Verification Complete"
            : showVerification
              ? "Verify Your Email"
              : isLoginMode
                ? "Vendor Login"
                : "Vendor Sign Up"
          }
        </div>

        {!showVerification && !isVerificationComplete && !forceSignupMode && !forceLoginMode && (
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

        {!isLoginMode && !showVerification && !isVerificationComplete && (
          <div className="auth-modal__step-indicator">
            Step {currentStep} of 4
          </div>
        )}

        {isVerificationComplete ? (
          <div className="auth-modal__verification-complete">
            <div className="auth-modal__success-message">
              <h3>Email Verified Successfully!</h3>
              <p>Your account has been verified. An admin needs to approve your account.</p>
              <p><strong>You will receive an email notification after your account gets approved.</strong></p>
              <p>This process may take 24-48 hours. Thank you for your patience!</p>
            </div>
            <button
              type="button"
              className="auth-modal__submit"
              onClick={handleCloseModal}
            >
              Close
            </button>
          </div>
        ) : (
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
                    <div className="auth-modal__form-group" style={{ position: "relative" }}>
                      <label className="auth-modal__label">Password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="auth-modal__input"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        style={{ marginBottom: "20px" }}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "55%",
                          transform: "translateY(-55%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0",
                          fontSize: "16px",
                        }}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7" /><circle cx="12" cy="12" r="3.5" /></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22" /><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33" /><path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33" /></svg>
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
                          <label className="auth-modal__label">Business Registration Number</label>
                          <input
                            type="text"
                            className="auth-modal__input"
                            placeholder="Enter business registration number"
                            value={businessRegNumber}
                            onChange={(e) => setBusinessRegNumber(e.target.value)}
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
                        <div className="auth-modal__form-group">
                          <label className="auth-modal__checkbox">
                            <input
                              type="checkbox"
                              checked={acceptTerms}
                              onChange={(e) => setAcceptTerms(e.target.checked)}
                              disabled={isLoading}
                            />
                            I accept the <Link to="/terms" target="_blank">terms and conditions</Link>
                          </label>
                        </div>
                        <div className="auth-modal__form-group">
                          <label className="auth-modal__checkbox">
                            <input
                              type="checkbox"
                              checked={acceptListingFee}
                              onChange={(e) => setAcceptListingFee(e.target.checked)}
                              disabled={isLoading}
                            />
                            I accept the listing fee (
                            <Link
                              to="/commission-list"
                              target="_blank"
                              className="auth-modal__link"
                            >
                              View Commission List
                            </Link>
                            )
                          </label>
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
                        <div className="auth-modal__form-group" style={{ position: "relative" }}>
                          <label className="auth-modal__label">Password (min 8 chars, with special, upper & lowercase)</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            className="auth-modal__input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            style={{ marginBottom: "20px" }}
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "55%",
                              transform: "translateY(-55%)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "0",
                              fontSize: "16px",
                            }}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7" /><circle cx="12" cy="12" r="3.5" /></svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22" /><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33" /><path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33" /></svg>
                            )}
                          </button>
                        </div>
                        <div className="auth-modal__form-group" style={{ position: "relative" }}>
                          <label className="auth-modal__label">Confirm Password</label>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="auth-modal__input"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            style={{ marginBottom: "20px" }}
                          />
                          <button
                            type="button"
                            onClick={toggleConfirmPasswordVisibility}
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "55%",
                              transform: "translateY(-55%)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "0",
                              fontSize: "16px",
                            }}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7" /><circle cx="12" cy="12" r="3.5" /></svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22" /><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33" /><path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33" /></svg>
                            )}
                          </button>
                        </div>
                      </>
                    )}

                    {currentStep === 3 && (
                      <>
                        <div className="auth-modal__form-group">
                          <label className="auth-modal__label">
                            Vat/Pan Number{" "}
                            <span style={{ fontSize: "12px" }}>(Pan/Vat number must be 9)</span>
                          </label>
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
                          <label className="auth-modal__label">
                            Please attach your business and PAN/VAT document(s) (Image or PDF)
                          </label>
                          <div className="auth-modal__file-upload">
                            <label htmlFor="taxDocument" className="auth-modal__file-label">
                              Choose File(s)
                            </label>
                            <input
                              id="taxDocument"
                              type="file"
                              className="auth-modal__file-input"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileChange(e, 'tax')}
                              multiple
                              disabled={isLoading}
                            />
                            {taxDocuments.length > 0 && (
                              <div className="auth-modal__file-list">
                                {taxDocuments.map((doc, index) => (
                                  <div key={index} className="auth-modal__file-item">
                                    <span className="auth-modal__file-name">{doc.name}</span>
                                    <button
                                      type="button"
                                      className="auth-modal__file-remove"
                                      onClick={() => removeFile(index, 'tax')}
                                      disabled={isLoading}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="auth-modal__form-group">
                          <label className="auth-modal__label">
                            Ownership Citizenship Document(s) (Optional, Image or PDF)
                          </label>
                          <div className="auth-modal__file-upload">
                            <label htmlFor="citizenshipDocument" className="auth-modal__file-label">
                              Choose File(s)
                            </label>
                            <input
                              id="citizenshipDocument"
                              type="file"
                              className="auth-modal__file-input"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileChange(e, 'citizenship')}
                              multiple
                              disabled={isLoading}
                            />
                            {citizenshipDocuments.length > 0 && (
                              <div className="auth-modal__file-list">
                                {citizenshipDocuments.map((doc, index) => (
                                  <div key={index} className="auth-modal__file-item">
                                    <span className="auth-modal__file-name">{doc.name}</span>
                                    <button
                                      type="button"
                                      className="auth-modal__file-remove"
                                      onClick={() => removeFile(index, 'citizenship')}
                                      disabled={isLoading}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {currentStep === 4 && (
                      <>
                        <div className="auth-modal__form-group">
                          <label className="auth-modal__label">Account Name</label>
                          <input
                            type="text"
                            className="auth-modal__input"
                            placeholder="Enter account name"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="auth-modal__form-group">
                          <label className="auth-modal__label">Bank Name</label>
                          <input
                            type="text"
                            className="auth-modal__input"
                            placeholder="Enter bank name"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="auth-modal__form-group">
                          <label className="auth-modal__label">Account Number</label>
                          <input
                            type="text"
                            className="auth-modal__input"
                            placeholder="Enter account number"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="auth-modal__form-group">
                          <label className="auth-modal__label">Bank Branch</label>
                          <input
                            type="text"
                            className="auth-modal__input"
                            placeholder="Enter bank branch"
                            value={bankBranch}
                            onChange={(e) => setBankBranch(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="auth-modal__form-group">
                          <label className="auth-modal__label">Bank Code (Optional)</label>
                          <input
                            type="text"
                            className="auth-modal__input"
                            placeholder="Enter bank code"
                            value={bankCode}
                            onChange={(e) => setBankCode(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="auth-modal__form-group">
                          <label className="auth-modal__label">Blank Cheque Photo (Image)</label>
                          <div className="auth-modal__file-upload">
                            <label htmlFor="chequePhoto" className="auth-modal__file-label">
                              Choose File
                            </label>
                            <input
                              id="chequePhoto"
                              type="file"
                              className="auth-modal__file-input"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 'cheque')}
                              disabled={isLoading}
                            />
                            {blankChequePhoto && (
                              <div className="auth-modal__file-list">
                                <div className="auth-modal__file-item">
                                  <span className="auth-modal__file-name">{blankChequePhoto.name}</span>
                                  <button
                                    type="button"
                                    className="auth-modal__file-remove"
                                    onClick={() => setBlankChequePhoto(null)}
                                    disabled={isLoading}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
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
                        type="submit"
                        className="auth-modal__submit"
                        disabled={isLoading || !isStepValid}
                      >
                        {isLoading ? "Loading..." : currentStep === 4 ? "Submit Registration" : "Next"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </form>
        )}

        {!showVerification && !isVerificationComplete && (
          <div className="auth-modal__footer">
            <p className="auth-modal__footer-text">
              {!forceSignupMode && !forceLoginMode && (
                <button
                  type="button"
                  className="auth-modal__link-button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                >
                  {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Log in"}
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