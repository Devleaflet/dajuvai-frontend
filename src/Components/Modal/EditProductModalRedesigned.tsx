import React, { useState, useEffect } from "react";
import { ProductFormData, ProductVariant, Attribute } from "../../types/product";
import "../../Styles/NewProductModal.css";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { fetchCategories, fetchSubcategories, Category, Subcategory } from '../../api/categories';
import { updateProduct, uploadProductImages } from '../../api/products';
import { ApiProduct } from "../Types/ApiProduct";
import { toast } from 'react-toastify';
import { dealApiService } from '../../services/apiDeals';
import { Deal } from '../Types/Deal';

export enum InventoryStatus {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  LOW_STOCK = 'LOW_STOCK'
}

interface EditProductModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (
    productId: number,
    product: ProductFormData,
    categoryId: number,
    subcategoryId: number
  ) => Promise<void>;
  product: ApiProduct | null;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  show,
  onClose,
  onSave,
  product,
}) => {
  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    basePrice: "",
    discount: "",
    discountType: undefined,
    status: InventoryStatus.AVAILABLE,
    stock: "",
    hasVariants: false,
    variants: [],
    subcategoryId: 0,
    dealId: undefined,
    bannerId: undefined,
    productImages: [],
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  
  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  
  // Variant state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newAttribute, setNewAttribute] = useState<Attribute>({
    attributeType: '',
    attributeValues: ['']
  });
  
  // Image state
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Load data on mount and when product changes
  useEffect(() => {
    if (show) {
      loadCategories();
      loadDeals();
      if (product) {
        populateFormWithProduct();
      }
    }
  }, [show, product]);

  const loadCategories = async () => {
    try {
      const categories = await fetchCategories();
      setCategories(categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const loadDeals = async () => {
    try {
      const response = await dealApiService.getAllDeals('ENABLED');
      setDeals(response.data?.deals || []);
    } catch (error) {
      console.error('Error loading deals:', error);
    }
  };

  const populateFormWithProduct = () => {
    if (!product) return;

    setFormData({
      name: product.name || "",
      description: product.description || "",
      basePrice: product.basePrice?.toString() || "",
      discount: product.discount?.toString() || "",
      discountType: product.discountType || undefined,
      status: product.status || InventoryStatus.AVAILABLE,
      stock: product.stock?.toString() || "",
      hasVariants: product.hasVariants || false,
      variants: product.variants || [],
      subcategoryId: product.subcategoryId || 0,
      dealId: product.dealId || undefined,
      bannerId: product.bannerId || undefined,
      productImages: product.productImages || [],
    });

    setVariants(product.variants || []);
    setSelectedCategoryId(product.categoryId || 0);
    setExistingImages(product.productImages || []);

    // Load subcategories for the product's category
    if (product.categoryId) {
      handleCategoryChange(product.categoryId);
    }
  };

  const handleCategoryChange = async (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setFormData(prev => ({ ...prev, subcategoryId: 0 }));
    
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

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      sku: `SKU-${variants.length + 1}`,
      price: 0,
      stock: 0,
      status: InventoryStatus.AVAILABLE,
      attributes: [],
      images: []
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants(variants.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const addAttribute = (variantIndex: number) => {
    if (newAttribute.attributeType && newAttribute.attributeValues[0]) {
      const updatedVariants = [...variants];
      if (!updatedVariants[variantIndex].attributes) {
        updatedVariants[variantIndex].attributes = [];
      }
      updatedVariants[variantIndex].attributes!.push({ ...newAttribute });
      setVariants(updatedVariants);
      setNewAttribute({ attributeType: '', attributeValues: [''] });
    }
  };

  const removeAttribute = (variantIndex: number, attributeIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].attributes!.splice(attributeIndex, 1);
    setVariants(updatedVariants);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!selectedCategoryId) return 'Please select a category';
    if (!formData.subcategoryId) return 'Please select a subcategory';
    
    if (!formData.hasVariants) {
      if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) return 'Base price is required';
      if (!formData.stock || parseInt(formData.stock) < 0) return 'Stock quantity is required';
    } else {
      if (variants.length === 0) return 'At least one variant is required';
      for (const variant of variants) {
        if (!variant.sku.trim()) return 'All variants must have a SKU';
        if (!variant.price || variant.price <= 0) return 'All variants must have a valid price';
        if (variant.stock === undefined || variant.stock < 0) return 'All variants must have stock quantity';
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) {
      toast.error('No product to update');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Upload new images if any
      let newImageUrls: string[] = [];
      if (images.length > 0) {
        const uploadResponse = await uploadProductImages(images);
        if (uploadResponse.success) {
          newImageUrls = uploadResponse.urls;
        }
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];

      // Prepare product data
      const productData: ProductFormData = {
        ...formData,
        productImages: allImages,
        variants: formData.hasVariants ? variants : [],
        basePrice: formData.hasVariants ? "" : formData.basePrice,
        stock: formData.hasVariants ? "" : formData.stock,
      };

      await onSave(product.id, productData, selectedCategoryId, formData.subcategoryId);
      toast.success('Product updated successfully!');
      handleClose();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      name: "",
      description: "",
      basePrice: "",
      discount: "",
      discountType: undefined,
      status: InventoryStatus.AVAILABLE,
      stock: "",
      hasVariants: false,
      variants: [],
      subcategoryId: 0,
      dealId: undefined,
      bannerId: undefined,
      productImages: [],
    });
    setVariants([]);
    setSelectedCategoryId(0);
    setSubcategories([]);
    setImages([]);
    setExistingImages([]);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Initialize with one variant if hasVariants is true
  useEffect(() => {
    if (formData.hasVariants && variants.length === 0) {
      addVariant();
    }
  }, [formData.hasVariants]);

  if (!show) return null;

  return (
    <div className="new-product-modal-overlay" onClick={handleOverlayClick}>
      <div className="new-product-modal" onClick={(e) => e.stopPropagation()}>
        <div className="new-product-modal-header">
          <h2 className="new-product-modal-title">Edit Product</h2>
          <button className="new-product-modal-close" onClick={handleClose}>
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
                      value={formData.basePrice}
                      onChange={(e) => handleInputChange('basePrice', e.target.value)}
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
                      onChange={(e) => handleInputChange('stock', e.target.value)}
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
                      <option value={InventoryStatus.AVAILABLE}>Available</option>
                      <option value={InventoryStatus.OUT_OF_STOCK}>Out of Stock</option>
                      <option value={InventoryStatus.LOW_STOCK}>Low Stock</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Discount Amount</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.discount}
                      onChange={(e) => handleInputChange('discount', e.target.value)}
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

                <div className="variants-section">
                  {variants.map((variant, index) => (
                    <div key={index} className="variant-card">
                      <div className="variant-header">
                        <div className="variant-title">
                          <span className="variant-number">{index + 1}</span>
                          Variant {index + 1}
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
                            <option value={InventoryStatus.AVAILABLE}>Available</option>
                            <option value={InventoryStatus.OUT_OF_STOCK}>Out of Stock</option>
                            <option value={InventoryStatus.LOW_STOCK}>Low Stock</option>
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
                            value={newAttribute.attributeType}
                            onChange={(e) => setNewAttribute({...newAttribute, attributeType: e.target.value})}
                          />
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Value (e.g., Red)"
                            value={newAttribute.attributeValues[0] || ''}
                            onChange={(e) => setNewAttribute({...newAttribute, attributeValues: [e.target.value]})}
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
                          {variant.attributes?.map((attr, attrIndex) => (
                            <div key={attrIndex} className="attribute-tag">
                              {attr.attributeType}: {attr.attributeValues.join(', ')}
                              <button
                                type="button"
                                onClick={() => removeAttribute(index, attrIndex)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
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
                  onChange={handleImageUpload}
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
                  type="submit" 
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
