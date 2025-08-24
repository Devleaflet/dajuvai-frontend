// import React, { useState, useEffect, useCallback } from "react";
// import { AdminSidebar } from "./AdminSidebar";
// import Header from "./Header";
// import Pagination from "./Pagination";
// import { API_BASE_URL } from "../config";
// import { useAuth } from "../context/AuthContext";
// import "../Styles/AdminVendor.css";
// import { toast } from "react-hot-toast";
// import { useNavigate } from "react-router-dom";

// interface AdminVendor {
//   id: number;
//   businessName: string;
//   email: string;
//   phoneNumber?: string;
//   district?: {
//     id: number;
//     name: string;
//   };
//   status: "Inactive";
//   taxNumber?: string;
//   taxDocument?: string;
// }

// interface ApiResponse<T> {
//   success: boolean;
//   data?: T;
//   message?: string;
//   errors?: { path: string[]; message: string }[];
// }

// const SkeletonRow: React.FC = () => {
//   return (
//     <tr>
//       <td><div className="skeleton skeleton-text"></div></td>
//       <td><div className="skeleton skeleton-text"></div></td>
//       <td><div className="skeleton skeleton-text"></div></td>
//       <td><div className="skeleton skeleton-text"></div></td>
//       <td><div className="skeleton skeleton-text"></div></td>
//       <td><div className="skeleton skeleton-text"></div></td>
//       <td><div className="skeleton skeleton-text"></div></td>
//     </tr>
//   );
// };

// const createVendorAPI = (token: string | null) => ({
//   async getUnapproved(): Promise<AdminVendor[]> {
//     try {
//       if (!token) {
//         throw new Error("No token provided. Please log in.");
//       }
//       const headers: Record<string, string> = {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         Authorization: `Bearer ${token}`,
//       };

//       const response = await fetch(`${API_BASE_URL}/api/vendors/unapprove/list`, {
//         method: "GET",
//         headers,
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
//       }

//       const result: ApiResponse<AdminVendor[]> = await response.json();
//       return (result.data || []).map((vendor) => ({
//         ...vendor,
//         status: "Inactive",
//         taxNumber: vendor.taxNumber || "N/A",
//         taxDocument: vendor.taxDocument || "N/A",
//       }));
//     } catch (error) {
//       console.error("Error fetching unapproved vendors:", error);
//       throw error;
//     }
//   },

//   async approve(id: number): Promise<void> {
//     try {
//       if (!token) {
//         throw new Error("No token provided. Please log in.");
//       }
//       const headers: Record<string, string> = {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         Authorization: `Bearer ${token}`,
//       };

//       const response = await fetch(`${API_BASE_URL}/api/vendors/approve/${id}`, {
//         method: "PUT",
//         headers,
//       });

//       if (!response.ok) {
//         let errorMessage = `HTTP error! status: ${response.status}`;
//         try {
//           const errorText = await response.text();
//           errorMessage += `, body: ${errorText}`;
//           const errorData = JSON.parse(errorText);
//           if (errorData.message) {
//             errorMessage = errorData.message;
//           }
//         } catch (parseError) {
//           console.error("Failed to parse error response:", parseError);
//         }
//         throw new Error(errorMessage);
//       }

//       if (response.status !== 204) {
//         const result = await response.json();
//         if (!result.success) {
//           throw new Error(result.message || "Failed to approve vendor");
//         }
//       }
//     } catch (error) {
//       console.error("Error approving vendor:", error);
//       throw error;
//     }
//   },

//   async reject(id: number): Promise<void> {
//     try {
//       if (!token) {
//         throw new Error("No token provided. Please log in.");
//       }
//       const headers: Record<string, string> = {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         Authorization: `Bearer ${token}`,
//       };

//       const response = await fetch(`${API_BASE_URL}/api/vendors/${id}`, {
//         method: "DELETE",
//         headers,
//       });

//       if (!response.ok) {
//         let errorMessage = `HTTP error! status: ${response.status}`;
//         try {
//           const errorText = await response.text();
//           errorMessage += `, body: ${errorText}`;
//           const errorData = JSON.parse(errorText);
//           if (errorData.message) {
//             errorMessage = errorData.message;
//           }
//         } catch (parseError) {
//           console.error("Failed to parse error response:", parseError);
//         }
//         throw new Error(errorMessage);
//       }

//       if (response.status !== 204) {
//         const result = await response.json();
//         if (!result.success) {
//           throw new Error(result.message || "Failed to reject vendor");
//         }
//       }
//     } catch (error) {
//       console.error("Error rejecting vendor:", error);
//       throw error;
//     }
//   },
// });

// const UnapprovedVendors: React.FC = () => {
//   const { token, isAuthenticated } = useAuth();
//   const navigate = useNavigate();
//   const [vendors, setVendors] = useState<AdminVendor[]>([]);
//   const [filteredVendors, setFilteredVendors] = useState<AdminVendor[]>([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [vendorsPerPage] = useState(7);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [sortConfig, setSortConfig] = useState<{ key: keyof AdminVendor; direction: "asc" | "desc" } | null>(null);

//   const vendorAPI = createVendorAPI(token);

//   const CACHE_KEY = "unapproved_vendors";
//   const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

//   const loadUnapprovedVendors = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const fetchedVendors = await vendorAPI.getUnapproved();
//       setVendors(fetchedVendors);
//       setFilteredVendors(fetchedVendors);
//       localStorage.setItem(CACHE_KEY, JSON.stringify({ data: fetchedVendors, timestamp: Date.now() }));
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to load unapproved vendors");
//       toast.error(err instanceof Error ? err.message : "Failed to load unapproved vendors");
//     } finally {
//       setLoading(false);
//     }
//   }, [token]);

//   useEffect(() => {
//     if (isAuthenticated && token) {
//       const cached = localStorage.getItem(CACHE_KEY);
//       if (cached) {
//         try {
//           const { data, timestamp } = JSON.parse(cached);
//           if (Array.isArray(data) && Date.now() - timestamp < CACHE_TTL) {
//             setVendors(data);
//             setFilteredVendors(data);
//             setLoading(false);
//           }
//         } catch {}
//       }
//       loadUnapprovedVendors();
//     } else {
//       setLoading(false);
//       setError("Please log in to access unapproved vendor management.");
//     }
//   }, [isAuthenticated, token, loadUnapprovedVendors]);

//   const handleSearch = (query: string) => {
//     setCurrentPage(1);
//     const results = vendors.filter(
//       (vendor) =>
//         vendor.businessName.toLowerCase().includes(query.toLowerCase()) ||
//         vendor.email.toLowerCase().includes(query.toLowerCase()) ||
//         (vendor.phoneNumber || "").toLowerCase().includes(query.toLowerCase()) ||
//         (vendor.taxNumber || "").toLowerCase().includes(query.toLowerCase()) ||
//         vendor.id.toString().includes(query.toLowerCase())
//     );
//     setFilteredVendors(results);
//   };

//   const handleSort = (key: keyof AdminVendor) => {
//     let direction: "asc" | "desc" = "asc";
//     if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
//       direction = "desc";
//     }
//     setSortConfig({ key, direction });
//   };

//   const getSortedAndFilteredVendors = () => {
//     let filtered = [...filteredVendors];

//     if (sortConfig) {
//       filtered = filtered.sort((a, b) => {
//         let aValue: any = a[sortConfig.key];
//         let bValue: any = b[sortConfig.key];

//         if (sortConfig.key === "id") {
//           aValue = Number(aValue);
//           bValue = Number(bValue);
//         } else {
//           aValue = aValue ? aValue.toString().toLowerCase() : "";
//           bValue = bValue ? bValue.toString().toLowerCase() : "";
//         }

//         if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
//         if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
//         return 0;
//       });
//     }

//     return filtered;
//   };

//   const handleApproveVendor = async (id: number) => {
//     try {
//       await vendorAPI.approve(id);
//       setVendors(vendors.filter((vendor) => vendor.id !== id));
//       setFilteredVendors(filteredVendors.filter((vendor) => vendor.id !== id));
//       toast.success("Vendor approved successfully");
//       navigate('/admin-vendors');
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : "Failed to approve vendor";
//       toast.error(errorMessage);
//     }
//   };

//   const handleRejectVendor = async (id: number) => {
//     try {
//       await vendorAPI.reject(id);
//       setVendors(vendors.filter((vendor) => vendor.id !== id));
//       setFilteredVendors(filteredVendors.filter((vendor) => vendor.id !== id));
//       toast.success("Vendor rejected successfully");
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : "Failed to reject vendor";
//       toast.error(errorMessage);
//     }
//   };

//   const indexOfLastVendor = currentPage * vendorsPerPage;
//   const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
//   const currentVendors = getSortedAndFilteredVendors().slice(indexOfFirstVendor, indexOfLastVendor);

//   if (!isAuthenticated || !token) {
//     return (
//       <div className="admin-vendors">
//         <AdminSidebar />
//         <div className="admin-vendors__content">
//           <div className="admin-vendors__error">
//             Please log in to access unapproved vendor management.
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="admin-vendors">
//         <AdminSidebar />
//         <div className="admin-vendors__content">
//           <Header onSearch={handleSearch} showSearch={true} title="Unapproved Vendors" />
//           <div className="admin-vendors__list-container">
//             <div className="admin-vendors__header">
//               <h2>Unapproved Vendors</h2>
//               <div className="admin-vendors__header-buttons">
//                 <button
//                   className="admin-vendors__unapproved-btn"
//                   onClick={() => navigate('/admin-vendors')}
//                 >
//                   Back to Vendor Page
//                 </button>
//               </div>
//             </div>
//             <div className="admin-vendors__table-container">
//               <table className="admin-vendors__table">
//                 <thead className="admin-vendors__table-head">
//                   <tr>
//                     <th>ID</th>
//                     <th>Name</th>
//                     <th>Email</th>
//                     <th>District</th>
//                     <th>Phone Number</th>
//                     <th>Tax Number</th>
//                     <th>Tax Document</th>
//                     <th>Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {[...Array(5)].map((_, index) => (
//                     <SkeletonRow key={index} />
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="admin-vendors">
//       <AdminSidebar />
//       <div className="admin-vendors__content">
//         {error && (
//           <div className="admin-vendors__error">
//             {error}
//             <button onClick={() => setError(null)}>×</button>
//           </div>
//         )}
//         <Header onSearch={handleSearch} showSearch={true} title="Unapproved Vendors" />
//         <div className="admin-vendors__list-container">
//           <div className="admin-vendors__header">
//             <h2>Unapproved Vendors</h2>
//             <div className="admin-vendors__header-buttons">
//               <button
//                 className="admin-vendors__unapproved-btn"
//                 onClick={() => navigate('/admin-vendors')}
//               >
//                 Back to Vendor Page
//               </button>
//             </div>
//           </div>

//           <div className="admin-vendors__table-container">
//             <table className="admin-vendors__table">
//               <thead className="admin-vendors__table-head">
//                 <tr>
//                   <th onClick={() => handleSort("id")} className="sortable">
//                     ID {sortConfig?.key === "id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
//                   </th>
//                   <th onClick={() => handleSort("businessName")} className="sortable">
//                     Name {sortConfig?.key === "businessName" && (sortConfig.direction === "asc" ? "↑" : "↓")}
//                   </th>
//                   <th onClick={() => handleSort("email")} className="sortable">
//                     Email {sortConfig?.key === "email" && (sortConfig.direction === "asc" ? "↑" : "↓")}
//                   </th>
//                   <th onClick={() => handleSort("district")} className="sortable">
//                     District {sortConfig?.key === "district" && (sortConfig.direction === "asc" ? "↑" : "↓")}
//                   </th>
//                   <th onClick={() => handleSort("phoneNumber")} className="sortable">
//                     Phone Number {sortConfig?.key === "phoneNumber" && (sortConfig.direction === "asc" ? "↑" : "↓")}
//                   </th>
//                   <th onClick={() => handleSort("taxNumber")} className="sortable">
//                     Tax Number {sortConfig?.key === "taxNumber" && (sortConfig.direction === "asc" ? "↑" : "↓")}
//                   </th>
//                   <th>Tax Document</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {currentVendors.length > 0 ? (
//                   currentVendors.map((vendor) => (
//                     <tr key={vendor.id} className="admin-vendors__table-row">
//                       <td>{vendor.id}</td>
//                       <td>{vendor.businessName}</td>
//                       <td>{vendor.email}</td>
//                       <td>{vendor.district?.name || "N/A"}</td>
//                       <td>{vendor.phoneNumber || "N/A"}</td>
//                       <td>{vendor.taxNumber}</td>
//                       <td>
//                         {vendor.taxDocument && vendor.taxDocument !== "N/A" ? (
//                           <a href={vendor.taxDocument} target="_blank" rel="noopener noreferrer">
//                             View Document
//                           </a>
//                         ) : (
//                           "N/A"
//                         )}
//                       </td>
//                       <td>
//                         <div className="admin-vendors__actions">
//                           <button
//                             className="admin-vendors__action-btn admin-vendors__approve-btn"
//                             onClick={() => handleApproveVendor(vendor.id)}
//                             aria-label="Approve vendor"
//                           >
//                             <svg
//                               width="20"
//                               height="20"
//                               viewBox="0 0 24 24"
//                               fill="none"
//                               xmlns="http://www.w3.org/2000/svg"
//                             >
//                               <path
//                                 d="M20 6L9 17L4 12"
//                                 stroke="currentColor"
//                                 strokeWidth="2"
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                               />
//                             </svg>
//                           </button>
//                           <button
//                             className="admin-vendors__action-btn admin-vendors__delete-btn"
//                             onClick={() => handleRejectVendor(vendor.id)}
//                             aria-label="Reject vendor"
//                           >
//                             <svg
//                               width="20"
//                               height="20"
//                               viewBox="0 0 24 24"
//                               fill="none"
//                               xmlns="http://www.w3.org/2000/svg"
//                             >
//                               <path
//                                 d="M6 18L18 6M6 6L18 18"
//                                 stroke="currentColor"
//                                 strokeWidth="2"
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                               />
//                             </svg>
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={8} className="admin-vendors__no-data">
//                       No unapproved vendors found
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           <div className="admin-vendors__pagination-container">
//             <div className="admin-vendors__pagination-info">
//               Showing {indexOfFirstVendor + 1}-{Math.min(indexOfLastVendor, filteredVendors.length)} out of {filteredVendors.length}
//             </div>
//             <Pagination
//               currentPage={currentPage}
//               totalPages={Math.ceil(filteredVendors.length / vendorsPerPage)}
//               onPageChange={setCurrentPage}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UnapprovedVendors;



import React, { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "./AdminSidebar";
import Header from "./Header";
import Pagination from "./Pagination";
import VendorViewModal from "./Modal/VendorViewModal"; // Assuming new modal is placed here
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminVendor.css";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface AdminVendor {
  id: number;
  businessName: string;
  email: string;
  phoneNumber?: string;
  district?: {
    id: number;
    name: string;
  };
  status: "Inactive";
  taxNumber?: string;
  taxDocuments?: string[];
  businessRegNumber?: string | null;
  citizenshipDocuments?: string[] | null;
  chequePhoto?: string | null;
  accountName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  bankBranch?: string | null;
  bankCode?: string | null;
  isVerified: boolean;
  isApproved?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { path: string[]; message: string }[];
}

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
    </tr>
  );
};

const createVendorAPI = (token: string | null) => ({
  async getUnapproved(): Promise<AdminVendor[]> {
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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result: ApiResponse<AdminVendor[]> = await response.json();
      return (result.data || []).map((vendor) => ({
        ...vendor,
        status: "Inactive",
        taxNumber: vendor.taxNumber || "N/A",
        taxDocuments: vendor.taxDocuments || [],
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

  async reject(id: number): Promise<void> {
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
          throw new Error(result.message || "Failed to reject vendor");
        }
      }
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      throw error;
    }
  },
});

const UnapprovedVendors: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<AdminVendor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorsPerPage] = useState(7);
  const [selectedVendor, setSelectedVendor] = useState<AdminVendor | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof AdminVendor; direction: "asc" | "desc" } | null>(null);

  const vendorAPI = createVendorAPI(token);

  const CACHE_KEY = "unapproved_vendors";
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  const loadUnapprovedVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedVendors = await vendorAPI.getUnapproved();
      setVendors(fetchedVendors);
      setFilteredVendors(fetchedVendors);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: fetchedVendors, timestamp: Date.now() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load unapproved vendors");
      toast.error(err instanceof Error ? err.message : "Failed to load unapproved vendors");
    } finally {
      setLoading(false);
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
      loadUnapprovedVendors();
    } else {
      setLoading(false);
      setError("Please log in to access unapproved vendor management.");
    }
  }, [isAuthenticated, token, loadUnapprovedVendors]);

  const handleSearch = (query: string) => {
    setCurrentPage(1);
    const results = vendors.filter(
      (vendor) =>
        vendor.businessName.toLowerCase().includes(query.toLowerCase()) ||
        vendor.email.toLowerCase().includes(query.toLowerCase()) ||
        (vendor.phoneNumber || "").toLowerCase().includes(query.toLowerCase()) ||
        (vendor.taxNumber || "").toLowerCase().includes(query.toLowerCase()) ||
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

  const viewVendor = (vendor: AdminVendor) => {
    setSelectedVendor(vendor);
    setShowViewModal(true);
  };

  const handleApproveVendor = async (id: number) => {
    try {
      await vendorAPI.approve(id);
      setVendors(vendors.filter((vendor) => vendor.id !== id));
      setFilteredVendors(filteredVendors.filter((vendor) => vendor.id !== id));
      toast.success("Vendor approved successfully");
      navigate('/admin-vendors');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to approve vendor";
      toast.error(errorMessage);
    }
  };

  const handleRejectVendor = async (id: number) => {
    try {
      await vendorAPI.reject(id);
      setVendors(vendors.filter((vendor) => vendor.id !== id));
      setFilteredVendors(filteredVendors.filter((vendor) => vendor.id !== id));
      toast.success("Vendor rejected successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reject vendor";
      toast.error(errorMessage);
    }
  };

  const indexOfLastVendor = currentPage * vendorsPerPage;
  const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
  const currentVendors = getSortedAndFilteredVendors().slice(indexOfFirstVendor, indexOfLastVendor);

  if (!isAuthenticated || !token) {
    return (
      <div className="admin-vendors">
        <AdminSidebar />
        <div className="admin-vendors__content">
          <div className="admin-vendors__error">
            Please log in to access unapproved vendor management.
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
          <Header onSearch={handleSearch} showSearch={true} title="Unapproved Vendors" />
          <div className="admin-vendors__list-container">
            <div className="admin-vendors__header">
              <h2>Unapproved Vendors</h2>
              <div className="admin-vendors__header-buttons">
                <button
                  className="admin-vendors__unapproved-btn"
                  onClick={() => navigate('/admin-vendors')}
                >
                  Back to Vendor Page
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
                    <th>Tax Number</th>
                    <th>Tax Document</th>
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
        <Header onSearch={handleSearch} showSearch={true} title="Unapproved Vendors" />
        <div className="admin-vendors__list-container">
          <div className="admin-vendors__header">
            <h2>Unapproved Vendors</h2>
            <div className="admin-vendors__header-buttons">
              <button
                className="admin-vendors__unapproved-btn"
                onClick={() => navigate('/admin-vendors')}
              >
                Back to Vendor Page
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
                    Tax Number {sortConfig?.key === "taxNumber" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th>Tax Document</th>
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
                      <td>{vendor.phoneNumber || "N/A"}</td>
                      <td>{vendor.taxNumber}</td>
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
                            className="admin-vendors__action-btn admin-vendors__approve-btn"
                            onClick={() => handleApproveVendor(vendor.id)}
                            aria-label="Approve vendor"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M20 6L9 17L4 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            className="admin-vendors__action-btn admin-vendors__delete-btn"
                            onClick={() => handleRejectVendor(vendor.id)}
                            aria-label="Reject vendor"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 18L18 6M6 6L18 18"
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
                    <td colSpan={8} className="admin-vendors__no-data">
                      No unapproved vendors found
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

export default UnapprovedVendors;