import React, { useState, useCallback, useEffect } from "react";
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
import defaultProductImage from "../assets/logo.webp";
import { API_BASE_URL } from "../config";
import { formatTimeAgo } from "../utils/formattime";

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
  const { token, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(7);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ApiProduct | null>(null);
  const [productToEdit, setProductToEdit] = useState<ApiProduct | null>(null);
  const [sortOption, setSortOption] = useState<string>("newest");
  const [filterOption, setFilterOption] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [vendor, setVendor] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);


  const productService = ProductService;


  // Fetch products from backend with pagination, sorting, and filtering
  const fetchProducts = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: productsPerPage.toString(),
        sort: sortOption,
        ...(filterOption !== "all" && { filter: filterOption }),
        ...(selectedVendor && selectedVendor !== '' && { vendorId: selectedVendor }),
      });

      const response = await fetch(`${API_BASE_URL}/api/product/admin/products?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setTotalProducts(data.data.total);
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products";
      console.error('Fetch products error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, currentPage, productsPerPage, sortOption, filterOption, selectedVendor]);


  const fetchVendors = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/partial/vendors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data)
      if (data.success) {
        setVendor(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch vendors");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load vendors";
      console.error('Fetch products error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendor(vendorId);
  };

  // Load products on mount and when dependencies change
  useEffect(() => {
    console.log("Fetching products for vendor:", selectedVendor);

    fetchProducts();
  }, [selectedVendor, fetchProducts]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors])

  // Save callback from modal: modal already performed the API update
  const handleSaveProduct = useCallback(
    async () => {
      try {
        setIsUpdating(true);
        await fetchProducts();
        setShowEditModal(false);
        setProductToEdit(null);
      } catch (err: unknown) {
        console.error("AdminProduct: Error refreshing after update:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to refresh products";
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchProducts]
  );

  // Delete product function
  const deleteProduct = useCallback(async (product: ApiProduct) => {
    setIsDeleting(true);
    try {
      await productService.deleteProduct(
        product.id, token
      );
      await fetchProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
      toast.success("Product deleted successfully");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete product";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [productService, fetchProducts]);

  // Handle sort change - Fixed mapping
  const handleSort = useCallback((newSortOption: string) => {
    //('Sort option selected:', newSortOption);

    const backendSortMap: { [key: string]: string } = {
      "newest": "newest",
      "oldest": "oldest",
      "price-asc": "price_low_high",
      "price-desc": "price_high_low",
    };

    const backendSortValue = backendSortMap[newSortOption] || "newest";
    //('Mapped to backend sort:', backendSortValue);

    setSortOption(backendSortValue);
    setCurrentPage(1);
  }, []);

  // Handle filter change
  const handleFilter = useCallback((newFilterOption: string) => {
    //('Filter option selected:', newFilterOption);
    setFilterOption(newFilterOption);
    setCurrentPage(1);
  }, []);

  // Handle edit product
  const handleEditProduct = useCallback((product: ApiProduct) => {
    //("AdminProduct: Opening edit modal for product:", product);
    setProductToEdit(product);
    setShowEditModal(true);
  }, []);

  // Handle delete product
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

  const getAdminDisplayPrice = (product: ApiProduct): number | null => {
    if (product.hasVariants && Array.isArray(product.variants)) {
      const prices = product.variants
        .map((v: any) => {
          const val =
            typeof v.finalPrice === "string"
              ? parseFloat(v.finalPrice)
              : Number(v.finalPrice);
          return isNaN(val) ? null : val;
        })
        .filter((v): v is number => v !== null);

      return prices.length > 0 ? Math.min(...prices) : null;
    }

    //  Non-variant product → product.finalPrice
    const val =
      typeof product.finalPrice === "string"
        ? parseFloat(product.finalPrice)
        : Number(product.finalPrice);

    return isNaN(val) ? null : val;
  };


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
          onSearch={() => { }}
          showSearch={true}  // Changed to true so filter dropdown shows
          onSort={handleSort}
          sortOption={(() => {
            // Reverse map backend value to frontend value for display
            const frontendSortMap: { [key: string]: string } = {
              "newest": "newest",
              "oldest": "oldest",
              "price_low_high": "price-asc",
              "price_high_low": "price-desc",
              "name_asc": "name-asc",
              "name_desc": "name-desc",
              "vendor_asc": "vendor-asc",
              "vendor_desc": "vendor-desc",
            };
            return frontendSortMap[sortOption] || "newest";
          })()}
          onFilter={handleFilter}
          filterOption={filterOption}
          title="Product Management"
          vendors={vendor}
          selectedVendor={selectedVendor}
          onVendorChange={handleVendorChange}
        />
        <div className="admin-products__list-container">
          <div className="admin-products__header">
            <h2>Product Management</h2>
            <div className="admin-products__stats">
              <span>Total: {totalProducts} products</span>
              {filterOption !== "all" && (
                <span className="filter-indicator">
                  Filtered by: {filterOption.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="admin-products__table-container">
            <table className="admin-products__table">
              <thead className="admin-products__table-head">
                <tr>
                  <th>Image</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Vendor</th>
                  <th>Price</th>
                  <th>Variants</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(productsPerPage)].map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : products.length > 0 ? (
                  products.map((product) => {

                    const productDiscountLabel =
                      product.discount && Number(product.discount) > 0
                        ? product.discountType === "PERCENTAGE"
                          ? `${product.discount}%`
                          : `₹${product.discount}`
                        : null;

                    const dealDiscountLabel =
                      product.deal && product.deal.discountPercentage
                        ? `Deal ${product.deal.discountPercentage}%`
                        : null;

                    const getDisplayStock = (): number => {

                      if (product.stock && typeof product.stock === 'number' && product.stock >= 0) {
                        return product.stock;
                      }

                      // If product stock is string, try to parse it
                      if (typeof product.stock === 'string') {
                        const parsedStock = parseInt(product.stock, 10);
                        if (!isNaN(parsedStock) && parsedStock >= 0) {
                          return parsedStock;
                        }
                      }

                      // Fallback to first variant stock
                      if (product.variants && product.variants.length > 0) {
                        //("hiee",product.name)

                        for (const variant of product.variants) {
                          if (variant.stock && typeof variant.stock === 'number' && variant.stock >= 0) {
                            return variant.stock;
                          }

                          if (typeof variant.stock === 'string') {
                            const parsedVariantStock = parseInt(variant.stock, 10);
                            if (!isNaN(parsedVariantStock) && parsedVariantStock >= 0) {
                              return parsedVariantStock;
                            }
                          }
                        }
                      }

                      return 0; // Default fallback
                    };

                    const displayPrice = getAdminDisplayPrice(product);

                    const displayStock = getDisplayStock();

                    // Get first variant for image fallback
                    const firstVariant = product.hasVariants && product.variants && product.variants.length > 0
                      ? product.variants[0]
                      : null;
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
                      <tr key={product.id} className={`admin-products__table-row ${displayStock === 0 ? 'out-of-stock' : ''}`}>
                        {/* Product Image  */}
                        <td className="admin-products__image-cell">
                          <img
                            src={displayImage}
                            alt={product.name}
                            className="admin-products__product-image"
                          />
                        </td>

                        {/* Product Id  */}
                        <td>{product.id}</td>

                        {/* Product Name  */}
                        <td>{product.name}</td>

                        {/* Vendor Name  */}
                        <td>
                          {product.vendor?.businessName || "Unknown"}
                        </td>

                        {/* Product Final Price  */}
                        <td>
                          {displayPrice !== null ? (
                            <>
                              Rs. {displayPrice.toFixed(2)}
                              {/* {product.hasVariants && (
                                <span> (lowest)</span>
                              )} */}
                            </>
                          ) : (
                            <span className="price-na">—</span>
                          )}
                        </td>


                        {/* Product Variant  */}
                        <td style={{ textAlign: "center" }}>
                          {product.hasVariants ? (
                            <span
                              style={{
                                backgroundColor: "#e3f2fd",
                                color: "#1565c0",
                                padding: "4px 10px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: 600
                              }}
                            >
                              {product.variants?.length || 0}
                            </span>
                          ) : (
                            <span style={{ color: "#bbb" }}>—</span>
                          )}
                        </td>


                        {/* Product Discount and Deal  */}
                        <td>
                          {productDiscountLabel || dealDiscountLabel ? (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {productDiscountLabel && (
                                <span
                                  style={{
                                    background: "#e0f2fe",
                                    color: "#0369a1",
                                    padding: "2px 6px",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  {productDiscountLabel}
                                </span>
                              )}

                              {dealDiscountLabel && (
                                <span
                                  style={{
                                    background: "#dcfce7",
                                    color: "#166534",
                                    padding: "2px 6px",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  {dealDiscountLabel}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>—</span>
                          )}
                        </td>


                        {/* Product Status */}
                        <td style={{ textAlign: "center" }}>
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: "999px",
                              fontSize: "12px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              display: "inline-block",
                              minWidth: "100px",
                              color:
                                product.status === "AVAILABLE"
                                  ? "#1b5e20"
                                  : "#b71c1c",
                              backgroundColor:
                                product.status === "AVAILABLE"
                                  ? "#e8f5e9"
                                  : "#fdecea",
                              border:
                                product.status === "AVAILABLE"
                                  ? "1px solid #a5d6a7"
                                  : "1px solid #f5c6cb"
                            }}
                          >
                            {product.status || ""}
                          </span>
                        </td>


                        {/* Created at  */}
                        <td>
                          <span
                            style={{
                              color:
                                Date.now() - new Date(product.createdAt).getTime() < 24 * 60 * 60 * 1000
                                  ? "#16a34a"
                                  : "#374151",
                              fontWeight:
                                Date.now() - new Date(product.createdAt).getTime() < 24 * 60 * 60 * 1000
                                  ? 600
                                  : 400,
                            }}
                            title={new Date(product.createdAt).toLocaleString()}
                          >
                            {formatTimeAgo(product.createdAt)}
                          </span>
                        </td>

                        {/* Action buttons  */}
                        {/* Edit products  */}
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

                            {/* Delete Button  */}
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
                      {filterOption !== "all" ? `No products found with filter: ${filterOption}` : "No products found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-products__pagination-container">
            <div className="admin-products__pagination-info">
              Showing {(currentPage - 1) * productsPerPage + 1}-
              {Math.min(currentPage * productsPerPage, totalProducts)}{" "}
              out of {totalProducts}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalProducts / productsPerPage)}
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