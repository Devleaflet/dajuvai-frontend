import React, { useState, useEffect } from "react";
import { ProductFormData, ProductVariant, Attribute, ApiProduct } from "../../types/product";
import "../../Styles/ProductModal.css";
import "../../Styles/Modal.css";
import { useAuth } from "../../context/AuthContext";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { API_BASE_URL } from "../../config";
// ApiProduct comes from ../../types/product
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
    bannerId: null,
    vendorId: "",
    inventory: [],
    hasVariants: false,
    variants: [],
    bannerId: null,
    brandId: null,
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

  // Variant management state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [currentVariant, setCurrentVariant] = useState<Partial<ProductVariant>>({
    sku: "",
    price: 0,
    stock: 0,
    status: "AVAILABLE" as const,
    attributes: [],
    images: [],
  });
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

  // Attribute management for variants
  const [currentAttribute, setCurrentAttribute] = useState<Partial<Attribute>>({
    type: "",
    values: [{ value: "", nestedAttributes: [] }],
  });
  const [currentAttributeValue, setCurrentAttributeValue] = useState<string>("");

  // Check if we're in vendor context
  const isVendorContext = vendorAuthState.isAuthenticated && vendorAuthState.vendor;

  // Initialize form data when product changes
  useEffect(() => {
    if (product && show) {
      // Check if variants exist in the API response
      const hasVariants = product.variants && product.variants.length > 0;
  
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
        brand_id: product.brand_id || null,
        dealId: product.dealId || null,
        bannerId: product.bannerId || null,
        inventory: product.inventory || [],
        vendorId: isVendorContext
          ? String(vendorAuthState.vendor?.id || "")
          : (product.vendorId ? String(product.vendorId) : ""),
        hasVariants: hasVariants, // Use computed value
        variants: product.variants || [],
        bannerId: product.bannerId || null,
        brandId: product.brandId || null,
      };
  
      setFormData(initialFormData);
  
      // Initialize variants state
      if (product.variants && product.variants.length > 0) {
        const mappedVariants: ProductVariant[] = product.variants.map((v: any) => {
          // Normalize variant images into string URLs
          const imgs: string[] = Array.isArray(v.variantImages)
            ? v.variantImages
                .map((img: any) => (typeof img === 'string' ? img : (img?.url || img?.imageUrl || '')))
                .filter(Boolean)
            : (Array.isArray(v.images) ? v.images : []);
  
          // Convert attributes object { color: "Red" } -> [{ type:'color', values:[{value:'Red'}] }]
          const attrs: Attribute[] = v.attributes && typeof v.attributes === 'object' && !Array.isArray(v.attributes)
            ? Object.entries(v.attributes).map(([k, val]) => ({
                type: String(k),
                values: (Array.isArray(val) ? val : [val]).map((vv: any) => ({ value: String(vv), nestedAttributes: [] }))
              }))
            : (v.attributes || []);
  
          return {
            sku: v.sku || '',
            price: typeof v.basePrice !== 'undefined' ? Number(v.basePrice) : Number(v.price || 0),
            stock: Number(v.stock || 0),
            status: (v.status || 'AVAILABLE'),
            attributes: attrs,
            images: imgs,
            variantImages: imgs,
          } as ProductVariant;
        });
        setVariants(mappedVariants);
      } else {
        setVariants([]);
      }
  
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
        const categoryId = product.categoryId || 1;
        const subcategoryId = product.subcategory?.id || 1;
        const productId = product.id;
        const imageUrl = product.productImages[index];
        const authToken = isVendorContext ? vendorAuthState.token : token;
        if (!authToken) {
          setError("Authentication token is missing");
          return;
        }
        console.log("Auth token being sent:", authToken);
        console.log("Requesting delete for imageUrl:", imageUrl, "productId:", productId, "categoryId:", categoryId, "subcategoryId:", subcategoryId);
        console.log("deleteProductImage headers:", {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        });
        await ProductService.deleteProductImage(categoryId, subcategoryId, productId, imageUrl, authToken);
        
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
    
    // Validate based on whether product has variants
    if (!formData.hasVariants) {
      // Non-variant product validation
      const price = parseFloat(formData.basePrice?.toString() || "0");
      if (isNaN(price) || price <= 0)
        newErrors.basePrice = "Base price must be a valid positive number";
      if (typeof formData.stock !== "number" || formData.stock < 0)
        newErrors.stock = "Stock must be a valid non-negative number";
      if (typeof formData.quantity !== "number" || formData.quantity <= 0)
        newErrors.quantity = "Quantity must be a valid positive number";
    } else {
      // Variant product validation
      if (variants.length === 0) {
        newErrors.variants = "At least one variant is required for variant products";
      } else {
        // Validate each variant
        for (let i = 0; i < variants.length; i++) {
          const variant = variants[i];
          if (!variant.sku) {
            newErrors.variants = `Variant ${i + 1} missing SKU`;
            break;
          }
          if (!variant.price || variant.price <= 0) {
            newErrors.variants = `Variant ${i + 1} must have a valid positive price`;
            break;
          }
          if (!variant.stock || variant.stock < 0) {
            newErrors.variants = `Variant ${i + 1} must have a valid non-negative stock`;
            break;
          }
          if (!variant.status) {
            newErrors.variants = `Variant ${i + 1} must have a valid status`;
            break;
          }
        }
      }
    }
    
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

      // Prepare final form data with variants
      // Mirror images to variantImages for backend compatibility
      const variantsForSubmit = formData.hasVariants
        ? variants.map(v => ({
            ...v,
            variantImages: v.images || [],
          }))
        : undefined;

      const finalFormData = {
        ...formData,
        variants: variantsForSubmit,
      };

      console.log('EditProductModal: Submitting form data:', {
        productId: product.id,
        formData: finalFormData,
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        status: formData.status,
        hasVariants: formData.hasVariants,
        variantsCount: variants.length
      });

      await onSave(product.id, finalFormData, categoryId, subcategoryId);
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

  // Variant management functions
  const handleVariantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentVariant((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttributeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentAttribute((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttributeValueAdd = () => {
    if (currentAttributeValue.trim()) {
      setCurrentAttribute((prev) => ({
        ...prev,
        attributeValues: [...(prev.attributeValues || []), currentAttributeValue.trim()]
      }));
      setCurrentAttributeValue("");
    }
  };

  const handleAttributeValueRemove = (valueToRemove: string) => {
    setCurrentAttribute((prev) => ({
      ...prev,
      attributeValues: (prev.attributeValues || []).filter(v => v !== valueToRemove)
    }));
  };

  const handleAttributeAdd = () => {
    if (currentAttribute.attributeType && currentAttribute.attributeValues && currentAttribute.attributeValues.length > 0) {
      setCurrentVariant((prev) => ({
        ...prev,
        attributes: [...(prev.attributes || []), currentAttribute as Attribute]
      }));
      setCurrentAttribute({ attributeType: "", attributeValues: [] });
    }
  };

  const handleAttributeRemove = (indexToRemove: number) => {
    setCurrentVariant((prev) => ({
      ...prev,
      attributes: (prev.attributes || []).filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleVariantAddOrUpdate = () => {
    console.log("EditProductModal: Saving variant:", currentVariant, "editing index:", editingVariantIndex);
    
    if (!currentVariant.sku) {
      toast.error("SKU is required for variant");
      return;
    }

    if (!currentVariant.price || currentVariant.price <= 0) {
      toast.error("Valid price is required for variant");
      return;
    }
    if (!currentVariant.stock || currentVariant.stock < 0) {
      toast.error("Valid stock is required for variant");
      return;
    }
    if (!currentVariant.status) {
      toast.error("Status is required for variant");
      return;
    }

    const newVariant: ProductVariant = {
      sku: currentVariant.sku,
      price: currentVariant.price,
      stock: currentVariant.stock,
      status: currentVariant.status,
      attributes: currentVariant.attributes || [],
      images: currentVariant.images || [],
    };

    if (editingVariantIndex !== null && editingVariantIndex >= 0) {
      // Update existing variant
      setVariants((prev) => prev.map((v, i) => (i === editingVariantIndex ? newVariant : v)));
    } else {
      // Add new variant
      setVariants((prev) => [...prev, newVariant]);
    }

    // Reset form and editing state
    setCurrentVariant({
      sku: "",
      price: 0,
      stock: 0,
      status: "AVAILABLE" as const,
      attributes: [],
      images: [],
    });
    setEditingVariantIndex(null);
    
    console.log("EditProductModal: Variants after save:", editingVariantIndex !== null ? variants.map((v,i)=> i===editingVariantIndex? newVariant: v) : [...variants, newVariant]);
  };

  const handleVariantRemove = (skuToRemove: string) => {
    setVariants((prev) => prev.filter(v => v.sku !== skuToRemove));
  };

  const handleVariantEdit = (index: number) => {
    const v = variants[index];
    setCurrentVariant({ ...v });
    setEditingVariantIndex(index);
  };

  const handleVariantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    // For now, store File objects or string URLs as-is in images array
    setCurrentVariant((prev) => ({
      ...prev,
      images: [ ...(prev.images || []), ...files ] as any
    }));
    // clear input
    e.target.value = '';
  };

  const handleVariantImageRemove = (imgIndex: number) => {
    setCurrentVariant((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== imgIndex)
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

            {/* Has Variants Toggle */}
            <div className="product-modal__section">
              <div className="product-modal__field">
                <label className="product-modal__label">
                  <input
                    type="checkbox"
                    name="hasVariants"
                    checked={formData.hasVariants}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasVariants: e.target.checked }))}
                    style={{ marginRight: "8px" }}
                  />
                  Product has variants (e.g., different sizes, colors)
                </label>
              </div>
            </div>

            {/* Conditional Fields for Non-Variant Products */}
            {!formData.hasVariants && (
              <div className="product-modal__section">
                <div className="product-modal__row">
                  <div className="product-modal__field">
                    <label className="product-modal__label">Base Price *</label>
                    <input
                      type="number"
                      name="basePrice"
                      value={formData.basePrice?.toString() || ""}
                      onChange={handleNumberInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="product-modal__input"
                    />
                    {errors.basePrice && (
                      <span className="product-modal__error">{errors.basePrice}</span>
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

                <div className="product-modal__field">
                  <label className="product-modal__label">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="product-modal__select"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                  </select>
                </div>
              </div>
            )}

            {/* Variant Management Section */}
            {formData.hasVariants && (
              <div className="product-modal__section">
                <div className="product-modal__field">
                  <label className="product-modal__label" style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                    Product Variants *
                  </label>
                  
                  {/* Current Variants List */}
                  {variants.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <h4>Added Variants:</h4>
                      {variants.map((variant, index) => (
                        <div key={variant.sku} style={{ 
                          border: '1px solid #ddd', 
                          padding: '10px', 
                          marginBottom: '10px', 
                          borderRadius: '4px',
                          backgroundColor: '#f9f9f9'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>SKU: {variant.sku}</strong>
                            <button
                              type="button"
                              onClick={() => handleVariantRemove(variant.sku)}
                              style={{
                                background: 'red',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                          <div>Price: ${variant.price}</div>
                          <div>Stock: {variant.stock}</div>
                          <div>Status: {variant.status}</div>
                          {/* Per-variant images preview */}
                          {variant.images && (variant.images as any[]).length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <strong>Variant Images:</strong>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                {(variant.images as any[]).map((img, i) => {
                                  const src = typeof img === 'string' ? img : URL.createObjectURL(img as File);
                                  return (
                                    <img key={i} src={src} alt={`Variant ${index} image ${i+1}`} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <div style={{ marginTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleVariantEdit(index)}
                              style={{
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add New Variant Form */}
                  <div style={{ 
                    border: '2px dashed #ccc', 
                    padding: '15px', 
                    borderRadius: '4px',
                    backgroundColor: '#fafafa'
                  }}>
                    <h4>{editingVariantIndex !== null ? 'Edit Variant' : 'Add New Variant'}:</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input
                        type="text"
                        name="sku"
                        placeholder="SKU (e.g., TSHIRT-RED-M)"
                        value={currentVariant.sku}
                        onChange={handleVariantChange}
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ccc'
                        }}
                      />
                      
                      <input
                        type="number"
                        name="price"
                        placeholder="Price"
                        value={currentVariant.price}
                        onChange={handleVariantChange}
                        step="0.01"
                        min="0"
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ccc'
                        }}
                      />
                      
                      <input
                        type="number"
                        name="stock"
                        placeholder="Stock Quantity"
                        value={currentVariant.stock}
                        onChange={handleVariantChange}
                        min="0"
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ccc'
                        }}
                      />
                      
                      <select
                        name="status"
                        value={currentVariant.status}
                        onChange={handleVariantChange}
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ccc'
                        }}
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="OUT_OF_STOCK">Out of Stock</option>
                        <option value="LOW_STOCK">Low Stock</option>
                      </select>
                      
                      {/* Variant images input (optional) */}
                      <div>
                        <label style={{ fontWeight: 500 }}>Variant Images (optional)</label>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleVariantImageChange}
                          style={{ display: 'block', marginTop: 6 }}
                        />
                        {currentVariant.images && (currentVariant.images as any[]).length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                            {(currentVariant.images as any[]).map((img, idx) => {
                              const src = typeof img === 'string' ? img : URL.createObjectURL(img as File);
                              return (
                                <div key={idx} style={{ position: 'relative' }}>
                                  <img src={src} alt={`Selected variant image ${idx+1}`} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                                  <button type="button" onClick={() => handleVariantImageRemove(idx)} style={{ position: 'absolute', top: -6, right: -6, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer' }}>×</button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Attribute Management */}
                      <div style={{ marginTop: '10px' }}>
                        <h5>Attributes (Optional):</h5>
                        
                        {/* Current Attributes for this variant */}
                        {currentVariant.attributes && currentVariant.attributes.length > 0 && (
                          <div style={{ marginBottom: '10px' }}>
                            {currentVariant.attributes.map((attr, index) => (
                              <div key={index} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '5px',
                                backgroundColor: '#e9ecef',
                                marginBottom: '5px',
                                borderRadius: '4px'
                              }}>
                                <span>{attr.attributeType}: {attr.attributeValues.join(', ')}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAttributeRemove(index)}
                                  style={{
                                    background: 'orange',
                                    color: 'white',
                                    border: 'none',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Add New Attribute */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <input
                            type="text"
                            name="attributeType"
                            placeholder="Attribute Type (e.g., Color, Size)"
                            value={currentAttribute.attributeType}
                            onChange={handleAttributeChange}
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #ccc'
                            }}
                          />
                          
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                              type="text"
                              placeholder="Attribute Value"
                              value={currentAttributeValue}
                              onChange={(e) => setCurrentAttributeValue(e.target.value)}
                              style={{
                                padding: '6px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                flex: 1
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleAttributeValueAdd}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Add Value
                            </button>
                          </div>
                          
                          {/* Current attribute values */}
                          {currentAttribute.attributeValues && currentAttribute.attributeValues.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {currentAttribute.attributeValues.map((value, index) => (
                                <span key={index} style={{
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}>
                                  {value}
                                  <button
                                    type="button"
                                    onClick={() => handleAttributeValueRemove(value)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'white',
                                      cursor: 'pointer',
                                      fontSize: '14px'
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <button
                            type="button"
                            onClick={handleAttributeAdd}
                            disabled={!currentAttribute.attributeType || !currentAttribute.attributeValues || currentAttribute.attributeValues.length === 0}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              opacity: (!currentAttribute.attributeType || !currentAttribute.attributeValues || currentAttribute.attributeValues.length === 0) ? 0.5 : 1
                            }}
                          >
                            Add Attribute
                          </button>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleVariantAddOrUpdate}
                        disabled={!currentVariant.sku || !currentVariant.price || currentVariant.price <= 0 || !currentVariant.stock || currentVariant.stock < 0}
                        style={{
                          padding: '10px',
                          backgroundColor: editingVariantIndex !== null ? '#ff9800' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginTop: '10px',
                          opacity: (!currentVariant.sku || !currentVariant.price || currentVariant.price <= 0 || !currentVariant.stock || currentVariant.stock < 0) ? 0.5 : 1
                        }}
                      >
                        {editingVariantIndex !== null ? 'Update Variant' : 'Add Variant'}
                      </button>
                      {editingVariantIndex !== null && (
                        <button
                          type="button"
                          onClick={() => { setEditingVariantIndex(null); setCurrentVariant({ sku: '', price: 0, stock: 0, status: 'AVAILABLE', attributes: [], images: [] }); }}
                          style={{
                            padding: '10px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '10px',
                            marginLeft: '8px'
                          }}
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {errors.variants && (
                    <span className="product-modal__error">{errors.variants}</span>
                  )}
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