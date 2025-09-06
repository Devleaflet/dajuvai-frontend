import type React from "react";
import { useState, useEffect } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import { Edit, X, ChevronLeft, ChevronRight } from "lucide-react";
import "../Styles/AdminBanner.css";
import DeleteModal from "../Components/Modal/DeleteModal";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import toast from "react-hot-toast";

// Types
interface Banner {
  id: number;
  name: string;
  type: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdBy?: {
    id: number;
    username: string;
    email: string;
  };
  createdById?: number;
  desktopImage?: string;
  mobileImage?: string;
  color?: string;
  dateRange?: string;
  createdAt?: string;
  updatedAt?: string;
  productSource?: string;
  selectedProducts?: Array<number | { id: number; [key: string]: any }>;
  selectedCategoryId?: number;
  selectedSubcategory?: number;
  selectedDeal?: number;
  externalLink?: string;
}

interface TransformedBanner {
  id: number;
  name: string;
  type: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdById?: number;
  desktopImage?: string;
  mobileImage?: string;
  color?: string;
  dateRange?: string;
  createdAt?: string;
  updatedAt?: string;
  productSource?: string;
  selectedProducts?: number[];
  selectedCategoryId?: number;
  selectedSubcategory?: number;
  selectedDeal?: number;
  externalLink?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface Category {
  id: number;
  name: string;
  createdBy: { id: number; username: string };
  subcategories: { id: number; name: string }[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  stock: number;
  discount: number;
  discountType: string;
  size: string[];
  productImages: string[];
  inventory: { sku: string; quantity: number; status: string }[];
  created_at: string;
  updated_at: string;
  brand: { id: number; name: string };
  vendor: { id: number; name: string };
  deal: { id: number; title: string };
  subcategory: { id: number; name: string; category: { id: number; name: string } };
}

interface Deal {
  id: number;
  title: string;
}

// API service functions with auth headers
const createBannerAPI = (token: string | null) => ({
  async getAll(): Promise<Banner[]> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/banners`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<Banner[]> = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching banners:", error);
      throw error;
    }
  },

  async getById(id: number): Promise<Banner> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<Banner> = await response.json();
      return result.data!;
    } catch (error) {
      console.error("Error fetching banner:", error);
      throw error;
    }
  },

  async create(bannerData: Record<string, any>): Promise<Banner> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/banners`, {
        method: "POST",
        headers,
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result: ApiResponse<Banner> = await response.json();
      return result.data!;
    } catch (error) {
      console.error("Error creating banner:", error);
      throw error;
    }
  },

  async update(id: number, bannerData: Record<string, any>): Promise<Banner> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result: ApiResponse<Banner> = await response.json();
      return result.data!;
    } catch (error) {
      console.error("Error updating banner:", error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      throw error;
    }
  },
});

const createCategoryAPI = (token: string | null) => ({
  async getCategories(): Promise<Category[]> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<Category[]> = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  async getProducts(categoryId?: number, subcategoryId?: number, dealId?: number): Promise<Product[]> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const params = new URLSearchParams();
      if (categoryId) params.append("categoryId", categoryId.toString());
      if (subcategoryId) params.append("subcategoryId", subcategoryId.toString());
      if (dealId) params.append("dealId", dealId.toString());

      const response = await fetch(`${API_BASE_URL}/api/categories/all/products?${params.toString()}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<Product[]> = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },
});

const createDealAPI = (token: string | null) => ({
  async getDeals(): Promise<Deal[]> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/deal`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Deal[]> = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching deals:", error);
      throw error;
    }
  },
});

const createImageAPI = (token: string | null) => ({
  async uploadImage(image: File): Promise<string> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch(`${API_BASE_URL}/api/image`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result: ApiResponse<string> = await response.json();
      return result.data!;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },
});

// Skeleton component for loading state
const SkeletonRow: React.FC = () => {
  return (
    <tr>
      <td>
        <div className="skeleton skeleton-text"></div>
      </td>
      <td>
        <div className="skeleton skeleton-text"></div>
      </td>
      <td>
        <div className="skeleton skeleton-text"></div>
      </td>
      <td>
        <div className="skeleton skeleton-text"></div>
      </td>
      <td>
        <div className="skeleton skeleton-text"></div>
      </td>
      <td>
        <div className="skeleton skeleton-text"></div>
      </td>
      <td>
        <div className="skeleton skeleton-text"></div>
      </td>
    </tr>
  );
};

const CACHE_KEY = "admin_banners";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const AdminBannerWithTabs = () => {
  const { token, isAuthenticated } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All Banners");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<{ id: number; name: string } | null>(null);
  const [banners, setBanners] = useState<TransformedBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<TransformedBanner | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Banner | "createdBy"; direction: "asc" | "desc" } | null>(null);
  const PAGE_SIZE = 7;

  const tabs = ["All Banners", "Active", "Scheduled", "Expired", "Drafts"];

  const bannerAPI = createBannerAPI(token);
  const categoryAPI = createCategoryAPI(token);
  const dealAPI = createDealAPI(token);
  const imageAPI = createImageAPI(token);

  useEffect(() => {
    if (isAuthenticated) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Array.isArray(data) && Date.now() - timestamp < CACHE_TTL) {
            setBanners(data);
            setLoading(false);
          }
        } catch {}
      }
      loadBanners();
    }
  }, [isAuthenticated, token]);

  const transformBanner = (banner: Banner): TransformedBanner => ({
    ...banner,
    status: mapApiStatusToDisplay(banner.status),
    type: mapApiTypeToDisplay(banner.type),
    dateRange:
      banner.startDate && banner.endDate
        ? `${new Date(banner.startDate).toLocaleDateString()} - ${new Date(banner.endDate).toLocaleDateString()}`
        : banner.startDate
        ? `From ${new Date(banner.startDate).toLocaleDateString()}`
        : "Not scheduled",
    color: banner.color || getDefaultColor(mapApiTypeToDisplay(banner.type)),
    createdBy: banner.createdBy ? banner.createdBy.username : "System",
    selectedProducts: Array.isArray(banner.selectedProducts)
      ? banner.selectedProducts.map((product) =>
          typeof product === "number" ? product : product.id
        )
      : [],
    selectedCategoryId: banner.selectedCategoryId,
    selectedSubcategory: banner.selectedSubcategory,
  });

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedBanners = await bannerAPI.getAll();
      const transformedBanners = fetchedBanners.map(transformBanner);
      setBanners(transformedBanners);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: transformedBanners, timestamp: Date.now() })
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load banners");
      console.error("Error loading banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const mapApiStatusToDisplay = (apiStatus: string) => {
    switch (apiStatus.toUpperCase()) {
      case "ACTIVE":
        return "Active";
      case "SCHEDULED":
        return "Scheduled";
      case "EXPIRED":
        return "Expired";
      case "DRAFT":
        return "Draft";
      default:
        return apiStatus;
    }
  };

  const mapDisplayStatusToApi = (displayStatus: string) => {
    switch (displayStatus) {
      case "Active":
        return "ACTIVE";
      case "Scheduled":
        return "SCHEDULED";
      case "Expired":
        return "EXPIRED";
      case "Draft":
        return "DRAFT";
      default:
        return displayStatus.toUpperCase();
    }
  };

  const mapApiTypeToDisplay = (apiType: string) => {
    switch (apiType.toUpperCase()) {
      case "HERO":
        return "Hero Banner";
      case "SIDEBAR":
        return "Sidebar Banner";
      case "PRODUCT":
        return "Product Banner";
      case "SPECIAL_DEALS":
        return "Special Deals Banner";
      default:
        return apiType;
    }
  };

  const mapDisplayTypeToApi = (displayType: string) => {
    switch (displayType) {
      case "Hero Banner":
        return "HERO";
      case "Sidebar Banner":
        return "SIDEBAR";
      case "Product Banner":
        return "PRODUCT";
      case "Special Deals Banner":
        return "SPECIAL_DEALS";
      default:
        return displayType.toUpperCase();
    }
  };

  const getDefaultColor = (type: string) => {
    switch (type) {
      case "Hero Banner":
        return "#FF7A45";
      case "Sidebar Banner":
        return "#FADB14";
      case "Product Banner":
        return "#52C41A";
      case "Special Deals Banner":
        return "#FF4D4F";
      default:
        return "#85A5FF";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "admin-banner__status--active";
      case "scheduled":
        return "admin-banner__status--scheduled";
      case "draft":
        return "admin-banner__status--draft";
      case "expired":
        return "admin-banner__status--expired";
      default:
        return "";
    }
  };

  const handleCreateBanner = () => {
    setEditingBanner(null);
    setShowCreateForm(true);
  };

  const handleEditBanner = async (bannerId: number) => {
    try {
      const banner = await bannerAPI.getById(bannerId);
      let transformedBanner = transformBanner(banner);

      // If productSource is "manual" and selectedProducts exist but selectedCategoryId or selectedSubcategory are missing, fetch product details
      if (transformedBanner.productSource === "manual" && transformedBanner.selectedProducts?.length && (!transformedBanner.selectedCategoryId || !transformedBanner.selectedSubcategory)) {
        const productIds = transformedBanner.selectedProducts;
        const products = await categoryAPI.getProducts();
        const matchingProduct = products.find((product) => productIds.includes(product.id));
        if (matchingProduct) {
          transformedBanner = {
            ...transformedBanner,
            selectedCategoryId: matchingProduct.subcategory.category.id,
            selectedSubcategory: matchingProduct.subcategory.id,
          };
        }
      }

      setEditingBanner(transformedBanner);
      setShowCreateForm(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load banner for editing");
    }
  };

  const handleDeleteClick = (banner: { id: number; name: string }) => {
    setBannerToDelete(banner);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (bannerToDelete) {
      try {
        await bannerAPI.delete(bannerToDelete.id);
        setBanners(banners.filter((banner) => banner.id !== bannerToDelete.id));
        setShowDeleteModal(false);
        setBannerToDelete(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to delete banner");
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setBannerToDelete(null);
  };

  const handleBannerSaved = (savedBanner: Banner) => {
    const transformedBanner = transformBanner(savedBanner);
    if (editingBanner) {
      setBanners(banners.map((banner) => (banner.id === transformedBanner.id ? transformedBanner : banner)));
      toast.success("Banner updated successfully!");
    } else {
      setBanners([transformedBanner, ...banners]);
      toast.success("Banner created successfully!");
    }
    setShowCreateForm(false);
    setEditingBanner(null);
  };

  const handleSort = (key: keyof Banner | "createdBy") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedAndFilteredBanners = () => {
    let filtered = [...banners];

    if (activeTab !== "All Banners") {
      const statusFilter = activeTab === "Drafts" ? "Draft" : activeTab;
      filtered = filtered.filter((banner) => banner.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (banner) =>
          banner.name.toLowerCase().includes(query) ||
          banner.type.toLowerCase().includes(query) ||
          banner.status.toLowerCase().includes(query) ||
          banner.createdBy.toLowerCase().includes(query)
      );
    }

    if (sortConfig) {
      filtered = filtered.sort((a, b) => {
        const aValue = sortConfig.key === "createdBy" ? a.createdBy : a[sortConfig.key];
        const bValue = sortConfig.key === "createdBy" ? b.createdBy : b[sortConfig.key];

        if (sortConfig.key === "id") {
          return sortConfig.direction === "asc" ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
        }

        const aStr = String(aValue || "").toLowerCase();
        const bStr = String(bValue || "").toLowerCase();

        if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const filteredBanners = getSortedAndFilteredBanners();
  const totalPages = Math.ceil(filteredBanners.length / PAGE_SIZE);
  const paginatedBanners = filteredBanners.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (!isAuthenticated) {
    return (
      <div className="admin-banner" style={{ display: "flex" }}>
        <AdminSidebar />
        <div className="admin-banner__content">
          <div className="admin-banner__error">Please log in to access banner management.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-banner" style={{ display: "flex" }}>
        <AdminSidebar />
        <div className="admin-banner__content">
          <div className="admin-banner__header">
            <div className="admin-banner__title-container">
              <h1 className="admin-banner__title">Ad Banner Management</h1>
              <p className="admin-banner__description">Create and manage promotional banners</p>
            </div>
          </div>
          <div className="admin-banner__table-container">
            <table className="admin-banner__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Banner Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date Range</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, index) => <SkeletonRow key={index} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-banner" style={{ display: "flex" }}>
      <AdminSidebar />
      <div className="admin-banner__content">
        <Header onSearch={() => {}} showSearch={false} title="Banner Management" />
        {error && (
          <div className="admin-banner__error">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {!showCreateForm ? (
          <>
            <div className="admin-banner__header">
              <div className="admin-banner__title-container">
                <h1 className="admin-banner__title">Ad Banner Management</h1>
                <p className="admin-banner__description">Create and manage promotional banners</p>
              </div>
              <button className="admin-banner__create-button" onClick={handleCreateBanner}>
                <span className="admin-banner__create-icon">+</span> Create New Banner
              </button>
            </div>

            <div className="admin-banner__tabs">
              {tabs.map((tab) => (
                <div
                  key={tab}
                  className={`admin-banner__tab ${activeTab === tab ? "admin-banner__tab--active" : ""}`}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>

            <div className="admin-banner__search-container">
              <input
                type="text"
                placeholder="Search banners..."
                className="admin-banner__search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="admin-banner__table-container">
              <table className="admin-banner__table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("id")} className="sortable">
                      ID {sortConfig?.key === "id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("name")} className="sortable">
                      Banner Name {sortConfig?.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("type")} className="sortable">
                      Type {sortConfig?.key === "type" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("status")} className="sortable">
                      Status {sortConfig?.key === "status" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("dateRange")} className="sortable">
                      Date Range {sortConfig?.key === "dateRange" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("createdBy")} className="sortable">
                      Created By {sortConfig?.key === "createdBy" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(PAGE_SIZE)].map((_, index) => <SkeletonRow key={index} />)
                  ) : paginatedBanners.length > 0 ? (
                    paginatedBanners.map((banner) => (
                      <tr key={banner.id}>
                        <td>{banner.id}</td>
                        <td>
                          <div className="admin-banner__name">
                            <div
                              className="admin-banner__color-indicator"
                              style={{ backgroundColor: banner.color }}
                            ></div>
                            {banner.name}
                          </div>
                        </td>
                        <td>{banner.type}</td>
                        <td>
                          <span className={`admin-banner__status ${getStatusClass(banner.status)}`}>{banner.status}</span>
                        </td>
                        <td>{banner.dateRange}</td>
                        <td>{banner.createdBy}</td>
                        <td>
                          <div className="admin-banner__actions">
                            <button
                              className="admin-banner__action-button admin-banner__action-button--edit"
                              onClick={() => handleEditBanner(banner.id)}
                              title="Edit banner"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className="admin-banner__action-button admin-banner__action-button--delete"
                              onClick={() => handleDeleteClick(banner)}
                              title="Delete banner"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="admin-banner__no-data">
                        No banners found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-banner__pagination">
              <button
                className="admin-banner__pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`admin-banner__pagination-btn ${currentPage === i + 1 ? "active" : ""}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="admin-banner__pagination-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <CreateBannerForm
            onClose={() => {
              setShowCreateForm(false);
              setEditingBanner(null);
            }}
            onSave={handleBannerSaved}
            editingBanner={editingBanner}
            onError={setError}
            mapDisplayStatusToApi={mapDisplayStatusToApi}
            mapDisplayTypeToApi={mapDisplayTypeToApi}
            bannerAPI={bannerAPI}
            categoryAPI={categoryAPI}
            dealAPI={dealAPI}
            imageAPI={imageAPI}
          />
        )}

        {showDeleteModal && bannerToDelete && (
          <DeleteModal show={showDeleteModal} onClose={handleDeleteCancel} onDelete={handleDeleteConfirm} productName={bannerToDelete.name} />
        )}
      </div>
    </div>
  );
};

interface CreateBannerFormProps {
  onClose: () => void;
  onSave: (banner: Banner) => void;
  editingBanner: TransformedBanner | null;
  onError: (error: string) => void;
  mapDisplayStatusToApi: (status: string) => string;
  mapDisplayTypeToApi: (type: string) => string;
  bannerAPI: ReturnType<typeof createBannerAPI>;
  categoryAPI: ReturnType<typeof createCategoryAPI>;
  dealAPI: ReturnType<typeof createDealAPI>;
  imageAPI: ReturnType<typeof createImageAPI>;
}

const CreateBannerForm: React.FC<CreateBannerFormProps> = ({
  onClose,
  onSave,
  editingBanner,
  onError,
  mapDisplayTypeToApi,
  bannerAPI,
  categoryAPI,
  dealAPI,
  imageAPI,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [bannerName, setBannerName] = useState(editingBanner?.name || "");
  const [bannerType, setBannerType] = useState(editingBanner?.type || "Hero Banner");
  const [startDate, setStartDate] = useState(
    editingBanner?.startDate ? new Date(editingBanner.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    editingBanner?.endDate ? new Date(editingBanner.endDate).toISOString().split("T")[0] : ""
  );
  const [productSource, setProductSource] = useState(editingBanner?.productSource || "manual");
  const [selectedProducts, setSelectedProducts] = useState<number[]>(
    editingBanner?.selectedProducts || []
  );
  const [selectedCategory, setSelectedCategory] = useState<number | null>(editingBanner?.selectedCategoryId || null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(editingBanner?.selectedSubcategory || null);
  const [selectedDeal, setSelectedDeal] = useState<number | null>(editingBanner?.selectedDeal || null);
  const [externalLink, setExternalLink] = useState(editingBanner?.externalLink || "");
  const [desktopImages, setDesktopImages] = useState<File | null>(null);
  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [desktopImagePreviews, setDesktopImagePreviews] = useState<string[]>(editingBanner?.desktopImage ? [editingBanner.desktopImage] : []);
  const [mobileImagePreview, setMobileImagePreview] = useState<string | null>(editingBanner?.mobileImage || null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setFetching(true);
      try {
        const [fetchedCategories, fetchedDeals] = await Promise.all([categoryAPI.getCategories(), dealAPI.getDeals()]);
        setCategories(fetchedCategories);
        setDeals(fetchedDeals);

        // Fetch products if editing a banner
        if (editingBanner) {
          if (editingBanner.productSource === "manual" && editingBanner.selectedProducts?.length) {
            const fetchedProducts = await categoryAPI.getProducts(
              editingBanner.selectedCategoryId,
              editingBanner.selectedSubcategory
            );
            setProducts(fetchedProducts);
          } else if (editingBanner.productSource === "category" && editingBanner.selectedCategoryId) {
            const fetchedProducts = await categoryAPI.getProducts(editingBanner.selectedCategoryId);
            setProducts(fetchedProducts);
          } else if (editingBanner.productSource === "subcategory" && editingBanner.selectedCategoryId && editingBanner.selectedSubcategory) {
            const fetchedProducts = await categoryAPI.getProducts(editingBanner.selectedCategoryId, editingBanner.selectedSubcategory);
            setProducts(fetchedProducts);
          } else if (editingBanner.productSource === "deal" && editingBanner.selectedDeal) {
            const fetchedProducts = await categoryAPI.getProducts(undefined, undefined, editingBanner.selectedDeal);
            setProducts(fetchedProducts);
          }
        }
      } catch (error) {
        onError(error instanceof Error ? error.message : "Failed to fetch initial data");
      } finally {
        setFetching(false);
      }
    };
    fetchInitialData();
  }, [categoryAPI, dealAPI, onError, editingBanner]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let fetchedProducts: Product[] = [];
        if (productSource === "manual" && selectedCategory && selectedSubcategory) {
          fetchedProducts = await categoryAPI.getProducts(selectedCategory, selectedSubcategory);
        } else if (productSource === "category" && selectedCategory) {
          fetchedProducts = await categoryAPI.getProducts(selectedCategory);
        } else if (productSource === "subcategory" && selectedCategory && selectedSubcategory) {
          fetchedProducts = await categoryAPI.getProducts(selectedCategory, selectedSubcategory);
        } else if (productSource === "deal" && selectedDeal) {
          fetchedProducts = await categoryAPI.getProducts(undefined, undefined, selectedDeal);
        }
        setProducts(fetchedProducts);
      } catch (error) {
        onError(error instanceof Error ? error.message : "Failed to fetch products");
      }
    };
    if (productSource !== "external") {
      fetchProducts();
    }
  }, [productSource, selectedCategory, selectedSubcategory, selectedDeal, categoryAPI, onError]);

  const steps = [
    {
      title: "Basic Banner Info",
      content: (
        <>
          <div className="create-banner__field">
            <label className="create-banner__label">Banner Name *</label>
            <input
              type="text"
              className="create-banner__input"
              placeholder="Enter banner name"
              value={bannerName}
              onChange={(e) => setBannerName(e.target.value)}
              disabled={loading || fetching}
            />
          </div>
          <div className="create-banner__field">
            <label className="create-banner__label">Banner Type</label>
            <div className="create-banner__radio-group">
              {["Hero Banner", "Sidebar Banner", "Product Banner", "Special Deals Banner"].map((type) => (
                <label key={type} className="create-banner__radio-label">
                  <input
                    type="radio"
                    name="bannerType"
                    value={type}
                    checked={bannerType === type}
                    onChange={() => setBannerType(type)}
                    className="create-banner__radio"
                    disabled={loading || fetching}
                  />
                  <span className="create-banner__radio-custom"></span>
                  {type}
                </label>
              ))}
            </div>
            {bannerType === "Special Deals Banner" && <p className="create-banner__note">Must upload 1 banner.</p>}
          </div>
          <div className="create-banner__field">
            <label className="create-banner__label">Start Date *</label>
            <input
              type="date"
              className="create-banner__input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading || fetching}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="create-banner__field">
            <label className="create-banner__label">End Date</label>
            <input
              type="date"
              className="create-banner__input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading || fetching}
              min={startDate}
            />
          </div>
        </>
      ),
    },
    {
      title: "Product Source Selection",
      content: (
        <>
          <div className="create-banner__field">
            <label className="create-banner__label">Select Product Source</label>
            <select
              className="create-banner__input"
              value={productSource}
              onChange={(e) => {
                setProductSource(e.target.value);
                setSelectedProducts([]);
                setSelectedCategory(null);
                setSelectedSubcategory(null);
                setSelectedDeal(null);
                setExternalLink("");
                setProducts([]);
              }}
              disabled={loading || fetching}
            >
              <option value="manual">Insert Products Manually</option>
              <option value="category">Select Category</option>
              <option value="subcategory">Select Subcategory</option>
              <option value="deal">Select Deal</option>
              <option value="external">External Link</option>
            </select>
          </div>
          <div className="create-banner__dynamic-section">
            {productSource === "manual" && (
              <>
                <div className="create-banner__field">
                  <label className="create-banner__label">Choose Category</label>
                  <select
                    className="create-banner__input"
                    onChange={(e) => {
                      const categoryId = parseInt(e.target.value) || null;
                      setSelectedCategory(categoryId);
                      setSelectedSubcategory(null);
                      setSelectedProducts([]);
                      setProducts([]);
                    }}
                    value={selectedCategory ?? ""}
                    disabled={loading || fetching}
                  >
                    <option value="">--Select Category--</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCategory && (
                  <div className="create-banner__field">
                    <label className="create-banner__label">Choose Subcategory</label>
                    <select
                      className="create-banner__input"
                      onChange={(e) => {
                        const subcategoryId = parseInt(e.target.value) || null;
                        setSelectedSubcategory(subcategoryId);
                        setSelectedProducts([]);
                        setProducts([]);
                      }}
                      value={selectedSubcategory ?? ""}
                      disabled={loading || fetching}
                    >
                      <option value="">--Select Subcategory--</option>
                      {categories.find((cat) => cat.id === selectedCategory)?.subcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedCategory && selectedSubcategory && (
                  <div className="create-banner__field">
                    <label className="create-banner__label">Select Products</label>
                    <div className="create-banner__product-list">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className={`create-banner__product-item ${
                            selectedProducts.includes(product.id) ? "create-banner__product-item--selected" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, product.id]);
                              } else {
                                setSelectedProducts(selectedProducts.filter((id) => id !== product.id));
                              }
                            }}
                            disabled={loading || fetching}
                          />
                          <img src={product.productImages[0] || "path/to/placeholder.jpg"} alt={product.name} />
                          {product.name}
                        </div>
                      ))}
                    </div>
                    {selectedProducts.length === 0 && <p className="create-banner__error">At least 1 product must be selected.</p>}
                  </div>
                )}
              </>
            )}
            {productSource === "category" && (
              <div className="create-banner__field">
                <label className="create-banner__label">Choose Category</label>
                <select
                  className="create-banner__input"
                  onChange={(e) => {
                    const categoryId = parseInt(e.target.value) || null;
                    setSelectedCategory(categoryId);
                    setProducts([]);
                  }}
                  value={selectedCategory ?? ""}
                  disabled={loading || fetching}
                >
                  <option value="">--Select Category--</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {productSource === "subcategory" && (
              <>
                <div className="create-banner__field">
                  <label className="create-banner__label">Choose Category</label>
                  <select
                    className="create-banner__input"
                    onChange={(e) => {
                      const categoryId = parseInt(e.target.value) || null;
                      setSelectedCategory(categoryId);
                      setSelectedSubcategory(null);
                      setProducts([]);
                    }}
                    value={selectedCategory ?? ""}
                    disabled={loading || fetching}
                  >
                    <option value="">--Select Category--</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCategory && (
                  <div className="create-banner__field">
                    <label className="create-banner__label">Choose Subcategory</label>
                    <select
                      className="create-banner__input"
                      onChange={(e) => {
                        const subcategoryId = parseInt(e.target.value) || null;
                        setSelectedSubcategory(subcategoryId);
                        setProducts([]);
                      }}
                      value={selectedSubcategory ?? ""}
                      disabled={loading || fetching}
                    >
                      <option value="">--Select Subcategory--</option>
                      {categories.find((cat) => cat.id === selectedCategory)?.subcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
            {productSource === "deal" && (
              <div className="create-banner__field">
                <label className="create-banner__label">Choose Deal</label>
                <select
                  className="create-banner__input"
                  onChange={(e) => {
                    const dealId = parseInt(e.target.value) || null;
                    setSelectedDeal(dealId);
                    setProducts([]);
                  }}
                  value={selectedDeal ?? ""}
                  disabled={loading || fetching}
                >
                  <option value="">--Select Deal--</option>
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {productSource === "external" && (
              <div className="create-banner__field">
                <label className="create-banner__label">External Link</label>
                <input
                  type="url"
                  className="create-banner__input"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://example.com"
                  disabled={loading || fetching}
                />
              </div>
            )}
          </div>
        </>
      ),
    },
    {
      title: "Banner Image Upload",
      content: (
        <>
          {bannerType === "Special Deals Banner" ? (
            <div className="create-banner__field">
              <label className="create-banner__label">Desktop Image</label>
              <div className="create-banner__image-upload">
                {desktopImagePreviews[0] ? (
                  <div className="create-banner__image-preview">
                    <img src={desktopImagePreviews[0]} alt="Desktop banner preview" />
                    <button
                      className="create-banner__image-remove"
                      onClick={() => {
                        setDesktopImages(null);
                        setDesktopImagePreviews([]);
                      }}
                      disabled={loading || fetching}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="create-banner__upload-area">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDesktopImages(file);
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setDesktopImagePreviews([e.target?.result as string]);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="create-banner__file-input"
                      id="desktop-banner-image"
                      disabled={loading || fetching}
                    />
                    <label htmlFor="desktop-banner-image" className="create-banner__upload-button">
                      Upload Desktop Image
                    </label>
                  </div>
                )}
              </div>
              <p className="create-banner__note">
                Note: Ensure 1 banner is uploaded for Special Deals.
              </p>
            </div>
          ) : (
            <>
              <div className="create-banner__field">
                <label className="create-banner__label">Desktop Image</label>
                <div className="create-banner__image-upload">
                  {desktopImagePreviews[0] ? (
                    <div className="create-banner__image-preview">
                      <img src={desktopImagePreviews[0]} alt="Desktop banner preview" />
                      <button
                        className="create-banner__image-remove"
                        onClick={() => {
                          setDesktopImages(null);
                          setDesktopImagePreviews([]);
                        }}
                        disabled={loading || fetching}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="create-banner__upload-area">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setDesktopImages(file);
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setDesktopImagePreviews([e.target?.result as string]);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="create-banner__file-input"
                        id="desktop-banner-image"
                        disabled={loading || fetching}
                      />
                      <label htmlFor="desktop-banner-image" className="create-banner__upload-button">
                        Upload Desktop Image
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="create-banner__field">
                <label className="create-banner__label">Mobile Image</label>
                <div className="create-banner__image-upload">
                  {mobileImagePreview ? (
                    <div className="create-banner__image-preview">
                      <img src={mobileImagePreview} alt="Mobile banner preview" />
                      <button
                        className="create-banner__image-remove"
                        onClick={() => {
                          setMobileImage(null);
                          setMobileImagePreview(null);
                        }}
                        disabled={loading || fetching}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="create-banner__upload-area">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setMobileImage(file);
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setMobileImagePreview(e.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="create-banner__file-input"
                        id="mobile-banner-image"
                        disabled={loading || fetching}
                      />
                      <label htmlFor="mobile-banner-image" className="create-banner__upload-button">
                        Upload Mobile Image
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      ),
    },
  ];

  const handleSubmit = async () => {
    if (!bannerName.trim()) {
      onError("Banner name is required");
      return;
    }
    if (new Date(startDate) < new Date()) {
      onError("Start date must be >= today");
      return;
    }
    if (endDate && new Date(endDate) < new Date(startDate)) {
      onError("End date must be >= start date");
      return;
    }
    if (productSource === "manual" && selectedProducts.length === 0) {
      onError("At least 1 product must be selected");
      return;
    }
    if (productSource === "category" && !selectedCategory) {
      onError("Category must be selected");
      return;
    }
    if (productSource === "subcategory" && (!selectedCategory || !selectedSubcategory)) {
      onError("Category and subcategory must be selected");
      return;
    }
    if (productSource === "deal" && !selectedDeal) {
      onError("Deal must be selected");
      return;
    }
    if (productSource === "external" && !externalLink) {
      onError("External link is required");
      return;
    }
    if (!desktopImages && !editingBanner?.desktopImage) {
      onError("Desktop image is required");
      return;
    }
    if (bannerType !== "Special Deals Banner" && !mobileImage && !editingBanner?.mobileImage) {
      onError("Mobile image is required");
      return;
    }

    setLoading(true);
    try {
      // Construct JSON payload
      const bannerData: Record<string, any> = {
        name: bannerName.trim(),
        type: mapDisplayTypeToApi(bannerType),
        startDate: new Date(startDate).toISOString(),
      };

      if (endDate) {
        bannerData.endDate = new Date(endDate).toISOString();
      }

      bannerData.productSource = productSource;

      if (productSource === "manual") {
        bannerData.selectedProducts = selectedProducts;
        bannerData.selectedCategoryId = selectedCategory;
        bannerData.selectedSubcategoryId = selectedSubcategory;
      }
      if (productSource === "category") {
        bannerData.selectedCategoryId = selectedCategory;
      }
      if (productSource === "subcategory") {
        bannerData.selectedCategoryId = selectedCategory;
        bannerData.selectedSubcategoryId = selectedSubcategory;
      }
      if (productSource === "deal") {
        bannerData.selectedDeal = selectedDeal;
      }
      if (productSource === "external") {
        bannerData.externalLink = externalLink;
      }

      // Upload images and get URLs
      if (desktopImages) {
        const desktopImageUrl = await imageAPI.uploadImage(desktopImages);
        bannerData.desktopImage = desktopImageUrl;
      } else if (editingBanner?.desktopImage) {
        bannerData.desktopImage = editingBanner.desktopImage;
      }

      if (mobileImage && bannerType !== "Special Deals Banner") {
        const mobileImageUrl = await imageAPI.uploadImage(mobileImage);
        bannerData.mobileImage = mobileImageUrl;
      } else if (editingBanner?.mobileImage && bannerType !== "Special Deals Banner") {
        bannerData.mobileImage = editingBanner.mobileImage;
      }

      // Log the payload for debugging
      console.log("Banner payload:", bannerData);

      let savedBanner: Banner;
      if (editingBanner) {
        savedBanner = await bannerAPI.update(editingBanner.id, bannerData);
      } else {
        savedBanner = await bannerAPI.create(bannerData);
      }

      onSave(savedBanner);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-banner">
      <div className="create-banner__header">
        <h2 className="create-banner__title">{editingBanner ? "Edit Banner" : "Create New Banner"}</h2>
        <button className="create-banner__close" onClick={onClose} disabled={loading || fetching}>
          <X size={18} />
        </button>
      </div>

      <div className="create-banner__form">
        <div className="create-banner__step-indicators">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`create-banner__step-indicator ${currentStep === index ? "create-banner__step-indicator--active" : ""}`}
              onClick={() => setCurrentStep(index)}
            >
              Step {index + 1}: {step.title}
            </div>
          ))}
        </div>

        <div className="create-banner__step-content">{steps[currentStep].content}</div>

        <div className="create-banner__actions">
          <button className="create-banner__button create-banner__button--cancel" onClick={onClose} disabled={loading || fetching}>
            Cancel
          </button>
          {currentStep > 0 && (
            <button
              className="create-banner__button create-banner__button--prev"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={loading || fetching}
            >
              Previous
            </button>
          )}
          {currentStep < steps.length - 1 ? (
            <button
              className="create-banner__button create-banner__button--next"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={loading || fetching}
            >
              Next
            </button>
          ) : (
            <button className="create-banner__button create-banner__button--create" onClick={handleSubmit} disabled={loading || fetching}>
              {loading ? "Saving..." : editingBanner ? "Update Banner" : "Create Banner"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBannerWithTabs;