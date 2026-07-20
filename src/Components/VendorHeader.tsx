import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVendorAuth } from "../context/VendorAuthContext";
import { API_BASE_URL } from "../config";

interface VendorHeaderProps {
  title: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  onMenuToggle?: () => void;
}

const VendorHeader: React.FC<VendorHeaderProps> = ({ title, onSearch, showSearch = true, onMenuToggle }) => {
  const { authState, logout } = useVendorAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const vendorProfilePicture = (() => {
    const value = authState.vendor?.profilePicture;
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  })();

  const vendorInitials = authState.vendor?.businessName
    ? authState.vendor.businessName.charAt(0).toUpperCase()
    : "V";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) onSearch(e.target.value);
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

  return (
    <>
      <header className="dashboard__header">
        <div className="dashboard__header-left">
          <button
            type="button"
            className="dashboard__menu-toggle"
            aria-label="Toggle navigation menu"
            onClick={onMenuToggle}
          >
            <VendorMenuIcon />
          </button>
          <h1 className="dashboard__title">{title}</h1>
        </div>

        <div className="dashboard__user" ref={dropdownRef}>
          <div className="dashboard__avatar">
            {vendorProfilePicture ? (
              <img
                src={vendorProfilePicture}
                alt={authState.vendor?.businessName || "Vendor"}
                className="dashboard__avatar-image"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
              />
            ) : (
              <span className="dashboard__avatar-text">{vendorInitials}</span>
            )}
          </div>
          <div className="dashboard__user-info">
            <p className="dashboard__username">{authState.vendor?.businessName || "Unknown Vendor"}</p>
            <p className="dashboard__email">{authState.vendor?.email || "Unknown Email"}</p>
          </div>
          <button className="dashboard__dropdown-button" onClick={() => setDropdownOpen((v) => !v)}>
            <span className="dashboard__dropdown-icon"></span>
          </button>
          {dropdownOpen && (
            <div className="dashboard__dropdown-menu">
              <button className="dashboard__dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/"); }}>Home</button>
              <button className="dashboard__dropdown-item" onClick={() => { setDropdownOpen(false); logout(); }}>Logout</button>
            </div>
          )}
        </div>
      </header>
      {showSearch && onSearch && (
        <div className="dashboard__search-container">
          <div className="dashboard__search">
            <input type="text" placeholder="Search" className="dashboard__search-input" onChange={handleInputChange} />
            <span className="dashboard__search-icon"></span>
          </div>
        </div>
      )}
    </>
  );
};

function VendorMenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default VendorHeader;
