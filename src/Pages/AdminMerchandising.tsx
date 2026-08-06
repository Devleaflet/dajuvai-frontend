import { useEffect, useReducer, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Eye,
  EyeOff,
  X,
  Plus,
  ChevronRight,
} from "lucide-react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import AddItemsModal from "../Components/AddItemsModal";
import { usePermission } from "../hooks/usePermission";
import {
  fetchPlacementItems,
  addItems as apiAddItems,
  updateVisibility as apiUpdateVisibility,
  removeItem as apiRemoveItem,
  reorderPlacement,
  type ItemRow,
  type MegaMenuCategoryRow,
  type FlatItemRow,
} from "../api/merchandising";
import "../Styles/AdminMerchandising.css";

type MoveTo = "up" | "down" | "top" | "bottom";

/** Moves the item at `from` to a position derived from `to`. No-op if already there. */
function move<T>(list: T[], from: number, to: MoveTo): T[] {
  const destination =
    to === "up"
      ? from - 1
      : to === "down"
        ? from + 1
        : to === "top"
          ? 0
          : list.length - 1;
  if (destination < 0 || destination >= list.length || destination === from)
    return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(destination, 0, item);
  return next;
}

/** Rule 1: displayOrder is always the array index. */
function recalcOrder<T extends { displayOrder: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, displayOrder: index }));
}

// ─────────────────────────── Category Grid ───────────────────────────

interface CGState {
  items: FlatItemRow[];
  isDirty: boolean;
  isSaving: boolean;
}

type CGAction =
  | { type: "LOAD"; items: FlatItemRow[] }
  | { type: "MOVE"; itemId: number; to: MoveTo }
  | { type: "SET_VISIBLE"; itemId: number; visible: boolean }
  | { type: "REMOVE"; itemId: number }
  | { type: "SAVE_START" }
  | { type: "SAVE_DONE" }
  | { type: "SAVE_ERROR" };

function cgReducer(state: CGState, action: CGAction): CGState {
  switch (action.type) {
    case "LOAD":
      return { items: action.items, isDirty: false, isSaving: false };
    case "MOVE": {
      const index = state.items.findIndex(
        (row) => row.itemId === action.itemId,
      );
      if (index === -1) return state;
      const moved = move(state.items, index, action.to);
      if (moved === state.items) return state;
      return { ...state, items: recalcOrder(moved), isDirty: true };
    }
    case "SET_VISIBLE":
      return {
        ...state,
        items: state.items.map((row) =>
          row.itemId === action.itemId
            ? { ...row, visible: action.visible }
            : row,
        ),
      };
    case "REMOVE":
      return {
        ...state,
        items: state.items.filter((row) => row.itemId !== action.itemId),
      };
    case "SAVE_START":
      return { ...state, isSaving: true };
    case "SAVE_DONE":
      return { ...state, isSaving: false, isDirty: false };
    case "SAVE_ERROR":
      return { ...state, isSaving: false };
    default:
      return state;
  }
}

const SLUG_CATEGORY_GRID = "category-grid";

function CategoryGridArrangement({
  onDirtyChange,
}: {
  onDirtyChange: (dirty: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [state, dispatch] = useReducer(cgReducer, {
    items: [],
    isDirty: false,
    isSaving: false,
  });
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["placement-items", SLUG_CATEGORY_GRID],
    queryFn: () => fetchPlacementItems(SLUG_CATEGORY_GRID),
  });

  useEffect(() => {
    if (data && "items" in data) dispatch({ type: "LOAD", items: data.items });
  }, [data]);

  useEffect(() => onDirtyChange(state.isDirty), [state.isDirty, onDirtyChange]);

  useEffect(() => {
    if (!state.isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.isDirty]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["placement-items", SLUG_CATEGORY_GRID],
    });

  const toggleVisible = async (row: ItemRow) => {
    dispatch({
      type: "SET_VISIBLE",
      itemId: row.itemId,
      visible: !row.visible,
    });
    try {
      await apiUpdateVisibility(SLUG_CATEGORY_GRID, row.itemId, !row.visible);
      toast.success("Visibility updated", { duration: 2000 });
    } catch {
      dispatch({
        type: "SET_VISIBLE",
        itemId: row.itemId,
        visible: row.visible,
      });
      toast.error("Failed to update visibility.");
    }
  };

  const remove = async (itemId: number) => {
    try {
      await apiRemoveItem(SLUG_CATEGORY_GRID, itemId);
      dispatch({ type: "REMOVE", itemId });
      toast.success("Removed from placement");
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const save = async () => {
    dispatch({ type: "SAVE_START" });
    try {
      await reorderPlacement(
        SLUG_CATEGORY_GRID,
        state.items.map((row) => ({
          itemId: row.itemId,
          displayOrder: row.displayOrder,
        })),
      );
      dispatch({ type: "SAVE_DONE" });
      toast.success("Changes saved successfully");
    } catch {
      dispatch({ type: "SAVE_ERROR" });
      toast.error("Failed to save. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="merch__panel">
        <p className="merch__empty">Loading…</p>
      </div>
    );
  }

  return (
    <>
      {state.isDirty && (
        <div className="merch__banner">
          <span className="merch__banner-dot" />
          <span>You have unsaved changes.</span>
          <button
            type="button"
            className="merch__save"
            disabled={state.isSaving}
            onClick={save}
          >
            {state.isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      <div className="merch__section-head">
        <div>
          <h2 className="merch__section-title">Category Grid</h2>
          <p className="merch__section-subtitle">
            Order items as they appear in the homepage slider.
          </p>
        </div>
        {can("arrangement", "create_edit") && (
          <button
            type="button"
            className="merch__add"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} /> Add Items
          </button>
        )}
      </div>

      <div className="merch__panel">
        {state.items.length === 0 ? (
          <p className="merch__empty">
            No items in Category Grid. Add subcategories to display them in the
            homepage slider.
          </p>
        ) : (
          <ul className="merch__list">
            {state.items.map((row, index) => (
              <li key={row.itemId} className="merch-row">
                {can("arrangement","create_edit") && (
                  <div className="merch-row__order">
                    <button
                      type="button"
                      className="merch-icon-btn"
                      title="Move to top"
                      disabled={index === 0}
                      onClick={() =>
                        dispatch({ type: "MOVE", itemId: row.itemId, to: "top" })
                      }
                    >
                      <ChevronsUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="merch-icon-btn"
                      title="Move up"
                      disabled={index === 0}
                      onClick={() =>
                        dispatch({ type: "MOVE", itemId: row.itemId, to: "up" })
                      }
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="merch-icon-btn"
                      title="Move down"
                      disabled={index === state.items.length - 1}
                      onClick={() =>
                        dispatch({ type: "MOVE", itemId: row.itemId, to: "down" })
                      }
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      className="merch-icon-btn"
                      title="Move to bottom"
                      disabled={index === state.items.length - 1}
                      onClick={() =>
                        dispatch({
                          type: "MOVE",
                          itemId: row.itemId,
                          to: "bottom",
                        })
                      }
                    >
                      <ChevronsDown size={16} />
                    </button>
                  </div>
                )}
                {row.image ? (
                  <img
                    className="merch-row__thumb"
                    src={row.image}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="merch-row__thumb merch-row__thumb--empty"
                    aria-hidden="true"
                  />
                )}

                <div className="merch-row__label">
                  <span className="merch-row__name">{row.name}</span>
                  {row.categoryName && (
                    <span className="merch-row__parent">
                      {row.categoryName}
                    </span>
                  )}
                </div>

                {can("arrangement","create_edit") && (
                  <div className="merch-row__flags">
                    <button
                      type="button"
                      className={`merch-flag merch-flag--visible ${row.visible ? "merch-flag--on" : ""}`}
                      title={
                        row.visible
                          ? "Visible - click to hide"
                          : "Hidden - click to show"
                      }
                      onClick={() => toggleVisible(row)}
                    >
                      {row.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      <span>{row.visible ? "Visible" : "Hidden"}</span>
                    </button>
                    <button
                      type="button"
                      className="merch-icon-btn merch-icon-btn--danger"
                      title="Remove from this placement"
                      onClick={() => remove(row.itemId)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAddModal && (
        <AddItemsModal
          slug={SLUG_CATEGORY_GRID}
          entityType="subcategory"
          title="Add to Category Grid"
          onClose={() => setShowAddModal(false)}
          onAdded={invalidate}
        />
      )}
    </>
  );
}

// ─────────────────────────── Mega Menu ───────────────────────────

interface MMCategoryState extends MegaMenuCategoryRow {
  expanded: boolean;
}

interface MMState {
  categories: MMCategoryState[];
  isDirty: boolean;
  isSaving: boolean;
}

type MMAction =
  | { type: "LOAD"; categories: MegaMenuCategoryRow[] }
  | { type: "MOVE_CATEGORY"; itemId: number; to: MoveTo }
  | { type: "MOVE_SUB"; categoryItemId: number; itemId: number; to: MoveTo }
  | { type: "SET_CATEGORY_VISIBLE"; itemId: number; visible: boolean }
  | {
      type: "SET_SUB_VISIBLE";
      categoryItemId: number;
      itemId: number;
      visible: boolean;
    }
  | { type: "REMOVE_CATEGORY"; itemId: number }
  | { type: "REMOVE_SUB"; categoryItemId: number; itemId: number }
  | { type: "TOGGLE_EXPAND"; itemId: number }
  | { type: "SAVE_START" }
  | { type: "SAVE_DONE" }
  | { type: "SAVE_ERROR" };

function mmReducer(state: MMState, action: MMAction): MMState {
  switch (action.type) {
    case "LOAD":
      return {
        categories: action.categories.map((cat) => ({
          ...cat,
          expanded: false,
        })),
        isDirty: false,
        isSaving: false,
      };
    case "MOVE_CATEGORY": {
      const index = state.categories.findIndex(
        (cat) => cat.itemId === action.itemId,
      );
      if (index === -1) return state;
      const moved = move(state.categories, index, action.to);
      if (moved === state.categories) return state;
      return { ...state, categories: recalcOrder(moved), isDirty: true };
    }
    case "MOVE_SUB": {
      return {
        ...state,
        isDirty: true,
        categories: state.categories.map((cat) => {
          if (cat.itemId !== action.categoryItemId) return cat;
          const index = cat.subcategories.findIndex(
            (sub) => sub.itemId === action.itemId,
          );
          if (index === -1) return cat;
          const moved = move(cat.subcategories, index, action.to);
          if (moved === cat.subcategories) return cat;
          return { ...cat, subcategories: recalcOrder(moved) };
        }),
      };
    }
    case "SET_CATEGORY_VISIBLE":
      return {
        ...state,
        categories: state.categories.map((cat) =>
          cat.itemId === action.itemId
            ? { ...cat, visible: action.visible }
            : cat,
        ),
      };
    case "SET_SUB_VISIBLE":
      return {
        ...state,
        categories: state.categories.map((cat) =>
          cat.itemId !== action.categoryItemId
            ? cat
            : {
                ...cat,
                subcategories: cat.subcategories.map((sub) =>
                  sub.itemId === action.itemId
                    ? { ...sub, visible: action.visible }
                    : sub,
                ),
              },
        ),
      };
    case "REMOVE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter(
          (cat) => cat.itemId !== action.itemId,
        ),
      };
    case "REMOVE_SUB":
      return {
        ...state,
        categories: state.categories.map((cat) =>
          cat.itemId !== action.categoryItemId
            ? cat
            : {
                ...cat,
                subcategories: cat.subcategories.filter(
                  (sub) => sub.itemId !== action.itemId,
                ),
              },
        ),
      };
    case "TOGGLE_EXPAND":
      return {
        ...state,
        categories: state.categories.map((cat) =>
          cat.itemId === action.itemId
            ? { ...cat, expanded: !cat.expanded }
            : cat,
        ),
      };
    case "SAVE_START":
      return { ...state, isSaving: true };
    case "SAVE_DONE":
      return { ...state, isSaving: false, isDirty: false };
    case "SAVE_ERROR":
      return { ...state, isSaving: false };
    default:
      return state;
  }
}

const SLUG_MEGA_MENU = "mega-menu";

function MegaMenuArrangement({
  onDirtyChange,
}: {
  onDirtyChange: (dirty: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [state, dispatch] = useReducer(mmReducer, {
    categories: [],
    isDirty: false,
    isSaving: false,
  });
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addSubcategoryFor, setAddSubcategoryFor] = useState<number | null>(
    null,
  ); // holds entityId (categoryId)

  const { data, isLoading } = useQuery({
    queryKey: ["placement-items", SLUG_MEGA_MENU],
    queryFn: () => fetchPlacementItems(SLUG_MEGA_MENU),
  });

  useEffect(() => {
    if (data && "categories" in data)
      dispatch({ type: "LOAD", categories: data.categories });
  }, [data]);

  useEffect(() => onDirtyChange(state.isDirty), [state.isDirty, onDirtyChange]);

  useEffect(() => {
    if (!state.isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.isDirty]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["placement-items", SLUG_MEGA_MENU],
    });

  const toggleCategoryVisible = async (row: ItemRow) => {
    dispatch({
      type: "SET_CATEGORY_VISIBLE",
      itemId: row.itemId,
      visible: !row.visible,
    });
    try {
      await apiUpdateVisibility(SLUG_MEGA_MENU, row.itemId, !row.visible);
      toast.success("Visibility updated", { duration: 2000 });
    } catch {
      dispatch({
        type: "SET_CATEGORY_VISIBLE",
        itemId: row.itemId,
        visible: row.visible,
      });
      toast.error("Failed to update visibility.");
    }
  };

  const toggleSubVisible = async (categoryItemId: number, row: ItemRow) => {
    dispatch({
      type: "SET_SUB_VISIBLE",
      categoryItemId,
      itemId: row.itemId,
      visible: !row.visible,
    });
    try {
      await apiUpdateVisibility(SLUG_MEGA_MENU, row.itemId, !row.visible);
      toast.success("Visibility updated", { duration: 2000 });
    } catch {
      dispatch({
        type: "SET_SUB_VISIBLE",
        categoryItemId,
        itemId: row.itemId,
        visible: row.visible,
      });
      toast.error("Failed to update visibility.");
    }
  };

  const removeCategory = async (itemId: number) => {
    try {
      await apiRemoveItem(SLUG_MEGA_MENU, itemId);
      dispatch({ type: "REMOVE_CATEGORY", itemId });
      toast.success("Removed from placement");
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const removeSub = async (categoryItemId: number, itemId: number) => {
    try {
      await apiRemoveItem(SLUG_MEGA_MENU, itemId);
      dispatch({ type: "REMOVE_SUB", categoryItemId, itemId });
      toast.success("Removed from placement");
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const save = async () => {
    dispatch({ type: "SAVE_START" });
    try {
      const categoryOrders = state.categories.map((cat) => ({
        itemId: cat.itemId,
        displayOrder: cat.displayOrder,
      }));
      const subOrders = state.categories.flatMap((cat) =>
        cat.subcategories.map((sub) => ({
          itemId: sub.itemId,
          displayOrder: sub.displayOrder,
        })),
      );
      await reorderPlacement(SLUG_MEGA_MENU, [...categoryOrders, ...subOrders]);
      dispatch({ type: "SAVE_DONE" });
      toast.success("Changes saved successfully");
    } catch {
      dispatch({ type: "SAVE_ERROR" });
      toast.error("Failed to save. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="merch__panel">
        <p className="merch__empty">Loading…</p>
      </div>
    );
  }

  return (
    <>
      {state.isDirty && (
        <div className="merch__banner">
          <span className="merch__banner-dot" />
          <span>You have unsaved changes.</span>
          <button
            type="button"
            className="merch__save"
            disabled={state.isSaving}
            onClick={save}
          >
            {state.isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      <div className="merch__section-head">
        <div>
          <h2 className="merch__section-title">Mega Menu</h2>
          <p className="merch__section-subtitle">
            Arrange categories and their subcategories.
          </p>
        </div>
        {can("arrangement", "create_edit") && (
          <button
            type="button"
            className="merch__add"
            onClick={() => setAddCategoryOpen(true)}
          >
            <Plus size={16} /> Add Category
          </button>
        )}
      </div>

      <div className="merch__panel">
        {state.categories.length === 0 ? (
          <p className="merch__empty">
            Mega Menu is empty. Add categories to display them in the
            navigation.
          </p>
        ) : (
          <ul className="merch__list">
            {state.categories.map((cat, index) => (
              <li key={cat.itemId} className="mm-category">
                <div className="merch-row">
                  <button
                    type="button"
                    className="mm-expand"
                    onClick={() =>
                      dispatch({ type: "TOGGLE_EXPAND", itemId: cat.itemId })
                    }
                    aria-label={cat.expanded ? "Collapse" : "Expand"}
                  >
                    <ChevronRight
                      size={16}
                      className={
                        cat.expanded
                          ? "mm-expand-icon mm-expand-icon--open"
                          : "mm-expand-icon"
                      }
                    />
                  </button>
                  {
                    can("arrangement","create_edit") && (
                    <div className="merch-row__order">
                      <button
                        type="button"
                        className="merch-icon-btn"
                        title="Move to top"
                        disabled={index === 0}
                        onClick={() =>
                          dispatch({
                            type: "MOVE_CATEGORY",
                            itemId: cat.itemId,
                            to: "top",
                          })
                        }
                      >
                        <ChevronsUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="merch-icon-btn"
                        title="Move up"
                        disabled={index === 0}
                        onClick={() =>
                          dispatch({
                            type: "MOVE_CATEGORY",
                            itemId: cat.itemId,
                            to: "up",
                          })
                        }
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="merch-icon-btn"
                        title="Move down"
                        disabled={index === state.categories.length - 1}
                        onClick={() =>
                          dispatch({
                            type: "MOVE_CATEGORY",
                            itemId: cat.itemId,
                            to: "down",
                          })
                        }
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        type="button"
                        className="merch-icon-btn"
                        title="Move to bottom"
                        disabled={index === state.categories.length - 1}
                        onClick={() =>
                          dispatch({
                            type: "MOVE_CATEGORY",
                            itemId: cat.itemId,
                            to: "bottom",
                          })
                        }
                      >
                        <ChevronsDown size={16} />
                      </button>
                    </div>
                  )}
                  {cat.image ? (
                    <img
                      className="merch-row__thumb"
                      src={cat.image}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="merch-row__thumb merch-row__thumb--empty"
                      aria-hidden="true"
                    />
                  )}

                  <div className="merch-row__label">
                    <span className="merch-row__name">
                      {index + 1}. {cat.name}
                    </span>
                  </div>

                  {can("arrangement","create_edit") && (
                    <div className="merch-row__flags">
                        <button
                          type="button"
                          className={`merch-flag merch-flag--visible ${cat.visible ? "merch-flag--on" : ""}`}
                          title={
                            cat.visible
                              ? "Visible - click to hide"
                              : "Hidden - click to show"
                          }
                          onClick={() => toggleCategoryVisible(cat)}
                        >
                          {cat.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                          <span>{cat.visible ? "Visible" : "Hidden"}</span>
                        </button>
                        <button
                          type="button"
                          className="merch-icon-btn merch-icon-btn--danger"
                          title="Remove from this placement"
                          onClick={() => removeCategory(cat.itemId)}
                        >
                          <X size={16} />
                        </button>
                    </div>
                  )}
                </div>

                {cat.expanded && (
                  <div className="mm-subpanel">
                    <div className="mm-subpanel__head">
                      <span>Subcategories of {cat.name}</span>
                      {can("arrangement", "create_edit") && (
                        <button
                          type="button"
                          className="merch-row__add"
                          onClick={() => setAddSubcategoryFor(cat.entityId)}
                        >
                          <Plus size={14} /> Add Subcategory
                        </button>
                      )}
                    </div>

                    {cat.subcategories.length === 0 ? (
                      <p className="merch__empty">
                        No subcategories placed here yet. Click "Add
                        Subcategory" above to add some — if none appear there,
                        this category has no subcategories in your catalog to
                        add.
                      </p>
                    ) : (
                      <ul className="merch__list">
                        {cat.subcategories.map((sub, subIndex) => (
                          <li
                            key={sub.itemId}
                            className="merch-row merch-row--nested"
                          >
                            { 
                              can("arrangement","create_edit") && (
                              <div className="merch-row__order">
                                <button
                                  type="button"
                                  className="merch-icon-btn"
                                  title="Move to top"
                                  disabled={subIndex === 0}
                                  onClick={() =>
                                    dispatch({
                                      type: "MOVE_SUB",
                                      categoryItemId: cat.itemId,
                                      itemId: sub.itemId,
                                      to: "top",
                                    })
                                  }
                                >
                                  <ChevronsUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="merch-icon-btn"
                                  title="Move up"
                                  disabled={subIndex === 0}
                                  onClick={() =>
                                    dispatch({
                                      type: "MOVE_SUB",
                                      categoryItemId: cat.itemId,
                                      itemId: sub.itemId,
                                      to: "up",
                                    })
                                  }
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="merch-icon-btn"
                                  title="Move down"
                                  disabled={
                                    subIndex === cat.subcategories.length - 1
                                  }
                                  onClick={() =>
                                    dispatch({
                                      type: "MOVE_SUB",
                                      categoryItemId: cat.itemId,
                                      itemId: sub.itemId,
                                      to: "down",
                                    })
                                  }
                                >
                                  <ChevronDown size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="merch-icon-btn"
                                  title="Move to bottom"
                                  disabled={
                                    subIndex === cat.subcategories.length - 1
                                  }
                                  onClick={() =>
                                    dispatch({
                                      type: "MOVE_SUB",
                                      categoryItemId: cat.itemId,
                                      itemId: sub.itemId,
                                      to: "bottom",
                                    })
                                  }
                                >
                                  <ChevronsDown size={14} />
                                </button>
                              </div>
                            )}
                            <div className="merch-row__label">
                              <span className="merch-row__name">
                                {subIndex + 1}. {sub.name}
                              </span>
                            </div>

                            {can("arrangement","create_edit") && (
                            <div className="merch-row__flags">
                                  <button
                                type="button"
                                className={`merch-flag merch-flag--visible ${sub.visible ? "merch-flag--on" : ""}`}
                                title={
                                  sub.visible
                                    ? "Visible - click to hide"
                                    : "Hidden - click to show"
                                }
                                onClick={() =>
                                  toggleSubVisible(cat.itemId, sub)
                                }
                              >
                                {sub.visible ? (
                                  <Eye size={14} />
                                ) : (
                                  <EyeOff size={14} />
                                )}
                                </button>
                                <button
                                  type="button"
                                  className="merch-icon-btn merch-icon-btn--danger"
                                  title="Remove from this placement"
                                  onClick={() =>
                                    removeSub(cat.itemId, sub.itemId)
                                  }
                                >
                                  <X size={14} />
                                </button>
                            </div>
                              )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {addCategoryOpen && (
        <AddItemsModal
          slug={SLUG_MEGA_MENU}
          entityType="category"
          title="Add Category to Mega Menu"
          onClose={() => setAddCategoryOpen(false)}
          onAdded={invalidate}
        />
      )}

      {addSubcategoryFor !== null && (
        <AddItemsModal
          slug={SLUG_MEGA_MENU}
          entityType="subcategory"
          categoryId={addSubcategoryFor}
          title="Add Subcategory"
          onClose={() => setAddSubcategoryFor(null)}
          onAdded={invalidate}
        />
      )}
    </>
  );
}

// ─────────────────────────── Page ───────────────────────────

type Tab = "mega-menu" | "category-grid";

const AdminMerchandising = () => {
  const [tab, setTab] = useState<Tab>("mega-menu");
  const [isDirty, setIsDirty] = useState(false);

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    if (
      isDirty &&
      !window.confirm(
        `You have unsaved changes in ${tab === "mega-menu" ? "Mega Menu" : "Category Grid"}. Leave without saving?`,
      )
    ) {
      return;
    }
    setIsDirty(false);
    setTab(next);
  };

  return (
    <div className="merch-page">
      <AdminSidebar />
      <div className="merch-page__content">
        <Header showSearch={false} />
        <div className="merch">
          <div className="merch__head">
            <div>
              <h1 className="merch__title">Arrangements</h1>
              <p className="merch__subtitle">
                Categories only know they exist. Arrangements decide where they
                appear.
              </p>
            </div>
          </div>

          <div className="merch__tabs">
            <button
              type="button"
              className={
                tab === "mega-menu"
                  ? "merch__tab merch__tab--active"
                  : "merch__tab"
              }
              onClick={() => switchTab("mega-menu")}
            >
              Mega Menu
            </button>
            <button
              type="button"
              className={
                tab === "category-grid"
                  ? "merch__tab merch__tab--active"
                  : "merch__tab"
              }
              onClick={() => switchTab("category-grid")}
            >
              Category Grid
            </button>
          </div>

          {tab === "mega-menu" ? (
            <MegaMenuArrangement onDirtyChange={setIsDirty} />
          ) : (
            <CategoryGridArrangement onDirtyChange={setIsDirty} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMerchandising;
