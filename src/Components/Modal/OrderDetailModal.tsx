import React, { useState, useEffect, useCallback } from "react";
import { OrderService, DetailedOrder } from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { getAvailableNextStatuses, getOrderStatusMeta } from "../orderStatus";
import "../../Styles/OrderModals.css";
import defaultProductImage from "../../assets/logo.webp";

interface Order {
    id: string;
    firstName: string;
    lastName: string;
    date: string;
    quantity: number;
    address: string;
    phoneNumber: string;
    email: string;
    country: string;
    streetAddress: string;
    town: string;
    state: string;
    vendorName: string;
    profileImage?: string;
}

interface OrderDetailModalProps {
    show: boolean;
    onClose: () => void;
    order: Order | null;
    onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

interface StatusHistoryEntry {
    id: number;
    previousStatus: string | null;
    newStatus: string;
    changedByRole: string;
    reason: string | null;
    note: string | null;
    createdAt: string;
    changedBy: { fullName?: string; username?: string; email?: string } | null;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
    show,
    onClose,
    order,
    onStatusUpdate,
}) => {
    const { token } = useAuth();
    const [detailedOrder, setDetailedOrder] = useState<DetailedOrder | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>(
        [],
    );
    
    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!show || !order || !token) return;
            setIsLoading(true);
            setError(null);
            try {
                const orderDetails = await OrderService.getOrderById(
                    order.id,
                    token,
                );
                setDetailedOrder(orderDetails);
                setCurrentStatus(orderDetails.status || "");
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch order details",
                );
            } finally {
                setIsLoading(false);
            }

            try {
                const history = await OrderService.getOrderStatusHistory(
                    order.id,
                    token,
                );
                setStatusHistory(history);
            } catch (err) {
                // Non-fatal — the timeline is a nice-to-have, not the primary view.
                console.error("Failed to load status history:", err);
            }
        };
        fetchOrderDetails();
    }, [show, order, token]);

    const availableNextStatuses = detailedOrder
        ? getAvailableNextStatuses(detailedOrder.status)
        : [];

    const handleStatusSave = useCallback(async () => {
        if (!detailedOrder || !token) return;
        setIsSaving(true);
        try {
            await OrderService.updateOrderStatus(
                detailedOrder.id,
                currentStatus,
                token,
                {
                    expectedCurrentStatus: detailedOrder.status,
                },
            );
            setDetailedOrder((prev) =>
                prev ? { ...prev, status: currentStatus } : prev,
            );
            onStatusUpdate?.(detailedOrder.id.toString(), currentStatus);
            toast.success("Order status updated");
            const history = await OrderService.getOrderStatusHistory(
                detailedOrder.id,
                token,
            );
            setStatusHistory(history);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to update status",
            );
            setCurrentStatus(detailedOrder.status || currentStatus);
        } finally {
            setIsSaving(false);
        }
    }, [detailedOrder, currentStatus, token, onStatusUpdate]);

    if (!show || !order) return null;

    const formatAddress = (addr: any) => {
        if (!addr) return "N/A";
        return [
            addr.localAddress || addr.streetAddress,
            addr.city,
            addr.district,
            addr.province,
        ]
            .filter(Boolean)
            .join(", ");
    };

    const getInitials = (fn: string, ln: string) =>
        `${(fn || "").charAt(0)}${(ln || "").charAt(0)}`.toUpperCase() || "U";

    const getVendorShipping = (vendorId: number) =>
        detailedOrder?.vendorShippingBreakdown?.find(
            (vb) => vb.vendorId === vendorId,
        );

    const groupItemsByVendor = () => {
        if (!detailedOrder?.orderItems) return [];
        const map = new Map<
            number,
            {
                vendorId: number;
                vendorName: string;
                vendorDistrict: string;
                vendorPhone?: string;
                vendorEmail?: string;
                items: typeof detailedOrder.orderItems;
                subtotal: number;
            }
        >();

        for (const item of detailedOrder.orderItems) {
            const vid = item.vendorId;
            const existing = map.get(vid);
            if (existing) {
                existing.items.push(item);
                existing.subtotal += Number(item.price) * item.quantity;
            } else {
                map.set(vid, {
                    vendorId: vid,
                    vendorName: item.vendor?.businessName || `Vendor #${vid}`,
                    vendorDistrict: item.vendor?.district?.name || "",
                    vendorPhone: item.vendor?.phoneNumber,
                    vendorEmail: item.vendor?.email,
                    items: [item],
                    subtotal: Number(item.price) * item.quantity,
                });
            }
        }
        return Array.from(map.values());
    };

    const vendors = groupItemsByVendor();
    const subtotal =
        detailedOrder?.merchandiseSubtotal != null
            ? Number(detailedOrder.merchandiseSubtotal)
            : detailedOrder?.orderItems?.reduce(
                  (sum, item) => sum + Number(item.price) * item.quantity,
                  0,
              ) || 0;
    const shippingFee = detailedOrder ? Number(detailedOrder.shippingFee) : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="order-modal order-detail-modal"
                style={{ maxWidth: "740px" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with order number + status */}
                <div className="order-detail__header">
                    <div>
                        <h2 className="order-detail__order-num">
                            {detailedOrder?.orderNumber || `#${order.id}`}
                        </h2>
                        <p className="order-detail__order-date">
                            {order.date || "N/A"}
                        </p>
                    </div>
                    <div className="order-detail__status-panel">
                        <span
                            className={`status-badge status-badge--${(detailedOrder?.status || "").toLowerCase()}`}
                        >
                            {detailedOrder?.status || "N/A"}
                        </span>
                        <span
                            className={`payment-badge payment-badge--${(detailedOrder?.paymentStatus || "").toLowerCase()}`}
                            style={{ marginLeft: 8 }}
                        >
                            {detailedOrder?.paymentStatus || "N/A"}
                        </span>
                        <button
                            type="button"
                            className="order-modal__close-btn order-detail__close-btn"
                            onClick={onClose}
                            aria-label="Close order details"
                            disabled={isSaving}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M18 6L6 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M6 6L18 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        {/* Inline status change — only ever offers transitions the
                backend will actually accept from the order's current status. */}
                        <div className="order-status-select">
                            <select
                                value={currentStatus}
                                onChange={(e) =>
                                    setCurrentStatus(e.target.value)
                                }
                                disabled={availableNextStatuses.length === 0}
                            >
                                {detailedOrder && (
                                    <option value={detailedOrder.status}>
                                        {
                                            getOrderStatusMeta(
                                                detailedOrder.status,
                                            ).label
                                        }{" "}
                                        (current)
                                    </option>
                                )}
                                {availableNextStatuses.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                className="order-status-select__save"
                                onClick={handleStatusSave}
                                disabled={
                                    isSaving ||
                                    currentStatus === detailedOrder?.status
                                }
                            >
                                {isSaving ? "Saving..." : "Update"}
                            </button>
                            {availableNextStatuses.length === 0 && (
                                <small
                                    style={{
                                        display: "block",
                                        color: "#9ca3af",
                                    }}
                                >
                                    This is a final status — no further
                                    transitions available.
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                <div className="order-modal__content">
                    {isLoading ? (
                        <div className="order-modal__loading">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="skeleton"
                                    style={{
                                        width: `${60 + i * 8}%`,
                                        height: 18,
                                        marginBottom: 10,
                                        borderRadius: 4,
                                    }}
                                />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="order-modal__error">
                            <p>{error}</p>
                        </div>
                    ) : detailedOrder ? (
                        <>
                            {/* Customer Info */}
                            <div className="order-section">
                                <h3 className="order-section__title">
                                    Customer
                                </h3>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 16,
                                    }}
                                >
                                    <div
                                        className="order-modal__profile"
                                        style={{
                                            width: 48,
                                            height: 48,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div
                                            className="order-modal__profile-placeholder"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                background: "#f0f0f0",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 18,
                                                color: "#666",
                                            }}
                                        >
                                            {getInitials(
                                                order.firstName,
                                                order.lastName,
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3
                                            style={{
                                                margin: "0 0 2px",
                                                fontSize: 16,
                                                fontWeight: 600,
                                                color: "#111827",
                                            }}
                                        >
                                            {detailedOrder.orderedBy
                                                ?.fullName ||
                                                detailedOrder.orderedBy
                                                    ?.username ||
                                                `${order.firstName} ${order.lastName}`}
                                        </h3>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 13,
                                                color: "#6b7280",
                                            }}
                                        >
                                            {detailedOrder.orderedBy?.email ||
                                                order.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info Grid */}
                            <div className="order-section">
                                <h3 className="order-section__title">
                                    Details
                                </h3>
                                <div className="order-info-grid">
                                    <div className="order-info-grid__item">
                                        <span className="order-info-grid__label">
                                            Phone
                                        </span>
                                        <span className="order-info-grid__value">
                                            {detailedOrder.phoneNumber ||
                                                order.phoneNumber ||
                                                "N/A"}
                                        </span>
                                    </div>
                                    <div className="order-info-grid__item">
                                        <span className="order-info-grid__label">
                                            Payment Method
                                        </span>
                                        <span className="order-info-grid__value">
                                            {detailedOrder.paymentMethod ||
                                                "N/A"}
                                        </span>
                                    </div>
                                    <div className="order-info-grid__item">
                                        <span className="order-info-grid__label">
                                            Total Items
                                        </span>
                                        <span className="order-info-grid__value">
                                            {detailedOrder.orderItems?.reduce(
                                                (t, i) => t + i.quantity,
                                                0,
                                            ) || 0}
                                        </span>
                                    </div>
                                    <div className="order-info-grid__item">
                                        <span className="order-info-grid__label">
                                            Vendors
                                        </span>
                                        <span className="order-info-grid__value">
                                            {vendors.length}
                                        </span>
                                    </div>
                                    <div className="order-info-grid__item">
                                        <span className="order-info-grid__label">
                                            Shipping Address
                                        </span>
                                        <span className="order-info-grid__value">
                                            {formatAddress(detailedOrder.shippingAddress)}
                                        </span>
                                        </div>

                                        <div className="order-info-grid__item">
                                            <span className="order-info-grid__label">
                                                Nearest Landmark
                                            </span>
                                            <span className="order-info-grid__value">
                                                {detailedOrder.shippingAddress?.landmark || "N/A"}
                                            </span>
                                        </div>
                                </div>
                            </div>

                            {/* Vendor-wise Breakdown */}
                            <div className="order-section">
                                <h3 className="order-section__title">
                                    Vendor Breakdown ({vendors.length})
                                </h3>
                                {vendors.map((vendor) => {
                                    const vendorShipping = getVendorShipping(
                                        vendor.vendorId,
                                    );
                                    const same = vendorShipping
                                        ? vendorShipping.shippingZone ===
                                          "SAME_DISTRICT"
                                        : null;
                                    return (
                                        <div
                                            key={vendor.vendorId}
                                            className="vendor-card"
                                        >
                                            <div className="vendor-card__header">
                                                <div>
                                                    <h4 className="vendor-card__name">
                                                        {vendor.vendorName}
                                                    </h4>
                                                    <span className="vendor-card__district">
                                                        {vendor.vendorDistrict ||
                                                            "Unknown District"}
                                                    </span>
                                                </div>
                                                {same !== null && (
                                                    <span
                                                        className={`vendor-card__shipping-badge ${same ? "vendor-card__shipping-badge--same" : "vendor-card__shipping-badge--cross"}`}
                                                    >
                                                        {same
                                                            ? "Same District"
                                                            : "Cross District"}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="vendor-card__items">
                                                {vendor.items.map((item) => {
                                                    const img =
                                                        item.imageSnapshot ||
                                                        item.product
                                                            ?.productImages?.[0] ||
                                                        item.variant
                                                            ?.variantImages?.[0];
                                                    const name =
                                                        item.productNameSnapshot ||
                                                        item.product?.name ||
                                                        "Unknown Product";
                                                    const sku =
                                                        item.skuSnapshot ||
                                                        item.variant?.sku;
                                                    const attrs =
                                                        item.variant
                                                            ?.attributes;
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="vendor-card__item"
                                                        >
                                                            <img
                                                                src={
                                                                    img ||
                                                                    defaultProductImage
                                                                }
                                                                alt={name}
                                                                className="vendor-card__item-img"
                                                                onError={(
                                                                    e,
                                                                ) => {
                                                                    (
                                                                        e.target as HTMLImageElement
                                                                    ).src =
                                                                        defaultProductImage as string;
                                                                }}
                                                            />
                                                            <div className="vendor-card__item-details">
                                                                <p className="vendor-card__item-name">
                                                                    {name}
                                                                </p>
                                                                <div className="vendor-card__item-meta">
                                                                    <span>
                                                                        Qty:{" "}
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                    </span>
                                                                    {sku && (
                                                                        <span>
                                                                            SKU:{" "}
                                                                            {
                                                                                sku
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {attrs &&
                                                                    Object.keys(
                                                                        attrs,
                                                                    ).length >
                                                                        0 && (
                                                                        <div className="vendor-card__variant-attrs">
                                                                            {Object.entries(
                                                                                attrs,
                                                                            ).map(
                                                                                ([
                                                                                    key,
                                                                                    val,
                                                                                ]) => (
                                                                                    <span
                                                                                        key={
                                                                                            key
                                                                                        }
                                                                                        className="vendor-card__variant-tag"
                                                                                    >
                                                                                        {
                                                                                            key
                                                                                        }

                                                                                        :{" "}
                                                                                        {
                                                                                            val
                                                                                        }
                                                                                    </span>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                            <div className="vendor-card__item-pricing">
                                                                <span className="vendor-card__item-total">
                                                                    Rs.{" "}
                                                                    {(
                                                                        Number(
                                                                            item.price,
                                                                        ) *
                                                                        item.quantity
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </span>
                                                                <span className="vendor-card__item-unit">
                                                                    Rs.{" "}
                                                                    {Number(
                                                                        item.price,
                                                                    ).toFixed(
                                                                        2,
                                                                    )}{" "}
                                                                    x{" "}
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="vendor-card__footer">
                                                <div className="vendor-card__footer-left">
                                                    <span className="vendor-card__footer-label">
                                                        Shipping
                                                    </span>
                                                    <span className="vendor-card__footer-shipping">
                                                        Rs.{" "}
                                                        {vendorShipping
                                                            ? vendorShipping.shippingFee.toFixed(
                                                                  2,
                                                              )
                                                            : "0.00"}
                                                    </span>
                                                </div>
                                                <div className="vendor-card__footer-right">
                                                    <span className="vendor-card__footer-label">
                                                        Items subtotal
                                                    </span>
                                                    <span className="vendor-card__footer-subtotal">
                                                        Rs.{" "}
                                                        {vendor.subtotal.toFixed(
                                                            2,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Order Summary */}
                            <div className="order-section">
                                <h3 className="order-section__title">
                                    Summary
                                </h3>
                                <div className="order-summary-box">
                                    <div className="order-summary-row">
                                        <span className="order-summary-row__label">
                                            Merchandise subtotal
                                        </span>
                                        <span className="order-summary-row__value">
                                            Rs. {subtotal.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="order-summary-row">
                                        <span className="order-summary-row__label">
                                            Total shipping ({vendors.length}{" "}
                                            vendor
                                            {vendors.length !== 1 ? "s" : ""})
                                        </span>
                                        <span className="order-summary-row__value">
                                            Rs. {shippingFee.toFixed(2)}
                                        </span>
                                    </div>
                                    {detailedOrder &&
                                        Number(detailedOrder.discountTotal) >
                                            0 && (
                                            <div className="order-summary-row">
                                                <span className="order-summary-row__label">
                                                    Discount
                                                </span>
                                                <span className="order-summary-row__value">
                                                    - Rs.{" "}
                                                    {Number(
                                                        detailedOrder.discountTotal,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    <div className="order-summary-row order-summary-row--total">
                                        <span className="order-summary-row__label">
                                            Total
                                        </span>
                                        <span className="order-summary-row__value">
                                            Rs.{" "}
                                            {detailedOrder
                                                ? Number(
                                                      detailedOrder.totalPrice,
                                                  ).toFixed(2)
                                                : "0.00"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status timeline — append-only audit trail, never
                  recomputed from the current order row. */}
                            {statusHistory.length > 0 && (
                                <div className="order-section">
                                    <h3 className="order-section__title">
                                        Status History
                                    </h3>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 10,
                                        }}
                                    >
                                        {statusHistory.map((entry) => (
                                            <div
                                                key={entry.id}
                                                style={{
                                                    display: "flex",
                                                    gap: 10,
                                                    fontSize: 13,
                                                    justifyContent:
                                                        "space-between",
                                                    background: "#fff",
                                                    padding: "12px 16px",
                                                    borderRadius: 8,
                                                    border: "1px solid #e5e7eb",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        minWidth: 130,
                                                        color: "#6b7280",
                                                    }}
                                                >
                                                    {new Date(
                                                        entry.createdAt,
                                                    ).toLocaleString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 10,
                                                        fontSize: 13,
                                                        alignItems: "flex-end",
                                                        justifyContent:
                                                            "space-end",
                                                    }}
                                                >
                                                    <strong>
                                                        {
                                                            getOrderStatusMeta(
                                                                entry.newStatus,
                                                            ).label
                                                        }
                                                    </strong>
                                                    {entry.previousStatus && (
                                                        <span
                                                            style={{
                                                                color: "#6b7280",
                                                            }}
                                                        >
                                                            {" "}
                                                            (from{" "}
                                                            {
                                                                getOrderStatusMeta(
                                                                    entry.previousStatus,
                                                                ).label
                                                            }
                                                            )
                                                        </span>
                                                    )}
                                                    <div
                                                        style={{
                                                            color: "#6b7280",
                                                        }}
                                                    >
                                                        by{" "}
                                                        {entry.changedByRole.toLowerCase()}
                                                        {entry.changedBy
                                                            ?.fullName
                                                            ? ` — ${entry.changedBy.fullName}`
                                                            : ""}
                                                        {entry.reason
                                                            ? ` · ${entry.reason}`
                                                            : ""}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                <div className="order-modal__footer">
                    <button
                        className="order-modal__button order-modal__button--secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
