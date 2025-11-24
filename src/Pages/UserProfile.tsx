import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import type { OrderDetail } from "../Components/Types/Order";
import "../Styles/UserProfile.css";
import axiosInstance from "../api/axiosInstance";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import VendorService, { type Vendor } from "../services/vendorService";

interface UserDetails {
	id?: number;
	fullName: string;
	username: string;
	email?: string;
	provider?: string;
	role?: string;
	isVerified?: boolean;
	phoneNumber: string;
	address: {
		province: string;
		district: string;
		city: string;
		localAddress: string;
		landmark: string;
	};
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
	const location = useLocation();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<Tab>(() => {
		if (location.state && typeof location.state.activeTab === "string") {
			const tab = location.state.activeTab;
			if (["details", "credentials", "orders"].includes(tab)) {
				return tab as Tab;
			}
		}
		return "details";
	});
	const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
	const [expandedOrderDetails, setExpandedOrderDetails] = useState<Set<number>>(
		new Set()
	);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
	const [isEditing, setIsEditing] = useState(false);
	const [userDetails, setUserDetails] = useState<UserDetails | null>({
		fullName: "",
		username: "",
		email: "",
		phoneNumber: "",
		role: "",
		address: {
			province: "",
			district: "",
			city: "",
			localAddress: "",
			landmark: "",
		},
	});
	const [originalDetails, setOriginalDetails] = useState<UserDetails | null>(
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
	const [orders, setOrders] = useState<OrderDetail[]>([]);
	const [ordersLoading, setOrdersLoading] = useState(false);
	const [ordersError, setOrdersError] = useState<string | null>(null);
	const [provinceData, setProvinceData] = useState<string[]>([]);
	const [districtData, setDistrictData] = useState<string[]>([]);
	const [vendorCache, setVendorCache] = useState<{ [key: number]: Vendor }>({});
	const [orderDeliveryTimes, setOrderDeliveryTimes] = useState<{ [key: number]: string }>({});

	const { user, isLoading: isAuthLoading, login, token } = useAuth();
	const userId = user?.id;

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

	useEffect(() => {
		const fetchData = async () => {
			try {
				const provinceResponse = await fetch(
					"/Nepal-Address-API-main/data/provinces.json"
				);
				const data = await provinceResponse.json();
				setProvinceData(data.provinces.map(capitalizeFirstLetter));
			} catch (error) {
				console.error("Error fetching provinces:", error);
			}
		};
		fetchData();
	}, []);

	function capitalizeFirstLetter(string: string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	const fetchDistricts = useCallback(async (province: string) => {
		if (!province) {
			setDistrictData([]);
			return;
		}
		try {
			const districtResponse = await fetch(
				`/Nepal-Address-API-main/data/districtsByProvince/${province.toLowerCase()}.json`
			);
			const data = await districtResponse.json();
			setDistrictData(data.districts.map(capitalizeFirstLetter));
		} catch (error) {
			console.error("Error fetching district data:", error);
			setDistrictData([]);
		}
	}, []);

	useEffect(() => {
		if (userDetails?.address?.province) {
			fetchDistricts(userDetails.address.province);
		} else {
			setDistrictData([]);
		}
	}, [userDetails?.address?.province, fetchDistricts]);

	const toggleOrderExpansion = (orderId: number) => {
		setExpandedOrders((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(orderId)) {
				newSet.delete(orderId);
			} else {
				newSet.add(orderId);
			}
			return newSet;
		});
	};

	const toggleOrderDetails = (orderId: number) => {
		setExpandedOrderDetails((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(orderId)) {
				newSet.delete(orderId);
			} else {
				newSet.add(orderId);
			}
			return newSet;
		});
	};

	const formatPaymentMethod = (method: string) => {
		const methodMap: { [key: string]: string } = {
			CASH_ON_DELIVERY: "Cash on Delivery",
			COD: "Cash on Delivery",
			CREDIT_CARD: "Credit Card",
			DEBIT_CARD: "Debit Card",
			BANK_TRANSFER: "Bank Transfer",
			DIGITAL_WALLET: "Digital Wallet",
			PAYPAL: "PayPal",
			STRIPE: "Stripe",
			ESEWA: "eSewa",
			KHALTI: "Khalti",
		};
		return methodMap[method] || method;
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

	// Delivery time calculation functions
	const normalizeDistrict = (district: string): string => {
		const kathmandu_valley = ['kathmandu', 'lalitpur', 'bhaktapur'];
		if (kathmandu_valley.includes(district.toLowerCase())) {
			return 'Kathmandu Valley';
		}
		return district;
	};

	const calculateDeliveryTime = (customerDistrict: string, vendorDistrict: string): string => {
		const normalizedCustomerDistrict = normalizeDistrict(customerDistrict);
		const normalizedVendorDistrict = normalizeDistrict(vendorDistrict);
		
		if (normalizedCustomerDistrict === normalizedVendorDistrict) {
			return '1-2 days';
		} else {
			return '3-5 days';
		}
	};

	// Fetch vendor information
	const fetchVendorInfo = async (vendorId: number): Promise<Vendor | null> => {
		if (vendorCache[vendorId]) {
			return vendorCache[vendorId];
		}

		try {
			if (!token) return null;
			const vendorService = VendorService.getInstance();
			const vendor = await vendorService.getVendorById(vendorId, token);
			
			// Cache the vendor info
			setVendorCache(prev => ({ ...prev, [vendorId]: vendor }));
			return vendor;
		} catch (error) {
			console.error(`Failed to fetch vendor ${vendorId}:`, error);
			return null;
		}
	};

	// Calculate delivery time for an order
	const getOrderDeliveryTime = async (order: OrderDetail): Promise<string> => {
		const customerDistrict = order.shippingAddress?.district;
		if (!customerDistrict || !order.orderItems || order.orderItems.length === 0) {
			return '3-5 days';
		}

		try {
			// Get unique vendor IDs from order items
			const vendorIds = [...new Set(order.orderItems.map(item => item.vendorId))];
			
			// Fetch vendor info for all vendors
			const vendorPromises = vendorIds.map(vendorId => fetchVendorInfo(vendorId));
			const vendors = await Promise.all(vendorPromises);
			
			// Calculate delivery times for each vendor
			const deliveryTimes = vendors
				.filter(vendor => vendor !== null)
				.map(vendor => calculateDeliveryTime(customerDistrict, vendor!.district.name));
			
			// If any vendor requires 3-5 days, the overall delivery is 3-5 days
			if (deliveryTimes.some(time => time === '3-5 days')) {
				return '3-5 days';
			}
			
			// If all vendors are same district (1-2 days), return 1-2 days
			if (deliveryTimes.length > 0 && deliveryTimes.every(time => time === '1-2 days')) {
				return '1-2 days';
			}
			
			// Default fallback
			return '3-5 days';
		} catch (error) {
			console.error('Error calculating delivery time:', error);
			return '3-5 days';
		}
	};

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

		const fetchUserDetails = async () => {
			//("[UserProfile] fetchUserDetails - Starting fetch");
			//("[UserProfile] fetchUserDetails - User ID:", userId);
			//("[UserProfile] fetchUserDetails - Token:", token);
			
			setIsLoading((prev) => ({ ...prev, fetchUser: true }));
			try {
				const headers: Record<string, string> = {};
				const authToken = token || localStorage.getItem("authToken");

				if (authToken) {
					headers.Authorization = `Bearer ${authToken}`;
					
				}

				const response = await axiosInstance.get(`/api/auth/users/${userId}`, {
					headers,
					withCredentials: true,
					timeout: 5000,
				});


				// Ensure consistent address structure
				const userData = response.data.data;
				const normalizedUserData = {
					...userData,
					fullName: userData.fullName || "",
					phoneNumber: userData.phoneNumber || "",
					address: {
						province: userData.address?.province || userData.province || "",
						district: userData.address?.district || userData.district || "",
						city: userData.address?.city || userData.city || "",
						localAddress:
							userData.address?.localAddress || userData.localAddress || "",
						landmark: userData.address?.landmark || userData.landmark || "",
					},
				};

				setUserDetails(normalizedUserData);
				setOriginalDetails(normalizedUserData);
				setFormState((prev) => ({ ...prev, email: userData.email }));
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

	//("💀💀", userDetails);

	useEffect(() => {
		if (user) {
			//("[Wishlist] document.cookie:", document.cookie);
			fetch(`${API_BASE_URL}/api/wishlist`, {
				credentials: "include",
			})
				.then((res) => res.json())
				.then((data) => {
					if (data.success) {
						// setWishlist(data.data);
					}
				})
				.catch((err) => console.error("Failed to fetch wishlist:", err));
		}
	}, [user]);

	useEffect(() => {
		if (!user) {
			//("[OrderHistory] No user found, skipping fetch.");
			return;
		}
		setOrdersLoading(true);
		setOrdersError(null);
		const url = `${API_BASE_URL}/api/order/customer/history`;
		const headers = token ? { Authorization: `Bearer ${token}` } : {};
		//("[OrderHistory] document.cookie:", document.cookie);
		//("[OrderHistory] Fetching order history for user:", user);
		//("[OrderHistory] Fetch URL:", url);
		fetch(url, {
			credentials: "include",
			headers,
		})
			.then((res) => {
				//("[OrderHistory] Response status:", res.status);
				return res.json().then((data) => {
					//("[OrderHistory] Response JSON:", data);
					return { data };
				});
			})
			.then(async ({ data }) => {
				if (data.success) {
					setOrders(data.data);
					
					// Calculate delivery times for all orders
					const deliveryTimePromises = data.data.map(async (order: OrderDetail) => {
						const deliveryTime = await getOrderDeliveryTime(order);
						return { orderId: order.id, deliveryTime };
					});
					
					const deliveryTimeResults = await Promise.all(deliveryTimePromises);
					const deliveryTimesMap = deliveryTimeResults.reduce((acc, { orderId, deliveryTime }) => {
						acc[orderId] = deliveryTime;
						return acc;
					}, {} as { [key: number]: string });
					
					setOrderDeliveryTimes(deliveryTimesMap);
				} else {
					setOrdersError(data.message || "Failed to load orders");
				}
			})
			.catch((err) => {
				setOrdersError("Failed to load orders");
				console.error("[OrderHistory] Orders error:", err);
			})
			.finally(() => setOrdersLoading(false));
	}, [user, token]);

	useEffect(() => {
		if (location.state && typeof location.state.activeTab === "string") {
			const tab = location.state.activeTab;
			if (["details", "credentials", "orders"].includes(tab)) {
				setActiveTab(tab as Tab);
			}
		}
	}, [location.state]);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
		section: keyof FormState | keyof UserDetails | keyof UserDetails["address"]
	) => {
		const value = e.target.value;

		if (
			["province", "district", "city", "localAddress", "landmark"].includes(
				section
			)
		) {
			setUserDetails((prev) => {
				if (!prev) return null;

				const newUserDetails = {
					...prev,
					address: {
						...prev.address,
						[section]: value,
					},
				};

				// Reset district when province changes
				if (section === "province") {
					newUserDetails.address.district = "";
				}

				return newUserDetails;
			});
		} else if (section in (userDetails || {})) {
			setUserDetails((prev) => (prev ? { ...prev, [section]: value } : null));
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
		if (!validateUsername(userDetails.username))
			return showPopup(
				"error",
				"Username must be 3+ characters and alphanumeric."
			);
		if (!validateFullName(userDetails.fullName))
			return showPopup("error", "Full name must be at least 2 characters.");
		if (
			userDetails.phoneNumber &&
			!validatePhoneNumber(userDetails.phoneNumber)
		)
			return showPopup("error", "Phone number must be 10 digits.");

		setIsLoading((prev) => ({ ...prev, saveUser: true }));

		try {
			const headers: Record<string, string> = {
				Accept: "application/json",
				"Content-Type": "application/json",
			};
			const authToken = token || localStorage.getItem("authToken");
			if (authToken) {
				headers.Authorization = `Bearer ${authToken}`;
				//("[UserProfile] handleSave - Using token:", authToken);
			}

			// Ensure address object structure
			const requestData = {
				fullName: userDetails.fullName,
				username: userDetails.username,
				phoneNumber: userDetails.phoneNumber,
				address: {
					province: userDetails.address?.province || "",
					district: userDetails.address?.district || "",
					city: userDetails.address?.city || "",
					localAddress: userDetails.address?.localAddress || "",
					landmark: userDetails.address?.landmark || "",
				},
			};

			//("[UserProfile] handleSave - Request data:", requestData);

			const response = await axiosInstance.put(
				`/api/auth/users/${userId}`,
				requestData,
				{
					withCredentials: true,
					headers,
				}
			);

			//("[UserProfile] handleSave - API response:", response.data);

			if (response.data.success) {

				// Normalize the response data structure
				const updatedData = response.data.data;
				const normalizedUpdatedData = {
					...updatedData,
					address: {
						province:
							updatedData.address?.province || updatedData.province || "",
						district:
							updatedData.address?.district || updatedData.district || "",
						city: updatedData.address?.city || updatedData.city || "",
						localAddress:
							updatedData.address?.localAddress ||
							updatedData.localAddress ||
							"",
						landmark:
							updatedData.address?.landmark || updatedData.landmark || "",
					},
				};

				setUserDetails(normalizedUpdatedData);
				setOriginalDetails(normalizedUpdatedData);
				setIsEditing(false);
				showPopup("success", "Profile updated successfully!");
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

	const renderUserDetails = () => {
		if (isLoading.fetchUser) {
			return (
				<div className="profile-form">
					{[...Array(9)].map((_, i) => (
						<div
							key={i}
							className="skeleton skeleton-form-group"
							style={{ height: i === 0 ? "40px" : i === 8 ? "48px" : "auto" }}
						/>
					))}
				</div>
			);
		}

		if (!userDetails)
			return (
				<div className="profile-form__loading">
					Failed to load user information
				</div>
			);

		return (
			<div className="profile-form">
				<h2 className="profile-form__title">User Details</h2>

				{/* First Row: Full Name and Username */}
				<div className="profile-form__row">
					<div className="profile-form__group profile-form__group--half">
						<label>Full Name</label>
						{isEditing ? (
							<input
								type="text"
								name="fullName"
								value={userDetails.fullName ?? ""}
								onChange={(e) => handleInputChange(e, "fullName")}
								className="profile-form__input"
							/>
						) : (
							<div>{userDetails.fullName || "Not provided"}</div>
						)}
					</div>
					<div className="profile-form__group profile-form__group--half">
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
							<div>{userDetails.username || "Not provided"}</div>
						)}
					</div>
				</div>

				{/* Second Row: Email and Phone Number */}
				<div className="profile-form__row">
					<div className="profile-form__group profile-form__group--half">
						<label>Email Address</label>
						{isEditing ? (
							<input
								type="email"
								name="email"
								value={userDetails.email ?? ""}
								readOnly
								className="profile-form__input"
							/>
						) : (
							<div>{userDetails.email}</div>
						)}
					</div>
					<div className="profile-form__group profile-form__group--half">
						<label>Phone Number</label>
						{isEditing ? (
							<input
								type="text"
								name="phoneNumber"
								value={userDetails.phoneNumber ?? ""}
								onChange={(e) => handleInputChange(e, "phoneNumber")}
								className="profile-form__input"
							/>
						) : (
							<div>{userDetails.phoneNumber || "Not provided"}</div>
						)}
					</div>
				</div>

				{/* Third Row: Province and District */}
				<div className="profile-form__row">
					<div className="profile-form__group profile-form__group--half">
						<label>Province</label>
						{isEditing ? (
							<select
								name="province"
								value={userDetails.address.province}
								onChange={(e) => handleInputChange(e, "province")}
								className={`profile__form-select`}
								required
							>
								<option value="">Select Province</option>
								{provinceData.map((p) => (
									<option
										key={p}
										value={p}
									>
										{p}
									</option>
								))}
							</select>
						) : (
							<div>{userDetails.address.province || "Not provided"}</div>
						)}
					</div>
					<div className="profile-form__group profile-form__group--half">
						<label>District</label>
						{isEditing ? (
							<select
								name="district"
								value={userDetails.address.district ?? ""}
								onChange={(e) => handleInputChange(e, "district")}
								className={`profile__form-select`}
								required
							>
								<option value="">Select District</option>
								{districtData.map((district) => (
									<option
										key={district}
										value={district}
									>
										{district}
									</option>
								))}
							</select>
						) : (
							<div>{userDetails.address.district || "Not provided"}</div>
						)}
					</div>
				</div>

				{/* Fourth Row: City and Local Address */}
				<div className="profile-form__row">
					<div className="profile-form__group profile-form__group--half">
						<label>City</label>
						{isEditing ? (
							<input
								type="text"
								name="city"
								value={userDetails.address.city ?? ""}
								onChange={(e) => handleInputChange(e, "city")}
								className="profile-form__input"
							/>
						) : (
							<div>{userDetails.address.city || "Not provided"}</div>
						)}
					</div>
					<div className="profile-form__group profile-form__group--half">
						<label>Local Address</label>
						{isEditing ? (
							<input
								type="text"
								name="localAddress"
								value={userDetails.address.localAddress ?? ""}
								onChange={(e) => handleInputChange(e, "localAddress")}
								className="profile-form__input"
							/>
						) : (
							<div>{userDetails.address.localAddress || "Not provided"}</div>
						)}
					</div>
				</div>

				{/* Landmark - Full width */}
				<div className="profile-form__group">
					<label>Landmark</label>
					{isEditing ? (
						<input
							type="text"
							name="landmark"
							value={userDetails.address.landmark ?? ""}
							onChange={(e) => handleInputChange(e, "landmark")}
							className="profile-form__input"
						/>
					) : (
						<div>{userDetails.address.landmark || "Not provided"}</div>
					)}
				</div>

				{/* Action Buttons */}
				{isEditing ? (
					<div className="profile-form__actions">
						<button
							className="btn-edit--primary"
							onClick={handleSave}
							disabled={isLoading.saveUser}
						>
							{isLoading.saveUser ? "Saving..." : "Save Changes"}
						</button>
						<button
							className="btn-edit--secondary"
							onClick={() => {
								setUserDetails(originalDetails);
								setIsEditing(false);
							}}
						>
							Cancel
						</button>
					</div>
				) : (
					<button
						className="btn-edit--primary"
						onClick={() => setIsEditing(true)}
					>
						Edit Profile
					</button>
				)}
			</div>
		);
	};

	const renderCredentials = () => {
		if (isLoading.fetchUser) {
			return (
				<div className="credentials">
					{[...Array(5)].map((_, i) => (
						<div
							key={i}
							className="skeleton skeleton-form-group"
							style={{ height: i === 0 ? "40px" : i === 4 ? "48px" : "auto" }}
						/>
					))}
				</div>
			);
		}

		return (
			<div className="credentials">
				<h2 className="credentials__main-title">Account Security</h2>
				<div className="credentials__header">
					<p className="credentials__description">
						Manage your password and account security
					</p>
					<div className="credentials__actions">
						<button
							className={`profile-form__help ${
								credentialsMode === "forgot" ? "active" : ""
							}`}
							onClick={() => setCredentialsMode("forgot")}
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
							<div className="credentials__email-display">
								{formState.email || userDetails?.email || "No email available"}
							</div>
						</div>
						<button
							className="btn btn--primary"
							onClick={handleForgotPassword}
							disabled={isLoading.forgot}
						>
							{isLoading.forgot ? "Sending..." : "Send Reset Email"}
						</button>
					</div>
				)}
				{credentialsMode === "reset" && (
					<div className="credentials__section">
						<h3>Enter Reset Token</h3>
						<p>
							Check your email for the reset token and enter your new password.
						</p>
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
						<div className="credentials__actions-row">
							<button
								className="btn btn--secondary"
								onClick={() => setCredentialsMode("forgot")}
							>
								Back to Email
							</button>
							<button
								className="btn btn--primary"
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

	const renderOrders = () => {
		if (ordersLoading) {
			return (
				<div className="orders">
					<div
						className="skeleton"
						style={{ width: "150px", height: "24px", marginBottom: "24px" }}
					/>
					<div className="orders__header">
						<div
							className="skeleton"
							style={{ width: "100px", height: "24px" }}
						/>
						<div
							className="skeleton"
							style={{ width: "80px", height: "24px" }}
						/>
					</div>
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="skeleton skeleton-order-item"
						/>
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
				<h2 className="orders__title">Order History</h2>
				<div className="orders__header">
					<div className="orders__header-col orders__header-col--id">
						Order ID
					</div>
					<div className="orders__header-col orders__header-col--date">
						Date
					</div>
					<div className="orders__header-col orders__header-col--status">
						Status
					</div>
					<div className="orders__header-col orders__header-col--products">
						Products
					</div>
					<div className="orders__header-col orders__header-col--payment">
						Payment
					</div>
					<div className="orders__header-col orders__header-col--total">
						Total
					</div>
				</div>
				<div className="orders__list">
					{orders.map((order) => (
						<div
							key={order.id}
							className={`order-item ${isMobile ? "order-item--mobile" : ""}`}
						>
							{isMobile ? (
								// Mobile view - simplified layout
								<>
									<div className="order-item__mobile-header">
										<div className="order-item__id">#{order.id}</div>
										<div className="order-item__mobile-products">
											{order.orderItems && order.orderItems.length > 0 ? (
												<div className="order-mobile-product">
													{(() => {
														const firstProduct = order.orderItems[0]
															.product as Product;
														return (
															<>
																{firstProduct &&
																firstProduct.productImages &&
																firstProduct.productImages.length > 0 ? (
																	<img
																		src={firstProduct.productImages[0]}
																		alt={firstProduct.name}
																		className="order-mobile-product__image"
																	/>
																) : (
																	<div className="order-mobile-product__placeholder">
																		?
																	</div>
																)}
																<div className="order-mobile-product__info">
																	<span className="order-mobile-product__name">
																		{firstProduct?.name || "Product"}
																		{order.orderItems.length > 1 && (
																			<span className="order-mobile-product__count">
																				{" "}
																				+{order.orderItems.length - 1} more
																			</span>
																		)}
																		<span
																			className="order-mobile-product__see-more"
																			onClick={() =>
																				toggleOrderDetails(order.id)
																			}
																		>
																			{expandedOrderDetails.has(order.id)
																				? " see less"
																				: " see more"}
																		</span>
																	</span>
																</div>
															</>
														);
													})()}
												</div>
											) : (
												<span>No items</span>
											)}
										</div>
									</div>

									{expandedOrderDetails.has(order.id) && (
										<div className="order-item__mobile-details">
											<div
												className="order-item__date"
												data-label="Date"
											>
												{new Date(order.createdAt).toLocaleDateString()}
											</div>
											<div
												className="order-item__status"
												data-label="Status"
											>
												<span
													className={`status-badge status-${order.status.toLowerCase()}`}
												>
													{order.status}
												</span>
											</div>
											<div
												className="order-item__products"
												data-label="Products"
											>
												{order.orderItems && order.orderItems.length > 0 ? (
													<div className="order-products">
														{(expandedOrders.has(order.id)
															? order.orderItems
															: order.orderItems.slice(0, 2)
														).map((item) => {
															const product = item.product as Product;
															return (
																<div
																	key={item.id}
																	className="order-product"
																>
																	{product &&
																	product.productImages &&
																	product.productImages.length > 0 ? (
																		<img
																			src={product.productImages[0]}
																			alt={product.name}
																			className="order-product__image"
																		/>
																	) : (
																		<div className="order-product__placeholder">
																			?
																		</div>
																	)}
																	<span className="order-product__name">
																		{product?.name || "Product"}
																	</span>
																	<span className="order-product__quantity">
																		x{item.quantity}
																	</span>
																</div>
															);
														})}
														{order.orderItems.length > 2 && (
															<div
																className="order-product-more clickable"
																onClick={() => toggleOrderExpansion(order.id)}
															>
																{expandedOrders.has(order.id)
																	? "Show less"
																	: `+${order.orderItems.length - 2} more`}
															</div>
														)}
													</div>
												) : (
													<span>No items</span>
												)}
											</div>
											<div
												className="order-item__payment"
												data-label="Payment"
											>
												<div
													className={`order-payment__method payment-method-${order.paymentMethod
														?.toLowerCase()
														.replace("_", "-")}`}
												>
													{formatPaymentMethod(order.paymentMethod)}
												</div>
											</div>
											<div
												className="order-item__total"
												data-label="Total"
											>
												<div className="order-total__amount">
												Rs. {parseFloat(order.totalPrice).toLocaleString()}
											</div>
											<div className="order-total__shipping">
												Shipping: Rs.{" "}
												{parseFloat(order.shippingFee).toLocaleString()}
											</div>
											<div className="order-total__delivery">
															<small>
																Delivery: {orderDeliveryTimes[order.id] || '3-5 days'}
															</small>
														</div>
											</div>
										</div>
									)}
								</>
							) : (
								// Desktop view - original layout
								<>
									<div
										className="order-item__id"
										data-label="Order ID"
									>
										#{order.id}
									</div>
									<div
										className="order-item__date"
										data-label="Date"
									>
										{new Date(order.createdAt).toLocaleDateString()}
									</div>
									<div
										className="order-item__status"
										data-label="Status"
									>
										<span
											className={`status-badge status-${order.status.toLowerCase()}`}
										>
											{order.status}
										</span>
									</div>
									<div
										className="order-item__products"
										data-label="Products"
									>
										{order.orderItems && order.orderItems.length > 0 ? (
											<div className="order-products">
												{(expandedOrders.has(order.id)
													? order.orderItems
													: order.orderItems.slice(0, 2)
												).map((item) => {
													const product = item.product as Product;
													return (
														<div
															key={item.id}
															className="order-product"
														>
															{product &&
															product.productImages &&
															product.productImages.length > 0 ? (
																<img
																	src={product.productImages[0]}
																	alt={product.name}
																	className="order-product__image"
																/>
															) : (
																<div className="order-product__placeholder">
																	?
																</div>
															)}
															<span className="order-product__name">
																{product?.name || "Product"}
															</span>
															<span className="order-product__quantity">
																x{item.quantity}
															</span>
														</div>
													);
												})}
												{order.orderItems.length > 2 && (
													<div
														className="order-product-more clickable"
														onClick={() => toggleOrderExpansion(order.id)}
													>
														{expandedOrders.has(order.id)
															? "Show less"
															: `+${order.orderItems.length - 2} more`}
													</div>
												)}
											</div>
										) : (
											<span>No items</span>
										)}
									</div>
									<div
										className="order-item__payment"
										data-label="Payment"
									>
										<div
											className={`order-payment__method payment-method-${order.paymentMethod
												?.toLowerCase()
												.replace("_", "-")}`}
										>
											{formatPaymentMethod(order.paymentMethod)}
										</div>
									</div>
									<div
										className="order-item__total"
										data-label="Total"
									>
										<div className="order-total__amount">
											Rs. {parseFloat(order.totalPrice).toLocaleString()}
										</div>
										<div className="order-total__shipping">
											Shipping: Rs.{" "}
											{parseFloat(order.shippingFee).toLocaleString()}
										</div>
										<div className="order-total__delivery">
															<small>
																Delivery: {orderDeliveryTimes[order.id] || '3-5 days'}
															</small>
														</div>
									</div>
								</>
							)}
						</div>
					))}
				</div>
			</div>
		);
	};

	return (
		<>
			<Navbar />
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
				<div className={`popup-content ${popup?.type}`}>
					<div className="popup-header">
						<span className="popup-icon">
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
						<span className="popup-title">
							{popup?.type === "success" ? "Success" : "Error"}
						</span>
					</div>
					<div className="popup-body">
						<p>{popup?.content}</p>
					</div>
					<button
						className="popup-close-btn"
						onClick={() => setPopup(null)}
					>
						Close
					</button>
				</div>
			</Popup>
			<div className="profile">
				<div
					className={`profile-card ${
						activeTab === "details" ||
						activeTab === "credentials" ||
						activeTab === "orders"
							? "profile-card--wide"
							: ""
					}`}
				>
					<div className="profile-sidebar">
						{isLoading.fetchUser ? (
							<>
								<div className="skeleton skeleton-avatar" />
								{[...Array(3)].map((_, i) => (
									<div
										key={i}
										className="skeleton skeleton-button"
									/>
								))}
							</>
						) : (
							<>
								<div
									className="profile-sidebar__avatar"
									style={{
										backgroundColor: userDetails?.username
											? getAvatarColor(userDetails.username)
											: "#f97316",
									}}
								>
									{userDetails?.username?.[0]?.toUpperCase() || "?"}
								</div>
								{userDetails.provider === "google"
									? (["details", "orders"] as Tab[]).map((tab) => {
											if (tab === "credentials" && user?.provider === "google")
												return null;
											return (
												<button
													key={tab}
													onClick={() => handleTabChange(tab)}
													className={`profile-sidebar__button ${
														activeTab === tab
															? "profile-sidebar__button--primary"
															: "profile-sidebar__button--secondary"
													}`}
												>
													{tab === "details"
														? "Manage Details"
														: tab === "credentials"
														? "Change Credentials"
														: "Order History"}
												</button>
											);
									  })
									: (["details", "credentials", "orders"] as Tab[]).map(
											(tab) => {
												if (
													tab === "credentials" &&
													user?.provider === "google"
												)
													return null;
												return (
													<button
														key={tab}
														onClick={() => handleTabChange(tab)}
														className={`profile-sidebar__button ${
															activeTab === tab
																? "profile-sidebar__button--primary"
																: "profile-sidebar__button--secondary"
														}`}
													>
														{tab === "details"
															? "Manage Details"
															: tab === "credentials"
															? "Change Credentials"
															: "Order History"}
													</button>
												);
											}
									  )}
							</>
						)}
					</div>
					<div className="profile-content">
						{activeTab === "details" && renderUserDetails()}
						{activeTab === "credentials" && renderCredentials()}
						{activeTab === "orders" && renderOrders()}
					</div>
				</div>
			</div>
			{!popup && <Footer />}
		</>
	);
};

export default UserProfile;
