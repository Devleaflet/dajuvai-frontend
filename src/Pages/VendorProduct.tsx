import React, { useState} from 'react';
import { Sidebar } from '../Components/Sidebar';
import Header from '../Components/Header';
import ProductList from '../Components/ProductList';
import NewProductModal from '../Components/NewProductModalRedesigned';
import EditProductModal from '../Components/Modal/EditProductModalRedesigned';
import '../Styles/VendorProduct.css';
import { Product as ApiProduct, NewProductFormData, ProductFormData } from '../types/product';
import { fetchProducts, createProduct, updateProduct } from '../api/products';
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
        // Extract images from both productImages and variant images
        const productImages = Array.isArray(product.productImages)
          ? product.productImages.map((img: string | { url?: string }) => (typeof img === 'string' ? img : img.url || ''))
          : [];
        
        // Extract images from variants if product has variants
        const variantImages: string[] = [];
        if ((product as any).hasVariants && (product as any).variants && Array.isArray((product as any).variants)) {
          (product as any).variants.forEach((variant: any) => {
            if (variant.variantImages && Array.isArray(variant.variantImages)) {
              variant.variantImages.forEach((img: string | { url?: string }) => {
                const imageUrl = typeof img === 'string' ? img : img.url || '';
                if (imageUrl && !variantImages.includes(imageUrl)) {
                  variantImages.push(imageUrl);
                }
              });
            }
          });
        }
        
        // Combine all images (product images first, then variant images)
        const images = [...productImages, ...variantImages].filter(Boolean);
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




        const normalizedVariants = Array.isArray((product as any).variants)
          ? (product as any).variants.map((v: any) => {
              const rawBase =
                (typeof v?.price !== 'undefined' ? v.price :
                typeof v?.basePrice !== 'undefined' ? v.basePrice :
                typeof v?.originalPrice !== 'undefined' ? v.originalPrice :
                typeof product.basePrice !== 'undefined' ? product.basePrice :
                (product as any).price);
              const baseNum = typeof rawBase === 'string' ? parseFloat(rawBase) : (Number(rawBase) || 0);
              let calc = baseNum;
              if (discount > 0 && (discountType === 'PERCENTAGE' || discountType === 'FLAT' || discountType === 'FIXED')) {
                if (discountType === 'PERCENTAGE') {
                  calc = baseNum - (baseNum * discount / 100);
                } else {
                  calc = baseNum - discount;
                }
              }
              return { ...v, calculatedPrice: calc };
            })
          : undefined;

        let status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK' = 'AVAILABLE';
        if (product.status === 'OUT_OF_STOCK') status = 'OUT_OF_STOCK';
        else if (product.status === 'LOW_STOCK') status = 'LOW_STOCK';
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
          variants: normalizedVariants,
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
        total: response.data.data.total || products.length,
        serverTotal: response.data.data.total || products.length
      } as { products: Product[]; total: number; serverTotal: number };
    },
    enabled: !!authState.vendor?.id && !!authState.token
  });
  // Handle product creation success
  const handleProductSubmit = (success: boolean) => {
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Product created successfully!');
    }
  };

  // Mutation for adding a product (keeping for compatibility)
  const addProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      console.log('=== VENDOR PRODUCT CREATION START ===');
      console.log('VendorProduct: token exists:', !!authState.token);
      console.log('VendorProduct: vendor exists:', !!authState.vendor);
      console.log('VendorProduct: vendor ID:', authState.vendor?.id);
      console.log('VendorProduct: vendor verified:', authState.vendor?.isVerified);
      console.log('VendorProduct: Product data received:', productData);
      
      if (!authState.token) {
        throw new Error('No authentication token found');
      }
      
      if (!authState.vendor) {
        throw new Error('No vendor data found');
      }

      // Convert ProductFormData to FormData
      const formData = new FormData();
      
      // Required fields
      formData.append("name", String(productData.name));
      formData.append("subcategoryId", String(productData.subcategoryId));
      formData.append("hasVariants", String(productData.hasVariants));
      
      // Optional fields
      if (productData.description) {
        formData.append("description", String(productData.description));
      }
      
      // Handle variant vs non-variant products
      if (!productData.hasVariants) {
        console.log('VendorProduct: Creating non-variant product');
        
        // Non-variant product fields
        if (productData.basePrice != null) {
          formData.append("basePrice", String(productData.basePrice));
        }
        if (productData.stock != null) {
          formData.append("stock", String(productData.stock));
        }
        if (productData.status) {
          formData.append("status", String(productData.status));
        }
        
        // Non-variant product images
        if (productData.productImages && Array.isArray(productData.productImages)) {
          productData.productImages.forEach((image, index) => {
            if (index < 5 && image instanceof File) {
              formData.append("productImages", image);
            }
          });
        }
      } else {
        console.log('VendorProduct: Creating variant product');
        
        // Variant product - variants data
        if (productData.variants && Array.isArray(productData.variants)) {
          console.log('VendorProduct: Adding variants data:', productData.variants);
          formData.append("variants", JSON.stringify(productData.variants));
          
          // Handle variant images
          productData.variants.forEach((variant, variantIndex) => {
            console.log(`VendorProduct: Processing variant ${variantIndex + 1} (${variant.sku}):`, variant);
            if (variant.images && Array.isArray(variant.images)) {
              console.log(`VendorProduct: Variant ${variant.sku} has ${variant.images.length} images`);
              variant.images.forEach((image, imageIndex) => {
                console.log(`VendorProduct: Processing image ${imageIndex + 1} for variant ${variant.sku}:`, image);
                if (image instanceof File) {
                  const imageKey = `variantImages${variantIndex + 1}`;
                  formData.append(imageKey, image);
                  console.log(`VendorProduct: Added image to FormData with key: ${imageKey}`);
                } else {
                  console.warn(`VendorProduct: Image ${imageIndex + 1} for variant ${variant.sku} is not a File:`, image);
                }
              });
            } else {
              console.error(`VendorProduct: Variant ${variant.sku} has no images or images is not an array:`, variant.images);
            }
          });
        }
      }
      
      // Common optional fields
      if (productData.discount && Number(productData.discount) > 0) {
        formData.append("discount", Number(productData.discount).toFixed(2));
        formData.append("discountType", String(productData.discountType || 'PERCENTAGE'));
      }
      
      if (productData.dealId != null) {
        formData.append("dealId", String(productData.dealId));
      }
      
      if (productData.bannerId != null) {
        formData.append("bannerId", String(productData.bannerId));
      }
      
      if (productData.brandId != null) {
        formData.append("brandId", String(productData.brandId));
      }

      // Log formData contents for debugging
      console.log('VendorProduct: Final FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      console.log('VendorProduct: Making API call to createProduct');
      // This is legacy code - new products use NewProductModal
      throw new Error('Use NewProductModal for creating products');
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
      console.log('🔄 EDIT PRODUCT MUTATION START');
      console.log('Product ID:', productId);
      console.log('Category ID:', categoryId);
      console.log('Subcategory ID:', subcategoryId);
      console.log('Product Data:', productData);

      if (!authState.token) throw new Error("Authentication token is missing");
      if (!authState.vendor?.id) throw new Error("Vendor ID is missing");
      if (!categoryId || !subcategoryId) {
        throw new Error("Category and subcategory are required");
      }

      // Prepare JSON payload according to new API contract
      const updatePayload: any = {
        name: productData.name,
        subcategoryId: subcategoryId,
        hasVariants: productData.hasVariants || false,
      };

      // Add optional fields
      if (productData.description) updatePayload.description = productData.description;
      if (productData.discount !== undefined && productData.discount !== null && productData.discount !== '') {
        updatePayload.discount = typeof productData.discount === 'string' ? parseFloat(productData.discount) : productData.discount;
      }
      if (productData.discountType) updatePayload.discountType = productData.discountType;
      if (productData.dealId) updatePayload.dealId = productData.dealId;
      if (productData.bannerId) updatePayload.bannerId = productData.bannerId;
      if (productData.productImages && productData.productImages.length > 0) {
        updatePayload.productImages = productData.productImages;
      }

      // Handle variants vs non-variants
      if (productData.hasVariants) {
        if (productData.variants && productData.variants.length > 0) {
          // Convert variants to match API structure
          updatePayload.variants = productData.variants.map((variant: any) => ({
            sku: variant.sku,
            basePrice: variant.price || variant.basePrice,
            discount: variant.discount || 0,
            discountType: variant.discountType || 'PERCENTAGE',
            attributes: variant.attributes || {},
            variantImages: variant.images || variant.variantImages || [],
            stock: variant.stock,
            status: variant.status || 'AVAILABLE'
          }));
        }
      } else {
        // For non-variant products, these fields are required
        updatePayload.basePrice = typeof productData.basePrice === 'string' ? parseFloat(productData.basePrice) : productData.basePrice;
        updatePayload.stock = typeof productData.stock === 'string' ? parseInt(productData.stock) : productData.stock;
        updatePayload.status = productData.status || 'AVAILABLE';
      }

      console.log('📤 Final Update Payload:', JSON.stringify(updatePayload, null, 2));
      
      return updateProduct(productId, categoryId, subcategoryId, updatePayload);
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
    console.log('🚀 EDIT BUTTON CLICKED!');
    console.log('=== ORIGINAL PRODUCT DATA ===');
    console.log('Full Product Object:', JSON.stringify(product, null, 2));
    console.log('Product ID:', product.id);
    console.log('Product Name:', product.name);
    console.log('Product CategoryId:', product.categoryId);
    console.log('Product SubcategoryId:', product.subcategoryId);
    console.log('Product Subcategory Object:', product.subcategory);
    console.log('Product Category Object:', product.category);
    console.log('=== END PRODUCT DATA ===');
    
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
    console.log('🔄 CONVERTING PRODUCT FOR EDITING:');
    console.log('Original Product:', product);
    console.log('Product Category ID:', product.categoryId);
    console.log('Product Subcategory:', product.subcategory);

    // Extract category ID from subcategory if available
    let categoryId = product.categoryId || 0;
    if (!categoryId && product.subcategory && typeof product.subcategory === 'object') {
      // Try to get categoryId from subcategory object
      if ('categoryId' in product.subcategory) {
        categoryId = (product.subcategory as any).categoryId;
      } else if ('category' in product.subcategory && product.subcategory.category && typeof product.subcategory.category === 'object' && 'id' in product.subcategory.category) {
        categoryId = (product.subcategory.category as any).id;
      }
    }

    const apiProduct: ApiProduct = {
      ...(product as any),
      categoryId: categoryId,
      basePrice: typeof product.basePrice === 'number' ? product.basePrice : (product.basePrice ? parseFloat(product.basePrice.toString()) : (typeof product.price === 'string' ? parseFloat(product.price) : typeof product.price === 'number' ? product.price : 0)),
      discount: discount,
      discountType: (product.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FLAT') as 'PERCENTAGE' | 'FLAT',
      status: (product.status === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : product.status === 'LOW_STOCK' ? 'LOW_STOCK' : 'AVAILABLE'),
      productImages: product.productImages || (product.image ? [product.image] : []),
      inventory: [], // fallback empty array
      vendorId: 0, // fallback 0
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      hasVariants: (product as any).hasVariants || false,
      variants: (product as any).variants || [],
      price: typeof product.price === 'number' ? product.price : (product.price ? parseFloat(product.price.toString()) : 0),
      image: product.image || '',
      // Ensure all required ApiProduct fields are present
      brand_id: product.brand_id || null,
      bannerId: (product as any).bannerId || null,
      brandId: (product as any).brandId || null,
    } as ApiProduct;

    console.log('✅ Converted ApiProduct:', apiProduct);
    console.log('ApiProduct Category ID:', apiProduct.categoryId);
    console.log('ApiProduct Subcategory:', apiProduct.subcategory);
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

  // Extract products and total from the query data
  const products: Product[] = productData?.products || [];
  const totalProducts = productData?.serverTotal || productData?.total || 0;

  // For server-side pagination, we use the products directly from the API
  // The API already handles pagination, so we don't need to slice again
  const displayProducts = products;

  // Apply client-side filtering only for search (this will require refetching from server)
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      (typeof product.subcategory === 'object' && product.subcategory?.name?.toLowerCase().includes(searchLower)) ||
      product.category?.toLowerCase().includes(searchLower)
    );
  });

  // If there's a search query, we need to handle pagination differently
  const isSearching = searchQuery.trim().length > 0;
  const finalProducts = isSearching ? filteredProducts : displayProducts;
  const finalTotal = isSearching ? filteredProducts.length : totalProducts;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    // Export the currently displayed products
    const exportData = finalProducts.map((product) => ({
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
            <NewProductModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSubmit={handleProductSubmit}
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
          ) : finalProducts.length > 0 ? (
            <>
              <ProductList
                products={finalProducts}
                isMobile={isMobile}
                onEdit={handleEditProduct}
                showVendor={false}
              />
              {finalTotal > productsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(finalTotal / productsPerPage)}
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