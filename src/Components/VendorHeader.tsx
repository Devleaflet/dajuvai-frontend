import React, { useState, useRef, useEffect } from "react";
import { useVendorAuth } from "../context/VendorAuthContext";
import { useNavigate } from "react-router-dom";
import { VendorAuthService } from "../services/vendorAuthService";

interface VendorHeaderProps {
  title: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

const VendorHeader: React.FC<VendorHeaderProps> = ({ title, onSearch, showSearch = true }) => {
  const { authState, logout } = useVendorAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
      onSearch(e.target.value);
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

  return (
    <>
      <header className="dashboard__header">
        <h1 className="dashboard__title">{title}</h1>
        <div className="dashboard__user" ref={dropdownRef}>
          <div className="dashboard__avatar">
            <span className="dashboard__avatar-text">
              {authState.vendor?.businessName ? authState.vendor.businessName.charAt(0).toUpperCase() : "DV"}
            </span>
          </div>
          <div className="dashboard__user-info">
            <p className="dashboard__username">{authState.vendor?.businessName || "Unknown Vendor"}</p>
            <p className="dashboard__email">{authState.vendor?.email || "Unknown Email"}</p>
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
      {showSearch && onSearch && (
        <div className="dashboard__search-container">
          <div className="dashboard__search">
            <input
              type="text"
              placeholder="Search"
              className="dashboard__search-input"
              onChange={handleInputChange}
            />
            <span className="dashboard__search-icon"></span>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorHeader; 