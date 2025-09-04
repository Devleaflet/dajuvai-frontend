import React, { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import Pagination from "../Components/Pagination";
import VendorEditModal from "../Components/Modal/VendorEditModal";
import AddVendorModal from "../Components/Modal/AddVendorModal";
import VendorViewModal from "../Components/Modal/VendorViewModal";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { VendorAuthService } from "../services/vendorAuthService";
import { Vendor, District, ApiResponse, VendorSignupRequest, VendorUpdateRequest } from "../Components/Types/vendor";
import "../Styles/AdminVendor.css";
import "../Styles/AdminCustomers.css";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const SkeletonRow: React.FC = () => {
  return (
    <tr>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
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
        taxNumber: vendor.taxNumber || "N/A",
        taxDocuments: Array.isArray(vendor.taxDocuments) ? vendor.taxDocuments : vendor.taxDocuments ? [vendor.taxDocuments] : null,
        businessRegNumber: vendor.businessRegNumber || "N/A",
        citizenshipDocuments: Array.isArray(vendor.citizenshipDocuments) ? vendor.citizenshipDocuments : vendor.citizenshipDocuments ? [vendor.citizenshipDocuments] : null,
        chequePhoto: Array.isArray(vendor.chequePhoto) ? vendor.chequePhoto : vendor.chequePhoto ? [vendor.chequePhoto] : null,
        accountName: vendor.accountName || "N/A",
        bankName: vendor.bankName || "N/A",
        accountNumber: vendor.accountNumber || "N/A",
        bankBranch: vendor.bankBranch || "N/A",
        bankCode: vendor.bankCode || "N/A",
        businessAddress: vendor.businessAddress || "N/A",
        profilePicture: vendor.profilePicture || "N/A",
      }));
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

      const response = await fetch(`${API_BASE_URL}/api/vendors/unapprove/list`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<Vendor[]> = await response.json();
      return (result.data || []).map((vendor) => ({
        ...vendor,
        status: "Inactive",
        taxNumber: vendor.taxNumber || "N/A",
        taxDocuments: Array.isArray(vendor.taxDocuments) ? vendor.taxDocuments : vendor.taxDocuments ? [vendor.taxDocuments] : null,
        businessRegNumber: vendor.businessRegNumber || "N/A",
        citizenshipDocuments: Array.isArray(vendor.citizenshipDocuments) ? vendor.citizenshipDocuments : vendor.citizenshipDocuments ? [vendor.citizenshipDocuments] : null,
        chequePhoto: Array.isArray(vendor.chequePhoto) ? vendor.chequePhoto : vendor.chequePhoto ? [vendor.chequePhoto] : null,
        accountName: vendor.accountName || "N/A",
        bankName: vendor.bankName || "N/A",
        accountNumber: vendor.accountNumber || "N/A",
        bankBranch: vendor.bankBranch || "N/A",
        bankCode: vendor.bankCode || "N/A",
        businessAddress: vendor.businessAddress || "N/A",
        profilePicture: vendor.profilePicture || "N/A",
      }));
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

      const response = await fetch(`${API_BASE_URL}/api/vendors/approve/${id}`, {
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

      if (response.status !== 204) {
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "Failed to approve vendor");
        }
      }
    } catch (error) {
      console.error("Error approving vendor:", error);
      throw error;
    }
  },

async create(vendorData: VendorSignupRequest): Promise<Vendor> {
  try {
    if (!token) {
      throw new Error("No token provided. Please log in.");
    }

    console.log("Creating vendor with data:", vendorData);

    const response = await VendorAuthService.signup(
      {
        businessName: vendorData.businessName,
        email: vendorData.email,
        phoneNumber: vendorData.phoneNumber,
        password: vendorData.password,
        district: vendorData.district, // Changed from districtId to district
        taxNumber: vendorData.taxNumber,
        taxDocuments: vendorData.taxDocuments,
        businessRegNumber: vendorData.businessRegNumber,
        citizenshipDocuments: vendorData.citizenshipDocuments,
        chequePhoto: vendorData.chequePhoto, // This is now a string, not an array
        bankDetails: vendorData.bankDetails,
        
        profilePicture: vendorData.profilePicture,
      },
      token
    );
    
    if (!response.success || !response.vendor) {
      if (response.errors?.some((err) => err.message.includes("email already exists"))) {
        throw new Error("A vendor with this email already exists");
      }
      throw new Error(response.message || "Failed to create vendor");
    }
    
    return {
      ...response.vendor,
      phoneNumber: response.vendor.phoneNumber || "N/A",
      taxNumber: response.vendor.taxNumber || "N/A",
      taxDocuments: Array.isArray(response.vendor.taxDocuments) ? response.vendor.taxDocuments : response.vendor.taxDocuments ? [response.vendor.taxDocuments] : null,
      businessRegNumber: response.vendor.businessRegNumber || "N/A",
      citizenshipDocuments: Array.isArray(response.vendor.citizenshipDocuments) ? response.vendor.citizenshipDocuments : response.vendor.citizenshipDocuments ? [response.vendor.citizenshipDocuments] : null,
    
      chequePhoto: response.vendor.chequePhoto,
      accountName: response.vendor.accountName || "N/A",
      bankName: response.vendor.bankName || "N/A",
      accountNumber: response.vendor.accountNumber || "N/A",
      bankBranch: response.vendor.bankBranch || "N/A",
      bankCode: response.vendor.bankCode || "N/A",
      businessAddress: response.vendor.businessAddress || "N/A",
      profilePicture: response.vendor.profilePicture || "N/A",
      isVerified: !!response.vendor.isVerified,
      status: response.vendor.isVerified ? "Active" : "Inactive",
    };
  } catch (error) {
    console.error("Error creating vendor:", error);
    throw error;
  }
},

  async update(id: number, vendorData: VendorUpdateRequest): Promise<Vendor> {
    try {
      if (!token) {
        throw new Error("No token provided. Please log in.");
      }
      const response = await VendorAuthService.updateVendor(
        id,
        {
          id,
          businessName: vendorData.businessName,
          email: vendorData.email,
          phoneNumber: vendorData.phoneNumber,
          district: vendorData.district,
          taxNumber: vendorData.taxNumber,
          taxDocuments: vendorData.taxDocuments,
          businessRegNumber: vendorData.businessRegNumber,
          citizenshipDocuments: vendorData.citizenshipDocuments,
          chequePhoto: vendorData.chequePhoto,
          bankDetails: vendorData.bankDetails,
          isVerified: vendorData.isVerified,
          businessAddress: vendorData.businessAddress,
          profilePicture: vendorData.profilePicture,
        },
        token
      );

      if (!response.success || !response.vendor) {
        if (response.errors?.some((err) => err.message.includes("email already exists"))) {
          throw new Error("A vendor with this email already exists");
        }
        throw new Error(response.message || "Failed to update vendor");
      }

      return {
        ...response.vendor,
        phoneNumber: response.vendor.phoneNumber || "N/A",
        taxNumber: response.vendor.taxNumber || "N/A",
        taxDocuments: Array.isArray(response.vendor.taxDocuments) ? response.vendor.taxDocuments : response.vendor.taxDocuments ? [response.vendor.taxDocuments] : null,
        businessRegNumber: response.vendor.businessRegNumber || "N/A",
        citizenshipDocuments: Array.isArray(response.vendor.citizenshipDocuments) ? response.vendor.citizenshipDocuments : response.vendor.citizenshipDocuments ? [response.vendor.citizenshipDocuments] : null,
        chequePhoto: Array.isArray(response.vendor.chequePhoto) ? response.vendor.chequePhoto : response.vendor.chequePhoto ? [response.vendor.chequePhoto] : null,
        accountName: response.vendor.accountName || "N/A",
        bankName: response.vendor.bankName || "N/A",
        accountNumber: response.vendor.accountNumber || "N/A",
        bankBranch: response.vendor.bankBranch || "N/A",
        bankCode: response.vendor.bankCode || "N/A",
        businessAddress: response.vendor.businessAddress || "N/A",
        profilePicture: response.vendor.profilePicture || "N/A",
        isVerified: !!response.vendor.isVerified,
        status: response.vendor.isVerified ? "Active" : "Inactive",
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Vendor; direction: "asc" | "desc" } | null>(null);
  const [unapprovedCount, setUnapprovedCount] = useState(0);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const vendorAPI = createVendorAPI(token);

  const CACHE_KEY = "admin_vendors";
  const CACHE_TTL = 10 * 60 * 1000;

  const fetchDistricts = useCallback(async () => {
    try {
      if (!token) {
        throw new Error("No token provided. Please log in.");
      }
      const response = await fetch(`${API_BASE_URL}/api/district`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<District[]> = await response.json();
      
      if (!result.data || result.data.length === 0) {
        setError("No districts available. Please contact support.");
        toast.error("No districts available. Please contact support.");
        return;
      }
      
      setDistricts(result.data || []);
    } catch (error) {
      setError("Failed to load districts");
      toast.error("Failed to load districts");
    }
  }, [token]);

  const loadUnapprovedCount = useCallback(async () => {
    try {
      const unapproved = await vendorAPI.getUnapproved();
      setUnapprovedCount(unapproved.length);
    } catch (err) {
      console.error("Failed to load unapproved count");
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Array.isArray(data) && Date.now() - timestamp < CACHE_TTL) {
            setVendors(data);
            setFilteredVendors(data);
            setLoading(false);
          }
        } catch {}
      }
      loadVendors();
      fetchDistricts();
      loadUnapprovedCount();
    } else {
      setLoading(false);
      setError("Please log in to access vendor management.");
    }
  }, [isAuthenticated, token, fetchDistricts]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedVendors = await vendorAPI.getAll();
      setVendors(fetchedVendors);
      setFilteredVendors(fetchedVendors);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: fetchedVendors, timestamp: Date.now() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendors");
      toast.error(err instanceof Error ? err.message : "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Comprehensive filtering logic
  useEffect(() => {
    let filtered = [...vendors];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (vendor) =>
          vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (vendor.phoneNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (vendor.taxNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.id.toString().includes(searchQuery.toLowerCase())
      );
    }

    // Apply district filter
    if (districtFilter !== "all") {
      filtered = filtered.filter(vendor => 
        vendor.district?.name === districtFilter
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(vendor => 
        vendor.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply date range filter
    if (startDate) {
      filtered = filtered.filter(vendor => {
        const vendorDate = new Date(vendor.createdAt);
        const filterStartDate = new Date(startDate);
        return vendorDate >= filterStartDate;
      });
    }

    if (endDate) {
      filtered = filtered.filter(vendor => {
        const vendorDate = new Date(vendor.createdAt);
        const filterEndDate = new Date(endDate);
        filterEndDate.setHours(23, 59, 59, 999); // Include the entire end date
        return vendorDate <= filterEndDate;
      });
    }

    setFilteredVendors(filtered);
  }, [vendors, searchQuery, districtFilter, statusFilter, startDate, endDate]);

  const handleSort = (key: keyof Vendor) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedAndFilteredVendors = () => {
    let filtered = [...filteredVendors];

    if (sortConfig) {
      filtered = filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];

        if (sortConfig.key === "id") {
          aValue = Number(aValue);
          bValue = Number(bValue);
        } else if (sortConfig.key === "createdAt" || sortConfig.key === "updatedAt") {
          // Handle date sorting
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else if (sortConfig.key === "district") {
          // Handle district sorting by name
          aValue = a.district?.name ? a.district.name.toLowerCase() : "";
          bValue = b.district?.name ? b.district.name.toLowerCase() : "";
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
  };

  const indexOfLastVendor = currentPage * vendorsPerPage;
  const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
  const currentVendors = getSortedAndFilteredVendors().slice(indexOfFirstVendor, indexOfLastVendor);

  const viewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowViewModal(true);
  };

  const editVendor = (vendor: Vendor) => {
    setSelectedVendor({ ...vendor });
    setShowEditModal(true);
  };

  const handleSaveVendor = async (updatedVendor: Vendor) => {
    try {
      const savedVendor = await vendorAPI.update(updatedVendor.id, {
        id: updatedVendor.id,
        businessName: updatedVendor.businessName,
        email: updatedVendor.email,
        phoneNumber: updatedVendor.phoneNumber,
        districtId: updatedVendor.district?.id,
        taxNumber: updatedVendor.taxNumber,
        taxDocuments: updatedVendor.taxDocuments,
        businessRegNumber: updatedVendor.businessRegNumber,
        citizenshipDocuments: updatedVendor.citizenshipDocuments,
        chequePhoto: updatedVendor.chequePhoto,
        bankDetails: {
          accountName: updatedVendor.accountName || "",
          bankName: updatedVendor.bankName || "",
          accountNumber: updatedVendor.accountNumber || "",
          bankBranch: updatedVendor.bankBranch || "",
          bankCode: updatedVendor.bankCode || "",
        },
        isVerified: updatedVendor.isVerified,
        businessAddress: updatedVendor.businessAddress,
        profilePicture: updatedVendor.profilePicture,
      });
      setVendors(vendors.map((v) => (v.id === savedVendor.id ? savedVendor : v)));
      setFilteredVendors(filteredVendors.map((v) => (v.id === savedVendor.id ? savedVendor : v)));
      setShowEditModal(false);
      setSelectedVendor(null);
      toast.success("Vendor updated successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save vendor";
      toast.error(errorMessage);
    }
  };

  const handleAddVendor = async (newVendor: VendorSignupRequest) => {
  try {
    if (!newVendor.district) {
      throw new Error("Please select a valid district");
    }
    const selectedDistrict = districts.find((d) => d.name.toLowerCase() === newVendor.district.toLowerCase());
    if (!selectedDistrict) {
      throw new Error("Selected district is not valid. Please refresh the page and try again.");
    }
    const savedVendor = await vendorAPI.create(newVendor);
    setVendors([...vendors, savedVendor]);
    setFilteredVendors([...filteredVendors, savedVendor]);
    setShowAddModal(false);
    toast.success("Vendor added successfully");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to add vendor";
    toast.error(errorMessage);
    setError(errorMessage);
  }
};

  const handleDeleteVendor = async (id: number) => {
    try {
      await vendorAPI.delete(id);
      setVendors(vendors.filter((vendor) => vendor.id !== id));
      setFilteredVendors(filteredVendors.filter((vendor) => vendor.id !== id));
      toast.success("Vendor deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete vendor";
      toast.error(errorMessage);
    }
  };

  if (!isAuthenticated || !token) {
    return (
      <div className="admin-vendors">
        <AdminSidebar />
        <div className="admin-vendors__content">
          <div className="admin-vendors__error">
            Please log in to access vendor management.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-vendors">
        <AdminSidebar />
        <div className="admin-vendors__content">
          <Header onSearch={handleSearch} showSearch={true} title="Vendor Management" />
          <div className="admin-vendors__list-container">
            <div className="admin-vendors__header">
              <h2>Vendor Management</h2>
              <div className="admin-vendors__header-buttons">
                <button className="admin-vendors__add-btn" onClick={() => setShowAddModal(true)}>
                  Add Vendor
                </button>
                <button
                  className="admin-vendors__unapproved-btn"
                  onClick={() => navigate('/admin-vendors/unapproved')}
                >
                  Unapproved Vendors
                </button>
              </div>
            </div>
            <div className="admin-vendors__table-container">
              <table className="admin-vendors__table">
                <thead className="admin-vendors__table-head">
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>District</th>
                    <th>Phone Number</th>
                    <th>PAT Number</th>
                    <th>PAN Document</th>
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
      </div>
    );
  }

  return (
    <div className="admin-vendors">
      <AdminSidebar />
      <div className="admin-vendors__content">
        {error && (
          <div className="admin-vendors__error">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        <Header onSearch={handleSearch} showSearch={true} title="Vendor Management" />
        
        {/* Filter Section */}
        <div className="admin-customers__filters">
          <div className="admin-customers__filter-group">
            <label htmlFor="districtFilter" className="admin-customers__filter-label">District:</label>
            <select 
              id="districtFilter"
              value={districtFilter} 
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="admin-customers__filter-input"
            >
              <option value="all">All Districts</option>
              {districts.map(district => (
                <option key={district.id} value={district.name}>{district.name}</option>
              ))}
            </select>
          </div>

          <div className="admin-customers__filter-group">
            <label htmlFor="statusFilter" className="admin-customers__filter-label">Status:</label>
            <select 
              id="statusFilter"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-customers__filter-input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="admin-customers__filter-group">
            <label htmlFor="startDate" className="admin-customers__filter-label">From Date:</label>
            <input 
              type="date"
              id="startDate"
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="admin-customers__filter-input"
            />
          </div>

          <div className="admin-customers__filter-group">
            <label htmlFor="endDate" className="admin-customers__filter-label">To Date:</label>
            <input 
              type="date"
              id="endDate"
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="admin-customers__filter-input"
            />
          </div>

          <button 
            onClick={() => {
              setDistrictFilter("all");
              setStatusFilter("all");
              setStartDate("");
              setEndDate("");
              setSearchQuery("");
              // Clear the search input in Header component
              const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (searchInput) {
                searchInput.value = '';
              }
            }}
            className="admin-customers__clear-filters"
          >
            Clear All Filters
          </button>
        </div>
        
        <div className="admin-vendors__list-container">
          <div className="admin-vendors__header">
            <h2>Vendor Management</h2>
            <div className="admin-vendors__header-buttons">
              <button
                className="admin-vendors__add-btn"
                onClick={() => setShowAddModal(true)}
              >
                Add Vendor
              </button>
              <button
                className="admin-vendors__unapproved-btn"
                onClick={() => navigate('/admin-vendors/unapproved')}
              >
                Unapproved Vendors {unapprovedCount > 0 && `(${unapprovedCount})`}
              </button>
            </div>
          </div>

          <div className="admin-vendors__table-container">
            <table className="admin-vendors__table">
              <thead className="admin-vendors__table-head">
                <tr>
                  <th onClick={() => handleSort("id")} className="sortable">
                    ID {sortConfig?.key === "id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("businessName")} className="sortable">
                    Name {sortConfig?.key === "businessName" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("email")} className="sortable">
                    Email {sortConfig?.key === "email" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("district")} className="sortable">
                    District {sortConfig?.key === "district" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("phoneNumber")} className="sortable">
                    Phone Number {sortConfig?.key === "phoneNumber" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("taxNumber")} className="sortable">
                    PAN Number {sortConfig?.key === "taxNumber" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("createdAt")} className="sortable">
                    Created Date {sortConfig?.key === "createdAt" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th>PAN Document</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentVendors.length > 0 ? (
                  currentVendors.map((vendor) => (
                    <tr key={vendor.id} className="admin-vendors__table-row">
                      <td>{vendor.id}</td>
                      <td>{vendor.businessName}</td>
                      <td>{vendor.email}</td>
                      <td>{vendor.district?.name || "N/A"}</td>
                      <td>{vendor.phoneNumber}</td>
                      <td>{vendor.taxNumber}</td>
                      <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                      <td>
                        {vendor.taxDocuments && vendor.taxDocuments.length > 0 ? (
                          <a href={vendor.taxDocuments[0]} target="_blank" rel="noopener noreferrer">
                            View Document
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>
                        <div className="admin-vendors__actions">
                          <button
                            className="admin-vendors__action-btn admin-vendors__view-btn"
                            onClick={() => viewVendor(vendor)}
                            aria-label="View vendor"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 12S4 4 12 4S23 12 23 12S20 20 12 20S1 12 1 12Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            className="admin-vendors__action-btn admin-vendors__edit-btn"
                            onClick={() => editVendor(vendor)}
                            aria-label="Edit vendor"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            className="admin-vendors__action-btn admin-vendors__delete-btn"
                            onClick={() => handleDeleteVendor(vendor.id)}
                            aria-label="Delete vendor"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M3 6H5H21"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="admin-vendors__no-data">
                      {vendors.length === 0 ? 'No vendors registered yet. Click "Add Vendor" to get started.' : 'No vendors match your current filter criteria. Try adjusting your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-vendors__pagination-container">
            <div className="admin-vendors__pagination-info">
              Showing {indexOfFirstVendor + 1}-{Math.min(indexOfLastVendor, filteredVendors.length)} out of {filteredVendors.length}
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
      />
      <AddVendorModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddVendor}
        districts={districts}
        token={token}
      />
      <VendorViewModal
        show={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedVendor(null);
        }}
        vendor={selectedVendor}
      />
    </div>
  );
};

export default AdminVendor ;