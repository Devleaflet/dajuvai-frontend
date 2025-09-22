import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import axiosInstance from "../api/axiosInstance";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminProfile.css";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";

interface AdminDetails {
  id?: number;
  fullName: string;
  username: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
  phoneNumber: string;
}

interface FormState {
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  token?: string;
}

type Tab = "details" | "credentials";
type CredentialsMode = "change" | "forgot" | "reset";

const AdminProfile: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [isEditing, setIsEditing] = useState(false);
  const [adminDetails, setAdminDetails] = useState<AdminDetails | null>({
    fullName: "",
    username: "",
    email: "",
    phoneNumber: "",
    role: "",
  });
  const [originalDetails, setOriginalDetails] = useState<AdminDetails | null>(null);
  const [formState, setFormState] = useState<FormState>({ email: "" });
  const [credentialsMode, setCredentialsMode] = useState<CredentialsMode>("change");
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    content: string;
  } | null>(null);

  const { user, isLoading: isAuthLoading, login, token } = useAuth();
  const adminId = user?.id;

  const getAvatarColor = (username: string) => {
    const colors = [
      "#4285F4",
      "#DB4437",
      "#F4B400",
      "#0F9D58",
      "#673AB7",
      "#0097A7",
    ];
    const charCodeSum = username
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  const showPopup = (type: "success" | "error", content: string) => {
    setPopup({ type, content });
    setTimeout(() => setPopup(null), 3000);
  };

  const validateUsername = (username: string) =>
    username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
  const validatePhoneNumber = (phoneNumber: string) =>
    /^[0-9]{10}$/.test(phoneNumber);
  const validateFullName = (fullName: string) => fullName.trim().length >= 2;

  const handleError = (error: unknown, defaultMsg: string) => {
    if (!axios.isAxiosError(error)) return showPopup("error", defaultMsg);
    const { status, data } = error.response || {};
    const messages: { [key: number]: string } = {
      400: data?.message || "Invalid input. Please check your data.",
      401: "Unauthorized: Invalid or missing token.",
      403: "Forbidden: Not authorized.",
      404: "Resource not found.",
      409: data?.message || "This username is already in use.",
      410: "Token expired. Please try again.",
    };
    if (typeof status === "number" && messages[status]) {
      showPopup("error", messages[status]);
    } else {
      showPopup("error", defaultMsg);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!adminId) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            login(null, {
              id: data.data.userId,
              email: data.data.email,
              role: data.data.role,
              username: data.data.email.split("@")[0],
              isVerified: true,
              provider: data.data.provider,
            });
          } else {
            showPopup(
              "error",
              "Authentication details missing. Please log in again."
            );
          }
        })
        .catch(() => {
          showPopup(
            "error",
            "Authentication details missing. Please log in again."
          );
        });
      return;
    }

    const fetchAdminDetails = async () => {
      setIsLoading((prev) => ({ ...prev, fetchAdmin: true }));
      try {
        const headers: Record<string, string> = {};
        const authToken = token || localStorage.getItem("authToken");

        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await axiosInstance.get(`/api/auth/users/${adminId}`, {
          headers,
          withCredentials: true,
          timeout: 5000,
        });

        const adminData = response.data.data;
        const normalizedAdminData = {
          ...adminData,
          fullName: adminData.fullName || "",
          phoneNumber: adminData.phoneNumber || "",
        };

        setAdminDetails(normalizedAdminData);
        setOriginalDetails(normalizedAdminData);
        setFormState((prev) => ({ ...prev, email: adminData.email }));
      } catch (error) {
        handleError(error, "Failed to load admin details");
        setAdminDetails(null);
      } finally {
        setIsLoading((prev) => ({ ...prev, fetchAdmin: false }));
      }
    };
    fetchAdminDetails();
  }, [adminId, isAuthLoading, login, token]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof FormState | keyof AdminDetails
  ) => {
    const value = e.target.value;

    if (field in (adminDetails || {})) {
      setAdminDetails((prev) => (prev ? { ...prev, [field]: value } : null));
    } else {
      setFormState((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleTabChange = (tab: Tab) => {
    if (isEditing && originalDetails) {
      setAdminDetails(originalDetails);
      setIsEditing(false);
    }
    setActiveTab(tab);
    setCredentialsMode("change");
    setFormState({ email: formState.email });
  };

  const handleSave = async () => {
    if (!adminDetails) return showPopup("error", "Admin details missing.");
    if (!validateUsername(adminDetails.username))
      return showPopup(
        "error",
        "Username must be 3+ characters and alphanumeric."
      );
    if (!validateFullName(adminDetails.fullName))
      return showPopup("error", "Full name must be at least 2 characters.");
    if (
      adminDetails.phoneNumber &&
      !validatePhoneNumber(adminDetails.phoneNumber)
    )
      return showPopup("error", "Phone number must be 10 digits.");

    setIsLoading((prev) => ({ ...prev, saveAdmin: true }));

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const authToken = token || localStorage.getItem("authToken");
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const requestData = {
        fullName: adminDetails.fullName,
        username: adminDetails.username,
        phoneNumber: adminDetails.phoneNumber,
      };

      const response = await axiosInstance.put(
        `/api/auth/users/${adminId}`,
        requestData,
        {
          withCredentials: true,
          headers,
        }
      );

      if (response.data.success) {
        const updatedData = response.data.data;
        const normalizedUpdatedData = {
          ...updatedData,
        };

        setAdminDetails(normalizedUpdatedData);
        setOriginalDetails(normalizedUpdatedData);
        setIsEditing(false);
        showPopup("success", "Profile updated successfully!");
      } else {
        showPopup("error", response.data.message || "Failed to update profile");
      }
    } catch (error) {
      handleError(error, "Failed to update profile");
    } finally {
      setIsLoading((prev) => ({ ...prev, saveAdmin: false }));
    }
  };

  const handleForgotPassword = async () => {
    if (!formState.email)
      return showPopup("error", "Please enter your email address");
    setIsLoading((prev) => ({ ...prev, forgot: true }));
    try {
      await axiosInstance.post(`/api/auth/forgot-password`, {
        email: formState.email,
      });
      showPopup("success", "Password reset email sent! Check your inbox.");
      setCredentialsMode("reset");
    } catch (error) {
      handleError(error, "Failed to send reset email");
    } finally {
      setIsLoading((prev) => ({ ...prev, forgot: false }));
    }
  };

  const handleResetPassword = async () => {
    if (formState.newPassword !== formState.confirmPassword)
      return showPopup("error", "Passwords do not match!");
    if (!formState.token)
      return showPopup("error", "Please enter the reset token");
    setIsLoading((prev) => ({ ...prev, reset: true }));
    try {
      await axiosInstance.post(`/api/auth/reset-password`, {
        newPass: formState.newPassword,
        confirmPass: formState.confirmPassword,
        token: formState.token,
      });
      showPopup("success", "Password reset successful!");
      setCredentialsMode("change");
      setFormState((prev) => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
        token: "",
      }));
    } catch (error) {
      handleError(error, "Failed to reset password");
    } finally {
      setIsLoading((prev) => ({ ...prev, reset: false }));
    }
  };

  const renderAdminDetails = () => {
    if (isLoading.fetchAdmin) {
      return (
        <div className="admin-profile-form">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="admin-skeleton admin-skeleton-form-group"
              style={{ height: i === 0 ? "40px" : i === 3 ? "48px" : "auto" }}
            />
          ))}
        </div>
      );
    }

    if (!adminDetails)
      return (
        <div className="admin-profile-form__loading">
          Failed to load admin information
        </div>
      );

    return (
      <div className="admin-profile-form">
        <h2 className="admin-profile-form__title">Admin Profile</h2>
        <div className="admin-profile-form__row">
          <div className="admin-profile-form__group admin-profile-form__group--half">
            <label>Full Name</label>
            {isEditing ? (
              <input
                type="text"
                name="fullName"
                value={adminDetails.fullName ?? ""}
                onChange={(e) => handleInputChange(e, "fullName")}
                className="admin-profile-form__input"
              />
            ) : (
              <div className="admin-profile-form__display">{adminDetails.fullName || "Not provided"}</div>
            )}
          </div>
          <div className="admin-profile-form__group admin-profile-form__group--half">
            <label>Username</label>
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={adminDetails.username ?? ""}
                onChange={(e) => handleInputChange(e, "username")}
                className="admin-profile-form__input"
              />
            ) : (
              <div className="admin-profile-form__display">{adminDetails.username || "Not provided"}</div>
            )}
          </div>
        </div>
        <div className="admin-profile-form__row">
          <div className="admin-profile-form__group admin-profile-form__group--half">
            <label>Phone Number</label>
            {isEditing ? (
              <input
                type="text"
                name="phoneNumber"
                value={adminDetails.phoneNumber ?? ""}
                onChange={(e) => handleInputChange(e, "phoneNumber")}
                className="admin-profile-form__input"
              />
            ) : (
              <div className="admin-profile-form__display">{adminDetails.phoneNumber || "Not provided"}</div>
            )}
          </div>
        </div>
        {isEditing ? (
          <div className="admin-profile-form__actions">
            <button
              className="admin-btn-edit--primary"
              onClick={handleSave}
              disabled={isLoading.saveAdmin}
            >
              {isLoading.saveAdmin ? "Saving..." : "Save Changes"}
            </button>
            <button
              className="admin-btn-edit--secondary"
              onClick={() => {
                setAdminDetails(originalDetails);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="admin-btn-edit--primary"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>
    );
  };

  const renderCredentials = () => {
    if (isLoading.fetchAdmin) {
      return (
        <div className="admin-credentials">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="admin-skeleton admin-skeleton-form-group"
              style={{ height: i === 0 ? "40px" : i === 4 ? "48px" : "auto" }}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="admin-credentials">
        <h2 className="admin-credentials__main-title">Account Security</h2>
        <div className="admin-credentials__header">
          <p className="admin-credentials__description">
            Manage your password and account security
          </p>
          <div className="admin-credentials__actions">
            <button
              className={`admin-profile-form__help ${
                credentialsMode === "forgot" ? "active" : ""
              }`}
              onClick={() => setCredentialsMode("forgot")}
            >
              Forgot Password
            </button>
          </div>
        </div>
        {credentialsMode === "forgot" && (
          <div className="admin-credentials__section">
            <h3>Reset Password</h3>
            <p>Enter your email address to receive a reset token.</p>
            <div className="admin-profile-form__group">
              <label className="admin-profile-form__label">Email Address</label>
              <div className="admin-credentials__email-display">
                {formState.email || adminDetails?.email || "No email available"}
              </div>
            </div>
            <button
              className="admin-btn admin-btn--primary"
              onClick={handleForgotPassword}
              disabled={isLoading.forgot}
            >
              {isLoading.forgot ? "Sending..." : "Send Reset Email"}
            </button>
          </div>
        )}
        {credentialsMode === "reset" && (
          <div className="admin-credentials__section">
            <h3>Enter Reset Token</h3>
            <p>Check your email for the reset token and enter your new password.</p>
            <div className="admin-profile-form__group">
              <label className="admin-profile-form__label">Reset Token</label>
              <input
                type="text"
                name="token"
                placeholder="Enter reset token"
                value={formState.token ?? ""}
                onChange={(e) => handleInputChange(e, "token")}
                className="admin-profile-form__input"
              />
            </div>
            <div className="admin-profile-form__group">
              <label className="admin-profile-form__label">New Password</label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={formState.newPassword ?? ""}
                onChange={(e) => handleInputChange(e, "newPassword")}
                className="admin-profile-form__input"
              />
            </div>
            <div className="admin-profile-form__group">
              <label className="admin-profile-form__label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formState.confirmPassword ?? ""}
                onChange={(e) => handleInputChange(e, "confirmPassword")}
                className="admin-profile-form__input"
              />
            </div>
            <div className="admin-credentials__actions-row">
              <button
                className="admin-btn admin-btn--secondary"
                onClick={() => setCredentialsMode("forgot")}
              >
                Back to Email
              </button>
              <button
                className="admin-btn admin-btn--primary"
                onClick={handleResetPassword}
                disabled={isLoading.reset}
              >
                {isLoading.reset ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Popup
        open={!!popup}
        closeOnDocumentClick
        onClose={() => {
          setPopup(null);
          window.location.reload();
        }}
        contentStyle={{
          borderRadius: "12px",
          maxWidth: "400px",
          background: "transparent",
          padding: 0,
          border: "none",
        }}
        overlayStyle={{
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div className={`admin-popup-content ${popup?.type}`}>
          <div className="admin-popup-header">
            <span className="admin-popup-icon">
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            </span>
            <span className="admin-popup-title">
              {popup?.type === "success" ? "Success" : "Error"}
            </span>
          </div>
          <div className="admin-popup-body">
            <p>{popup?.content}</p>
          </div>
          <button
            className="admin-popup-close-btn"
            onClick={() => setPopup(null)}
          >
            Close
          </button>
        </div>
      </Popup>
      <div className="admin-profile">
        <AdminSidebar />
        <div className="admin-profile-main">
          <Header showSearch={false} title="Admin Profile" />
          <div className={`admin-profile-card ${activeTab === "details" || activeTab === "credentials" ? "admin-profile-card--wide" : ""}`}>
            <div className="admin-profile-sidebar">
              {isLoading.fetchAdmin ? (
                <>
                  <div className="admin-skeleton admin-skeleton-avatar" />
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="admin-skeleton admin-skeleton-button"
                    />
                  ))}
                </>
              ) : (
                <>
                  <div
                    className="admin-profile-sidebar__avatar"
                    style={{
                      backgroundColor: adminDetails?.username
                        ? getAvatarColor(adminDetails.username)
                        : "#f97316",
                    }}
                  >
                    {adminDetails?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  {(["details", "credentials"] as Tab[]).map((tab) => {
                    if (tab === "credentials" && user?.provider === "google") return null;
                    return (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`admin-profile-sidebar__button ${
                          activeTab === tab
                            ? "admin-profile-sidebar__button--primary"
                            : "admin-profile-sidebar__button--secondary"
                        }`}
                      >
                        {tab === "details" ? "Manage Details" : "Change Credentials"}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
            <div className="admin-profile-content">
              {activeTab === "details" && renderAdminDetails()}
              {activeTab === "credentials" && renderCredentials()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminProfile;