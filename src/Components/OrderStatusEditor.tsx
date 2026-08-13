import React, { useState } from "react";
import {
    ALL_ORDER_STATUSES,
    getOrderStatusMeta,
    OrderStatusValue,
} from "./orderStatus";

interface OrderStatusEditorProps {
    currentStatus: string;
    onSubmit: (
        status: OrderStatusValue,
        reason: string,
        note: string,
    ) => Promise<void> | void;
    disabled?: boolean;
    isSaving?: boolean;
}

/** Shared status-change control used by both OrderEditModal (admin edit
 * flow) and OrderDetailModal (admin detail flow) — previously each modal
 * had its own separately-drifting copy of this dropdown+reason+note UI. */
const OrderStatusEditor: React.FC<OrderStatusEditorProps> = ({
    currentStatus,
    onSubmit,
    disabled,
    isSaving,
}) => {
    const current = currentStatus.toUpperCase() as OrderStatusValue;
    const [status, setStatus] = useState<OrderStatusValue | "">(
        current === "ASSIGNED_TO_RIDER" ? "" : current,
    );
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState("");
    const [note, setNote] = useState("");

    const selectedMeta = getOrderStatusMeta(status || current);
    const unchanged = !status || status === current;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (unchanged || !status) return;
        if (!reason.trim()) {
            setReasonError("Reason is required");
            return;
        }
        setReasonError("");
        await onSubmit(status, reason.trim(), note.trim());
    };

    return (
        <form className="order-status-editor" onSubmit={handleSubmit}>
            <label className="order-edit-modal__field">
                <span>New status</span>
                <select
                    value={status}
                    onChange={(event) =>
                        setStatus(event.target.value as OrderStatusValue)
                    }
                    disabled={disabled || isSaving}
                >
                    {current === "ASSIGNED_TO_RIDER" && <option value="" disabled>Select next status</option>}
                    {ALL_ORDER_STATUSES.filter((value) => value !== "ASSIGNED_TO_RIDER").map((value) => {
                        return (
                            <option
                                key={value}
                                value={value}
                            >
                                {getOrderStatusMeta(value).label}
                                {value === current
                                    ? " (current)"
                                    : ""}
                            </option>
                        );
                    })}
                </select>
            </label>

            <div className="order-edit-modal__status-preview">
                <span
                    className={`status-badge status-badge--${status.toLowerCase()}`}
                >
                    {selectedMeta.label}
                </span>
                <p>{selectedMeta.description}</p>
            </div>

            <label className="order-edit-modal__field">
                <span>Reason *</span>
                <input
                    type="text"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Required — shown in the status history"
                    disabled={disabled || isSaving}
                />
                {reasonError && (
                    <small style={{ color: "#dc2626" }}>{reasonError}</small>
                )}
            </label>

            <label className="order-edit-modal__field">
                <span>Note</span>
                <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Optional note for this update"
                    rows={3}
                    disabled={disabled || isSaving}
                />
            </label>

            <button
                type="submit"
                className="order-modal__button order-modal__button--primary"
                disabled={disabled || isSaving || unchanged}
            >
                {isSaving ? "Updating..." : "Update status"}
            </button>
        </form>
    );
};

export default OrderStatusEditor;
