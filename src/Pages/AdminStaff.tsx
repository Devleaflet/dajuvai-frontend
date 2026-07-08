import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Header from '../Components/Header';
import { AdminSidebar } from '../Components/AdminSidebar';
import { useDocketHeight } from '../Hook/UseDockerHeight';
import { useAuth } from '../context/AuthContext';
import staffApi, { StaffUser, StaffRegistrationData, ApiResponse } from '../api/staff';
import '../Styles/AdminStaff.css';
import '../Styles/AdminCustomers.css';

interface StaffFormData extends Omit<StaffRegistrationData, 'confirmPassword'> {
  confirmPassword: string;
}

const AdminStaff: React.FC = () => {
  const { token } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<StaffFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<StaffFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [staffToEdit, setStaffToEdit] = useState<StaffUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  type EditFieldErrors = Partial<Record<keyof typeof editFormData, string>>;
  const [editFormErrors, setEditFormErrors] = useState<EditFieldErrors>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const docketHeight = useDocketHeight();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchStaffList();
  }, []);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredStaffList(staffList);
      return;
    }
    setFilteredStaffList(
      staffList.filter(
        (staff) =>
          staff.username.toLowerCase().includes(term) ||
          staff.email.toLowerCase().includes(term)
      )
    );
  }, [staffList, searchTerm]);

  const [filteredStaffList, setFilteredStaffList] = useState<StaffUser[]>([]);

  const fetchStaffList = async () => {
    setLoading(true);
    try {
      const response = await staffApi.getStaffList();
      if (response.success && response.data) {
        // Handle both response formats: direct array or { staff: StaffUser[] }
        let staffData: StaffUser[] = [];
        
        if (Array.isArray(response.data)) {
          staffData = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          const data = response.data as { staff?: StaffUser[] };
          staffData = data.staff || [];
        }
        
        setStaffList(staffData);
      } else if ('message' in response) {
        toast.error(response.message || 'Failed to load staff list');
      }
    } catch (error) {
      console.error('Error fetching staff list:', error);
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<StaffFormData> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name as keyof StaffFormData]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Include confirmPassword and normalize fields as per API spec
      const staffData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      };
      //('Submitting staff data:', staffData);
      
      const response = await staffApi.registerStaff(staffData);
      //('Registration response:', response);

      if (response.success) {
        toast.success('Staff user registered successfully!');
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setShowAddForm(false);
        fetchStaffList(); // Refresh the staff list
      } else {
        // Clear previous errors
        setFormErrors({});
        
        // Type guard to check if response is ErrorResponse
        if ('statusCode' in response) {
          // Specific conflict handling
          if (response.statusCode === 409) {
            setFormErrors({ email: 'Email is already in use' });
          } else if (response.errors) {
            // Normalize errors from array or object shape
            const allowedFields = ['username', 'email', 'password', 'confirmPassword'];
            const newErrors: Partial<StaffFormData> = {};

            if (Array.isArray(response.errors)) {
              response.errors.forEach((err) => {
                if (err.field && allowedFields.includes(err.field)) {
                  newErrors[err.field as keyof StaffFormData] = err.message;
                }
              });
            } else if (typeof response.errors === 'object') {
              Object.entries(response.errors).forEach(([field, messages]) => {
                if (!allowedFields.includes(field)) return;
                if (Array.isArray(messages)) {
                  newErrors[field as keyof StaffFormData] = messages[0];
                } else if (typeof messages === 'string') {
                  newErrors[field as keyof StaffFormData] = messages;
                }
              });
            }

            if (Object.keys(newErrors).length > 0) {
              setFormErrors(newErrors);
              return;
            }
          }
          
          if (response.message) {
            toast.error(response.message);
            return;
          }
        }
        
        // Fallback error
        toast.error('Failed to register staff user. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error in handleSubmit:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (staff: StaffUser) => {
    setStaffToDelete(staff);
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await staffApi.deleteStaff(staffToDelete.id);
      
      if (response.success) {
        toast.success('Staff user deleted successfully');
        fetchStaffList(); // Refresh the staff list
      } else if (response.message) {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to delete staff user');
    } finally {
      setIsDeleting(false);
      setStaffToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setStaffToDelete(null);
  };

  const handleEditClick = (staff: StaffUser) => {
    setStaffToEdit(staff);
    setEditFormData({
      username: staff.username,
      email: staff.email,
      fullName: staff.fullName || '',
      phoneNumber: staff.phoneNumber || '',
      password: '',
      confirmPassword: '',
    });
    setEditFormErrors({});
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (editFormErrors[name as keyof EditFieldErrors]) {
      setEditFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateEditForm = (): boolean => {
    const errors: EditFieldErrors = {};
    if (!editFormData.username.trim()) {
      errors.username = 'Username is required';
    } else if (editFormData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    if (!editFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (editFormData.phoneNumber && !/^[0-9]{7,15}$/.test(editFormData.phoneNumber)) {
      errors.phoneNumber = 'Phone number must be 7-15 digits';
    }
    // Password is optional on edit — only validate if admin is actually changing it
    if (editFormData.password || editFormData.confirmPassword) {
      if (editFormData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(editFormData.password) || !/[a-z]/.test(editFormData.password) ||
        !/[0-9]/.test(editFormData.password) || !/[^A-Za-z0-9]/.test(editFormData.password)) {
        errors.password = 'Must include upper, lower, number, and special character';
      }
      if (editFormData.password !== editFormData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCancelEdit = () => {
    setStaffToEdit(null);
    setEditFormErrors({});
  };

  const handleSaveEdit = async () => {
    if (!staffToEdit || !validateEditForm()) return;

    setIsSavingEdit(true);
    try {
      const payload: Parameters<typeof staffApi.updateStaff>[1] = {
        username: editFormData.username.trim(),
        email: editFormData.email.trim().toLowerCase(),
        fullName: editFormData.fullName.trim() || undefined,
        phoneNumber: editFormData.phoneNumber.trim() || undefined,
      };
      // Only send password fields if the admin actually typed a new password
      if (editFormData.password) {
        payload.password = editFormData.password;
        payload.confirmPassword = editFormData.confirmPassword;
      }

      const response = await staffApi.updateStaff(staffToEdit.id, payload);

      if (response.success) {
        toast.success('Staff user updated successfully');
        // Merge the saved values straight from the response so re-opening the edit
        // dialog immediately reflects them, rather than depending on a second
        // unawaited fetch landing before the user clicks Edit again.
        if (response.data) {
          const saved = response.data;
          setStaffList((prev) =>
            prev.map((s) => (s.id === staffToEdit.id ? { ...s, ...saved } : s))
          );
        }
        setStaffToEdit(null);
        fetchStaffList();
      } else if ('statusCode' in response && response.statusCode === 409) {
        setEditFormErrors({ email: 'Email is already in use' });
      } else if (Array.isArray(response.errors)) {
        const newErrors: EditFieldErrors = {};
        const allowedFields: (keyof typeof editFormData)[] = [
          'username', 'email', 'fullName', 'phoneNumber', 'password', 'confirmPassword',
        ];
        response.errors.forEach((err) => {
          if (err.field && allowedFields.includes(err.field as keyof typeof editFormData)) {
            newErrors[err.field as keyof EditFieldErrors] = err.message;
          }
        });
        setEditFormErrors(newErrors);
      } else {
        toast.error(response.message || 'Failed to update staff user');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error('Failed to update staff user');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="">
     
      <div className="admin-content" style={{display:'flex',height:'100vh'}}>
        <AdminSidebar />
        
        <main className="admin-main" style={{ minHeight: docketHeight, overflow: 'auto', flex: 1, minWidth: 0 }}>
          <div className="admin-categories__content">
             <Header
          title="Staff Management"
          showSearch
          onSearch={setSearchTerm}
        />
            <div className="admin-staff__header">
              <div className="admin-staff__title-section">
                <h1 className="admin-staff__title">Staff Management</h1>
                <p className="admin-staff__subtitle">
                  Manage staff users and their access to the admin panel
                </p>
              </div>
              <button
                className="admin-staff__add-btn"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Add New Staff
              </button>
            </div>

            {showAddForm && (
              <div className="admin-staff__form-container">
                <div className="admin-staff__form-header">
                  <h2>Register New Staff User</h2>
                  <button
                    className="admin-staff__close-btn"
                    onClick={() => setShowAddForm(false)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="admin-staff__form">
                  <div className="admin-staff__form-row">
                    <div className="admin-staff__form-group">
                      <label htmlFor="username" className="admin-staff__label">
                        Username *
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`admin-staff__input ${formErrors.username ? 'admin-staff__input--error' : ''}`}
                        placeholder="Enter username"
                      />
                      {formErrors.username && (
                        <span className="admin-staff__error">{formErrors.username}</span>
                      )}
                    </div>

                    <div className="admin-staff__form-group">
                      <label htmlFor="email" className="admin-staff__label">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`admin-staff__input ${formErrors.email ? 'admin-staff__input--error' : ''}`}
                        placeholder="Enter email address"
                      />
                      {formErrors.email && (
                        <span className="admin-staff__error">{formErrors.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="admin-staff__form-row">
                    <div className="admin-staff__form-group">
                      <label htmlFor="password" className="admin-staff__label">
                        Password *
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`admin-staff__input ${formErrors.password ? 'admin-staff__input--error' : ''}`}
                        placeholder="Enter password"
                      />
                      {formErrors.password && (
                        <span className="admin-staff__error">{formErrors.password}</span>
                      )}
                    </div>

                    <div className="admin-staff__form-group">
                      <label htmlFor="confirmPassword" className="admin-staff__label">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`admin-staff__input ${formErrors.confirmPassword ? 'admin-staff__input--error' : ''}`}
                        placeholder="Confirm password"
                      />
                      {formErrors.confirmPassword && (
                        <span className="admin-staff__error">{formErrors.confirmPassword}</span>
                      )}
                    </div>
                  </div>

                  <div className="admin-staff__form-actions">
                    <button
                      type="button"
                      className="admin-staff__btn admin-staff__btn--secondary"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="admin-staff__btn admin-staff__btn--primary"
                      disabled={submitting}
                    >
                      {submitting ? 'Registering...' : 'Register Staff'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="admin-staff__list">
              <div className="admin-staff__list-header">
                <h3>Staff Users</h3>
                {loading && <span className="admin-staff__loading">Loading...</span>}
              </div>

              {filteredStaffList.length > 0 ? (
                <div className="admin-staff__table-container">
                  <table className="admin-staff__table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaffList.map((staff) => (
                        <tr key={staff.id}>
                          <td>{staff.id}</td>
                          <td>{staff.username}</td>
                          <td>{staff.email}</td>
                          <td>
                            {staff.createdAt 
                              ? new Date(staff.createdAt).toLocaleDateString()
                              : 'N/A'
                            }
                          </td>
                          <td>
                            <button
                              className="admin-staff__action-btn admin-staff__action-btn--edit"
                              onClick={() => handleEditClick(staff)}
                            >
                              Edit
                            </button>
                            <button 
                              className="admin-staff__action-btn admin-staff__action-btn--delete"
                              onClick={() => handleDeleteClick(staff)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-staff__empty">
                  <div className="admin-staff__empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4>{staffList.length === 0 ? 'No Staff Users' : 'No Results Found'}</h4>
                  <p>{staffList.length === 0 ? 'No staff users have been registered yet. Click "Add New Staff" to get started.' : 'No staff users match your current search criteria. Try adjusting your search terms.'}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      {staffToDelete && (
        <div className="admin-staff__dialog-overlay">
          <div className="admin-staff__dialog">
            <h3>Delete Staff User</h3>
            <p>Are you sure you want to delete the staff user <strong>{staffToDelete.username}</strong> ({staffToDelete.email})? This action cannot be undone.</p>
            <div className="admin-staff__dialog-actions">
              <button 
                className="admin-staff__btn admin-staff__btn--secondary"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="admin-staff__btn admin-staff__btn--danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Dialog */}
      {staffToEdit && (
        <div className="admin-staff__dialog-overlay">
          <div className="admin-staff__dialog">
            <h3>Edit Staff User</h3>
            <div className="admin-staff__form-group">
              <label htmlFor="editUsername" className="admin-staff__label">
                Username *
              </label>
              <input
                type="text"
                id="editUsername"
                name="username"
                value={editFormData.username}
                onChange={handleEditInputChange}
                className={`admin-staff__input ${editFormErrors.username ? 'admin-staff__input--error' : ''}`}
              />
              {editFormErrors.username && (
                <span className="admin-staff__error">{editFormErrors.username}</span>
              )}
            </div>
            <div className="admin-staff__form-group">
              <label htmlFor="editEmail" className="admin-staff__label">
                Email *
              </label>
              <input
                type="email"
                id="editEmail"
                name="email"
                value={editFormData.email}
                onChange={handleEditInputChange}
                className={`admin-staff__input ${editFormErrors.email ? 'admin-staff__input--error' : ''}`}
              />
              {editFormErrors.email && (
                <span className="admin-staff__error">{editFormErrors.email}</span>
              )}
            </div>
            <div className="admin-staff__form-group">
              <label htmlFor="editFullName" className="admin-staff__label">
                Full Name
              </label>
              <input
                type="text"
                id="editFullName"
                name="fullName"
                value={editFormData.fullName}
                onChange={handleEditInputChange}
                className={`admin-staff__input ${editFormErrors.fullName ? 'admin-staff__input--error' : ''}`}
              />
              {editFormErrors.fullName && (
                <span className="admin-staff__error">{editFormErrors.fullName}</span>
              )}
            </div>
            <div className="admin-staff__form-group">
              <label htmlFor="editPhoneNumber" className="admin-staff__label">
                Phone Number
              </label>
              <input
                type="text"
                id="editPhoneNumber"
                name="phoneNumber"
                value={editFormData.phoneNumber}
                onChange={handleEditInputChange}
                className={`admin-staff__input ${editFormErrors.phoneNumber ? 'admin-staff__input--error' : ''}`}
                placeholder="Digits only"
              />
              {editFormErrors.phoneNumber && (
                <span className="admin-staff__error">{editFormErrors.phoneNumber}</span>
              )}
            </div>
            <div className="admin-staff__form-row">
              <div className="admin-staff__form-group">
                <label htmlFor="editPassword" className="admin-staff__label">
                  New Password
                </label>
                <input
                  type="password"
                  id="editPassword"
                  name="password"
                  value={editFormData.password}
                  onChange={handleEditInputChange}
                  className={`admin-staff__input ${editFormErrors.password ? 'admin-staff__input--error' : ''}`}
                  placeholder="Leave blank to keep current password"
                />
                {editFormErrors.password && (
                  <span className="admin-staff__error">{editFormErrors.password}</span>
                )}
              </div>
              <div className="admin-staff__form-group">
                <label htmlFor="editConfirmPassword" className="admin-staff__label">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="editConfirmPassword"
                  name="confirmPassword"
                  value={editFormData.confirmPassword}
                  onChange={handleEditInputChange}
                  className={`admin-staff__input ${editFormErrors.confirmPassword ? 'admin-staff__input--error' : ''}`}
                />
                {editFormErrors.confirmPassword && (
                  <span className="admin-staff__error">{editFormErrors.confirmPassword}</span>
                )}
              </div>
            </div>
            <div className="admin-staff__dialog-actions">
              <button
                className="admin-staff__btn admin-staff__btn--secondary"
                onClick={handleCancelEdit}
                disabled={isSavingEdit}
              >
                Cancel
              </button>
              <button
                className="admin-staff__btn admin-staff__btn--primary"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaff;