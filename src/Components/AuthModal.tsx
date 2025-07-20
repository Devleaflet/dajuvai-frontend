import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useVendorAuth } from "../context/VendorAuthContext";
import VendorService from "../services/vendorService";
import { API_BASE_URL } from "../config";
import "../Styles/AuthModal.css";
import popup from "../assets/auth.jpg";
import close from "../assets/close.png";
import { Toaster, toast } from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SignupResponse {
  message: string;
  userId: number;
  username: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  data: {
    userId: number;
    email: string;
    role: string;
  };
}

interface VerificationResponse {
  message: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, fetchUserData } = useAuth();
  const { login: vendorLogin } = useVendorAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] =
    useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const [forgotMode, setForgotMode] = useState<"none" | "request" | "reset">(
    "none"
  );
  const [resetToken, setResetToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("auth-modal--open");
    } else {
      document.body.classList.remove("auth-modal--open");
    }

    const handleClickOutside = (event: MouseEvent): void => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        (!popupRef.current || !popupRef.current.contains(event.target as Node))
      ) {
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
      setUsername("");
      setError("");
      setSuccess("");
      setShowVerification(false);
      setVerificationToken("");
      setPendingVerificationEmail("");
      setCountdown(0);
      setForgotMode("none");
      setResetToken("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const validateSignup = (): boolean => {
    const errors: string[] = [];

    // Username validation
    if (!username.trim()) errors.push("Username is required");
    if (username.length < 3)
      errors.push("Username must be at least 3 characters");
    if (username.length > 30)
      errors.push("Username must be less than 30 characters");
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      errors.push(
        "Username can only contain letters, numbers, and underscores"
      );

    // Email validation
    if (!email.trim()) errors.push("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.push("Please enter a valid email");
    if (email.length > 255) errors.push("Email is too long");

    // Password validation
    if (!password.trim()) errors.push("Password is required");
    if (password.length < 8)
      errors.push("Password must be at least 8 characters");
    if (!/[a-z]/.test(password))
      errors.push("Password must contain at least one lowercase letter");
    if (!/[A-Z]/.test(password))
      errors.push("Password must contain at least one uppercase letter");
    if (!/[^a-zA-Z0-9]/.test(password))
      errors.push("Password must contain at least one special character");
    if (password.length > 128) errors.push("Password is too long");

    // Confirm password validation
    if (!confirmPassword.trim()) errors.push("Please confirm your password");
    if (password !== confirmPassword) errors.push("Passwords do not match");
    if (!/[a-z]/.test(confirmPassword))
      errors.push("Confirm password must contain at least one lowercase letter");
    if (!/[A-Z]/.test(confirmPassword))
      errors.push("Confirm password must contain at least one uppercase letter");
    if (!/[^a-zA-Z0-9]/.test(confirmPassword))
      errors.push("Confirm password must contain at least one special character");

    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
      setError(errors[0]);
      return false;
    }
    return true;
  };

  const handleSignup = async (userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      setIsLoading(true);
      setError("");

      console.log("Sending signup data:", {
        username: userData.username,
        email: userData.email,
        passwordLength: userData.password.length,
        confirmPasswordLength: userData.confirmPassword.length,
      });

      const response = await axios.post<SignupResponse>(
        `${API_BASE_URL}/api/auth/signup`,
        userData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess(response.data.message);
      console.log("Signup successful:", response.data);

      setPendingVerificationEmail(userData.email);
      setShowVerification(true);
      setCountdown(120);
      setPassword("");
      setConfirmPassword("");
      setUsername("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Signup error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          headers: err.response?.headers,
        });

        if (err.response?.status === 400 && err.response?.data?.errors) {
          const errorMessages = Object.entries(err.response.data.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join("\n");
          setError(`Validation errors:\n${errorMessages}`);
        } else if (
          err.response?.status === 400 &&
          err.response?.data?.message
        ) {
          setError(err.response.data.message);
        } else if (err.response?.status === 409) {
          setError(
            err.response.data.message || "Email or username already in use"
          );
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(
            `Signup failed (${
              err.response?.status || "unknown error"
            }). Please try again.`
          );
        }
        console.error("Signup error:", err.response?.data);
      } else {
        setError("An unexpected error occurred");
        console.error("Unexpected error:", err);
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
        {
          email: pendingVerificationEmail,
          token: verificationToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess(response.data.message);
      console.log("Email verification successful:", response.data);

      setTimeout(() => {
        setShowVerification(false);
        setVerificationToken("");
        setPendingVerificationEmail("");
        setIsLoginMode(true);
        setSuccess("");
        setCountdown(0);
      }, 3000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Verification failed";
        setError(errorMessage);
        console.error("Verification error:", err.response?.data);
      } else {
        setError("An unexpected error occurred");
        console.error("Unexpected error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await axios.post<VerificationResponse>(
        `${API_BASE_URL}/api/auth/verify/resend`,
        {
          email: pendingVerificationEmail,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess(response.data.message);
      console.log("Verification email resent:", response.data);
      setCountdown(120);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to resend verification";
        setError(errorMessage);
        console.error("Resend verification error:", err.response?.data);
      } else {
        setError("An unexpected error occurred");
        console.error("Unexpected error:", err);
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

      try {
        const vendorService = VendorService.getInstance();
        const vendorResponse = await vendorService.login(userData);

        if (vendorResponse.success) {
          console.log("Vendor login successful:", vendorResponse);
          vendorLogin(vendorResponse.token, vendorResponse.vendor);
          navigate("/dashboard");
          onClose();
          return;
        }
      } catch {
        console.log("Vendor login failed, trying regular user authentication:");
      }

      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/api/auth/login`,
        userData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Regular user login successful:", response.data);

      if (response.data.success && response.data.token) {
        const userData = {
          id: response.data.data.userId,
          email: response.data.data.email,
          role: response.data.data.role,
          username: response.data.data.email.split("@")[0],
          isVerified: true,
        };

        login(response.data.token, userData);

        if (response.data.data.userId) {
          console.log("Fetching complete user data after login...");
          await fetchUserData(response.data.data.userId);
        }

        if (response.data.data.role === "admin") {
          navigate("/admin-dashboard");
        } else if (response.data.data.role === "vendor") {
          navigate("/dashboard");
        } else {
          navigate("/");
        }

        onClose();
      } else {
        setError("Login failed: Invalid response from server");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (
          err.response?.status === 401 &&
          err.response?.data?.message === "Email not verified"
        ) {
          setPendingVerificationEmail(userData.email);
          setShowVerification(true);
          setCountdown(120);
          setError(
            "Please verify your email first. We've sent you a verification code."
          );
        } else {
          const errorMessage =
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Login failed";
          setError(errorMessage);
        }
        console.error("Login error:", err.response?.data);
      } else {
        setError("An unexpected error occurred");
        console.error("Unexpected error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const callbackUrl = `${window.location.origin}/auth/google/callback`;
    const redirectUrl = `${API_BASE_URL}/api/auth/google?redirect_uri=${encodeURIComponent(callbackUrl)}`;
    
    console.log('Redirecting to backend Google OAuth:', redirectUrl);
    window.location.href = redirectUrl;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (showVerification) {
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
      if (!validateSignup()) return;

      try {
        await handleSignup({
          username: username.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        });
      } catch {
        // Errors are already handled in handleSignup
      }
    }
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setSuccess("Password reset email sent! Check your inbox.");
      setForgotMode("reset");
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!resetToken) {
      setError("Please enter the reset token.");
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        newPass: newPassword,
        confirmPass: confirmNewPassword,
        token: resetToken,
      });
      setSuccess("Password reset successful! You can now log in.");
      setForgotMode("none");
      setResetToken("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      setError(
        "Failed to reset password. Please check your token and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

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
          <img
            src={popup}
            alt="Scrolling background"
            className="auth-modal__background"
          />
        </div>

        <div className="auth-modal__title">
          {showVerification ? "Verify Your Email" : "Let's get Started!"}
        </div>

        {!showVerification && (
          <div className="auth-modal__tabs">
            <button
              className={`auth-modal__tab ${
                isLoginMode ? "auth-modal__tab--active" : ""
              }`}
              onClick={() => setIsLoginMode(true)}
            >
              LOG IN
            </button>
            <button
              className={`auth-modal__tab ${
                !isLoginMode ? "auth-modal__tab--active" : ""
              }`}
              onClick={() => setIsLoginMode(false)}
            >
              SIGN UP
            </button>
          </div>
        )}

        {error && (
          <div className="auth-modal__message auth-modal__message--error">
            {error}
          </div>
        )}
        {success && (
          <div className="auth-modal__message auth-modal__message--success">
            {success}
          </div>
        )}

        {!showVerification && (
          <div className="auth-modal__social-login">
            <button
              type="button"
              className="auth-modal__google-button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                className="auth-modal__google-icon"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="auth-modal__divider">
              <span>OR</span>
            </div>
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
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setVerificationToken(value);
                  }}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="\d*"
                />
              </div>

              <button
                type="submit"
                className="auth-modal__submit"
                disabled={isLoading || verificationToken.length !== 6}
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
                    <div className="auth-modal__countdown">
                      {Math.floor(countdown / 60)}:
                      {String(countdown % 60).padStart(2, "0")}
                    </div>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {!isLoginMode && (
                <div className="auth-modal__form-group">
                  <input
                    type="text"
                    className="auth-modal__input"
                    placeholder="Please enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="auth-modal__form-group">
                <input
                  type="email"
                  className="auth-modal__input"
                  placeholder="Please enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="auth-modal__form-group" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-modal__input"
                  placeholder="Please enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{ paddingRight: '40px' }}
                />
                <span style={{ position: 'absolute', right: '10px', top: isLoginMode ? '50%' : '25%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', height: '100%' }}>
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '16px',
                      lineHeight: 1
                    }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3.5"/></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22"/><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33"/><path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33"/></svg>
                    )}
                  </button>
                </span>
                {!isLoginMode && (
                  <div className="auth-modal__hint" style={{ color: '#888', fontSize: '0.9em', marginTop: '4px' }}>
                    Password must be at least 8 characters and contain at least one lowercase, one uppercase letter, and one special character
                  </div>
                )}
              </div>

              {isLoginMode && !showVerification && (
                <button
                  type="button"
                  className="auth-modal__forgot-link"
                  onClick={() => {
                    setShowForgotPopup(true);
                    setForgotMode("request");
                  }}
                >
                  Forgot Password?
                </button>
              )}

              {!isLoginMode && (
                <div className="auth-modal__form-group" style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="auth-modal__input"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    style={{ paddingRight: '40px' }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', height: '100%' }}>
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '16px',
                        lineHeight: 1
                      }}
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3.5"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22"/><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33"/><path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33"/></svg>
                      )}
                    </button>
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="auth-modal__submit"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : isLoginMode ? "LOG IN" : "SIGN UP"}
              </button>
            </>
          )}
        </form>

        {!showVerification && isLoginMode && (
          <div className="auth-modal__footer">
            <p className="auth-modal__footer-text">
              Don't have an account?{" "}
              <button
                type="button"
                className="auth-modal__link-button"
                onClick={() => setIsLoginMode(false)}
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {!showVerification && !isLoginMode && (
          <div className="auth-modal__footer">
            <p className="auth-modal__footer-text">
              Already have an account?{" "}
              <button
                type="button"
                className="auth-modal__link-button"
                onClick={() => setIsLoginMode(true)}
              >
                Log in
              </button>
            </p>
          </div>
        )}

        {!showVerification && (
          <div className="auth-modal__footer">
            <p className="auth-modal__footer-text">
              This site is protected by reCAPTCHA and the{" "}
              <Link to="/privacy" className="auth-modal__link">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link to="/terms" className="auth-modal__link">
                Terms of Service
              </Link>
            </p>
          </div>
        )}
      </div>

      {showForgotPopup && (
        <div className="auth-modal__popup-overlay">
          <div className="auth-modal__popup" ref={popupRef}>
            {forgotMode === "request" ? (
              <form
                className="auth-modal__form"
                onSubmit={handleForgotPasswordRequest}
              >
                <h2 className="auth-modal__title">Forgot Password</h2>
                <p className="auth-modal__desc">
                  Enter your email to receive a password reset link.
                </p>
                <input
                  type="email"
                  className="auth-modal__input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {error && <div className="auth-modal__error">{error}</div>}
                {success && (
                  <div className="auth-modal__success">{success}</div>
                )}
                <button
                  className="auth-modal__button"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Email"}
                </button>
                <button
                  type="button"
                  className="auth-modal__link"
                  onClick={() => {
                    setShowForgotPopup(false);
                    setForgotMode("none");
                    setError("");
                    setSuccess("");
                  }}
                  style={{ marginTop: 8 }}
                >
                  Cancel
                </button>
              </form>
            ) : forgotMode === "reset" ? (
              <form className="auth-modal__form" onSubmit={handleResetPassword}>
                <h2 className="auth-modal__title">Reset Password</h2>
                <p className="auth-modal__desc">
                  Enter the token sent to your email and your new password.
                </p>
                <input
                  type="text"
                  className="auth-modal__input"
                  placeholder="Reset Token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
                <div className="auth-modal__form-group" style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="auth-modal__input"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '16px'
                    }}
                  >
                    {showPassword ? (
                      // Open eye SVG
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3.5"/></svg>
                    ) : (
                      // Slashed eye SVG
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22"/><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33"/><path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33"/></svg>
                    )}
                  </button>
                </div>
                <div className="auth-modal__form-group" style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="auth-modal__input"
                    placeholder="Confirm New Password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '16px'
                    }}
                  >
                    {showConfirmPassword ? (
                      // Open eye SVG
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3.5"/></svg>
                    ) : (
                      // Slashed eye SVG
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22"/><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 1.81-2.87 3.11-4.19M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33"/><path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33"/></svg>
                    )}
                  </button>
                </div>
                {error && <div className="auth-modal__error">{error}</div>}
                {success && (
                  <div className="auth-modal__success">{success}</div>
                )}
                <button
                  className="auth-modal__button"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
                <button
                  type="button"
                  className="auth-modal__link"
                  onClick={() => {
                    setShowForgotPopup(false);
                    setForgotMode("none");
                    setError("");
                    setSuccess("");
                  }}
                  style={{ marginTop: 8 }}
                >
                  Cancel
                </button>
              </form>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthModal;