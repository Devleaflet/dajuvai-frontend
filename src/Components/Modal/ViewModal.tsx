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
                <div key={item.id} className="order-item">
                  <div className="item-details">
                    <h4>{item.product.name}</h4>
                    <p className="vendor">Vendor: {item.vendor.businessName}</p>
                  </div>
                  <div className="item-price">
                    <span className="quantity">Qty: {item.quantity}</span>
                    <span className="price">Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
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
