import type React from "react";
import { useState, useEffect } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import { Eye, Edit, X, ChevronLeft, ChevronRight, Monitor, Smartphone } from "lucide-react";
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
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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

  async create(bannerData: FormData): Promise<Banner> {
    try {
      const headers: Record<string, string> = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/banners`, {
        method: "POST",
        headers,
        body: bannerData,
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

  async update(id: number, bannerData: FormData): Promise<Banner> {
    try {
      const headers: Record<string, string> = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
        method: "PATCH",
        headers,
        body: bannerData,
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
  const [bannerToDelete, setBannerToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [banners, setBanners] = useState<TransformedBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<TransformedBanner | null>(
    null
  );
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Banner | "createdBy";
    direction: "asc" | "desc";
  } | null>(null);
  const PAGE_SIZE = 7;

  const tabs = ["All Banners", "Active", "Scheduled", "Expired", "Drafts"];

  const bannerAPI = createBannerAPI(token);

  useEffect(() => {
    if (isAuthenticated) {
      // Try to load from cache first
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
        ? `${new Date(banner.startDate).toLocaleDateString()}-${new Date(
            banner.endDate
          ).toLocaleDateString()}`
        : banner.startDate
        ? `From ${new Date(banner.startDate).toLocaleDateString()}`
        : "Not scheduled",
    color: banner.color || getDefaultColor(mapApiTypeToDisplay(banner.type)),
    createdBy: banner.createdBy ? banner.createdBy.username : "System",
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
      setError(
        error instanceof Error ? error.message : "Failed to load banners"
      );
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
      case "Popup Banner":
        return "POPUP";
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
      case "Popup Banner":
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
      const transformedBanner = transformBanner(banner);
      setEditingBanner(transformedBanner);
      setShowCreateForm(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load banner for editing"
      );
    }
  };

  const handleViewImage = (imageUrl: string | undefined, imageType: 'desktop' | 'mobile') => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setShowImageModal(true);
    }
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
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
        setError(
          error instanceof Error ? error.message : "Failed to delete banner"
        );
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
      setBanners(
        banners.map((banner) =>
          banner.id === transformedBanner.id ? transformedBanner : banner
        )
      );
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
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedAndFilteredBanners = () => {
    let filtered = [...banners];

    // Filter by tab
    if (activeTab !== "All Banners") {
      const statusFilter = activeTab === "Drafts" ? "Draft" : activeTab;
      filtered = filtered.filter(
        (banner) => banner.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by search query
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

    // Apply sorting
    if (sortConfig) {
      filtered = filtered.sort((a, b) => {
        const aValue =
          sortConfig.key === "createdBy" ? a.createdBy : a[sortConfig.key];
        const bValue =
          sortConfig.key === "createdBy" ? b.createdBy : b[sortConfig.key];

        if (sortConfig.key === "id") {
          return sortConfig.direction === "asc"
            ? Number(aValue) - Number(bValue)
            : Number(bValue) - Number(aValue);
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
  const paginatedBanners = filteredBanners.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (!isAuthenticated) {
    return (
      <div className="admin-banner" style={{ display: "flex" }}>
        <AdminSidebar />
        <div className="admin-banner__content">
          <div className="admin-banner__error">
            Please log in to access banner management.
          </div>
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
              <p className="admin-banner__description">
                Create and manage promotional banners
              </p>
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
                {[...Array(5)].map((_, index) => (
                  <SkeletonRow key={index} />
                ))}
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
        <Header onSearch={() => {}} showSearch={false} />
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
                <p className="admin-banner__description">
                  Create and manage promotional banners
                </p>
              </div>
              <button
                className="admin-banner__create-button"
                onClick={handleCreateBanner}
              >
                <span className="admin-banner__create-icon">+</span> Create New
                Banner
              </button>
            </div>

            <div className="admin-banner__tabs">
              {tabs.map((tab) => (
                <div
                  key={tab}
                  className={`admin-banner__tab ${
                    activeTab === tab ? "admin-banner__tab--active" : ""
                  }`}
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
                      ID{" "}
                      {sortConfig?.key === "id" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("name")} className="sortable">
                      Banner Name{" "}
                      {sortConfig?.key === "name" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("type")} className="sortable">
                      Type{" "}
                      {sortConfig?.key === "type" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="sortable"
                    >
                      Status{" "}
                      {sortConfig?.key === "status" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("dateRange")}
                      className="sortable"
                    >
                      Date Range{" "}
                      {sortConfig?.key === "dateRange" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("createdBy")}
                      className="sortable"
                    >
                      Created By{" "
                      }
                      {sortConfig?.key === "createdBy" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(PAGE_SIZE)].map((_, index) => (
                      <SkeletonRow key={index} />
                    ))
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
                          <span
                            className={`admin-banner__status ${getStatusClass(
                              banner.status
                            )}`}
                          >
                            {banner.status}
                          </span>
                        </td>
                        <td>{banner.dateRange}</td>
                        <td>{banner.createdBy}</td>
                        <td>
                          <div className="admin-banner__actions">
                            <button
                              className="admin-banner__action-button admin-banner__action-button--view"
                              onClick={() => handleViewImage(banner.desktopImage, 'desktop')}
                              title="View desktop banner image"
                              disabled={!banner.desktopImage}
                            >
                              <Monitor size={18} />
                            </button>
                            <button
                              className="admin-banner__action-button admin-banner__action-button--view"
                              onClick={() => handleViewImage(banner.mobileImage, 'mobile')}
                              title="View mobile banner image"
                              disabled={!banner.mobileImage}
                            >
                              <Smartphone size={18} />
                            </button>
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
                className="admin-banner__pagination-button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`admin-banner__pagination-number ${
                    currentPage === i + 1
                      ? "admin-banner__pagination-number--active"
                      : ""
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="admin-banner__pagination-button"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
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
          />
        )}

        {showDeleteModal && bannerToDelete && (
          <DeleteModal
            show={showDeleteModal}
            onClose={handleDeleteCancel}
            onDelete={handleDeleteConfirm}
            productName={bannerToDelete.name}
          />
        )}

        {showImageModal && selectedImage && (
          <div className="image-modal">
            <div className="image-modal__content">
              <button
                className="image-modal__close"
                onClick={handleCloseImageModal}
              >
                <X size={24} />
              </button>
              <img
                src={selectedImage}
                alt="Banner preview"
                className="image-modal__image"
              />
            </div>
          </div>
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
}

const CreateBannerForm: React.FC<CreateBannerFormProps> = ({
  onClose,
  onSave,
  editingBanner,
  onError,
  mapDisplayStatusToApi,
  mapDisplayTypeToApi,
  bannerAPI,
}) => {
  const [bannerName, setBannerName] = useState(editingBanner?.name || "");
  const [bannerType, setBannerType] = useState(
    editingBanner?.type || "Hero Banner"
  );
  const [status, setStatus] = useState(editingBanner?.status || "Active");
  const [startDate, setStartDate] = useState(
    editingBanner?.startDate
      ? new Date(editingBanner.startDate).toISOString().split("T")[0]
      : ""
  );
  const [endDate, setEndDate] = useState(
    editingBanner?.endDate
      ? new Date(editingBanner.endDate).toISOString().split("T")[0]
      : ""
  );
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [desktopImage, setDesktopImage] = useState<File | null>(null);
  const [desktopImagePreview, setDesktopImagePreview] = useState<string | null>(
    editingBanner?.desktopImage || null
  );
  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [mobileImagePreview, setMobileImagePreview] = useState<string | null>(
    editingBanner?.mobileImage || null
  );
  const [loading, setLoading] = useState(false);

  const handleDesktopImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesktopImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setDesktopImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMobileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMobileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMobileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!bannerName.trim()) {
      onError("Banner name is required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", bannerName.trim());
      formData.append("type", mapDisplayTypeToApi(bannerType));
      formData.append("status", mapDisplayStatusToApi(status));

      if (startDate) {
        formData.append("startDate", new Date(startDate).toISOString());
      }
      if (endDate) {
        formData.append("endDate", new Date(endDate).toISOString());
      }
      if (desktopImage) {
        formData.append("desktopImage", desktopImage);
      }
      if (mobileImage) {
        formData.append("mobileImage", mobileImage);
      }

      let savedBanner: Banner;
      if (editingBanner) {
        savedBanner = await bannerAPI.update(editingBanner.id, formData);
      } else {
        savedBanner = await bannerAPI.create(formData);
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
        <h2 className="create-banner__title">
          {editingBanner ? "Edit Banner" : "Create New Banner"}
        </h2>
        <button
          className="create-banner__close"
          onClick={onClose}
          disabled={loading}
        >
          <X size={18} />
        </button>
      </div>

      <div className="create-banner__form">
        <div className="create-banner__section">
          <h3 className="create-banner__section-title">Basic Information</h3>

          <div className="create-banner__field">
            <label className="create-banner__label">Banner Name *</label>
            <input
              type="text"
              className="create-banner__input"
              placeholder="Enter banner name (e.g. Summer Sale 2023)"
              value={bannerName}
              onChange={(e) => setBannerName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="create-banner__field">
            <label className="create-banner__label">Banner Type</label>
            <div className="create-banner__radio-group">
              <label className="create-banner__radio-label">
                <input
                  type="radio"
                  name="bannerType"
                  value="Hero Banner"
                  checked={bannerType === "Hero Banner"}
                  onChange={() => setBannerType("Hero Banner")}
                  className="create-banner__radio"
                  disabled={loading}
                />
                <span className="create-banner__radio-custom"></span>
                Hero Banner
              </label>
              <label className="create-banner__radio-label">
                <input
                  type="radio"
                  name="bannerType"
                  value="Sidebar Banner"
                  checked={bannerType === "Sidebar Banner"}
                  onChange={() => setBannerType("Sidebar Banner")}
                  className="create-banner__radio"
                  disabled={loading}
                />
                <span className="create-banner__radio-custom"></span>
                Sidebar Banner
              </label>
              <label className="create-banner__radio-label">
                <input
                  type="radio"
                  name="bannerType"
                  value="Product Banner"
                  checked={bannerType === "Product Banner"}
                  onChange={() => setBannerType("Product Banner")}
                  className="create-banner__radio"
                  disabled={loading}
                />
                <span className="create-banner__radio-custom"></span>
                Product Banner
              </label>
              <label className="create-banner__radio-label">
                <input
                  type="radio"
                  name="bannerType"
                  value="Special Deals Banner"
                  checked={bannerType === "Special Deals Banner"}
                  onChange={() => setBannerType("Special Deals Banner")}
                  className="create-banner__radio"
                  disabled={loading}
                />
                <span className="create-banner__radio-custom"></span>
                Special Deals Banner
              </label>
            </div>
          </div>

          <div className="create-banner__field">
            <label className="create-banner__label">Status</label>
            <div className="create-banner__dropdown">
              <button
                className="create-banner__dropdown-button"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={loading}
              >
                {status}
                <ChevronRight
                  size={16}
                  className="create-banner__dropdown-icon"
                />
              </button>
              {showStatusDropdown && (
                <div className="create-banner__dropdown-menu">
                  {["Active", "Scheduled"].map((statusOption) => (
                    <div
                      key={statusOption}
                      className="create-banner__dropdown-item"
                      onClick={() => {
                        setStatus(statusOption);
                        setShowStatusDropdown(false);
                      }}
                    >
                      {statusOption}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="create-banner__field">
            <label className="create-banner__label">Start Date</label>
            <input
              type="date"
              className="create-banner__input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="create-banner__field">
            <label className="create-banner__label">End Date</label>
            <input
              type="date"
              className="create-banner__input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="create-banner__section">
          <h3 className="create-banner__section-title">Banner Content</h3>

          <div className="create-banner__field">
            <label className="create-banner__label">Desktop Image </label>
            <div className="create-banner__image-upload">
              {desktopImagePreview ? (
                <div className="create-banner__image-preview">
                  <img src={desktopImagePreview} alt="Desktop banner preview" />
                  <button
                    className="create-banner__image-remove"
                    onClick={() => {
                      setDesktopImage(null);
                      setDesktopImagePreview(null);
                    }}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="create-banner__upload-area">
                  <div className="create-banner__upload-icon">
                    <img
                      src="/placeholder.svg?height=24&width=24"
                      alt="Upload"
                    />
                  </div>
                  <p className="create-banner__upload-text">
                    Drag and drop your desktop image here, or click to browse
                  </p>
                  <p className="create-banner__upload-hint">
                    Recommended size: 1200 × 400 pixels (3:1 ratio)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDesktopImageUpload}
                    className="create-banner__file-input"
                    id="desktop-banner-image"
                    disabled={loading}
                  />
                  <label
                    htmlFor="desktop-banner-image"
                    className="create-banner__upload-button"
                  >
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
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="create-banner__upload-area">
                  <div className="create-banner__upload-icon">
                    <img
                      src="/placeholder.svg?height=24&width=24"
                      alt="Upload"
                    />
                  </div>
                  <p className="create-banner__upload-text">
                    Drag and drop your mobile image here, or click to browse
                  </p>
                  <p className="create-banner__upload-hint">
                    Recommended size: 600 × 800 pixels (3:4 ratio)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMobileImageUpload}
                    className="create-banner__file-input"
                    id="mobile-banner-image"
                    disabled={loading}
                  />
                  <label
                    htmlFor="mobile-banner-image"
                    className="create-banner__upload-button"
                  >
                    Upload Mobile Image
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="create-banner__actions">
          <button
            className="create-banner__button create-banner__button--cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="create-banner__button create-banner__button--create"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : editingBanner
              ? "Update Banner"
              : "Create Banner"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBannerWithTabs;