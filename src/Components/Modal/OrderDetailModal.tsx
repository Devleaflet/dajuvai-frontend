// import React, { useState, useEffect } from 'react';
// import { OrderService, DetailedOrder } from '../../services/orderService';
// import { useAuth } from '../../context/AuthContext';
// import '../../Styles/OrderModals.css';

// interface Order {
//   id: string;
//   firstName: string;
//   lastName: string;
//   date: string;
//   quantity: number;
//   address: string;
//   phoneNumber: string;
//   email: string;
//   country: string;
//   streetAddress: string;
//   town: string;
//   state: string;
//   vendorName: string;
//   profileImage?: string;
// }

// interface OrderDetailModalProps {
//   show: boolean;
//   onClose: () => void;
//   order: Order | null;
// }

// const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
//   show,
//   onClose,
//   order
// }) => {
//   const { token } = useAuth();
//   const [detailedOrder, setDetailedOrder] = useState<DetailedOrder | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       if (!show || !order || !token) return;

//       setIsLoading(true);
//       setError(null);

//       try {
//         const orderDetails = await OrderService.getOrderById(order.id, token);
//         console.log('Order details:', orderDetails);
//         setDetailedOrder(orderDetails);
//       } catch (err) {
//         const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order details';
//         setError(errorMessage);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchOrderDetails();
//   }, [show, order, token]);

//   if (!show || !order) return null;

//   const formatAddress = (shippingAddress: any) => {
//     if (!shippingAddress) return 'N/A';
    
//     const parts = [
//       shippingAddress.localAddress,
//       shippingAddress.city,
//       shippingAddress.district,
//       shippingAddress.province
//     ].filter(Boolean);
    
//     return parts.length > 0 ? parts.join(', ') : 'N/A';
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="order-modal order-detail-modal">
//         <div className="order-modal__header">
//           <h2 className="order-modal__title">Order Details</h2>
//           <button 
//             className="order-modal__close-btn"
//             onClick={onClose}
//             aria-label="Close"
//           >
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//               <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//               <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </button>
//         </div>
        
//         <div className="order-modal__content">
//           {isLoading ? (
//             <div className="order-modal__loading">
//               <div className="skeleton skeleton-text" style={{ width: '100%', height: '20px', marginBottom: '10px' }}></div>
//               <div className="skeleton skeleton-text" style={{ width: '80%', height: '20px', marginBottom: '10px' }}></div>
//               <div className="skeleton skeleton-text" style={{ width: '90%', height: '20px', marginBottom: '10px' }}></div>
//               <div className="skeleton skeleton-text" style={{ width: '70%', height: '20px', marginBottom: '10px' }}></div>
//               <div className="skeleton skeleton-text" style={{ width: '85%', height: '20px' }}></div>
//             </div>
//           ) : error ? (
//             <div className="order-modal__error">
//               <p>Error: {error}</p>
//             </div>
//           ) : (
//             <>
//               <div className="order-modal__customer-info">
//                 <div className="order-modal__profile">
//                   {order.profileImage ? (
//                     <img src={order.profileImage} alt={`${order.firstName} ${order.lastName}`} />
//                   ) : (
//                     <div className="order-modal__profile-placeholder">
//                       {order.firstName.charAt(0)}{order.lastName.charAt(0)}
//                     </div>
//                   )}
//                 </div>
//                 <div className="order-modal__customer-name">
//                   <h3>{detailedOrder?.orderedBy?.username || `${order.firstName} ${order.lastName}`}</h3>
//                   <p className="order-modal__order-id">Order ID: {order.id}</p>
//                 </div>
//               </div>
              
//               <div className="order-modal__details-grid">
//                 <div className="order-modal__detail-item">
//                   <span className="order-modal__label">Date</span>
//                   <span className="order-modal__value">{order.date}</span>
//                 </div>
                
//                 <div className="order-modal__detail-item">
//                   <span className="order-modal__label">Quantity</span>
//                   <span className="order-modal__value">
//                     {detailedOrder?.orderItems?.reduce((total, item) => total + item.quantity, 0) || order.quantity}
//                   </span>
//                 </div>
                
//                 <div className="order-modal__detail-item">
//                   <span className="order-modal__label">Email</span>
//                   <span className="order-modal__value">
//                     {detailedOrder?.orderedBy?.email || order.email}
//                   </span>
//                 </div>
                
//                 <div className="order-modal__detail-item">
//                   <span className="order-modal__label">Total Price</span>
//                   <span className="order-modal__value">
//                     Rs. {detailedOrder?.totalPrice ? Number(detailedOrder.totalPrice).toFixed(2) : 'N/A'}
//                   </span>
//                 </div>
                
//                 <div className="order-modal__detail-item">
//                   <span className="order-modal__label">Shipping Fee</span>
//                   <span className="order-modal__value">
//                     Rs. {detailedOrder?.shippingFee ? Number(detailedOrder.shippingFee).toFixed(2) : 'N/A'}
//                   </span>
//                 </div>
                
//                 <div className="order-modal__detail-item">
//                   <span className="order-modal__label">Status</span>
//                   <span className="order-modal__value">
//                     {detailedOrder?.status || 'N/A'}
//                   </span>
//                 </div>
                
//                 <div className="order-modal__detail-item">
//                   <span className="order-modal__label">Payment Status</span>
//                   <span className="order-modal__value">
//                     {detailedOrder?.paymentStatus || 'N/A'}
//                   </span>
//                 </div>
                
//                 <div className="order-modal__detail-item">
//                   <span className="order-modal__label">Payment Method</span>
//                   <span className="order-modal__value">
//                     {detailedOrder?.paymentMethod || 'N/A'}
//                   </span>
//                 </div>
                
//                 <div className="order-modal__detail-item order-modal__detail-item--full">
//                   <span className="order-modal__label">Address</span>
//                   <span className="order-modal__value">
//                     {detailedOrder ? formatAddress(detailedOrder.shippingAddress) : `${order.streetAddress}, ${order.town}, ${order.state}, ${order.country}`}
//                   </span>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
        
//         <div className="order-modal__footer">
//           <button 
//             className="order-modal__button order-modal__button--secondary"
//             onClick={onClose}
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrderDetailModal;


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
        console.log('Order details:', orderDetails);
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

  return (
    <div className="modal-overlay">
      <div className="order-modal order-detail-modal">
        <div className="order-modal__header">
          <h2 className="order-modal__title">Order Details</h2>
          <button 
            className="order-modal__close-btn"
            onClick={onClose}
            aria-label="Close"
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
            </div>
          ) : (
            <>
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
                    {/* {detailedOrder.phoneNumber || 'N/A'} */}
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
                  <span className="order-modal__label">Status</span>
                  <span className="order-modal__value">
                    {detailedOrder?.status || 'N/A'}
                  </span>
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
                          <span>Sub Total: Rs. {Number(item.price) * (item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="order-modal__footer">
          <button 
            className="order-modal__button order-modal__button--secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;