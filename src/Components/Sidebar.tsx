import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; // Import useLocation
import "../Styles/Sidebar.css";
import { useVendorAuth } from "../context/VendorAuthContext";
import axiosInstance from "../api/axiosInstance";
import logo from "../assets/logo.webp";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ ...props }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const [unreadCount, setUnreadCount] = useState(0);
  const { authState } = useVendorAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1000);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get the current location using React Router's useLocation hook
  const location = useLocation();

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

  return (
    <div className={`sidebar ${isMobile ? "sidebar--dock" : ""}`} {...props}>
      {/* Only show header in desktop view */}
      {!isMobile && (
        <div className="sidebar__header">
          <Link to="/" className="sidebar__logo">
            <img src={logo} alt="Dajuvai Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
            <span className="sidebar__logo-text">Daju Vai</span>
          </Link>
        </div>
      )}

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
  );
}

interface NavItemProps {
  to: string;
  icon: string | React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  badge?: number;
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