import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { fetchProductCategories, fetchProductSubcategories } from '../../api/products';

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
  vendor?: {
    id: string;
    businessName: string;
  };
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

interface AdminEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (success: boolean) => void;
  product: Product | null;
}

interface Category {
  id: number;
  name: string;
}

interface Subcategory extends Category {
  categoryId: number;
}

interface EditProductFormData {
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  hasVariants: boolean;
  basePrice: number | null;
  stock: number;
  status: InventoryStatus;
  discount: number | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  dealId: string | undefined;
  productImages: string[];
}

const AdminEditProductModal: React.FC<AdminEditProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
}) => {
  const [formData, setFormData] = useState<EditProductFormData>({
    name: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    hasVariants: false,
    basePrice: null,
    stock: 0,
    status: 'AVAILABLE',
    discount: null,
    discountType: 'PERCENTAGE',
    dealId: undefined,
    productImages: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: fetchProductCategories,
  });

  // Fetch subcategories when category changes
  const { data: subcategoriesData = [] } = useQuery({
    queryKey: ['subcategories', formData.categoryId],
    queryFn: () => formData.categoryId ? fetchProductSubcategories(Number(formData.categoryId)) : [],
    enabled: !!formData.categoryId,
  });

  useEffect(() => {
    if (subcategoriesData) {
      setSubcategories(subcategoriesData);
    }
  }, [subcategoriesData]);

  // Initialize form with product data
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        categoryId: product.categoryId ? String(product.categoryId) : '',
        subcategoryId: product.subcategoryId ? String(product.subcategoryId) : '',
        hasVariants: product.hasVariants || false,
        basePrice: product.basePrice || 0,
        stock: product.stock || 0,
        status: product.status || 'AVAILABLE',
        discount: product.discount || null,
        discountType: product.discountType || 'PERCENTAGE',
        dealId: product.dealId,
        productImages: product.images || [],
      });
      setExistingImages(product.images || []);
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'number' ? Number(value) : value;
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) {
      toast.error('No product to update');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const productData = {
        ...formData,
        categoryId: Number(formData.categoryId),
        subcategoryId: Number(formData.subcategoryId),
        images: existingImages,
      };

      await axios.put(`/api/products/${product.id}`, productData);
      toast.success('Product updated successfully');
      onClose();
      onSubmit(true);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Edit Product</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Vendor Field (Read-only) */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <input
                  type="text"
                  value={product.vendor?.id?.toString() || 'N/A'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory *
                </label>
                <select
                  name="subcategoryId"
                  value={formData.subcategoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!formData.categoryId}
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-2 border-t pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-3">Discount</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Amount
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type
                    </label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Amount ($)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminEditProductModal;