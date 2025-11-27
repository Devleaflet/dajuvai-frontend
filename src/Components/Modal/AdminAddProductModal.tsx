import React, { useState, useEffect } from 'react';
import { ProductFormData } from '../../types/product';
import { fetchCategories, fetchSubcategories, Category, Subcategory } from '../../api/categories';
import '../../Styles/ProductModal.css';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

interface Vendor {
  id: number;
  businessName: string;
  email: string;
}

interface AdminAddProductModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (product: ProductFormData, categoryId: number, subcategoryId: number, token: string, role: 'admin' | 'vendor') => Promise<void>;
  role: 'admin' | 'vendor';
}

const AdminAddProductModal: React.FC<AdminAddProductModalProps> = ({ show, onClose, onAdd, role }) => {
  const { token, user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    miniDescription: '',
    longDescription: '',
    basePrice: '',
    stock: 0,
    discount: '0',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT',
    size: [] as string[],
    status: 'AVAILABLE' as 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED',
    productImages: [] as (File | string)[],
    categoryId: 0,
    subcategoryId: 0,
    brand_id: null as number | null,
    dealId: null as number | null,
    quantity: 0,
    vendorId: '',
    inventory: [] as { sku: string; quantity: number; status: string }[],
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        setErrors(prev => ({ ...prev, general: 'Failed to load categories' }));
        console.error(err);
      }
    };

    const loadVendors = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/vendors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
          setVendors(result.data);
        }
      } catch (err) {
        setErrors(prev => ({ ...prev, general: 'Failed to load vendors' }));
        console.error(err);
      }
    };

    if (show) {
      loadCategories();
      loadVendors();
    }
  }, [show, token]);

  useEffect(() => {
    const loadSubcategories = async () => {
      if (selectedCategory) {
        try {
          const data = await fetchSubcategories(selectedCategory);
          setSubcategories(data);
        } catch (err) {
          setErrors(prev => ({ ...prev, general: 'Failed to load subcategories' }));
          console.error(err);
        }
      } else {
        setSubcategories([]);
      }
    };
    loadSubcategories();
  }, [selectedCategory]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      vendorId: selectedVendorId ? String(selectedVendorId) : '',
      inventory: prev.inventory || [],
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : parseFloat(value);
    setFormData(prev => ({
      ...prev,
      [name]: numValue,
      vendorId: selectedVendorId ? String(selectedVendorId) : '',
      inventory: prev.inventory || [],
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = Number(e.target.value);
    setSelectedCategory(categoryId);
    setFormData(prev => ({
      ...prev,
      categoryId,
      subcategoryId: 0,
    }));
    setErrors(prev => ({ ...prev, categoryId: '', subcategoryId: '' }));
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subcategoryId = Number(e.target.value);
    setFormData(prev => ({
      ...prev,
      subcategoryId,
    }));
    setErrors(prev => ({ ...prev, subcategoryId: '' }));
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = Number(e.target.value);
    setSelectedVendorId(vendorId);
    setFormData(prev => ({
      ...prev,
      vendorId: String(vendorId),
    }));
    setErrors(prev => ({ ...prev, vendorId: '' }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 5) {
        setErrors(prev => ({ ...prev, images: 'Maximum 5 images allowed' }));
        return;
      }
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
      setFormData(prev => ({
        ...prev,
        productImages: files,
      }));
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index),
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.miniDescription?.trim()) {
      newErrors.miniDescription = 'Product mini description is required';
    }
    if (!formData.longDescription?.trim()) {
      newErrors.longDescription = 'Product long description is required';
    }
    const price = parseFloat(formData.basePrice?.toString() || '0');
    if (isNaN(price) || price <= 0) {
      newErrors.basePrice = 'Base price must be a valid positive number';
    }
    if (typeof formData.stock !== 'number' || formData.stock < 0) {
      newErrors.stock = 'Stock must be a valid non-negative number';
    }
    if (typeof formData.quantity !== 'number' || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be a valid positive number';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    if (!formData.subcategoryId) {
      newErrors.subcategoryId = 'Subcategory is required';
    }
    if (!selectedVendorId) {
      newErrors.vendorId = 'Vendor is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      //("AdminAddProductModal - User data:", user);
      //("AdminAddProductModal - User role:", user?.role);
      //("AdminAddProductModal - Token:", token ? "Present" : "Missing");

      if (!user || !token) {
        setErrors(prev => ({ ...prev, general: 'Authentication required' }));
        return;
      }

      if (!validateForm()) {
        setErrors(prev => ({ ...prev, general: 'Please fix the validation errors' }));
        return;
      }

      const productData: ProductFormData = {
        name: formData.name,
        miniDescription: formData.miniDescription,
        basePrice: formData.basePrice || 0,
        stock: formData.stock || 0,
        discount: formData.discount || null,
        discountType: formData.discountType || null,
        size: formData.size || [],
        status: formData.status || 'AVAILABLE',
        productImages: formData.productImages,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId,
        quantity: formData.quantity || 0,
        brand_id: formData.brand_id || null,
        dealId: formData.dealId || null,
        inventory: formData.inventory || [],
        vendorId: String(selectedVendorId),
      };

      //("AdminAddProductModal - Sending payload:", productData);
      //("AdminAddProductModal - Category ID:", formData.categoryId);
      //("AdminAddProductModal - Subcategory ID:", formData.subcategoryId);
      //("AdminAddProductModal - Token:", token ? "Present" : "Missing");

      await onAdd(productData, formData.categoryId, formData.subcategoryId, token, role);
      onClose();
    } catch (err: any) {
      console.error("AdminAddProductModal - Error creating product:", err);
      setErrors(prev => ({ ...prev, general: err.message || 'Failed to create product' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  if (!show) return null;

  return (
    <div className={`product-modal ${show ? 'open' : ''}`}>
      <div className="product-modal__content">
        <div className="product-modal__header">
          <h2 className="product-modal__title">Add New Product</h2>
          <button onClick={onClose} className="product-modal__close">
            <span className="sr-only">Close</span>
            <svg className="product-modal__close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errors.general && (
          <div className="product-modal__error">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="product-modal__form">
          <div className="product-modal__section">
            <div className="product-modal__row">
              <div className="product-modal__field">
                <label className="product-modal__label">Category *</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleCategoryChange}
                  required
                  className="product-modal__select"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <span className="product-modal__error">{errors.categoryId}</span>}
              </div>

              <div className="product-modal__field">
                <label className="product-modal__label">Subcategory *</label>
                <select
                  name="subcategoryId"
                  value={formData.subcategoryId}
                  onChange={handleSubcategoryChange}
                  required
                  disabled={!formData.categoryId}
                  className="product-modal__select"
                >
                  <option value="">Select a subcategory</option>
                  {subcategories.map(subcategory => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
                {errors.subcategoryId && <span className="product-modal__error">{errors.subcategoryId}</span>}
              </div>
            </div>
          </div>

          <div className="product-modal__section">
            <div className="product-modal__field">
              <label className="product-modal__label">Vendor *</label>
              <select
                name="vendorId"
                value={selectedVendorId || ""}
                onChange={handleVendorChange}
                required
                className="product-modal__select"
              >
                <option value="">Select a vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.businessName}
                  </option>
                ))}
              </select>
              {errors.vendorId && <span className="product-modal__error">{errors.vendorId}</span>}
            </div>
          </div>

          <div className="product-modal__section">
            <div className="product-modal__field">
              <label className="product-modal__label">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="product-modal__input"
              />
              {errors.name && <span className="product-modal__error">{errors.name}</span>}
            </div>

            <div className="product-modal__field">
              <label className="product-modal__label">Mini Description *</label>
              <textarea
                name="description"
                value={formData.miniDescription}
                onChange={handleInputChange}
                required
                rows={3}
                className="product-modal__textarea"
              />
              {errors.miniDescription && <span className="product-modal__error">{errors.miniDescription}</span>}
            </div>
          </div>
            <div className="product-modal__field">
              <label className="product-modal__label">Mini Description *</label>
              <textarea
                name="longdescription"
                value={formData.longDescription}
                onChange={handleInputChange}
                required
                rows={3}
                className="product-modal__textarea"
              />
              {errors.longDescription && <span className="product-modal__error">{errors.longDescription}</span>}
            </div>
          </div>

          <div className="product-modal__section">
            <div className="product-modal__row">
              <div className="product-modal__field">
                <label className="product-modal__label">Base Price *</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice !== undefined && formData.basePrice !== null ? String(formData.basePrice) : ''}
                  onChange={handleNumberInputChange}
                  required
                  min="0.01"
                  step="0.01"
                  className="product-modal__input"
                />
                {errors.basePrice && <span className="product-modal__error">{errors.basePrice}</span>}
              </div>

              <div className="product-modal__field">
                <label className="product-modal__label">Stock *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleNumberInputChange}
                  required
                  min="0"
                  className="product-modal__input"
                />
                {errors.stock && <span className="product-modal__error">{errors.stock}</span>}
              </div>
            </div>
          </div>

          <div className="product-modal__section">
            <div className="product-modal__row">
              <div className="product-modal__field">
                <label className="product-modal__label">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleNumberInputChange}
                  required
                  min="1"
                  className="product-modal__input"
                />
                {errors.quantity && <span className="product-modal__error">{errors.quantity}</span>}
              </div>

              <div className="product-modal__field">
                <label className="product-modal__label">Brand ID</label>
                <input
                  type="number"
                  name="brand_id"
                  value={formData.brand_id || ''}
                  onChange={handleNumberInputChange}
                  className="product-modal__input"
                />
              </div>
            </div>
          </div>

          <div className="product-modal__section">
            <div className="product-modal__row">
              <div className="product-modal__field">
                <label className="product-modal__label">Discount</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleNumberInputChange}
                  min="0"
                  step="0.01"
                  className="product-modal__input"
                />
              </div>

              <div className="product-modal__field">
                <label className="product-modal__label">Discount Type</label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className="product-modal__select"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>
            </div>
          </div>

          <div className="product-modal__section">
            <div className="product-modal__field">
              <label className="product-modal__label">Size</label>
              <input
                type="text"
                name="size"
                value={formData.size.join(', ')}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  size: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                }))}
                placeholder="e.g., S,M,L"
                className="product-modal__input"
              />
            </div>

            <div className="product-modal__field">
              <label className="product-modal__label">Deal ID</label>
              <input
                type="number"
                name="dealId"
                value={formData.dealId || ''}
                onChange={handleNumberInputChange}
                className="product-modal__input"
              />
            </div>
          </div>

          <div className="product-modal__section">
            <div className="product-modal__field">
              <label className="product-modal__label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="product-modal__select"
              >
                <option value="AVAILABLE">Available</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="DISCONTINUED">Discontinued</option>
              </select>
            </div>
          </div>

          <div className="product-modal__section">
            <div className="product-modal__field">
              <label className="product-modal__label">Product Images (up to 5)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange} // Removed duplicate 'multiple' attribute
                className="product-modal__input"
              />
              {errors.images && <span className="product-modal__error">{errors.images}</span>}
              {imagePreviews.length > 0 && (
                <div className="image-previews__product-modal">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="product-modal__image-preview">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="button product-modal__remove-image" // Fixed className with space-separated classes
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="product-modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="product-modal__button product-modal__button--secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="product-modal__button product-modal__button--primary orange-btn"
              style={{ backgroundColor: '#ff6600', color: '#fff', border: 'none', opacity: loading ? 0.7 : 1, background: '#ff6600 !important' }}
            >
              {loading ? 'Loading...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add spinner animation
const style = document.createElement('style');
style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style);

export default AdminAddProductModal;