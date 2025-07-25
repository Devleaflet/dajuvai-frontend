import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../Styles/Sidebar.css";

export function AdminSidebar({ ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1000);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get the current location using React Router's useLocation hook
  const location = useLocation();

  return (
    <div className={`sidebar ${isMobile ? "sidebar--dock" : ""}`} {...props}>
      {/* Only show header in desktop view */}
      {!isMobile && (
        <div className="sidebar__header">
          <Link to="/admin-dashboard" className="sidebar__logo">
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
            <span className="sidebar__logo-text">Admin Panel</span>
          </Link>
        </div>
      )}

      <nav className="sidebar__nav">
        <NavItem 
          to="/admin-dashboard" 
          active={location.pathname === "/admin-dashboard"}
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
          to="/admin-catalog" 
          active={location.pathname === "/admin-catalog"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          Catalog
        </NavItem>
        <NavItem 
          to="/admin-products" 
          active={location.pathname === "/admin-products"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          Products
        </NavItem>
        <NavItem 
          to="/admin-categories" 
          active={location.pathname === "/admin-categories"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 9H20M4 15H20M10 3V21M14 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          Categories
        </NavItem>
        <NavItem 
          to="/admin-deals" 
          active={location.pathname === "/admin-deals"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          Deals
        </NavItem>
        <NavItem 
          to="/admin-banner" 
          active={location.pathname === "/admin-banner"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M3 12H21" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 3V21" stroke="currentColor" strokeWidth="2"/>
            </svg>
          }
        >
          Banners
        </NavItem>
        <NavItem 
          to="/admin-orders" 
          active={location.pathname === "/admin-orders"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
        >
          Orders
        </NavItem>
        <NavItem 
          to="/admin-customers" 
          active={location.pathname === "/admin-customers"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          Customers
        </NavItem>
        <NavItem 
          to="/admin-vendors" 
          active={location.pathname === "/admin-vendors"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21H5M19 21H21M5 21H3M9 7H15M9 11H15M9 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          Vendors
        </NavItem>
        <NavItem 
          to="/admin/district" 
          active={location.pathname === "/admin/district"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2V22" stroke="currentColor" strokeWidth="2"/>
            </svg>
          }
        >
          Districts
        </NavItem>
      </nav>
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

function NavItem({ to, icon, children, active }: NavItemProps) {
  return (
    <Link
      to={to}
      className={`sidebar__item ${active ? "sidebar__item--active" : ""}`}
      title={String(children)}
    >
      <span className="sidebar__icon">{icon}</span>
      <span className="sidebar__text">{children}</span>
    </Link>
  );
}