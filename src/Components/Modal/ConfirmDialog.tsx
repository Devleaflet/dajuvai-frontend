import React from "react";
import "../../Styles/ConfirmDialog.css";

interface ConfirmDialogProps {
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    tone?: "danger" | "default";
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    isLoading = false,
    tone = "default",
    onConfirm,
    onCancel,
}) => {
    return (
        <div className="confirm-dialog">
            <div
                className="confirm-dialog__overlay"
                onClick={isLoading ? undefined : onCancel}
            />
            <div className="confirm-dialog__content" role="alertdialog">
                <h3 className="confirm-dialog__title">{title}</h3>
                <div className="confirm-dialog__message">{message}</div>
                <div className="confirm-dialog__actions">
                    <button
                        className="confirm-dialog__cancel-btn"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        className={`confirm-dialog__confirm-btn ${
                            tone === "danger"
                                ? "confirm-dialog__confirm-btn--danger"
                                : ""
                        }`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Working…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
