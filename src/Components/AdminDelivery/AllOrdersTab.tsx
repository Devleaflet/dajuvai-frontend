import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import Pagination from "../Pagination";
import StatusBadge from "./StatusBadge";
import OrderDetailModal from "../Modal/OrderDetailModal";
import {
    getAtWarehouseOrders,
    getAllRiders,
    assignRider,
    bulkAssignRiders,
} from "../../services/deliveryService";
import type { Order, Rider, BulkAssignResult } from "../../types/delivery";
import { OrderStatus, ORDER_STATUS_LABELS } from "../../types/delivery";

// All order statuses from "arrived at warehouse" → "returned"
const DELIVERY_STATUSES: OrderStatus[] = [
    OrderStatus.ARRIVED_AT_WAREHOUSE,
    OrderStatus.ASSIGNED_TO_RIDER,
    OrderStatus.DELIVERED,
    OrderStatus.NOT_RECEIVED,
    OrderStatus.CANCELLED,
    OrderStatus.RETURNED,
];

const STATUS_BUTTON_COLORS: Record<string, { bg: string; color: string; activeBg: string; activeColor: string }> = {
    [OrderStatus.ARRIVED_AT_WAREHOUSE]: { bg: "#f3f0ff", color: "#7c3aed", activeBg: "#7c3aed", activeColor: "#fff" },
    [OrderStatus.ASSIGNED_TO_RIDER]:   { bg: "#ecfeff", color: "#0891b2", activeBg: "#0891b2", activeColor: "#fff" },
    [OrderStatus.DELIVERED]:           { bg: "#f0fdf4", color: "#16a34a", activeBg: "#16a34a", activeColor: "#fff" },
    [OrderStatus.NOT_RECEIVED]:        { bg: "#fff1f2", color: "#be123c", activeBg: "#be123c", activeColor: "#fff" },
    [OrderStatus.CANCELLED]:           { bg: "#fef2f2", color: "#dc2626", activeBg: "#dc2626", activeColor: "#fff" },
    [OrderStatus.RETURNED]:            { bg: "#eef2ff", color: "#4338ca", activeBg: "#4338ca", activeColor: "#fff" },
};

export default function AllOrdersTab() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    // Status filter: "all" means all DELIVERY_STATUSES
    const [activeStatus, setActiveStatus] = useState<OrderStatus | "all">("all");

    // Search and Sort
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sort, setSort] = useState<"newest" | "oldest">("newest");

    // Selection for bulk actions
    const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

    // Modals
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [targetOrderIds, setTargetOrderIds] = useState<number[]>([]);
    const [selectedRiderId, setSelectedRiderId] = useState<number | "">("");
    const [submittingAssign, setSubmittingAssign] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset page + selection when filter/sort changes
    useEffect(() => {
        setPage(1);
        setSelectedOrderIds([]);
    }, [activeStatus, sort]);

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            const statusFilter =
                activeStatus === "all" ? DELIVERY_STATUSES : [activeStatus];

            const [ordersRes, ridersRes] = await Promise.all([
                getAtWarehouseOrders(page, 15, searchQuery, sort, statusFilter),
                getAllRiders(),
            ]);

            setOrders(ordersRes.data ?? []);
            setTotalPages(ordersRes.pagination?.totalPages ?? 1);
            setTotalOrders(ordersRes.pagination?.total ?? 0);
            setRiders(ridersRes ?? []);
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to load orders",
            );
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, sort, activeStatus]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Checkbox handlers - only orders at warehouse can be selected for assignment
    const warehouseOrders = orders.filter((o) => o.status === OrderStatus.ARRIVED_AT_WAREHOUSE);
    const isAllSelected =
        warehouseOrders.length > 0 &&
        warehouseOrders.every((o) => selectedOrderIds.includes(o.id));

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const warehouseIds = warehouseOrders.map((o) => o.id);
            setSelectedOrderIds((prev) =>
                Array.from(new Set([...prev, ...warehouseIds])),
            );
        } else {
            const warehouseIds = new Set(warehouseOrders.map((o) => o.id));
            setSelectedOrderIds((prev) =>
                prev.filter((id) => !warehouseIds.has(id)),
            );
        }
    };

    const handleSelectOne = (id: number) => {
        setSelectedOrderIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    // Open Assign Rider Modal
    const openSingleAssignModal = (orderId: number) => {
        const target = orders.find((o) => o.id === orderId);
        if (target && target.status !== OrderStatus.ARRIVED_AT_WAREHOUSE) {
            toast.error("Only orders at warehouse can be assigned a rider.");
            return;
        }
        setTargetOrderIds([orderId]);
        setSelectedRiderId("");
        setAssignModalOpen(true);
    };

    const openBulkAssignModal = () => {
        const validOrderIds = selectedOrderIds.filter((id) => {
            const o = orders.find((ord) => ord.id === id);
            return o ? o.status === OrderStatus.ARRIVED_AT_WAREHOUSE : true;
        });

        if (validOrderIds.length === 0) {
            toast.error("Only orders at warehouse can be assigned a rider.");
            return;
        }

        if (validOrderIds.length < selectedOrderIds.length) {
            toast.error(
                "Some selected orders were excluded because they are not at warehouse.",
            );
        }

        setTargetOrderIds(validOrderIds);
        setSelectedRiderId("");
        setAssignModalOpen(true);
    };

    // Execute Rider Assignment
    const handleConfirmAssignment = async () => {
        if (!selectedRiderId) {
            toast.error("Please select a rider");
            return;
        }

        try {
            setSubmittingAssign(true);

            if (targetOrderIds.length === 1) {
                await assignRider(targetOrderIds[0], Number(selectedRiderId));
                toast.success("Rider assigned successfully!");
            } else {
                const results: BulkAssignResult[] = await bulkAssignRiders(
                    targetOrderIds,
                    Number(selectedRiderId),
                );

                const succeeded = results.filter((r) => r.success);
                const failed = results.filter((r) => !r.success);

                if (failed.length === 0) {
                    toast.success(
                        `Successfully assigned rider to all ${succeeded.length} orders!`,
                    );
                } else if (succeeded.length === 0) {
                    toast.error(`Failed to assign rider to all selected orders`);
                } else {
                    toast.error(
                        `Assigned to ${succeeded.length} orders. ${failed.length} failed.`,
                    );
                }
            }

            setAssignModalOpen(false);
            setSelectedOrderIds([]);
            loadOrders();
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to assign rider",
            );
        } finally {
            setSubmittingAssign(false);
        }
    };

    const getVendorsSummary = (order: Order) => {
        if (!order.orderItems || order.orderItems.length === 0) return "N/A";
        const vendors = Array.from(
            new Set(
                order.orderItems
                    .map((item) => item.vendor?.businessName)
                    .filter(Boolean),
            ),
        );
        return vendors.length > 1 ? `${vendors[0]} +${vendors.length - 1} more` : vendors.length === 1 ? `${vendors[0]}` : "N/A";
    };

    const activeStatusLabel =
        activeStatus === "all"
            ? "All Delivery Orders"
            : (ORDER_STATUS_LABELS[activeStatus] ?? activeStatus);

    return (
        <>
            {/* Header Toolbar */}
            <div className="admin-delivery__section-header">
                <h3 className="admin-delivery__section-title">
                    {activeStatusLabel} ({totalOrders})
                </h3>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <button
                        className="admin-delivery__btn admin-delivery__btn--ghost"
                        onClick={loadOrders}
                    >
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* ── Status Filter Buttons ── */}
            <div className="admin-delivery__status-filters">
                <button
                    className={`admin-delivery__status-btn${activeStatus === "all" ? " admin-delivery__status-btn--active" : ""}`}
                    onClick={() => setActiveStatus("all")}
                    style={
                        activeStatus === "all"
                            ? { background: "#1e293b", color: "#fff", borderColor: "#1e293b" }
                            : { background: "#f8fafc", color: "#475569", borderColor: "#e2e8f0" }
                    }
                >
                    All
                </button>

                {DELIVERY_STATUSES.map((status) => {
                    const colors = STATUS_BUTTON_COLORS[status];
                    const isActive = activeStatus === status;
                    return (
                        <button
                            key={status}
                            className={`admin-delivery__status-btn${isActive ? " admin-delivery__status-btn--active" : ""}`}
                            onClick={() => setActiveStatus(status)}
                            style={{
                                background: isActive ? colors.activeBg : colors.bg,
                                color: isActive ? colors.activeColor : colors.color,
                                borderColor: isActive ? colors.activeBg : colors.bg,
                            }}
                        >
                            {ORDER_STATUS_LABELS[status] ?? status}
                        </button>
                    );
                })}
            </div>

            {/* Filter and Search Bar */}
            <div className="admin-delivery__filter-bar">
                <div className="admin-delivery__search-wrap">
                    <input
                        type="text"
                        className="admin-delivery__search-input"
                        placeholder="Search order #, customer, vendor..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                        <button
                            className="admin-delivery__search-clear"
                            onClick={() => setSearchInput("")}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    {selectedOrderIds.length > 0 && (
                        <div className="admin-delivery__bulk-inline">
                            <span>
                                <strong>{selectedOrderIds.length}</strong> selected
                            </span>
                            <button
                                className="admin-delivery__btn admin-delivery__btn--primary"
                                onClick={openBulkAssignModal}
                            >
                                Bulk Assign Rider
                            </button>
                        </div>
                    )}

                    <div className="admin-delivery__sort-wrap">
                        <label style={{ fontSize: "0.8125rem", color: "#4b5563" }}>
                            Sort:
                        </label>
                        <select
                            className="admin-delivery__select"
                            value={sort}
                            onChange={(e) => {
                                setSort(e.target.value as "newest" | "oldest");
                                setPage(1);
                            }}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="admin-delivery__loading">
                    <div className="admin-delivery__spinner" />
                    Loading orders...
                </div>
            ) : orders.length === 0 ? (
                <div className="admin-delivery__empty">
                    <div className="admin-delivery__empty-icon">📦</div>
                    {searchQuery
                        ? `No ${activeStatusLabel.toLowerCase()} orders match your search.`
                        : `No orders found for: ${activeStatusLabel}.`}
                </div>
            ) : (
                <div className="admin-delivery__table-wrap">
                    <table className="admin-delivery__table">
                        <thead>
                            <tr>
                                <th style={{ width: "40px", textAlign: "center" }}>
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Order Number</th>
                                <th>Customer</th>
                                <th>Vendor(s)</th>
                                <th>Order Date</th>
                                <th>Status</th>
                                <th>Rider</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                const isSelected = selectedOrderIds.includes(order.id);
                                return (
                                    <tr
                                        key={order.id}
                                        className={isSelected ? "admin-delivery__tr--selected" : ""}
                                    >
                                        <td style={{ textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={order.status !== OrderStatus.ARRIVED_AT_WAREHOUSE}
                                                title={
                                                    order.status !== OrderStatus.ARRIVED_AT_WAREHOUSE
                                                        ? "Only orders at warehouse can be assigned a rider"
                                                        : ""
                                                }
                                                onChange={() => handleSelectOne(order.id)}
                                            />
                                        </td>
                                        <td>
                                            <strong>
                                                {order.orderNumber || `#${order.id}`}
                                            </strong>
                                        </td>
                                        <td>
                                            <div>
                                                {order.orderedBy?.fullName ||
                                                    order.orderedBy?.username ||
                                                    "N/A"}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                                {order.orderedBy?.phoneNumber || order.orderedBy?.email || ""}
                                            </div>
                                        </td>
                                        <td>{getVendorsSummary(order)}</td>
                                        <td>
                                            {order.createdAt
                                                ? new Date(order.createdAt).toLocaleDateString("en-US", {
                                                      year: "numeric",
                                                      month: "short",
                                                      day: "numeric",
                                                  })
                                                : "N/A"}
                                        </td>
                                        <td>
                                            <StatusBadge status={order.status} />
                                        </td>
                                        {/* ── Rider Column ── */}
                                        <td>
                                            {order.assignedRider ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                    <span></span>
                                                    <div>
                                                        <div style={{ fontWeight: 500, fontSize: "0.8125rem" }}>
                                                            {order.assignedRider.fullName || (order.assignedRider as any).name || "—"}
                                                        </div>
                                                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                                            {order.assignedRider.phoneNumber || "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "0.8125rem" }}>
                                                    Unassigned
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button
                                                    className="admin-delivery__btn admin-delivery__btn--ghost admin-delivery__btn--sm"
                                                    onClick={() => setViewingOrder(order)}
                                                >
                                                    View Detail
                                                </button>
                                                {order.status === OrderStatus.ARRIVED_AT_WAREHOUSE && (
                                                    <button
                                                        className="admin-delivery__btn admin-delivery__btn--primary admin-delivery__btn--sm"
                                                        onClick={() => openSingleAssignModal(order.id)}
                                                    >
                                                        {order.assignedRider ? "Reassign" : "Assign Rider"}
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="admin-delivery__pagination">
                    <span className="admin-delivery__pagination-info">
                        Page {page} of {totalPages} ({totalOrders} total)
                    </span>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            )}

            {/* Assign Rider Modal */}
            {assignModalOpen && (
                <div className="admin-delivery__modal-overlay">
                    <div className="admin-delivery__modal">
                        <h4 className="admin-delivery__modal-title">
                            Assign Rider to {targetOrderIds.length} Order(s)
                        </h4>
                        <p className="admin-delivery__modal-subtitle">
                            The selected rider will be assigned to delivery for the complete order(s).
                        </p>

                        <div className="admin-delivery__form-group" style={{ marginTop: "1rem" }}>
                            <label className="admin-delivery__form-label">Select Available Rider *</label>
                            <select
                                className="admin-delivery__form-input"
                                value={selectedRiderId}
                                onChange={(e) => setSelectedRiderId(Number(e.target.value) || "")}
                            >
                                <option value="">-- Choose Rider --</option>
                                {riders.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.fullName || r.name || "Unknown"} ({r.phoneNumber})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-delivery__modal-actions">
                            <button
                                className="admin-delivery__btn admin-delivery__btn--ghost"
                                onClick={() => setAssignModalOpen(false)}
                                disabled={submittingAssign}
                            >
                                Cancel
                            </button>
                            <button
                                className="admin-delivery__btn admin-delivery__btn--primary"
                                onClick={handleConfirmAssignment}
                                disabled={submittingAssign || !selectedRiderId}
                            >
                                {submittingAssign ? "Assigning..." : "Confirm Assignment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Detail Modal */}
            {viewingOrder && (
                <OrderDetailModal
                    show={Boolean(viewingOrder)}
                    onClose={() => setViewingOrder(null)}
                    order={viewingOrder as any}
                    onStatusUpdate={() => {
                        loadOrders();
                    }}
                />
            )}
        </>
    );
}
