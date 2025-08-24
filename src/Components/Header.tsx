import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { VendorAuthService } from "../services/vendorAuthService";

// Define the props interface for the Header component
interface HeaderProps {
  onSearch: (query: string) => void;
  showSearch?: boolean;
  title?: string;
  onSort?: (sortOption: string) => void;
  sortOption?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  showSearch = true, 
  title, 
  onSort, 
  sortOption = "newest" 
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onSearch(query);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOption = e.target.value;
    if (onSort) {
      onSort(newSortOption);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  if (!user) return null;

  return (
    <>
      <header className="dashboard__header">
        <h1 className="dashboard__title">{title || "Daju Vai Admin"}</h1>
        <div className="dashboard__user" ref={dropdownRef}>
          <div className="dashboard__avatar">
            <span className="dashboard__avatar-text">
              {user.username ? user.username.split(' ').map(n => n[0]).join('') : user.email?.[0] || "A"}
            </span>
          </div>
          <div className="dashboard__user-info">
            <p className="dashboard__username">{user.username || user.email}</p>
            <p className="dashboard__version">Admin</p>
          </div>
          <button className="dashboard__dropdown-button" onClick={() => setDropdownOpen(v => !v)}>
            <span className="dashboard__dropdown-icon"></span>
          </button>
          {dropdownOpen && (
            <div className="dashboard__dropdown-menu">
              <button className="dashboard__dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/"); }}>Home</button>
              <button className="dashboard__dropdown-item" onClick={() => { setDropdownOpen(false); VendorAuthService.comprehensiveLogout(); }}>Logout</button>
            </div>
          )}
        </div>
      </header>
      <div>
        {showSearch && (
          <div className="dashboard__search-container" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div className="dashboard__search" style={{ flex: 1, minWidth: 200 }}>
              <input
                type="text"
                placeholder="Search"
                className="dashboard__search-input"
                onChange={handleInputChange}
              />
              <span className="dashboard__search-icon"></span>
            </div>
            {onSort && (
              <select
                className="vendor-product__sort-select"
                value={sortOption}
                onChange={handleSortChange}
                style={{ minWidth: 180, height: 38, borderRadius: 20, border: '1px solid #e5e7eb', padding: '0 12px', background: '#fff', fontSize: 14 }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
              </select>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Header;