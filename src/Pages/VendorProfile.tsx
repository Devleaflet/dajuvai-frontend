// VendorProfile.tsx
import VendorHeader from "../Components/VendorHeader";
import { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { VendorAuthService } from "../services/vendorAuthService";
import { useVendorAuth } from "../context/VendorAuthContext";
import axiosInstance from "../api/axiosInstance";
import { API_BASE_URL } from "../config";

const getAvatarColor = (name: string) => {
  const colors = [
    "#4285F4",
    "#DB4437",
    "#F4B400",
    "#0F9D58",
    "#673AB7",
    "#0097A7",
  ];
  const charCodeSum = name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length];
};

const VendorProfile: React.FC = () => {
  const [isMobile] = useState<boolean>(window.innerWidth < 768);
  const [docketHeight] = useState<number>(80);
  const { authState, login } = useVendorAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset password state
  const [resetToken, setResetToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      const res = await VendorAuthService.forgotPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch {
      setForgotMsg("Failed to send reset email. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setResetMsg("Passwords do not match.");
      return;
    }
    setResetLoading(true);
    setResetMsg(null);
    try {
      const res = await VendorAuthService.resetPassword(
        newPass,
        confirmPass,
        resetToken,
      );
      setResetMsg(res.message);
    } catch {
      setResetMsg("Failed to reset password. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleEditClick = () => {
    if (!isUploadingAvatar) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !authState.vendor) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image (PNG, JPG, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Step 1: Upload image to Cloudinary via backend
      const formData = new FormData();
      formData.append("image", file);

      const vendorToken = localStorage.getItem("vendorToken");

      const uploadResponse = await fetch(
        `${API_BASE_URL}/api/image?folder=profile-pictures`,
        {
          method: "POST",
          headers: vendorToken
            ? { Authorization: `Bearer ${vendorToken}` }
            : {},
          body: formData,
        },
      );

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.message || "Failed to upload image");
      }

      const profilePictureUrl = uploadResult.data as string;

      // Step 2: Update vendor profile with the new image URL
      // Use the v2 update endpoint or the regular one
      const updateResponse = await axiosInstance.put(
        `/api/vendors/v2/${authState.vendor.id}`,
        { profilePicture: profilePictureUrl },
      );

      if (updateResponse.data.success) {
        // Update local auth state with new profile picture
        login(authState.token!, {
          ...authState.vendor,
          profilePicture: profilePictureUrl,
        });
        toast.success("Profile picture updated successfully!");
      } else {
        throw new Error(
          updateResponse.data.message || "Failed to save profile picture",
        );
      }
    } catch (error) {
      console.error("[VendorProfile] handleAvatarChange - Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile picture",
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
      <VendorHeader title="Profile Management" showSearch={false} />

      <style>{`
        .vp-card {
          max-width: 480px;
          margin: 1.5rem auto;
          padding: 32px 28px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
          border: 1px solid #f0f0f0;
        }

        .vp-card--profile {
          text-align: center;
          padding-top: 40px;
        }

        .vp-card__title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 20px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid #f5f5f5;
        }

        /* Avatar Container */
        .vp-avatar-wrapper {
          position: relative;
          display: inline-block;
          width: 112px;
          height: 112px;
          margin-bottom: 16px;
        }

        .vp-avatar {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: 700;
          color: #fff;
          overflow: hidden;
          border: 3px solid #fff;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
          transition: box-shadow 0.2s ease;
        }

        .vp-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .vp-avatar-wrapper:hover .vp-avatar {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
        }

        /* Edit Button Overlay */
        .vp-avatar-edit {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #4285F4;
          border: 3px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(66, 133, 244, 0.4);
          z-index: 2;
        }

        .vp-avatar-edit:hover {
          background: #3367d6;
          transform: scale(1.08);
          box-shadow: 0 3px 10px rgba(66, 133, 244, 0.5);
        }

        .vp-avatar-edit:active {
          transform: scale(0.95);
        }

        .vp-avatar-edit--disabled {
          background: #9e9e9e;
          cursor: wait;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .vp-avatar-edit--disabled:hover {
          background: #9e9e9e;
          transform: none;
        }

        .vp-avatar-edit svg {
          width: 15px;
          height: 15px;
          fill: #fff;
        }

        /* Upload overlay on avatar */
        .vp-avatar-uploading {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        .vp-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: vp-spin 0.7s linear infinite;
        }

        @keyframes vp-spin {
          to { transform: rotate(360deg); }
        }

        .vp-name {
          font-size: 20px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 4px 0;
        }

        .vp-email {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .vp-badge {
          display: inline-block;
          margin-top: 10px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .vp-badge--verified {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .vp-badge--unverified {
          background: #fff3e0;
          color: #e65100;
        }

        /* Form Styles */
        .vp-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .vp-input-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .vp-input-group label {
          font-size: 13px;
          font-weight: 500;
          color: #4a4a6a;
        }

        .vp-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1.5px solid #e0e0e0;
          font-size: 14px;
          color: #333;
          background: #fafafa;
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }

        .vp-input:focus {
          border-color: #4285F4;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
        }

        .vp-input::placeholder {
          color: #b0b0b0;
        }

        .vp-btn {
          padding: 11px 20px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.3px;
          margin-top: 4px;
        }

        .vp-btn:active {
          transform: scale(0.98);
        }

        .vp-btn--primary {
          background: #4285F4;
          color: #fff;
        }

        .vp-btn--primary:hover:not(:disabled) {
          background: #3367d6;
          box-shadow: 0 2px 8px rgba(66, 133, 244, 0.35);
        }

        .vp-btn--success {
          background: #0F9D58;
          color: #fff;
        }

        .vp-btn--success:hover:not(:disabled) {
          background: #0b8043;
          box-shadow: 0 2px 8px rgba(15, 157, 88, 0.35);
        }

        .vp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .vp-msg {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
        }

        .vp-msg--success {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #c8e6c9;
        }

        .vp-msg--error {
          background: #fce4ec;
          color: #c62828;
          border: 1px solid #f8bbd0;
        }

        .vp-divider {
          height: 1px;
          background: #f0f0f0;
          margin: 8px 0;
        }

        .vp-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .vp-info-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .vp-info-value {
          font-size: 14px;
          color: #1a1a2e;
          font-weight: 500;
        }
      `}</style>

      <main
        className="dashboard__main"
        style={{
          paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px",
        }}
      >
        {/* Profile Card */}
        <div className="vp-card vp-card--profile">
          <div className="vp-avatar-wrapper">
            <div
              className="vp-avatar"
              style={{
                backgroundColor: authState.vendor?.businessName
                  ? getAvatarColor(authState.vendor.businessName)
                  : "#f97316",
              }}
            >
              {authState.vendor?.profilePicture ? (
                <img
                  src={authState.vendor.profilePicture}
                  alt={authState.vendor.businessName || "Vendor"}
                />
              ) : (
                authState.vendor?.businessName?.[0]?.toUpperCase() || "?"
              )}
            </div>

            {/* Upload spinner overlay */}
            {isUploadingAvatar && (
              <div className="vp-avatar-uploading">
                <div className="vp-spinner" />
              </div>
            )}

            {/* Edit button - bottom right */}
            <button
              className={`vp-avatar-edit ${isUploadingAvatar ? "vp-avatar-edit--disabled" : ""}`}
              onClick={handleEditClick}
              disabled={isUploadingAvatar}
              title="Change profile picture"
              type="button"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleAvatarChange}
              disabled={isUploadingAvatar}
              style={{ display: "none" }}
            />
          </div>

          <p className="vp-name">
            {authState.vendor?.businessName || "Unknown Vendor"}
          </p>
          <p className="vp-email">{authState.vendor?.email || "No email"}</p>

          {authState.vendor && (
            <span
              className={`vp-badge ${
                (authState.vendor as any).isApproved
                  ? "vp-badge--verified"
                  : "vp-badge--unverified"
              }`}
            >
              {(authState.vendor as any).isApproved
                ? "✓ Approved"
                : "⏳ Pending Approval"}
            </span>
          )}

          {/* Vendor details */}
          {authState.vendor && (
            <div style={{ marginTop: 20, textAlign: "left" }}>
              <div className="vp-divider" />
              {(authState.vendor as any).phoneNumber && (
                <>
                  <div className="vp-info-row">
                    <span className="vp-info-label">Phone</span>
                    <span className="vp-info-value">
                      {(authState.vendor as any).phoneNumber}
                    </span>
                  </div>
                  <div className="vp-divider" />
                </>
              )}
              {(authState.vendor as any).district?.name && (
                <>
                  <div className="vp-info-row">
                    <span className="vp-info-label">District</span>
                    <span className="vp-info-value">
                      {(authState.vendor as any).district.name}
                    </span>
                  </div>
                  <div className="vp-divider" />
                </>
              )}
            </div>
          )}
        </div>

        {/* Forgot Password Card */}
        <div className="vp-card">
          <h2 className="vp-card__title">Forgot Password</h2>
          <form onSubmit={handleForgotPassword} className="vp-form">
            <div className="vp-input-group">
              <label htmlFor="forgot-email">Email Address</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your registered email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="vp-input"
              />
            </div>
            <button
              type="submit"
              disabled={forgotLoading}
              className="vp-btn vp-btn--primary"
            >
              {forgotLoading ? "Sending..." : "Send Reset Email"}
            </button>
            {forgotMsg && (
              <div
                className={`vp-msg ${
                  forgotMsg.toLowerCase().includes("success") ||
                  forgotMsg.toLowerCase().includes("sent")
                    ? "vp-msg--success"
                    : "vp-msg--error"
                }`}
              >
                {forgotMsg}
              </div>
            )}
          </form>
        </div>

        {/* Reset Password Card */}
        <div className="vp-card">
          <h2 className="vp-card__title">Reset Password</h2>
          <form onSubmit={handleResetPassword} className="vp-form">
            <div className="vp-input-group">
              <label htmlFor="reset-token">Reset Token</label>
              <input
                id="reset-token"
                type="text"
                placeholder="Enter 6-digit token from email"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
                maxLength={6}
                className="vp-input"
              />
            </div>
            <div className="vp-input-group">
              <label htmlFor="new-pass">New Password</label>
              <input
                id="new-pass"
                type="password"
                placeholder="Enter new password (min 8 chars)"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
                minLength={8}
                className="vp-input"
              />
            </div>
            <div className="vp-input-group">
              <label htmlFor="confirm-pass">Confirm Password</label>
              <input
                id="confirm-pass"
                type="password"
                placeholder="Confirm new password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                required
                minLength={8}
                className="vp-input"
              />
            </div>
            <button
              type="submit"
              disabled={resetLoading}
              className="vp-btn vp-btn--success"
            >
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
            {resetMsg && (
              <div
                className={`vp-msg ${
                  resetMsg.toLowerCase().includes("success")
                    ? "vp-msg--success"
                    : "vp-msg--error"
                }`}
              >
                {resetMsg}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default VendorProfile;
