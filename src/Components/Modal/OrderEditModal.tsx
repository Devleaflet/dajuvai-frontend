import React, { useState, useEffect } from 'react';
import { OrderService, DetailedOrder } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
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

  const getAvailableStatusOptions = (currentStatus: string) => {
    if (currentStatus === 'CONFIRMED') {
      return ['CANCELLED', 'DELIVERED'];
    }
    return [];
  };

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
      shippingAddress.streetAddress,
      shippingAddress.city,
      shippingAddress.district,
      shippingAddress.province
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName || '';
    const last = lastName || '';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'U';
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
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

    if (detailedOrder.status !== 'CONFIRMED') {
      toast.error('Only confirmed orders can be updated');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedOrder = await updateOrderStatus(order.id, orderStatus);
      setDetailedOrder(prev => prev ? { ...prev, status: updatedOrder.status } : null);
      await onSave(order.id, orderStatus);
      toast.success(`Order status updated to ${orderStatus.toLowerCase()} successfully!`);
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
      <div className="order-modal order-edit-modal" style={{ maxWidth: '600px', margin: '0 auto', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div className="order-modal__header" style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 className="order-modal__title" style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: '#222' }}>
            {isEditable ? 'Edit Order Status' : 'View Order Details'}
          </h2>
          <button 
            className="order-modal__close-btn"
            onClick={onClose}
            aria-label="Close"
            disabled={isSaving}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className="order-modal__content" style={{ padding: '20px' }}>
          {isLoading ? (
            <div className="order-modal__loading">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="skeleton skeleton-text" style={{ width: `${70 + index * 10}%`, height: '20px', marginBottom: '10px', borderRadius: '4px' }}></div>
              ))}
            </div>
          ) : error ? (
            <div className="order-modal__error" style={{ color: '#d32f2f', textAlign: 'center', padding: '20px' }}>
              <p>Error: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="order-modal__button order-modal__button--primary"
                style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
              >
                Retry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {!isEditable && (
                <div className="order-modal__info-banner" style={{ 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #dee2e6', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  marginBottom: '20px',
                  color: '#6c757d',
                  fontSize: '14px'
                }}>
                  This order cannot be edited because its status is "{currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).toLowerCase()}". Only confirmed orders can be updated.
                </div>
              )}
              
              <div className="order-modal__customer-info" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div className="order-modal__profile" style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  {order.profileImage ? (
                    <img src={order.profileImage} alt={`${order.firstName || ''} ${order.lastName || ''}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="order-modal__profile-placeholder" style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#666' }}>
                      {getInitials(order.firstName, order.lastName)}
                    </div>
                  )}
                </div>
                <div className="order-modal__customer-name">
                  <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#222' }}>
                    {detailedOrder?.orderedBy?.name || `${order.firstName || 'Unknown'} ${order.lastName || 'User'}`}
                  </h3>
                  <p className="order-modal__order-id" style={{ fontSize: '14px', color: '#666', margin: '4px 0 0' }}>Order ID: {order.id}</p>
                </div>
              </div>
              
              <div className="order-modal__details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 20px', marginBottom: '20px' }}>
                <div className="order-modal__detail-item">
                  <span className="order-modal__label" style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Date</span>
                  <span className="order-modal__value" style={{ fontSize: '14px', color: '#222', fontWeight: 500 }}>{order.date || 'N/A'}</span>
                </div>
                
                <div className="order-modal__detail-item">
                  <span className="order-modal__label" style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Quantity</span>
                  <span className="order-modal__value" style={{ fontSize: '14px', color: '#222', fontWeight: 500 }}>
                    {detailedOrder?.orderItems?.reduce((total, item) => total + item.quantity, 0) || order.quantity || 0}
                  </span>
                </div>
                
                <div className="order-modal__detail-item">
                  <span className="order-modal__label" style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Email</span>
                  <span className="order-modal__value" style={{ fontSize: '14px', color: '#222', fontWeight: 500 }}>
                    {detailedOrder?.orderedBy?.email || order.email || 'N/A'}
                  </span>
                </div>
                
                <div className="order-modal__detail-item">
                  <span className="order-modal__label" style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Phone Number</span>
                  <span className="order-modal__value" style={{ fontSize: '14px', color: '#222', fontWeight: 500 }}>
                    {order.phoneNumber || detailedOrder?.phoneNumber || 'N/A'}
                  </span>
                </div>
                
                <div className="order-modal__detail-item">
                  <span className="order-modal__label" style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Total Price</span>
                  <span className="order-modal__value" style={{ fontSize: '14px', color: '#222', fontWeight: 500 }}>
                    Rs. {detailedOrder?.totalPrice ? Number(detailedOrder.totalPrice).toFixed(2) : 'N/A'}
                  </span>
                </div>
                
                <div className="order-modal__detail-item">
                  <span className="order-modal__label" style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Shipping Fee</span>
                  <span className="order-modal__value" style={{ fontSize: '14px', color: '#222', fontWeight: 500 }}>
                    Rs. {detailedOrder?.shippingFee ? Number(detailedOrder.shippingFee).toFixed(2) : 'N/A'}
                  </span>
                </div>
                
                <div className="order-modal__detail-item">
                  <span className="order-modal__label" style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    Order Status{isEditable && <span style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>}
                  </span>
                  {isEditable ? (
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      className="order-modal__input order-modal__select"
                      disabled={isSaving}
                      style={{ width: '100%', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', color: '#222' }}
                    >
                      <option value="">Select new status</option>
                      {availableStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="order-modal__value" style={{ fontSize: '14px', color: '#222', fontWeight: 500 }}>
                      {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>
                
                <div className="order-modal__detail-item">
                  <span className="order-modal__label" style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Payment Status</span>
                  <span className="order-modal__value" style={{ fontSize: '14px', color: '#222', fontWeight: 500 }}>
                    {detailedOrder?.paymentStatus || 'N/A'}
                  </span>
                </div>
                
                <div className="order-modal__detail-item">
                  <span className="order-modal__label" style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Payment Method</span>
                  <span className="order-modal__value" style={{ fontSize: '14px', color: '#222', fontWeight: 500 }}>
                    {detailedOrder?.paymentMethod || 'N/A'}
                  </span>
                </div>
                
                <div className="order-modal__detail-item order-modal__detail-item--full" style={{ gridColumn: '1 / -1' }}>
                  <span className="order-modal__label" style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Address</span>
                  <span className="order-modal__value" style={{ fontSize: '14px', color: '#222', fontWeight: 500 }}>
                    {detailedOrder ? formatAddress(detailedOrder.shippingAddress) : `${order.streetAddress || ''}, ${order.town || ''}, ${order.state || ''}, ${order.country || ''}`.replace(/^,\s*|,\s*$/g, '') || 'N/A'}
                  </span>
                </div>

                {detailedOrder?.orderItems && detailedOrder.orderItems.length > 0 && (
                  <div className="order-modal__detail-item order-modal__detail-item--full" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                    <span className="order-modal__label" style={{ fontSize: '16px', fontWeight: 600, color: '#222', display: 'block', marginBottom: '12px' }}>Order Items</span>
                    <div className="order-modal__order-items">
                      {detailedOrder.orderItems.map((item, index) => (
                        <div
                          key={item.productId || index}
                          className="order-modal__order-item"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '12px 16px',
                            marginBottom: '12px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            background: '#fafafa',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          {item.product?.productImages && item.product.productImages.length > 0 ? (
                            <img
                              src={item.product.productImages[0]}
                              alt={item.product.name || 'Product'}
                              style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }}
                            />
                          ) : (
                            <div style={{ width: '60px', height: '60px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid #eee', color: '#999', fontSize: '20px', fontWeight: 500 }}>
                              {item.product?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#222', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.product?.name || 'Unknown Product'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                              Product ID: <span style={{ color: '#333', fontWeight: 500 }}>{item.productId}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#555' }}>
                              <div>Qty: <span style={{ color: '#222', fontWeight: 500 }}>{item.quantity}</span></div>
                              <div>Unit: <span style={{ color: '#222', fontWeight: 500 }}>Rs. {Number(item.price).toFixed(2)}</span></div>
                              <div>Subtotal: <span style={{ color: '#222', fontWeight: 500 }}>Rs. {(Number(item.price) * item.quantity).toFixed(2)}</span></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="order-modal__footer" style={{ padding: '15px 20px', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
                <button 
                  type="button"
                  className="order-modal__button order-modal__button--secondary"
                  onClick={onClose}
                  disabled={isSaving}
                  style={{ padding: '8px 16px', background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', marginRight: '10px' }}
                >
                  {isEditable ? 'Cancel' : 'Close'}
                </button>
                {isEditable && (
                  <button 
                    type="submit"
                    className="order-modal__button order-modal__button--primary"
                    disabled={isSaving || !orderStatus || orderStatus === detailedOrder?.status}
                    style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: isSaving || !orderStatus || orderStatus === detailedOrder?.status ? 'not-allowed' : 'pointer', fontSize: '14px' }}
                  >
                    {isSaving ? 'Updating...' : 'Update Status'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;