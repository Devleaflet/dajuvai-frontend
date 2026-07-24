import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import Pagination from "../Components/Pagination";
import VendorEditModal from "../Components/Modal/VendorEditModal";
import VendorViewModal from "../Components/Modal/VendorViewModal";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import {
    Vendor,
    District,
    ApiResponse,
    VendorUpdateRequest,
} from "../Components/Types/vendor";
import "../Styles/AdminVendor.css";
import "../Styles/AdminDashboard.css";
import { useDocketHeight } from "../Hook/UseDockerHeight";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const SkeletonRow: React.FC = () => {
    return (
        <tr className="admin-vendors__table-row">
            <td>
                <div className="admin-vendors__skeleton"></div>
            </td>
            <td>
                <div className="admin-vendors__skeleton"></div>
            </td>
            <td>
                <div className="admin-vendors__skeleton"></div>
            </td>
            <td>
                <div className="admin-vendors__skeleton"></div>
            </td>
            <td>
                <div className="admin-vendors__skeleton"></div>
            </td>
            <td>
                <div className="admin-vendors__skeleton"></div>
            </td>
            <td>
                <div className="admin-vendors__skeleton"></div>
            </td>
            <td>
                <div className="admin-vendors__skeleton"></div>
            </td>
        </tr>
    );
};

const createVendorAPI = (token: string | null) => ({
    async getAll(): Promise<Vendor[]> {
        try {
            if (!token) {
                throw new Error("No token provided. Please log in.");
            }
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const response = await fetch(`${API_BASE_URL}/api/vendors`, {
                method: "GET",
                headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: ApiResponse<Vendor[]> = await response.json();
            return (result.data || []).map((vendor) => ({
                ...vendor,
                status:
                    vendor.isVerified && vendor.isApproved !== false
                        ? "Active"
                        : "Inactive",
                isApproved:
                    vendor.isApproved !== undefined ? vendor.isApproved : true,
                taxNumber: vendor.taxNumber || "N/A",
                taxDocuments: Array.isArray(vendor.taxDocuments)
                    ? vendor.taxDocuments
                    : vendor.taxDocuments
                      ? [vendor.taxDocuments]
                      : [],
                businessRegNumber: vendor.businessRegNumber || "N/A",
                citizenshipDocuments: Array.isArray(vendor.citizenshipDocuments)
                    ? vendor.citizenshipDocuments
                    : vendor.citizenshipDocuments
                      ? [vendor.citizenshipDocuments]
                      : [],
                chequePhoto: Array.isArray(vendor.chequePhoto)
                    ? vendor.chequePhoto
                    : vendor.chequePhoto
                      ? [vendor.chequePhoto]
                      : [],
                accountName: vendor.accountName || "N/A",
                bankName: vendor.bankName || "N/A",
                accountNumber: vendor.accountNumber || "N/A",
                bankBranch: vendor.bankBranch || "N/A",
                bankCode: vendor.bankCode || "N/A",
                businessAddress: vendor.businessAddress || "N/A",
                profilePicture: vendor.profilePicture || "N/A",
            })) as Vendor[];
        } catch (error) {
            console.error("Error fetching vendors:", error);
            throw error;
        }
    },

    async getUnapproved(): Promise<Vendor[]> {
        try {
            if (!token) {
                throw new Error("No token provided. Please log in.");
            }
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const response = await fetch(
                `${API_BASE_URL}/api/vendors/unapprove/list`,
                {
                    method: "GET",
                    headers,
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: ApiResponse<Vendor[]> = await response.json();
            return (result.data || []).map((vendor) => ({
                ...vendor,
                status: "Inactive",
                isApproved: vendor.isApproved || false,
                taxNumber: vendor.taxNumber || "N/A",
                taxDocuments: Array.isArray(vendor.taxDocuments)
                    ? vendor.taxDocuments
                    : vendor.taxDocuments
                      ? [vendor.taxDocuments]
                      : [],
                businessRegNumber: vendor.businessRegNumber || "N/A",
                citizenshipDocuments: Array.isArray(vendor.citizenshipDocuments)
                    ? vendor.citizenshipDocuments
                    : vendor.citizenshipDocuments
                      ? [vendor.citizenshipDocuments]
                      : [],
                chequePhoto: Array.isArray(vendor.chequePhoto)
                    ? vendor.chequePhoto
                    : vendor.chequePhoto
                      ? [vendor.chequePhoto]
                      : [],
                accountName: vendor.accountName || "N/A",
                bankName: vendor.bankName || "N/A",
                accountNumber: vendor.accountNumber || "N/A",
                bankBranch: vendor.bankBranch || "N/A",
                bankCode: vendor.bankCode || "N/A",
                businessAddress: vendor.businessAddress || "N/A",
                profilePicture: vendor.profilePicture || "N/A",
            })) as Vendor[];
        } catch (error) {
            console.error("Error fetching unapproved vendors:", error);
            throw error;
        }
    },

    async approve(id: number): Promise<void> {
        try {
            if (!token) {
                throw new Error("No token provided. Please log in.");
            }
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const response = await fetch(
                `${API_BASE_URL}/api/vendors/approve/${id}`,
                {
                    method: "PUT",
                    headers,
                },
            );

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorText = await response.text();
                    errorMessage += `, body: ${errorText}`;
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (parseError) {
                    console.error(
                        "Failed to parse error response:",
                        parseError,
                    );
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Failed to approve vendor");
            }
        } catch (error) {
            console.error("Error approving vendor:", error);
            throw error;
        }
    },

    async reject(id: number, rejectionReason: string): Promise<void> {
        try {
            if (!token) {
                throw new Error("No token provided. Please log in.");
            }
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const response = await fetch(
                `${API_BASE_URL}/api/vendors/reject/${id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({ rejectionReason }),
                    headers,
                },
            );

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorText = await response.text();
                    errorMessage += `, body: ${errorText}`;
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (parseError) {
                    console.error(
                        "Failed to parse error response:",
                        parseError,
                    );
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Failed to reject vendor");
            }
        } catch (error) {
            console.error("Error rejecting vendor:", error);
            throw error;
        }
    },

    async update(
        id: number,
        vendorData: Partial<VendorUpdateRequest>,
    ): Promise<Vendor> {
        try {
            if (!token) {
                throw new Error("No token provided. Please log in.");
            }

            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const response = await fetch(
                `${API_BASE_URL}/api/vendors/v2/${id}`,
                {
                    method: "PUT",
                    headers,
                    body: JSON.stringify(vendorData),
                },
            );

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorText = await response.text();
                    errorMessage += `, body: ${errorText}`;
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (parseError) {
                    console.error(
                        "Failed to parse error response:",
                        parseError,
                    );
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            //("PUT response:", result);

            if (!result.success) {
                throw new Error(result.message || "Failed to update vendor");
            }

            if (!result.data) {
                throw new Error("Vendor update did not return vendor data");
            }

            return {
                ...result.data,
                phoneNumber: result.data.phoneNumber || "",
                taxNumber: result.data.taxNumber || "",
                taxDocuments: Array.isArray(result.data.taxDocuments)
                    ? result.data.taxDocuments
                    : result.data.taxDocuments
                      ? [result.data.taxDocuments]
                      : [],
                businessRegNumber: result.data.businessRegNumber || "",
                citizenshipDocuments: Array.isArray(
                    result.data.citizenshipDocuments,
                )
                    ? result.data.citizenshipDocuments
                    : result.data.citizenshipDocuments
                      ? [result.data.citizenshipDocuments]
                      : [],
                chequePhoto: Array.isArray(result.data.chequePhoto)
                    ? result.data.chequePhoto
                    : result.data.chequePhoto
                      ? [result.data.chequePhoto]
                      : [],
                paymentOptions: result.data.paymentOptions || [],
                accountName: result.data.accountName || "",
                bankName: result.data.bankName || "",
                accountNumber: result.data.accountNumber || "",
                bankBranch: result.data.bankBranch || "",
                bankCode: result.data.bankCode || "",
                businessAddress: result.data.businessAddress || "",
                profilePicture: result.data.profilePicture || "",
                isVerified: !!result.data.isVerified,
                status: result.data.isVerified ? "Active" : "Inactive",
            };
        } catch (error) {
            console.error("Error updating vendor:", error);
            throw error;
        }
    },

    async delete(id: number): Promise<void> {
        try {
            if (!token) {
                throw new Error("No token provided. Please log in.");
            }
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const response = await fetch(`${API_BASE_URL}/api/vendors/${id}`, {
                method: "DELETE",
                headers,
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorText = await response.text();
                    errorMessage += `, body: ${errorText}`;
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (parseError) {
                    console.error(
                        "Failed to parse error response:",
                        parseError,
                    );
                }
                throw new Error(errorMessage);
            }

            if (response.status !== 204) {
                const result = await response.json();
                if (!result.success) {
                    throw new Error(
                        result.message || "Failed to delete vendor",
                    );
                }
            }
        } catch (error) {
            console.error("Error deleting vendor:", error);
            throw error;
        }
    },

    async changeVendorPassword(
        vendorId: number,
        newPass: string,
        confirmPass: string,
    ): Promise<void> {
        try {
            if (!token) {
                throw new Error("No token provided. Please log in.");
            }
            const response = await fetch(
                `${API_BASE_URL}/api/auth/admin/vendors/${vendorId}/change-vendor-password`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ newPass, confirmPass }),
                },
            );

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorText = await response.text();
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) errorMessage = errorData.message;
                } catch {
                    // ignore parse error
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(
                    result.message || "Failed to change vendor password",
                );
            }
        } catch (error) {
            console.error("Error changing vendor password:", error);
            throw error;
        }
    },
});

interface ConfirmationModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    action: "approve" | "reject" | "delete";
    rejectionReason?: string;
    onRejectionReasonChange?: (value: string) => void;
    isSubmitting?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    show,
    onClose,
    onConfirm,
    action,
    rejectionReason = "",
    onRejectionReasonChange,
    isSubmitting = false,
}) => {
    if (!show) return null;

    const getActionConfig = () => {
        switch (action) {
            case "approve":
                return {
                    icon: "✓",
                    color: "#4caf50",
                    title: "Approve Vendor",
                    message:
                        "Are you sure you want to approve this vendor? They will be able to start selling products.",
                    confirmText: "Yes, Approve",
                    cancelText: "Cancel",
                };
            case "reject":
                return {
                    icon: "✕",
                    color: "#f44336",
                    title: "Reject Vendor",
                    message:
                        "Are you sure you want to reject this vendor? They will be notified of the rejection.",
                    confirmText: "Yes, Reject",
                    cancelText: "Cancel",
                };
            case "delete":
                return {
                    icon: "🗑",
                    color: "#ff5722",
                    title: "Delete Vendor",
                    message:
                        "Are you sure you want to delete this vendor? This action cannot be undone and all vendor data will be permanently removed.",
                    confirmText: "Yes, Delete",
                    cancelText: "Cancel",
                };
        }
    };

    const config = getActionConfig();

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                backdropFilter: "blur(4px)",
            }}
        >
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "0",
                    maxWidth: "480px",
                    width: "90%",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                    animation: "slideIn 0.3s ease-out",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)`,
                        padding: "24px",
                        borderRadius: "12px 12px 0 0",
                        color: "white",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: "48px",
                            marginBottom: "12px",
                            lineHeight: 1,
                        }}
                    >
                        {config.icon}
                    </div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "24px",
                            fontWeight: "600",
                        }}
                    >
                        {config.title}
                    </h2>
                </div>

                {/* Content */}
                <div
                    style={{
                        padding: "32px 24px 16px",
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: "16px",
                            lineHeight: "1.6",
                            color: "#555",
                            textAlign: "center",
                        }}
                    >
                        {config.message}
                    </p>

                    {action === "reject" && (
                        <div style={{ marginTop: "16px", textAlign: "left" }}>
                            <label
                                htmlFor="rejection-reason"
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: 600,
                                    color: "#333",
                                }}
                            >
                                Rejection reason
                            </label>
                            <input
                                id="rejection-reason"
                                value={rejectionReason}
                                onChange={(e) =>
                                    onRejectionReasonChange?.(e.target.value)
                                }
                                placeholder="Enter the reason for rejecting this vendor"
                                disabled={isSubmitting}
                                // rows={2}
                                style={{
                                    width: "100%",
                                    resize: "vertical",
                                    border: "1px solid #d0d7de",
                                    borderRadius: "8px",
                                    padding: "10px 12px",
                                    fontSize: "14px",
                                    color: "#222",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div
                    style={{
                        padding: "0 24px 24px",
                        display: "flex",
                        gap: "12px",
                        justifyContent: "center",
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: "12px 24px",
                            fontSize: "15px",
                            fontWeight: "500",
                            border: "2px solid #e0e0e0",
                            borderRadius: "8px",
                            backgroundColor: "white",
                            color: "#666",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            outline: "none",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f5f5f5";
                            e.currentTarget.style.borderColor = "#ccc";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.borderColor = "#e0e0e0";
                        }}
                    >
                        {config.cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={
                            action === "reject" && !rejectionReason.trim()
                        }
                        style={{
                            flex: 1,
                            padding: "12px 24px",
                            fontSize: "15px",
                            fontWeight: "600",
                            border: "none",
                            borderRadius: "8px",
                            backgroundColor: config.color,
                            color: "white",
                            cursor:
                                action === "reject" && !rejectionReason.trim()
                                    ? "not-allowed"
                                    : "pointer",
                            transition: "all 0.2s ease",
                            outline: "none",
                            boxShadow: `0 4px 12px ${config.color}40`,
                            opacity:
                                action === "reject" && !rejectionReason.trim()
                                    ? 0.7
                                    : 1,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                                "translateY(-2px)";
                            e.currentTarget.style.boxShadow = `0 6px 16px ${config.color}60`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = `0 4px 12px ${config.color}40`;
                        }}
                    >
                        {isSubmitting ? "Loading..." : config.confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ChangePasswordModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (newPass: string, confirmPass: string) => Promise<void>;
    loading: boolean;
    error: string;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    show,
    onClose,
    onSubmit,
    loading,
    error,
}) => {
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [localError, setLocalError] = useState("");

    const meetsLength = newPass.length >= 8;
    const meetsNumber = /[0-9]/.test(newPass);
    const meetsUpper = /[A-Z]/.test(newPass);
    const meetsSymbol = /[^a-zA-Z0-9]/.test(newPass);
    const isPasswordValid = meetsLength && meetsNumber && meetsUpper && meetsSymbol;
    const isFormValid = isPasswordValid && newPass === confirmPass;

    useEffect(() => {
        if (!show) {
            setNewPass("");
            setConfirmPass("");
            setShowNew(false);
            setShowConfirm(false);
            setLocalError("");
        }
    }, [show]);

    if (!show) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");
        if (!isPasswordValid) {
            setLocalError("Password must meet all criteria.");
            return;
        }
        if (newPass !== confirmPass) {
            setLocalError("Passwords do not match.");
            return;
        }
        await onSubmit(newPass, confirmPass);
    };

    const displayError = localError || error;

    const eyeOpen = (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#666"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
    const eyeClosed = (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#666"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12s4-6 10-6c2.5 0 4.7 1 6.5 2.5" />
            <path d="M22 12s-4 6-10 6c-2.5 0-4.7-1-6.5-2.5" />
            <circle cx="12" cy="12" r="3" />
            <line x1="3" y1="3" x2="21" y2="21" />
        </svg>
    );

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                backdropFilter: "blur(4px)",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    maxWidth: "440px",
                    width: "90%",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                    animation: "slideIn 0.3s ease-out",
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background:
                            "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        padding: "24px",
                        color: "white",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: "40px",
                            marginBottom: "10px",
                            lineHeight: 1,
                        }}
                    >
                        🔑
                    </div>
                    <h2
                        style={{ margin: 0, fontSize: "22px", fontWeight: 600 }}
                    >
                        Change Vendor Password
                    </h2>
                    <p
                        style={{
                            margin: "6px 0 0",
                            fontSize: "13px",
                            opacity: 0.85,
                        }}
                    >
                        Set a new password for this vendor account
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    style={{ padding: "28px 24px 24px" }}
                >
                    {displayError && (
                        <div
                            style={{
                                backgroundColor: "#fef2f2",
                                border: "1px solid #fca5a5",
                                borderRadius: "8px",
                                padding: "10px 14px",
                                color: "#dc2626",
                                fontSize: "14px",
                                marginBottom: "18px",
                            }}
                        >
                            {displayError}
                        </div>
                    )}

                    {/* New Password */}
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{ marginBottom: "8px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ color: meetsLength ? "#10b981" : "#6b7280" }}>{meetsLength ? "✓" : "○"} At least 8 characters</div>
                            <div style={{ color: meetsNumber ? "#10b981" : "#6b7280" }}>{meetsNumber ? "✓" : "○"} Contains a number</div>
                            <div style={{ color: meetsUpper ? "#10b981" : "#6b7280" }}>{meetsUpper ? "✓" : "○"} Contains a capital letter</div>
                            <div style={{ color: meetsSymbol ? "#10b981" : "#6b7280" }}>{meetsSymbol ? "✓" : "○"} Contains a symbol</div>
                        </div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#374151",
                                marginBottom: "6px",
                            }}
                        >
                            New Password
                        </label>

                        <div style={{ position: "relative" }}>
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                placeholder="Min. 8 characters"
                                required
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "10px 40px 10px 12px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    outline: "none",
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "#6366f1";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "#d1d5db";
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    lineHeight: 0,
                                }}
                                aria-label={
                                    showNew ? "Hide password" : "Show password"
                                }
                            >
                                {showNew ? eyeOpen : eyeClosed}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div style={{ marginBottom: "24px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#374151",
                                marginBottom: "6px",
                            }}
                        >
                            Confirm Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                placeholder="Re-enter new password"
                                required
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "10px 40px 10px 12px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    outline: "none",
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "#6366f1";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "#d1d5db";
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    lineHeight: 0,
                                }}
                                aria-label={
                                    showConfirm
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showConfirm ? eyeOpen : eyeClosed}
                            </button>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: "11px 0",
                                fontSize: "14px",
                                fontWeight: 500,
                                border: "2px solid #e0e0e0",
                                borderRadius: "8px",
                                backgroundColor: "white",
                                color: "#666",
                                cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "#f5f5f5";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "white";
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !isFormValid
                            }
                            style={{
                                flex: 1,
                                padding: "11px 0",
                                fontSize: "14px",
                                fontWeight: 600,
                                border: "none",
                                borderRadius: "8px",
                                backgroundColor:
                                    loading ||
                                    !isFormValid
                                        ? "#a5b4fc"
                                        : "#6366f1",
                                color: "white",
                                cursor:
                                    loading ||
                                    !isFormValid
                                        ? "not-allowed"
                                        : "pointer",
                                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                            }}
                        >
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminVendor: React.FC = () => {
    const { token, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth < 768 : false,
    );
    const docketHeight = useDocketHeight();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [vendorsPerPage] = useState(7);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<
        "approve" | "reject" | null
    >(null);
    const [selectedVendorId, setSelectedVendorId] = useState<number | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Vendor;
        direction: "asc" | "desc";
    } | null>(null);
    const [districtFilter, setDistrictFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [approvalFilter, setApprovalFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [approvingVendorId, setApprovingVendorId] = useState<number | null>(
        null,
    );
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState<number | null>(null);

    // Change password modal state
    const [showChangePwdModal, setShowChangePwdModal] = useState(false);
    const [changePwdVendorId, setChangePwdVendorId] = useState<number | null>(
        null,
    );
    const [changePwdLoading, setChangePwdLoading] = useState(false);
    const [changePwdError, setChangePwdError] = useState("");

    const [rejectionReason, setRejectionReason] = useState("");
    const [isConfirming, setIsConfirming] = useState(false);

    const vendorAPI = useMemo(() => createVendorAPI(token), [token]);

    const CACHE_KEY_VENDORS = "admin_vendors";
    const CACHE_KEY_DISTRICTS = "admin_districts";
    const CACHE_TTL = 10 * 60 * 1000;

    const fetchDistricts = useCallback(async () => {
        //("Fetching districts...");
        try {
            if (!token) {
                throw new Error("No token provided. Please log in.");
            }
            const cached = localStorage.getItem(CACHE_KEY_DISTRICTS);
            if (cached) {
                try {
                    const { data, timestamp } = JSON.parse(cached);
                    if (
                        Array.isArray(data) &&
                        Date.now() - timestamp < CACHE_TTL
                    ) {
                        //("Using cached districts");
                        setDistricts(data);
                        return;
                    }
                } catch {
                    //("Invalid district cache, fetching fresh data");
                }
            }

            const response = await fetch(`${API_BASE_URL}/api/district`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            //(`Fetch finished loading: GET "${API_BASE_URL}/api/district"`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: ApiResponse<District[]> = await response.json();
            if (!result.data || result.data.length === 0) {
                setError("No districts available. Please contact support.");
                toast.error("No districts available. Please contact support.");
                return;
            }

            setDistricts(result.data);
            localStorage.setItem(
                CACHE_KEY_DISTRICTS,
                JSON.stringify({ data: result.data, timestamp: Date.now() }),
            );
        } catch (error) {
            console.error("Error fetching districts:", error);
            setError("Failed to load districts");
            toast.error("Failed to load districts");
        }
    }, [token]);

    const loadUnapprovedCount = useCallback(async () => {
        // Derive from vendors state directly in render logic
    }, []);

    const loadVendors = useCallback(async () => {
        try {
            setLoading(true);
            // Removing cache retrieval to ensure fresh data for debugging discrepancy

            // Fetch both approved and unapproved vendors
            const [approvedVendors, unapprovedVendors] = await Promise.all([
                vendorAPI.getAll(),
                vendorAPI.getUnapproved(),
            ]);

            // Use a Map to merge vendors, prioritizing data from the unapproved list
            const vendorMap = new Map<number, Vendor>();

            // Add approved vendors first
            approvedVendors.forEach((v) => vendorMap.set(v.id, v));

            // Overwrite with unapproved vendor data (this ensures isApproved is correctly false/null)
            unapprovedVendors.forEach((v) => {
                vendorMap.set(v.id, {
                    ...v,
                    isApproved: false, // Explicitly set if from this list
                });
            });

            const allVendors = Array.from(vendorMap.values());

            setVendors(allVendors);
            setFilteredVendors(allVendors);
            localStorage.setItem(
                CACHE_KEY_VENDORS,
                JSON.stringify({ data: allVendors, timestamp: Date.now() }),
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load vendors",
            );
            toast.error(
                err instanceof Error ? err.message : "Failed to load vendors",
            );
        } finally {
            setLoading(false);
        }
    }, [vendorAPI]);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            setLoading(false);
            setError("Please log in to access vendor management.");
            navigate("/login");
            return;
        }

        const loadInitialData = async () => {
            await Promise.all([
                loadVendors(),
                fetchDistricts(),
                loadUnapprovedCount(),
            ]);
        };

        loadInitialData();
    }, [
        isAuthenticated,
        token,
        fetchDistricts,
        loadUnapprovedCount,
        loadVendors,
        navigate,
    ]);

    // Search and every filter (district/status/approval/date) used to each
    // recompute `filteredVendors` independently from the raw `vendors` array
    // — whichever ran last won and silently discarded the other's criteria
    // (type a search term, then change a filter, and the search term was
    // dropped from the visible results; or vice versa). Both now read every
    // current criterion and AND-combine them in one pass, so changing one
    // never erases the others.
    useEffect(() => {
        handleFilter();
    }, [
        approvalFilter,
        districtFilter,
        statusFilter,
        startDate,
        endDate,
        searchQuery,
        vendors,
    ]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    }, []);

    const handleSort = (key: keyof Vendor) => {
        let direction: "asc" | "desc" = "asc";
        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === "asc"
        ) {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sorted = [...filteredVendors].sort((a, b) => {
            const aValue = a[key] || "";
            const bValue = b[key] || "";
            if (direction === "asc") {
                return aValue.toString().localeCompare(bValue.toString());
            }
            return bValue.toString().localeCompare(aValue.toString());
        });
        setFilteredVendors(sorted);
    };

    const handleFilter = () => {
        let filtered = [...vendors];

        if (searchQuery.trim()) {
            const searchTerm = searchQuery.toLowerCase();
            filtered = filtered.filter((vendor) => {
                const districtName =
                    typeof vendor.district === "object" && vendor.district
                        ? vendor.district.name
                        : typeof vendor.district === "string"
                          ? vendor.district
                          : "";
                return (
                    (vendor.businessName || "")
                        .toLowerCase()
                        .includes(searchTerm) ||
                    (vendor.email || "").toLowerCase().includes(searchTerm) ||
                    (vendor.phoneNumber || "")
                        .toLowerCase()
                        .includes(searchTerm) ||
                    districtName.toLowerCase().includes(searchTerm)
                );
            });
        }

        if (districtFilter !== "all") {
            filtered = filtered.filter((vendor) => {
                const districtName =
                    typeof vendor.district === "object" && vendor.district
                        ? vendor.district.name
                        : typeof vendor.district === "string"
                          ? vendor.district
                          : "";
                return districtName === districtFilter;
            });
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(
                (vendor) => vendor.status === statusFilter,
            );
        }

        if (approvalFilter !== "all") {
            if (approvalFilter === "approved") {
                filtered = filtered.filter(
                    (vendor) => vendor.isApproved === true,
                );
            } else if (approvalFilter === "pending") {
                filtered = filtered.filter(
                    (vendor) =>
                        vendor.isApproved === false ||
                        vendor.isApproved === null,
                );
            }
        }

        if (startDate && endDate) {
            // `new Date("2026-07-14")` parses as that day's UTC midnight, so a
            // plain `<=` compare excluded every vendor created later that same
            // day — the end date acted as "before this day," not "through it."
            // Push the upper bound to the last instant of the end date instead.
            const rangeStart = new Date(startDate);
            const rangeEnd = new Date(endDate);
            rangeEnd.setHours(23, 59, 59, 999);

            filtered = filtered.filter((vendor) => {
                const createdAt = new Date(vendor.createdAt || "");
                return createdAt >= rangeStart && createdAt <= rangeEnd;
            });
        }

        setFilteredVendors(filtered);
        setCurrentPage(1);
    };

    const handleEditVendor = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setShowEditModal(true);
    };

    const handleSaveVendor = async (
        vendorData: Partial<VendorUpdateRequest>,
    ) => {
        if (!selectedVendor?.id) return;

        try {
            //("Vendor data for update:", vendorData);

            const updatedVendor = await vendorAPI.update(
                selectedVendor.id,
                vendorData,
            );
            setVendors((prev) =>
                prev.map((v) =>
                    v.id === selectedVendor.id ? updatedVendor : v,
                ),
            );
            setFilteredVendors((prev) =>
                prev.map((v) =>
                    v.id === selectedVendor.id ? updatedVendor : v,
                ),
            );
            localStorage.removeItem(CACHE_KEY_VENDORS);
            await loadVendors();
            toast.success("Vendor updated successfully");
            setShowEditModal(false);
            setSelectedVendor(null);
        } catch (error) {
            console.error("Update failed:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update vendor",
            );
        }
    };

    const handleApproveClick = (id: number) => {
        setSelectedVendorId(id);
        setConfirmAction("approve");
        setRejectionReason("");
        setShowConfirmModal(true);
    };

    const handleRejectClick = (id: number) => {
        setSelectedVendorId(id);
        setConfirmAction("reject");
        setRejectionReason("");
        setShowConfirmModal(true);
    };

    const handleConfirm = async () => {
        if (!selectedVendorId || !confirmAction) return;
        setIsConfirming(true);
        try {
            if (confirmAction === "approve") {
                setApprovingVendorId(selectedVendorId);
                await vendorAPI.approve(selectedVendorId);
                setVendors((prev) =>
                    prev.map((v) =>
                        v.id === selectedVendorId
                            ? { ...v, isApproved: true, status: "Active" }
                            : v,
                    ),
                );
                setFilteredVendors((prev) =>
                    prev.map((v) =>
                        v.id === selectedVendorId
                            ? { ...v, isApproved: true, status: "Active" }
                            : v,
                    ),
                );
                toast.success("Vendor approved successfully");
            } else if (confirmAction === "reject") {
                if (!rejectionReason.trim()) {
                    toast.error(
                        "Please provide a reason for vendor rejection.",
                    );
                    return;
                }
                await vendorAPI.reject(
                    selectedVendorId,
                    rejectionReason.trim(),
                );
                setVendors((prev) =>
                    prev.filter((v) => v.id !== selectedVendorId),
                );
                setFilteredVendors((prev) =>
                    prev.filter((v) => v.id !== selectedVendorId),
                );
                toast.success("Vendor rejected successfully");
            }
            localStorage.removeItem(CACHE_KEY_VENDORS);
            await loadVendors();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : `Failed to ${confirmAction} vendor`,
            );
        } finally {
            setApprovingVendorId(null);
            setShowConfirmModal(false);
            setIsConfirming(false);
            setConfirmAction(null);
            setSelectedVendorId(null);
            setRejectionReason("");
        }
    };

    const handleDeleteClick = (id: number) => {
        setVendorToDelete(id);
        setShowDeleteModal(true);
    };

    const handleDeleteVendor = async () => {
        if (!vendorToDelete) return;

        try {
            await vendorAPI.delete(vendorToDelete);
            setVendors((prev) => prev.filter((v) => v.id !== vendorToDelete));
            setFilteredVendors((prev) =>
                prev.filter((v) => v.id !== vendorToDelete),
            );
            localStorage.removeItem(CACHE_KEY_VENDORS);
            await loadVendors();
            toast.success("Vendor deleted successfully");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to delete vendor",
            );
        } finally {
            setShowDeleteModal(false);
            setVendorToDelete(null);
        }
    };

    const handleChangePasswordClick = (vendorId: number) => {
        setChangePwdVendorId(vendorId);
        setChangePwdError("");
        setShowChangePwdModal(true);
    };

    const handleChangePasswordSubmit = async (
        newPass: string,
        confirmPass: string,
    ) => {
        if (!changePwdVendorId) return;
        try {
            setChangePwdLoading(true);
            setChangePwdError("");
            await vendorAPI.changeVendorPassword(
                changePwdVendorId,
                newPass,
                confirmPass,
            );
            toast.success("Vendor password updated successfully");
            setShowChangePwdModal(false);
            setChangePwdVendorId(null);
        } catch (error) {
            const msg =
                error instanceof Error
                    ? error.message
                    : "Failed to change password";
            setChangePwdError(msg);
        } finally {
            setChangePwdLoading(false);
        }
    };

    const indexOfLastVendor = currentPage * vendorsPerPage;
    const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
    const currentVendors = filteredVendors.slice(
        indexOfFirstVendor,
        indexOfLastVendor,
    );

    return (
        <div className="vendor-dash-container">
            <AdminSidebar />
            <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
                <Header
                    onSearch={handleSearch}
                    showSearch={true}
                    title="Vendor Management"
                />
                <main
                    className="dashboard__main"
                    style={{
                        paddingBottom: isMobile
                            ? `${docketHeight + 24}px`
                            : "24px",
                    }}
                >
                    <div className="admin-vendors">
                        <div className="admin-vendors__content">
                            <div className="admin-vendors__stats-grid">
                                <div className="admin-vendors__stat-card">
                                    <div className="stat-icon total-icon">
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
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                            <circle
                                                cx="9"
                                                cy="7"
                                                r="4"
                                            ></circle>
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <h3>Total Vendors</h3>
                                        <p>{vendors.length}</p>
                                    </div>
                                </div>
                                <div className="admin-vendors__stat-card warning">
                                    <div className="stat-icon pending-icon">
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
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                            <line
                                                x1="12"
                                                y1="9"
                                                x2="12"
                                                y2="13"
                                            ></line>
                                            <line
                                                x1="12"
                                                y1="17"
                                                x2="12.01"
                                                y2="17"
                                            ></line>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <h3>Pending Approval</h3>
                                        <p>
                                            {
                                                vendors.filter(
                                                    (v) =>
                                                        v.isApproved ===
                                                            false ||
                                                        v.isApproved === null,
                                                ).length
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="admin-vendors__stat-card success">
                                    <div className="stat-icon active-icon">
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
                                    </div>
                                    <div className="stat-info">
                                        <h3>Active Vendors</h3>
                                        <p>
                                            {
                                                vendors.filter(
                                                    (v) =>
                                                        v.status === "Active",
                                                ).length
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Approvals Section */}
                            {vendors.filter(
                                (v) =>
                                    v.isApproved === false ||
                                    v.isApproved === null,
                            ).length > 0 && (
                                <div className="admin-vendors__section pending-section">
                                    <div className="section-header">
                                        <h2>Pending Verification Requests</h2>
                                        <span className="badge warning">
                                            {
                                                vendors.filter(
                                                    (v) =>
                                                        v.isApproved ===
                                                            false ||
                                                        v.isApproved === null,
                                                ).length
                                            }{" "}
                                            Pending
                                        </span>
                                    </div>
                                    <div className="admin-vendors__table-container">
                                        <table className="admin-vendors__table">
                                            <thead className="admin-vendors__table-head">
                                                <tr>
                                                    <th>Business Name</th>
                                                    <th>Email</th>
                                                    <th>Phone</th>
                                                    <th>District</th>
                                                    <th>Documents</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vendors
                                                    .filter(
                                                        (v) =>
                                                            v.isApproved ===
                                                                false ||
                                                            v.isApproved ===
                                                                null,
                                                    )
                                                    .map((vendor) => (
                                                        <tr
                                                            key={vendor.id}
                                                            className="admin-vendors__table-row highlight-row"
                                                        >
                                                            <td className="admin-vendors__name-column">
                                                                {
                                                                    vendor.businessName
                                                                }
                                                            </td>
                                                            <td className="admin-vendors__email-column">
                                                                {vendor.email}
                                                            </td>
                                                            <td className="admin-vendors__phone-column">
                                                                {
                                                                    vendor.phoneNumber
                                                                }
                                                            </td>
                                                            <td className="admin-vendors__district-column">
                                                                {typeof vendor.district ===
                                                                    "object" &&
                                                                vendor.district
                                                                    ? vendor
                                                                          .district
                                                                          .name
                                                                    : typeof vendor.district ===
                                                                        "string"
                                                                      ? vendor.district
                                                                      : "N/A"}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedVendor(
                                                                            vendor,
                                                                        );
                                                                        setShowViewModal(
                                                                            true,
                                                                        );
                                                                    }}
                                                                    className="view-docs-btn"
                                                                >
                                                                    View Docs
                                                                </button>
                                                            </td>
                                                            <td className="admin-vendors__actions-column">
                                                                <div className="admin-vendors__actions">
                                                                    <button
                                                                        onClick={() =>
                                                                            handleApproveClick(
                                                                                vendor.id,
                                                                            )
                                                                        }
                                                                        className="admin-vendors__action-btn admin-vendors__action-btn--approve"
                                                                        disabled={
                                                                            approvingVendorId ===
                                                                            vendor.id
                                                                        }
                                                                        title="Approve"
                                                                    >
                                                                        {/* <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
																<polyline points="20 6 9 17 4 12"></polyline>
															</svg> */}
                                                                        {approvingVendorId ===
                                                                        vendor.id
                                                                            ? "..."
                                                                            : "Approve"}
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleRejectClick(
                                                                                vendor.id,
                                                                            )
                                                                        }
                                                                        className="admin-vendors__action-btn admin-vendors__action-btn--delete"
                                                                        title="Reject"
                                                                    >
                                                                        {/* <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
																<line x1="18" y1="6" x2="6" y2="18"></line>
																<line x1="6" y1="6" x2="18" y2="18"></line>
															</svg> */}
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="admin-vendors__section">
                                <div className="section-header">
                                    <h2>All Vendors</h2>
                                </div>
                                <div className="admin-vendors__filter-container">
                                    <select
                                        value={districtFilter}
                                        onChange={(e) =>
                                            setDistrictFilter(e.target.value)
                                        }
                                        className="admin-vendors__filter-select"
                                    >
                                        <option value="all">
                                            All Districts
                                        </option>
                                        {districts.map((district) => (
                                            <option
                                                key={district.id}
                                                value={district.name}
                                            >
                                                {district.name}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) =>
                                            setStatusFilter(e.target.value)
                                        }
                                        className="admin-vendors__filter-select"
                                    >
                                        <option value="all">
                                            All Statuses
                                        </option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">
                                            Inactive
                                        </option>
                                    </select>
                                    <select
                                        value={approvalFilter}
                                        onChange={(e) =>
                                            setApprovalFilter(e.target.value)
                                        }
                                        className="admin-vendors__filter-select"
                                    >
                                        <option value="all">
                                            All Approvals
                                        </option>
                                        <option value="approved">
                                            Approved
                                        </option>
                                        <option value="pending">
                                            Pending Approval
                                        </option>
                                    </select>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) =>
                                            setStartDate(e.target.value)
                                        }
                                        className="admin-vendors__filter-date"
                                    />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) =>
                                            setEndDate(e.target.value)
                                        }
                                        className="admin-vendors__filter-date"
                                    />
                                    <button
                                        onClick={handleFilter}
                                        className="admin-vendors__filter-button"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                                {error && (
                                    <p className="admin-vendors__error">
                                        {error}
                                    </p>
                                )}
                                <div className="admin-vendors__list-container">
                                    <div className="admin-vendors__table-container">
                                        <table className="admin-vendors__table">
                                            <thead className="admin-vendors__table-head">
                                                <tr>
                                                    <th
                                                        onClick={() =>
                                                            handleSort(
                                                                "businessName",
                                                            )
                                                        }
                                                        className="admin-vendors__name-column"
                                                    >
                                                        Business Name
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            handleSort("email")
                                                        }
                                                        className="admin-vendors__email-column"
                                                    >
                                                        Email
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            handleSort(
                                                                "phoneNumber",
                                                            )
                                                        }
                                                        className="admin-vendors__phone-column"
                                                    >
                                                        Phone
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            handleSort(
                                                                "telePhone",
                                                            )
                                                        }
                                                        className="admin-vendors__phone-column"
                                                    >
                                                        Telephone
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            handleSort(
                                                                "district",
                                                            )
                                                        }
                                                        className="admin-vendors__district-column"
                                                    >
                                                        District
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            handleSort("status")
                                                        }
                                                        className="admin-vendors__status-column"
                                                    >
                                                        Status
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            handleSort(
                                                                "isApproved",
                                                            )
                                                        }
                                                        className="admin-vendors__approval-column"
                                                    >
                                                        Approval Status
                                                    </th>
                                                    <th className="admin-vendors__actions-column">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    Array.from({
                                                        length: vendorsPerPage,
                                                    }).map((_, index) => (
                                                        <SkeletonRow
                                                            key={index}
                                                        />
                                                    ))
                                                ) : currentVendors.length ===
                                                  0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={8}
                                                            className="admin-vendors__table-row"
                                                        >
                                                            No vendors found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    currentVendors.map(
                                                        (vendor) => (
                                                            <tr
                                                                key={vendor.id}
                                                                className="admin-vendors__table-row"
                                                            >
                                                                <td className="admin-vendors__name-column">
                                                                    {
                                                                        vendor.businessName
                                                                    }
                                                                </td>
                                                                <td className="admin-vendors__email-column">
                                                                    {
                                                                        vendor.email
                                                                    }
                                                                </td>
                                                                <td className="admin-vendors__phone-column">
                                                                    {
                                                                        vendor.phoneNumber
                                                                    }
                                                                </td>
                                                                <td className="admin-vendors__phone-column">
                                                                    {
                                                                        vendor.telePhone === "-" ? "" : vendor.telePhone
                                                                    }
                                                                </td>
                                                                <td className="admin-vendors__district-column">
                                                                    {typeof vendor.district ===
                                                                        "object" &&
                                                                    vendor.district
                                                                        ? vendor
                                                                              .district
                                                                              .name
                                                                        : vendor.district ||
                                                                          "N/A"}
                                                                </td>
                                                                <td className="admin-vendors__status-column">
                                                                    {
                                                                        vendor.status
                                                                    }
                                                                </td>
                                                                <td className="admin-vendors__approval-column">
                                                                    <span
                                                                        className={`approval-status ${
                                                                            vendor.isApproved
                                                                                ? "approved"
                                                                                : "pending"
                                                                        }`}
                                                                    >
                                                                        {vendor.isApproved
                                                                            ? "Approved"
                                                                            : "Pending"}
                                                                    </span>
                                                                </td>
                                                                <td className="admin-vendors__actions-column">
                                                                    <div className="admin-vendors__actions">
                                                                        <button
                                                                            onClick={() =>
                                                                                handleEditVendor(
                                                                                    vendor,
                                                                                )
                                                                            }
                                                                            className="admin-vendors__action-btn admin-vendors__action-btn--edit"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedVendor(
                                                                                    vendor,
                                                                                );
                                                                                setShowViewModal(
                                                                                    true,
                                                                                );
                                                                            }}
                                                                            className="admin-vendors__action-btn admin-vendors__action-btn--view"
                                                                        >
                                                                            View
                                                                        </button>
                                                                        {!vendor.isApproved && (
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleApproveClick(
                                                                                        vendor.id,
                                                                                    )
                                                                                }
                                                                                className="admin-vendors__action-btn admin-vendors__action-btn--approve"
                                                                                disabled={
                                                                                    approvingVendorId ===
                                                                                    vendor.id
                                                                                }
                                                                            >
                                                                                {approvingVendorId ===
                                                                                vendor.id
                                                                                    ? "..."
                                                                                    : "Approve"}
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() =>
                                                                                handleChangePasswordClick(
                                                                                    vendor.id,
                                                                                )
                                                                            }
                                                                            className="admin-vendors__action-btn admin-vendors__action-btn--edit"
                                                                            title="Change Password"
                                                                        >
                                                                            Change
                                                                            Password
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDeleteClick(
                                                                                    vendor.id,
                                                                                )
                                                                            }
                                                                            className="admin-vendors__action-btn admin-vendors__action-btn--delete"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="admin-vendors__pagination-container">
                                        <div className="admin-vendors__pagination-info">
                                            Showing{" "}
                                            {(currentPage - 1) *
                                                vendorsPerPage +
                                                1}
                                            -
                                            {Math.min(
                                                currentPage * vendorsPerPage,
                                                filteredVendors.length,
                                            )}{" "}
                                            out of {filteredVendors.length}
                                        </div>
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={Math.ceil(
                                                filteredVendors.length /
                                                    vendorsPerPage,
                                            )}
                                            onPageChange={setCurrentPage}
                                        />
                                    </div>
                                </div>
                            </div>
                            <VendorEditModal
                                show={showEditModal}
                                onClose={() => {
                                    setShowEditModal(false);
                                    setSelectedVendor(null);
                                }}
                                onSave={handleSaveVendor}
                                vendor={selectedVendor}
                                districts={districts}
                            />
                            <VendorViewModal
                                show={showViewModal}
                                onClose={() => {
                                    setShowViewModal(false);
                                    setSelectedVendor(null);
                                }}
                                vendor={selectedVendor}
                            />
                            <ConfirmationModal
                                show={showConfirmModal}
                                onClose={() => {
                                    setShowConfirmModal(false);
                                    setConfirmAction(null);
                                    setSelectedVendorId(null);
                                    setRejectionReason("");
                                }}
                                onConfirm={handleConfirm}
                                action={confirmAction || "approve"}
                                rejectionReason={rejectionReason}
                                onRejectionReasonChange={setRejectionReason}
                                isSubmitting={isConfirming}
                            />
                            <ConfirmationModal
                                show={showDeleteModal}
                                onClose={() => {
                                    setShowDeleteModal(false);
                                    setVendorToDelete(null);
                                }}
                                onConfirm={handleDeleteVendor}
                                action="delete"
                            />
                            <ChangePasswordModal
                                show={showChangePwdModal}
                                onClose={() => {
                                    setShowChangePwdModal(false);
                                    setChangePwdVendorId(null);
                                    setChangePwdError("");
                                }}
                                onSubmit={handleChangePasswordSubmit}
                                loading={changePwdLoading}
                                error={changePwdError}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminVendor;
