import "./ViewModal.css";
import React, { useState } from "react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import VendorDashboardService from "../../services/vendorDashboardService";
import { toast } from "react-hot-toast";
import "../../Styles/OrderModals.css";
import defaultProductImage from "../../assets/logo.webp";

type VendorFulfillmentStatus =
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";

// Mirrors backend VENDOR_ORDER_STATUS_TRANSITIONS (orderVendorShipping.entity.ts)
const VENDOR_STATUS_TRANSITIONS: Record<
    VendorFulfillmentStatus,
    VendorFulfillmentStatus[]
> = {
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: [],
    DELIVERED: [],
    CANCELLED: [],
};

const VENDOR_STATUS_LABEL: Record<string, string> = {
    CONFIRMED: "Confirmed",
    PROCESSING: "Mark as Processing",
    SHIPPED: "Mark as Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Reject Order",
};

interface OrderItem {
    id: number;
    productId: number;
    quantity: number;
    price: string;
    variantId?: number | null;
    productNameSnapshot?: string | null;
    skuSnapshot?: string | null;
    imageSnapshot?: string | null;
    unitPriceSnapshot?: number | null;
    product: {
        id: number;
        name: string;
        productImages: string[];
        basePrice?: number;
    } | null;
    vendor: {
        id: number;
        businessName: string;
        district?: { id: number; name: string };
    };
    vendorId?: number;
    variant?: {
        id: number;
        sku: string;
        attributes?: Record<string, string>;
        variantImages?: string[];
    } | null;
}

// Vendor-scoped view (mirrors the backend's SanitizedVendorOrderView): no
// order-wide totalPrice/shippingFee here on purpose — a vendor must never
// see the full marketplace order total or another vendor's shipping fee.
export interface VendorOrderDetail {
    id: number;
    orderNumber?: string;
    orderedBy: {
        id: number;
        name?: string;
        fullName?: string;
        username: string;
        email: string;
        phoneNumber?: string;
        phone?: string;
    };
    shippingAddress: {
        province: string;
        district: string;
        city: string;
        localAddress?: string;
    };
    orderItems: OrderItem[];
    itemsSubtotal: number;
    discountAllocation: number;
    vendorPayable: number;
    ownShippingFee: number | null;
    ownShippingZone: "SAME_DISTRICT" | "CROSS_DISTRICT" | null;
    fulfillmentStatus: VendorFulfillmentStatus | null;
    paymentStatus: string;
    paymentMethod: string;
    status: string;
    createdAt: string;
}

interface Order {
    id: number;
    orderId: string;
    orderNumber?: string;
    orderedBy: string;
    product: string;
    createdAt: string;
    price: number;
    paymentStatus: string;
    status: string;
}

interface ViewModalProps {
    show: boolean;
    onClose: () => void;
    order: Order | null;
    orderDetail: VendorOrderDetail | null;
    /** Called after a successful fulfillment-status update so the parent
     * list/modal can refresh from the server response. */
    onStatusChanged?: () => void;
}

const ViewModal: React.FC<ViewModalProps> = ({
    show,
    onClose,
    order,
    orderDetail,
    onStatusChanged,
}) => {
    const { authState } = useVendorAuth();
    const vendorId = authState.vendor?.id;
    const [isUpdating, setIsUpdating] = useState(false);

    if (!show || !order || !orderDetail) return null;

    const nextStatuses = orderDetail.fulfillmentStatus
        ? (VENDOR_STATUS_TRANSITIONS[orderDetail.fulfillmentStatus] ?? [])
        : [];

    const handleStatusChange = async (next: VendorFulfillmentStatus) => {
        if (!authState.token) return;
        if (
            next === "CANCELLED" &&
            !window.confirm("Reject this order? This cannot be undone.")
        )
            return;

        setIsUpdating(true);
        try {
            await VendorDashboardService.getInstance().updateVendorOrderStatus(
                authState.token,
                orderDetail.id,
                next as "PROCESSING" | "SHIPPED" | "CANCELLED",
            );
            toast.success("Order status updated");
            onStatusChanged?.();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to update status",
            );
        } finally {
            setIsUpdating(false);
        }
    };

    // The backend already scopes orderItems to this vendor only; the filter
    // here is just a defensive no-op, not the source of the scoping.
    const vendorItems = vendorId
        ? orderDetail.orderItems.filter(
              (item) =>
                  item.vendorId === vendorId || item.vendor?.id === vendorId,
          )
        : orderDetail.orderItems;

    const orderDate = new Date(orderDetail.createdAt);

    console.log("Order:");
    console.log(order);
    console.log("Order Detail:");
    console.log(orderDetail);

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.55)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: "40px 16px",
                overflowY: "auto",
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 680,
                    maxHeight: "90vh",
                    overflowY: "auto",
                    background: "#fff",
                    color: "#1a1a1a",
                    fontFamily: "inherit",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "0",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="order-detail__header">
                    <div>
                        <h2 className="order-detail__order-num">
                            Order #{orderDetail.orderNumber || order.orderId}
                        </h2>
                        <p className="order-detail__order-date">
                            {orderDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })}{" "}
                            {orderDate.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <span
                            className={`status-badge status-badge--${(orderDetail.status || "").toLowerCase()}`}
                        >
                            {orderDetail.status}
                        </span>
                        <button
                            style={{
                                border: "1px solid #d1d5db",
                                borderRadius: 8,
                                background: "#fff",
                                color: "#374151",
                                padding: "6px 14px",
                                fontSize: 14,
                                cursor: "pointer",
                                fontWeight: 500,
                            }}
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div style={{ padding: "0 24px 24px" }}>
                    {/* Customer Info */}
                    <div className="order-section">
                        <h3 className="order-section__title">Customer</h3>
                        <div className="order-info-grid">
                            <div className="order-info-grid__item">
                                <span className="order-info-grid__label">
                                    Name
                                </span>
                                <span className="order-info-grid__value">
                                    {orderDetail.orderedBy.fullName ||
                                        orderDetail.orderedBy.name ||
                                        orderDetail.orderedBy.username ||
                                        "Unknown Customer"}
                                </span>
                            </div>
                            <div className="order-info-grid__item">
                                <span className="order-info-grid__label">
                                    Phone
                                </span>
                                <span className="order-info-grid__value">
                                    {orderDetail.orderedBy.phoneNumber ||
                                        orderDetail.orderedBy.phone ||
                                        "N/A"}
                                </span>
                            </div>
                            <div className="order-info-grid__item">
                                <span className="order-info-grid__label">
                                    Email
                                </span>
                                <span
                                    className="order-info-grid__value"
                                    style={{ wordBreak: "break-all" }}
                                >
                                    {orderDetail.orderedBy.email}
                                </span>
                            </div>
                            <div className="order-info-grid__item">
                                <span className="order-info-grid__label">
                                    Payment
                                </span>
                                <span className="order-info-grid__value">
                                    {orderDetail.paymentMethod}
                                </span>
                            </div>
                            <div className="order-info-grid__item order-info-grid__item--full">
                                <span className="order-info-grid__label">
                                    Shipping Address
                                </span>
                                <span className="order-info-grid__value">
                                    {[
                                        orderDetail.shippingAddress
                                            .localAddress,
                                        orderDetail.shippingAddress.city,
                                        orderDetail.shippingAddress.district,
                                        orderDetail.shippingAddress.province,
                                    ]
                                        .filter(Boolean)
                                        .join(", ") || "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Items — only vendor's items */}
                    <div className="order-section">
                        <h3 className="order-section__title">
                            Your Items ({vendorItems.length} item
                            {vendorItems.length !== 1 ? "s" : ""})
                        </h3>
                        {vendorItems.map((item) => {
                            const img =
                                item.imageSnapshot ||
                                item.product?.productImages?.[0] ||
                                item.variant?.variantImages?.[0];
                            const name =
                                item.productNameSnapshot ||
                                item.product?.name ||
                                "Unknown Product";
                            const sku = item.skuSnapshot || item.variant?.sku;
                            const attrs = item.variant?.attributes;
                            const unitPrice = parseFloat(String(item.price));
                            const lineTotal = unitPrice * item.quantity;

                            return (
                                <div
                                    key={item.id}
                                    className="order-modal__item-row"
                                >
                                    <img
                                        src={img || defaultProductImage}
                                        alt={name}
                                        className="order-modal__item-img"
                                        onError={(e) => {
                                            (
                                                e.target as HTMLImageElement
                                            ).src =
                                                defaultProductImage as string;
                                        }}
                                    />
                                    <div className="order-modal__item-info">
                                        <p className="order-modal__item-name">
                                            {name}
                                        </p>
                                        <div className="order-modal__item-meta">
                                            Qty: {item.quantity}
                                            {sku && (
                                                <span style={{ marginLeft: 8 }}>
                                                    SKU: {sku}
                                                </span>
                                            )}
                                        </div>
                                        {attrs &&
                                            Object.keys(attrs).length > 0 && (
                                                <div
                                                    className="vendor-card__variant-attrs"
                                                    style={{ marginTop: 4 }}
                                                >
                                                    {Object.entries(attrs).map(
                                                        ([key, val]) => (
                                                            <span
                                                                key={key}
                                                                className="vendor-card__variant-tag"
                                                            >
                                                                {key}: {val}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                    <div className="order-modal__item-pricing">
                                        <div
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: "#111827",
                                            }}
                                        >
                                            Rs. {lineTotal.toFixed(2)}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "#6b7280",
                                            }}
                                        >
                                            Rs. {unitPrice.toFixed(2)} x{" "}
                                            {item.quantity}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {vendorItems.length === 0 && (
                            <div
                                style={{
                                    padding: 20,
                                    textAlign: "center",
                                    color: "#9ca3af",
                                    fontSize: 14,
                                }}
                            >
                                No items found for this vendor.
                            </div>
                        )}
                    </div>

                    {/* Summary — merchandise only; shipping is a separate
                        fulfillment line, never mixed into the payable total,
                        and never includes another vendor's amounts. */}
                    <div className="order-section">
                        <h3 className="order-section__title">Your Summary</h3>
                        <div className="order-summary-box">
                            <div className="order-summary-row">
                                <span className="order-summary-row__label">
                                    Items subtotal
                                </span>
                                <span className="order-summary-row__value">
                                    Rs. {orderDetail.itemsSubtotal.toFixed(2)}
                                </span>
                            </div>
                            {orderDetail.discountAllocation > 0 && (
                                <div className="order-summary-row">
                                    <span className="order-summary-row__label">
                                        Discount allocation
                                    </span>
                                    <span className="order-summary-row__value">
                                        - Rs.{" "}
                                        {orderDetail.discountAllocation.toFixed(
                                            2,
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="order-summary-row order-summary-row--total">
                                <span className="order-summary-row__label">
                                    Vendor payable
                                </span>
                                <span className="order-summary-row__value">
                                    Rs. {orderDetail.vendorPayable.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Vendor actions — only ever offers transitions this
                        vendor is actually allowed to make; delivered/other
                        vendors' status changes are never available here.
                        Disabled for now: vendors aren't allowed to change
                        order status yet (only admin/delivery are) - the
                        transition logic and API call stay intact so this can
                        be re-enabled later by removing the `false &&`. */}
                    {false && nextStatuses.length > 0 && (
                        <div className="order-section">
                            <h3 className="order-section__title">Actions</h3>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                {nextStatuses.map((next) => (
                                    <button
                                        key={next}
                                        onClick={() => handleStatusChange(next)}
                                        disabled={isUpdating}
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: 8,
                                            border:
                                                next === "CANCELLED"
                                                    ? "1px solid #dc2626"
                                                    : "1px solid #16a34a",
                                            background:
                                                next === "CANCELLED"
                                                    ? "#fff"
                                                    : "#16a34a",
                                            color:
                                                next === "CANCELLED"
                                                    ? "#dc2626"
                                                    : "#fff",
                                            fontWeight: 500,
                                            cursor: isUpdating
                                                ? "not-allowed"
                                                : "pointer",
                                        }}
                                    >
                                        {isUpdating
                                            ? "Updating…"
                                            : VENDOR_STATUS_LABEL[next]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewModal;
