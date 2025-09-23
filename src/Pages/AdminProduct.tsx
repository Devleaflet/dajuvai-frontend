import React, { useState, useCallback, useMemo, useEffect } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import Pagination from "../Components/Pagination";
import DeleteModal from "../Components/Modal/DeleteModal";
import EditProductModal from "../Components/Modal/EditProductModalRedesigned";
import { useAuth } from "../context/AuthContext";
import ProductService from "../services/productService";
import "../Styles/AdminProduct.css";
import { toast } from "react-hot-toast";
import { ApiProduct } from "../Components/Types/ApiProduct";
import { ProductFormData } from "../types/product";
import { debounce } from "lodash";
import defaultProductImage from "../assets/logo.webp";

const SkeletonRow: React.FC = () => (
  <tr>
    {[...Array(6)].map((_, i) => (
      <td key={i}>
        <div className="skeleton skeleton-text" />
      </td>
    ))}
  </tr>
);

const AdminProduct: React.FC = () => {
  const { token, isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ApiProduct[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(7);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ApiProduct | null>(null);
  const [productToEdit, setProductToEdit] = useState<ApiProduct | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ApiProduct;
    direction: "asc" | "desc";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Add sort option state
  const [sortOption, setSortOption] = useState<string>("newest");

  const productService = ProductService;

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getAllProducts(token);
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, productService]);

  // Load products on mount and when token changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Save callback from modal: modal already performed the API update (new JSON flow).
  // Here we only refresh the list to reflect changes and close the modal.
  const handleSaveProduct = useCallback(
    async (
      _productId: number,
      _product: ProductFormData,
      _categoryId: number,
      _subcategoryId: number
    ) => {
      try {
        setIsUpdating(true);
        await fetchProducts();
        setShowEditModal(false);
        setProductToEdit(null);
        // Modal already shows success toast; keep page quiet.
      } catch (err: unknown) {
        console.error("AdminProduct: Error refreshing after update:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to refresh products";
        toast.error(errorMessage);
        throw err; // let modal handle if needed
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchProducts]
  );

  // Delete product function
  const deleteProduct = useCallback(async (product: ApiProduct) => {
    setIsDeleting(true);
    console.log("delete",product)
    try {
      await productService.deleteProduct(
        product.categoryId,
        product.subcategory.id,
        product.id
      );
      setProducts(prevProducts => prevProducts.filter(p => p.id !== product.id));
      setFilteredProducts(prevProducts => prevProducts.filter(p => p.id !== product.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
      toast.success("Product deleted successfully");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete product";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [productService]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setCurrentPage(1);
        setSearchQuery(query);
        const results = products.filter(
          (product) =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredProducts(results);
      }, 300),
    [products]
  );

  // Update filtered products when products change
  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchQuery, debouncedSearch]);

  const handleSearch = useCallback(
    (query: string) => {
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  // Column sort handler (for table headers)
  const handleColumnSort = useCallback((key: keyof ApiProduct) => {
    setSortConfig((prev) => {
      const direction =
        prev?.key === key && prev.direction === "asc" ? "desc" : "asc";
      return { key, direction };
    });
  }, []);

  // Dropdown sort handler (for Header component)
  const handleSort = useCallback((newSortOption: string) => {
    setSortOption(newSortOption);
    setCurrentPage(1); // Reset to first page when sorting changes
  }, []);

  // Sort products function
  const sortProducts = useCallback((products: ApiProduct[], sortOption: string) => {
    const sorted = [...products];
    
    switch (sortOption) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      case 'price-asc':
        return sorted.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
      case 'price-desc':
        return sorted.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted;
    }
  }, []);

  const sortedAndFilteredProducts = useMemo(() => {
    let filtered = [...filteredProducts];
    
    // Apply dropdown sorting first
    filtered = sortProducts(filtered, sortOption);
    
    // Then apply any table column sorting if needed
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? "";
        const bValue = b[sortConfig.key] ?? "";
        const isNumeric = ["id", "basePrice", "stock"].includes(sortConfig.key);
        const aCompare = isNumeric
          ? Number(aValue)
          : aValue.toString().toLowerCase();
        const bCompare = isNumeric
          ? Number(bValue)
          : bValue.toString().toLowerCase();
        return sortConfig.direction === "asc"
          ? aCompare < bCompare
            ? -1
            : 1
          : aCompare > bCompare
          ? -1
          : 1;
      });
    }
    
    return filtered;
  }, [filteredProducts, sortOption, sortConfig, sortProducts]);

  const currentProducts = useMemo(
    () =>
      sortedAndFilteredProducts.slice(
        (currentPage - 1) * productsPerPage,
        currentPage * productsPerPage
      ),
    [sortedAndFilteredProducts, currentPage, productsPerPage]
  );

  const handleEditProduct = useCallback((product: ApiProduct) => {
    console.log("AdminProduct: Opening edit modal for product:", product);
    setProductToEdit(product);
    setShowEditModal(true);
  }, []);

  const handleDeleteProduct = useCallback(async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete);
    } catch (err: unknown) {
      console.error("AdminProduct: Error deleting product:", err);
    }
  }, [productToDelete, deleteProduct]);

  if (!isAuthenticated || !token) {
    return (
      <div className="admin-products">
        <AdminSidebar />
        <div className="admin-products__content">
          <div className="admin-products__error">
            Please log in to access product management.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <AdminSidebar />
      <div className="admin-products__content">
        {error && (
          <div className="admin-products__error">
            {error}
            <button onClick={fetchProducts}>Retry</button>
          </div>
        )}
        <Header 
          onSearch={handleSearch} 
          showSearch 
          onSort={handleSort}
          sortOption={sortOption}
          title="Product Management"
        />
        <div className="admin-products__list-container">
          <div className="admin-products__header">
            <h2>Product Management</h2>
          </div>
          <div className="admin-products__table-container">
            <table className="admin-products__table">
              <thead className="admin-products__table-head">
                <tr>
                  <th>Image</th>
                  {['id', 'name', 'basePrice', 'stock'].map((key) => (
                    <th
                      key={key}
                      onClick={() => handleColumnSort(key as keyof ApiProduct)}
                      className="sortable"
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}{' '}
                      {sortConfig?.key === key &&
                        (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  ))}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(productsPerPage)].map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : currentProducts.length > 0 ? (
                  currentProducts.map((product) => {
                    const firstVariant = product.hasVariants && product.variants && product.variants.length > 0
                      ? product.variants[0]
                      : null;
                    // Variant price may be provided as `price` (number) or `basePrice` (string/number) from API
                    const variantPrice: number | undefined = (() => {
                      if (!product.hasVariants || !product.variants || product.variants.length === 0) return undefined;
                      const getVarPrice = (v: any): number | undefined => {
                        if (typeof v?.price === 'number' && isFinite(v.price) && v.price > 0) return v.price;
                        if (typeof v?.basePrice === 'string') {
                          const parsed = parseFloat(v.basePrice);
                          if (isFinite(parsed) && parsed > 0) return parsed;
                        }
                        if (typeof v?.basePrice === 'number' && isFinite(v.basePrice) && v.basePrice > 0) return v.basePrice;
                        return undefined;
                      };
                      for (const v of product.variants as any[]) {
                        const p = getVarPrice(v);
                        if (p && p > 0) return p;
                      }
                      return undefined;
                    })();
                    console.log(typeof product.basePrice)
                    const displayPrice = ((typeof product.basePrice === 'number' || typeof Number(product.basePrice) === "number" )&& product.basePrice > 0)
                      ? product.basePrice
                      : (variantPrice ?? 0);
                    const displayStock = product.stock && product.stock > 0 ? product.stock : (firstVariant?.stock ?? 0);
                    // Only use string URLs for image src
                    const variantImgStr = firstVariant
                      ? (
                          (Array.isArray(firstVariant.variantImages) && typeof firstVariant.variantImages[0] === 'string'
                            ? (firstVariant.variantImages[0] as string)
                            : undefined) ||
                          (Array.isArray(firstVariant.images) && typeof firstVariant.images[0] === 'string'
                            ? (firstVariant.images[0] as string)
                            : undefined)
                        )
                      : undefined;
                    const displayImage: string = (product.productImages?.[0]) || variantImgStr || (defaultProductImage as string);
                    return (
                      <tr key={product.id} className="admin-products__table-row">
                        <td className="admin-products__image-cell">
                          <img
                            src={displayImage}
                            alt={product.name}
                            className="admin-products__product-image"
                          />
                        </td>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>Rs. {displayPrice.toFixed ? displayPrice.toFixed(2) : Number(displayPrice).toFixed(2)}</td>
                        <td>{displayStock}</td>
                        <td>
                          <div className="admin-products__actions">
                          <button
                            className="admin-products__action-btn admin-products__edit-btn"
                            onClick={() => handleEditProduct(product)}
                            disabled={isUpdating}
                            aria-label="Edit product"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M18.5 2.50023C18.8978 2.10243 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10243 21.5 2.50023C21.8978 2.89804 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.10243 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            className="admin-products__action-btn admin-products__delete-btn"
                            onClick={() => {
                              setProductToDelete(product);
                              setShowDeleteModal(true);
                            }}
                            disabled={isDeleting}
                            aria-label="Delete product"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M3 6H5H21"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8 6V4C8 2.96957 8.21071 2.46086 8.58579 2.08579C8.96086 1.71071 9.46957 1.5 10 1.5H14C14.5304 1.5 15.0391 1.71071 15.4142 2.08579C15.7893 2.46086 16 2.96957 16 3.5V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="admin-products__no-data">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-products__pagination-container">
            <div className="admin-products__pagination-info">
              Showing {(currentPage - 1) * productsPerPage + 1}-
              {Math.min(currentPage * productsPerPage, sortedAndFilteredProducts.length)}{" "}
              out of {sortedAndFilteredProducts.length}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(sortedAndFilteredProducts.length / productsPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
      <EditProductModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        product={productToEdit}
      />
      <DeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProductToDelete(null);
        }}
        onDelete={handleDeleteProduct}
        productName={productToDelete?.name || "Product"}
      />
    </div>
  );
};

export default AdminProduct;