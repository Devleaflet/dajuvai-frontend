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
				status: vendor.isVerified ? "Active" : "Inactive",
				isApproved: vendor.isApproved !== undefined ? vendor.isApproved : true, // Preserve isApproved, default to true for existing vendors
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
				}
			);



			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: ApiResponse<Vendor[]> = await response.json();
			return (result.data || []).map((vendor) => ({
				...vendor,
				status: "Inactive",
				isApproved: vendor.isApproved || false, // Preserve the isApproved status
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
				}
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
					console.error("Failed to parse error response:", parseError);
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

	async reject(id: number): Promise<void> {
		try {
			if (!token) {
				throw new Error("No token provided. Please log in.");
			}
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${token}`,
			};

			const response = await fetch(`${API_BASE_URL}/api/vendors/reject/${id}`, {
				method: "PUT",
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
					console.error("Failed to parse error response:", parseError);
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
		vendorData: Partial<VendorUpdateRequest>
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

			// Normalize chequePhoto to a string
			const normalizedVendorData = {
				...vendorData,
				chequePhoto: Array.isArray(vendorData.chequePhoto)
					? vendorData.chequePhoto.length > 0
						? vendorData.chequePhoto[0] // Use the first item if multiple
						: ""
					: vendorData.chequePhoto || "", // Ensure it's a string or empty
			};



			const response = await fetch(`${API_BASE_URL}/api/vendors/${id}`, {
				method: "PUT",
				headers,
				body: JSON.stringify(normalizedVendorData),
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
					console.error("Failed to parse error response:", parseError);
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
				// return {
				// 	id,
				// 	...normalizedVendorData,
				// 	phoneNumber: normalizedVendorData.phoneNumber || "N/A",
				// 	taxNumber: normalizedVendorData.taxNumber || "N/A",
				// 	taxDocuments: Array.isArray(normalizedVendorData.taxDocuments)
				// 		? normalizedVendorData.taxDocuments
				// 		: normalizedVendorData.taxDocuments
				// 		? [normalizedVendorData.taxDocuments]
				// 		: [],
				// 	businessRegNumber: normalizedVendorData.businessRegNumber || "N/A",
				// 	citizenshipDocuments: Array.isArray(
				// 		normalizedVendorData.citizenshipDocuments
				// 	)
				// 		? normalizedVendorData.citizenshipDocuments
				// 		: normalizedVendorData.citizenshipDocuments
				// 		? [normalizedVendorData.citizenshipDocuments]
				// 		: [],
				// 	chequePhoto: normalizedVendorData.chequePhoto || "",
				// 	accountName: normalizedVendorData.accountName || "N/A",
				// 	bankName: normalizedVendorData.bankName || "N/A",
				// 	accountNumber: normalizedVendorData.accountNumber || "N/A",
				// 	bankBranch: normalizedVendorData.bankBranch || "N/A",
				// 	bankCode: normalizedVendorData.bankCode || "N/A",
				// 	businessAddress: normalizedVendorData.businessAddress || "N/A",
				// 	profilePicture: normalizedVendorData.profilePicture || "N/A",
				// 	isVerified: false,
				// 	status: "Inactive",
				// } as Vendor;
			}

			return {
				...result.data,
				phoneNumber: result.data.phoneNumber || "N/A",
				taxNumber: result.data.taxNumber || "N/A",
				taxDocuments: Array.isArray(result.data.taxDocuments)
					? result.data.taxDocuments
					: result.data.taxDocuments
						? [result.data.taxDocuments]
						: [],
				businessRegNumber: result.data.businessRegNumber || "N/A",
				citizenshipDocuments: Array.isArray(result.data.citizenshipDocuments)
					? result.data.citizenshipDocuments
					: result.data.citizenshipDocuments
						? [result.data.citizenshipDocuments]
						: [],
				chequePhoto: result.data.chequePhoto || "",
				accountName: result.data.accountName || "N/A",
				bankName: result.data.bankName || "N/A",
				accountNumber: result.data.accountNumber || "N/A",
				bankBranch: result.data.bankBranch || "N/A",
				bankCode: result.data.bankCode || "N/A",
				businessAddress: result.data.businessAddress || "N/A",
				profilePicture: result.data.profilePicture || "N/A",
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
					console.error("Failed to parse error response:", parseError);
				}
				throw new Error(errorMessage);
			}

			if (response.status !== 204) {
				const result = await response.json();
				if (!result.success) {
					throw new Error(result.message || "Failed to delete vendor");
				}
			}
		} catch (error) {
			console.error("Error deleting vendor:", error);
			throw error;
		}
	},
});

interface ConfirmationModalProps {
	show: boolean;
	onClose: () => void;
	onConfirm: () => void;
	action: "approve" | "reject";
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
	show,
	onClose,
	onConfirm,
	action,
}) => {
	if (!show) return null;

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<h2>Confirm {action.charAt(0).toUpperCase() + action.slice(1)}</h2>
				<p>Are you sure you want to {action} this vendor?</p>
				<div className="modal-buttons">
					<button
						onClick={onConfirm}
						className="confirm-btn"
					>
						Yes
					</button>
					<button
						onClick={onClose}
						className="cancel-btn"
					>
						No
					</button>
				</div>
			</div>
		</div>
	);
};

const AdminVendor: React.FC = () => {
	const { token, isAuthenticated } = useAuth();
	const navigate = useNavigate();
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
	const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Vendor;
		direction: "asc" | "desc";
	} | null>(null);
	const [unapprovedCount, setUnapprovedCount] = useState(0);
	const [districtFilter, setDistrictFilter] = useState("all");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [approvalFilter, setApprovalFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [approvingVendorId, setApprovingVendorId] = useState<number | null>(
		null
	);

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
					if (Array.isArray(data) && Date.now() - timestamp < CACHE_TTL) {
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
				JSON.stringify({ data: result.data, timestamp: Date.now() })
			);
		} catch (error) {
			console.error("Error fetching districts:", error);
			setError("Failed to load districts");
			toast.error("Failed to load districts");
		}
	}, [token]);

	const loadUnapprovedCount = useCallback(async () => {
		//("Fetching unapproved vendors...");
		try {
			const unapproved = await vendorAPI.getUnapproved();
			setUnapprovedCount(unapproved.length);
		} catch (err) {
			console.error("Failed to load unapproved count:", err);
		}
	}, [vendorAPI]);

	const loadVendors = useCallback(async () => {
		try {
			setLoading(true);
			const cached = localStorage.getItem(CACHE_KEY_VENDORS);
			if (cached) {
				try {
					const { data, timestamp } = JSON.parse(cached);
					if (Array.isArray(data) && Date.now() - timestamp < CACHE_TTL) {
						setVendors(data);
						setFilteredVendors(data);
						setLoading(false);
						return;
					}
				} catch {
					//("Invalid vendor cache, fetching fresh data");
				}
			}

			// Fetch both approved and unapproved vendors
			const [approvedVendors, unapprovedVendors] = await Promise.all([
				vendorAPI.getAll(),
				vendorAPI.getUnapproved(),
			]);

			// Combine and deduplicate vendors (in case there's overlap)
			const allVendors = [...approvedVendors];
			unapprovedVendors.forEach((unapprovedVendor) => {
				if (!allVendors.find((v) => v.id === unapprovedVendor.id)) {
					allVendors.push(unapprovedVendor);
				}
			});

			setVendors(allVendors);
			setFilteredVendors(allVendors);
			localStorage.setItem(
				CACHE_KEY_VENDORS,
				JSON.stringify({ data: allVendors, timestamp: Date.now() })
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load vendors");
			toast.error(
				err instanceof Error ? err.message : "Failed to load vendors"
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

	// Auto-filter when approval filter changes
	useEffect(() => {
		handleFilter();
	}, [
		approvalFilter,
		districtFilter,
		statusFilter,
		startDate,
		endDate,
		vendors,
	]);

	const handleSearch = useCallback(
		(query: string) => {
			setSearchQuery(query);
			setCurrentPage(1);

			const searchTerm = query.toLowerCase();
			const filtered = vendors.filter((vendor) => {
				const districtName =
					typeof vendor.district === "object" && vendor.district
						? vendor.district.name
						: typeof vendor.district === "string"
							? vendor.district
							: "";
				return (
					(vendor.businessName || "").toLowerCase().includes(searchTerm) ||
					(vendor.email || "").toLowerCase().includes(searchTerm) ||
					(vendor.phoneNumber || "").toLowerCase().includes(searchTerm) ||
					districtName.toLowerCase().includes(searchTerm)
				);
			});

			setFilteredVendors(filtered);
		},
		[vendors]
	);

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
			filtered = filtered.filter((vendor) => vendor.status === statusFilter);
		}

		if (approvalFilter !== "all") {
			if (approvalFilter === "approved") {
				filtered = filtered.filter((vendor) => vendor.isApproved === true);
			} else if (approvalFilter === "pending") {
				filtered = filtered.filter(
					(vendor) => vendor.isApproved === false || vendor.isApproved === null
				);
			}
		}

		if (startDate && endDate) {
			filtered = filtered.filter((vendor) => {
				const createdAt = new Date(vendor.createdAt || "");
				return (
					createdAt >= new Date(startDate) && createdAt <= new Date(endDate)
				);
			});
		}

		setFilteredVendors(filtered);
		setCurrentPage(1);
	};

	const handleEditVendor = (vendor: Vendor) => {
		setSelectedVendor(vendor);
		setShowEditModal(true);
	};

	const handleSaveVendor = async (vendorData: Partial<VendorUpdateRequest>) => {
		if (!selectedVendor?.id) return;

		try {
			// Normalize chequePhoto before sending
			const normalizedVendorData = {
				...vendorData,
				chequePhoto: Array.isArray(vendorData.chequePhoto)
					? vendorData.chequePhoto.length > 0
						? vendorData.chequePhoto[0] // Use the first item
						: ""
					: vendorData.chequePhoto || "", // Ensure it's a string
			};

			//("Normalized vendor data for update:", normalizedVendorData);

			const updatedVendor = await vendorAPI.update(
				selectedVendor.id,
				normalizedVendorData
			);
			setVendors((prev) =>
				prev.map((v) => (v.id === selectedVendor.id ? updatedVendor : v))
			);
			setFilteredVendors((prev) =>
				prev.map((v) => (v.id === selectedVendor.id ? updatedVendor : v))
			);
			localStorage.removeItem(CACHE_KEY_VENDORS);
			await loadVendors();
			toast.success("Vendor updated successfully");
			setShowEditModal(false);
			setSelectedVendor(null);
		} catch (error) {
			console.error("Update failed:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update vendor"
			);
		}
	};

	const handleApproveClick = (id: number) => {
		setSelectedVendorId(id);
		setConfirmAction("approve");
		setShowConfirmModal(true);
	};

	const handleRejectClick = (id: number) => {
		setSelectedVendorId(id);
		setConfirmAction("reject");
		setShowConfirmModal(true);
	};

	const handleConfirm = async () => {
		if (!selectedVendorId || !confirmAction) return;

		try {
			if (confirmAction === "approve") {
				setApprovingVendorId(selectedVendorId);
				await vendorAPI.approve(selectedVendorId);
				setVendors((prev) =>
					prev.map((v) =>
						v.id === selectedVendorId
							? { ...v, isApproved: true, status: "Active" }
							: v
					)
				);
				setFilteredVendors((prev) =>
					prev.map((v) =>
						v.id === selectedVendorId
							? { ...v, isApproved: true, status: "Active" }
							: v
					)
				);
				toast.success("Vendor approved successfully");
			} else if (confirmAction === "reject") {
				await vendorAPI.reject(selectedVendorId);
				setVendors((prev) => prev.filter((v) => v.id !== selectedVendorId));
				setFilteredVendors((prev) =>
					prev.filter((v) => v.id !== selectedVendorId)
				);
				toast.success("Vendor rejected successfully");
			}
			setUnapprovedCount((prev) => prev - 1);
			localStorage.removeItem(CACHE_KEY_VENDORS);
			await loadVendors();
			await loadUnapprovedCount();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: `Failed to ${confirmAction} vendor`
			);
		} finally {
			setApprovingVendorId(null);
			setShowConfirmModal(false);
			setConfirmAction(null);
			setSelectedVendorId(null);
		}
	};

	const handleDeleteVendor = async (id: number) => {
		try {
			await vendorAPI.delete(id);
			setVendors((prev) => prev.filter((v) => v.id !== id));
			setFilteredVendors((prev) => prev.filter((v) => v.id !== id));
			localStorage.removeItem(CACHE_KEY_VENDORS);
			await loadVendors();
			toast.success("Vendor deleted successfully");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete vendor"
			);
		}
	};

	const indexOfLastVendor = currentPage * vendorsPerPage;
	const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
	const currentVendors = filteredVendors.slice(
		indexOfFirstVendor,
		indexOfLastVendor
	);

	return (
		<div className="admin-vendors">
			<AdminSidebar />
			<div style={{ display: "flex", flexDirection: "column", flex: "1" }}>
				<Header
					onSearch={handleSearch}
					showSearch={true}
					title="Vendor Management"
				/>
				<div className="admin-vendors__content">
					<div className="admin-vendors__stats-grid">
						<div className="admin-vendors__stat-card">
							<div className="stat-icon total-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
									<circle cx="9" cy="7" r="4"></circle>
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
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
									<line x1="12" y1="9" x2="12" y2="13"></line>
									<line x1="12" y1="17" x2="12.01" y2="17"></line>
								</svg>
							</div>
							<div className="stat-info">
								<h3>Pending Approval</h3>
								<p>{unapprovedCount}</p>
							</div>
						</div>
						<div className="admin-vendors__stat-card success">
							<div className="stat-icon active-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
									<polyline points="22 4 12 14.01 9 11.01"></polyline>
								</svg>
							</div>
							<div className="stat-info">
								<h3>Active Vendors</h3>
								<p>{vendors.filter(v => v.status === "Active").length}</p>
							</div>
						</div>
					</div>

					{/* Pending Approvals Section */}
					{vendors.filter(v => !v.isApproved).length > 0 && (
						<div className="admin-vendors__section pending-section">
							<div className="section-header">
								<h2>Pending Verification Requests</h2>
								<span className="badge warning">{vendors.filter(v => !v.isApproved).length} Pending</span>
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
										{vendors.filter(v => !v.isApproved).map((vendor) => (
											<tr key={vendor.id} className="admin-vendors__table-row highlight-row">
												<td className="admin-vendors__name-column">{vendor.businessName}</td>
												<td className="admin-vendors__email-column">{vendor.email}</td>
												<td className="admin-vendors__phone-column">{vendor.phoneNumber}</td>
												<td className="admin-vendors__district-column">
													{(typeof vendor.district === "object" && vendor.district)
														? vendor.district.name
														: (typeof vendor.district === "string" ? vendor.district : "N/A")}
												</td>
												<td>
													<button
														onClick={() => {
															setSelectedVendor(vendor);
															setShowViewModal(true);
														}}
														className="view-docs-btn"
													>
														View Docs
													</button>
												</td>
												<td className="admin-vendors__actions-column">
													<div className="admin-vendors__actions">
														<button
															onClick={() => handleApproveClick(vendor.id)}
															className="admin-vendors__action-btn admin-vendors__action-btn--approve"
															disabled={approvingVendorId === vendor.id}
															title="Approve"
														>
															<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
																<polyline points="20 6 9 17 4 12"></polyline>
															</svg>
															{approvingVendorId === vendor.id ? "..." : "Approve"}
														</button>
														<button
															onClick={() => handleRejectClick(vendor.id)}
															className="admin-vendors__action-btn admin-vendors__action-btn--delete"
															title="Reject"
														>
															<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
																<line x1="18" y1="6" x2="6" y2="18"></line>
																<line x1="6" y1="6" x2="18" y2="18"></line>
															</svg>
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
								onChange={(e) => setDistrictFilter(e.target.value)}
								className="admin-vendors__filter-select"
							>
								<option value="all">All Districts</option>
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
								onChange={(e) => setStatusFilter(e.target.value)}
								className="admin-vendors__filter-select"
							>
								<option value="all">All Statuses</option>
								<option value="Active">Active</option>
								<option value="Inactive">Inactive</option>
							</select>
							<select
								value={approvalFilter}
								onChange={(e) => setApprovalFilter(e.target.value)}
								className="admin-vendors__filter-select"
							>
								<option value="all">All Approvals</option>
								<option value="approved">Approved</option>
								<option value="pending">Pending Approval</option>
							</select>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="admin-vendors__filter-date"
							/>
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="admin-vendors__filter-date"
							/>
							<button
								onClick={handleFilter}
								className="admin-vendors__filter-button"
							>
								Apply Filters
							</button>
						</div>
						{error && <p className="admin-vendors__error">{error}</p>}
						<div className="admin-vendors__list-container">
							<div className="admin-vendors__table-container">
								<table className="admin-vendors__table">
									<thead className="admin-vendors__table-head">
										<tr>
											<th
												onClick={() => handleSort("businessName")}
												className="admin-vendors__name-column"
											>
												Business Name
											</th>
											<th
												onClick={() => handleSort("email")}
												className="admin-vendors__email-column"
											>
												Email
											</th>
											<th
												onClick={() => handleSort("phoneNumber")}
												className="admin-vendors__phone-column"
											>
												Phone
											</th>
											<th
												onClick={() => handleSort("district")}
												className="admin-vendors__district-column"
											>
												District
											</th>
											<th
												onClick={() => handleSort("status")}
												className="admin-vendors__status-column"
											>
												Status
											</th>
											<th
												onClick={() => handleSort("isApproved")}
												className="admin-vendors__approval-column"
											>
												Approval Status
											</th>
											<th className="admin-vendors__actions-column">Actions</th>
										</tr>
									</thead>
									<tbody>
										{loading ? (
											Array.from({ length: vendorsPerPage }).map((_, index) => (
												<SkeletonRow key={index} />
											))
										) : currentVendors.length === 0 ? (
											<tr>
												<td
													colSpan={7}
													className="admin-vendors__table-row"
												>
													No vendors found
												</td>
											</tr>
										) : (
											currentVendors.map((vendor) => (
												<tr
													key={vendor.id}
													className="admin-vendors__table-row"
												>
													<td className="admin-vendors__name-column">
														{vendor.businessName}
													</td>
													<td className="admin-vendors__email-column">
														{vendor.email}
													</td>
													<td className="admin-vendors__phone-column">
														{vendor.phoneNumber}
													</td>
													<td className="admin-vendors__district-column">
														{typeof vendor.district === "object" &&
															vendor.district
															? vendor.district.name
															: vendor.district || "N/A"}
													</td>
													<td className="admin-vendors__status-column">
														{vendor.status}
													</td>
													<td className="admin-vendors__approval-column">
														<span
															className={`approval-status ${vendor.isApproved ? "approved" : "pending"
																}`}
														>
															{vendor.isApproved ? "Approved" : "Pending"}
														</span>
													</td>
													<td className="admin-vendors__actions-column">
														<div className="admin-vendors__actions">
															<button
																onClick={() => handleEditVendor(vendor)}
																className="admin-vendors__action-btn admin-vendors__action-btn--edit"
															>
																Edit
															</button>
															<button
																onClick={() => {
																	setSelectedVendor(vendor);
																	setShowViewModal(true);
																}}
																className="admin-vendors__action-btn admin-vendors__action-btn--view"
															>
																View
															</button>
															{!vendor.isApproved && (
																<button
																	onClick={() => handleApproveClick(vendor.id)}
																	className="admin-vendors__action-btn admin-vendors__action-btn--approve"
																	disabled={approvingVendorId === vendor.id}
																>
																	{approvingVendorId === vendor.id
																		? "..."
																		: "Approve"}
																</button>
															)}
															<button
																onClick={() => handleDeleteVendor(vendor.id)}
																className="admin-vendors__action-btn admin-vendors__action-btn--delete"
															>
																Delete
															</button>
														</div>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
							<div className="admin-vendors__pagination-container">
								<div className="admin-vendors__pagination-info">
									Showing {(currentPage - 1) * vendorsPerPage + 1}-
									{Math.min(currentPage * vendorsPerPage, filteredVendors.length)}{" "}
									out of {filteredVendors.length}
								</div>
								<Pagination
									currentPage={currentPage}
									totalPages={Math.ceil(filteredVendors.length / vendorsPerPage)}
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
						}}
						onConfirm={handleConfirm}
						action={confirmAction || "approve"}
					/>
				</div>
			</div>
		</div>
	);
};

export default AdminVendor;
