import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config";
import { ProductFormData, ProductVariant, Attribute } from "../../types/product";
import { useVendorAuth } from "../../context/VendorAuthContext";

enum InventoryStatus {
  AVAILABLE = "AVAILABLE",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  LOW_STOCK = "LOW_STOCK",
}

interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: number;
  name: string;
}

interface AddProductModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (
    product: ProductFormData,
    categoryId: number,
    subcategoryId: number,
    token: string,
    role: "admin" | "vendor"
  ) => Promise<void>;
  role: "admin" | "vendor";
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  show,
  onClose,
  onAdd,
  role,
}) => {
  const { authState } = useVendorAuth();
  console.log("AddProductModal: Vendor ID from context:", authState.vendor?.id);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    basePrice: "",
    stock: 0,
    discount: "0",
    discountType: "PERCENTAGE",
    vendorId: "",
    inventory: [],
    status: "AVAILABLE",
    productImages: [],
    categoryId: 0,
    subcategoryId: 0,
    size: [],
    hasVariants: false,
    variants: [],
    bannerId: null,
    brandId: null,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  
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
  
  // Attribute management for variants
  const [currentAttribute, setCurrentAttribute] = useState<Partial<Attribute>>({
    attributeType: "",
    attributeValues: [],
  });
  const [currentAttributeValue, setCurrentAttributeValue] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [token] = useState<string | null>(localStorage.getItem("token"));

  const statusOptions = Object.values(InventoryStatus);

  console.log("AddProductModal: Current form data:", formData);
  console.log("AddProductModal: Current variants:", variants);
  console.log("AddProductModal: Has variants:", formData.hasVariants);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
          setCategories(result.data);
          const defaultCategory = result.data.find(
            (cat: Category) => cat.id === 1
          );
          if (defaultCategory) setSelectedCategoryId(1);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load categories";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error fetching categories:", err);
      }
    };
    if (show) fetchCategories();
  }, [show, token]);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (selectedCategoryId) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/categories/${selectedCategoryId}/subcategories`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const result = await response.json();
          if (result.success) {
            setSubcategories(result.data);
            const defaultSubcategory = result.data.find(
              (sub: Subcategory) => sub.id === 2
            );
            if (defaultSubcategory) setSelectedSubcategoryId(2);
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load subcategories";
          setError(errorMessage);
          toast.error(errorMessage);
          console.error("Error fetching subcategories:", err);
        }
      } else {
        setSubcategories([]);
        setSelectedSubcategoryId(null);
      }
    };
    fetchSubcategories();
  }, [selectedCategoryId, token]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    console.log("AddProductModal: Adding variant:", currentVariant);
    
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

    setVariants((prev) => [...prev, newVariant]);
    setCurrentVariant({
      sku: "",
      price: 0,
      stock: 0,
      status: "AVAILABLE" as const,
      attributes: [],
      images: [],
    });
    
    console.log("AddProductModal: Variants after adding:", [...variants, newVariant]);
  };

  const handleVariantRemove = (skuToRemove: string) => {
    setVariants((prev) => prev.filter(v => v.sku !== skuToRemove));
  };

  const validateForm = () => {
    console.log("AddProductModal: Validating form with hasVariants:", formData.hasVariants);
    
    if (!formData.name) return "Product name is required";
    if (!selectedCategoryId) return "Category is required";
    if (!selectedSubcategoryId) return "Subcategory is required";
    
    if (!formData.hasVariants) {
      // Non-variant product validation
      if (!formData.basePrice || !/^\d+(\.\d{1,2})?$/.test(String(formData.basePrice))) {
        return "Valid base price is required for non-variant products (e.g., 29.99)";
      }
      if (!formData.stock || !/^\d+$/.test(String(formData.stock))) {
        return "Valid stock is required for non-variant products (integer)";
      }
      if (!formData.status) {
        return "Status is required for non-variant products";
      }
    } else {
      // Variant product validation
      if (variants.length === 0) {
        return "At least one variant is required for variant products";
      }
      
      // Validate each variant
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant.sku) {
          return `Variant ${i + 1} missing SKU`;
        }
        if (!variant.price || variant.price <= 0) {
          return `Variant ${i + 1} must have a valid positive price`;
        }
        if (!variant.stock || variant.stock < 0) {
          return `Variant ${i + 1} must have a valid non-negative stock`;
        }
        if (!variant.status) {
          return `Variant ${i + 1} must have a valid status`;
        }
      }
    }
    
    if (formData.discount && !/^\d+(\.\d{1,2})?$/.test(String(formData.discount))) {
      return "Valid discount is required (e.g., 10.50)";
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("AddProductModal: Form submission started");
    
    const validationError = validateForm();
    if (validationError) {
      console.error("AddProductModal: Validation error:", validationError);
      setError(validationError);
      toast.error(validationError);
      return;
    }
    
    if (!token) {
      const errorMessage = "Authentication token is missing";
      console.error("AddProductModal:", errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    if (!authState.vendor?.id) {
      const errorMessage = "Vendor ID is missing from context";
      console.error("AddProductModal:", errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    try {
      console.log("AddProductModal: Preparing payload with hasVariants:", formData.hasVariants);
      console.log("AddProductModal: Current variants:", variants);
      
      const payload: ProductFormData = {
        ...formData,
        vendorId: String(authState.vendor.id),
        categoryId: selectedCategoryId!,
        subcategoryId: selectedSubcategoryId!,
        variants: formData.hasVariants ? variants : undefined,
      };
      
      console.log("AddProductModal: Final payload:", payload);
      console.log("AddProductModal: Category ID:", selectedCategoryId);
      console.log("AddProductModal: Subcategory ID:", selectedSubcategoryId);
      
      await onAdd(
        payload,
        selectedCategoryId!,
        selectedSubcategoryId!,
        token,
        role
      );
      
      // Reset form data
      setFormData({
        name: "",
        description: "",
        basePrice: "",
        stock: 0,
        discount: "0",
        discountType: "PERCENTAGE",
        size: [],
        vendorId: "",
        inventory: [],
        status: "AVAILABLE",
        productImages: [],
        categoryId: 0,
        subcategoryId: 0,
        quantity: 0,
        hasVariants: false,
        variants: [],
        bannerId: null,
        brandId: null,
      });
      
      // Reset variant data
      setVariants([]);
      setCurrentVariant({
        sku: "",
        price: 0,
        stock: 0,
        status: "AVAILABLE" as const,
        attributes: [],
        images: [],
      });
      
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
      setError(null);
      onClose();
      
      console.log("AddProductModal: Form submission completed successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add product";
      console.error("AddProductModal: Error adding product:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal"
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          width: formData.hasVariants ? "800px" : "500px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          className="modal-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Add Product Vendor</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        {error && (
          <div
            className="modal-error"
            style={{
              color: "red",
              margin: "10px 0",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {error}
            <button
              onClick={() => setError(null)}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div
            className="modal-body"
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <div className="form-group">
              <label>Category</label>
              <select
                value={selectedCategoryId || ""}
                onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subcategory</label>
              <select
                value={selectedSubcategoryId || ""}
                onChange={(e) =>
                  setSelectedSubcategoryId(Number(e.target.value))
                }
                required
                disabled={!selectedCategoryId}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select Subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  minHeight: "100px",
                }}
              />
            </div>
            
            <div className="form-group">
              <label>
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
            {!formData.hasVariants && (
              <>
                <div className="form-group">
                  <label>Base Price *</label>
                  <input
                    type="text"
                    name="basePrice"
                    value={formData.basePrice ? String(formData.basePrice) : ""}
                    onChange={handleInputChange}
                    required
                    pattern="\d+(\.\d{1,2})?"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="text"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    pattern="\d+"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                  </select>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Discount</label>
              <input
                type="text"
                name="discount"
                value={formData.discount ? String(formData.discount) : ""}
                onChange={handleInputChange}
                pattern="\d+(\.\d{1,2})?"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div className="form-group">
              <label>Discount Type</label>
              <select
                name="discountType"
                value={formData.discountType ?? "PERCENTAGE"}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT">Flat</option>
              </select>
            </div>
            
            {/* Variant Management Section */}
            {formData.hasVariants && (
              <div className="form-group">
                <label style={{ fontWeight: 'bold', marginBottom: '10px' }}>Product Variants *</label>
                
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
              </div>
            )}

          </div>
          <div
            className="modal-footer"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
