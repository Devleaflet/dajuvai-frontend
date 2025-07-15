import React, { useState, useEffect } from "react";
import { ProductFormData } from "../../types/product";
import "../../Styles/ProductModal.css";
import "../../Styles/Modal.css";
import { useAuth } from "../../context/AuthContext";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { API_BASE_URL } from "../../config";
import { ApiProduct } from "../Types/ApiProduct";
import { useSearchParams, useLocation } from "react-router-dom";
import ProductService from "../../services/productService";
import { toast } from 'react-toastify';
import { dealApiService } from '../../services/apiDeals';
import { Deal } from '../Types/Deal';

export enum InventoryStatus {
    AVAILABLE = 'AVAILABLE',
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    LOW_STOCK = 'LOW_STOCK',
}

interface Vendor {
  id: number;
  businessName: string;
  email: string;
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
  const { token } = useAuth();
  const { authState: vendorAuthState } = useVendorAuth();
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
    quantity: 0,
    vendorId: "",
    inventory: [],
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const subcategoryId = searchParams.get("subcategoryId");
  const location = useLocation();
  const [deletingImageIndex, setDeletingImageIndex] = useState<number | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsError, setDealsError] = useState<string | null>(null);

  // Check if we're in vendor context
  const isVendorContext = vendorAuthState.isAuthenticated && vendorAuthState.vendor;

  // Initialize form data when product changes
  useEffect(() => {
    if (product && show) {
      const initialFormData: ProductFormData = {
        name: product.name || "",
        description: product.description || "",
        basePrice:
          product.basePrice != null ? product.basePrice.toString() : "0",
        stock: product.stock || 0,
        discount: product.discount != null ? product.discount.toString() : "0",
        discountType: product.discountType || "PERCENTAGE",
        size: product.size || [],
        status: (product.status as InventoryStatus) || InventoryStatus.AVAILABLE,
        productImages: product.productImages || [],
        categoryId: product.categoryId || 0,
        subcategoryId: product.subcategory?.id || 0,
        quantity: product.stock || 1,
        brand_id: product.brand_id || null,
        dealId: product.dealId || null,
        inventory: product.inventory || [],
        vendorId: isVendorContext 
          ? String(vendorAuthState.vendor?.id || "")
          : (product.vendorId ? String(product.vendorId) : ""),
      };

      setFormData(initialFormData);
      
      // Set vendor ID based on context
      if (isVendorContext) {
        setSelectedVendorId(vendorAuthState.vendor?.id || null);
      } else {
        setSelectedVendorId(product.vendorId || null);
      }

      // Set image previews for existing images
      if (product.productImages && product.productImages.length > 0) {
        const previews = product.productImages.map((img) =>
          typeof img === "string" ? img : URL.createObjectURL(img)
        );
        setImagePreviews(previews);
      } else {
        setImagePreviews([]);
      }
    }

    // Cleanup function to revoke object URLs
    return () => {
      imagePreviews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [product, show, isVendorContext, vendorAuthState.vendor]);

  // Load vendors when modal is shown (only for admin context)
  useEffect(() => {
    const loadVendors = async () => {
      if (isVendorContext) {
        // Don't load vendors list for vendor context
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/vendors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
          setVendors(result.data);
        }
      } catch (err) {
        console.error("Failed to load vendors:", err);
        setErrors((prev) => ({ ...prev, general: "Failed to load vendors" }));
      }
    };

    if (show && product && !isVendorContext) {
      loadVendors();
    }
  }, [show, token, product, isVendorContext]);

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
  }, [show]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      vendorId: isVendorContext 
        ? String(vendorAuthState.vendor?.id || "")
        : (selectedVendorId ? String(selectedVendorId) : ""),
      inventory: prev.inventory || [],
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === "" ? "" : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [name]: numValue,
      vendorId: isVendorContext 
        ? String(vendorAuthState.vendor?.id || "")
        : (selectedVendorId ? String(selectedVendorId) : ""),
      inventory: prev.inventory || [],
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = Number(e.target.value);
    setSelectedVendorId(vendorId);
    setFormData((prev) => ({
      ...prev,
      vendorId: String(vendorId),
    }));
    setErrors((prev) => ({ ...prev, vendorId: "" }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const currentImages = formData.productImages || [];
      const totalImages = currentImages.length + files.length;

      if (totalImages > 5) {
        setErrors((prev) => ({
          ...prev,
          images: `Cannot add ${files.length} images. Maximum 5 images allowed. You currently have ${currentImages.length} images.`,
        }));
        return;
      }

      // Validate file types and sizes
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      for (const file of files) {
        if (!validTypes.includes(file.type)) {
          setErrors((prev) => ({
            ...prev,
            images: `Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`,
          }));
          return;
        }
        if (file.size > maxSize) {
          setErrors((prev) => ({
            ...prev,
            images: `File too large: ${file.name}. Maximum size is 5MB.`,
          }));
          return;
        }
      }

      // Create new image arrays
      const newImages = [...currentImages, ...files];
      const newPreviews = [
        ...imagePreviews,
        ...files.map((file) => URL.createObjectURL(file)),
      ];

      setFormData((prev) => ({
        ...prev,
        productImages: newImages,
      }));
      setImagePreviews(newPreviews);
      setErrors((prev) => ({ ...prev, images: "" }));

      // Clear the input so the same files can be selected again if needed
      e.target.value = "";
    }
  };

  const removeImage = async (index: number) => {
    const currentImages = formData.productImages || [];
    const imageToRemove = currentImages[index];
    
    // If it's an existing image (string URL), delete it from the server
    if (typeof imageToRemove === 'string' && product) {
      setDeletingImageIndex(index);
      try {
        const productService = ProductService.getInstance();
        const categoryId = product.categoryId || 1;
        const subcategoryId = product.subcategory?.id || 1;
        const authToken = isVendorContext ? vendorAuthState.token : token;
        
        if (!authToken) {
          setError("Authentication token is missing");
          return;
        }
        
        await productService.deleteProductImage(categoryId, subcategoryId, product.id, imageToRemove, authToken);
        
        // Remove from local state after successful deletion
        const newImages = currentImages.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);

        // Revoke object URL for the removed image if it's a blob
        if (imagePreviews[index] && imagePreviews[index].startsWith("blob:")) {
          URL.revokeObjectURL(imagePreviews[index]);
        }

        setFormData((prev) => ({
          ...prev,
          productImages: newImages,
        }));
        setImagePreviews(newPreviews);
        setErrors((prev) => ({ ...prev, images: "" }));
        toast.success("Image deleted successfully");
      } catch (error: unknown) {
        console.error("Failed to delete image:", error);
        setError((error as Error).message || "Failed to delete image from server");
        toast.error((error as Error).message || "Failed to delete image from server");
      } finally {
        setDeletingImageIndex(null);
      }
    } else {
      // If it's a new image (File) or we don't have product info, just remove from local state
      const newImages = currentImages.filter((_, i) => i !== index);
      const newPreviews = imagePreviews.filter((_, i) => i !== index);

      // Revoke object URL for the removed image if it's a blob
      if (imagePreviews[index] && imagePreviews[index].startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviews[index]);
      }

      setFormData((prev) => ({
        ...prev,
        productImages: newImages,
      }));
      setImagePreviews(newPreviews);

      // Clear any image-related errors when removing images
      setErrors((prev) => ({ ...prev, images: "" }));
      toast.success("Image removed");
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name?.trim()) newErrors.name = "Product name is required";
    if (!formData.description?.trim())
      newErrors.description = "Product description is required";
    const price = parseFloat(formData.basePrice?.toString() || "0");
    if (isNaN(price) || price <= 0)
      newErrors.basePrice = "Base price must be a valid positive number";
    if (typeof formData.stock !== "number" || formData.stock < 0)
      newErrors.stock = "Stock must be a valid non-negative number";
    if (typeof formData.quantity !== "number" || formData.quantity <= 0)
      newErrors.quantity = "Quantity must be a valid positive number";
    
    // Only validate vendor selection for admin context
    if (!isVendorContext && !formData.vendorId) {
      newErrors.vendorId = "Vendor is required";
    }
    
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) {
      setError("No product selected for editing");
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let categoryId = product.categoryId;
      if (!categoryId && product.subcategory) {
        // Try to get categoryId from subcategory if available
        categoryId = 1; // Default fallback
      }
      if (!categoryId) {
        categoryId = 1; // Default fallback
      }

      const subcategoryId = product.subcategory?.id || 1;

      console.log('EditProductModal: Submitting form data:', {
        productId: product.id,
        formData: formData,
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        status: formData.status
      });

      await onSave(product.id, formData, categoryId, subcategoryId);
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update product";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Update state when the URL changes
    // setQuery(location.search); // Removed as per edit hint
  }, [location.search]);

  useEffect(() => {
    console.log("Fetching products for:", categoryId, subcategoryId);
    // ...fetch logic
  }, [categoryId, subcategoryId]);

  // Add this handler for the deal dropdown
  const handleDealChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      dealId: value ? Number(value) : null,
      vendorId: isVendorContext 
        ? String(vendorAuthState.vendor?.id || "")
        : (selectedVendorId ? String(selectedVendorId) : ""),
      inventory: prev.inventory || [],
    }));
  };

  if (!show) return null;

  if (!product) {
    return (
      <div className="modal-overlay">
        <div className="modal modal-large">
          <div className="modal-header">
            <h2 className="modal-title">
              {isVendorContext ? "Edit Product" : "Edit Product (Admin)"}
            </h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="product-modal__error">
              No product selected for editing.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <div className="modal-header">
          <h2 className="modal-title">
            {isVendorContext ? "Edit Product" : "Edit Product (Admin)"}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {error && <div className="product-modal__error">{error}</div>}
          {errors.general && (
            <div className="product-modal__error">{errors.general}</div>
          )}

          <form
            onSubmit={handleSubmit}
            className="product-modal__form"
            id="edit-product-form"
          >
            {/* Only show vendor selection for admin context */}
            {!isVendorContext && (
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
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.businessName}
                      </option>
                    ))}
                  </select>
                  {errors.vendorId && (
                    <span className="product-modal__error">
                      {errors.vendorId}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Show vendor info for vendor context */}
            {isVendorContext && (
              <div className="product-modal__section">
                <div className="product-modal__field">
                  <label className="product-modal__label">Vendor</label>
                  <input
                    type="text"
                    value={vendorAuthState.vendor?.businessName || "Unknown Vendor"}
                    disabled
                    className="product-modal__input product-modal__input--disabled"
                  />
                  <small className="product-modal__help-text">
                    You are editing this product as {vendorAuthState.vendor?.businessName}
                  </small>
                </div>
              </div>
            )}

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
                    value={formData.basePrice || ""}
                    onChange={handleNumberInputChange}
                    required
                    min="0"
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
                    value={formData.stock?.toString() || ""}
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
                <div className="product-modal__field">
                  <label className="product-modal__label">Discount</label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount || ""}
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
                    value={formData.discountType || "PERCENTAGE"}
                    onChange={handleInputChange}
                    className="product-modal__select"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FLAT">Fixed Amount</option>
                  </select>
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
                  {errors.quantity && (
                    <span className="product-modal__error">
                      {errors.quantity}
                    </span>
                  )}
                </div>

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
            </div>

            <div className="product-modal__section">
              <div className="product-modal__field">
                <label className="product-modal__label">
                  Product Images ({formData.productImages?.length || 0}/5)
                </label>
                <div className="product-modal__file-input-wrapper">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="product-modal__file-input"
                    id="product-images"
                    disabled={formData.productImages?.length >= 5}
                  />
                  <label
                    htmlFor="product-images"
                    className="product-modal__file-label"
                  >
                    {formData.productImages?.length >= 5 ? (
                      "Maximum images reached"
                    ) : (
                      <>
                        <span className="product-modal__file-icon">📁</span>
                        Choose Images
                      </>
                    )}
                  </label>
                </div>
                <small className="product-modal__file-help">
                  Supported formats: JPEG, PNG, GIF, WebP. Max 5MB per image.
                </small>
                {errors.images && (
                  <span className="product-modal__error">{errors.images}</span>
                )}
              </div>
            </div>

            {imagePreviews.length > 0 && (
              <div className="product-modal__section">
                <div className="product-modal__field">
                  <label className="product-modal__label">Image Previews</label>
                  <div className="product-modal__image-previews">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="product-modal__image-preview">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="product-modal__preview-img"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="product-modal__remove-image"
                          title="Remove image"
                          disabled={deletingImageIndex === index}
                        >
                          {deletingImageIndex === index ? (
                            <span className="spinner spinner--small"></span>
                          ) : (
                            "×"
                          )}
                        </button>
                        {deletingImageIndex === index && (
                          <div className="product-modal__image-deleting">
                            Deleting...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="product-modal__section">
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
          </form>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="product-modal__btn product-modal__btn--secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-product-form"
            disabled={isSubmitting}
            className="product-modal__btn product-modal__btn--primary"
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Updating...
              </>
            ) : (
              "Update Product"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;