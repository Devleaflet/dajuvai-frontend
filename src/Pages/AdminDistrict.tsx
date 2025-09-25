import React, { useEffect, useState } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/AdminDistrict.css";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import AuthModal from "../Components/AuthModal";

interface District {
	id: number;
	name: string;
}

const CACHE_KEY = "admin_districts";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const PAGE_SIZE = 7;

const AdminDistrict: React.FC = () => {
	const { token, isAuthenticated } = useAuth();
	const [districts, setDistricts] = useState<District[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState<{
		show: boolean;
		district: District | null;
	}>({ show: false, district: null });
	const [showDeleteModal, setShowDeleteModal] = useState<{
		show: boolean;
		district: District | null;
	}>({ show: false, district: null });
	const [newDistrictName, setNewDistrictName] = useState("");
	const [editDistrictName, setEditDistrictName] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [authModalOpen, setAuthModalOpen] = useState(false);

	useEffect(() => {
		const cached = localStorage.getItem(CACHE_KEY);
		if (cached) {
			try {
				const { data, timestamp } = JSON.parse(cached);
				if (Array.isArray(data) && Date.now() - timestamp < CACHE_TTL) {
					setDistricts(data);
					setLoading(false);
				}
			} catch {}
		}
		fetchDistricts();
	}, [token, isAuthenticated]);

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		setCurrentPage(1);
	};

	const fetchDistricts = async () => {
		if (!token) return;
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(`${API_BASE_URL}/api/district`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: `Bearer ${token}`,
				},
			});
			if (!response.ok) throw new Error("Failed to fetch districts");
			const data = await response.json();
			setDistricts(data.data);
			localStorage.setItem(
				CACHE_KEY,
				JSON.stringify({ data: data.data, timestamp: Date.now() })
			);
		} catch (err) {
			setError("Failed to load districts");
			toast.error("Failed to load districts");
		} finally {
			setLoading(false);
		}
	};

	const handleAddDistrict = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newDistrictName.trim()) return toast.error("District name required");
		try {
			const response = await fetch(`${API_BASE_URL}/api/district`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ name: newDistrictName.trim() }),
			});
			const data = await response.json();
			if (response.ok && data.success) {
				setDistricts((prev) => [...prev, data.data]);
				localStorage.setItem(
					CACHE_KEY,
					JSON.stringify({
						data: [...districts, data.data],
						timestamp: Date.now(),
					})
				);
				setShowAddModal(false);
				setNewDistrictName("");
				toast.success("District added successfully");
			} else {
				toast.error(data.message || "Failed to add district");
			}
		} catch (err) {
			toast.error("Failed to add district");
		}
	};

	const handleEditDistrict = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!showEditModal.district) return;
		if (!editDistrictName.trim()) return toast.error("District name required");
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/district/${showEditModal.district.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ name: editDistrictName.trim() }),
				}
			);
			const data = await response.json();
			if (response.ok && data.success) {
				setDistricts((prev) =>
					prev.map((d) => (d.id === data.data.id ? data.data : d))
				);
				localStorage.setItem(
					CACHE_KEY,
					JSON.stringify({
						data: districts.map((d) => (d.id === data.data.id ? data.data : d)),
						timestamp: Date.now(),
					})
				);
				setShowEditModal({ show: false, district: null });
				setEditDistrictName("");
				toast.success("District updated successfully");
			} else {
				toast.error(data.message || "Failed to update district");
			}
		} catch (err) {
			toast.error("Failed to update district");
		}
	};

	const handleDeleteDistrict = async () => {
		if (!showDeleteModal.district) return;
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/district/${showDeleteModal.district.id}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						Authorization: `Bearer ${token}`,
					},
				}
			);
			if (response.ok) {
				setDistricts((prev) =>
					prev.filter((d) => d.id !== showDeleteModal.district!.id)
				);
				localStorage.setItem(
					CACHE_KEY,
					JSON.stringify({
						data: districts.filter(
							(d) => d.id !== showDeleteModal.district!.id
						),
						timestamp: Date.now(),
					})
				);
				setShowDeleteModal({ show: false, district: null });
				toast.success("District deleted successfully");
			} else {
				const data = await response.json();
				toast.error(data.message || "Failed to delete district");
			}
		} catch (err) {
			toast.error("Failed to delete district");
		}
	};

	const filteredDistricts = districts.filter((d) =>
		d.name.toLowerCase().includes(searchQuery.toLowerCase())
	);
	const totalPages = Math.ceil(filteredDistricts.length / PAGE_SIZE);
	const paginatedDistricts = filteredDistricts.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE
	);

	const renderSkeleton = () =>
		Array.from({ length: PAGE_SIZE }).map((_, index) => (
			<tr
				key={index}
				className="admin-district__skeleton-row"
			>
				<td>
					<div className="admin-district__skeleton admin-district__skeleton-id"></div>
				</td>
				<td>
					<div className="admin-district__skeleton admin-district__skeleton-name"></div>
				</td>
				<td>
					<div className="admin-district__skeleton admin-district__skeleton-btn"></div>
					<div className="admin-district__skeleton admin-district__skeleton-btn"></div>
				</td>
			</tr>
		));

	return (
		<div className="admin-district">
			<AdminSidebar />
			<div className="admin-district__content">
				<Header
					onSearch={handleSearch}
					showSearch={true}
					title="District Management"
				/>
				<div className="admin-district__header-row">
					<button
						className="admin-district__add-btn"
						onClick={() => setShowAddModal(true)}
					>
						<FiPlus style={{ marginRight: 8, verticalAlign: "middle" }} /> Add
						District
					</button>
				</div>
				<div className="admin-district__table-container">
					{error ? (
						<div className="admin-district__error">{error}</div>
					) : (
						<>
							<table className="admin-district__table">
								<thead>
									<tr>
										<th>ID</th>
										<th>Name</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{loading
										? renderSkeleton()
										: paginatedDistricts.map((district) => (
												<tr key={district.id}>
													<td>{district.id}</td>
													<td>{district.name}</td>
													<td>
														<button
															className="admin-district__edit-btn"
															title="Edit"
															onClick={() => {
																setShowEditModal({ show: true, district });
																setEditDistrictName(district.name);
															}}
														>
															<FiEdit2 />
														</button>
														<button
															className="admin-district__delete-btn"
															title="Delete"
															onClick={() =>
																setShowDeleteModal({ show: true, district })
															}
														>
															<FiTrash2 />
														</button>
													</td>
												</tr>
										  ))}
									{!loading && paginatedDistricts.length === 0 && (
										<tr>
											<td
												colSpan={3}
												style={{ textAlign: "center", color: "#888" }}
											>
												No districts found.
											</td>
										</tr>
									)}
								</tbody>
							</table>
							{totalPages > 1 && (
								<div className="admin-district__pagination">
									<button
										className="admin-district__pagination-btn"
										disabled={currentPage === 1}
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									>
										Prev
									</button>
									{Array.from({ length: totalPages }).map((_, i) => (
										<button
											key={i}
											className={`admin-district__pagination-btn${
												currentPage === i + 1 ? " active" : ""
											}`}
											onClick={() => setCurrentPage(i + 1)}
										>
											{i + 1}
										</button>
									))}
									<button
										className="admin-district__pagination-btn"
										disabled={currentPage === totalPages}
										onClick={() =>
											setCurrentPage((p) => Math.min(totalPages, p + 1))
										}
									>
										Next
									</button>
								</div>
							)}
						</>
					)}
				</div>
				{showAddModal && (
					<div className="admin-district__modal-overlay">
						<div className="admin-district__modal">
							<h2>Add District</h2>
							<form onSubmit={handleAddDistrict}>
								<input
									type="text"
									placeholder="District Name"
									value={newDistrictName}
									onChange={(e) => setNewDistrictName(e.target.value)}
									required
								/>
								<div className="admin-district__modal-actions">
									<button type="submit">Add</button>
									<button
										type="button"
										onClick={() => setShowAddModal(false)}
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
				{showEditModal.show && showEditModal.district && (
					<div className="admin-district__modal-overlay">
						<div className="admin-district__modal">
							<h2>Edit District</h2>
							<form onSubmit={handleEditDistrict}>
								<input
									type="text"
									placeholder="District Name"
									value={editDistrictName}
									onChange={(e) => setEditDistrictName(e.target.value)}
									required
								/>
								<div className="admin-district__modal-actions">
									<button type="submit">Save</button>
									<button
										type="button"
										onClick={() =>
											setShowEditModal({ show: false, district: null })
										}
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
				{showDeleteModal.show && showDeleteModal.district && (
					<div className="admin-district__modal-overlay">
						<div className="admin-district__modal">
							<h2>Delete District</h2>
							<p>
								Are you sure you want to delete{" "}
								<b>{showDeleteModal.district.name}</b>?
							</p>
							<div className="admin-district__modal-actions">
								<button onClick={handleDeleteDistrict}>Delete</button>
								<button
									onClick={() =>
										setShowDeleteModal({ show: false, district: null })
									}
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				)}
				<AuthModal
					isOpen={authModalOpen}
					onClose={() => setAuthModalOpen(false)}
				/>
				<ToastContainer />
			</div>
		</div>
	);
};

export default AdminDistrict;
