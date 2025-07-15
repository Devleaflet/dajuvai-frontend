import React, { useState} from 'react';
import { Sidebar } from '../Components/Sidebar';
import Header from '../Components/Header';
import ProductList from '../Components/ProductList';
import ProductModal from '../Components/ProductModal';
import EditProductModal from '../Components/Modal/EditProductModal';
import '../Styles/VendorProduct.css';
import { Product as ApiProduct, ProductFormData } from '../types/product';
import { createProduct, fetchProducts, updateProduct } from '../api/products';
import { useVendorAuth } from '../context/VendorAuthContext';
import Pagination from '../Components/Pagination';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Product } from '../Components/Types/Product';
// Add XLSX import for Excel export
import * as XLSX from 'xlsx';

const ProductListSkeleton: React.FC = () => {
  return (
    <div className="vendor-product__skeleton">
      <div className="vendor-product__skeleton-header">
        <div className="vendor-product__skeleton-search shimmer"></div>
      </div>
      <div className="vendor-product__skeleton-tabs">
        {[1, 2, 3, 4].map((i) => (
          <div key={`tab-${i}`} className="vendor-product__skeleton-tab shimmer"></div>
        ))}
      </div>
      <div className="vendor-product__skeleton-table">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={`row-${i}`} className="vendor-product__skeleton-row">
            <div className="vendor-product__skeleton-cell shimmer" style={{width:'2.5rem',height:'2.5rem',borderRadius:'0.5rem'}}></div>
            <div className="vendor-product__skeleton-cell shimmer" style={{width:'8rem',height:'1.1rem'}}></div>
            <div className="vendor-product__skeleton-cell shimmer" style={{width:'5rem',height:'1.1rem'}}></div>
            <div className="vendor-product__skeleton-cell shimmer" style={{width:'4rem',height:'1.1rem'}}></div>
            <div className="vendor-product__skeleton-cell shimmer" style={{width:'3rem',height:'1.1rem'}}></div>
            <div className="vendor-product__skeleton-cell shimmer" style={{width:'2.5rem',height:'1.1rem'}}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VendorProduct: React.FC = () => {
  const { authState } = useVendorAuth();
  const queryClient = useQueryClient();
  const [isMobile] = useState<boolean>(window.innerWidth < 768);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [productsPerPage] = useState<number>(10);
  const [docketHeight] = useState<number>(80);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  // Add search and sort state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("newest");

  // React Query for products
  const {
    data: productData,
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'vendor-products',
      authState.vendor?.id,
      currentPage,
      productsPerPage,
      authState.token
    ],
    queryFn: async () => {
      if (!authState.vendor?.id || !authState.token) throw new Error('Missing vendor or token');
      const response = await fetchProducts(
        Number(authState.vendor.id),
        currentPage,
        productsPerPage
      );
      if (!response.data || typeof response.data !== 'object') throw new Error('Invalid response');
      if (!response.data.success || !response.data.data || !Array.isArray(response.data.data.products)) throw new Error('Invalid response format');
      const products: Product[] = response.data.data.products.map((product: ApiProduct): Product => {
        const images = Array.isArray(product.productImages)
          ? product.productImages.map((img: string | { url?: string }) => (typeof img === 'string' ? img : img.url || ''))
          : [];
        // Calculate discounted price
        let basePrice = 0;
        if (typeof product.basePrice === 'number') basePrice = product.basePrice;
        else if (typeof product.basePrice === 'string') basePrice = parseFloat(product.basePrice);
        else if (typeof product.basePrice === 'undefined' || product.basePrice === null) basePrice = 0;
        let discount = 0;
        if (typeof product.discount === 'number') discount = product.discount;
        else if (typeof product.discount === 'string') discount = parseFloat(product.discount);
        else if (typeof product.discount === 'undefined' || product.discount === null) discount = 0;
        const discountType = (product.discountType || '').toUpperCase();
        let price = basePrice;
        let originalPrice: string | undefined = undefined;
        if (discount > 0 && (discountType === 'PERCENTAGE' || discountType === 'FLAT' || discountType === 'FIXED')) {
          if (discountType === 'PERCENTAGE') {
            price = basePrice - (basePrice * discount / 100);
            originalPrice = basePrice.toFixed(2);
          } else if (discountType === 'FLAT' || discountType === 'FIXED') {
            price = basePrice - discount;
            originalPrice = basePrice.toFixed(2);
          }
        }
        // Only use allowed status values
        let status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK' = 'AVAILABLE';
        if (product.status === 'OUT_OF_STOCK') status = 'OUT_OF_STOCK';
        else if (product.status === 'LOW_STOCK') status = 'LOW_STOCK';
        // Explicitly create the object with all required properties
        const mappedProduct: Product = {
          id: product.id,
          name: product.name,
          title: product.name,
          description: product.description,
          price: price.toFixed(2),
          basePrice: basePrice,
          originalPrice: originalPrice,
          stock: product.stock,
          discount: discount !== null && discount !== undefined ? discount.toString() : '0',
          discountType: (discountType === 'PERCENTAGE' ? 'PERCENTAGE' : (discountType === 'FLAT' || discountType === 'FIXED' ? 'FLAT' : undefined)) as "PERCENTAGE" | "FLAT" | undefined,
          size: product.size || [],
          status: status,
          productImages: images,
          subcategory: product.subcategory,
          vendor: product.vendor?.businessName || '',
          category: product.subcategory?.name || '',
          categoryId: product.categoryId,
          subcategoryId: product.subcategory?.id || 0,
          brand_id: product.brand_id,
          dealId: product.dealId,
          quantity: product.inventory?.[0]?.quantity || 0,
          rating: 0,
          ratingCount: 0,
          image: images.length > 0 && typeof images[0] === 'string' ? images[0] : '',
          piece: product.stock,
          availableColor: product.size?.join(', ') || '',
          onSale: !!product.discount,
          isFeatured: false,
          isBestSeller: false,
          freeDelivery: false,
        };
        return mappedProduct;
      });

      return {
        products,
        total: response.data.data.total || products.length
      } as { products: Product[]; total: number };
    },
    enabled: !!authState.vendor?.id && !!authState.token
  });

  // Mutation for adding a product
  const addProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      console.log('VendorProduct: token exists:', !!authState.token);
      console.log('VendorProduct: vendor exists:', !!authState.vendor);
      console.log('VendorProduct: vendor ID:', authState.vendor?.id);
      console.log('VendorProduct: vendor verified:', authState.vendor?.isVerified);
      
      if (!authState.token) {
        throw new Error('No authentication token found');
      }
      
      if (!authState.vendor) {
        throw new Error('No vendor data found');
      }

      // Convert ProductFormData to FormData
      const formData = new FormData();
      formData.append("name", String(productData.name));
      formData.append("description", String(productData.description));
      formData.append("basePrice", productData.basePrice != null ? String(productData.basePrice) : "0");
      formData.append("stock", productData.stock.toString());
      formData.append("quantity", String(productData.quantity));
      formData.append("vendorId", String(authState.vendor.id));
      
      if (productData.discount && Number(productData.discount) > 0) {
        formData.append("discount", Number(productData.discount).toFixed(2));
        formData.append("discountType", String(productData.discountType));
      }
      if (Array.isArray(productData.size) && productData.size.length > 0) {
        formData.append("size", productData.size.join(","));
      }
      if (productData.status) formData.append("status", String(productData.status));
      if (productData.brand_id != null) {
        formData.append("brand_id", String(productData.brand_id));
      }
      if (productData.dealId != null) {
        formData.append("dealId", String(productData.dealId));
      }
      if (productData.productImages && Array.isArray(productData.productImages)) {
        productData.productImages.forEach((image, index) => {
          if (index < 5 && image instanceof File) {
            formData.append("images", image);
          }
        });
      }
      if (productData.inventory && Array.isArray(productData.inventory)) {
        formData.append("inventory", JSON.stringify(productData.inventory));
      }

      // Log formData contents for debugging
      console.log('VendorProduct: FormData vendorId:', formData.get('vendorId'));
      console.log('VendorProduct: FormData entries:', Object.fromEntries(formData.entries()));

      return createProduct(
        productData.categoryId,
        productData.subcategoryId,
        formData
      );
    },
    onSuccess: (data) => {
      console.log('Product created successfully:', data);
      toast.success('Product created successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendorProducts', authState.vendor?.id] });
      setShowAddModal(false);
    },
    onError: (error: Error) => {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
    },
  });

  // Mutation for editing a product
  const editProductMutation = useMutation({
    mutationFn: async ({ productId, productData, categoryId, subcategoryId }: { productId: number, productData: ProductFormData, categoryId: number, subcategoryId: number }) => {
      if (!authState.token) throw new Error("Authentication token is missing");
      if (!authState.vendor?.id) throw new Error("Vendor ID is missing");
      if (!categoryId || !subcategoryId) {
        throw new Error("Category and subcategory are required");
      }
      const formData = new FormData();
      formData.append("name", String(productData.name));
      formData.append("description", String(productData.description));
      formData.append("basePrice", productData.basePrice != null ? String(productData.basePrice) : "0");
      formData.append("stock", productData.stock.toString());
      formData.append("quantity", String(productData.quantity));
      formData.append("vendorId", String(authState.vendor.id));
      if (productData.discount && Number(productData.discount) > 0) {
        formData.append("discount", Number(productData.discount).toFixed(2));
        formData.append("discountType", String(productData.discountType));
      }
      if (Array.isArray(productData.size) && productData.size.length > 0) {
        formData.append("size", productData.size.join(","));
      }
      if (productData.status) formData.append("status", String(productData.status));
      if (productData.brand_id != null) {
        formData.append("brand_id", String(productData.brand_id));
      }
      if (productData.dealId != null) {
        formData.append("dealId", String(productData.dealId));
      }
      if (productData.productImages && Array.isArray(productData.productImages)) {
        productData.productImages.forEach((image, index) => {
          if (index < 5 && image instanceof File) {
            formData.append("images", image);
          }
        });
      }
      if (productData.inventory && Array.isArray(productData.inventory)) {
        formData.append("inventory", JSON.stringify(productData.inventory));
      }
      return updateProduct(productId, categoryId, subcategoryId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'vendor-products',
          authState.vendor?.id,
          currentPage,
          productsPerPage,
          authState.token
        ]
      });
    },
  });

  // Handler for Add Product
  const handleAddProduct = (productData: ProductFormData) => {
    addProductMutation.mutate(productData, {
      onSuccess: () => {
        setShowAddModal(false);
      },
      onError: (err: Error) => {
        alert(err.message || 'Failed to add product.');
      }
    });
  };

  const handleEditProduct = (product: Product) => {
    // Convert Product to ApiProduct for editing
    let discount: number | null = null;
    
    // Handle discount conversion
    if (product.discount) {
      if (typeof product.discount === 'number') {
        discount = product.discount;
      } else {
        discount = parseFloat(product.discount.toString());
      }
    }

    // Use a type guard for subcategory
    type SubcategoryType = { id: number; name: string; image?: string | null; createdAt?: string; updatedAt?: string };
    const subcategory = product.subcategory && typeof product.subcategory === 'object' && 'id' in product.subcategory && 'name' in product.subcategory
      ? {
          id: product.subcategory.id,
          name: product.subcategory.name,
          image: (product.subcategory as SubcategoryType).image || null,
          createdAt: (product.subcategory as SubcategoryType).createdAt || new Date().toISOString(),
          updatedAt: (product.subcategory as SubcategoryType).updatedAt || new Date().toISOString(),
        }
      : { id: 0, name: '', image: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const apiProduct: ApiProduct = {
      id: product.id,
      name: product.name || '',
      description: product.description || '',
      basePrice: typeof product.basePrice === 'number' ? product.basePrice : (product.basePrice ? parseFloat(product.basePrice.toString()) : (typeof product.price === 'string' ? parseFloat(product.price) : typeof product.price === 'number' ? product.price : 0)),
      stock: product.stock || 0,
      discount: discount,
      discountType: (product.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FLAT') as 'PERCENTAGE' | 'FLAT',
      size: product.size || [],
      status: (product.status === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : product.status === 'LOW_STOCK' ? 'LOW_STOCK' : 'AVAILABLE'),
      productImages: product.productImages || (product.image ? [product.image] : []),
      inventory: [], // fallback empty array
      vendorId: 0, // fallback 0
      brand_id: product.brand_id || null,
      dealId: product.dealId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categoryId: product.categoryId || 0,
      subcategory: subcategory,
      vendor: typeof product.vendor === 'object' && product.vendor !== null ? product.vendor : {
        id: 0,
        businessName: '',
        email: '',
        phoneNumber: '',
        districtId: 0,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        district: { id: 0, name: '' },
      },
      brand: null,
      deal: null,
      price: typeof product.price === 'number' ? product.price : (product.price ? parseFloat(product.price.toString()) : 0),
      image: product.image || '',
    };
    setEditingProduct(apiProduct);
    setShowEditModal(true);
  };

  const handleSaveEditProduct = async (productId: number, productData: ProductFormData, categoryId: number, subcategoryId: number) => {
    editProductMutation.mutate({ productId, productData, categoryId, subcategoryId }, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingProduct(null);
      },
      onError: (err: Error) => {
        alert(err.message || 'Failed to update product.');
      }
    });
  };

  const allProducts = productData?.products || [];
  // Remove unused variable
  // const totalProducts = productData?.total || 0;

  // Filter and sort products in-memory
  const filteredProducts = allProducts.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.subcategory?.name?.toLowerCase().includes(query)
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case "price-asc":
        return parseFloat(a.price.toString()) - parseFloat(b.price.toString());
      case "price-desc":
        return parseFloat(b.price.toString()) - parseFloat(a.price.toString());
      case "name-asc":
        return a.name?.localeCompare(b.name || '') || 0;
      case "name-desc":
        return b.name?.localeCompare(a.name || '') || 0;
      case "oldest":
        return (a.id || 0) - (b.id || 0);
      case "newest":
      default:
        return (b.id || 0) - (a.id || 0);
    }
  });

  // Paginate after filtering/sorting
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
  const filteredTotal = sortedProducts.length;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    // Export the currently filtered and sorted products
    const exportData = sortedProducts.map((product) => ({
      'Name': product.name,
      'Category': product.category || (typeof product.subcategory === 'object' && product.subcategory?.name) || '',
      'Price': product.price,
      'Stock': product.stock,
      'Status': product.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'vendor-products.xlsx');
  };

  return (
    <div className="vendor-dash-container">
      <Sidebar />
      <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
        <Header title="Product Management" onSearch={() => {}} />
        {/* Search and Sort Controls */}
        <div className="dashboard__search-container" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="dashboard__search" style={{ flex: 1, minWidth: 200 }}>
            <input
              className="dashboard__search-input"
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <span className="dashboard__search-icon" />
          </div>
          <select
            className="vendor-product__sort-select"
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            style={{ minWidth: 180, height: 38, borderRadius: 20, border: '1px solid #e5e7eb', padding: '0 12px', background: '#fff', fontSize: 14 }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
            <option value="name-desc">Name: Z-A</option>
          </select>
        </div>
        <main className="dashboard__main" style={{ paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px" }}>
          <div className="vendor-product__actions">
            <button className="vendor-product__add-btn" onClick={() => setShowAddModal(true)}>
              <span className="vendor-product__add-icon">+</span>
              Add Product
            </button>
            <button className="vendor-product__export-btn" onClick={handleExportExcel}>
              Export to Excel
            </button>
          </div>
          {showAddModal && (
            <ProductModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSubmit={handleAddProduct}
            />
          )}
          {showEditModal && editingProduct && (
            <EditProductModal
              show={showEditModal}
              onClose={() => { setShowEditModal(false); setEditingProduct(null); }}
              onSave={handleSaveEditProduct}
              product={editingProduct}
            />
          )}
          {loading ? (
            <ProductListSkeleton />
          ) : isError ? (
            <div className="vendor-product__error">{(error as Error).message}</div>
          ) : paginatedProducts.length > 0 ? (
            <>
              <ProductList
                products={paginatedProducts}
                isMobile={isMobile}
                onEdit={handleEditProduct}
                showVendor={false}
              />
              {filteredTotal > productsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredTotal / productsPerPage)}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div className="vendor-product__no-results">
              No product found.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VendorProduct;