import { FolderTree, LoaderCircle, Search, Tag, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSearchSuggestions,
  type SearchProductSuggestion,
  type SearchScopeSuggestion,
} from "../api/search";
import {
  clearRecentSearches,
  getRecentSearches,
  normalizeSearchTerm,
  removeRecentSearch,
  saveRecentSearch,
} from "../utils/recentSearches";
import {
  productSearchPath,
  shopCategorySearchPath,
  shopSearchPath,
} from "../utils/searchNavigation";
import {
  buildInlineSearchOptions,
  type InlineSearchOption,
} from "../utils/inlineSearchOptions";
import { useDebouncedValue } from "../utils/useDebouncedValue";

type InlineNavbarSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

const formatPrice = (price: number): string =>
  new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(price || 0);

const highlight = (value: string, query: string) => {
  const index = value.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (!query || index < 0) return value;
  return (
    <>
      {value.slice(0, index)}
      <mark>{value.slice(index, index + query.length)}</mark>
      {value.slice(index + query.length)}
    </>
  );
};

export default function InlineNavbarSearch({
  query,
  onQueryChange,
  inputRef,
}: InlineNavbarSearchProps) {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recents, setRecents] = useState<string[]>(getRecentSearches);
  const normalizedQuery = normalizeSearchTerm(query);
  const debouncedQuery = useDebouncedValue(normalizedQuery, 180);
  const suggestions = useSearchSuggestions(debouncedQuery);
  const isWaitingForSuggestions =
    normalizedQuery.length >= 2 && normalizedQuery !== debouncedQuery;
  // Do not pair an earlier response with the latest input while the debounce
  // timer or request is pending. It makes keyboard selection deterministic.
  const results =
    normalizedQuery === debouncedQuery ? suggestions.data : undefined;
  const hasSuggestionError =
    normalizedQuery === debouncedQuery && suggestions.isError;
  const options = useMemo(
    () =>
      results && normalizedQuery.length >= 2
        ? buildInlineSearchOptions(results, query.trim())
        : [],
    [normalizedQuery.length, query, results],
  );

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    let previousHeight = viewport.height;
    let keyboardWasVisible = false;
    const closeAfterKeyboardDismissal = () => {
      if (!window.matchMedia("(max-width: 768px)").matches) return;

      const nextHeight = viewport.height;
      if (nextHeight < previousHeight - 80) keyboardWasVisible = true;
      if (keyboardWasVisible && nextHeight > previousHeight + 80) {
        keyboardWasVisible = false;
        setOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
      }
      previousHeight = nextHeight;
    };

    viewport.addEventListener("resize", closeAfterKeyboardDismissal);
    return () =>
      viewport.removeEventListener("resize", closeAfterKeyboardDismissal);
  }, [inputRef]);

  useEffect(() => {
    const closeOnPageScroll = () => {
      if (!window.matchMedia("(max-width: 768px)").matches) return;
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    };

    window.addEventListener("scroll", closeOnPageScroll, { passive: true });
    return () => window.removeEventListener("scroll", closeOnPageScroll);
  }, [inputRef]);

  const finish = (path: string, search: string) => {
    if (search.trim()) saveRecentSearch(search);
    setRecents(getRecentSearches());
    setOpen(false);
    onQueryChange("");
    navigate(path);
  };

  const runOption = (option: InlineSearchOption) => {
    if (option.type === "product" && option.entityId) {
      finish(productSearchPath(option.entityId), query);
      return;
    }
    if (option.type === "category" && option.entityId) {
      finish(shopCategorySearchPath(option.entityId), query);
      return;
    }
    finish(
      shopSearchPath(option.type === "brand" ? option.name : query),
      option.type === "brand" ? option.name : query,
    );
  };

  const submit = () => {
    if (normalizedQuery.length >= 2)
      finish(shopSearchPath(normalizedQuery), normalizedQuery);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && options.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }
    if (event.key === "ArrowUp" && options.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0) runOption(options[activeIndex]);
      else submit();
    }
  };

  const showResults = open && normalizedQuery.length >= 2;
  const showRecents = open && !normalizedQuery;
  const noProducts = results && results.products.length === 0;

  return (
    <div className="navbar__search" ref={rootRef}>
      <form
        className="navbar__search-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Search className="navbar__search-icon" size={18} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          placeholder="Search products, brands, categories"
          maxLength={80}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={() => {
            setOpen(true);
            setRecents(getRecentSearches());
          }}
          onKeyDown={handleKeyDown}
          className="navbar__search-input"
          role="combobox"
          aria-expanded={open}
          aria-controls="navbar-search-results"
          aria-activedescendant={
            activeIndex >= 0 ? options[activeIndex]?.id : undefined
          }
          autoComplete="off"
        />
        {suggestions.isFetching && normalizedQuery.length >= 2 && (
          <LoaderCircle
            className="navbar__search-loading"
            size={17}
            aria-label="Searching"
          />
        )}
        {query && (
          <button
            type="button"
            className="navbar__search-clear"
            aria-label="Clear search"
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus();
            }}
          >
            <X size={16} />
          </button>
        )}
        <button
          type="submit"
          className="navbar__search-button"
          aria-label="Search products"
        >
          <Search size={17} />
        </button>
      </form>

      {open && (
        <div
          id="navbar-search-results"
          className="navbar__search-results"
          role="listbox"
        >
          <div className="navbar__search-results-scroll">
          {showRecents && (
            <section className="navbar__search-section">
              <div className="navbar__search-heading">
                <span>Recent searches</span>
                {recents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearRecentSearches();
                      setRecents([]);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              {recents.length ? (
                recents.map((item) => (
                  <div className="navbar__search-recent" key={item}>
                    <button
                      type="button"
                      onClick={() => finish(shopSearchPath(item), item)}
                    >
                      {item}
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${item}`}
                      onClick={() => {
                        removeRecentSearch(item);
                        setRecents(getRecentSearches());
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="navbar__search-state">
                  Start typing to search catalog.
                </p>
              )}
            </section>
          )}
          {open && normalizedQuery.length === 1 && (
            <p className="navbar__search-state">
              Type one more character to search.
            </p>
          )}
          {showResults &&
            (isWaitingForSuggestions || suggestions.isLoading) && (
              <div
                className="navbar__search-skeleton"
                aria-label="Loading search results"
              >
                <span />
                <span />
                <span />
              </div>
            )}
          {showResults && hasSuggestionError && (
            <p className="navbar__search-state">
              Search unavailable.{" "}
              <button type="button" onClick={() => suggestions.refetch()}>
                Retry
              </button>
            </p>
          )}
          {showResults && results && !hasSuggestionError && (
            <>
              <ProductResults
                products={results.products}
                query={normalizedQuery}
                options={options}
                activeIndex={activeIndex}
                onSelect={(product) =>
                  finish(productSearchPath(product.id), normalizedQuery)
                }
              />
              <ScopeResults
                title="Categories"
                type="category"
                items={results.categories}
                options={options}
                activeIndex={activeIndex}
                onSelect={(item) =>
                  finish(shopCategorySearchPath(item.id), query)
                }
              />
              <ScopeResults
                title="Brands"
                type="brand"
                items={results.brands}
                options={options}
                activeIndex={activeIndex}
                onSelect={(item) =>
                  finish(shopSearchPath(item.name), item.name)
                }
              />
              {noProducts && (
                <p className="navbar__search-state">
                  No products found. Try broader words.
                </p>
              )}
            </>
          )}
          </div>
          {showResults && results && !hasSuggestionError && (
            <div className="navbar__search-results-footer">
              <button
                id="view-all-results"
                className="navbar__search-view-all"
                type="button"
                role="option"
                aria-selected={options[activeIndex]?.id === "view-all-results"}
                onClick={submit}
              >
                View all {results.totalProducts} results
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductResults({
  products,
  query,
  options,
  activeIndex,
  onSelect,
}: {
  products: SearchProductSuggestion[];
  query: string;
  options: InlineSearchOption[];
  activeIndex: number;
  onSelect: (product: SearchProductSuggestion) => void;
}) {
  if (!products.length) return null;
  return (
    <section className="navbar__search-section">
      <div className="navbar__search-heading">
        <span>Products</span>
      </div>
      {products.map((product) => {
        const optionIndex = options.findIndex(
          (option) => option.id === `product-${product.id}`,
        );
        return (
          <button
            key={product.id}
            id={`product-${product.id}`}
            type="button"
            role="option"
            aria-selected={activeIndex === optionIndex}
            className="navbar__search-product"
            onClick={() => onSelect(product)}
          >
            <span className="navbar__search-product-image">
              {product.thumbnailUrl ? (
                <img src={product.thumbnailUrl} alt="" />
              ) : (
                <Search size={18} />
              )}
            </span>
            <span className="navbar__search-product-copy">
              <strong>{highlight(product.name, query)}</strong>
              <small>{product.inStock ? "In stock" : "Out of stock"}</small>
            </span>
            <span className="navbar__search-price">
              {formatPrice(product.effectivePrice)}
            </span>
          </button>
        );
      })}
    </section>
  );
}

function ScopeResults({
  title,
  type,
  items,
  options,
  activeIndex,
  onSelect,
}: {
  title: string;
  type: "category" | "brand";
  items: SearchScopeSuggestion[];
  options: InlineSearchOption[];
  activeIndex: number;
  onSelect: (item: SearchScopeSuggestion) => void;
}) {
  if (!items.length) return null;
  return (
    <section
      className={`navbar__search-section navbar__search-section--scopes navbar__search-section--${type}s`}
    >
      <div className="navbar__search-heading">
        <span>{title}</span>
      </div>
      <div className="navbar__search-scope-list">
        {items.map((item) => {
          const optionIndex = options.findIndex(
            (option) => option.id === `${type}-${item.id}`,
          );
          return (
            <button
              key={item.id}
              id={`${type}-${item.id}`}
              type="button"
              role="option"
              aria-selected={activeIndex === optionIndex}
              className={`navbar__search-scope navbar__search-scope--${type}`}
              onClick={() => onSelect(item)}
            >
              {type === "category" ? (
                <span className="navbar__search-scope-image" aria-hidden="true">
                  {item.image ? (
                    <img src={item.image} alt="" />
                  ) : (
                    <FolderTree size={15} />
                  )}
                </span>
              ) : (
                <Tag size={14} aria-hidden="true" />
              )}
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
