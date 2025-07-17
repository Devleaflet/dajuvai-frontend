import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import toast, { Toaster } from "react-hot-toast";
import "../Styles/AdminCatalog.css";
import { AdminSidebar } from "../Components/AdminSidebar";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";

interface Product {
  id: number;
  name: string;
  title?: string;
  price?: number;
}

interface HomepageSection {
  id: number;
  title: string;
  isActive: boolean;
  products: Product[];
}

const AdminCatalog = () => {
  const { token } = useAuth();
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHomepageModal, setShowHomepageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);
  const [editingHomepage, setEditingHomepage] = useState<HomepageSection | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalIsActive, setModalIsActive] = useState(true);
  const [modalProductIds, setModalProductIds] = useState<number[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce product search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(productSearchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [productSearchQuery]);

  useEffect(() => {
    fetchHomepageSections();
    fetchProducts();
  }, [token]);

  const fetchHomepageSections = async () => {
    if (!token) return;
    setLoadingSections(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/homepage?includeInactive=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch homepage sections");
      const data = await response.json();
      setHomepageSections(data.data);
    } catch (err) {
      setError("Failed to load homepage sections");
      toast.error("Failed to load homepage sections");
    } finally {
      setLoadingSections(false);
    }
  };

  const fetchProducts = async () => {
    if (!token) return;
    setLoadingProducts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/all/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      const formattedProducts = data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        title: item.name,
        price: parseFloat(item.basePrice),
      }));
      setAllProducts(formattedProducts);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleToggleHomepageStatus = async (id: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/homepage/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to toggle section status");
      const data = await response.json();
      setHomepageSections((sections) =>
        sections.map((section) =>
          section.id === id ? { ...section, isActive: data.data.isActive } : section
        )
      );
      toast.success("Section status updated successfully");
    } catch (err) {
      toast.error("Failed to update section status");
    }
  };

  const handleDeleteHomepageSection = async (id: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/homepage/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to delete section");
      setHomepageSections((sections) => sections.filter((section) => section.id !== id));
      toast.success("Homepage section deleted successfully");
      setShowDeleteModal(false);
      setSectionToDelete(null);
    } catch (err) {
      toast.error("Failed to delete section");
    }
  };

  const openDeleteConfirmation = useCallback((id: number) => {
    setSectionToDelete(id);
    setShowDeleteModal(true);
  }, []);

  const openHomepageModal = useCallback((section?: HomepageSection) => {
    if (section) {
      setEditingHomepage(section);
      setModalTitle(section.title);
      setModalIsActive(section.isActive);
      setModalProductIds(section.products.map((p) => p.id));
    } else {
      setEditingHomepage(null);
      setModalTitle("");
      setModalIsActive(true);
      setModalProductIds([]);
    }
    setProductSearchQuery("");
    setDebouncedSearchQuery("");
    setShowHomepageModal(true);
  }, []);

  const handleSaveHomepageSection = async () => {
    if (!token) return;
    if (!modalTitle || modalProductIds.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        title: modalTitle,
        isActive: modalIsActive,
        productIds: modalProductIds,
      };

      const url = editingHomepage
        ? `${API_BASE_URL}/api/homepage/${editingHomepage.id}`
        : `${API_BASE_URL}/api/homepage`;

      const response = await fetch(url, {
        method: editingHomepage ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save section");

      const data = await response.json();
      if (editingHomepage) {
        setHomepageSections((sections) =>
          sections.map((section) =>
            section.id === editingHomepage.id ? data.data : section
          )
        );
        toast.success("Homepage section updated successfully");
      } else {
        setHomepageSections((sections) => [...sections, data.data]);
        toast.success("Homepage section created successfully");
      }

      setShowHomepageModal(false);
    } catch (err) {
      toast.error("Failed to save section");
    }
  };

  const filteredSections = useMemo(() =>
    homepageSections.filter((section) =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase())
    ), [homepageSections, searchQuery]);

  const filteredProducts = useMemo(() =>
    allProducts.filter((product) =>
      product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ), [allProducts, debouncedSearchQuery]);

  return (
    <div className="admin-catalog">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
          },
          success: {
            style: { backgroundColor: "#4caf50" },
          },
          error: {
            style: { backgroundColor: "#f44336" },
          },
        }}
      />
      <AdminSidebar />
      <div className="admin-catalog__container">
        <div className="admin-catalog__content">
          <div className="admin-catalog__header">
            <h1 className="admin-catalog__title">Content Management</h1>
            <p className="admin-catalog__subtitle">Manage your homepage sections</p>
          </div>

          <div className="admin-catalog__card">
            <div className="admin-catalog__card-header">
              <div className="admin-catalog__section-info">
                <h3 className="admin-catalog__section-title">Homepage Sections</h3>
                <p className="admin-catalog__section-description">Manage sections that appear on your homepage</p>
              </div>
              <div className="admin-catalog__controls">
                <div className="admin-catalog__search">
                  <Search className="admin-catalog__search-icon" />
                  <input
                    type="text"
                    placeholder="Search sections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="admin-catalog__search-input"
                  />
                </div>
                <button onClick={() => openHomepageModal()} className="admin-catalog__add-button">
                  <Plus className="admin-catalog__button-icon" />
                  Add Section
                </button>
              </div>
            </div>

            <div className="admin-catalog__table-container">
              {error ? (
                <div className="admin-catalog__error">{error}</div>
              ) : loadingSections ? (
                <div className="admin-catalog__loading">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="admin-catalog__skeleton-row">
                      <div className="admin-catalog__skeleton-cell"></div>
                      <div className="admin-catalog__skeleton-cell"></div>
                      <div className="admin-catalog__skeleton-cell"></div>
                      <div className="admin-catalog__skeleton-cell"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="admin-catalog__table">
                  <thead className="admin-catalog__table-head">
                    <tr className="admin-catalog__table-row">
                      <th className="admin-catalog__table-header">Title</th>
                      <th className="admin-catalog__table-header">Status</th>
                      <th className="admin-catalog__table-header">Products</th>
                      <th className="admin-catalog__table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-catalog__table-body">
                    {filteredSections.map((section) => (
                      <tr key={section.id} className="admin-catalog__table-row">
                        <td className="admin-catalog__table-cell admin-catalog__table-cell--title">{section.title}</td>
                        <td className="admin-catalog__table-cell">
                          <button
                            onClick={() => handleToggleHomepageStatus(section.id)}
                            className={`admin-catalog__status-toggle ${section.isActive ? 'admin-catalog__status-toggle--active' : 'admin-catalog__status-toggle--inactive'}`}
                          >
                            {section.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="admin-catalog__table-cell">
                          <div className="admin-catalog__product-tags">
                            {section.products.slice(0, 3).map((product) => (
                              <span key={product.id} className="admin-catalog__product-tag">
                                {product.title || product.name}
                              </span>
                            ))}
                            {section.products.length > 3 && (
                              <span className="admin-catalog__product-tag admin-catalog__product-tag--more">
                                +{section.products.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="admin-catalog__table-cell">
                          <div className="admin-catalog__actions">
                            <button
                              onClick={() => openHomepageModal(section)}
                              className="admin-catalog__action-button admin-catalog__action-button--edit"
                            >
                              <Edit className="admin-catalog__action-icon" />
                            </button>
                            <button
                              onClick={() => openDeleteConfirmation(section.id)}
                              className="admin-catalog__action-button admin-catalog__action-button--delete"
                            >
                              <Trash2 className="admin-catalog__action-icon" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loadingSections && filteredSections.length === 0 && (
                      <tr className="admin-catalog__table-row">
                        <td colSpan={4} className="admin-catalog__table-cell admin-catalog__no-data">
                          No sections found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Add/Edit Homepage Section Modal */}
          <Dialog.Root open={showHomepageModal} onOpenChange={setShowHomepageModal}>
            <Dialog.Portal>
              <Dialog.Overlay className="admin-catalog__modal-overlay" />
              <Dialog.Content className="admin-catalog__modal admin-catalog__modal--homepage">
                <Dialog.Title className="admin-catalog__modal-title">
                  {editingHomepage ? "Edit Homepage Section" : "Add Homepage Section"}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="admin-catalog__modal-close" aria-label="Close">
                    <X size={24} />
                  </button>
                </Dialog.Close>
                <div className="admin-catalog__modal-body">
                  <div className="admin-catalog__form-group admin-catalog__form-group--row">
                    <div className="admin-catalog__checkbox-container">
                      <input
                        id="isActive"
                        type="checkbox"
                        className="admin-catalog__checkbox"
                        checked={modalIsActive}
                        onChange={(e) => setModalIsActive(e.target.checked)}
                      />
                      <label htmlFor="isActive" className="admin-catalog__checkbox-label">
                        Active
                      </label>
                    </div>
                    <div className="admin-catalog__input-container">
                      <label htmlFor="title" className="admin-catalog__form-label">
                        Title
                      </label>
                      <input
                        id="title"
                        type="text"
                        value={modalTitle}
                        onChange={(e) => setModalTitle(e.target.value)}
                        placeholder="Section title"
                        className="admin-catalog__form-input"
                      />
                    </div>
                  </div>
                  <div className="admin-catalog__form-group">
                    <label className="admin-catalog__form-label">Products</label>
                    <div className="admin-catalog__search admin-catalog__search--modal">
                  
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="admin-catalog__form-input"
                      />
                    </div>
                    <div className="admin-catalog__products-list">
                      {loadingProducts ? (
                        [...Array(6)].map((_, i) => (
                          <div key={i} className="admin-catalog__product-item admin-catalog__product-item--skeleton">
                            <div className="admin-catalog__product-checkbox admin-catalog__skeleton-cell"></div>
                            <div className="admin-catalog__product-details">
                              <div className="admin-catalog__product-id admin-catalog__skeleton-cell"></div>
                              <div className="admin-catalog__product-name admin-catalog__skeleton-cell"></div>
                              <div className="admin-catalog__product-price admin-catalog__skeleton-cell"></div>
                            </div>
                          </div>
                        ))
                      ) : filteredProducts.length === 0 ? (
                        <div className="admin-catalog__no-products">No items found</div>
                      ) : (
                        filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className={`admin-catalog__product-item ${modalProductIds.includes(product.id) ? 'admin-catalog__product-item--selected' : ''}`}
                            onClick={() => {
                              if (modalProductIds.includes(product.id)) {
                                setModalProductIds(modalProductIds.filter((id) => id !== product.id));
                              } else {
                                setModalProductIds([...modalProductIds, product.id]);
                              }
                            }}
                          >
                            <div className="admin-catalog__product-checkbox-wrapper">
                              <input
                                type="checkbox"
                                checked={modalProductIds.includes(product.id)}
                                onChange={() => {}}
                                className="admin-catalog__hidden-checkbox"
                                id={`product-${product.id}`}
                              />
                              <span className="admin-catalog__custom-checkbox">
                                {modalProductIds.includes(product.id) && (
                                  <svg viewBox="0 0 24 24" className="admin-catalog__checkmark">
                                    <path d="M20 6L9 17l-5-7" stroke="currentColor" strokeWidth="2" fill="none" />
                                  </svg>
                                )}
                              </span>
                            </div>
                            <div className="admin-catalog__product-details">
                              <div className="admin-catalog__product-id">ID: {product.id}</div>
                              <div className="admin-catalog__product-name">{product.name}</div>
                              {product.price && (
                                <div className="admin-catalog__product-price">Rs. {product.price.toFixed(2)}</div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="admin-catalog__modal-actions">
                  <button className="admin-catalog__button admin-catalog__button--cancel" onClick={() => setShowHomepageModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="admin-catalog__button admin-catalog__button--submit"
                    onClick={handleSaveHomepageSection}
                    disabled={!modalTitle || modalProductIds.length === 0}
                  >
                    {editingHomepage ? "Save" : "Create"}
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {/* Delete Confirmation Modal */}
          <Dialog.Root open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <Dialog.Portal>
              <Dialog.Overlay className="admin-catalog__modal-overlay" />
              <Dialog.Content className="admin-catalog__modal admin-catalog__modal--delete">
                <Dialog.Title className="admin-catalog__modal-title">Confirm Deletion</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="admin-catalog__modal-close" aria-label="Close">
                    <X size={24} />
                  </button>
                </Dialog.Close>
                <div className="admin-catalog__modal-body">
                  <p className="admin-catalog__modal-text">Are you sure you want to delete this homepage section? This action cannot be undone.</p>
                </div>
                <div className="admin-catalog__modal-actions">
                  <button
                    className="admin-catalog__button admin-catalog__button--cancel"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSectionToDelete(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="admin-catalog__button admin-catalog__button--danger"
                    onClick={() => {
                      if (sectionToDelete) {
                        handleDeleteHomepageSection(sectionToDelete);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </div>
  );
};

export default AdminCatalog;