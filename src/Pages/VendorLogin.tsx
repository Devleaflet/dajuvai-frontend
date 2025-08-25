import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useVendorAuth } from "../context/VendorAuthContext";
import VendorService from "../services/vendorService";
import { API_BASE_URL } from "../config";
import "../Styles/AuthModal.css";
import close from "../assets/close.png";
import { Toaster, toast } from "react-hot-toast";
import popup from "../assets/auth.jpg";

interface VendorLoginProps {
  isOpen: boolean;
  onClose: () => void;
}

const VendorLogin: React.FC<VendorLoginProps> = ({ isOpen, onClose }) => {
  const { login: vendorLogin } = useVendorAuth();
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);

  const modalRef = useRef<HTMLDivElement | null>(null);

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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setError("");
      setSuccess("");
      setShowVerification(false);
      setVerificationToken("");
      setPendingVerificationEmail("");
      setCountdown(0);
      setShowPassword(false);
    }
  }, [isOpen]);

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

  const handleVerifyEmail = async () => {
    try {
      setIsLoading(true);
      setError("");
      setShowVerification(false);
      setVerificationToken("");
      setCountdown(0);
      toast.success("Email verified successfully! Waiting for admin approval.");
      onClose();
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
      const response = await axios.post(
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
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  if (!isOpen) return null;

  return (
    <div className={`auth-modal${isOpen ? " auth-modal--open" : ""}`}>
      <Toaster position="top-center" />
      <div className="auth-modal__overlay"></div>
      <div className="auth-modal__content" ref={modalRef} style={{ maxWidth: "500px" }}>
        <button className="auth-modal__close" onClick={onClose}>
          <img src={close} alt="Close" />
        </button>

        <div className="auth-modal__header">
          <img src={popup} alt="Scrolling background" className="auth-modal__background" />
        </div>

        <div className="auth-modal__title">
          {showVerification ? "Verify Your Email" : "Vendor Login"}
        </div>

        {error && <div className="auth-modal__message auth-modal__message--error">{error}</div>}
        {success && <div className="auth-modal__message auth-modal__message--success">{success}</div>}

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
            <div className="auth-modal__login-form" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", width: "100%", maxWidth: "400px", margin: "0 auto" }}>
              <div style={{ width: "100%" }}>
                <label className="auth-modal__label">Email</label>
                <input
                  type="email"
                  className="auth-modal__input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ width: "100%", position: "relative" }}>
                <label className="auth-modal__label">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-modal__input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "70%",
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
              </div>
              <button type="submit" className="auth-modal__submit" disabled={isLoading}>
                {isLoading ? "Loading..." : "LOG IN"}
              </button>
            </div>
          )}
        </form>

      
      </div>
    </div>
  );
};

export default VendorLogin;