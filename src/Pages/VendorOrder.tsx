import React, { useState, useEffect } from "react";
import { Sidebar } from "../Components/Sidebar";
import Pagination, {
    DEFAULT_PAGE_SIZE,
} from "../Components/Pagination";
import OrderList from "../Components/OrderList";
import ViewModal, { VendorOrderDetail } from "../Components/Modal/ViewModal";
import { useDocketHeight } from "../Hook/UseDockerHeight";
import "../Styles/VendorOrder.css";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import VendorDashboardService from "../services/vendorDashboardService";
import { useVendorAuth } from "../context/VendorAuthContext";
import { Order } from "../Components/Types/Order";
import { useQuery } from "@tanstack/react-query";
import VendorHeader from "../Components/VendorHeader";
import { useSearchParams } from "react-router-dom";
import { ORDER_STATUS_OPTIONS } from "../Components/orderStatus";

const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "All Statuses" },
    ...ORDER_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
];

/** Shared shape mapper for both the paginated list and the full export —
 * keeps the two in sync so an exported row always looks like its table row. */
const mapVendorOrder = (order: any): Order => {
    const firstItem = order.orderItems?.[0];
    return {
        id: order.id,
        orderId:
            order.orderNumber || `#ORD${String(order.id).padStart(4, "0")}`,
        orderNumber: order.orderNumber,
        orderedBy:
            order.orderedBy?.name ||
            order.orderedBy?.fullName ||
            order.orderedBy?.username ||
            "Unknown Customer",
        product: (() => {
            const names = (order.orderItems || []).map(
                (item: any) => item.product?.name,
            );
            const unique = [...new Set(names.filter(Boolean))];
            return (
                unique.join(", ") ||
                firstItem?.product?.name ||
                "Unknown Product"
            );
        })(),
        createdAt: order.createdAt,
        // This vendor's own payable amount only — never the order's full
        // multi-vendor total.
        price: order.vendorPayable,
        paymentStatus: order.paymentStatus || "",
        paymentMethod: (() => {
            const method = order.paymentMethod || "";
            if (method === "CASH_ON_DELIVERY") return "COD";
            return method;
        })(),
        // Real backend status, unchanged — OrderList renders it through the
        // same shared status-meta map admin uses, so labels/colors stay
        // consistent across both dashboards.
        status: (order.status || "CREATED").toUpperCase(),
    };
};

const VendorOrder: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const docketHeight = useDocketHeight();
    const { authState } = useVendorAuth();

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [ordersPerPage, setOrdersPerPage] = useState<number>(DEFAULT_PAGE_SIZE);

    // Search state — debounced so every keystroke doesn't hit the backend
    const [searchInput, setSearchInput] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchQuery(searchInput.trim());
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    // Sorting state
    const [sortOption, setSortOption] = useState<string>("newest");

    // Export state
    const [isExporting, setIsExporting] = useState<false | "csv" | "excel">(false);

    // Modal states
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedOrderDetail, setSelectedOrderDetail] =
        useState<VendorOrderDetail | null>(null);

    // TanStack Query for orders
    const {
        data: queryData,
        isFetching,
        error,
        refetch,
    } = useQuery({
        queryKey: [
            "vendor-orders",
            authState.token,
            currentPage,
            ordersPerPage,
            statusFilter,
            sortOption,
            searchQuery,
        ],
        queryFn: async () => {
            if (!authState.token)
                throw new Error("No authentication token available");
            const dashboardService = VendorDashboardService.getInstance();

            const status = statusFilter !== "all" ? statusFilter : undefined;

            const response = await dashboardService.getVendorOrdersNew(
                authState.token,
                {
                    page: currentPage,
                    limit: ordersPerPage,
                    status,
                    sort: sortOption,
                    search: searchQuery || undefined,
                }
            );

            return {
                items: (response.data || []).map(mapVendorOrder),
                pagination: response.pagination,
            };
        },
        enabled: !!authState.token,
    });

    const displayedOrders = queryData?.items || [];
    const totalPages = queryData?.pagination?.totalPages || 1;
    const totalItems = queryData?.pagination?.totalItems ?? displayedOrders.length;

    const orderIdFromParams = searchParams.get("orderId");

    useEffect(() => {
        if (orderIdFromParams && displayedOrders.length > 0) {
            const order = displayedOrders.find(
                (o: Order) => o.id.toString() === orderIdFromParams,
            );
            if (order) {
                setSelectedOrder(order);
                fetchOrderDetails(order.id);
                setIsViewModalOpen(true);
            }
        }
    }, [orderIdFromParams, displayedOrders]);

    // Fetch order details for viewing
    const fetchOrderDetails = async (orderId: number) => {
        if (!authState.token) return;
        try {
            const dashboardService = VendorDashboardService.getInstance();
            const response = await dashboardService.getVendorOrderDetail(
                authState.token,
                orderId,
            );
            setSelectedOrderDetail(response.data);
        } catch (err: any) {
            setErrorMessage(
                err.response?.data?.message || "Failed to fetch order details",
            );
        }
    };

    // Filtering, Sorting, and Pagination are now handled by the backend.

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    /** Fetches EVERY order matching the current filters from the backend
     * (not just the current page) so exports are complete regardless of
     * pagination — the previous version only ever exported displayedOrders,
     * i.e. whatever page happened to be on screen. */
    const fetchAllOrdersForExport = async (): Promise<Order[]> => {
        if (!authState.token) throw new Error("No authentication token available");
        const dashboardService = VendorDashboardService.getInstance();
        const response = await dashboardService.exportVendorOrders(authState.token, {
            status: statusFilter !== "all" ? statusFilter : undefined,
            sort: sortOption,
            search: searchQuery || undefined,
        });
        return (response.data || []).map(mapVendorOrder);
    };

    const toExportRows = (rows: Order[]) =>
        rows.map((order) => ({
            "Order ID": order.orderId,
            "Ordered By": order.orderedBy,
            Product: order.product,
            "Created At": order.createdAt,
            Price: order.price,
            "Payment Status": order.paymentStatus,
            Status: order.status,
        }));

    const handleExportCSV = async () => {
        setIsExporting("csv");
        try {
            const rows = toExportRows(await fetchAllOrdersForExport());
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
            XLSX.writeFile(workbook, "orders.csv");
            toast.success(`Exported ${rows.length} order${rows.length === 1 ? "" : "s"}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to export orders");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportExcel = async () => {
        setIsExporting("excel");
        try {
            const rows = toExportRows(await fetchAllOrdersForExport());
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
            XLSX.writeFile(workbook, "orders.xlsx");
            toast.success(`Exported ${rows.length} order${rows.length === 1 ? "" : "s"}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to export orders");
        } finally {
            setIsExporting(false);
        }
    };

    // Modal handler for viewing
    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        fetchOrderDetails(order.id);
        setIsViewModalOpen(true);
    };

    if (error)
        return <div className="vendor-order__error">{error.message}</div>;
    if (errorMessage)
        return <div className="vendor-order__error">{errorMessage}</div>;

    return (
        <div style={{ background: "#fff", minHeight: "100vh" }}>
            <style>{`
        .order-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 0 16px 0;
          background: #fff;
        }
        .order-header img {
          width: 120px;
          height: auto;
          margin-bottom: 0;
        }
        @media (max-width: 600px) {
          .order-header {
            padding: 18px 0 8px 0;
          }
          .order-header img {
            width: 90px;
          }
        }
        .vendor-order__table-container {
          overflow-x: auto;
          background: #fff;
        }
        .vendor-order__table {
          min-width: 700px;
        }
      `}</style>

            <div className="vendor-dash-container">
                <Sidebar />
                <div
                    className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}
                >
                    <VendorHeader
                        title="Order Management"
                        showSearch={true}
                        onSearch={(value) => setSearchInput(value)}
                    />
                    <main
                        className="dashboard__main"
                        style={{
                            paddingBottom: isMobile
                                ? `${docketHeight + 24}px`
                                : "24px",
                        }}
                    >
                        <div className="vendor-order__toolbar">
                            <div className="vendor-order__sorting">
                                <label htmlFor="status-filter">Status:</label>
                                <select
                                    id="status-filter"
                                    className="vendor-order__sort-dropdown"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    {STATUS_FILTER_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="vendor-order__sorting">
                                <label htmlFor="sort-options">Sort By:</label>
                                <select
                                    id="sort-options"
                                    className="vendor-order__sort-dropdown"
                                    value={sortOption}
                                    onChange={(e) => {
                                        setSortOption(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="highestPrice">
                                        Highest Price
                                    </option>
                                    <option value="lowestPrice">
                                        Lowest Price
                                    </option>
                                </select>
                            </div>
                            <span className="vendor-order__count">
                                {totalItems} order{totalItems === 1 ? "" : "s"}
                            </span>
                        </div>
                        <div className="vendor-order__export-buttons">
                            <button onClick={handleExportCSV} disabled={!!isExporting}>
                                {isExporting === "csv" ? "Exporting..." : "Export to CSV"}
                            </button>
                            <button onClick={handleExportExcel} disabled={!!isExporting}>
                                {isExporting === "excel" ? "Exporting..." : "Export to Excel"}
                            </button>
                        </div>
                        {!isFetching && displayedOrders.length === 0 ? (
                            <div className="vendor-order__no-results">
                                {searchQuery
                                    ? `No orders found for "${searchQuery}".`
                                    : "No orders found."}
                            </div>
                        ) : (
                            <>
                                <OrderList
                                    orders={displayedOrders}
                                    isMobile={isMobile}
                                    onView={handleViewOrder}
                                    loading={isFetching}
                                />
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    pageSize={ordersPerPage}
                                    totalItems={totalItems}
                                    onPageSizeChange={(size) => {
                                        setOrdersPerPage(size);
                                        setCurrentPage(1);
                                    }}
                                />
                            </>
                        )}
                    </main>
                </div>
                <ViewModal
                    show={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    order={selectedOrder}
                    orderDetail={selectedOrderDetail}
                    onStatusChanged={() => {
                        if (selectedOrder) fetchOrderDetails(selectedOrder.id);
                        refetch();
                    }}
                />
            </div>
        </div>
    );
};

export default VendorOrder;
