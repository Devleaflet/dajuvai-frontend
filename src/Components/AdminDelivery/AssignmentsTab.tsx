import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import Pagination from "../Pagination";
import StatusBadge from "./StatusBadge";
import OrderDetailModal from "../Modal/OrderDetailModal";
import { getAllAssignments, resetFailedOrder } from "../../services/deliveryService";
import type { DeliveryAssignment, Order } from "../../types/delivery";
import { OrderStatus } from "../../types/delivery";

export default function AssignmentsTab() {
    const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [resettingId, setResettingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAllAssignments(page);
            const items = res.data ?? [];
            const tp = res.pagination.totalPages;
            setAssignments(items);
            setTotalPages(tp);
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to load assignments",
            );
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        load();
    }, [load]);

    const handleResetToWarehouse = async (orderId: number) => {
        try {
            setResettingId(orderId);
            await resetFailedOrder(orderId);
            toast.success("Order reset to warehouse successfully");
            load();
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to reset order",
            );
        } finally {
            setResettingId(null);
        }
    };

    if (loading) {
        return (
            <div className="admin-delivery__loading">
                <div className="admin-delivery__spinner" />
                Loading assignments...
            </div>
        );
    }

    // Find the latest assignment ID per orderId (highest id = most recent)
    const latestIdPerOrder = new Map<number, number>();
    for (const a of assignments) {
        const current = latestIdPerOrder.get(a.orderId);
        if (current === undefined || a.id > current) {
            latestIdPerOrder.set(a.orderId, a.id);
        }
    }

    return (
        <>
            <div className="admin-delivery__section-header">
                <h3 className="admin-delivery__section-title">
                    All Assignments
                </h3>
                <button
                    className="admin-delivery__btn admin-delivery__btn--ghost"
                    onClick={load}
                >
                    ↻ Refresh
                </button>
            </div>
            {assignments.length === 0 ? (
                <div className="admin-delivery__empty">
                    <div className="admin-delivery__empty-icon">📋</div>
                    No assignments yet
                </div>
            ) : (
                <div className="admin-delivery__table-wrap">
                    <table className="admin-delivery__table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Rider</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Assigned At</th>
                                <th>Failed Reason</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((a) => {
                                const targetOrder = a.order ?? ({ id: a.orderId } as Order);
                                const isLatestAssignment = latestIdPerOrder.get(a.orderId) === a.id;
                                return (
                                    <tr key={a.id}>
                                        <td>#{a.order?.orderNumber || a.orderId}</td>
                                        <td>
                                            {a.rider?.name ||
                                                a.rider?.fullName ||
                                                "N/A"}
                                        </td>
                                        <td>{a.rider?.phoneNumber ?? "N/A"}</td>
                                        <td>
                                            <StatusBadge
                                                status={a.assignmentStatus}
                                            />
                                        </td>
                                        <td>
                                            {a.createdAt
                                                ? new Date(
                                                      a.createdAt,
                                                  ).toLocaleDateString("en-US", {
                                                      year: "numeric",
                                                      month: "short",
                                                      day: "numeric",
                                                  })
                                                : "N/A"}
                                        </td>
                                        <td
                                            style={{
                                                color: "#ef4444",
                                                fontSize: "0.8125rem",
                                            }}
                                        >
                                            {a.failureReason ?? "—"}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button
                                                    className="admin-delivery__btn admin-delivery__btn--ghost admin-delivery__btn--sm"
                                                    onClick={() => setViewingOrder(targetOrder)}
                                                >
                                                    View Detail
                                                </button>
                                                {isLatestAssignment &&
                                                    a.order?.status !== OrderStatus.ARRIVED_AT_WAREHOUSE &&
                                                    a.order?.status !== OrderStatus.DELIVERED && (
                                                    <button
                                                        className="admin-delivery__btn admin-delivery__btn--warning admin-delivery__btn--sm"
                                                        onClick={() => handleResetToWarehouse(a.orderId)}
                                                        disabled={resettingId === a.orderId}
                                                    >
                                                        {resettingId === a.orderId ? "Resetting..." : "Reset to Warehouse"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
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

            {/* Order Detail Modal */}
            {viewingOrder && (
                <OrderDetailModal
                    show={Boolean(viewingOrder)}
                    onClose={() => setViewingOrder(null)}
                    order={viewingOrder as any}
                    onStatusUpdate={() => {
                        load();
                    }}
                />
            )}
        </>
    );
}

