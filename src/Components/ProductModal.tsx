import React, { useState, useEffect } from "react";
import { ProductFormData, ProductVariant, Attribute } from "../types/product";
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
    bannerId: null,
    vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
    inventory: [],
    hasVariants: false,
    variants: [],
    bannerId: null,
    brandId: null,
  });
  
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
  const [currentVariantImages, setCurrentVariantImages] = useState<File[]>([]);
  const [currentVariantImagePreviews, setCurrentVariantImagePreviews] = useState<string[]>([]);
  
  // Attribute management for variants
  const [currentAttribute, setCurrentAttribute] = useState<Partial<Attribute>>({
    attributeType: "",
    attributeValues: [],
  });
  const [currentAttributeValue, setCurrentAttributeValue] = useState<string>("");

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
        bannerId: initialData.bannerId || null,
        vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
        inventory: initialData.inventory || [],
        hasVariants: initialData.hasVariants || false,
        variants: initialData.variants || [],
        bannerId: initialData.bannerId || null,
        brandId: initialData.brandId || null,
      });
      setSelectedCategory(initialData.categoryId || 0);
      
      // Initialize variants state if product has variants
      if (initialData.hasVariants && initialData.variants) {
        setVariants(initialData.variants);
      } else {
        setVariants([]);
      }
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

  const handleVariantAdd = () => {
    console.log("ProductModal: Adding variant:", currentVariant);
    
    if (!currentVariant.sku) {
      alert("SKU is required for variant");
      return;
    }
    if (!currentVariant.price || currentVariant.price <= 0) {
      alert("Valid price is required for variant");
      return;
    }
    if (!currentVariant.stock || currentVariant.stock < 0) {
      alert("Valid stock is required for variant");
      return;
    }
    if (!currentVariant.status) {
      alert("Status is required for variant");
      return;
    }
    if (currentVariantImages.length === 0) {
      alert("At least one image is required for variant");
      return;
    }

    const newVariant: ProductVariant = {
      sku: currentVariant.sku,
      price: currentVariant.price,
      stock: currentVariant.stock,
      status: currentVariant.status,
      attributes: currentVariant.attributes || [],
      images: currentVariantImages,
    };

    setVariants((prev) => [...prev, newVariant]);
    setCurrentVariant({
      sku: "",
      price: 0,
      stock: 0,
      status: "AVAILABLE" as const,
      attributes: [],
      images: [],
    });
    setCurrentVariantImages([]);
    setCurrentVariantImagePreviews([]);
    
    console.log("ProductModal: Variants after adding:", [...variants, newVariant]);
  };

  const handleVariantRemove = (skuToRemove: string) => {
    setVariants((prev) => prev.filter(v => v.sku !== skuToRemove));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Product name is required";
    }
    if (!formData.description?.trim()) {
      newErrors.description = "Product description is required";
    }
    
    // Validate based on whether product has variants
    if (!formData.hasVariants) {
      // Non-variant product validation
      const price = parseFloat(formData.basePrice?.toString() || "0");
      if (isNaN(price) || price <= 0) {
        newErrors.basePrice = "Base price must be a valid positive number";
      }
      if (typeof formData.stock !== "number" || formData.stock < 0) {
        newErrors.stock = "Stock must be a valid non-negative number";
      }
      if (typeof formData.quantity !== "number" || formData.quantity <= 0) {
        newErrors.quantity = "Quantity must be a valid positive number";
      }
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
           if (!variant.images || variant.images.length === 0) {
             newErrors.variants = `Variant ${i + 1} must have at least one image`;
             break;
           }
         }
      }
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
        // Prepare final form data with variants
        const finalFormData = {
          ...formData,
          basePrice: formData.basePrice.toString(),
          discount: formData.discount.toString(),
          vendorId: authState.vendor?.id ? String(authState.vendor.id) : "",
          variants: formData.hasVariants ? variants : undefined,
        };

        console.log('ProductModal: Submitting form data:', {
          formData: finalFormData,
          hasVariants: formData.hasVariants,
          variantsCount: variants.length
        });

        await onSubmit(finalFormData);
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
                                         {variants.map((variant) => (
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
                         {variant.images && variant.images.length > 0 && (
                           <div>
                             <strong>Images:</strong>
                             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                               {variant.images.map((image, imgIndex) => (
                                 <img 
                                   key={imgIndex}
                                   src={typeof image === 'string' ? image : URL.createObjectURL(image)} 
                                   alt={`Variant ${imgIndex + 1}`}
                                   style={{ 
                                     width: '40px', 
                                     height: '40px', 
                                     objectFit: 'cover',
                                     borderRadius: '4px',
                                     border: '1px solid #ddd'
                                   }}
                                 />
                               ))}
                             </div>
                           </div>
                         )}
                         {variant.attributes && variant.attributes.length > 0 && (
                           <div>
                             <strong>Attributes:</strong>
                             {variant.attributes.map((attr, attrIndex) => (
                               <div key={attrIndex} style={{ marginLeft: '10px' }}>
                                 {attr.attributeType}: {attr.attributeValues.join(', ')}
                               </div>
                             ))}
                           </div>
                         )}
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
                  <h4>Add New Variant:</h4>
                  
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
                     
                     {/* Variant Images */}
                     <div style={{ marginTop: '10px' }}>
                       <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                         Variant Images (up to 5):
                       </label>
                       <input
                         type="file"
                         multiple
                         accept="image/*"
                         onChange={(e) => {
                           if (e.target.files) {
                             const files = Array.from(e.target.files);
                             if (files.length > 5) {
                               alert("Maximum 5 images allowed per variant");
                               return;
                             }
                             setCurrentVariantImages(files);
                             const previews = files.map(file => URL.createObjectURL(file));
                             setCurrentVariantImagePreviews(previews);
                           }
                         }}
                         style={{
                           padding: '8px',
                           borderRadius: '4px',
                           border: '1px solid #ccc',
                           width: '100%'
                         }}
                       />
                       {currentVariantImagePreviews.length > 0 && (
                         <div style={{ marginTop: '10px' }}>
                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                             {currentVariantImagePreviews.map((preview, imgIndex) => (
                               <div key={imgIndex} style={{ position: 'relative' }}>
                                 <img 
                                   src={preview} 
                                   alt={`Variant ${imgIndex + 1}`}
                                   style={{ 
                                     width: '60px', 
                                     height: '60px', 
                                     objectFit: 'cover',
                                     borderRadius: '4px',
                                     border: '1px solid #ddd'
                                   }}
                                 />
                                 <button
                                   type="button"
                                   onClick={() => {
                                     setCurrentVariantImages(prev => prev.filter((_, i) => i !== imgIndex));
                                     setCurrentVariantImagePreviews(prev => prev.filter((_, i) => i !== imgIndex));
                                   }}
                                   style={{
                                     position: 'absolute',
                                     top: '-5px',
                                     right: '-5px',
                                     background: 'red',
                                     color: 'white',
                                     border: 'none',
                                     borderRadius: '50%',
                                     width: '20px',
                                     height: '20px',
                                     cursor: 'pointer',
                                     fontSize: '12px'
                                   }}
                                 >
                                   ×
                                 </button>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                    
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
                      onClick={handleVariantAdd}
                      disabled={!currentVariant.sku || !currentVariant.price || currentVariant.price <= 0 || !currentVariant.stock || currentVariant.stock < 0}
                      style={{
                        padding: '10px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '10px',
                        opacity: (!currentVariant.sku || !currentVariant.price || currentVariant.price <= 0 || !currentVariant.stock || currentVariant.stock < 0) ? 0.5 : 1
                      }}
                    >
                      Add Variant
                    </button>
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