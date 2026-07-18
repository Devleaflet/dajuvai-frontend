import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAvailableItems,
  addItems,
  type EntityType,
  type AvailableEntity,
} from "../api/merchandising";
import "../Styles/AddItemsModal.css";

interface Props {
  slug: string;
  entityType: EntityType;
  categoryId?: number;
  title: string;
  onClose: () => void;
  onAdded: () => void;
}

const AddItemsModal = ({ slug, entityType, categoryId, title, onClose, onAdded }: Props) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["available-items", slug, entityType, categoryId],
    queryFn: () => fetchAvailableItems(slug, { entityType, categoryId }),
  });

  const groups: { label: string; items: AvailableEntity[] }[] = useMemo(() => {
    if (!data) return [];
    if ("groups" in data) {
      return data.groups.map((g) => ({ label: g.categoryName, items: g.subcategories }));
    }
    return [{ label: "", items: data.items }];
  }, [data]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((item) => item.name.toLowerCase().includes(term)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, search]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      const addedCount = await addItems(
        slug,
        [...selected].map((entityId) => ({ entityType, entityId })),
      );
      toast.success(`${addedCount} item${addedCount === 1 ? "" : "s"} added`);
      onAdded();
      onClose();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="aim-overlay" onClick={onClose}>
      <div className="aim-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aim-header">
          <h2>{title}</h2>
          <button type="button" className="aim-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <label className="aim-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="aim-body">
          {isLoading ? (
            <p className="aim-empty">Loading…</p>
          ) : filteredGroups.every((g) => g.items.length === 0) ? (
            <p className="aim-empty">Nothing to add.</p>
          ) : (
            filteredGroups.map((group) => (
              <div className="aim-group" key={group.label || "flat"}>
                {group.label && <p className="aim-group-label">{group.label}</p>}
                <ul className="aim-list">
                  {group.items.map((item) => (
                    <li key={item.id} className="aim-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggle(item.id)}
                        />
                        {item.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="aim-footer">
          <span>{selected.size} selected</span>
          <div className="aim-footer-actions">
            <button type="button" className="aim-btn aim-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="aim-btn aim-btn--primary"
              disabled={selected.size === 0 || isAdding}
              onClick={handleAdd}
            >
              {isAdding ? "Adding…" : "Add Selected"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItemsModal;
