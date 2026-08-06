import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import Pagination from "../Components/Pagination";
import OrderEditModal from "../Components/Modal/OrderEditModal";
import OrderDetailModal from "../Components/Modal/OrderDetailModal";
import AdminOrdersSkeleton from "../skeleton/AdminOrdersSkeleton";
import "../Styles/AdminOrders.css";
import "../Styles/OrderModals.css";
import { OrderService } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import { usePermission } from "../hooks/usePermission";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ORDER_STATUS_OPTIONS as ALL_ORDER_STATUSES } from "../Components/orderStatus";

const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  ...ALL_ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

const ORDER_STATUS_META = Object.fromEntries(
  ALL_ORDER_STATUSES.map((s) => [s.value, s]),
);

interface DisplayOrder {
  id: string;
  orderNumber?: string;
  customer: string;
  email: string;
  orderDate: string;
  totalPrice: string;
  status: string;
  paymentStatus: string;
  appliedPromoCode?: string | null;
  promoApplyOn?: "LINE_TOTAL" | "SHIPPING" | null;
}

interface ModalOrder {
  id: string;
  firstName: string;
  lastName: string;
  date: string;
  quantity: number;
  address: string;
  phoneNumber: string;
  email: string;
  country: string;
  streetAddress: string;
  town: string;
  state: string;
  vendorName: string;
  profileImage?: string;
  appliedPromoCode?: string | null;
  promoApplyOn?: "LINE_TOTAL" | "SHIPPING" | null;
}

const AdminOrders: React.FC = () => {
  const { logout, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { can } = usePermission();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ModalOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [sortOption, setSortOption] = useState<string>("newest");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>("all");
  const orderRequestRef = useRef<AbortController | null>(null);

  const orderIdFromParams = searchParams.get('orderId');

  // Debounce search input — reset to page 1 only once the debounced value changes.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Backend-supported sort keys only; the shared Header component still
  // offers name-asc/name-desc (client-only concept — no server-side
  // customer-name sort), which falls back to newest.
  const backendSort = (option: string) => {
    switch (option) {
      case "oldest": return "oldest";
      case "price-asc": return "lowest_total";
      case "price-desc": return "highest_total";
      default: return "newest";
    }
  };

  const dateRangeToDates = (range: string): { startDate?: string; endDate?: string } => {
    if (range === "all") return {};
    const now = new Date();
    const start = new Date();
    if (range === "today") start.setHours(0, 0, 0, 0);
    else if (range === "week") start.setDate(now.getDate() - 7);
    else if (range === "month") start.setMonth(now.getMonth() - 1);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  };

  const priceRangeToBounds = (range: string): { minPrice?: number; maxPrice?: number } => {
    switch (range) {
      case "0-1000": return { minPrice: 0, maxPrice: 1000 };
      case "1000-5000": return { minPrice: 1000, maxPrice: 5000 };
      case "5000-10000": return { minPrice: 5000, maxPrice: 10000 };
      case "10000+": return { minPrice: 10000 };
      default: return {};
    }
  };

  const getOrderVendorNames = (order: any): string[] =>
    Array.isArray(order.orderItems)
      ? Array.from(
          new Set<string>(
            order.orderItems
              .map((item: any) => item?.vendor?.businessName)
              .filter(
                (name: unknown): name is string =>
                  typeof name === "string" && name.length > 0,
              ),
          ),
        )
      : [];

  const getOrderSearchText = (order: any): string =>
    [
      order.id,
      order.orderNumber,
      order.transactionId,
      order.mTransactionId,
      order.status,
      order.paymentStatus,
      order.paymentMethod,
      order.orderedBy?.name,
      order.orderedBy?.fullName,
      order.orderedBy?.username,
      order.orderedBy?.email,
      order.orderedBy?.phoneNumber,
      ...getOrderVendorNames(order),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const applyLegacyOrderFallback = (items: any[]) => {
    const search = searchQuery.trim().toLowerCase();
    const { startDate, endDate } = dateRangeToDates(dateRangeFilter);
    const { minPrice, maxPrice } = priceRangeToBounds(priceRangeFilter);

    const filtered = items.filter((order) => {
      const orderDate = new Date(order.createdAt).getTime();
      const totalPrice = Number(order.totalPrice || 0);

      return (
        (!search || getOrderSearchText(order).includes(search)) &&
        (statusFilter === "all" || order.status === statusFilter) &&
        (paymentStatusFilter === "all" ||
          order.paymentStatus === paymentStatusFilter) &&
        (!startDate || orderDate >= new Date(startDate).getTime()) &&
        (!endDate || orderDate <= new Date(endDate).getTime()) &&
        (minPrice == null || totalPrice >= minPrice) &&
        (maxPrice == null || totalPrice <= maxPrice)
      );
    });

    filtered.sort((a, b) => {
      switch (backendSort(sortOption)) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "lowest_total":
          return Number(a.totalPrice || 0) - Number(b.totalPrice || 0);
        case "highest_total":
          return Number(b.totalPrice || 0) - Number(a.totalPrice || 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    const fallbackTotalPages = Math.max(1, Math.ceil(filtered.length / ordersPerPage));
    const fallbackPage = Math.min(currentPage, fallbackTotalPages);
    const pageStart = (fallbackPage - 1) * ordersPerPage;

    return {
      pageItems: filtered.slice(pageStart, pageStart + ordersPerPage),
      totalItems: filtered.length,
      totalPages: fallbackTotalPages,
      page: fallbackPage,
    };
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (authLoading) return;

      if (!isAuthenticated || !token) {
        setError("Please log in to view orders");
        setIsLoading(false);
        navigate("/login");
        return;
      }

      const controller = new AbortController();
      orderRequestRef.current?.abort();
      orderRequestRef.current = controller;

      try {
        setIsLoading(true);
        setError(null);
        const { startDate, endDate } = dateRangeToDates(dateRangeFilter);
        const { minPrice, maxPrice } = priceRangeToBounds(priceRangeFilter);

        const { orders: response, pagination, isPaginated } = await OrderService.getAllOrders(
          token,
          {
            page: currentPage,
            limit: ordersPerPage,
            search: searchQuery || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            paymentStatus: paymentStatusFilter !== "all" ? paymentStatusFilter : undefined,
            startDate,
            endDate,
            minPrice,
            maxPrice,
            sort: backendSort(sortOption) as any,
          },
          controller.signal,
        );

        if (controller.signal.aborted) return;

        const legacyFallback =
          !isPaginated || response.length > ordersPerPage
            ? applyLegacyOrderFallback(response)
            : null;
        const pageOrders = legacyFallback?.pageItems ?? response;

        setRawOrders(pageOrders);
        setTotalItems(legacyFallback?.totalItems ?? pagination.totalItems);
        setTotalPages(legacyFallback?.totalPages ?? pagination.totalPages);
        // A filter/search change can leave currentPage past the new last
        // page (e.g. after narrowing results) — snap back instead of
        // showing an empty page.
        if (legacyFallback && currentPage !== legacyFallback.page) {
          setCurrentPage(legacyFallback.page);
        } else if (pagination.totalPages > 0 && currentPage > pagination.totalPages) {
          setCurrentPage(pagination.totalPages);
        }

        const transformedOrders: DisplayOrder[] = pageOrders.map((order: any) => ({
          id: order.id.toString(),
          orderNumber: order.orderNumber,
          customer: order.orderedBy?.name || order.orderedBy?.fullName || order.orderedBy?.username || "Unknown",
          email: order.orderedBy?.email || "N/A",
          orderDate: new Date(order.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          totalPrice: `Rs. ${parseFloat(order.totalPrice).toFixed(2)}`,
          status: order.status || "N/A",
          paymentStatus: order.paymentStatus || "N/A",
          appliedPromoCode: order.appliedPromoCode || null,
          promoApplyOn: order.promoApplyOn || null,
        }));

        setOrders(transformedOrders);
      } catch (err) {
        if (err instanceof Error && err.name === "CanceledError") return;

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load orders";
        setError(errorMessage);
        toast.error(errorMessage);
        if (
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("No authentication token")
        ) {
          logout();
          navigate("/login");
        }
      } finally {
        if (orderRequestRef.current === controller) {
          setIsLoading(false);
          setHasLoadedOnce(true);
          orderRequestRef.current = null;
        }
      }
    };

    fetchOrders();

    return () => {
      const activeRequest = orderRequestRef.current;
      activeRequest?.abort();
      if (orderRequestRef.current === activeRequest) {
        orderRequestRef.current = null;
      }
    };
  }, [
    authLoading,
    isAuthenticated,
    token,
    logout,
    navigate,
    currentPage,
    ordersPerPage,
    searchQuery,
    statusFilter,
    paymentStatusFilter,
    dateRangeFilter,
    priceRangeFilter,
    sortOption,
  ]);

  useEffect(() => {
    if (orderIdFromParams && orders.length > 0) {
      const order = orders.find(o => o.id === orderIdFromParams);
      if (order) {
        viewOrderDetails(order);
      }
    }
  }, [orderIdFromParams, orders]);

  const handleSearch = (query: string) => setSearchInput(query);

  const handleSort = useCallback((newSortOption: string) => {
    setSortOption(newSortOption);
    setCurrentPage(1);
  }, []);

  // The server already returns exactly this page's rows.
  const currentOrders = orders.slice(0, ordersPerPage);
  const isSearchPending = searchInput.trim() !== searchQuery;
  const isSearching = isSearchPending || (isLoading && Boolean(searchQuery));
  const ordersRangeStart =
    totalItems === 0 ? 0 : (currentPage - 1) * ordersPerPage + 1;
  const ordersRangeEnd = Math.min(currentPage * ordersPerPage, totalItems);
  const searchResultsLabel = useMemo(() => {
    if (isSearchPending) return `Searching "${searchInput.trim()}"...`;
    if (searchQuery) {
      return `Showing ${ordersRangeStart}-${ordersRangeEnd} of ${totalItems} orders for "${searchQuery}"`;
    }
    return `Showing ${ordersRangeStart}-${ordersRangeEnd} of ${totalItems} orders`;
  }, [
    isSearchPending,
    searchInput,
    searchQuery,
    ordersRangeStart,
    ordersRangeEnd,
    totalItems,
  ]);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const resetFilters = () => {
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setDateRangeFilter("all");
    setPriceRangeFilter("all");
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const toModalOrder = (displayOrder: DisplayOrder): ModalOrder => {
    const rawOrder =
      rawOrders.find((o) => o.id.toString() === displayOrder.id) || {};
    const orderedBy = rawOrder.orderedBy || {};
    const shippingAddress = rawOrder.shippingAddress || {};
    const vendorNames =
      rawOrder.orderItems && Array.isArray(rawOrder.orderItems)
        ? [
            ...new Set(
              rawOrder.orderItems
                .map((item: any) => item?.vendor?.businessName)
                .filter(Boolean)
            ),
          ]
        : [];

    const username =
      orderedBy.name || orderedBy.fullName || orderedBy.username || displayOrder.customer || "Unknown User";
    const nameParts = username.split(" ");
    const firstName = nameParts[0] || "Unknown";
    const lastName =
      nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";

    return {
      id: displayOrder.id,
      firstName,
      lastName,
      date: displayOrder.orderDate,
      quantity:
        rawOrder.orderItems?.reduce(
          (total: number, item: any) => total + item.quantity,
          0
        ) || 1,
      address: shippingAddress.address || shippingAddress.localAddress || "N/A",
      phoneNumber: orderedBy.phoneNumber || "N/A",
      email: displayOrder.email,
      country: shippingAddress.country || "N/A",
      streetAddress:
        shippingAddress.streetAddress || shippingAddress.localAddress || "N/A",
      town: shippingAddress.town || shippingAddress.city || "N/A",
      state: shippingAddress.state || shippingAddress.province || "N/A",
      vendorName:
        vendorNames.length > 0
          ? vendorNames.join(", ")
          : rawOrder.vendorName || "N/A",
      profileImage: undefined,
      appliedPromoCode: rawOrder.appliedPromoCode || null,
      promoApplyOn: rawOrder.promoApplyOn || displayOrder.promoApplyOn || null,
    };
  };

  const viewOrderDetails = (order: DisplayOrder) => {
    setSelectedOrder(toModalOrder(order));
    setShowOrderDetails(true);
  };

  const editOrder = (order: DisplayOrder) => {
    setSelectedOrder(toModalOrder(order));
    setShowEditModal(true);
  };

  const handleSaveOrder = async (orderId: string, newStatus: string) => {
    try {
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      setRawOrders(
        rawOrders.map((o) =>
          o.id.toString() === orderId ? { ...o, status: newStatus } : o
        )
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update order status";
      toast.error(errorMessage);
    } finally {
      setShowEditModal(false);
    }
  };

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  if (authLoading || (isLoading && !hasLoadedOnce)) return <AdminOrdersSkeleton />;

  if (error) {
    return (
      <div className="admin-orders">
        <div className="error-message">
          {error}
          {error.includes("log in") && (
            <button
              onClick={() => navigate("/login")}
              className="login-button"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <AdminSidebar />
      <div className="admin-orders__content">
        <Header
          onSearch={handleSearch}
          searchValue={searchInput}
          searchPlaceholder="Search orders by ID, customer, vendor, payment..."
          isSearching={isSearching}
          searchResultsLabel={searchResultsLabel}
          onClearSearch={() => {
            setSearchInput("");
            setSearchQuery("");
            setCurrentPage(1);
          }}
          onSort={handleSort}
          sortOption={sortOption}
          showSearch={true}
          title="Order Management"
        />

        {/* Filter Section */}
        <div className="admin-orders__filters">
          <div className="admin-orders__filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="admin-orders__filter-select"
            >
              {ORDER_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-orders__filter-group">
            <label htmlFor="payment-filter">Payment:</label>
            <select
              id="payment-filter"
              value={paymentStatusFilter}
              onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
              className="admin-orders__filter-select"
            >
              <option value="all">All Payments</option>
               <option value="PAID">Paid</option>
               <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          <div className="admin-orders__filter-group">
            <label htmlFor="date-filter">Date Range:</label>
            <select
              id="date-filter"
              value={dateRangeFilter}
              onChange={(e) => { setDateRangeFilter(e.target.value); setCurrentPage(1); }}
              className="admin-orders__filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div className="admin-orders__filter-group">
            <label htmlFor="price-filter">Price Range:</label>
            <select
              id="price-filter"
              value={priceRangeFilter}
              onChange={(e) => { setPriceRangeFilter(e.target.value); setCurrentPage(1); }}
              className="admin-orders__filter-select"
            >
              <option value="all">All Prices</option>
              <option value="0-1000">Rs. 0 - 1,000</option>
              <option value="1000-5000">Rs. 1,000 - 5,000</option>
              <option value="5000-10000">Rs. 5,000 - 10,000</option>
              <option value="10000+">Rs. 10,000+</option>
            </select>
          </div>

          <button
            onClick={resetFilters}
            className="admin-orders__clear-filters"
          >
            Clear All Filters
          </button>
        </div>

        <div className="admin-orders__list-container">
            <div className="admin-orders__header">
              <h2>Order Management</h2>
            </div>
            <div className="admin-orders__table-container">
              <table className="admin-orders__table">
                <thead className="admin-orders__table-head">
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Order Date</th>
                    <th>Total Price</th>
                    <th>Promo Code</th>
                    <th>Status</th>
                    <th>Payment Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="admin-orders__table-state">
                          <span className="admin-orders__table-spinner" />
                          Loading orders...
                        </div>
                      </td>
                    </tr>
                  ) : currentOrders.length > 0 ? (
                    currentOrders.map((order) => {
                      const statusMeta = ORDER_STATUS_META[order.status];
                      const paymentKey = order.paymentStatus.toLowerCase();
                      return (
                    <tr key={order.id} className="admin-orders__table-row">
                      <td className="admin-orders__id-cell">{order.orderNumber || order.id}</td>
                      <td className="admin-orders__name-cell">
                        {order.customer}
                      </td>
                      <td className="admin-orders__email-cell">{order.email}</td>
                      <td>{order.orderDate}</td>
                      <td className="admin-orders__price-cell">{order.totalPrice}</td>
                      <td className="admin-orders__promo-cell">
                        {order.appliedPromoCode || "-"}
                        {order.appliedPromoCode &&
                          order.promoApplyOn === "SHIPPING" &&
                          " (shipping)"}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${statusMeta?.badgeClassName ?? ""}`}
                        >
                          {statusMeta?.label ?? order.status}
                        </span>
                      </td>
                      <td>
                        <span className={`payment-badge payment-badge--${paymentKey}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="admin-orders__actions">
                        <button
                          className="admin-orders__action-btn admin-orders__view-btn"
                          onClick={() => viewOrderDetails(order)}
                          aria-label="View order details"
                          title="View details"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </button>
                        {can("order", "create_edit") && (
                          <button
                            className="admin-orders__action-btn admin-orders__edit-btn"
                            onClick={() => editOrder(order)}
                            aria-label="Edit order"
                            title="Edit order"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9}>
                        <div className="admin-orders__table-state">
                          No orders found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-orders__pagination-container">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={paginate}
                pageSize={ordersPerPage}
                totalItems={totalItems}
                onPageSizeChange={(size) => {
                  setOrdersPerPage(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
      </div>

      <OrderDetailModal
        show={showOrderDetails}
        onClose={closeOrderDetails}
        order={selectedOrder}
        onStatusUpdate={handleSaveOrder}
      />

      <OrderEditModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveOrder}
        order={selectedOrder}
      />
    </div>
  );
};

export default AdminOrders;
