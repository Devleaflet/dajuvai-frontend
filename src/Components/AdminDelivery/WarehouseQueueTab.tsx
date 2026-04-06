import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import Pagination from "../Pagination";
import StatusBadge from "./StatusBadge";
import {
    getWarehouseQueue,
    getAllRiders,
    assignRider,
    markAtWarehouse,
} from "../../services/deliveryService";
import type { Order, Rider } from "../../types/delivery";

export default function WarehouseQueueTab() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRiders, setSelectedRiders] = useState<
        Record<number, number>
    >({});
    const [assigning, setAssigning] = useState<number | null>(null);
    const [markingWarehouse, setMarkingWarehouse] = useState<number | null>(
        null,
    );
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const [queueRes, ridersRes] = await Promise.all([
                getWarehouseQueue(page),
                getAllRiders(),
            ]);
            // Handle both array and paginated response shapes
            // const items = Array.isArray(queueRes)
            //     ? (queueRes as Order[])
            //     : ((queueRes as any).data?.orders ??
            //       (queueRes as any).data ??
            //       []);

            const items = queueRes.data ?? [];

            const tp = queueRes.pagination.totalPages ?? null;

            setOrders(items);
            setTotalPages(tp);
            setRiders(ridersRes);
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to load queue",
            );
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        load();
    }, [load]);

    const handleAssign = async (orderId: number) => {
        const riderId = selectedRiders[orderId];
        if (!riderId) {
            toast.error("Please select a rider first");
            return;
        }
        try {
            setAssigning(orderId);
            await assignRider(orderId, riderId);
            toast.success("Rider assigned successfully!");
            load();
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to assign rider",
            );
        } finally {
            setAssigning(null);
        }
    };

    const handleMarkWarehouse = async (orderId: number) => {
        try {
            setMarkingWarehouse(orderId);
            await markAtWarehouse(orderId);
            toast.success("Order marked At Warehouse");
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed");
        } finally {
            setMarkingWarehouse(null);
        }
    };

    if (loading) {
        return (
            <div className="admin-delivery__loading">
                <div className="admin-delivery__spinner" />
                Loading warehouse queue...
            </div>
        );
    }

    return (
        <>
            <div className="admin-delivery__section-header">
                <h3 className="admin-delivery__section-title">
                    Warehouse Queue
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
                    <div className="admin-delivery__empty-icon">📦</div>
                    No orders in the warehouse queue
                </div>
            ) : (
                orders.map((order) => (
                    <div
                        key={order.id}
                        className="admin-delivery__detail-panel"
                        style={{ marginBottom: "1rem" }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                            }}
                        >
                            <div>
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color: "#111827",
                                        fontSize: "1rem",
                                    }}
                                >
                                    Order #{order.id}
                                </span>
                                &nbsp;&nbsp;
                                <StatusBadge
                                    status={
                                        order.deliveryStatus ?? order.status
                                    }
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "0.5rem",
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    className="admin-delivery__btn admin-delivery__btn--warning admin-delivery__btn--sm"
                                    onClick={() =>
                                        handleMarkWarehouse(order.id)
                                    }
                                    disabled={markingWarehouse === order.id}
                                >
                                    {markingWarehouse === order.id
                                        ? "..."
                                        : "🏭 Mark At Warehouse"}
                                </button>
                                <button
                                    className="admin-delivery__btn admin-delivery__btn--ghost admin-delivery__btn--sm"
                                    onClick={() =>
                                        setExpandedOrder(
                                            expandedOrder === order.id
                                                ? null
                                                : order.id,
                                        )
                                    }
                                >
                                    {expandedOrder === order.id
                                        ? "▲ Hide Details"
                                        : "▼ Show Details"}
                                </button>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div
                            className="admin-delivery__detail-grid"
                            style={{
                                marginTop: "0.75rem",
                                marginBottom: "0.75rem",
                            }}
                        >
                            <div>
                                <div className="admin-delivery__detail-label">
                                    Customer
                                </div>
                                <div className="admin-delivery__detail-value">
                                    {order.orderedBy?.username ?? "N/A"}
                                </div>
                            </div>
                            <div>
                                <div className="admin-delivery__detail-label">
                                    Email
                                </div>
                                <div className="admin-delivery__detail-value">
                                    {order.orderedBy?.email ?? "N/A"}
                                </div>
                            </div>
                            <div>
                                <div className="admin-delivery__detail-label">
                                    Address
                                </div>
                                <div className="admin-delivery__detail-value">
                                    {order.shippingAddress
                                        ? [
                                              order.shippingAddress
                                                  .localAddress,
                                              order.shippingAddress.city,
                                              order.shippingAddress.district,
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
                                        String(order.totalPrice),
                                    ).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Expanded Items */}
                        {expandedOrder === order.id && order.orderItems && (
                            <div
                                className="admin-delivery__items-list"
                                style={{ marginBottom: "0.75rem" }}
                            >
                                {order.orderItems.map((item) => (
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
                                                Qty: {item.quantity} · Rs.{" "}
                                                {parseFloat(
                                                    String(item.price),
                                                ).toFixed(2)}
                                            </div>
                                        </div>
                                        {item.collectedAtWarehouse && (
                                            <span className="admin-delivery__item-collected">
                                                ✓ Collected
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Rider Assignment */}
                        <div className="admin-delivery__assign-row">
                            <select
                                className="admin-delivery__select"
                                value={selectedRiders[order.id] ?? ""}
                                onChange={(e) =>
                                    setSelectedRiders((prev) => ({
                                        ...prev,
                                        [order.id]: Number(e.target.value),
                                    }))
                                }
                            >
                                <option value="">Select Rider...</option>
                                {riders.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name || r.fullName || "Unknown"} —{" "}
                                        {r.phoneNumber}
                                    </option>
                                ))}
                            </select>
                            <button
                                className="admin-delivery__btn admin-delivery__btn--primary"
                                onClick={() => handleAssign(order.id)}
                                disabled={
                                    assigning === order.id ||
                                    !selectedRiders[order.id]
                                }
                            >
                                {assigning === order.id
                                    ? "Assigning..."
                                    : "🏍️ Assign Rider"}
                            </button>
                        </div>
                    </div>
                ))
            )}
            {totalPages > 1 && (
                <div className="admin-delivery__pagination">
                    <span className="admin-delivery__pagination-info">
                        Page {page} of {totalPages}
                    </span>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            )}
        </>
    );
}
