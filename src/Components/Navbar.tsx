import React, { useState, useEffect, useRef, useMemo } from "react";
import "../Styles/Navbar.css";
import {
  FaSearch,
  FaShoppingCart,
  FaUser,
  FaHeart,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaCog,
  FaSignOutAlt,
  FaHome,
  FaShoppingBag,
  FaInfoCircle,
} from "react-icons/fa";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa6";
import logo from "../assets/logo.webp";
import nepal from "../assets/nepal.gif";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";
import { useCart } from "../context/CartContext";
import { fetchCategory } from "../api/category";
import { useCategory } from "../context/Category";
import iphone from "../assets/iphone.jpg";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { fetchSubCategory } from "../api/subcategory";

import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../config";
import { useVendorAuth } from "../context/VendorAuthContext";
import VendorAuthModal from "./AuthVendorModal";

interface Category {
  id: number;
  name: string;
  items: Array<{
    id: number;
    name: string;
    image?: string;
  }>;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

const Navbar: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout: userLogout, fetchUserData } = useAuth();
  const { authState: vendorAuthState, logout: vendorLogout } = useVendorAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [sideMenuOpen, setSideMenuOpen] = useState<boolean>(false);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [vendorAuthModalOpen, setVendorAuthModalOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState<boolean>(false);
  const [showComingSoonPopup, setShowComingSoonPopup] = useState<boolean>(false);
  const [isCategoriesReady, setIsCategoriesReady] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [dropdownSubcategories, setDropdownSubcategories] = useState([]);
  const [sideMenuSubcategories, setSideMenuSubcategories] = useState<
    Record<number, Subcategory[]>
  >({});
  const [sideMenuLoading, setSideMenuLoading] = useState<
    Record<number, boolean>
  >({});

  const sideMenuRef = useRef<HTMLDivElement>(null);
  const sideCartRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const cartButtonRef = useRef<HTMLAnchorElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const dropdownTriggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  const {
    cartItems,
    handleCartItemOnDelete,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    updatingItems,
  } = useCart();

  // Maintain a stable render order for cart items to avoid reordering on refresh
  const cartOrderRef = useRef<Map<number, number>>(new Map());
  const nextOrderIndexRef = useRef(0);

  useEffect(() => {
    // Assign stable order indices for any new cart items
    cartItems.forEach((item) => {
      if (!cartOrderRef.current.has(item.id)) {
        cartOrderRef.current.set(item.id, nextOrderIndexRef.current++);
      }
    });
    // Cleanup removed items from the order map
    for (const id of Array.from(cartOrderRef.current.keys())) {
      if (!cartItems.some((ci) => ci.id === id)) {
        cartOrderRef.current.delete(id);
      }
    }
  }, [cartItems]);

  const stableCartItems = useMemo(() => {
    return [...cartItems].sort((a, b) => {
      const ai = cartOrderRef.current.get(a.id) ?? 0;
      const bi = cartOrderRef.current.get(b.id) ?? 0;
      return ai - bi;
    });
  }, [cartItems]);

  const categoryContext = useCategory();
  const updateCategoriesWithSubcategories =
    categoryContext?.updateCategoriesWithSubcategories;
  const categories = categoryContext?.categories || [];

  useEffect(() => {
    if (isAuthenticated && user?.id && !user.username) {
      fetchUserData(user.id);
    }
  }, [isAuthenticated, user, fetchUserData]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authUser") {
        console.log("authUser changed in localStorage:", e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownOpen &&
        dropdownTriggerRef.current &&
        !dropdownTriggerRef.current.contains(event.target as Node) &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }

      if (
        moreDropdownOpen &&
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target as Node)
      ) {
        setMoreDropdownOpen(false);
      }
    }
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileDropdownOpen(false);
        setMoreDropdownOpen(false);
      }
    }
    if (profileDropdownOpen || moreDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [profileDropdownOpen, moreDropdownOpen]);

  const getUserAvatar = () => {
    if (isLoading) return <div className="navbar__avatar-loading"></div>;
    if (!isAuthenticated || !user) return <FaUser />;
    if (user.profilePicture) {
      return (
        <img
          src={user.profilePicture}
          alt={user.username || user.email || "User"}
          className="navbar__avatar-image"
        />
      );
    }
    const letter = user.username?.charAt(0) || user.email?.charAt(0) || "?";
    return (
      <span className="navbar__avatar-circle">{letter.toUpperCase()}</span>
    );
  };

  const toggleSideMenu = (e?: React.MouseEvent): void => {
    e?.preventDefault();
    e?.stopPropagation();
    const newState = !sideMenuOpen;
    setSideMenuOpen(newState);
    if (cartOpen) setCartOpen(false);
    if (newState) {
      document.body.classList.add("navbar--menu-open");
    } else {
      document.body.classList.remove("navbar--menu-open");
    }
  };

  const toggleCart = (e?: React.MouseEvent): void => {
    e?.preventDefault();
    e?.stopPropagation();
    const newState = !cartOpen;
    setCartOpen(newState);
    if (sideMenuOpen) setSideMenuOpen(false);
    if (newState) {
      document.body.classList.add("navbar--menu-open");
    } else {
      document.body.classList.remove("navbar--menu-open");
    }
  };

  const toggleAuthModal = (e?: React.MouseEvent): void => {
    e?.preventDefault();
    setAuthModalOpen(!authModalOpen);
    if (sideMenuOpen) {
      setSideMenuOpen(false);
      document.body.classList.remove("navbar--menu-open");
    }
  };

 const toggleVendorAuthModal = (e?: React.MouseEvent): void => {
    e?.preventDefault();
    setVendorAuthModalOpen(!vendorAuthModalOpen);
    if (sideMenuOpen) {
      setSideMenuOpen(false);
      document.body.classList.remove("navbar--menu-open");
    }
  };
  const showComingSoon = () => {
    setShowComingSoonPopup(true);
    setMoreDropdownOpen(false);
    setTimeout(() => setShowComingSoonPopup(false), 3000);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        sideMenuOpen &&
        sideMenuRef.current &&
        !sideMenuRef.current.contains(e.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(e.target as Node)
      ) {
        toggleSideMenu();
      }

      if (
        cartOpen &&
        sideCartRef.current &&
        !sideCartRef.current.contains(e.target as Node) &&
        cartButtonRef.current &&
        !cartButtonRef.current.contains(e.target as Node)
      ) {
        toggleCart();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [sideMenuOpen, cartOpen]);

  useEffect(() => {
    let prevScrollPos = window.pageYOffset;
    const searchRow = document.querySelector(".navbar__search-row");

    if (window.pageYOffset > 10) {
      searchRow?.classList.add("hidden");
    }

    const handleScroll = (): void => {
      const currentScrollPos = window.pageYOffset;
      if (window.innerWidth <= 1099) {
        if (currentScrollPos <= 10 || prevScrollPos - currentScrollPos > 500) {
          searchRow?.classList.remove("hidden");
        } else {
          searchRow?.classList.add("hidden");
        }
      } else {
        searchRow?.classList.remove("hidden");
      }
      prevScrollPos = currentScrollPos;
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/api/categories");
        if (!response.data.success) {
          throw new Error("Failed to fetch categories");
        }
        return response.data.data;
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (categoriesData && updateCategoriesWithSubcategories) {
      updateCategoriesWithSubcategories(categoriesData).then(() => {
        setIsCategoriesReady(true);
      });
    }
  }, [categoriesData, updateCategoriesWithSubcategories]);

  const showLoading = isCategoriesLoading || !isCategoriesReady;

  useEffect(() => {
    const prefetchCategories = async () => {
      try {
        await fetchCategory();
      } catch (error) {
        console.error("Error prefetching categories:", error);
      }
    };
    prefetchCategories();
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: allProducts = [] } = useQuery({
    queryKey: ["allProducts"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/categories/all/products`
        );
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        return data.success ? data.data : [];
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const handleSetNavbarSearch = (event: CustomEvent) => {
      const { searchQuery } = event.detail;
      console.log("🔍 Navbar received search query:", searchQuery);
      setSearchQuery(searchQuery);

      if (searchQuery && allProducts.length > 0) {
        setTimeout(() => {
          handleSearch();
        }, 100);
      }
    };

    window.addEventListener(
      "setNavbarSearch",
      handleSetNavbarSearch as EventListener
    );

    return () => {
      window.removeEventListener(
        "setNavbarSearch",
        handleSetNavbarSearch as EventListener
      );
    };
  }, [allProducts]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim() || !allProducts.length) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    try {
      const searchTerm = searchQuery.toLowerCase().trim();

      const filteredProducts = allProducts
        .filter((product: any) => {
          const nameMatch = product.name.toLowerCase().includes(searchTerm);
          const descMatch = product.description
            ?.toLowerCase()
            .includes(searchTerm);
          return nameMatch || descMatch;
        })
        .map((product: any) => ({
          id: product.id,
          name: product.name,
          price: product.basePrice * (1 - (product.discount || 0) / 100),
          image: product.productImages?.[0] || iphone,
          discount: product.discount || 0,
          matchScore: calculateMatchScore(product, searchTerm),
        }))
        .sort((a: any, b: any) => b.matchScore - a.matchScore)
        .slice(0, 3);

      setSearchResults(filteredProducts);
      setShowSearchDropdown(filteredProducts.length > 0);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const calculateMatchScore = (product: any, searchTerm: string) => {
    let score = 0;
    const name = product.name.toLowerCase();
    const description = product.description?.toLowerCase() || "";

    if (name === searchTerm) score += 100;
    else if (name.startsWith(searchTerm)) score += 50;
    else if (name.includes(searchTerm)) score += 30;
    if (description.includes(searchTerm)) score += 10;

    return score;
  };

  const formatAttributes = (attrs: any): string => {
    if (!attrs) return "";
    if (Array.isArray(attrs)) {
      return attrs
        .map((a) => {
          if (!a) return "";
          if (typeof a === "string") return a;
          if (typeof a === "object") {
            const key = a.key || a.name || a.attribute || Object.keys(a)[0];
            const value = a.value || a.val || a.option || a[key];
            return [key, value].filter(Boolean).join(": ");
          }
          return String(a);
        })
        .filter(Boolean)
        .join(", ");
    }
    if (typeof attrs === "object") {
      return Object.entries(attrs)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    }
    return String(attrs);
  };

  const getCartVariantLabel = (item: any): string | null => {
    try {
      const name = item?.variant?.name || item?.selectedVariant?.name;
      if (name && typeof name === "string") return name;

      const candidates = [
        item?.variant?.attributes,
        item?.variant?.attributeValues,
        item?.variant?.attrs,
        item?.variant?.attributeSpecs,
        item?.variantAttributes,
        item?.attributes,
      ];
      for (const c of candidates) {
        const s = formatAttributes(c);
        if (s) return s;
      }

      const sku = item?.variant?.sku || item?.sku || item?.variantSku;
      if (sku) return `SKU: ${sku}`;
    } catch {}
    return null;
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSearchResultClick = (productId: number) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    navigate(`/product-page/1/3/${productId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowSearchDropdown(false);
    }
  };

  const handleSubcategoryClick = (
    categoryId: number,
    subcategoryId: number
  ) => {
    setSideMenuOpen(false);
    setActiveDropdown(null);

    const isOnShopPage = window.location.pathname === "/shop";

    if (isOnShopPage) {
      const newUrl = `/shop?categoryId=${categoryId}&subcategoryId=${subcategoryId}`;
      window.history.pushState({}, "", newUrl);

      window.dispatchEvent(
        new CustomEvent("shopFiltersChanged", {
          detail: { categoryId, subcategoryId },
        })
      );
    } else {
      navigate(`/shop?categoryId=${categoryId}&subcategoryId=${subcategoryId}`);
    }
  };

  const renderCategoryDropdown = (category: any) => {
    if (activeDropdown !== category.id) return null;
    return (
      <div className="navbar__dropdown">
        <div className="navbar__dropdown-content">
          {dropdownSubcategories.length > 0 ? (
            dropdownSubcategories.map((subcategory: any) => (
              <Link
                key={subcategory.id}
                to={`/shop?categoryId=${category.id}&subcategoryId=${subcategory.id}`}
                className="navbar__dropdown-link"
                onClick={() =>
                  handleSubcategoryClick(category.id, subcategory.id)
                }
              >
                {subcategory.name}
              </Link>
            ))
          ) : (
            <div className="navbar__dropdown-link">No subcategories</div>
          )}
        </div>
      </div>
    );
  };

  const handleExpandSideMenuCategory = async (categoryId: number) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    if (selectedCategory !== categoryId) {
      setSideMenuLoading((prev) => ({ ...prev, [categoryId]: true }));
      const subs = await fetchSubCategory(categoryId);
      setSideMenuSubcategories((prev) => ({
        ...prev,
        [categoryId]: subs || [],
      }));
      setSideMenuLoading((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  const renderSideMenuCategories = () => {
    if (isCategoriesLoading) {
      return (
        <div className="navbar__side-menu-categories">
          {[1, 2, 3].map((index) => (
            <div key={index} className="navbar__side-menu-category skeleton">
              <div className="skeleton__category"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="navbar__side-menu-categories">
        {showLoading
          ? Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="navbar__side-menu-category skeleton">
              <div className="skeleton__category"></div>
            </div>
          ))
          : categories.map((category: Category) => (
            <div key={category.id} className="navbar__side-menu-category">
              <button
                className="navbar__side-menu-category-button"
                onClick={() => handleExpandSideMenuCategory(category.id)}
              >
                <span>{category.name}</span>
                <FaChevronDown
                  size={20}
                  className={`navbar__side-menu-category-icon ${selectedCategory === category.id
                    ? "navbar__side-menu-category-icon--open"
                    : ""
                    }`}
                />
              </button>
              {selectedCategory === category.id && (
                <div className="navbar__side-menu-subcategories">
                  {sideMenuLoading[category.id] ? (
                    <div style={{ padding: 12, color: "#888" }}>
                      Loading...
                    </div>
                  ) : (
                    (sideMenuSubcategories[category.id] || []).map(
                      (subcategory: Subcategory) => (
                        <Link
                          key={subcategory.id}
                          to={`/shop?categoryId=${category.id}&subcategoryId=${subcategory.id}`}
                          className="navbar__side-menu-subcategory"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSubcategoryClick(
                              category.id,
                              subcategory.id
                            );
                            setSideMenuOpen(false);
                          }}
                        >
                          {subcategory.name}
                        </Link>
                      )
                    )
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    );
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryId = params.get("categoryId");
    if (categoryId) {
      setActiveDropdown(Number(categoryId));
    }
  }, [location.search]);

  useEffect(() => {
    async function fetchSubs() {
      if (activeDropdown) {
        const subs = await fetchSubCategory(activeDropdown);
        setDropdownSubcategories(subs || []);
      } else {
        setDropdownSubcategories([]);
      }
    }
    fetchSubs();
  }, [activeDropdown]);

  const handleFullLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    if (vendorAuthState.isAuthenticated && vendorAuthState.vendor) {
      vendorLogout();
    } else {
      userLogout();
    }
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div>
        
        {/* New Top Links Section */}
        <div className="nav_bar_right">
          <a href="/privacy" className="navbar__top-link">Privacy Policy</a>
          <a href="/terms" className="navbar__top-link">Terms & Conditions</a>
          <a href="/becomevendor" className="navbar__top-link">Become a Vendor</a>
          <a href="/faq" className="navbar__top-link">FAQ</a>
        </div>
        </div>
        <div className="navbar__top">
          <div className="navbar__top-row">
            <div className="navbar__logo">
              <Link to="/">
                <img src={logo} alt="DajuVai" className="navbar__logo-img" />
              </Link>
            </div>

            <div className="navbar__mobile-actions">
              <NavLink
                to="/wishlist"
                className="navbar__account-icon-link"
                style={({ isActive }) => ({
                  color: isActive ? '#f97316' : 'inherit'
                })}
              >
                <FaHeart />
              </NavLink>
              <a
                href="/cart"
                className="navbar__account-icon-link"
                onClick={toggleCart}
                ref={cartButtonRef}
              >
                <FaShoppingCart />
                {cartItems.length > 0 && (
                  <span className="navbar__cart-count navbar__cart-count--mobile">
                    {cartItems.length}
                  </span>
                )}
              </a>
              <div className="navbar__mobile-user" ref={dropdownTriggerRef}>
                <div
                  className="navbar__mobile-avatar"
                  tabIndex={0}
                  role="button"
                  aria-label="Profile"
                  onClick={
                    isAuthenticated
                      ? () => setProfileDropdownOpen((v) => !v)
                      : toggleAuthModal
                  }
                  onKeyDown={(e) => {
                    if (isAuthenticated && (e.key === "Enter" || e.key === " "))
                      setProfileDropdownOpen((v) => !v);
                    if (
                      !isAuthenticated &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      toggleAuthModal({
                        preventDefault: () => { },
                        stopPropagation: () => { },
                      } as unknown as React.MouseEvent);
                    }
                  }}
                  aria-haspopup="true"
                  aria-expanded={profileDropdownOpen}
                >
                  {getUserAvatar()}
                </div>
                {isAuthenticated && profileDropdownOpen && (
                  <div
                    className="navbar__profile-dropdown-card"
                    ref={profileRef}
                  >
                    <div className="navbar__profile-card-header">
                      {getUserAvatar()}
                      <div className="navbar__profile-card-info">
                        <div className="navbar__profile-card-name">
                          {user?.username || user?.email}
                        </div>
                        {user?.email && (
                          <div className="navbar__profile-card-email">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="navbar__profile-card-divider" />
                    {user?.role === 'admin' && (
                      <NavLink
                        to="/admin-dashboard"
                        className="navbar__profile-card-link"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={({ isActive }) => ({
                          color: isActive ? '#f97316' : 'inherit'
                        })}
                      >
                        <FaHome className="navbar__profile-card-icon" /> Admin Dashboard
                      </NavLink>
                    )}
                    {vendorAuthState.isAuthenticated && vendorAuthState.vendor && (
                      <NavLink
                        to="/dashboard"
                        className="navbar__profile-card-link"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={({ isActive }) => ({
                          color: isActive ? '#f97316' : 'inherit'
                        })}
                      >
                        <FaHome className="navbar__profile-card-icon" /> Vendor Dashboard
                      </NavLink>
                    )}
                    <NavLink
                      to="/user-profile"
                      className="navbar__profile-card-link"
                      style={({ isActive }) => ({
                        color: isActive ? '#f97316' : 'inherit'
                      })}
                    >
                      <FaCog className="navbar__profile-card-icon" /> Settings
                    </NavLink>
                    <button
                      className="navbar__profile-card-link navbar__profile-card-link--logout"
                      onClick={handleFullLogout}
                    >
                      <FaSignOutAlt className="navbar__profile-card-icon" /> Log Out
                    </button>
                  </div>
                )}
              </div>
              {!isLoading && !isAuthenticated && (
                <a
                  href="/vendor-login"
                  className="navbar__account-icon-link"
                  onClick={toggleVendorAuthModal}
                  aria-label="Vendor Login"
                >
                  <FaShoppingBag />
                </a>
              )}
            <span className="navbar__social-link navbar__social-link--nepal">
  <img
    src={nepal}
    alt="Nepal Flag"
    className="navbar__nepal-flag"
  />
</span>
              <button
                className="navbar__hamburger"
                onClick={toggleSideMenu}
                aria-label="Toggle menu"
                aria-expanded={sideMenuOpen}
                ref={hamburgerRef}
              >
                {sideMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>

          <div className="navbar__search-row">
            <div className="navbar__search" ref={searchRef}>
              <form onSubmit={handleSearch} className="navbar__search-form">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleKeyDown}
                  className="navbar__search-input"
                  autoComplete="off"
                />
                <button type="submit" className="navbar__search-button">
                  <FaSearch />
                </button>
              </form>

              {showSearchDropdown && searchResults.length > 0 && (
                <div className="navbar__search-dropdown">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="navbar__search-result"
                      onClick={() => handleSearchResultClick(result.id)}
                    >
                      <img
                        src={result.image}
                        alt={result.name}
                        className="navbar__search-result-image"
                      />
                      <div className="navbar__search-result-info">
                        <h4 className="navbar__search-result-title">
                          {result.name}
                        </h4>
                        <p className="navbar__search-result-price">
                          Rs. {result.price.toFixed(2)}
                          {result.discount > 0 && (
                            <span className="navbar__search-result-discount">
                              {" "}
                              ({result.discount}% off)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="navbar__desktop-links">
            <div className="navbar__links">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `navbar__link${isActive ? " active" : ""}`
                }
                end
                style={({ isActive }) => ({
                  color: isActive ? '#f97316' : 'inherit'
                })}
              >
                Home
              </NavLink>
              <NavLink
                to="/shop"
                className={({ isActive }) =>
                  `navbar__link${isActive ? " active" : ""}`
                }
                style={({ isActive }) => ({
                  color: isActive ? '#f97316' : 'inherit'
                })}
              >
                Shop
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `navbar__link${isActive ? " active" : ""}`
                }
                style={({ isActive }) => ({
                  color: isActive ? '#f97316' : 'inherit'
                })}
              >
                About Us
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `navbar__link${isActive ? " active" : ""}`
                }
                style={({ isActive }) => ({
                  color: isActive ? '#f97316' : 'inherit'
                })}
              >
                Contact <span className="navbar__link-icon"></span>
              </NavLink>
                
              <div className="navbar__more-dropdown" ref={moreDropdownRef}>
                <button
                  className="navbar__link navbar__more-trigger"
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#42504b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  More <FaChevronDown size={12} />
                </button>
                {moreDropdownOpen && (
                  <div className="navbar__more-dropdown-content">
                    <button
                      className="navbar__more-dropdown-link"
                      onClick={showComingSoon}
                    >
                      DajuVai Rental
                    </button>
                    <button
                      className="navbar__more-dropdown-link"
                      onClick={showComingSoon}
                    >
                      DajuVai Services
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="navbar__account">
              <a
                href="/cart"
                className="navbar__account-link"
                onClick={toggleCart}
                ref={cartButtonRef}
              >
                
                <FaShoppingCart className="navbar__account-icon" />
                {cartItems.length > 0 && (
                  <span className="navbar__cart-count">{cartItems.length}</span>
                )}
              </a>
              <div className="navbar__user-profile" ref={dropdownTriggerRef}>
                <div
                  className="navbar__user-avatar"
                  tabIndex={0}
                  onClick={
                    isAuthenticated
                      ? () => setProfileDropdownOpen((v) => !v)
                      : toggleAuthModal
                  }
                  onKeyDown={(e) => {
                    if (isAuthenticated && (e.key === "Enter" || e.key === " "))
                      setProfileDropdownOpen((v) => !v);
                    if (
                      !isAuthenticated &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      toggleAuthModal({
                        preventDefault: () => { },
                        stopPropagation: () => { },
                      } as unknown as React.MouseEvent);
                    }
                  }}
                  aria-haspopup="true"
                  aria-expanded={profileDropdownOpen}
                  role="button"
                  aria-label="Profile"
                >
                  {getUserAvatar()}
                </div>
                {isAuthenticated && profileDropdownOpen && (
                  <div
                    className="navbar__profile-dropdown-card"
                    ref={profileRef}
                  >
                    <div className="navbar__profile-card-header">
                      {getUserAvatar()}
                      <div className="navbar__profile-card-info">
                        <div className="navbar__profile-card-name">
                          {user?.username || user?.email}
                        </div>
                        {user?.email && (
                          <div className="navbar__profile-card-email">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="navbar__profile-card-divider" />
                    {user?.role === 'admin' && (
                      <NavLink
                        to="/admin-dashboard"
                        className="navbar__profile-card-link"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={({ isActive }) => ({
                          color: isActive ? '#f97316' : 'inherit'
                        })}
                      >
                        <FaHome className="navbar__profile-card-icon" /> Admin Dashboard
                      </NavLink>
                    )}
                    {vendorAuthState.isAuthenticated && vendorAuthState.vendor && (
                      <NavLink
                        to="/dashboard"
                        className="navbar__profile-card-link"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={({ isActive }) => ({
                          color: isActive ? '#f97316' : 'inherit'
                        })}
                      >
                        <FaHome className="navbar__profile-card-icon" /> Vendor Dashboard
                      </NavLink>
                    )}
                    <NavLink
                      to="/user-profile"
                      className="navbar__profile-card-link"
                      style={({ isActive }) => ({
                        color: isActive ? '#f97316' : 'inherit'
                      })}
                    >
                      <FaCog className="navbar__profile-card-icon" /> Settings
                    </NavLink>
                    <button
                      className="navbar__profile-card-link navbar__profile-card-link--logout"
                      onClick={handleFullLogout}
                    >
                      <FaSignOutAlt className="navbar__profile-card-icon" /> Log Out
                    </button>
                  </div>
                )}
              </div>
              {!isLoading && !isAuthenticated && (
                <a
                  href="/vendor-login"
                  className="navbar__account-link"
                  onClick={toggleVendorAuthModal}
                  aria-label="Vendor Login"
                >
                  <span className="navbar__account-text">Vendor Login</span>
                </a>
              )}
               
              <NavLink
                to="/wishlist"
                className="navbar__account-icon-link"
                style={({ isActive }) => ({
                  color: isActive ? '#f97316' : 'inherit'
                })}
              >
                <FaHeart />
              </NavLink>
            </div>
          </div>

        <div className="nepal-flag">
  <span className="navbar__social-link navbar__social-link--nepal">
    <img
      src={nepal}
      alt="Nepal Flag"
      className="navbar__nepal-flag"
    />
  </span>
</div>
        </div>

        <div
          className={`navbar__side-menu ${sideMenuOpen ? "navbar__side-menu--open" : ""}`}
          ref={sideMenuRef}
        >
          <div className="navbar__side-menu-header">
            <button
              className="navbar__side-menu-close"
              onClick={toggleSideMenu}
              aria-label="Close menu"
            >
              <FaTimes />
            </button>
            <h3 className="navbar__side-menu-title">Menu</h3>
          </div>

          <div className="navbar__side-menu-links">
            <NavLink
              to="/"
              className="navbar__side-menu-link"
              end
              style={({ isActive }) => ({
                color: isActive ? '#f97316' : 'inherit'
              })}
            >
              Home
            </NavLink>
            <NavLink
              to="/shop"
              className="navbar__side-menu-link"
              style={({ isActive }) => ({
                color: isActive ? '#f97316' : 'inherit'
              })}
            >
              Shop
            </NavLink>
            <NavLink
              to="/about"
              className="navbar__side-menu-link"
              style={({ isActive }) => ({
                color: isActive ? '#f97316' : 'inherit'
              })}
            >
              About Us
            </NavLink>
              <NavLink
                  to="/contact"
                  className="navbar__side-menu-link"
                  style={({ isActive }) => ({
                    color: isActive ? '#f97316' : 'inherit'
                  })}
                >
                  Contact Us
                </NavLink>
            <button
              className="navbar__side-menu-link"
              onClick={showComingSoon}
              style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }}
            >
              DajuVai Rental
            </button>
            <button
              className="navbar__side-menu-link"
              onClick={showComingSoon}
              style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }}
            >
              DajuVai Services
            </button>
            {!isLoading && isAuthenticated && user?.role === 'admin' && (
              <NavLink
                to="/admin-dashboard"
                className="navbar__side-menu-link"
                style={({ isActive }) => ({
                  color: isActive ? '#f97316' : 'inherit'
                })}
              >
                Admin Dashboard
              </NavLink>
            )}
            {!isLoading && vendorAuthState.isAuthenticated && vendorAuthState.vendor && (
              <NavLink
                to="/dashboard"
                className="navbar__side-menu-link"
                style={({ isActive }) => ({
                  color: isActive ? '#f97316' : 'inherit'
                })}
              >
                Vendor Dashboard
              </NavLink>
            )}
            {!isLoading && isAuthenticated ? (
              <>
                <NavLink
                  to="/user-profile"
                  className="navbar__side-menu-link"
                  style={({ isActive }) => ({
                    color: isActive ? '#f97316' : 'inherit'
                  })}
                >
                  My Profile
                </NavLink>
                <NavLink
                  to="/wishlist"
                  className="navbar__side-menu-link"
                  style={({ isActive }) => ({
                    color: isActive ? '#f97316' : 'inherit'
                  })}
                >
                  Wishlist
                </NavLink>
               <NavLink
                  to="/faq"
                  className="navbar__side-menu-link"
                  style={({ isActive }) => ({
                    color: isActive ? '#f97316' : 'inherit'
                  })}
                >
                  FAQ
                </NavLink>
                 
                <a
                  href="/logout"
                  className="navbar__side-menu-link"
                  onClick={async (e) => {
                    e.preventDefault();
                    await handleFullLogout();
                    setAuthModalOpen(false);
                  }}
                >
                  Logout
                </a>
              </>
            ) : (
              <a
                href="/login"
                className="navbar__side-menu-link"
                onClick={toggleAuthModal}
              >
                Login
              </a>
            )}
         
          </div>

          {renderSideMenuCategories()}

          <div className="navbar__side-menu-social">
          
            <h3 className="navbar__side-menu-subtitle">Follow Us</h3>
            <div className="navbar__side-menu-social-icons">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                className="navbar__social-link navbar__social-link--facebook"
              >
                <FaFacebook />
              </a>
              <a
                href="https://www.instagram.com/dajuvai_/"
                target="_blank"
                className="navbar__social-link navbar__social-link--instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.tiktok.com/@www.dajuvai.com"
                target="_blank"
                className="navbar__social-link navbar__social-link--tiktok"
              >
                <FaTiktok />
              </a>
              <a
                href="https://wa.me/9779700620004"
                target="_blank"
                rel="noopener noreferrer"
                className="navbar__social-link navbar__social-link--whatsapp"
              >
                <FaWhatsapp />
              </a>
            </div>
          </div>
        </div>
        <div
          className={`navbar__side-cart ${cartOpen ? "navbar__side-cart--open" : ""
            }`}
          ref={sideCartRef}
        >
          <div className="navbar__side-cart-header">
            <button
              className="navbar__side-cart-close"
              onClick={toggleCart}
              aria-label="Close cart"
            >
              <FaTimes />
            </button>
            <h3 className="navbar__side-cart-title">Your Cart</h3>
          </div>

          <div className="navbar__side-cart-content">
            {cartItems.length === 0 ? (
              <>
                <p className="navbar__side-cart-empty">Your cart is empty</p>
                <Link to="/shop" className="navbar__side-cart-button">
                  Shop Now
                </Link>
              </>
            ) : (
              <>
                <div className="navbar__cart-items">
                  {stableCartItems.map((item) => (
                    <div key={item.id} className="navbar__cart-item">
                      <div className="navbar__cart-item-image">
                        <img
                          src={item.image || iphone}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.src = iphone;
                          }}
                        />
                      </div>
                      <div className="navbar__cart-item-details">
                        <h4 className="navbar__cart-item-name">{item.name}</h4>
                        {(() => {
                          const label = getCartVariantLabel(item);
                          return label ? (
                            <small style={{ display: 'block', color: '#666', marginTop: 4 }}>Variant: {label}</small>
                          ) : null;
                        })()}
                        <div className="navbar__cart-item-price-qty">
                          <span className="navbar__cart-item-price">
                            Rs. {item.price.toLocaleString("en-IN")}
                          </span>
                          <div className="navbar__cart-item-quantity" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              className="navbar__qty-btn navbar__qty-btn--dec"
                              onClick={() => handleDecreaseQuantity(item.id, 1)}
                              disabled={!!updatingItems?.has?.(item.id)}
                              style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid #ddd' }}
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              className="navbar__qty-btn navbar__qty-btn--inc"
                              onClick={() => handleIncreaseQuantity(item.id, 1)}
                              disabled={!!updatingItems?.has?.(item.id)}
                              style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid #ddd' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        className="navbar__cart-item-remove"
                        onClick={() => {
                          handleCartItemOnDelete(item);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="navbar__cart-subtotal">
                  <span>Subtotal:</span>
                  <span>
                    Rs.{" "}
                    {cartItems
                      .reduce(
                        (total, item) => total + item.price * item.quantity,
                        0
                      )
                      .toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="navbar__cart-buttons">
                  <Link
                    to="/checkout"
                    className="navbar__cart-button navbar__cart-button--checkout"
                  >
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className={`navbar__overlay ${sideMenuOpen || cartOpen ? "navbar__overlay--visible" : ""
            }`}
          onClick={() => {
            setSideMenuOpen(false);
            setCartOpen(false);
            document.body.classList.remove("navbar--menu-open");
          }}
        ></div>

        <div className="navbar__bottom">
          <div className="navbar__categories">
            {categories.map((category: any) => (
              <div
                key={category.id}
                className={`navbar__category${activeDropdown === category.id ? " active" : ""}`}
                onMouseEnter={() => setActiveDropdown(category.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="navbar__category-link">
                  {category.name}
                  <FaChevronDown
                    size={16}
                    className={`navbar__category-icon ${activeDropdown === category.id
                      ? "navbar__category-icon--active"
                      : ""
                      }`}
                  />
                </div>
                {activeDropdown === category.id &&
                  renderCategoryDropdown(category)}
              </div>
            ))}
          </div>

          <div className="navbar__social navbar__social--desktop">
           
            <a
              href="https://www.facebook.com/"
              target="_blank"
              className="navbar__social-link navbar__social-link--facebook"
            >
              <FaFacebook />
            </a>
            <a
              href="https://www.instagram.com/dajuvai_/"
              target="_blank"
              className="navbar__social-link navbar__social-link--instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://www.tiktok.com/@www.dajuvai.com"
              target="_blank"
              className="navbar__social-link navbar__social-link--tiktok"
            >
              <FaTiktok />
            </a>
            <a
              href="https://wa.me/9779700620004"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar__social-link navbar__social-link--whatsapp"
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>

      <div className="navbar__mobile-dock">
        <NavLink
          to="/"
          className="navbar__mobile-dock-item"
          end
          style={({ isActive }) => ({
            color: isActive ? '#f97316' : 'inherit'
          })}
        >
          <span className="navbar__mobile-dock-icon">
            <FaHome />
          </span>
          <span className="navbar__mobile-dock-text">Home</span>
        </NavLink>
        <NavLink
          to="/shop"
          className="navbar__mobile-dock-item"
          style={({ isActive }) => ({
            color: isActive ? '#f97316' : 'inherit'
          })}
        >
          <span className="navbar__mobile-dock-icon">
            <FaShoppingBag />
          </span>
          <span className="navbar__mobile-dock-text">Shop</span>
        </NavLink>
        <NavLink
          to="/contact"
          className="navbar__mobile-dock-item"
          style={({ isActive }) => ({
            color: isActive ? '#f97316' : 'inherit'
          })}
        >
          <span className="navbar__mobile-dock-icon">
            <FaInfoCircle />
          </span>
          <span className="navbar__mobile-dock-text">Contact</span>
        </NavLink>
        <NavLink
          to="/wishlist"
          className="navbar__mobile-dock-item"
          style={({ isActive }) => ({
            color: isActive ? '#f97316' : 'inherit'
          })}
        >
          <span className="navbar__mobile-dock-icon">
            <FaHeart />
          </span>
          <span className="navbar__mobile-dock-text">Wishlist</span>
        </NavLink>
      </div>

      {/* Coming Soon Popup */}
      {showComingSoonPopup && (
        <div className="navbar__coming-soon-popup">
          <div className="navbar__coming-soon-content">
            <h3>🚀 Coming Soon!</h3>
            <p>This feature is under development and will be available soon.</p>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
      <VendorAuthModal
        isOpen={vendorAuthModalOpen}
        onClose={() => setVendorAuthModalOpen(false)}
        forceLoginMode={true} 
      />
    </nav>
  );
};

export default Navbar;