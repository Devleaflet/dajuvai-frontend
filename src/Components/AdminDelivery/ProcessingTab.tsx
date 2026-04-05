import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import StatusBadge from "./StatusBadge";
import { getProcessingOrders, getProcessingOrder, collectItem, markAtWarehouse } from "../../services/deliveryService";
import type { Order, OrderItem } from "../../types/delivery";

export default function ProcessingTab() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [collectingItem, setCollectingItem] = useState<number | null>(null);
    const [markingWarehouse, setMarkingWarehouse] = useState<number | null>(
        null,
    );

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getProcessingOrders();
            setOrders(data);
        } catch (e) {
            toast.error(
                e instanceof Error
                    ? e.message
                    : "Failed to load processing orders",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const openOrder = async (orderId: number) => {
        try {
            setLoadingOrder(true);
            const data = await getProcessingOrder(orderId);
            setSelectedOrder(data);
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to load order",
            );
        } finally {
            setLoadingOrder(false);
        }
    };

    const handleCollect = async (itemId: number) => {
        try {
            setCollectingItem(itemId);
            await collectItem(itemId);
            toast.success("Item marked as collected");
            // Re-fetch the order detail to update item states
            if (selectedOrder) {
                const updated = await getProcessingOrder(selectedOrder.id);
                setSelectedOrder(updated);
                // Also refresh list (order may have moved status)
                load();
            }
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to collect item",
            );
        } finally {
            setCollectingItem(null);
        }
    };

    const handleMarkWarehouse = async (orderId: number) => {
        try {
            setMarkingWarehouse(orderId);
            await markAtWarehouse(orderId);
            toast.success("Order marked as At Warehouse");
            setSelectedOrder(null);
            load();
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to mark at warehouse",
            );
        } finally {
            setMarkingWarehouse(null);
        }
    };

    if (loading) {
        return (
            <div className="admin-delivery__loading">
                <div className="admin-delivery__spinner" />
                Loading processing orders...
            </div>
        );
    }

    if (selectedOrder) {
        const items: OrderItem[] = selectedOrder.orderItems ?? [];
        const allCollected =
            items.length > 0 && items.every((i) => i.collectedAtWarehouse);

        return (
            <div className="admin-delivery__detail-panel">
                <button
                    className="admin-delivery__detail-back"
                    onClick={() => setSelectedOrder(null)}
                >
                    ← Back to list
                </button>
                <div className="admin-delivery__section-header">
                    <h3 className="admin-delivery__section-title">
                        Order #{selectedOrder.id}
                    </h3>
                    <div
                        style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                        }}
                    >
                        <StatusBadge
                            status={
                                selectedOrder.deliveryStatus ??
                                selectedOrder.status
                            }
                        />
                        <button
                            className="admin-delivery__btn admin-delivery__btn--warning"
                            onClick={() =>
                                handleMarkWarehouse(selectedOrder.id)
                            }
                            disabled={markingWarehouse === selectedOrder.id}
                        >
                            {markingWarehouse === selectedOrder.id
                                ? "Marking..."
                                : "🏭 Mark At Warehouse"}
                        </button>
                    </div>
                </div>

                {/* Customer & Address Info */}
                <div className="admin-delivery__detail-grid">
                    <div>
                        <div className="admin-delivery__detail-label">
                            Customer
                        </div>
                        <div className="admin-delivery__detail-value">
                            {selectedOrder.orderedBy?.username ?? "N/A"}
                        </div>
                    </div>
                    <div>
                        <div className="admin-delivery__detail-label">
                            Email
                        </div>
                        <div className="admin-delivery__detail-value">
                            {selectedOrder.orderedBy?.email ?? "N/A"}
                        </div>
                    </div>
                    <div>
                        <div className="admin-delivery__detail-label">
                            Shipping Address
                        </div>
                        <div className="admin-delivery__detail-value">
                            {selectedOrder.shippingAddress
                                ? [
                                      selectedOrder.shippingAddress
                                          .localAddress,
                                      selectedOrder.shippingAddress.city,
                                      selectedOrder.shippingAddress.district,
                                      selectedOrder.shippingAddress.province,
                                  ]
                                      .filter(Boolean)
                                      .join(", ")
                                : "N/A"}
                        </div>
                    </div>
                    <div>
                        <div className="admin-delivery__detail-label">
                            Total
                        </div>
                        <div className="admin-delivery__detail-value">
                            Rs.{" "}
                            {parseFloat(
                                String(selectedOrder.totalPrice),
                            ).toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Items */}
                <h4
                    style={{
                        margin: "1rem 0 0.5rem",
                        color: "#374151",
                        fontWeight: 600,
                    }}
                >
                    Order Items{" "}
                    {allCollected && (
                        <span style={{ color: "#10b981" }}>
                            ✓ All Collected
                        </span>
                    )}
                </h4>
                {loadingOrder ? (
                    <div className="admin-delivery__loading">
                        <div className="admin-delivery__spinner" />
                    </div>
                ) : (
                    <div className="admin-delivery__items-list">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="admin-delivery__item-row"
                            >
                                <div className="admin-delivery__item-info">
                                    <div className="admin-delivery__item-name">
                                        {item.product?.name ??
                                            `Product #${item.productId}`}
                                    </div>
                                    <div className="admin-delivery__item-meta">
                                        Qty: {item.quantity} &nbsp;·&nbsp; Rs.{" "}
                                        {parseFloat(String(item.price)).toFixed(
                                            2,
                                        )}
                                    </div>
                                </div>
                                {item.collectedAtWarehouse ? (
                                    <span className="admin-delivery__item-collected">
                                        ✓ Collected
                                    </span>
                                ) : (
                                    <button
                                        className="admin-delivery__btn admin-delivery__btn--success admin-delivery__btn--sm"
                                        onClick={() => handleCollect(item.id)}
                                        disabled={collectingItem === item.id}
                                    >
                                        {collectingItem === item.id
                                            ? "Collecting..."
                                            : "✓ Collect"}
                                    </button>
                                )}
                            </div>
                        ))}
                        {items.length === 0 && (
                            <p
                                style={{
                                    color: "#9ca3af",
                                    fontSize: "0.875rem",
                                }}
                            >
                                No items found.
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="admin-delivery__section-header">
                <h3 className="admin-delivery__section-title">
                    Processing Orders
                </h3>
                <button
                    className="admin-delivery__btn admin-delivery__btn--ghost"
                    onClick={load}
                >
                    ↻ Refresh
                </button>
            </div>
            {orders.length === 0 ? (
                <div className="admin-delivery__empty">
                    <div className="admin-delivery__empty-icon">📭</div>
                    No orders currently processing
                </div>
            ) : (
                <div className="admin-delivery__table-wrap">
                    <table className="admin-delivery__table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td>
                                        {order.orderedBy?.username ?? "N/A"}
                                    </td>
                                    <td>
                                        {order.orderItems?.length ?? 0} item(s)
                                    </td>
                                    <td>
                                        Rs.{" "}
                                        {parseFloat(
                                            String(order.totalPrice),
                                        ).toFixed(2)}
                                    </td>
                                    <td>
                                        <StatusBadge
                                            status={
                                                order.deliveryStatus ??
                                                order.status
                                            }
                                        />
                                    </td>
                                    <td>
                                        {new Date(
                                            order.createdAt,
                                        ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </td>
                                    <td>
                                        <button
                                            className="admin-delivery__btn admin-delivery__btn--primary admin-delivery__btn--sm"
                                            onClick={() => openOrder(order.id)}
                                        >
                                            View Items
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}