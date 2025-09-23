import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import axiosInstance from "../api/axiosInstance";
import { API_BASE_URL } from "../config";
import { useVendorAuth } from "../context/VendorAuthContext";
import { VendorAuthService } from "../services/vendorAuthService";
import { Sidebar } from "../Components/Sidebar";
import VendorHeader from "../Components/VendorHeader";
import "../Styles/ProfilePage.css";
import type { VendorUpdateRequest } from "../Components/Types/vendor";
import axios from "axios";

import { useAuth } from "../context/AuthContext";

interface VendorProfile {
	id: number;
	businessName: string;
	email: string;
	phoneNumber: string;
	businessAddress: string;
	profilePicture?: string;
	isVerified?: boolean;
	district?: { id: number; name: string };
	taxNumber?: string;
	taxDocuments?: string[] | null;
	businessRegNumber?: string;
	citizenshipDocuments?: string[] | null;
	chequePhoto?: string | null;
	accountName: string;
	bankName: string;
	accountNumber: string;
	bankBranch: string;
	bankCode: string;
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

const ProfilePage: React.FC = () => {
	const navigate = useNavigate();
	const { authState } = useVendorAuth();
	const { token } = authState;
	const [activeTab, setActiveTab] = useState<Tab>("details");
	const [isEditing, setIsEditing] = useState(false);
	const [vendorDetails, setVendorDetails] = useState<VendorProfile | null>(
		null
	);
	const [originalDetails, setOriginalDetails] = useState<VendorProfile | null>(
		null
	);
	const [formState, setFormState] = useState<FormState>({ email: "" });
	const [credentialsMode, setCredentialsMode] =
		useState<CredentialsMode>("change");
	const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
	const [popup, setPopup] = useState<{
		type: "success" | "error";
		content: string;
	} | null>(null);

	const vendorId = authState.vendor?.id;

	const getAvatarColor = (businessName: string) => {
		const colors = [
			"#4285F4",
			"#DB4437",
			"#F4B400",
			"#0F9D58",
			"#673AB7",
			"#0097A7",
		];
		const charCodeSum = businessName
			.split("")
			.reduce((sum, char) => sum + char.charCodeAt(0), 0);
		return colors[charCodeSum % colors.length];
	};

	const showPopup = (type: "success" | "error", content: string) => {
		setPopup({ type, content });
		setTimeout(() => setPopup(null), 3000);
	};

	const validateBusinessName = (businessName: string) =>
		businessName.trim().length >= 2;
	const validatePhoneNumber = (phoneNumber: string) =>
		phoneNumber === "" || /^[0-9]{10}$/.test(phoneNumber);
	const validateEmail = (email: string) =>
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	const handleError = (error: unknown, defaultMsg: string) => {
		if (!axios.isAxiosError(error)) return showPopup("error", defaultMsg);
		const { status, data } = error.response || {};
		const messages: { [key: number]: string } = {
			400: data?.message || "Invalid input. Please check your data.",
			401: "Unauthorized: Invalid or missing token.",
			403: "Forbidden: Not authorized.",
			404: "Resource not found.",
			409: data?.message || "This email is already in use.",
			410: "Token expired. Please try again.",
		};
		if (typeof status === "number" && messages[status]) {
			showPopup("error", messages[status]);
		} else {
			showPopup("error", defaultMsg);
		}
	};

	const fetchVendorDetails = async () => {
		setIsLoading((prev) => ({ ...prev, fetchVendor: true }));
		try {
			const response = await axios.get(
				`${API_BASE_URL}/api/vendors/auth/vendor`,
				{
					headers: token ? { Authorization: `Bearer ${token}` } : {},
					withCredentials: true,
					timeout: 5000,
				}
			);

			const vendorData = response.data.vendor;
			const normalizedVendorData = {
				...vendorData,
				businessName: vendorData.businessName || "",
				phoneNumber: vendorData.phoneNumber || "",
				businessAddress: vendorData.district?.name || "",
				taxNumber: vendorData.taxNumber || "",
				businessRegNumber: vendorData.businessRegNumber || "",
				chequePhoto: vendorData.chequePhoto || "",
				citizenshipDocuments: vendorData.citizenshipDocuments || [],
				taxDocuments: vendorData.taxDocuments || [],
				accountName: vendorData.accountName || "",
				bankName: vendorData.bankName || "",
				accountNumber: vendorData.accountNumber || "",
				bankBranch: vendorData.bankBranch || "",
				bankCode: vendorData.bankCode || "",
			};

			console.log(
				"Res: ",
				response,
				"Vendor",
				vendorData,
				"Normal",
				normalizedVendorData
			);

			setVendorDetails(normalizedVendorData);
			setOriginalDetails(normalizedVendorData);
			setFormState((prev) => ({ ...prev, email: vendorData.email || "" }));
		} catch (error) {
			handleError(error, "Failed to load vendor details");
			setVendorDetails(null);
		} finally {
			setIsLoading((prev) => ({ ...prev, fetchVendor: false }));
		}
	};

	useEffect(() => {
		if (!vendorId) {
			navigate("/login");
			return;
		}
		fetchVendorDetails();
	}, [vendorId, navigate]);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		field:
			| keyof FormState
			| keyof VendorProfile
			| keyof VendorProfile["bankDetails"]
	) => {
		const value = e.target.value;
		if (field in (vendorDetails || {})) {
			setVendorDetails((prev) => (prev ? { ...prev, [field]: value } : null));
		} else if (
			vendorDetails?.bankDetails &&
			field in vendorDetails.bankDetails
		) {
			setVendorDetails((prev) => {
				if (!prev) return null;
				return {
					...prev,
					bankDetails: { ...prev.bankDetails, [field]: value },
				};
			});
		} else {
			setFormState((prev) => ({ ...prev, [field]: value }));
		}
	};

	const handleFileChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		field: keyof VendorProfile
	) => {
		const file = e.target.files?.[0];
		if (file) {
			setVendorDetails((prev) =>
				prev ? { ...prev, [field]: file.name } : null
			);
		}
	};

	const handleArrayFileChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		field: keyof VendorProfile
	) => {
		const files = Array.from(e.target.files || []);
		if (files.length > 0) {
			const fileNames = files.map((file) => file.name);
			setVendorDetails((prev) =>
				prev ? { ...prev, [field]: fileNames } : null
			);
		}
	};

	const handleTabChange = (tab: Tab) => {
		if (isEditing && originalDetails) {
			setVendorDetails(originalDetails);
			setIsEditing(false);
		}
		setActiveTab(tab);
		setCredentialsMode("change");
		setFormState({ email: formState.email });
	};

	const handleSave = async () => {
		if (!vendorDetails) return showPopup("error", "Vendor details missing.");
		if (
			vendorDetails.businessName &&
			!validateBusinessName(vendorDetails.businessName)
		)
			return showPopup("error", "Business name must be at least 2 characters.");
		if (
			vendorDetails.phoneNumber &&
			!validatePhoneNumber(vendorDetails.phoneNumber)
		)
			return showPopup("error", "Phone number must be 10 digits.");

		setIsLoading((prev) => ({ ...prev, saveVendor: true }));

		try {
			const requestData: VendorUpdateRequest = {
				id: vendorDetails.id || 0,
				businessName: vendorDetails.businessName || "",
				phoneNumber: vendorDetails.phoneNumber || "",
				businessAddress: vendorDetails.businessAddress || "",
				taxNumber: vendorDetails.taxNumber || "",
				businessRegNumber: vendorDetails.businessRegNumber || "",
				chequePhoto: vendorDetails.chequePhoto || "",
				citizenshipDocuments: vendorDetails.citizenshipDocuments || [],
				taxDocuments: vendorDetails.taxDocuments || [],
				accountName: vendorDetails.accountName || "",
				bankName: vendorDetails.bankName || "",
				accountNumber: vendorDetails.accountNumber || "",
				bankBranch: vendorDetails.bankBranch || "",
				bankCode: vendorDetails.bankCode || "",

				district: vendorDetails.businessAddress,
			};

			const response = await axios.put(
				`${API_BASE_URL}/api/vendors/${vendorId}`,
				requestData,
				{
					withCredentials: true,
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				}
			);

			if (response.data.success) {
				fetchVendorDetails();
				setIsEditing(false);
				localStorage.setItem("vendorData", JSON.stringify(vendorDetails));
				showPopup("success", "Profile updated successfully!");
			} else {
				showPopup("error", response.data.message || "Failed to update profile");
			}
		} catch (error) {
			handleError(error, "Failed to update profile");
		} finally {
			setIsLoading((prev) => ({ ...prev, saveVendor: false }));
		}
	};

	const handleForgotPassword = async () => {
		if (!formState.email)
			return showPopup("error", "Please enter your email address");
		setIsLoading((prev) => ({ ...prev, forgot: true }));
		try {
			await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
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
			await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
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

	const renderVendorDetails = () => {
		if (isLoading.fetchVendor) {
			return (
				<div className="vendor-profile-form">
					{[...Array(10)].map((_, i) => (
						<div
							key={i}
							className="vendor-skeleton vendor-skeleton-form-group"
							style={{ height: i === 0 ? "40px" : i === 9 ? "48px" : "auto" }}
						/>
					))}
				</div>
			);
		}

		if (!vendorDetails)
			return (
				<div className="vendor-profile-form__loading">
					Failed to load vendor information
				</div>
			);

		return (
			<div className="vendor-profile-form">
				<h2 className="vendor-profile-form__title">Vendor Profile</h2>
				<div className="vendor-profile-form__row">
					<div className="vendor-profile-form__group vendor-profile-form__group--half">
						<label>Business Name</label>
						{isEditing ? (
							<input
								type="text"
								name="businessName"
								value={vendorDetails.businessName ?? ""}
								onChange={(e) => handleInputChange(e, "businessName")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.businessName || "Not provided"}
							</div>
						)}
					</div>
					<div className="vendor-profile-form__group vendor-profile-form__group--half">
						<label>Email</label>
						<div className="vendor-profile-form__display">
							{vendorDetails.email || "Not provided"}
						</div>
					</div>
				</div>
				<div className="vendor-profile-form__row">
					<div className="vendor-profile-form__group vendor-profile-form__group--half">
						<label>Phone Number</label>
						{isEditing ? (
							<input
								type="text"
								name="phoneNumber"
								value={vendorDetails.phoneNumber || ""}
								onChange={(e) => handleInputChange(e, "phoneNumber")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.phoneNumber || "Not provided"}
							</div>
						)}
					</div>
					<div className="vendor-profile-form__group vendor-profile-form__group--half">
						<label>Business Address</label>
						{isEditing ? (
							<input
								type="text"
								name="businessAddress"
								value={vendorDetails.businessAddress ?? ""}
								onChange={(e) => handleInputChange(e, "businessAddress")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.businessAddress || "Not provided"}
							</div>
						)}
					</div>
				</div>
				<div className="vendor-profile-form__row">
					<div className="vendor-profile-form__group vendor-profile-form__group--half">
						<label>Tax Number</label>
						{isEditing ? (
							<input
								type="text"
								name="taxNumber"
								value={vendorDetails.taxNumber ?? ""}
								onChange={(e) => handleInputChange(e, "taxNumber")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.taxNumber || "Not provided"}
							</div>
						)}
					</div>
					<div className="vendor-profile-form__group vendor-profile-form__group--half">
						<label>Business Registration Number</label>
						{isEditing ? (
							<input
								type="text"
								name="businessRegNumber"
								value={vendorDetails.businessRegNumber ?? ""}
								onChange={(e) => handleInputChange(e, "businessRegNumber")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.businessRegNumber || "Not provided"}
							</div>
						)}
					</div>
				</div>
				<div className="vendor-profile-form__row">
					<div className="vendor-profile-form__group vendor-profile-form__group--half">
						<label>Account Name</label>
						{isEditing ? (
							<input
								type="text"
								name="accountName"
								value={vendorDetails.accountName ?? ""}
								onChange={(e) => handleInputChange(e, "accountName")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.accountName || "Not provided"}
							</div>
						)}
					</div>
					<div className="vendor-profile-form__group vendor-profile-form__group--half">
						<label>Bank Name</label>
						{isEditing ? (
							<input
								type="text"
								name="bankName"
								value={vendorDetails.bankName ?? ""}
								onChange={(e) => handleInputChange(e, "bankName")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.bankName || "Not provided"}
							</div>
						)}
					</div>
				</div>
				<div className="vendor-profile-form__row">
					<div className="vendor-profile-form__group vendor-profile-form__group--half">
						<label>Account Number</label>
						{isEditing ? (
							<input
								type="text"
								name="accountNumber"
								value={vendorDetails.accountNumber ?? ""}
								onChange={(e) => handleInputChange(e, "accountNumber")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.accountNumber || "Not provided"}
							</div>
						)}
					</div>
					<div className="vendor-profile-form__group vendor-profile-form__group--half">
						<label>Bank Branch</label>
						{isEditing ? (
							<input
								type="text"
								name="bankBranch"
								value={vendorDetails.bankBranch ?? ""}
								onChange={(e) => handleInputChange(e, "bankBranch")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.bankBranch || "Not provided"}
							</div>
						)}
					</div>
				</div>
				<div className="vendor-profile-form__row">
					<div className="vendor-profile-form__group vendor-profile-form__group--half">
						<label>Bank Code</label>
						{isEditing ? (
							<input
								type="text"
								name="bankCode"
								value={vendorDetails.bankCode ?? ""}
								onChange={(e) => handleInputChange(e, "bankCode")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.bankCode || "Not provided"}
							</div>
						)}
					</div>
				</div>
				<div className="vendor-profile-form__row">
					<div className="vendor-profile-form__group">
						<label>Cheque Photo</label>
						{isEditing ? (
							<input
								type="file"
								onChange={(e) => handleFileChange(e, "chequePhoto")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.chequePhoto ? (
									<a
										href={vendorDetails.chequePhoto}
										target="_blank"
										rel="noopener noreferrer"
									>
										View Cheque Photo
									</a>
								) : (
									"Not provided"
								)}
							</div>
						)}
					</div>
				</div>
				<div className="vendor-profile-form__row">
					<div className="vendor-profile-form__group">
						<label>Citizenship Documents</label>
						{isEditing ? (
							<input
								type="file"
								multiple
								onChange={(e) =>
									handleArrayFileChange(e, "citizenshipDocuments")
								}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.citizenshipDocuments?.length
									? vendorDetails.citizenshipDocuments.map((doc, index) => (
											<div key={index}>
												<a
													href={doc}
													target="_blank"
													rel="noopener noreferrer"
												>
													Document {index + 1}
												</a>
											</div>
									  ))
									: "Not provided"}
							</div>
						)}
					</div>
				</div>
				<div className="vendor-profile-form__row">
					<div className="vendor-profile-form__group">
						<label>Tax Documents</label>
						{isEditing ? (
							<input
								type="file"
								multiple
								onChange={(e) => handleArrayFileChange(e, "taxDocuments")}
								className="vendor-profile-form__input"
							/>
						) : (
							<div className="vendor-profile-form__display">
								{vendorDetails.taxDocuments?.length
									? vendorDetails.taxDocuments.map((doc, index) => (
											<div key={index}>
												<a
													href={doc}
													target="_blank"
													rel="noopener noreferrer"
												>
													Document {index + 1}
												</a>
											</div>
									  ))
									: "Not provided"}
							</div>
						)}
					</div>
				</div>
				{isEditing ? (
					<div className="vendor-profile-form__actions">
						<button
							className="vendor-btn-edit--primary"
							onClick={handleSave}
							disabled={isLoading.saveVendor}
						>
							{isLoading.saveVendor ? "Saving..." : "Save Changes"}
						</button>
						<button
							className="vendor-btn-edit--secondary"
							onClick={() => {
								setVendorDetails(originalDetails);
								setIsEditing(false);
							}}
						>
							Cancel
						</button>
					</div>
				) : (
					<button
						className="vendor-btn-edit--primary"
						onClick={() => setIsEditing(true)}
					>
						Edit Profile
					</button>
				)}
			</div>
		);
	};

	const renderCredentials = () => {
		if (isLoading.fetchVendor) {
			return (
				<div className="vendor-credentials">
					{[...Array(5)].map((_, i) => (
						<div
							key={i}
							className="vendor-skeleton vendor-skeleton-form-group"
							style={{ height: i === 0 ? "40px" : i === 4 ? "48px" : "auto" }}
						/>
					))}
				</div>
			);
		}

		return (
			<div className="vendor-credentials">
				<h2 className="vendor-credentials__main-title">Account Security</h2>
				<div className="vendor-credentials__header">
					<p className="vendor-credentials__description">
						Manage your password and account security
					</p>
					<div className="vendor-credentials__actions">
						<button
							className={`vendor-profile-form__help ${
								credentialsMode === "forgot" ? "active" : ""
							}`}
							onClick={() => setCredentialsMode("forgot")}
						>
							Forgot Password
						</button>
					</div>
				</div>
				{credentialsMode === "forgot" && (
					<div
						className="vendor-credentials__section"
						style={{ display: "flex", flexDirection: "column", gap: "10px" }}
					>
						<h3>Reset Password</h3>
						<p>Enter your email address to receive a reset token.</p>
						<div className="vendor-profile-form__group">
							<label className="vendor-profile-form__label">
								Email Address
							</label>
							<div className="vendor-credentials__email-display">
								{formState.email ||
									vendorDetails?.email ||
									"No email available"}
							</div>
						</div>
						<button
							className="vendor-btn vendor-btn--primary"
							onClick={handleForgotPassword}
							disabled={isLoading.forgot}
							style={{ marginTop: "20px", maxWidth: "300px" }}
						>
							{isLoading.forgot ? "Sending..." : "Send Reset Email"}
						</button>
					</div>
				)}
				{credentialsMode === "reset" && (
					<div className="vendor-credentials__section">
						<h3>Enter Reset Token</h3>
						<p>
							Check your email for the reset token and enter your new password.
						</p>
						<div className="vendor-profile-form__group">
							<label className="vendor-profile-form__label">Reset Token</label>
							<input
								type="text"
								name="token"
								placeholder="Enter reset token"
								value={formState.token ?? ""}
								onChange={(e) => handleInputChange(e, "token")}
								className="vendor-profile-form__input"
							/>
						</div>
						<div className="vendor-profile-form__group">
							<label className="vendor-profile-form__label">New Password</label>
							<input
								type="password"
								name="newPassword"
								placeholder="Enter new password"
								value={formState.newPassword ?? ""}
								onChange={(e) => handleInputChange(e, "newPassword")}
								className="vendor-profile-form__input"
							/>
						</div>
						<div className="vendor-profile-form__group">
							<label className="vendor-profile-form__label">
								Confirm Password
							</label>
							<input
								type="password"
								name="confirmPassword"
								placeholder="Confirm new password"
								value={formState.confirmPassword ?? ""}
								onChange={(e) => handleInputChange(e, "confirmPassword")}
								className="vendor-profile-form__input"
							/>
						</div>
						<div className="vendor-credentials__actions-row">
							<button
								className="vendor-btn vendor-btn--secondary"
								onClick={() => setCredentialsMode("forgot")}
							>
								Back to Email
							</button>
							<button
								className="vendor-btn vendor-btn--primary"
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
									<circle
										cx="12"
										cy="12"
										r="10"
									></circle>
									<line
										x1="12"
										y1="8"
										x2="12"
										y2="12"
									></line>
									<line
										x1="12"
										y1="16"
										x2="12.01"
										y2="16"
									></line>
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
					<VendorHeader
						showSearch={false}
						title="Profile Management"
					/>
					<div
						className={`vendor-profile-card ${
							activeTab === "details" || activeTab === "credentials"
								? "vendor-profile-card--wide"
								: ""
						}`}
					>
						<div className="vendor-profile-sidebar">
							{isLoading.fetchVendor ? (
								<>
									<div className="vendor-skeleton vendor-skeleton-avatar" />
									{[...Array(2)].map((_, i) => (
										<div
											key={i}
											className="vendor-skeleton vendor-skeleton-button"
										/>
									))}
								</>
							) : (
								<>
									<div
										className="vendor-profile-sidebar__avatar"
										style={{
											backgroundColor: vendorDetails?.businessName
												? getAvatarColor(vendorDetails.businessName)
												: "#f97316",
										}}
									>
										{vendorDetails?.businessName?.[0]?.toUpperCase() || "?"}
									</div>
									{(["details", "credentials"] as Tab[]).map((tab) => (
										<button
											key={tab}
											onClick={() => handleTabChange(tab)}
											className={`vendor-profile-sidebar__button ${
												activeTab === tab
													? "vendor-profile-sidebar__button--primary"
													: "vendor-profile-sidebar__button--secondary"
											}`}
										>
											{tab === "details"
												? "Manage Details"
												: "Change Credentials"}
										</button>
									))}
								</>
							)}
						</div>
						<div className="vendor-profile-content">
							{activeTab === "details" && renderVendorDetails()}
							{activeTab === "credentials" && renderCredentials()}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default ProfilePage;
