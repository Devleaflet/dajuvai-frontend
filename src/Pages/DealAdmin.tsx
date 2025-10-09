import React, { useEffect, useState } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import { useAuth } from "../context/AuthContext";
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiFilter } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/DealAdmin.css";
import DealService, {
  Deal,
  DealFormData,
  DealsResponse,
  ApiResponse,
} from "../services/dealService";

const CACHE_KEY = "admin_deals";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const PAGE_SIZE = 7;

const DealAdmin: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<{
    show: boolean;
    deal: Deal | null;
  }>({ show: false, deal: null });
  const [showDeleteModal, setShowDeleteModal] = useState<{
    show: boolean;
    deal: Deal | null;
  }>({
    show: false,
    deal: null,
  });
  const [formData, setFormData] = useState<DealFormData>({
    name: "",
    discountPercentage: 0,
    status: "ENABLED",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "ENABLED" | "DISABLED" | "ALL"
  >("ALL");

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setError("Please log in to access deal management.");
      setLoading(false);
      return;
    }

    // Use unique cache key based on statusFilter
    const cacheKey = `${CACHE_KEY}_${statusFilter}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Array.isArray(data) && Date.now() - timestamp < CACHE_TTL) {
          setDeals(data);
          setLoading(false);
          return;
        }
      } catch {
        console.error("Error parsing cached deals");
      }
    }
    fetchDeals();
  }, [token, isAuthenticated, statusFilter]);

  const fetchDeals = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response: DealsResponse =
        await DealService.getInstance().getAllDeals(
          token,
          statusFilter !== "ALL" ? statusFilter : undefined
        );
      if (response.success && response.data?.deals) {
        setDeals(response.data.deals);
        const cacheKey = `${CACHE_KEY}_${statusFilter}`;
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data: response.data.deals, timestamp: Date.now() })
        );
      } else {
        throw new Error(response.message || "Failed to fetch deals");
      }
    } catch (err) {
      setError("Failed to load deals");
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "discountPercentage" ? Number(value) : value,
    }));
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Please log in");
    if (!formData.name.trim()) return toast.error("Deal name required");
    try {
      const response: ApiResponse<Deal> =
        await DealService.getInstance().createDeal(formData, token);
      if (response.success && response.data) {
        const newDeal: Deal = response.data;
        setDeals((prev) => [...prev, newDeal]);
        if (statusFilter === "ALL" || newDeal.status === statusFilter) {
          const cacheKey = `${CACHE_KEY}_${statusFilter}`;
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ data: [...deals, newDeal], timestamp: Date.now() })
          );
        }
        setShowAddModal(false);
        setFormData({ name: "", discountPercentage: 0, status: "ENABLED" });
        toast.success("Deal added successfully");
      } else {
        toast.error(response.message || "Failed to add deal");
      }
    } catch (err) {
      toast.error("Failed to add deal");
    }
  };

  const handleEditDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Please log in");
    if (!showEditModal.deal) return;
    if (!formData.name.trim()) return toast.error("Deal name required");
    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      return toast.error("Discount percentage must be between 0 and 100");
    }

    // Debug log: print the payload before sending
    console.log("[Deal Edit] PATCH payload:", formData);

    // Ensure the payload is properly formatted
    const payload = {
      name: formData.name.trim(),
      discountPercentage: Number(formData.discountPercentage),
      status: formData.status
    };
    console.log("[Deal Edit] Formatted payload:", payload);

    try {
      const response: ApiResponse<Deal> =
        await DealService.getInstance().updateDeal(
          showEditModal.deal.id,
          payload,
          token
        );
      if (response.success && response.data) {
        const updatedDeal = response.data;
        // Ensure discountPercentage is a number for frontend consistency
        const normalizedDeal = {
          ...updatedDeal,
          discountPercentage: typeof updatedDeal.discountPercentage === 'string' 
            ? parseFloat(updatedDeal.discountPercentage) 
            : updatedDeal.discountPercentage
        };
        setDeals((prev) =>
          prev.map((d) => (d.id === normalizedDeal.id ? normalizedDeal : d))
        );
        if (statusFilter === "ALL" || updatedDeal.status === statusFilter) {
          const cacheKey = `${CACHE_KEY}_${statusFilter}`;
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: deals.map((d) =>
                d.id === normalizedDeal.id ? normalizedDeal : d
              ),
              timestamp: Date.now(),
            })
          );
        }
        setShowEditModal({ show: false, deal: null });
        setFormData({ name: "", discountPercentage: 0, status: "ENABLED" });
        toast.success("Deal updated successfully");
      } else {
        toast.error(response.message || "Failed to update deal");
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        console.error("Edit deal error:", err.response.data);
        toast.error(err.response.data.message);
      } else if (err.message) {
        console.error("Edit deal error:", err.message);
        toast.error(err.message);
      } else {
        console.error("Edit deal error:", err);
        toast.error("Failed to update deal");
      }
    }
  };

  const handleDeleteDeal = async () => {
    if (!token) return toast.error("Please log in");
    if (!showDeleteModal.deal) return;
    try {
      const response: ApiResponse<void> =
        await DealService.getInstance().deleteDeal(
          showDeleteModal.deal.id,
          token
        );
      if (response.success) {
        setDeals((prev) =>
          prev.filter((d) => d.id !== showDeleteModal.deal!.id)
        );
        const cacheKey = `${CACHE_KEY}_${statusFilter}`;
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: deals.filter((d) => d.id !== showDeleteModal.deal!.id),
            timestamp: Date.now(),
          })
        );
        setShowDeleteModal({ show: false, deal: null });
        toast.success("Deal deleted successfully");
      } else {
        toast.error(response.message || "Failed to delete deal");
      }
    } catch (err) {
      toast.error("Failed to delete deal");
    }
  };

  const filteredDeals = deals.filter((d) => {
    const matchesSearch = d.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDeals.length / PAGE_SIZE);
  const paginatedDeals = filteredDeals.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const renderSkeleton = () =>
    Array.from({ length: PAGE_SIZE }).map((_, index) => (
      <tr key={index} className="deal-admin__skeleton-row">
        <td>
          <div className="deal-admin__skeleton deal-admin__skeleton-id"></div>
        </td>
        <td>
          <div className="deal-admin__skeleton deal-admin__skeleton-name"></div>
        </td>
        <td>
          <div className="deal-admin__skeleton deal-admin__skeleton-discount"></div>
        </td>
        <td>
          <div className="deal-admin__skeleton deal-admin__skeleton-status"></div>
        </td>
        <td>
          <div className="deal-admin__skeleton-actions">
            <div className="deal-admin__skeleton deal-admin__skeleton-btn"></div>
            <div className="deal-admin__skeleton deal-admin__skeleton-btn"></div>
          </div>
        </td>
      </tr>
    ));

  return (
    <div className="deal-admin">
      <AdminSidebar />
      <div className="deal-admin__content">
        <Header onSearch={() => {}} showSearch={false} title="Deal Management" />

        <div className="deal-admin__header">
          <div className="deal-admin__header-content">
            <div className="deal-admin__title-section">
              <h1 className="deal-admin__title">Deal Management</h1>
              <p className="deal-admin__subtitle">
                Manage your deals and discounts
              </p>
            </div>
            <button
              className="deal-admin__add-btn"
              onClick={() => setShowAddModal(true)}
            >
              <FiPlus className="deal-admin__btn-icon" />
              <span>Add New Deal</span>
            </button>
          </div>
        </div>

        <div className="deal-admin__controls">
          <div className="deal-admin__search-wrapper">
            <FiSearch className="deal-admin__search-icon" />
            <input
              className="deal-admin__search-input"
              type="text"
              placeholder="Search deals by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="deal-admin__filter-wrapper">
            <FiFilter className="deal-admin__filter-icon" />
            <select
              className="deal-admin__status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(
                  e.target.value as "ENABLED" | "DISABLED" | "ALL"
                );
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Status</option>
              <option value="ENABLED">Enabled</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>

        <div className="deal-admin__table-container">
          {error ? (
            <div className="deal-admin__error">
              <div className="deal-admin__error-content">
                <h3>Oops! Something went wrong</h3>
                <p>{error}</p>
                <button onClick={fetchDeals} className="deal-admin__retry-btn">
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="deal-admin__table-wrapper">
                <table className="deal-admin__table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Deal Name</th>
                      <th>Discount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? renderSkeleton()
                      : paginatedDeals.map((deal) => (
                          <tr key={deal.id} className="deal-admin__table-row">
                            <td className="deal-admin__cell-id">#{deal.id}</td>
                            <td className="deal-admin__cell-name">
                              {deal.name}
                            </td>
                            <td className="deal-admin__cell-discount">
                              <span className="deal-admin__discount-badge">
                                {deal.discountPercentage}%
                              </span>
                            </td>
                            <td>
                              <span
                                className={`deal-admin__status deal-admin__status--${deal.status.toLowerCase()}`}
                              >
                                {deal.status}
                              </span>
                            </td>
                            <td>
                              <div className="deal-admin__actions">
                                <button
                                  className="deal-admin__action-btn deal-admin__edit-btn"
                                  title="Edit Deal"
                                  onClick={() => {
                                    setShowEditModal({ show: true, deal });
                                    setFormData({
                                      name: deal.name,
                                      discountPercentage:
                                        deal.discountPercentage,
                                      status: deal.status,
                                    });
                                  }}
                                >
                                  <FiEdit2 />
                                </button>
                                <button
                                  className="deal-admin__action-btn deal-admin__delete-btn"
                                  title="Delete Deal"
                                  onClick={() =>
                                    setShowDeleteModal({ show: true, deal })
                                  }
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    {!loading && paginatedDeals.length === 0 && (
                      <tr>
                        <td colSpan={5} className="deal-admin__empty-state">
                          <div className="deal-admin__empty-content">
                            <h3>No deals found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="deal-admin__pagination">
                  <button
                    className="deal-admin__pagination-btn deal-admin__pagination-prev"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <div className="deal-admin__pagination-numbers">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        className={`deal-admin__pagination-btn${
                          currentPage === i + 1
                            ? " deal-admin__pagination-btn--active"
                            : ""
                        }`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    className="deal-admin__pagination-btn deal-admin__pagination-next"
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
          <div className="deal-admin__modal-overlay">
            <div className="deal-admin__modal">
              <div className="deal-admin__modal-header">
                <h2>Create New Deal</h2>
                <p>Add a new deal to your collection</p>
              </div>
              <form onSubmit={handleAddDeal} className="deal-admin__form">
                <div className="deal-admin__form-group">
                  <label className="deal-admin__label">Deal Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="deal-admin__input"
                    placeholder="Enter deal name"
                    required
                  />
                </div>
                <div className="deal-admin__form-group">
                  <label className="deal-admin__label">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    className="deal-admin__input"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                </div>
                <div className="deal-admin__form-group">
                  <label className="deal-admin__label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="deal-admin__select"
                    required
                  >
                    <option value="ENABLED">Enabled</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
                <div className="deal-admin__modal-actions">
                  <button
                    type="button"
                    className="deal-admin__btn deal-admin__btn--secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="deal-admin__btn deal-admin__btn--primary"
                  >
                    Create Deal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal.show && showEditModal.deal && (
          <div className="deal-admin__modal-overlay">
            <div className="deal-admin__modal">
              <div className="deal-admin__modal-header">
                <h2>Edit Deal</h2>
                <p>Update deal information</p>
              </div>
              <form onSubmit={handleEditDeal} className="deal-admin__form">
                <div className="deal-admin__form-group">
                  <label className="deal-admin__label">Deal Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="deal-admin__input"
                    placeholder="Enter deal name"
                    required
                  />
                </div>
                <div className="deal-admin__form-group">
                  <label className="deal-admin__label">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    className="deal-admin__input"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                </div>
                <div className="deal-admin__form-group">
                  <label className="deal-admin__label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="deal-admin__select"
                    required
                  >
                    <option value="ENABLED">Enabled</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
                <div className="deal-admin__modal-actions">
                  <button
                    type="button"
                    className="deal-admin__btn deal-admin__btn--secondary"
                    onClick={() =>
                      setShowEditModal({ show: false, deal: null })
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="deal-admin__btn deal-admin__btn--primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal.show && showDeleteModal.deal && (
          <div className="deal-admin__modal-overlay">
            <div className="deal-admin__modal deal-admin__modal--danger">
              <div className="deal-admin__modal-header">
                <h2>Delete Deal</h2>
                <p>This action cannot be undone</p>
              </div>
              <div className="deal-admin__delete-content">
                <p>
                  Are you sure you want to delete{" "}
                  <strong>"{showDeleteModal.deal.name}"</strong>?
                </p>
              </div>
              <div className="deal-admin__modal-actions">
                <button
                  className="deal-admin__btn deal-admin__btn--secondary"
                  onClick={() =>
                    setShowDeleteModal({ show: false, deal: null })
                  }
                >
                  Cancel
                </button>
                <button
                  className="deal-admin__btn deal-admin__btn--danger"
                  onClick={handleDeleteDeal}
                >
                  Delete Deal
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </div>
  );
};

export default DealAdmin;
