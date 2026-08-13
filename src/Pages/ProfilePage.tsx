// ProfilePage.tsx — complete fixed version
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { useVendorAuth } from "../context/VendorAuthContext";
import { Sidebar } from "../Components/Sidebar";
import VendorHeader from "../Components/VendorHeader";
import "../Styles/ProfilePage.css";
import axiosInstance from "../api/axiosInstance";
import { getProvinceForDistrict } from "../utils/nepalProvinces";
import {
  FaTrash,
  FaPlus,
  FaWallet,
  FaUniversity,
  FaCamera,
} from "react-icons/fa";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentOption {
  id?: number;
  paymentType: "KHALTI" | "ESEWA" | "BANK";
  details: Record<string, any>;
  qrCodeImage?: string | null;
  isActive: boolean;
}

interface VendorProfile {
  id: number;
  businessName: string;
  email: string;
  phoneNumber: string;
  telePhone?: string;
  businessAddress: string;
  profilePicture?: string;
  isVerified?: boolean;
  isApproved?: boolean;
  district?: { id: number; name: string };
  taxNumber?: string;
  taxDocuments?: string[];
  businessRegNumber?: string;
  citizenshipDocuments?: string[];
  chequePhoto?: string | null;
  paymentOptions?: PaymentOption[];
  [key: string]: any;
}

interface FormState {
  email: string;
  newPassword?: string;
  confirmPassword?: string;
  token?: string;
}

type Tab = "details" | "credentials";
type CredentialsMode = "idle" | "forgot" | "reset";

const getAvatarColor = (name: string): string => {
  const colors = [
    "#4285F4",
    "#DB4437",
    "#F4B400",
    "#0F9D58",
    "#673AB7",
    "#0097A7",
  ];
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return colors[sum % colors.length];
};

// ─── Component ────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { authState, login, logout } = useVendorAuth();
  const vendorId = authState.vendor?.id;

  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [isEditing, setIsEditing] = useState(false);
  const [vendorDetails, setVendorDetails] = useState<VendorProfile | null>(
    null,
  );
  const [originalDetails, setOriginalDetails] = useState<VendorProfile | null>(
    null,
  );
  const [formState, setFormState] = useState<FormState>({ email: "" });
  const [credentialsMode, setCredentialsMode] =
    useState<CredentialsMode>("idle");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    content: string;
  } | null>(null);

  const [currentPaymentType, setCurrentPaymentType] = useState<
    "ESEWA" | "KHALTI" | "BANK" | ""
  >("");
  const [walletNumber, setWalletNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankBranch, setBankBranch] = useState("");

  const [previewCitizenship, setPreviewCitizenship] = useState<string[]>([]);
  const [previewTax, setPreviewTax] = useState<string[]>([]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const citizenshipInputRef = useRef<HTMLInputElement>(null);
  const taxInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setLoading = (key: string, val: boolean) =>
    setIsLoading((prev) => ({ ...prev, [key]: val }));

  const showPopup = (type: "success" | "error", content: string) => {
    setPopup({ type, content });
    setTimeout(() => setPopup(null), 3500);
  };

  const handleError = (error: unknown, defaultMsg: string) => {
    const e = error as any;
    const status = e?.response?.status;
    const data = e?.response?.data;
    const map: Record<number, string> = {
      400: data?.message || "Invalid input.",
      401: "Session expired. Please log in again.",
      403: "You don't have permission.",
      404: "Resource not found.",
      409: data?.message || "Conflict.",
      422: data?.message || "Validation failed.",
      500: "Server error. Please try again later.",
    };
    showPopup("error", status && map[status] ? map[status] : defaultMsg);
  };

  // ── Image upload — uses axiosInstance ─────────────────────────────────────
  // The request interceptor will automatically attach vendorToken as
  // Authorization header because the URL starts with /api/image
  // (falls through to the vendorToken fallback in your interceptor)
  const uploadImage = async (
    file: File,
    folder = "vendor-documents",
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await axiosInstance.post(
      `/api/image?folder=${folder}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    if (!res.data.success) throw new Error(res.data.message || "Upload failed");
    return res.data.data as string;
  };

  // ── Fetch vendor — uses axiosInstance ─────────────────────────────────────
  const fetchVendorDetails = async () => {
    setLoading("fetch", true);
    try {
      // axiosInstance interceptor sees /api/vendors/* → sends vendorToken
      const res = await axiosInstance.get("/api/vendors/auth/vendor");

      const v = res.data.vendor as any;

      const normalized: VendorProfile = {
        ...v,
        businessName: v.businessName || "",
        phoneNumber: v.phoneNumber || "",
        telePhone: v.telePhone === "-" ? "" : v.telePhone || "",
        businessAddress: v.district?.name || v.businessAddress || "",
        taxNumber: v.taxNumber || "",
        businessRegNumber: v.businessRegNumber || "",
        citizenshipDocuments: v.citizenshipDocuments || [],
        taxDocuments: v.taxDocuments || [],
        paymentOptions: v.paymentOptions || [],
        profilePicture: v.profilePicture || "",
      };

      setVendorDetails(normalized);
      setOriginalDetails(normalized);
      setFormState({ email: v.email || "" });
      setPreviewCitizenship(v.citizenshipDocuments || []);
      setPreviewTax(v.taxDocuments || []);

      if (authState.token) {
        login(authState.token, normalized as any);
      }
    } catch (err) {
      handleError(err, "Failed to load vendor details");
    } finally {
      setLoading("fetch", false);
    }
  };

  useEffect(() => {
    if (!vendorId) {
      navigate("/login");
      return;
    }
    fetchVendorDetails();
  }, [vendorId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !vendorDetails) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      showPopup("error", "Please upload PNG, JPG, or WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showPopup("error", "Image must be under 5 MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Step 1: upload file to Cloudinary
      const url = await uploadImage(file, "profile-pictures");

      // Step 2: save URL on vendor record
      const updateRes = await axiosInstance.put(`/api/vendors/v2/${vendorId}`, {
        profilePicture: url,
      });

      if (updateRes.data.success) {
        const updated: VendorProfile = {
          ...vendorDetails,
          profilePicture: url,
        };

        setVendorDetails(updated);
        setOriginalDetails(updated);

        if (authState.token) {
          login(authState.token, updated as any);
        }

        showPopup("success", "Profile picture updated!");
      } else {
        throw new Error(updateRes.data.message || "Failed to save picture");
      }
    } catch (err) {
      handleError(err, "Failed to update profile picture");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Document upload ───────────────────────────────────────────────────────
  const handleArrayFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "citizenshipDocuments" | "taxDocuments",
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setLoading(`upload_${field}`, true);
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f)));
      const previews = files.map((f) => URL.createObjectURL(f));

      setVendorDetails((prev) =>
        prev ? { ...prev, [field]: [...(prev[field] || []), ...urls] } : prev,
      );

      if (field === "citizenshipDocuments") {
        setPreviewCitizenship((p) => [...p, ...previews]);
      } else {
        setPreviewTax((p) => [...p, ...previews]);
      }
    } catch (err) {
      handleError(err, "Failed to upload document");
    } finally {
      setLoading(`upload_${field}`, false);
      e.target.value = "";
    }
  };

  const handleRemoveDoc = (
    field: "citizenshipDocuments" | "taxDocuments",
    index: number,
  ) => {
    setVendorDetails((prev) => {
      if (!prev) return prev;
      const arr = [...(prev[field] || [])];
      arr.splice(index, 1);
      return { ...prev, [field]: arr };
    });
    if (field === "citizenshipDocuments") {
      setPreviewCitizenship((p) => p.filter((_, i) => i !== index));
    } else {
      setPreviewTax((p) => p.filter((_, i) => i !== index));
    }
  };

  // ── Payment options ───────────────────────────────────────────────────────
  const resetPaymentForm = () => {
    setCurrentPaymentType("");
    setWalletNumber("");
    setAccountName("");
    setBankName("");
    setAccountNumber("");
    setBankBranch("");
  };

  const handleAddPaymentOption = () => {
    if (!currentPaymentType) {
      showPopup("error", "Please select a payment method type");
      return;
    }
    const isDuplicate = vendorDetails?.paymentOptions?.some(
      (o) => o.paymentType === currentPaymentType,
    );
    if (isDuplicate) {
      showPopup("error", `${currentPaymentType} is already added`);
      return;
    }
    const isWallet = ["ESEWA", "KHALTI"].includes(currentPaymentType);
    if (isWallet) {
      if (!walletNumber.trim() || !accountName.trim()) {
        showPopup("error", "Wallet number and account name are required");
        return;
      }
      if (walletNumber.trim().length !== 10) {
        showPopup("error", "Wallet number must be exactly 10 digits");
        return;
      }
    }
    if (
      !isWallet &&
      (!accountNumber.trim() ||
        !bankName.trim() ||
        !accountName.trim() ||
        !bankBranch.trim())
    ) {
      showPopup("error", "All bank details are required");
      return;
    }

    const newOption: PaymentOption = {
      paymentType: currentPaymentType as PaymentOption["paymentType"],
      details: isWallet
        ? { walletNumber, accountName }
        : { accountNumber, bankName, accountName, branch: bankBranch },
      isActive: true,
    };

    setVendorDetails((prev) =>
      prev
        ? {
            ...prev,
            paymentOptions: [...(prev.paymentOptions || []), newOption],
          }
        : prev,
    );
    resetPaymentForm();
    showPopup("success", `${currentPaymentType} payment method added`);
  };

  const removePaymentOption = (index: number) => {
    setVendorDetails((prev) =>
      prev
        ? {
            ...prev,
            paymentOptions: prev.paymentOptions?.filter((_, i) => i !== index),
          }
        : prev,
    );
  };

  // ── Tab switching ─────────────────────────────────────────────────────────
  const handleTabChange = (tab: Tab) => {
    if (isEditing && originalDetails) {
      setVendorDetails(originalDetails);
      setPreviewCitizenship(originalDetails.citizenshipDocuments || []);
      setPreviewTax(originalDetails.taxDocuments || []);
      setIsEditing(false);
    }
    setActiveTab(tab);
    setCredentialsMode("idle");
    setFormState({ email: formState.email });
  };

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!vendorDetails) return showPopup("error", "Vendor details missing");
    if (vendorDetails.businessName.trim().length < 2)
      return showPopup("error", "Business name must be at least 2 characters");
    if (
      vendorDetails.phoneNumber &&
      !/^\+?[1-9]\d{1,14}$/.test(vendorDetails.phoneNumber)
    )
      return showPopup("error", "Enter a valid phone number");

    setLoading("save", true);
    try {
      const payload: Record<string, any> = {
        businessName: vendorDetails.businessName,
        phoneNumber: vendorDetails.phoneNumber,
        telePhone: vendorDetails.telePhone?.trim() || null,
        taxNumber: vendorDetails.taxNumber,
        citizenshipDocuments: vendorDetails.citizenshipDocuments,
        taxDocuments: vendorDetails.taxDocuments,
        paymentOptions: (vendorDetails.paymentOptions || []).map((opt) => ({
          paymentType: opt.paymentType,
          details: opt.details,
          qrCodeImage: opt.qrCodeImage ?? null,
          isActive: opt.isActive,
        })),
      };
      if (vendorDetails.businessAddress) {
        payload.district = vendorDetails.businessAddress;
      }

      const res = await axiosInstance.put(
        `/api/vendors/v2/${vendorId}`,
        payload,
      );

      if (res.data.success) {
        // Re-fetch so localStorage gets updated (fetchVendorDetails calls login())
        await fetchVendorDetails();
        setIsEditing(false);
        showPopup("success", "Profile updated successfully!");
      } else {
        showPopup("error", res.data.message || "Failed to update profile");
      }
    } catch (err) {
      handleError(err, "Failed to update profile");
    } finally {
      setLoading("save", false);
    }
  };

  // ── Credentials ───────────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    const email = vendorDetails?.email || formState.email;
    if (!email) return showPopup("error", "No email address found");
    setLoading("forgot", true);
    try {
      const endpoint = vendorDetails?.email
        ? "/api/vendors/forgot-password"
        : "/api/auth/forgot-password";
      await axiosInstance.post(endpoint, { email });
      showPopup("success", "Reset email sent! Check your inbox.");
      setCredentialsMode("reset");
    } catch (err) {
      handleError(err, "Failed to send reset email");
    } finally {
      setLoading("forgot", false);
    }
  };

  const handleResetPassword = async () => {
    if (formState.newPassword !== formState.confirmPassword)
      return showPopup("error", "Passwords do not match");
    if (!formState.token)
      return showPopup("error", "Please enter the reset token");
    if ((formState.newPassword?.length || 0) < 8)
      return showPopup("error", "Password must be at least 8 characters");

    setLoading("reset", true);
    try {
      const email = vendorDetails?.email || formState.email;
      const endpoint = vendorDetails?.email
        ? "/api/vendors/reset-password"
        : "/api/auth/reset-password";
      await axiosInstance.post(endpoint, {
        email,
        newPass: formState.newPassword,
        confirmPass: formState.confirmPassword,
        token: formState.token,
      });
      showPopup("success", "Password reset successfully!");
      setCredentialsMode("idle");
      setFormState((prev) => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
        token: "",
      }));
    } catch (err) {
      handleError(err, "Failed to reset password");
    } finally {
      setLoading("reset", false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!vendorDetails?.email)
      return showPopup("error", "Vendor email is unavailable");
    if (!deletePassword)
      return showPopup("error", "Enter your current password");
    if (deleteConfirmation !== "DELETE") {
      return showPopup("error", "Type DELETE exactly to confirm");
    }

    setLoading("deleteAccount", true);
    try {
      await axiosInstance.delete("/api/vendors/me", {
        data: {
          email: vendorDetails.email,
          password: deletePassword,
          confirmation: deleteConfirmation,
        },
      });
      logout();
    } catch (err) {
      handleError(err, "Failed to schedule account deletion");
    } finally {
      setLoading("deleteAccount", false);
    }
  };

  const setVendorField = (field: keyof VendorProfile, value: string) =>
    setVendorDetails((prev) => (prev ? { ...prev, [field]: value } : prev));

  const setFormField = (field: keyof FormState, value: string) =>
    setFormState((prev) => ({ ...prev, [field]: value }));

  // ── Render vendor details tab ─────────────────────────────────────────────
  const renderVendorDetails = () => {
    if (isLoading.fetch) return <SkeletonForm rows={8} />;
    if (!vendorDetails)
      return (
        <p className="vendor-profile-form__loading">
          Failed to load vendor information
        </p>
      );

    return (
      <div className="vendor-profile-form">
        <h2 className="vendor-profile-form__title">Vendor Profile</h2>

        {/* Avatar */}
        <div className="vp-avatar-section">
          <div className="vp-avatar-wrapper">
            <div
              className="vp-avatar"
              style={{
                backgroundColor: vendorDetails.businessName
                  ? getAvatarColor(vendorDetails.businessName)
                  : "#f97316",
              }}
            >
              {vendorDetails.profilePicture ? (
                <img
                  src={vendorDetails.profilePicture}
                  alt="Profile"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                vendorDetails.businessName?.[0]?.toUpperCase() || "?"
              )}
            </div>
            {isUploadingAvatar && (
              <div className="vp-avatar-overlay">
                <div className="vp-spinner" />
              </div>
            )}
            <button
              className={`vp-avatar-edit-btn ${isUploadingAvatar ? "vp-avatar-edit-btn--disabled" : ""}`}
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              title="Change profile picture"
              type="button"
            >
              <FaCamera size={12} />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
          </div>
          <div className="vp-avatar-meta">
            <p className="vp-avatar-name">{vendorDetails.businessName}</p>
            <p className="vp-avatar-email">{vendorDetails.email}</p>
            <span
              className={`vp-status-badge ${vendorDetails.isApproved ? "vp-status-badge--approved" : "vp-status-badge--pending"}`}
            >
              {vendorDetails.isApproved ? "✓ Approved" : "⏳ Pending"}
            </span>
          </div>
        </div>

        {/* Basic info */}
        <div className="vendor-profile-form__row">
          <Field label="Business Name">
            {isEditing ? (
              <input
                className="vendor-profile-form__input"
                value={vendorDetails.businessName}
                onChange={(e) => setVendorField("businessName", e.target.value)}
              />
            ) : (
              <Display value={vendorDetails.businessName} />
            )}
          </Field>
          <Field label="Email">
            <Display value={vendorDetails.email} />
          </Field>
        </div>

        <div className="vendor-profile-form__row">
          <Field label="Phone Number">
            {isEditing ? (
              <input
                className="vendor-profile-form__input"
                value={vendorDetails.phoneNumber}
                onChange={(e) => setVendorField("phoneNumber", e.target.value)}
                placeholder="+977XXXXXXXXXX"
              />
            ) : (
              <Display value={vendorDetails.phoneNumber} />
            )}
          </Field>
          <Field label="Telephone Number">
            {isEditing ? (
              <input
                className="vendor-profile-form__input"
                value={
                  vendorDetails.telePhone === "-"
                    ? ""
                    : vendorDetails.telePhone || ""
                }
                onChange={(e) => setVendorField("telePhone", e.target.value)}
                placeholder="e.g. 056-XXXXXXX"
              />
            ) : (
              <Display
                value={
                  vendorDetails.telePhone === "-" ? "" : vendorDetails.telePhone
                }
              />
            )}
          </Field>
        </div>

        <div className="vendor-profile-form__row">
          <Field label="District / Business Address">
            {isEditing ? (
              <input
                className="vendor-profile-form__input"
                value={vendorDetails.businessAddress}
                onChange={(e) =>
                  setVendorField("businessAddress", e.target.value)
                }
                placeholder="e.g. Kathmandu"
              />
            ) : (
              <Display value={vendorDetails.businessAddress} />
            )}
          </Field>
          <Field label="Province">
            <Display
              value={getProvinceForDistrict(vendorDetails.businessAddress)}
            />
          </Field>
        </div>

        <div className="vendor-profile-form__row">
          <Field label="Tax Number">
            {isEditing ? (
              <input
                className="vendor-profile-form__input"
                value={vendorDetails.taxNumber || ""}
                onChange={(e) => setVendorField("taxNumber", e.target.value)}
              />
            ) : (
              <Display value={vendorDetails.taxNumber} />
            )}
          </Field>
          <Field label="Business Registration Number">
            <Display value={vendorDetails.businessRegNumber} />
          </Field>
        </div>

        {/* Citizenship Docs */}
        <div className="vendor-profile-form__row">
          <div className="vendor-profile-form__group" style={{ width: "100%" }}>
            <label>Citizenship Documents</label>
            {isEditing && (
              <>
                <div
                  className="vendor-profile-form__upload-box"
                  onClick={() => citizenshipInputRef.current?.click()}
                >
                  {isLoading.upload_citizenshipDocuments ? (
                    <span className="upload-spinner" />
                  ) : (
                    <span>Click to upload citizenship documents</span>
                  )}
                </div>
                <input
                  ref={citizenshipInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) =>
                    handleArrayFileChange(e, "citizenshipDocuments")
                  }
                  className="vendor-profile-form__input-hidden"
                />
              </>
            )}
            <DocPreviewGrid
              previews={
                isEditing
                  ? previewCitizenship
                  : vendorDetails.citizenshipDocuments || []
              }
              canRemove={isEditing}
              onRemove={(i) => handleRemoveDoc("citizenshipDocuments", i)}
            />
          </div>
        </div>

        {/* Tax Docs */}
        <div className="vendor-profile-form__row">
          <div className="vendor-profile-form__group" style={{ width: "100%" }}>
            <label>Tax Documents</label>
            {isEditing && (
              <>
                <div
                  className="vendor-profile-form__upload-box"
                  onClick={() => taxInputRef.current?.click()}
                >
                  {isLoading.upload_taxDocuments ? (
                    <span className="upload-spinner" />
                  ) : (
                    <span>Click to upload tax documents</span>
                  )}
                </div>
                <input
                  ref={taxInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => handleArrayFileChange(e, "taxDocuments")}
                  className="vendor-profile-form__input-hidden"
                />
              </>
            )}
            <DocPreviewGrid
              previews={
                isEditing ? previewTax : vendorDetails.taxDocuments || []
              }
              canRemove={isEditing}
              onRemove={(i) => handleRemoveDoc("taxDocuments", i)}
            />
          </div>
        </div>

        {/* Payment Options */}
        <div className="vendor-profile-form__row">
          <div className="vendor-profile-form__group" style={{ width: "100%" }}>
            <label>Payment Methods</label>

            {!isEditing && !vendorDetails.paymentOptions?.length && (
              <div className="payment-empty-state">
                <div className="payment-empty-state__icon">
                  <FaWallet size={28} />
                </div>
                <h4 className="payment-empty-state__title">
                  No Payment Methods Added
                </h4>
                <p className="payment-empty-state__desc">
                  Switch to Edit Profile to add payment methods.
                </p>
                <button
                  className="payment-empty-state__cta"
                  onClick={() => setIsEditing(true)}
                >
                  Add Payment Method
                </button>
              </div>
            )}

            {!!vendorDetails.paymentOptions?.length && (
              <div className="payment-list">
                {vendorDetails.paymentOptions.map((opt, i) => (
                  <div key={i} className="payment-list__item">
                    <div className="payment-list__icon">
                      {["ESEWA", "KHALTI"].includes(opt.paymentType) ? (
                        <FaWallet color="#4caf50" />
                      ) : (
                        <FaUniversity color="#2196f3" />
                      )}
                    </div>
                    <div className="payment-list__info">
                      <span className="payment-list__type">
                        {opt.paymentType}
                      </span>
                      <span className="payment-list__detail">
                        {opt.details.accountName}
                        {" · "}
                        {opt.details.walletNumber || opt.details.accountNumber}
                      </span>
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        className="payment-list__remove"
                        onClick={() => removePaymentOption(i)}
                        title="Remove"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isEditing && (
              <div className="payment-add-form">
                <div className="vendor-profile-form__group">
                  <label>Add New Payment Method</label>
                  <select
                    className="vendor-profile-form__input"
                    value={currentPaymentType}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      setWalletNumber("");
                      setAccountName("");
                      setBankName("");
                      setAccountNumber("");
                      setBankBranch("");
                      setCurrentPaymentType(newType);
                    }}
                  >
                    <option value="">Select method…</option>
                    <option value="ESEWA">eSewa</option>
                    <option value="KHALTI">Khalti</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>

                {currentPaymentType && (
                  <>
                    <div className="payment-type-hint">
                      <strong>
                        {["ESEWA", "KHALTI"].includes(currentPaymentType)
                          ? "Digital Wallet"
                          : "Bank Transfer"}
                      </strong>
                      <p>
                        {["ESEWA", "KHALTI"].includes(currentPaymentType)
                          ? "Fast automated settlement. Recommended for frequent payouts."
                          : "Direct bank transfer. Suitable for larger settlements."}
                      </p>
                    </div>

                    {["ESEWA", "KHALTI"].includes(currentPaymentType) ? (
                      <>
                        <div className="vendor-profile-form__group">
                          <label>Wallet Number</label>
                          <input
                            className="vendor-profile-form__input"
                            value={walletNumber}
                            onChange={(e) => setWalletNumber(e.target.value)}
                            placeholder="e.g. 98XXXXXXXX"
                          />
                        </div>
                        <div className="vendor-profile-form__group">
                          <label>Account Name</label>
                          <input
                            className="vendor-profile-form__input"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="Account holder name"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="vendor-profile-form__group">
                          <label>Bank Name</label>
                          <input
                            className="vendor-profile-form__input"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. Nabil Bank"
                          />
                        </div>
                        <div className="vendor-profile-form__group">
                          <label>Account Number</label>
                          <input
                            className="vendor-profile-form__input"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Account number"
                          />
                        </div>
                        <div className="vendor-profile-form__group">
                          <label>Account Name</label>
                          <input
                            className="vendor-profile-form__input"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="Account holder name"
                          />
                        </div>
                        <div className="vendor-profile-form__group">
                          <label>Branch</label>
                          <input
                            className="vendor-profile-form__input"
                            value={bankBranch}
                            onChange={(e) => setBankBranch(e.target.value)}
                            placeholder="e.g. New Road Branch"
                          />
                        </div>
                      </>
                    )}

                    <button
                      type="button"
                      className="payment-add-btn"
                      onClick={handleAddPaymentOption}
                    >
                      <FaPlus /> Add Payment Method
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isEditing ? (
          <div className="vendor-profile-form__actions">
            <button
              className="vendor-btn-edit--primary"
              onClick={handleSave}
              disabled={isLoading.save}
            >
              {isLoading.save ? "Saving…" : "Save Changes"}
            </button>
            <button
              className="vendor-btn-edit--secondary"
              onClick={() => {
                setVendorDetails(originalDetails);
                setPreviewCitizenship(
                  originalDetails?.citizenshipDocuments || [],
                );
                setPreviewTax(originalDetails?.taxDocuments || []);
                setIsEditing(false);
                resetPaymentForm();
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="vendor-btn-edit--primary"
            style={{ marginTop: "24px" }}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>
    );
  };

  // ── Render credentials tab ────────────────────────────────────────────────
  const renderCredentials = () => {
    if (isLoading.fetch) return <SkeletonForm rows={5} />;
    return (
      <div className="vendor-credentials">
        <h2 className="vendor-credentials__main-title">Account Security</h2>

        {credentialsMode === "idle" && (
          <div className="vendor-credentials__section">
            <p className="vendor-credentials__description">
              Manage your password and account security settings.
            </p>
            <button
              className="vendor-btn vendor-btn--primary"
              style={{ marginTop: 12 }}
              onClick={() => setCredentialsMode("forgot")}
            >
              Change / Reset Password
            </button>
          </div>
        )}

        {credentialsMode === "forgot" && (
          <div className="vendor-credentials__section">
            <h3>Step 1 — Request Reset Token</h3>
            <p>
              A 6-digit reset token will be sent to your registered email
              address.
            </p>
            <div className="vendor-profile-form__group">
              <label>Email Address</label>
              <div className="vendor-credentials__email-display">
                {vendorDetails?.email || formState.email || "No email on file"}
              </div>
            </div>
            <div
              className="vendor-credentials__actions-row"
              style={{ marginTop: 20 }}
            >
              <button
                className="vendor-btn vendor-btn--secondary"
                onClick={() => setCredentialsMode("idle")}
              >
                Cancel
              </button>
              <button
                className="vendor-btn vendor-btn--primary"
                onClick={handleForgotPassword}
                disabled={isLoading.forgot}
              >
                {isLoading.forgot ? "Sending…" : "Send Reset Email"}
              </button>
            </div>
          </div>
        )}

        {credentialsMode === "reset" && (
          <div className="vendor-credentials__section">
            <h3>Step 2 — Set New Password</h3>
            <p>
              Enter the 6-digit token from your email and your new password.
            </p>
            <div className="vendor-profile-form__group">
              <label>Reset Token</label>
              <input
                type="text"
                className="vendor-profile-form__input"
                placeholder="6-digit token"
                maxLength={6}
                value={formState.token || ""}
                onChange={(e) => setFormField("token", e.target.value)}
              />
            </div>
            <div className="vendor-profile-form__group">
              <label>New Password</label>
              <input
                type="password"
                className="vendor-profile-form__input"
                placeholder="Min. 8 characters"
                value={formState.newPassword || ""}
                onChange={(e) => setFormField("newPassword", e.target.value)}
              />
            </div>
            <div className="vendor-profile-form__group">
              <label>Confirm Password</label>
              <input
                type="password"
                className="vendor-profile-form__input"
                placeholder="Repeat new password"
                value={formState.confirmPassword || ""}
                onChange={(e) =>
                  setFormField("confirmPassword", e.target.value)
                }
              />
            </div>
            <div
              className="vendor-credentials__actions-row"
              style={{ marginTop: 20 }}
            >
              <button
                className="vendor-btn vendor-btn--secondary"
                onClick={() => setCredentialsMode("forgot")}
              >
                ← Back
              </button>
              <button
                className="vendor-btn vendor-btn--primary"
                onClick={handleResetPassword}
                disabled={isLoading.reset}
              >
                {isLoading.reset ? "Resetting…" : "Reset Password"}
              </button>
            </div>
          </div>
        )}

        <section
          style={{
            marginTop: 32,
            padding: 20,
            border: "1px solid #fecaca",
            borderRadius: 10,
            background: "#fff7f7",
          }}
        >
          <h3 style={{ color: "#b91c1c", marginTop: 0 }}>
            Delete vendor account
          </h3>
          <p>
            Your store will be paused immediately. You can reactivate it with
            your email and password within 30 days. After that, sensitive
            account data is permanently anonymized.
          </p>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div className="vendor-profile-form__group">
              <label>Current password</label>
              <input
                type="password"
                className="vendor-profile-form__input"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="vendor-profile-form__group">
              <label>Type DELETE to confirm</label>
              <input
                type="text"
                className="vendor-profile-form__input"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>
            <button
              className="vendor-btn vendor-btn--danger"
              onClick={handleDeleteAccount}
              disabled={isLoading.deleteAccount}
              type="button"
            >
              {isLoading.deleteAccount
                ? "Scheduling deletion…"
                : "Schedule account deletion"}
            </button>
          </div>
        </section>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <>
      <Popup
        open={!!popup}
        closeOnDocumentClick
        onClose={() => setPopup(null)}
        contentStyle={{
          borderRadius: "12px",
          maxWidth: "400px",
          background: "transparent",
          padding: 0,
          border: "none",
        }}
        overlayStyle={{
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div className={`vendor-popup-content ${popup?.type}`}>
          <div className="vendor-popup-header">
            <span className="vendor-popup-icon">
              {popup?.type === "success" ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </span>
            <span className="vendor-popup-title">
              {popup?.type === "success" ? "Success" : "Error"}
            </span>
          </div>
          <div className="vendor-popup-body">
            <p>{popup?.content}</p>
          </div>
          <button
            className="vendor-popup-close-btn"
            onClick={() => setPopup(null)}
          >
            Close
          </button>
        </div>
      </Popup>

      <div className="vendor-profile">
        <Sidebar />
        <div className="vendor-profile-main">
          <VendorHeader showSearch={false} title="Profile Management" />
          <div
            className={`vendor-profile-card ${activeTab === "details" || activeTab === "credentials" ? "vendor-profile-card--wide" : ""}`}
          >
            {/* Sidebar nav */}
            <div className="vendor-profile-sidebar">
              {isLoading.fetch ? (
                <>
                  <div className="vendor-skeleton vendor-skeleton-avatar" />
                  <div className="vendor-skeleton vendor-skeleton-button" />
                  <div className="vendor-skeleton vendor-skeleton-button" />
                </>
              ) : (
                <>
                  <div className="vendor-profile-sidebar__avatar-wrapper">
                    <div
                      className="vendor-profile-sidebar__avatar"
                      style={{
                        backgroundColor: vendorDetails?.businessName
                          ? getAvatarColor(vendorDetails.businessName)
                          : "#f97316",
                      }}
                    >
                      {vendorDetails?.profilePicture ? (
                        <img
                          src={vendorDetails.profilePicture}
                          alt="Profile"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "inherit",
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        vendorDetails?.businessName?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    {isUploadingAvatar && (
                      <div className="vp-avatar-overlay">
                        <div className="vp-spinner" />
                      </div>
                    )}
                    <button
                      className={`vp-avatar-edit-btn ${isUploadingAvatar ? "vp-avatar-edit-btn--disabled" : ""}`}
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      title="Change profile picture"
                      type="button"
                    >
                      <FaCamera size={11} />
                    </button>
                  </div>

                  {(["details", "credentials"] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`vendor-profile-sidebar__button ${activeTab === tab ? "vendor-profile-sidebar__button--primary" : "vendor-profile-sidebar__button--secondary"}`}
                    >
                      {tab === "details"
                        ? "Manage Details"
                        : "Change Credentials"}
                    </button>
                  ))}
                </>
              )}
            </div>

            {activeTab === "details" && (
              <div className="vendor-profile-content">
                {renderVendorDetails()}
              </div>
            )}
            {activeTab === "credentials" && (
              <div className="vendor-profile-content">
                {renderCredentials()}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="vendor-profile-form__group vendor-profile-form__group--half">
    <label>{label}</label>
    {children}
  </div>
);

const Display: React.FC<{ value?: string | null }> = ({ value }) => (
  <div className="vendor-profile-form__display">{value || "Not provided"}</div>
);

const DocPreviewGrid: React.FC<{
  previews: string[];
  canRemove: boolean;
  onRemove: (i: number) => void;
}> = ({ previews, canRemove, onRemove }) => {
  if (!previews.length)
    return <div className="vendor-profile-form__display">Not provided</div>;
  return (
    <div className="vendor-profile-form__preview">
      {previews.map((src, i) => (
        <div key={i} className="vendor-profile-form__preview-item">
          <img src={src} alt={`doc-${i}`} />
          {canRemove && (
            <button
              className="vendor-profile-form__preview-remove"
              onClick={() => onRemove(i)}
              type="button"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const SkeletonForm: React.FC<{ rows: number }> = ({ rows }) => (
  <div className="vendor-profile-form">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="vendor-skeleton vendor-skeleton-form-group" />
    ))}
  </div>
);

export default ProfilePage;
