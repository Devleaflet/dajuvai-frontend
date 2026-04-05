import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
    getFailedOrders,
    resetFailedOrder,
} from "../../services/deliveryService";
import type { DeliveryAssignment } from "../../types/delivery";

export default function FailedRecoveryTab() {
    const [failedAssignments, setFailedAssignments] = useState<
        DeliveryAssignment[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState<number | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getFailedOrders();
            setFailedAssignments(data);
        } catch (e) {
            toast.error(
                e instanceof Error
                    ? e.message
                    : "Failed to load failed deliveries",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleReset = async (orderId: number) => {
        try {
            setResetting(orderId);
            await resetFailedOrder(orderId);
            toast.success("Order reset to warehouse successfully");
            load();
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to reset order",
            );
        } finally {
            setResetting(null);
        }
    };

    if (loading) {
        return (
            <div className="admin-delivery__loading">
                <div className="admin-delivery__spinner" />
                Loading failed deliveries...
            </div>
        );
    }

    return (
        <>
            <div className="admin-delivery__section-header">
                <h3 className="admin-delivery__section-title">
                    Failed Delivery Recovery
                </h3>
                <button
                    className="admin-delivery__btn admin-delivery__btn--ghost"
                    onClick={load}
                >
                    ↻ Refresh
                </button>
            </div>
            {failedAssignments.length === 0 ? (
                <div className="admin-delivery__empty">
                    <div className="admin-delivery__empty-icon">✅</div>
                    No failed deliveries to recover
                </div>
            ) : (
                <div className="admin-delivery__table-wrap">
                    <table className="admin-delivery__table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Rider</th>
                                <th>Failed Reason</th>
                                <th>Failed At</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {failedAssignments.map((a) => (
                                <tr key={a.id}>
                                    <td>#{a.orderId}</td>
                                    <td>{a.rider?.fullName ?? "N/A"}</td>
                                    <td
                                        style={{
                                            color: "#b91c1c",
                                            fontSize: "0.8125rem",
                                            maxWidth: 240,
                                        }}
                                    >
                                        {a.failureReason ?? "—"}
                                    </td>
                                    <td>
                                        {a.updatedAt
                                            ? new Date(
                                                  a.updatedAt,
                                              ).toLocaleDateString("en-US", {
                                                  year: "numeric",
                                                  month: "short",
                                                  day: "numeric",
                                              })
                                            : "N/A"}
                                    </td>
                                    <td>
                                        <button
                                            className="admin-delivery__btn admin-delivery__btn--warning admin-delivery__btn--sm"
                                            onClick={() =>
                                                handleReset(a.orderId)
                                            }
                                            disabled={resetting === a.orderId}
                                        >
                                            {resetting === a.orderId
                                                ? "Resetting..."
                                                : "🔄 Reset to Warehouse"}
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
