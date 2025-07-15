
import React, { useState, useEffect } from 'react';
import { OrderService, DetailedOrder } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../../Styles/OrderModals.css';
import { API_BASE_URL } from "../../config";

interface Order {
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

interface OrderEditModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (orderId: string, newStatus: string) => void;
  order: Order | null;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({
  show,
  onClose,
  onSave,
  order
}) => {
  const { token } = useAuth();
  const [detailedOrder, setDetailedOrder] = useState<DetailedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Order status options - only CANCELLED and DELIVERED for CONFIRMED orders
  const getAvailableStatusOptions = (currentStatus: string) => {
    if (currentStatus === 'CONFIRMED') {
      return ['CANCELLED', 'DELIVERED'];
    }
    return []; // No options available for non-CONFIRMED orders
  };

  // Check if the order can be edited (only CONFIRMED orders can be edited)
  const canEditOrder = (currentStatus: string) => {
    return currentStatus === 'CONFIRMED';
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!show || !order || !token) return;

      setIsLoading(true);
      setError(null);

      try {
        const orderDetails = await OrderService.getOrderById(order.id, token);
        console.log('Order details:', orderDetails);
        setDetailedOrder(orderDetails);
        setOrderStatus(orderDetails.status || 'CONFIRMED');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order details';
        setError(errorMessage);
        toast.error(`Failed to load order details: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [show, order, token]);

  if (!show || !order) return null;

  const formatAddress = (shippingAddress: any) => {
    if (!shippingAddress) return 'N/A';
    
    const parts = [
      shippingAddress.localAddress,
      shippingAddress.city,
      shippingAddress.district,
      shippingAddress.province
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  // Safe function to get initials
  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName || '';
    const last = lastName || '';
    return `${first.charAt(0) || ''}${last.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(newStatus)
      const response = await fetch(`${API_BASE_URL}/api/order/admin/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!detailedOrder || orderStatus === detailedOrder.status) {
      toast.info('No changes to save');
      onClose();
      return;
    }

    // Additional check to ensure we're only updating CONFIRMED orders
    if (detailedOrder.status !== 'CONFIRMED') {
      toast.error('Only confirmed orders can be updated');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Call the API to update order status
      const updatedOrder = await updateOrderStatus(order.id, orderStatus);
      
      // Update the detailed order state with the response
      setDetailedOrder(prev => prev ? { ...prev, status: updatedOrder.status } : null);
      
      // Call the parent component's onSave function
      await onSave(order.id, orderStatus);
      
      // Show success toast
      toast.success(`Order status updated to ${orderStatus.toLowerCase()} successfully!`);
      
      // Close the modal
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      setError(errorMessage);
      toast.error(`Failed to update order status: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const currentStatus = detailedOrder?.status || 'CONFIRMED';
  const isEditable = canEditOrder(currentStatus);
  const availableStatusOptions = getAvailableStatusOptions(currentStatus);

  return (
    <div className="modal-overlay">
      <div className="order-modal order-edit-modal">
        <div className="order-modal__header">
          <h2 className="order-modal__title">
            {isEditable ? 'Edit Order Status' : 'View Order Details'}
          </h2>
          <button 
            className="order-modal__close-btn"
            onClick={onClose}
            aria-label="Close"
            disabled={isSaving}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className="order-modal__content">
          {isLoading ? (
            <div className="order-modal__loading">
              <div className="skeleton skeleton-text" style={{ width: '100%', height: '20px', marginBottom: '10px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '80%', height: '20px', marginBottom: '10px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '90%', height: '20px', marginBottom: '10px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '70%', height: '20px', marginBottom: '10px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '85%', height: '20px' }}></div>
            </div>
          ) : error ? (
            <div className="order-modal__error">
              <p>Error: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="order-modal__button order-modal__button--primary"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {!isEditable && (
                <div className="order-modal__info-banner" style={{ 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #dee2e6', 
                  borderRadius: '4px', 
                  padding: '12px', 
                  marginBottom: '20px',
                  color: '#6c757d',
                  fontSize: '14px'
                }}>
                  This order cannot be edited because its status is "{currentStatus}". Only confirmed orders can be updated.
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="order-modal__customer-info">
                  <div className="order-modal__profile">
                    {order.profileImage ? (
                      <img src={order.profileImage} alt={`${order.firstName || ''} ${order.lastName || ''}`} />
                    ) : (
                      <div className="order-modal__profile-placeholder">
                        {getInitials(order.firstName, order.lastName)}
                      </div>
                    )}
                  </div>
                  <div className="order-modal__customer-name">
                    <h3>{detailedOrder?.orderedBy?.username || `${order.firstName || 'Unknown'} ${order.lastName || 'User'}`}</h3>
                    <p className="order-modal__order-id">Order ID: {order.id}</p>
                  </div>
                </div>
                
                <div className="order-modal__details-grid">
                  <div className="order-modal__detail-item">
                    <span className="order-modal__label">Date</span>
                    <span className="order-modal__value">{order.date}</span>
                  </div>
                  
                  <div className="order-modal__detail-item">
                    <span className="order-modal__label">Quantity</span>
                    <span className="order-modal__value">
                      {detailedOrder?.orderItems?.reduce((total, item) => total + item.quantity, 0) || order.quantity || 0}
                    </span>
                  </div>
                  
                  <div className="order-modal__detail-item">
                    <span className="order-modal__label">Email</span>
                    <span className="order-modal__value">
                      {detailedOrder?.orderedBy?.email || order.email || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="order-modal__detail-item">
                    <span className="order-modal__label">Phone Number</span>
                    <span className="order-modal__value">
                      {/* {detailedOrder?.phoneNumber || 'N/A'} */}
                    </span>
                  </div>
                  
                  <div className="order-modal__detail-item">
                    <span className="order-modal__label">Total Price</span>
                    <span className="order-modal__value">
                      Rs. {detailedOrder?.totalPrice ? Number(detailedOrder.totalPrice).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="order-modal__detail-item">
                    <span className="order-modal__label">Shipping Fee</span>
                    <span className="order-modal__value">
                      Rs. {detailedOrder?.shippingFee ? Number(detailedOrder.shippingFee).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="order-modal__detail-item">
                    <span className="order-modal__label">Order Status{isEditable && <span className="order-modal__required">*</span>}</span>
                    {isEditable ? (
                      <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                        className="order-modal__input order-modal__select"
                        disabled={isSaving}
                      >
                        <option value="">Select new status</option>
                        {availableStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="order-modal__value">
                        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="order-modal__detail-item">
                    <span className="order-modal__label">Payment Status</span>
                    <span className="order-modal__value">
                      {detailedOrder?.paymentStatus || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="order-modal__detail-item">
                    <span className="order-modal__label">Payment Method</span>
                    <span className="order-modal__value">
                      {detailedOrder?.paymentMethod || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="order-modal__detail-item order-modal__detail-item--full">
                    <span className="order-modal__label">Address</span>
                    <span className="order-modal__value">
                      {detailedOrder ? formatAddress(detailedOrder.shippingAddress) : `${order.streetAddress || ''}, ${order.town || ''}, ${order.state || ''}, ${order.country || ''}`.replace(/^,\s*|,\s*$/g, '') || 'N/A'}
                    </span>
                  </div>

                  {detailedOrder?.orderItems && detailedOrder.orderItems.length > 0 && (
                    <div className="order-modal__detail-item order-modal__detail-item--full">
                      <span className="order-modal__label">Order Items</span>
                      <div className="order-modal__order-items">
                        {detailedOrder.orderItems.map((item, index) => (
                          <div key={item.productId || index} className="order-modal__order-item">
                            <span>Product ID: {item.productId}</span>
                            <span>Quantity: {item.quantity}</span>
                            <span>Unit Price: Rs. {Number(item.price).toFixed(2)}</span>
                            <span>Sub Total: Rs. {(Number(item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="order-modal__footer">
                  <button 
                    type="button"
                    className="order-modal__button order-modal__button--secondary"
                    onClick={onClose}
                    disabled={isSaving}
                  >
                    {isEditable ? 'Cancel' : 'Close'}
                  </button>
                  {isEditable && (
                    <button 
                      type="submit"
                      className="order-modal__button order-modal__button--primary"
                      disabled={isSaving || !orderStatus || orderStatus === detailedOrder?.status}
                    >
                      {isSaving ? 'Updating...' : 'Update Status'}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;