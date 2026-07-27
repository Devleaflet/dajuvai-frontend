// UserProfile.tsx
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import type { OrderDetail } from "../Components/Types/Order";
import "../Styles/UserProfile.css";
import axiosInstance from "../api/axiosInstance";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import VendorService from "../services/vendorService";
import { FaCamera } from "react-icons/fa";
import { Vendor } from "../Components/Types/vendor";
import UserOrderDetailModal from "../Components/Modal/UserOrderDetailModal";
import defaultProductImage from "../assets/logo.webp";

interface UserDetails {
    id?: number;
    fullName: string;
    username: string;
    email?: string;
    provider?: string;
    role?: string;
    isVerified?: boolean;
    phoneNumber: string;
    profilePicture?: string | null;
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

    const [activeTab, setActiveTab] = useState<Tab>(() => {
        if (location.state && typeof location.state.activeTab === "string") {
            const tab = location.state.activeTab;
            if (["details", "credentials", "orders"].includes(tab))
                return tab as Tab;
        }
        return "details";
    });

    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(
        new Set(),
    );
    const [expandedOrderDetails, setExpandedOrderDetails] = useState<
        Set<number>
    >(new Set());
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
        null,
    );
    const [formState, setFormState] = useState<FormState>({ email: "" });
    const [credentialsMode, setCredentialsMode] =
        useState<CredentialsMode>("change");
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const [popup, setPopup] = useState<{
        type: "success" | "error";
        content: string;
    } | null>(null);
    const [provinceData, setProvinceData] = useState<string[]>([]);
    const [districtData, setDistrictData] = useState<string[]>([]);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [selectedOrderDetailId, setSelectedOrderDetailId] = useState<
        number | string | null
    >(null);

    const avatarInputRef = useRef<HTMLInputElement>(null);

    const {
        user,
        isLoading: isAuthLoading,
        login,
        token,
        fetchUserData,
    } = useAuth();
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
        const sum = username
            .split("")
            .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        return colors[sum % colors.length];
    };

    const showPopup = (type: "success" | "error", content: string) => {
        setPopup({ type, content });
        setTimeout(() => setPopup(null), 3000);
    };

    const validateUsername = (u: string) =>
        u.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(u);
    const validatePhone = (p: string) => /^[0-9]{10}$/.test(p);
    const validateFullName = (n: string) => n.trim().length >= 2;

    const handleError = (error: unknown, defaultMsg: string) => {
        if (!axios.isAxiosError(error)) return showPopup("error", defaultMsg);
        const { status, data } = error.response || {};
        const messages: Record<number, string> = {
            400: data?.message || "Invalid input.",
            401: "Unauthorized: Invalid or missing token.",
            403: "Forbidden: Not authorized.",
            404: "Resource not found.",
            409: data?.message || "This username is already in use.",
            410: "Token expired. Please try again.",
        };
        showPopup(
            "error",
            typeof status === "number" && messages[status]
                ? messages[status]
                : defaultMsg,
        );
    };

    const capitalizeFirstLetter = (s: string) =>
        s.charAt(0).toUpperCase() + s.slice(1);

    useEffect(() => {
        fetch("/Nepal-Address-API-main/data/provinces.json")
            .then((r) => r.json())
            .then((d) =>
                setProvinceData(d.provinces.map(capitalizeFirstLetter)),
            )
            .catch(console.error);
    }, []);

    const fetchDistricts = useCallback(async (province: string) => {
        if (!province) {
            setDistrictData([]);
            return;
        }
        try {
            const r = await fetch(
                `/Nepal-Address-API-main/data/districtsByProvince/${province.toLowerCase()}.json`,
            );
            const d = await r.json();
            setDistrictData(d.districts.map(capitalizeFirstLetter));
        } catch {
            setDistrictData([]);
        }
    }, []);

    useEffect(() => {
        if (userDetails?.address?.province)
            fetchDistricts(userDetails.address.province);
        else setDistrictData([]);
    }, [userDetails?.address?.province, fetchDistricts]);

    const toggleOrderExpansion = (id: number) =>
        setExpandedOrders((prev) => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });

    const toggleOrderDetails = (id: number) =>
        setExpandedOrderDetails((prev) => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });

    const formatPaymentMethod = (method: string) => {
        const map: Record<string, string> = {
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
        return map[method] || method;
    };

    const normalizeDistrict = (d: string) =>
        ["kathmandu", "lalitpur", "bhaktapur"].includes(d.toLowerCase())
            ? "Kathmandu Valley"
            : d;

    const calculateDeliveryTime = (cust: string, vend: string) =>
        normalizeDistrict(cust) === normalizeDistrict(vend)
            ? "1-2 days"
            : "3-5 days";

    const computeDeliveryTimeForOrder = (
        order: OrderDetail,
        vendorMap: Map<number, Vendor | null>,
    ): string => {
        const customerDistrict = order.shippingAddress?.district;
        if (!customerDistrict || !order.orderItems?.length) return "3-5 days";
        const vendorIds = [...new Set(order.orderItems.map((i) => i.vendorId))];
        const times = vendorIds
            .map((id) => vendorMap.get(id))
            .filter((v): v is Vendor => Boolean(v))
            .map((v) => calculateDeliveryTime(customerDistrict, v.district.name));
        if (times.some((t) => t === "3-5 days")) return "3-5 days";
        if (times.length && times.every((t) => t === "1-2 days"))
            return "1-2 days";
        return "3-5 days";
    };

    useEffect(() => {
        if (isAuthLoading) return;
        if (!userId) {
            fetch(`${API_BASE_URL}/api/auth/me`, {
                credentials: "include",
                headers: { Accept: "application/json" },
            })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success && data.data) {
                        login(null, {
                            id: data.data.id || data.data.userId,
                            email: data.data.email || "",
                            role: data.data.role,
                            username:
                                data.data.username ||
                                (data.data.email
                                    ? data.data.email.split("@")[0]
                                    : "User"),
                            isVerified: true,
                            provider: data.data.provider,
                            profilePicture: data.data.profilePicture,
                        });
                    } else {
                        showPopup(
                            "error",
                            "Authentication details missing. Please log in again.",
                        );
                    }
                })
                .catch(() =>
                    showPopup(
                        "error",
                        "Authentication details missing. Please log in again.",
                    ),
                );
            return;
        }

        const fetchUserDetails = async () => {
            setIsLoading((prev) => ({ ...prev, fetchUser: true }));
            try {
                const authToken = token || localStorage.getItem("authToken");
                const headers: Record<string, string> = {};
                if (authToken) headers.Authorization = `Bearer ${authToken}`;

                const response = await axiosInstance.get(
                    `/api/auth/users/${userId}`,
                    {
                        headers,
                        withCredentials: true,
                        timeout: 5000,
                    },
                );

                const userData = response.data.data;
                const normalized: UserDetails = {
                    ...userData,
                    fullName: userData.fullName || "",
                    phoneNumber: userData.phoneNumber || "",
                    address: {
                        province:
                            userData.address?.province ||
                            userData.province ||
                            "",
                        district:
                            userData.address?.district ||
                            userData.district ||
                            "",
                        city: userData.address?.city || userData.city || "",
                        localAddress:
                            userData.address?.localAddress ||
                            userData.localAddress ||
                            "",
                        landmark:
                            userData.address?.landmark ||
                            userData.landmark ||
                            "",
                    },
                };

                setUserDetails(normalized);
                setOriginalDetails(normalized);
                setFormState((prev) => ({ ...prev, email: userData.email }));
            } catch (error) {
                handleError(error, "Failed to load user details");
                setUserDetails(null);
            } finally {
                setIsLoading((prev) => ({ ...prev, fetchUser: false }));
            }
        };

        fetchUserDetails();
    }, [userId, isAuthLoading]);

    const ordersQuery = useQuery<OrderDetail[]>({
        queryKey: ["orders", "history", userId],
        enabled: !!userId,
        queryFn: async () => {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(
                `${API_BASE_URL}/api/order/customer/history`,
                { credentials: "include", headers },
            );
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data = await res.json();
            if (!data.success)
                throw new Error(data.message || "Failed to load orders");
            return data.data;
        },
    });

    const orders = ordersQuery.data ?? [];
    const ordersLoading = ordersQuery.isLoading;
    const ordersError = ordersQuery.isError
        ? ordersQuery.error instanceof Error
            ? ordersQuery.error.message
            : "Failed to load orders"
        : null;

    const vendorIds = useMemo(
        () => [
            ...new Set(
                orders.flatMap((order) =>
                    order.orderItems?.map((i) => i.vendorId) ?? [],
                ),
            ),
        ],
        [orders],
    );

    const vendorQueries = useQueries({
        queries: vendorIds.map((vendorId) => ({
            queryKey: ["vendor", vendorId],
            queryFn: () =>
                VendorService.getInstance().getVendorById(vendorId, token!),
            enabled: !!token,
            staleTime: 10 * 60 * 1000,
        })),
    });

    const vendorMap = useMemo(() => {
        const map = new Map<number, Vendor | null>();
        vendorIds.forEach((id, i) => map.set(id, vendorQueries[i]?.data ?? null));
        return map;
    }, [vendorIds, vendorQueries]);

    const orderDeliveryTimes = useMemo(
        () =>
            Object.fromEntries(
                orders.map((order) => [
                    order.id,
                    computeDeliveryTimeForOrder(order, vendorMap),
                ]),
            ),
        [orders, vendorMap],
    );

    useEffect(() => {
        if (location.state && typeof location.state.activeTab === "string") {
            const tab = location.state.activeTab;
            if (["details", "credentials", "orders"].includes(tab))
                setActiveTab(tab as Tab);
        }
    }, [location.state]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        section:
            | keyof FormState
            | keyof UserDetails
            | keyof UserDetails["address"],
    ) => {
        const value = e.target.value;
        if (
            [
                "province",
                "district",
                "city",
                "localAddress",
                "landmark",
            ].includes(section as string)
        ) {
            setUserDetails((prev) => {
                if (!prev) return null;
                const updated = {
                    ...prev,
                    address: { ...prev.address, [section]: value },
                };
                if (section === "province") updated.address.district = "";
                return updated;
            });
        } else if (section in (userDetails || {})) {
            setUserDetails((prev) =>
                prev ? { ...prev, [section]: value } : null,
            );
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
                "Username must be 3+ characters and alphanumeric.",
            );
        if (!validateFullName(userDetails.fullName))
            return showPopup(
                "error",
                "Full name must be at least 2 characters.",
            );
        if (userDetails.phoneNumber && !validatePhone(userDetails.phoneNumber))
            return showPopup("error", "Phone number must be 10 digits.");

        setIsLoading((prev) => ({ ...prev, saveUser: true }));
        try {
            const authToken = token || localStorage.getItem("authToken");
            const headers: Record<string, string> = {
                Accept: "application/json",
                "Content-Type": "application/json",
            };
            if (authToken) headers.Authorization = `Bearer ${authToken}`;

            const response = await axiosInstance.put(
                `/api/auth/users/${userId}`,
                {
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
                },
                { withCredentials: true, headers },
            );

            if (response.data.success) {
                const updated = response.data.data;
                const normalized: UserDetails = {
                    ...updated,
                    address: {
                        province:
                            updated.address?.province || updated.province || "",
                        district:
                            updated.address?.district || updated.district || "",
                        city: updated.address?.city || updated.city || "",
                        localAddress:
                            updated.address?.localAddress ||
                            updated.localAddress ||
                            "",
                        landmark:
                            updated.address?.landmark || updated.landmark || "",
                    },
                };
                setUserDetails(normalized);
                setOriginalDetails(normalized);
                setIsEditing(false);
                showPopup("success", "Profile updated successfully!");
            } else {
                showPopup(
                    "error",
                    response.data.message || "Failed to update profile",
                );
            }
        } catch (error) {
            handleError(error, "Failed to update profile");
        } finally {
            setIsLoading((prev) => ({ ...prev, saveUser: false }));
        }
    };

    const handleAvatarChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !userId) return;

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
            const authToken = token || localStorage.getItem("authToken");
            const formData = new FormData();
            formData.append("image", file);

            const uploadResponse = await fetch(
                `${API_BASE_URL}/api/image?folder=profile-pictures`,
                {
                    method: "POST",
                    headers: authToken
                        ? { Authorization: `Bearer ${authToken}` }
                        : {},
                    body: formData,
                },
            );
            const uploadResult = await uploadResponse.json();
            if (!uploadResponse.ok || !uploadResult.success)
                throw new Error(
                    uploadResult.message || "Failed to upload image",
                );

            const profilePictureUrl = uploadResult.data as string;

            const updateResponse = await axiosInstance.put(
                `/api/auth/users/${userId}`,
                { profilePicture: profilePictureUrl },
                {
                    headers: authToken
                        ? { Authorization: `Bearer ${authToken}` }
                        : {},
                },
            );

            if (updateResponse.data.success) {
                setUserDetails((prev) =>
                    prev
                        ? { ...prev, profilePicture: profilePictureUrl }
                        : prev,
                );
                setOriginalDetails((prev) =>
                    prev
                        ? { ...prev, profilePicture: profilePictureUrl }
                        : prev,
                );
                await fetchUserData(userId);
                showPopup("success", "Profile picture updated!");
            } else {
                showPopup(
                    "error",
                    updateResponse.data.message ||
                        "Failed to save profile picture",
                );
            }
        } catch (error) {
            handleError(error, "Failed to update profile picture");
        } finally {
            setIsUploadingAvatar(false);
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
            showPopup(
                "success",
                "Password reset email sent! Check your inbox.",
            );
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
                            style={{
                                height:
                                    i === 0
                                        ? "40px"
                                        : i === 8
                                          ? "48px"
                                          : "auto",
                            }}
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

                <div className="profile-form__row">
                    <div className="profile-form__group profile-form__group--half">
                        <label>Full Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={userDetails.fullName ?? ""}
                                className="profile-form__input"
                                onChange={(e) =>
                                    handleInputChange(e, "fullName")
                                }
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
                                value={userDetails.username ?? ""}
                                className="profile-form__input"
                                onChange={(e) =>
                                    handleInputChange(e, "username")
                                }
                            />
                        ) : (
                            <div>{userDetails.username || "Not provided"}</div>
                        )}
                    </div>
                </div>

                <div className="profile-form__row">
                    <div className="profile-form__group profile-form__group--half">
                        <label>Email Address</label>
                        <div>{userDetails.email}</div>
                    </div>
                    <div className="profile-form__group profile-form__group--half">
                        <label>Phone Number</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={userDetails.phoneNumber ?? ""}
                                className="profile-form__input"
                                onChange={(e) =>
                                    handleInputChange(e, "phoneNumber")
                                }
                            />
                        ) : (
                            <div>
                                {userDetails.phoneNumber || "Not provided"}
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-form__row">
                    <div className="profile-form__group profile-form__group--half">
                        <label>Province</label>
                        {isEditing ? (
                            <select
                                value={userDetails.address.province}
                                className="profile__form-select"
                                onChange={(e) =>
                                    handleInputChange(e, "province")
                                }
                            >
                                <option value="">Select Province</option>
                                {provinceData.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div>
                                {userDetails.address.province || "Not provided"}
                            </div>
                        )}
                    </div>
                    <div className="profile-form__group profile-form__group--half">
                        <label>District</label>
                        {isEditing ? (
                            <select
                                value={userDetails.address.district ?? ""}
                                className="profile__form-select"
                                onChange={(e) =>
                                    handleInputChange(e, "district")
                                }
                            >
                                <option value="">Select District</option>
                                {districtData.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div>
                                {userDetails.address.district || "Not provided"}
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-form__row">
                    <div className="profile-form__group profile-form__group--half">
                        <label>City</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={userDetails.address.city ?? ""}
                                className="profile-form__input"
                                onChange={(e) => handleInputChange(e, "city")}
                            />
                        ) : (
                            <div>
                                {userDetails.address.city || "Not provided"}
                            </div>
                        )}
                    </div>
                    <div className="profile-form__group profile-form__group--half">
                        <label>Local Address</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={userDetails.address.localAddress ?? ""}
                                className="profile-form__input"
                                onChange={(e) =>
                                    handleInputChange(e, "localAddress")
                                }
                            />
                        ) : (
                            <div>
                                {userDetails.address.localAddress ||
                                    "Not provided"}
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-form__group">
                    <label>Landmark</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={userDetails.address.landmark ?? ""}
                            className="profile-form__input"
                            onChange={(e) => handleInputChange(e, "landmark")}
                        />
                    ) : (
                        <div>
                            {userDetails.address.landmark || "Not provided"}
                        </div>
                    )}
                </div>

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
                            style={{
                                height:
                                    i === 0
                                        ? "40px"
                                        : i === 4
                                          ? "48px"
                                          : "auto",
                            }}
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
                            className={`profile-form__help ${credentialsMode === "forgot" ? "active" : ""}`}
                            onClick={() => setCredentialsMode("forgot")}
                        >
                            Forgot Password
                        </button>
                    </div>
                </div>

                {credentialsMode === "forgot" && (
                    <div className="credentials__section">
                        <h3>Reset Password</h3>
                        <p>
                            Enter your email address to receive a reset token.
                        </p>
                        <div className="profile-form__group">
                            <label className="profile-form__label">
                                Email Address
                            </label>
                            <div className="credentials__email-display">
                                {formState.email ||
                                    userDetails?.email ||
                                    "No email available"}
                            </div>
                        </div>
                        <button
                            className="btn btn--primary"
                            onClick={handleForgotPassword}
                            disabled={isLoading.forgot}
                        >
                            {isLoading.forgot
                                ? "Sending..."
                                : "Send Reset Email"}
                        </button>
                    </div>
                )}

                {credentialsMode === "reset" && (
                    <div className="credentials__section">
                        <h3>Enter Reset Token</h3>
                        <p>
                            Check your email for the reset token and enter your
                            new password.
                        </p>
                        <div className="profile-form__group">
                            <label className="profile-form__label">
                                Reset Token
                            </label>
                            <input
                                type="text"
                                placeholder="Enter reset token"
                                value={formState.token ?? ""}
                                onChange={(e) => handleInputChange(e, "token")}
                            />
                        </div>
                        <div className="profile-form__group">
                            <label className="profile-form__label">
                                New Password
                            </label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={formState.newPassword ?? ""}
                                onChange={(e) =>
                                    handleInputChange(e, "newPassword")
                                }
                            />
                        </div>
                        <div className="profile-form__group">
                            <label className="profile-form__label">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={formState.confirmPassword ?? ""}
                                onChange={(e) =>
                                    handleInputChange(e, "confirmPassword")
                                }
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
                                {isLoading.reset
                                    ? "Resetting..."
                                    : "Reset Password"}
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
                        style={{
                            width: "150px",
                            height: "24px",
                            marginBottom: "24px",
                        }}
                    />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton skeleton-order-item" />
                    ))}
                </div>
            );
        }
        if (ordersError)
            return <div className="orders__error">{ordersError}</div>;
        if (!orders.length)
            return <div className="orders__empty">No orders found.</div>;

        return (
            <div className="orders">
                <h2 className="orders__title">Order History</h2>
                <div className="orders__header">
                    <div className="orders__header-col">Order ID</div>
                    <div className="orders__header-col">Date</div>
                    <div className="orders__header-col">Status</div>
                    <div className="orders__header-col">Products</div>
                    <div className="orders__header-col">Payment</div>
                    <div className="orders__header-col">Total</div>
                </div>
                <div className="orders__list">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className={`order-item ${isMobile ? "order-item--mobile" : ""}`}
                            onClick={() => setSelectedOrderDetailId(order.id)}
                            style={{ cursor: "pointer" }}
                        >
                            {isMobile ? (
                                <>
                                    <div className="order-item__mobile-header">
                                        <div className="order-item__id">
                                            #{order.orderNumber || order.id}
                                        </div>
                                        <div className="order-item__mobile-products">
                                            {order.orderItems &&
                                            order.orderItems.length > 0 ? (
                                                (() => {
                                                    const first = order
                                                        .orderItems[0]
                                                        .product as Product;
                                                    const imgSrc = order
                                                        .orderItems[0].variant
                                                        ? order.orderItems[0]
                                                              .variant
                                                              .variantImages[0]
                                                        : order.orderItems[0]
                                                              .product
                                                              .productImages[0];

                                                    return (
                                                        <div className="order-mobile-product">
                                                            <img
                                                                src={
                                                                    imgSrc ||
                                                                    defaultProductImage
                                                                }
                                                                alt={
                                                                    first.name
                                                                }
                                                                className="order-mobile-product__image"
                                                                onError={(
                                                                    e,
                                                                ) => {
                                                                    (
                                                                        e.target as HTMLImageElement
                                                                    ).src =
                                                                        defaultProductImage as string;
                                                                }}
                                                            />
                                                            <div className="order-mobile-product__info">
                                                                <span className="order-mobile-product__name">
                                                                    {first?.name ||
                                                                        "Product"}
                                                                    {order
                                                                        .orderItems
                                                                        .length >
                                                                        1 && (
                                                                        <span className="order-mobile-product__count">
                                                                            {" "}
                                                                            +
                                                                            {order
                                                                                .orderItems
                                                                                .length -
                                                                                1}{" "}
                                                                            more
                                                                        </span>
                                                                    )}
                                                                    <span
                                                                        className="order-mobile-product__see-more"
                                                                        onClick={() =>
                                                                            toggleOrderDetails(
                                                                                order.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        {expandedOrderDetails.has(
                                                                            order.id,
                                                                        )
                                                                            ? " see less"
                                                                            : " see more"}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()
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
                                                {new Date(
                                                    order.createdAt,
                                                ).toLocaleDateString()}
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
                                                <div className="order-products">
                                                    {(expandedOrders.has(
                                                        order.id,
                                                    )
                                                        ? order.orderItems
                                                        : order.orderItems.slice(
                                                              0,
                                                              2,
                                                          )
                                                    ).map((item) => {
                                                        const product =
                                                            item.product as Product;
                                                        const imgSrc =
                                                            item.variant
                                                                ? item.variant
                                                                      .variantImages[0]
                                                                : item.product
                                                                      .productImages[0];
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className="order-product"
                                                            >
                                                                <img
                                                                    src={
                                                                        imgSrc ||
                                                                        defaultProductImage
                                                                    }
                                                                    alt={
                                                                        product.name
                                                                    }
                                                                    className="order-product__image"
                                                                    onError={(
                                                                        e,
                                                                    ) => {
                                                                        (
                                                                            e.target as HTMLImageElement
                                                                        ).src =
                                                                            defaultProductImage as string;
                                                                    }}
                                                                />
                                                                <span className="order-product__name">
                                                                    {product?.name ||
                                                                        "Product"}
                                                                </span>
                                                                <span className="order-product__quantity">
                                                                    x
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                    {order.orderItems.length >
                                                        2 && (
                                                        <div
                                                            className="order-product-more clickable"
                                                            onClick={() =>
                                                                toggleOrderExpansion(
                                                                    order.id,
                                                                )
                                                            }
                                                        >
                                                            {expandedOrders.has(
                                                                order.id,
                                                            )
                                                                ? "Show less"
                                                                : `+${order.orderItems.length - 2} more`}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div
                                                className="order-item__payment"
                                                data-label="Payment"
                                            >
                                                <div
                                                    className={`order-payment__method payment-method-${order.paymentMethod?.toLowerCase().replace("_", "-")}`}
                                                >
                                                    {formatPaymentMethod(
                                                        order.paymentMethod,
                                                    )}
                                                </div>
                                            </div>
                                            <div
                                                className="order-item__total"
                                                data-label="Total"
                                            >
                                                <div className="order-total__amount">
                                                    Rs.{" "}
                                                    {parseFloat(
                                                        order.totalPrice,
                                                    ).toLocaleString()}
                                                </div>
                                                <div className="order-total__shipping">
                                                    Shipping: Rs.{" "}
                                                    {parseFloat(
                                                        order.shippingFee,
                                                    ).toLocaleString()}
                                                </div>
                                                <div className="order-total__delivery">
                                                    <small>
                                                        Delivery:{" "}
                                                        {orderDeliveryTimes[
                                                            order.id
                                                        ] || "3-5 days"}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div
                                        className="order-item__id"
                                        data-label="Order ID"
                                    >
                                        #{order.orderNumber || order.id}
                                    </div>
                                    <div
                                        className="order-item__date"
                                        data-label="Date"
                                    >
                                        {new Date(
                                            order.createdAt,
                                        ).toLocaleDateString()}
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
                                        <div className="order-products">
                                            {(expandedOrders.has(order.id)
                                                ? order.orderItems
                                                : order.orderItems.slice(0, 2)
                                            ).map((item) => {
                                                const product =
                                                    item.product as Product;
                                                const imgSrc = item.variant
                                                    ? item.variant
                                                          .variantImages[0]
                                                    : item.product
                                                          .productImages[0];
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="order-product"
                                                    >
                                                        <img
                                                            src={
                                                                imgSrc ||
                                                                defaultProductImage
                                                            }
                                                            alt={
                                                                product.name
                                                            }
                                                            className="order-product__image"
                                                            onError={(e) => {
                                                                (
                                                                    e.target as HTMLImageElement
                                                                ).src =
                                                                    defaultProductImage as string;
                                                            }}
                                                        />
                                                        <span className="order-product__name">
                                                            {product?.name ||
                                                                "Product"}
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
                                                    onClick={() =>
                                                        toggleOrderExpansion(
                                                            order.id,
                                                        )
                                                    }
                                                >
                                                    {expandedOrders.has(
                                                        order.id,
                                                    )
                                                        ? "Show less"
                                                        : `+${order.orderItems.length - 2} more`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className="order-item__payment"
                                        data-label="Payment"
                                    >
                                        <div
                                            className={`order-payment__method payment-method-${order.paymentMethod?.toLowerCase().replace("_", "-")}`}
                                        >
                                            {formatPaymentMethod(
                                                order.paymentMethod,
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className="order-item__total"
                                        data-label="Total"
                                    >
                                        <div className="order-total__amount">
                                            Rs.{" "}
                                            {parseFloat(
                                                order.totalPrice,
                                            ).toLocaleString()}
                                        </div>
                                        <div className="order-total__shipping">
                                            Shipping: Rs.{" "}
                                            {parseFloat(
                                                order.shippingFee,
                                            ).toLocaleString()}
                                        </div>
                                        <div className="order-total__delivery">
                                            <small>
                                                Delivery:{" "}
                                                {orderDeliveryTimes[order.id] ||
                                                    "3-5 days"}
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
                onClose={() => setPopup(null)}
                contentStyle={{
                    borderRadius: "12px",
                    maxWidth: "400px",
                    background: "transparent",
                    padding: 0,
                    border: "none",
                }}
                overlayStyle={{
                    backgroundColor: "rgba(0,0,0,0.6)",
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
                    className={`profile-card ${["details", "credentials", "orders"].includes(activeTab) ? "profile-card--wide" : ""}`}
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
                                {/* Avatar wrapper with camera edit button */}
                                <div className="profile-sidebar__avatar-wrapper">
                                    <div
                                        className="profile-sidebar__avatar"
                                        style={{
                                            backgroundColor:
                                                userDetails?.username
                                                    ? getAvatarColor(
                                                          userDetails.username,
                                                      )
                                                    : "#f97316",
                                        }}
                                    >
                                        {userDetails?.profilePicture ? (
                                            <img
                                                src={userDetails.profilePicture}
                                                alt={
                                                    userDetails.username ||
                                                    "User"
                                                }
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    borderRadius: "inherit",
                                                }}
                                                onError={(e) => {
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).style.display = "none";
                                                }}
                                            />
                                        ) : (
                                            userDetails?.username?.[0]?.toUpperCase() ||
                                            "?"
                                        )}
                                    </div>

                                    {isUploadingAvatar && (
                                        <div className="user-avatar-overlay">
                                            <div className="user-avatar-spinner" />
                                        </div>
                                    )}

                                    <button
                                        className={`user-avatar-edit-btn ${isUploadingAvatar ? "user-avatar-edit-btn--disabled" : ""}`}
                                        onClick={() =>
                                            avatarInputRef.current?.click()
                                        }
                                        disabled={isUploadingAvatar}
                                        title="Change profile picture"
                                        type="button"
                                    >
                                        <FaCamera size={11} />
                                    </button>

                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        onChange={handleAvatarChange}
                                        disabled={isUploadingAvatar}
                                        style={{ display: "none" }}
                                    />
                                </div>

                                {(userDetails?.provider === "google"
                                    ? (["details", "orders"] as Tab[])
                                    : ([
                                          "details",
                                          "credentials",
                                          "orders",
                                      ] as Tab[])
                                ).map((tab) => (
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
                                ))}
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

            <UserOrderDetailModal
                show={selectedOrderDetailId !== null}
                onClose={() => setSelectedOrderDetailId(null)}
                orderId={selectedOrderDetailId}
            />
        </>
    );
};

export default UserProfile;
