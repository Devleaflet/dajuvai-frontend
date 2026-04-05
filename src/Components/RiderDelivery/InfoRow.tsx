import React from "react";

export default function InfoRow({
    icon,
    label,
    value,
}: {
    icon: string;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="rd-info-row">
            <span className="rd-info-icon">{icon}</span>
            <div>
                <div className="rd-info-label">{label}</div>
                <div className="rd-info-value">{value || "N/A"}</div>
            </div>
        </div>
    );
}
