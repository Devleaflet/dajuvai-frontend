import React, { useState, useEffect } from 'react';
import { OrderService, DetailedOrder } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import '../../Styles/OrderModals.css';

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

interface OrderDetailModalProps {
  show: boolean;
  onClose: () => void;
  order: Order | null;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  show,
  onClose,
  order
}) => {
  const { token } = useAuth();
  const [detailedOrder, setDetailedOrder] = useState<DetailedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!show || !order || !token) return;

      setIsLoading(true);
      setError(null);

      try {
        const orderDetails = await OrderService.getOrderById(order.id, token);
        setDetailedOrder(orderDetails);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order details';
        setError(errorMessage);
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

  return (
    <div className="modal-overlay">
      <div className="order-modal order-detail-modal" style={{ maxWidth: '600px', margin: '0 auto', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div className="order-modal__header" style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 className="order-modal__title" style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: '#222' }}>Order Details</h2>
          <button 
            className="order-modal__close-btn"
            onClick={onClose}
            aria-label="Close"
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
            </div>
          ) : (
            <>
              <div className="order-modal__customer-info" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div className="order-modal__profile" style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  {order.profileImage ? (
                    <img src={order.profileImage} alt={`${order.firstName || ''} ${order.lastName || ''}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="order-modal__profile-placeholder" style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#666' }}>
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
                  <span className="order-modal__label" style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Status</span>
                  <span className="order-modal__value" style={{ fontSize: '14px', color: '#222', fontWeight: 500 }}>
                    {detailedOrder?.status || 'N/A'}
                  </span>
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
                    {detailedOrder ? formatAddress(detailedOrder.shippingAddress) : `${order.streetAddress || ''}, ${order.town || ''}, ${order.state || ''}, ${order.country || ''}`.replace(/^,\姚s*|,\s*$/g, '') || 'N/A'}
                  </span>
                </div>
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
            </>
          )}
        </div>
        
        <div className="order-modal__footer" style={{ padding: '15px 20px', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
          <button 
            className="order-modal__button order-modal__button--secondary"
            onClick={onClose}
            style={{ padding: '8px 16px', background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;