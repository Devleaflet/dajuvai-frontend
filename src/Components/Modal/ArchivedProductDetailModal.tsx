import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { restoreProduct, restoreVariant } from "../../api/products";
import ConfirmDialog from "./ConfirmDialog";
import "../../Styles/NewProductModal.css";

interface ArchivedProductDetailModalProps {
    item: any;
    token?: string;
    onClose: () => void;
    onRestored: () => void;
}

const formatAttributes = (attrs: any): string => {
    if (!attrs || typeof attrs !== "object") return "";
    return Object.entries(attrs)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
};

const ArchivedProductDetailModal: React.FC<ArchivedProductDetailModalProps> = ({
    item,
    token,
    onClose,
    onRestored,
}) => {
    const [selectedVariantIds, setSelectedVariantIds] = useState<Set<number>>(
        new Set(),
    );
    const [isRestoring, setIsRestoring] = useState(false);
    const [confirmAction, setConfirmAction] = useState<
        | { type: "product" }
        | { type: "variants"; ids: number[] }
        | null
    >(null);

    const archivedVariants: any[] = item.archivedVariants || [];
    const activeVariants: any[] = item.variants || [];

    const toggleVariant = (variantId: number) => {
        setSelectedVariantIds((prev) => {
            const next = new Set(prev);
            if (next.has(variantId)) next.delete(variantId);
            else next.add(variantId);
            return next;
        });
    };

    const runRestoreProduct = async () => {
        setIsRestoring(true);
        try {
            await restoreProduct(item.id, token);
            toast.success(`"${item.name}" restored`);
            onRestored();
            onClose();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || "Failed to restore product",
            );
        } finally {
            setIsRestoring(false);
            setConfirmAction(null);
        }
    };

    const runRestoreVariants = async (ids: number[]) => {
        setIsRestoring(true);
        try {
            for (const id of ids) {
                await restoreVariant(item.id, id, token);
            }
            toast.success(
                ids.length > 1
                    ? `${ids.length} variants restored`
                    : "Variant restored",
            );
            setSelectedVariantIds(new Set());
            onRestored();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || "Failed to restore variant",
            );
        } finally {
            setIsRestoring(false);
            setConfirmAction(null);
        }
    };

    return (
        <div className="new-product-modal-overlay">
            {/* Deliberately using the shared .new-product-modal height as-is
                (same fixed height the create/edit form uses) instead of a
                custom "shrink to content" override - two attempts at that
                broke the flex/sticky-footer layout (content got crushed or
                the footer overlapped it). The overlay backdrop showing below
                a short modal is the same behavior the create/edit modal
                already has and is not a bug. */}
            <style>{`
                .archived-detail-value { display: flex; align-items: center; min-height: 1.25rem; }
            `}</style>
            <div
                className="new-product-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="new-product-modal-header">
                    <h2 className="new-product-modal-title">{item.name}</h2>
                    <button
                        className="new-product-modal-close"
                        onClick={onClose}
                    >
                        <svg viewBox="0 0 24 24" fill="none">
                            <path
                                d="M18 6L6 18M6 6l12 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>

                <div className="new-product-modal-body">
                    <div
                        className={`form-section ${
                            item.isProductArchived
                                ? "archived-status--product"
                                : "archived-status--variants"
                        }`}
                        style={{
                            background: item.isProductArchived
                                ? "#fef2f2"
                                : "#fffbeb",
                            border: `1px solid ${
                                item.isProductArchived ? "#fecaca" : "#fde68a"
                            }`,
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontWeight: 600,
                                color: item.isProductArchived
                                    ? "#b91c1c"
                                    : "#b45309",
                            }}
                        >
                            {item.isProductArchived
                                ? "This whole product is archived."
                                : `The product is active. ${archivedVariants.length} variant(s) archived.`}
                        </p>
                    </div>

                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" />
                                </svg>
                            </div>
                            <h3 className="section-title">
                                Product Information
                            </h3>
                        </div>
                        <div className="form-grid two-columns">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <div className="form-input archived-detail-value">{item.name}</div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Brand</label>
                                <div className="form-input archived-detail-value">
                                    {item.brand || "—"}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <div className="form-input archived-detail-value">
                                    {item.subcategory?.name || "—"}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Vendor</label>
                                <div className="form-input archived-detail-value">
                                    {item.vendor?.businessName || "—"}
                                </div>
                            </div>
                            {item.description && (
                                <div className="form-group full-width">
                                    <label className="form-label">
                                        Description
                                    </label>
                                    <div className="form-input archived-detail-value">
                                        {item.description}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {!item.hasVariants && (
                        <div className="form-section">
                            <div className="section-header">
                                <div className="section-icon">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" />
                                    </svg>
                                </div>
                                <h3 className="section-title">
                                    Pricing &amp; Stock
                                </h3>
                            </div>
                            <div className="form-grid two-columns">
                                <div className="form-group">
                                    <label className="form-label">
                                        Base Price
                                    </label>
                                    <div className="form-input archived-detail-value">
                                        Rs. {item.basePrice ?? "—"}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Stock
                                    </label>
                                    <div className="form-input archived-detail-value">
                                        {item.stock ?? "—"}
                                    </div>
                                </div>
                            </div>
                            {item.productImages?.length > 0 && (
                                <div className="image-preview-grid">
                                    {item.productImages.map(
                                        (url: string, i: number) => (
                                            <div
                                                key={i}
                                                className="image-preview"
                                            >
                                                <img src={url} alt="" />
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {item.hasVariants && (
                        <div className="form-section">
                            <div className="section-header">
                                <div className="section-icon">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" />
                                    </svg>
                                </div>
                                <h3 className="section-title">Variants</h3>
                            </div>

                            {activeVariants.map((variant: any, index: number) => (
                                <div
                                    key={variant.id}
                                    className="variant-card"
                                >
                                    <div className="variant-header">
                                        <div className="variant-title">
                                            <span className="variant-number">
                                                {index + 1}
                                            </span>
                                            {formatAttributes(
                                                variant.attributes,
                                            ) || variant.sku}
                                            <span
                                                className="archived-tab__badge"
                                                style={{
                                                    marginLeft: 10,
                                                    background: "#dcfce7",
                                                    color: "#166534",
                                                }}
                                            >
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                    <div className="form-grid three-columns">
                                        <div className="form-group">
                                            <label className="form-label">
                                                SKU
                                            </label>
                                            <div className="form-input archived-detail-value">
                                                {variant.sku}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">
                                                Price
                                            </label>
                                            <div className="form-input archived-detail-value">
                                                Rs. {variant.basePrice}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">
                                                Stock
                                            </label>
                                            <div className="form-input archived-detail-value">
                                                {variant.stock}
                                            </div>
                                        </div>
                                    </div>
                                    {variant.variantImages?.length > 0 && (
                                        <div className="image-preview-grid">
                                            {variant.variantImages.map(
                                                (url: string, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="image-preview"
                                                    >
                                                        <img src={url} alt="" />
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {archivedVariants.map(
                                (variant: any, index: number) => (
                                    <div
                                        key={variant.id}
                                        className="variant-card"
                                        style={{
                                            background: "#fffbeb",
                                            borderColor: "#fde68a",
                                        }}
                                    >
                                        <div className="variant-header">
                                            <div className="variant-title">
                                                {item.isProductArchived ? (
                                                    <>
                                                        <span className="variant-number">
                                                            {activeVariants.length +
                                                                index +
                                                                1}
                                                        </span>
                                                        {formatAttributes(
                                                            variant.attributes,
                                                        ) || variant.sku}
                                                    </>
                                                ) : (
                                                    <label className="variant-checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            className="variant-select-checkbox"
                                                            checked={selectedVariantIds.has(
                                                                variant.id,
                                                            )}
                                                            onChange={() =>
                                                                toggleVariant(
                                                                    variant.id,
                                                                )
                                                            }
                                                        />
                                                        <span className="variant-number">
                                                            {activeVariants.length +
                                                                index +
                                                                1}
                                                        </span>
                                                        {formatAttributes(
                                                            variant.attributes,
                                                        ) || variant.sku}
                                                    </label>
                                                )}
                                                <span
                                                    className="archived-tab__badge"
                                                    style={{
                                                        marginLeft: 10,
                                                        background: "#fef3c7",
                                                        color: "#b45309",
                                                    }}
                                                >
                                                    Archived
                                                </span>
                                            </div>
                                            {!item.isProductArchived && (
                                                <button
                                                    type="button"
                                                    className="archived-tab__restore-btn"
                                                    disabled={isRestoring}
                                                    onClick={() =>
                                                        setConfirmAction({
                                                            type: "variants",
                                                            ids: [variant.id],
                                                        })
                                                    }
                                                >
                                                    Restore
                                                </button>
                                            )}
                                        </div>
                                        <div className="form-grid three-columns">
                                            <div className="form-group">
                                                <label className="form-label">
                                                    SKU
                                                </label>
                                                <div className="form-input archived-detail-value">
                                                    {variant.sku}
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">
                                                    Price
                                                </label>
                                                <div className="form-input archived-detail-value">
                                                    Rs. {variant.basePrice}
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">
                                                    Stock
                                                </label>
                                                <div className="form-input archived-detail-value">
                                                    {variant.stock}
                                                </div>
                                            </div>
                                        </div>
                                        {variant.variantImages?.length > 0 && (
                                            <div className="image-preview-grid">
                                                {variant.variantImages.map(
                                                    (
                                                        url: string,
                                                        i: number,
                                                    ) => (
                                                        <div
                                                            key={i}
                                                            className="image-preview"
                                                        >
                                                            <img
                                                                src={url}
                                                                alt=""
                                                            />
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>

                <div className="new-product-modal-footer">
                    <div className="button-group" style={{ padding: 0 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-cancel"
                        >
                            Close
                        </button>
                        {item.isProductArchived ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={isRestoring}
                                onClick={() =>
                                    setConfirmAction({ type: "product" })
                                }
                            >
                                Restore Product
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={
                                    isRestoring || selectedVariantIds.size === 0
                                }
                                onClick={() =>
                                    setConfirmAction({
                                        type: "variants",
                                        ids: Array.from(selectedVariantIds),
                                    })
                                }
                            >
                                Restore Selected
                                {selectedVariantIds.size > 0
                                    ? ` (${selectedVariantIds.size})`
                                    : ""}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {confirmAction?.type === "product" && (
                <ConfirmDialog
                    title="Restore this product?"
                    message={`"${item.name}" will become visible again on the storefront, and its previously active variants will come back too.`}
                    confirmLabel="Restore"
                    isLoading={isRestoring}
                    onConfirm={runRestoreProduct}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
            {confirmAction?.type === "variants" && (
                <ConfirmDialog
                    title={
                        confirmAction.ids.length > 1
                            ? `Restore ${confirmAction.ids.length} variants?`
                            : "Restore this variant?"
                    }
                    message="It will become active again and count toward this product's stock."
                    confirmLabel="Restore"
                    isLoading={isRestoring}
                    onConfirm={() => runRestoreVariants(confirmAction.ids)}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </div>
    );
};

export default ArchivedProductDetailModal;
