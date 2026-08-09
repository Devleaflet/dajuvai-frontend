import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../Styles/Sidebar.css";
import { useVendorAuth } from "../context/VendorAuthContext";
import axiosInstance from "../api/axiosInstance";
import { API_BASE_URL } from "../config";
import logo from "../assets/logo.webp";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ ...props }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const avatarDropdownRef = useRef<HTMLDivElement>(null);
  const { authState, logout } = useVendorAuth();
  const navigate = useNavigate();

  // Get the current location using React Router's useLocation hook
  const location = useLocation();

  const vendorProfilePicture = useMemo(() => {
    const value = authState.vendor?.profilePicture;
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  }, [authState.vendor?.profilePicture]);

  const vendorInitials = useMemo(() => {
    if (authState.vendor?.businessName) {
      return authState.vendor.businessName.charAt(0).toUpperCase();
    }
    return "V";
  }, [authState.vendor?.businessName]);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsAvatarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useBodyScrollLock(isMobileOpen);

  useEffect(() => {
    setIsAvatarOpen(false);
    if (!isMobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isAvatarOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(e.target as Node)) {
        setIsAvatarOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsAvatarOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAvatarOpen]);

  // Fetch unread count — reset to 0 when on the notifications page, poll otherwise
  useEffect(() => {
    if (location.pathname === "/vendor-notifications") {
      setUnreadCount(0);
      return;
    }

    if (!authState.token) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await axiosInstance.get("/api/notification", {
          headers: { Authorization: `Bearer ${authState.token}` },
        });
        if (response.data?.success) {
          const count = response.data.data.filter((n: { isRead: boolean }) => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch {
        // silently ignore — badge simply won't show
      }
    };

    fetchUnreadCount();
    // Poll every 60 seconds to keep count fresh
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [authState.token, location.pathname]);

  const { className: propsClassName, ...restProps } = props;

  return (
    <aside
      className={`sidebar${isMobileOpen ? " sidebar--open" : ""} ${propsClassName || ""}`.trim()}
      aria-label="Vendor navigation"
      {...restProps}
    >
      <div className="sidebar__mobile-bar">
        <div className="sidebar__mobile-brand">
          <img src={logo} alt="" aria-hidden="true" />
          <span className="sidebar__mobile-brand-text">Vendor Panel</span>
        </div>

        <div className="sidebar__mobile-right">
          <div className="sidebar__mobile-avatar" ref={avatarDropdownRef}>
            <button
              type="button"
              className="sidebar__mobile-avatar-btn"
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={isAvatarOpen}
              onClick={() => setIsAvatarOpen(prev => !prev)}
            >
              {vendorProfilePicture ? (
                <img src={vendorProfilePicture} alt="" className="sidebar__mobile-avatar-img" />
              ) : (
                <span className="sidebar__mobile-avatar-text">{vendorInitials}</span>
              )}
            </button>
            {isAvatarOpen && (
              <div className="sidebar__mobile-avatar-menu" role="menu">
                <div className="sidebar__mobile-avatar-menu-header">
                  <span className="sidebar__mobile-avatar-menu-name">{authState.vendor?.businessName || "Vendor"}</span>
                  {authState.vendor?.email && <span className="sidebar__mobile-avatar-menu-email">{authState.vendor.email}</span>}
                </div>
                <div className="sidebar__mobile-avatar-menu-divider" />
                <button type="button" className="sidebar__mobile-avatar-menu-item" role="menuitem" onClick={() => { setIsAvatarOpen(false); navigate("/"); }}>
                  <VendorAvatarHomeIcon />
                  <span>Home</span>
                </button>
                <button type="button" className="sidebar__mobile-avatar-menu-item" role="menuitem" onClick={() => { setIsAvatarOpen(false); navigate("/vendor-profile"); }}>
                  <VendorAvatarProfileIcon />
                  <span>Profile</span>
                </button>
                <div className="sidebar__mobile-avatar-menu-divider" />
                <button type="button" className="sidebar__mobile-avatar-menu-item sidebar__mobile-avatar-menu-item--danger" role="menuitem" onClick={() => { setIsAvatarOpen(false); logout(); }}>
                  <VendorAvatarLogoutIcon />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar__menu-button"
            aria-label="Open vendor navigation"
            aria-expanded={isMobileOpen}
            aria-controls="vendor-sidebar-panel"
            onClick={() => setIsMobileOpen(true)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <button
        type="button"
        className="sidebar__backdrop"
        aria-label="Close vendor navigation"
        tabIndex={isMobileOpen ? 0 : -1}
        onClick={() => setIsMobileOpen(false)}
      />

      <div
        id="vendor-sidebar-panel"
        className="sidebar__panel"
        aria-hidden={isMobileViewport && !isMobileOpen}
      >
        <div className="sidebar__header">
          <div className="sidebar__header-inner">
            <Link to="/" className="sidebar__logo">
              <img src={logo} alt="Dajuvai Logo" className="sidebar__logo-image" />
              <span className="sidebar__logo-text">Vendor Panel</span>
            </Link>

            <button
              type="button"
              className="sidebar__close-button"
              aria-label="Close vendor navigation"
              onClick={() => setIsMobileOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <nav className="sidebar__nav">
        {/* Pass the current location to NavItem */}
        <NavItem
          to="/dashboard"
          active={location.pathname === "/dashboard"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="12" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
              <rect x="3" y="16" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          }
        >
          Dashboard
        </NavItem>
        <NavItem
          to="/vendor-product"
          active={location.pathname === "/vendor-product"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          Products
        </NavItem>
        <NavItem
          to="/vendor-orders"
          active={location.pathname === "/vendor-orders"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
        >
          Orders
        </NavItem>
        <NavItem
          to="/vendor-notifications"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          active={location.pathname === "/vendor-notifications"}
          badge={unreadCount}
        >
          Notifications
        </NavItem>
        <NavItem
          to="/vendor-profile"
          active={location.pathname === "/vendor-profile"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.8954 19.1046 17 18 17H6C4.89543 17 4 17.8954 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          Profile
        </NavItem>
        <NavItem
          to="/vendor-commission"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 13H15M9 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          active={location.pathname === "/vendor-commission"}
        >
          Commission
        </NavItem>
        </nav>
      </div>
    </aside>
  );
}

interface NavItemProps {
  to: string;
  icon: string | React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  badge?: number;
}

const svgProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
};

function MenuIcon() {
  return (
    <svg {...svgProps} aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg {...svgProps} aria-hidden="true">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavItem({ to, icon, children, active, badge }: NavItemProps) {
  const badgeLabel = badge && badge > 0
    ? (badge > 99 ? "99+" : String(badge))
    : null;

  return (
    <Link
      to={to}
      className={`sidebar__item ${active ? "sidebar__item--active" : ""}`}
      title={String(children)}
    >
      <span className="sidebar__icon-wrap">
        {typeof icon === 'string' ? (
          <span className={`sidebar__icon sidebar__icon--${icon}`}></span>
        ) : (
          icon
        )}
        {badgeLabel && (
          <span className="sidebar__badge">{badgeLabel}</span>
        )}
      </span>
      <span className="sidebar__text">{children}</span>
    </Link>
  );
}

const avatarSvgProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
};

function VendorAvatarHomeIcon() {
  return (
    <svg {...avatarSvgProps} aria-hidden="true">
      <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VendorAvatarProfileIcon() {
  return (
    <svg {...avatarSvgProps} aria-hidden="true">
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function VendorAvatarLogoutIcon() {
  return (
    <svg {...avatarSvgProps} aria-hidden="true">
      <path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
