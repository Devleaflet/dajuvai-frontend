import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { fetchArchivedProducts, restoreProduct } from "../api/products";
import ArchivedProductDetailModal from "./Modal/ArchivedProductDetailModal";
import ConfirmDialog from "./Modal/ConfirmDialog";
import "../Styles/ArchivedProductsTab.css";

interface ArchivedProductsTabProps {
    token?: string;
    isAdmin?: boolean;
    onRestored?: () => void;
}

type TypeFilter = "" | "product" | "variants";

const PAGE_LIMIT = 20;

const formatDate = (value?: string) => {
    if (!value) return "";
    try {
        return new Date(value).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return "";
    }
};

const ArchivedProductsTab: React.FC<ArchivedProductsTabProps> = ({
    token,
    isAdmin = false,
    onRestored,
}) => {
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
    const [loading, setLoading] = useState(false);
    const [restoringId, setRestoringId] = useState<number | null>(null);
    const [viewingItem, setViewingItem] = useState<any | null>(null);
    const [confirmRestoreItem, setConfirmRestoreItem] = useState<any | null>(
        null,
    );

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchArchivedProducts(page, PAGE_LIMIT, token, {
                search: search || undefined,
                type: typeFilter || undefined,
            });
            const nextItems = res?.data?.products ?? [];
            setItems(nextItems);
            setTotal(res?.data?.total ?? 0);
            return nextItems;
        } catch (error) {
            console.error("Failed to load archived products:", error);
            toast.error("Failed to load archived products");
            return null;
        } finally {
            setLoading(false);
        }
    }, [page, search, typeFilter, token]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const handle = setTimeout(() => {
            setPage(1);
            setSearch(searchInput.trim());
        }, 400);
        return () => clearTimeout(handle);
    }, [searchInput]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

    const handleQuickRestore = async (item: any) => {
        setRestoringId(item.id);
        try {
            await restoreProduct(item.id, token);
            toast.success(`"${item.name}" restored`);
            setItems((prev) => prev.filter((p) => p.id !== item.id));
            setTotal((prev) => Math.max(0, prev - 1));
            onRestored?.();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || "Failed to restore product",
            );
        } finally {
            setRestoringId(null);
            setConfirmRestoreItem(null);
        }
    };

    const handleDetailRestored = async () => {
        const nextItems = await load();
        if (nextItems) {
            setViewingItem((prev) =>
                prev ? (nextItems.find((i: any) => i.id === prev.id) ?? null) : prev,
            );
        }
        onRestored?.();
    };

    return (
        <div className="archived-tab">
            <div className="archived-tab__toolbar">
                <input
                    type="text"
                    className="archived-tab__search"
                    placeholder="Search archived products…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <div className="archived-tab__filters">
                    {(
                        [
                            { value: "", label: "All" },
                            { value: "product", label: "Product deleted" },
                            { value: "variants", label: "Variants deleted" },
                        ] as { value: TypeFilter; label: string }[]
                    ).map((opt) => (
                        <button
                            key={opt.value}
                            className={`archived-tab__filter-btn ${
                                typeFilter === opt.value
                                    ? "archived-tab__filter-btn--active"
                                    : ""
                            }`}
                            onClick={() => {
                                setPage(1);
                                setTypeFilter(opt.value);
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="archived-tab__table-container">
                <table className="archived-tab__table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            {isAdmin && <th>Vendor</th>}
                            <th>Status</th>
                            <th>Archived</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={isAdmin ? 6 : 5}
                                    className="archived-tab__empty"
                                >
                                    Loading…
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={isAdmin ? 6 : 5}
                                    className="archived-tab__empty"
                                >
                                    No archived products
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} data-label={item.name}>
                                    <td data-th="Image">
                                        <img
                                            src={item.thumbnail}
                                            alt=""
                                            className="archived-tab__thumb"
                                            onError={(e) => {
                                                (
                                                    e.target as HTMLImageElement
                                                ).style.visibility = "hidden";
                                            }}
                                        />
                                    </td>
                                    <td data-th="Name" className="archived-tab__name-cell">
                                        {item.name}
                                    </td>
                                    {isAdmin && (
                                        <td data-th="Vendor">
                                            {item.vendor?.businessName ?? "—"}
                                        </td>
                                    )}
                                    <td data-th="Status">
                                        {item.isProductArchived ? (
                                            <span className="archived-tab__badge archived-tab__badge--product">
                                                Product deleted
                                            </span>
                                        ) : (
                                            <span className="archived-tab__badge archived-tab__badge--variants">
                                                {item.archivedVariantsCount}{" "}
                                                variant(s) deleted
                                            </span>
                                        )}
                                    </td>
                                    <td data-th="Archived">
                                        {formatDate(
                                            item.isProductArchived
                                                ? item.deletedAt
                                                : item.archivedVariants?.[0]
                                                      ?.deletedAt,
                                        )}
                                    </td>
                                    <td
                                        data-th="Action"
                                        className="archived-tab__actions"
                                    >
                                        <button
                                            className="archived-tab__view-btn"
                                            onClick={() => setViewingItem(item)}
                                        >
                                            View
                                        </button>
                                        {item.isProductArchived && (
                                            <button
                                                className="archived-tab__restore-btn"
                                                disabled={restoringId === item.id}
                                                onClick={() =>
                                                    setConfirmRestoreItem(item)
                                                }
                                            >
                                                {restoringId === item.id
                                                    ? "…"
                                                    : "Restore"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="archived-tab__pagination">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Previous
                    </button>
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        Next
                    </button>
                </div>
            )}

            {viewingItem && (
                <ArchivedProductDetailModal
                    item={viewingItem}
                    token={token}
                    onClose={() => setViewingItem(null)}
                    onRestored={handleDetailRestored}
                />
            )}

            {confirmRestoreItem && (
                <ConfirmDialog
                    title="Restore this product?"
                    message={`"${confirmRestoreItem.name}" will become visible again on the storefront, and its previously active variants will come back too.`}
                    confirmLabel="Restore"
                    isLoading={restoringId === confirmRestoreItem.id}
                    onConfirm={() => handleQuickRestore(confirmRestoreItem)}
                    onCancel={() => setConfirmRestoreItem(null)}
                />
            )}
        </div>
    );
};

export default ArchivedProductsTab;
