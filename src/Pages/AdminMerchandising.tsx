import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Eye,
  EyeOff,
  Star,
  Pin,
  Plus,
  X,
  Search,
} from "lucide-react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import { useAuth } from "../context/AuthContext";
import {
  fetchPlacements,
  fetchMerchRows,
  addToPlacement,
  removeFromPlacement,
  updatePlacementConfig,
  reorderPlacement,
  type MerchRow,
  type MerchTarget,
  type PlacementConfigPatch,
} from "../api/merchandising";
import "../Styles/AdminMerchandising.css";

type FilterKey = "all" | "visible" | "hidden" | "featured" | "pinned" | "unassigned";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "visible", label: "Visible" },
  { key: "hidden", label: "Hidden" },
  { key: "featured", label: "Featured" },
  { key: "pinned", label: "Pinned" },
  { key: "unassigned", label: "Not in placement" },
];

/**
 * Moves the item at `from` to `to`, returning a new array. Out-of-range moves
 * are no-ops so the first/last buttons need no guards at the call site.
 */
const move = <T,>(rows: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= rows.length || from === to) return rows;
  const next = [...rows];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const AdminMerchandising = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [placementCode, setPlacementCode] = useState<string>("");
  const [target, setTarget] = useState<MerchTarget>("categories");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  // Local order while the admin is arranging. null = showing server order.
  const [draftOrder, setDraftOrder] = useState<number[] | null>(null);

  const isAdmin = user?.role === "admin";

  const { data: placements = [] } = useQuery({
    queryKey: ["placements"],
    queryFn: fetchPlacements,
    staleTime: 5 * 60 * 1000,
  });

  const activeCode = placementCode || placements[0]?.code || "";

  const rowsKey = ["merch-rows", activeCode, target];
  const { data: rows = [], isLoading } = useQuery({
    queryKey: rowsKey,
    queryFn: () => fetchMerchRows(activeCode, target),
    enabled: Boolean(activeCode),
  });

  const assigned = useMemo(() => rows.filter((row) => row.inPlacement), [rows]);
  const unassigned = useMemo(() => rows.filter((row) => !row.inPlacement), [rows]);

  // Draft order holds ids; resolve back to rows, dropping any the server no
  // longer returns (e.g. removed in another tab).
  const orderedAssigned = useMemo(() => {
    if (!draftOrder) return assigned;
    const byId = new Map(assigned.map((row) => [row.targetId, row]));
    const drafted = draftOrder
      .map((id) => byId.get(id))
      .filter((row): row is MerchRow => Boolean(row));
    const missing = assigned.filter((row) => !draftOrder.includes(row.targetId));
    return [...drafted, ...missing];
  }, [assigned, draftOrder]);

  const isDirty =
    draftOrder !== null &&
    orderedAssigned.some((row, index) => assigned[index]?.targetId !== row.targetId);

  const matchesSearch = (row: MerchRow) =>
    row.name.toLowerCase().includes(search.trim().toLowerCase());

  const visibleAssigned = orderedAssigned.filter((row) => {
    if (!matchesSearch(row)) return false;
    if (filter === "visible") return row.visible;
    if (filter === "hidden") return !row.visible;
    if (filter === "featured") return row.featured;
    if (filter === "pinned") return row.pinned;
    if (filter === "unassigned") return false;
    return true;
  });

  const visibleUnassigned = unassigned.filter(
    (row) => matchesSearch(row) && (filter === "all" || filter === "unassigned"),
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: rowsKey });

  const configMutation = useMutation({
    mutationFn: ({ targetId, patch }: { targetId: number; patch: PlacementConfigPatch }) =>
      updatePlacementConfig(activeCode, target, targetId, patch),
    onSuccess: invalidate,
    onError: () => toast.error("Could not update. Try again."),
  });

  const addMutation = useMutation({
    mutationFn: (targetId: number) => addToPlacement(activeCode, target, targetId),
    onSuccess: () => {
      invalidate();
      toast.success("Added to placement");
    },
    onError: () => toast.error("Could not add. Try again."),
  });

  const removeMutation = useMutation({
    mutationFn: (targetId: number) => removeFromPlacement(activeCode, target, targetId),
    onSuccess: () => {
      setDraftOrder(null);
      invalidate();
      toast.success("Removed from placement");
    },
    onError: () => toast.error("Could not remove. Try again."),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      reorderPlacement(
        activeCode,
        target,
        orderedAssigned.map((row) => row.targetId),
      ),
    onSuccess: () => {
      setDraftOrder(null);
      invalidate();
      toast.success("Order saved");
    },
    onError: () => toast.error("Could not save the order. Try again."),
  });

  /**
   * Pinned rows sort above unpinned by contract, so a move is only meaningful
   * inside its own pinned/unpinned group. Indices are computed within the
   * group and mapped back onto the full list.
   */
  const moveRow = (targetId: number, to: "up" | "down" | "top" | "bottom") => {
    const list = orderedAssigned;
    const row = list.find((item) => item.targetId === targetId);
    if (!row) return;

    const group = list.filter((item) => item.pinned === row.pinned);
    const groupIndex = group.findIndex((item) => item.targetId === targetId);
    const destination =
      to === "up" ? groupIndex - 1
      : to === "down" ? groupIndex + 1
      : to === "top" ? 0
      : group.length - 1;

    const reorderedGroup = move(group, groupIndex, destination);
    if (reorderedGroup === group) return;

    const pinned = row.pinned ? reorderedGroup : list.filter((item) => item.pinned);
    const rest = row.pinned ? list.filter((item) => !item.pinned) : reorderedGroup;
    setDraftOrder([...pinned, ...rest].map((item) => item.targetId));
  };

  const switchPlacement = (code: string) => {
    setDraftOrder(null);
    setPlacementCode(code);
  };

  const switchTarget = (next: MerchTarget) => {
    setDraftOrder(null);
    setTarget(next);
  };

  const renderRow = (row: MerchRow, index: number, groupLength: number) => (
    <li key={row.targetId} className="merch-row">
      <div className="merch-row__order">
        <button
          type="button"
          className="merch-icon-btn"
          title="Move to top"
          disabled={index === 0}
          onClick={() => moveRow(row.targetId, "top")}
        >
          <ChevronsUp size={16} />
        </button>
        <button
          type="button"
          className="merch-icon-btn"
          title="Move up"
          disabled={index === 0}
          onClick={() => moveRow(row.targetId, "up")}
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          className="merch-icon-btn"
          title="Move down"
          disabled={index === groupLength - 1}
          onClick={() => moveRow(row.targetId, "down")}
        >
          <ChevronDown size={16} />
        </button>
        <button
          type="button"
          className="merch-icon-btn"
          title="Move to bottom"
          disabled={index === groupLength - 1}
          onClick={() => moveRow(row.targetId, "bottom")}
        >
          <ChevronsDown size={16} />
        </button>
      </div>

      {row.image ? (
        <img className="merch-row__thumb" src={row.image} alt="" loading="lazy" />
      ) : (
        <span className="merch-row__thumb merch-row__thumb--empty" aria-hidden="true" />
      )}

      <div className="merch-row__label">
        <span className="merch-row__name">{row.name}</span>
        {row.parentName && <span className="merch-row__parent">{row.parentName}</span>}
      </div>

      <div className="merch-row__flags">
        <button
          type="button"
          className={`merch-flag ${row.visible ? "merch-flag--on" : ""}`}
          title={row.visible ? "Visible - click to hide" : "Hidden - click to show"}
          onClick={() =>
            configMutation.mutate({ targetId: row.targetId, patch: { visible: !row.visible } })
          }
        >
          {row.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{row.visible ? "Visible" : "Hidden"}</span>
        </button>
        <button
          type="button"
          className={`merch-flag ${row.featured ? "merch-flag--on" : ""}`}
          title="Featured changes the design, not the order"
          onClick={() =>
            configMutation.mutate({ targetId: row.targetId, patch: { featured: !row.featured } })
          }
        >
          <Star size={16} />
          <span>Featured</span>
        </button>
        <button
          type="button"
          className={`merch-flag ${row.pinned ? "merch-flag--on" : ""}`}
          title="Pinned keeps the item above unpinned items"
          onClick={() => {
            setDraftOrder(null);
            configMutation.mutate({ targetId: row.targetId, patch: { pinned: !row.pinned } });
          }}
        >
          <Pin size={16} />
          <span>Pinned</span>
        </button>
        {isAdmin && (
          <button
            type="button"
            className="merch-icon-btn merch-icon-btn--danger"
            title="Remove from this placement"
            onClick={() => removeMutation.mutate(row.targetId)}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </li>
  );

  const pinnedRows = visibleAssigned.filter((row) => row.pinned);
  const unpinnedRows = visibleAssigned.filter((row) => !row.pinned);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <Header />
        <div className="merch">
          <div className="merch__head">
            <div>
              <h1 className="merch__title">Merchandising</h1>
              <p className="merch__subtitle">
                Categories only know they exist. Merchandising decides where they appear.
              </p>
            </div>
            <button
              type="button"
              className="merch__save"
              disabled={!isDirty || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>

          <div className="merch__controls">
            <label className="merch__control">
              <span>Placement</span>
              <select value={activeCode} onChange={(event) => switchPlacement(event.target.value)}>
                {placements.map((placement) => (
                  <option key={placement.code} value={placement.code}>
                    {placement.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="merch__tabs">
              <button
                type="button"
                className={target === "categories" ? "merch__tab merch__tab--active" : "merch__tab"}
                onClick={() => switchTarget("categories")}
              >
                Categories
              </button>
              <button
                type="button"
                className={target === "subcategories" ? "merch__tab merch__tab--active" : "merch__tab"}
                onClick={() => switchTarget("subcategories")}
              >
                Sub Categories
              </button>
            </div>

            <label className="merch__search">
              <Search size={16} />
              <input
                type="search"
                placeholder={`Search ${target === "categories" ? "category" : "subcategory"}…`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="merch__filters">
            {FILTERS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={filter === option.key ? "merch__chip merch__chip--active" : "merch__chip"}
                onClick={() => setFilter(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {isDirty && (
            <p className="merch__dirty">Order changed. Click Save Changes to apply.</p>
          )}

          {isLoading ? (
            <p className="merch__empty">Loading…</p>
          ) : (
            <>
              {pinnedRows.length > 0 && (
                <>
                  <h2 className="merch__group">Pinned</h2>
                  <ul className="merch__list">
                    {pinnedRows.map((row, index) => renderRow(row, index, pinnedRows.length))}
                  </ul>
                </>
              )}

              {unpinnedRows.length > 0 && (
                <>
                  {pinnedRows.length > 0 && <h2 className="merch__group">Everything else</h2>}
                  <ul className="merch__list">
                    {unpinnedRows.map((row, index) => renderRow(row, index, unpinnedRows.length))}
                  </ul>
                </>
              )}

              {visibleAssigned.length === 0 && (
                <p className="merch__empty">
                  Nothing in this placement yet. Add something from the list below.
                </p>
              )}

              {visibleUnassigned.length > 0 && (
                <>
                  <h2 className="merch__group">Not in this placement</h2>
                  <ul className="merch__list merch__list--muted">
                    {visibleUnassigned.map((row) => (
                      <li key={row.targetId} className="merch-row merch-row--muted">
                        <div className="merch-row__label">
                          <span className="merch-row__name">{row.name}</span>
                          {row.parentName && (
                            <span className="merch-row__parent">{row.parentName}</span>
                          )}
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            className="merch-row__add"
                            onClick={() => addMutation.mutate(row.targetId)}
                          >
                            <Plus size={16} /> Add
                          </button>
                        ) : (
                          <span className="merch-row__note">Admin only</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMerchandising;
