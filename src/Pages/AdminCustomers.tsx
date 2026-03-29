"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import Pagination from "../Components/Pagination";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminOrders.css";
import "../Styles/AdminCustomers.css";

// User interface based on API schema
interface User {
	id: number;
	username: string;
	email: string;
	role: string;
	provider: string;
	isVerified: boolean;
	profilePicture?: string;
	createdAt: string;
	updatedAt: string;
}

// ApiResponse interface
interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// Skeleton component for loading state
const SkeletonRow: React.FC = () => {
	return (
		<tr>
			{[...Array(8)].map((_, index) => (
				<td key={index}>
					<div className="skeleton skeleton-text"></div>
				</td>
			))}
		</tr>
	);
};

// API service functions with auth headers
const createUserAPI = (token: string | null) => ({
	async getAll(): Promise<User[]> {
		try {
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
				Accept: "application/json",
			};

			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
				method: "GET",
				headers,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: ApiResponse<User[]> = await response.json();
			return result.data || [];
		} catch (error) {
			console.error("Error fetching users:", error);
			throw error;
		}
	},
});

// Role filter options
const ROLE_OPTIONS = [
	{ value: "all", label: "All Roles" },
	{ value: "user", label: "User" },
	{ value: "admin", label: "Admin" },
];

// Provider filter options
const PROVIDER_OPTIONS = [
	{ value: "all", label: "All Login Types" },
	{ value: "local", label: "Email / Password" },
	{ value: "google", label: "Google" },
];

const timeAgo = (dateStr: string): string => {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	const hours = Math.floor(mins / 60);
	const days = Math.floor(hours / 24);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	if (mins < 1) return "just now";
	if (mins < 60) return `${mins} min ago`;
	if (hours < 24) return `${hours} hr ago`;
	if (days < 30) return `${days} d ago`;
	if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
	return `${years} yr${years > 1 ? "s" : ""} ago`;
};

const AdminCustomers: React.FC = () => {
	const { token, isAuthenticated } = useAuth();
	const [users, setUsers] = useState<User[]>([]);
	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [usersPerPage] = useState(7);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof User;
		direction: "asc" | "desc";
	} | null>(null);
	const [roleFilter, setRoleFilter] = useState("all");
	const [providerFilter, setProviderFilter] = useState("all");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [searchQuery, setSearchQuery] = useState("");

	const userAPI = createUserAPI(token);

	useEffect(() => {
		if (isAuthenticated) {
			loadUsers();
		}
	}, [isAuthenticated, token]);

	// Filter users based on search, role, and date
	useEffect(() => {
		let filtered = [...users];

		// Apply search filter
		if (searchQuery.trim()) {
			filtered = filtered.filter(
				(user) =>
					user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
					user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
					user.id.toString().includes(searchQuery.toLowerCase()) ||
					user.role.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Apply role filter
		if (roleFilter !== "all") {
			filtered = filtered.filter(
				(user) => user.role.toLowerCase() === roleFilter.toLowerCase()
			);
		}

		// Apply provider filter
		if (providerFilter !== "all") {
			filtered = filtered.filter(
				(user) =>
					(user.provider ?? "local").toLowerCase() === providerFilter.toLowerCase()
			);
		}

		// Apply date range filter
		if (startDate || endDate) {
			filtered = filtered.filter((user) => {
				const userDate = new Date(user.createdAt);
				const start = startDate ? new Date(startDate) : null;
				const end = endDate ? new Date(endDate) : null;

				// Set end date to end of day for inclusive filtering
				if (end) {
					end.setHours(23, 59, 59, 999);
				}

				if (start && end) {
					return userDate >= start && userDate <= end;
				} else if (start) {
					return userDate >= start;
				} else if (end) {
					return userDate <= end;
				}
				return true;
			});
		}

		setFilteredUsers(filtered);
		setCurrentPage(1);
	}, [users, searchQuery, roleFilter, providerFilter, startDate, endDate]);

	const loadUsers = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const fetchedUsers = await userAPI.getAll();
			setUsers(fetchedUsers);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load users");
			console.error("Error loading users:", err);
		} finally {
			setLoading(false);
		}
	}, [userAPI]);

	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query);
	}, []);

	const handleSort = useCallback(
		(key: keyof User) => {
			let direction: "asc" | "desc" = "asc";
			if (
				sortConfig &&
				sortConfig.key === key &&
				sortConfig.direction === "asc"
			) {
				direction = "desc";
			}
			setSortConfig({ key, direction });
		},
		[sortConfig]
	);

	const getSortedAndFilteredUsers = useCallback(() => {
		let filtered = [...filteredUsers];

		if (sortConfig) {
			filtered = filtered.sort((a, b) => {
				let aValue: any = a[sortConfig.key];
				let bValue: any = b[sortConfig.key];

				if (sortConfig.key === "id") {
					aValue = Number(aValue);
					bValue = Number(bValue);
				} else if (
					sortConfig.key === "createdAt" ||
					sortConfig.key === "updatedAt"
				) {
					aValue = new Date(aValue).getTime();
					bValue = new Date(bValue).getTime();
				} else {
					aValue = aValue ? aValue.toString().toLowerCase() : "";
					bValue = bValue ? bValue.toString().toLowerCase() : "";
				}

				if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
				if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
			});
		}

		return filtered;
	}, [filteredUsers, sortConfig]);

	const indexOfLastUser = currentPage * usersPerPage;
	const indexOfFirstUser = indexOfLastUser - usersPerPage;
	const currentUsers = getSortedAndFilteredUsers().slice(
		indexOfFirstUser,
		indexOfLastUser
	);

	if (!isAuthenticated) {
		return (
			<div className="admin-orders">
				<AdminSidebar />
				<div className="admin-orders__content">
					<div className="admin-orders__error">
						Please log in to access user management.
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="admin-orders">
			<AdminSidebar />
			<div className="admin-orders__content">
				{error && (
					<div className="admin-orders__error">
						{error}
						<button onClick={() => setError(null)}>×</button>
					</div>
				)}
				<Header
					onSearch={handleSearch}
					showSearch={true}
					title="User Management"
				/>

				{/* Filter Section */}
				<div className="admin-orders__filters">
					<div className="admin-orders__filter-group">
						<label htmlFor="roleFilter">Role:</label>
						<select
							id="roleFilter"
							value={roleFilter}
							onChange={(e) => setRoleFilter(e.target.value)}
							className="admin-orders__filter-select"
						>
							{ROLE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div className="admin-orders__filter-group">
						<label htmlFor="providerFilter">Login Type:</label>
						<select
							id="providerFilter"
							value={providerFilter}
							onChange={(e) => setProviderFilter(e.target.value)}
							className="admin-orders__filter-select"
						>
							{PROVIDER_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div className="admin-orders__filter-group">
						<label htmlFor="startDate">From Date:</label>
						<input
							type="date"
							id="startDate"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="admin-orders__filter-select"
						/>
					</div>

					<div className="admin-orders__filter-group">
						<label htmlFor="endDate">To Date:</label>
						<input
							type="date"
							id="endDate"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							className="admin-orders__filter-select"
						/>
					</div>

					<button
						onClick={() => {
							setRoleFilter("all");
							setProviderFilter("all");
							setStartDate("");
							setEndDate("");
							setSearchQuery("");
							// Clear the search input in Header component
							const searchInput = document.querySelector(
								'input[type="text"]'
							) as HTMLInputElement;
							if (searchInput) {
								searchInput.value = "";
							}
						}}
						className="admin-customers__clear-filters"
					>
						Clear All Filters
					</button>
				</div>
				<div className="admin-orders__list-container">
					<div className="admin-orders__table-container">
						<table className="admin-orders__table">
							<thead className="admin-orders__table-head">
								<tr>
									<th
										onClick={() => handleSort("id")}
										className="sortable"
									>
										ID{" "}
										{sortConfig?.key === "id" &&
											(sortConfig.direction === "asc" ? "↑" : "↓")}
									</th>
									<th
										onClick={() => handleSort("username")}
										className="sortable"
									>
										Username{" "}
										{sortConfig?.key === "username" &&
											(sortConfig.direction === "asc" ? "↑" : "↓")}
									</th>
									<th
										onClick={() => handleSort("email")}
										className="sortable"
									>
										Email{" "}
										{sortConfig?.key === "email" &&
											(sortConfig.direction === "asc" ? "↑" : "↓")}
									</th>
									<th
										onClick={() => handleSort("role")}
										className="sortable"
									>
										Role{" "}
										{sortConfig?.key === "role" &&
											(sortConfig.direction === "asc" ? "↑" : "↓")}
									</th>
									<th
										onClick={() => handleSort("provider")}
										className="sortable"
									>
										Login Type{" "}
										{sortConfig?.key === "provider" &&
											(sortConfig.direction === "asc" ? "↑" : "↓")}
									</th>
									<th
										onClick={() => handleSort("isVerified")}
										className="sortable"
									>
										Verified{" "}
										{sortConfig?.key === "isVerified" &&
											(sortConfig.direction === "asc" ? "↑" : "↓")}
									</th>
									<th
										onClick={() => handleSort("createdAt")}
										className="sortable"
									>
										Joined{" "}
										{sortConfig?.key === "createdAt" &&
											(sortConfig.direction === "asc" ? "↑" : "↓")}
									</th>
									<th
										onClick={() => handleSort("updatedAt")}
										className="sortable"
									>
										Last Updated{" "}
										{sortConfig?.key === "updatedAt" &&
											(sortConfig.direction === "asc" ? "↑" : "↓")}
									</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									[...Array(usersPerPage)].map((_, index) => (
										<SkeletonRow key={index} />
									))
								) : currentUsers.length > 0 ? (
									currentUsers.map((user) => {
										const provider = (user.provider ?? "local").toLowerCase();
										const isGoogle = provider === "google";
										return (
											<tr
												key={user.id}
												className="admin-orders__table-row"
											>
												<td>{user.id}</td>
												<td>
													{user.profilePicture ? (
														<span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
															<img
																src={user.profilePicture}
																alt={user.username}
																style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
															/>
															{user.username}
														</span>
													) : (
														user.username
													)}
												</td>
												<td>{user.email}</td>
												<td>
													<span className={`admin-orders__status-badge admin-orders__status-badge--${user.role.toLowerCase()}`}>
														{user.role}
													</span>
												</td>
												<td>
													<span
														style={{
															display: "inline-flex",
															alignItems: "center",
															gap: "0.35rem",
															padding: "0.2rem 0.6rem",
															borderRadius: "999px",
															fontSize: "0.78rem",
															fontWeight: 500,
															background: isGoogle ? "#fce8e6" : "#e8f0fe",
															color: isGoogle ? "#d93025" : "#1a73e8",
														}}
													>
														{isGoogle ? "🔵 Google" : "✉ Email"}
													</span>
												</td>
												<td>
													<span
														style={{
															display: "inline-block",
															padding: "0.2rem 0.6rem",
															borderRadius: "999px",
															fontSize: "0.78rem",
															fontWeight: 500,
															background: user.isVerified ? "#e6f4ea" : "#fce8e6",
															color: user.isVerified ? "#1e7e34" : "#c0392b",
														}}
													>
														{user.isVerified ? "✔ Verified" : "✘ Unverified"}
													</span>
												</td>
												<td>{timeAgo(user.createdAt)}</td>
												<td>{timeAgo(user.updatedAt)}</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td
											colSpan={8}
											className="admin-orders__no-data"
										>
											No users found
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<div className="admin-orders__pagination-container">
						<div className="admin-orders__pagination-info">
							Showing {indexOfFirstUser + 1}-
							{Math.min(indexOfLastUser, filteredUsers.length)} out of{" "}
							{filteredUsers.length}
						</div>
						<Pagination
							currentPage={currentPage}
							totalPages={Math.ceil(filteredUsers.length / usersPerPage)}
							onPageChange={setCurrentPage}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminCustomers;
