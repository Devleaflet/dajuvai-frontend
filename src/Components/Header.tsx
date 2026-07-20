import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import "../Styles/Header.css";

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  isSearching?: boolean;
  searchResultsLabel?: string;
  onClearSearch?: () => void;
  showSearch?: boolean;
  title?: string;
  subtitle?: string;
  onSort?: (sortOption: string) => void;
  sortOption?: string;
  onFilter?: (filterOption: string) => void;
  filterOption?: string;
  vendors?: {
    businessName?: string;
    id: string | number;
    name?: string;
  }[];
  selectedVendor?: string | null;
  onVendorChange?: (vendorId: string) => void;
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  searchValue,
  searchPlaceholder = "Search...",
  isSearching = false,
  searchResultsLabel,
  onClearSearch,
  showSearch = true,
  title = "Dashboard",
  subtitle,
  onSort,
  sortOption = "newest",
  onFilter,
  filterOption = "all",
  vendors = [],
  selectedVendor = null,
  onVendorChange,
  onMenuToggle,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const profilePicture = useMemo(() => {
    const value = user?.profilePicture;
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  }, [user?.profilePicture]);

  const initials = useMemo(() => {
    if (user?.username) {
      return user.username
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((name) => name.charAt(0).toUpperCase())
        .join("");
    }
    return user?.email?.charAt(0).toUpperCase() || "A";
  }, [user?.username, user?.email]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [dropdownOpen]);

  if (!user) return null;

  const displayName = user.username || user.email || "Admin";

  const showToolbar =
    showSearch || Boolean(onSort) || Boolean(onFilter) || (vendors.length > 0 && Boolean(onVendorChange));

  return (
    <header className="admin-page-header">
      <div className="admin-page-header__topbar">
        <div className="admin-page-header__left">
          <button
            type="button"
            className="admin-page-header__menu-toggle"
            aria-label="Toggle navigation menu"
            onClick={onMenuToggle}
          >
            <MenuIcon />
          </button>
          <div className="admin-page-header__heading">
            <h1 className="admin-page-header__title">{title}</h1>
            {subtitle && <p className="admin-page-header__subtitle">{subtitle}</p>}
          </div>
        </div>

        <div className="admin-page-header__right">
          <div className="admin-page-header__account" ref={dropdownRef}>
            <button
              type="button"
              className="admin-page-header__account-button"
              aria-label="Open administrator menu"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((open) => !open)}
            >
              <span className="admin-page-header__avatar">
                {profilePicture ? (
                  <img src={profilePicture} alt={displayName} className="admin-page-header__avatar-image" />
                ) : (
                  <span className="admin-page-header__avatar-text">{initials}</span>
                )}
              </span>
              <span className="admin-page-header__account-copy">
                <span className="admin-page-header__username">{displayName}</span>
                <span className="admin-page-header__role">Administrator</span>
              </span>
              <ChevronIcon open={dropdownOpen} />
            </button>

            {dropdownOpen && (
              <div className="admin-page-header__menu" role="menu">
                <div className="admin-page-header__menu-profile">
                  <span className="admin-page-header__menu-name">{displayName}</span>
                  {user.email && <span className="admin-page-header__menu-email">{user.email}</span>}
                </div>
                <div className="admin-page-header__menu-divider" />
                <button type="button" className="admin-page-header__menu-item" role="menuitem" onClick={() => { setDropdownOpen(false); navigate("/"); }}>
                  <HomeIcon />
                  <span>View storefront</span>
                </button>
                <button type="button" className="admin-page-header__menu-item admin-page-header__menu-item--danger" role="menuitem" onClick={() => { setDropdownOpen(false); logout(); }}>
                  <LogoutIcon />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showToolbar && (
        <section className="admin-page-header__toolbar" aria-label="Page search and filters">
          <div className="admin-page-header__toolbar-inner">
            {showSearch && (
              <label className="admin-page-header__search">
                <SearchIcon />
                <input
                  type="search"
                  className="admin-page-header__search-input"
                  placeholder={searchPlaceholder}
                  aria-label="Search"
                  value={searchValue}
                  onChange={(event) => onSearch?.(event.target.value)}
                />
                {isSearching && (
                  <span className={`admin-page-header__search-spinner${searchValue ? " admin-page-header__search-spinner--with-clear" : ""}`} aria-label="Searching" />
                )}
                {searchValue && onClearSearch && (
                  <button type="button" className="admin-page-header__search-clear" aria-label="Clear search" onClick={onClearSearch}>
                    x
                  </button>
                )}
              </label>
            )}
            <div className="admin-page-header__filters">
              {onSort && (
                <label className="admin-page-header__field">
                  <span className="admin-page-header__field-label">Sort</span>
                  <span className="admin-page-header__select-shell">
                    <select className="admin-page-header__select" value={sortOption} onChange={(event) => onSort(event.target.value)}>
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                    <SelectChevronIcon />
                  </span>
                </label>
              )}
              {onFilter && (
                <label className="admin-page-header__field">
                  <span className="admin-page-header__field-label">Status</span>
                  <span className="admin-page-header__select-shell">
                    <select className="admin-page-header__select" value={filterOption} onChange={(event) => onFilter(event.target.value)}>
                      <option value="all">All Products</option>
                      <option value="available">Available</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                    <SelectChevronIcon />
                  </span>
                </label>
              )}
              {vendors.length > 0 && onVendorChange && (
                <label className="admin-page-header__field">
                  <span className="admin-page-header__field-label">Vendor</span>
                  <span className="admin-page-header__select-shell">
                    <select className="admin-page-header__select" value={selectedVendor || ""} onChange={(event) => onVendorChange(event.target.value)}>
                      <option value="">All vendors</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.businessName || vendor.name || "Unknown Vendor"}
                        </option>
                      ))}
                    </select>
                    <SelectChevronIcon />
                  </span>
                </label>
              )}
            </div>
          </div>
          {searchResultsLabel && (
            <div className="admin-page-header__search-results">{searchResultsLabel}</div>
          )}
        </section>
      )}
    </header>
  );
};

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="admin-page-header__search-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SelectChevronIcon() {
  return (
    <svg className="admin-page-header__select-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`admin-page-header__chevron${open ? " admin-page-header__chevron--open" : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default Header;
