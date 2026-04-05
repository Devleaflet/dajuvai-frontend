import React from "react";
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from "../../types/delivery";

export default function StatusBadge({ status }: { status: string }) {
    const color = DELIVERY_STATUS_COLORS[status] ?? "#6b7280";
    const label = DELIVERY_STATUS_LABELS[status] ?? status;
    return (
        <span className="rd-badge" style={{ background: color }}>
            {label}
        </span>
    );
}
