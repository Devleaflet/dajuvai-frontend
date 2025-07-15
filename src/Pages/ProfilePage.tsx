import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVendorAuth } from "../context/VendorAuthContext";
import { VendorAuthService } from "../services/vendorAuthService";
import { Sidebar } from "../Components/Sidebar";
import VendorHeader from "../Components/VendorHeader";
import "../Styles/ProfilePage.css";

const ProfilePage: React.FC = () => {
  const { authState, logout } = useVendorAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!authState.vendor) {
      navigate('/login');
    }
  }, [authState.vendor, navigate]);

  const defaultProfilePicture = () => {
    if (!authState.vendor?.businessName) return '/default-profile.png';
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(authState.vendor.businessName)}&background=${color.substring(1)}&color=fff&size=200`;
  };

  const handleLogout = () => {
    console.log("ProfilePage logout - using comprehensive logout");
    VendorAuthService.comprehensiveLogout();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg(null);
    const res = await VendorAuthService.forgotPassword(forgotEmail);
    setForgotMsg(res.message);
    setForgotLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg(null);
    const res = await VendorAuthService.resetPassword(newPass, confirmPass, resetToken);
    setResetMsg(res.message);
    setResetLoading(false);
  };

  const closeModal = () => {
    setShowForgotModal(false);
    setForgotEmail("");
    setForgotMsg(null);
    setForgotLoading(false);
    setResetToken("");
    setNewPass("");
    setConfirmPass("");
    setResetMsg(null);
    setResetLoading(false);
  };

  return (
    <div className="vendor-dash-container">
      <Sidebar />
      <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
        <VendorHeader title="Profile Management" showSearch={false} />
        <main className="dashboard__main">
          <section className="profile-update-card">
            <h2 className="profile-update-card__title">Vendor Profile</h2>
            <div className="profile-update-card__image">
              <div className="profile-update-card__avatar-container">
                <img
                  src={authState.vendor?.profilePicture || defaultProfilePicture()}
                  alt="Profile"
                  className="profile-update-card__avatar"
                />
              </div>
            </div>

            <div className="profile-update-card__form">
              <div className="profile-update-card__form-group">
                <label className="profile-update-card__label">Business Name</label>
                <div className="profile-update-card__value">{authState.vendor?.businessName}</div>
              </div>

              <div className="profile-update-card__form-group">
                <label className="profile-update-card__label">Email</label>
                <div className="profile-update-card__value">{authState.vendor?.email}</div>
              </div>

              <div className="profile-update-card__form-group">
                <label className="profile-update-card__label">Phone Number</label>
                <div className="profile-update-card__value">{authState.vendor?.phoneNumber}</div>
              </div>

              <div className="profile-update-card__form-group">
                <label className="profile-update-card__label">Business Address</label>
                <div className="profile-update-card__value">{authState.vendor?.businessAddress}</div>
              </div>

              <div className="profile-update-card__actions">
                <button
                  type="button"
                  className="profile-update-card__button profile-update-card__button--logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
                <button
                  type="button"
                  className="profile-update-card__button profile-update-card__button--forgot"
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          </section>

          {/* Modal for Forgot/Reset Password */}
          {showForgotModal && (
            <div className="vercel-modal-backdrop">
              <div className="vercel-modal">
                <button className="vercel-modal__close" onClick={closeModal} aria-label="Close">&times;</button>
                <div className="vercel-modal__content">
                  <h2 className="vercel-modal__heading">Forgot Password</h2>
                  <form onSubmit={handleForgotPassword} className="vercel-modal__form">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      className="vercel-modal__input"
                    />
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="vercel-modal__button"
                    >
                      {forgotLoading ? "Sending..." : "Send Reset Email"}
                    </button>
                    {forgotMsg && <div className={`vercel-modal__msg ${forgotMsg.toLowerCase().includes("success") ? "vercel-modal__msg--success" : "vercel-modal__msg--error"}`}>{forgotMsg}</div>}
                  </form>
                  <div className="vercel-modal__divider" />
                  <h2 className="vercel-modal__heading">Reset Password</h2>
                  <form onSubmit={handleResetPassword} className="vercel-modal__form">
                    <input
                      type="text"
                      placeholder="Reset token"
                      value={resetToken}
                      onChange={e => setResetToken(e.target.value)}
                      required
                      className="vercel-modal__input"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      required
                      className="vercel-modal__input"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)}
                      required
                      className="vercel-modal__input"
                    />
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="vercel-modal__button vercel-modal__button--green"
                    >
                      {resetLoading ? "Resetting..." : "Reset Password"}
                    </button>
                    {resetMsg && <div className={`vercel-modal__msg ${resetMsg.toLowerCase().includes("success") ? "vercel-modal__msg--success" : "vercel-modal__msg--error"}`}>{resetMsg}</div>}
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;