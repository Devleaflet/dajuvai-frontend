"use client"

import React, { useState, useEffect, useCallback } from "react"
import { AdminSidebar } from "../Components/AdminSidebar"
import Header from "../Components/Header"
import Pagination from "../Components/Pagination"
import { API_BASE_URL } from "../config"
import { useAuth } from "../context/AuthContext"
import "../Styles/AdminOrders.css"
import "../Styles/AdminCustomers.css"

// User interface based on API schema
interface User {
  id: number
  username: string
  email: string
  role: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}



// ApiResponse interface
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Skeleton component for loading state
const SkeletonRow: React.FC = () => {
  return (
    <tr>
      {[...Array(5)].map((_, index) => (
        <td key={index}><div className="skeleton skeleton-text"></div></td>
      ))}
    </tr>
  )
}

// API service functions with auth headers
const createUserAPI = (token: string | null) => ({
  async getAll(): Promise<User[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        method: 'GET',
        headers,
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result: ApiResponse<User[]> = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }
})

// Role filter options
const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "user", label: "User" },
  { value: "vendor", label: "Vendor" },
  { value: "admin", label: "Admin" }
];

const AdminCustomers: React.FC = () => {
  const { token, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>(null)
  const [roleFilter, setRoleFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const userAPI = createUserAPI(token)

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers()
    }
  }, [isAuthenticated, token])

  // Filter users based on search, role, and date
  useEffect(() => {
    let filtered = [...users]

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toString().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role.toLowerCase() === roleFilter.toLowerCase())
    }

    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter(user => {
        const userDate = new Date(user.createdAt)
        const start = startDate ? new Date(startDate) : null
        const end = endDate ? new Date(endDate) : null
        
        // Set end date to end of day for inclusive filtering
        if (end) {
          end.setHours(23, 59, 59, 999)
        }
        
        if (start && end) {
          return userDate >= start && userDate <= end
        } else if (start) {
          return userDate >= start
        } else if (end) {
          return userDate <= end
        }
        return true
      })
    }

    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [users, searchQuery, roleFilter, startDate, endDate])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedUsers = await userAPI.getAll()
      setUsers(fetchedUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }, [userAPI])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleSort = useCallback((key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }, [sortConfig])

  const getSortedAndFilteredUsers = useCallback(() => {
    let filtered = [...filteredUsers]

    if (sortConfig) {
      filtered = filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key]
        let bValue: any = b[sortConfig.key]

        if (sortConfig.key === 'id') {
          aValue = Number(aValue)
          bValue = Number(bValue)
        } else if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
          aValue = new Date(aValue).getTime()
          bValue = new Date(bValue).getTime()
        } else {
          aValue = aValue ? aValue.toString().toLowerCase() : ''
          bValue = bValue ? bValue.toString().toLowerCase() : ''
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [filteredUsers, sortConfig])

  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = getSortedAndFilteredUsers().slice(indexOfFirstUser, indexOfLastUser)

  if (!isAuthenticated) {
    return (
      <div className="admin-orders">
        <AdminSidebar />
        <div className="admin-orders__content">
          <div className="admin-orders__error">
            Please log in to access user management.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-orders">
      <AdminSidebar />
      <div className="admin-orders__content">
        {error && (
          <div className="admin-orders__error">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        <Header onSearch={handleSearch} showSearch={true} title="User Management" />
        
        {/* Filter Section */}
        <div className="admin-customers__filters">
          <div className="admin-customers__filter-group">
            <label htmlFor="roleFilter" className="admin-customers__filter-label">Role:</label>
            <select 
              id="roleFilter"
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="admin-customers__filter-select"
            >
              {ROLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
                setRoleFilter("all")
                setStartDate("")
                setEndDate("")
                setSearchQuery("")
                // Clear the search input in Header component
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
                if (searchInput) {
                  searchInput.value = ''
                }
              }}
              className="admin-customers__clear-filters"
            >
              Clear All Filters
            </button>
        </div>
        <div className="admin-orders__list-container">
          <div className="admin-orders__table-container">
            <table className="admin-orders__table">
              <thead className="admin-orders__table-head">
                <tr>
                  <th onClick={() => handleSort('id')} className="sortable">
                    ID {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('username')} className="sortable">
                    Username {sortConfig?.key === 'username' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('email')} className="sortable">
                    Email {sortConfig?.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('role')} className="sortable">
                    Role {sortConfig?.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('createdAt')} className="sortable">
                    Created At {sortConfig?.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(usersPerPage)].map((_, index) => (
                    <SkeletonRow key={index} />
                  ))
                ) : currentUsers.length > 0 ? (
                  currentUsers.map(user => (
                    <tr key={user.id} className="admin-orders__table-row">
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="admin-orders__no-data">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-orders__pagination-container">
            <div className="admin-orders__pagination-info">
              Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} out of {filteredUsers.length}
            </div>
            <Pagination 
              currentPage={currentPage}
              totalPages={Math.ceil(filteredUsers.length / usersPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminCustomers