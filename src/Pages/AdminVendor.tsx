import React, { useState, useEffect, useCallback, useMemo, FC, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Vendor, District, VendorUpdateRequest, VendorSignupRequest } from '../Components/Types/vendor';
import { VendorAuthService } from '../services/vendorAuthService';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

// Skeleton loading row component
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
  </tr>
);
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import Pagination from "../Components/Pagination";
import VendorEditModal from "../Components/Modal/VendorEditModal";
import AddVendorModal from "../Components/Modal/AddVendorModal";
import VendorViewModal from "../Components/Modal/VendorViewModal";

// Define the API response type
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface AdminVendorProps {}

const AdminVendor: FC<AdminVendorProps> = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  
  // State for vendors and UI
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const vendorsPerPage = 10;
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districts, setDistricts] = useState<District[]>([]);
  const [unapprovedCount, setUnapprovedCount] = useState<number>(0);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Vendor; direction: 'asc' | 'desc' } | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Create vendor API instance
  const vendorAPI = useMemo(() => {
    return {
      async getAll(): Promise<Vendor[]> {
        try {
          if (!token) {
            throw new Error("No token provided. Please log in.");
          }
          const response = await fetch(`${API_BASE_URL}/api/vendors`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch vendors: ${response.statusText}`);
          }
          
          const result: ApiResponse<Vendor[]> = await response.json();
          if (!result.success) {
            throw new Error(result.message || "Failed to fetch vendors");
          }
          
          return result.data || [];
        } catch (error) {
          console.error("Error fetching vendors:", error);
          throw error;
        }
      },
      
      async update(id: number, vendorData: Partial<Vendor>): Promise<Vendor> {
        try {
          if (!token) {
            throw new Error("No token provided. Please log in.");
          }
          
          const response = await fetch(`${API_BASE_URL}/api/vendors/${id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(vendorData)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update vendor");
          }
          
          const result: ApiResponse<Vendor> = await response.json();
          if (!result.success || !result.data) {
            throw new Error(result.message || "Failed to update vendor");
          }
          
          return result.data;
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
          
          const response = await fetch(`${API_BASE_URL}/api/vendors/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete vendor");
          }
        } catch (error) {
          console.error("Error deleting vendor:", error);
          throw error;
        }
      }
    };
  }, [token]);

  // Fetch vendors and districts on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Fetch vendors
        const vendorsData = await vendorAPI.getAll();
        setVendors(vendorsData);
        setFilteredVendors(vendorsData);
        
        // Fetch districts
        const districtsResponse = await fetch(`${API_BASE_URL}/api/districts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (districtsResponse.ok) {
          const districtsData = await districtsResponse.json();
          setDistricts(districtsData.data || []);
        }
        
        // Fetch unapproved count
        const unapprovedResponse = await fetch(`${API_BASE_URL}/api/vendors/unapproved/count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (unapprovedResponse.ok) {
          const countData = await unapprovedResponse.json();
          setUnapprovedCount(countData.count || 0);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, token, navigate, vendorAPI]);

  // Handle search and filter changes
  const handleSearch = useCallback((query: string) => {
    const searchTerm = query.toLowerCase();
    setSearchQuery(searchTerm);
    setCurrentPage(1);
    
    const filtered = vendors.filter(vendor => {
      const districtName = typeof vendor.district === 'object' 
        ? vendor.district?.name || '' 
        : vendor.district || '';
        
      return (
        (vendor.businessName || '').toLowerCase().includes(searchTerm) ||
        (vendor.email || '').toLowerCase().includes(searchTerm) ||
        (vendor.phoneNumber || '').toLowerCase().includes(searchTerm) ||
        districtName.toLowerCase().includes(searchTerm)
      );
    });
    
    setFilteredVendors(filtered);
  }, [vendors]);

  // Handle vendor update
  const handleSaveVendor = async (vendorData: Partial<Vendor>) => {
    if (!selectedVendor) return;
    try {
      if (!vendorAPI) return;
      
      // Prepare the update data with proper type conversions
      const updateData: Partial<Vendor> = {
        ...vendorData,
        id: selectedVendor.id,
        taxNumber: vendorData.taxNumber || '',
        businessName: vendorData.businessName || '',
        email: vendorData.email || '',
        phoneNumber: vendorData.phoneNumber || '',
        isVerified: vendorData.isVerified || false,
        // Handle district conversion
        district: typeof vendorData.district === 'string' 
          ? { id: 0, name: vendorData.district } 
          : vendorData.district,
        // Handle bank details
        accountName: vendorData.accountName || '',
        bankName: vendorData.bankName || '',
        accountNumber: vendorData.accountNumber || '',
        bankBranch: vendorData.bankBranch || '',
        bankCode: vendorData.bankCode || '',
        // Handle document arrays
        taxDocuments: Array.isArray(vendorData.taxDocuments) 
          ? vendorData.taxDocuments 
          : [],
        citizenshipDocuments: Array.isArray(vendorData.citizenshipDocuments) 
          ? vendorData.citizenshipDocuments 
          : [],
        // Handle cheque photo (can be string or string[])
        chequePhoto: Array.isArray(vendorData.chequePhoto) 
          ? vendorData.chequePhoto[0] || null 
          : vendorData.chequePhoto || null
      };
      
      // Call the API to update the vendor
      const updatedVendor = await vendorAPI.update(selectedVendor.id, updateData);
      
      // Update the local state with the updated vendor data
      setVendors(prevVendors => 
        prevVendors.map(v => v.id === updatedVendor.id ? updatedVendor : v)
      );
      
      // Update filtered vendors if needed
      setFilteredVendors(prevFiltered => 
        prevFiltered.map(v => v.id === updatedVendor.id ? updatedVendor : v)
      );
      
      toast.success('Vendor updated successfully');
      setShowEditModal(false);
      setSelectedVendor(null);
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update vendor');
    }
  };

  // Handle vendor deletion
  const handleDeleteVendor = async (vendorId: number) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    
    try {
      if (!token) throw new Error('No authentication token found');
      
      await vendorAPI.delete(vendorId);
      
      // Update vendors list
      setVendors(prev => prev.filter(v => v.id !== vendorId));
      setFilteredVendors(prev => prev.filter(v => v.id !== vendorId));
      
      toast.success('Vendor deleted successfully');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete vendor');
    }
  };

  // Handle adding a new vendor
  const handleAddVendor = async (newVendor: VendorSignupRequest) => {
    try {
      // Convert to Vendor type for local state
      const vendorToAdd: Vendor = {
        ...newVendor,
        id: Date.now(), // Temporary ID, will be replaced by server response
        verificationCode: null,
        verificationCodeExpire: null,
        isVerified: false,
        isApproved: false,
        resetToken: null,
        resetTokenExpire: null,
        resendCount: 0,
        resendBlockUntil: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        district: {
          id: parseInt(newVendor.district as string) || 0,
          name: newVendor.district as string
        },
        status: 'Active',
        taxDocuments: newVendor.taxDocuments || [],
        citizenshipDocuments: newVendor.citizenshipDocuments || [],
        chequePhoto: newVendor.chequePhoto || null,
        accountName: newVendor.bankDetails?.accountName || '',
        bankName: newVendor.bankDetails?.bankName || '',
        accountNumber: newVendor.bankDetails?.accountNumber || '',
        bankBranch: newVendor.bankDetails?.bankBranch || '',
        bankCode: newVendor.bankDetails?.bankCode || ''
      };
      
      setVendors(prev => [vendorToAdd, ...prev]);
      setFilteredVendors(prev => [vendorToAdd, ...prev]);
      
      // In a real app, you would make an API call here to create the vendor
      // and update the state with the response
      // const response = await vendorAPI.create(newVendor);
      // setVendors(prev => [response.data, ...prev]);
      // setFilteredVendors(prev => [response.data, ...prev]);
      
      toast.success('Vendor added successfully');
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add vendor');
    }
  };

  // Handle vendor selection for edit
  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowEditModal(true);
  };

  // Handle vendor selection for view
  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowViewModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedVendor(null);
  };

  // Handle sorting
  const handleSort = (key: keyof Vendor) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
    
    setFilteredVendors(prev => {
      const sorted = [...prev].sort((a, b) => {
        // Handle potential undefined values
        const aValue = a[key] || '';
        const bValue = b[key] || '';
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
      
      return sorted;
    });
  };

  // Calculate pagination
  const indexOfLastVendor = currentPage * vendorsPerPage;
  const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
  const currentVendors = filteredVendors.slice(indexOfFirstVendor, indexOfLastVendor);
  const totalPages = Math.ceil(filteredVendors.length / vendorsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (!isAuthenticated) {
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
                            onClick={() => handleViewVendor(vendor)}
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
                            onClick={() => handleEditVendor(vendor)}
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