import React from "react";
import type { DeliveryAssignment } from "../../types/delivery";
import StatusBadge from "./StatusBadge";

interface Props {
    completed: DeliveryAssignment[];
}

export default function CompletedAssignments({ completed }: Props) {
    if (completed.length === 0) return null;

    return (
        <section className="rd-section">
            <h2 className="rd-section-title">
                History ({completed.length})
            </h2>
            <div className="rd-grid">
                {completed.map((assignment) => {
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
                            className="rd-card rd-card--completed"
                        >
                            <div className="rd-card-top">
                                <div className="rd-card-id">
                                    Order #{assignment.orderId}
                                </div>
                                <StatusBadge status={status} />
                            </div>
                            <div className="rd-card-info">
                                <div className="rd-card-detail">
                                    <span className="rd-card-detail-icon">
                                        👤
                                    </span>
                                    <span>
                                        {order?.orderedBy?.username ?? "N/A"}
                                    </span>
                                </div>
                                <div className="rd-card-detail rd-card-detail--full">
                                    <span className="rd-card-detail-icon">
                                        📍
                                    </span>
                                    <span>{address}</span>
                                </div>
                                {assignment.failureReason && (
                                    <div className="rd-card-detail rd-card-detail--full rd-card-detail--fail">
                                        <span className="rd-card-detail-icon">
                                            ⚠️
                                        </span>
                                        <span>
                                            {assignment.failureReason}
                                        </span>
                                    </div>
                                )}
                                {assignment.deliveredAt && (
                                    <div className="rd-card-detail">
                                        <span className="rd-card-detail-icon">
                                            ✅
                                        </span>
                                        <span>
                                            {new Date(
                                                assignment.deliveredAt,
                                            ).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
