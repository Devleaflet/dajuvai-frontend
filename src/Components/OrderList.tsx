import React from "react";
import { Order } from "./Types/Order";

// Define props interface
interface OrderListProps {
  orders: Order[];
  isMobile: boolean;
  onView: (order: Order) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, isMobile, onView }) => {
  return (
    <div className="vendor-order__table-container">
      {isMobile && (
        <p className="vendor-order__mobile-warning">Viewing on mobile: Limited layout</p>
      )}

      <table className="vendor-order__table">
        <thead className="dashboard__table-header">
          <tr>
            <th>Order ID</th>
            <th>Ordered By</th>
            <th>Product</th>
            <th>Price</th>
            <th>Payment Mode</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr key={`order-${order.id || index}-${order.orderId || order.createdAt || index}`} className="dashboard__table-row">
              <td>{order.orderId || `#ORD${String(order.id).padStart(4, "0")}`}</td>
              <td>{order.orderedBy || "Unknown Customer"}</td>
              <td>{order.product || "Unknown Product"}</td>
              <td>Rs. {order.price?.toFixed(2) || "0.00"}</td>
              <td>{order.paymentStatus || "Unknown"}</td>
              <td>
                <span
                  className={`product-status ${
                    order.status === "delivered"
                      ? "featured"
                      : order.status === "pending"
                      ? "on-sale"
                      : order.status === "canceled"
                      ? "out-of-stock"
                      : ""
                  }`}
                >
                  {order.status || "Pending"}
                </span>
              </td>
              <td className="action-buttons">
                <button
                  className="vendor-product__action-btn vendor-product__view"
                  onClick={() => onView(order)}
                  title="View Order Details"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5C7.63636 5 4 8.63636 4 12C4 15.3636 7.63636 19 12 19C16.3636 19 20 15.3636 20 12C20 8.63636 16.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderList;