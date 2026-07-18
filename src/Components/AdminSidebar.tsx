import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../Styles/Sidebar.css";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import logo from "../assets/logo.webp";

export function AdminSidebar({ ...props }: React.HTMLAttributes<HTMLElement>) {
  const [unapprovedCount, setUnapprovedCount] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, token } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen]);

  useEffect(() => {
    if (location.pathname === "/admin-vendors") {
      setUnapprovedCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!token) {
      setUnapprovedCount(0);
      return;
    }

    const controller = new AbortController();

    const fetchUnapprovedCount = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/vendors/unapproved/count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) return;

        const data = await response.json();

        if (data.success) {
          setUnapprovedCount(Number(data.count) || 0);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to fetch unapproved count:", error);
        }
      }
    };

    fetchUnapprovedCount();

    const intervalId = window.setInterval(fetchUnapprovedCount, 60_000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [token]);

  return (
    <aside
      className={`sidebar${isMobileOpen ? " sidebar--open" : ""}`}
      aria-label="Admin navigation"
      {...props}
    >
      <div className="sidebar__mobile-bar">
        <div className="sidebar__mobile-brand">
          <img src={logo} alt="" aria-hidden="true" />
          <span className="sidebar__mobile-brand-text">Admin Panel</span>
        </div>

        <button
          type="button"
          className="sidebar__menu-button"
          aria-label="Open admin navigation"
          aria-expanded={isMobileOpen}
          aria-controls="admin-sidebar-panel"
          onClick={() => setIsMobileOpen(true)}
        >
          <MenuIcon />
        </button>
      </div>

      <button
        type="button"
        className="sidebar__backdrop"
        aria-label="Close admin navigation"
        tabIndex={isMobileOpen ? 0 : -1}
        onClick={() => setIsMobileOpen(false)}
      />

      <div
        id="admin-sidebar-panel"
        className="sidebar__panel"
        aria-hidden={!isMobileOpen}
      >
        <div className="sidebar__header">
          <div className="sidebar__header-inner">
            <Link to="/admin-dashboard" className="sidebar__logo">
              <img
                src={logo}
                alt="Dajuvai Logo"
                className="sidebar__logo-image"
              />
              <span className="sidebar__logo-text">Admin Panel</span>
            </Link>

            <button
              type="button"
              className="sidebar__close-button"
              aria-label="Close admin navigation"
              onClick={() => setIsMobileOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <nav className="sidebar__nav">
          <NavItem
            to="/admin-dashboard"
            active={location.pathname === "/admin-dashboard"}
            icon={<DashboardIcon />}
          >
            Dashboard
          </NavItem>

          <NavItem
            to="/admin-catalog"
            active={location.pathname === "/admin-catalog"}
            icon={<CatalogIcon />}
          >
            Catalog
          </NavItem>

          <NavItem
            to="/admin-products"
            active={location.pathname === "/admin-products"}
            icon={<ProductsIcon />}
          >
            Products
          </NavItem>

          <NavItem
            to="/admin-categories"
            active={location.pathname === "/admin-categories"}
            icon={<CategoriesIcon />}
          >
            Categories
          </NavItem>

          <NavItem
            to="/admin-merchandising"
            active={location.pathname === "/admin-merchandising"}
            icon={<ArrangementIcon />}
          >
            Arrangements
          </NavItem>

          <NavItem
            to="/admin-deals"
            active={location.pathname === "/admin-deals"}
            icon={<DealsIcon />}
          >
            Deals
          </NavItem>

          <NavItem
            to="/admin-promo"
            active={location.pathname === "/admin-promo"}
            icon={<PromoIcon />}
          >
            Promo Codes
          </NavItem>

          <NavItem
            to="/admin-banner"
            active={location.pathname === "/admin-banner"}
            icon={<BannerIcon />}
          >
            Banners
          </NavItem>

          <NavItem
            to="/admin-orders"
            active={location.pathname === "/admin-orders"}
            icon={<OrdersIcon />}
          >
            Orders
          </NavItem>

          <NavItem
            to="/admin-delivery"
            active={location.pathname === "/admin-delivery"}
            icon={<DeliveryIcon />}
          >
            Delivery
          </NavItem>

          <NavItem
            to="/admin-notifications"
            active={location.pathname === "/admin-notifications"}
            icon={<NotificationIcon />}
          >
            Notifications
          </NavItem>

          <NavItem
            to="/admin-customers"
            active={location.pathname === "/admin-customers"}
            icon={<CustomersIcon />}
          >
            Customers
          </NavItem>

          <NavItem
            to="/admin-vendors"
            active={location.pathname === "/admin-vendors"}
            badge={unapprovedCount}
            icon={<VendorsIcon />}
          >
            Vendors
          </NavItem>

          <NavItem
            to="/admin/district"
            active={location.pathname === "/admin/district"}
            icon={<DistrictIcon />}
          >
            Districts
          </NavItem>

          {user?.role === "admin" && (
            <NavItem
              to="/admin/staff"
              active={location.pathname === "/admin/staff"}
              icon={<StaffIcon />}
            >
              Staff
            </NavItem>
          )}

          <NavItem
            to="/admin/commission"
            active={location.pathname === "/admin/commission"}
            icon={<CommissionIcon />}
          >
            Commission Doc
          </NavItem>

          <NavItem
            to="/admin-profile"
            active={location.pathname === "/admin-profile"}
            icon={<ProfileIcon />}
          >
            Profile
          </NavItem>
        </nav>
      </div>
    </aside>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  badge?: number;
}

function NavItem({ to, icon, children, active, badge }: NavItemProps) {
  const badgeLabel =
    badge && badge > 0 ? (badge > 99 ? "99+" : String(badge)) : null;

  return (
    <Link
      to={to}
      className={`sidebar__item${active ? " sidebar__item--active" : ""}`}
      title={String(children)}
    >
      <span className="sidebar__icon-wrap">
        {icon}
        {badgeLabel && <span className="sidebar__badge">{badgeLabel}</span>}
      </span>
      <span className="sidebar__text">{children}</span>
    </Link>
  );
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

function DashboardIcon() {
  return (
    <svg {...svgProps}>
      <rect
        x="3"
        y="3"
        width="7"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="5"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="14"
        y="12"
        width="7"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="3"
        y="16"
        width="7"
        height="5"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function CatalogIcon() {
  return (
    <svg {...svgProps}>
      <path
        d="M19 11H5M19 11C20.1 11 21 11.9 21 13V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V13C3 11.9 3.9 11 5 11M19 11V9C19 7.9 18.1 7 17 7M5 11V9C5 7.9 5.9 7 7 7M7 7V5C7 3.9 7.9 3 9 3H15C16.1 3 17 3.9 17 5V7M7 7H17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg {...svgProps}>
      <path
        d="M20 7 12 3 4 7m16 0v10l-8 4m8-14-8 4m0 10-8-4V7m8 14V11M4 7l8 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg {...svgProps}>
      <path
        d="M4 9h16M4 15h16M10 3v18M14 3v18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrangementIcon() {
  return (
    <svg {...svgProps}>
      <path
        d="M4 6h16M4 12h16M4 18h10m3-3 3 3-3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DealsIcon() {
  return (
    <svg {...svgProps}>
      <path
        d="m12 2 3.1 6.3 6.9 1-5 4.8 1.2 6.9-6.2-3.2L5.8 21 7 14.1 2 9.3l6.9-1L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PromoIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BannerIcon() {
  return (
    <svg {...svgProps}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M3 12h18M12 3v18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg {...svgProps}>
      <path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3M9 12h.01M9 16h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15H3V5a2 2 0 0 1 2-2h11v12m0-5h3.5l1.5 3v2h-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg {...svgProps}>
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 21a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VendorsIcon() {
  return (
    <svg {...svgProps}>
      <path
        d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0H5m14 0h2M5 21H3M9 7h6M9 11h6M9 15h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DistrictIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg {...svgProps}>
      <path
        d="M1 20h13m3 0h5v-2c0-1.9-2.5-3-4-3s-2 1-3 1-1.5-1-3-1-2.5 1-3 1m9-1s1-1 1-3-1-5-4-5m-6 8s1-1 1-3-1-5-4-5-4 3-4 5 1 3 1 3M9 7c0-2.2 1.3-4 3-4s3 1.8 3 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommissionIcon() {
  return (
    <svg {...svgProps}>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6M9 13h6M9 17h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 21v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
