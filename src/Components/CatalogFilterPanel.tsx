import { Check, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Deal } from "./Types/Deal";
import { Category } from "../services/categoryService";
import {
  CatalogFilters,
  filterCatalogCategories,
  selectCatalogCategoryFilter,
  toggleCatalogSubcategoryFilter,
} from "../utils/catalogFilters";

export interface FilterPanelProps {
  categories: Category[];
  deals: Deal[];
  dealProductCounts: Record<string, number>;
  dealsLoading?: boolean;
  filters: CatalogFilters;
  onChange: (updates: Partial<CatalogFilters>) => void;
  onReset: () => void;
  compact?: boolean;
}

export const CatalogFilterPanel = ({
  categories,
  deals,
  dealProductCounts,
  dealsLoading,
  filters,
  onChange,
  onReset,
  compact,
}: FilterPanelProps) => {
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? "");
  const [priceError, setPriceError] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    () => {
      const initiallyExpanded = new Set<number>(filters.categoryIds);
      for (const category of categories) {
        for (const subcategory of category.subcategories ?? []) {
          if (filters.subcategoryIds.includes(subcategory.id)) {
            initiallyExpanded.add(category.id);
          }
        }
      }
      return initiallyExpanded;
    },
  );
  useEffect(() => {
    setMinPrice(filters.minPrice?.toString() ?? "");
    setMaxPrice(filters.maxPrice?.toString() ?? "");
  }, [filters.minPrice, filters.maxPrice]);
  const visibleCategories = useMemo(
    () => filterCatalogCategories(categories, categorySearch),
    [categories, categorySearch],
  );

  useEffect(() => {
    if (!categorySearch.trim()) return;
    setExpandedCategories(
      new Set(visibleCategories.map((category) => category.id)),
    );
  }, [categorySearch, visibleCategories]);

  const toggleId = (key: "categoryIds" | "subcategoryIds", id: number) => {
    const selected = filters[key];
    if (key === "categoryIds") {
      const childIds =
        categories
          .find((category) => category.id === id)
          ?.subcategories?.map((item) => item.id) ?? [];
      onChange(selectCatalogCategoryFilter(filters, id, childIds));
      return;
    }
    const next = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    onChange({ [key]: next });
  };
  const toggleSubcategory = (parentCategoryId: number, subcategoryId: number) =>
    onChange(
      toggleCatalogSubcategoryFilter(filters, parentCategoryId, subcategoryId),
    );
  const toggleDeal = (dealId: number) => {
    const dealIds = filters.dealIds.includes(dealId)
      ? filters.dealIds.filter((id) => id !== dealId)
      : [...filters.dealIds, dealId];
    onChange({ dealIds, hasDeal: undefined });
  };
  const applyPrice = () => {
    const min = minPrice.trim() === "" ? undefined : Number(minPrice);
    const max = maxPrice.trim() === "" ? undefined : Number(maxPrice);
    if (
      (min !== undefined && (!Number.isFinite(min) || min < 0)) ||
      (max !== undefined && (!Number.isFinite(max) || max < 0))
    ) {
      setPriceError("Enter valid non-negative prices.");
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setPriceError("Minimum price cannot exceed maximum price.");
      return;
    }
    setPriceError("");
    onChange({ minPrice: min, maxPrice: max });
  };
  const toggleCategoryExpanded = (categoryId: number) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <aside
      className={`catalog-filters ${compact ? "catalog-filters--sheet" : ""}`}
      aria-label="Product filters"
    >
      <div className="catalog-filters__heading">
        <h2>Filters</h2>
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
      <section className="catalog-filters__section">
        <h3>Categories</h3>
        <label className="catalog-filters__category-search">
          <Search size={15} />
          <input
            value={categorySearch}
            onChange={(event) => setCategorySearch(event.target.value)}
            placeholder="Search categories"
            aria-label="Search categories and subcategories"
          />
          {categorySearch && (
            <button
              type="button"
              onClick={() => setCategorySearch("")}
              aria-label="Clear category search"
            >
              <X size={14} />
            </button>
          )}
        </label>
        {visibleCategories.length === 0 && (
          <p className="catalog-filters__empty">No categories found</p>
        )}
        <div className="catalog-filters__category-list">
          {visibleCategories.map((category) => (
            <div className="catalog-filters__category" key={category.id}>
              <div className="catalog-filters__category-row">
                <label className="catalog-control catalog-control--category">
                  <input
                    type="checkbox"
                    checked={filters.categoryIds.includes(category.id)}
                    onChange={() => toggleId("categoryIds", category.id)}
                  />
                  <span
                    className="catalog-control__checkbox"
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>{category.name}</span>
                </label>
                {category.subcategories?.length > 0 && (
                  <button
                    type="button"
                    className="catalog-filters__expander"
                    onClick={() => toggleCategoryExpanded(category.id)}
                    aria-label={`Show ${category.name} subcategories`}
                    aria-expanded={expandedCategories.has(category.id)}
                  >
                    {expandedCategories.has(category.id) ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                )}
              </div>
              {expandedCategories.has(category.id) &&
                category.subcategories?.map((subcategory) => (
                  <label
                    className="catalog-control catalog-control--subcategory"
                    key={subcategory.id}
                  >
                    <input
                      type="checkbox"
                      checked={filters.subcategoryIds.includes(subcategory.id)}
                      onChange={() =>
                        toggleSubcategory(category.id, subcategory.id)
                      }
                    />
                    <span
                      className="catalog-control__checkbox"
                      aria-hidden="true"
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span>{subcategory.name}</span>
                  </label>
                ))}
            </div>
          ))}
        </div>
      </section>
      <section className="catalog-filters__section">
        <h3>Price</h3>
        <div className="catalog-filters__price">
          <input
            inputMode="decimal"
            aria-label="Minimum price"
            placeholder="Min"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
          <span>to</span>
          <input
            inputMode="decimal"
            aria-label="Maximum price"
            placeholder="Max"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="catalog-filters__apply-price"
          onClick={applyPrice}
        >
          Apply price
        </button>
        {priceError && (
          <p className="catalog-filters__price-error" role="alert">
            {priceError}
          </p>
        )}
      </section>
      <section className="catalog-filters__section">
        <h3>Deals</h3>
        <label className="catalog-control">
          <input
            type="checkbox"
            checked={filters.hasDeal === true && filters.dealIds.length === 0}
            onChange={(event) =>
              onChange({
                hasDeal: event.target.checked ? true : undefined,
                dealIds: [],
              })
            }
          />
          <span className="catalog-control__checkbox" aria-hidden="true">
            <Check size={12} strokeWidth={3} />
          </span>
          <span>Deals only</span>
        </label>
        {dealsLoading ? (
          <p className="catalog-filters__empty">Loading deals...</p>
        ) : deals.length > 0 ? (
          <div className="catalog-filters__deal-list">
            {deals.map((deal) => {
              const productCount = dealProductCounts[String(deal.id)] ?? 0;
              return (
                <label
                  className="catalog-control catalog-control--deal"
                  key={deal.id}
                >
                  <input
                    type="checkbox"
                    checked={filters.dealIds.includes(deal.id)}
                    onChange={() => toggleDeal(deal.id)}
                  />
                  <span
                    className="catalog-control__checkbox"
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>{deal.name}</span>
                  <strong>{Number(deal.discountPercentage)}%</strong>
                  <em>{productCount}</em>
                </label>
              );
            })}
            {filters.dealIds.length > 0 && (
              <button
                type="button"
                className="catalog-filters__clear-inline"
                onClick={() => onChange({ dealIds: [] })}
              >
                Clear selected deals
              </button>
            )}
          </div>
        ) : (
          <p className="catalog-filters__empty">No active deals</p>
        )}
      </section>
    </aside>
  );
};

export default CatalogFilterPanel;
