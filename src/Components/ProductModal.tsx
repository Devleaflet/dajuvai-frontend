import React, { useState, useEffect } from "react";
import { ProductFormData } from "../types/product";
import {
  fetchCategories,
  fetchSubcategories,
  Category,
  Subcategory,
} from "../api/categories";
import "../Styles/ProductModal.css";
import { useVendorAuth } from "../context/VendorAuthContext";
import { dealApiService } from '../services/apiDeals';
import { Deal } from '../Components/Types/Deal';

export enum InventoryStatus {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  LOW_STOCK = 'LOW_STOCK',
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: ProductFormData) => void;
  initialData?: ProductFormData;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { authState } = useVendorAuth();
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    basePrice: "",
    stock: 0,
    discount: "0",
    discountType: "PERCENTAGE",
    size: [],
    status: InventoryStatus.AVAILABLE,
    productImages: [] as (File | string)[],
    categoryId: 0,
    subcategoryId: 0,
    brand_id: null,
    dealId: null,
    vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
    inventory: [],
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsError, setDealsError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        basePrice: initialData.basePrice || "",
        stock: initialData.stock || 0,
        discount: initialData.discount || "0",
        discountType: initialData.discountType || "PERCENTAGE",
        size: initialData.size || [],
        status: initialData.status || InventoryStatus.AVAILABLE,
        productImages: initialData.productImages || [],
        categoryId: initialData.categoryId || 0,
        subcategoryId: initialData.subcategoryId || 0,
        brand_id: initialData.brand_id || null,
        dealId: initialData.dealId || null,
        vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
        inventory: initialData.inventory || [],
      });
      setSelectedCategory(initialData.categoryId || 0);
    }
  }, [initialData, authState.vendor?.id]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          general: "Failed to load categories",
        }));
        console.error(err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadSubcategories = async () => {
      if (selectedCategory) {
        try {
          const data = await fetchSubcategories(selectedCategory);
          setSubcategories(data);
        } catch (err) {
          setErrors((prev) => ({
            ...prev,
            general: "Failed to load subcategories",
          }));
          console.error(err);
        }
      } else {
        setSubcategories([]);
      }
    };
    loadSubcategories();
  }, [selectedCategory]);

  useEffect(() => {
    setDealsLoading(true);
    setDealsError(null);
    dealApiService.getAllDeals('ENABLED')
      .then(res => {
        if (res.success && res.data?.deals) {
          setDeals(res.data.deals);
        } else {
          setDeals([]);
          setDealsError(res.message || 'Failed to load deals');
        }
      })
      .catch(err => {
        setDeals([]);
        setDealsError(err.message || 'Failed to load deals');
      })
      .finally(() => setDealsLoading(false));
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === "" ? "" : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [name]: numValue,
      vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = Number(e.target.value);
    setSelectedCategory(categoryId);
    setFormData((prev) => ({
      ...prev,
      categoryId,
      subcategoryId: 0,
      vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
    }));
    setErrors((prev) => ({ ...prev, categoryId: "", subcategoryId: "" }));
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subcategoryId = Number(e.target.value);
    setFormData((prev) => ({
      ...prev,
      subcategoryId,
      vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
    }));
    setErrors((prev) => ({ ...prev, subcategoryId: "" }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 5) {
        setErrors((prev) => ({ ...prev, images: "Maximum 5 images allowed" }));
        return;
      }
      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
      setFormData((prev) => ({
        ...prev,
        productImages: files,
        vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
      }));
      setErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index),
      vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Add this handler for the deal dropdown
  const handleDealChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      dealId: value ? Number(value) : null,
      vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Product name is required";
    }
    if (!formData.description?.trim()) {
      newErrors.description = "Product description is required";
    }
    const price = parseFloat(formData.basePrice?.toString() || "0");
    if (isNaN(price) || price <= 0) {
      newErrors.basePrice = "Base price must be a valid positive number";
    }
    if (typeof formData.stock !== "number" || formData.stock < 0) {
      newErrors.stock = "Stock must be a valid non-negative number";
    }
    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }
    if (!formData.subcategoryId) {
      newErrors.subcategoryId = "Subcategory is required";
    }
    if (!authState.vendor?.id) {
      newErrors.vendorId = "Vendor ID is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      try {
        await onSubmit({
          ...formData,
          basePrice: formData.basePrice.toString(),
          discount: formData.discount.toString(),
          vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
        });
      } catch (err) {
        setErrors((prev) => ({ ...prev, general: "Failed to save product" }));
        console.error("Submission error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  if (!isOpen) return null;

  return (
    <div className={`product-modal ${isOpen ? "open" : ""}`}>
      <div className="product-modal__content">
        <div className="product-modal__header">
          <h2 className="product-modal__title">
            {initialData ? "Edit Product" : "Add New Product"}
          </h2>
          <button onClick={onClose} className="product-modal__close">
            <span className="sr-only">Close</span>
            <svg
              className="product-modal__close-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
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
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  required
                  className="product-modal__select"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <span className="product-modal__error">
                    {errors.categoryId}
                  </span>
                )}
              </div>

              <div className="product-modal__field">
                <label className="product-modal__label">Subcategory *</label>
                <select
                  name="subcategoryId"
                  value={formData.subcategoryId}
                  onChange={handleSubcategoryChange}
                  required
                  disabled={!selectedCategory}
                  className="product-modal__select"
                >
                  <option value="">Select a subcategory</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
                {errors.subcategoryId && (
                  <span className="product-modal__error">
                    {errors.subcategoryId}
                  </span>
                )}
              </div>
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
              {errors.name && (
                <span className="product-modal__error">{errors.name}</span>
              )}
            </div>

            <div className="product-modal__field">
              <label className="product-modal__label">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="product-modal__textarea"
              />
              {errors.description && (
                <span className="product-modal__error">
                  {errors.description}
                </span>
              )}
            </div>
          </div>

          <div className="product-modal__section">
            <div className="product-modal__row">
              <div className="product-modal__field">
                <label className="product-modal__label">Base Price *</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleNumberInputChange}
                  required
                  min="0.01"
                  step="0.01"
                  className="product-modal__input"
                />
                {errors.basePrice && (
                  <span className="product-modal__error">
                    {errors.basePrice}
                  </span>
                )}
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
                {errors.stock && (
                  <span className="product-modal__error">{errors.stock}</span>
                )}
              </div>
            </div>
          </div>

          <div className="product-modal__section">
            <div className="product-modal__row">


              {/* REPLACE Deal ID input with dropdown */}
              <div className="product-modal__field">
                <label className="product-modal__label">Deal</label>
                {dealsLoading ? (
                  <div>Loading deals...</div>
                ) : dealsError ? (
                  <div className="product-modal__error">{dealsError}</div>
                ) : (
                  <select
                    name="dealId"
                    value={formData.dealId || ''}
                    onChange={handleDealChange}
                    className="product-modal__select"
                  >
                    <option value="">No Deal</option>
                    {deals.map(deal => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name} ({deal.discountPercentage}% off)
                      </option>
                    ))}
                  </select>
                )}
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
                  value={formData.discountType ?? "PERCENTAGE"}
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
              <label className="product-modal__label">Product Variants</label>
              
              {/* Quick Variant Selection */}
              <div className="product-modal__variant-section">
                <div className="product-modal__variant-section-label">Quick Select:</div>
                <div className="product-modal__variant-options">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Red', 'Blue', 'Green', 'Black', 'White', 'Cotton', 'Polyester', 'Wool'].map((variant) => (
                    <button
                      key={variant}
                      type="button"
                      className={`product-modal__variant-option ${
                        formData.size.includes(variant) ? 'product-modal__variant-option--selected' : ''
                      }`}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          size: prev.size.includes(variant)
                            ? prev.size.filter(s => s !== variant)
                            : [...prev.size, variant],
                          vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
                        }));
                      }}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Variant Input */}
              <div className="product-modal__variant-section">
                <div className="product-modal__variant-section-label">Add Custom Variant:</div>
                <div className="product-modal__custom-variant">
                  <div className="product-modal__custom-variant-input-group">
                    <input
                      type="text"
                      placeholder="e.g., 32, 34, 36, 38 or Red, Blue, Green or Cotton, Silk"
                      className="product-modal__input product-modal__input--small"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const customVariant = input.value.trim();
                          if (customVariant && !formData.size.includes(customVariant)) {
                            setFormData((prev) => ({
                              ...prev,
                              size: [...prev.size, customVariant],
                              vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
                            }));
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="product-modal__add-variant-btn"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const customVariant = input.value.trim();
                        if (customVariant && !formData.size.includes(customVariant)) {
                          setFormData((prev) => ({
                            ...prev,
                            size: [...prev.size, customVariant],
                            vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
                          }));
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <small className="product-modal__help-text">Press Enter or click Add to include custom variants</small>
                </div>
              </div>

              {/* Selected Variants Display */}
              {formData.size.length > 0 && (
                <div className="product-modal__variant-section">
                  <div className="product-modal__variant-section-label">
                    Selected Variants ({formData.size.length}):
                  </div>
                  <div className="product-modal__variant-tags">
                    {formData.size.map((variant, index) => (
                      <span key={index} className="product-modal__variant-tag">
                        {variant}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              size: prev.size.filter((_, i) => i !== index),
                              vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
                            }));
                          }}
                          className="product-modal__variant-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="product-modal__clear-variants-btn"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        size: [],
                        vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
                      }));
                    }}
                  >
                    Clear All Variants
                  </button>
                </div>
              )}

              {/* API Format Preview */}
              {formData.size.length > 0 && (
                <div className="product-modal__api-preview">
                  <div className="product-modal__api-preview-label">API Format Preview:</div>
                  <div className="product-modal__api-preview-value">
                    {formData.size.join(', ')}
                  </div>
                </div>
              )}
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
                <option value={InventoryStatus.AVAILABLE}>Available</option>
                <option value={InventoryStatus.OUT_OF_STOCK}>Out of Stock</option>
                <option value={InventoryStatus.LOW_STOCK}>Low Stock</option>
              </select>
            </div>
          </div>

          <div className="product-modal__section">
            <div className="product-modal__field">
              <label className="product-modal__label">
                Product Images (up to 5)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="product-modal__input"
              />
              {errors.images && (
                <span className="product-modal__error">{errors.images}</span>
              )}
              {imagePreviews.length > 0 && (
                <div className="product-modal__image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="product-modal__image-preview">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="product-modal__remove-image"
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
              className={`product-modal__button product-modal__button--primary ${
                loading ? "loading" : ""
              }`}
            >
              {loading && <span className="product-modal__spinner"></span>}
              {loading
                ? "Saving..."
                : initialData
                ? "Update Product"
                : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add spinner animation
const style = document.createElement("style");
style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style);

export default ProductModal;