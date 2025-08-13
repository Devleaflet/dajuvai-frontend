import React, { useEffect, useState } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import { FiEdit2, FiTrash2, FiPlus, FiSearch } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/AdminPromo.css";
import PromoService, {
  PromoCode,
  CreatePromoCodeData,
} from "../services/promoService";
import DeleteModal from "../Components/Modal/DeleteModal";

const CACHE_KEY = "admin_promos";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const PAGE_SIZE = 10;

const AdminPromo: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{
    show: boolean;
    promoCode: PromoCode | null;
  }>({
    show: false,
    promoCode: null,
  });
  const [formData, setFormData] = useState<CreatePromoCodeData>({
    promoCode: "",
    discountPercentage: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setError("Please log in to access promo code management.");
      setLoading(false);
      return;
    }

    // Try to load from cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Array.isArray(data) && Date.now() - timestamp < CACHE_TTL) {
          setPromoCodes(data);
          setLoading(false);
          return;
        }
      } catch {
        console.error("Error parsing cached promo codes");
      }
    }
    fetchPromoCodes();
  }, [isAuthenticated, token]);

  const fetchPromoCodes = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await PromoService.getInstance().getAllPromoCodes(token);
      if (response.success && response.data) {
        setPromoCodes(response.data);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: response.data, timestamp: Date.now() })
        );
      } else {
        throw new Error(response.message || "Failed to fetch promo codes");
      }
    } catch (err) {
      setError("Failed to load promo codes");
      toast.error("Failed to load promo codes");
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

  const handleAddPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    try {
      // Validate form data
      if (!formData.promoCode.trim()) {
        toast.error("Promo code is required");
        return;
      }

      if (formData.discountPercentage <= 0 || formData.discountPercentage > 100) {
        toast.error("Discount percentage must be between 1 and 100");
        return;
      }

      const response = await PromoService.getInstance().createPromoCode(
        formData,
        token
      );

      if (response.success) {
        toast.success("Promo code created successfully!");
        setFormData({ promoCode: "", discountPercentage: 0 });
        setShowAddModal(false);
        // Clear cache and refetch
        localStorage.removeItem(CACHE_KEY);
        fetchPromoCodes();
      } else {
        throw new Error(response.message || "Failed to create promo code");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create promo code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromoCode = async () => {
    console.log("Delete function called");
    if (!token || !showDeleteModal.promoCode) {
      console.log("Missing token or promo code:", { token: !!token, promoCode: !!showDeleteModal.promoCode });
      return;
    }

    console.log("Attempting to delete promo code:", showDeleteModal.promoCode);
    setSubmitting(true);
    try {
      const response = await PromoService.getInstance().deletePromoCode(
        showDeleteModal.promoCode.id,
        token
      );

      console.log("Delete response:", response);

      if (response.success) {
        toast.success("Promo code deleted successfully!");
        setShowDeleteModal({ show: false, promoCode: null });
        // Clear cache and refetch
        localStorage.removeItem(CACHE_KEY);
        fetchPromoCodes();
      } else {
        throw new Error(response.message || "Failed to delete promo code");
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete promo code");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and paginate promo codes
  const filteredPromoCodes = promoCodes.filter((promo) =>
    promo.promoCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPromoCodes.length / PAGE_SIZE);
  const paginatedPromoCodes = filteredPromoCodes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-promo">
        <AdminSidebar />
        <div className="admin-promo__content">
          <div className="admin-promo__error">
            <h2>Access Denied</h2>
            <p>Please log in to access promo code management.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-promo">
        <AdminSidebar />
        <div className="admin-promo__content">
          <div className="admin-promo__header">
            <div className="admin-promo__title-container">
              <h1 className="admin-promo__title">Promo Code Management</h1>
              <p className="admin-promo__description">
                Create and manage promotional codes
              </p>
            </div>
          </div>
          <div className="admin-promo__table-container">
            <table className="admin-promo__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Promo Code</th>
                  <th>Discount %</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td>
                      <div className="admin-promo__skeleton"></div>
                    </td>
                    <td>
                      <div className="admin-promo__skeleton"></div>
                    </td>
                    <td>
                      <div className="admin-promo__skeleton"></div>
                    </td>
                    <td>
                      <div className="admin-promo__skeleton"></div>
                    </td>
                    <td>
                      <div className="admin-promo__skeleton"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-promo">
      <AdminSidebar />
      <div className="admin-promo__content">
        <div className="admin-promo__header">
          <div className="admin-promo__title-container">
            <h1 className="admin-promo__title">Promo Code Management</h1>
            <p className="admin-promo__description">
              Create and manage promotional codes
            </p>
          </div>
          <button
            className="admin-promo__add-button"
            onClick={() => setShowAddModal(true)}
          >
            <FiPlus />
            Add Promo Code
          </button>
        </div>

        <div className="admin-promo__controls">
          <div className="admin-promo__search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search promo codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="admin-promo__error">
            <p>{error}</p>
          </div>
        )}

        <div className="admin-promo__table-container">
          <table className="admin-promo__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Promo Code</th>
                <th>Discount %</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPromoCodes.map((promo) => (
                <tr key={promo.id}>
                  <td>{promo.id}</td>
                  <td>
                    <span className="admin-promo__code">{promo.promoCode}</span>
                  </td>
                  <td>
                    <span className="admin-promo__discount">
                      {promo.discountPercentage}%
                    </span>
                  </td>
                  <td>
                    {promo.createdAt ? formatDate(promo.createdAt) : "N/A"}
                  </td>
                  <td>
                    <div className="admin-promo__actions">
                                             <button
                         className="admin-promo__action-button admin-promo__action-button--delete"
                         onClick={() => {
                           console.log("Delete button clicked for promo:", promo);
                           setShowDeleteModal({ show: true, promoCode: promo });
                         }}
                         title="Delete promo code"
                       >
                         <FiTrash2 />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginatedPromoCodes.length === 0 && (
            <div className="admin-promo__empty">
              <p>No promo codes found</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="admin-promo__pagination">
            <button
              className="admin-promo__pagination-button"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="admin-promo__pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="admin-promo__pagination-button"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Promo Code Modal */}
      {showAddModal && (
        <div className="admin-promo__modal-overlay">
          <div className="admin-promo__modal">
            <div className="admin-promo__modal-header">
              <h2>Add New Promo Code</h2>
              <button
                className="admin-promo__modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddPromoCode} className="admin-promo__modal-form">
              <div className="admin-promo__form-group">
                <label htmlFor="promoCode">Promo Code *</label>
                <input
                  type="text"
                  id="promoCode"
                  name="promoCode"
                  value={formData.promoCode}
                  onChange={handleInputChange}
                  placeholder="e.g., SUMMER2025"
                  required
                  maxLength={20}
                />
              </div>
              <div className="admin-promo__form-group">
                <label htmlFor="discountPercentage">Discount Percentage *</label>
                <input
                  type="number"
                  id="discountPercentage"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleInputChange}
                  placeholder="e.g., 15"
                  min="1"
                  max="100"
                  required
                />
                <small>Enter a value between 1 and 100</small>
              </div>
              <div className="admin-promo__modal-actions">
                <button
                  type="button"
                  className="admin-promo__modal-button admin-promo__modal-button--cancel"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-promo__modal-button admin-promo__modal-button--submit"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Promo Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal.show && showDeleteModal.promoCode && (
        <DeleteModal
          show={showDeleteModal.show}
          onClose={() => setShowDeleteModal({ show: false, promoCode: null })}
          onDelete={handleDeletePromoCode}
          productName={showDeleteModal.promoCode.promoCode}
        />
      )}

      <ToastContainer position="top-right" />
    </div>
  );
};

export default AdminPromo;
