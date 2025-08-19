import React, { useState, useEffect, useCallback } from 'react';
import { useVendorAuth } from '../../context/VendorAuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../../Styles/NewProductModal.css';

// Types
type InventoryStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'DISCONTINUED' | 'AVAILABLE' | 'UNAVAILABLE';

interface ProductVariant {
  sku: string;
  price: number;
  stock: number;
  status: InventoryStatus;
  attributes: Array<{ type: string; value: string }>;
  images: string[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: number;
  subcategoryId: number;
  hasVariants: boolean;
  basePrice?: number;
  stock?: number;
  status: InventoryStatus;
  discount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  dealId?: string;
  images: string[];
  variants?: ProductVariant[];
}

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
}

// Form data interface used for local state
interface EditProductFormData {
  name: string;
  description: string;
  categoryId: string | number;
  subcategoryId: string | number;
  hasVariants: boolean;
  basePrice?: number | null;
  stock?: number;
  status: InventoryStatus;
  discount?: number | null;
  discountType?: 'PERCENTAGE' | 'FLAT';
  dealId?: string | number | undefined;
  productImages: string[];
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (success: boolean) => void;
  product: Product | null;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
}) => {
  const { authState } = useVendorAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    categoryId: product?.categoryId ? String(product.categoryId) : '',
    subcategoryId: product?.subcategoryId ? String(product.subcategoryId) : '',
    hasVariants: product?.hasVariants || false,
    basePrice: product?.basePrice || 0,
    stock: product?.stock || 0,
    status: (product?.status as InventoryStatus) || 'AVAILABLE',
    discount: product?.discount,
    discountType: product?.discountType,
    dealId: product?.dealId,
    productImages: product?.images || [],
  });

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    product?.categoryId || null
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(
    product?.subcategoryId || null
  );
  const [deals, setDeals] = useState<Array<{id: string; name: string}>>([]);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [attributeSpecs, setAttributeSpecs] = useState<Array<{ type: string; valuesText: string }>>([]);

  // State for form data
  // (Duplicate state removed)

  // Add auth state (using VendorAuthContext's authState)

  // Variant state
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newAttribute, setNewAttribute] = useState<{
    type: string;
    values: Array<{
      value: string;
      nestedAttributes?: Array<{ type: string; values: string[] }>;
    }>;
  }>({
    type: '',
    values: [{ value: '', nestedAttributes: [] }]
  });

  const handleCategoryChange = async (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setFormData(prev => ({ 
      ...prev, 
      subcategoryId: '',
      categoryId: String(categoryId)
    }));

    if (categoryId > 0) {
      try {
        const subcategories = await fetchSubcategories(categoryId);
        setSubcategories(subcategories || []);
      } catch (error) {
        console.error('Error loading subcategories:', error);
        toast.error('Failed to load subcategories');
      }
    } else {
      setSubcategories([]);
    }
  };

  const handleInputChange = (field: keyof EditProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add a new variant
  const addVariant = useCallback(() => {
    const newVariant: ProductVariant = {
      sku: `VARIANT-${Date.now()}`,
      price: 0,
      stock: 0,
      status: 'AVAILABLE',
      attributes: [],
      images: []
    };
    setVariants(prev => [...prev, newVariant]);
  }, []);

  // Remove a variant
  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  // Handle image uploads
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return [];
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/product/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${authState.token}`
          }
        }
      );

      const imageUrls = response.data.urls || [];
      setExistingImages(prev => [...prev, ...imageUrls]);
      return imageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      return [];
    }
  }, [authState.token]);

  // Simple helper to parse comma-separated values
  const parseValues = (text: string): string[] =>
    text
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

  // Update a variant by index; supports key/value or partial object
  const updateVariant = (index: number, keyOrPartial: keyof ProductVariant | Partial<ProductVariant>, value?: any) => {
    setVariants(prev => {
      const next = [...prev];
      const current = { ...(next[index] || {}) } as ProductVariant;
      if (typeof keyOrPartial === 'string') {
        // @ts-ignore - allow dynamic assignment
        (current as any)[keyOrPartial] = value;
      } else {
        Object.assign(current, keyOrPartial);
      }
      next[index] = current;
      return next;
    });
  };

  // Add attribute to a specific variant from newAttribute state
  const addAttribute = (variantIndex: number) => {
    const type = newAttribute.type.trim();
    const value = (newAttribute.values[0]?.value || '').trim();
    if (!type || !value) return;
    setVariants(prev => {
      const next = [...prev];
      const attrs = Array.isArray(next[variantIndex]?.attributes) ? [...next[variantIndex].attributes] : [];
      attrs.push({ type, value });
      next[variantIndex] = { ...next[variantIndex], attributes: attrs } as ProductVariant;
      return next;
    });
    setNewAttribute({ type: '', values: [{ value: '', nestedAttributes: [] }] });
  };

  // Remove attribute from a specific variant
  const removeAttribute = (variantIndex: number, attrIndex: number) => {
    setVariants(prev => {
      const next = [...prev];
      const attrs = Array.isArray(next[variantIndex]?.attributes) ? [...next[variantIndex].attributes] : [];
      attrs.splice(attrIndex, 1);
      next[variantIndex] = { ...next[variantIndex], attributes: attrs } as ProductVariant;
      return next;
    });
  };

  // Format attributes for display in variant header
  const formatVariantAttributes = (attrs: Array<{ type: string; value: string }> = []) =>
    (attrs || [])
      .map(a => `${a.type}: ${a.value}`)
      .join(', ');

  // Fetch subcategories for a category
  const fetchSubcategories = async (categoryId: number): Promise<Subcategory[]> => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories/${categoryId}/subcategories`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });
      return res.data || [];
    } catch (e) {
      console.error('Failed to fetch subcategories', e);
      return [];
    }
  };

  // Form validation
  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!formData.categoryId) return 'Please select a category';
    if (!formData.subcategoryId) return 'Please select a subcategory';
    if (!formData.hasVariants && (formData.basePrice == null || Number(formData.basePrice) <= 0)) {
      return 'Base price is required for non-variant products';
    }
    if (formData.hasVariants && variants.length === 0) {
      return 'Please add at least one variant';
    }
    return null;
  };

  // (Removed old attribute-spec helpers that conflicted with variant attribute helpers)

  // Generate variants
  const generateVariants = () => {
    // Implementation for generating variants based on attributes
    // This is a simplified version - you might need to adjust based on your needs
    const newVariants: ProductVariant[] = [];
    // Add your variant generation logic here
    setVariants(newVariants);
  };

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!product) {
      console.error('No product to update');
      toast.error('No product to update');
      return;
    }
    
    // Form validation
    const validationError = validateForm();
    if (validationError) {
      console.error('Validation error:', validationError);
      toast.error(validationError);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare form data
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('categoryId', String(formData.categoryId));
      formDataToSend.append('subcategoryId', String(formData.subcategoryId));
      formDataToSend.append('hasVariants', String(formData.hasVariants));
      
      if (formData.hasVariants) {
        formDataToSend.append('variants', JSON.stringify(variants));
      } else {
        formDataToSend.append('basePrice', String(formData.basePrice));
        formDataToSend.append('stock', String(formData.stock));
        formDataToSend.append('status', String(formData.status));
      }
      
      // Append existing images
      existingImages.forEach((image, index) => {
        formDataToSend.append(`existingImages[${index}]`, image);
      });
      
      // Upload new images
      const imageUploadPromises = images.map(file => {
        const imageFormData = new FormData();
        imageFormData.append('files', file);
        return axios.post(
          `${process.env.REACT_APP_API_URL}/api/product/image/upload`,
          imageFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${authState.token}`
            }
          }
        );
      });
      
      // Wait for all image uploads to complete
      const uploadResponses = await Promise.all(imageUploadPromises);
      const newImageUrls = uploadResponses.flatMap(response => response.data.urls || []);
      
      // Add new image URLs to form data
      newImageUrls.forEach((url, index) => {
        formDataToSend.append(`images[${index}]`, url);
      });
      
      // Submit the form
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/products/${product.id}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${authState.token}`
          }
        }
      );
      
      toast.success('Product updated successfully');
      onClose();
      if (onSubmit) {
        onSubmit(true);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle close button click
  const handleClose = () => {
    onClose();
  };

  // Image handling
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle variant image upload
  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantIndex: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file) return;
    
    try {
      const formData = new FormData();
      formData.append('files', file);
      

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/product/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${authState.token}`
          }
        }
      );

      const imageUrls = response.data.urls || [];
      updateVariant(variantIndex, {
        images: [...(variants[variantIndex]?.images || []), ...imageUrls]
      });
    } catch (error) {
      console.error('Error uploading variant images:', error);
      toast.error('Failed to upload variant images');
    }
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    updateVariant(variantIndex, {
      images: variants[variantIndex].images.filter((_, i) => i !== imageIndex)
    });
  };

  // Render the modal
  if (!isOpen) return null;

  return (
    <div className="new-product-modal-overlay" onClick={handleOverlayClick}>
      <div className="new-product-modal" onClick={(e) => e.stopPropagation()}>
        <div className="new-product-modal-header">
          <h2 className="new-product-modal-title">Edit Product</h2>
          <button type="button" className="new-product-modal-close" onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="new-product-modal-body">
          <form onSubmit={handleSubmit} className="new-product-form">
            {/* Basic Information Section */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z"/>
                  </svg>
                </div>
                <h3 className="section-title">Product Information</h3>
              </div>

              <div className="form-grid two-columns">
                <div className="form-group full-width">
                  <label className="form-label required">Product Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter a compelling product name"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your product's key features and benefits"
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Category</label>
                  <select
                    className="form-select"
                    value={selectedCategoryId}
                    onChange={(e) => handleCategoryChange(Number(e.target.value))}
                    required
                  >
                    <option value={0}>Choose a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Subcategory</label>
                  <select
                    className="form-select"
                    value={formData.subcategoryId}
                    onChange={(e) => handleInputChange('subcategoryId', Number(e.target.value))}
                    required
                    disabled={subcategories.length === 0}
                  >
                    <option value={0}>Choose a subcategory</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Deal <span className="label-hint">(Optional)</span></label>
                  <select
                    className="form-select"
                    value={formData.dealId || 0}
                    onChange={(e) => handleInputChange('dealId', Number(e.target.value) || undefined)}
                  >
                    <option value={0}>No deal</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Product Type Section */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 11H7V9H9V11ZM13 11H11V9H13V11ZM17 11H15V9H17V11ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z"/>
                  </svg>
                </div>
                <h3 className="section-title">Product Configuration</h3>
              </div>

              <div className="toggle-container" onClick={() => handleInputChange('hasVariants', !formData.hasVariants)}>
                <div className={`toggle-switch ${formData.hasVariants ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
                <div>
                  <div className="toggle-label">Product has variants</div>
                  <div className="toggle-description">
                    Enable this if your product comes in different sizes, colors, or other variations
                  </div>
                </div>
              </div>
            </div>

            {/* Non-Variant Product Section */}
            {!formData.hasVariants && (
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L12 2L3 7V9C3 14.55 6.84 19.74 12 21C17.16 19.74 21 14.55 21 9Z"/>
                    </svg>
                  </div>
                  <h3 className="section-title">Pricing & Inventory</h3>
                </div>

                <div className="form-grid three-columns">
                  <div className="form-group">
                    <label className="form-label required">Base Price</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.basePrice ?? 0}
                      onChange={(e) => handleInputChange('basePrice', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Stock Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as InventoryStatus)}
                      required
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                      <option value="LOW_STOCK">Low Stock</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Discount Amount</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.discount ?? 0}
                      onChange={(e) => handleInputChange('discount', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Discount Type</label>
                    <select
                      className="form-select"
                      value={formData.discountType || ''}
                      onChange={(e) => handleInputChange('discountType', e.target.value as 'PERCENTAGE' | 'FLAT')}
                    >
                      <option value="">No discount</option>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Fixed Amount</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Variants Section */}
            {formData.hasVariants && (
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z"/>
                    </svg>
                  </div>
                  <h3 className="section-title">Product Variants</h3>
                </div>

                {/* Attribute specs builder (from NewProductModal) */}
                <div className="form-grid two-columns" style={{ marginBottom: 12 }}>
                  {attributeSpecs.map((spec, i) => (
                    <React.Fragment key={i}>
                      <div className="form-group">
                        <label className="form-label required">Attribute Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Color, Size"
                          value={spec.type}
                          onChange={(e) => {
                            const next = [...attributeSpecs];
                            next[i].type = e.target.value;
                            setAttributeSpecs(next);
                          }}
                        />
                        <div className="label-hint">Examples: Color, Size, Material</div>
                      </div>
                      <div className="form-group">
                        <label className="form-label required">Values (comma-separated)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Red, Blue or M, L"
                          value={spec.valuesText}
                          onChange={(e) => {
                            const next = [...attributeSpecs];
                            next[i].valuesText = e.target.value;
                            setAttributeSpecs(next);
                          }}
                        />
                        {/* Values preview as chips */}
                        {parseValues(spec.valuesText).length > 0 && (
                          <div className="attribute-tags">
                            {parseValues(spec.valuesText).map((v, idx) => (
                              <span key={idx} className="attribute-tag">{v}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
                  <div className="form-group full-width" style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setAttributeSpecs(prev => [...prev, { type: '', valuesText: '' }])}
                    >
                      + Add Attribute
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={generateVariants}
                      disabled={!attributeSpecs.some(s => s.type.trim() && parseValues(s.valuesText).length > 0)}
                    >
                      Generate Variants
                    </button>
                  </div>
                </div>

                <div className="variants-section">
                  {variants.map((variant, index) => (
                    <div key={index} className="variant-card">
                      <div className="variant-header">
                        <div className="variant-title">
                          <span className="variant-number">{index + 1}</span>
                          {formatVariantAttributes(variant.attributes) || `Variant ${index + 1}`}
                        </div>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            className="variant-remove"
                            onClick={() => removeVariant(index)}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="form-grid three-columns">
                        <div className="form-group">
                          <label className="form-label required">SKU</label>
                          <input
                            type="text"
                            className="form-input"
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                            placeholder="SKU-001"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label required">Price</label>
                          <input
                            type="number"
                            className="form-input"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', Number(e.target.value))}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label required">Stock</label>
                          <input
                            type="number"
                            className="form-input"
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))}
                            placeholder="0"
                            min="0"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label required">Status</label>
                          <select
                            className="form-select"
                            value={variant.status}
                            onChange={(e) => updateVariant(index, 'status', e.target.value as InventoryStatus)}
                            required
                          >
                            <option value="AVAILABLE">Available</option>
                            <option value="OUT_OF_STOCK">Out of Stock</option>
                            <option value="LOW_STOCK">Low Stock</option>
                          </select>
                        </div>
                      </div>

                      {/* Attributes */}
                      <div className="attribute-container">
                        <label className="form-label">Attributes</label>
                        <div className="attribute-input-group">
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Attribute type (e.g., Color)"
                            value={newAttribute.type}
                            onChange={(e) => setNewAttribute({...newAttribute, type: e.target.value})}
                          />
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Value (e.g., Red)"
                            value={newAttribute.values[0]?.value || ''}
                            onChange={(e) => setNewAttribute({...newAttribute, values: [{ value: e.target.value, nestedAttributes: [] }]})}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => addAttribute(index)}
                          >
                            Add
                          </button>
                        </div>
                        <div className="attribute-tags">
                          {variant.attributes?.map((attr, attrIndex) => {
                            const label = String((attr as any)?.type ?? (attr as any)?.attributeType ?? '').trim() || String(attrIndex);
                            const valuesSrc: any = (attr as any)?.values ?? (attr as any)?.attributeValues ?? [];
                            const vals = (Array.isArray(valuesSrc) ? valuesSrc : [valuesSrc])
                              .map((v: any) => String((v && typeof v === 'object') ? (v.value ?? v.name ?? JSON.stringify(v)) : v))
                              .filter(Boolean)
                              .join(', ');
                            return (
                              <div key={attrIndex} className="attribute-tag">
                                {label}: {vals}
                                <button
                                  type="button"
                                  onClick={() => removeAttribute(index, attrIndex)}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Variant Images: upload + preview */}
                      <div className="form-group full-width">
                        <label className="form-label">Variant Images</label>
                        <div className="image-upload-container"
                             onClick={(e) => {
                               e.stopPropagation();
                               document.getElementById(`variant-image-${index}`)?.click();
                             }}>
                          <div className="upload-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                          </div>
                          <div className="upload-text">Click to add images for this variant</div>
                          <input
                            id={`variant-image-${index}`}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleVariantImageUpload(e, index)}
                            style={{ display: 'none' }}
                          />
                        </div>
                        {(variant.images && variant.images.length > 0) && (
                          <div className="image-preview-grid">
                            {variant.images.map((img: any, imgIndex: number) => (
                              <div key={imgIndex} className="image-preview">
                                <img 
                                  src={img instanceof File ? URL.createObjectURL(img) : img}
                                  alt={`Variant ${index + 1} - ${imgIndex + 1}`}
                                />
                                <button
                                  type="button"
                                  className="image-remove"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeVariantImage(index, imgIndex);
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-add"
                    onClick={addVariant}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12C22 13.1 21.1 14 20 14H14V20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20V14H4C2.9 14 2 13.1 2 12C2 10.9 2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z"/>
                    </svg>
                    Add Another Variant
                  </button>
                </div>
              </div>
            )}

            {/* Image Upload Section */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z"/>
                  </svg>
                </div>
                <h3 className="section-title">Product Images</h3>
              </div>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div>
                  <h4 className="section-title" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Current Images</h4>
                  <div className="image-preview-grid">
                    {existingImages.map((imageUrl, index) => (
                      <div key={index} className="image-preview">
                        <img src={imageUrl} alt={`Current ${index + 1}`} />
                        <button
                          type="button"
                          className="image-remove"
                          onClick={() => removeExistingImage(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="image-upload-container" onClick={() => document.getElementById('image-upload')?.click()}>
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <div className="upload-text">Drop new images here or click to browse</div>
                <div className="upload-hint">PNG, JPG, GIF up to 10MB each</div>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => { void handleImageUpload(e); }}
                  style={{ display: 'none' }}
                />
              </div>

              {images.length > 0 && (
                <div>
                  <h4 className="section-title" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>New Images</h4>
                  <div className="image-preview-grid">
                    {images.map((image, index) => (
                      <div key={index} className="image-preview">
                        <img src={URL.createObjectURL(image)} alt={`New ${index + 1}`} />
                        <button
                          type="button"
                          className="image-remove"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="form-section">
              <div className="button-group">
                <button type="button" onClick={handleClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button 
                  type="button" 
                  disabled={isLoading} 
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  {isLoading && <div className="loading-spinner"></div>}
                  {isLoading ? 'Updating Product...' : 'Update Product'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;
