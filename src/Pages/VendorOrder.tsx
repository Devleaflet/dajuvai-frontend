import React, { useState, useEffect } from "react";
import { Sidebar } from "../Components/Sidebar";
import Pagination from "../Components/Pagination";
import OrderList from "../Components/OrderList";
import ViewModal from "../Components/Modal/ViewModal";
import { useDocketHeight } from "../Hook/UseDockerHeight";
import "../Styles/VendorOrder.css";
import * as XLSX from "xlsx";
import VendorDashboardService from "../services/vendorDashboardService";
import { useVendorAuth } from "../context/VendorAuthContext";
import { Order, OrderDetail } from "../Components/Types/Order";
import { useQuery } from '@tanstack/react-query';

import VendorHeader from "../Components/VendorHeader";

const VendorOrder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("All Orders");
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState<string>("");
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
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetail | null>(null);

  // TanStack Query for orders
  const {
    data: allOrders = [] as Order[],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["vendor-orders", authState.token],
    queryFn: async () => {
      if (!authState.token) throw new Error("No authentication token available");
      const dashboardService = VendorDashboardService.getInstance();
      const response = await dashboardService.getVendorOrdersNew(authState.token);
      const apiOrders = response.data;
      return apiOrders.map((order: OrderDetail) => {
        const firstItem = order.orderItems[0];
        return {
          id: order.id,
          orderId: `#ORD${String(order.id).padStart(4, "0")}`,
          orderedBy: order.orderedBy.username || "Unknown Customer",
          product: firstItem.product.name,
          createdAt: order.createdAt,
          price: parseFloat(order.totalPrice) + parseFloat(order.shippingFee),
          paymentStatus: order.paymentMethod || "",
          status: order.status.toLowerCase().replace("confirmed", "delivered"),
        };
      });
    },
    enabled: !!authState.token
  });

  // Fetch order details for viewing
  const fetchOrderDetails = async (orderId: number) => {
    if (!authState.token) return;
    try {
      const dashboardService = VendorDashboardService.getInstance();
      const response = await dashboardService.getVendorOrderDetail(authState.token, orderId);
      setSelectedOrderDetail(response.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to fetch order details");
    }
  };

  // Filtering
  let filteredOrders = [...allOrders];
  switch (activeTab) {
    case "Completed":
      filteredOrders = filteredOrders.filter((o: Order) => o.status === "delivered");
      break;
    case "Pending":
      filteredOrders = filteredOrders.filter((o: Order) => o.status === "pending");
      break;
    case "Canceled":
      filteredOrders = filteredOrders.filter((o: Order) => o.status === "canceled");
      break;
    default:
      break;
  }
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase();
    filteredOrders = filteredOrders.filter(
      (order: Order) =>
        order.product.toLowerCase().includes(query) ||
        order.orderedBy.toLowerCase().includes(query)
    );
  }
  // Sorting
  switch (sortOption) {
    case "newest":
      filteredOrders.sort(
        (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "oldest":
      filteredOrders.sort(
        (a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      break;
    case "highestPrice":
      filteredOrders.sort((a: Order, b: Order) => b.price - a.price);
      break;
    case "lowestPrice":
      filteredOrders.sort((a: Order, b: Order) => a.price - b.price);
      break;
    default:
      break;
  }
  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const displayedOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tabs = [
    { id: "All Orders", label: `All Orders (${allOrders.length})` },
    {
      id: "Completed",
      label: `Completed (${allOrders.filter((o: Order) => o.status === "delivered").length})`,
    },
    {
      id: "Pending",
      label: `Pending (${allOrders.filter((o: Order) => o.status === "pending").length})`,
    },
    {
      id: "Canceled",
      label: `Canceled (${allOrders.filter((o: Order) => o.status === "canceled").length})`,
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Export to CSV
  const handleExportCSV = () => {
    const csvData = filteredOrders.map((order: Order) => ({
      "Order ID": order.orderId,
      "Ordered By": order.orderedBy,
      Product: order.product,
      "Created At": order.createdAt,
      Price: order.price,
      "Payment Status": order.paymentStatus,
      Status: order.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders.csv");
  };

  // Export to Excel
  const handleExportExcel = () => {
    const excelData = filteredOrders.map((order: Order) => ({
      "Order ID": order.orderId,
      "Ordered By": order.orderedBy,
      Product: order.product,
      "Created At": order.createdAt,
      Price: order.price,
      "Payment Status": order.paymentStatus,
      Status: order.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
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
        <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
          <VendorHeader title="Order Management" onSearch={handleSearch} showSearch={true} />
          <main
            className="dashboard__main"
            style={{ paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px" }}
          >
            <div className="vendor-order__tabs">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="skeleton" style={{ width: "100px", height: "24px", margin: "0 8px" }}></div>
              ))}
            </div>
            <div className="vendor-order__sorting">
              <div className="skeleton" style={{ width: "80px", height: "16px" }}></div>
              <div className="skeleton" style={{ width: "120px", height: "24px" }}></div>
            </div>
            <div className="vendor-order__export-buttons">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="skeleton" style={{ width: "100px", height: "24px", margin: "0 8px" }}></div>
              ))}
            </div>
            <div className="vendor-order__order-list-skeleton">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="skeleton" style={{ width: "100%", height: "60px", marginBottom: "8px" }}></div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) return <div className="vendor-order__error">{error.message}</div>;
  if (errorMessage) return <div className="vendor-order__error">{errorMessage}</div>;

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
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
          min-width: 600px;
        }
      `}</style>
      
      <div className="vendor-dash-container">
        <Sidebar />
        <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
          <VendorHeader title="Order Management" onSearch={handleSearch} showSearch={false} />
          <main
            className="dashboard__main"
            style={{ paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px" }}
          >
            <div className="vendor-order__tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`vendor-order__tab ${activeTab === tab.id ? "vendor-order__tab--active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
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
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highestPrice">Highest Price</option>
                <option value="lowestPrice">Lowest Price</option>
              </select>
            </div>
            <div className="vendor-order__export-buttons">
              <button onClick={handleExportCSV}>Export to CSV</button>
              <button onClick={handleExportExcel}>Export to Excel</button>
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
                No orders found. {searchQuery && "Try a different search query."}
              </div>
            )}
          </main>
        </div>
        <ViewModal
          show={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          order={selectedOrder}
          orderDetail={selectedOrderDetail}
        />
      </div>
    </div>
  );
};

export default VendorOrder;