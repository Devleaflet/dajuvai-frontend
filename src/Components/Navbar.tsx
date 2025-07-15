import React, { useState, useEffect, useRef } from "react";
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
  FaYoutube,
  FaWhatsapp,
  FaViber,
  FaTelegram,
} from "react-icons/fa6";
import logo from "../assets/logo.webp";
import nepal from "../assets/nepal.gif";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";
import { useCart } from "../context/CartContext";
import { fetchCategory } from "../api/category";
import { useCategory } from "../context/Category";
import iphone from "../assets/iphone.jpg"; // Import fallback image
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { fetchSubCategory } from "../api/subcategory";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../config";

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
  const { user, isAuthenticated, isLoading, logout, fetchUserData } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [sideMenuOpen, setSideMenuOpen] = useState<boolean>(false);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] =
    useState<boolean>(false);
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

  const {
    cartItems,
    handleCartItemOnDelete,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
  } = useCart();
  const categoryContext = useCategory();
  const updateCategoriesWithSubcategories =
    categoryContext?.updateCategoriesWithSubcategories;
  const categories = categoryContext?.categories || [];

  // Fetch user data if authenticated but username is missing
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

  // Close dropdown on outside click
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
    }
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileDropdownOpen(false);
    }
    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [profileDropdownOpen]);

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

  // Fetch categories with React Query
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update categories with subcategories when data is loaded
  useEffect(() => {
    if (categoriesData && updateCategoriesWithSubcategories) {
      updateCategoriesWithSubcategories(categoriesData).then(() => {
        setIsCategoriesReady(true);
      });
    }
  }, [categoriesData, updateCategoriesWithSubcategories]);

  // Show loading state if either fetching or processing categories
  const showLoading = isCategoriesLoading || !isCategoriesReady;

  // Prefetch categories on component mount
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

  // Fetch all products for search
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Listen for search parameter from Home page (e.g., from banner clicks)
  useEffect(() => {
    const handleSetNavbarSearch = (event: CustomEvent) => {
      const { searchQuery } = event.detail;
      console.log("🔍 Navbar received search query:", searchQuery);
      setSearchQuery(searchQuery);

      // Trigger search if there are products available
      if (searchQuery && allProducts.length > 0) {
        // Use setTimeout to ensure state is updated before searching
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
  }, [allProducts]); // Re-run when allProducts changes

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim() || !allProducts.length) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    try {
      const searchTerm = searchQuery.toLowerCase().trim();

      // Filter and sort products
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

    // Exact name match gets highest score
    if (name === searchTerm) score += 100;
    // Name starts with search term
    else if (name.startsWith(searchTerm)) score += 50;
    // Name contains search term
    else if (name.includes(searchTerm)) score += 30;
    // Description contains search term
    if (description.includes(searchTerm)) score += 10;

    return score;
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

  // Add keyboard navigation for search results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowSearchDropdown(false);
    }
  };

  // Update the handleSubcategoryClick function
  const handleSubcategoryClick = (
    categoryId: number,
    subcategoryId: number
  ) => {
    // Close any open menus
    setSideMenuOpen(false);
    setActiveDropdown(null);

    // Check if we're already on the shop page
    const isOnShopPage = window.location.pathname === "/shop";

    if (isOnShopPage) {
      // If on shop page, update the URL without navigation
      const newUrl = `/shop?categoryId=${categoryId}&subcategoryId=${subcategoryId}`;
      window.history.pushState({}, "", newUrl);

      // Dispatch a custom event to notify Shop component
      window.dispatchEvent(
        new CustomEvent("shopFiltersChanged", {
          detail: { categoryId, subcategoryId },
        })
      );
    } else {
      // If on other pages, navigate to shop page
      navigate(`/shop?categoryId=${categoryId}&subcategoryId=${subcategoryId}`);
    }
  };

  // Update the dropdown rendering to use the fetched subcategories
  const renderCategoryDropdown = (category: any) => {
    // Only show subcategories for the activeDropdown category
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
                    className={`navbar__side-menu-category-icon ${
                      selectedCategory === category.id
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
    // Check for categoryId in query params and set activeDropdown
    const params = new URLSearchParams(location.search);
    const categoryId = params.get("categoryId");
    if (categoryId) {
      setActiveDropdown(Number(categoryId));
    }
  }, [location.search]);

  useEffect(() => {
    // Fetch subcategories for the activeDropdown category
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

  // Full logout: clear all storage, cookies, and context, then redirect
  const handleFullLogout = async () => {
    // Clear all localStorage/sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    // Attempt to clear all cookies (best effort, not HttpOnly)
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    // Call context logout to clear state
    logout();
    // Redirect to home
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* Top navbar with logo, search, and account links */}
        <div className="navbar__top">
          <div className="navbar__top-row">
            <div className="navbar__logo">
              <Link to="/">
                <img src={logo} alt="DajuVai" className="navbar__logo-img" />
              </Link>
            </div>

            <div className="navbar__mobile-actions">
              <Link to="/wishlist" className="navbar__account-icon-link">
                <FaHeart />
              </Link>
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
                        preventDefault: () => {},
                        stopPropagation: () => {},
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
                    <Link
                      to="/user-profile"
                      className="navbar__profile-card-link"
                    >
                      <FaCog className="navbar__profile-card-icon" /> Settings
                    </Link>
                    <button
                      className="navbar__profile-card-link navbar__profile-card-link--logout"
                      onClick={handleFullLogout}
                    >
                      <FaSignOutAlt className="navbar__profile-card-icon" /> Log
                      Out
                    </button>
                  </div>
                )}
              </div>
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
              <Link to="/" className="navbar__link">
                Home
              </Link>
              <Link to="/shop" className="navbar__link">
                Shop
              </Link>
              <Link to="/contact" className="navbar__link">
                Support <span className="navbar__link-icon">🎧</span>
              </Link>
            </div>

            <div className="navbar__account">
              <a
                href="/cart"
                className="navbar__account-link"
                onClick={toggleCart}
                ref={cartButtonRef}
              >
                <span className="navbar__account-text">
                  My Cart | Rs.
                  {cartItems
                    .reduce(
                      (total, item) => total + item.price * item.quantity,
                      0
                    )
                    .toLocaleString("en-IN")}
                </span>
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
                        preventDefault: () => {},
                        stopPropagation: () => {},
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
                    <Link
                      to="/user-profile"
                      className="navbar__profile-card-link"
                    >
                      <FaCog className="navbar__profile-card-icon" /> Settings
                    </Link>
                    <button
                      className="navbar__profile-card-link navbar__profile-card-link--logout"
                      onClick={handleFullLogout}
                    >
                      <FaSignOutAlt className="navbar__profile-card-icon" /> Log
                      Out
                    </button>
                  </div>
                )}
              </div>
              <Link to="/wishlist" className="navbar__account-icon-link">
                <FaHeart />
              </Link>
            </div>
          </div>
        </div>

        {/* Side menu */}
        <div
          className={`navbar__side-menu ${
            sideMenuOpen ? "navbar__side-menu--open" : ""
          }`}
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
            <Link to="/" className="navbar__side-menu-link">
              Home
            </Link>
            <Link to="/shop" className="navbar__side-menu-link">
              Shop
            </Link>

            {!isLoading && isAuthenticated ? (
              <>
                <Link to="/user-profile" className="navbar__side-menu-link">
                  My Account
                </Link>
                <Link to="/wishlist" className="navbar__side-menu-link">
                  Wishlist
                </Link>
                <Link to="/orders" className="navbar__side-menu-link">
                  My Orders
                </Link>
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
                href="/facebook"
                className="navbar__social-link navbar__social-link--facebook"
              >
                <FaFacebook />
              </a>
              <a
                href="/instagram"
                className="navbar__social-link navbar__social-link--instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="/tiktok"
                className="navbar__social-link navbar__social-link--tiktok"
              >
                <FaTiktok />
              </a>
              <a
                href="/youtube"
                className="navbar__social-link navbar__social-link--youtube"
              >
                <FaYoutube />
              </a>
              <a
                href="/whatsapp"
                className="navbar__social-link navbar__social-link--whatsapp"
              >
                <FaWhatsapp />
              </a>
              <a
                href="/viber"
                className="navbar__social-link navbar__social-link--viber"
              >
                <FaViber />
              </a>
              <a
                href="/telegram"
                className="navbar__social-link navbar__social-link--telegram"
              >
                <FaTelegram />
              </a>
            </div>
          </div>
        </div>

        {/* Side cart */}
        <div
          className={`navbar__side-cart ${
            cartOpen ? "navbar__side-cart--open" : ""
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
                  {cartItems.map((item) => (
                    <div key={item.id} className="navbar__cart-item">
                      <div className="navbar__cart-item-image">
                        <img
                          src={item.image || iphone}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.src = iphone; // Fallback on error
                          }}
                        />
                      </div>
                      <div className="navbar__cart-item-details">
                        <h4 className="navbar__cart-item-name">{item.name}</h4>
                        <div className="navbar__cart-item-price-qty">
                          <span className="navbar__cart-item-price">
                            Rs. {item.price.toLocaleString("en-IN")}
                          </span>
                          <div className="navbar__cart-item-quantity">
                            <span>{item.quantity}</span>
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

        {/* Overlay */}
        <div
          className={`navbar__overlay ${
            sideMenuOpen || cartOpen ? "navbar__overlay--visible" : ""
          }`}
          onClick={() => {
            setSideMenuOpen(false);
            setCartOpen(false);
            document.body.classList.remove("navbar--menu-open");
          }}
        ></div>

        {/* Bottom navbar with categories and social media */}
        <div className="navbar__bottom">
          <div className="navbar__categories">
            {categories.map((category: any) => (
              <div
                key={category.id}
                className={`navbar__category${
                  activeDropdown === category.id ? " active" : ""
                }`}
                onMouseEnter={() => setActiveDropdown(category.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="navbar__category-link">
                  {category.name}
                  <FaChevronDown
                    size={16}
                    className={`navbar__category-icon ${
                      activeDropdown === category.id
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
              href="/facebook"
              className="navbar__social-link navbar__social-link--facebook"
            >
              <FaFacebook />
            </a>
            <a
              href="/instagram"
              className="navbar__social-link navbar__social-link--instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="/tiktok"
              className="navbar__social-link navbar__social-link--tiktok"
            >
              <FaTiktok />
            </a>
            <a
              href="/youtube"
              className="navbar__social-link navbar__social-link--youtube"
            >
              <FaYoutube />
            </a>
            <a
              href="/whatsapp"
              className="navbar__social-link navbar__social-link--whatsapp"
            >
              <FaWhatsapp />
            </a>
            <a
              href="/viber"
              className="navbar__social-link navbar__social-link--viber"
            >
              <FaViber />
            </a>
            <a
              href="/telegram"
              className="navbar__social-link navbar__social-link--telegram"
            >
              <FaTelegram />
            </a>
            <a
              href="/nepal"
              className="navbar__social-link navbar__social-link--nepal"
            >
              <img
                src={nepal}
                alt="Nepal Flag"
                className="navbar__nepal-flag"
              />
            </a>
          </div>
        </div>
      </div>

      <div className="navbar__mobile-dock">
        <Link to="/" className="navbar__mobile-dock-item">
          <span className="navbar__mobile-dock-icon">
            <FaHome />
          </span>
          <span className="navbar__mobile-dock-text">Home</span>
        </Link>
        <Link to="/shop" className="navbar__mobile-dock-item">
          <span className="navbar__mobile-dock-icon">
            <FaShoppingBag />
          </span>
          <span className="navbar__mobile-dock-text">Shop</span>
        </Link>
        <Link to="/contact" className="navbar__mobile-dock-item">
          <span className="navbar__mobile-dock-icon">
            <FaInfoCircle />
          </span>
          <span className="navbar__mobile-dock-text">Contact</span>
        </Link>
        <Link to="/wishlist" className="navbar__mobile-dock-item">
          <span className="navbar__mobile-dock-icon">
            <FaHeart />
          </span>
          <span className="navbar__mobile-dock-text">Wishlist</span>
        </Link>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
