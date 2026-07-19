import React from "react";
import { Order } from "../Types/Order";
import "./ViewModal.css";

interface OrderDetail {
  id: number;
  orderedBy: { id: number; username: string; email: string };
  shippingAddress: { province: string; district: string; city: string; localAddress?: string };
  orderItems: Array<{
    id: number;
    productId: number;
    quantity: number;
    price: string;
    product: { name: string };
    vendor: { id: number; businessName: string };
    variant?: {
      sku: string;
      attributes: Record<string, string>;
    } | null;
  }>;
  totalPrice: string;
  shippingFee: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface ViewModalProps {
  show: boolean;
  onClose: () => void;
  order: Order | null;
  orderDetail: OrderDetail | null;
}

const ViewModal: React.FC<ViewModalProps> = ({ show, onClose, order, orderDetail }) => {
  if (!show || !order || !orderDetail) return null;

  const subtotal = orderDetail.orderItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const total = subtotal + parseFloat(orderDetail.shippingFee);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order #{order.orderId}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="modal-section">
            <h3>Order Summary</h3>
            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping Fee</span>
                <span>Rs. {parseFloat(orderDetail.shippingFee).toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3>Order Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Order Date</span>
                <span className="value">{new Date(orderDetail.createdAt).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="label">Payment Method</span>
                <span className="value">{orderDetail.paymentMethod}</span>
              </div>
              <div className="detail-item">
                <span className="label">Order Status</span>
                <span className="value">{orderDetail.status}</span>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3>Customer Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Name</span>
                <span className="value">{orderDetail.orderedBy.username}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email</span>
                <span className="value">{orderDetail.orderedBy.email}</span>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3>Shipping Address</h3>
            <div className="address-box">
              <p>{`${orderDetail.shippingAddress.province}, ${orderDetail.shippingAddress.city}, ${orderDetail.shippingAddress.district}`}</p>
              {orderDetail.shippingAddress.localAddress && (
                <p className="local-address">{orderDetail.shippingAddress.localAddress}</p>
              )}
            </div>
          </div>

          <div className="modal-section">
            <h3>Order Items</h3>
            <div className="order-items">
              {orderDetail.orderItems.map((item) => (
                <div key={item.id} className="order-item" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px' }}>
                  <div className="item-details" style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '16px' }}>{item.product.name}</h4>
                    <p className="vendor" style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280' }}>Vendor: {item.vendor.businessName}</p>
                    {item.variant && (
                      <div className="variant-info" style={{ marginTop: '8px', padding: '8px 12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: '#4b5563' }}>
                          <div><strong>SKU:</strong> {item.variant.sku}</div>
                          {item.variant.attributes && Object.entries(item.variant.attributes).map(([key, value]) => (
                            <div key={key}><strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="item-price" style={{ flexShrink: 0, textAlign: 'right', minWidth: '120px' }}>
                    <div className="quantity" style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Qty: {item.quantity}</div>
                    <div className="price" style={{ color: '#111827', fontWeight: 600, fontSize: '16px' }}>Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
