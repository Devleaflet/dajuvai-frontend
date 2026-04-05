import React, { useState } from "react";
import type { DeliveryAssignment } from "../../types/delivery";
import StatusBadge from "./StatusBadge";
import InfoRow from "./InfoRow";

export interface ModalState {
    assignment: DeliveryAssignment;
    action: "pickup" | "delivered" | "failed";
}

export default function StatusModal({
    modal,
    onClose,
    onPickup,
    onDelivered,
    onFailed,
    submitting,
}: {
    modal: ModalState;
    onClose: () => void;
    onPickup: (id: number) => void;
    onDelivered: (id: number) => void;
    onFailed: (id: number, reason: string) => void;
    submitting: boolean;
}) {
    const [failReason, setFailReason] = useState("");
    const { assignment, action } = modal;
    const orderId = assignment.orderId;
    const order = assignment.order;

    const address = order?.shippingAddress
        ? [
              order.shippingAddress.localAddress,
              order.shippingAddress.city,
              order.shippingAddress.district,
          ]
              .filter(Boolean)
              .join(", ")
        : "N/A";

    return (
        <div className="rd-modal-overlay" onClick={onClose}>
            <div className="rd-modal" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="rd-modal-header">
                    <div>
                        <p className="rd-modal-order-label">Order</p>
                        <h2 className="rd-modal-order-id">#{orderId}</h2>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                        }}
                    >
                        <StatusBadge status={assignment.assignmentStatus} />
                        <button
                            className="rd-modal-close"
                            onClick={onClose}
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Order Details */}
                <div className="rd-modal-body">
                    <div className="rd-modal-section-title">
                        Delivery Details
                    </div>
                    <div className="rd-modal-detail-grid">
                        <InfoRow
                            icon="👤"
                            label="Customer"
                            value={order?.orderedBy?.username}
                        />
                        <InfoRow
                            icon="📞"
                            label="Phone"
                            value={order?.orderedBy?.phoneNumber}
                        />
                        <InfoRow icon="📍" label="Address" value={address} />
                        <InfoRow
                            icon="💰"
                            label="Total Amount"
                            value={
                                order
                                    ? `Rs. ${parseFloat(String(order.totalPrice)).toFixed(2)}`
                                    : undefined
                            }
                        />
                        <InfoRow
                            icon="💳"
                            label="Payment"
                            value={order?.paymentMethod?.replace(/_/g, " ")}
                        />
                        <InfoRow
                            icon="📅"
                            label="Assigned At"
                            value={
                                assignment.createdAt
                                    ? new Date(
                                          assignment.createdAt,
                                      ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      })
                                    : undefined
                            }
                        />
                        {assignment.pickedUpAt && (
                            <InfoRow
                                icon="📦"
                                label="Picked Up At"
                                value={new Date(
                                    assignment.pickedUpAt,
                                ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            />
                        )}
                        {assignment.failureReason && (
                            <InfoRow
                                icon="⚠️"
                                label="Failure Reason"
                                value={
                                    <span style={{ color: "#ef4444" }}>
                                        {assignment.failureReason}
                                    </span>
                                }
                            />
                        )}
                    </div>

                    {/* Order Items */}
                    {order?.orderItems && order.orderItems.length > 0 && (
                        <>
                            <div
                                className="rd-modal-section-title"
                                style={{ marginTop: "1.25rem" }}
                            >
                                Items ({order.orderItems.length})
                            </div>
                            <div className="rd-modal-items">
                                {order.orderItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rd-modal-item"
                                    >
                                        <span className="rd-modal-item-name">
                                            {item.product?.name ??
                                                `Product #${item.productId}`}
                                        </span>
                                        <span className="rd-modal-item-qty">
                                            ×{item.quantity}
                                        </span>
                                        <span className="rd-modal-item-price">
                                            Rs.{" "}
                                            {parseFloat(
                                                String(item.price),
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Action Section */}
                <div className="rd-modal-footer">
                    {action === "pickup" && (
                        <div className="rd-modal-action-panel rd-modal-action-panel--blue">
                            <p className="rd-modal-action-desc">
                                Confirm that you have picked up this order from
                                the warehouse and are ready to deliver.
                            </p>
                            <div className="rd-modal-action-btns">
                                <button
                                    className="rd-btn rd-btn--cancel"
                                    onClick={onClose}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="rd-btn rd-btn--pickup"
                                    onClick={() => onPickup(orderId)}
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? "⏳ Confirming..."
                                        : "📦 Confirm Pickup"}
                                </button>
                            </div>
                        </div>
                    )}

                    {action === "delivered" && (
                        <div className="rd-modal-action-panel rd-modal-action-panel--green">
                            <p className="rd-modal-action-desc">
                                Confirm that this order has been successfully
                                delivered to the customer.
                            </p>
                            <div className="rd-modal-action-btns">
                                <button
                                    className="rd-btn rd-btn--cancel"
                                    onClick={onClose}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="rd-btn rd-btn--delivered"
                                    onClick={() => onDelivered(orderId)}
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? "⏳ Marking..."
                                        : "✅ Mark as Delivered"}
                                </button>
                            </div>
                        </div>
                    )}

                    {action === "failed" && (
                        <div className="rd-modal-action-panel rd-modal-action-panel--red">
                            <label className="rd-modal-fail-label">
                                Reason for failure *
                            </label>
                            <textarea
                                className="rd-modal-fail-input"
                                rows={3}
                                placeholder="e.g. Customer not available, Wrong address, No one home..."
                                value={failReason}
                                onChange={(e) => setFailReason(e.target.value)}
                            />
                            <div className="rd-modal-action-btns">
                                <button
                                    className="rd-btn rd-btn--cancel"
                                    onClick={onClose}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="rd-btn rd-btn--failed-submit"
                                    onClick={() =>
                                        onFailed(orderId, failReason)
                                    }
                                    disabled={submitting || !failReason.trim()}
                                >
                                    {submitting
                                        ? "⏳ Submitting..."
                                        : "❌ Mark as Failed"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
