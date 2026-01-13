import React, { useState, useEffect } from "react";
import { fetchCategories, fetchSubcategories, Category, Subcategory } from '../api/categories';
import { updateProduct, uploadProductImages } from '../api/products';
import "../Styles/NewProductModal.css";
import { useVendorAuth } from "../context/VendorAuthContext";
import { dealApiService } from '../services/apiDeals';
import { Deal } from '../Components/Types/Deal';
import { toast } from 'react-toastify';

export enum InventoryStatus {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  LOW_STOCK = 'LOW_STOCK'
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (success: boolean) => void;
  product: any; // Existing product data
}

type ProductVariant = {
  id?: number;
  sku: string;
  price: number;
  basePrice: number;
  stock: number;
  status: InventoryStatus;
  attributes: any[];
  images: (File | string)[];
};

const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, onSubmit, product }) => {
  const { authState } = useVendorAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    id: product?.id || 0,
    name: product?.name || "",
    description: product?.description || "",
    basePrice: product?.basePrice || 0,
    stock: product?.stock || 0,
    discount: product?.discount || 0,
    discountType: product?.discountType || 'PERCENTAGE',
    status: product?.status || InventoryStatus.AVAILABLE,
    productImages: product?.productImages || [],
    categoryId: product?.categoryId || 0,
    subcategoryId: product?.subcategoryId || 0,
    brand_id: product?.brand_id || null,
    dealId: product?.dealId || null,
    hasVariants: product?.hasVariants || false,
    variants: (product?.variants || []).map((v: any) => ({
      ...v,
      images: v.variantImages || []
    }))
  });

  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [images, setImages] = useState<Array<File | string>>(formData.productImages);
  const [variants, setVariants] = useState<ProductVariant[]>(formData.variants);

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadDeals();
      if (product?.categoryId) {
        loadSubcategories(product.categoryId);
      }
    }
  }, [isOpen, product]);

  const loadCategories = async () => {
    try {
      const categories = await fetchCategories();
      setCategories(categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const loadSubcategories = async (categoryId: number) => {
    try {
      const subcategories = await fetchSubcategories(categoryId);
      setSubcategories(subcategories || []);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      toast.error('Failed to load subcategories');
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

  const handleCategoryChange = async (categoryId: number) => {
    setFormData(prev => ({ ...prev, categoryId, subcategoryId: 0 }));
    if (categoryId > 0) {
      await loadSubcategories(categoryId);
    } else {
      setSubcategories([]);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload new images
      let productImageUrls = [...formData.productImages.filter(img => typeof img === 'string')];
      const newImageFiles = images.filter(img => img instanceof File) as File[];
      
      if (newImageFiles.length > 0) {
        const uploadResponse = await uploadProductImages(newImageFiles);
        if (uploadResponse.success) {
          productImageUrls = [...productImageUrls, ...uploadResponse.urls];
        }
      }

      // Prepare product data
      const productData = {
        ...formData,
        productImages: productImageUrls,
        variants: variants.map(v => ({
          ...v,
          variantImages: v.images
        }))
      };

      // Update product
      const response = await updateProduct(
        formData.id,
        formData.categoryId,
        formData.subcategoryId,
        productData
      );

      toast.success('Product updated successfully!');
      onSubmit(true);
      onClose();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
      onSubmit(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form to original product data
    setFormData({
      id: product?.id || 0,
      name: product?.name || "",
      description: product?.description || "",
      basePrice: product?.basePrice || 0,
      stock: product?.stock || 0,
      discount: product?.discount || 0,
      discountType: product?.discountType || 'PERCENTAGE',
      status: product?.status || InventoryStatus.AVAILABLE,
      productImages: product?.productImages || [],
      categoryId: product?.categoryId || 0,
      subcategoryId: product?.subcategoryId || 0,
      brand_id: product?.brand_id || null,
      dealId: product?.dealId || null,
      hasVariants: product?.hasVariants || false,
      variants: (product?.variants || []).map((v: any) => ({
        ...v,
        images: v.variantImages || []
      }))
    });
    setImages(product?.productImages || []);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="new-product-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
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
            {/* Product Information Section */}
            <div className="form-section">
              <div className="section-header">
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
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Category</label>
                  <select
                    className="form-select"
                    value={formData.categoryId}
                    onChange={(e) => handleCategoryChange(Number(e.target.value))}
                    required
                  >
                    <option value={0}>Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
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
                    disabled={!formData.categoryId}
                  >
                    <option value={0}>Select Subcategory</option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="form-section">
              <div className="section-header">
                <h3 className="section-title">Product Images</h3>
              </div>
              
              <div className="image-upload-container">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="product-image-upload"
                />
                <label htmlFor="product-image-upload" className="upload-area">
                  <div className="upload-icon">+</div>
                  <div>Click or drag to upload images</div>
                </label>
                
                <div className="image-preview-grid">
                  {images.map((img, index) => (
                    <div key={index} className="image-preview">
                      <img src={img instanceof File ? URL.createObjectURL(img) : img} alt={`Preview ${index}`} />
                      <button 
                        type="button" 
                        className="remove-image"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;
