import React from "react";
import type { DeliveryAssignment } from "../../types/delivery";
import { AssignmentStatus } from "../../types/delivery";
import StatusBadge from "./StatusBadge";
import { ModalState } from "./StatusModal";

interface Props {
    active: DeliveryAssignment[];
    openModal: (assignment: DeliveryAssignment, action: ModalState["action"]) => void;
}

export default function ActiveAssignments({ active, openModal }: Props) {
    if (active.length === 0) return null;

    return (
        <section className="rd-section">
            <h2 className="rd-section-title">
                Active ({active.length})
            </h2>
            <div className="rd-grid">
                {active.map((assignment) => {
                    const order = assignment.order;
                    const status = assignment.assignmentStatus;
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
                        <div
                            key={assignment.id}
                            className="rd-card rd-card--active"
                        >
                            {/* Card Top */}
                            <div className="rd-card-top">
                                <div className="rd-card-id">
                                    Order #{assignment.orderId}
                                </div>
                                <StatusBadge status={status} />
                            </div>

                            {/* Card Info */}
                            <div className="rd-card-info">
                                <div className="rd-card-detail">
                                    <span className="rd-card-detail-icon">
                                        👤
                                    </span>
                                    <span>
                                        {order?.orderedBy?.username ?? "N/A"}
                                    </span>
                                </div>
                                <div className="rd-card-detail">
                                    <span className="rd-card-detail-icon">
                                        📞
                                    </span>
                                    <span>
                                        {order?.orderedBy?.phoneNumber ?? "N/A"}
                                    </span>
                                </div>
                                <div className="rd-card-detail rd-card-detail--full">
                                    <span className="rd-card-detail-icon">
                                        📍
                                    </span>
                                    <span>{address}</span>
                                </div>
                                <div className="rd-card-detail">
                                    <span className="rd-card-detail-icon">
                                        💰
                                    </span>
                                    <span>
                                        {order
                                            ? `Rs. ${parseFloat(String(order.totalPrice)).toFixed(2)}`
                                            : "N/A"}
                                    </span>
                                </div>
                                <div className="rd-card-detail">
                                    <span className="rd-card-detail-icon">
                                        💳
                                    </span>
                                    <span>
                                        {order?.paymentMethod?.replace(/_/g, " ") ?? "N/A"}
                                    </span>
                                </div>
                            </div>

                            {/* Card Actions */}
                            <div className="rd-card-actions">
                                <button
                                    className="rd-card-action-btn rd-card-action-btn--detail"
                                    onClick={() =>
                                        openModal(
                                            assignment,
                                            status === AssignmentStatus.ASSIGNED
                                                ? "pickup"
                                                : "delivered",
                                        )
                                    }
                                >
                                    {status === AssignmentStatus.ASSIGNED
                                        ? "Confirm Pickup"
                                        : "Mark Delivered"}
                                </button>
                                <button
                                    className="rd-card-action-btn rd-card-action-btn--fail"
                                    onClick={() => openModal(assignment, "failed")}
                                >
                                    Report Failure
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
