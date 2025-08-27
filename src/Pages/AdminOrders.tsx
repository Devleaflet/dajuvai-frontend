import React, { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import Pagination from "../Components/Pagination";
import OrderEditModal from "../Components/Modal/OrderEditModal";
import OrderDetailModal from "../Components/Modal/OrderDetailModal";
import AdminOrdersSkeleton from "../skeleton/AdminOrdersSkeleton";
import "../Styles/AdminOrders.css";
import { OrderService } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

interface DisplayOrder {
  id: string;
  customer: string;
  email: string;
  orderDate: string;
  totalPrice: string;
  status: string;
  paymentStatus: string;
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
}

const AdminOrders: React.FC = () => {
  const { logout, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<DisplayOrder[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ModalOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sortOption, setSortOption] = useState<string>("newest");

  useEffect(() => {
    const fetchOrders = async () => {
      if (authLoading) return;

      if (!isAuthenticated || !token) {
        setError("Please log in to view orders");
        setIsLoading(false);
        navigate("/login");
        return;
      }

      try {
        setIsLoading(true);
        const response = await OrderService.getAllOrders(token);
        setRawOrders(response);

        const transformedOrders: DisplayOrder[] = response.map((order: any) => ({
          id: order.id.toString(),
          customer: order.orderedBy?.username || "Unknown",
          email: order.orderedBy?.email || "N/A",
          orderDate: new Date(order.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          totalPrice: `Rs. ${parseFloat(order.totalPrice).toFixed(2)}`,
          status: order.status || "N/A",
          paymentStatus: order.paymentStatus || "N/A",
        }));

        setOrders(transformedOrders);
        setFilteredOrders(transformedOrders);
      } catch (err) {
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
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [authLoading, isAuthenticated, token, logout, navigate]);

  useEffect(() => {
    let results = orders.filter(
      (order) =>
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.paymentStatus.toLowerCase().includes(searchQuery.toLowerCase())
    );

    results = [...results].sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return (
            new Date(b.orderDate).getTime() -
            new Date(a.orderDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.orderDate).getTime() -
            new Date(b.orderDate).getTime()
          );
        case "price-asc":
          return (
            parseFloat(a.totalPrice.replace("Rs. ", "")) -
            parseFloat(b.totalPrice.replace("Rs. ", ""))
          );
        case "price-desc":
          return (
            parseFloat(b.totalPrice.replace("Rs. ", "")) -
            parseFloat(a.totalPrice.replace("Rs. ", ""))
          );
        case "name-asc":
          return a.customer.localeCompare(b.customer);
        case "name-desc":
          return b.customer.localeCompare(a.customer);
        default:
          return 0;
      }
    });

    setFilteredOrders(results);
    setCurrentPage(1);
  }, [searchQuery, orders, sortOption]);

  const handleSearch = (query: string) => setSearchQuery(query);

  const handleSort = useCallback((newSortOption: string) => {
    setSortOption(newSortOption);
  }, []);

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const toModalOrder = (displayOrder: DisplayOrder): ModalOrder => {
    const rawOrder =
      rawOrders.find((o) => o.id.toString() === displayOrder.id) || {};
    const orderedBy = rawOrder.orderedBy || {};
    const shippingAddress = rawOrder.shippingAddress || {};

    const username =
      orderedBy.username || displayOrder.customer || "Unknown User";
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
      vendorName: rawOrder.vendorName || "N/A",
      profileImage: undefined,
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
      setFilteredOrders(updatedOrders);
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

  if (authLoading || isLoading) return <AdminOrdersSkeleton />;

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
          onSort={handleSort}
          sortOption={sortOption}
          showSearch={true}
          title="Order Management"
        />

        {!showOrderDetails ? (
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
                    <th>Status</th>
                    <th>Payment Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((order) => (
                    <tr key={order.id} className="admin-orders__table-row">
                      <td>{order.id}</td>
                      <td className="admin-orders__name-cell">
                        {order.customer}
                      </td>
                      <td>{order.email}</td>
                      <td>{order.orderDate}</td>
                      <td>{order.totalPrice}</td>
                      <td>{order.status}</td>
                      <td>{order.paymentStatus}</td>
                      <td className="admin-orders__actions">
                        <button
                          className="admin-orders__action-btn admin-orders__view-btn"
                          onClick={() => viewOrderDetails(order)}
                          aria-label="View order details"
                        >
                          👁
                        </button>
                        <button
                          className="admin-orders__action-btn admin-orders__edit-btn"
                          onClick={() => editOrder(order)}
                          aria-label="Edit order"
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-orders__pagination-container">
              <div className="admin-orders__pagination-info">
                Showing {indexOfFirstOrder + 1}-
                {Math.min(indexOfLastOrder, filteredOrders.length)} out of{" "}
                {filteredOrders.length}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredOrders.length / ordersPerPage)}
                onPageChange={paginate}
              />
            </div>
          </div>
        ) : null}
      </div>

      <OrderDetailModal
        show={showOrderDetails}
        onClose={closeOrderDetails}
        order={selectedOrder}
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
