import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import Pagination from "../Pagination";
import StatusBadge from "./StatusBadge";
import { getAllAssignments } from "../../services/deliveryService";
import type { DeliveryAssignment } from "../../types/delivery";

export default function AssignmentsTab() {
    const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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

    if (loading) {
        return (
            <div className="admin-delivery__loading">
                <div className="admin-delivery__spinner" />
                Loading assignments...
            </div>
        );
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
                                <th>Assignment ID</th>
                                <th>Order ID</th>
                                <th>Rider</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Assigned At</th>
                                <th>Failed Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((a) => (
                                <tr key={a.id}>
                                    <td>#{a.id}</td>
                                    <td>#{a.orderId}</td>
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
                                </tr>
                            ))}
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
        </>
    );
}
