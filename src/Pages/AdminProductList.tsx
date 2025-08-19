import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllProducts, deleteProduct } from '../api/products';
import { Product } from '../Components/Types/EditProductTypes';
import { toast } from 'react-hot-toast';
// Import the correct modal component
import AdminEditProductModal from '../Components/Modal/EditProductModal';
import './Admin.css';

const AdminProductList: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const productsPerPage = 10;

  // Fetch all products
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-products', currentPage, searchQuery],
    queryFn: () => fetchAllProducts(currentPage, productsPerPage, searchQuery),
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      // Note: This assumes the product object has categoryId and subcategoryId
      // If not, you'll need to fetch the product details first
      const numericId = Number(productId);
      return deleteProduct(numericId, 0, 0); // Using 0 as placeholder for category/subcategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete product');
      console.error('Delete error:', error);
    },
  });

  const handleEdit = (product: Product) => {
    // Ensure the product has all required fields
    const productForEdit: Product = {
      ...product,
      id: String(product.id),
      name: String(product.name || product.title || ''),
      description: String(product.description || ''),
      categoryId: Number(product.categoryId) || 0,
      subcategoryId: Number(product.subcategoryId) || 0,
      hasVariants: Boolean(product.hasVariants || product.variants?.length > 0),
      basePrice: typeof product.basePrice === 'number' ? product.basePrice :
                typeof product.price === 'number' ? product.price :
                typeof product.price === 'string' ? parseFloat(product.price) : 0,
      stock: Number(product.stock) || 0,
      status: (product.status as 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' | 'DISCONTINUED' | 'UNAVAILABLE') || 'AVAILABLE',
      images: Array.isArray(product.images) ? product.images :
             Array.isArray(product.productImages) ? product.productImages :
             product.image ? [product.image] : [],
      variants: (Array.isArray(product.variants) ? product.variants : []).map(variant => ({
        sku: String(variant.sku || ''),
        price: Number(variant.price) || 0,
        stock: Number(variant.stock) || 0,
        status: (variant.status as 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' | 'DISCONTINUED' | 'UNAVAILABLE') || 'AVAILABLE',
        attributes: Array.isArray(variant.attributes) ? variant.attributes : [],
        images: Array.isArray(variant.images) ? variant.images : []
      }))
    };
    
    setEditingProduct(productForEdit);
    setIsEditModalOpen(true);
    setIsModalClosing(false);
  };

  const handleCloseEditModal = () => {
    // Start closing animation
    setIsModalClosing(true);
    // Wait for animation to complete before unmounting
    setTimeout(() => {
      setIsEditModalOpen(false);
      setEditingProduct(null);
      setIsModalClosing(false);
    }, 300); // Match this with your CSS transition duration
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) return <div>Loading products...</div>;
  if (isError) return <div>Error loading products</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>
      
      {/* Search and Filter */}
      <div className="mb-6 flex justify-between items-center">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.products?.map((product: Product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-10 w-10 rounded-md overflow-hidden">
                    <img
                      src={product.image || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.vendor || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : (Number(product.price) || 0).toFixed(2)}
                    {product.originalPrice && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        ${typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice).toFixed(2) : (Number(product.originalPrice) || 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.status === 'OUT_OF_STOCK'
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {product.status === 'OUT_OF_STOCK' 
                      ? 'Out of Stock' 
                      : product.status === 'LOW_STOCK'
                        ? 'Low Stock'
                        : 'In Stock'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(product.id.toString())}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{(currentPage - 1) * productsPerPage + 1}</span> to{' '}
          <span className="font-medium">
            {Math.min(currentPage * productsPerPage, data?.total || 0)}
          </span>{' '}
          of <span className="font-medium">{data?.total || 0}</span> products
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!data?.hasMore}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProductList;
