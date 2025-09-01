import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "../Styles/AuthModal.css";
import close from "../assets/close.png";
import { Toaster, toast } from "react-hot-toast";
import popup from "../assets/auth.jpg";
import { FaInfoCircle } from "react-icons/fa";

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

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const modalRef = useRef<HTMLDivElement | null>(null);

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
      setErrors({});
      setTouched({});
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

  // Validation function for individual fields
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case "businessName":
        if (!value.trim()) return "Business name is required";
        if (value.length < 3) return "Business name must be at least 3 characters";
        if (value.length > 50) return "Business name must be less than 50 characters";
        return "";

      case "phoneNumber":
        if (!value.trim()) return "Phone number is required";
        if (!/^\+?[\d\s-]{10,}$/.test(value)) return "Invalid phone number format";
        return "";

      case "businessRegNumber":
        if (!value.trim()) return "Business registration number is required";
        if (!/^\d+$/.test(value)) return "Business registration number must contain only numbers";
        if (value.length < 3) return "Business registration number must be at least 3 characters";
        return "";

      case "province":
        if (!value.trim()) return "Province is required";
        return "";

      case "district":
        if (!value.trim()) return "District is required";
        return "";

      case "taxNumber":
        if (!value.trim()) return "Pan/VAT number is required";
        if (value.length !== 9) return "Pan/VAT number must be exactly 9 characters";
        if (!/^\d{9}$/.test(value)) return "Pan/VAT number must be numeric";
        return "";

      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
        if (value.length > 255) return "Email is too long";
        return "";

      case "password":
        if (!value.trim()) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter";
        if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
        if (!/[^a-zA-Z0-9]/.test(value)) return "Password must contain at least one special character";
        if (value.length > 128) return "Password is too long";
        return "";

      case "confirmPassword":
        if (!value.trim()) return "Please confirm your password";
        if (value !== password) return "Passwords do not match";
        return "";

      case "accountName":
        if (!value.trim()) return "Account name is required";
        if (value.length < 3) return "Account name must be at least 3 characters";
        return "";

      case "bankName":
        if (!value.trim()) return "Bank name is required";
        if (value.length < 3) return "Bank name must be at least 3 characters";
        return "";

      case "accountNumber":
        if (!value.trim()) return "Account number is required";
        if (!/^\d{8,}$/.test(value)) return "Account number must be at least 8 digits";
        return "";

      case "bankBranch":
        if (!value.trim()) return "Bank branch is required";
        if (value.length < 3) return "Bank branch must be at least 3 characters";
        return "";

      case "bankCode":
        if (value && !/^[A-Za-z0-9]{4,}$/.test(value)) return "Invalid bank code format";
        return "";

      case "bankAddress":
        if (value && value.length < 5) return "Bank address must be at least 5 characters";
        return "";

      case "taxDocuments":
        if (value.length === 0) return "At least one PAN/VAT document is required";
        for (const doc of value) {
          if (!/\.(jpg|jpeg|png|pdf)$/i.test(doc.name)) {
            return "PAN/VAT documents must be JPG, JPEG, PNG, or PDF";
          }
          if (doc.size > 5 * 1024 * 1024) {
            return "PAN/VAT document size exceeds 5MB limit";
          }
        }
        if (value.length > 5) return "Cannot upload more than 5 PAN/VAT documents";
        return "";

      case "citizenshipDocuments":
        for (const doc of value) {
          if (!/\.(jpg|jpeg|png|pdf)$/i.test(doc.name)) {
            return "Citizenship documents must be JPG, JPEG, PNG, or PDF";
          }
          if (doc.size > 5 * 1024 * 1024) {
            return "Citizenship document size exceeds 5MB limit";
          }
        }
        if (value.length > 5) return "Cannot upload more than 5 citizenship documents";
        return "";

      case "blankChequePhoto":
        if (!value) return "Blank cheque photo is required";
        if (!/\.(jpg|jpeg|png)$/i.test(value.name)) return "Blank cheque photo must be JPG, JPEG, or PNG";
        if (value.size > 5 * 1024 * 1024) return "Blank cheque photo size exceeds 5MB limit";
        return "";

      case "acceptTerms":
        if (!value) return "You must accept the terms and conditions";
        return "";

      case "acceptListingFee":
        if (!value) return "You must accept the listing fee";
        return "";

      case "verificationToken":
        if (!value.trim()) return "Verification code is required";
        if (!/^\d{6}$/.test(value)) return "Verification code must be a 6-digit number";
        return "";

      default:
        return "";
    }
  };

  // Handle input blur for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle input change with real-time validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Update the corresponding state
    switch (name) {
      case "businessName":
        setBusinessName(value);
        break;
      case "phoneNumber":
        setPhoneNumber(value);
        break;
      case "businessRegNumber":
        setBusinessRegNumber(value);
        break;
      case "province":
        setProvince(value);
        if (value) fetchDistricts(value);
        break;
      case "district":
        setDistrict(value);
        break;
      case "taxNumber":
        setTaxNumber(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
      case "accountName":
        setAccountName(value);
        break;
      case "bankName":
        setBankName(value);
        break;
      case "accountNumber":
        setAccountNumber(value);
        break;
      case "bankBranch":
        setBankBranch(value);
        break;
      case "bankCode":
        setBankCode(value);
        break;
      case "bankAddress":
        setBankAddress(value);
        break;
    }

    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    // Validate field in real-time if it's been touched before
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Validate current step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    const fieldsToValidate = currentStep === 1
      ? ["businessName", "phoneNumber", "province", "district", "acceptTerms"]
      : currentStep === 2
        ? ["businessRegNumber", "taxNumber", "email", "password", "confirmPassword"]
        : currentStep === 3
          ? ["taxDocuments", "citizenshipDocuments"]
          : ["accountName", "bankName", "accountNumber", "bankBranch", "bankCode", "bankAddress", "blankChequePhoto", "acceptListingFee"];

    fieldsToValidate.forEach(field => {
      const value = field === "businessName" ? businessName :
        field === "phoneNumber" ? phoneNumber :
          field === "businessRegNumber" ? businessRegNumber :
            field === "province" ? province :
              field === "district" ? district :
                field === "taxNumber" ? taxNumber :
                  field === "email" ? email :
                    field === "password" ? password :
                      field === "confirmPassword" ? confirmPassword :
                        field === "accountName" ? accountName :
                          field === "bankName" ? bankName :
                            field === "accountNumber" ? accountNumber :
                              field === "bankBranch" ? bankBranch :
                                field === "bankCode" ? bankCode :
                                  field === "bankAddress" ? bankAddress :
                                    field === "taxDocuments" ? taxDocuments :
                                      field === "citizenshipDocuments" ? citizenshipDocuments :
                                        field === "blankChequePhoto" ? blankChequePhoto :
                                          field === "acceptTerms" ? acceptTerms :
                                            field === "acceptListingFee" ? acceptListingFee : null;

      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));

    // Mark all relevant fields as touched
    const allTouched = fieldsToValidate.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);

    setTouched(prev => ({ ...prev, ...allTouched }));
    return isValid;
  };

  // Validate entire form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    const fieldsToValidate = [
      "businessName",
      "phoneNumber",
      "businessRegNumber",
      "province",
      "district",
      "taxNumber",
      "email",
      "password",
      "confirmPassword",
      "accountName",
      "bankName",
      "accountNumber",
      "bankBranch",
      "bankCode",
      "bankAddress",
      "taxDocuments",
      "citizenshipDocuments",
      "blankChequePhoto",
      "acceptTerms",
      "acceptListingFee"
    ];

    fieldsToValidate.forEach(field => {
      const value = field === "businessName" ? businessName :
        field === "phoneNumber" ? phoneNumber :
          field === "businessRegNumber" ? businessRegNumber :
            field === "province" ? province :
              field === "district" ? district :
                field === "taxNumber" ? taxNumber :
                  field === "email" ? email :
                    field === "password" ? password :
                      field === "confirmPassword" ? confirmPassword :
                        field === "accountName" ? accountName :
                          field === "bankName" ? bankName :
                            field === "accountNumber" ? accountNumber :
                              field === "bankBranch" ? bankBranch :
                                field === "bankCode" ? bankCode :
                                  field === "bankAddress" ? bankAddress :
                                    field === "taxDocuments" ? taxDocuments :
                                      field === "citizenshipDocuments" ? citizenshipDocuments :
                                        field === "blankChequePhoto" ? blankChequePhoto :
                                          field === "acceptTerms" ? acceptTerms :
                                            field === "acceptListingFee" ? acceptListingFee : null;

      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);

    const allTouched = fieldsToValidate.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);

    setTouched(prev => ({ ...prev, ...allTouched }));
    return isValid;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: "tax" | "citizenship" | "cheque"
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    console.log(`File change for ${documentType}:`, files.map(f => f.name));

    // Validate file count and size
    if (documentType === "tax" || documentType === "citizenship") {
      const currentDocs = documentType === "tax" ? taxDocuments : citizenshipDocuments;
      if (files.length + currentDocs.length > 5) {
        setErrors(prev => ({ ...prev, [documentType + "Documents"]: "Cannot upload more than 5 documents" }));
        toast.error("Cannot upload more than 5 documents");
        return;
      }
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          setErrors(prev => ({ ...prev, [documentType + "Documents"]: "File size exceeds 5MB limit" }));
          toast.error("File size exceeds 5MB limit");
          return;
        }
      }
    } else if (documentType === "cheque" && files.length > 0) {
      if (files[0].size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, blankChequePhoto: "File size exceeds 5MB limit" }));
        toast.error("File size exceeds 5MB limit");
        return;
      }
    }

    // Update state and validate
    if (documentType === "tax") {
      const newFiles = [...taxDocuments, ...files];
      setTaxDocuments(newFiles);
      setTouched(prev => ({ ...prev, taxDocuments: true }));
      const error = validateField("taxDocuments", newFiles);
      setErrors(prev => ({ ...prev, taxDocuments: error }));
    } else if (documentType === "citizenship") {
      const newFiles = [...citizenshipDocuments, ...files];
      setCitizenshipDocuments(newFiles);
      setTouched(prev => ({ ...prev, citizenshipDocuments: true }));
      const error = validateField("citizenshipDocuments", newFiles);
      setErrors(prev => ({ ...prev, citizenshipDocuments: error }));
    } else if (documentType === "cheque" && files.length > 0) {
      setBlankChequePhoto(files[0]);
      setTouched(prev => ({ ...prev, blankChequePhoto: true }));
      const error = validateField("blankChequePhoto", files[0]);
      setErrors(prev => ({ ...prev, blankChequePhoto: error }));
    }
  };

  const removeFile = (index: number, documentType: "tax" | "citizenship") => {
    console.log(`Removing ${documentType} file at index ${index}`);
    if (documentType === "tax") {
      const newFiles = taxDocuments.filter((_, i) => i !== index);
      setTaxDocuments(newFiles);
      setTouched(prev => ({ ...prev, taxDocuments: true }));
      const error = validateField("taxDocuments", newFiles);
      setErrors(prev => ({ ...prev, taxDocuments: error }));
    } else {
      const newFiles = citizenshipDocuments.filter((_, i) => i !== index);
      setCitizenshipDocuments(newFiles);
      setTouched(prev => ({ ...prev, citizenshipDocuments: true }));
      const error = validateField("citizenshipDocuments", newFiles);
      setErrors(prev => ({ ...prev, citizenshipDocuments: error }));
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
      // Validate files before uploading
      for (const file of files) {
        if (!/\.(jpg|jpeg|png|pdf)$/i.test(file.name)) {
          setError("Invalid file type. Only JPG, JPEG, PNG, or PDF files are allowed.");
          toast.error("Invalid file type. Only JPG, JPEG, PNG, or PDF files are allowed.");
          return null;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError("File size exceeds 5MB limit.");
          toast.error("File size exceeds 5MB limit.");
          return null;
        }
      }

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
      console.log("Submitting signup data:", userData);
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
      setErrors({});
      setTouched({});
    } catch (err) {
      console.error("Signup error:", err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400 && err.response?.data?.errors) {
          const serverErrors = err.response.data.errors;
          const newErrors: Record<string, string> = {};

          Object.keys(serverErrors).forEach(key => {
            if (serverErrors[key] && serverErrors[key][0]) {
              newErrors[key] = serverErrors[key][0];
            }
          });

          setErrors(prev => ({ ...prev, ...newErrors }));
          setError("Please correct the validation errors");
          toast.error("Please correct the validation errors");
          console.log("Validation errors from server:", newErrors);
        } else if (err.response?.status === 400 && err.response?.data?.message) {
          setError(err.response.data.message);
          toast.error(err.response.data.message);
          console.log("Server error message:", err.response.data.message);
        } else if (err.response?.status === 409) {
          setError(err.response.data.message);
          toast.error(err.response.data.message);
          console.log("Conflict error:", err.response.data.message);
        } else {
          setError(`Signup failed (${err.response?.status || "unknown error"}). Please try again.`);
          toast.error("Signup failed. Please try again.");
          console.log("Unknown signup error:", err.response?.status);
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

      const error = validateField("verificationToken", verificationToken);
      if (error) {
        setErrors(prev => ({ ...prev, verificationToken: error }));
        setTouched(prev => ({ ...prev, verificationToken: true }));
        toast.error(error);
        return;
      }

      console.log("Verifying email with token:", verificationToken);
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify`,
        { email: pendingVerificationEmail, token: verificationToken },
        { headers: { "Content-Type": "application/json", Accept: "application/json" } }
      );

      console.log("Verification response:", response.data);
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
    if (!validateStep()) {
      toast.error("Please fix the errors in the form before proceeding.");
      console.log("Step validation failed, cannot proceed");
      return;
    }
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
      await handleVerifyEmail();
      return;
    }

    if (currentStep < 4) {
      handleNext();
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      console.log("Full form validation failed");
      return;
    }

    // Revalidate files explicitly
    const taxDocsError = validateField("taxDocuments", taxDocuments);
    const chequeError = validateField("blankChequePhoto", blankChequePhoto);
    if (taxDocsError || chequeError) {
      setErrors(prev => ({ ...prev, taxDocuments: taxDocsError, blankChequePhoto: chequeError }));
      setTouched(prev => ({ ...prev, taxDocuments: true, blankChequePhoto: true }));
      toast.error("Please upload valid PAN/VAT documents and cheque photo");
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
                    className={`auth-modal__input auth-modal__input--verification ${errors.verificationToken && touched.verificationToken ? "error" : ""}`}
                    placeholder="______"
                    name="verificationToken"
                    value={verificationToken}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setVerificationToken(value);
                      if (touched.verificationToken) {
                        const error = validateField("verificationToken", value);
                        setErrors(prev => ({ ...prev, verificationToken: error }));
                      }
                    }}
                    onBlur={handleBlur}
                    required
                    disabled={isLoading}
                    maxLength={6}
                    inputMode="numeric"
                    pattern="\d{6}"
                    style={{ width: '200px', textAlign: 'center' }}
                  />
                  {errors.verificationToken && touched.verificationToken && (
                    <div className="error-message">
                      <FaInfoCircle className="error-icon" />
                      {errors.verificationToken}
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
                    <div className="auth-modal__form-group auth-modal__form-group--grid">
                      <div>
                        <label className="auth-modal__label">Business Name</label>
                        <input
                          type="text"
                          className={`auth-modal__input ${errors.businessName && touched.businessName ? "error" : ""}`}
                          placeholder="Enter business name"
                          name="businessName"
                          value={businessName}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        {errors.businessName && touched.businessName && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.businessName}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="auth-modal__label">Phone Number</label>
                        <input
                          type="text"
                          className={`auth-modal__input ${errors.phoneNumber && touched.phoneNumber ? "error" : ""}`}
                          placeholder="Enter phone number"
                          name="phoneNumber"
                          value={phoneNumber}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        {errors.phoneNumber && touched.phoneNumber && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.phoneNumber}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="auth-modal__form-group auth-modal__form-group--grid">
                      <div>
                        <label className="auth-modal__label">Province</label>
                        <select
                          className={`auth-modal__input ${errors.province && touched.province ? "error" : ""}`}
                          name="province"
                          value={province}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
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
                        {errors.province && touched.province && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.province}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="auth-modal__label">District</label>
                        <select
                          className={`auth-modal__input ${errors.district && touched.district ? "error" : ""}`}
                          name="district"
                          value={district}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
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
                        {errors.district && touched.district && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.district}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="auth-modal__form-group" style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                      <label className="auth-modal__checkbox" style={{ background: "transparent" }}>
                        <input
                          type="checkbox"
                          name="acceptTerms"
                          checked={acceptTerms}
                          onChange={(e) => {
                            setAcceptTerms(e.target.checked);
                            setTouched(prev => ({ ...prev, acceptTerms: true }));
                            const error = validateField("acceptTerms", e.target.checked);
                            setErrors(prev => ({ ...prev, acceptTerms: error }));
                            console.log("Accept terms toggled:", e.target.checked);
                          }}
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", height: "fit-content" }}
                        />
                        I accept the <Link to="/vendor/terms" target="_blank">terms and conditions</Link>
                      </label>
                      {errors.acceptTerms && touched.acceptTerms && (
                        <div className="error-message">
                          <FaInfoCircle className="error-icon" />
                          {errors.acceptTerms}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div className="auth-modal__form-group auth-modal__form-group--grid">
                      <div>
                        <label className="auth-modal__label">Business Registration Number</label>
                        <input
                          type="text"
                          className={`auth-modal__input ${errors.businessRegNumber && touched.businessRegNumber ? "error" : ""}`}
                          placeholder="Enter business registration number"
                          name="businessRegNumber"
                          value={businessRegNumber}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        {errors.businessRegNumber && touched.businessRegNumber && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.businessRegNumber}
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
                          className={`auth-modal__input ${errors.taxNumber && touched.taxNumber ? "error" : ""}`}
                          placeholder="Enter pan/vat number"
                          name="taxNumber"
                          value={taxNumber}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        {errors.taxNumber && touched.taxNumber && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.taxNumber}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="auth-modal__form-group auth-modal__form-group--grid">
                      <div>
                        <label className="auth-modal__label">Email</label>
                        <input
                          type="email"
                          className={`auth-modal__input ${errors.email && touched.email ? "error" : ""}`}
                          placeholder="Enter email"
                          name="email"
                          value={email}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        {errors.email && touched.email && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.email}
                          </div>
                        )}
                      </div>
                      <div style={{ position: "relative" }}>
                        <label className="auth-modal__label">Password</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          className={`auth-modal__input ${errors.password && touched.password ? "error" : ""}`}
                          placeholder="Enter password"
                          name="password"
                          value={password}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "60px",
                            marginRight: "15px",
                            transform: "translateY(-70%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0",
                            fontSize: "16px",
                          }}
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
                        {errors.password && touched.password && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.password}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="auth-modal__form-group" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", width: "100%" }}>
                      <div style={{ position: "relative" }}>
                        <label className="auth-modal__label">Confirm Password</label>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className={`auth-modal__input ${errors.confirmPassword && touched.confirmPassword ? "error" : ""}`}
                          placeholder="Confirm password"
                          name="confirmPassword"
                          value={confirmPassword}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "60px",
                            transform: "translateY(-70%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0",
                            fontSize: "16px",
                          }}
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
                        {errors.confirmPassword && touched.confirmPassword && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.confirmPassword}
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
                          Please attach your business and PAN/VAT document(s) (JPG, JPEG, PNG, or PDF, required)
                        </label>
                        <div className="auth-modal__file-upload">
                          <label htmlFor="taxDocument" className="auth-modal__file-label">
                            Choose File(s)
                          </label>
                          <input
                            id="taxDocument"
                            type="file"
                            className="auth-modal__file-input"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={(e) => handleFileChange(e, "tax")}
                            multiple
                            disabled={isLoading}
                            required
                          />
                        </div>
                        {errors.taxDocuments && touched.taxDocuments && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.taxDocuments}
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
                          Ownership Citizenship Document(s) (Optional, JPG, JPEG, PNG, or PDF)
                        </label>
                        <div className="auth-modal__file-upload">
                          <label htmlFor="citizenshipDocument" className="auth-modal__file-label">
                            Choose File(s)
                          </label>
                          <input
                            id="citizenshipDocument"
                            type="file"
                            className="auth-modal__file-input"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={(e) => handleFileChange(e, "citizenship")}
                            multiple
                            disabled={isLoading}
                          />
                        </div>
                        {citizenshipDocuments.length > 0 && (
                          <div className="auth-modal__file-list" style={{ marginTop: "15px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                            {citizenshipDocuments.map((doc, index) => renderFilePreview(doc, index, "citizenship"))}
                          </div>
                        )}
                        {errors.citizenshipDocuments && touched.citizenshipDocuments && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.citizenshipDocuments}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 4 && (
                  <>
                    <div className="auth-modal__form-group auth-modal__form-group--grid">
                      <div>
                        <label className="auth-modal__label">Bank Account Name</label>
                        <input
                          type="text"
                          className={`auth-modal__input ${errors.accountName && touched.accountName ? "error" : ""}`}
                          placeholder="Enter account name"
                          name="accountName"
                          value={accountName}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        {errors.accountName && touched.accountName && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.accountName}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="auth-modal__label">Bank Name</label>
                        <input
                          type="text"
                          className={`auth-modal__input ${errors.bankName && touched.bankName ? "error" : ""}`}
                          placeholder="Enter bank name"
                          name="bankName"
                          value={bankName}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        {errors.bankName && touched.bankName && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.bankName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="auth-modal__form-group auth-modal__form-group--grid">
                      <div>
                        <label className="auth-modal__label">Bank Account Number</label>
                        <input
                          type="text"
                          className={`auth-modal__input ${errors.accountNumber && touched.accountNumber ? "error" : ""}`}
                          placeholder="Enter account number"
                          name="accountNumber"
                          value={accountNumber}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        {errors.accountNumber && touched.accountNumber && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.accountNumber}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="auth-modal__label">Bank Branch</label>
                        <input
                          type="text"
                          className={`auth-modal__input ${errors.bankBranch && touched.bankBranch ? "error" : ""}`}
                          placeholder="Enter bank branch"
                          name="bankBranch"
                          value={bankBranch}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        {errors.bankBranch && touched.bankBranch && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.bankBranch}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="auth-modal__form-group auth-modal__form-group--grid">
                      <div>
                        <label className="auth-modal__label">Bank Code (Optional)</label>
                        <input
                          type="text"
                          className={`auth-modal__input ${errors.bankCode && touched.bankCode ? "error" : ""}`}
                          placeholder="Enter bank code"
                          name="bankCode"
                          value={bankCode}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        {errors.bankCode && touched.bankCode && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.bankCode}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="auth-modal__label">Bank Address (Optional)</label>
                        <input
                          type="text"
                          className={`auth-modal__input ${errors.bankAddress && touched.bankAddress ? "error" : ""}`}
                          placeholder="Enter bank address"
                          name="bankAddress"
                          value={bankAddress}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          disabled={isLoading}
                          style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                        {errors.bankAddress && touched.bankAddress && (
                          <div className="error-message">
                            <FaInfoCircle className="error-icon" />
                            {errors.bankAddress}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="document-section">
                      <h3 className="cheque-header">
                        Cheque Photo (JPG, JPEG, or PNG, required)
                        {blankChequePhoto && <span className="file-name">{blankChequePhoto.name}</span>}
                      </h3>
                      <div
                        className="document-container cheque-container"
                        onClick={() => document.getElementById("chequePhoto")?.click()}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="document-item file-upload">
                          <input
                            type="file"
                            id="chequePhoto"
                            accept="image/jpeg,image/png"
                            onChange={(e) => handleFileChange(e, "cheque")}
                            required
                            aria-label="Upload Cheque Photo"
                            style={{ display: "none" }}
                          />
                        </div>
                      </div>
                      {errors.blankChequePhoto && touched.blankChequePhoto && (
                        <div className="error-message">
                          <FaInfoCircle className="error-icon" />
                          {errors.blankChequePhoto}
                        </div>
                      )}
                    </div>
                    <label className="auth-modal__checkbox" style={{ background: "transparent" }}>
                      <input
                        type="checkbox"
                        name="acceptListingFee"
                        checked={acceptListingFee}
                        onChange={(e) => {
                          setAcceptListingFee(e.target.checked);
                          setTouched(prev => ({ ...prev, acceptListingFee: true }));
                          const error = validateField("acceptListingFee", e.target.checked);
                          setErrors(prev => ({ ...prev, acceptListingFee: error }));
                          console.log("Accept listing fee toggled:", e.target.checked);
                        }}
                        disabled={isLoading}
                        style={{ background: "transparent", border: "none", boxShadow: "none" }}
                      />
                      I accept the listing fee (
                      <Link to="/commission-list" target="_blank" className="auth-modal__link">
                        View Commission List
                      </Link>
                      )
                    </label>
                    {errors.acceptListingFee && touched.acceptListingFee && (
                      <div className="error-message">
                        <FaInfoCircle className="error-icon" />
                        {errors.acceptListingFee}
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
                    className="auth-modal__submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : currentStep === 4 ? "Submit Registration" : "Next"}
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