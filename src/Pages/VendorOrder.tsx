import React, { useState, useEffect } from "react";
import { Sidebar } from "../Components/Sidebar";
import Pagination from "../Components/Pagination";
import OrderList from "../Components/OrderList";
import ViewModal, { VendorOrderDetail } from "../Components/Modal/ViewModal";
import { useDocketHeight } from "../Hook/UseDockerHeight";
import "../Styles/VendorOrder.css";
import * as XLSX from "xlsx";
import VendorDashboardService from "../services/vendorDashboardService";
import { useVendorAuth } from "../context/VendorAuthContext";
import { Order } from "../Components/Types/Order";
import { useQuery } from "@tanstack/react-query";
import VendorHeader from "../Components/VendorHeader";
import { useSearchParams } from "react-router-dom";

const VendorOrder: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<string>("All Orders");
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const docketHeight = useDocketHeight();
    const { authState } = useVendorAuth();

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [ordersPerPage] = useState<number>(5);

    // Sorting state
    const [sortOption, setSortOption] = useState<string>("newest");

    // Modal states
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedOrderDetail, setSelectedOrderDetail] =
        useState<VendorOrderDetail | null>(null);

    // TanStack Query for orders
    const {
        data: queryData,
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: [
            "vendor-orders",
            authState.token,
            currentPage,
            ordersPerPage,
            activeTab,
            sortOption,
        ],
        queryFn: async () => {
            if (!authState.token)
                throw new Error("No authentication token available");
            const dashboardService = VendorDashboardService.getInstance();

            let status = undefined;
            if (activeTab === "Completed") status = "delivered";
            if (activeTab === "Pending") status = "pending";
            if (activeTab === "Canceled") status = "canceled";

            const response = await dashboardService.getVendorOrdersNew(
                authState.token,
                {
                    page: currentPage,
                    limit: ordersPerPage,
                    status: status,
                    sort: sortOption,
                }
            );
            const apiOrders = response.data;
            const mappedOrders = apiOrders.map((order: any) => {
                const firstItem = order.orderItems[0];
                return {
                    id: order.id,
                    orderId:
                        order.orderNumber ||
                        `#ORD${String(order.id).padStart(4, "0")}`,
                    orderNumber: order.orderNumber,
                    orderedBy:
                        order.orderedBy?.name ||
                        order.orderedBy?.fullName ||
                        order.orderedBy?.username ||
                        "Unknown Customer",
                    product: (() => {
                        const names = order.orderItems.map(
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
                    // This vendor's own payable amount only — never the
                    // order's full multi-vendor total.
                    price: order.vendorPayable,
                    paymentStatus: order.paymentStatus || "",
                    paymentMethod: (() => {
                        const method = order.paymentMethod || "";
                        if (method === "CASH_ON_DELIVERY") return "COD";
                        return method;
                    })(),
                    status: (() => {
                        const rawStatus = (order.status || "").toUpperCase();
                        if (rawStatus === "DELIVERED") return "delivered";
                        if (
                            rawStatus === "CANCELLED" ||
                            rawStatus === "CANCELED" ||
                            rawStatus === "RETURNED"
                        )
                            return "canceled";
                        if (rawStatus === "PENDING" || !rawStatus)
                            return "pending";
                        // CONFIRMED / PROCESSING / SHIPPED / DELAYED are real,
                        // distinct order states - the system has no "pending"
                        // state after checkout for COD/paid orders (they start
                        // CONFIRMED). Collapsing all of these into "pending"
                        // made the table show a status that disagreed with the
                        // order's actual (correct) status shown in its detail
                        // view. Show the real status instead.
                        return rawStatus.toLowerCase();
                    })(),
                };
            });

            return {
                items: mappedOrders,
                pagination: response.pagination,
                statusCounts: response.statusCounts,
            };
        },
        enabled: !!authState.token,
    });

    const displayedOrders = queryData?.items || [];
    const totalPages = queryData?.pagination?.totalPages || 1;
    const statusCounts = queryData?.statusCounts || {
        all: 0,
        pending: 0,
        delivered: 0,
        canceled: 0,
    };

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

    const tabs = [
        { id: "All Orders", label: `All Orders (${statusCounts.all})` },
        {
            id: "Completed",
            label: `Completed (${statusCounts.delivered})`,
        },
        {
            id: "Pending",
            label: `Pending (${statusCounts.pending})`,
        },
        {
            id: "Canceled",
            label: `Canceled (${statusCounts.canceled})`,
        },
    ];



    const getAllOrdersForExport = async () => {
        if (!authState.token) return [];

        const dashboardService = VendorDashboardService.getInstance();

        let status = undefined;
        if (activeTab === "Completed") status = "delivered";
        if (activeTab === "Pending") status = "pending";
        if (activeTab === "Canceled") status = "canceled";

        const response = await dashboardService.getVendorOrdersNew(
            authState.token,
            {
                page: 1,
                limit: 9999,
                status,
                sort: sortOption,
            }
        );

        return response.data.map((order: any) => {
            const firstItem = order.orderItems[0];

            return {
                "Order ID":
                    order.orderNumber ||
                    `#ORD${String(order.id).padStart(4, "0")}`,
                "Ordered By":
                    order.orderedBy?.name ||
                    order.orderedBy?.fullName ||
                    order.orderedBy?.username ||
                    "Unknown Customer",
                Product: [
                    ...new Set(
                        order.orderItems
                            .map((item: any) => item.product?.name)
                            .filter(Boolean)
                    ),
                ].join(", ") || firstItem?.product?.name || "Unknown Product",
                "Created At": order.createdAt,
                Price: order.vendorPayable,
                "Payment Status": order.paymentStatus || "",
                Status: order.status,
            };
        });
    };

    const handleExportCSV = async () => {
        const allOrders = await getAllOrdersForExport();
        const worksheet = XLSX.utils.json_to_sheet(allOrders);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
        XLSX.writeFile(workbook, "orders.csv");
    };

    const handleExportExcel = async () => {
        const allOrders = await getAllOrdersForExport();
        const worksheet = XLSX.utils.json_to_sheet(allOrders);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
        XLSX.writeFile(workbook, "orders.xlsx");
    };

    // Modal handler for viewing
    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        fetchOrderDetails(order.id);
        setIsViewModalOpen(true);
    };

    if (loading) {
        return (
            <div className="vendor-dash-container">
                <Sidebar />
                <div
                    className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}
                >
                    <VendorHeader
                        title="Order Management"
                        showSearch={false}
                    />
                    <main
                        className="dashboard__main"
                        style={{
                            paddingBottom: isMobile
                                ? `${docketHeight + 24}px`
                                : "24px",
                        }}
                    >
                        <div className="vendor-order__tabs">
                            {[...Array(4)].map((_, index) => (
                                <div
                                    key={index}
                                    className="skeleton"
                                    style={{
                                        width: "100px",
                                        height: "24px",
                                        margin: "0 8px",
                                    }}
                                ></div>
                            ))}
                        </div>
                        <div className="vendor-order__sorting">
                            <div
                                className="skeleton"
                                style={{ width: "80px", height: "16px" }}
                            ></div>
                            <div
                                className="skeleton"
                                style={{ width: "120px", height: "24px" }}
                            ></div>
                        </div>
                        <div className="vendor-order__export-buttons">
                            {[...Array(2)].map((_, index) => (
                                <div
                                    key={index}
                                    className="skeleton"
                                    style={{
                                        width: "100px",
                                        height: "24px",
                                        margin: "0 8px",
                                    }}
                                ></div>
                            ))}
                        </div>
                        <div className="vendor-order__order-list-skeleton">
                            {[...Array(5)].map((_, index) => (
                                <div
                                    key={index}
                                    className="skeleton"
                                    style={{
                                        width: "100%",
                                        height: "60px",
                                        marginBottom: "8px",
                                    }}
                                ></div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        );
    }

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
                        showSearch={false}
                    />
                    <main
                        className="dashboard__main"
                        style={{
                            paddingBottom: isMobile
                                ? `${docketHeight + 24}px`
                                : "24px",
                        }}
                    >
                        <div className="vendor-order__tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`vendor-order__tab ${activeTab === tab.id ? "vendor-order__tab--active" : ""}`}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setCurrentPage(1);
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
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
                        <div className="vendor-order__export-buttons">
                            <button onClick={handleExportCSV}>
                                Export to CSV
                            </button>
                            <button onClick={handleExportExcel}>
                                Export to Excel
                            </button>
                        </div>
                        {displayedOrders.length > 0 ? (
                            <>
                                <OrderList
                                    orders={displayedOrders}
                                    isMobile={isMobile}
                                    onView={handleViewOrder}
                                />
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        ) : (
                            <div className="vendor-order__no-results">
                                No orders found.
                            </div>
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
