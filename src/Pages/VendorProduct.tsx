import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
    fetchProducts,
    updateProduct,
    deleteProduct,
    type ProductSortOption,
    type ProductStatusFilter,
} from "../api/products";
import EditProductModal from "../Components/Modal/EditProductModalRedesigned";
import DeleteModal from "../Components/Modal/DeleteModal";
import ArchivedProductsTab from "../Components/ArchivedProductsTab";
import NewProductModal from "../Components/NewProductModalRedesigned";
import Pagination from "../Components/Pagination";
import ProductList from "../Components/ProductList";
import { Sidebar } from "../Components/Sidebar";
import { Product } from "../Components/Types/Product";
import { ApiProduct } from "../Components/Types/ApiProduct";
import { useVendorAuth } from "../context/VendorAuthContext";
import "../Styles/VendorProduct.css";
import { ProductFormData } from "../types/product";
import { normalizeDiscountType } from "../utils/productPricing";
import * as XLSX from "xlsx";
import VendorHeader from "../Components/VendorHeader";
import VendorDashboardService from "../services/vendorDashboardService";

const ProductListSkeleton: React.FC = () => {
    return (
        <div className="vendor-product__skeleton">
            <div className="vendor-product__skeleton-header">
                <div className="vendor-product__skeleton-search shimmer"></div>
            </div>
            <div className="vendor-product__skeleton-tabs">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={`tab-${i}`}
                        className="vendor-product__skeleton-tab shimmer"
                    ></div>
                ))}
            </div>
            <div className="vendor-product__skeleton-table">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                        key={`row-${i}`}
                        className="vendor-product__skeleton-row"
                    >
                        <div
                            className="vendor-product__skeleton-cell shimmer"
                            style={{
                                width: "2.5rem",
                                height: "2.5rem",
                                borderRadius: "0.5rem",
                            }}
                        ></div>
                        <div
                            className="vendor-product__skeleton-cell shimmer"
                            style={{ width: "8rem", height: "1.1rem" }}
                        ></div>
                        <div
                            className="vendor-product__skeleton-cell shimmer"
                            style={{ width: "5rem", height: "1.1rem" }}
                        ></div>
                        <div
                            className="vendor-product__skeleton-cell shimmer"
                            style={{ width: "4rem", height: "1.1rem" }}
                        ></div>
                        <div
                            className="vendor-product__skeleton-cell shimmer"
                            style={{ width: "3rem", height: "1.1rem" }}
                        ></div>
                        <div
                            className="vendor-product__skeleton-cell shimmer"
                            style={{ width: "2.5rem", height: "1.1rem" }}
                        ></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "a-z", label: "Name (A\u2013Z)" },
    { value: "z-a", label: "Name (Z\u2013A)" },
    { value: "price-low-high", label: "Price (Low\u2013High)" },
    { value: "price-high-low", label: "Price (High\u2013Low)" },
    { value: "stock-low-high", label: "Stock (Low\u2013High)" },
    { value: "stock-high-low", label: "Stock (High\u2013Low)" },
];

const STATUS_OPTIONS: { value: ProductStatusFilter; label: string }[] = [
    { value: "", label: "All" },
    { value: "AVAILABLE", label: "Available" },
    { value: "LOW_STOCK", label: "Low Stock" },
    { value: "OUT_OF_STOCK", label: "Out of Stock" },
];

const LIMIT_OPTIONS = [10, 25, 50, 100];

const VendorProduct: React.FC = () => {
    const { authState } = useVendorAuth();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isMobile] = useState<boolean>(window.innerWidth < 768);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"active" | "archived">(
        "active",
    );
    const [docketHeight] = useState<number>(80);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(
        null,
    );
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(
        null,
    );
    const [lowStockBannerDismissed, setLowStockBannerDismissed] =
        useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    // --- Derive all filter state from URL search params ---
    const currentPage = parseInt(searchParams.get("page") ?? "1", 10) || 1;
    const productsPerPage =
        parseInt(searchParams.get("limit") ?? "10", 10) || 10;
    const searchQuery = searchParams.get("search") ?? "";
    const sortOption =
        (searchParams.get("sortBy") as ProductSortOption) || "newest";
    const statusFilter =
        (searchParams.get("status") as ProductStatusFilter) || "";

    // Debounced search value to avoid firing a request on every keystroke
    const [searchInput, setSearchInput] = useState<string>(searchQuery);
    useEffect(() => {
        setSearchInput(searchQuery);
    }, [searchQuery]);

    // Helper to update one or many params and optionally reset page
    const updateParams = useCallback(
        (updates: Record<string, string>, resetPage = false) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                Object.entries(updates).forEach(([k, v]) => {
                    if (v) {
                        next.set(k, v);
                    } else {
                        next.delete(k);
                    }
                });
                if (resetPage) next.delete("page");
                return next;
            });
        },
        [setSearchParams],
    );

    // Debounce search input → URL
    useEffect(() => {
        const timer = setTimeout(() => {
            updateParams({ search: searchInput }, true);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

    const deleteProductMutation = useMutation({
        mutationFn: async ({ productId }: { productId: number }) => {
            if (!authState.token)
                throw new Error("Authentication token is missing");
            if (!authState.vendor?.id) throw new Error("Vendor ID is missing");
            return deleteProduct(productId, authState.token);
        },
        onSuccess: () => {
            // Root-key match: the live query key is
            // ["vendor-products", vendorId, page, perPage, search, sort, status, token] —
            // spelling out a shorter key with `token` in the wrong position
            // here never partial-matched it, so the list silently never
            // refetched after a delete/archive.
            queryClient.invalidateQueries({
                queryKey: ["vendor-products", authState.vendor?.id],
            });
            toast.success("Product deleted successfully!");
            setShowDeleteDialog(false);
            setProductToDelete(null);
        },
        onError: (error: Error) => {
            console.error("Error deleting product:", error);
            toast.error(error.message || "Failed to delete product");
            setShowDeleteDialog(false);
            setProductToDelete(null);
        },
    });

    const {
        data: productData,
        isLoading: loading,
        isError,
        error,
    } = useQuery({
        queryKey: [
            "vendor-products",
            authState.vendor?.id,
            currentPage,
            productsPerPage,
            searchQuery,
            sortOption,
            statusFilter,
            authState.token,
        ],
        enabled: !!authState.vendor?.id && !!authState.token,
        queryFn: async () => {
            if (!authState.vendor?.id || !authState.token) {
                throw new Error("Missing vendor or token");
            }

            const response = await fetchProducts(
                Number(authState.vendor.id),
                currentPage,
                productsPerPage,
                {
                    search: searchQuery || undefined,
                    sortBy: sortOption || undefined,
                    status: statusFilter || undefined,
                },
            );

            if (
                !response?.data?.success ||
                !Array.isArray(response.data.data?.product)
            ) {
                throw new Error("Invalid response format");
            }

            const products: Product[] = response.data.data.product.map(
                (product: ApiProduct): Product => {
                    const hasVariants = !!(product as any).hasVariants;

                    const productImages = Array.isArray(product.productImages)
                        ? product.productImages.map((img: any) =>
                              typeof img === "string" ? img : img?.url || "",
                          )
                        : [];

                    const variantImages: string[] = [];
                    if (
                        hasVariants &&
                        Array.isArray((product as any).variants)
                    ) {
                        (product as any).variants.forEach((variant: any) => {
                            if (Array.isArray(variant.variantImages)) {
                                variant.variantImages.forEach((img: any) => {
                                    const url =
                                        typeof img === "string"
                                            ? img
                                            : img?.url;
                                    if (url) variantImages.push(url);
                                });
                            }
                        });
                    }

                    const images = [
                        ...new Set([...productImages, ...variantImages]),
                    ];

                    const basePrice =
                        typeof product.basePrice === "string"
                            ? parseFloat(product.basePrice)
                            : Number(product.basePrice || 0);

                    const finalPrice =
                        typeof (product as any).finalPrice === "string"
                            ? parseFloat((product as any).finalPrice)
                            : Number((product as any).finalPrice || 0);

                    let displayPrice = "—";
                    let originalPrice: string | undefined = undefined;

                    if (!hasVariants) {
                        displayPrice = finalPrice.toFixed(2);
                        if (basePrice > finalPrice) {
                            originalPrice = basePrice.toFixed(2);
                        }
                    }

                    const normalizedVariants = hasVariants
                        ? (product as any).variants.map((v: any) => ({
                              ...v,
                              basePrice:
                                  typeof v.basePrice === "string"
                                      ? parseFloat(v.basePrice)
                                      : Number(v.basePrice || 0),
                              finalPrice:
                                  typeof v.finalPrice === "string"
                                      ? parseFloat(v.finalPrice)
                                      : Number(v.finalPrice || v.price || 0),
                          }))
                        : undefined;

                    let status: "AVAILABLE" | "OUT_OF_STOCK" | "LOW_STOCK" =
                        "AVAILABLE";
                    if (product.status === "OUT_OF_STOCK")
                        status = "OUT_OF_STOCK";
                    else if (product.status === "LOW_STOCK")
                        status = "LOW_STOCK";

                    return {
                        id: product.id,
                        name: product.name,
                        title: product.name,
                        description: product.description,
                        brand: product.brand,
                        keywords: product.keywords,

                        finalPrice: product.finalPrice,
                        price: finalPrice,

                        deal: product.deal,

                        dealId: product.dealId,

                        // basePrice: hasVariants ? 0 : basePrice,
                        originalPrice,

                        stock: product.stock,
                        status,

                        hasVariants,
                        variants: normalizedVariants,

                        discount: product.discount?.toString() || "0",
                        discountType: product.discountType,

                        productImages: images,
                        image: images[0] || "",

                        subcategory: product.subcategory,
                        category: product.subcategory?.name || "",
                        subcategoryId: product.subcategory?.id || 0,

                        vendor: product.vendor?.businessName || "",

                        rating: 0,
                        ratingCount: 0,
                        created_at:
                            (product as any).created_at || product.createdAt,
                    };
                },
            );

            return {
                products,
                total: response.data.data.total || products.length,
                serverTotal: response.data.data.total || products.length,
            };
        },
    });

    // Sorting and filtering are fully server-side; no client-side sort needed.

    const handleProductSubmit = (success: boolean, errorMessage?: string) => {
        if (success) {
            queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
            toast.success("Product added successfully!");
            setShowAddModal(false);
        } else {
            toast.error(
                errorMessage ||
                    "Failed to add product. Please check all required fields.",
            );
        }
    };

    const handleDeleteProduct = (product: Product) => {
        setProductToDelete(product);
        setShowDeleteDialog(true);
    };

    const confirmDeleteProduct = () => {
        if (productToDelete) {
            deleteProductMutation.mutate({
                productId: productToDelete.id,
            });
        }
    };

    const cancelDeleteProduct = () => {
        setShowDeleteDialog(false);
        setProductToDelete(null);
    };

    const editProductMutation = useMutation({
        mutationFn: async ({
            productId,
            productData,
            categoryId,
            subcategoryId,
        }: {
            productId: number;
            productData: ProductFormData;
            categoryId: number;
            subcategoryId: number;
        }) => {
            //("🔄 EDIT PRODUCT MUTATION START");
            //("Product ID:", productId);
            //("Category ID:", categoryId);
            //("Subcategory ID:", subcategoryId);
            //("Product Data:", productData);

            if (!authState.token)
                throw new Error("Authentication token is missing");
            if (!authState.vendor?.id) throw new Error("Vendor ID is missing");
            if (!categoryId || !subcategoryId) {
                throw new Error("Category and subcategory are required");
            }

            const updatePayload: any = {
                name: productData.name,
                subcategoryId: subcategoryId,
                hasVariants: productData.hasVariants || false,
            };

            if (productData.description)
                updatePayload.description = productData.description;
            if (
                productData.discount !== undefined &&
                productData.discount !== null &&
                productData.discount !== ""
            ) {
                updatePayload.discount =
                    typeof productData.discount === "string"
                        ? parseFloat(productData.discount)
                        : productData.discount;
            }
            if (productData.discountType)
                updatePayload.discountType = productData.discountType;
            if (productData.dealId) updatePayload.dealId = productData.dealId;
            if (productData.bannerId)
                updatePayload.bannerId = productData.bannerId;
            if (
                productData.productImages &&
                productData.productImages.length > 0
            ) {
                updatePayload.productImages = productData.productImages;
            }

            if (productData.hasVariants) {
                if (productData.variants && productData.variants.length > 0) {
                    updatePayload.variants = productData.variants.map(
                        (variant: any) => ({
                            sku: variant.sku,
                            basePrice: variant.price || variant.basePrice,
                            discount: variant.discount || 0,
                            discountType: normalizeDiscountType(
                                variant.discountType,
                            ),
                            attributes: variant.attributes || {},
                            variantImages:
                                variant.images || variant.variantImages || [],
                            stock: variant.stock,
                            status: variant.status || "AVAILABLE",
                        }),
                    );
                }
            } else {
                updatePayload.basePrice =
                    typeof productData.basePrice === "string"
                        ? parseFloat(productData.basePrice)
                        : productData.basePrice;
                updatePayload.stock =
                    typeof productData.stock === "string"
                        ? parseInt(productData.stock)
                        : productData.stock;
                updatePayload.status = productData.status || "AVAILABLE";
            }

            return updateProduct(
                productId,
                categoryId,
                subcategoryId,
                updatePayload,
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [
                    "vendor-products",
                    authState.vendor?.id,
                    currentPage,
                    productsPerPage,
                    authState.token,
                ],
            });
        },
    });

    const handleEditProduct = (product: Product) => {
        let discount: number | null = null;
        if (product.discount) {
            if (typeof product.discount === "number") {
                discount = product.discount;
            } else {
                discount = parseFloat(product.discount.toString());
            }
        }

        type SubcategoryType = {
            id: number;
            name: string;
            image?: string | null;
            createdAt?: string;
            updatedAt?: string;
        };
        const subcategory =
            product.subcategory &&
            typeof product.subcategory === "object" &&
            "id" in product.subcategory &&
            "name" in product.subcategory
                ? {
                      id: product.subcategory.id,
                      name: product.subcategory.name,
                      image:
                          (product.subcategory as SubcategoryType).image ||
                          null,
                      createdAt:
                          (product.subcategory as SubcategoryType).createdAt ||
                          new Date().toISOString(),
                      updatedAt:
                          (product.subcategory as SubcategoryType).updatedAt ||
                          new Date().toISOString(),
                  }
                : {
                      id: 0,
                      name: "",
                      image: null,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                  };

        let categoryId = product.categoryId || 0;
        if (
            !categoryId &&
            product.subcategory &&
            typeof product.subcategory === "object"
        ) {
            if ("categoryId" in product.subcategory) {
                categoryId = (product.subcategory as any).categoryId;
            } else if (
                "category" in product.subcategory &&
                product.subcategory.category &&
                typeof product.subcategory.category === "object" &&
                "id" in product.subcategory.category
            ) {
                categoryId = (product.subcategory.category as any).id;
            }
        }

        const apiProduct: ApiProduct = {
            ...(product as any),
            categoryId: categoryId,
            basePrice:
                typeof product.basePrice === "number"
                    ? product.basePrice
                    : product.basePrice
                      ? parseFloat(product.basePrice.toString())
                      : typeof product.price === "string"
                        ? parseFloat(product.price)
                        : typeof product.price === "number"
                          ? product.price
                          : 0,
            discount: discount,
            discountType:
                product.discountType === "PERCENTAGE" ||
                product.discountType === "FLAT" ||
                product.discountType === "NONE"
                    ? product.discountType
                    : null,
            status:
                product.status === "OUT_OF_STOCK"
                    ? "OUT_OF_STOCK"
                    : product.status === "LOW_STOCK"
                      ? "LOW_STOCK"
                      : "AVAILABLE",
            productImages:
                product.productImages || (product.image ? [product.image] : []),
            inventory: [],
            vendorId: 0,
            createdAt: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            subcategory: subcategory,
            vendor:
                typeof product.vendor === "object" && product.vendor !== null
                    ? product.vendor
                    : {
                          id: 0,
                          businessName: "",
                          email: "",
                          phoneNumber: "",
                          districtId: 0,
                          isVerified: false,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          district: { id: 0, name: "" },
                      },
            brand:
                typeof product.brand === "object" && product.brand
                    ? product.brand
                    : typeof product.brand === "string"
                      ? product.brand
                      : null,
            keywords: product.keywords || null,
            deal: product.deal || null,
            hasVariants: (product as any).hasVariants || false,
            variants: (product as any).variants || [],
            price:
                typeof product.price === "number"
                    ? product.price
                    : product.price
                      ? parseFloat(product.price.toString())
                      : 0,
            image: product.image || "",
            brand_id: product.brand_id || null,
            bannerId: (product as any).bannerId || null,
            brandId: (product as any).brandId || null,
        } as ApiProduct;

        setEditingProduct(apiProduct);
        setShowEditModal(true);
    };

    const handleSaveEditProduct = async (
        _productId: number,
        _productData: ProductFormData,
        _categoryId: number,
        _subcategoryId: number,
    ) => {
        try {
            await queryClient.invalidateQueries({
                queryKey: ["vendor-products"],
            });
        } finally {
            setShowEditModal(false);
            setEditingProduct(null);
        }
    };

    const { data: vendorStats } = useQuery({
        queryKey: ["vendor-stats", authState.vendor?.id],
        enabled: !!authState.vendor?.id && !!authState.token,
        queryFn: () =>
            VendorDashboardService.getInstance().getVendorStats(
                authState.token!,
            ),
    });

    const products: Product[] = productData?.products || [];
    const totalProducts = productData?.serverTotal || productData?.total || 0;
    const lowStockCount = products.filter(
        (p) => p.status === "LOW_STOCK",
    ).length;
    const finalProducts = products;
    const finalTotal = totalProducts;

    const handlePageChange = (pageNumber: number) => {
        updateParams({ page: String(pageNumber) });
    };

    const handleExportExcel = async () => {
        if (!authState.vendor?.id) return;
        setIsExporting(true);
        try {
            // Fetch ALL products (large limit) so export is not limited to current page
            const response = await fetchProducts(
                Number(authState.vendor.id),
                1,
                9999,
            );
            const rawProducts: any[] = response.data.data?.product || [];

            const exportData = rawProducts.map((product: any) => {
                const hasVariants = !!product.hasVariants;
                const variants: any[] = Array.isArray(product.variants)
                    ? product.variants
                    : [];

                // --- Price ---
                let price: number;
                if (hasVariants && variants.length > 0) {
                    // Use the minimum finalPrice across all variants
                    const variantPrices = variants
                        .map((v) => {
                            const fp =
                                typeof v.finalPrice === "string"
                                    ? parseFloat(v.finalPrice)
                                    : Number(v.finalPrice ?? v.price ?? 0);
                            return isNaN(fp) ? null : fp;
                        })
                        .filter((p): p is number => p !== null);
                    price =
                        variantPrices.length > 0
                            ? Math.min(...variantPrices)
                            : 0;
                } else {
                    const fp =
                        typeof product.finalPrice === "string"
                            ? parseFloat(product.finalPrice)
                            : Number(
                                  product.finalPrice ?? product.basePrice ?? 0,
                              );
                    price = isNaN(fp) ? 0 : fp;
                }

                // --- Stock ---
                let stock: number;
                if (hasVariants && variants.length > 0) {
                    // Sum stock across all variants
                    stock = variants.reduce((sum, v) => {
                        const s =
                            typeof v.stock === "string"
                                ? parseInt(v.stock, 10)
                                : Number(v.stock ?? 0);
                        return sum + (isNaN(s) ? 0 : s);
                    }, 0);
                } else {
                    const s =
                        typeof product.stock === "string"
                            ? parseInt(product.stock, 10)
                            : Number(product.stock ?? 0);
                    stock = isNaN(s) ? 0 : s;
                }

                // --- Price label ---
                const priceLabel = hasVariants
                    ? `From ${price.toFixed(2)}`
                    : price.toFixed(2);

                return {
                    Name: product.name || "",
                    Category: product.subcategory?.name || "",
                    "Has Variants": hasVariants ? "Yes" : "No",
                    "Variant Count": hasVariants ? variants.length : "—",
                    Price: priceLabel,
                    Stock: stock,
                    Status: product.status || "AVAILABLE",
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
            XLSX.writeFile(workbook, "vendor-products.xlsx");
        } catch (err) {
            console.error("Export failed:", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="vendor-dash-container">
            <Sidebar />
            <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
                <VendorHeader showSearch={false} title="Product Management" />
                <div className="dashboard__search-container">
                    {/* Search */}
                    <div
                        className="dashboard__search"
                        style={{ flex: 1, minWidth: 200 }}
                    >
                        <input
                            className="dashboard__search-input"
                            type="text"
                            placeholder="Search products..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            id="product-search"
                        />
                        <span className="dashboard__search-icon" />
                    </div>

                    {/* Sort By */}
                    <select
                        id="product-sort"
                        className="vendor-product__sort-select"
                        value={sortOption}
                        onChange={(e) =>
                            updateParams({ sortBy: e.target.value }, true)
                        }
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    {/* Inventory Status */}
                    <select
                        id="product-status"
                        className="vendor-product__filter-select"
                        value={statusFilter}
                        onChange={(e) =>
                            updateParams({ status: e.target.value }, true)
                        }
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    {/* Page size selector is at the bottom next to pagination */}
                </div>
                <main
                    className="dashboard__main"
                    style={{
                        paddingBottom: isMobile
                            ? `${docketHeight + 24}px`
                            : "24px",
                    }}
                >
                    <div className="vendor-view-tabs">
                        <button
                            className={`vendor-view-tab-btn ${
                                activeTab === "active"
                                    ? "vendor-view-tab-btn--active"
                                    : ""
                            }`}
                            onClick={() => setActiveTab("active")}
                        >
                            Active Products
                        </button>
                        <button
                            className={`vendor-view-tab-btn ${
                                activeTab === "archived"
                                    ? "vendor-view-tab-btn--active"
                                    : ""
                            }`}
                            onClick={() => setActiveTab("archived")}
                        >
                            Archived Products
                        </button>
                    </div>
                    {activeTab === "archived" ? (
                        <ArchivedProductsTab
                            token={authState.token}
                            onRestored={() =>
                                queryClient.invalidateQueries({
                                    queryKey: ["vendor-products"],
                                })
                            }
                        />
                    ) : (
                    <>
                    {!lowStockBannerDismissed && lowStockCount > 0 && (
                        <div className="low-stock-banner">
                            <span className="low-stock-banner__icon">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <line
                                        x1="12"
                                        y1="9"
                                        x2="12"
                                        y2="13"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <line
                                        x1="12"
                                        y1="17"
                                        x2="12.01"
                                        y2="17"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </span>
                            <p className="low-stock-banner__msg">
                                You have <strong>{lowStockCount}</strong>{" "}
                                product{lowStockCount > 1 ? "s" : ""} with low
                                stock. Consider restocking soon.
                            </p>
                            <button
                                className="low-stock-banner__close"
                                onClick={() => setLowStockBannerDismissed(true)}
                                aria-label="Dismiss"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    <div className="vendor-product__actions">
                        <button
                            className="vendor-product__add-btn"
                            onClick={() => setShowAddModal(true)}
                        >
                            <span className="vendor-product__add-icon">+</span>
                            Add Product
                        </button>
                        <button
                            className="vendor-product__export-btn"
                            onClick={handleExportExcel}
                            disabled={isExporting}
                        >
                            {isExporting ? "Exporting..." : "Export to Excel"}
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
                            onClose={() => {
                                setShowEditModal(false);
                                setEditingProduct(null);
                            }}
                            onSave={handleSaveEditProduct}
                            product={editingProduct}
                        />
                    )}
                    <DeleteModal
                        show={showDeleteDialog}
                        onClose={cancelDeleteProduct}
                        onDelete={confirmDeleteProduct}
                        productName={productToDelete?.name || "Product"}
                        isLoading={deleteProductMutation.isPending}
                    />
                    {loading ? (
                        <ProductListSkeleton />
                    ) : isError ? (
                        <div className="vendor-product__error">
                            {(error as Error).message}
                        </div>
                    ) : finalProducts.length > 0 ? (
                        <>
                            <ProductList
                                products={finalProducts}
                                isMobile={isMobile}
                                onEdit={handleEditProduct}
                                onDelete={handleDeleteProduct}
                                showVendor={false}
                            />
                            {finalTotal > 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: "12px",
                                        marginTop: "16px",
                                    }}
                                >
                                    {/* Pagination */}
                                    <div style={{ flex: 1 }}>
                                        {finalTotal > productsPerPage && (
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={Math.ceil(
                                                    finalTotal /
                                                        productsPerPage,
                                                )}
                                                onPageChange={handlePageChange}
                                            />
                                        )}
                                    </div>

                                    {/* Page size selector */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "8px",
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            whiteSpace: "nowrap",
                                            marginTop: "24px",
                                        }}
                                    >
                                        <span>Rows per page:</span>
                                        <select
                                            id="product-limit"
                                            className="vendor-product__limit-select"
                                            value={productsPerPage}
                                            onChange={(e) =>
                                                updateParams(
                                                    { limit: e.target.value },
                                                    true,
                                                )
                                            }
                                        >
                                            {LIMIT_OPTIONS.map((n) => (
                                                <option key={n} value={n}>
                                                    {n}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="vendor-product__no-results">
                            No product found.
                        </div>
                    )}
                    </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default VendorProduct;
