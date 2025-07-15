import React, { useEffect, useState } from 'react';
import { AdminSidebar } from '../Components/AdminSidebar';
import Header from '../Components/Header';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../Styles/AdminCategory.css';

interface Subcategory {
  id: number;
  name: string;
  image?: string;
  category?: {
    id: number;
    name: string;
  };
  createdBy?: {
    id: number;
    username: string;
  };
}

interface Category {
  id: number;
  name: string;
  image?: string;
  createdBy?: {
    id: number;
    username: string;
  };
  subcategories?: Subcategory[];
}

const CACHE_KEY = 'admin_categories';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const PAGE_SIZE = 7;

const AdminCategory: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<{ show: boolean; category: Category | null }>({ show: false, category: null });
  const [showDeleteModal, setShowDeleteModal] = useState<{ show: boolean; category: Category | null }>({ show: false, category: null });
  const [showSubcategoryModal, setShowSubcategoryModal] = useState<{ show: boolean; categoryId: number | null }>({ show: false, categoryId: null });
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryStatus, setNewCategoryStatus] = useState('Active');
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
  const [newCategoryImagePreview, setNewCategoryImagePreview] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');
  const [editCategoryStatus, setEditCategoryStatus] = useState('Active');
  const [editCategoryImage, setEditCategoryImage] = useState<File | null>(null);
  const [editCategoryImagePreview, setEditCategoryImagePreview] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [showEditSubcategoryModal, setShowEditSubcategoryModal] = useState<{ show: boolean; categoryId: number | null; subcategory: Subcategory | null }>({ show: false, categoryId: null, subcategory: null });
  const [showDeleteSubcategoryModal, setShowDeleteSubcategoryModal] = useState<{ show: boolean; categoryId: number | null; subcategory: Subcategory | null }>({ show: false, categoryId: null, subcategory: null });
  const [editSubcategoryName, setEditSubcategoryName] = useState('');

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Array.isArray(data) && Date.now() - timestamp < CACHE_TTL) {
          setCategories(data);
          setLoading(false);
        }
      } catch {}
    }
    fetchCategories();
  }, [token, isAuthenticated]);

  const fetchCategories = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/category`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      const transformedData = data.data.map((category: any) => ({
        ...category,
        image: category.image_url || category.image
      }));
      setCategories(transformedData);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: transformedData, timestamp: Date.now() }));
    } catch (err) {
      setError('Failed to load categories');
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setNewCategoryImage(file);
      setNewCategoryImagePreview(URL.createObjectURL(file));
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light"
      });
    } else {
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light"
      });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return showToast('Category name required', 'error');

    try {
      const formData = new FormData();
      formData.append('name', newCategoryName.trim());
      formData.append('description', newCategoryDescription.trim());
      formData.append('status', newCategoryStatus);
      if (newCategoryImage) {
        formData.append('image', newCategoryImage);
      }

      const response = await fetch(`${API_BASE_URL}/api/category`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCategories(prev => [...prev, {
          ...data.data,
          image: data.data.image_url || data.data.image
        }]);
        setShowAddModal(false);
        setNewCategoryName('');
        setNewCategoryDescription('');
        setNewCategoryStatus('Active');
        setNewCategoryImage(null);
        setNewCategoryImagePreview(null);
        showToast('Category added successfully! 🎉', 'success');
      } else {
        showToast(data.message || 'Failed to add category', 'error');
      }
    } catch (err) {
      showToast('Failed to add category', 'error');
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal.category) return;
    if (!editCategoryName.trim()) return showToast('Category name required', 'error');

    try {
      const formData = new FormData();
      formData.append('name', editCategoryName.trim());
      formData.append('description', editCategoryDescription.trim());
      formData.append('status', editCategoryStatus);
      if (editCategoryImage) {
        formData.append('image', editCategoryImage);
      }

      const response = await fetch(`${API_BASE_URL}/api/category/${showEditModal.category.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCategories(prev => prev.map(c => c.id === data.data.id ? {
          ...data.data,
          image: data.data.image_url || data.data.image
        } : c));
        setShowEditModal({ show: false, category: null });
        setEditCategoryName('');
        setEditCategoryDescription('');
        setEditCategoryStatus('Active');
        setEditCategoryImage(null);
        setEditCategoryImagePreview(null);
        showToast('Category updated successfully! ✨', 'success');
      } else {
        showToast(data.message || 'Failed to update category', 'error');
      }
    } catch (err) {
      showToast('Failed to update category', 'error');
    }
  };

  const handleDeleteCategory = async () => {
    if (!showDeleteModal.category) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/category/${showDeleteModal.category.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCategories(prev => prev.filter(c => c.id !== showDeleteModal.category!.id));
        setShowDeleteModal({ show: false, category: null });
        showToast('Category deleted successfully! 🗑️', 'success');
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to delete category', 'error');
      }
    } catch (err) {
      showToast('Failed to delete category', 'error');
    }
  };

  const handleSaveSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSubcategoryModal.categoryId) return;
    if (!newSubcategoryName.trim()) return showToast('Subcategory name required', 'error');

    try {
      const formData = new FormData();
      formData.append('name', newSubcategoryName.trim());
      if (newCategoryImage) {
        formData.append('image', newCategoryImage);
      }

      const response = await fetch(`${API_BASE_URL}/api/categories/${showSubcategoryModal.categoryId}/subcategories`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCategories(prev => prev.map(cat => {
          if (cat.id === showSubcategoryModal.categoryId) {
            return {
              ...cat,
              subcategories: [...(cat.subcategories || []), {
                ...data.data,
                image: data.data.image_url || data.data.image
              }]
            };
          }
          return cat;
        }));
        setShowSubcategoryModal({ show: false, categoryId: null });
        setNewSubcategoryName('');
        setNewCategoryImage(null);
        setNewCategoryImagePreview(null);
        showToast('Subcategory added successfully! 🎉', 'success');
      } else {
        showToast(data.message || 'Failed to add subcategory', 'error');
      }
    } catch (err) {
      console.error('Save subcategory error:', err);
      showToast('Failed to add subcategory', 'error');
    }
  };

  const handleEditSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditSubcategoryModal.subcategory) return;
    if (!editSubcategoryName.trim()) return showToast('Subcategory name required', 'error');

    try {
      const formData = new FormData();
      formData.append('name', editSubcategoryName.trim());
      if (editCategoryImage) {
        formData.append('image', editCategoryImage);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/categories/${showEditSubcategoryModal.categoryId}/subcategories/${showEditSubcategoryModal.subcategory.id}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setCategories(prev => prev.map(cat => {
          if (cat.id === showEditSubcategoryModal.categoryId) {
            return {
              ...cat,
              subcategories: cat.subcategories?.map(sub => 
                sub.id === data.data.id ? {
                  ...data.data,
                  image: data.data.image_url || data.data.image
                } : sub
              ) || []
            };
          }
          return cat;
        }));
        setShowEditSubcategoryModal({ show: false, categoryId: null, subcategory: null });
        setEditSubcategoryName('');
        setEditCategoryImage(null);
        setEditCategoryImagePreview(null);
        showToast('Subcategory updated successfully! ✨', 'success');
      } else {
        showToast(data.message || 'Failed to update subcategory', 'error');
      }
    } catch (err) {
      console.error('Update subcategory error:', err);
      showToast('Failed to update subcategory', 'error');
    }
  };

  const handleDeleteSubCategory = async () => {
    if (!showDeleteSubcategoryModal.subcategory) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/categories/${showDeleteSubcategoryModal.categoryId}/subcategories/${showDeleteSubcategoryModal.subcategory.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setCategories(prev => prev.map(cat => {
          if (cat.id === showDeleteSubcategoryModal.categoryId) {
            return {
              ...cat,
              subcategories: cat.subcategories?.filter(sub => sub.id !== showDeleteSubcategoryModal.subcategory!.id) || []
            };
          }
          return cat;
        }));
        setShowDeleteSubcategoryModal({ show: false, categoryId: null, subcategory: null });
        showToast('Subcategory deleted successfully! 🗑️', 'success');
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to delete subcategory', 'error');
      }
    } catch (err) {
      showToast('Failed to delete subcategory', 'error');
    }
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.subcategories?.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCategories.length / PAGE_SIZE);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const renderSkeleton = () => (
    Array.from({ length: PAGE_SIZE }).map((_, index) => (
      <tr key={index} className="admin-category__skeleton-row">
        <td><div className="admin-category__skeleton admin-category__skeleton-id"></div></td>
        <td><div className="admin-category__skeleton admin-category__skeleton-name"></div></td>
        <td><div className="admin-category__skeleton admin-category__skeleton-subcategories"></div></td>
        <td>
          <div className="admin-category__skeleton admin-category__skeleton-btn"></div>
          <div className="admin-category__skeleton admin-category__skeleton-btn"></div>
        </td>
      </tr>
    ))
  );

  return (
    <div className="admin-category">
      <AdminSidebar />
      <div className="admin-category__content">
        <Header onSearch={() => {}} showSearch={false} />
        <div className="admin-category__header-row">
          <h1 className="admin-category__title">Category Management</h1>
          <button className="admin-category__add-btn" onClick={() => setShowAddModal(true)}>
            <FiPlus style={{ marginRight: 8, verticalAlign: 'middle' }} /> Add Category
          </button>
        </div>
        <div className="admin-category__search-row">
          <input
            className="admin-category__search-input"
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="admin-category__table-container">
          {error ? (
            <div className="admin-category__error">{error}</div>
          ) : (
            <>
              <table className="admin-category__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Subcategories</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? renderSkeleton() : paginatedCategories.map((category) => (
                    <React.Fragment key={category.id}>
                      <tr>
                        <td>{category.id}</td>
                        <td>{category.name}</td>
                        <td>
                          <button
                            className="admin-category__toggle-btn"
                            onClick={() => toggleCategory(category.id)}
                          >
                            {expandedCategories.has(category.id) ? <FiChevronUp /> : <FiChevronDown />}
                            {category.subcategories?.length || 0} subcategories
                          </button>
                        </td>
                        <td>
                          <button
                            className="admin-category__edit-btn"
                            title="Edit"
                            onClick={() => { setShowEditModal({ show: true, category }); setEditCategoryName(category.name); }}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="admin-category__delete-btn"
                            title="Delete"
                            onClick={() => setShowDeleteModal({ show: true, category })}
                          >
                            <FiTrash2 />
                          </button>
                          <button
                            className="admin-category__add-sub-btn"
                            title="Add Subcategory"
                            onClick={() => setShowSubcategoryModal({ show: true, categoryId: category.id })}
                          >
                            <FiPlus />
                          </button>
                        </td>
                      </tr>
                      {expandedCategories.has(category.id) && category.subcategories?.map((subcategory) => (
                        <tr key={subcategory.id} className="admin-category__subcategory-row">
                          <td>{subcategory.id}</td>
                          <td colSpan={2}>{subcategory.name}</td>
                          <td>
                            <button
                              className="admin-category__edit-btn"
                              title="Edit"
                              onClick={() => {
                                setShowEditSubcategoryModal({ show: true, categoryId: category.id, subcategory });
                                setEditSubcategoryName(subcategory.name);
                              }}
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              className="admin-category__delete-btn"
                              title="Delete"
                              onClick={() => {
                                setShowDeleteSubcategoryModal({ show: true, categoryId: category.id, subcategory });
                              }}
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  {!loading && paginatedCategories.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>No categories found.</td></tr>
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="admin-category__pagination">
                  <button
                    className="admin-category__pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >Prev</button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`admin-category__pagination-btn${currentPage === i + 1 ? ' active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >{i + 1}</button>
                  ))}
                  <button
                    className="admin-category__pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >Next</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Category Modal */}
        {showAddModal && (
          <div className="admin-category__modal-overlay">
            <div className="admin-category__modal">
              <h2>Add Category</h2>
              <form onSubmit={handleAddCategory}>
                <input
                  type="text"
                  placeholder="Category Name"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Category Description"
                  value={newCategoryDescription}
                  onChange={e => setNewCategoryDescription(e.target.value)}
                />
                <select
                  value={newCategoryStatus}
                  onChange={e => setNewCategoryStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <div className="admin-category__image-upload">
                  <label className="admin-category__image-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <span className="admin-category__image-upload-button">Choose Image</span>
                  </label>
                  {newCategoryImagePreview && (
                    <div className="admin-category__image-preview-container">
                      <img src={newCategoryImagePreview} alt="Preview" className="admin-category__image-preview" />
                      <button
                        type="button"
                        className="admin-category__image-remove"
                        onClick={() => {
                          setNewCategoryImage(null);
                          setNewCategoryImagePreview(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div className="admin-category__modal-actions">
                  <button type="submit">Add</button>
                  <button type="button" onClick={() => {
                    setShowAddModal(false);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                    setNewCategoryStatus('Active');
                    setNewCategoryImage(null);
                    setNewCategoryImagePreview(null);
                  }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {showEditModal.show && showEditModal.category && (
          <div className="admin-category__modal-overlay">
            <div className="admin-category__modal">
              <h2>Edit Category</h2>
              <form onSubmit={handleEditCategory}>
                <input
                  type="text"
                  placeholder="Category Name"
                  value={editCategoryName}
                  onChange={e => setEditCategoryName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Category Description"
                  value={editCategoryDescription}
                  onChange={e => setEditCategoryDescription(e.target.value)}
                />
                <select
                  value={editCategoryStatus}
                  onChange={e => setEditCategoryStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <div className="admin-category__image-upload">
                  <label className="admin-category__image-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <span className="admin-category__image-upload-button">Choose Image</span>
                  </label>
                  {(editCategoryImagePreview || showEditModal.category.image) && (
                    <div className="admin-category__image-preview-container">
                      <img 
                        src={editCategoryImagePreview || showEditModal.category.image} 
                        alt="Preview" 
                        className="admin-category__image-preview" 
                      />
                      <button
                        type="button"
                        className="admin-category__image-remove"
                        onClick={() => {
                          setEditCategoryImage(null);
                          setEditCategoryImagePreview(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div className="admin-category__modal-actions">
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => {
                    setShowEditModal({ show: false, category: null });
                    setEditCategoryName('');
                    setEditCategoryDescription('');
                    setEditCategoryStatus('Active');
                    setEditCategoryImage(null);
                    setEditCategoryImagePreview(null);
                  }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Category Modal */}
        {showDeleteModal.show && showDeleteModal.category && (
          <div className="admin-category__modal-overlay">
            <div className="admin-category__modal">
              <h2>Delete Category</h2>
              <p>Are you sure you want to delete <b>{showDeleteModal.category.name}</b>?</p>
              <div className="admin-category__modal-actions">
                <button onClick={handleDeleteCategory}>Delete</button>
                <button onClick={() => setShowDeleteModal({ show: false, category: null })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Subcategory Modal */}
        {showSubcategoryModal.show && showSubcategoryModal.categoryId && (
          <div className="admin-category__modal-overlay">
            <div className="admin-category__modal">
              <h2>Add Subcategory</h2>
              <form onSubmit={handleSaveSubCategory}>
                <input
                  type="text"
                  placeholder="Subcategory Name"
                  value={newSubcategoryName}
                  onChange={e => setNewSubcategoryName(e.target.value)}
                  required
                />
                <div className="admin-category__image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {newCategoryImagePreview && (
                    <img src={newCategoryImagePreview} alt="Preview" className="admin-category__image-preview" />
                  )}
                </div>
                <div className="admin-category__modal-actions">
                  <button type="submit">Add</button>
                  <button type="button" onClick={() => {
                    setShowSubcategoryModal({ show: false, categoryId: null });
                    setNewSubcategoryName('');
                    setNewCategoryImage(null);
                    setNewCategoryImagePreview(null);
                  }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Subcategory Modal */}
        {showEditSubcategoryModal.show && showEditSubcategoryModal.categoryId && showEditSubcategoryModal.subcategory && (
          <div className="admin-category__modal-overlay">
            <div className="admin-category__modal">
              <h2>Edit Subcategory</h2>
              <form onSubmit={handleEditSubCategory}>
                <input
                  type="text"
                  placeholder="Subcategory Name"
                  value={editSubcategoryName}
                  onChange={e => setEditSubcategoryName(e.target.value)}
                  required
                />
                <div className="admin-category__image-upload">
                  <label className="admin-category__image-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <span className="admin-category__image-upload-button">Choose Image</span>
                  </label>
                  {(editCategoryImagePreview || showEditSubcategoryModal.subcategory.image) && (
                    <div className="admin-category__image-preview-container">
                      <img 
                        src={editCategoryImagePreview || showEditSubcategoryModal.subcategory.image} 
                        alt="Preview" 
                        className="admin-category__image-preview" 
                      />
                      <button
                        type="button"
                        className="admin-category__image-remove"
                        onClick={() => {
                          setEditCategoryImage(null);
                          setEditCategoryImagePreview(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div className="admin-category__modal-actions">
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => {
                    setShowEditSubcategoryModal({ show: false, categoryId: null, subcategory: null });
                    setEditSubcategoryName('');
                    setEditCategoryImage(null);
                    setEditCategoryImagePreview(null);
                  }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Subcategory Modal */}
        {showDeleteSubcategoryModal.show && showDeleteSubcategoryModal.categoryId && showDeleteSubcategoryModal.subcategory && (
          <div className="admin-category__modal-overlay">
            <div className="admin-category__modal">
              <h2>Delete Subcategory</h2>
              <p>Are you sure you want to delete <b>{showDeleteSubcategoryModal.subcategory.name}</b>?</p>
              <div className="admin-category__modal-actions">
                <button onClick={handleDeleteSubCategory}>Delete</button>
                <button onClick={() => setShowDeleteSubcategoryModal({ show: false, categoryId: null, subcategory: null })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </div>
  );
};

export default AdminCategory;