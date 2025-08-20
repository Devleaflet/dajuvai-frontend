import React, { useState, useEffect } from "react";
import { ProductFormData, ProductVariant, Attribute } from "../../types/product";
import "../../Styles/NewProductModal.css";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { fetchCategories, fetchSubcategories, Category, Subcategory } from '../../api/categories';
import { updateProduct, uploadProductImages } from '../../api/products';
import axiosInstance from '../../api/axiosInstance';
import { ApiProduct } from "../Types/ApiProduct";
import { API_BASE_URL } from "../../config";
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
    basePrice: null,
    stock: 0,
    discount: null,
    discountType: null,
    size: [],
    status: InventoryStatus.AVAILABLE,
    productImages: [],
    categoryId: 0,
    subcategoryId: 0,
    quantity: 0,
    brand_id: null,
    dealId: null,
    inventory: [],
    vendorId: "",
    hasVariants: false,
    variants: [],
    bannerId: null,
    brandId: null,
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
    type: '',
    values: [{ value: '', nestedAttributes: [] }]
  });
  // Global attribute specs for generating combinations (ported from NewProductModal)
  const [attributeSpecs, setAttributeSpecs] = useState<Array<{ type: string; valuesText: string }>>([
    { type: '', valuesText: '' }
  ]);
  
  // Image state
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Helpers: parse and dedupe values from comma-separated text (ported)
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

  // Format attributes safely for display to avoid [object Object]
  const formatVariantAttributes = (attributes: any): string => {
    if (!attributes) return '';
    if (Array.isArray(attributes)) {
      return attributes
        .map((attr: any) => {
          const label = String(attr?.type ?? attr?.attributeType ?? '').trim();
          const valuesSrc = attr?.values ?? attr?.attributeValues ?? [];
          const vals = (Array.isArray(valuesSrc) ? valuesSrc : [valuesSrc])
            .map((v: any) => {
              if (v == null) return '';
              if (typeof v === 'object') return String(v.value ?? v.name ?? v.label ?? JSON.stringify(v));
              return String(v);
            })
            .filter(Boolean);
          return label && vals.length ? `${label}: ${vals.join(', ')}` : vals.join(', ');
        })
        .filter(Boolean)
        .join(', ');
    }
    if (typeof attributes === 'object') {
      return Object.entries(attributes)
        .map(([key, value]) => {
          if (value == null) return '';
          if (Array.isArray(value)) {
            const vals = value.map((v: any) => String(v?.value ?? v)).filter(Boolean);
            return `${key}: ${vals.join(', ')}`;
          }
          if (typeof value === 'object') {
            const val = (value as any).value ?? (value as any).name ?? '';
            return val ? `${key}: ${String(val)}` : `${key}: ${JSON.stringify(value)}`;
          }
          return `${key}: ${String(value)}`;
        })
        .filter(Boolean)
        .join(', ');
    }
    return String(attributes);
  };

  // Helper: compute cartesian product of attribute values (ported)
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

  // Generate variants from global attribute specs (ported)
  const generateVariants = () => {
    const cleanSpecs = attributeSpecs
      .map(s => ({ type: s.type.trim(), values: parseValues(s.valuesText) }))
      .filter(s => s.type && s.values.length > 0);

    if (cleanSpecs.length === 0) {
      toast.error('Add at least one attribute with values');
      return;
    }

    const valuesArrays = cleanSpecs.map(s => s.values);
    const combos = cartesian(valuesArrays);

    const newVariants: ProductVariant[] = combos.map((combo) => ({
      sku: `SKU-${combo.map(p => p.replace(/\s+/g, '-').toUpperCase()).join('-')}`,
      price: 0,
      stock: 0,
      status: InventoryStatus.AVAILABLE,
      attributes: cleanSpecs.map((spec, i) => ({
        type: spec.type,
        values: [{ value: combo[i], nestedAttributes: [] }]
      })),
      images: [],
      variantImages: []
    }));

    setVariants(newVariants);
  };

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

  const populateFormWithProduct = async () => {
    if (!product) return;
  
    console.log('🔄 POPULATING FORM WITH PRODUCT DATA:');
    console.log('Product (prop):', product);
    console.log('Product Category ID:', product.categoryId);
    console.log('Product Subcategory:', product.subcategory);
  
    // Extract category and subcategory IDs with multiple fallback strategies
    let categoryId = 0;
    let subcategoryId = 0;
  
    // Strategy 1: Direct properties
    if (product.categoryId) categoryId = Number(product.categoryId);
    if (product.subcategory?.id) subcategoryId = Number(product.subcategory.id);
  
    // Strategy 2: From subcategory object
    if (!categoryId && product.subcategory) {
      const sub = product.subcategory as any;
      if (sub.categoryId) categoryId = Number(sub.categoryId);
      if (sub.category?.id) categoryId = Number(sub.category.id);
    }
  
    // Strategy 3: Alternative subcategory ID extraction
    if (!subcategoryId) {
      const prod = product as any;
      if (prod.subcategoryId) subcategoryId = Number(prod.subcategoryId);
    }
  
    // Strategy 4: Hardcode fallback for testing (you can remove this later)
    if (!categoryId) {
      console.warn('⚠️ No category ID found, using fallback value 1');
      categoryId = 1; // Use a default category for testing
    }
    if (!subcategoryId) {
      console.warn('⚠️ No subcategory ID found, using fallback value 1');
      subcategoryId = 1; // Use a default subcategory for testing
    }
  
    console.log('🎯 FINAL EXTRACTED IDs:');
    console.log('Category ID:', categoryId);
    console.log('Subcategory ID:', subcategoryId);
  
    setSelectedCategoryId(categoryId);
  
    // Load subcategories for the product's category
    if (categoryId > 0) {
      try {
        const subcategories = await fetchSubcategories(categoryId);
        setSubcategories(subcategories || []);
        console.log('✅ Loaded subcategories:', subcategories);
      } catch (error) {
        console.error('Error loading subcategories:', error);
        toast.error('Failed to load subcategories');
      }
    }
  
    // Fetch freshest product by ID to ensure all variants are present
    let fullProduct: any = product;
    try {
      console.log('📥 Fetching latest product by ID for full variants:', product.id);
      const resp = await axiosInstance.get(`/api/product/${product.id}`);
      if (resp?.data?.product) {
        fullProduct = resp.data.product;
      }
    } catch (e) {
      console.warn('⚠️ Failed to fetch latest product by ID. Falling back to provided product. Error:', e);
    }

    // Compute hasVariants based on the presence of variants in the fresh product
    const hasVariants = fullProduct.variants && fullProduct.variants.length > 0;

    // Helper: normalize various backend attribute shapes to Attribute[]
    const normalizeVariantAttributes = (raw: any): Attribute[] => {
      if (!raw) return [];
      // Case 1: object map like { color: 'Red', size: 'M' | ['M','L'] }
      if (typeof raw === 'object' && !Array.isArray(raw)) {
        return Object.entries(raw).map(([key, value]) => ({
          type: String(key),
          values: (Array.isArray(value) ? value : [value]).map((val: any) => ({
            value: String((val && typeof val === 'object') ? (val.value ?? val.name ?? JSON.stringify(val)) : val),
            nestedAttributes: []
          }))
        }));
      }
      // Case 2: array of attribute objects
      if (Array.isArray(raw)) {
        return (raw as any[]).map((attr) => {
          const type = String(attr?.type ?? attr?.attributeType ?? '');
          const valsSrc = attr?.values ?? attr?.attributeValues ?? [];
          const valsArr = Array.isArray(valsSrc) ? valsSrc : [valsSrc];
          const values = valsArr
            .map((v: any) => {
              if (v == null) return null;
              if (typeof v === 'object') {
                const val = v.value ?? v.name ?? v.label ?? undefined;
                return val != null ? String(val) : JSON.stringify(v);
              }
              return String(v);
            })
            .filter(Boolean)
            .map((s: any) => ({ value: String(s), nestedAttributes: [] }));
          return { type, values } as Attribute;
        }).filter((a: Attribute) => a.type && a.values && a.values.length > 0);
      }
      return [];
    };

    // Map API variants to ProductVariant interface
    const mappedVariants: ProductVariant[] = fullProduct.variants && fullProduct.variants.length > 0
      ? fullProduct.variants.map((v: any) => {
          const imgs = v.variantImages || v.images || [];
          return ({
          sku: v.sku || '',
          price: Number(v.basePrice || 0),
          stock: Number(v.stock || 0),
          status: v.status || InventoryStatus.AVAILABLE,
          attributes: normalizeVariantAttributes(v.attributes),
          images: imgs,
          variantImages: imgs,
        });
        })
      : [];
  
    // Resolve main product images into string[] for UI and payload
    const ensureAbsolute = (u: string) => {
      if (!u) return '';
      if (/^https?:\/\//i.test(u)) return u;
      if (u.startsWith('//')) return `${window.location.protocol}${u}`;
      if (u.startsWith('/')) return `${API_BASE_URL.replace(/\/$/, '')}${u}`;
      return u;
    };
    const pickUrl = (img: any) => ensureAbsolute(typeof img === 'string' ? img : (img?.url || img?.secure_url || img?.imageUrl || img?.path || img?.src || ''));
    let resolvedProductImages: string[] = [];
    if (Array.isArray(fullProduct.productImages)) {
      resolvedProductImages = (fullProduct.productImages as any[]).map(pickUrl).filter(Boolean);
    } else if (Array.isArray(fullProduct.images)) {
      resolvedProductImages = (fullProduct.images as any[]).map(pickUrl).filter(Boolean);
    } else if (Array.isArray(fullProduct.gallery)) {
      resolvedProductImages = (fullProduct.gallery as any[]).map(pickUrl).filter(Boolean);
    } else if (Array.isArray(fullProduct.media)) {
      resolvedProductImages = (fullProduct.media as any[]).map(pickUrl).filter(Boolean);
    } else if (fullProduct.image) {
      resolvedProductImages = [pickUrl(fullProduct.image)].filter(Boolean);
    }
    console.log('🖼️ Resolved main product images:', resolvedProductImages);

    // Set form data with all required fields
    setFormData({
      name: fullProduct.name || "",
      description: fullProduct.description || "",
      basePrice: fullProduct.basePrice ?? null,
      stock: Number(fullProduct.stock ?? 0),
      discount: fullProduct.discount ?? null,
      discountType: fullProduct.discountType ?? null,
      size: Array.isArray(fullProduct.size) ? fullProduct.size : [],
      status: fullProduct.status || InventoryStatus.AVAILABLE,
      productImages: resolvedProductImages as (File | string)[],
      categoryId: Number(fullProduct.categoryId || selectedCategoryId || 0),
      subcategoryId: Number(subcategoryId || fullProduct.subcategory?.id || 0),
      quantity: Number(fullProduct.quantity ?? fullProduct.stock ?? 0),
      brand_id: fullProduct.brand_id ?? null,
      dealId: fullProduct.dealId ?? null,
      inventory: Array.isArray(fullProduct.inventory) ? fullProduct.inventory : [],
      vendorId: String(fullProduct.vendorId ?? fullProduct.vendor?.id ?? ''),
      hasVariants: hasVariants,
      variants: mappedVariants,
      bannerId: fullProduct.bannerId ?? null,
      brandId: fullProduct.brand?.id ?? null,
    });
  
    setVariants(mappedVariants);
    setExistingImages(resolvedProductImages);
  
    console.log('✅ Form populated with category:', categoryId, 'subcategory:', subcategoryId, 'variants:', mappedVariants);
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
      images: [],
      variantImages: []
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
    if (newAttribute.type && newAttribute.values[0]?.value) {
      const updatedVariants = [...variants];
      if (!updatedVariants[variantIndex].attributes) {
        updatedVariants[variantIndex].attributes = [];
      }
      // normalize empty nestedAttributes
      const normalized: Attribute = {
        type: newAttribute.type,
        values: newAttribute.values.map(v => ({ value: v.value, nestedAttributes: v.nestedAttributes || [] }))
      };
      updatedVariants[variantIndex].attributes!.push(normalized);
      setVariants(updatedVariants);
      setNewAttribute({ type: '', values: [{ value: '', nestedAttributes: [] }] });
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

  // Variant image handlers (ported)
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
        ? { ...v, images: (v.images || []).filter((_, idx) => idx !== imageIndex) }
        : v
    ));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const validateForm = (): string | null => {
    console.log('🔍 VALIDATION CHECK:');
    console.log('- Product name:', formData.name);
    console.log('- Selected category ID:', selectedCategoryId);
    console.log('- Subcategory ID:', formData.subcategoryId);
    console.log('- Has variants:', formData.hasVariants);
    console.log('- Base price:', formData.basePrice);
    console.log('- Stock:', formData.stock);
    console.log('- Variants count:', variants.length);
    
    if (!formData.name.trim()) {
      console.log('❌ Product name is missing');
      return 'Product name is required';
    }
    if (!selectedCategoryId) {
      console.log('❌ Category not selected');
      return 'Please select a category';
    }
    if (!formData.subcategoryId) {
      console.log('❌ Subcategory not selected');
      return 'Please select a subcategory';
    }
    
    if (!formData.hasVariants) {
      if (formData.basePrice == null || Number(formData.basePrice) <= 0) {
        console.log('❌ Base price is invalid:', formData.basePrice);
        return 'Base price is required';
      }
      if (formData.stock == null || Number(formData.stock) < 0) {
        console.log('❌ Stock is invalid:', formData.stock);
        return 'Stock quantity is required';
      }
    } else {
      if (variants.length === 0) {
        console.log('❌ No variants found');
        return 'At least one variant is required';
      }
      for (const variant of variants) {
        if (!variant.sku.trim()) {
          console.log('❌ Variant missing SKU:', variant);
          return 'All variants must have a SKU';
        }
        if (!variant.price || variant.price <= 0) {
          console.log('❌ Variant invalid price:', variant);
          return 'All variants must have a valid price';
        }
        if (variant.stock === undefined || variant.stock < 0) {
          console.log('❌ Variant invalid stock:', variant);
          return 'All variants must have stock quantity';
        }
      }
    }
    
    console.log('✅ All validation checks passed');
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 UPDATE PRODUCT BUTTON CLICKED!');
    e.preventDefault();
    
    if (!product) {
      console.error('❌ No product to update');
      toast.error('No product to update');
      return;
    }

    console.log('🔍 Validating form...');
    const validationError = validateForm();
    if (validationError) {
      console.error('❌ Validation error:', validationError);
      toast.error(validationError);
      return;
    }

    console.log('✅ Form validation passed');
    setIsLoading(true);

    try {
      console.log('🔄 EDIT PRODUCT MODAL SUBMIT START');
      console.log('🏷️ Selected Category ID:', selectedCategoryId);
      console.log('📝 Form Data:', formData);
      console.log('🔄 Variants:', variants);
      console.log('🖼️ New Images:', images.length);
      console.log('🖼️ Existing Images:', existingImages.length);

      // Step 1: Upload new images if any
      let newImageUrls: string[] = [];
      if (images.length > 0) {
        console.log('📤 Uploading new images...');
        const uploadResponse = await uploadProductImages(images);
        if (uploadResponse.success) {
          newImageUrls = uploadResponse.urls;
          console.log('✅ Images uploaded successfully:', newImageUrls);
        } else {
          throw new Error('Failed to upload images');
        }
      }

      // Step 2: Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];
      console.log('🖼️ All Images:', allImages);

      // Step 3: Prepare product data according to new API contract
      const updatePayload: any = {
        name: formData.name,
        subcategoryId: formData.subcategoryId,
        hasVariants: formData.hasVariants,
      };

      // Add optional fields
      if (formData.description) updatePayload.description = formData.description;
      if (formData.discount !== undefined && formData.discount !== null && formData.discount !== '') {
        updatePayload.discount = typeof formData.discount === 'string' ? parseFloat(formData.discount) : formData.discount;
      }
      if (formData.discountType) updatePayload.discountType = formData.discountType;
      if (formData.dealId) updatePayload.dealId = formData.dealId;
      if (formData.bannerId) updatePayload.bannerId = formData.bannerId;
      if (allImages.length > 0) updatePayload.productImages = allImages;

      // Handle variants vs non-variants
      if (formData.hasVariants) {
        if (variants.length > 0) {
          // Upload new variant images and merge with existing URLs
          const variantsWithImageUrls = await Promise.all(
            variants.map(async (variant) => {
              const variantImages = (variant.images || variant.variantImages || []) as (File | string)[];
              const variantImageFiles = variantImages.filter(img => img instanceof File) as File[];
              let variantImageUrls = variantImages.filter(img => typeof img === 'string') as string[];

              if (variantImageFiles.length > 0) {
                try {
                  const uploadResponse = await uploadProductImages(variantImageFiles);
                  if (uploadResponse.success) {
                    variantImageUrls = [...variantImageUrls, ...uploadResponse.urls];
                  } else {
                    console.error('Failed to upload some variant images:', uploadResponse.message);
                  }
                } catch (err) {
                  console.error('Variant image upload error:', err);
                }
              }

              return { ...variant, images: variantImageUrls };
            })
          );

          // Convert variants to match API structure (flatten attributes and map images)
          updatePayload.variants = variantsWithImageUrls.map((variant: ProductVariant) => ({
            sku: variant.sku,
            basePrice: variant.price,
            discount: 0,
            discountType: 'PERCENTAGE',
            attributes: (variant.attributes || []).reduce((acc, attr) => {
              const key = attr.type?.trim().toLowerCase();
              const firstVal = attr.values && attr.values[0] ? attr.values[0].value : '';
              if (key && firstVal) (acc as any)[key] = firstVal;
              return acc;
            }, {} as Record<string, string>),
            variantImages: (variant.images || []) as string[],
            stock: variant.stock,
            status: variant.status || 'AVAILABLE'
          }));
        }
      } else {
        // For non-variant products, these fields are required
        updatePayload.basePrice = typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) : formData.basePrice;
        updatePayload.stock = typeof formData.stock === 'string' ? parseInt(formData.stock) : formData.stock;
        updatePayload.status = formData.status || 'AVAILABLE';
      }

      console.log('=== FINAL UPDATE PAYLOAD FOR API ===');
      console.log('Update Payload:', JSON.stringify(updatePayload, null, 2));
      console.log('Product ID:', product.id);
      console.log('Category ID:', selectedCategoryId);
      console.log('Subcategory ID:', formData.subcategoryId);

      // Step 4: Update product with JSON payload
      const response = await updateProduct(
        product.id,
        selectedCategoryId,
        formData.subcategoryId,
        updatePayload
      );

      if (response.success) {
        toast.success('Product updated successfully!');
        // Call the parent callback for any additional handling
        await onSave(product.id, formData, selectedCategoryId, formData.subcategoryId);
        handleClose();
      } else {
        throw new Error(response.message || 'Failed to update product');
      }
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
      basePrice: null,
      stock: 0,
      discount: null,
      discountType: null,
      size: [],
      status: InventoryStatus.AVAILABLE,
      productImages: [],
      categoryId: 0,
      subcategoryId: 0,
      quantity: 0,
      brand_id: null,
      dealId: null,
      inventory: [],
      vendorId: "",
      hasVariants: false,
      variants: [],
      bannerId: null,
      brandId: null,
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