import React from "react";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "../../types/delivery";

export default function StatusBadge({ status }: { status: string }) {
    const color = ORDER_STATUS_COLORS[status] ?? "#6b7280";
    const label = ORDER_STATUS_LABELS[status] ?? status;
    return (
        <span className="rd-badge" style={{ background: color }}>
            {label}
        </span>
    );
}
