import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "../Styles/AuthModal.css";
import close from "../assets/close.png";
import { Toaster, toast } from "react-hot-toast";
import popup from "../assets/auth.jpg";

interface VendorSignupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SignupResponse {
  message: string;
  userId: number;
  username: string;
  token?: string;
}

interface ImageUploadResponse {
  msg: string;
  success: boolean;
  data: string;
  publicId?: string;
}

const VendorSignup: React.FC<VendorSignupProps> = ({ isOpen, onClose }) => {
  // Form states
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [businessRegNumber, setBusinessRegNumber] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [taxNumber, setTaxNumber] = useState<string>("");
  const [taxDocuments, setTaxDocuments] = useState<File[]>([]);
  const [citizenshipDocuments, setCitizenshipDocuments] = useState<File[]>([]);
  const [accountName, setAccountName] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [bankBranch, setBankBranch] = useState<string>("");
  const [bankCode, setBankCode] = useState<string>("");
  const [bankAddress, setBankAddress] = useState<string>("");
  const [blankChequePhoto, setBlankChequePhoto] = useState<File | null>(null);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [acceptListingFee, setAcceptListingFee] = useState<boolean>(false);

  // UI states
  const [districtData, setDistrictData] = useState<string[]>([]);
  const [provinceData, setProvinceData] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isVerificationComplete, setIsVerificationComplete] = useState<boolean>(false);
  const [isStepValid, setIsStepValid] = useState<boolean>(false);
  // New state for field-specific errors
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Validate current step
useEffect(() => {
  if (!showVerification && !isVerificationComplete) {
    const validateCurrentStep = () => {
      console.log(`Validating step ${currentStep}...`);
      const errors: { [key: string]: string } = {};

      if (currentStep === 1) {
        if (touched.businessName && !businessName.trim()) errors.businessName = "Business name is required";
        if (touched.businessName && businessName.length < 3) errors.businessName = "Business name must be at least 3 characters";
        if (touched.phoneNumber && !phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
        if (touched.phoneNumber && phoneNumber && !/^\+?[\d\s-]{10}$/.test(phoneNumber)) errors.phoneNumber = "Please enter a valid phone number";
        if (touched.province && !province.trim()) errors.province = "Province is required";
        if (touched.district && !district.trim()) errors.district = "District is required";
        if (touched.acceptTerms && !acceptTerms) errors.acceptTerms = "You must accept the terms and conditions";
        setIsStepValid(Object.keys(errors).length === 0);
      } else if (currentStep === 2) {
        if (touched.businessRegNumber && !businessRegNumber.trim()) errors.businessRegNumber = "Business registration number is required";
        if (touched.taxNumber && !taxNumber.trim()) errors.taxNumber = "Pan/Vat number is required";
        if (touched.taxNumber && taxNumber && taxNumber.length !== 9) errors.taxNumber = "Pan/Vat number must be 9 characters";
        if (touched.email && !email.trim()) errors.email = "Email is required";
        if (touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email";
        if (touched.password && !password.trim()) errors.password = "Password is required";
        if (touched.password && password && password.length < 8) errors.password = "Password must be at least 8 characters";
        if (touched.password && password && !/[a-z]/.test(password)) errors.password = "Password must contain at least one lowercase letter";
        if (touched.password && password && !/[A-Z]/.test(password)) errors.password = "Password must contain at least one uppercase letter";
        if (touched.password && password && !/[^a-zA-Z0-9]/.test(password)) errors.password = "Password must contain at least one special character";
        if (touched.confirmPassword && !confirmPassword.trim()) errors.confirmPassword = "Please confirm your password";
        if (touched.confirmPassword && password && confirmPassword && password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
        setIsStepValid(Object.keys(errors).length === 0);
      } else if (currentStep === 3) {
        if (touched.taxDocuments && taxDocuments.length === 0) errors.taxDocuments = "At least one Pan/Vat document is required";
        setIsStepValid(Object.keys(errors).length === 0);
      } else if (currentStep === 4) {
        if (touched.accountName && !accountName.trim()) errors.accountName = "Account name is required";
        if (touched.bankName && !bankName.trim()) errors.bankName = "Bank name is required";
        if (touched.accountNumber && !accountNumber.trim()) errors.accountNumber = "Account number is required";
        if (touched.bankBranch && !bankBranch.trim()) errors.bankBranch = "Bank branch is required";
        if (touched.blankChequePhoto && !blankChequePhoto) errors.blankChequePhoto = "Blank cheque photo is required";
        if (touched.blankChequePhoto && blankChequePhoto && ![
          'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/avif', 'image/heic', 'image/heif', 'image/x-canon-cr2'
        ].includes(blankChequePhoto.type)) {
          errors.blankChequePhoto = "Cheque photo must be JPEG, PNG, JPG, WebP, AVIF, HEIC, HEIF, or Canon CR2";
        }
        if (touched.acceptListingFee && !acceptListingFee) errors.acceptListingFee = "You must accept the listing fee";
        setIsStepValid(Object.keys(errors).length === 0);
      }

      setFieldErrors(errors);
      console.log("Step validation:", { errors, isValid: Object.keys(errors).length === 0 });
      return Object.keys(errors).length === 0;
    };
    validateCurrentStep();
  }
}, [
  businessName,
  phoneNumber,
  businessRegNumber,
  province,
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
  showVerification,
  isVerificationComplete,
  touched,
]);
  // Fetch provinces
  useEffect(() => {
    if (isOpen && !showVerification && !isVerificationComplete) {
      const fetchProvinces = async () => {
        try {
          setIsLoading(true);
          console.log("Fetching provinces...");
          const provinceResponse = await fetch("/Nepal-Address-API-main/data/provinces.json");
          if (!provinceResponse.ok) {
            throw new Error("Failed to fetch provinces");
          }
          const data = await provinceResponse.json();
          const provinces = data.provinces.map(capitalizeFirstLetter);
          setProvinceData(provinces);
          console.log("Provinces fetched:", provinces);
        } catch (err) {
          console.error("Failed to fetch provinces:", err);
          setError("Failed to load provinces. Please try again.");
          toast.error("Failed to load provinces. Please try again.");
          setProvinceData([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProvinces();
    }
  }, [isOpen, showVerification, isVerificationComplete]);

  // Handle modal click outside
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("auth-modal--open");
    } else {
      document.body.classList.remove("auth-modal--open");
    }

    const handleClickOutside = (event: MouseEvent): void => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        console.log("Clicked outside modal, closing...");
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
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
        console.log("Verification countdown:", countdown - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, showVerification]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log("Modal closed, resetting form...");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setBusinessName("");
      setPhoneNumber("");
      setBusinessRegNumber("");
      setProvince("");
      setDistrict("");
      setTaxNumber("");
      setTaxDocuments([]);
      setCitizenshipDocuments([]);
      setAccountName("");
      setBankName("");
      setAccountNumber("");
      setBankBranch("");
      setBankCode("");
      setBankAddress("");
      setBlankChequePhoto(null);
      setAcceptTerms(false);
      setAcceptListingFee(false);
      setDistrictData([]);
      setProvinceData([]);
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

  // Helper function
  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  async function fetchDistricts(province: string) {
    try {
      setIsLoading(true);
      console.log(`Fetching districts for province: ${province}`);
      const districtResponse = await fetch(`/Nepal-Address-API-main/data/districtsByProvince/${province.toLowerCase()}.json`);
      if (!districtResponse.ok) {
        throw new Error("Failed to fetch districts");
      }
      const data = await districtResponse.json();
      const districts = data.districts.map(capitalizeFirstLetter);
      setDistrictData(districts);
      setDistrict("");
      console.log("Districts fetched:", districts);
    } catch (error) {
      console.error("Error fetching district data:", error);
      setError("Failed to load districts. Please try again.");
      toast.error("Failed to load districts. Please try again.");
      setDistrictData([]);
    } finally {
      setIsLoading(false);
    }
  }

// Modified validateSignup function to use fieldErrors
  const validateSignup = (): boolean => {
    const errors: { [key: string]: string } = {};
    console.log("Running full form validation...");

    if (!businessName.trim()) errors.businessName = "Business name is required";
    if (businessName.length < 3) errors.businessName = "Business name must be at least 3 characters";
    if (!businessRegNumber.trim()) errors.businessRegNumber = "Business registration number is required";
    if (!province.trim()) errors.province = "Province is required";
    if (!district.trim()) errors.district = "District is required";
    if (!email.trim()) errors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email";
    if (!phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
    if (!/^\+?[\d\s-]{10,}$/.test(phoneNumber)) errors.phoneNumber = "Please enter a valid phone number";
    if (!taxNumber.trim()) errors.taxNumber = "Pan/Vat number is required";
    if (taxNumber.length !== 9) errors.taxNumber = "Pan/Vat number must be 9 characters";
    if (taxDocuments.length === 0) errors.taxDocuments = "At least one Pan/Vat document is required";
    taxDocuments.forEach((doc, index) => {
      if (!/\.(jpg|jpeg|png|pdf)$/i.test(doc.name)) {
        errors.taxDocuments = `Pan/Vat document ${index + 1} must be an image (JPG, JPEG, PNG) or PDF`;
      }
    });
    citizenshipDocuments.forEach((doc, index) => {
      if (!/\.(jpg|jpeg|png|pdf)$/i.test(doc.name)) {
        errors.citizenshipDocuments = `Citizenship document ${index + 1} must be an image (JPG, JPEG, PNG) or PDF`;
      }
    });
    if (!accountName.trim()) errors.accountName = "Account name is required";
    if (!bankName.trim()) errors.bankName = "Bank name is required";
    if (!accountNumber.trim()) errors.accountNumber = "Account number is required";
    if (!bankBranch.trim()) errors.bankBranch = "Bank branch is required";
    if (!blankChequePhoto) errors.blankChequePhoto = "Blank cheque photo is required";
    if (blankChequePhoto && !/\.(jpg|jpeg|png)$/i.test(blankChequePhoto.name)) {
      errors.blankChequePhoto = "Blank cheque photo must be an image (JPG, JPEG, PNG)";
    }
    if (!password.trim()) errors.password = "Password is required";
    if (password.length < 8) errors.password = "Password must be at least 8 characters";
    if (!/[a-z]/.test(password)) errors.password = "Password must contain at least one lowercase letter";
    if (!/[A-Z]/.test(password)) errors.password = "Password must contain at least one uppercase letter";
    if (!/[^a-zA-Z0-9]/.test(password)) errors.password = "Password must contain at least one special character";
    if (!confirmPassword.trim()) errors.confirmPassword = "Please confirm your password";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!acceptTerms) errors.acceptTerms = "You must accept the terms and conditions";
    if (!acceptListingFee) errors.acceptListingFee = "You must accept the listing fee";

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      Object.values(errors).forEach((err) => toast.error(err));
      setError(Object.values(errors)[0]);
      return false;
    }

    console.log("Validation passed");
    return true;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: "tax" | "citizenship" | "cheque"
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    console.log(`File change for ${documentType}:`, files.map(f => f.name));
    if (documentType === "tax") {
      setTaxDocuments((prev) => [...prev, ...files]);
    } else if (documentType === "citizenship") {
      setCitizenshipDocuments((prev) => [...prev, ...files]);
    } else if (documentType === "cheque" && files.length > 0) {
      setBlankChequePhoto(files[0]);
    }
  };

  const removeFile = (index: number, documentType: "tax" | "citizenship") => {
    console.log(`Removing ${documentType} file at index ${index}`);
    if (documentType === "tax") {
      setTaxDocuments((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCitizenshipDocuments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const renderFilePreview = (file: File, index: number, documentType: "tax" | "citizenship") => {
    const isImage = file.type.startsWith('image/');

    if (isImage) {
      return (
        <div key={index} className="auth-modal__file-preview-container" style={{ margin: "5px 0", position: "relative", display: "inline-block" }}>
          <img
            src={URL.createObjectURL(file)}
            alt={`${documentType} document ${index + 1}`}
            style={{
              maxWidth: "150px",
              maxHeight: "100px",
              objectFit: "cover",
              borderRadius: "4px",
              border: "1px solid #ddd"
            }}
          />
          <button
            type="button"
            className="auth-modal__file-remove"
            onClick={() => removeFile(index, documentType)}
            disabled={isLoading}
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              background: "#ff5722",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>
      );
    } else {
      return (
        <div key={index} className="auth-modal__file-item">
          <span className="auth-modal__file-name">{file.name}</span>
          <button
            type="button"
            className="auth-modal__file-remove"
            onClick={() => removeFile(index, documentType)}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>
      );
    }
  };

  const handleFileUpload = async (files: File[]): Promise<string[] | null> => {
    try {
      console.log("Uploading files:", files.map(f => f.name));
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
          console.log(`Uploaded file ${file.name}:`, response.data.data);
          return response.data.data;
        } else {
          throw new Error(response.data.msg || "Failed to upload document");
        }
      });

      const urls = await Promise.all(uploadPromises);
      console.log("Uploaded file URLs:", urls);
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
  province: string;
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
    bankAddress?: string;
  };
}) => {
  try {
    setIsLoading(true);
    setError("");
    console.log("Sending userData:", JSON.stringify(userData, null, 2));
    const response = await axios.post<SignupResponse>(
      `${API_BASE_URL}/api/vendors/request/register`,
      userData,
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("Signup response:", response.data);
    setSuccess(response.data.message);
    toast.success("Registration successful! Please check your email for verification code.");

    setPendingVerificationEmail(userData.email);
    setShowVerification(true);
    setCountdown(120);

    // Reset form after successful signup
    console.log("Resetting form after successful signup");
    setPassword("");
    setConfirmPassword("");
    setBusinessName("");
    setPhoneNumber("");
    setBusinessRegNumber("");
    setProvince("");
    setDistrict("");
    setTaxNumber("");
    setTaxDocuments([]);
    setCitizenshipDocuments([]);
    setAccountName("");
    setBankName("");
    setAccountNumber("");
    setBankBranch("");
    setBankCode("");
    setBankAddress("");
    setBlankChequePhoto(null);
    setAcceptTerms(false);
    setAcceptListingFee(false);
    setCurrentStep(1);
    setTouched({});
  } catch (err) {
    console.error("Signup error:", err);
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const errorMessages = Object.entries(err.response.data.errors)
          .map(([field, message]) => `${field}: ${message}`)
          .join("\n");
        setError(`Validation errors:\n${errorMessages}`);
        toast.error("Please check your form data");
        console.log("Validation errors from server:", errorMessages);
      } else if (err.response?.status === 400 && err.response?.data?.message) {
        setError(err.response.data.message);
        toast.error(err.response.data.message);
        console.log("Server error message:", err.response.data.message);
      } else if (err.response?.status === 409) {
        setError(err.response.data.message);
        toast.error(err.response.data.message);
        console.log("Conflict error:", err.response.data.message);
      } else if (err.response?.status === 500) {
        setError("Server error occurred. Please try again later.");
        toast.error("Server error occurred. Please try again later.");
        console.log("Server 500 error:", err.response?.data);
      } else {
        setError(`Signup failed (${err.response?.status || "unknown error"}). Please try again.`);
        toast.error("Signup failed. Please try again.");
        console.log("Unknown signup error:", err.response?.status, err.response?.data);
      }
    } else {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      console.log("Unexpected error:", err);
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleVerifyEmail = async () => {
    try {
      setIsLoading(true);
      setError("");
      console.log("Verifying email with token:", verificationToken);
      // Simulate verification (replace with actual API call)
      setShowVerification(false);
      setIsVerificationComplete(true);
      setVerificationToken("");
      setCountdown(0);
      toast.success("Email verified successfully! Waiting for admin approval.");
      console.log("Email verification successful");
    } catch (err) {
      console.error("Verification error:", err);
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Verification failed";
        if (errorMessage.toLowerCase().includes("token") && errorMessage.toLowerCase().includes("invalid")) {
          setError("The verification code is invalid. Please check the code or request a new one.");
          toast.error("Invalid verification code. Please try again.");
          console.log("Invalid verification token");
        } else if (errorMessage.toLowerCase().includes("token") && errorMessage.toLowerCase().includes("expired")) {
          setError("The verification code has expired. Please request a new code.");
          toast.error("Verification code expired. Please request a new one.");
          console.log("Expired verification token");
        } else {
          setError(errorMessage);
          toast.error(errorMessage);
          console.log("Verification error message:", errorMessage);
        }
      } else {
        setError("An unexpected error occurred during verification");
        toast.error("Verification failed. Please try again.");
        console.log("Unexpected verification error:", err);
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
      console.log("Resending verification code for email:", pendingVerificationEmail);
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify/resend`,
        { email: pendingVerificationEmail },
        { headers: { "Content-Type": "application/json", Accept: "application/json" } }
      );
      console.log("Resend verification response:", response.data);
      setSuccess(response.data.message);
      toast.success("Verification code resent successfully");
      setCountdown(120);
    } catch (err) {
      console.error("Resend verification error:", err);
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to resend verification code";
        setError(errorMessage);
        toast.error(errorMessage);
        console.log("Resend verification error message:", errorMessage);
      } else {
        setError("An unexpected error occurred while resending the verification code");
        toast.error("Failed to resend verification code");
        console.log("Unexpected resend error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    console.log(`Moving to step ${currentStep + 1}`);
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    console.log(`Moving back to step ${currentStep - 1}`);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");
    console.log("Form submitted, current step:", currentStep);

    if (showVerification) {
      if (verificationToken.length !== 6 || !/^\d{6}$/.test(verificationToken)) {
        setError("Please enter a valid 6-digit verification code");
        toast.error("Please enter a valid 6-digit verification code");
        console.log("Invalid verification token:", verificationToken);
        return;
      }
      await handleVerifyEmail();
      return;
    }

    if (currentStep < 4) {
      if (!isStepValid) {
        toast.error("Please complete all required fields before proceeding.");
        console.log("Step validation failed, cannot proceed");
        return;
      }
      handleNext();
      return;
    }

    if (!validateSignup()) {
      console.log("Full form validation failed");
      return;
    }

    if (taxDocuments.length === 0 || !blankChequePhoto) {
      setError("Please upload at least one Pan/Vat document and a blank cheque photo");
      toast.error("Please upload at least one Pan/Vat document and a blank cheque photo");
      console.log("Missing required documents");
      return;
    }

    const taxDocumentUrls = await handleFileUpload(taxDocuments);
    const citizenshipDocumentUrls = await handleFileUpload(citizenshipDocuments);
    const chequePhotoUrl = blankChequePhoto ? await handleFileUpload([blankChequePhoto]) : null;

    if (!taxDocumentUrls || (blankChequePhoto && !chequePhotoUrl)) {
      setError("Failed to obtain document URLs. Please try again.");
      toast.error("Failed to obtain document URLs. Please try again.");
      console.log("Document upload failed");
      return;
    }

    const userData = {
      businessName: businessName.trim(),
      email: email.trim(),
      password,
      phoneNumber: phoneNumber.trim(),
      businessRegNumber: businessRegNumber.trim(),
      province: province.trim(),
      district: district.trim(),
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
        bankAddress: bankAddress.trim() || undefined,
      },
    };

    if (!userData.chequePhoto) {
      setError("Blank cheque photo is required");
      toast.error("Blank cheque photo is required");
      console.log("Cheque photo missing after upload");
      return;
    }

    await handleSignup(userData);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    console.log("Toggled password visibility:", !showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
    console.log("Toggled confirm password visibility:", !showConfirmPassword);
  };

 if (!isOpen) return null;

  return (
    <div className={`auth-modal${isOpen ? " auth-modal--open" : ""}`}>
      <Toaster position="top-center" />
      <div className="auth-modal__overlay"></div>
      <div className="auth-modal__content" ref={modalRef} style={{ maxWidth: "700px" }}>
        <button className="auth-modal__close" onClick={onClose}>
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
              : "Vendor Sign Up"}
        </div>

        {error && <div className="auth-modal__message auth-modal__message--error">{error}</div>}
        {success && <div className="auth-modal__message auth-modal__message--success">{success}</div>}

        {!showVerification && !isVerificationComplete && (
          <div className="auth-modal__step-indicator">Step {currentStep} of 4</div>
        )}

        {isVerificationComplete ? (
          <div className="auth-modal__verification-complete">
            <div className="auth-modal__success-message">
              <h3>Email Verified Successfully!</h3>
              <p>Your account has been verified. An admin needs to approve your account.</p>
              <p>
                <strong>You will receive an email notification after your account gets approved.</strong>
              </p>
              <p>This process may take 24-48 hours. Thank you for your patience!</p>
            </div>
            <button type="button" className="auth-modal__submit" onClick={onClose}>
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
                    className={`auth-modal__input auth-modal__input--verification ${fieldErrors.verificationToken ? 'error' : ''}`}
                    placeholder="______"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    disabled={isLoading}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="\d{6}"
                    style={{ width: '200px', textAlign: 'center' }}
                  />
                  {fieldErrors.verificationToken && (
                    <div className="error-message">
                      <span className="error-icon">!</span>
                      {fieldErrors.verificationToken}
                    </div>
                  )}
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
           {currentStep === 1 && (
  <>
    <div className="auth-modal__form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%" }}>
      <div>
        <label className="auth-modal__label">Business Name</label>
        <input
          type="text"
          className={`auth-modal__input ${fieldErrors.businessName ? 'error' : ''}`}
          placeholder="Enter business name"
          value={businessName}
          onChange={(e) => {
            setBusinessName(e.target.value);
            setTouched((prev) => ({ ...prev, businessName: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, businessName: true }))}
          required
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        {fieldErrors.businessName && touched.businessName && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.businessName}
          </div>
        )}
      </div>
      <div>
        <label className="auth-modal__label">Phone Number</label>
        <input
          type="text"
          className={`auth-modal__input ${fieldErrors.phoneNumber ? 'error' : ''}`}
          placeholder="Enter phone number"
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            setTouched((prev) => ({ ...prev, phoneNumber: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, phoneNumber: true }))}
          required
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        {fieldErrors.phoneNumber && touched.phoneNumber && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.phoneNumber}
          </div>
        )}
      </div>
    </div>
    <div className="auth-modal__form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%" }}>
      <div>
        <label className="auth-modal__label">Province</label>
        <select
          className={`auth-modal__input ${fieldErrors.province ? 'error' : ''}`}
          value={province}
          onChange={(e) => {
            setProvince(e.target.value);
            setTouched((prev) => ({ ...prev, province: true }));
            console.log("Province selected:", e.target.value);
            fetchDistricts(e.target.value);
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, province: true }))}
          required
          disabled={isLoading || provinceData.length === 0}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        >
          <option value="">Select Province</option>
          {provinceData.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {fieldErrors.province && touched.province && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.province}
          </div>
        )}
      </div>
      <div>
        <label className="auth-modal__label">District</label>
        <select
          className={`auth-modal__input ${fieldErrors.district ? 'error' : ''}`}
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setTouched((prev) => ({ ...prev, district: true }));
            console.log("District selected:", e.target.value);
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, district: true }))}
          required
          disabled={isLoading || districtData.length === 0}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        >
          <option value="">Select District</option>
          {districtData.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {fieldErrors.district && touched.district && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.district}
          </div>
        )}
      </div>
    </div>
    <div className="auth-modal__form-group" style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      <label className="auth-modal__checkbox" style={{ background: "transparent" }}>
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => {
            setAcceptTerms(e.target.checked);
            setTouched((prev) => ({ ...prev, acceptTerms: true }));
            console.log("Accept terms toggled:", e.target.checked);
          }}
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd" }}
        />
        I accept the <Link to="/terms" target="_blank">terms and conditions</Link>
      </label>
      {fieldErrors.acceptTerms && touched.acceptTerms && (
        <div className="error-message">
          <span className="error-icon">!</span>
          {fieldErrors.acceptTerms}
        </div>
      )}
    </div>
  </>
)}

             {currentStep === 2 && (
  <>
    <div className="auth-modal__form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%" }}>
      <div>
        <label className="auth-modal__label">Business Registration Number</label>
        <input
          type="text"
          className={`auth-modal__input ${fieldErrors.businessRegNumber ? 'error' : ''}`}
          placeholder="Enter business registration number"
          value={businessRegNumber}
          onChange={(e) => {
            setBusinessRegNumber(e.target.value);
            setTouched((prev) => ({ ...prev, businessRegNumber: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, businessRegNumber: true }))}
          required
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        {fieldErrors.businessRegNumber && touched.businessRegNumber && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.businessRegNumber}
          </div>
        )}
      </div>
      <div>
        <label className="auth-modal__label">
          Vat/Pan Number{" "}
          <span style={{ fontSize: "9px" }}>(Pan/Vat no must be 9)</span>
        </label>
        <input
          type="text"
          className={`auth-modal__input ${fieldErrors.taxNumber ? 'error' : ''}`}
          placeholder="Enter pan/vat number"
          value={taxNumber}
          onChange={(e) => {
            setTaxNumber(e.target.value);
            setTouched((prev) => ({ ...prev, taxNumber: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, taxNumber: true }))}
          required
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        {fieldErrors.taxNumber && touched.taxNumber && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.taxNumber}
          </div>
        )}
      </div>
    </div>
    <div className="auth-modal__form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%" }}>
      <div>
        <label className="auth-modal__label">Email</label>
        <input
          type="email"
          className={`auth-modal__input ${fieldErrors.email ? 'error' : ''}`}
          placeholder="Enter email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setTouched((prev) => ({ ...prev, email: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
          required
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        {fieldErrors.email && touched.email && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.email}
          </div>
        )}
      </div>
      <div style={{ position: "relative" }}>
        <label className="auth-modal__label">Password</label>
        <input
          type={showPassword ? "text" : "password"}
          className={`auth-modal__input ${fieldErrors.password ? 'error' : ''}`}
          placeholder="Enter password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setTouched((prev) => ({ ...prev, password: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          required
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="auth-modal__password-toggle"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <ellipse cx="12" cy="12" rx="10" ry="7" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 1l22 22" />
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33" />
              <path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33" />
            </svg>
          )}
        </button>
        {fieldErrors.password && touched.password && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.password}
          </div>
        )}
      </div>
    </div>
    <div className="auth-modal__form-group" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <label className="auth-modal__label">Confirm Password</label>
        <input
          type={showConfirmPassword ? "text" : "password"}
          className={`auth-modal__input ${fieldErrors.confirmPassword ? 'error' : ''}`}
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setTouched((prev) => ({ ...prev, confirmPassword: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
          required
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        <button
          type="button"
          onClick={toggleConfirmPasswordVisibility}
          className="auth-modal__password-toggle"
          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
        >
          {showConfirmPassword ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <ellipse cx="12" cy="12" rx="10" ry="7" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 1l22 22" />
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33" />
              <path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33" />
            </svg>
          )}
        </button>
        {fieldErrors.confirmPassword && touched.confirmPassword && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.confirmPassword}
          </div>
        )}
      </div>
    </div>
  </>
)}

           {currentStep === 3 && (
  <>
  <div className="auth-modal__form-group" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", width: "100%" }}>
  <div>
    <label className="auth-modal__label">
      Please attach your business and PAN/VAT document(s) (Image or PDF)
    </label>
    <div className={`auth-modal__file-upload ${fieldErrors.taxDocuments ? 'error' : ''}`}>
      <label htmlFor="taxDocument" className="auth-modal__file-label">
        Choose File(s)
      </label>
      <input
        id="taxDocument"
        type="file"
        className="auth-modal__file-input"
        accept="image/jpeg,image/png,image/jpg,image/webp,image/avif,image/heic,image/heif,image/x-canon-cr2,application/pdf"
        onChange={(e) => {
          handleFileChange(e, "tax");
          setTouched((prev) => ({ ...prev, taxDocuments: true }));
        }}
        onClick={() => setTouched((prev) => ({ ...prev, taxDocuments: true }))}
        multiple
        disabled={isLoading}
      />
    </div>
    {fieldErrors.taxDocuments && touched.taxDocuments && (
      <div className="error-message">
        <span className="error-icon">!</span>
        {fieldErrors.taxDocuments}
      </div>
    )}
    {taxDocuments.length > 0 && (
      <div className="auth-modal__file-list" style={{ marginTop: "15px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {taxDocuments.map((doc, index) => renderFilePreview(doc, index, "tax"))}
      </div>
    )}
  </div>
</div>
<div className="auth-modal__form-group" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", width: "100%" }}>
  <div>
    <label className="auth-modal__label">
      Ownership Citizenship Document(s) (Optional, Image or PDF)
    </label>
    <div className={`auth-modal__file-upload ${fieldErrors.citizenshipDocuments ? 'error' : ''}`}>
      <label htmlFor="citizenshipDocument" className="auth-modal__file-label">
        Choose File(s)
      </label>
      <input
        id="citizenshipDocument"
        type="file"
        className="auth-modal__file-input"
        accept="image/jpeg,image/png,image/jpg,image/webp,image/avif,image/heic,image/heif,image/x-canon-cr2,application/pdf"
        onChange={(e) => {
          handleFileChange(e, "citizenship");
          setTouched((prev) => ({ ...prev, citizenshipDocuments: true }));
        }}
        onClick={() => setTouched((prev) => ({ ...prev, citizenshipDocuments: true }))}
        multiple
        disabled={isLoading}
      />
    </div>
    {fieldErrors.citizenshipDocuments && touched.citizenshipDocuments && (
      <div className="error-message">
        <span className="error-icon">!</span>
        {fieldErrors.citizenshipDocuments}
      </div>
    )}
    {citizenshipDocuments.length > 0 && (
      <div className="auth-modal__file-list" style={{ marginTop: "15px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {citizenshipDocuments.map((doc, index) => renderFilePreview(doc, index, "citizenship"))}
      </div>
    )}
  </div>
</div>
  </>
)}

                {currentStep === 4 && (
  <>
    <div className="auth-modal__form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%" }}>
      <div>
        <label className="auth-modal__label">Account Name</label>
        <input
          type="text"
          className={`auth-modal__input ${fieldErrors.accountName ? 'error' : ''}`}
          placeholder="Enter account name"
          value={accountName}
          onChange={(e) => {
            setAccountName(e.target.value);
            setTouched((prev) => ({ ...prev, accountName: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, accountName: true }))}
          required
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        {fieldErrors.accountName && touched.accountName && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.accountName}
          </div>
        )}
      </div>
      <div>
        <label className="auth-modal__label">Bank Name</label>
        <input
          type="text"
          className={`auth-modal__input ${fieldErrors.bankName ? 'error' : ''}`}
          placeholder="Enter bank name"
          value={bankName}
          onChange={(e) => {
            setBankName(e.target.value);
            setTouched((prev) => ({ ...prev, bankName: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, bankName: true }))}
          required
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        {fieldErrors.bankName && touched.bankName && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.bankName}
          </div>
        )}
      </div>
    </div>
    <div className="auth-modal__form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%" }}>
      <div>
        <label className="auth-modal__label">Account Number</label>
        <input
          type="text"
          className={`auth-modal__input ${fieldErrors.accountNumber ? 'error' : ''}`}
          placeholder="Enter account number"
          value={accountNumber}
          onChange={(e) => {
            setAccountNumber(e.target.value);
            setTouched((prev) => ({ ...prev, accountNumber: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, accountNumber: true }))}
          required
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        {fieldErrors.accountNumber && touched.accountNumber && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.accountNumber}
          </div>
        )}
      </div>
      <div>
        <label className="auth-modal__label">Bank Branch</label>
        <input
          type="text"
          className={`auth-modal__input ${fieldErrors.bankBranch ? 'error' : ''}`}
          placeholder="Enter bank branch"
          value={bankBranch}
          onChange={(e) => {
            setBankBranch(e.target.value);
            setTouched((prev) => ({ ...prev, bankBranch: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, bankBranch: true }))}
          required
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        {fieldErrors.bankBranch && touched.bankBranch && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {fieldErrors.bankBranch}
          </div>
        )}
      </div>
    </div>
    <div className="auth-modal__form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%" }}>
      <div>
        <label className="auth-modal__label">Bank Code (Optional)</label>
        <input
          type="text"
          className="auth-modal__input"
          placeholder="Enter bank code"
          value={bankCode}
          onChange={(e) => {
            setBankCode(e.target.value);
            setTouched((prev) => ({ ...prev, bankCode: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, bankCode: true }))}
          disabled={isLoading}
          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
        />
      </div>
    </div>
<div className="document-section">
  <h3 className="cheque-header">
    Cheque Photo
    {blankChequePhoto && <span className="file-name">{blankChequePhoto.name}</span>}
  </h3>
  <div
    className={`document-container cheque-container ${fieldErrors.blankChequePhoto ? 'error' : ''}`}
    onClick={() => document.getElementById("chequePhoto")?.click()}
    style={{ cursor: "pointer" }}
  >
    <div className="document-item file-upload">
      <input
        type="file"
        id="chequePhoto"
        accept="image/jpeg,image/png,image/jpg,image/webp,image/avif,image/heic,image/heif,image/x-canon-cr2"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            setBlankChequePhoto(files[0]);
            setTouched((prev) => ({ ...prev, blankChequePhoto: true }));
            console.log("Cheque photo selected:", files[0].name, files[0].type);
          }
        }}
        onClick={() => setTouched((prev) => ({ ...prev, blankChequePhoto: true }))}
  
        aria-label="Upload Cheque Photo"
        style={{ display: "none" }}
      />
    </div>
  </div>
  {fieldErrors.blankChequePhoto && touched.blankChequePhoto && (
    <div className="error-message">
      <span className="error-icon">!</span>
      {fieldErrors.blankChequePhoto}
    </div>
  )}
</div>
    <label className="auth-modal__checkbox" style={{ background: "transparent" }}>
      <input
        type="checkbox"
        checked={acceptListingFee}
        onChange={(e) => {
          setAcceptListingFee(e.target.checked);
          setTouched((prev) => ({ ...prev, acceptListingFee: true }));
          console.log("Accept listing fee toggled:", e.target.checked);
        }}
        disabled={isLoading}
        style={{ background: "transparent", border: "1px solid #ddd" }}
      />
      I accept the listing fee (
      <Link to="/commission-list" target="_blank" className="auth-modal__link">
        View Commission List
      </Link>
      )
    </label>
    {fieldErrors.acceptListingFee && touched.acceptListingFee && (
      <div className="error-message">
        <span className="error-icon">!</span>
        {fieldErrors.acceptListingFee}
      </div>
    )}
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
  className={`auth-modal__submit ${isLoading ? 'loading' : ''}`}
  disabled={isLoading || !isStepValid}
>
  {isLoading ? (
    currentStep === 4 ? "Submitting Registration..." : "Loading..."
  ) : (
    currentStep === 4 ? "Submit Registration" : "Next"
  )}
</button>

</div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default VendorSignup;