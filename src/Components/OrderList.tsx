import React from "react";
import { Order } from "./Types/Order";
import { getOrderStatusMeta } from "./orderStatus";

// Define props interface
interface OrderListProps {
    orders: Order[];
    isMobile: boolean;
    onView: (order: Order) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onView }) => {
    return (
        <div className="vendor-order__table-container">
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
                        <tr
                            key={`order-${order.id || index}-${order.orderId || order.createdAt || index}`}
                            className="dashboard__table-row"
                        >
                            <td>
                                {order.orderId ||
                                    `#ORD${String(order.id).padStart(4, "0")}`}
                            </td>
                            <td>{order.orderedBy || "Unknown Customer"}</td>
                            <td>
                                {(() => {
                                    const raw = order.product || "Unknown Product";
                                    const products = raw.split(",").map((p: string) => p.trim()).filter(Boolean);
                                    const MAX_LEN = 20;
                                    const truncate = (name: string) =>
                                        name.length > MAX_LEN ? name.slice(0, MAX_LEN).trimEnd() + "…" : name;
                                    const visible = products.slice(0, 2).map(truncate);
                                    const extra = products.length - 2;
                                    return (
                                        <span title={raw}>
                                            {visible.join(", ")}
                                            {extra > 0 && (
                                                <span style={{ color: "var(--color-primary, #6366f1)", fontWeight: 500 }}>
                                                    {" "}+ {extra} other(s)
                                                </span>
                                            )}
                                        </span>
                                    );
                                })()}
                            </td>
                            <td>Rs. {order.price?.toFixed(2) || "0.00"}</td>
                            <td>
                                {`${order.paymentStatus}(${order.paymentMethod})` ||
                                    "unknown"}
                            </td>
                            <td>
                                {(() => {
                                    const meta = getOrderStatusMeta(order.status || "CREATED");
                                    return (
                                        <span className={`status-badge ${meta.badgeClassName}`}>
                                            {meta.label}
                                        </span>
                                    );
                                })()}
                            </td>
                            <td className="action-buttons">
                                <button
                                    className="vendor-product__action-btn vendor-product__view"
                                    onClick={() => onView(order)}
                                    title="View Order Details"
                                >
                                    <svg
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M12 5C7.63636 5 4 8.63636 4 12C4 15.3636 7.63636 19 12 19C16.3636 19 20 15.3636 20 12C20 8.63636 16.3636 5 12 5Z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
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
