import React, { useState, useEffect } from "react";
import type { OrderDetail } from "../Components/Types/Order";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import "../Styles/UserProfile.css";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import axios from "axios";
import { API_BASE_URL } from "../config";

interface UserDetails {
  id: number;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
}

interface Product {
  id: number;
  name: string;
  productImages?: string[];
}

interface FormState {
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  token?: string;
}

type Tab = "details" | "credentials" | "orders";
type CredentialsMode = "change" | "forgot" | "reset";





const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [isEditing, setIsEditing] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [originalDetails, setOriginalDetails] = useState<UserDetails | null>(null);
  const [formState, setFormState] = useState<FormState>({ email: "" });
  const [credentialsMode, setCredentialsMode] = useState<CredentialsMode>("change");
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [popup, setPopup] = useState<{ type: "success" | "error"; content: string } | null>(null);
  // Removed unused wishlist state
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const { user, isLoading: isAuthLoading, login, token } = useAuth();
  const userId = user?.id;

  const getAvatarColor = (username: string) => {
    const colors = ["#4285F4", "#DB4437", "#F4B400", "#0F9D58", "#673AB7", "#0097A7"];
    const charCodeSum = username.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  const showPopup = (type: "success" | "error", content: string) => {
    setPopup({ type, content });
    setTimeout(() => setPopup(null), 3000);
  };

  const validateUsername = (username: string) => username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);

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
    if (!userId) {
      // Try to recover user from /api/auth/me (cookie session)
      fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            // Set user in context
            login(null, {
              id: data.data.userId,
              email: data.data.email,
              role: data.data.role,
              username: data.data.email.split('@')[0],
              isVerified: true,
            });
          } else {
            showPopup("error", "Authentication details missing. Please log in again.");
          }
        })
        .catch(() => {
          showPopup("error", "Authentication details missing. Please log in again.");
        });
      return;
    }
    const fetchUserDetails = async () => {
      console.log("[UserProfile] fetchUserDetails - Starting fetch");
      console.log("[UserProfile] fetchUserDetails - User ID:", userId);
      console.log("[UserProfile] fetchUserDetails - Token:", token);
      console.log("[UserProfile] fetchUserDetails - Document cookie:", document.cookie);
      
      setIsLoading((prev) => ({ ...prev, fetchUser: true }));
      try {
        // Try to use token if available, otherwise rely on cookies
        const headers: Record<string, string> = {};
        
        // Try to get token from context or localStorage
        const authToken = token || localStorage.getItem("authToken");
        
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
          console.log("[UserProfile] fetchUserDetails - Using token-based auth");
        } else {
          console.log("[UserProfile] fetchUserDetails - Using cookie-based auth");
        }
        
        console.log("[UserProfile] fetchUserDetails - Request headers:", headers);
        
        const response = await axiosInstance.get(`/api/auth/users/${userId}`, {
          headers,
          withCredentials: true, // Always include cookies
          timeout: 5000,
        });
        
        console.log("[UserProfile] fetchUserDetails - Response:", response.data);
        
        setUserDetails(response.data.data);
        setOriginalDetails(response.data.data);
        setFormState((prev) => ({ ...prev, email: response.data.data.email }));
      } catch (error) {
        console.error("[UserProfile] fetchUserDetails - Error:", error);
        handleError(error, "Failed to load user details");
        setUserDetails(null);
      } finally {
        setIsLoading((prev) => ({ ...prev, fetchUser: false }));
      }
    };
    fetchUserDetails();
  }, [userId, isAuthLoading, login, token]);

  useEffect(() => {
    if (user) {
      // Update wishlist to use cookie-based auth
      console.log('[Wishlist] document.cookie:', document.cookie);
      fetch(`${API_BASE_URL}/api/wishlist`, {
        credentials: 'include'
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // setWishlist(data.data); // This line was removed as per the edit hint
        }
      })
      .catch(err => console.error('Failed to fetch wishlist:', err));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      console.log('[OrderHistory] No user found, skipping fetch.');
      return;
    }
    setOrdersLoading(true);
    setOrdersError(null);
    const url = `${API_BASE_URL}/api/order/customer/history`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log('[OrderHistory] document.cookie:', document.cookie);
    console.log('[OrderHistory] Fetching order history for user:', user);
    console.log('[OrderHistory] Fetch URL:', url);
    fetch(url, {
      credentials: 'include',
      headers,
    })
      .then(res => {
        console.log('[OrderHistory] Response status:', res.status);
        return res.json().then(data => {
          console.log('[OrderHistory] Response JSON:', data);
          return { data };
        });
      })
      .then(({ data }) => {
        if (data.success) {
          setOrders(data.data);
        } else {
          setOrdersError(data.message || 'Failed to load orders');
        }
      })
      .catch(err => {
        setOrdersError('Failed to load orders');
        console.error('[OrderHistory] Orders error:', err);
      })
      .finally(() => setOrdersLoading(false));
  }, [user, token]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    section: keyof FormState | keyof UserDetails
  ) => {
    const value = e.target.value;
    if (section === "username") {
      setUserDetails((prev) => prev ? { ...prev, username: value } : null);
    } else {
      setFormState((prev) => ({ ...prev, [section]: value }));
    }
  };

  const handleTabChange = (tab: Tab) => {
    if (isEditing && originalDetails) {
      setUserDetails(originalDetails);
      setIsEditing(false);
    }
    setActiveTab(tab);
    setCredentialsMode("change");
    setFormState({ email: formState.email });
  };

  const handleSave = async () => {
    if (!userDetails) return showPopup("error", "User details missing.");
    if (!validateUsername(userDetails.username)) return showPopup("error", "Username must be 3+ characters and alphanumeric.");

    console.log("[UserProfile] handleSave - Starting username update");
    console.log("[UserProfile] handleSave - User details:", userDetails);
    console.log("[UserProfile] handleSave - User ID:", userId);
    console.log("[UserProfile] handleSave - Token from context:", token);
    console.log("[UserProfile] handleSave - Token from localStorage:", localStorage.getItem("authToken"));
    console.log("[UserProfile] handleSave - Document cookie:", document.cookie);
    console.log("[UserProfile] handleSave - User authenticated:", !!user);
    console.log("[UserProfile] handleSave - User ID from context:", user?.id);

    setIsLoading((prev) => ({ ...prev, saveUser: true }));
    try {
      // Try to use token if available, otherwise rely on cookies
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      // Try to get token from context or localStorage
      const authToken = token || localStorage.getItem("authToken");
      
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
        console.log("[UserProfile] handleSave - Using token-based auth");
      } else {
        console.log("[UserProfile] handleSave - Using cookie-based auth");
      }
      
      const response = await axiosInstance.put(
        `/api/auth/users/${userId}`,
        { username: userDetails.username },
        { 
          withCredentials: true, // Always include cookies
          headers
        }
      );
      
      console.log("[UserProfile] handleSave - Response:", response.data);
      
      if (response.data.success) {
        setUserDetails(response.data.data || response.data.user);
        setOriginalDetails(response.data.data || response.data.user);
        setIsEditing(false);
        showPopup("success", "Username updated successfully! Changes will apply the next time you login.");
      } else {
        showPopup("error", response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("[UserProfile] handleSave - Error:", error);
      handleError(error, "Failed to update profile");
    } finally {
      setIsLoading((prev) => ({ ...prev, saveUser: false }));
    }
  };

  const handleForgotPassword = async () => {
    if (!formState.email) return showPopup("error", "Please enter your email address");
    setIsLoading((prev) => ({ ...prev, forgot: true }));
    try {
      await axiosInstance.post(`/api/auth/forgot-password`, { email: formState.email });
      showPopup("success", "Password reset email sent! Check your inbox.");
      setCredentialsMode("reset");
    } catch (error) {
      handleError(error, "Failed to send reset email");
    } finally {
      setIsLoading((prev) => ({ ...prev, forgot: false }));
    }
  };

  const handleResetPassword = async () => {
    if (formState.newPassword !== formState.confirmPassword) return showPopup("error", "Passwords do not match!");
    if (!formState.token) return showPopup("error", "Please enter the reset token");
    setIsLoading((prev) => ({ ...prev, reset: true }));
    try {
      await axiosInstance.post(`/api/auth/reset-password`, {
        newPass: formState.newPassword,
        confirmPass: formState.confirmPassword,
        token: formState.token,
      });
      showPopup("success", "Password reset successful!");
      setCredentialsMode("change");
      setFormState((prev) => ({ ...prev, newPassword: "", confirmPassword: "", token: "" }));
    } catch (error) {
      handleError(error, "Failed to reset password");
    } finally {
      setIsLoading((prev) => ({ ...prev, reset: false }));
    }
  };



  const renderUserDetails = () => {
    if (isLoading.fetchUser) {
      return (
        <div className="profile-form">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton skeleton-form-group" style={{ height: i === 0 ? "40px" : i === 4 ? "48px" : "auto" }} />
          ))}
        </div>
      );
    }

    if (!userDetails) return <div className="profile-form__loading">Failed to load user information</div>;

    return (
      <div className="profile-form">
        <h2 className="profile-form__title">User Details</h2>
        <div className="profile-form__group">
          <label>Username</label>
          {isEditing ? (
            <input
              type="text"
              name="username"
              value={userDetails.username ?? ""}
              onChange={(e) => handleInputChange(e, "username")}
              className="profile-form__input"
            />
          ) : (
            <div>{userDetails.username}</div>
          )}
        </div>
        <div className="profile-form__group">
          <label>Email Address</label>
          <div>{userDetails.email}</div>
        </div>
        <div className="profile-form__group">
          <label>Account Role</label>
          <div>{userDetails.role}</div>
        </div>
        <div className="profile-form__group">
          <label>Account Status</label>
          <div className={userDetails.isVerified ? "verified-yes" : "verified-no"}>
            {userDetails.isVerified ? "✓ Verified" : "⚠ Not Verified"}
          </div>
        </div>
        {!isGoogleUser && (
          isEditing ? (
            <div className="profile-form__actions">
              <button className="btn btn--primary" onClick={handleSave} disabled={isLoading.saveUser}>
                {isLoading.saveUser ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => {
                  setUserDetails(originalDetails);
                  setIsEditing(false);
                }}
                onFocus={() => console.log("Cancel button focused")}
                tabIndex={-1}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button className="btn btn--primary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )
        )}
      </div>
    );
  };

  const renderCredentials = () => {
    if (isLoading.fetchUser) {
      return (
        <div className="credentials">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton skeleton-form-group" style={{ height: i === 0 ? "40px" : i === 4 ? "48px" : "auto" }} />
          ))}
        </div>
      );
    }
    if (isGoogleUser) {
      return (
        <div className="credentials">
          <div className="credentials__header">
            <h3 className="credentials__title">Account Security</h3>
            <p>Google account users manage credentials via Google.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="credentials">
        <div className="credentials__header">
          <div>
            <h3 className="credentials__title">Account Security</h3>
            <p>Manage your password and account security</p>
          </div>
          <div className="credentials__actions">
            <button
              className={`profile-form__help ${credentialsMode === "forgot" ? "active" : ""}`}
              onClick={() => setCredentialsMode("forgot")}
              onFocus={() => console.log("Forgot Password button focused")}
              tabIndex={-1}
            >
              Forgot Password
            </button>
          </div>
        </div>
       
        {credentialsMode === "forgot" && (
          <div className="credentials__section">
            <h3>Reset Password</h3>
            <p>Enter your email address to receive a reset token.</p>
            <div className="profile-form__group">
              <label className="profile-form__label">Email Address</label>
              <div style={{ 
                padding: '12px 16px', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px', 
                backgroundColor: '#f9fafb', 
                color: '#374151',
                fontSize: '16px',
                minHeight: '20px',
                wordBreak: 'break-all'
              }}>
                {formState.email || userDetails?.email || "No email available"}
              </div>
            </div>
            <button
              className="btn btn--primary"
              onClick={handleForgotPassword}
              disabled={isLoading.forgot}
              onFocus={() => console.log("Send Reset Email button focused")}
              tabIndex={-1}
            >
              {isLoading.forgot ? "Sending..." : "Send Reset Email"}
            </button>
          </div>
        )}
        {credentialsMode === "reset" && (
          <div className="credentials__section">
            <h3>Enter Reset Token</h3>
            <p>Check your email for the reset token and enter your new password.</p>
            <div className="profile-form__group">
              <label className="profile-form__label">Reset Token</label>
              <input
                type="text"
                name="token"
                placeholder="Enter reset token"
                value={formState.token ?? ""}
                onChange={(e) => handleInputChange(e, "token")}
              />
            </div>
            <div className="profile-form__group">
              <label className="profile-form__label">New Password</label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={formState.newPassword ?? ""}
                onChange={(e) => handleInputChange(e, "newPassword")}
              />
            </div>
            <div className="profile-form__group">
              <label className="profile-form__label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formState.confirmPassword ?? ""}
                onChange={(e) => handleInputChange(e, "confirmPassword")}
              />
            </div>
            <div
              className="credentials__actions-row"
              tabIndex={-1}
              onFocus={() => console.log("credentials__actions-row focused")}
            >
              <button
                className="btn btn--secondary"
                onClick={() => setCredentialsMode("forgot")}
                onFocus={() => console.log("Back to Email button focused (reset mode)")}
                tabIndex={-1}
              >
                Back to Email
              </button>
              <button
                className="btn btn--primary"
                onClick={handleResetPassword}
                disabled={isLoading.reset}
                onFocus={() => console.log("Reset Password button focused")}
                tabIndex={-1}
              >
                {isLoading.reset ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOrders = () => {
    if (ordersLoading) {
      return (
        <div className="orders">
          <div className="skeleton" style={{ width: "150px", height: "24px", marginBottom: "24px" }} />
          <div className="orders__header">
            <div className="skeleton" style={{ width: "100px", height: "24px" }} />
            <div className="skeleton" style={{ width: "80px", height: "24px" }} />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton skeleton-order-item" />
          ))}
        </div>
      );
    }
    if (ordersError) {
      return <div className="orders__error">{ordersError}</div>;
    }
    if (!orders.length) {
      return <div className="orders__empty">No orders found.</div>;
    }
    return (
      <div className="orders">
        <h2 className="orders__title">Order</h2>
        <div className="orders__list">
          {orders.map((order) => (
            <div key={order.id} className="order-item">
              <div className="order-item__content">
                <div className="order-item__info" style={{ flex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="order-item__id">Order #{order.id}</span>
                    <span className="order-item__status" style={{
                      color: order.status === 'CONFIRMED' ? '#22c55e' : order.status === 'CANCELED' ? '#ef4444' : '#f59e42',
                      fontWeight: 600,
                      fontSize: 13,
                      marginLeft: 8
                    }}>{order.status}</span>
                  </div>
                  <div className="order-item__date" style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                  <div className="order-item__address" style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                    {order.shippingAddress ? `${order.shippingAddress.city || ''}${order.shippingAddress.city && order.shippingAddress.localAddress ? ', ' : ''}${order.shippingAddress.localAddress || ''}` : ''}
                  </div>
                  <div className="order-item__products">
                    {order.orderItems && order.orderItems.length > 0 ? (
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {order.orderItems.slice(0, 2).map((item) => {
                          const product = item.product as Product;
                          return (
                            <li key={item.id} style={{ fontSize: 14, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
                              {product && product.productImages && product.productImages.length > 0 ? (
                                <img src={product.productImages[0]} alt={product.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                              ) : (
                                <div style={{ width: 40, height: 40, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 18, border: '1px solid #eee' }}>?</div>
                              )}
                              <span>{product?.name || 'Product'} x{item.quantity}</span>
                            </li>
                          );
                        })}
                        {order.orderItems.length > 2 && (
                          <li style={{ fontSize: 13, color: '#6b7280' }}>+{order.orderItems.length - 2} more item(s)</li>
                        )}
                      </ul>
                    ) : (
                      <span>No items</span>
                    )}
                  </div>
                  <div className="order-item__payment" style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    Payment: {order.paymentMethod}
                  </div>
                </div>
                <div className="order-item__price-section" style={{ flex: 1, textAlign: 'right' }}>
                  <div className="order-item__price" style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>
                    Rs. {parseFloat(order.totalPrice).toLocaleString()}
                  </div>
                  <div className="order-item__shipping" style={{ fontSize: 13, color: '#6b7280' }}>
                    Shipping: Rs. {parseFloat(order.shippingFee).toLocaleString()}
                  </div>
                  <div className="order-item__payment-status" style={{ fontSize: 13, color: order.status === 'PAID' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {order.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isGoogleUser = userDetails?.email?.toLowerCase().endsWith('@gmail.com'); // crude check, replace with provider if available

  return (
    <>
      <Navbar />
      <Popup
        open={!!popup}
        closeOnDocumentClick
        onClose={() => setPopup(null)}
        contentStyle={{ borderRadius: "12px", maxWidth: "400px", background: "transparent", padding: 0, border: "none", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)" }}
        overlayStyle={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
      >
        <div className={`popup-content ${popup?.type}`}>
          <div className="popup-header">
            <span className="popup-icon">
              {popup?.type === "success" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            </span>
            <span className="popup-title">{popup?.type === "success" ? "Success" : "Error"}</span>
          </div>
          <div className="popup-body">
            <p>{popup?.content}</p>
          </div>
          <button
            className="popup-close-btn"
            onClick={() => setPopup(null)}
            onFocus={() => console.log("Popup close button focused")}
            tabIndex={-1}
          >
            Close
          </button>
        </div>
      </Popup>
      <div className="profile">
        <div className="profile-card">
          <div className="profile-sidebar">
            {isLoading.fetchUser ? (
              <>
                <div className="skeleton skeleton-avatar" />
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton skeleton-button" />)}
              </>
            ) : (
              <>
                <div className="profile-sidebar__avatar" style={{ backgroundColor: userDetails?.username ? getAvatarColor(userDetails.username) : "#f97316" }}>
                  {userDetails?.username?.[0]?.toUpperCase() || "?"}
                </div>
                {isGoogleUser ? (
                  <>
                    <button
                      key="details"
                      onClick={() => handleTabChange("details")}
                      className={`profile-sidebar__button ${activeTab === "details" ? "profile-sidebar__button--primary" : "profile-sidebar__button--secondary"}`}
                      onFocus={() => console.log(`details sidebar button focused`)}
                      tabIndex={-1}
                    >
                      Manage Details
                    </button>
                    <button
                      key="orders"
                      onClick={() => handleTabChange("orders")}
                      className={`profile-sidebar__button ${activeTab === "orders" ? "profile-sidebar__button--primary" : "profile-sidebar__button--secondary"}`}
                      onFocus={() => console.log(`orders sidebar button focused`)}
                      tabIndex={-1}
                    >
                      Orders
                    </button>
                  </>
                ) : (
                  (["details", "credentials", "orders"] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`profile-sidebar__button ${activeTab === tab ? "profile-sidebar__button--primary" : "profile-sidebar__button--secondary"}`}
                      onFocus={() => console.log(`${tab} sidebar button focused`)}
                      tabIndex={-1}
                    >
                      {tab === "details" ? "Manage Details" : tab === "credentials" ? "Change Credentials" : "Order"}
                    </button>
                  ))
                )}
              </>
            )}
          </div>
          <div className="profile-content">
            {activeTab === "details" && renderUserDetails()}
            {!isGoogleUser && activeTab === "credentials" && renderCredentials()}
            {!isGoogleUser && activeTab === "orders" && renderOrders()}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default UserProfile;