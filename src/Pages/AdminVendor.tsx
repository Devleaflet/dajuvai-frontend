import React, { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import Pagination from "../Components/Pagination";
import VendorEditModal from "../Components/Modal/VendorEditModal";
import AddVendorModal from "../Components/Modal/AddVendorModal";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { VendorAuthService } from "../services/vendorAuthService";
import { Vendor } from "../Components/Types/vendor";
import "../Styles/AdminVendor.css";
import { toast } from "react-hot-toast";

interface AdminVendor extends Vendor {
  status: "Active" | "Inactive";
  district?: {
    id: number;
    name: string;
  };
}

interface District {
  id: number;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  vendor?: T;
  message?: string;
  errors?: { path: string[]; message: string }[];
  token?: string;
}

const SkeletonRow: React.FC = () => {
  return (
    <tr>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
    </tr>
  );
};

const createVendorAPI = (token: string | null) => ({
  async getAll(): Promise<AdminVendor[]> {
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
      }));
    } catch (error) {
      console.error("Error fetching vendors:", error);
      throw error;
    }
  },

  async create(vendorData: any): Promise<AdminVendor> {
    try {
      if (!token) {
        throw new Error("No token provided. Please log in.");
      }
      const response = await VendorAuthService.signup(
        {
          businessName: vendorData.businessName || "",
          email: vendorData.email || "",
          businessAddress: vendorData.businessAddress || "",
          phoneNumber: vendorData.phoneNumber || "",
          password: vendorData.password,
          district: String(vendorData.district),
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
        phoneNumber: response.vendor.phoneNumber || "",
        businessAddress: response.vendor.businessAddress || "",
        isVerified: !!response.vendor.isVerified,
        status: response.vendor.isVerified ? "Active" : "Inactive",
      };
    } catch (error) {
      console.error("Error creating vendor:", error);
      throw error;
    }
  },

  async update(id: number, vendorData: Partial<AdminVendor>): Promise<AdminVendor> {
    try {
      if (!token) {
        throw new Error("No token provided. Please log in.");
      }
      const response = await VendorAuthService.updateVendor(
        id,
        {
          id,
          businessName: vendorData.businessName || "",
          email: vendorData.email || "",
          phoneNumber: vendorData.phoneNumber || "",
          district: vendorData.district?.name,
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
        phoneNumber: response.vendor.phoneNumber || "",
        businessAddress: response.vendor.businessAddress || "",
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
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`${API_BASE_URL}/api/vendors/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      throw error;
    }
  },
});

const AdminVendors: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<AdminVendor[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorsPerPage] = useState(7);
  const [selectedVendor, setSelectedVendor] = useState<AdminVendor | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof AdminVendor; direction: "asc" | "desc" } | null>(null);

  const vendorAPI = createVendorAPI(token);

  const CACHE_KEY = "admin_vendors";
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

  const handleSearch = (query: string) => {
    setCurrentPage(1);
    const results = vendors.filter(
      (vendor) =>
        vendor.businessName.toLowerCase().includes(query.toLowerCase()) ||
        vendor.email.toLowerCase().includes(query.toLowerCase()) ||
        (vendor.phoneNumber || "").toLowerCase().includes(query.toLowerCase()) ||
        vendor.id.toString().includes(query.toLowerCase())
    );
    setFilteredVendors(results);
  };

  const handleSort = (key: keyof AdminVendor) => {
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

  const editVendor = (vendor: AdminVendor) => {
    setSelectedVendor({ ...vendor });
    setShowEditModal(true);
  };

  const handleSaveVendor = async (updatedVendor: AdminVendor) => {
    try {
      const savedVendor = await vendorAPI.update(updatedVendor.id, {
        businessName: updatedVendor.businessName,
        email: updatedVendor.email,
        phoneNumber: updatedVendor.phoneNumber,
        district: updatedVendor.district,
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

  const handleAddVendor = async (newVendor: unknown) => {
    try {
      const vendor = newVendor as { [key: string]: any };
      if (!vendor.district) {
        throw new Error("Please select a valid district");
      }
      const selectedDistrict = districts.find(d => d.name === vendor.district);
      if (!selectedDistrict) {
        throw new Error("Selected district is not valid. Please refresh the page and try again.");
      }
      const savedVendor = await vendorAPI.create({
        businessName: vendor.businessName,
        email: vendor.email,
        businessAddress: vendor.businessAddress,
        phoneNumber: vendor.phoneNumber,
        password: vendor.password,
        district: vendor.district,
      });
      setVendors([
        ...vendors,
        {
          ...savedVendor,
          phoneNumber: savedVendor.phoneNumber || "",
          isVerified: !!savedVendor.isVerified,
        },
      ]);
      setFilteredVendors([
        ...filteredVendors,
        {
          ...savedVendor,
          phoneNumber: savedVendor.phoneNumber || "",
          isVerified: !!savedVendor.isVerified,
        },
      ]);
      setShowAddModal(false);
      toast.success("Vendor added successfully");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add vendor";
      toast.error(errorMessage);
    }
  };

  if (!isAuthenticated || !token) {
    return (
      <div className="admin-vendors">
        <AdminSidebar />
        <div className="admin-vendors__content">
          <div className="admin-vendors__error">
            Please log ۬log in to access vendor management.
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
              <button className="admin-vendors__add-btn">Add Vendor</button>
            </div>
            <div className="admin-vendors__table-container">
              <table className="admin-vendors__table">
                <thead className="admin-vendors__table-head">
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Action</th>
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
        <div className="admin-vendors__list-container">
          <div className="admin-vendors__header">
            <h2>Vendor Management</h2>
            <button className="admin-vendors__add-btn" onClick={() => setShowAddModal(true)}>
              Add Vendor
            </button>
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
                      <td>
                        <div className="admin-vendors__actions">
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
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="admin-vendors__no-data">
                      No vendors found
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
        vendor={selectedVendor as any}
      />
      <AddVendorModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddVendor}
        districts={districts}
      />
    </div>
  );
};

export default AdminVendors;