import React from "react";
import { Order, OrderDetail } from "../Types/Order";

interface EditModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
  order: Order | null;
  orderDetail: OrderDetail | null;
}

const EditModal: React.FC<EditModalProps> = ({ show, onClose, onSave, order, orderDetail }) => {
  if (!show || !order || !orderDetail) return null;

  const handleSave = () => {
    onSave(order); // Implement actual updates based on form data
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit Order #{order.orderId}</h2>
        <p>Ordered By: {orderDetail.orderedBy.username} ({orderDetail.orderedBy.email})</p>
        <p>Shipping Address: {`${orderDetail.shippingAddress.province}, ${orderDetail.shippingAddress.city}, ${orderDetail.shippingAddress.district}`}</p>
        <p>Product: {order.product}</p>
        <p>Quantity: {orderDetail.orderItems[0].quantity}</p>
        <p>Total Price: Rs. {(parseFloat(orderDetail.totalPrice) + parseFloat(orderDetail.shippingFee)).toFixed(2)}</p>
        <p>Payment Method: {orderDetail.paymentMethod}</p>
        <p>Status: {order.status}</p>
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default EditModal;
