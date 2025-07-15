import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; // Import useLocation
import "../Styles/Sidebar.css";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ ...props }: SidebarProps) {
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
  icon: string;
  children: React.ReactNode;
  active?: boolean; // Add active prop
}

function NavItem({ to, icon, children, active }: NavItemProps) {
  return (
    <Link
      to={to}
      className={`sidebar__item ${active ? "sidebar__item--active" : ""}`}
      title={String(children)}
    >
      <span className={`sidebar__icon sidebar__icon--${icon}`}></span>
      <span className="sidebar__text">{children}</span>
    </Link>
  );
}