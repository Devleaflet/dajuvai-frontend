import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; // Import useLocation
import "../Styles/Sidebar.css";
import { useVendorAuth } from "../context/VendorAuthContext";
import axiosInstance from "../api/axiosInstance";

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
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 8C12 2 20 2 24 8C28 14 24 22 16 22"
                stroke="#FF6B00"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M16 22C8 22 4 14 8 8"
                stroke="#FFB800"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="sidebar__logo-text">Daju Vai</span>
          </Link>
        </div>
      )}

      <nav className="sidebar__nav">
        {/* Pass the current location to NavItem */}
        <NavItem to="/dashboard" icon="dashboard" active={location.pathname === "/dashboard"}>
          Dashboard
        </NavItem>
        <NavItem
          to="/vendor-product"
          icon="products"
          active={location.pathname === "/vendor-product"}
        >
          Products
        </NavItem>
        <NavItem
          to="/vendor-orders"
          icon="orders"
          active={location.pathname === "/vendor-orders"}
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
          icon="profile"
          active={location.pathname === "/vendor-profile"}
        >
          Profile
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