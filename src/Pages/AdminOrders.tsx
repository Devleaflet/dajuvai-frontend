import React, { useState, useEffect } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import Pagination from "../Components/Pagination";
import OrderEditModal from "../Components/Modal/OrderEditModal";
import DeleteModal from "../Components/Modal/DeleteModal";
import OrderDetailModal from '../Components/Modal/OrderDetailModal';
import AdminOrdersSkeleton from '../skeleton/AdminOrdersSkeleton';
import "../Styles/AdminOrders.css";
import { OrderService } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<DisplayOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (authLoading) {
        return;
      }

      if (!isAuthenticated || !token) {
        setError('Please log in to view orders');
        setIsLoading(false);
        navigate('/login');
        return;
      }

      try {
        setIsLoading(true);
        const response = await OrderService.getAllOrders(token);
        const apiOrders = response;
        setRawOrders(apiOrders);
        const transformedOrders: DisplayOrder[] = apiOrders.map((order: any) => ({
          id: order.id.toString(),
          customer: order.orderedBy?.username || 'Unknown',
          email: order.orderedBy?.email || 'N/A',
          orderDate: new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          totalPrice: `Rs. ${parseFloat(order.totalPrice).toFixed(2)}`,
          status: order.status || 'N/A',
          paymentStatus: order.paymentStatus || 'N/A',
        }));
        setOrders(transformedOrders);
        setFilteredOrders(transformedOrders);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
        setError(errorMessage);
        toast.error(errorMessage);
        if (errorMessage.includes('Unauthorized') || errorMessage.includes('No authentication token')) {
          logout();
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [authLoading, isAuthenticated, token, logout, navigate]);

  useEffect(() => {
    const results = orders.filter(order => 
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.paymentStatus.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOrders(results);
  }, [searchQuery, orders]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const toModalOrder = (displayOrder: DisplayOrder): ModalOrder => {
    const rawOrder = rawOrders.find(o => o.id.toString() === displayOrder.id) || {};
    const orderedBy = rawOrder.orderedBy || {};
    const shippingAddress = rawOrder.shippingAddress || {};
    
    const username = orderedBy.username || displayOrder.customer || 'Unknown User';
    const nameParts = username.split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

    return {
      id: displayOrder.id,
      firstName: firstName,
      lastName: lastName,
      date: displayOrder.orderDate,
      quantity: rawOrder.orderItems?.reduce((total: number, item: any) => total + item.quantity, 0) || 1,
      address: shippingAddress.address || shippingAddress.localAddress || 'N/A',
      phoneNumber: orderedBy.phoneNumber || 'N/A',
      email: displayOrder.email,
      country: shippingAddress.country || 'N/A',
      streetAddress: shippingAddress.streetAddress || shippingAddress.localAddress || 'N/A',
      town: shippingAddress.town || shippingAddress.city || 'N/A',
      state: shippingAddress.state || shippingAddress.province || 'N/A',
      vendorName: rawOrder.vendorName || 'N/A',
      profileImage: undefined,
    };
  };

  const viewOrderDetails = (order: DisplayOrder) => {
    setSelectedOrder(toModalOrder(order));
    setShowOrderDetails(true);
  };

  const confirmDeleteOrder = (order: DisplayOrder) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const handleDeleteOrder = async () => {
    if (orderToDelete && token) {
      try {
        // Uncomment when OrderService.deleteOrder is implemented
        // await OrderService.deleteOrder(orderToDelete.id, token);
        const updatedOrders = orders.filter(order => order.id !== orderToDelete.id);
        setOrders(updatedOrders);
        setFilteredOrders(updatedOrders);
        setRawOrders(rawOrders.filter(o => o.id.toString() !== orderToDelete.id));
        toast.success('Order has been successfully deleted.');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete order';
        toast.error(errorMessage);
      } finally {
        setOrderToDelete(null);
        setShowDeleteModal(false);
      }
    }
  };

  const editOrder = (order: DisplayOrder) => {
    setSelectedOrder(toModalOrder(order));
    setShowEditModal(true);
  };

  const handleSaveOrder = async (orderId: string, newStatus: string) => {
    try {
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      setFilteredOrders(updatedOrders);
      setRawOrders(rawOrders.map(o =>
        o.id.toString() === orderId
          ? { ...o, status: newStatus }
          : o
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      toast.error(errorMessage);
    } finally {
      setShowEditModal(false);
    }
  };

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  if (authLoading || isLoading) {
    return <AdminOrdersSkeleton />;
  }

  if (error) {
    return (
      <div className="admin-orders">
        <div className="error-message">
          {error}
          {error.includes('log in') && (
            <button onClick={() => navigate('/login')} className="login-button">
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
        <Header onSearch={handleSearch} showSearch={true} title="Order Management" />
        
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
                  {currentOrders.map(order => (
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
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5C7.63636 5 4 8.63636 4 12C4 15.3636 7.63636 19 12 19C16.3636 19 20 15.3636 20 12C20 8.63636 16.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button 
                          className="admin-orders__action-btn admin-orders__delete-btn"
                          onClick={() => confirmDeleteOrder(order)}
                          aria-label="Delete order"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 6V4C8 2.96957 8.21071 2.46086 8.58579 2.08579C8.96086 1.71071 9.46957 1.5 10 1.5H14C14.5304 1.5 15.0391 1.71071 15.4142 2.08579C15.7893 2.46086 16 2.96957 16 3.5V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button 
                          className="admin-orders__action-btn admin-orders__edit-btn"
                          onClick={() => editOrder(order)}
                          aria-label="Edit order"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-orders__pagination-container">
              <div className="admin-orders__pagination-info">
                Showing {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} out of {filteredOrders.length}
              </div>
              <Pagination 
                currentPage={currentPage}
                totalPages={Math.ceil(filteredOrders.length / ordersPerPage)}
                onPageChange={paginate}
              />
            </div>
          </div>
        ) : (
          null
        )}
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

      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteOrder}
        productName={orderToDelete?.id || "Order"}
      />
    </div>
  );
};

export default AdminOrders;