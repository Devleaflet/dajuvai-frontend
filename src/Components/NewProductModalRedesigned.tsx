import React, { useState, useEffect } from "react";
import { fetchCategories, fetchSubcategories, Category, Subcategory } from '../api/categories';
import { createProduct, uploadProductImages } from '../api/products';
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

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (success: boolean) => void;
}

type ProductVariant = {
  sku: string;
  price: number;
  stock: number;
  status: InventoryStatus;
  attributes: {
    type: string;
    values: {
      value: string;
      nestedAttributes?: {
        type: string;
        values: string[];
      }[];
    }[];
  }[];
  images: (File | string)[];
};

type NewProductFormData = {
  name: string;
  description: string;
  basePrice?: number;
  stock?: number;
  discount?: number;
  discountType?: string;
  status: InventoryStatus;
  productImages: (File | string)[];
  categoryId?: number;
  subcategoryId?: number;
  brand_id?: number | null;
  dealId?: number | null;
  hasVariants: boolean;
  variants: ProductVariant[];
};

const AttributeManager = ({
  attributes,
  onUpdate
}: {
  attributes: ProductVariant['attributes'];
  onUpdate: (updated: ProductVariant['attributes']) => void;
}) => {
  const addAttributeType = () => {
    onUpdate([...attributes, { type: '', values: [] }]);
  };

  const addNestedAttribute = (attrIndex: number) => {
    const updated = [...attributes];
    updated[attrIndex].values.push({
      value: '',
      nestedAttributes: []
    });
    onUpdate(updated);
  };

  return (
    <div className="attribute-manager">
      {attributes.map((attr, attrIndex) => (
        <div key={attrIndex} className="attribute-type">
          <input
            value={attr.type}
            onChange={(e) => {
              const updated = [...attributes];
              updated[attrIndex].type = e.target.value;
              onUpdate(updated);
            }}
            placeholder="Attribute type (e.g. Color)"
          />

          <div className="attribute-values">
            {attr.values.map((val, valIndex) => (
              <div key={valIndex} className="attribute-value">
                <input
                  value={val.value}
                  onChange={(e) => {
                    const updated = [...attributes];
                    updated[attrIndex].values[valIndex].value = e.target.value;
                    onUpdate(updated);
                  }}
                  placeholder="Value (e.g. Red)"
                />

                {/* Nested attributes */}
                {val.nestedAttributes?.map((nested, nestedIndex) => (
                  <div key={nestedIndex} className="nested-attribute">
                    <input
                      value={nested.type}
                      onChange={(e) => {
                        const updated = [...attributes];
                        updated[attrIndex].values[valIndex].nestedAttributes![nestedIndex].type = e.target.value;
                        onUpdate(updated);
                      }}
                      placeholder="Nested type (e.g. Size)"
                    />

                    <input
                      value={nested.values.join(',')}
                      onChange={(e) => {
                        const updated = [...attributes];
                        updated[attrIndex].values[valIndex].nestedAttributes![nestedIndex].values =
                          e.target.value.split(',');
                        onUpdate(updated);
                      }}
                      placeholder="Comma-separated values (e.g. S,M,L)"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const updated = [...attributes];
                    updated[attrIndex].values[valIndex].nestedAttributes = [
                      ...(updated[attrIndex].values[valIndex].nestedAttributes || []),
                      { type: '', values: [] }
                    ];
                    onUpdate(updated);
                  }}
                >
                  Add Nested Attribute
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addNestedAttribute(attrIndex)}
            >
              Add Value
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={addAttributeType}>
        Add Attribute Type
      </button>
    </div>
  );
};

const NewProductModal: React.FC<NewProductModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { authState } = useVendorAuth();

  // Form state
  const [formData, setFormData] = useState<NewProductFormData>({
    name: "",
    description: "",
    basePrice: undefined,
    stock: undefined,
    discount: undefined,
    discountType: undefined,
    status: InventoryStatus.AVAILABLE,
    productImages: [],
    categoryId: undefined,
    subcategoryId: undefined,
    brand_id: undefined,
    dealId: undefined,
    hasVariants: false,
    variants: [],
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);

  // Variant state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newAttribute, setNewAttribute] = useState<{
    attributeType: string;
    attributeValues: string[];
  }>({
    attributeType: '',
    attributeValues: ['']
  });

  // Global attribute specs for generating combinations
  const [attributeSpecs, setAttributeSpecs] = useState<Array<{ type: string; valuesText: string }>>([
    { type: '', valuesText: '' }
  ]);

  // Image state: support both local Files and already-uploaded URLs
  const [images, setImages] = useState<Array<File | string>>([]);

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadDeals();
    }
  }, [isOpen]);

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

  const handleInputChange = (field: keyof NewProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-progress steps
    if (field === 'name' && value && currentStep === 1) {
      setCurrentStep(2);
    }
    if (field === 'hasVariants' && currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      sku: `SKU-${variants.length + 1}`,
      price: 0,
      stock: 0,
      status: InventoryStatus.AVAILABLE,
      attributes: [],
      images: [],
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
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].attributes = [
      ...(updatedVariants[variantIndex].attributes || []),
      {
        type: newAttribute.attributeType,
        values: newAttribute.attributeValues.map(value => ({
          value,
          nestedAttributes: []
        }))
      }
    ];
    setVariants(updatedVariants);
    setNewAttribute({ attributeType: '', attributeValues: [''] });
  };

  const removeAttribute = (variantIndex: number, attributeIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].attributes.splice(attributeIndex, 1);
    setVariants(updatedVariants);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
      setCurrentStep(3);
    }
  };

  // Support drag-and-drop for product images
  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      const droppedFiles = Array.from(dt.files).filter(f => f.type.startsWith('image/'));
      if (droppedFiles.length > 0) {
        setImages(prev => [...prev, ...droppedFiles]);
        setCurrentStep(3);
        toast.info(`${droppedFiles.length} image${droppedFiles.length > 1 ? 's' : ''} added`);
      }
      dt.clearData();
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleVariantImageUpload = (e: React.ChangeEvent<HTMLInputElement>, variantIndex: number) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files);
      setVariants(prev => prev.map((v, i) =>
        i === variantIndex
          ? { ...v, images: [...(v.images || []), ...newImages] }
          : v
      ));
    }
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    setVariants(prev => prev.map((v, i) =>
      i === variantIndex
        ? {
          ...v,
          images: (v.images || []).filter((_, idx) => idx !== imageIndex)
        }
        : v
    ));
  };

  // Helper: compute cartesian product of attribute values
  const cartesian = (arrays: string[][]): string[][] => {
    return arrays.reduce<string[][]>((acc, curr) => {
      if (acc.length === 0) return curr.map(v => [v]);
      const next: string[][] = [];
      for (const a of acc) {
        for (const b of curr) {
          next.push([...a, b]);
        }
      }
      return next;
    }, []);
  };

  // Helpers: parse and dedupe values from comma-separated text
  const parseValues = (text: string): string[] => {
    const raw = text.split(',');
    const trimmed = raw.map(v => v.trim()).filter(Boolean);
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const v of trimmed) {
      const key = v.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(v);
      }
    }
    return unique;
  };

  // Generate variants from global attribute specs
  const generateVariants = () => {
    // Sanitize input
    const cleanSpecs = attributeSpecs
      .map(s => ({ type: s.type.trim(), values: parseValues(s.valuesText) }))
      .filter(s => s.type && s.values.length > 0);

    if (cleanSpecs.length === 0) {
      toast.error('Add at least one attribute with values');
      return;
    }

    const valuesArrays = cleanSpecs.map(s => s.values);
    const combos = cartesian(valuesArrays);

    const newVariants: ProductVariant[] = combos.map((combo, idx) => {
      const titleParts: string[] = combo;
      const skuParts: string[] = combo.map(p => p.replace(/\s+/g, '-').toUpperCase());
      return {
        sku: `SKU-${skuParts.join('-')}`,
        price: 0,
        stock: 0,
        status: InventoryStatus.AVAILABLE,
        attributes: cleanSpecs.map((spec, i) => ({
          type: spec.type,
          values: [{ value: combo[i] }]
        })),
        images: []
      } as ProductVariant;
    });

    setVariants(newVariants);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!selectedCategoryId) return 'Please select a category';
    if (!formData.subcategoryId) return 'Please select a subcategory';

    if (!formData.hasVariants) {
      if (!formData.basePrice || formData.basePrice <= 0) return 'Base price is required';
      if (formData.stock === undefined || formData.stock < 0) return 'Stock quantity is required';
    } else {
      if (variants.length === 0) return 'At least one variant is required';
      for (const variant of variants) {
        if (!variant.sku.trim()) return 'All variants must have a SKU';
        if (!variant.price || variant.price <= 0) return 'All variants must have a valid price';
        if (variant.stock === undefined || variant.stock < 0) return 'All variants must have stock quantity';
      }
    }

    // Validate discount if provided
    if (formData.discount !== undefined && formData.discount !== null) {
      if (formData.discount < 0) return 'Discount cannot be negative';
      if (!formData.discountType) return 'Discount type is required when discount amount is provided';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log(' NEW PRODUCT MODAL SUBMIT START');
    console.log(' Selected Category ID:', selectedCategoryId);
    console.log(' Form Data:', formData);
    console.log(' Variants:', variants);
    console.log(' Images:', images);

    if (!selectedCategoryId || !formData.subcategoryId) {
      console.error('Missing category or subcategory:', { selectedCategoryId, subcategoryId: formData.subcategoryId });
      toast.error('Please select category and subcategory');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare variants data
      const variantsData = variants.map(variant => ({
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock,
        status: variant.status,
        attributes: variant.attributes.map(attr => ({
          type: attr.type,
          values: attr.values.map(val => ({
            value: val.value,
            nestedAttributes: val.nestedAttributes?.map(nested => ({
              type: nested.type,
              values: nested.values
            })) || []
          }))
        })),
        images: variant.images
      }));

      // Step 1: Upload main product images first to get URLs and merge with any existing URL strings
      let productImageUrls: string[] = [];
      const imageFiles = images.filter(img => img instanceof File) as File[];
      const existingImageUrls = images.filter(img => typeof img === 'string') as string[];
      if (imageFiles.length > 0) {
        console.log(' Uploading product images...');
        const uploadResponse = await uploadProductImages(imageFiles);
        if (uploadResponse.success) {
          productImageUrls = [...existingImageUrls, ...uploadResponse.urls];
          console.log(' Product images uploaded successfully:', productImageUrls);
        } else {
          throw new Error(uploadResponse.message || 'Failed to upload product images');
        }
      } else {
        // No new files, keep any existing URLs (if any)
        productImageUrls = [...existingImageUrls];
      }

      // Warn if files were selected but no URLs were produced
      if (imageFiles.length > 0 && productImageUrls.length === existingImageUrls.length) {
        console.warn('No product image URLs returned from upload');
        toast.warn('Product images failed to upload. Please try again or add via Edit later.');
      }

      // Step 2: Upload variant images and collect their URLs
      const variantsWithImageUrls = await Promise.all(
        variantsData.map(async (variant) => {
          const variantImages = variant.images || [];
          const variantImageFiles = variantImages.filter(img => img instanceof File) as File[];
          let variantImageUrls = variantImages.filter(img => typeof img === 'string') as string[];

          // Upload any new variant images
          if (variantImageFiles.length > 0) {
            console.log(` Uploading ${variantImageFiles.length} images for variant ${variant.sku}`);
            const uploadResponse = await uploadProductImages(variantImageFiles);
            if (uploadResponse.success) {
              variantImageUrls = [...variantImageUrls, ...uploadResponse.urls];
              console.log(` Variant ${variant.sku} images uploaded:`, uploadResponse.urls);
            } else {
              console.error(`Failed to upload images for variant ${variant.sku}:`, uploadResponse.message);
            }
          }

          return {
            ...variant,
            images: variantImageUrls
          };
        })
      );

      // Step 3: Prepare product data according to new API specification
      const productData: any = {
        name: formData.name,
        description: formData.description || '',
        hasVariants: formData.hasVariants,
        productImages: productImageUrls,
        dealId: formData.dealId || 0,
        bannerId: 0,
        discount: formData.discount !== undefined && formData.discount !== null ? parseFloat(formData.discount.toString()) : 0,
        discountType: formData.discountType || 'PERCENTAGE'
      };

      if (formData.hasVariants) {
        // For variant products, structure variants according to API spec
        productData.variants = variantsWithImageUrls.map((variant) => ({
          sku: variant.sku,
          basePrice: variant.price,
          discount: 0,
          discountType: 'PERCENTAGE',
          attributes: variant.attributes ?
            variant.attributes.reduce((acc: any, attr: any) => {
              const key = (attr.type || '').toString().trim().toLowerCase();
              const firstVal = attr.values && attr.values[0] ? attr.values[0].value : '';
              if (key && firstVal) acc[key] = firstVal;
              return acc;
            }, {}) : {},
          variantImages: variant.images,
          stock: variant.stock,
          status: variant.status
        }));

        // Set base product fields for variant products
        productData.basePrice = 0;
        productData.stock = 0;
        productData.status = 'AVAILABLE';
      } else {
        // For non-variant products
        productData.basePrice = parseFloat(formData.basePrice?.toString() || '0');
        productData.stock = parseInt(formData.stock?.toString() || '0');
        productData.status = formData.status || 'AVAILABLE';
        productData.variants = [];
      }

      console.log('=== FINAL PRODUCT DATA FOR API ===');
      console.log('Product Data:', JSON.stringify(productData, null, 2));
      console.log('Category ID:', selectedCategoryId);
      console.log('Subcategory ID:', formData.subcategoryId);

      // Step 3: Create product with JSON payload
      const response = await createProduct(
        selectedCategoryId,
        formData.subcategoryId,
        productData
      );

      // Treat successful resolve as success; API shape may not include a 'success' flag
      toast.success('Product created successfully!');
      onSubmit(true);
      handleClose();
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
      onSubmit(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      name: "",
      description: "",
      basePrice: undefined,
      stock: undefined,
      discount: undefined,
      discountType: undefined,
      status: InventoryStatus.AVAILABLE,
      productImages: [],
      categoryId: undefined,
      subcategoryId: undefined,
      brand_id: undefined,
      dealId: undefined,
      hasVariants: false,
      variants: [],
    });
    setVariants([]);
    setSelectedCategoryId(0);
    setSubcategories([]);
    setImages([]);
    setCurrentStep(1);
    onClose();
  };



  // Initialize with one variant if hasVariants is true
  useEffect(() => {
    if (formData.hasVariants && variants.length === 0) {
      addVariant();
    }
  }, [formData.hasVariants]);

  const handleAttributeChange = (variantIndex: number, attributes: Array<{
    type: string;
    values: Array<{
      value: string;
      nestedAttributes?: Array<{
        type: string;
        values: string[];
      }>;
    }>;
  }>) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].attributes = attributes;
    setFormData({ ...formData, variants: updatedVariants });
  };

  if (!isOpen) return null;

  return (
    <div className="new-product-modal-overlay">
      <div className="new-product-modal" onClick={(e) => e.stopPropagation()}>
        <div className="new-product-modal-header">
          <h2 className="new-product-modal-title">Create New Product</h2>
          <button className="new-product-modal-close" onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
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
                    <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" />
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
                    <path d="M9 11H7V9H9V11ZM13 11H11V9H13V11ZM17 11H15V9H17V11ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" />
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
                      <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" />
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
                      value={formData.basePrice || ''}
                      onChange={(e) => handleInputChange('basePrice', Number(e.target.value))}
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
                      value={formData.stock || ''}
                      onChange={(e) => handleInputChange('stock', Number(e.target.value))}
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
                </div>
              </div>
            )}


            {/* Discount Section */}
            {!formData.hasVariants && (
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L12 2L3 7V9C3 14.55 6.84 19.74 12 21C17.16 19.74 21 14.55 21 9Z" />
                    </svg>
                  </div>
                  <h3 className="section-title">Discount</h3>
                </div>

                <div className="form-grid two-columns">
                  <div className="form-group">
                    <label className="form-label">Discount Amount</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.discount || ''}
                      onChange={(e) => handleInputChange('discount', e.target.value === '' ? undefined : Number(e.target.value))}
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
                      onChange={(e) => handleInputChange('discountType', e.target.value || undefined)}
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
                      <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" />
                    </svg>
                  </div>
                  <h3 className="section-title">Product Variants</h3>
                </div>

                {/* Attribute specs builder */}
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
                        <div className="label-hint">Tip: press comma to separate values. Duplicates are ignored.</div>
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
                          {(variant.attributes && variant.attributes.length > 0)
                            ? variant.attributes.map(a => (a.values?.[0]?.value || '')).filter(Boolean).join(' - ')
                            : `Variant ${index + 1}`}
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

                      {/* Attributes (read-only summary) */}
                      {variant.attributes && variant.attributes.length > 0 && (
                        <div className="attribute-container">
                          <div className="label-hint">Attributes</div>
                          <div className="attribute-tags">
                            {variant.attributes.flatMap((attr, aIdx) =>
                              (attr.values || []).map((val, vIdx) => (
                                <span key={`${aIdx}-${vIdx}`} className="attribute-tag">
                                  {attr.type}: {val.value}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Variant Images */}
                      <div className="form-group full-width">
                        <label className="form-label">Variant Images</label>
                        <div className="image-upload-container"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById(`variant-image-${index}`)?.click();
                          }}>
                          <div className="upload-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
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
                        {variant.images && variant.images.length > 0 && (
                          <div className="image-preview-grid">
                            {variant.images.map((img, imgIndex) => (
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
                </div>

                <button
                  type="button"
                  className="btn btn-add"
                  onClick={addVariant}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L12 2L3 7V9C3 14.55 6.84 19.74 12 21C17.16 19.74 21 14.55 21 9Z" />
                  </svg>
                  Add Another Variant
                </button>
              </div>
            )}


            {/* Discount Section */}
            {formData.hasVariants && (
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L12 2L3 7V9C3 14.55 6.84 19.74 12 21C17.16 19.74 21 14.55 21 9Z" />
                    </svg>
                  </div>
                  <h3 className="section-title">Discount</h3>
                </div>

                <div className="form-grid two-columns">
                  <div className="form-group">
                    <label className="form-label">Discount Amount</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.discount || ''}
                      onChange={(e) => handleInputChange('discount', e.target.value === '' ? undefined : Number(e.target.value))}
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
                      onChange={(e) => handleInputChange('discountType', e.target.value || undefined)}
                    >
                      <option value="">No discount</option>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Fixed Amount</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Image Upload Section */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z" />
                  </svg>
                </div>
                <h3 className="section-title">Product Images</h3>
              </div>

              <div
                className="image-upload-container"
                onClick={() => document.getElementById('image-upload')?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={handleImageDrop}
              >
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                </div>
                <div className="upload-text">Drop images here or click to browse</div>
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
                <div className="image-preview-grid">
                  {images.map((image, index) => (
                    <div key={index} className="image-preview">
                      <img
                        src={image instanceof File ? URL.createObjectURL(image) : (image as string)}
                        alt={`Preview ${index + 1}`}
                      />
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
                >
                  <div className="btn-content">
                    {isLoading && (
                      <div className="loading-spinner">
                        <div className="loading-dots">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      </div>
                    )}
                    <span>{isLoading ? 'Creating Product...' : 'Create Product'}</span>
                  </div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewProductModal;